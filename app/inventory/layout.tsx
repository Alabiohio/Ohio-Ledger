import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export default async function InventoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!business) redirect('/setup');

  return <>{children}</>;
}
