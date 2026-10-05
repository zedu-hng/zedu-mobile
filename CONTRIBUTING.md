# Contributing to Zedu Mobile

Zedu Mobile is the React Native app for iOS and Android. This guide covers how work gets from an approved ticket into Zedu.

The short version:

> Approved ticket → ticket branch in your team's fork → test against your team's backend → **one PR** to `zedu-hng/zedu-mobile:dev` → your fork builds it → team lead approves → Zedu reviewers review with that build → squash merge → your team syncs.

## 1. Ground rules

- **Every change needs an approved ticket** in ClickUp or Linear. Nothing starts from an untracked chat request.
- **One ticket per PR, one person per PR.** Each member opens their own PR from their own ticket branch. No team branches and no combined PRs: we review and reject per developer, so nobody's work is held up by someone else's. If you find another problem, open another ticket.
- **Your team lead reviews first.** They approve on your PR, the **Lead approval** check goes green, and Zedu reviewers pick it up after that.
- **PRs come from your team's org fork.** PRs from personal forks or unregistered orgs fail **Lead approval**.
- **Don't change protected files** (§6) unless a reviewer has agreed it first.
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
| `central-staging` | What's ready to go to Zedu; mirrors `zeduchat:central-staging`. | Reviewers promote `dev` → `central-staging` |

Fork from **`zedu-hng/zedu-mobile`**, not from `zeduchat`. Otherwise your PRs and **Sync fork** point at the wrong repo.

## 3. One-time setup (per team)

1. Fork `zedu-hng/zedu-mobile` into your team's GitHub org. Not a personal account: the org identifies your team.
2. In the fork, go to **Actions** and enable workflows. Forks have them off by default, and your PR builds run there.
3. Register your team: your lead sends a Zedu reviewer the org name and every lead's GitHub handle. Reviewers add them to `.github/teams.yml`. Until then, your PRs fail **Lead approval**.
4. Point CI at your team's backend: in the fork, go to **Settings → Secrets and variables → Actions → Variables**, and add `APP_ENV_FILE` containing your full `.env` (the keys are listed in `env.d.ts`). CI writes it to `.env` before building. Without it, builds succeed but the app has no backend.
5. Each contributor clones the **team fork**:

   ```sh
   git clone https://github.com/<your-team>/zedu-mobile.git
   cd zedu-mobile
   npm ci
   ```

6. Create a local `.env` with your team's values, using the same keys as `env.d.ts`. Never commit it.
7. Follow the [React Native environment setup](https://reactnative.dev/docs/set-up-your-environment), then run `npm run android` / `npm run ios` (see README).

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
5. Commit only as yourself. The **Single author** check fails a PR with commits from more than one person. If you commit from several emails (work laptop, personal), add all of them to your GitHub account (**Settings → Emails**), or they count as different authors. Credit a collaborator with a `Co-authored-by:` trailer instead.

**Dependent tickets:** if ticket B needs ticket A, open B's PR after A merges, then update B from `dev`. Don't stack B on top of A's unmerged branch.

**Testing combinations:** you can merge ticket branches into a private branch in your fork to test them together. Never open a PR from that branch.

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

## 6. Protected files

These files are owned by the reviewers. The **Protected files** check fails any PR that changes them, unless a reviewer has agreed the change first and added the `config-change-approved` label:

- `.github/` (workflows, templates, the review bot config);
- `AGENTS.md` and `CONTRIBUTING.md`;
- tooling config: `.eslintrc*`, `.prettierrc*`, `.prettierignore`, `tsconfig.json`, `babel.config.js`, `metro.config.js`, `jest.config.js`, `jest.setup.js`, `commitlint.config*`, `.gitleaks.toml`, `.husky/`, `.npmrc`;
- Firebase config: `android/app/google-services.json`, `ios/GoogleService-Info.plist`;
- secret-like files anywhere: `.env*`, keystores (`.keystore`, `.jks`), certificates and keys (`.p12`, `.pfx`, `.pem`, `.p8`), provisioning profiles, credential or service-account JSON.

Dependency changes (`package.json`, lockfiles) are fine when the ticket needs them. **Moving or restructuring files needs its own approved ticket**; never mix it into feature work.

## 7. How your PR gets built

Your fork builds your PR, with your fork's `APP_ENV_FILE`, so the build talks to your team's backend. Zedu never holds your config or secrets.

- **Builds run only while your PR is open.** Pushes to a ticket branch without an open PR skip the build. A PR that changes only docs needs no build.
- **First build:** opening the PR doesn't trigger one. In your fork, go to **Actions → PR build → Run workflow** on your branch, or push a commit. After that, every push builds automatically.
- On your PR, the **Fork build** check finds that build for your latest commit, waits for it, and posts download links (Android APK, iOS simulator app). Reviewers test with those.
- Start a manual build within 30 minutes of opening the PR (or of your last push) and **Fork build** picks it up on its own. Later than that, or to check straight away, comment `/fork-build` on the PR. Comment it too after re-running a failed build in your fork. No build showing at all? Check that Actions is enabled in your fork and that it's synced.

The other checks (lint, types, tests, security scans, **Branch name**, **Single author**, **Protected files**, **Lead approval**) run on the PR itself. The review bot posts its report as a PR comment. On a first-time contribution, a maintainer has to approve the run before lint, tests and the scans start. **Branch name**, **Single author**, **Protected files**, **Lead approval** and **Fork build** run straight away.

## 8. Open the PR

1. Open a PR from your fork's ticket branch into **`zedu-hng/zedu-mobile:dev`**. Open it from the ticket branch, not your fork's `dev`: that would drag in everything else merged there.
2. Fill in the PR template completely:
   - the ticket link;
   - what changed and why;
   - how to test and what to expect;
   - your team lead's GitHub handle;
   - screenshots or a recording for visible changes, on the platforms you changed;
   - the AI-usage line.
3. A bot comments with your team and requests review from your lead(s). One of them leaves an **Approve** review.
4. Run the first build (§7).
5. Move the ticket to **IN REVIEW**.

## 9. Review and merge

- **Your team lead approves first.** **Lead approval** goes green once a lead registered for your fork's org approves. It re-checks as soon as a lead reviews (on a first-time contribution, once a maintainer has approved the run; until then a periodic re-check covers it). Zedu reviewers only pick up PRs with it green.
- A lead who opens their own PR needs another lead's approval. A team with one lead is waived and goes straight to Zedu review.
- If your lead approved somewhere GitHub can't see, a reviewer can add the `lead-verified` label.
- **1 Zedu reviewer approval** is required, and it must come after your last push.
- All checks must pass, including **Fork build**.
- All review threads must be resolved. Don't resolve a thread without actually addressing it.
- To address feedback, push to the same ticket branch. Checks and the fork build re-run.
- Reviewers **squash-merge** into `dev`. Your PR title becomes the commit message, so keep it conventional.
- Contributors don't merge their own PRs.

After merge, reviewers promote `dev` → `central-staging` with a merge commit, and send `central-staging` to `zeduchat` in batches. Sync your fork's `dev` (**Sync fork**) to pull in what's merged. The ticket goes **MERGED → VERIFIED → CLOSED** once the change is verified.

## 10. Security and secrets

Never commit:

- API keys, tokens or passwords;
- keystores, private keys, or provisioning profiles and certificates;
- cloud or database credentials;
- `.env` files with real values;
- user data.

`google-services.json` and `GoogleService-Info.plist` are already in the repo. Don't add new ones or replace them without a reviewer's sign-off.

Anything in `.env` or compiled into the app is readable by anyone who has the app. Real secrets belong on the backend, not in the client.

If you expose a secret, deleting it in the next commit is not enough. Tell a reviewer immediately so it can be rotated.

## 11. AI usage

AI is fine for explaining code, drafting implementations, tests, debugging, refactoring and docs.

Don't:

- paste generated code you haven't read;
- submit code you can't explain;
- give AI tools secrets or user data;
- treat AI output as a substitute for testing or review.

For significant AI-assisted changes, add one line to the PR saying how AI was used.

If you use an AI coding agent, point it at `AGENTS.md`. It holds the repo conventions agents need, and most agents load it automatically.

## 12. Definition of done

- Acceptance criteria met.
- All checks green on the PR, including **Fork build**.
- Approved by your team lead and a Zedu reviewer, with all threads resolved.
- Merged into `zedu-hng:dev`.
- Verified on the build.
- Ticket closed in ClickUp or Linear.

## 13. Getting unstuck

Ask in your team's channel first, then the project channel. For a blocker, include:

- the ticket number;
- what you were trying to do;
- what happened, with the error or build output;
- what you already tried;
- what help you need.
