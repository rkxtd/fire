import type { CalculatorInputs } from "@/lib/calculator";

interface SavingsSectionProps {
  inputs: CalculatorInputs;
  setInput: <K extends keyof CalculatorInputs>(key: K, value: CalculatorInputs[K]) => void;
}

export function SavingsSection({ inputs, setInput }: SavingsSectionProps) {
  return (
    <section className="panel section-panel" id="savings">
      <div className="section-copy">
        <p className="eyebrow">Section 3</p>
        <h2>Savings and runway</h2>
        <p className="muted">
          Enter the money already working for you and how much you are adding every year.
        </p>
      </div>
      <div className="input-grid">
        <label className="input-group">
          <span>Current invested savings</span>
          <input
            type="number"
            step={1000}
            value={inputs.currentSavings}
            onChange={(event) => setInput("currentSavings", Number(event.target.value))}
          />
        </label>
        <label className="input-group">
          <span>Annual contribution</span>
          <input
            type="number"
            step={1000}
            value={inputs.annualContribution}
            onChange={(event) => setInput("annualContribution", Number(event.target.value))}
          />
        </label>
      </div>
      <div className="note-strip">
        Contributions are currently modeled as a steady annual amount. This keeps the first
        execution phase simple while the richer account model is still being built.
      </div>
    </section>
  );
}
