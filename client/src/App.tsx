import { Redirect, Route, Router, Switch } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { Toaster } from "sonner";

import { AppShell } from "@/components/AppShell";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { TooltipProvider } from "@/components/TooltipProvider";
import { BudgetProvider } from "@/contexts/BudgetContext";
import { CalculatorProvider } from "@/contexts/CalculatorContext";
import { BudgetPage } from "@/pages/BudgetPage";
import { FirePage } from "@/pages/FirePage";
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
              <Router hook={useHashLocation}>
                <AppShell>
                  <Switch>
                    <Route path="/" component={Home} />
                    <Route path="/fire" component={FirePage} />
                    <Route path="/budget" component={BudgetPage} />
                    <Route>
                      <Redirect to="/" />
                    </Route>
                  </Switch>
                </AppShell>
              </Router>
            </BudgetProvider>
          </CalculatorProvider>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
