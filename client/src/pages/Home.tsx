import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Download, ShieldCheck, Upload, X } from "lucide-react";

import { BudgetPlannerPanel } from "@/components/BudgetPlannerPanel";
import { ExpenseProjectionPanel } from "@/components/ExpenseProjectionPanel";
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
import { exportToFile, importFromFile } from "@/lib/persistence";

const HOME_UI_STORAGE_KEY = "retirement-calculator.home-ui";

type ViewMode = "landing" | "wizard" | "workspace";

const SECTION_LINKS = [
  { id: "household", label: "Household" },
  { id: "strategy", label: "Strategy" },
  { id: "savings", label: "Savings" },
  { id: "income", label: "Assumptions" },
  { id: "portfolio", label: "Portfolio" },
  { id: "budget", label: "Budget" },
  { id: "loans", label: "Loans" },
  { id: "scenarios", label: "Scenarios" },
  { id: "expense-projection", label: "Tradeoffs" },
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

function loadHomeUiState(): { viewMode: ViewMode; wizardStep: number } {
  if (typeof window === "undefined") {
    return { viewMode: "landing", wizardStep: 0 };
  }

  const stored = window.localStorage.getItem(HOME_UI_STORAGE_KEY);
  if (!stored) {
    return { viewMode: "landing", wizardStep: 0 };
  }

  try {
    const parsed = JSON.parse(stored) as { viewMode?: ViewMode; wizardStep?: number };
    return {
      viewMode: parsed.viewMode ?? "landing",
      wizardStep: Math.min(Math.max(parsed.wizardStep ?? 0, 0), WIZARD_STEPS.length - 1),
    };
  } catch {
    return { viewMode: "landing", wizardStep: 0 };
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

export function Home() {
  const { inputs, setInput, reset, replaceInputs } = useCalculator();
  const { annualSpendingFromBudget, replaceAllData } = useBudget();
  const initialUiState = useMemo(loadHomeUiState, []);
  const [viewMode, setViewMode] = useState<ViewMode>(initialUiState.viewMode);
  const [wizardStep, setWizardStep] = useState(initialUiState.wizardStep);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [importPassword, setImportPassword] = useState("");
  const [exportPassword, setExportPassword] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFileName, setSelectedFileName] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const results = useMemo(
    () =>
      runCalculation({
        ...inputs,
        annualSpending: inputs.useBudgetSpending ? annualSpendingFromBudget || inputs.annualSpending : inputs.annualSpending,
      }),
    [annualSpendingFromBudget, inputs],
  );
  const currentStep = WIZARD_STEPS[wizardStep];

  useEffect(() => {
    window.localStorage.setItem(
      HOME_UI_STORAGE_KEY,
      JSON.stringify({
        viewMode,
        wizardStep,
      }),
    );
  }, [viewMode, wizardStep]);

  useEffect(() => {
    if (!saveModalOpen) {
      return undefined;
    }

    function handleKeydown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setSaveModalOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [saveModalOpen]);

  function closeSaveModal() {
    setSaveModalOpen(false);
    setErrorMessage(null);
    setStatusMessage(null);
  }

  async function handleLandingImport() {
    if (!selectedFile) {
      setErrorMessage("Choose a .fire save file first.");
      return;
    }

    setErrorMessage(null);
    setStatusMessage(null);
    setIsBusy(true);

    try {
      const payload = await importFromFile(selectedFile, importPassword);
      replaceInputs(payload.calculatorInputs);
      await replaceAllData(payload.budgetData);
      setViewMode("workspace");
      setStatusMessage(`Loaded backup from ${new Date(payload.exportedAt).toLocaleString()}.`);
      setSelectedFile(null);
      setSelectedFileName("");
      setSaveModalOpen(false);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Import failed.");
    } finally {
      setIsBusy(false);
    }
  }

  async function handleWizardExport() {
    setErrorMessage(null);
    setStatusMessage(null);
    setIsBusy(true);

    try {
      await exportToFile(inputs, exportPassword);
      setStatusMessage("Encrypted save file created.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Export failed.");
    } finally {
      setIsBusy(false);
    }
  }

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

  return (
    <main className="screen">
      <button
        aria-label="Open save and upload menu"
        className="corner-vault-button"
        onClick={() => {
          setSaveModalOpen(true);
          setErrorMessage(null);
          setStatusMessage(null);
        }}
        type="button"
      >
        <ShieldCheck size={20} />
      </button>

      {saveModalOpen ? (
        <div
          aria-hidden="true"
          className="save-modal-backdrop"
          onClick={() => closeSaveModal()}
        >
          <div
            aria-label="Save and upload"
            aria-modal="true"
            className="save-modal panel"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
          >
            <div className="save-modal-header">
              <div>
                <p className="eyebrow">Save And Upload</p>
                <h2>Move your plan safely between sessions.</h2>
                <p className="muted">
                  Export an encrypted `.fire` file or import one to resume from another device or browser.
                </p>
              </div>
              <button
                aria-label="Close save and upload menu"
                className="modal-icon-button"
                onClick={() => closeSaveModal()}
                type="button"
              >
                <X size={18} />
              </button>
            </div>

            <div className="save-modal-grid">
              <section className="save-modal-card">
                <div className="save-modal-card-head">
                  <Download size={18} />
                  <strong>Download save file</strong>
                </div>
                <p className="muted">
                  Your current local draft can be exported at any time, including mid-onboarding.
                </p>
                <input
                  className="editor-input"
                  onChange={(event) => setExportPassword(event.target.value)}
                  placeholder="Save file password"
                  type="password"
                  value={exportPassword}
                />
                <button className="action-button" disabled={isBusy} onClick={() => void handleWizardExport()} type="button">
                  Download encrypted file
                </button>
              </section>

              <section className="save-modal-card">
                <div className="save-modal-card-head">
                  <Upload size={18} />
                  <strong>Upload save file</strong>
                </div>
                <p className="muted">
                  Import a `.fire` file and replace the current local draft with the backup contents.
                </p>
                <button className="secondary-action-button" onClick={() => fileInputRef.current?.click()} type="button">
                  {selectedFileName || "Choose .fire file"}
                </button>
                <input
                  className="editor-input"
                  onChange={(event) => setImportPassword(event.target.value)}
                  placeholder="Import password"
                  type="password"
                  value={importPassword}
                />
                <button className="action-button" disabled={isBusy} onClick={() => void handleLandingImport()} type="button">
                  Load save file
                </button>
              </section>
            </div>

            {statusMessage ? <p className="status-message compact-status">{statusMessage}</p> : null}
            {errorMessage ? <p className="error-message compact-status">{errorMessage}</p> : null}
          </div>
        </div>
      ) : null}

      {viewMode === "landing" ? (
        <motion.section
          className="landing-shell"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
        >
          <div className="landing-hero panel">
            <div className="landing-copy">
              <p className="eyebrow">Retirement Planner</p>
              <h1>Calm retirement planning with guided onboarding and safe save files.</h1>
              <p className="muted">
                Start with a focused onboarding wizard that gathers the essentials one step at a
                time, or upload an encrypted save file and continue where you left off.
              </p>
              <div className="landing-actions">
                <button
                  className="landing-primary-button"
                  onClick={() => {
                    setViewMode("wizard");
                    setStatusMessage(null);
                    setErrorMessage(null);
                  }}
                  type="button"
                >
                  {wizardStep > 0 ? "Resume onboarding wizard" : "Start onboarding wizard"}
                </button>
                <button
                  className="landing-secondary-button"
                  onClick={() => {
                    setSaveModalOpen(true);
                    setErrorMessage(null);
                    setStatusMessage(null);
                  }}
                  type="button"
                >
                  Upload save file
                </button>
              </div>
              <div className="landing-notes">
                <span>Progress auto-saves locally.</span>
                <span>You can stop at any step.</span>
                <span>Encrypted export is available during onboarding.</span>
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
                <span>Years to target</span>
                <strong>{results.yearsToFire}</strong>
              </article>
            </div>
          </div>

          <input
            ref={fileInputRef}
            accept=".fire"
            className="hidden-file-input"
            onChange={(event) => {
              const file = event.target.files?.[0] ?? null;
              setSelectedFile(file);
              setSelectedFileName(file?.name ?? "");
            }}
            type="file"
          />
        </motion.section>
      ) : null}

      {viewMode === "wizard" ? (
        <motion.section
          className="onboarding-shell"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
        >
          <div className="onboarding-header panel">
            <div className="onboarding-header-top">
              <div>
                <p className="eyebrow">Onboarding Wizard</p>
                <h1>{currentStep.label}</h1>
                <p className="muted">{currentStep.description}</p>
              </div>
              <div className="onboarding-header-actions">
                <button className="secondary-button" onClick={() => setViewMode("landing")} type="button">
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
            {statusMessage ? <p className="status-message compact-status">{statusMessage}</p> : null}
            {errorMessage ? <p className="error-message compact-status">{errorMessage}</p> : null}
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
            <div className="wizard-footer-note muted">
              Progress is saved locally after each change.
            </div>
            <button
              className="landing-primary-button"
              onClick={() => {
                if (wizardStep === WIZARD_STEPS.length - 1) {
                  setViewMode("workspace");
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
      ) : null}

      {viewMode === "workspace" ? (
        <>
          <motion.section
            className="hero"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
          >
            <div className="hero-copy panel">
              <p className="eyebrow">Retirement Calculator</p>
              <h1>Structured planning with guided setup complete.</h1>
              <p className="muted">
                Your onboarding draft is saved locally. You can revisit any section, compare
                scenarios, and export a secure backup at any time.
              </p>
              <div className="section-nav" aria-label="Calculator sections">
                {SECTION_LINKS.map((section) => (
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
            </div>
            <div className="hero-stat panel">
              <div className="hero-stat-row">
                <div>
                  <p className="eyebrow">Estimated FIRE Age</p>
                  <div className="hero-number">{results.estimatedAgeAtFire}</div>
                </div>
                <div className="workspace-header-actions">
                  <button className="secondary-button" onClick={() => setViewMode("landing")} type="button">
                    Back to front page
                  </button>
                  <button className="secondary-button" onClick={reset} type="button">
                    Reset defaults
                  </button>
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
            <div id="budget">
              <BudgetPlannerPanel
                useBudgetSpending={inputs.useBudgetSpending}
                onUseBudgetSpendingChange={(nextValue) => setInput("useBudgetSpending", nextValue)}
              />
            </div>
            <MortgageCalculatorPanel />
            <ScenarioPanel inputs={inputs} results={results} />
            <ExpenseProjectionPanel />
            <ResultsSection results={results} />
          </motion.section>
        </>
      ) : null}
    </main>
  );
}
