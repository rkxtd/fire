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

function loadInputs(): CalculatorInputs {
  if (typeof window === "undefined") {
    return DEFAULT_INPUTS;
  }

  const storedValue = window.localStorage.getItem(STORAGE_KEY);
  if (!storedValue) {
    return DEFAULT_INPUTS;
  }

  try {
    return {
      ...DEFAULT_INPUTS,
      ...JSON.parse(storedValue),
    } satisfies CalculatorInputs;
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
        setInputs({
          ...DEFAULT_INPUTS,
          ...nextInputs,
        });
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
