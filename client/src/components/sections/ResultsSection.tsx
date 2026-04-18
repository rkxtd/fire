import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PiggyBank, Target, TrendingUp } from "lucide-react";

import type { CalculatorResults } from "@/lib/calculator";

interface ResultsSectionProps {
  results: CalculatorResults;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatMoneyPair(nominal: number, real: number) {
  return `${formatCurrency(nominal)} / ${formatCurrency(real)}`;
}

export function ResultsSection({ results }: ResultsSectionProps) {
  return (
    <section className="results-layout" id="results">
      <div className="metrics-grid">
        <article className="metric-card panel">
          <Target size={18} />
          <span>FIRE number today</span>
          <strong>{formatCurrency(results.fireNumber)}</strong>
          <small className="muted">Retirement-year dollars: {formatCurrency(results.fireNumberAtRetirement)}</small>
        </article>
        <article className="metric-card panel">
          <PiggyBank size={18} />
          <span>Current gap</span>
          <strong>{formatCurrency(results.gapToFire)}</strong>
        </article>
        <article className="metric-card panel">
          <TrendingUp size={18} />
          <span>Projected at retirement</span>
          <strong>{formatCurrency(results.projectedSavingsAtRetirement)}</strong>
          <small className="muted">Today&apos;s dollars: {formatCurrency(results.projectedSavingsAtRetirementReal)}</small>
        </article>
      </div>

      <div className="panel chart-panel">
        <div className="section-head">
          <div>
            <p className="eyebrow">Section 5</p>
            <h2>Results dashboard</h2>
          </div>
          <p className="muted">A calm summary that makes the tradeoffs readable without noise.</p>
        </div>
        <div className="insight-grid">
          <div className="insight-card">
            <span>Adjusted spending</span>
            <strong>{formatMoneyPair(results.adjustedAnnualSpendingAtRetirement, results.adjustedAnnualSpending)}</strong>
            <small className="muted">Retirement year / today&apos;s dollars</small>
          </div>
          <div className="insight-card">
            <span>Savings rate</span>
            <strong>{results.savingsRate}%</strong>
          </div>
          <div className="insight-card">
            <span>Real return</span>
            <strong>{results.realReturnRate}%</strong>
          </div>
          <div className="insight-card">
            <span>Progress to FIRE</span>
            <strong>{results.fireProgress}%</strong>
          </div>
          <div className="insight-card">
            <span>Current federal tax</span>
            <strong>{formatCurrency(results.currentFederalTax)}</strong>
          </div>
          <div className="insight-card">
            <span>Retirement federal tax</span>
            <strong>{formatCurrency(results.retirementFederalTax)}</strong>
          </div>
          <div className="insight-card">
            <span>Social Security income</span>
            <strong>{formatCurrency(results.socialSecurityAnnualBenefit)}</strong>
          </div>
          <div className="insight-card">
            <span>Pension income</span>
            <strong>{formatCurrency(results.pensionAnnualBenefit)}</strong>
          </div>
          <div className="insight-card">
            <span>Income coverage</span>
            <strong>{results.retirementIncomeCoverage}%</strong>
          </div>
          <div className="insight-card">
            <span>Retirement gap after income</span>
            <strong>{formatMoneyPair(results.retirementGapAfterIncomeAtRetirement, results.retirementGapAfterIncome)}</strong>
            <small className="muted">Retirement year / today&apos;s dollars</small>
          </div>
          <div className="insight-card">
            <span>Estimated full retirement age</span>
            <strong>{results.fullRetirementAge}</strong>
          </div>
          <div className="insight-card">
            <span>Portfolio expected return</span>
            <strong>{results.portfolioAnalysis.expectedReturn}%</strong>
          </div>
          <div className="insight-card">
            <span>Portfolio volatility</span>
            <strong>{results.portfolioAnalysis.volatility}%</strong>
          </div>
          <div className="insight-card">
            <span>Allocation mix</span>
            <strong>{results.portfolioAnalysis.allocationMix}</strong>
          </div>
          <div className="insight-card">
            <span>Diversification</span>
            <strong>{results.portfolioAnalysis.diversificationScore}%</strong>
          </div>
          <div className="insight-card">
            <span>Monte Carlo success</span>
            <strong>{results.monteCarlo.successRate}%</strong>
          </div>
          <div className="insight-card">
            <span>Median ending balance</span>
            <strong>{formatMoneyPair(results.monteCarlo.medianEndingBalance, results.monteCarlo.medianEndingBalanceReal)}</strong>
            <small className="muted">Nominal / today&apos;s dollars</small>
          </div>
        </div>
        <div className="allocation-grid">
          {results.portfolioAnalysis.allocations.map((allocation) => (
            <article className="allocation-card" key={allocation.label}>
              <span>{allocation.label}</span>
              <strong>{allocation.allocation}%</strong>
            </article>
          ))}
        </div>
        <div className="scenario-grid">
          {results.scenarios.map((scenario) => (
            <article className="scenario-card" key={scenario.style}>
              <span>{scenario.label}</span>
              <strong>{formatCurrency(scenario.fireNumber)}</strong>
              <p className="muted">
                FIRE age {scenario.ageAtFire} with a {formatCurrency(scenario.retirementGap)} annual
                portfolio draw target.
              </p>
            </article>
          ))}
        </div>
        <div className="monte-carlo-card">
          <div className="section-head">
            <div>
              <h3>Monte Carlo range</h3>
              <p className="muted">
                {results.monteCarlo.runs} runs with seeded portfolio returns for stable comparisons.
                Inflation factor to retirement: {results.inflationMultiplierToRetirement}x.
              </p>
            </div>
            <div className="monte-carlo-stats">
              <span>P10 {formatMoneyPair(results.monteCarlo.percentile10EndingBalance, results.monteCarlo.percentile10EndingBalanceReal)}</span>
              <span>P90 {formatMoneyPair(results.monteCarlo.percentile90EndingBalance, results.monteCarlo.percentile90EndingBalanceReal)}</span>
            </div>
          </div>
          <div className="chart-shell monte-carlo-shell">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={results.monteCarlo.percentiles}>
                <CartesianGrid stroke="rgba(64, 81, 104, 0.12)" strokeDasharray="4 4" />
                <XAxis dataKey="age" tickLine={false} axisLine={false} />
                <YAxis
                  tickFormatter={(value) => `$${Math.round(value / 1000)}k`}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip formatter={(value: number, name) => {
                  if (name === "p90") {
                    return formatCurrency(value);
                  }
                  if (name === "p50") {
                    return formatCurrency(value);
                  }
                  if (name === "p10") {
                    return formatCurrency(value);
                  }
                  return formatCurrency(value);
                }} />
                <Line type="monotone" dataKey="p90" stroke="rgba(15, 107, 136, 0.35)" dot={false} strokeWidth={2} />
                <Line type="monotone" dataKey="p50" stroke="var(--accent-strong)" dot={false} strokeWidth={3} />
                <Line type="monotone" dataKey="p10" stroke="rgba(198, 106, 61, 0.6)" dot={false} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="chart-shell">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={results.projections}>
              <defs>
                <linearGradient id="projectionFill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="5%" stopColor="var(--accent-strong)" stopOpacity={0.28} />
                  <stop offset="95%" stopColor="var(--accent-strong)" stopOpacity={0.03} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(64, 81, 104, 0.12)" strokeDasharray="4 4" />
              <XAxis dataKey="age" tickLine={false} axisLine={false} />
              <YAxis
                tickFormatter={(value) => `$${Math.round(value / 1000)}k`}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip formatter={(value: number, name, item) => {
                if (name === "balance" && item?.payload?.realBalance !== undefined) {
                  return `${formatCurrency(value)} nominal, ${formatCurrency(item.payload.realBalance)} today`;
                }
                return formatCurrency(value);
              }} />
              <ReferenceLine
                y={results.fireNumber}
                stroke="var(--accent-warm)"
                strokeDasharray="6 6"
                ifOverflow="extendDomain"
              />
              <Area
                type="monotone"
                dataKey="balance"
                stroke="var(--accent-strong)"
                fill="url(#projectionFill)"
                strokeWidth={3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}
