import type { CalculatorInputs } from "@/lib/calculator";

interface FireStrategySectionProps {
  inputs: CalculatorInputs;
  setInput: <K extends keyof CalculatorInputs>(key: K, value: CalculatorInputs[K]) => void;
}

const FIRE_STYLES = [
  {
    value: "lean",
    label: "Lean",
    description: "A lighter target with tighter discretionary spending.",
  },
  {
    value: "standard",
    label: "Classic",
    description: "A balanced baseline with room for stable routines.",
  },
  {
    value: "fat",
    label: "Fat",
    description: "More buffer for travel, flexibility, and higher fixed costs.",
  },
] as const;

export function FireStrategySection({ inputs, setInput }: FireStrategySectionProps) {
  return (
    <section className="panel section-panel" id="strategy">
      <div className="section-copy">
        <p className="eyebrow">Section 2</p>
        <h2>FIRE strategy</h2>
        <p className="muted">
          Pick the spending posture you want retirement to support, then set a sustainable
          withdrawal rule.
        </p>
      </div>
      <div className="strategy-grid">
        {FIRE_STYLES.map((style) => (
          <button
            key={style.value}
            className={`strategy-card ${inputs.fireStyle === style.value ? "is-active" : ""}`}
            onClick={() => setInput("fireStyle", style.value)}
            type="button"
          >
            <strong>{style.label}</strong>
            <span>{style.description}</span>
          </button>
        ))}
      </div>
      <div className="input-grid">
        <label className="input-group">
          <span>Annual spending target</span>
          <input
            type="number"
            step={1000}
            value={inputs.annualSpending}
            onChange={(event) => setInput("annualSpending", Number(event.target.value))}
          />
        </label>
        <label className="input-group">
          <span>Withdrawal rate %</span>
          <input
            type="number"
            step={0.1}
            value={inputs.withdrawalRate}
            onChange={(event) => setInput("withdrawalRate", Number(event.target.value))}
          />
        </label>
      </div>
      <label className="toggle-card inline-toggle">
        <input
          checked={inputs.useBudgetSpending}
          onChange={(event) => setInput("useBudgetSpending", event.target.checked)}
          type="checkbox"
        />
        <span>Let the budget planner replace the manual annual spending number.</span>
      </label>
    </section>
  );
}
