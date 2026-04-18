import type { BudgetCategory, Goal, Transaction } from "@/lib/db";

export interface CategoryBudgetSummary {
  id: string;
  name: string;
  monthlyTarget: number;
  annualTarget: number;
  monthActual: number;
  yearActual: number;
}

function roundCurrency(value: number) {
  return Number(value.toFixed(2));
}

export function inflateCost(value: number, years: number, inflationRate: number) {
  return roundCurrency(value * (1 + inflationRate / 100) ** Math.max(years, 0));
}

export function discountToToday(value: number, years: number, inflationRate: number) {
  return roundCurrency(value / (1 + inflationRate / 100) ** Math.max(years, 0));
}

export function getCurrentYearBudget(categories: BudgetCategory[]) {
  return categories
    .filter((category) => category.isActive)
    .reduce((total, category) => total + category.annualTarget, 0);
}

export function getCurrentMonthBudget(categories: BudgetCategory[]) {
  return categories
    .filter((category) => category.isActive)
    .reduce((total, category) => total + category.monthlyTarget, 0);
}

export function getCategoryBudgetSummaries(
  categories: BudgetCategory[],
  transactions: Transaction[],
): CategoryBudgetSummary[] {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  return categories
    .filter((category) => category.isActive)
    .map((category) => {
      const relatedExpenses = transactions.filter(
        (transaction) => transaction.kind === "expense" && transaction.categoryId === category.id,
      );
      const monthActual = relatedExpenses
        .filter((transaction) => {
          const transactionDate = new Date(transaction.date);
          return (
            transactionDate.getFullYear() === currentYear &&
            transactionDate.getMonth() === currentMonth
          );
        })
        .reduce((total, transaction) => total + transaction.amount, 0);
      const yearActual = relatedExpenses
        .filter((transaction) => new Date(transaction.date).getFullYear() === currentYear)
        .reduce((total, transaction) => total + transaction.amount, 0);

      return {
        id: category.id,
        name: category.name,
        monthlyTarget: category.monthlyTarget,
        annualTarget: category.annualTarget,
        monthActual: roundCurrency(monthActual),
        yearActual: roundCurrency(yearActual),
      };
    });
}

export function estimateGoalCompletion(goal: Goal) {
  if (goal.currentAmount >= goal.targetAmount) {
    return {
      monthsRemaining: 0,
      reachDate: new Date().toISOString().slice(0, 10),
      isOnTrack: true,
    };
  }

  if (goal.monthlyContribution <= 0) {
    return {
      monthsRemaining: null,
      reachDate: null,
      isOnTrack: false,
    };
  }

  const remaining = Math.max(goal.targetAmount - goal.currentAmount, 0);
  const monthsRemaining = Math.ceil(remaining / goal.monthlyContribution);
  const reachDate = new Date();
  reachDate.setMonth(reachDate.getMonth() + monthsRemaining);
  const isoDate = reachDate.toISOString().slice(0, 10);

  return {
    monthsRemaining,
    reachDate: isoDate,
    isOnTrack: !goal.deadline || isoDate <= goal.deadline,
  };
}

export function projectOpportunityCost(params: {
  purchaseAmount: number;
  alternativeAmount: number;
  currentAge: number;
  retirementAge: number;
  expectedReturn: number;
  inflationRate: number;
}) {
  const yearsToRetirement = Math.max(params.retirementAge - params.currentAge, 0);
  const nominalGrowth = (1 + params.expectedReturn / 100) ** yearsToRetirement;
  const realGrowth = ((1 + params.expectedReturn / 100) / (1 + params.inflationRate / 100)) ** yearsToRetirement;
  const deferValue = params.purchaseAmount * nominalGrowth;
  const cheaperDifference = Math.max(params.purchaseAmount - params.alternativeAmount, 0);
  const purchaseCostAtRetirement = inflateCost(
    params.purchaseAmount,
    yearsToRetirement,
    params.inflationRate,
  );
  const alternativeCostAtRetirement = inflateCost(
    params.alternativeAmount,
    yearsToRetirement,
    params.inflationRate,
  );

  return {
    yearsToRetirement,
    deferValue: roundCurrency(deferValue),
    cheaperOptionValue: roundCurrency(cheaperDifference * nominalGrowth),
    deferValueReal: roundCurrency(params.purchaseAmount * realGrowth),
    cheaperOptionValueReal: roundCurrency(cheaperDifference * realGrowth),
    purchaseCostAtRetirement,
    alternativeCostAtRetirement,
  };
}
