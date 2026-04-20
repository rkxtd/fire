import type { ReactNode } from "react";
import { Link, useLocation } from "wouter";

import { SaveFileModal } from "@/components/SaveFileModal";

const NAV_ITEMS = [
  { href: "/", label: "Overview" },
  { href: "/fire", label: "FIRE Calculator" },
  { href: "/budget", label: "Budgeting" },
] as const;

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [location] = useLocation();

  return (
    <main className="screen">
      <SaveFileModal />
      <header className="app-topbar panel">
        <Link className="brand-link" href="/">
          <span className="brand-mark">RC</span>
          <span>
            <strong>Retirement Calculator</strong>
            <small>Local-first planning</small>
          </span>
        </Link>
        <nav className="top-nav" aria-label="Primary navigation">
          {NAV_ITEMS.map((item) => (
            <Link
              aria-current={location === item.href ? "page" : undefined}
              className={`nav-link ${location === item.href ? "is-active" : ""}`}
              href={item.href}
              key={item.href}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <div className="page-shell">{children}</div>
    </main>
  );
}
