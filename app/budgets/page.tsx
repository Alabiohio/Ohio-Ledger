import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { Target, AlertTriangle, TrendingDown } from 'lucide-react';
import { BudgetCharts } from './BudgetCharts';

export const dynamic = 'force-dynamic';

export default async function BudgetsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!business) redirect('/setup');

  // Fetch all expense accounts with a budget
  const { data: accountsRaw = [] } = await supabase
    .from('accounts')
    .select('id, name, monthly_budget, category')
    .eq('business_id', business.id)
    .eq('type', 'Expense');

  const accounts = accountsRaw?.filter(a => Number(a.monthly_budget) > 0) || [];

  if (accounts.length === 0) {
    return (
      <div className="space-y-10 py-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-[var(--foreground)]">Performance Tracking</h1>
          <p className="text-[var(--color-brand-gray)] font-medium mt-1">Set and monitor monthly budgets</p>
        </div>
        <div className="neo-card p-10 text-center rounded-[2rem]">
          <Target className="w-12 h-12 text-[var(--color-brand-peach)] mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-bold mb-2">No Budgets Setup</h3>
          <p className="text-[var(--color-brand-gray)] mb-6">Go to Accounts to set a Monthly Budget for your Expense accounts.</p>
          <a href="/accounts" className="px-6 py-3 bg-[var(--color-brand-dark)] text-white rounded-xl font-semibold">Manage Accounts</a>
        </div>
      </div>
    );
  }

  // Get current month boundaries
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

  // Fetch lines for current month
  // Supabase inner join filtering: journal_entries!inner (date)
  let { data: linesRaw, error } = await supabase
    .from('journal_entry_lines')
    .select(`
      account_id, debit, credit,
      journal_entries!inner ( date )
    `)
    .gte('journal_entries.date', firstDay)
    .lte('journal_entries.date', lastDay);

  if (error) console.error('Error fetching budget lines:', error);

  // Map limits
  const budgetData = accounts.map(acc => {
    const budget = Number(acc.monthly_budget) || 0;
    
    // Find lines
    const accLines = (linesRaw || []).filter((l: any) => l.account_id === acc.id);
    const spent = accLines.reduce((acc, l) => acc + (Number(l.debit) || 0) - (Number(l.credit) || 0), 0);
    
    const percentage = budget > 0 ? (spent / budget) * 100 : 0;
    const isDanger = percentage >= 80;

    return {
      id: acc.id,
      name: acc.name,
      category: acc.category || 'General',
      budget,
      spent,
      percentage,
      isDanger
    };
  }).sort((a, b) => b.percentage - a.percentage);

  const dangerAccounts = budgetData.filter(b => b.isDanger);
  const totalBudget = budgetData.reduce((acc, b) => acc + b.budget, 0);
  const totalSpent = budgetData.reduce((acc, b) => acc + b.spent, 0);

  return (
    <div className="space-y-10 py-4">
      <div>
        <h1 className="text-4xl font-black tracking-tight text-[var(--foreground)]">Budgeting & Performance</h1>
        <p className="text-[var(--color-brand-gray)] font-medium mt-1">Monitor actual spending vs allocations</p>
      </div>

      {dangerAccounts.length > 0 && (
        <div className="bg-red-50/50 border border-red-100 rounded-2xl p-6 shadow-sm flex items-start gap-4">
          <div className="p-3 bg-red-100 text-red-600 rounded-xl">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-red-900">Threshold Notifications</h3>
            <p className="text-sm text-red-700 mt-1">The following active accounts have exceeded 80% of their allocated monthly budget:</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {dangerAccounts.map(acc => (
                <span key={acc.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-100 text-red-800 rounded-lg text-xs font-bold border border-red-200">
                  {acc.name} 
                  <span className="bg-white/50 px-1 rounded">{acc.percentage.toFixed(0)}%</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="neo-card p-8 rounded-[2rem] bg-[var(--foreground)] text-[var(--background)] flex flex-col justify-between shadow-xl">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-50 mb-4">Total Allowed</p>
          <h2 className="text-4xl font-black italic tracking-tighter">₦{totalBudget.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
        </div>
        <div className="neo-card p-8 rounded-[2rem] flex flex-col justify-between shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-status-red)]/10 blur-3xl rounded-full -mr-16 -mt-16" />
          <div className="relative z-10">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-brand-gray)] mb-4">Total Exhausted</p>
            <h2 className="text-4xl font-black tracking-tighter text-[var(--color-status-red)]">₦{totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
          </div>
        </div>
        <div className="neo-card p-8 rounded-[2rem] flex flex-col justify-between shadow-sm relative overflow-hidden bg-[var(--color-brand-peach)] text-[var(--color-brand-dark)]">
           <div className="relative z-10">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mb-4 flex items-center justify-between">
              Overall Status
              <TrendingDown className="w-4 h-4 opacity-50" />
            </p>
            <h2 className="text-5xl font-black tracking-tighter">{totalBudget > 0 ? ((totalSpent / totalBudget) * 100).toFixed(1) : 0}%</h2>
            <div className="mt-4 w-full h-1.5 bg-black/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-black/60 rounded-full transition-all"
                style={{ width: `${Math.min((totalSpent / totalBudget) * 100, 100)}%` }} 
              />
            </div>
          </div>
        </div>
      </div>

      <BudgetCharts data={budgetData} />

      <div className="neo-card bg-white rounded-[2rem] overflow-hidden shadow-sm">
        <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
            <h3 className="font-black text-lg text-[var(--color-brand-dark)]">Budget Item Breakdown</h3>
        </div>
        <div className="divide-y divide-gray-50">
          {budgetData.map((acc) => (
            <div key={acc.id} className="p-6 px-8 flex items-center gap-6 hover:bg-gray-50/50 transition-colors">
              <div className="w-48 shrink-0">
                <p className="font-bold text-sm text-[var(--color-brand-dark)]">{acc.name}</p>
                <p className="text-[10px] uppercase tracking-wider text-[var(--color-brand-gray)] font-bold">{acc.category}</p>
              </div>
              <div className="flex-1">
                <div className="flex justify-between mb-2 text-xs font-bold">
                  <span className="text-[var(--color-brand-gray)]">₦{acc.spent.toLocaleString()} spent</span>
                  <span className="text-[var(--color-brand-dark)]">₦{acc.budget.toLocaleString()} default</span>
                </div>
                <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden flex">
                   <div 
                    className={`h-full transition-all ${acc.isDanger ? 'bg-red-500' : 'bg-[var(--color-brand-peach)]'}`}
                    style={{ width: `${Math.min(acc.percentage, 100)}%` }}
                   />
                </div>
              </div>
              <div className="w-16 shrink-0 text-right">
                <span className={`font-black text-sm ${acc.isDanger ? 'text-red-600' : 'text-[var(--color-brand-dark)]'}`}>
                  {acc.percentage.toFixed(0)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
