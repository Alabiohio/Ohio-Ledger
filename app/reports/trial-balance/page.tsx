import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { buildDateRange, formatMinorUnits, normalizeLineRows, type AccountType } from "@/lib/reporting";

export const dynamic = "force-dynamic";

interface TrialBalanceProps {
  searchParams: Promise<{ from?: string; to?: string }>;
}

interface TrialRow {
  name: string;
  type: AccountType;
  debitMinor: bigint;
  creditMinor: bigint;
}

export default async function TrialBalancePage(props: TrialBalanceProps) {
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
    return <div className="p-8">Please initialize your business in the Dashboard.</div>;
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

  if (error) console.error("Error fetching trial balance data:", error);

  const lines = normalizeLineRows(lineRows);
  const balances = new Map<string, { name: string; type: AccountType; debitMinor: bigint; creditMinor: bigint }>();

  for (const line of lines) {
    const key = line.account.id;
    const existing = balances.get(key) ?? { name: line.account.name, type: line.account.type, debitMinor: 0n, creditMinor: 0n };
    existing.debitMinor += line.debitMinor;
    existing.creditMinor += line.creditMinor;
    balances.set(key, existing);
  }

  const trialRows: TrialRow[] = [];
  let totalDebitsMinor = 0n;
  let totalCreditsMinor = 0n;

  for (const row of balances.values()) {
    const net = row.debitMinor - row.creditMinor;
    if (net === 0n) {
      continue;
    }

    const debitMinor = net > 0n ? net : 0n;
    const creditMinor = net < 0n ? -net : 0n;
    totalDebitsMinor += debitMinor;
    totalCreditsMinor += creditMinor;
    trialRows.push({ name: row.name, type: row.type, debitMinor, creditMinor });
  }

  trialRows.sort((a, b) => a.type.localeCompare(b.type) || a.name.localeCompare(b.name));
  const imbalanceMinor = totalDebitsMinor - totalCreditsMinor;

  return (
    <div className="space-y-8 py-4">
      <div className="space-y-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-[var(--foreground)]">Trial Balance</h1>
          <p className="text-[var(--color-brand-gray)] font-medium mt-1 uppercase text-[10px] tracking-widest">Verification of Debit &amp; Credit Equalities</p>
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

      <div className="bg-[var(--surface)] rounded-2xl shadow-sm border border-[var(--border)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--background)]">
                <th className="px-6 py-4 text-left text-xs font-bold text-[var(--color-brand-gray)] uppercase tracking-widest">Account Name</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-[var(--color-brand-gray)] uppercase tracking-widest">Type</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-[var(--color-brand-gray)] uppercase tracking-widest">Debit</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-[var(--color-brand-gray)] uppercase tracking-widest">Credit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {trialRows.map((row) => (
                <tr key={`${row.type}-${row.name}`} className="hover:bg-[var(--background)]/60 transition-colors">
                  <td className="px-6 py-4 text-sm font-semibold text-[var(--foreground)]">{row.name}</td>
                  <td className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-[var(--color-brand-gray)]">{row.type}</td>
                  <td className="px-6 py-4 text-right text-sm font-mono">{row.debitMinor > 0n ? `₦${formatMinorUnits(row.debitMinor)}` : "-"}</td>
                  <td className="px-6 py-4 text-right text-sm font-mono">{row.creditMinor > 0n ? `₦${formatMinorUnits(row.creditMinor)}` : "-"}</td>
                </tr>
              ))}
              <tr className="bg-[var(--background)] font-black border-t-2 border-ohio-peach">
                <td colSpan={2} className="px-6 py-4 text-right text-sm uppercase tracking-widest text-ohio-peach font-bold italic">
                  Total Balance
                </td>
                <td className="px-6 py-4 text-right text-sm font-mono text-ohio-peach underline underline-offset-4 decoration-2">₦{formatMinorUnits(totalDebitsMinor)}</td>
                <td className="px-6 py-4 text-right text-sm font-mono text-ohio-peach underline underline-offset-4 decoration-2">₦{formatMinorUnits(totalCreditsMinor)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {imbalanceMinor !== 0n && (
        <div className="p-4 bg-red-500/10 text-red-500 rounded-xl border border-red-500/20 flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
          <p className="text-xs font-bold uppercase tracking-widest">Warning: Debits and Credits are NOT in balance. Difference: ₦{formatMinorUnits(imbalanceMinor)}</p>
        </div>
      )}
    </div>
  );
}
