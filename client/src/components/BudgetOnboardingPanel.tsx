import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, FolderUp, ListChecks, Sparkles } from "lucide-react";

import { useBudget } from "@/contexts/BudgetContext";
import { parseBudgetCategoriesCsv } from "@/lib/parsers";

const BUDGET_ONBOARDING_STORAGE_KEY = "retirement-calculator.budget-onboarding";

const STARTER_CATEGORIES = [
  { name: "Housing", monthlyTarget: 2400, group: "essentials" as const, color: "#2b7196" },
  { name: "Groceries", monthlyTarget: 800, group: "essentials" as const, color: "#4d8570" },
  { name: "Transportation", monthlyTarget: 550, group: "essentials" as const, color: "#4f6f95" },
  { name: "Healthcare", monthlyTarget: 450, group: "essentials" as const, color: "#94614a" },
  { name: "Travel and fun", monthlyTarget: 650, group: "lifestyle" as const, color: "#c66a3d" },
  { name: "Future goals", monthlyTarget: 1000, group: "future" as const, color: "#d9b44a" },
];

function loadBudgetOnboardingState() {
  if (typeof window === "undefined") {
    return { step: 0, completed: false };
  }

  const stored = window.localStorage.getItem(BUDGET_ONBOARDING_STORAGE_KEY);
  if (!stored) {
    return { step: 0, completed: false };
  }

  try {
    const parsed = JSON.parse(stored) as { step?: number; completed?: boolean };
    return {
      step: Math.min(Math.max(parsed.step ?? 0, 0), 2),
      completed: parsed.completed ?? false,
    };
  } catch {
    return { step: 0, completed: false };
  }
}

export function BudgetOnboardingPanel() {
  const { categories, addCategory } = useBudget();
  const initialState = useMemo(loadBudgetOnboardingState, []);
  const [step, setStep] = useState(initialState.step);
  const [completed, setCompleted] = useState(initialState.completed);
  const [message, setMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    window.localStorage.setItem(
      BUDGET_ONBOARDING_STORAGE_KEY,
      JSON.stringify({
        step,
        completed,
      }),
    );
  }, [completed, step]);

  async function addStarterCategories() {
    const existingNames = new Set(categories.map((category) => category.name.toLowerCase()));
    const missingCategories = STARTER_CATEGORIES.filter(
      (category) => !existingNames.has(category.name.toLowerCase()),
    );

    for (const [index, category] of missingCategories.entries()) {
      await addCategory({
        name: category.name,
        monthlyTarget: category.monthlyTarget,
        annualTarget: category.monthlyTarget * 12,
        group: category.group,
        color: category.color,
        sortOrder: categories.length + index + 1,
      });
    }

    setMessage(
      missingCategories.length > 0
        ? `Added ${missingCategories.length} starter categories.`
        : "Starter categories are already present.",
    );
    setStep(1);
  }

  async function handleBudgetImport(file: File | null) {
    if (!file) {
      return;
    }

    const importedCategories = parseBudgetCategoriesCsv(await file.text());
    const existingNames = new Set(categories.map((category) => category.name.toLowerCase()));
    const categoriesToAdd = importedCategories.filter(
      (category) => !existingNames.has(category.name.toLowerCase()),
    );

    for (const [index, category] of categoriesToAdd.entries()) {
      await addCategory({
        ...category,
        sortOrder: categories.length + index + 1,
      });
    }

    setMessage(
      categoriesToAdd.length > 0
        ? `Imported ${categoriesToAdd.length} budget categories.`
        : "No new budget categories found in that file.",
    );
    setStep(2);
  }

  if (completed) {
    return (
      <section className="panel budget-onboarding-panel is-compact">
        <div className="budget-onboarding-complete">
          <CheckCircle2 size={20} />
          <div>
            <strong>Budget onboarding complete</strong>
            <p className="muted">You can restart it any time if you want to import or rebuild categories.</p>
          </div>
          <button
            className="secondary-button"
            onClick={() => {
              setCompleted(false);
              setStep(0);
              setMessage(null);
            }}
            type="button"
          >
            Reopen wizard
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="panel budget-onboarding-panel">
      <div className="section-head">
        <div>
          <p className="eyebrow">Budget Onboarding</p>
          <h2>Build your budget structure first.</h2>
          <p className="muted">
            Start from starter categories, import a category budget from YNAB-style CSV exports,
            then refine targets in the planner below.
          </p>
        </div>
      </div>

      <div className="budget-wizard-progress">
        {["Choose structure", "Import or seed", "Review"].map((label, index) => (
          <button
            className={`wizard-step-chip ${index === step ? "is-active" : ""} ${index < step ? "is-complete" : ""}`}
            key={label}
            onClick={() => setStep(index)}
            type="button"
          >
            <span>{index + 1}</span>
            <strong>{label}</strong>
          </button>
        ))}
      </div>

      <div className="budget-onboarding-grid">
        <article className={`budget-onboarding-card ${step === 0 ? "is-active" : ""}`}>
          <Sparkles size={20} />
          <strong>Use starter categories</strong>
          <p className="muted">
            Create a clean household budget with essentials, lifestyle, and future-goal buckets.
          </p>
          <button className="action-button" onClick={() => void addStarterCategories()} type="button">
            Add starter budget
          </button>
        </article>

        <article className={`budget-onboarding-card ${step === 1 ? "is-active" : ""}`}>
          <FolderUp size={20} />
          <strong>Import from YNAB or similar apps</strong>
          <p className="muted">
            Upload a CSV with columns like Category, Category Group, Budgeted, Assigned,
            Monthly Target, or Annual Target.
          </p>
          <input
            ref={fileInputRef}
            accept=".csv,text/csv"
            className="hidden-file-input"
            onChange={(event) => void handleBudgetImport(event.target.files?.[0] ?? null)}
            type="file"
          />
          <button className="secondary-action-button" onClick={() => fileInputRef.current?.click()} type="button">
            Import budget CSV
          </button>
        </article>

        <article className={`budget-onboarding-card ${step === 2 ? "is-active" : ""}`}>
          <ListChecks size={20} />
          <strong>Review in planner</strong>
          <p className="muted">
            Confirm monthly and annual targets, then add goals, recurring transactions, and actuals.
          </p>
          <button
            className="secondary-button"
            onClick={() => {
              setCompleted(true);
              setMessage(null);
            }}
            type="button"
          >
            Mark onboarding done
          </button>
        </article>
      </div>

      {message ? <p className="status-message compact-status">{message}</p> : null}
    </section>
  );
}
