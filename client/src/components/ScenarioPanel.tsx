import { useMemo, useState } from "react";
import { CopyPlus, RotateCcw, Trash2 } from "lucide-react";

import { useBudget } from "@/contexts/BudgetContext";
import { useCalculator } from "@/contexts/CalculatorContext";
import type { CalculatorInputs, CalculatorResults } from "@/lib/calculator";

interface ScenarioPanelProps {
  inputs: CalculatorInputs;
  results: CalculatorResults;
}

interface SavedScenarioSummary {
  fireNumber: number;
  projectedSavingsAtRetirement: number;
  yearsToFire: number;
  adjustedAnnualSpending: number;
}

const SCENARIO_COLORS = ["#0f6b88", "#c66a3d", "#4d8570", "#7f5c9d", "#4f6f95"];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function parseSummary(summary: string): SavedScenarioSummary | null {
  try {
    return JSON.parse(summary) as SavedScenarioSummary;
  } catch {
    return null;
  }
}

export function ScenarioPanel({ inputs, results }: ScenarioPanelProps) {
  const { replaceInputs } = useCalculator();
  const { savedScenarios, addSavedScenario, removeSavedScenario } = useBudget();
  const [scenarioName, setScenarioName] = useState("");
  const [scenarioDescription, setScenarioDescription] = useState("");
  const [selectedScenarioIds, setSelectedScenarioIds] = useState<string[]>([]);

  const comparisonScenarios = useMemo(
    () => savedScenarios.filter((scenario) => selectedScenarioIds.includes(scenario.id)).slice(0, 3),
    [savedScenarios, selectedScenarioIds],
  );

  async function handleSaveScenario() {
    const trimmedName = scenarioName.trim();
    if (!trimmedName) {
      return;
    }

    await addSavedScenario({
      name: trimmedName,
      description: scenarioDescription.trim() || undefined,
      color: SCENARIO_COLORS[savedScenarios.length % SCENARIO_COLORS.length],
      inputs: JSON.stringify(inputs),
      resultsSummary: JSON.stringify({
        fireNumber: results.fireNumber,
        projectedSavingsAtRetirement: results.projectedSavingsAtRetirement,
        yearsToFire: results.yearsToFire,
        adjustedAnnualSpending: results.adjustedAnnualSpending,
      }),
    });

    setScenarioName("");
    setScenarioDescription("");
  }

  function toggleSelection(scenarioId: string) {
    setSelectedScenarioIds((current) =>
      current.includes(scenarioId)
        ? current.filter((id) => id !== scenarioId)
        : [...current, scenarioId].slice(-3),
    );
  }

  function loadScenario(serializedInputs: string) {
    replaceInputs(JSON.parse(serializedInputs) as CalculatorInputs);
  }

  return (
    <section className="panel scenario-panel" id="scenarios">
      <div className="section-head">
        <div>
          <p className="eyebrow">Scenarios</p>
          <h2>Save and compare plans</h2>
        </div>
        <p className="muted">Keep multiple what-if snapshots without rewriting the current draft.</p>
      </div>

      <div className="editor-card scenario-editor">
        <input
          className="editor-input"
          onChange={(event) => setScenarioName(event.target.value)}
          placeholder="Scenario name"
          type="text"
          value={scenarioName}
        />
        <input
          className="editor-input"
          onChange={(event) => setScenarioDescription(event.target.value)}
          placeholder="Description"
          type="text"
          value={scenarioDescription}
        />
        <button className="action-button" onClick={() => void handleSaveScenario()} type="button">
          <CopyPlus size={16} />
          <span>Save current scenario</span>
        </button>
      </div>

      <div className="scenario-library">
        {savedScenarios.map((scenario) => {
          const summary = parseSummary(scenario.resultsSummary);
          const isSelected = selectedScenarioIds.includes(scenario.id);

          return (
            <article className={`saved-scenario-card ${isSelected ? "is-selected" : ""}`} key={scenario.id}>
              <div className="saved-scenario-top">
                <div className="saved-scenario-badge" style={{ backgroundColor: scenario.color }} />
                <div>
                  <strong>{scenario.name}</strong>
                  {scenario.description ? <p className="muted">{scenario.description}</p> : null}
                </div>
              </div>
              {summary ? (
                <div className="saved-scenario-stats">
                  <span>FIRE {formatCurrency(summary.fireNumber)}</span>
                  <span>Retire {formatCurrency(summary.projectedSavingsAtRetirement)}</span>
                  <span>{summary.yearsToFire} years</span>
                </div>
              ) : null}
              <div className="saved-scenario-actions">
                <label className="tiny-toggle">
                  <input
                    checked={isSelected}
                    onChange={() => toggleSelection(scenario.id)}
                    type="checkbox"
                  />
                  <span>Compare</span>
                </label>
                <button className="secondary-action-button" onClick={() => loadScenario(scenario.inputs)} type="button">
                  <RotateCcw size={15} />
                  <span>Load</span>
                </button>
                <button className="icon-button subtle" onClick={() => void removeSavedScenario(scenario.id)} type="button">
                  <Trash2 size={15} />
                </button>
              </div>
            </article>
          );
        })}
        {savedScenarios.length === 0 ? (
          <div className="empty-state muted">No saved scenarios yet.</div>
        ) : null}
      </div>

      <div className="scenario-compare-grid">
        <article className="compare-card">
          <span>Current</span>
          <strong>{formatCurrency(results.fireNumber)}</strong>
          <p className="muted">Projected retirement savings {formatCurrency(results.projectedSavingsAtRetirement)}</p>
          <p className="muted">{results.yearsToFire} years to target</p>
        </article>
        {comparisonScenarios.map((scenario) => {
          const summary = parseSummary(scenario.resultsSummary);
          if (!summary) {
            return null;
          }

          return (
            <article className="compare-card" key={scenario.id}>
              <span>{scenario.name}</span>
              <strong>{formatCurrency(summary.fireNumber)}</strong>
              <p className="muted">
                Projected retirement savings {formatCurrency(summary.projectedSavingsAtRetirement)}
              </p>
              <p className="muted">{summary.yearsToFire} years to target</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
