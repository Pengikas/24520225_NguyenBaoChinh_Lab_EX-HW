# Project Governance & Workflow Protocols — Exercise 1.1 (`project-rules.md`)

> **MANDATORY ENGINEERING GOVERNANCE CONTRACT — EXERCISE 1.1**
> This document defines the development workflow, atomic Git commit rules, verification gates, accessibility standards, and Git safety protocols for **Exercise 1.1: Performance & Resiliency Architectural Upgrades** (`24520225_NguyenBaoChinh_Lab04_Exercise1.1`).
>
> Companion Exercise 1.1 Documents:
> - [`PROJECT_STRUCTURE.md`](file:///Users/chinh/UIT%20lecture/WebApplicationDevelopment/Lab/Lab04/Exercise/24520225_NguyenBaoChinh_Lab04_Exercise1.1/PROJECT_STRUCTURE.md)
> - [`TASK_DECOMPOSITION.md`](file:///Users/chinh/UIT%20lecture/WebApplicationDevelopment/Lab/Lab04/Exercise/24520225_NguyenBaoChinh_Lab04_Exercise1.1/TASK_DECOMPOSITION.md)
> - [`AI_FAILURE_AUDIT.md`](file:///Users/chinh/UIT%20lecture/WebApplicationDevelopment/Lab/Lab04/Exercise/24520225_NguyenBaoChinh_Lab04_Exercise1.1/AI_FAILURE_AUDIT.md)

---

## 1. Strict 4-Stage Contract-First Loop

Every component and architectural upgrade in Exercise 1.1 is governed by the **Strict 4-Stage Contract-First Loop**:

```text
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│   [1] CONTRACT   │ ──► │  [2] FAIL TEST   │ ──► │  [3] IMPLEMENT   │ ──► │   [4] REFACTOR   │
│  Define API &    │     │  Write failing   │     │  Write minimal   │     │  Clean code &    │
│  Interface Spec  │     │  automated test  │     │  code to pass    │     │  keep tests green│
└──────────────────┘     └──────────────────┘     └──────────────────┘     └──────────────────┘
```

1. **`[1] Contract` — Define API and Interface Specification**:
   - Define `SkeletonProps` (`'aria-busy'?: boolean | 'true' | 'false'`, `'aria-live'?: 'off' | 'polite' | 'assertive'`) and the default-exported `PersonDetail` component signature required by `React.lazy()`.
2. **`[2] Fail Test` — Write Failing Automated Tests / Checks**:
   - Confirm that static imports fail to emit a separate `PersonDetail-*.js` chunk during `npm run build` and lack WAI-ARIA loading announcements.
3. **`[3] Implement` — Write Minimal Code Satisfying Tests**:
   - Implement `PersonDetail`, `Skeleton`, and `<Suspense fallback={<Skeleton aria-busy="true" aria-live="polite" />}>` using only `react` and `react-dom`.
4. **`[4] Refactor` — Clean Code While Maintaining Green Tests**:
   - Ensure dimensional parity between `.skeleton-card` and `.person-detail`, responsive mobile layout at `<= 600px`, and zero lint or TypeScript errors.

---

## 2. Atomic Git Commits

Every milestone in Exercise 1.1 must be recorded as an isolated, atomic Git commit.

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
- **One Isolated Scope Per Commit**: Separate project initialization (`5d5f740`), `PersonDetail` creation (`83ac242`), `Skeleton` implementation (`65897f9`), `<Suspense>` lazy loading (`eab67b7`), and documentation commits.
- **No History Rewriting**: Never amend, reset, rebase, squash, or delete existing commits.
- **No Force Pushing**: Never run `git push --force`.
- **No Unrelated Staging**: Always inspect `git status --short` and stage only files belonging to Exercise 1.1.

---

## 3. Mandatory Verification Gates

Before creating any commit in `24520225_NguyenBaoChinh_Lab04_Exercise1.1`, verify all gates:

1. **Lint Gate**: `npm run lint` (`eslint .`) must exit with code `0`.
2. **Build & Code-Split Gate**: `npm run build` (`tsc -b && vite build`) must exit with code `0` and emit a dedicated `dist/assets/PersonDetail-*.js` chunk.
3. **WAI-ARIA Accessibility Gate**: `<Skeleton />` must render `aria-busy="true"`, `aria-live="polite"`, and `aria-label="Loading person details"`.
4. **Responsive Layout Gate**: Card layout must stack cleanly at `@media (max-width: 600px)` without horizontal overflow.
5. **Git Diff Gate**: `git diff --check` and `git status --short` must confirm zero conflict markers and clean file scoping.

---

## 4. Code Quality Rules

- Use functional React components (`App`, `PersonDetail`, `Skeleton`).
- Preserve required component and prop names (`PersonDetail`, `Skeleton`, `aria-busy`, `aria-live`).
- Use declarative `<Suspense>` boundaries instead of manual `useEffect` + `isLoading` state for module code splitting.
- Maintain semantic HTML elements (`<main>`, `<header>`, `<section>`, `<footer>`).
- Do not install unnecessary dependencies (keep `package.json` focused on `react` and `react-dom`).

---

## 5. AI Collaboration Rules

- **Inspect Before Modifying**: Always read `package.json`, `tsconfig.app.json`, and `src/` files before making changes.
- **Zero Fabrication**: Never invent components, routes, or test metrics that do not exist in `24520225_NguyenBaoChinh_Lab04_Exercise1.1`.
- **Non-Destructive Updates**: Preserve all existing `.tsx`, `.jsx`, and `.css` files and keep documentation synchronized with the actual codebase.

---

## 6. Evidence Governance

All evidence for Exercise 1.1 must come from the actual application:
- Production build chunk output (`dist/assets/PersonDetail-*.js`).
- Chrome DevTools Elements & Accessibility Tree inspection showing `aria-busy="true"` and `aria-live="polite"` on `<section class="skeleton-card">`.
- Actual Git commit history (`git log --oneline`).

---

## 7. Git Safety Protocol

Before any Git command, execute:

```bash
git status --short
git branch --show-current
git log --oneline -10
```

Never execute `git reset --hard`, `git clean -fd`, `git commit --amend`, or `git rebase`. Preserve all existing commits and user files.
