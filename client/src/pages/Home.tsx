import { useMemo } from "react";
import { motion } from "framer-motion";
import { Calculator, Landmark, PiggyBank, WalletCards } from "lucide-react";
import { Link } from "wouter";

import { useBudget } from "@/contexts/BudgetContext";
import { useCalculator } from "@/contexts/CalculatorContext";
import { runCalculation } from "@/lib/calculator";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function Home() {
  const { inputs } = useCalculator();
  const { annualSpendingFromBudget, monthlyBudgetFromCategories, currentMonthSpending } = useBudget();
  const results = useMemo(
    () =>
      runCalculation({
        ...inputs,
        annualSpending: inputs.useBudgetSpending ? annualSpendingFromBudget || inputs.annualSpending : inputs.annualSpending,
      }),
    [annualSpendingFromBudget, inputs],
  );

  return (
    <motion.section
      className="landing-shell"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
    >
      <div className="landing-hero panel">
        <div className="landing-copy">
          <p className="eyebrow">Retirement Planner</p>
          <h1>Plan retirement, budgets, and tradeoffs in focused workspaces.</h1>
          <p className="muted">
            The app is now split into logical pages: FIRE calculation for retirement modeling and
            Budgeting for categories, goals, imports, recurring transactions, and spending analysis.
          </p>
          <div className="landing-actions">
            <Link className="landing-primary-button link-button" href="/fire">
              Start FIRE planning
            </Link>
            <Link className="landing-secondary-button link-button" href="/budget">
              Open budgeting
            </Link>
          </div>
          <div className="landing-notes">
            <span>Progress auto-saves locally.</span>
            <span>Use the corner vault icon for save files.</span>
            <span>No backend or account required.</span>
          </div>
        </div>
        <div className="landing-summary">
          <article className="landing-summary-card">
            <span>Current estimated FIRE age</span>
            <strong>{results.estimatedAgeAtFire}</strong>
          </article>
          <article className="landing-summary-card">
            <span>Projected retirement savings</span>
            <strong>{formatCurrency(results.projectedSavingsAtRetirement)}</strong>
          </article>
          <article className="landing-summary-card">
            <span>Monthly budget plan</span>
            <strong>{formatCurrency(monthlyBudgetFromCategories)}</strong>
          </article>
        </div>
      </div>

      <div className="route-card-grid">
        <Link className="route-card panel" href="/fire">
          <Calculator size={22} />
          <strong>FIRE calculation</strong>
          <span>
            Household, strategy, savings, income assumptions, portfolio risk, loans, scenarios, and
            retirement results.
          </span>
        </Link>
        <Link className="route-card panel" href="/budget">
          <WalletCards size={22} />
          <strong>Budgeting</strong>
          <span>
            Budget onboarding, category targets, goals, recurring transactions, CSV imports, and
            spending history.
          </span>
        </Link>
        <article className="route-card panel">
          <PiggyBank size={22} />
          <strong>Current actual spend</strong>
          <span>{formatCurrency(currentMonthSpending)} tracked this month from budget transactions.</span>
        </article>
        <article className="route-card panel">
          <Landmark size={22} />
          <strong>Static and private</strong>
          <span>Runs as a static site. Data stays in local browser storage unless you export it.</span>
        </article>
      </div>
    </motion.section>
  );
}
