## 1. Remove the search bar and A1/A2/B1/B2 chips

In `src/routes/index.tsx`, strip the whole filter section: search input, level chips, clear button, "X lists match" hint, and all related state (`SearchState`, `validateSearch`, `useSearch`, `update`, `toggleLevel`, `clearAll`, `matchesFilters`, `listHaystack`, `haystacks`, `filteredBands`, `filterActive`). The home page renders the full BANDS list directly again. `LevelAccordion` loses its `forceOpen` prop and goes back to default-open A1.

Remove unused imports (`Search`, `X`, `useMemo`, `useNavigate`, `useSearch`-related helpers).

## 2. Bottom navbar + Profile page

Add a fixed bottom nav with two tabs: **Home** (`/`) and **Profile** (`/profile`). It uses TanStack `<Link>` with `activeProps`, sits above the existing `pb-24` spacing, and is rendered once from `src/routes/__root.tsx` so every page has it.

New route `src/routes/profile.tsx`:
- **Guest mode (default)**: shows local stats pulled from the existing zustand `useTrainerStore` — total reps, sentences practiced, mastered count (5★), favorites count, and a small per-level breakdown. A banner explains "You're in guest mode — progress is saved on this device only" with **Sign in** / **Create account** buttons.
- **Signed in**: same stats card plus email, "Signed in as …", and **Sign out**. (Stats stay local for now; cloud sync is out of scope for this turn — we can add a follow-up to mirror `progress` into a Supabase table.)
- A "Continue as guest" link/button dismisses the auth prompt if the user opens the auth view.

### Auth

Login/register requires **Lovable Cloud** (currently not enabled in this project). Enabling it provisions the backend so we can use email/password sign-in. Default providers: email/password + Google. Confirm before we enable.

Profile data: I'll ask whether we need a `profiles` table (username/avatar) or just use `auth.users` for now.

## Technical details

- `__root.tsx`: add `<BottomNav />` component inside `RootComponent`, after `<Outlet />`. Hide on `/auth` route if we add one.
- `src/components/BottomNav.tsx`: new, fixed bottom, two `<Link>`s with `Home` and `User` icons from lucide.
- `src/routes/profile.tsx`: public route. Reads `useTrainerStore((s) => s.progress)` + `favorites`. Computes totals across all lists via `BANDS` from `@/lib/trainer/levels`. Renders either guest banner or signed-in header based on `supabase.auth` session (once Cloud is on).
- `src/routes/index.tsx`: revert to pre-filter version structurally; keep the hero, BANDS rendering, and `LevelAccordion`.
- No changes to sentence/grammar data or training logic.

## Questions before I implement

1. OK to enable Lovable Cloud for auth? (Needed for sign in / register.)
2. Sign-in methods: email/password only, or also Google?
3. Do you want a `profiles` table now (username, avatar) or just plain `auth.users`?
4. Should progress sync to the cloud when signed in, or stay local-only for this turn?
