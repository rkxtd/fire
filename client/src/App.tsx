import { Route, Switch } from "wouter";
import { Toaster } from "sonner";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { TooltipProvider } from "@/components/TooltipProvider";
import { BudgetProvider } from "@/contexts/BudgetContext";
import { CalculatorProvider } from "@/contexts/CalculatorContext";
import { Home } from "@/pages/Home";
import { ThemeProvider } from "@/providers/ThemeProvider";

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" storageKey="retirement-calculator-theme">
        <TooltipProvider>
          <CalculatorProvider>
            <BudgetProvider>
              <Toaster richColors position="top-right" />
              <Switch>
                <Route path="/" component={Home} />
              </Switch>
            </BudgetProvider>
          </CalculatorProvider>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
