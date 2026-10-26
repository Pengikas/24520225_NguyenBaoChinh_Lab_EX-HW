# TASK_DECOMPOSITION.md

## Exercise 1: Reusable & Accessible Developer Profile Card

**Course:** Web Application Development (Lab 03 — Exercise 1)
**Deliverable:** Accessible, responsive Developer Profile Card built with **React 19**, **Vite 8**, Semantic HTML5 (Zero-Div-Soup), React Fragments, scoped CSS Modules, and mobile-first responsive layout (375px+).
**Student ID / Name:** 24520225 — Nguyen Bao Chinh

---

## 1. Overview & Work Breakdown Structure (WBS)

This document tracks the systematic engineering, verification, and documentation of Lab 03 Exercise 1 across six structured phases. Every task defines explicit acceptance criteria, impacted files, and empirical verification commands.

---

## 2. Phase-by-Phase Task Matrix

### Phase 1: Repository Inspection

- [x] **Task 1.1: Package and Toolchain Version Audit**
  - **Task ID:** `TASK-1.1`
  - **Description:** Inspect `package.json`, `package-lock.json`, and verify compatibility of React 19, React DOM 19, and Vite.
  - **Files Affected:** `package.json`, `package-lock.json`
  - **Acceptance Criteria:** React and React-DOM must be version 19.x; `package.json` devDependencies must declare a compatible Vite version agreeing with `package-lock.json` so `npm ls` succeeds with code 0.
  - **Verification Procedure:** Run `npm ls react react-dom vite`.
  - **Status:** `DONE` (Verified: `react@19.3.1`, `react-dom@19.3.1`, `vite@8.3.5`; exit code 0).

- [x] **Task 1.2: Repository File Structure & Git State Inspection**
  - **Task ID:** `TASK-1.2`
  - **Description:** Inspect directory contents, Git history, uncommitted changes, and legacy files (`mini_react.js`, `state_machine.js`, etc.).
  - **Files Affected:** Repository root, `.git`
  - **Acceptance Criteria:** Existing commits preserved; uncommitted changes in parent directory identified and left untouched; legacy files retained without deletion.
  - **Verification Procedure:** Run `git status`, `git log -n 5 --oneline`.
  - **Status:** `DONE` (Preserved commits `2d096b3`, `1a43014`, `9e682f3`, `7472751`, `ce70564`).

---

### Phase 2: React Implementation

- [x] **Task 2.1: Entry Point and App Shell Verification**
  - **Task ID:** `TASK-2.1`
  - **Description:** Verify that `src/main.jsx` creates a React 19 root with `createRoot`, enables `StrictMode`, and `src/App.jsx` renders `DeveloperCard` inside a semantic landmark.
  - **Files Affected:** `src/main.jsx`, `src/App.jsx`
  - **Acceptance Criteria:** Entry point imports `createRoot` from `react-dom/client`; `App.jsx` renders `<main className="page">` and `<DeveloperCard />`.
  - **Verification Procedure:** Code inspection and Vite production build test (`npm run build`).
  - **Status:** `DONE`.

- [x] **Task 2.2: Semantic Container and Landmark Naming**
  - **Task ID:** `TASK-2.2`
  - **Description:** Ensure `DeveloperCard.jsx` uses `<article>` as the outer container with `aria-labelledby="dev-heading"` referencing an `<h2>` heading.
  - **Files Affected:** `src/components/DeveloperCard.jsx`
  - **Acceptance Criteria:** Root container is `<article className={styles.card} aria-labelledby="dev-heading">`; heading is `<h2 id="dev-heading">{fullName}</h2>`.
  - **Verification Procedure:** Grep and AST inspection of `src/components/DeveloperCard.jsx`.
  - **Status:** `DONE`.

- [x] **Task 2.3: Zero-Div-Soup Enforcement**
  - **Task ID:** `TASK-2.3`
  - **Description:** Verify that zero `<div>` tags exist inside `DeveloperCard.jsx` and `SkillBadge.jsx`.
  - **Files Affected:** `src/components/DeveloperCard.jsx`, `src/components/SkillBadge.jsx`
  - **Acceptance Criteria:** Total count of `<div` or `</div>` in `DeveloperCard.jsx` and `SkillBadge.jsx` must be strictly 0.
  - **Verification Procedure:** Run `grep -n "<div" src/components/DeveloperCard.jsx src/components/SkillBadge.jsx`.
  - **Status:** `DONE` (0 occurrences found).

- [x] **Task 2.4: Metric Definition List with Keyed Fragments**
  - **Task ID:** `TASK-2.4`
  - **Description:** Render developer metrics inside `<dl>` using `Object.entries(metrics).map` with `<Fragment key={key}>` without extra wrapper elements around `<dt>` and `<dd>`.
  - **Files Affected:** `src/components/DeveloperCard.jsx`
  - **Acceptance Criteria:** Metrics use `<dl className={styles.metrics} aria-label="Developer metrics">`, each metric mapped as `<Fragment key={key}><dt>{key}</dt><dd>{value}</dd></Fragment>`.
  - **Verification Procedure:** Code inspection of `DeveloperCard.jsx` lines 65–72.
  - **Status:** `DONE`.

- [x] **Task 2.5: Semantic Skills List & Reusable SkillBadge Component**
  - **Task ID:** `TASK-2.5`
  - **Description:** Render skills inside `<ul className={styles.skills} aria-label="Engineering Skills">` mapping each skill to `<SkillBadge key={skill.id} ... />`.
  - **Files Affected:** `src/components/DeveloperCard.jsx`, `src/components/SkillBadge.jsx`
  - **Acceptance Criteria:** `SkillBadge` returns `<li>`; mapped using `key={skill.id}`; `aria-label="Engineering Skills"` matches the section heading `<h3 id="skills-heading">Engineering Skills</h3>`.
  - **Verification Procedure:** Source inspection of `DeveloperCard.jsx` lines 75–86 and `SkillBadge.jsx`.
  - **Status:** `DONE`.

- [x] **Task 2.6: Resilient Avatar Image & Fallback State**
  - **Task ID:** `TASK-2.6`
  - **Description:** Implement explicit avatar dimensions (`width={64}`, `height={64}`), HTTPS image source, and an `onError` fallback rendering initials in an accessible badge.
  - **Files Affected:** `src/components/DeveloperCard.jsx`
  - **Acceptance Criteria:** `imageFailed` state triggers `<span className={styles.avatarFallback} role="img" aria-label={`Avatar initials: ${initials}`}>` when avatar fails; explicit dimensions prevent layout shift (CLS).
  - **Verification Procedure:** Code inspection of `DeveloperCard.jsx` lines 23–56.
  - **Status:** `DONE`.

---

### Phase 3: Styling and Responsive Design

- [x] **Task 3.1: CSS Modules Scoping & Pseudo-Class Targeting**
  - **Task ID:** `TASK-3.1`
  - **Description:** Use `DeveloperCard.module.css` for component styles and correctly scope child `SkillBadge` styling via `:global(.skill-badge)`.
  - **Files Affected:** `src/components/DeveloperCard.module.css`
  - **Acceptance Criteria:** Classes imported as `styles`; child badge styles scoped to `.skills :global(...)` to prevent global CSS leakage.
  - **Verification Procedure:** Inspect CSS module selectors in `src/components/DeveloperCard.module.css`.
  - **Status:** `DONE`.

- [x] **Task 3.2: Mobile 375px Viewport Adaptation & Overflow Prevention**
  - **Task ID:** `TASK-3.2`
  - **Description:** Ensure the card fits a 375px mobile viewport (iPhone SE) without horizontal page overflow.
  - **Files Affected:** `src/components/DeveloperCard.module.css`
  - **Acceptance Criteria:** Zero horizontal overflow (`document.documentElement.scrollWidth === document.documentElement.clientWidth`); padding adjusted to 16px; avatar scaled to 56px; 3-column metrics remain legible; `overflow-wrap: anywhere` applied.
  - **Verification Procedure:** Build bundle inspection and manual DevTools verification at 375px width.
  - **Status:** `DONE`.

- [x] **Task 3.3: Accessibility and Motion Preferences**
  - **Task ID:** `TASK-3.3`
  - **Description:** Implement `@media (prefers-reduced-motion: reduce)` to disable transitions for users requesting reduced motion.
  - **Files Affected:** `src/components/DeveloperCard.module.css`
  - **Acceptance Criteria:** Hover transition on skill badges disabled under `prefers-reduced-motion: reduce`.
  - **Verification Procedure:** CSS review confirming `@media (prefers-reduced-motion: reduce)` block.
  - **Status:** `DONE`.

---

### Phase 4: Quality Assurance

- [x] **Task 4.1: Production Build Verification**
  - **Task ID:** `TASK-4.1`
  - **Description:** Execute Vite production build to confirm TypeScript/JSX transpilation, CSS bundling, and zero syntax errors.
  - **Files Affected:** `dist/`
  - **Acceptance Criteria:** `npm run build` completes with exit code 0; produces valid `dist/index.html` and assets.
  - **Verification Procedure:** Run `npm run build`.
  - **Status:** `DONE` (Built in 883ms; JS: 221.76 kB / 69.51 kB gzip; CSS: 4.59 kB / 1.45 kB gzip).

- [x] **Task 4.2: Dependency & Lint Tree Verification**
  - **Task ID:** `TASK-4.2`
  - **Description:** Verify clean dependency tree without unmet peer dependencies or version clashes.
  - **Files Affected:** `package.json`, `package-lock.json`
  - **Acceptance Criteria:** `npm ls react react-dom vite` reports 0 errors and exits with code 0.
  - **Verification Procedure:** Run `npm ls react react-dom vite`.
  - **Status:** `DONE`.

- [x] **Task 4.3: Git Diff and Formatting Audit**
  - **Task ID:** `TASK-4.3`
  - **Description:** Verify there is no trailing whitespace, broken formatting, or merge conflict markers.
  - **Files Affected:** All repository files
  - **Acceptance Criteria:** `git diff --check` outputs zero warnings or errors.
  - **Verification Procedure:** Run `git diff --check`.
  - **Status:** `DONE` (Output clean).

---

### Phase 5: Documentation

- [x] **Task 5.1: AI Failure Mode Audit (`AI_FAILURE_AUDIT.md`)**
  - **Task ID:** `TASK-5.1`
  - **Description:** Author comprehensive AI Failure Mode Audit documenting 6 concrete failure cases/risks with evidence, root cause analysis, fixes, and verification procedures.
  - **Files Affected:** `AI_FAILURE_AUDIT.md`
  - **Acceptance Criteria:** Conforms to required 8-point structure per failure case, covers dependency mismatch, `aria-label` mismatch, CSS module duplication, Zero-Div-Soup, image fallback, and legacy doc contamination.
  - **Verification Procedure:** Textual review of `AI_FAILURE_AUDIT.md`.
  - **Status:** `DONE`.

- [x] **Task 5.2: Project Architecture Documentation (`PROJECT_STRUCTURE.md`)**
  - **Task ID:** `TASK-5.2`
  - **Description:** Document actual directory tree, file responsibilities, component rendering flow, and architectural distinctions.
  - **Files Affected:** `PROJECT_STRUCTURE.md`
  - **Acceptance Criteria:** Accurate directory tree; explains entry point vs app vs components vs CSS modules vs global styles vs legacy files; linear rendering flow documented.
  - **Verification Procedure:** Textual review of `PROJECT_STRUCTURE.md`.
  - **Status:** `DONE`.

- [x] **Task 5.3: Work Breakdown Structure Documentation (`TASK_DECOMPOSITION.md`)**
  - **Task ID:** `TASK-5.3`
  - **Description:** Provide detailed task breakdown across 6 phases with Task IDs, descriptions, files affected, criteria, procedures, and evidence-based status.
  - **Files Affected:** `TASK_DECOMPOSITION.md`
  - **Acceptance Criteria:** Complete Markdown checklist matching real repository state.
  - **Verification Procedure:** Self-referential consistency check.
  - **Status:** `DONE`.

---

### Phase 6: Git Commits & Evidence

- [x] **Task 6.1: Implementation Alignment Commit**
  - **Task ID:** `TASK-6.1`
  - **Description:** Commit core implementation fixes (`package.json` Vite version alignment and `DeveloperCard.jsx` skills list `aria-label`).
  - **Files Affected:** `package.json`, `src/components/DeveloperCard.jsx`
  - **Acceptance Criteria:** Clean commit staged with only implementation fixes.
  - **Verification Procedure:** Run `git commit -m "fix(ex1): align vite version and skills accessibility label"`.
  - **Status:** `DONE`.

- [x] **Task 6.2: Responsive CSS Module Consolidation Commit**
  - **Task ID:** `TASK-6.2`
  - **Description:** Commit consolidated responsive 375px CSS module without duplicate media queries.
  - **Files Affected:** `src/components/DeveloperCard.module.css`
  - **Acceptance Criteria:** Clean commit created with only CSS module enhancements.
  - **Verification Procedure:** Run `git commit -m "style(ex1): consolidate responsive 375px CSS module"`.
  - **Status:** `DONE`.

- [x] **Task 6.3: Documentation Milestone Commit**
  - **Task ID:** `TASK-6.3`
  - **Description:** Commit documentation updates under standard conventional commit message `docs(ex1): update audit and project documentation`.
  - **Files Affected:** `AI_FAILURE_AUDIT.md`, `PROJECT_STRUCTURE.md`, `TASK_DECOMPOSITION.md`
  - **Acceptance Criteria:** Clean commit created containing all project documentation files.
  - **Verification Procedure:** Run `git commit -m "docs(ex1): update audit and project documentation"`.
  - **Status:** `DONE`.
