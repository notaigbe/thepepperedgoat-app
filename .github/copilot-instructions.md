<!-- Copilot instructions for working with the Ooosum / Jagabans Rewards app -->
# Copilot usage notes — Jagabans Rewards (Expo + Supabase)

This file gives focused, actionable guidance for AI coding agents working in this repository.

- **Project type:** Expo + React Native (web + native) using TypeScript and `expo-router`.
- **Key directories:** `app/` (screens & routing), `components/` (reusable UI), `contexts/` (React Context providers), `services/` (API wrappers e.g. `supabaseService`), `docs/` (integration and setup guides), `assets/` (fonts/images).

Architecture notes
- Routing uses `expo-router` with file-based routes under `app/`. Look at `app/_layout.tsx` for the root `Stack` and modal presentations (many screens use `presentation: 'modal'`).
- Global state and data flows are implemented via React Contexts placed in `contexts/` (notably `AppContext.tsx` and `AuthContext.tsx`). `AppContext` orchestrates data fetching from `services/supabaseService` and subscribes to Supabase realtime channels.
- Backend integration is primarily Supabase (see `app/integrations/supabase/client` and `services/supabaseService`). Real-time updates are used for orders via Supabase Realtime channels in `AppContext`.
- Payments: Stripe native integration exists (`@stripe/stripe-react-native`) and the app stores payment-methods via `paymentMethodService` (used in `AppContext`). Respect platform-specific files (e.g. `payment-methods.native.tsx` vs `payment-methods.tsx`).

Developer workflows
- Start development (Metro + Expo): `npm run dev` (uses `expo start --clear`). For LAN/tunnel/local variants use `dev:lan`, `dev:localhost`, `dev:tunnel` in `package.json`.
- Build web: `npm run build:web` (exports and runs Workbox). Android prebuild: `npm run build:android` (uses `expo prebuild -p android`). EAS is referenced (see `eas.json`) for managed build flows.
- Linting: `npm run lint` (ESLint + TypeScript). Avoid changing project-level Babel or metro configs unless necessary (see `babel.config.js` and `metro.config.js`).

Conventions & patterns to follow
- Use the `@/` path alias (imports throughout the codebase use `@/components`, `@/services`, etc.). Keep imports consistent with existing module-resolver config.
- Platform-specific code: authors use suffixes like `.native.tsx` for native-only screens. When editing cross-platform screens, check for `.native` or platform-specific branches.
- Data services live in `services/` and return raw Supabase rows which contexts map to application `types` (see `contexts/AppContext.tsx` mapping logic). Follow the same mapping approach when adding new service methods.
- UI and presentation: many screens are presented as modals in router config — changing navigation behavior often requires edits to `app/_layout.tsx`.

Integration points to watch
- Supabase client: `app/integrations/supabase/client` — be careful with auth/session changes and realtime tokens (`supabase.realtime.setAuth(...)` seen in `AppContext`).
- Payment flows: `@stripe/stripe-react-native` + `paymentMethodService` — avoid exposing secret keys in code; follow docs in `docs/STRIPE_*`.
- Native modules and fonts: fonts are loaded in `app/_layout.tsx`; ensure assets are bundled and `expo-font` usage is preserved.

Editing guidance for AI agents
- Make small, focused changes; prefer adding new files over large rewrites. Update `docs/` when adding developer-visible behavior or setup changes.
- When touching state or service code, run the app locally via `npm run dev` and use the Expo dev client for native tests. Mention exact commands in PR descriptions.
- Preserve existing data mapping patterns from `AppContext.tsx` and service return shapes. If you add fields to Supabase tables, update service methods and mapping in one change.

Where to look for examples
- Routing & screens: `app/_layout.tsx` and files under `app/` (see `(tabs)` grouping).
- Global state and Supabase usage: `contexts/AppContext.tsx`.
- Service wrappers: `services/supabaseService` (search for `paymentMethodService`, `menuService`, `orderService`).
- Integration how-tos: `docs/` (search `STRIPE`, `SUPABASE`, `INITIAL_SETUP` for platform-specific instructions).

If anything here is unclear, tell me which area (routing, services, payments, or realtime) and I'll expand with concrete file links and code examples.
