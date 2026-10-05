# AGENTS.md

Instructions for AI coding agents working in `zedu-mobile` (React Native 0.83, TypeScript, iOS + Android).

**Read `CONTRIBUTING.md` first.** It is the source of truth for the workflow: tickets, branches, commits, testing, CI, PRs and secrets. This file adds only what an agent needs on top of it. Where the two disagree, `CONTRIBUTING.md` wins. `PRODUCT.md` describes what Zedu is: a chat, channels and calls app for learning communities, not an LMS.

## Hard rules

- Work only on a ticket branch in the team's org fork (not a personal fork). Never push to `dev`, `central-staging` or `main`, and never target `zeduchat` directly. PRs go into `zedu-hng/zedu-mobile:dev`.
- Keep the change to what the ticket asks. No drive-by refactors, renames or dependency bumps.
- Don't edit protected files (`.github/`, `AGENTS.md`, `CONTRIBUTING.md`, tooling config; full list in `CONTRIBUTING.md` §6). The **Protected files** check fails the PR unless a reviewer approved the change first.
- One author per PR: commit only as the contributor, never mix in other people's commits.
- Never commit `.env` or any `.env.*` file, keystores, `.pem` files, credential or service-account JSON, or files over 1 MB. The CI file policy rejects them.
- Don't replace or add `android/app/google-services.json` or `ios/GoogleService-Info.plist` unless the ticket says so.
- Never hardcode URLs or keys. Read config from `@env` (`BASE_URL`, `CLIENT_URL`, `CONNECT_URL`, …). If you add a key, declare it in `env.d.ts`.
- Never create `* copy.*` files. Edit the original. (`src/services/agora.service copy.ts` is a known leftover; don't copy the pattern, and don't import from it.)

## Commands

The package manager is **npm** (`npm ci`, `npm run …`; `.npmrc` sets `legacy-peer-deps`). Ignore the stray `pnpm-lock.yaml`, `pnpm-workspace.yaml` and `.pnp.cjs`, and don't regenerate them.

```sh
npm ci                  # install; also runs patch-package and installs husky hooks
npm run check-format    # Prettier
npm run check-lint      # ESLint
npm run check-types     # tsc --noEmit (strict)
npm test                # Jest
npm run android         # or: cd ios && pod install && cd .. && npm run ios
```

Run format, lint, types and tests before declaring a change done. `npm run format` and `npm run lint:fix` fix most style issues.

## Layout

`src/` is layered, with per-domain subfolders inside each layer. Put new code in the matching layer and domain; the PR review bot only accepts files under these paths (plus `App.tsx`):

| Path | Holds |
|---|---|
| `screens/<domain>/` | Screen components (auth, chats, channels, buzz, direct-calls, files, home, mentions, org, settings, agents) |
| `components/` | `ui/` shared primitives, `layout/`, `skeleton/`, and domain components |
| `navigation/` | `navigator.tsx` (root stack + drawer), `tab-navigator.tsx`, `stacks/<domain>/index.tsx`, `types.ts` |
| `services/` | Data-fetching hooks and API calls per domain; call/push logic in `*.service.ts` |
| `centrifugoo/` | Realtime (Centrifugo) connection components. The spelling is intentional; don't rename it. |
| `store/` | Global state: Context + `useReducer` |
| `hooks/`, `lib/`, `utils/`, `types/`, `theme/`, `native/`, `data/` | Shared hooks, auth/permissions, helpers, TS types, theming, native bridges, static data |

## Conventions

- **Reuse the shared components** instead of writing new ones. The PR bot enforces this:
  - `src/components/ui/{button,text,input,bottom-sheet}.tsx`
  - `src/components/layout/chat/messagItem.tsx` (keep the existing spelling)
  - `src/components/layout/chat/voice-recorder.tsx`
  - `src/components/layout/workspace-drawer.tsx`
  - `src/services/agora.service.ts`
- **Imports:** use the `@/` alias (maps to `src/`). `@components/*` is deprecated.
- **State:** global state lives in `src/store` (`useDataContext()` → `{ state, dispatch }`, actions in the `ACTIONS` enum). Screen-local state stays in `useState` inside service hooks. Don't add Redux, Zustand or another state library.
- **Networking:** use the axios helpers in `src/utils/requests.ts` (`GetRequest`, `PostRequest`, …). They attach the bearer token, handle 401 by clearing data, and return `{ data, error }` instead of throwing, so check `error`. Call them from hooks in `src/services/`.
- **Navigation:** React Navigation v7. Add screens to the domain stack in `src/navigation/stacks/<domain>/` and type params in `src/navigation/types.ts`.
- **Styling:** `StyleSheet.create` plus `useTheme().colors` from `src/theme`. Don't use the deprecated `Colors` export. Avoid inline styles (ESLint warns). NativeWind is not installed; don't use `className`.
- **Naming:** kebab-case files (`chat-thread.tsx`, `agora.service.ts`), `useX.ts` hooks, PascalCase components.
- **Lint:** unused imports and variables are errors (prefix a variable with `_` to keep it deliberately). Prettier uses single quotes, trailing commas, and `arrowParens: avoid`.

## Tests

Jest with the `react-native` preset. `jest.setup.js` already stubs native modules (TurboModules, `NativeModules`, OneSignal, reanimated, safe-area, async-storage, gesture-handler), so new tests don't need to mock them again. Follow the test-scope rules in `CONTRIBUTING.md`: tests for what the ticket changed, not retroactive coverage.

## Native projects

- `ios/Podfile.lock` and `ios/Zedu.xcodeproj/project.pbxproj` are committed. Commit changes to them only when the ticket changes native dependencies or project settings, and never hand-edit `project.pbxproj` when a `Podfile` change can do it.
- `patches/` is applied by patch-package on install. Changing a patched library means updating its patch.
- The `ScreenSharing` and `OneSignalNotificationServiceExtension` iOS targets have their own bundle IDs and settings; check them when touching iOS build configuration.

## Commits and PRs

Conventional Commits, enforced by commitlint on every commit and on the PR title. The PR title becomes the squashed commit on `dev`, so make it describe the change. Fill in every section of the PR template, and add the one-line AI-usage note when AI did significant work.
