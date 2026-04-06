import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { format } from 'date-fns';

export const dynamic = 'force-dynamic';

export default async function LedgerPage(props: {
  searchParams: Promise<{ account_id?: string; from?: string; to?: string }>;
}) {
  const searchParams = await props.searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  let { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!business) return <div className="p-8">Please navigate to Dashboard first to initialize your business.</div>;

  // Fetch Accounts for the dropdown filter
  const { data: accounts } = await supabase
    .from('accounts')
    .select('id, name, type')
    .eq('business_id', business.id)
    .order('name');

  // Build query for Journal Entry Lines
  let linesQuery = supabase
    .from('journal_entry_lines')
    .select(`
      id,
      debit,
      credit,
      account_id,
      accounts ( name, type ),
      journal_entries!inner ( date, description )
    `)
    // IMPORTANT: To filter safely across tables linked by business, we rely on the inner join and RLS
    // but we can enforce it explicitly since RLS is already doing it:
    .order('created_at', { ascending: false });

  if (searchParams.account_id) {
    linesQuery = linesQuery.eq('account_id', searchParams.account_id);
  }

  const { data: lines = [], error } = await linesQuery;

  // Let's calculate a running balance if an account is selected
  let runningBalance = 0;

  return (
    <div className="space-y-8 py-4">
      <div>
        <h1 className="text-4xl font-black tracking-tight text-[var(--foreground)]">General Ledger</h1>
        <p className="text-[var(--color-brand-gray)] font-medium mt-1">Detailed history of all posted transactions</p>
      </div>

      {/* Filters */}
      <div className="neo-card bg-white p-4 rounded-2xl flex flex-wrap gap-4 items-end shadow-sm">
        <form className="flex flex-wrap gap-4 items-end w-full">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Filter by Account</label>
            <select 
              name="account_id" 
              defaultValue={searchParams.account_id || ''}
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ohio-peach focus:border-transparent bg-white"
            >
              <option value="">All Accounts</option>
              {accounts?.map((acc: any) => (
                <option key={acc.id} value={acc.id}>{acc.name} ({acc.type})</option>
              ))}
            </select>
          </div>
          <div>
            <button type="submit" className="bg-gray-100 hover:bg-gray-200 text-[var(--color-brand-dark)] font-semibold rounded-xl px-6 py-2.5 transition-colors">
              Filter
            </button>
          </div>
        </form>
      </div>

      {/* Ledger Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Date</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Description</th>
                {!searchParams.account_id && <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Account</th>}
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-widest">Debit</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-widest">Credit</th>
                {searchParams.account_id && <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-widest">Balance</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {lines?.map((line: any) => {
                // Determine effect on balance if an account is selected
                if (searchParams.account_id) {
                  const accountType = line.accounts?.type;
                  const debitAmount = Number(line.debit);
                  const creditAmount = Number(line.credit);
                  
                  // Assets & Expenses increase with Debits
                  if (accountType === 'Asset' || accountType === 'Expense') {
                    runningBalance += (debitAmount - creditAmount);
                  } else {
                    // Liabilities, Equity, Incomes increase with Credits
                    runningBalance += (creditAmount - debitAmount);
                  }
                }

                return (
                  <tr key={line.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {line.journal_entries?.date ? format(new Date(line.journal_entries.date), 'MMM dd, yyyy') : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[var(--color-brand-dark)]">
                      {line.journal_entries?.description}
                    </td>
                    
                    {!searchParams.account_id && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {line.accounts?.name}
                      </td>
                    )}
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500 font-mono">
                      {Number(line.debit) > 0 ? `₦${Number(line.debit).toLocaleString(undefined, {minimumFractionDigits: 2})}` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500 font-mono">
                      {Number(line.credit) > 0 ? `₦${Number(line.credit).toLocaleString(undefined, {minimumFractionDigits: 2})}` : '-'}
                    </td>
                    
                    {searchParams.account_id && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium font-mono text-[var(--color-brand-dark)]">
                        {`₦${runningBalance.toLocaleString(undefined, {minimumFractionDigits: 2})}`}
                      </td>
                    )}
                  </tr>
                );
              })}

              {lines?.length === 0 && (
                <tr>
                  <td colSpan={searchParams.account_id ? 5 : 5} className="px-6 py-12 text-center text-gray-400">
                    No transactions found in the ledger.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
