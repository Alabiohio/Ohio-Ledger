import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { ArrowDownLeft, ArrowUpRight, Wallet } from "lucide-react";
import { buildDateRange, formatMinorUnits, isCashLikeAccount, normalizeLineRows } from "@/lib/reporting";

export const dynamic = "force-dynamic";

interface CashFlowProps {
  searchParams: Promise<{ from?: string; to?: string }>;
}

interface CashFlowRow {
  id: string;
  date: string;
  description: string;
  inflowMinor: bigint;
  outflowMinor: bigint;
}

export default async function CashFlowPage(props: CashFlowProps) {
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
      id,
      debit,
      credit,
      journal_entries!inner ( date, description, business_id ),
      accounts!inner ( id, name, type, category, is_default )
    `)
    .eq("journal_entries.business_id", business.id)
    .gte("journal_entries.date", dateRange.from)
    .lte("journal_entries.date", dateRange.to);

  if (error) console.error("Error fetching cash flow data:", error);

  const lines = normalizeLineRows(lineRows);
  const cashRows: CashFlowRow[] = [];
  let cashInMinor = 0n;
  let cashOutMinor = 0n;

  for (const line of lines) {
    if (!isCashLikeAccount(line.account)) {
      continue;
    }

    const inflowMinor = line.debitMinor > 0n ? line.debitMinor : 0n;
    const outflowMinor = line.creditMinor > 0n ? line.creditMinor : 0n;
    cashInMinor += inflowMinor;
    cashOutMinor += outflowMinor;
    cashRows.push({
      id: `${line.accountId}-${line.date}-${line.description}`,
      date: line.date,
      description: line.description || line.account.name,
      inflowMinor,
      outflowMinor,
    });
  }

  cashRows.sort((a, b) => b.date.localeCompare(a.date));
  const netCashFlowMinor = cashInMinor - cashOutMinor;

  return (
    <div className="space-y-10 py-4 max-w-6xl mx-auto">
      <div className="space-y-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-[var(--foreground)]">Cash Flow</h1>
          <p className="text-[var(--color-brand-gray)] font-medium mt-1 uppercase text-[10px] tracking-widest text-ohio-peach">Direct Method Cash Tracking</p>
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
        <div className="neo-card p-8 rounded-[2rem] bg-green-500/5 dark:bg-green-500/10 border border-green-500/20 flex items-center gap-4">
          <ArrowDownLeft className="w-8 h-8 text-green-600" />
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-green-600/60 mb-1">Cash Inflow</p>
            <h3 className="text-2xl font-black text-green-600 dark:text-green-500 font-mono">₦{formatMinorUnits(cashInMinor)}</h3>
          </div>
        </div>
        <div className="neo-card p-8 rounded-[2rem] bg-red-500/5 dark:bg-red-500/10 border border-red-500/20 flex items-center gap-4">
          <ArrowUpRight className="w-8 h-8 text-red-600" />
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-red-600/60 mb-1">Cash Outflow</p>
            <h3 className="text-2xl font-black text-red-600 dark:text-red-500 font-mono">₦{formatMinorUnits(cashOutMinor)}</h3>
          </div>
        </div>
        <div className="neo-card p-8 rounded-[2rem] bg-ohio-peach/5 border border-ohio-peach/20 flex items-center gap-4 shadow-xl shadow-ohio-peach/5">
          <Wallet className="w-8 h-8 text-ohio-peach" />
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-ohio-peach/60 mb-1">Net Cash Flow</p>
            <h3 className="text-2xl font-black text-ohio-peach font-mono">₦{formatMinorUnits(netCashFlowMinor)}</h3>
          </div>
        </div>
      </div>

      <div className="bg-[var(--surface)] rounded-[2.5rem] shadow-sm border border-[var(--border)] overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--background)]">
                <th className="px-8 py-6 text-left text-xs font-black text-[var(--color-brand-gray)] uppercase tracking-widest">Date</th>
                <th className="px-8 py-6 text-left text-xs font-black text-[var(--color-brand-gray)] uppercase tracking-widest">Description</th>
                <th className="px-8 py-6 text-right text-xs font-black text-[var(--color-brand-gray)] uppercase tracking-widest">Inflow</th>
                <th className="px-8 py-6 text-right text-xs font-black text-[var(--color-brand-gray)] uppercase tracking-widest">Outflow</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {cashRows.map((row, index) => (
                <tr key={`${row.id}-${index}`} className="hover:bg-[var(--background)]/70 transition-colors">
                  <td className="px-8 py-4 text-sm text-[var(--color-brand-gray)] italic">{row.date}</td>
                  <td className="px-8 py-4 text-sm font-bold text-[var(--foreground)]">{row.description}</td>
                  <td className="px-8 py-4 text-right text-sm font-mono text-green-600">{row.inflowMinor > 0n ? `₦${formatMinorUnits(row.inflowMinor)}` : "-"}</td>
                  <td className="px-8 py-4 text-right text-sm font-mono text-red-600">{row.outflowMinor > 0n ? `₦${formatMinorUnits(row.outflowMinor)}` : "-"}</td>
                </tr>
              ))}
              {cashRows.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-8 py-20 text-center text-[var(--color-brand-gray)] italic">
                    No cash or bank movements recorded in this period.
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
