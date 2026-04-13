import { createClient } from '@/utils/supabase/server';
import TransactionList from '@/components/transactions/TransactionList';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function TransactionsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!business) redirect('/setup');

  // We want to show "Transactions" which are Journal Entries with their primary mapping line.
  // In a double-entry system, one Journal Entry has multiple lines. 
  // We'll fetch entries and flatten them or show the main line.
  
  const { data: entries, error } = await supabase
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

  if (error) console.error('Error fetching journal entries:', error);

  // Transform data to match the TransactionList UI expectations
  const transactions = (entries || []).map((entry: any) => {
    // Find the primary line (if it's an expense, usually the non-Cash line is what users identify with)
    // For simplicity, let's pick the line that is NOT the 'Cash' account for expenses, 
    // or the 'Cash' line for income (or vice versa depending on perspective).
    // Actually, let's just pick the line that is NOT 'Cash' if possible.
    const nonCashLine = entry.journal_entry_lines?.find((l: any) => l.accounts?.name !== 'Cash') || entry.journal_entry_lines?.[0];
    
    // An inflow is anything that touches an 'Income' account OR is a DEBIT to a Cash account
    const isIncome = entry.journal_entry_lines?.some((l: any) => 
      l.accounts?.type === 'Income' || 
      (l.accounts?.name === 'Cash' && Number(l.debit) > 0)
    );

    return {
      id: entry.id,
      type: isIncome ? 'income' : 'expense',
      amount: nonCashLine ? (Number(nonCashLine.debit) || Number(nonCashLine.credit)) : 0,
      merchant: entry.description,
      date: entry.date,
      category: nonCashLine?.accounts?.name || 'Standard',
      notes: entry.notes || null,
      receipt_url: entry.receipt_url
    };
  });

  return (
    <div className="space-y-8 py-4">
      <div>
        <h1 className="text-4xl font-black tracking-tight text-[var(--foreground)]">Transaction History</h1>
        <p className="text-[var(--color-brand-gray)] font-medium mt-1 uppercase text-[10px] tracking-widest">Double-Entry Journal Records</p>
      </div>

      <TransactionList transactions={transactions as any} />
    </div>
  );
}
