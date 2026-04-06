export type AccountType = "Asset" | "Liability" | "Equity" | "Income" | "Expense";

export interface ReportAccount {
  id: string;
  name: string;
  type: AccountType;
  category: string | null;
  isDefault: boolean;
}

export interface ReportLine {
  accountId: string;
  account: ReportAccount;
  date: string;
  description: string;
  debitMinor: bigint;
  creditMinor: bigint;
}

export interface ReportDateRange {
  from: string;
  to: string;
}

function isAccountType(value: unknown): value is AccountType {
  return value === "Asset" || value === "Liability" || value === "Equity" || value === "Income" || value === "Expense";
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }
  return value as Record<string, unknown>;
}

function normalizeNestedObject(value: unknown): Record<string, unknown> | null {
  if (Array.isArray(value)) {
    return asRecord(value[0]);
  }
  return asRecord(value);
}

function isIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function buildDateRange(search: { from?: string; to?: string }): ReportDateRange {
  const todayIso = toIsoDate(new Date());
  const inputFrom = (search.from ?? "").trim();
  const inputTo = (search.to ?? "").trim();
  const validFrom = isIsoDate(inputFrom) ? inputFrom : "";
  const validTo = isIsoDate(inputTo) ? inputTo : "";

  let from = validFrom;
  let to = validTo;

  if (!to) {
    to = todayIso;
  }

  if (!from) {
    const year = Number(to.slice(0, 4));
    from = `${year}-01-01`;
  }

  if (from > to) {
    from = to;
  }

  return { from, to };
}

export function toMinorUnits(value: unknown): bigint {
  if (value === null || value === undefined) {
    return 0n;
  }

  const cleaned = String(value).replace(/,/g, "").trim();
  if (!/^-?\d+(\.\d+)?$/.test(cleaned)) {
    return 0n;
  }

  const negative = cleaned.startsWith("-");
  const unsigned = negative ? cleaned.slice(1) : cleaned;
  const [wholePartRaw, fractionRaw = ""] = unsigned.split(".");
  const wholePart = wholePartRaw === "" ? "0" : wholePartRaw;
  const paddedFraction = (fractionRaw + "000").slice(0, 3);
  const centsBase = BigInt(wholePart) * 100n + BigInt(paddedFraction.slice(0, 2));
  const roundUp = Number(paddedFraction[2] ?? "0") >= 5 ? 1n : 0n;
  const cents = centsBase + roundUp;

  return negative ? -cents : cents;
}

export function fromMinorUnits(value: bigint): number {
  return Number(value) / 100;
}

export function formatMinorUnits(value: bigint): string {
  const sign = value < 0n ? "-" : "";
  const absolute = value < 0n ? -value : value;
  const whole = absolute / 100n;
  const fraction = String(absolute % 100n).padStart(2, "0");
  const wholeWithCommas = whole.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${sign}${wholeWithCommas}.${fraction}`;
}

export function accountDeltaByType(type: AccountType, debitMinor: bigint, creditMinor: bigint): bigint {
  if (type === "Asset" || type === "Expense") {
    return debitMinor - creditMinor;
  }
  return creditMinor - debitMinor;
}

export function netIncomeDelta(type: AccountType, debitMinor: bigint, creditMinor: bigint): bigint {
  if (type === "Income") {
    return creditMinor - debitMinor;
  }
  if (type === "Expense") {
    return -(debitMinor - creditMinor);
  }
  return 0n;
}

export function isCashLikeAccount(account: ReportAccount): boolean {
  if (account.type !== "Asset") {
    return false;
  }

  const haystack = `${account.name} ${account.category ?? ""}`.toLowerCase();
  return /cash|bank|petty|wallet|checking|savings/.test(haystack);
}

export function normalizeAccountRows(rows: unknown[] | null): ReportAccount[] {
  if (!rows) {
    return [];
  }

  const accounts: ReportAccount[] = [];

  for (const rawRow of rows) {
    const row = asRecord(rawRow);
    if (!row) {
      continue;
    }

    const id = typeof row.id === "string" ? row.id : "";
    const name = typeof row.name === "string" ? row.name : "";
    const category = typeof row.category === "string" ? row.category : null;
    const typeRaw = row.type;
    const isDefault = row.is_default === true;

    if (!id || !name || !isAccountType(typeRaw)) {
      continue;
    }

    accounts.push({
      id,
      name,
      category,
      type: typeRaw,
      isDefault,
    });
  }

  return accounts;
}

export function normalizeLineRows(rows: unknown[] | null): ReportLine[] {
  if (!rows) {
    return [];
  }

  const lines: ReportLine[] = [];

  for (const rawRow of rows) {
    const row = asRecord(rawRow);
    if (!row) {
      continue;
    }

    const accountRow = normalizeNestedObject(row.accounts);
    const entryRow = normalizeNestedObject(row.journal_entries);
    if (!accountRow || !entryRow) {
      continue;
    }

    const accountTypeRaw = accountRow.type;
    const accountId = typeof accountRow.id === "string" ? accountRow.id : "";
    const accountName = typeof accountRow.name === "string" ? accountRow.name : "";
    const accountCategory = typeof accountRow.category === "string" ? accountRow.category : null;
    const accountDefault = accountRow.is_default === true;
    const date = typeof entryRow.date === "string" && isIsoDate(entryRow.date) ? entryRow.date : "";
    const description = typeof entryRow.description === "string" ? entryRow.description : "";

    if (!accountId || !accountName || !isAccountType(accountTypeRaw) || !date) {
      continue;
    }

    lines.push({
      accountId,
      account: {
        id: accountId,
        name: accountName,
        type: accountTypeRaw,
        category: accountCategory,
        isDefault: accountDefault,
      },
      date,
      description,
      debitMinor: toMinorUnits(row.debit),
      creditMinor: toMinorUnits(row.credit),
    });
  }

  return lines;
}
