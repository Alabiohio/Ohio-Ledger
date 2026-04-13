import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { calculateFIFOCogs, applyBatchUpdates } from '@/lib/inventory';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { 
      type, // 'inventory_purchase' | 'inventory_sale'
      item_id, // Specific inventory item
      quantity,
      unit_price, // Cost to buy, or price sold at
      date,
      payment_mode, // 'cash' | 'credit'
      merchant,
      receipt_url
    } = body;

    if (!type || !item_id || !quantity || !unit_price || !date) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data: business } = await supabase
      .from('businesses')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 });

    // Find necessary accounts
    let offsetAccountName = payment_mode === 'credit' ? 'Accounts Payable' : 'Cash';
    if (type === 'inventory_sale') {
      offsetAccountName = payment_mode === 'receivable' ? 'Accounts Receivable' : 'Cash';
    }

    // Helper to get account by name
    const getAccount = async (name: string) => {
      const { data } = await supabase
        .from('accounts')
        .select('id')
        .eq('business_id', business.id)
        .eq('name', name)
        .single();
      return data;
    };

    const offsetAccount = await getAccount(offsetAccountName);
    const inventoryAccount = await getAccount('Inventory');
    const cogsAccount = await getAccount('Cost of Goods Sold');
    const revenueAccount = await getAccount('Sales Revenue');

    if (!offsetAccount || !inventoryAccount || !cogsAccount || !revenueAccount) {
        return NextResponse.json({ error: 'System accounts missing. Please ensure Inventory, COGS, Cash, and Sales Revenue are set up.' }, { status: 400 });
    }

    const itemQuery = await supabase.from('inventory_items').select('*').eq('id', item_id).single();
    if (itemQuery.error) throw new Error('Item not found');
    const item = itemQuery.data;

    const numQuantity = Number(quantity);
    const numPrice = Number(unit_price);
    const totalAmount = numQuantity * numPrice;

    // Build Description
    const baseDesc = type === 'inventory_purchase' 
       ? `Purchased ${numQuantity} x ${item.name}` 
       : `Sold ${numQuantity} x ${item.name}`;
       
    const finalDesc = merchant ? `${merchant} - ${baseDesc}` : baseDesc;

    // 1. Create Journal Entry
    const { data: journalEntry, error: jError } = await supabase
      .from('journal_entries')
      .insert({
        business_id: business.id,
        description: finalDesc,
        date,
        receipt_url
      })
      .select()
      .single();

    if (jError) throw jError;

    const lines = [];

    if (type === 'inventory_purchase') {
      // Dr Inventory (Asset), Cr Cash/AP (Asset/Liability)
      lines.push({
        journal_entry_id: journalEntry.id,
        account_id: inventoryAccount.id,
        debit: totalAmount,
        credit: 0
      });
      lines.push({
        journal_entry_id: journalEntry.id,
        account_id: offsetAccount.id,
        debit: 0,
        credit: totalAmount
      });

      // Update Stock and create Batch
      await supabase.from('inventory_batches').insert({
        item_id,
        quantity_received: numQuantity,
        quantity_remaining: numQuantity,
        unit_cost: numPrice,
        received_date: date,
        purchase_entry_id: journalEntry.id
      });

      await supabase.from('inventory_items').update({
        current_quantity: item.current_quantity + numQuantity
      }).eq('id', item.id);

    } else if (type === 'inventory_sale') {
      // Calculate FIFO Cost
      const { totalCogs, batchUpdates } = await calculateFIFOCogs(item_id, numQuantity, business.id);

      // Financial recording for Sale
      // 1. Record Revenue: Dr Cash/AR, Cr Sales Revenue
      lines.push({
        journal_entry_id: journalEntry.id,
        account_id: offsetAccount.id,
        debit: totalAmount,
        credit: 0
      });
      lines.push({
        journal_entry_id: journalEntry.id,
        account_id: revenueAccount.id,
        debit: 0,
        credit: totalAmount
      });

      // 2. Record COGS: Dr Cost of Goods Sold, Cr Inventory
      lines.push({
        journal_entry_id: journalEntry.id,
        account_id: cogsAccount.id,
        debit: totalCogs,
        credit: 0
      });
      lines.push({
        journal_entry_id: journalEntry.id,
        account_id: inventoryAccount.id,
        debit: 0,
        credit: totalCogs
      });

      // Apply batch Updates
      await applyBatchUpdates(batchUpdates);
      
      // Update aggregate quantity
      await supabase.from('inventory_items').update({
        current_quantity: item.current_quantity - numQuantity
      }).eq('id', item.id);
    }

    const { error: lError } = await supabase.from('journal_entry_lines').insert(lines);
    if (lError) {
      await supabase.from('journal_entries').delete().eq('id', journalEntry.id);
      throw lError;
    }

    return NextResponse.json({ success: true, journalEntry });

  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message || 'Failed to process inventory transaction' }, { status: 500 });
  }
}
