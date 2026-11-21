# Project Governance & Workflow Protocols — Lab 04 (`project-rules.md`)

> **MANDATORY ENGINEERING GOVERNANCE CONTRACT**
> This document establishes the non-negotiable development workflow, atomic Git commit policies, verification gates, code quality standards, AI collaboration constraints, and evidence governance for **Lab 04 (Exercises 1.1, 1.2, and 1.3)**.
>
> Companion Documents:
> - [`PROJECT_STRUCTURE.md`](file:///Users/chinh/UIT%20lecture/WebApplicationDevelopment/Lab/Lab04/Exercise/24520225_NguyenBaoChinh_Lab04_Exercise1.3/PROJECT_STRUCTURE.md) — Verified repository architecture, directory tree, routing, and component contracts.
> - [`TASK_DECOMPOSITION.md`](file:///Users/chinh/UIT%20lecture/WebApplicationDevelopment/Lab/Lab04/Exercise/24520225_NguyenBaoChinh_Lab04_Exercise1.3/TASK_DECOMPOSITION.md) — Milestone breakdown (`G0`–`G4`) executing the 4-Stage Contract-First Loop.
> - [`AI_FAILURE_AUDIT.md`](file:///Users/chinh/UIT%20lecture/WebApplicationDevelopment/Lab/Lab04/Exercise/24520225_NguyenBaoChinh_Lab04_Exercise1.3/AI_FAILURE_AUDIT.md) — Root-cause audit of AI failure modes and empirical verification matrix.

---

## 1. Strict 4-Stage Contract-First Loop

All feature implementation and architectural refactoring must execute the **Strict 4-Stage Contract-First Loop**. No production code may be written before stages `[1] Contract` and `[2] Fail Test` are established (except when auditing or documenting pre-existing implementations).

```text
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│   [1] CONTRACT   │ ──► │  [2] FAIL TEST   │ ──► │  [3] IMPLEMENT   │ ──► │   [4] REFACTOR   │
│  Define API &    │     │  Write failing   │     │  Write minimal   │     │  Clean code &    │
│  Interface Spec  │     │  automated test  │     │  code to pass    │     │  keep tests green│
└──────────────────┘     └──────────────────┘     └──────────────────┘     └──────────────────┘
```

### Stage Protocol
1. **`[1] Contract` — Define API and Interface Specification**:
   - Explicitly declare TypeScript interfaces (`SkeletonProps`, `Person`, `PersonDetailProps`, `InputFieldProps`, `FormData`, `FormErrors`, `TraceLogEntry`, `RaceRequestEntry`), route URL contracts (`/`, `/people`, `/people/:id`, `/validation`, `*`), and required function names (`syncToParent`, `validateField`, `calcFormValidity`, `syncErrorsToChild`, `autoScrollToError`).
   - Document boundary and edge conditions (empty input `""`, short input `"a"`/`"ab"`, valid input `"abc"`, invalid route param `/people/999`, out-of-order async latency, mutual state dependency loops).
2. **`[2] Fail Test` — Write Failing Automated Tests / Checks**:
   - Verify that the target check fails for the expected reason before writing implementation code.
   - Record the failing evidence (e.g., missing code-split chunk, unhandled `undefined` entity lookup on `/people/999`, ESLint `react-hooks` error, or stale validation overwrite in Legacy Mode A).
3. **`[3] Implement` — Write Minimal Code Satisfying Tests**:
   - Write the minimum necessary React + TypeScript implementation to satisfy the contract and turn the failing check green.
   - Preserve all previous exercise routes, components, and required identifiers.
   - Do not introduce unnecessary third-party dependencies.
4. **`[4] Refactor` — Clean Code While Maintaining Green Tests**:
   - Improve readability, extract modular subcomponents (`ArchitecturalFlaws`, `ExecutionTrace`, `InputField`, `SimpleForm`), and consolidate responsive CSS Grid rules.
   - Re-run all verification gates (`npm run lint`, `npm run build`, browser verification) to ensure zero regressions.

---

## 2. Atomic Git Commits

Every meaningful milestone or documentation artifact must be recorded as an isolated, atomic Git commit.

### 2.1. Mandatory Conventional Commit Syntax

```text
docs: define project governance
docs: document project structure
docs: add task decomposition
docs: record AI failure audit

feat: implement exercise 1.1
feat: implement exercise 1.2 routing
feat: implement exercise 1.3 validation demo

test: add exercise 1.1 tests
test: add exercise 1.2 route tests
test: add exercise 1.3 validation tests

fix: correct route fallback
fix: prevent stale validation updates
refactor: simplify form state management
```

### 2.2. Commit Hygiene Rules
- **One Isolated Scope Per Commit**: Each commit must address a single logical milestone or file scope.
- **No Unrelated File Changes**: Never bundle unrelated edits or temporary scratch files into a commit.
- **No Giant Monolithic Commits**: Break multi-part deliverables into distinct component, routing, styling, and documentation commits.
- **Immutable History**:
  - **NEVER** amend existing commits (`git commit --amend` is forbidden on published/historical commits).
  - **NEVER** rewrite Git history (`git rebase -i`, `git reset --hard`, `git filter-branch` are forbidden).
  - **NEVER** delete previous commits.
  - **NEVER** force push (`git push --force` is forbidden).
- **Pre- and Post-Commit Inspection**: Always inspect `git status --short` before staging and verify `git log -n 1 --stat` immediately after committing.

---

## 3. Mandatory Verification Gates

No code or documentation commit may be finalized until all seven verification gates pass:

| Gate # | Verification Gate | Command / Method | Required Passing Criterion |
| :---: | :--- | :--- | :--- |
| **Gate 1** | **Static Analysis & Linting** | `npm run lint` (`eslint .`) | Exit code `0` (`0 errors, 0 warnings`). |
| **Gate 2** | **TypeScript & Production Bundle** | `npm run build` (`tsc -b && vite build`) | Exit code `0`; lazy chunks emitted cleanly into `dist/assets/`. |
| **Gate 3** | **Browser Console Cleanliness** | Headless Chrome / DevTools Console check | Zero uncaught runtime exceptions or React key/prop warnings during normal operation; required effect logs observable. |
| **Gate 4** | **Functional Regression Check** | Route & interaction verification | Exercise 1.1 (`React.lazy` + `Skeleton`), Exercise 1.2 (`/`, `/people/2`, `/people/999` 404 fallback), and Exercise 1.3 (`/validation` TC01–TC07, Race Mode A/B, Infinite Loop fixture) all function. |
| **Gate 5** | **Responsive Viewport Check** | `375px` mobile & `1440px` desktop viewports | CSS Grid layouts adapt cleanly (`minmax(280px, 1fr) 2fr` → `1fr`); `scrollWidth <= clientWidth` at `375px`. |
| **Gate 6** | **Changed Files & Diff Audit** | `git status --short` & `git diff --check` | Zero conflict markers, zero trailing whitespace errors, and all file paths verified. |
| **Gate 7** | **Scope Isolation Check** | `git diff --staged` | Only files belonging to the current atomic task are staged. |

---

## 4. Code Quality Rules

1. **Functional React Components & Hooks**: Use modern functional components with explicit TypeScript interfaces. Never access or mutate `useRef.current` values synchronously during component render (`react-hooks/refs`).
2. **Preserve Required Identifiers**: Maintain exact coursework identifiers:
   - Exercise 1.1 & 1.2: `PersonDetail`, `Skeleton`, `MainLayout`, `HomePage`, `PeoplePage`, `NotFoundPage`, `NotFoundState`, `people.find()`.
   - Exercise 1.3: `InputField`, `SimpleForm`, `ExecutionTrace`, `ArchitecturalFlaws`, `syncToParent()`, `validateField()`, `calcFormValidity()`, `syncErrorsToChild()`, `autoScrollToError()`, `latestRaceSeqRef.current`.
3. **State Management Discipline**:
   - Outside of the intentional Exercise 1.3 legacy anti-pattern demonstration, never duplicate state across parent and child components and never chain `useEffect` hooks to compute synchronous derived values.
   - Inside Exercise 1.3's intentional anti-pattern demonstration, include equality guards (`JSON.stringify(nextErrors) !== JSON.stringify(validationErrors)`) so the live application remains interactive and does not lock up the browser tab.
4. **Asynchronous Safety**: Always protect asynchronous state updates against race conditions using monotonically increasing request sequence IDs (`latestRaceSeqRef.current`) or `AbortController` cleanup callbacks.
5. **Semantic HTML & Accessibility (A11y)**:
   - Use `<dl>`, `<dt>`, and `<dd>` for entity attribute pairs in `PersonDetail`.
   - Use `aria-busy="true"`, `aria-live="polite"`, and `aria-label` on `Skeleton`.
   - Bind form `<label htmlFor>` to `<input id>`, and use `aria-invalid`, `aria-describedby`, and `role="alert"` for validation error messages.

---

## 5. AI Collaboration Rules

AI agents operating in this repository must adhere to the following behavioral constraints:

1. **Inspect Before Acting**: Read existing files, `package.json`, `tsconfig.app.json`, and Git commit history before proposing or applying any edits.
2. **Never Assume Missing Files**: Verify file existence via directory listing before creating or importing modules (respecting both `.tsx` and `.jsx` modules present in `src/`).
3. **Zero Fabrication Tolerance**: Never fabricate test results, render counts, Profiler measurements, terminal outputs, or commit hashes. Always distinguish conceptual architectural diagrams (e.g., 5 chained hooks) from actual React 19 batched render measurements.
4. **Non-Destructive Evolution**: Never silently remove or overwrite previous exercise routes, components, or styles when implementing a new exercise.
5. **Documentation Synchronization**: Keep `PROJECT_STRUCTURE.md`, `TASK_DECOMPOSITION.md`, `AI_FAILURE_AUDIT.md`, and `project-rules.md` synchronized with the actual source code.

---

## 6. Evidence Governance

All verification evidence must originate from genuine execution of the application:
- **Runtime Logs**: `docs/exercise-1.3/execution_trace.log` must record the actual 5-hook execution sequence (`syncToParent`, `validateField`, `calcFormValidity`, `syncErrorsToChild`, `autoScrollToError`), observed render/effect counts, and Race Condition (Mode A vs. Mode B) behavior.
- **Automated Browser & Build Verification**: Every status marked `PASS` or `[x]` in `AI_FAILURE_AUDIT.md` and `TASK_DECOMPOSITION.md` must correspond to an executed verification command (`npm run lint`, `npm run build`, or headless Chrome route/interaction test).

---

## 7. Git Safety Protocol

Before executing any Git operation, run the mandatory inspection sequence:

```bash
git status --short
git branch --show-current
git log --oneline -10
```

### Forbidden Destructive Commands
- **FORBIDDEN**: `git reset --hard`
- **FORBIDDEN**: `git clean -fd`
- **FORBIDDEN**: `git checkout -- .` / `git restore .` (when uncommitted user work is present)
- **FORBIDDEN**: `git commit --amend` (on existing commits)
- **FORBIDDEN**: `git rebase` / `git push --force`

Always stage specific file paths explicitly (`git add <file>`) rather than blind wildcard staging whenever untracked or unrelated modifications exist.
