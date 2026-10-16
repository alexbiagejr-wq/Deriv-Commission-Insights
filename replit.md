# Deriv Commission Insights

A native mobile app for Deriv partners to monitor commission, registered-app markup, and read-only live account activity.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- Use the managed `artifacts/deriv-commission-insights: expo` workflow to run the mobile app.
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/deriv-commission-insights/app/` — Expo Router screens
- `artifacts/deriv-commission-insights/lib/deriv.ts` — Deriv Partner REST client and report types
- `artifacts/deriv-commission-insights/lib/auth.tsx` — PAT/OAuth connection and secure token storage
- `artifacts/deriv-commission-insights/lib/live-account.tsx` — authenticated read-only WebSocket state

## Architecture decisions

- Partner commissions and registered-app markup come from Deriv's official REST APIs; the account balance and transaction feed use Deriv's WebSocket API.
- Personal tokens are stored with device secure storage on iOS/Android. Browser preview keeps credentials in memory only; it does not persist them.
- OAuth requires a registered Deriv client ID and an exact registered redirect URL. The app requests `application_read` and `trade` so it can read partner reports and establish the live account connection; it does not submit trades.
- The current reporting scope is Deriv partner reporting and Deriv-registered apps, not arbitrary external affiliate networks.

## Product

The app connects through a Deriv Personal Access Token or OAuth authorization. It shows paid and pending partner commission, signup/trading activity, registered-app markup breakdowns, and live balance/transaction updates.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Deriv partner endpoints require the `application_read` permission; the account must have a partner profile.
- OAuth callback URLs must match the URL registered in Deriv exactly.
- Expo SecureStore is native-only for this app; do not persist credentials to AsyncStorage in browser preview.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
