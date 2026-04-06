import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: business } = await supabase
      .from('businesses')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!business) return NextResponse.json([]);

    const { data: journalEntries, error } = await supabase
      .from('journal_entries')
      .select(`
        *,
        journal_entry_lines (
          *,
          accounts ( name, type )
        )
      `)
      .eq('business_id', business.id)
      .order('date', { ascending: false });
      
    if (error) throw error;
    
    return NextResponse.json(journalEntries);
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message || 'Failed to fetch transactions' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { 
      type, 
      amount, 
      merchant, 
      date, 
      category, 
      receipt_url, 
      notes, 
      account_id, // The specific account selected (e.g., 'Travel Expense')
      payment_mode // 'cash' | 'credit' | 'loan'
    } = body;
    
    // 1. Basic validation
    if (!amount || !merchant || !date) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 2. Get business
    const { data: business } = await supabase
      .from('businesses')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 });

    // 3. Find appropriate offset account
    let offsetAccountName = 'Cash';
    if (payment_mode === 'credit') offsetAccountName = 'Accounts Payable';
    if (payment_mode === 'loan') offsetAccountName = 'Loan Payable';
    if (payment_mode === 'receivable') offsetAccountName = 'Accounts Receivable';

    let { data: offsetAccount } = await supabase
      .from('accounts')
      .select('id')
      .eq('business_id', business.id)
      .eq('name', offsetAccountName)
      .single();

    if (!offsetAccount) {
      // Auto-initialize missing default accounts for legacy businesses
      const defaultMapping: Record<string, { type: string, category: string }> = {
        'Cash': { type: 'Asset', category: 'Current Asset' },
        'Accounts Payable': { type: 'Liability', category: 'Current Liability' },
        'Loan Payable': { type: 'Liability', category: 'Long Term Liability' },
        'Accounts Receivable': { type: 'Asset', category: 'Current Asset' },
        'Inventory': { type: 'Asset', category: 'Current Asset' },
        'Retained Earnings': { type: 'Equity', category: 'Equity' }
      };

      if (defaultMapping[offsetAccountName]) {
        const { data: newAcc, error: createError } = await supabase
          .from('accounts')
          .insert({
            business_id: business.id,
            name: offsetAccountName,
            type: defaultMapping[offsetAccountName].type,
            category: defaultMapping[offsetAccountName].category,
            is_default: true
          })
          .select('id')
          .single();
        
        if (createError) {
           return NextResponse.json({ 
             error: `Failed to auto-initialize default '${offsetAccountName}' account: ${createError.message}` 
           }, { status: 500 });
        }
        offsetAccount = newAcc;
      } else {
        return NextResponse.json({ 
          error: `Default '${offsetAccountName}' account not found. Please initialize business.` 
        }, { status: 400 });
      }
    }

    // 4. Create Journal Entry
    const { data: journalEntry, error: jError } = await supabase
      .from('journal_entries')
      .insert({
        business_id: business.id,
        description: `${merchant}${category ? ` (${category})` : ''}`,
        date,
        receipt_url
      })
      .select()
      .single();

    if (jError) throw jError;

    // 5. Create Journal Entry Lines (Double Entry)
    const numAmount = parseFloat(amount);
    const lines = [];

    if (type === 'income') {
      if (payment_mode === 'loan') {
        // Loan Receipt: Dr Cash (Assets) and Cr Loan Payable (Liabilities)
        // Find Cash account for debit
        const { data: cashAcc } = await supabase
          .from('accounts')
          .select('id')
          .eq('business_id', business.id)
          .eq('name', 'Cash')
          .single();
          
        lines.push({
          journal_entry_id: journalEntry.id,
          account_id: cashAcc!.id,
          debit: numAmount,
          credit: 0
        });
        lines.push({
          journal_entry_id: journalEntry.id,
          account_id: account_id || offsetAccount.id, // Selected liability (for loan) or Revenue (for standard)
          debit: 0,
          credit: numAmount
        });
      } else if (payment_mode === 'receivable') {
        // AR Receipt: Dr Accounts Receivable (Assets) and Cr Revenue (Income)
        lines.push({
          journal_entry_id: journalEntry.id,
          account_id: offsetAccount.id, // Accounts Receivable
          debit: numAmount,
          credit: 0
        });
        lines.push({
          journal_entry_id: journalEntry.id,
          account_id: account_id || null, 
          debit: 0,
          credit: numAmount
        });
      } else {
        // Standard Income: Dr Cash (Asset) and Cr Revenue (Income)
        lines.push({
          journal_entry_id: journalEntry.id,
          account_id: offsetAccount.id, // Typically Cash
          debit: numAmount,
          credit: 0
        });
        lines.push({
          journal_entry_id: journalEntry.id,
          account_id: account_id || null, 
          debit: 0,
          credit: numAmount
        });
      }
    } else {
      // Expense increases Expense (Debit) and decreases Asset/Increases Liability (Credit)
      lines.push({
        journal_entry_id: journalEntry.id,
        account_id: account_id || null, // The specific expense account
        debit: numAmount,
        credit: 0
      });
      lines.push({
        journal_entry_id: journalEntry.id,
        account_id: offsetAccount.id, // Cash or Accounts Payable
        debit: 0,
        credit: numAmount
      });
    }

    const { error: lError } = await supabase
      .from('journal_entry_lines')
      .insert(lines);

    if (lError) {
      // Cleanup the entry if lines fail
      await supabase.from('journal_entries').delete().eq('id', journalEntry.id);
      throw lError;
    }

    return NextResponse.json(journalEntry, { status: 201 });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message || 'Failed to create transaction' }, { status: 500 });
  }
}
