import Dexie, { type EntityTable } from "dexie";
import { nanoid } from "nanoid";

export interface BudgetCategory {
  id: string;
  name: string;
  monthlyTarget: number;
  annualTarget: number;
  color: string;
  group: "essentials" | "lifestyle" | "future";
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  monthlyContribution: number;
  deadline: string;
  priority: "high" | "medium" | "low";
  impactsFire: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  date: string;
  amount: number;
  description: string;
  kind: "expense" | "income";
  categoryId?: string;
  source: "manual" | "csv";
  notes?: string;
  hash: string;
  createdAt: string;
}

export interface RecurringTemplate {
  id: string;
  name: string;
  amount: number;
  kind: "expense" | "income";
  categoryId?: string;
  frequency: "monthly" | "yearly";
  startDate: string;
  dayOfMonth: number;
  monthOfYear?: number;
  isActive: boolean;
  lastGeneratedDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SavedScenario {
  id: string;
  name: string;
  description?: string;
  color: string;
  inputs: string;
  resultsSummary: string;
  createdAt: string;
  updatedAt: string;
}

export interface Loan {
  id: string;
  name: string;
  type: "mortgage" | "auto" | "student" | "personal" | "other";
  originalAmount: number;
  remainingBalance: number;
  apr: number;
  termMonths: number;
  monthlyExtraPayment: number;
  annualPropertyTax: number;
  annualHomeInsurance: number;
  monthlyPmi: number;
  monthlyHoa: number;
  startDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const DEFAULT_BUDGET_CATEGORIES: Array<
  Omit<BudgetCategory, "id" | "createdAt" | "updatedAt">
> = [
  {
    name: "Housing",
    monthlyTarget: 2400,
    annualTarget: 28800,
    color: "#0f6b88",
    group: "essentials",
    sortOrder: 1,
    isActive: true,
  },
  {
    name: "Food",
    monthlyTarget: 900,
    annualTarget: 10800,
    color: "#4d8570",
    group: "essentials",
    sortOrder: 2,
    isActive: true,
  },
  {
    name: "Transportation",
    monthlyTarget: 650,
    annualTarget: 7800,
    color: "#4f6f95",
    group: "essentials",
    sortOrder: 3,
    isActive: true,
  },
  {
    name: "Travel and Fun",
    monthlyTarget: 700,
    annualTarget: 8400,
    color: "#c66a3d",
    group: "lifestyle",
    sortOrder: 4,
    isActive: true,
  },
  {
    name: "Healthcare",
    monthlyTarget: 450,
    annualTarget: 5400,
    color: "#7f5c9d",
    group: "essentials",
    sortOrder: 5,
    isActive: true,
  },
  {
    name: "Giving and Family",
    monthlyTarget: 350,
    annualTarget: 4200,
    color: "#94614a",
    group: "future",
    sortOrder: 6,
    isActive: true,
  },
];

export class FireCalculatorDB extends Dexie {
  budgetCategories!: EntityTable<BudgetCategory, "id">;
  goals!: EntityTable<Goal, "id">;
  transactions!: EntityTable<Transaction, "id">;
  recurringTemplates!: EntityTable<RecurringTemplate, "id">;
  savedScenarios!: EntityTable<SavedScenario, "id">;
  loans!: EntityTable<Loan, "id">;

  public constructor() {
    super("FireCalculatorDB");

    this.version(1).stores({
      budgetCategories: "id, name, group, sortOrder, isActive",
      goals: "id, name, priority, impactsFire, deadline",
      transactions: "id, date, kind, categoryId",
    });

    this.version(2)
      .stores({
        budgetCategories: "id, name, group, sortOrder, isActive",
        goals: "id, name, priority, impactsFire, deadline",
        transactions: "id, date, kind, categoryId, hash",
        recurringTemplates: "id, name, frequency, isActive, startDate",
      })
      .upgrade(async (transaction) => {
        await transaction
          .table("budgetCategories")
          .toCollection()
          .modify((category: Partial<BudgetCategory>) => {
            if (category.annualTarget === undefined && category.monthlyTarget !== undefined) {
              category.annualTarget = category.monthlyTarget * 12;
            }
          });

        await transaction
          .table("goals")
          .toCollection()
          .modify((goal: Partial<Goal>) => {
            if (goal.monthlyContribution === undefined) {
              goal.monthlyContribution = 0;
            }
          });

        await transaction
          .table("transactions")
          .toCollection()
          .modify((record: Partial<Transaction>) => {
            if (!record.source) {
              record.source = "manual";
            }
            if (!record.hash && record.date && record.amount !== undefined && record.description && record.kind) {
              record.hash = generateTransactionHash({
                date: record.date,
                amount: record.amount,
                description: record.description,
                kind: record.kind,
              });
            }
              });
          });

    this.version(3).stores({
      budgetCategories: "id, name, group, sortOrder, isActive",
      goals: "id, name, priority, impactsFire, deadline",
      transactions: "id, date, kind, categoryId, hash",
      recurringTemplates: "id, name, frequency, isActive, startDate",
      savedScenarios: "id, name, createdAt",
    });

    this.version(4).stores({
      budgetCategories: "id, name, group, sortOrder, isActive",
      goals: "id, name, priority, impactsFire, deadline",
      transactions: "id, date, kind, categoryId, hash",
      recurringTemplates: "id, name, frequency, isActive, startDate",
      savedScenarios: "id, name, createdAt",
      loans: "id, name, type, isActive, startDate",
    });
  }
}

export const db = new FireCalculatorDB();

export async function initDefaultCategories() {
  const existingCount = await db.budgetCategories.count();
  if (existingCount > 0) {
    return;
  }

  const now = new Date().toISOString();
  await db.budgetCategories.bulkAdd(
    DEFAULT_BUDGET_CATEGORIES.map((category) => ({
      ...category,
      id: nanoid(),
      createdAt: now,
      updatedAt: now,
    })),
  );
}

export function createBudgetCategory(
  values: Pick<BudgetCategory, "name" | "monthlyTarget" | "annualTarget" | "group" | "color" | "sortOrder">,
): BudgetCategory {
  const now = new Date().toISOString();

  return {
    id: nanoid(),
    createdAt: now,
    updatedAt: now,
    isActive: true,
    ...values,
  };
}

export function createGoal(
  values: Pick<Goal, "name" | "targetAmount" | "deadline" | "priority"> &
    Partial<Pick<Goal, "monthlyContribution">>,
): Goal {
  const now = new Date().toISOString();

  return {
    id: nanoid(),
    name: values.name,
    targetAmount: values.targetAmount,
    currentAmount: 0,
    monthlyContribution: values.monthlyContribution ?? 0,
    deadline: values.deadline,
    priority: values.priority,
    impactsFire: true,
    createdAt: now,
    updatedAt: now,
  };
}

export function createRecurringTemplate(
  values: Pick<
    RecurringTemplate,
    "name" | "amount" | "kind" | "frequency" | "startDate" | "dayOfMonth"
  > &
    Partial<Pick<RecurringTemplate, "categoryId" | "monthOfYear">>,
): RecurringTemplate {
  const now = new Date().toISOString();

  return {
    id: nanoid(),
    name: values.name.trim(),
    amount: values.amount,
    kind: values.kind,
    categoryId: values.categoryId,
    frequency: values.frequency,
    startDate: values.startDate,
    dayOfMonth: values.dayOfMonth,
    monthOfYear: values.monthOfYear,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };
}

export function createSavedScenario(values: Pick<SavedScenario, "name" | "inputs" | "resultsSummary"> & Partial<Pick<SavedScenario, "description" | "color">>): SavedScenario {
  const now = new Date().toISOString();

  return {
    id: nanoid(),
    name: values.name.trim(),
    description: values.description?.trim(),
    color: values.color ?? "#0f6b88",
    inputs: values.inputs,
    resultsSummary: values.resultsSummary,
    createdAt: now,
    updatedAt: now,
  };
}

export function createLoan(
  values: Pick<
    Loan,
    | "name"
    | "type"
    | "originalAmount"
    | "remainingBalance"
    | "apr"
    | "termMonths"
    | "startDate"
  > &
    Partial<
      Pick<
        Loan,
        | "monthlyExtraPayment"
        | "annualPropertyTax"
        | "annualHomeInsurance"
        | "monthlyPmi"
        | "monthlyHoa"
      >
    >,
): Loan {
  const now = new Date().toISOString();

  return {
    id: nanoid(),
    name: values.name.trim(),
    type: values.type,
    originalAmount: values.originalAmount,
    remainingBalance: values.remainingBalance,
    apr: values.apr,
    termMonths: values.termMonths,
    monthlyExtraPayment: values.monthlyExtraPayment ?? 0,
    annualPropertyTax: values.annualPropertyTax ?? 0,
    annualHomeInsurance: values.annualHomeInsurance ?? 0,
    monthlyPmi: values.monthlyPmi ?? 0,
    monthlyHoa: values.monthlyHoa ?? 0,
    startDate: values.startDate,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };
}

export function generateTransactionHash(values: Pick<Transaction, "date" | "amount" | "description" | "kind">) {
  return [values.date, values.amount.toFixed(2), values.kind, values.description.trim().toLowerCase()].join("|");
}

export function createTransaction(
  values: Pick<Transaction, "date" | "amount" | "description" | "kind"> &
    Partial<Pick<Transaction, "categoryId" | "source" | "notes">>,
): Transaction {
  const now = new Date().toISOString();

  return {
    id: nanoid(),
    date: values.date,
    amount: values.amount,
    description: values.description.trim(),
    kind: values.kind,
    categoryId: values.categoryId,
    source: values.source ?? "manual",
    notes: values.notes,
    hash: generateTransactionHash(values),
    createdAt: now,
  };
}

export function getAnnualSpending(categories: BudgetCategory[]) {
  return categories
    .filter((category) => category.isActive)
    .reduce((total, category) => total + category.annualTarget, 0);
}

export function getFireGoalImpact(goals: Goal[]) {
  return goals
    .filter((goal) => goal.impactsFire)
    .reduce((total, goal) => total + Math.max(goal.targetAmount - goal.currentAmount, 0), 0);
}

export function getCurrentMonthSpending(transactions: Transaction[]) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  return transactions
    .filter((transaction) => {
      const transactionDate = new Date(transaction.date);
      return (
        transaction.kind === "expense" &&
        transactionDate.getFullYear() === year &&
        transactionDate.getMonth() === month
      );
    })
    .reduce((total, transaction) => total + transaction.amount, 0);
}

export function getCurrentYearSpending(transactions: Transaction[]) {
  const year = new Date().getFullYear();

  return transactions
    .filter((transaction) => {
      const transactionDate = new Date(transaction.date);
      return transaction.kind === "expense" && transactionDate.getFullYear() === year;
    })
    .reduce((total, transaction) => total + transaction.amount, 0);
}
