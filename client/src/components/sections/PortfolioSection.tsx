import type { CalculatorInputs } from "@/lib/calculator";

interface PortfolioSectionProps {
  inputs: CalculatorInputs;
  setInput: <K extends keyof CalculatorInputs>(key: K, value: CalculatorInputs[K]) => void;
}

function totalAllocation(inputs: CalculatorInputs) {
  return inputs.stockAllocation + inputs.bondAllocation + inputs.cashAllocation;
}

export function PortfolioSection({ inputs, setInput }: PortfolioSectionProps) {
  const allocationTotal = totalAllocation(inputs);

  return (
    <section className="panel section-panel" id="portfolio">
      <div className="section-copy">
        <p className="eyebrow">Section 5</p>
        <h2>Portfolio and Monte Carlo</h2>
        <p className="muted">
          Set your asset mix and simulation depth. Monte Carlo uses this allocation to estimate a
          distribution of future outcomes.
        </p>
      </div>
      <div className="input-grid">
        <label className="input-group">
          <span>Stocks %</span>
          <input
            type="number"
            step={1}
            min={0}
            max={100}
            value={inputs.stockAllocation}
            onChange={(event) => setInput("stockAllocation", Number(event.target.value))}
          />
        </label>
        <label className="input-group">
          <span>Bonds %</span>
          <input
            type="number"
            step={1}
            min={0}
            max={100}
            value={inputs.bondAllocation}
            onChange={(event) => setInput("bondAllocation", Number(event.target.value))}
          />
        </label>
        <label className="input-group">
          <span>Cash %</span>
          <input
            type="number"
            step={1}
            min={0}
            max={100}
            value={inputs.cashAllocation}
            onChange={(event) => setInput("cashAllocation", Number(event.target.value))}
          />
        </label>
        <label className="input-group">
          <span>Monte Carlo runs</span>
          <select
            value={inputs.monteCarloRuns}
            onChange={(event) => setInput("monteCarloRuns", Number(event.target.value))}
          >
            <option value={250}>250</option>
            <option value={500}>500</option>
            <option value={1000}>1,000</option>
            <option value={2500}>2,500</option>
          </select>
        </label>
      </div>
      <div className="note-strip">
        Allocation total: {allocationTotal}%. The planner normalizes the mix automatically if it
        does not add up to exactly 100%.
      </div>
    </section>
  );
}
