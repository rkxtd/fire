import { useMemo, useState } from "react";
import { Laptop, TrendingUp } from "lucide-react";

import { useCalculator } from "@/contexts/CalculatorContext";
import { projectOpportunityCost } from "@/lib/budget-analysis";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function ExpenseProjectionPanel() {
  const { inputs } = useCalculator();
  const [purchaseAmount, setPurchaseAmount] = useState(4000);
  const [alternativeAmount, setAlternativeAmount] = useState(2200);
  const projection = useMemo(
    () =>
      projectOpportunityCost({
        purchaseAmount,
        alternativeAmount,
        currentAge: inputs.currentAge,
        retirementAge: inputs.targetRetirementAge,
        expectedReturn: inputs.expectedReturn,
        inflationRate: inputs.inflationRate,
      }),
    [alternativeAmount, inputs.currentAge, inputs.expectedReturn, inputs.inflationRate, inputs.targetRetirementAge, purchaseAmount],
  );

  return (
    <section className="panel expense-projection-panel" id="expense-projection">
      <div className="section-head">
        <div>
          <p className="eyebrow">Opportunity Cost</p>
          <h2>Should you buy it now?</h2>
        </div>
        <div className="security-chip">
          <Laptop size={16} />
          <span>Purchase tradeoff</span>
        </div>
      </div>
      <div className="input-grid">
        <label className="input-group">
          <span>Full-price purchase</span>
          <input
            min={0}
            onChange={(event) => setPurchaseAmount(Number(event.target.value))}
            step={100}
            type="number"
            value={purchaseAmount}
          />
        </label>
        <label className="input-group">
          <span>Cheaper alternative</span>
          <input
            min={0}
            onChange={(event) => setAlternativeAmount(Number(event.target.value))}
            step={100}
            type="number"
            value={alternativeAmount}
          />
        </label>
      </div>
      <div className="budget-summary-grid projection-grid">
        <article className="summary-tile">
          <TrendingUp size={18} />
          <span>Skip the purchase</span>
          <strong>{formatCurrency(projection.deferValue)}</strong>
          <small className="muted">
            Nominal retirement value, {formatCurrency(projection.deferValueReal)} in today&apos;s dollars
          </small>
        </article>
        <article className="summary-tile">
          <TrendingUp size={18} />
          <span>Buy the cheaper option</span>
          <strong>{formatCurrency(projection.cheaperOptionValue)}</strong>
          <small className="muted">
            Difference invested, {formatCurrency(projection.cheaperOptionValueReal)} in today&apos;s dollars
          </small>
        </article>
        <article className="summary-tile">
          <TrendingUp size={18} />
          <span>Future cost of the purchase</span>
          <strong>{formatCurrency(projection.purchaseCostAtRetirement)}</strong>
          <small className="muted">
            Equivalent full-price spend at retirement, {formatCurrency(purchaseAmount)} today
          </small>
        </article>
        <article className="summary-tile">
          <TrendingUp size={18} />
          <span>Future cost of the cheaper option</span>
          <strong>{formatCurrency(projection.alternativeCostAtRetirement)}</strong>
          <small className="muted">
            Equivalent cheaper-model spend at retirement, {formatCurrency(alternativeAmount)} today
          </small>
        </article>
        <article className="summary-tile">
          <TrendingUp size={18} />
          <span>Years until retirement</span>
          <strong>{projection.yearsToRetirement}</strong>
          <small className="muted">Based on your calculator assumptions</small>
        </article>
      </div>
    </section>
  );
}
