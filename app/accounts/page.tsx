import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { Plus, Trash2 } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AccountsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  let { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!business) {
    // Should have been created in dashboard or trigger, but just in case
    return <div className="p-8 text-black">Please navigate to Dashboard first to initialize your business.</div>;
  }

  const { data: accounts = [], error } = await supabase
    .from('accounts')
    .select('*')
    .eq('business_id', business.id)
    .order('type', { ascending: true })
    .order('name', { ascending: true });

  const accountTypes = ['Asset', 'Liability', 'Equity', 'Income', 'Expense'];

  async function createAccount(formData: FormData) {
    'use server';
    const supabaseServer = await createClient();
    const { data: { user } } = await supabaseServer.auth.getUser();
    if (!user) return;
    
    let { data: currBusiness } = await supabaseServer
      .from('businesses')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!currBusiness) return;

    await supabaseServer.from('accounts').insert({
      business_id: currBusiness.id,
      name: formData.get('name'),
      type: formData.get('type'),
      category: formData.get('category'),
      is_default: false
    });

    revalidatePath('/accounts');
  }

  async function deleteAccount(formData: FormData) {
    'use server';
    const supabaseServer = await createClient();
    const accountId = formData.get('id');
    await supabaseServer.from('accounts').delete().eq('id', accountId).eq('is_default', false);
    revalidatePath('/accounts');
  }

  return (
    <div className="space-y-10 py-4">
      <div>
        <h1 className="text-4xl font-black tracking-tight text-[var(--foreground)]">Chart of Accounts</h1>
        <p className="text-[var(--color-brand-gray)] font-medium mt-1">Manage your financial categories and structure</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Account List */}
        <div className="lg:col-span-2 space-y-6">
          {accountTypes.map(type => {
            const typeAccounts = accounts?.filter(a => a.type === type) || [];
            if (typeAccounts.length === 0) return null;

            return (
              <div key={type} className="neo-card bg-white rounded-2xl overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                  <h3 className="font-bold text-[var(--color-brand-dark)] flex items-center gap-2">
                    {type}
                    <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">{typeAccounts.length}</span>
                  </h3>
                </div>
                <div className="divide-y divide-gray-50">
                  {typeAccounts.map((account: any) => (
                    <div key={account.id} className="p-4 px-6 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                      <div>
                        <p className="font-semibold text-sm text-[var(--color-brand-dark)]">
                          {account.name}
                          {account.is_default && <span className="ml-2 text-[10px] uppercase tracking-wider text-ohio-peach font-bold">System</span>}
                        </p>
                        <p className="text-xs text-[var(--color-brand-gray)]">{account.category || 'Uncategorized'}</p>
                      </div>
                      {!account.is_default && (
                        <form action={deleteAccount}>
                          <input type="hidden" name="id" value={account.id} />
                          <button type="submit" className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </form>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Create Account Form */}
        <div>
          <div className="neo-card bg-white rounded-2xl p-6 shadow-sm sticky top-24">
            <h3 className="font-bold text-lg mb-6">Add New Account</h3>
            <form action={createAccount} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Account Name</label>
                <input 
                  type="text" 
                  name="name" 
                  required
                  placeholder="e.g. Travel Expenses" 
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ohio-peach focus:border-transparent transition-all"
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Account Type</label>
                <select 
                  name="type" 
                  required
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ohio-peach focus:border-transparent transition-all bg-white"
                >
                  <option value="Asset">Asset</option>
                  <option value="Liability">Liability</option>
                  <option value="Equity">Equity</option>
                  <option value="Income">Income</option>
                  <option value="Expense">Expense</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Category / Group (Optional)</label>
                <input 
                  type="text" 
                  name="category" 
                  placeholder="e.g. Operating Expense" 
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ohio-peach focus:border-transparent transition-all"
                />
              </div>

              <button 
                type="submit"
                className="w-full bg-[var(--color-brand-dark)] text-white font-semibold rounded-xl py-3 mt-4 hover:bg-[var(--color-brand-peach)] transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Create Account
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
