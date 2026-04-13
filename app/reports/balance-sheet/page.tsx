import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import {
  accountDeltaByType,
  buildDateRange,
  formatMinorUnits,
  fromMinorUnits,
  netIncomeDelta,
  normalizeAccountRows,
  normalizeLineRows,
  type ReportAccount,
} from "@/lib/reporting";

export const dynamic = "force-dynamic";

interface BalanceSheetProps {
  searchParams: Promise<{ from?: string; to?: string }>;
}

interface BalanceRow {
  name: string;
  balanceMinor: bigint;
}

function isNonZeroOrDefault(balanceMinor: bigint, account: ReportAccount): boolean {
  return balanceMinor !== 0n || account.isDefault;
}

export default async function BalanceSheetPage(props: BalanceSheetProps) {
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

  const [{ data: accountRows, error: accountsError }, { data: lineRows, error: linesError }] = await Promise.all([
    supabase.from("accounts").select("id, name, type, category, is_default").eq("business_id", business.id),
    supabase
      .from("journal_entry_lines")
      .select(`
        debit,
        credit,
        journal_entries!inner ( date, description, business_id ),
        accounts!inner ( id, name, type, category, is_default )
      `)
      .eq("journal_entries.business_id", business.id)
      .lte("journal_entries.date", dateRange.to),
  ]);

  if (accountsError) console.error("Error fetching accounts:", accountsError);
  if (linesError) console.error("Error fetching balance sheet lines:", linesError);

  const accounts = normalizeAccountRows(accountRows);
  const lines = normalizeLineRows(lineRows);
  const accountMap = new Map(accounts.map((account) => [account.id, account]));
  const balanceMap = new Map<string, bigint>(accounts.map((account) => [account.id, 0n]));

  let openingRetainedMinor = 0n;
  let currentPeriodIncomeMinor = 0n;

  for (const line of lines) {
    const account = accountMap.get(line.accountId) ?? line.account;
    const prior = balanceMap.get(account.id) ?? 0n;
    const delta = accountDeltaByType(account.type, line.debitMinor, line.creditMinor);
    balanceMap.set(account.id, prior + delta);

    if (account.type === "Income" || account.type === "Expense") {
      const netDelta = netIncomeDelta(account.type, line.debitMinor, line.creditMinor);
      if (line.date < dateRange.from) {
        openingRetainedMinor += netDelta;
      } else {
        currentPeriodIncomeMinor += netDelta;
      }
    }
  }

  const assets: BalanceRow[] = [];
  const liabilities: BalanceRow[] = [];
  const equity: BalanceRow[] = [];
  let totalAssetsMinor = 0n;
  let totalLiabilitiesMinor = 0n;
  let totalEquityMinor = 0n;

  for (const account of accounts) {
    const balanceMinor = balanceMap.get(account.id) ?? 0n;
    if (!isNonZeroOrDefault(balanceMinor, account)) {
      continue;
    }

    if (account.type === "Asset") {
      assets.push({ name: account.name, balanceMinor });
      totalAssetsMinor += balanceMinor;
    } else if (account.type === "Liability") {
      liabilities.push({ name: account.name, balanceMinor });
      totalLiabilitiesMinor += balanceMinor;
    } else if (account.type === "Equity") {
      equity.push({ name: account.name, balanceMinor });
      totalEquityMinor += balanceMinor;
    }
  }

  if (openingRetainedMinor !== 0n) {
    equity.push({ name: "Retained Earnings (Opening)", balanceMinor: openingRetainedMinor });
    totalEquityMinor += openingRetainedMinor;
  }

  if (currentPeriodIncomeMinor !== 0n) {
    equity.push({ name: "Current Period Profit/Loss", balanceMinor: currentPeriodIncomeMinor });
    totalEquityMinor += currentPeriodIncomeMinor;
  }

  const totalLiabilitiesAndEquityMinor = totalLiabilitiesMinor + totalEquityMinor;
  const outOfBalanceMinor = totalAssetsMinor - totalLiabilitiesAndEquityMinor;

  return (
    <div className="space-y-10 py-4 max-w-5xl mx-auto">
      <div className="space-y-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-[var(--foreground)]">Balance Sheet</h1>
          <p className="text-[var(--color-brand-gray)] font-medium mt-1 uppercase text-[10px] tracking-widest text-ohio-peach">
            Statement of Financial Position
          </p>
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
          <p className="text-xs text-[var(--color-brand-gray)]">Includes balances up to {dateRange.to}; period P&amp;L is {dateRange.from} to {dateRange.to}.</p>
        </form>
      </div>

      <div className="grid grid-cols-1 gap-10">
        <div className="bg-[var(--surface)] rounded-[2.5rem] shadow-sm border border-[var(--border)] overflow-hidden">
          <div className="px-10 py-8 bg-[var(--background)] border-b border-[var(--border)] flex justify-between items-center">
            <h2 className="text-2xl font-black uppercase tracking-tight text-ohio-peach">Assets</h2>
            <span className="text-xl font-black text-[var(--foreground)]">₦{formatMinorUnits(totalAssetsMinor)}</span>
          </div>
          <div className="p-10 space-y-4">
            {assets.map((row) => (
              <div key={row.name} className="flex justify-between items-center py-2 border-b border-[var(--border)] last:border-0">
                <span className="text-sm font-bold text-[var(--foreground)]">{row.name}</span>
                <span className="text-sm font-mono text-[var(--color-brand-gray)]">₦{formatMinorUnits(row.balanceMinor)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="bg-[var(--surface)] rounded-[2.5rem] shadow-sm border border-[var(--border)] overflow-hidden flex flex-col">
            <div className="px-10 py-8 bg-[var(--background)] border-b border-[var(--border)] flex justify-between items-center">
              <h2 className="text-xl font-black uppercase tracking-tight text-[var(--foreground)]">Liabilities</h2>
              <span className="text-lg font-black text-[var(--foreground)]">₦{formatMinorUnits(totalLiabilitiesMinor)}</span>
            </div>
            <div className="p-10 flex-1 space-y-4">
              {liabilities.map((row) => (
                <div key={row.name} className="flex justify-between items-center py-2 border-b border-[var(--border)] last:border-0">
                  <span className="text-sm font-bold text-[var(--foreground)]">{row.name}</span>
                  <span className="text-sm font-mono text-[var(--color-brand-gray)]">₦{formatMinorUnits(row.balanceMinor)}</span>
                </div>
              ))}
              {liabilities.length === 0 && <p className="text-[var(--color-brand-gray)] italic text-sm py-4">No liabilities recorded</p>}
            </div>
          </div>

          <div className="bg-[var(--surface)] rounded-[2.5rem] shadow-sm border border-[var(--border)] overflow-hidden flex flex-col">
            <div className="px-10 py-8 bg-[var(--background)] border-b border-[var(--border)] flex justify-between items-center">
              <h2 className="text-xl font-black uppercase tracking-tight text-ohio-gold">Equity</h2>
              <span className="text-lg font-black text-[var(--foreground)]">₦{formatMinorUnits(totalEquityMinor)}</span>
            </div>
            <div className="p-10 flex-1 space-y-4">
              {equity.map((row) => (
                <div key={row.name} className="flex justify-between items-center py-2 border-b border-[var(--border)] last:border-0">
                  <span className="text-sm font-bold text-[var(--foreground)]">{row.name}</span>
                  <span className="text-sm font-mono text-[var(--color-brand-gray)]">₦{formatMinorUnits(row.balanceMinor)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center gap-6 p-10 bg-[var(--foreground)] text-[var(--background)] rounded-[2.5rem] shadow-2xl shadow-black/20">
          <div className="text-center md:text-left">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 mb-2">Total Assets</p>
            <h2 className="text-3xl font-black text-ohio-peach">₦{formatMinorUnits(totalAssetsMinor)}</h2>
          </div>
          <div className="text-2xl font-black opacity-20 hidden md:block">=</div>
          <div className="text-center md:text-right">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 mb-2">Liabilities + Equity</p>
            <h2 className="text-3xl font-black text-ohio-gold">₦{formatMinorUnits(totalLiabilitiesAndEquityMinor)}</h2>
          </div>
        </div>

        {outOfBalanceMinor !== 0n && (
          <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/10 text-red-500 text-sm font-semibold">
            Balance check warning: difference is ₦{formatMinorUnits(outOfBalanceMinor)}.
          </div>
        )}

        <p className="text-xs text-[var(--color-brand-gray)]">
          Decimal-safe totals are used internally in minor units (kobo). Display values: ₦{fromMinorUnits(totalAssetsMinor).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} assets.
        </p>
      </div>
    </div>
  );
}
