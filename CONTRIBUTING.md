# Contributing to Zedu Mobile

Zedu Mobile is the React Native app for iOS and Android. This guide covers how work gets from an approved ticket into Zedu.

The short version:

> Approved ticket → work in your team's fork, against your team's backend → CI green in your fork (Tier 1) → PR to `zedu-hng/zedu-mobile:dev` → review + review build (Tier 2) → squash merge → reviewers promote to Zedu.

## 1. Ground rules

- **Every change needs an approved ticket** in ClickUp or Linear. Nothing starts from an untracked chat request.
- **One ticket per PR.** If you find another problem, open another ticket rather than widening this PR.
- **You never push to `zedu-hng` or `zeduchat` directly.** All work happens in your fork and comes in as a PR.
- **AI is a tool, not an authority.** You own everything you submit. If you can't explain it, don't submit it.

## 2. How the repositories fit together

```
zeduchat/zedu-mobile            Zedu's repo. Reviewers send batches here; you never touch it.
  └─ zedu-hng/zedu-mobile       Review org. Your PRs land here.
       └─ <your-team>/zedu-mobile   Your team's fork. You work here.
```

| Branch in `zedu-hng` | Purpose | Who merges |
|---|---|---|
| `dev` (default) | All PRs land here, from teams and reviewers alike. | Reviewers, squash merge |
| `staging` | What's ready to go to Zedu; mirrors `zeduchat:staging`. | Reviewers promote `dev` → `staging` |

Fork from **`zedu-hng/zedu-mobile`**, not from `zeduchat`. Otherwise your PRs and **Sync fork** point at the wrong repo.

## 3. One-time setup (per team)

1. Fork `zedu-hng/zedu-mobile` into your team's GitHub org.
2. In the fork, go to **Actions** and enable workflows. Forks have them off by default, and Tier 1 CI runs there.
3. Point CI at your team's backend: in the fork, go to **Settings → Secrets and variables → Actions → Variables**, and add `APP_ENV_FILE` containing your full `.env` (the keys are listed in `env.d.ts`). CI writes it to `.env` before building. Without it, builds succeed but the app has no backend.
4. Each contributor clones the **team fork**:

   ```sh
   git clone https://github.com/<your-team>/zedu-mobile.git
   cd zedu-mobile
   npm ci
   ```

5. Create a local `.env` with your team's values, using the same keys as `env.d.ts`. Never commit it.
6. Follow the [React Native environment setup](https://reactnative.dev/docs/set-up-your-environment), then run `npm run android` / `npm run ios` (see README).

`npm ci` installs Husky git hooks. On commit, Prettier, ESLint, TypeScript and lint-staged run, and commitlint checks your message.

## 4. Working on a ticket

1. Move the ticket to **IN PROGRESS**.
2. Sync your fork's `dev` from `zedu-hng` (GitHub **Sync fork** button), then pull.
3. Branch from `dev` using the ticket ID:

   ```
   <type>/<ticket-id>-<short-description>
   ```

   Types: `feat`, `fix`, `test`, `docs`, `refactor`, `chore`, `perf`, `security`. Example: `fix/245-android-crash-on-resume`.

4. Commit with [Conventional Commits](https://www.conventionalcommits.org/): `feat: add offline quiz caching`, `fix: handle expired auth token`. Commitlint rejects `update`, `changes`, `final`, and friends. The PR title must pass commitlint too, and it becomes the squashed commit message.

## 5. Testing

Run the same checks CI runs:

```sh
npm run check-format   # Prettier
npm run check-lint     # ESLint
npm run check-types    # TypeScript
npm test               # Jest
npm run security:audit
```

Build and run the app on at least the platform your change touches: Android via `npm run android`, and iOS via `pod install` + `npm run ios` if you have a Mac. Test against **your team's backend**.

**What tests you need:**

- **Non-UI code** (business logic, state, services/API layer, utilities): unit tests for what the ticket changed.
- **UI code:** a component test for the changed component. Integration/E2E tests only for new or changed *critical* flows (auth, payments, anything data-destructive).
- **Only what your ticket touched.** Not retroactive coverage of pre-existing untested code in the same file. If you notice a real gap, file a separate ticket.

For UI changes, check layout, accessibility labels and interaction states (loading, empty, error) on at least two screen sizes.

**File policy:** PRs may not add `.env` or `.env.*` files, keystores, `.pem` files, credential or service-account JSON, or files over 1 MB. Stage files deliberately.

## 6. CI: two tiers

**Tier 1: your fork, on every push.** Pushing to any branch in your fork runs the full set: checks, security scans, and the Android APK and iOS simulator builds. It uses your fork's own Actions minutes, which are free and unlimited on public repos, macOS runners included. **Don't open a PR until Tier 1 is green.** Link the passing run in your PR.

**Tier 2: `zedu-hng`, after review.** On your PR, checks run on every push, but review builds don't. When a reviewer is ready to try your change, they add the **`ready-for-build`** label. That builds the APK and iOS simulator app once and posts download links on the PR. To rebuild after new pushes, a reviewer removes and re-adds the label.

On a first-time contribution, a maintainer has to approve the workflow run before anything runs.

## 7. Open the PR

1. Open a PR from your fork's ticket branch into **`zedu-hng/zedu-mobile:dev`**. Open it from the ticket branch, not your fork's `dev`: that would drag in everything else merged there.
2. Fill in the PR template completely:
   - the ticket link;
   - what changed and why;
   - how to test and what to expect;
   - your Tier 1 run link;
   - screenshots or a recording for visible changes, on the platforms you changed;
   - the AI-usage line.
3. Move the ticket to **IN REVIEW**.

## 8. Review and merge

- **1 reviewer approval** is required, and it must come after your last push.
- All review threads must be resolved. Don't resolve a thread without actually addressing it.
- To address feedback, push to the same ticket branch. Checks re-run.
- Reviewers **squash-merge** into `dev`. Your PR title becomes the commit message, so keep it conventional.
- Contributors don't merge their own PRs.

After merge, reviewers promote `dev` → `staging` with a merge commit, and send `staging` to `zeduchat` in batches. The ticket goes **MERGED → VERIFIED → CLOSED** once the change is verified.

## 9. Security and secrets

Never commit:

- API keys, tokens or passwords;
- keystores, private keys, or provisioning profiles and certificates;
- cloud or database credentials;
- `.env` files with real values;
- user data.

`google-services.json` and `GoogleService-Info.plist` are already in the repo. Don't add new ones or replace them without a reviewer's sign-off.

Anything in `.env` or compiled into the app is readable by anyone who has the app. Real secrets belong on the backend, not in the client.

If you expose a secret, deleting it in the next commit is not enough. Tell a reviewer immediately so it can be rotated.

## 10. AI usage

AI is fine for explaining code, drafting implementations, tests, debugging, refactoring and docs.

Don't:

- paste generated code you haven't read;
- submit code you can't explain;
- give AI tools secrets or user data;
- treat AI output as a substitute for testing or review.

For significant AI-assisted changes, add one line to the PR saying how AI was used.

## 11. Definition of done

- Acceptance criteria met.
- Tier 1 green in your fork, and checks green on the PR.
- Approved, with all threads resolved.
- Merged into `zedu-hng:dev`.
- Verified on the build.
- Ticket closed in ClickUp or Linear.

## 12. Getting unstuck

Ask in your team's channel first, then the project channel. For a blocker, include:

- the ticket number;
- what you were trying to do;
- what happened, with the error or build output;
- what you already tried;
- what help you need.
