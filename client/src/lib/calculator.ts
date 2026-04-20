export interface ChildPlan {
  id: string;
  name: string;
  status: "born" | "planned";
  currentAge: number;
  yearsUntilBirth: number;
  annualChildCost: number;
  current529Balance: number;
  annual529Contribution: number;
  collegeStartAge: number;
  collegeYears: number;
  annualCollegeCost: number;
}

export interface CalculatorInputs {
  currentAge: number;
  targetRetirementAge: number;
  filingStatus: "single" | "married";
  annualIncome: number;
  primaryAnnualIncome: number;
  spouseIncluded: boolean;
  spouseAge: number;
  spouseAnnualIncome: number;
  spouseRetirementAge: number;
  children: ChildPlan[];
  currentSavings: number;
  annualContribution: number;
  annualSpending: number;
  useBudgetSpending: boolean;
  plannedRetirementIncome: number;
  socialSecurityMonthlyBenefit: number;
  socialSecurityClaimAge: number;
  pensionAnnualBenefit: number;
  pensionStartAge: number;
  stockAllocation: number;
  bondAllocation: number;
  cashAllocation: number;
  monteCarloRuns: number;
  expectedReturn: number;
  inflationRate: number;
  withdrawalRate: number;
  fireStyle: "lean" | "standard" | "fat";
  locationTier: "lcol" | "mcol" | "hcol";
}

export interface YearProjection {
  age: number;
  balance: number;
  realBalance: number;
  targetBalance: number;
  netCashFlow: number;
  taxes: number;
}

export interface ScenarioSummary {
  style: "lean" | "standard" | "fat";
  label: string;
  fireNumber: number;
  yearsToFire: number;
  ageAtFire: number;
  retirementGap: number;
}

export interface MonteCarloPoint {
  age: number;
  p10: number;
  p50: number;
  p90: number;
  p10Real: number;
  p50Real: number;
  p90Real: number;
}

export interface MonteCarloSummary {
  runs: number;
  successRate: number;
  medianEndingBalance: number;
  medianEndingBalanceReal: number;
  percentile10EndingBalance: number;
  percentile10EndingBalanceReal: number;
  percentile90EndingBalance: number;
  percentile90EndingBalanceReal: number;
  percentiles: MonteCarloPoint[];
}

export interface PortfolioAllocationPoint {
  label: string;
  allocation: number;
}

export interface PortfolioAnalysis {
  expectedReturn: number;
  volatility: number;
  allocationMix: string;
  diversificationScore: number;
  allocations: PortfolioAllocationPoint[];
}

export interface CalculatorResults {
  fireNumber: number;
  fireNumberAtRetirement: number;
  estimatedAgeAtFire: number;
  yearsToFire: number;
  projectedSavingsAtRetirement: number;
  projectedSavingsAtRetirementReal: number;
  gapToFire: number;
  adjustedAnnualSpending: number;
  adjustedAnnualSpendingAtRetirement: number;
  savingsRate: number;
  fireProgress: number;
  realReturnRate: number;
  currentFederalTax: number;
  retirementFederalTax: number;
  socialSecurityAnnualBenefit: number;
  pensionAnnualBenefit: number;
  retirementIncomeCoverage: number;
  retirementGapAfterIncome: number;
  retirementGapAfterIncomeAtRetirement: number;
  activeChildCount: number;
  annualChildCostToday: number;
  annual529Contribution: number;
  projected529BalanceAtCollegeStart: number;
  estimatedCollegeFundingGap: number;
  childCostThroughRetirement: number;
  fullRetirementAge: number;
  inflationMultiplierToRetirement: number;
  monteCarlo: MonteCarloSummary;
  portfolioAnalysis: PortfolioAnalysis;
  scenarios: ScenarioSummary[];
  projections: YearProjection[];
}

export const DEFAULT_INPUTS: CalculatorInputs = {
  currentAge: 35,
  targetRetirementAge: 55,
  filingStatus: "married",
  annualIncome: 150000,
  primaryAnnualIncome: 100000,
  spouseIncluded: true,
  spouseAge: 35,
  spouseAnnualIncome: 50000,
  spouseRetirementAge: 55,
  children: [],
  currentSavings: 180000,
  annualContribution: 32000,
  annualSpending: 60000,
  useBudgetSpending: false,
  plannedRetirementIncome: 18000,
  socialSecurityMonthlyBenefit: 3200,
  socialSecurityClaimAge: 67,
  pensionAnnualBenefit: 12000,
  pensionStartAge: 65,
  stockAllocation: 75,
  bondAllocation: 20,
  cashAllocation: 5,
  monteCarloRuns: 500,
  expectedReturn: 7,
  inflationRate: 2.5,
  withdrawalRate: 4,
  fireStyle: "standard",
  locationTier: "mcol",
};

const TAX_BRACKETS_2025 = {
  single: [
    { upTo: 11925, rate: 0.1 },
    { upTo: 48475, rate: 0.12 },
    { upTo: 103350, rate: 0.22 },
    { upTo: 197300, rate: 0.24 },
    { upTo: 250525, rate: 0.32 },
    { upTo: 626350, rate: 0.35 },
    { upTo: Number.POSITIVE_INFINITY, rate: 0.37 },
  ],
  married: [
    { upTo: 23850, rate: 0.1 },
    { upTo: 96950, rate: 0.12 },
    { upTo: 206700, rate: 0.22 },
    { upTo: 394600, rate: 0.24 },
    { upTo: 501050, rate: 0.32 },
    { upTo: 751600, rate: 0.35 },
    { upTo: Number.POSITIVE_INFINITY, rate: 0.37 },
  ],
} as const;

const STANDARD_DEDUCTION_2025 = {
  single: 15750,
  married: 31500,
} as const;

const FIRE_STYLE_MULTIPLIERS = {
  lean: 0.9,
  standard: 1,
  fat: 1.18,
} as const;

const LOCATION_MULTIPLIERS = {
  lcol: 0.9,
  mcol: 1,
  hcol: 1.14,
} as const;

const ASSET_ASSUMPTIONS = {
  stocks: { expectedReturn: 0.09, volatility: 0.18 },
  bonds: { expectedReturn: 0.042, volatility: 0.06 },
  cash: { expectedReturn: 0.025, volatility: 0.01 },
} as const;

const CORRELATIONS = {
  stocks: { stocks: 1, bonds: 0.2, cash: 0 },
  bonds: { stocks: 0.2, bonds: 1, cash: 0.1 },
  cash: { stocks: 0, bonds: 0.1, cash: 1 },
} as const;

function roundCurrency(value: number) {
  return Number(value.toFixed(2));
}

function roundPercent(value: number) {
  return Number(value.toFixed(1));
}

function createSeededRandom(seed: number) {
  let value = seed >>> 0;

  return function next() {
    value += 0x6d2b79f5;
    let t = value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashInputSeed(inputs: CalculatorInputs) {
  const source = JSON.stringify(inputs);
  let hash = 2166136261;

  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function randomNormal(rng: () => number) {
  const u1 = Math.max(rng(), 1e-9);
  const u2 = Math.max(rng(), 1e-9);
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

function getNormalizedAllocations(inputs: CalculatorInputs) {
  const total = Math.max(inputs.stockAllocation + inputs.bondAllocation + inputs.cashAllocation, 1);

  return {
    stocks: inputs.stockAllocation / total,
    bonds: inputs.bondAllocation / total,
    cash: inputs.cashAllocation / total,
  };
}

function percentile(values: number[], ratio: number) {
  if (values.length === 0) {
    return 0;
  }

  const sorted = [...values].sort((left, right) => left - right);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.round((sorted.length - 1) * ratio)));
  return sorted[index];
}

function getInflationFactor(years: number, inflationRate: number) {
  return (1 + inflationRate) ** Math.max(years, 0);
}

export function analyzePortfolio(inputs: CalculatorInputs): PortfolioAnalysis {
  const weights = getNormalizedAllocations(inputs);
  const expectedReturn =
    weights.stocks * ASSET_ASSUMPTIONS.stocks.expectedReturn +
    weights.bonds * ASSET_ASSUMPTIONS.bonds.expectedReturn +
    weights.cash * ASSET_ASSUMPTIONS.cash.expectedReturn;
  const variance =
    weights.stocks ** 2 * ASSET_ASSUMPTIONS.stocks.volatility ** 2 +
    weights.bonds ** 2 * ASSET_ASSUMPTIONS.bonds.volatility ** 2 +
    weights.cash ** 2 * ASSET_ASSUMPTIONS.cash.volatility ** 2 +
    2 *
      weights.stocks *
      weights.bonds *
      ASSET_ASSUMPTIONS.stocks.volatility *
      ASSET_ASSUMPTIONS.bonds.volatility *
      CORRELATIONS.stocks.bonds +
    2 *
      weights.stocks *
      weights.cash *
      ASSET_ASSUMPTIONS.stocks.volatility *
      ASSET_ASSUMPTIONS.cash.volatility *
      CORRELATIONS.stocks.cash +
    2 *
      weights.bonds *
      weights.cash *
      ASSET_ASSUMPTIONS.bonds.volatility *
      ASSET_ASSUMPTIONS.cash.volatility *
      CORRELATIONS.bonds.cash;
  const volatility = Math.sqrt(Math.max(variance, 0));
  const concentration = Math.max(weights.stocks, weights.bonds, weights.cash);
  const allocationMix =
    weights.stocks >= 0.8 ? "Growth-heavy" : weights.stocks >= 0.55 ? "Balanced growth" : "Capital preservation";

  return {
    expectedReturn: roundPercent(expectedReturn * 100),
    volatility: roundPercent(volatility * 100),
    allocationMix,
    diversificationScore: roundPercent((1 - concentration) * 100),
    allocations: [
      { label: "Stocks", allocation: roundPercent(weights.stocks * 100) },
      { label: "Bonds", allocation: roundPercent(weights.bonds * 100) },
      { label: "Cash", allocation: roundPercent(weights.cash * 100) },
    ],
  };
}

export function calculateFederalTax(income: number, filingStatus: CalculatorInputs["filingStatus"]) {
  const taxableIncome = Math.max(income - STANDARD_DEDUCTION_2025[filingStatus], 0);
  const brackets = TAX_BRACKETS_2025[filingStatus];
  let previousCeiling = 0;
  let totalTax = 0;

  for (const bracket of brackets) {
    if (taxableIncome <= previousCeiling) {
      break;
    }

    const amountInBracket = Math.min(taxableIncome, bracket.upTo) - previousCeiling;
    totalTax += amountInBracket * bracket.rate;
    previousCeiling = bracket.upTo;
  }

  return roundCurrency(totalTax);
}

export function getFullRetirementAge(currentAge: number) {
  const currentYear = new Date().getFullYear();
  const birthYear = currentYear - currentAge;

  if (birthYear <= 1954) {
    return 66;
  }
  if (birthYear === 1955) {
    return 66 + 2 / 12;
  }
  if (birthYear === 1956) {
    return 66 + 4 / 12;
  }
  if (birthYear === 1957) {
    return 66 + 6 / 12;
  }
  if (birthYear === 1958) {
    return 66 + 8 / 12;
  }
  if (birthYear === 1959) {
    return 66 + 10 / 12;
  }
  return 67;
}

export function calculateSocialSecurityBenefit(
  monthlyBenefitAtFra: number,
  claimAge: number,
  fullRetirementAge: number,
) {
  const roundedClaimAge = Math.max(Math.min(claimAge, 70), 62);
  const deltaMonths = Math.round((roundedClaimAge - fullRetirementAge) * 12);

  if (deltaMonths === 0) {
    return roundCurrency(monthlyBenefitAtFra * 12);
  }

  if (deltaMonths < 0) {
    const monthsEarly = Math.abs(deltaMonths);
    const first36 = Math.min(monthsEarly, 36);
    const additionalMonths = Math.max(monthsEarly - 36, 0);
    const reduction = first36 * (5 / 9 / 100) + additionalMonths * (5 / 12 / 100);
    return roundCurrency(monthlyBenefitAtFra * (1 - reduction) * 12);
  }

  const delayedMonths = Math.min(deltaMonths, Math.round((70 - fullRetirementAge) * 12));
  const increase = delayedMonths * (2 / 3 / 100);
  return roundCurrency(monthlyBenefitAtFra * (1 + increase) * 12);
}

function getAdjustedAnnualSpending(
  inputs: CalculatorInputs,
  fireStyle: CalculatorInputs["fireStyle"] = inputs.fireStyle,
) {
  return roundCurrency(
    inputs.annualSpending * FIRE_STYLE_MULTIPLIERS[fireStyle] * LOCATION_MULTIPLIERS[inputs.locationTier],
  );
}

export function getCurrentHouseholdIncome(inputs: CalculatorInputs) {
  return inputs.primaryAnnualIncome + (inputs.spouseIncluded ? inputs.spouseAnnualIncome : 0);
}

function getSpouseRetirementPrimaryAge(inputs: CalculatorInputs) {
  if (!inputs.spouseIncluded) {
    return inputs.targetRetirementAge;
  }

  return inputs.currentAge + Math.max(inputs.spouseRetirementAge - inputs.spouseAge, 0);
}

function getHouseholdRetirementPrimaryAge(inputs: CalculatorInputs) {
  return Math.max(inputs.targetRetirementAge, getSpouseRetirementPrimaryAge(inputs));
}

function getWorkingIncomeForYear(inputs: CalculatorInputs, year: number) {
  const primaryAge = inputs.currentAge + year;
  const spouseAge = inputs.spouseAge + year;
  const primaryIncome = primaryAge < inputs.targetRetirementAge ? inputs.primaryAnnualIncome : 0;
  const spouseIncome =
    inputs.spouseIncluded && spouseAge < inputs.spouseRetirementAge ? inputs.spouseAnnualIncome : 0;

  return primaryIncome + spouseIncome;
}

function getChildAgeForYear(child: ChildPlan, year: number) {
  if (child.status === "born") {
    return child.currentAge + year;
  }

  return year - child.yearsUntilBirth;
}

function getYearsToCollege(child: ChildPlan) {
  if (child.status === "born") {
    return Math.max(child.collegeStartAge - child.currentAge, 0);
  }

  return child.yearsUntilBirth + child.collegeStartAge;
}

function analyzeChildren(inputs: CalculatorInputs) {
  const annualReturn = inputs.expectedReturn / 100;
  const inflationRate = inputs.inflationRate / 100;
  const yearsToHouseholdRetirement = Math.max(getHouseholdRetirementPrimaryAge(inputs) - inputs.currentAge, 0);
  let activeChildCount = 0;
  let annualChildCostToday = 0;
  let annual529Contribution = 0;
  let projected529BalanceAtCollegeStart = 0;
  let estimatedCollegeFundingGap = 0;
  let childCostThroughRetirement = 0;

  for (const child of inputs.children) {
    const currentChildAge = child.status === "born" ? child.currentAge : -child.yearsUntilBirth;
    if (currentChildAge >= 0 && currentChildAge < 18) {
      activeChildCount += 1;
      annualChildCostToday += child.annualChildCost * LOCATION_MULTIPLIERS[inputs.locationTier];
    }

    annual529Contribution += child.annual529Contribution;

    const yearsToCollege = getYearsToCollege(child);
    let projected529Balance = child.current529Balance;

    for (let year = 0; year < yearsToCollege; year += 1) {
      const childAge = getChildAgeForYear(child, year);
      if (childAge >= 0) {
        projected529Balance += child.annual529Contribution;
      }
      projected529Balance *= 1 + annualReturn;
    }

    const totalCollegeCost =
      child.annualCollegeCost *
      Math.max(child.collegeYears, 0) *
      getInflationFactor(yearsToCollege, inflationRate);

    projected529BalanceAtCollegeStart += projected529Balance;
    estimatedCollegeFundingGap += Math.max(totalCollegeCost - projected529Balance, 0);

    for (let year = 0; year <= yearsToHouseholdRetirement; year += 1) {
      const childAge = getChildAgeForYear(child, year);
      if (childAge < 0) {
        continue;
      }

      const inflationFactor = getInflationFactor(year, inflationRate);
      if (childAge < 18) {
        childCostThroughRetirement +=
          child.annualChildCost * LOCATION_MULTIPLIERS[inputs.locationTier] * inflationFactor;
      }
      if (childAge < child.collegeStartAge) {
        childCostThroughRetirement += child.annual529Contribution;
      }
    }
  }

  return {
    activeChildCount,
    annualChildCostToday: roundCurrency(annualChildCostToday),
    annual529Contribution: roundCurrency(annual529Contribution),
    projected529BalanceAtCollegeStart: roundCurrency(projected529BalanceAtCollegeStart),
    estimatedCollegeFundingGap: roundCurrency(estimatedCollegeFundingGap),
    childCostThroughRetirement: roundCurrency(childCostThroughRetirement),
  };
}

function getChildCashFlowForYear(
  inputs: CalculatorInputs,
  child529Balances: Map<string, number>,
  year: number,
) {
  const annualReturn = inputs.expectedReturn / 100;
  const inflationRate = inputs.inflationRate / 100;
  const inflationFactor = getInflationFactor(year, inflationRate);
  let livingCost = 0;
  let contribution529 = 0;
  let collegeGap = 0;

  for (const child of inputs.children) {
    const childAge = getChildAgeForYear(child, year);
    if (childAge < 0) {
      continue;
    }

    const current529Balance = (child529Balances.get(child.id) ?? child.current529Balance) * (1 + annualReturn);

    if (childAge < 18) {
      livingCost += child.annualChildCost * LOCATION_MULTIPLIERS[inputs.locationTier] * inflationFactor;
    }

    if (childAge < child.collegeStartAge) {
      contribution529 += child.annual529Contribution;
      child529Balances.set(child.id, current529Balance + child.annual529Contribution);
      continue;
    }

    if (childAge < child.collegeStartAge + child.collegeYears) {
      const collegeCost = child.annualCollegeCost * inflationFactor;
      const coveredBy529 = Math.min(current529Balance, collegeCost);
      child529Balances.set(child.id, current529Balance - coveredBy529);
      collegeGap += collegeCost - coveredBy529;
      continue;
    }

    child529Balances.set(child.id, current529Balance);
  }

  return {
    livingCost,
    contribution529,
    collegeGap,
    total: livingCost + contribution529 + collegeGap,
  };
}

function buildScenarioSummary(inputs: CalculatorInputs): ScenarioSummary[] {
  return ([
    { style: "lean", label: "Lean" },
    { style: "standard", label: "Classic" },
    { style: "fat", label: "Fat" },
  ] as const).map((scenario) => {
    const spending = getAdjustedAnnualSpending(inputs, scenario.style);
    const socialSecurityAnnualBenefit = calculateSocialSecurityBenefit(
      inputs.socialSecurityMonthlyBenefit,
      inputs.socialSecurityClaimAge,
      getFullRetirementAge(inputs.currentAge),
    );
    const retirementIncome =
      inputs.plannedRetirementIncome +
      socialSecurityAnnualBenefit +
      (inputs.pensionStartAge <= inputs.targetRetirementAge ? inputs.pensionAnnualBenefit : 0);
    const retirementGap = Math.max(spending - retirementIncome, 0);
    const fireNumber = inputs.withdrawalRate === 0 ? Number.POSITIVE_INFINITY : retirementGap / (inputs.withdrawalRate / 100);
    const yearsToFire =
      inputs.annualContribution <= 0 || inputs.currentSavings >= fireNumber
        ? 0
        : Math.ceil((fireNumber - inputs.currentSavings) / inputs.annualContribution);

    return {
      style: scenario.style,
      label: scenario.label,
      fireNumber: roundCurrency(fireNumber),
      yearsToFire,
      ageAtFire: inputs.currentAge + yearsToFire,
      retirementGap: roundCurrency(retirementGap),
    };
  });
}

function runMonteCarlo(
  inputs: CalculatorInputs,
  retirementGapAfterIncome: number,
  socialSecurityAnnualBenefit: number,
  adjustedAnnualSpending: number,
): MonteCarloSummary {
  const runs = Math.max(100, Math.min(inputs.monteCarloRuns, 5000));
  const portfolio = analyzePortfolio(inputs);
  const meanReturn = portfolio.expectedReturn / 100;
  const volatility = portfolio.volatility / 100;
  const inflationRate = inputs.inflationRate / 100;
  const projectionEndAge = Math.max(getHouseholdRetirementPrimaryAge(inputs) + 25, 95);
  const projectionYears = Math.max(projectionEndAge - inputs.currentAge, 1);
  const balancesByYear = Array.from({ length: projectionYears + 1 }, () => [] as number[]);
  const realBalancesByYear = Array.from({ length: projectionYears + 1 }, () => [] as number[]);
  const endingBalances: number[] = [];
  let successCount = 0;
  const rng = createSeededRandom(hashInputSeed(inputs));

  for (let run = 0; run < runs; run += 1) {
    let balance = inputs.currentSavings;
    let success = true;
    const child529Balances = new Map(inputs.children.map((child) => [child.id, child.current529Balance]));

    for (let year = 0; year <= projectionYears; year += 1) {
      const age = inputs.currentAge + year;
      const inflationFactor = getInflationFactor(year, inflationRate);
      balancesByYear[year].push(balance);
      realBalancesByYear[year].push(balance / inflationFactor);
      const workingIncome = getWorkingIncomeForYear(inputs, year);
      const contribution = workingIncome > 0 ? inputs.annualContribution : 0;
      const childCashFlow = getChildCashFlowForYear(inputs, child529Balances, year);
      const availableContribution = Math.max(contribution - childCashFlow.total, 0);
      const socialSecurityIncome = age >= inputs.socialSecurityClaimAge ? socialSecurityAnnualBenefit : 0;
      const pensionIncome = age >= inputs.pensionStartAge ? inputs.pensionAnnualBenefit : 0;
      const retirementIncome = age >= inputs.targetRetirementAge ? inputs.plannedRetirementIncome + socialSecurityIncome + pensionIncome : 0;
      const taxableIncome =
        workingIncome > 0
          ? workingIncome
          : inputs.plannedRetirementIncome + pensionIncome + socialSecurityIncome * 0.85;
      const taxes = calculateFederalTax(taxableIncome, inputs.filingStatus);
      const spendingNeed = adjustedAnnualSpending * inflationFactor;
      const netCashFlow =
        workingIncome > 0
          ? availableContribution
          : retirementIncome - taxes - spendingNeed - childCashFlow.total;
      const sampledReturn = Math.max(-0.45, meanReturn + randomNormal(rng) * volatility);

      balance *= 1 + sampledReturn;
      balance += netCashFlow;

      if (workingIncome > 0) {
        balance += 0;
      } else if (balance < 0) {
        success = false;
        balance = 0;
      }
    }

    endingBalances.push(balance);
    if (success && balance > 0) {
      successCount += 1;
    }
  }

  return {
    runs,
    successRate: roundPercent((successCount / runs) * 100),
    medianEndingBalance: roundCurrency(percentile(endingBalances, 0.5)),
    medianEndingBalanceReal: roundCurrency(
      percentile(endingBalances, 0.5) / getInflationFactor(projectionYears, inflationRate),
    ),
    percentile10EndingBalance: roundCurrency(percentile(endingBalances, 0.1)),
    percentile10EndingBalanceReal: roundCurrency(
      percentile(endingBalances, 0.1) / getInflationFactor(projectionYears, inflationRate),
    ),
    percentile90EndingBalance: roundCurrency(percentile(endingBalances, 0.9)),
    percentile90EndingBalanceReal: roundCurrency(
      percentile(endingBalances, 0.9) / getInflationFactor(projectionYears, inflationRate),
    ),
    percentiles: balancesByYear.map((balances, index) => ({
      age: inputs.currentAge + index,
      p10: roundCurrency(percentile(balances, 0.1)),
      p50: roundCurrency(percentile(balances, 0.5)),
      p90: roundCurrency(percentile(balances, 0.9)),
      p10Real: roundCurrency(percentile(realBalancesByYear[index], 0.1)),
      p50Real: roundCurrency(percentile(realBalancesByYear[index], 0.5)),
      p90Real: roundCurrency(percentile(realBalancesByYear[index], 0.9)),
    })),
  };
}

export function runCalculation(inputs: CalculatorInputs): CalculatorResults {
  const annualReturn = inputs.expectedReturn / 100;
  const inflationRate = inputs.inflationRate / 100;
  const safeWithdrawalRate = inputs.withdrawalRate / 100;
  const yearsToRetirement = Math.max(inputs.targetRetirementAge - inputs.currentAge, 0);
  const inflationMultiplierToRetirement = getInflationFactor(yearsToRetirement, inflationRate);
  const adjustedAnnualSpending = getAdjustedAnnualSpending(inputs);
  const adjustedAnnualSpendingAtRetirement = adjustedAnnualSpending * inflationMultiplierToRetirement;
  const fullRetirementAge = getFullRetirementAge(inputs.currentAge);
  const socialSecurityAnnualBenefit = calculateSocialSecurityBenefit(
    inputs.socialSecurityMonthlyBenefit,
    inputs.socialSecurityClaimAge,
    fullRetirementAge,
  );
  const currentHouseholdIncome = getCurrentHouseholdIncome(inputs);
  const currentFederalTax = calculateFederalTax(currentHouseholdIncome, inputs.filingStatus);
  const retirementTaxableIncome =
    inputs.plannedRetirementIncome +
    inputs.pensionAnnualBenefit +
    socialSecurityAnnualBenefit * 0.85;
  const retirementFederalTax = calculateFederalTax(retirementTaxableIncome, inputs.filingStatus);
  const incomeAvailableAtRetirement =
    inputs.plannedRetirementIncome +
    socialSecurityAnnualBenefit +
    (inputs.pensionStartAge <= inputs.targetRetirementAge ? inputs.pensionAnnualBenefit : 0);
  const retirementGapAfterIncome = Math.max(
    adjustedAnnualSpending - incomeAvailableAtRetirement + retirementFederalTax,
    0,
  );
  const retirementGapAfterIncomeAtRetirement =
    retirementGapAfterIncome * inflationMultiplierToRetirement;
  const portfolioAnalysis = analyzePortfolio(inputs);
  const fireNumber =
    safeWithdrawalRate === 0 ? Number.POSITIVE_INFINITY : retirementGapAfterIncome / safeWithdrawalRate;
  const fireNumberAtRetirement =
    safeWithdrawalRate === 0
      ? Number.POSITIVE_INFINITY
      : retirementGapAfterIncomeAtRetirement / safeWithdrawalRate;
  const realReturnRate = ((1 + annualReturn) / (1 + inflationRate) - 1) * 100;
  const savingsRate = currentHouseholdIncome === 0 ? 0 : (inputs.annualContribution / currentHouseholdIncome) * 100;
  const childSummary = analyzeChildren(inputs);

  let balance = inputs.currentSavings;
  let ageAtFire = inputs.currentAge;
  let reachedFire = balance >= fireNumber;
  const projectionEndAge = Math.max(getHouseholdRetirementPrimaryAge(inputs) + 25, 95);
  const projectionYears = Math.max(projectionEndAge - inputs.currentAge, 1);
  const projections: YearProjection[] = [];
  const child529Balances = new Map(inputs.children.map((child) => [child.id, child.current529Balance]));

  for (let year = 0; year <= projectionYears; year += 1) {
    const age = inputs.currentAge + year;
    const inflationFactor = (1 + inflationRate) ** year;
    const workingIncome = getWorkingIncomeForYear(inputs, year);
    const contribution = workingIncome > 0 ? inputs.annualContribution : 0;
    const childCashFlow = getChildCashFlowForYear(inputs, child529Balances, year);
    const availableContribution = Math.max(contribution - childCashFlow.total, 0);
    const socialSecurityIncome = age >= inputs.socialSecurityClaimAge ? socialSecurityAnnualBenefit : 0;
    const pensionIncome = age >= inputs.pensionStartAge ? inputs.pensionAnnualBenefit : 0;
    const taxableRetirementIncome =
      age >= inputs.targetRetirementAge
        ? inputs.plannedRetirementIncome + pensionIncome + socialSecurityIncome * 0.85
        : workingIncome;
    const taxes = calculateFederalTax(taxableRetirementIncome, inputs.filingStatus);
    const spendingNeed = adjustedAnnualSpending * inflationFactor;
    const retirementIncome = age >= inputs.targetRetirementAge ? inputs.plannedRetirementIncome + socialSecurityIncome + pensionIncome : 0;
    const netCashFlow =
      workingIncome > 0
        ? workingIncome - taxes - spendingNeed - childCashFlow.total + availableContribution
        : retirementIncome - taxes - spendingNeed - childCashFlow.total;

    projections.push({
      age,
      balance: roundCurrency(balance),
      realBalance: roundCurrency(balance / inflationFactor),
      targetBalance: roundCurrency(fireNumber),
      netCashFlow: roundCurrency(netCashFlow),
      taxes: roundCurrency(taxes),
    });

    if (!reachedFire && balance >= fireNumber) {
      ageAtFire = age;
      reachedFire = true;
    }

      balance = balance * (1 + annualReturn);

    if (workingIncome > 0) {
      balance += availableContribution;
    } else {
      balance += netCashFlow;
    }
  }

  const retirementProjection = projections.find((projection) => projection.age === inputs.targetRetirementAge);
  const projectedSavingsAtRetirement = retirementProjection?.balance ?? inputs.currentSavings;
  const projectedSavingsAtRetirementReal =
    retirementProjection?.realBalance ?? inputs.currentSavings;
  const monteCarlo = runMonteCarlo(
    inputs,
    retirementGapAfterIncome,
    socialSecurityAnnualBenefit,
    adjustedAnnualSpending,
  );

  return {
    fireNumber: roundCurrency(fireNumber),
    fireNumberAtRetirement: roundCurrency(fireNumberAtRetirement),
    estimatedAgeAtFire: reachedFire ? ageAtFire : inputs.targetRetirementAge,
    yearsToFire: reachedFire ? Math.max(ageAtFire - inputs.currentAge, 0) : Math.max(inputs.targetRetirementAge - inputs.currentAge, 0),
    projectedSavingsAtRetirement: roundCurrency(projectedSavingsAtRetirement),
    projectedSavingsAtRetirementReal: roundCurrency(projectedSavingsAtRetirementReal),
    gapToFire: roundCurrency(Math.max(fireNumber - inputs.currentSavings, 0)),
    adjustedAnnualSpending: roundCurrency(adjustedAnnualSpending),
    adjustedAnnualSpendingAtRetirement: roundCurrency(adjustedAnnualSpendingAtRetirement),
    savingsRate: Number(savingsRate.toFixed(1)),
    fireProgress: fireNumber === 0 ? 100 : Number(Math.min((inputs.currentSavings / fireNumber) * 100, 100).toFixed(1)),
    realReturnRate: Number(realReturnRate.toFixed(1)),
    currentFederalTax,
    retirementFederalTax,
    socialSecurityAnnualBenefit: roundCurrency(socialSecurityAnnualBenefit),
    pensionAnnualBenefit: roundCurrency(inputs.pensionAnnualBenefit),
    retirementIncomeCoverage: adjustedAnnualSpending === 0 ? 100 : Number(Math.min((incomeAvailableAtRetirement / adjustedAnnualSpending) * 100, 999).toFixed(1)),
    retirementGapAfterIncome: roundCurrency(retirementGapAfterIncome),
    retirementGapAfterIncomeAtRetirement: roundCurrency(retirementGapAfterIncomeAtRetirement),
    activeChildCount: childSummary.activeChildCount,
    annualChildCostToday: childSummary.annualChildCostToday,
    annual529Contribution: childSummary.annual529Contribution,
    projected529BalanceAtCollegeStart: childSummary.projected529BalanceAtCollegeStart,
    estimatedCollegeFundingGap: childSummary.estimatedCollegeFundingGap,
    childCostThroughRetirement: childSummary.childCostThroughRetirement,
    fullRetirementAge: Number(fullRetirementAge.toFixed(2)),
    inflationMultiplierToRetirement: Number(inflationMultiplierToRetirement.toFixed(3)),
    monteCarlo,
    portfolioAnalysis,
    scenarios: buildScenarioSummary(inputs),
    projections,
  };
}
