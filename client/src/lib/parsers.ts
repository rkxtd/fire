import { createTransaction, type BudgetCategory, type Transaction } from "@/lib/db";

interface ParsedCsvRow {
  [key: string]: string;
}

export interface ParsedBudgetCategory {
  name: string;
  monthlyTarget: number;
  annualTarget: number;
  group: BudgetCategory["group"];
  color: string;
}

function splitCsvLine(line: string) {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];

    if (character === '"') {
      if (inQuotes && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (character === "," && !inQuotes) {
      cells.push(current.trim());
      current = "";
      continue;
    }

    current += character;
  }

  cells.push(current.trim());
  return cells;
}

function parseCsvRows(csvText: string) {
  const lines = csvText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    return [];
  }

  const headers = splitCsvLine(lines[0]).map((header) => header.toLowerCase());
  return lines.slice(1).map((line) => {
    const values = splitCsvLine(line);
    return headers.reduce<ParsedCsvRow>((row, header, index) => {
      row[header] = values[index] ?? "";
      return row;
    }, {});
  });
}

function getFirstPresentValue(row: ParsedCsvRow, candidates: string[]) {
  const match = candidates.find((candidate) => row[candidate] !== undefined);
  return match ? row[match] : "";
}

function normalizeDate(rawValue: string) {
  const cleaned = rawValue.trim();

  if (!cleaned) {
    return null;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) {
    return cleaned;
  }

  const slashMatch = cleaned.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (slashMatch) {
    const month = slashMatch[1].padStart(2, "0");
    const day = slashMatch[2].padStart(2, "0");
    const year = slashMatch[3].length === 2 ? `20${slashMatch[3]}` : slashMatch[3];
    return `${year}-${month}-${day}`;
  }

  const parsed = new Date(cleaned);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString().slice(0, 10);
}

function normalizeAmount(rawValue: string) {
  const normalized = rawValue.replace(/[$,\s]/g, "").replace(/[()]/g, "");
  const parsed = Number(normalized);

  if (Number.isNaN(parsed)) {
    return null;
  }

  const isNegative = rawValue.includes("(") || normalized.startsWith("-");
  return Math.abs(isNegative ? -parsed : parsed);
}

function resolveAmount(row: ParsedCsvRow) {
  const debit = normalizeAmount(getFirstPresentValue(row, ["debit", "withdrawal", "outflow"]));
  const credit = normalizeAmount(getFirstPresentValue(row, ["credit", "deposit", "inflow"]));
  const amount = normalizeAmount(getFirstPresentValue(row, ["amount", "value"]));

  if (debit !== null && debit > 0) {
    return { amount: debit, kind: "expense" as const };
  }

  if (credit !== null && credit > 0) {
    return { amount: credit, kind: "income" as const };
  }

  if (amount !== null) {
    return { amount: Math.abs(amount), kind: null };
  }

  return { amount: null, kind: null };
}

function inferKind(row: ParsedCsvRow) {
  const kindValue = getFirstPresentValue(row, ["kind", "type", "transaction type", "flow"]).toLowerCase();
  const categoryHint = getFirstPresentValue(row, ["category", "category name"]).toLowerCase();
  const descriptionHint = getFirstPresentValue(row, ["description", "memo", "payee"]).toLowerCase();

  if (kindValue.includes("income") || kindValue.includes("credit")) {
    return "income" as const;
  }

  if (kindValue.includes("expense") || kindValue.includes("debit")) {
    return "expense" as const;
  }

  if (categoryHint.includes("income") || descriptionHint.includes("payroll") || descriptionHint.includes("salary")) {
    return "income" as const;
  }

  return "expense" as const;
}

function matchCategory(description: string, categoryName: string) {
  return description.toLowerCase().includes(categoryName.toLowerCase());
}

function inferCategoryId(
  row: ParsedCsvRow,
  description: string,
  categories: BudgetCategory[],
) {
  const explicitCategory = getFirstPresentValue(row, ["category", "category name"]).toLowerCase();
  if (explicitCategory) {
    const directMatch = categories.find((category) => category.name.toLowerCase() === explicitCategory);
    if (directMatch) {
      return directMatch.id;
    }
  }

  const descriptionMatch = categories.find((category) => matchCategory(description, category.name));
  return descriptionMatch?.id;
}

export function parseCsvTransactions(csvText: string, categories: BudgetCategory[]) {
  const rows = parseCsvRows(csvText);
  const transactions: Transaction[] = [];

  for (const row of rows) {
    const date = normalizeDate(getFirstPresentValue(row, ["date", "posted date", "transaction date"]));
    const description = getFirstPresentValue(row, ["description", "memo", "payee", "details"]);
    const resolvedAmount = resolveAmount(row);

    if (!date || !description || resolvedAmount.amount === null) {
      continue;
    }

    const kind = resolvedAmount.kind ?? inferKind(row);
    transactions.push(
      createTransaction({
        date,
        description,
        amount: resolvedAmount.amount,
        kind,
        categoryId: inferCategoryId(row, description, categories),
        source: "csv",
      }),
    );
  }

  return transactions;
}

function inferCategoryGroup(name: string): BudgetCategory["group"] {
  const normalized = name.toLowerCase();

  if (
    normalized.includes("rent") ||
    normalized.includes("mortgage") ||
    normalized.includes("housing") ||
    normalized.includes("food") ||
    normalized.includes("grocery") ||
    normalized.includes("health") ||
    normalized.includes("insurance") ||
    normalized.includes("transport")
  ) {
    return "essentials";
  }

  if (
    normalized.includes("saving") ||
    normalized.includes("invest") ||
    normalized.includes("debt") ||
    normalized.includes("goal")
  ) {
    return "future";
  }

  return "lifestyle";
}

export function parseBudgetCategoriesCsv(csvText: string) {
  const rows = parseCsvRows(csvText);
  const categoryTotals = new Map<string, number>();

  for (const row of rows) {
    const groupName = getFirstPresentValue(row, ["category group", "group", "master category"]);
    const categoryName = getFirstPresentValue(row, ["category", "category name", "name"]);
    const combinedName = getFirstPresentValue(row, ["category group/category", "full category", "category path"]);
    const name = combinedName || [groupName, categoryName].filter(Boolean).join(" / ") || categoryName;
    const monthlyTarget =
      normalizeAmount(
        getFirstPresentValue(row, [
          "monthly target",
          "monthly budget",
          "budgeted",
          "assigned",
          "planned",
          "amount",
        ]),
      ) ?? 0;
    const annualTarget =
      normalizeAmount(getFirstPresentValue(row, ["annual target", "annual budget", "yearly target"])) ??
      monthlyTarget * 12;

    if (!name.trim() || (monthlyTarget <= 0 && annualTarget <= 0)) {
      continue;
    }

    const normalizedName = name.trim();
    const nextMonthlyTarget = monthlyTarget > 0 ? monthlyTarget : annualTarget / 12;
    categoryTotals.set(normalizedName, (categoryTotals.get(normalizedName) ?? 0) + nextMonthlyTarget);
  }

  return Array.from(categoryTotals.entries()).map<ParsedBudgetCategory>(([name, monthlyTarget], index) => ({
    name,
    monthlyTarget,
    annualTarget: monthlyTarget * 12,
    group: inferCategoryGroup(name),
    color: ["#2b7196", "#d9b44a", "#4d8570", "#c66a3d", "#4f6f95", "#94614a"][index % 6],
  }));
}
