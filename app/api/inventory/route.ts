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

    if (!business) return NextResponse.json({ items: [], valuation: 0 });

    const { data: inventory, error } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('business_id', business.id)
      .order('name');
      
    if (error) {
      if (error.code === '42P01') {
        return NextResponse.json({ items: [], valuation: 0, needsMigration: true });
      }
      throw error;
    }

    // Calculate valuation based on remaining batches
    const { data: batches } = await supabase
      .from('inventory_batches')
      .select('item_id, quantity_remaining, unit_cost')
      .in('item_id', inventory.map((i: any) => i.id))
      .gt('quantity_remaining', 0);

    let totalValuation = 0;
    if (batches) {
      for (const batch of batches) {
        totalValuation += batch.quantity_remaining * Number(batch.unit_cost);
      }
    }

    return NextResponse.json({ items: inventory, valuation: totalValuation });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message || 'Failed to fetch inventory' }, { status: 500 });
  }
}
