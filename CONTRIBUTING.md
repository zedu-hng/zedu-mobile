# Contributing to Zedu Mobile

Zedu Mobile is the React Native app for iOS and Android. This guide covers how work gets from a ticket into `zeduchat/zedu-mobile`.

The short version:

> Approved ticket → work in your team's fork → team review + CI in the fork → PR to `zeduchat/staging` → review builds + our review → squash merge → verify on staging.

## 1. Ground rules

- **Every change needs an approved ticket** in ClickUp or Linear. Nothing starts from an untracked chat request.
- **One ticket per PR.** If you find another problem, open another ticket.
- **Never push to `zeduchat` directly.** All work happens in your team's fork and comes back as a PR.
- **AI is a tool, not an authority.** You own everything you submit. If you can't explain it, don't submit it.

## 2. How the repositories fit together

```
zeduchat/zedu-mobile          upstream; reviewers merge here
  └─ <your-team>/zedu-mobile  your team's fork; you work and review here first
```

| Branch | Where | Purpose |
|---|---|---|
| `staging` | `zeduchat` | Integration branch. All contributor PRs target this. |
| `main` | `zeduchat` | Production. Only promoted from `staging` by maintainers. |
| `staging` (or whatever your team uses) | your fork | Your team's integration branch. |

## 3. One-time setup (per team)

1. Fork `zeduchat/zedu-mobile` into your team's GitHub org.
2. In the fork, go to **Actions** and enable workflows. Forks have them off by default, and you need fork-side CI.
3. Each contributor clones the **team fork**:

   ```sh
   git clone https://github.com/<your-team>/zedu-mobile.git
   cd zedu-mobile
   npm ci
   ```

4. Create a `.env` at the repo root. Ask your team lead for values; see `env.d.ts` for the keys. Never commit it.
5. Follow the [React Native environment setup](https://reactnative.dev/docs/set-up-your-environment), then `npm run android` / `npm run ios` (see README).

Husky installs git hooks on `npm ci`: lint-staged runs on commit and commitlint checks your commit messages.

## 4. Working on a ticket

1. Move the ticket to **IN PROGRESS**.
2. Sync your fork from `zeduchat/staging` (GitHub **Sync fork** button), then pull.
3. Branch from your team's integration branch using the ticket ID:

   ```
   <type>/<ticket-id>-<short-description>
   ```

   Types: `feat`, `fix`, `test`, `docs`, `refactor`, `chore`, `perf`, `security`. Example: `fix/245-login-redirect`.

4. Commit with [Conventional Commits](https://www.conventionalcommits.org/) (`feat: add student dashboard`, `fix: handle expired auth token`). Commitlint rejects `update`, `changes`, `final`, and friends. The PR title must pass commitlint too.

## 5. Checks to run before any PR

```sh
npm run check-format   # Prettier
npm run check-lint     # ESLint
npm run check-types    # TypeScript
npm test               # Jest
npm run security:audit
```

CI runs the same checks plus a file policy, Gitleaks, Semgrep, a malware scan, the PR review bot, and Android/iOS builds.

**File policy:** PRs may not add `.env` / `.env.*`, keystores, `.pem`, credential or service-account JSON, or files over 1 MB. Stage your files deliberately.

For UI changes, also check the relevant interaction, loading, empty, and error states on both platforms.

## 6. Review inside your team's fork

1. Open a PR in your fork: `<type>/<ticket-id>-...` → your team's integration branch.
2. Fork CI must pass. It's the same workflows as upstream, running in your fork.
3. Your team reviews and merges it in the fork.

## 7. Open the PR to `zeduchat`

1. Open a PR from your fork's **ticket branch** to **`zeduchat/zedu-mobile:staging`**. Don't open it from your fork's integration branch: that drags in every other ticket your team merged.
2. Fill in the PR template completely. It asks for:
   - the ticket link;
   - what changed and why;
   - how to test and what to expect;
   - your fork CI run and fork PR links;
   - screenshots or a recording for visible changes;
   - an AI-usage line.
3. Move the ticket to **IN REVIEW**.

On a first-time contribution, a maintainer has to approve the workflow run before CI starts.

### Review builds

Once CI builds the app, a bot comments on your PR with:

- an **APK** and **iOS simulator build** (downloadable from the run);
- an **Android install** via Firebase App Distribution (for reviewers);
- **browser previews** (Android and iOS) via Appetize.

You don't need to attach builds yourself.

## 8. Review and merge

- **2 approvals** are required, and approval must come after your last push.
- All review threads must be resolved. Don't resolve a thread without addressing it.
- Required CI checks must pass.
- To address feedback, push to the same ticket branch in your fork. CI and review builds re-run.
- Maintainers **squash-merge** into `staging`. Your PR title becomes the commit message, so keep it conventional.
- Contributors don't merge their own PRs.

After merge, the ticket goes **MERGED → VERIFIED** (checked on the staging build) **→ CLOSED**.

## 9. Security and secrets

Never commit API keys, tokens, passwords, keystores, private keys, cloud or database credentials, or user data. Anything in `.env` or compiled into the app is visible to anyone who has the app, so real secrets belong on the backend, not in the client.

If you expose a secret, deleting it in the next commit is not enough. Tell a maintainer immediately so it can be rotated.

## 10. AI usage

AI is fine for explaining code, drafting implementations, tests, debugging, refactoring, and docs.

Don't:

- paste generated code you haven't read;
- submit code you can't explain;
- give AI tools secrets or user data;
- treat AI output as a substitute for testing or review.

For significant AI-assisted changes, add one line to the PR saying how AI was used.

## 11. Definition of done

- Acceptance criteria met.
- CI green, including in your fork.
- 2 approvals, threads resolved.
- Merged to `staging`.
- Verified on the staging build.
- Ticket closed in ClickUp or Linear.

## 12. Getting unstuck

Ask in your team's channel first, then the project channel. For a blocker, include:

- the ticket number;
- what you were trying to do;
- what happened, with the error or log output;
- what you already tried;
- what help you need.
