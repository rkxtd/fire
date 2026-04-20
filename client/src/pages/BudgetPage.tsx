import { motion } from "framer-motion";
import { Link } from "wouter";

import { BudgetOnboardingPanel } from "@/components/BudgetOnboardingPanel";
import { BudgetPlannerPanel } from "@/components/BudgetPlannerPanel";
import { ExpenseProjectionPanel } from "@/components/ExpenseProjectionPanel";
import { useBudget } from "@/contexts/BudgetContext";
import { useCalculator } from "@/contexts/CalculatorContext";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function BudgetPage() {
  const { inputs, setInput } = useCalculator();
  const {
    annualSpendingFromBudget,
    monthlyBudgetFromCategories,
    currentMonthSpending,
    fireGoalImpact,
  } = useBudget();

  return (
    <>
      <motion.section
        className="hero budget-page-hero"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
      >
        <div className="hero-copy panel">
          <p className="eyebrow">Budgeting</p>
          <h1>Separate your living-cost model from the FIRE engine.</h1>
          <p className="muted">
            Build categories, import budget structure, track actual spending, define goals, and decide
            whether budget totals should replace the manual spending input in the FIRE calculator.
          </p>
          <div className="page-actions">
            <Link className="landing-primary-button link-button" href="/fire">
              Open FIRE calculator
            </Link>
            <label className="toggle-card">
              <input
                checked={inputs.useBudgetSpending}
                onChange={(event) => setInput("useBudgetSpending", event.target.checked)}
                type="checkbox"
              />
              <span>Use budget totals in FIRE math</span>
            </label>
          </div>
        </div>
        <div className="hero-stat panel">
          <div className="hero-summary-grid">
            <div className="hero-summary-card">
              <span>Monthly plan</span>
              <strong>{formatCurrency(monthlyBudgetFromCategories)}</strong>
            </div>
            <div className="hero-summary-card">
              <span>Annual plan</span>
              <strong>{formatCurrency(annualSpendingFromBudget)}</strong>
            </div>
            <div className="hero-summary-card">
              <span>This month actual</span>
              <strong>{formatCurrency(currentMonthSpending)}</strong>
            </div>
            <div className="hero-summary-card">
              <span>Goals impacting FIRE</span>
              <strong>{formatCurrency(fireGoalImpact)}</strong>
            </div>
          </div>
        </div>
      </motion.section>

      <motion.section
        className="wizard-shell"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08, duration: 0.45, ease: "easeOut" }}
      >
        <BudgetOnboardingPanel />
        <BudgetPlannerPanel
          useBudgetSpending={inputs.useBudgetSpending}
          onUseBudgetSpendingChange={(nextValue) => setInput("useBudgetSpending", nextValue)}
        />
        <ExpenseProjectionPanel />
      </motion.section>
    </>
  );
}
