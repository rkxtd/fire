import { Plus, Trash2 } from "lucide-react";

import { getCurrentHouseholdIncome, type CalculatorInputs, type ChildPlan } from "@/lib/calculator";

interface HouseholdSectionProps {
  inputs: CalculatorInputs;
  setInput: <K extends keyof CalculatorInputs>(key: K, value: CalculatorInputs[K]) => void;
}

const LOCATION_OPTIONS = [
  { value: "lcol", label: "Lower-cost area" },
  { value: "mcol", label: "Balanced-cost area" },
  { value: "hcol", label: "Higher-cost area" },
] as const;

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function createChild(index: number): ChildPlan {
  return {
    id: typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `child-${Date.now()}`,
    name: `Child ${index + 1}`,
    status: "born",
    currentAge: 3,
    yearsUntilBirth: 0,
    annualChildCost: 12000,
    current529Balance: 0,
    annual529Contribution: 3000,
    collegeStartAge: 18,
    collegeYears: 4,
    annualCollegeCost: 30000,
  };
}

export function HouseholdSection({ inputs, setInput }: HouseholdSectionProps) {
  const householdIncome = getCurrentHouseholdIncome(inputs);

  function syncHouseholdIncome(
    primaryAnnualIncome = inputs.primaryAnnualIncome,
    spouseAnnualIncome = inputs.spouseAnnualIncome,
    spouseIncluded = inputs.spouseIncluded,
  ) {
    setInput("annualIncome", primaryAnnualIncome + (spouseIncluded ? spouseAnnualIncome : 0));
  }

  function updateChild(childId: string, updates: Partial<ChildPlan>) {
    setInput(
      "children",
      inputs.children.map((child) => (child.id === childId ? { ...child, ...updates } : child)),
    );
  }

  function removeChild(childId: string) {
    setInput(
      "children",
      inputs.children.filter((child) => child.id !== childId),
    );
  }

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
          <span>Your current age</span>
          <input
            type="number"
            step={1}
            value={inputs.currentAge}
            onChange={(event) => setInput("currentAge", Number(event.target.value))}
          />
        </label>
        <label className="input-group">
          <span>Your target retirement age</span>
          <input
            type="number"
            step={1}
            value={inputs.targetRetirementAge}
            onChange={(event) => setInput("targetRetirementAge", Number(event.target.value))}
          />
        </label>
        <label className="input-group">
          <span>Your annual income (before tax)</span>
          <input
            type="number"
            step={1000}
            value={inputs.primaryAnnualIncome}
            onChange={(event) => {
              const nextValue = Number(event.target.value);
              setInput("primaryAnnualIncome", nextValue);
              syncHouseholdIncome(nextValue);
            }}
          />
          <small className="muted">Enter gross income before taxes, withholding, and paycheck deductions.</small>
        </label>
        <label className="toggle-card input-group-wide">
          <input
            checked={inputs.spouseIncluded}
            onChange={(event) => {
              const nextValue = event.target.checked;
              setInput("spouseIncluded", nextValue);
              syncHouseholdIncome(inputs.primaryAnnualIncome, inputs.spouseAnnualIncome, nextValue);
              if (nextValue && inputs.filingStatus === "single") {
                setInput("filingStatus", "married");
              }
            }}
            type="checkbox"
          />
          <span>Include spouse or partner in this plan</span>
        </label>
        {inputs.spouseIncluded ? (
          <>
            <label className="input-group">
              <span>Spouse current age</span>
              <input
                type="number"
                step={1}
                value={inputs.spouseAge}
                onChange={(event) => setInput("spouseAge", Number(event.target.value))}
              />
            </label>
            <label className="input-group">
              <span>Spouse target retirement age</span>
              <input
                type="number"
                step={1}
                value={inputs.spouseRetirementAge}
                onChange={(event) => setInput("spouseRetirementAge", Number(event.target.value))}
              />
            </label>
            <label className="input-group input-group-wide">
              <span>Spouse annual income (before tax)</span>
              <input
                type="number"
                step={1000}
                value={inputs.spouseAnnualIncome}
                onChange={(event) => {
                  const nextValue = Number(event.target.value);
                  setInput("spouseAnnualIncome", nextValue);
                  syncHouseholdIncome(inputs.primaryAnnualIncome, nextValue);
                }}
              />
              <small className="muted">
                The model now phases out each person&apos;s income based on their own retirement age.
              </small>
            </label>
          </>
        ) : null}
        <div className="household-income-summary input-group-wide">
          <span>Calculated household income before tax</span>
          <strong>
            {new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: "USD",
              maximumFractionDigits: 0,
            }).format(householdIncome)}
          </strong>
          <small className="muted">Used for the current federal tax estimate and savings-rate calculation.</small>
        </div>
      </div>

      <div className="children-planning-shell">
        <div className="section-head compact-head">
          <div>
            <h3>Children and 529 plans</h3>
            <p className="muted">
              Model children already born or planned for the future. Child expenses and 529
              contributions reduce investable cash before retirement.
            </p>
          </div>
          <button
            className="secondary-action-button"
            onClick={() => setInput("children", [...inputs.children, createChild(inputs.children.length)])}
            type="button"
          >
            <Plus size={16} />
            <span>Add child</span>
          </button>
        </div>

        {inputs.children.length === 0 ? (
          <div className="empty-state muted">No children added yet. Add one to include child costs and 529 planning.</div>
        ) : null}

        <div className="children-grid">
          {inputs.children.map((child, index) => (
            <article className="child-card" key={child.id}>
              <div className="child-card-head">
                <strong>{child.name || `Child ${index + 1}`}</strong>
                <button className="icon-button subtle" onClick={() => removeChild(child.id)} type="button">
                  <Trash2 size={15} />
                </button>
              </div>
              <div className="input-grid child-input-grid">
                <label className="input-group">
                  <span>Name</span>
                  <input
                    onChange={(event) => updateChild(child.id, { name: event.target.value })}
                    type="text"
                    value={child.name}
                  />
                </label>
                <label className="input-group">
                  <span>Status</span>
                  <select
                    onChange={(event) => updateChild(child.id, { status: event.target.value as ChildPlan["status"] })}
                    value={child.status}
                  >
                    <option value="born">Already born</option>
                    <option value="planned">Planned future child</option>
                  </select>
                </label>
                {child.status === "born" ? (
                  <label className="input-group">
                    <span>Current age</span>
                    <input
                      min={0}
                      onChange={(event) => updateChild(child.id, { currentAge: Number(event.target.value) })}
                      step={1}
                      type="number"
                      value={child.currentAge}
                    />
                  </label>
                ) : (
                  <label className="input-group">
                    <span>Years until birth</span>
                    <input
                      min={0}
                      onChange={(event) => updateChild(child.id, { yearsUntilBirth: Number(event.target.value) })}
                      step={1}
                      type="number"
                      value={child.yearsUntilBirth}
                    />
                  </label>
                )}
                <label className="input-group">
                  <span>Annual child cost</span>
                  <input
                    min={0}
                    onChange={(event) => updateChild(child.id, { annualChildCost: Number(event.target.value) })}
                    step={500}
                    type="number"
                    value={child.annualChildCost}
                  />
                </label>
                <label className="input-group">
                  <span>Current 529 balance</span>
                  <input
                    min={0}
                    onChange={(event) => updateChild(child.id, { current529Balance: Number(event.target.value) })}
                    step={500}
                    type="number"
                    value={child.current529Balance}
                  />
                </label>
                <label className="input-group">
                  <span>Annual 529 contribution</span>
                  <input
                    min={0}
                    onChange={(event) => updateChild(child.id, { annual529Contribution: Number(event.target.value) })}
                    step={500}
                    type="number"
                    value={child.annual529Contribution}
                  />
                </label>
                <label className="input-group">
                  <span>College start age</span>
                  <input
                    min={14}
                    onChange={(event) => updateChild(child.id, { collegeStartAge: Number(event.target.value) })}
                    step={1}
                    type="number"
                    value={child.collegeStartAge}
                  />
                </label>
                <label className="input-group">
                  <span>College years</span>
                  <input
                    min={0}
                    onChange={(event) => updateChild(child.id, { collegeYears: Number(event.target.value) })}
                    step={1}
                    type="number"
                    value={child.collegeYears}
                  />
                </label>
                <label className="input-group input-group-wide">
                  <span>Annual college cost estimate</span>
                  <input
                    min={0}
                    onChange={(event) => updateChild(child.id, { annualCollegeCost: Number(event.target.value) })}
                    step={1000}
                    type="number"
                    value={child.annualCollegeCost}
                  />
                  <small className="muted">
                    Current estimate: {formatCurrency(child.annualCollegeCost)} per year before future inflation.
                  </small>
                </label>
              </div>
            </article>
          ))}
        </div>
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
