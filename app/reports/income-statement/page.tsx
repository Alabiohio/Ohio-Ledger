import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { buildDateRange, formatMinorUnits, netIncomeDelta, normalizeLineRows } from "@/lib/reporting";

export const dynamic = "force-dynamic";

interface IncomeStatementProps {
  searchParams: Promise<{ from?: string; to?: string }>;
}

interface StatementRow {
  name: string;
  balanceMinor: bigint;
}

export default async function IncomeStatementPage(props: IncomeStatementProps) {
  const searchParams = await props.searchParams;
  const dateRange = buildDateRange(searchParams);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!business) {
    redirect('/setup');
  }

  const { data: lineRows, error } = await supabase
    .from("journal_entry_lines")
    .select(`
      debit,
      credit,
      journal_entries!inner ( date, description, business_id ),
      accounts!inner ( id, name, type, category, is_default )
    `)
    .eq("journal_entries.business_id", business.id)
    .gte("journal_entries.date", dateRange.from)
    .lte("journal_entries.date", dateRange.to);

  if (error) console.error("Error fetching income statement data:", error);

  const lines = normalizeLineRows(lineRows);
  const totalsByAccount = new Map<string, { name: string; type: "Income" | "Expense"; totalMinor: bigint }>();

  for (const line of lines) {
    if (line.account.type !== "Income" && line.account.type !== "Expense") {
      continue;
    }

    const key = line.account.id;
    const existing = totalsByAccount.get(key) ?? { name: line.account.name, type: line.account.type, totalMinor: 0n };
    existing.totalMinor += netIncomeDelta(line.account.type, line.debitMinor, line.creditMinor);
    totalsByAccount.set(key, existing);
  }

  const revenueRows: StatementRow[] = [];
  const expenseRows: StatementRow[] = [];
  let totalRevenueMinor = 0n;
  let totalExpensesMinor = 0n;

  for (const accountTotals of totalsByAccount.values()) {
    if (accountTotals.type === "Income") {
      if (accountTotals.totalMinor > 0n) {
        revenueRows.push({ name: accountTotals.name, balanceMinor: accountTotals.totalMinor });
        totalRevenueMinor += accountTotals.totalMinor;
      }
    } else {
      const expenseMinor = accountTotals.totalMinor < 0n ? -accountTotals.totalMinor : 0n;
      if (expenseMinor > 0n) {
        expenseRows.push({ name: accountTotals.name, balanceMinor: expenseMinor });
        totalExpensesMinor += expenseMinor;
      }
    }
  }

  const netProfitMinor = totalRevenueMinor - totalExpensesMinor;

  return (
    <div className="space-y-10 py-4">
      <div className="space-y-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-[var(--foreground)]">Income Statement</h1>
          <p className="text-[var(--color-brand-gray)] font-medium mt-1 uppercase text-[10px] tracking-widest">Profit &amp; Loss Analysis</p>
        </div>

        <form className="neo-card p-4 rounded-2xl flex flex-wrap items-end gap-4">
          <div className="min-w-[180px]">
            <label className="block text-xs font-bold text-[var(--color-brand-gray)] uppercase tracking-wider mb-2">From</label>
            <input name="from" type="date" defaultValue={dateRange.from} className="neo-input p-2.5 rounded-xl text-sm" />
          </div>
          <div className="min-w-[180px]">
            <label className="block text-xs font-bold text-[var(--color-brand-gray)] uppercase tracking-wider mb-2">To</label>
            <input name="to" type="date" defaultValue={dateRange.to} className="neo-input p-2.5 rounded-xl text-sm" />
          </div>
          <button type="submit" className="bg-[var(--foreground)] text-[var(--background)] px-6 py-2.5 rounded-xl font-semibold transition-colors hover:bg-[var(--color-brand-peach)] hover:text-[var(--color-ink)]">
            Apply
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="neo-card p-8 rounded-[2rem] bg-green-500/5 dark:bg-green-500/10 border border-green-500/20 flex items-center gap-4 shadow-sm shadow-green-500/5">
          <div className="p-3 bg-green-500/20 text-green-600 rounded-xl">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-green-600/60 mb-1">Total Revenue</p>
            <h3 className="text-2xl font-black text-green-600 dark:text-green-500 font-mono">₦{formatMinorUnits(totalRevenueMinor)}</h3>
          </div>
        </div>
        <div className="neo-card p-8 rounded-[2rem] bg-red-500/5 dark:bg-red-500/10 border border-red-500/20 flex items-center gap-4 shadow-sm shadow-red-500/5">
          <div className="p-3 bg-red-500/20 text-red-600 rounded-xl">
            <TrendingDown className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-red-600/60 mb-1">Total Expenses</p>
            <h3 className="text-2xl font-black text-red-600 dark:text-red-500 font-mono">₦{formatMinorUnits(totalExpensesMinor)}</h3>
          </div>
        </div>
        <div className={`neo-card p-8 rounded-[2rem] border flex items-center gap-4 ${netProfitMinor >= 0n ? "bg-indigo-500/5 dark:bg-indigo-500/10 border-indigo-500/20" : "bg-red-500/5 dark:bg-red-500/10 border-red-500/20"}`}>
          <div className={`p-3 rounded-xl ${netProfitMinor >= 0n ? "bg-indigo-500/20 text-indigo-600" : "bg-red-500/20 text-red-600"}`}>
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${netProfitMinor >= 0n ? "text-indigo-600/60" : "text-red-600/60"}`}>Net Income</p>
            <h3 className={`text-2xl font-black font-mono ${netProfitMinor >= 0n ? "text-indigo-600 dark:text-indigo-500" : "text-red-600 dark:text-red-500"}`}>₦{formatMinorUnits(netProfitMinor)}</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="bg-[var(--surface)] rounded-[2rem] shadow-sm border border-[var(--border)] overflow-hidden flex flex-col">
          <div className="px-8 py-6 border-b border-[var(--border)] bg-[var(--background)]">
            <h3 className="font-black text-lg uppercase tracking-tight text-[var(--foreground)]">Operating Revenue</h3>
          </div>
          <div className="p-8 flex-1">
            {revenueRows.map((row) => (
              <div key={row.name} className="flex justify-between items-center py-4 border-b border-[var(--border)] last:border-0">
                <span className="text-sm font-bold text-[var(--foreground)]">{row.name}</span>
                <span className="text-sm font-mono text-[var(--color-brand-gray)]">₦{formatMinorUnits(row.balanceMinor)}</span>
              </div>
            ))}
            {revenueRows.length === 0 && <p className="text-center py-10 text-[var(--color-brand-gray)]/40 italic text-sm">No revenue recorded</p>}
          </div>
        </div>

        <div className="bg-[var(--surface)] rounded-[2rem] shadow-sm border border-[var(--border)] overflow-hidden flex flex-col">
          <div className="px-8 py-6 border-b border-[var(--border)] bg-[var(--background)]">
            <h3 className="font-black text-lg uppercase tracking-tight text-[var(--foreground)]">Operating Expenses</h3>
          </div>
          <div className="p-8 flex-1">
            {expenseRows.map((row) => (
              <div key={row.name} className="flex justify-between items-center py-4 border-b border-[var(--border)] last:border-0">
                <span className="text-sm font-bold text-[var(--foreground)]">{row.name}</span>
                <span className="text-sm font-mono text-[var(--color-brand-gray)]">₦{formatMinorUnits(row.balanceMinor)}</span>
              </div>
            ))}
            {expenseRows.length === 0 && <p className="text-center py-10 text-[var(--color-brand-gray)]/40 italic text-sm">No expenses recorded</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
