import { DashboardCharts } from '@/components/dashboard/Charts';
import { DollarSign, TrendingDown, TrendingUp } from 'lucide-react';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Fetch or create user's default business
  let { data: business } = await supabase
    .from('businesses')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (!business) {
    redirect('/setup');
  }

  // Fetch accounts to calculate balances
  const { data: accounts = [], error } = await supabase
    .from('accounts')
    .select(`
      id, name, type,
      journal_entry_lines ( debit, credit )
    `)
    .eq('business_id', business.id);

  if (error) console.error('Error fetching accounts:', error);

  // Calculate balances from ledger lines
  let totalIncome = 0;
  let totalExpense = 0;
  let totalCash = 0;

  accounts?.forEach((account) => {
    let debitTotal = 0;
    let creditTotal = 0;
    account.journal_entry_lines?.forEach((line: any) => {
      debitTotal += Number(line.debit) || 0;
      creditTotal += Number(line.credit) || 0;
    });

    // In accounting: 
    // Income accounts increase with credit, decrease with debit.
    // Expense accounts increase with debit, decrease with credit.
    // Asset accounts (like Cash) increase with debit, decrease with credit.
    if (account.type === 'Income') {
      totalIncome += (creditTotal - debitTotal);
    } else if (account.type === 'Expense') {
      totalExpense += (debitTotal - creditTotal);
    }

    if (account.name === 'Cash') {
      totalCash += (debitTotal - creditTotal);
    }
  });

  const netProfit = totalIncome - totalExpense;

  // Map for charts
  const chartTransactions = (accounts || []).flatMap(acc =>
    (acc.journal_entry_lines || []).map((line: any) => ({
      id: line.id,
      type: acc.type === 'Income' ? 'income' : 'expense',
      amount: Number(line.debit) || Number(line.credit),
      category: acc.name,
      date: new Date() // Simplified for now
    }))
  );

  const monthlyBudget = 500000; // Example budget in Naira
  const budgetStatus = (totalExpense / monthlyBudget) * 100;
  const isOverBudget = totalExpense > monthlyBudget;

  return (
    <div className="space-y-10 py-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-[var(--foreground)]">Financial Overview</h1>
          <p className="text-[var(--color-brand-gray)] font-medium mt-1">Real-time data from your smart ledger</p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="/upload"
            className="px-6 py-3 bg-[var(--surface)] text-[var(--foreground)] rounded-2xl border border-[var(--border)] text-[10px] font-black tracking-widest uppercase hover:bg-[var(--foreground)] hover:text-[var(--background)] transition-all flex items-center gap-2 group shadow-lg shadow-black/5"
          >
            <TrendingUp className="w-4 h-4 text-[var(--color-brand-peach)] group-hover:text-[var(--color-brand-gold)]" />
            Manual Record
          </a>
          <a
            href="/upload"
            className="px-6 py-3 bg-[var(--color-brand-peach)] text-[var(--color-brand-dark)] rounded-2xl text-[10px] font-black tracking-widest uppercase shadow-xl shadow-[var(--color-brand-peach)]/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
          >
            <DollarSign className="w-4 h-4" />
            Upload Receipt
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
        <div className="neo-card p-6 md:p-8 rounded-[2rem] flex flex-col justify-between group bg-white relative overflow-hidden border-none shadow-xl shadow-black/5">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[var(--color-brand-peach)]/5 blur-3xl rounded-full -mr-12 -mt-12" />
          <div className="relative z-10">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-brand-gray)] mb-3">Cash Position</p>
            <div className="flex items-baseline gap-1.5">
              <h2 className="text-3xl font-black italic tracking-tighter text-[var(--foreground)]">₦{totalCash.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
            </div>
            <p className="text-[9px] font-black uppercase tracking-widest text-[var(--color-brand-peach)] mt-2">Available Liquidity</p>
          </div>

          <div className="mt-4 relative z-10">
            <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-[var(--color-brand-peach)] w-2/3 opacity-30" />
            </div>
          </div>
        </div>

        {/* Total Income */}
        <div className="neo-card p-6 md:p-8 rounded-[2rem] flex items-center group border-none shadow-xl shadow-black/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[var(--color-status-green)]/5 blur-3xl rounded-full -mr-12 -mt-12" />
          <div className="p-4 bg-[var(--color-status-green)]/10 text-[var(--color-status-green)] rounded-2xl mr-4 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-sm shadow-[var(--color-status-green)]/10">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div className="relative z-10">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-brand-gray)] mb-1">Total Yield</p>
            <h2 className="text-2xl font-black leading-none text-[var(--color-status-green)] tracking-tighter">₦{totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
          </div>
        </div>

        {/* Total Expense */}
        <div className="neo-card p-6 md:p-8 rounded-[2rem] flex items-center group border-none shadow-xl shadow-black/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[var(--color-status-red)]/5 blur-3xl rounded-full -mr-12 -mt-12" />
          <div className="p-4 bg-[var(--color-status-red)]/10 text-[var(--color-status-red)] rounded-2xl mr-4 transition-all duration-500 group-hover:scale-110 group-hover:-rotate-3 shadow-sm shadow-[var(--color-status-red)]/10">
            <TrendingDown className="w-6 h-6" />
          </div>
          <div className="relative z-10">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-brand-gray)] mb-1">Outflow</p>
            <h2 className="text-2xl font-black leading-none text-[var(--color-status-red)] tracking-tighter">₦{totalExpense.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
          </div>
        </div>

        {/* Net Profit */}
        <div className="bg-[var(--foreground)] text-[var(--background)] p-6 md:p-8 rounded-[2rem] shadow-2xl shadow-black/20 flex items-center relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-40 h-40 bg-[var(--color-brand-gold)]/10 blur-[80px] rounded-full -mr-20 -mt-20 group-hover:bg-[var(--color-brand-gold)]/20 transition-all duration-700" />
          <div className="p-4 bg-[var(--color-brand-gold)]/20 text-[var(--color-brand-gold)] rounded-2xl mr-4 transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 shadow-lg shadow-[var(--color-brand-gold)]/10 relative z-10">
            <DollarSign className="w-6 h-6" />
          </div>
          <div className="relative z-10">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-1">Net Reserve</p>
            <h2 className="text-2xl font-black text-[var(--color-brand-gold)] leading-none tracking-tighter">₦{netProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
          </div>
        </div>
      </div>

      <DashboardCharts transactions={chartTransactions} />
    </div>
  );
}
