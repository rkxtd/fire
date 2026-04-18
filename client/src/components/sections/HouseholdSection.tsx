import type { CalculatorInputs } from "@/lib/calculator";

interface HouseholdSectionProps {
  inputs: CalculatorInputs;
  setInput: <K extends keyof CalculatorInputs>(key: K, value: CalculatorInputs[K]) => void;
}

const LOCATION_OPTIONS = [
  { value: "lcol", label: "Lower-cost area" },
  { value: "mcol", label: "Balanced-cost area" },
  { value: "hcol", label: "Higher-cost area" },
] as const;

export function HouseholdSection({ inputs, setInput }: HouseholdSectionProps) {
  return (
    <section className="panel section-panel" id="household">
      <div className="section-copy">
        <p className="eyebrow">Section 1</p>
        <h2>Household setup</h2>
        <p className="muted">
          Start with age, income, and cost-of-living assumptions. These anchor the rest of the
          projection.
        </p>
      </div>
      <div className="input-grid">
        <label className="input-group">
          <span>Filing status</span>
          <select
            value={inputs.filingStatus}
            onChange={(event) => setInput("filingStatus", event.target.value as CalculatorInputs["filingStatus"])}
          >
            <option value="single">Single</option>
            <option value="married">Married filing jointly</option>
          </select>
        </label>
        <label className="input-group">
          <span>Current age</span>
          <input
            type="number"
            step={1}
            value={inputs.currentAge}
            onChange={(event) => setInput("currentAge", Number(event.target.value))}
          />
        </label>
        <label className="input-group">
          <span>Target retirement age</span>
          <input
            type="number"
            step={1}
            value={inputs.targetRetirementAge}
            onChange={(event) => setInput("targetRetirementAge", Number(event.target.value))}
          />
        </label>
        <label className="input-group input-group-wide">
          <span>Annual household income (before tax)</span>
          <input
            type="number"
            step={1000}
            value={inputs.annualIncome}
            onChange={(event) => setInput("annualIncome", Number(event.target.value))}
          />
          <small className="muted">Enter gross household income before taxes, withholding, and paycheck deductions.</small>
        </label>
      </div>
      <div className="choice-row" aria-label="Location cost tier">
        {LOCATION_OPTIONS.map((option) => (
          <button
            key={option.value}
            className={`choice-chip ${inputs.locationTier === option.value ? "is-active" : ""}`}
            onClick={() => setInput("locationTier", option.value)}
            type="button"
          >
            {option.label}
          </button>
        ))}
      </div>
    </section>
  );
}
