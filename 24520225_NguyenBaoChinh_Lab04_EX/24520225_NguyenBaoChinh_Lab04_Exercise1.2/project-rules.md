# Project Governance & Workflow Protocols — Exercise 1.2 (`project-rules.md`)

> **MANDATORY ENGINEERING GOVERNANCE CONTRACT — EXERCISE 1.2**
> This document defines the mandatory development workflow, atomic Git commit rules, verification gates, routing & semantic HTML standards, and Git safety protocols for **Exercise 1.2: React Router v7 Layout Architecture** (`24520225_NguyenBaoChinh_Lab04_Exercise1.2`).
>
> Companion Exercise 1.2 Documents:
> - [`PROJECT_STRUCTURE.md`](file:///Users/chinh/UIT%20lecture/WebApplicationDevelopment/Lab/Lab04/Exercise/24520225_NguyenBaoChinh_Lab04_Exercise1.2/PROJECT_STRUCTURE.md)
> - [`TASK_DECOMPOSITION.md`](file:///Users/chinh/UIT%20lecture/WebApplicationDevelopment/Lab/Lab04/Exercise/24520225_NguyenBaoChinh_Lab04_Exercise1.2/TASK_DECOMPOSITION.md)
> - [`AI_FAILURE_AUDIT.md`](file:///Users/chinh/UIT%20lecture/WebApplicationDevelopment/Lab/Lab04/Exercise/24520225_NguyenBaoChinh_Lab04_Exercise1.2/AI_FAILURE_AUDIT.md)

---

## 1. Strict 4-Stage Contract-First Loop

All routing, layout, and master-detail features in Exercise 1.2 must execute the **Strict 4-Stage Contract-First Loop**:

```text
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│   [1] CONTRACT   │ ──► │  [2] FAIL TEST   │ ──► │  [3] IMPLEMENT   │ ──► │   [4] REFACTOR   │
│  Define API &    │     │  Write failing   │     │  Write minimal   │     │  Clean code &    │
│  Interface Spec  │     │  automated test  │     │  code to pass    │     │  keep tests green│
└──────────────────┘     └──────────────────┘     └──────────────────┘     └──────────────────┘
```

1. **`[1] Contract` — Define API and Interface Specification**:
   - Define the `Person` interface (`id`, `name`, `role`, `department`, `status`), the React Router v7 route hierarchy (`/`, `/people`, `/people/:id`, `*`), the `useParams()` + `people.find()` lookup contract, the `NotFoundState` 404 fallback, semantic `<dl>/<dt>/<dd>` markup, and `.people-layout` CSS Grid (`grid-template-columns: minmax(280px, 1fr) 2fr`).
2. **`[2] Fail Test` — Write Failing Automated Tests / Checks**:
   - Confirm that invalid route parameters (`/people/999`) fail without `NotFoundState` and that root `<NavLink to="/">` stays active on child routes without `end`.
3. **`[3] Implement` — Write Minimal Code Satisfying Tests**:
   - Implement `MainLayout`, `HomePage`, `PeoplePage`, `NotFoundPage`, `people.ts`/`people.js`, and `PersonDetail` while preserving Exercise 1.1's `React.lazy` and `<Suspense fallback={<Skeleton />}>`.
4. **`[4] Refactor` — Clean Code While Maintaining Green Tests**:
   - Ensure responsive collapse to `1fr` at `@media (max-width: 768px)` and verify `npm run lint` and `npm run build` pass with zero errors.

---

## 2. Atomic Git Commits

Every milestone in Exercise 1.2 must be committed as an isolated, atomic Git commit.

### 2.1. Mandatory Conventional Commit Examples

```bash
docs: define exercise governance
docs: document exercise structure
docs: add task decomposition
docs: record AI failure audit

feat: implement exercise functionality
test: add exercise tests
fix: correct exercise implementation
refactor: improve component architecture
```

### 2.2. Commit Discipline Rules
- **One Isolated Scope Per Commit**: Separate dependency installation (`7697644`), declarative routing (`1c0e024`), nested layout (`117b7ce`), active `<NavLink>` styling (`da2d5e2`), master-detail views (`894b83f`), 404 lookup fallback (`59c5d28`), and documentation commits.
- **Immutable Git History**: Never amend, reset, rebase, squash, or delete existing commits.
- **No Force Pushing**: Never run `git push --force`.
- **Isolated Staging**: Only stage files belonging to `24520225_NguyenBaoChinh_Lab04_Exercise1.2`.

---

## 3. Mandatory Verification Gates

Before committing in `24520225_NguyenBaoChinh_Lab04_Exercise1.2`, verify all gates:

1. **Lint Gate**: `npm run lint` (`eslint .`) must exit `0`.
2. **Build & Lazy Chunk Gate**: `npm run build` (`tsc -b && vite build`) must exit `0` and emit the lazy `dist/assets/PersonDetail-*.js` chunk.
3. **Route & 404 Fallback Gate**: Verify `/`, `/people`, `/people/1..4` (`<dl>/<dt>/<dd>`), `/people/999` (`NotFoundState` 404 fallback), and `*` (`NotFoundPage`).
4. **Responsive Grid Gate**: Verify `.people-layout` uses `grid-template-columns: minmax(280px, 1fr) 2fr` on desktop and `1fr` at `<= 768px`.
5. **Git Diff Gate**: `git status --short` and `git diff --check` must confirm zero conflict markers or unrelated changes.

---

## 4. Code Quality Rules

- Use React Router v7 imports from `'react-router'` (`BrowserRouter`, `Routes`, `Route`, `NavLink`, `Outlet`, `Link`, `useParams`).
- Always use `useParams()` and `people.find((p) => p.id === id)` for dynamic entity resolution; never hardcode selected entities.
- Always guard `people.find()` with `if (!person) return <NotFoundState id={id} />;`.
- Use semantic `<dl>`, `<dt>`, and `<dd>` elements for entity details.
- Preserve Exercise 1.1's `React.lazy()` and `<Suspense fallback={<Skeleton aria-busy="true" aria-live="polite" />}>` boundary.

---

## 5. AI Collaboration Rules

- **Inspect Before Modifying**: Always inspect `src/`, `package.json`, and Git history before editing.
- **Do Not Invent Unrequested Features**: Do not add a search box or filter input to `PeoplePage`; selection must happen via the `.people-master` `<NavLink>` list.
- **Zero Fabrication**: Never fabricate test outputs, route statuses, or commit hashes.

---

## 6. Evidence Governance

All evidence for Exercise 1.2 must reflect genuine runtime and build verification:
- Screenshots and DOM verification of `/people/2` (`<dl>` rendering) and `/people/999` (`404 - Person Not Found` fallback).
- Production bundle verification (`npm run build`) showing code-split `PersonDetail` chunk.
- Verified Git commit log (`git log --oneline`).

---

## 7. Git Safety Protocol

Before any Git operation, execute:

```bash
git status --short
git branch --show-current
git log --oneline -10
```

Never execute `git reset --hard`, `git clean -fd`, `git commit --amend`, or `git rebase`. Preserve all existing Exercise 1.1 and Exercise 1.2 commits.
