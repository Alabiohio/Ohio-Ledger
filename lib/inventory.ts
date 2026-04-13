import { createClient } from '@/utils/supabase/server';

/**
 * Calculates the Cost of Goods Sold (COGS) using the FIFO method.
 * It consumes available batches ordered by received date.
 */
export async function calculateFIFOCogs(itemId: string, quantityToSell: number, businessId: string) {
  const supabase = await createClient();

  // 1. Fetch batches with remaining quantity
  const { data: batches, error } = await supabase
    .from('inventory_batches')
    .select('*')
    .eq('item_id', itemId)
    .gt('quantity_remaining', 0)
    .order('received_date', { ascending: true })
    .order('created_at', { ascending: true }); // tie breaker

  if (error) {
    throw new Error(`Failed to fetch inventory batches: ${error.message}`);
  }

  let remainingToSell = quantityToSell;
  let totalCogs = 0;
  const batchUpdates: { id: string; quantity_remaining: number }[] = [];

  // 2. Iterate and consume batches
  for (const batch of batches) {
    if (remainingToSell <= 0) break;

    const quantityToConsume = Math.min(batch.quantity_remaining, remainingToSell);
    
    totalCogs += quantityToConsume * Number(batch.unit_cost);
    remainingToSell -= quantityToConsume;

    batchUpdates.push({
      id: batch.id,
      quantity_remaining: batch.quantity_remaining - quantityToConsume
    });
  }

  if (remainingToSell > 0) {
    throw new Error(`Not enough stock. Requested to sell ${quantityToSell}, but only ${quantityToSell - remainingToSell} available across batches.`);
  }

  return { totalCogs, batchUpdates };
}

/**
 * Helper to execute batch updates within a transaction.
 * Since Supabase JS doesn't support generic multi-statement transactions natively through RPC easily without a custom function, 
 * we use individual updates. For production, a PL/pgSQL function is recommended.
 */
export async function applyBatchUpdates(batchUpdates: { id: string; quantity_remaining: number }[]) {
  const supabase = await createClient();
  
  // Note: if this fails mid-way it can cause inconsistencies. 
  for (const update of batchUpdates) {
    const { error } = await supabase
      .from('inventory_batches')
      .update({ quantity_remaining: update.quantity_remaining })
      .eq('id', update.id);
      
    if (error) throw new Error(`Failed to update batch ${update.id}: ${error.message}`);
  }
}
