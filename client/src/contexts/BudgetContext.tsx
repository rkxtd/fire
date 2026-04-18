import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  createBudgetCategory,
  createGoal,
  createLoan,
  createRecurringTemplate,
  createSavedScenario,
  createTransaction,
  db,
  generateTransactionHash,
  getAnnualSpending,
  getCurrentMonthSpending,
  getCurrentYearSpending,
  getFireGoalImpact,
  initDefaultCategories,
  type BudgetCategory,
  type Goal,
  type Loan,
  type RecurringTemplate,
  type SavedScenario,
  type Transaction,
} from "@/lib/db";
import {
  estimateGoalCompletion,
  getCategoryBudgetSummaries,
  getCurrentMonthBudget,
  getCurrentYearBudget,
  type CategoryBudgetSummary,
} from "@/lib/budget-analysis";
import { analyzeLoan, getLoanPortfolioSummary, type LoanAnalysis } from "@/lib/loan-analysis";
import { clearAllBudgetData, importBudgetData } from "@/lib/persistence";

interface GoalForecast {
  goalId: string;
  monthsRemaining: number | null;
  reachDate: string | null;
  isOnTrack: boolean;
}

interface BudgetContextValue {
  categories: BudgetCategory[];
  goals: Goal[];
  transactions: Transaction[];
  recurringTemplates: RecurringTemplate[];
  savedScenarios: SavedScenario[];
  loans: Loan[];
  categoryBudgetSummaries: CategoryBudgetSummary[];
  goalForecasts: GoalForecast[];
  loanAnalyses: Array<{ loanId: string; analysis: LoanAnalysis }>;
  annualSpendingFromBudget: number;
  fireGoalImpact: number;
  monthlyBudgetFromCategories: number;
  currentYearBudget: number;
  currentMonthSpending: number;
  currentYearSpending: number;
  loanPortfolioSummary: {
    totalRemainingBalance: number;
    totalMonthlyPayment: number;
    totalInterestRemaining: number;
  };
  isReady: boolean;
  addCategory: (values: Pick<BudgetCategory, "name" | "monthlyTarget" | "annualTarget" | "group" | "color" | "sortOrder">) => Promise<void>;
  updateCategory: (id: string, updates: Partial<BudgetCategory>) => Promise<void>;
  removeCategory: (id: string) => Promise<void>;
  addGoal: (
    values: Pick<Goal, "name" | "targetAmount" | "deadline" | "priority"> &
      Partial<Pick<Goal, "monthlyContribution">>,
  ) => Promise<void>;
  updateGoal: (id: string, updates: Partial<Goal>) => Promise<void>;
  removeGoal: (id: string) => Promise<void>;
  addRecurringTemplate: (
    values: Pick<
      RecurringTemplate,
      "name" | "amount" | "kind" | "frequency" | "startDate" | "dayOfMonth"
    > &
      Partial<Pick<RecurringTemplate, "categoryId" | "monthOfYear">>,
  ) => Promise<void>;
  updateRecurringTemplate: (id: string, updates: Partial<RecurringTemplate>) => Promise<void>;
  removeRecurringTemplate: (id: string) => Promise<void>;
  generateRecurringTransactions: () => Promise<{ created: number; skipped: number }>;
  addSavedScenario: (
    values: Pick<SavedScenario, "name" | "inputs" | "resultsSummary"> &
      Partial<Pick<SavedScenario, "description" | "color">>,
  ) => Promise<void>;
  updateSavedScenario: (id: string, updates: Partial<SavedScenario>) => Promise<void>;
  removeSavedScenario: (id: string) => Promise<void>;
  addLoan: (
    values: Pick<
      Loan,
      "name" | "type" | "originalAmount" | "remainingBalance" | "apr" | "termMonths" | "startDate"
    > &
      Partial<
        Pick<
          Loan,
          "monthlyExtraPayment" | "annualPropertyTax" | "annualHomeInsurance" | "monthlyPmi" | "monthlyHoa"
        >
      >,
  ) => Promise<void>;
  updateLoan: (id: string, updates: Partial<Loan>) => Promise<void>;
  removeLoan: (id: string) => Promise<void>;
  addTransaction: (values: Pick<Transaction, "date" | "amount" | "description" | "kind"> & Partial<Pick<Transaction, "categoryId" | "notes">>) => Promise<void>;
  updateTransaction: (id: string, updates: Partial<Transaction>) => Promise<void>;
  removeTransaction: (id: string) => Promise<void>;
  importTransactions: (transactions: Transaction[]) => Promise<{ imported: number; skipped: number }>;
  replaceAllData: (data: {
    categories: BudgetCategory[];
    goals: Goal[];
    transactions: Transaction[];
    recurringTemplates: RecurringTemplate[];
    savedScenarios: SavedScenario[];
    loans: Loan[];
  }) => Promise<void>;
  clearAll: () => Promise<void>;
}

const BudgetContext = createContext<BudgetContextValue | null>(null);

export function BudgetProvider({ children }: PropsWithChildren) {
  const [categories, setCategories] = useState<BudgetCategory[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [recurringTemplates, setRecurringTemplates] = useState<RecurringTemplate[]>([]);
  const [savedScenarios, setSavedScenarios] = useState<SavedScenario[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [isReady, setIsReady] = useState(false);

  const refresh = useCallback(async () => {
    const [
      nextCategories,
      nextGoals,
      nextTransactions,
      nextRecurringTemplates,
      nextSavedScenarios,
      nextLoans,
    ] = await Promise.all([
      db.budgetCategories.orderBy("sortOrder").toArray(),
      db.goals.orderBy("deadline").toArray(),
      db.transactions.orderBy("date").reverse().toArray(),
      db.recurringTemplates.orderBy("name").toArray(),
      db.savedScenarios.orderBy("createdAt").reverse().toArray(),
      db.loans.orderBy("name").toArray(),
    ]);

    setCategories(nextCategories);
    setGoals(nextGoals);
    setTransactions(nextTransactions);
    setRecurringTemplates(nextRecurringTemplates);
    setSavedScenarios(nextSavedScenarios);
    setLoans(nextLoans);
    setIsReady(true);
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function boot() {
      await initDefaultCategories();
      if (!isMounted) {
        return;
      }
      await refresh();
    }

    void boot();

    return () => {
      isMounted = false;
    };
  }, [refresh]);

  const value = useMemo<BudgetContextValue>(
    () => ({
      categories,
      goals,
      transactions,
      recurringTemplates,
      savedScenarios,
      loans,
      categoryBudgetSummaries: getCategoryBudgetSummaries(categories, transactions),
      goalForecasts: goals.map((goal) => ({
        goalId: goal.id,
        ...estimateGoalCompletion(goal),
      })),
      loanAnalyses: loans.map((loan) => ({
        loanId: loan.id,
        analysis: analyzeLoan(loan),
      })),
      annualSpendingFromBudget: getAnnualSpending(categories),
      fireGoalImpact: getFireGoalImpact(goals),
      monthlyBudgetFromCategories: getCurrentMonthBudget(categories),
      currentYearBudget: getCurrentYearBudget(categories),
      currentMonthSpending: getCurrentMonthSpending(transactions),
      currentYearSpending: getCurrentYearSpending(transactions),
      loanPortfolioSummary: getLoanPortfolioSummary(loans),
      isReady,
      addCategory: async (values) => {
        await db.budgetCategories.add(createBudgetCategory(values));
        await refresh();
      },
      updateCategory: async (id, updates) => {
        await db.budgetCategories.update(id, {
          ...updates,
          updatedAt: new Date().toISOString(),
        });
        await refresh();
      },
      removeCategory: async (id) => {
        await db.budgetCategories.delete(id);
        await refresh();
      },
      addGoal: async (values) => {
        await db.goals.add(createGoal(values));
        await refresh();
      },
      updateGoal: async (id, updates) => {
        await db.goals.update(id, {
          ...updates,
          updatedAt: new Date().toISOString(),
        });
        await refresh();
      },
      removeGoal: async (id) => {
        await db.goals.delete(id);
        await refresh();
      },
      addRecurringTemplate: async (values) => {
        await db.recurringTemplates.add(createRecurringTemplate(values));
        await refresh();
      },
      updateRecurringTemplate: async (id, updates) => {
        await db.recurringTemplates.update(id, {
          ...updates,
          updatedAt: new Date().toISOString(),
        });
        await refresh();
      },
      removeRecurringTemplate: async (id) => {
        await db.recurringTemplates.delete(id);
        await refresh();
      },
      generateRecurringTransactions: async () => {
        const existingHashes = new Set(transactions.map((transaction) => transaction.hash));
        const today = new Date();
        const createdTransactions: Transaction[] = [];
        let skipped = 0;

        for (const template of recurringTemplates.filter((item) => item.isActive)) {
          const startDate = new Date(template.startDate);
          const cursor = template.lastGeneratedDate ? new Date(template.lastGeneratedDate) : new Date(startDate);

          if (template.frequency === "monthly") {
            cursor.setDate(1);
            while (cursor <= today) {
              const occurrence = new Date(
                cursor.getFullYear(),
                cursor.getMonth(),
                Math.min(
                  template.dayOfMonth,
                  new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate(),
                ),
              );

              if (occurrence >= startDate && occurrence <= today) {
                const transaction = createTransaction({
                  date: occurrence.toISOString().slice(0, 10),
                  amount: template.amount,
                  description: template.name,
                  kind: template.kind,
                  categoryId: template.categoryId,
                  source: "manual",
                });

                if (existingHashes.has(transaction.hash)) {
                  skipped += 1;
                } else {
                  existingHashes.add(transaction.hash);
                  createdTransactions.push(transaction);
                }
              }

              cursor.setMonth(cursor.getMonth() + 1);
            }
          } else {
            let year = cursor.getFullYear();
            while (year <= today.getFullYear()) {
              const occurrence = new Date(
                year,
                Math.max((template.monthOfYear ?? startDate.getMonth() + 1) - 1, 0),
                template.dayOfMonth,
              );

              if (occurrence >= startDate && occurrence <= today) {
                const transaction = createTransaction({
                  date: occurrence.toISOString().slice(0, 10),
                  amount: template.amount,
                  description: template.name,
                  kind: template.kind,
                  categoryId: template.categoryId,
                  source: "manual",
                });

                if (existingHashes.has(transaction.hash)) {
                  skipped += 1;
                } else {
                  existingHashes.add(transaction.hash);
                  createdTransactions.push(transaction);
                }
              }

              year += 1;
            }
          }

          await db.recurringTemplates.update(template.id, {
            lastGeneratedDate: today.toISOString().slice(0, 10),
            updatedAt: new Date().toISOString(),
          });
        }

        if (createdTransactions.length > 0) {
          await db.transactions.bulkAdd(createdTransactions);
        }
        await refresh();

        return { created: createdTransactions.length, skipped };
      },
      addSavedScenario: async (values) => {
        await db.savedScenarios.add(createSavedScenario(values));
        await refresh();
      },
      updateSavedScenario: async (id, updates) => {
        await db.savedScenarios.update(id, {
          ...updates,
          updatedAt: new Date().toISOString(),
        });
        await refresh();
      },
      removeSavedScenario: async (id) => {
        await db.savedScenarios.delete(id);
        await refresh();
      },
      addLoan: async (values) => {
        await db.loans.add(createLoan(values));
        await refresh();
      },
      updateLoan: async (id, updates) => {
        await db.loans.update(id, {
          ...updates,
          updatedAt: new Date().toISOString(),
        });
        await refresh();
      },
      removeLoan: async (id) => {
        await db.loans.delete(id);
        await refresh();
      },
      addTransaction: async (values) => {
        await db.transactions.add(createTransaction(values));
        await refresh();
      },
      updateTransaction: async (id, updates) => {
        const existing = transactions.find((transaction) => transaction.id === id);
        const nextTransaction = existing ? { ...existing, ...updates } : null;

        await db.transactions.update(id, {
          ...updates,
          ...(nextTransaction
            ? {
                hash: generateTransactionHash({
                  date: nextTransaction.date,
                  amount: nextTransaction.amount,
                  description: nextTransaction.description,
                  kind: nextTransaction.kind,
                }),
              }
            : {}),
        });
        await refresh();
      },
      removeTransaction: async (id) => {
        await db.transactions.delete(id);
        await refresh();
      },
      importTransactions: async (incomingTransactions) => {
        const existingHashes = new Set((await db.transactions.toArray()).map((transaction) => transaction.hash));
        const uniqueTransactions = incomingTransactions.filter((transaction) => !existingHashes.has(transaction.hash));

        if (uniqueTransactions.length > 0) {
          await db.transactions.bulkAdd(uniqueTransactions);
          await refresh();
        }

        return {
          imported: uniqueTransactions.length,
          skipped: incomingTransactions.length - uniqueTransactions.length,
        };
      },
      replaceAllData: async (data) => {
        await importBudgetData(data);
        await refresh();
      },
      clearAll: async () => {
        await clearAllBudgetData();
        await initDefaultCategories();
        await refresh();
      },
    }),
    [categories, goals, isReady, loans, recurringTemplates, refresh, savedScenarios, transactions],
  );

  return <BudgetContext.Provider value={value}>{children}</BudgetContext.Provider>;
}

export function useBudget() {
  const context = useContext(BudgetContext);
  if (!context) {
    throw new Error("useBudget must be used within BudgetProvider");
  }

  return context;
}
