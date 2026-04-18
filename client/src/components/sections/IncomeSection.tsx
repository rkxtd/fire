import type { CalculatorInputs } from "@/lib/calculator";

interface IncomeSectionProps {
  inputs: CalculatorInputs;
  setInput: <K extends keyof CalculatorInputs>(key: K, value: CalculatorInputs[K]) => void;
}

export function IncomeSection({ inputs, setInput }: IncomeSectionProps) {
  return (
    <section className="panel section-panel" id="income">
      <div className="section-copy">
        <p className="eyebrow">Section 4</p>
        <h2>Income and assumptions</h2>
        <p className="muted">
          Set return expectations, inflation, and the retirement income that offsets portfolio
          withdrawals.
        </p>
      </div>
      <div className="input-grid">
        <label className="input-group">
          <span>Expected return %</span>
          <input
            type="number"
            step={0.1}
            value={inputs.expectedReturn}
            onChange={(event) => setInput("expectedReturn", Number(event.target.value))}
          />
        </label>
        <label className="input-group">
          <span>Inflation %</span>
          <input
            type="number"
            step={0.1}
            value={inputs.inflationRate}
            onChange={(event) => setInput("inflationRate", Number(event.target.value))}
          />
        </label>
        <label className="input-group">
          <span>Social Security monthly benefit at FRA</span>
          <input
            type="number"
            step={100}
            value={inputs.socialSecurityMonthlyBenefit}
            onChange={(event) => setInput("socialSecurityMonthlyBenefit", Number(event.target.value))}
          />
        </label>
        <label className="input-group">
          <span>Social Security claim age</span>
          <input
            type="number"
            step={1}
            min={62}
            max={70}
            value={inputs.socialSecurityClaimAge}
            onChange={(event) => setInput("socialSecurityClaimAge", Number(event.target.value))}
          />
        </label>
        <label className="input-group">
          <span>Pension annual benefit</span>
          <input
            type="number"
            step={1000}
            value={inputs.pensionAnnualBenefit}
            onChange={(event) => setInput("pensionAnnualBenefit", Number(event.target.value))}
          />
        </label>
        <label className="input-group">
          <span>Pension start age</span>
          <input
            type="number"
            step={1}
            min={50}
            max={80}
            value={inputs.pensionStartAge}
            onChange={(event) => setInput("pensionStartAge", Number(event.target.value))}
          />
        </label>
        <label className="input-group input-group-wide">
          <span>Planned retirement income offset</span>
          <input
            type="number"
            step={1000}
            value={inputs.plannedRetirementIncome}
            onChange={(event) => setInput("plannedRetirementIncome", Number(event.target.value))}
          />
        </label>
      </div>
    </section>
  );
}
