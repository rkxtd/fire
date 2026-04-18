import type { Loan } from "@/lib/db";

export interface AmortizationRow {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  extraPayment: number;
  endingBalance: number;
}

export interface LoanAnalysis {
  monthlyPrincipalAndInterest: number;
  monthlyEscrow: number;
  totalMonthlyPayment: number;
  payoffMonthsRemaining: number;
  totalInterestRemaining: number;
  amortizationPreview: AmortizationRow[];
}

function roundCurrency(value: number) {
  return Number(value.toFixed(2));
}

export function calculateMonthlyPrincipalAndInterest(loan: Loan) {
  const principal = loan.originalAmount;
  const monthlyRate = loan.apr / 100 / 12;
  const months = Math.max(loan.termMonths, 1);

  if (monthlyRate === 0) {
    return roundCurrency(principal / months);
  }

  const payment =
    (principal * monthlyRate * (1 + monthlyRate) ** months) /
    ((1 + monthlyRate) ** months - 1);

  return roundCurrency(payment);
}

export function analyzeLoan(loan: Loan): LoanAnalysis {
  const monthlyPrincipalAndInterest = calculateMonthlyPrincipalAndInterest(loan);
  const monthlyEscrow =
    loan.annualPropertyTax / 12 +
    loan.annualHomeInsurance / 12 +
    loan.monthlyPmi +
    loan.monthlyHoa;
  const totalMonthlyPayment =
    monthlyPrincipalAndInterest + monthlyEscrow + loan.monthlyExtraPayment;

  let balance = loan.remainingBalance;
  const monthlyRate = loan.apr / 100 / 12;
  let monthsRemaining = 0;
  let totalInterestRemaining = 0;
  const amortizationPreview: AmortizationRow[] = [];

  while (balance > 0.01 && monthsRemaining < 600) {
    const interest = monthlyRate === 0 ? 0 : balance * monthlyRate;
    const scheduledPrincipal = Math.max(monthlyPrincipalAndInterest - interest, 0);
    const principalPayment = Math.min(
      balance,
      scheduledPrincipal + loan.monthlyExtraPayment,
    );
    const extraPayment = Math.max(principalPayment - scheduledPrincipal, 0);
    const payment = Math.min(balance + interest, monthlyPrincipalAndInterest + loan.monthlyExtraPayment);
    balance = Math.max(balance - principalPayment, 0);
    monthsRemaining += 1;
    totalInterestRemaining += interest;

    if (amortizationPreview.length < 12) {
      amortizationPreview.push({
        month: monthsRemaining,
        payment: roundCurrency(payment),
        principal: roundCurrency(principalPayment),
        interest: roundCurrency(interest),
        extraPayment: roundCurrency(extraPayment),
        endingBalance: roundCurrency(balance),
      });
    }
  }

  return {
    monthlyPrincipalAndInterest: roundCurrency(monthlyPrincipalAndInterest),
    monthlyEscrow: roundCurrency(monthlyEscrow),
    totalMonthlyPayment: roundCurrency(totalMonthlyPayment),
    payoffMonthsRemaining: monthsRemaining,
    totalInterestRemaining: roundCurrency(totalInterestRemaining),
    amortizationPreview,
  };
}

export function getLoanPortfolioSummary(loans: Loan[]) {
  const activeLoans = loans.filter((loan) => loan.isActive);
  return activeLoans.reduce(
    (summary, loan) => {
      const analysis = analyzeLoan(loan);
      summary.totalRemainingBalance += loan.remainingBalance;
      summary.totalMonthlyPayment += analysis.totalMonthlyPayment;
      summary.totalInterestRemaining += analysis.totalInterestRemaining;
      return summary;
    },
    {
      totalRemainingBalance: 0,
      totalMonthlyPayment: 0,
      totalInterestRemaining: 0,
    },
  );
}
