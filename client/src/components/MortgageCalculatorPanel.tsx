import { useMemo, useState } from "react";
import { Home, Plus, Trash2 } from "lucide-react";

import { useBudget } from "@/contexts/BudgetContext";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatMonths(months: number) {
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  if (years === 0) {
    return `${remainingMonths} mo`;
  }
  if (remainingMonths === 0) {
    return `${years} yr`;
  }
  return `${years} yr ${remainingMonths} mo`;
}

export function MortgageCalculatorPanel() {
  const {
    loans,
    loanAnalyses,
    loanPortfolioSummary,
    addLoan,
    updateLoan,
    removeLoan,
  } = useBudget();
  const [newLoanName, setNewLoanName] = useState("");
  const [newLoanType, setNewLoanType] = useState<"mortgage" | "auto" | "student" | "personal" | "other">("mortgage");
  const [newOriginalAmount, setNewOriginalAmount] = useState(615000);
  const [newRemainingBalance, setNewRemainingBalance] = useState(615000);
  const [newApr, setNewApr] = useState(5.75);
  const [newTermMonths, setNewTermMonths] = useState(360);
  const [newMonthlyExtraPayment, setNewMonthlyExtraPayment] = useState(0);
  const [newAnnualPropertyTax, setNewAnnualPropertyTax] = useState(9600);
  const [newAnnualHomeInsurance, setNewAnnualHomeInsurance] = useState(1800);
  const [newMonthlyPmi, setNewMonthlyPmi] = useState(0);
  const [newMonthlyHoa, setNewMonthlyHoa] = useState(0);
  const [newStartDate, setNewStartDate] = useState(new Date().toISOString().slice(0, 10));

  const selectedLoan = loans[0];
  const selectedAnalysis = useMemo(
    () => loanAnalyses.find((entry) => entry.loanId === selectedLoan?.id)?.analysis,
    [loanAnalyses, selectedLoan],
  );

  async function handleAddLoan() {
    if (!newLoanName.trim()) {
      return;
    }

    await addLoan({
      name: newLoanName.trim(),
      type: newLoanType,
      originalAmount: newOriginalAmount,
      remainingBalance: newRemainingBalance,
      apr: newApr,
      termMonths: newTermMonths,
      monthlyExtraPayment: newMonthlyExtraPayment,
      annualPropertyTax: newAnnualPropertyTax,
      annualHomeInsurance: newAnnualHomeInsurance,
      monthlyPmi: newMonthlyPmi,
      monthlyHoa: newMonthlyHoa,
      startDate: newStartDate,
    });

    setNewLoanName("");
    setNewOriginalAmount(615000);
    setNewRemainingBalance(615000);
    setNewApr(5.75);
    setNewTermMonths(360);
    setNewMonthlyExtraPayment(0);
    setNewAnnualPropertyTax(9600);
    setNewAnnualHomeInsurance(1800);
    setNewMonthlyPmi(0);
    setNewMonthlyHoa(0);
  }

  return (
    <section className="panel mortgage-panel" id="loans">
      <div className="section-head">
        <div>
          <p className="eyebrow">Loans</p>
          <h2>Mortgage and debt calculator</h2>
        </div>
        <div className="security-chip">
          <Home size={16} />
          <span>{formatCurrency(loanPortfolioSummary.totalRemainingBalance)} outstanding</span>
        </div>
      </div>

      <div className="budget-summary-grid mortgage-summary-grid">
        <article className="summary-tile">
          <span>Monthly debt payment</span>
          <strong>{formatCurrency(loanPortfolioSummary.totalMonthlyPayment)}</strong>
        </article>
        <article className="summary-tile">
          <span>Total remaining balance</span>
          <strong>{formatCurrency(loanPortfolioSummary.totalRemainingBalance)}</strong>
        </article>
        <article className="summary-tile">
          <span>Remaining interest</span>
          <strong>{formatCurrency(loanPortfolioSummary.totalInterestRemaining)}</strong>
        </article>
      </div>

      <div className="editor-card mortgage-editor">
        <input
          className="editor-input"
          onChange={(event) => setNewLoanName(event.target.value)}
          placeholder="Loan name"
          type="text"
          value={newLoanName}
        />
        <select
          className="editor-input compact"
          onChange={(event) =>
            setNewLoanType(event.target.value as "mortgage" | "auto" | "student" | "personal" | "other")
          }
          value={newLoanType}
        >
          <option value="mortgage">Mortgage</option>
          <option value="auto">Auto</option>
          <option value="student">Student</option>
          <option value="personal">Personal</option>
          <option value="other">Other</option>
        </select>
        <input className="editor-input compact" min={0} onChange={(event) => setNewOriginalAmount(Number(event.target.value))} step={1000} type="number" value={newOriginalAmount} />
        <input className="editor-input compact" min={0} onChange={(event) => setNewRemainingBalance(Number(event.target.value))} step={1000} type="number" value={newRemainingBalance} />
        <input className="editor-input compact" min={0} onChange={(event) => setNewApr(Number(event.target.value))} step={0.01} type="number" value={newApr} />
        <input className="editor-input compact" min={1} onChange={(event) => setNewTermMonths(Number(event.target.value))} step={1} type="number" value={newTermMonths} />
        <input className="editor-input compact" min={0} onChange={(event) => setNewMonthlyExtraPayment(Number(event.target.value))} step={50} type="number" value={newMonthlyExtraPayment} />
        <input className="editor-input compact" min={0} onChange={(event) => setNewAnnualPropertyTax(Number(event.target.value))} step={100} type="number" value={newAnnualPropertyTax} />
        <input className="editor-input compact" min={0} onChange={(event) => setNewAnnualHomeInsurance(Number(event.target.value))} step={100} type="number" value={newAnnualHomeInsurance} />
        <input className="editor-input compact" min={0} onChange={(event) => setNewMonthlyPmi(Number(event.target.value))} step={25} type="number" value={newMonthlyPmi} />
        <input className="editor-input compact" min={0} onChange={(event) => setNewMonthlyHoa(Number(event.target.value))} step={25} type="number" value={newMonthlyHoa} />
        <input className="editor-input compact" onChange={(event) => setNewStartDate(event.target.value)} type="date" value={newStartDate} />
        <button className="icon-button" onClick={() => void handleAddLoan()} type="button">
          <Plus size={16} />
        </button>
      </div>

      <div className="list-stack mortgage-list">
        {loans.map((loan) => {
          const analysis = loanAnalyses.find((entry) => entry.loanId === loan.id)?.analysis;
          if (!analysis) {
            return null;
          }

          return (
            <div className="mortgage-row" key={loan.id}>
              <input
                className="editor-input"
                onChange={(event) => void updateLoan(loan.id, { name: event.target.value })}
                type="text"
                value={loan.name}
              />
              <select
                className="editor-input compact"
                onChange={(event) =>
                  void updateLoan(loan.id, {
                    type: event.target.value as "mortgage" | "auto" | "student" | "personal" | "other",
                  })
                }
                value={loan.type}
              >
                <option value="mortgage">Mortgage</option>
                <option value="auto">Auto</option>
                <option value="student">Student</option>
                <option value="personal">Personal</option>
                <option value="other">Other</option>
              </select>
              <input
                className="editor-input compact"
                min={0}
                onChange={(event) => void updateLoan(loan.id, { remainingBalance: Number(event.target.value) })}
                step={1000}
                type="number"
                value={loan.remainingBalance}
              />
              <input
                className="editor-input compact"
                min={0}
                onChange={(event) => void updateLoan(loan.id, { apr: Number(event.target.value) })}
                step={0.01}
                type="number"
                value={loan.apr}
              />
              <input
                className="editor-input compact"
                min={1}
                onChange={(event) => void updateLoan(loan.id, { termMonths: Number(event.target.value) })}
                step={1}
                type="number"
                value={loan.termMonths}
              />
              <input
                className="editor-input compact"
                min={0}
                onChange={(event) => void updateLoan(loan.id, { monthlyExtraPayment: Number(event.target.value) })}
                step={50}
                type="number"
                value={loan.monthlyExtraPayment}
              />
              <span className="transaction-source">{formatCurrency(analysis.totalMonthlyPayment)} / mo</span>
              <span className="transaction-source">{formatMonths(analysis.payoffMonthsRemaining)}</span>
              <button className="icon-button subtle" onClick={() => void removeLoan(loan.id)} type="button">
                <Trash2 size={15} />
              </button>
            </div>
          );
        })}
        {loans.length === 0 ? <div className="empty-state muted">No loans yet. Add your mortgage or other debt above.</div> : null}
      </div>

      {selectedLoan && selectedAnalysis ? (
        <div className="mortgage-preview-card">
          <div className="section-head">
            <div>
              <h3>{selectedLoan.name} amortization preview</h3>
              <p className="muted">
                P&amp;I {formatCurrency(selectedAnalysis.monthlyPrincipalAndInterest)} plus escrow {formatCurrency(selectedAnalysis.monthlyEscrow)}.
              </p>
            </div>
            <div className="monte-carlo-stats">
              <span>Payoff {formatMonths(selectedAnalysis.payoffMonthsRemaining)}</span>
              <span>Interest {formatCurrency(selectedAnalysis.totalInterestRemaining)}</span>
            </div>
          </div>
          <div className="list-stack amortization-list">
            {selectedAnalysis.amortizationPreview.map((row) => (
              <div className="amortization-row" key={row.month}>
                <span>Month {row.month}</span>
                <span>Payment {formatCurrency(row.payment)}</span>
                <span>Principal {formatCurrency(row.principal)}</span>
                <span>Interest {formatCurrency(row.interest)}</span>
                <span>Balance {formatCurrency(row.endingBalance)}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
