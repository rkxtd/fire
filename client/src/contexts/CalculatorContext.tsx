import {
  createContext,
  type PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { DEFAULT_INPUTS, type CalculatorInputs } from "@/lib/calculator";

interface CalculatorContextValue {
  inputs: CalculatorInputs;
  setInput: <K extends keyof CalculatorInputs>(key: K, value: CalculatorInputs[K]) => void;
  replaceInputs: (nextInputs: CalculatorInputs) => void;
  reset: () => void;
}

const STORAGE_KEY = "retirement-calculator.inputs";

const CalculatorContext = createContext<CalculatorContextValue | null>(null);

function normalizeInputs(rawInputs: Partial<CalculatorInputs>): CalculatorInputs {
  const merged = {
    ...DEFAULT_INPUTS,
    ...rawInputs,
  } satisfies CalculatorInputs;

  if (rawInputs.spouseIncluded === undefined) {
    merged.spouseIncluded = merged.filingStatus === "married";
  }

  if (rawInputs.primaryAnnualIncome === undefined && rawInputs.spouseAnnualIncome === undefined) {
    if (merged.spouseIncluded) {
      merged.primaryAnnualIncome = Math.round(merged.annualIncome * 0.67);
      merged.spouseAnnualIncome = Math.max(merged.annualIncome - merged.primaryAnnualIncome, 0);
    } else {
      merged.primaryAnnualIncome = merged.annualIncome;
      merged.spouseAnnualIncome = 0;
    }
  }

  merged.annualIncome = merged.primaryAnnualIncome + (merged.spouseIncluded ? merged.spouseAnnualIncome : 0);
  merged.children = (rawInputs.children ?? []).map((child, index) => ({
    id: child.id || `child-${index + 1}`,
    name: child.name || `Child ${index + 1}`,
    status: child.status ?? "born",
    currentAge: child.currentAge ?? 0,
    yearsUntilBirth: child.yearsUntilBirth ?? 0,
    annualChildCost: child.annualChildCost ?? 12000,
    current529Balance: child.current529Balance ?? 0,
    annual529Contribution: child.annual529Contribution ?? 3000,
    collegeStartAge: child.collegeStartAge ?? 18,
    collegeYears: child.collegeYears ?? 4,
    annualCollegeCost: child.annualCollegeCost ?? 30000,
  }));

  return merged;
}

function loadInputs(): CalculatorInputs {
  if (typeof window === "undefined") {
    return DEFAULT_INPUTS;
  }

  const storedValue = window.localStorage.getItem(STORAGE_KEY);
  if (!storedValue) {
    return DEFAULT_INPUTS;
  }

  try {
    return normalizeInputs(JSON.parse(storedValue) as Partial<CalculatorInputs>);
  } catch {
    return DEFAULT_INPUTS;
  }
}

export function CalculatorProvider({ children }: PropsWithChildren) {
  const [inputs, setInputs] = useState<CalculatorInputs>(loadInputs);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(inputs));
    }, 300);

    return () => window.clearTimeout(timer);
  }, [inputs]);

  const value = useMemo<CalculatorContextValue>(
    () => ({
      inputs,
      setInput: (key, nextValue) => {
        setInputs((current) => ({
          ...current,
          [key]: nextValue,
        }));
      },
      replaceInputs: (nextInputs) => {
        setInputs(normalizeInputs(nextInputs));
      },
      reset: () => setInputs(DEFAULT_INPUTS),
    }),
    [inputs],
  );

  return <CalculatorContext.Provider value={value}>{children}</CalculatorContext.Provider>;
}

export function useCalculator() {
  const context = useContext(CalculatorContext);
  if (!context) {
    throw new Error("useCalculator must be used within CalculatorProvider");
  }

  return context;
}
