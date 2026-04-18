import { useRef, useState } from "react";
import { Flag, Plus, RefreshCw, Trash2, Upload, Wallet } from "lucide-react";

import { useCalculator } from "@/contexts/CalculatorContext";
import { useBudget } from "@/contexts/BudgetContext";
import { inflateCost } from "@/lib/budget-analysis";
import { parseCsvTransactions } from "@/lib/parsers";

interface BudgetPlannerPanelProps {
  useBudgetSpending: boolean;
  onUseBudgetSpendingChange: (nextValue: boolean) => void;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function BudgetPlannerPanel({
  useBudgetSpending,
  onUseBudgetSpendingChange,
}: BudgetPlannerPanelProps) {
  const { inputs } = useCalculator();
  const {
    categories,
    goals,
    annualSpendingFromBudget,
    fireGoalImpact,
    monthlyBudgetFromCategories,
    currentYearBudget,
    currentMonthSpending,
    currentYearSpending,
    categoryBudgetSummaries,
    goalForecasts,
    isReady,
    addCategory,
    updateCategory,
    removeCategory,
    addGoal,
    updateGoal,
    removeGoal,
    recurringTemplates,
    addRecurringTemplate,
    updateRecurringTemplate,
    removeRecurringTemplate,
    generateRecurringTransactions,
    addTransaction,
    updateTransaction,
    removeTransaction,
    importTransactions,
    transactions,
  } = useBudget();
  const yearsToRetirement = Math.max(inputs.targetRetirementAge - inputs.currentAge, 0);
  const annualBudgetAtRetirement = inflateCost(
    currentYearBudget,
    yearsToRetirement,
    inputs.inflationRate,
  );

  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryTarget, setNewCategoryTarget] = useState(500);
  const [newCategoryAnnualTarget, setNewCategoryAnnualTarget] = useState(6000);
  const [newGoalName, setNewGoalName] = useState("");
  const [newGoalTarget, setNewGoalTarget] = useState(25000);
  const [newGoalMonthlyContribution, setNewGoalMonthlyContribution] = useState(500);
  const [newGoalDeadline, setNewGoalDeadline] = useState("2030-12-31");
  const [newRecurringName, setNewRecurringName] = useState("");
  const [newRecurringAmount, setNewRecurringAmount] = useState(150);
  const [newRecurringKind, setNewRecurringKind] = useState<"expense" | "income">("expense");
  const [newRecurringFrequency, setNewRecurringFrequency] = useState<"monthly" | "yearly">("monthly");
  const [newRecurringStartDate, setNewRecurringStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [newRecurringDayOfMonth, setNewRecurringDayOfMonth] = useState(1);
  const [newRecurringMonthOfYear, setNewRecurringMonthOfYear] = useState(1);
  const [newRecurringCategoryId, setNewRecurringCategoryId] = useState("");
  const [newTransactionDate, setNewTransactionDate] = useState(new Date().toISOString().slice(0, 10));
  const [newTransactionDescription, setNewTransactionDescription] = useState("");
  const [newTransactionAmount, setNewTransactionAmount] = useState(120);
  const [newTransactionKind, setNewTransactionKind] = useState<"expense" | "income">("expense");
  const [newTransactionCategoryId, setNewTransactionCategoryId] = useState("");
  const [transactionImportMessage, setTransactionImportMessage] = useState<string | null>(null);
  const [recurringMessage, setRecurringMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  async function handleAddCategory() {
    if (!newCategoryName.trim()) {
      return;
    }

    await addCategory({
      name: newCategoryName.trim(),
      monthlyTarget: newCategoryTarget,
      annualTarget: newCategoryAnnualTarget,
      group: "essentials",
      color: "#0f6b88",
      sortOrder: categories.length + 1,
    });
    setNewCategoryName("");
    setNewCategoryTarget(500);
    setNewCategoryAnnualTarget(6000);
  }

  async function handleAddGoal() {
    if (!newGoalName.trim()) {
      return;
    }

    await addGoal({
      name: newGoalName.trim(),
      targetAmount: newGoalTarget,
      deadline: newGoalDeadline,
      priority: "medium",
      monthlyContribution: newGoalMonthlyContribution,
    });
    setNewGoalName("");
    setNewGoalTarget(25000);
    setNewGoalMonthlyContribution(500);
  }

  async function handleAddRecurringTemplate() {
    if (!newRecurringName.trim()) {
      return;
    }

    await addRecurringTemplate({
      name: newRecurringName.trim(),
      amount: Math.abs(newRecurringAmount),
      kind: newRecurringKind,
      frequency: newRecurringFrequency,
      startDate: newRecurringStartDate,
      dayOfMonth: newRecurringDayOfMonth,
      monthOfYear: newRecurringFrequency === "yearly" ? newRecurringMonthOfYear : undefined,
      categoryId: newRecurringCategoryId || undefined,
    });
    setNewRecurringName("");
    setNewRecurringAmount(150);
    setRecurringMessage(null);
  }

  async function handleAddTransaction() {
    if (!newTransactionDescription.trim()) {
      return;
    }

    await addTransaction({
      date: newTransactionDate,
      description: newTransactionDescription.trim(),
      amount: Math.abs(newTransactionAmount),
      kind: newTransactionKind,
      categoryId: newTransactionCategoryId || undefined,
    });
    setNewTransactionDescription("");
    setNewTransactionAmount(120);
    setTransactionImportMessage(null);
  }

  async function handleCsvImport(file: File | null) {
    if (!file) {
      return;
    }

    const csvText = await file.text();
    const parsedTransactions = parseCsvTransactions(csvText, categories);
    const result = await importTransactions(parsedTransactions);
    setTransactionImportMessage(
      result.skipped > 0
        ? `Imported ${result.imported} transactions and skipped ${result.skipped} duplicates.`
        : `Imported ${result.imported} transactions.`,
    );
  }

  async function handleGenerateRecurring() {
    const result = await generateRecurringTransactions();
    setRecurringMessage(
      result.skipped > 0
        ? `Generated ${result.created} recurring transactions and skipped ${result.skipped} already-present entries.`
        : `Generated ${result.created} recurring transactions.`,
    );
  }

  return (
    <section className="panel budget-panel">
      <div className="section-head">
        <div>
          <p className="eyebrow">Budget Planner</p>
          <h2>Living-cost inputs</h2>
        </div>
        <label className="toggle-card">
          <input
            checked={useBudgetSpending}
            onChange={(event) => onUseBudgetSpendingChange(event.target.checked)}
            type="checkbox"
          />
          <span>Use budget totals in FIRE math</span>
        </label>
      </div>

      <div className="budget-summary-grid">
        <article className="summary-tile">
          <Wallet size={18} />
          <span>Monthly plan</span>
          <strong>{formatCurrency(monthlyBudgetFromCategories)}</strong>
        </article>
        <article className="summary-tile">
          <Wallet size={18} />
          <span>Annual plan</span>
          <strong>{formatCurrency(annualSpendingFromBudget)}</strong>
        </article>
        <article className="summary-tile">
          <Flag size={18} />
          <span>Goals impacting FIRE</span>
          <strong>{formatCurrency(fireGoalImpact)}</strong>
        </article>
        <article className="summary-tile">
          <Wallet size={18} />
          <span>This month actual</span>
          <strong>{formatCurrency(currentMonthSpending)}</strong>
        </article>
        <article className="summary-tile">
          <Wallet size={18} />
          <span>This year plan</span>
          <strong>{formatCurrency(currentYearBudget)}</strong>
          <small className="muted">
            {formatCurrency(annualBudgetAtRetirement)} in retirement-year dollars
          </small>
        </article>
        <article className="summary-tile">
          <Wallet size={18} />
          <span>This year actual</span>
          <strong>{formatCurrency(currentYearSpending)}</strong>
        </article>
      </div>

      {!isReady ? <p className="muted">Loading budget data…</p> : null}

      <div className="budget-grid">
        <div className="budget-column">
          <div className="mini-head">
            <h3>Categories</h3>
            <p className="muted">Monthly targets used for planning expenses.</p>
          </div>
          <div className="editor-card category-editor">
            <input
              className="editor-input"
              onChange={(event) => setNewCategoryName(event.target.value)}
              placeholder="New category"
              type="text"
              value={newCategoryName}
            />
            <input
              className="editor-input"
              min={0}
              onChange={(event) => setNewCategoryTarget(Number(event.target.value))}
              step={50}
              type="number"
              value={newCategoryTarget}
            />
            <input
              className="editor-input"
              min={0}
              onChange={(event) => setNewCategoryAnnualTarget(Number(event.target.value))}
              step={100}
              type="number"
              value={newCategoryAnnualTarget}
            />
            <button className="icon-button" onClick={() => void handleAddCategory()} type="button">
              <Plus size={16} />
            </button>
          </div>
          <div className="list-stack">
            {categories.map((category) => (
              <div className="list-row" key={category.id}>
                <input
                  className="editor-input"
                  onChange={(event) =>
                    void updateCategory(category.id, {
                      name: event.target.value,
                    })
                  }
                  type="text"
                  value={category.name}
                />
                <input
                  className="editor-input compact"
                  min={0}
                  onChange={(event) =>
                    void updateCategory(category.id, {
                      monthlyTarget: Number(event.target.value),
                    })
                  }
                  step={50}
                  type="number"
                  value={category.monthlyTarget}
                />
                <input
                  className="editor-input compact"
                  min={0}
                  onChange={(event) =>
                    void updateCategory(category.id, {
                      annualTarget: Number(event.target.value),
                    })
                  }
                  step={100}
                  type="number"
                  value={category.annualTarget}
                />
                <label className="tiny-toggle">
                  <input
                    checked={category.isActive}
                    onChange={(event) =>
                      void updateCategory(category.id, {
                        isActive: event.target.checked,
                      })
                    }
                    type="checkbox"
                  />
                  <span>Active</span>
                </label>
                <button className="icon-button subtle" onClick={() => void removeCategory(category.id)} type="button">
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="budget-column">
          <div className="mini-head">
            <h3>Goals</h3>
            <p className="muted">Savings goals that may compete with retirement contributions.</p>
          </div>
          <div className="editor-card goal-editor">
            <input
              className="editor-input"
              onChange={(event) => setNewGoalName(event.target.value)}
              placeholder="New goal"
              type="text"
              value={newGoalName}
            />
            <input
              className="editor-input compact"
              min={0}
              onChange={(event) => setNewGoalTarget(Number(event.target.value))}
              step={500}
              type="number"
              value={newGoalTarget}
            />
            <input
              className="editor-input compact"
              min={0}
              onChange={(event) => setNewGoalMonthlyContribution(Number(event.target.value))}
              step={50}
              type="number"
              value={newGoalMonthlyContribution}
            />
            <input
              className="editor-input compact"
              onChange={(event) => setNewGoalDeadline(event.target.value)}
              type="date"
              value={newGoalDeadline}
            />
            <button className="icon-button" onClick={() => void handleAddGoal()} type="button">
              <Plus size={16} />
            </button>
          </div>
          <div className="list-stack">
            {goals.map((goal) => (
              <div className="goal-row" key={goal.id}>
                <div className="goal-main">
                  <input
                    className="editor-input"
                    onChange={(event) =>
                      void updateGoal(goal.id, {
                        name: event.target.value,
                      })
                    }
                    type="text"
                    value={goal.name}
                  />
                  <div className="goal-fields">
                    <input
                      className="editor-input compact"
                      min={0}
                      onChange={(event) =>
                        void updateGoal(goal.id, {
                          targetAmount: Number(event.target.value),
                        })
                      }
                      step={500}
                      type="number"
                      value={goal.targetAmount}
                    />
                    <input
                      className="editor-input compact"
                      min={0}
                      onChange={(event) =>
                        void updateGoal(goal.id, {
                          currentAmount: Number(event.target.value),
                        })
                      }
                      step={500}
                      type="number"
                      value={goal.currentAmount}
                    />
                    <input
                      className="editor-input compact"
                      min={0}
                      onChange={(event) =>
                        void updateGoal(goal.id, {
                          monthlyContribution: Number(event.target.value),
                        })
                      }
                      step={50}
                      type="number"
                      value={goal.monthlyContribution}
                    />
                    <input
                      className="editor-input compact"
                      onChange={(event) =>
                        void updateGoal(goal.id, {
                          deadline: event.target.value,
                        })
                      }
                      type="date"
                      value={goal.deadline}
                    />
                  </div>
                  <div className="goal-forecast-row">
                    {(() => {
                      const forecast = goalForecasts.find((item) => item.goalId === goal.id);
                      if (!forecast || !forecast.reachDate) {
                        return <span className="muted">No completion forecast yet</span>;
                      }
                      const inflationYears =
                        forecast.monthsRemaining !== null ? forecast.monthsRemaining / 12 : 0;
                      const inflatedTarget = inflateCost(
                        goal.targetAmount,
                        inflationYears,
                        inputs.inflationRate,
                      );

                      return (
                        <span className={forecast.isOnTrack ? "forecast-good" : "forecast-risk"}>
                          Expected reach date {forecast.reachDate}
                          {forecast.monthsRemaining !== null ? ` in ${forecast.monthsRemaining} months` : ""}
                          {` · target grows to ${formatCurrency(inflatedTarget)} with inflation`}
                        </span>
                      );
                    })()}
                  </div>
                </div>
                <label className="tiny-toggle">
                  <input
                    checked={goal.impactsFire}
                    onChange={(event) =>
                      void updateGoal(goal.id, {
                        impactsFire: event.target.checked,
                      })
                    }
                    type="checkbox"
                  />
                  <span>Impacts FIRE</span>
                </label>
                <button className="icon-button subtle" onClick={() => void removeGoal(goal.id)} type="button">
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="budget-analysis-shell">
        <div className="section-head">
          <div>
            <h2>Budget tracking</h2>
            <p className="muted">Compare category targets against actual spending this month and this year.</p>
          </div>
        </div>
        <div className="list-stack budget-analysis-list">
          {categoryBudgetSummaries.map((summary) => (
            <div className="budget-analysis-row" key={summary.id}>
              <strong>{summary.name}</strong>
              <span>Month {formatCurrency(summary.monthActual)} / {formatCurrency(summary.monthlyTarget)}</span>
              <span>Year {formatCurrency(summary.yearActual)} / {formatCurrency(summary.annualTarget)}</span>
              <span>
                Retirement-year annual cost {formatCurrency(
                  inflateCost(summary.annualTarget, yearsToRetirement, inputs.inflationRate),
                )}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="recurring-shell">
        <div className="section-head">
          <div>
            <h2>Recurring transactions</h2>
            <p className="muted">Create monthly or yearly templates, then generate due entries into the ledger.</p>
          </div>
          <button className="secondary-action-button" onClick={() => void handleGenerateRecurring()} type="button">
            <RefreshCw size={16} />
            <span>Generate due</span>
          </button>
        </div>
        <div className="editor-card recurring-editor">
          <input
            className="editor-input"
            onChange={(event) => setNewRecurringName(event.target.value)}
            placeholder="Rent, salary, insurance..."
            type="text"
            value={newRecurringName}
          />
          <input
            className="editor-input compact"
            min={0}
            onChange={(event) => setNewRecurringAmount(Number(event.target.value))}
            step={1}
            type="number"
            value={newRecurringAmount}
          />
          <select
            className="editor-input compact"
            onChange={(event) => setNewRecurringKind(event.target.value as "expense" | "income")}
            value={newRecurringKind}
          >
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
          <select
            className="editor-input compact"
            onChange={(event) => setNewRecurringFrequency(event.target.value as "monthly" | "yearly")}
            value={newRecurringFrequency}
          >
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
          <input
            className="editor-input compact"
            min={1}
            max={31}
            onChange={(event) => setNewRecurringDayOfMonth(Number(event.target.value))}
            step={1}
            type="number"
            value={newRecurringDayOfMonth}
          />
          <input
            className="editor-input compact"
            onChange={(event) => setNewRecurringStartDate(event.target.value)}
            type="date"
            value={newRecurringStartDate}
          />
          <select
            className="editor-input compact"
            onChange={(event) => setNewRecurringMonthOfYear(Number(event.target.value))}
            value={newRecurringMonthOfYear}
          >
            {Array.from({ length: 12 }, (_, index) => (
              <option key={index + 1} value={index + 1}>
                Month {index + 1}
              </option>
            ))}
          </select>
          <select
            className="editor-input compact"
            onChange={(event) => setNewRecurringCategoryId(event.target.value)}
            value={newRecurringCategoryId}
          >
            <option value="">Uncategorized</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <button className="icon-button" onClick={() => void handleAddRecurringTemplate()} type="button">
            <Plus size={16} />
          </button>
        </div>
        {recurringMessage ? <p className="status-message compact-status">{recurringMessage}</p> : null}
        <div className="list-stack recurring-list">
          {recurringTemplates.map((template) => (
            <div className="recurring-row" key={template.id}>
              <input
                className="editor-input"
                onChange={(event) => void updateRecurringTemplate(template.id, { name: event.target.value })}
                type="text"
                value={template.name}
              />
              <input
                className="editor-input compact"
                min={0}
                onChange={(event) => void updateRecurringTemplate(template.id, { amount: Number(event.target.value) })}
                step={1}
                type="number"
                value={template.amount}
              />
              <select
                className="editor-input compact"
                onChange={(event) =>
                  void updateRecurringTemplate(template.id, {
                    kind: event.target.value as "expense" | "income",
                  })
                }
                value={template.kind}
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
              <select
                className="editor-input compact"
                onChange={(event) =>
                  void updateRecurringTemplate(template.id, {
                    frequency: event.target.value as "monthly" | "yearly",
                  })
                }
                value={template.frequency}
              >
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
              <span className="transaction-source">{template.lastGeneratedDate ?? "Never generated"}</span>
              <label className="tiny-toggle">
                <input
                  checked={template.isActive}
                  onChange={(event) =>
                    void updateRecurringTemplate(template.id, {
                      isActive: event.target.checked,
                    })
                  }
                  type="checkbox"
                />
                <span>Active</span>
              </label>
              <button className="icon-button subtle" onClick={() => void removeRecurringTemplate(template.id)} type="button">
                <Trash2 size={15} />
              </button>
            </div>
          ))}
          {recurringTemplates.length === 0 ? (
            <div className="empty-state muted">No recurring templates yet.</div>
          ) : null}
        </div>
      </div>

      <div className="transactions-shell">
        <div className="section-head">
          <div>
            <h2>Transactions</h2>
            <p className="muted">Manual ledger entries and CSV import for actual spending history.</p>
          </div>
          <div className="transactions-actions">
            <input
              ref={fileInputRef}
              accept=".csv,text/csv"
              className="hidden-file-input"
              onChange={(event) => void handleCsvImport(event.target.files?.[0] ?? null)}
              type="file"
            />
            <button className="secondary-action-button" onClick={() => fileInputRef.current?.click()} type="button">
              <Upload size={16} />
              <span>Import CSV</span>
            </button>
          </div>
        </div>

        <div className="editor-card transaction-editor">
          <input
            className="editor-input compact"
            onChange={(event) => setNewTransactionDate(event.target.value)}
            type="date"
            value={newTransactionDate}
          />
          <input
            className="editor-input"
            onChange={(event) => setNewTransactionDescription(event.target.value)}
            placeholder="Description"
            type="text"
            value={newTransactionDescription}
          />
          <input
            className="editor-input compact"
            min={0}
            onChange={(event) => setNewTransactionAmount(Number(event.target.value))}
            step={1}
            type="number"
            value={newTransactionAmount}
          />
          <select
            className="editor-input compact"
            onChange={(event) => setNewTransactionKind(event.target.value as "expense" | "income")}
            value={newTransactionKind}
          >
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
          <select
            className="editor-input compact"
            onChange={(event) => setNewTransactionCategoryId(event.target.value)}
            value={newTransactionCategoryId}
          >
            <option value="">Uncategorized</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <button className="icon-button" onClick={() => void handleAddTransaction()} type="button">
            <Plus size={16} />
          </button>
        </div>

        {transactionImportMessage ? <p className="status-message compact-status">{transactionImportMessage}</p> : null}

        <div className="list-stack transaction-list">
          {transactions.slice(0, 12).map((transaction) => (
            <div className="transaction-row" key={transaction.id}>
              <input
                className="editor-input compact"
                onChange={(event) =>
                  void updateTransaction(transaction.id, {
                    date: event.target.value,
                  })
                }
                type="date"
                value={transaction.date}
              />
              <input
                className="editor-input"
                onChange={(event) =>
                  void updateTransaction(transaction.id, {
                    description: event.target.value,
                  })
                }
                type="text"
                value={transaction.description}
              />
              <input
                className="editor-input compact"
                min={0}
                onChange={(event) =>
                  void updateTransaction(transaction.id, {
                    amount: Number(event.target.value),
                  })
                }
                step={1}
                type="number"
                value={transaction.amount}
              />
              <select
                className="editor-input compact"
                onChange={(event) =>
                  void updateTransaction(transaction.id, {
                    kind: event.target.value as "expense" | "income",
                  })
                }
                value={transaction.kind}
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
              <select
                className="editor-input compact"
                onChange={(event) =>
                  void updateTransaction(transaction.id, {
                    categoryId: event.target.value || undefined,
                  })
                }
                value={transaction.categoryId ?? ""}
              >
                <option value="">Uncategorized</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <span className="transaction-source">{transaction.source}</span>
              <button className="icon-button subtle" onClick={() => void removeTransaction(transaction.id)} type="button">
                <Trash2 size={15} />
              </button>
            </div>
          ))}
          {transactions.length === 0 ? (
            <div className="empty-state muted">No transactions yet. Add one manually or import a CSV.</div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
