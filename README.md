# Retirement Calculator

A fully client-side retirement and FIRE planning app built with React, TypeScript, and Vite.

This project combines retirement projections, budgeting, recurring transactions, scenario comparison, mortgage analysis, and encrypted local backup into a single static web app. All calculations and storage happen in the browser. There is no backend and no external database.

## Highlights

- Guided onboarding flow with resumable progress
- Retirement and FIRE projections with inflation-aware outputs
- Federal tax estimates, Social Security, pension, and retirement income offsets
- Portfolio allocation analysis and Monte Carlo simulation
- Budget planner with categories, goals, recurring transactions, and CSV import
- Scenario save/load and side-by-side comparison
- Mortgage and loan analysis with amortization preview
- Encrypted `.fire` export/import for portable backups
- Static-site friendly deployment

## Tech Stack

- React 19
- TypeScript
- Vite 7
- Dexie / IndexedDB
- Framer Motion
- Recharts
- Lucide React

## Privacy Model

The app is designed to be local-first:

- Calculator state is stored in `localStorage`
- Budget and planner data are stored in `IndexedDB`
- Exported save files are encrypted in the browser before download
- No user financial data is sent to a backend service

## Local Development

Requirements:

- Node.js 20+ recommended
- npm

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

## Project Structure

```text
client/                  App source and Vite entry root
client/src/components/   UI panels and calculator sections
client/src/contexts/     Calculator and budget state providers
client/src/lib/          Calculation engine, persistence, parsing, analysis
docs/                    Planning and execution documents
vite.config.ts           Root Vite configuration
```

## GitHub Pages

This repository includes a GitHub Pages workflow at `.github/workflows/deploy.yml`.

For a standard project site hosted at:

`https://<username>.github.io/<repo>/`

the current setup is correct as-is.

Steps:

1. Push the repository to GitHub on the `main` branch.
2. In GitHub, open `Settings -> Pages`.
3. Under `Build and deployment`, choose `GitHub Actions`.
4. Push changes to `main` to trigger deployment.

Important:

- This app builds from the repo root, but Vite's app root is `client`.
- The production output uploaded to Pages is `client/dist`.
- The Vite `base` path is controlled through `PAGES_BASE_PATH` in the deployment workflow.

If you deploy this as a user/org site like:

`https://<username>.github.io/`

or behind a custom domain, change the workflow environment variable:

```yaml
PAGES_BASE_PATH: /
```

instead of:

```yaml
PAGES_BASE_PATH: /${{ github.event.repository.name }}/
```

## Open Source Notes

- `node_modules`, build output, local save files, and `.env` files are ignored via `.gitignore`
- `package-lock.json` should stay committed
- The app is intended to be safely hostable as a static site

## License

This project is licensed under the MIT License. See [LICENSE](/Users/rk.xtd/Projects/Codex/RetirementCalculator/LICENSE).
