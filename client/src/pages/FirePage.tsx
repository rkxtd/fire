import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";

import { GoalProgressBar } from "@/components/GoalProgressBar";
import { MortgageCalculatorPanel } from "@/components/MortgageCalculatorPanel";
import { ScenarioPanel } from "@/components/ScenarioPanel";
import { FireStrategySection } from "@/components/sections/FireStrategySection";
import { HouseholdSection } from "@/components/sections/HouseholdSection";
import { IncomeSection } from "@/components/sections/IncomeSection";
import { PortfolioSection } from "@/components/sections/PortfolioSection";
import { ResultsSection } from "@/components/sections/ResultsSection";
import { SavingsSection } from "@/components/sections/SavingsSection";
import { useBudget } from "@/contexts/BudgetContext";
import { useCalculator } from "@/contexts/CalculatorContext";
import { runCalculation } from "@/lib/calculator";

const FIRE_UI_STORAGE_KEY = "retirement-calculator.fire-ui";

const FIRE_SECTION_LINKS = [
  { id: "household", label: "Household" },
  { id: "strategy", label: "Strategy" },
  { id: "savings", label: "Savings" },
  { id: "income", label: "Assumptions" },
  { id: "portfolio", label: "Portfolio" },
  { id: "loans", label: "Loans" },
  { id: "scenarios", label: "Scenarios" },
  { id: "results", label: "Results" },
] as const;

const WIZARD_STEPS = [
  {
    key: "household",
    label: "Household",
    description: "Who is in the plan, what stage of life are you in, and where do you expect to live?",
  },
  {
    key: "strategy",
    label: "Strategy",
    description: "Set your retirement posture, spending target, and withdrawal framing.",
  },
  {
    key: "savings",
    label: "Savings",
    description: "Capture the assets and annual saving pace already working for you.",
  },
  {
    key: "income",
    label: "Income",
    description: "Add Social Security, pension, and inflation assumptions to shape the model.",
  },
  {
    key: "portfolio",
    label: "Portfolio",
    description: "Choose a portfolio mix and simulation depth for risk-aware projections.",
  },
] as const;

function loadFireUiState() {
  if (typeof window === "undefined") {
    return { wizardOpen: false, wizardStep: 0 };
  }

  const stored = window.localStorage.getItem(FIRE_UI_STORAGE_KEY);
  if (!stored) {
    return { wizardOpen: false, wizardStep: 0 };
  }

  try {
    const parsed = JSON.parse(stored) as { wizardOpen?: boolean; wizardStep?: number };
    return {
      wizardOpen: parsed.wizardOpen ?? false,
      wizardStep: Math.min(Math.max(parsed.wizardStep ?? 0, 0), WIZARD_STEPS.length - 1),
    };
  } catch {
    return { wizardOpen: false, wizardStep: 0 };
  }
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function getCoastFireTarget(currentFireNumber: number, realReturnRate: number, yearsToRetirement: number) {
  const realReturn = realReturnRate / 100;
  if (yearsToRetirement <= 0 || realReturn <= -0.99) {
    return currentFireNumber;
  }

  return currentFireNumber / (1 + realReturn) ** yearsToRetirement;
}

export function FirePage() {
  const { inputs, setInput, reset } = useCalculator();
  const { annualSpendingFromBudget } = useBudget();
  const initialUiState = useMemo(loadFireUiState, []);
  const [wizardOpen, setWizardOpen] = useState(initialUiState.wizardOpen);
  const [wizardStep, setWizardStep] = useState(initialUiState.wizardStep);
  const currentStep = WIZARD_STEPS[wizardStep];
  const yearsToRetirement = Math.max(inputs.targetRetirementAge - inputs.currentAge, 0);
  const results = useMemo(
    () =>
      runCalculation({
        ...inputs,
        annualSpending: inputs.useBudgetSpending ? annualSpendingFromBudget || inputs.annualSpending : inputs.annualSpending,
      }),
    [annualSpendingFromBudget, inputs],
  );
  const fatScenario = results.scenarios.find((scenario) => scenario.style === "fat");
  const coastFireTarget = getCoastFireTarget(results.fireNumber, results.realReturnRate, yearsToRetirement);
  const milestones = [
    {
      label: "Coast FIRE",
      shortLabel: "Coast",
      target: coastFireTarget,
      progress: coastFireTarget === 0 ? 100 : (inputs.currentSavings / coastFireTarget) * 100,
    },
    {
      label: "Classic FIRE",
      shortLabel: "FIRE",
      target: results.fireNumber,
      progress: results.fireProgress,
    },
    {
      label: "Fat FIRE",
      shortLabel: "Fat",
      target: fatScenario?.fireNumber ?? results.fireNumber,
      progress:
        fatScenario && fatScenario.fireNumber > 0
          ? (inputs.currentSavings / fatScenario.fireNumber) * 100
          : results.fireProgress,
    },
  ];

  useEffect(() => {
    window.localStorage.setItem(
      FIRE_UI_STORAGE_KEY,
      JSON.stringify({
        wizardOpen,
        wizardStep,
      }),
    );
  }, [wizardOpen, wizardStep]);

  function renderWizardStep() {
    switch (currentStep.key) {
      case "household":
        return <HouseholdSection inputs={inputs} setInput={setInput} />;
      case "strategy":
        return <FireStrategySection inputs={inputs} setInput={setInput} />;
      case "savings":
        return <SavingsSection inputs={inputs} setInput={setInput} />;
      case "income":
        return <IncomeSection inputs={inputs} setInput={setInput} />;
      case "portfolio":
        return <PortfolioSection inputs={inputs} setInput={setInput} />;
      default:
        return null;
    }
  }

  if (wizardOpen) {
    return (
      <motion.section
        className="onboarding-shell"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
      >
        <div className="onboarding-header panel">
          <div className="onboarding-header-top">
            <div>
              <p className="eyebrow">FIRE Onboarding</p>
              <h1>{currentStep.label}</h1>
              <p className="muted">{currentStep.description}</p>
            </div>
            <div className="onboarding-header-actions">
              <button className="secondary-button" onClick={() => setWizardOpen(false)} type="button">
                Save and exit
              </button>
            </div>
          </div>
          <div className="wizard-progress">
            {WIZARD_STEPS.map((step, index) => (
              <button
                key={step.key}
                className={`wizard-step-chip ${index === wizardStep ? "is-active" : ""} ${index < wizardStep ? "is-complete" : ""}`}
                onClick={() => setWizardStep(index)}
                type="button"
              >
                <span>{index + 1}</span>
                <strong>{step.label}</strong>
              </button>
            ))}
          </div>
        </div>

        <div className="onboarding-content">
          <div className="onboarding-step">{renderWizardStep()}</div>
          <aside className="onboarding-aside panel">
            <p className="eyebrow">Live Summary</p>
            <div className="landing-summary-card">
              <span>Estimated FIRE age</span>
              <strong>{results.estimatedAgeAtFire}</strong>
            </div>
            <div className="landing-summary-card">
              <span>Projected at retirement</span>
              <strong>{formatCurrency(results.projectedSavingsAtRetirement)}</strong>
            </div>
            <div className="landing-summary-card">
              <span>FIRE number today</span>
              <strong>{formatCurrency(results.fireNumber)}</strong>
            </div>
          </aside>
        </div>

        <div className="wizard-footer panel">
          <button
            className="secondary-button"
            disabled={wizardStep === 0}
            onClick={() => setWizardStep((current) => Math.max(current - 1, 0))}
            type="button"
          >
            Previous
          </button>
          <div className="wizard-footer-note muted">Progress is saved locally after each change.</div>
          <button
            className="landing-primary-button"
            onClick={() => {
              if (wizardStep === WIZARD_STEPS.length - 1) {
                setWizardOpen(false);
              } else {
                setWizardStep((current) => Math.min(current + 1, WIZARD_STEPS.length - 1));
              }
            }}
            type="button"
          >
            {wizardStep === WIZARD_STEPS.length - 1 ? "Finish onboarding" : "Next step"}
          </button>
        </div>
      </motion.section>
    );
  }

  return (
    <>
      <GoalProgressBar currentSavings={inputs.currentSavings} milestones={milestones} />

      <motion.section
        className="hero"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
      >
        <div className="hero-copy panel">
          <p className="eyebrow">FIRE Calculator</p>
          <h1>Model retirement timing, risk, taxes, and income sources.</h1>
          <p className="muted">
            This page owns the retirement model: household setup, strategy, savings, assumptions,
            portfolio analysis, loans, scenarios, and final projections.
          </p>
          <div className="section-nav" aria-label="Calculator sections">
            {FIRE_SECTION_LINKS.map((section) => (
              <button
                key={section.id}
                className="section-chip"
                onClick={() => scrollToSection(section.id)}
                type="button"
              >
                {section.label}
              </button>
            ))}
          </div>
          <div className="page-actions">
            <button className="landing-primary-button" onClick={() => setWizardOpen(true)} type="button">
              {wizardStep > 0 ? "Resume FIRE wizard" : "Start FIRE wizard"}
            </button>
            <button className="secondary-button" onClick={reset} type="button">
              Reset defaults
            </button>
          </div>
        </div>
        <div className="hero-stat panel">
          <div className="hero-stat-row">
            <div>
              <p className="eyebrow">Estimated FIRE Age</p>
              <div className="hero-number">{results.estimatedAgeAtFire}</div>
            </div>
          </div>
          <div className="hero-summary-grid">
            <div className="hero-summary-card">
              <span>Years to goal</span>
              <strong>{results.yearsToFire}</strong>
            </div>
            <div className="hero-summary-card">
              <span>Progress today</span>
              <strong>{results.fireProgress}%</strong>
            </div>
          </div>
          <p className="muted">This estimate updates immediately as you tune the assumptions.</p>
        </div>
      </motion.section>

      <motion.section
        className="wizard-shell"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08, duration: 0.45, ease: "easeOut" }}
      >
        <div className="wizard-grid">
          <HouseholdSection inputs={inputs} setInput={setInput} />
          <FireStrategySection inputs={inputs} setInput={setInput} />
          <SavingsSection inputs={inputs} setInput={setInput} />
          <IncomeSection inputs={inputs} setInput={setInput} />
          <PortfolioSection inputs={inputs} setInput={setInput} />
        </div>
        <MortgageCalculatorPanel />
        <ScenarioPanel inputs={inputs} results={results} />
        <ResultsSection results={results} />
      </motion.section>
    </>
  );
}
