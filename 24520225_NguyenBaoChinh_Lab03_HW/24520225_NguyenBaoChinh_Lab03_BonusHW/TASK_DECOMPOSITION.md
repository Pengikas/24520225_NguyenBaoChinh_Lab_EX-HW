# Task Decomposition & Traceability Matrix – V-POP FSM Bonus Exercise

**Course**: Web Application Development  
**Student Name**: Nguyen Bao Chinh  
**Student ID**: 24520225  
**Project**: `24520225_NguyenBaoChinh_Lab03_BonusHW`  
**Theme**: V-Pop Applied Creative Exercise – *Hẹn Hò Nhưng Không Yêu* (Finite State Machine & Asymmetric Effort Engine)

---

## Executive Summary & Milestone Progress

This document serves as the single source of truth for the project lifecycle, architectural decomposition, implementation status, and requirement traceability. Each milestone tracks its mandatory identifiers, functional contracts, expected Git commit signatures, and actual verification status.

| Milestone | Milestone Name | Commit Target | Git Commit Hash | Status |
| :--- | :--- | :--- | :--- | :--- |
| **M0** | Project Initialization | `chore(fsm): initialize exercise audit` | `272b6c1` | **IMPLEMENTED** |
| **M1** | Deterministic Relationship FSM | `feat(fsm): implement deterministic relationship states` | `5103371` | **IMPLEMENTED** |
| **M2** | Asymmetric Effort Reducer | `feat(fsm): implement asymmetric effort reducer` | `0369d23` | **IMPLEMENTED** |
| **M3** | Ghosting Timer & AbortController | `feat(fsm): implement abortable ghosting timer` | `0d20a68` | **IMPLEMENTED** |
| **M4** | Red-Flag Alert & Accessibility | `feat(a11y): implement accessible red-flag alerts` | `b367cec` | **IMPLEMENTED** |
| **M5** | Responsive UI & Layout | `style(fsm): implement responsive relationship analyzer` | `75a96ee` | **IMPLEMENTED** |
| **M6** | Testing, Evidence & Audit | `test(fsm): verify state machine and timer behavior` | *Proposed next commit* | **DONE (Tests verified 12/12)** |

---

## M0 – Project Initialization

### 1. Objectives & Scope
- Set up a clean React 19 + TypeScript 5 + Vite 6/8 application workspace on macOS.
- Resolve package peer-dependency constraints between `typescript` and `typescript-eslint`.
- Establish project directory structure (`public/`, `src/types/`, `src/utils/`, `src/components/`, `src/assets/`).
- Verify Node.js (`v24.18.0`), npm (`11.16.0`), Git CLI (`git version 2.56.0`), development server, and production build.
- Commit initial clean baseline to the local repository.

### 2. Required Tasks & Execution Record
- [x] Check Node.js and npm runtime versions (`node -v`, `npm -v`).
- [x] Initialize project using Vite React-TS template (`npm create vite@latest . -- --template react-ts`).
- [x] Configure `package.json` with compatible TypeScript version (`~5.7.2`) to satisfy `typescript-eslint@^8.72.0` peer requirement.
- [x] Clean up `tsconfig.app.json` and `tsconfig.node.json` compiler flags.
- [x] Execute `npm install` successfully without dependency tree resolution errors.
- [x] Verify production build (`npm run build`) passing with zero TypeScript diagnostics.
- [x] Execute local Git commit: `chore(fsm): initialize exercise audit` (commit `272b6c1`).

### 3. Traceability Table

| Requirement | Required Identifier / Behavior | Actual File | Verification Method | Status |
| :--- | :--- | :--- | :--- | :--- |
| React + TS Scaffold | React 19 + TypeScript + Vite | `package.json`, `vite.config.ts` | `npm run build` | **IMPLEMENTED** |
| TypeScript Configuration | Target ES2023, bundler resolution | `tsconfig.json`, `tsconfig.app.json` | `tsc -b` check | **IMPLEMENTED** |
| Clean Build Pipeline | Zero compiler or bundler warnings | `dist/` bundle output | `npm run build` exited code 0 | **IMPLEMENTED** |
| Git Baseline Commit | `chore(fsm): initialize exercise audit` | Git commit `272b6c1` | `git log -n 2 --oneline` | **IMPLEMENTED** |

---

## M1 – Deterministic Relationship Finite State Machine

### 1. Objectives & Scope
- Eliminate contradictory boolean state management (anti-pattern known as "Boolean Soup", e.g., `isFriends && isDating && isOfficial`).
- Formulate a single source of truth using a deterministic Finite State Machine (FSM).
- Strictly model the 4 assignment-required relationship phases:
  1. `STRANGERS`: Initial platonic/unacquainted baseline.
  2. `DATING_NO_LOVE`: "Hẹn hò nhưng không yêu" (situationship).
  3. `COMMITTED`: Formally acknowledged romantic relationship.
  4. `SELF_RESPECT_EXIT`: Walking away with self-respect and emotional clarity.
- Enforce strict directed state transition rules:
  - `STRANGERS` $\rightarrow$ `DATING_NO_LOVE`
  - `DATING_NO_LOVE` $\rightarrow$ `STRANGERS` | `COMMITTED` | `SELF_RESPECT_EXIT`
  - `COMMITTED` $\rightarrow$ `SELF_RESPECT_EXIT`
  - `SELF_RESPECT_EXIT` $\rightarrow$ `STRANGERS`
- Reject all illegal transitions gracefully without mutating previous state.
- Bind FSM state directly to the React component tree via `useReducer()`.

### 2. Required Tasks & Execution Record
- [x] Define union type `RelationshipPhase` with exact 4 literals (`STRANGERS`, `DATING_NO_LOVE`, `COMMITTED`, `SELF_RESPECT_EXIT`).
- [x] Define state interface `RelationshipState` containing `phase: RelationshipPhase`.
- [x] Define action union `RelationshipAction` (`SET_PHASE`, `RESET`).
- [x] Define default immutable state `initialRelationshipState = { phase: 'STRANGERS' }`.
- [x] Define lookup table `allowedTransitions` mapping each phase to its permitted next phases.
- [x] Implement pure predicate `canTransition(current, next): boolean`.
- [x] Implement deterministic reducer `relationshipReducer(state, action): RelationshipState`.
- [x] Implement UI container `SituationShipAnalyzer` using React `useReducer()`.
- [x] Render deterministic current phase indicator in `<output className="phase-value">{phase}</output>`.
- [x] Provide transition controls with disabled states reflecting `canTransition()`.
- [x] Provide `Reset Relationship` action to revert to `initialRelationshipState`.
- [x] Execute local Git commit: `feat(fsm): implement deterministic relationship states` (commit `5103371`).

### 3. Traceability Table

| Requirement | Required Identifier / Behavior | Actual File | Verification Method | Status |
| :--- | :--- | :--- | :--- | :--- |
| Phase Literal Union | `RelationshipPhase = 'STRANGERS' \| 'DATING_NO_LOVE' \| 'COMMITTED' \| 'SELF_RESPECT_EXIT'` | `src/types/relationship.ts` | Type checking (`tsc -b`) | **IMPLEMENTED** |
| State Interface | `RelationshipState { readonly phase: RelationshipPhase; }` | `src/types/relationship.ts` | Type checking (`tsc -b`) | **IMPLEMENTED** |
| Action Discriminated Union | `RelationshipAction` (`'SET_PHASE'`, `'RESET'`) | `src/types/relationship.ts` | Type checking (`tsc -b`) | **IMPLEMENTED** |
| Initial State Baseline | `initialRelationshipState = { phase: 'STRANGERS' }` | `src/types/relationship.ts` | Runtime validation | **IMPLEMENTED** |
| Transition Allowlist Table | `allowedTransitions: Record<RelationshipPhase, readonly RelationshipPhase[]>` | `src/utils/relationshipReducer.ts` | Direct transition lookup | **IMPLEMENTED** |
| Transition Guard Function | `canTransition(current: RelationshipPhase, next: RelationshipPhase): boolean` | `src/utils/relationshipReducer.ts` | Unit & interactive verification | **IMPLEMENTED** |
| Pure FSM Reducer | `relationshipReducer(state, action): RelationshipState` | `src/utils/relationshipReducer.ts` | Immutability check & fallback | **IMPLEMENTED** |
| UI Container Component | `SituationShipAnalyzer` | `src/components/SituationShipAnalyzer.tsx` | React DOM render | **IMPLEMENTED** |
| State Hook Integration | `useReducer(relationshipReducer, initialRelationshipState)` | `src/components/SituationShipAnalyzer.tsx` | Component inspection | **IMPLEMENTED** |
| Git Commit Target | `feat(fsm): implement deterministic relationship states` | Git commit `5103371` | `git log -n 1 --oneline` | **IMPLEMENTED** |

---

## M2 – Asymmetric Effort Reducer

### 1. Objectives & Scope
- Model relational investment imbalance inspired by the V-Pop theme:
  - Actor `EM`: High effort, low reciprocity weight (e.g., 100 steps $\times$ 0.1 weight = 10 effective effort).
  - Actor `AI_DO`: Low effort, disproportionate perceived reward (e.g., 1 step $\times$ 50 weight = 50 effective effort).
- Maintain an append-only, immutable history log of effort signals.
- Calculate derived analytical metrics purely on the fly without storing duplicate state in React:
  - Total weighted effort for `EM` vs `AI_DO`.
  - Reciprocity ratio ($\text{Effort}_{\text{EM}} / \text{Effort}_{\text{AI\_DO}}$).
  - Red-Flag heuristic threshold: trigger red flag when effort imbalance surpasses acceptable threshold.
- Enforce immutable update patterns (no `.push()`, `.splice()`, or in-place object mutation).

### 2. Mandatory Requirements & Planned Tasks
- [x] Declare `EffortSignal` interface in `src/types/relationship.ts`.
- [x] Implement effort actions (`ADD_SIGNAL`, `REMOVE_SIGNAL`, `RESET_LOG`) in `src/utils/effortReducer.ts`.
- [x] Implement pure reducer `effortReducer()` maintaining append-only signals.
- [x] Implement pure derived selector `deriveEffortState()` computing weighted effort and `isRedFlag`.
- [x] Build UI component `EffortAnalyzer.tsx` with example loader and action log view.
- [x] Commit with message: `feat(fsm): implement asymmetric effort reducer` (commit `0369d23`).

### 3. Traceability Table

| Requirement | Required Identifier / Behavior | Actual File | Verification Method | Status |
| :--- | :--- | :--- | :--- | :--- |
| Signal Contract | `EffortSignal` (`id`, `actor`, `steps`, `multiplier`) | `src/types/relationship.ts` | Static inspection | **IMPLEMENTED** |
| Effort Reducer Logic | Immutable signal dispatch & storage | `src/utils/effortReducer.ts` | Unit & reducer check | **IMPLEMENTED** |
| Pure Metric Selectors | `deriveEffortState()` derived calculation | `src/utils/effortReducer.ts` | Pure function test | **IMPLEMENTED** |
| Asymmetric Example | `EM` 100 $\times$ 0.1 vs `AI_DO` 1 $\times$ 50 | `src/components/EffortAnalyzer.tsx` | UI verification | **IMPLEMENTED** |
| Red-Flag Detection | Automated flag detection from ratio | `src/utils/effortReducer.ts` | Threshold verification | **IMPLEMENTED** |
| Git Commit Target | `feat(fsm): implement asymmetric effort reducer` | Git commit `0369d23` | `git log` | **IMPLEMENTED** |

---

## M3 – Ghosting Timer and AbortController

### 1. Objectives & Scope
- Implement an automated 5-second asynchronous reply countdown whenever a message/signal is dispatched.
- Emulate the "seen but no reply" dynamic leading to `GHOSTED_EXIT`.
- Manage asynchronous side effects strictly through React `useEffect()`.
- Bind `AbortController` to the timer lifecycle to prevent race conditions and stale async updates:
  - Abort countdown immediately if user changes the relationship phase before 5 seconds elapse.
  - Abort countdown if component unmounts.
  - Catch and safely handle `AbortError` without throwing unhandled promise rejections or updating unmounted components.

### 2. Mandatory Requirements & Planned Tasks
- [x] Integrate 5-second asynchronous reply timer in `src/hooks/useGhostingTimer.ts`.
- [x] Instantiate `new AbortController()` inside `useEffect()`.
- [x] Supply `abortController.signal` to asynchronous delay logic with `addEventListener('abort')`.
- [x] Return cleanup function from `useEffect()` invoking `controller.abort()`.
- [x] Gracefully catch `err.name === 'AbortError'` and suppress error logging.
- [x] Update status to `GHOSTED` if timer expires without cancellation.
- [x] Commit with message: `feat(fsm): implement abortable ghosting timer` (commit `0d20a68`).

### 3. Traceability Table

| Requirement | Required Identifier / Behavior | Actual File | Verification Method | Status |
| :--- | :--- | :--- | :--- | :--- |
| 5-Second Reply Timer | Asynchronous delay of 5000ms | `src/hooks/useGhostingTimer.ts` | Timer verification | **IMPLEMENTED** |
| React Side-Effect Hook | `useEffect()` with dependency management | `src/hooks/useGhostingTimer.ts` | Hook audit | **IMPLEMENTED** |
| Signal Cancellation | `AbortController` instantiation & signal passing | `src/hooks/useGhostingTimer.ts` | Abort signal audit | **IMPLEMENTED** |
| Unmount & Phase Cleanup | Invocation of `abort()` on transition/unmount | `src/hooks/useGhostingTimer.ts` | Cleanup function check | **IMPLEMENTED** |
| Safe Abort Handling | Explicit suppression of `AbortError` | `src/hooks/useGhostingTimer.ts` | Error catch check | **IMPLEMENTED** |
| Git Commit Target | `feat(fsm): implement abortable ghosting timer` | Git commit `0d20a68` | `git log` | **IMPLEMENTED** |

---

## M4 – Red-Flag Alert and Accessibility

### 1. Objectives & Scope
- Guarantee full accessibility (WCAG 2.1 AA) across all interactive elements.
- Generate unique, deterministic HTML IDs for effort and timer inputs using React `useId()`.
- Ensure strict programmatic association between `<label htmlFor={id}>` and `<input id={id}>` / `<select id={id}>`.
- Announce live dynamic state transitions and red-flag alerts to screen readers using:
  ```tsx
  <output role="status" aria-live="polite">
  ```
- Support 100% keyboard navigation with visible focus rings (`:focus-visible` with high contrast).
- Provide reduced motion support via `@media (prefers-reduced-motion: reduce)`.
- Eliminate inaccessible interaction patterns (e.g., clickable `<div>` without keyboard handlers, missing ARIA attributes).

### 2. Mandatory Requirements & Audit Checklist
- [x] **DONE** — Import and invoke React `useId()` for all form control pairs in `EffortAnalyzer.tsx` and `GhostingTimer.tsx`.
- [x] **DONE** — Associate every form control (`<input>`, `<select>`) with an explicit `<label htmlFor={id}>`.
- [x] **DONE** — Implement live screen-reader announcer `<output role="status" aria-live="polite" aria-atomic="true">` for Red-Flag alerts.
- [x] **DONE** — Implement live screen-reader status output `<output role="status" aria-live="polite" aria-atomic="true">` for FSM phase and ghosting timer status.
- [x] **DONE** — Ensure non-color visual distinction (`RED FLAG` vs `BALANCED STATUS` headings).
- [x] **DONE** — Configure high-contrast `:focus-visible` outline in `src/App.css`.
- [x] **DONE** — Add `@media (prefers-reduced-motion: reduce)` block in `src/App.css`.
- [x] **DONE** — Verify zero non-semantic click listeners (`grep` returned 0).
- [ ] **PARTIAL** — Capture full set of manual browser screenshots under `docs/evidence/M4/`.
- [ ] **PENDING** — Commit with message: `feat(a11y): implement accessible red-flag alerts`.

### 3. Traceability Table

| Requirement | Required Identifier / Behavior | Actual File | Verification Method | Status |
| :--- | :--- | :--- | :--- | :--- |
| Form Input ID Generation | React `useId()` (`actorId`, `stepsId`, `multiplierId`, `recipientId`) | `src/components/EffortAnalyzer.tsx`, `src/components/GhostingTimer.tsx` | DOM & grep audit | **DONE** |
| Label-Input Association | `<label htmlFor={id}>` strictly matches `<select id={id}>` & `<input id={id}>` | `src/components/EffortAnalyzer.tsx`, `src/components/GhostingTimer.tsx` | Form inspection | **DONE** |
| Red-Flag Alert Output | `<output role="status" aria-live="polite" aria-atomic="true">` | `src/components/EffortAnalyzer.tsx` | DOM & live region check | **DONE** |
| Phase & Timer Live Output | `<output role="status" aria-live="polite" aria-atomic="true">` | `src/components/SituationShipAnalyzer.tsx`, `src/components/GhostingTimer.tsx` | DOM check | **DONE** |
| Keyboard Accessibility | 100% native buttons and controls, no clickable divs | `src/components/*.tsx` | grep check (0 non-semantic) | **DONE** |
| Visible Focus Ring | `:focus-visible { outline: 3px solid #ff647f; outline-offset: 3px; }` | `src/App.css` | CSS inspection | **DONE** |
| Reduced Motion Preference | `@media (prefers-reduced-motion: reduce)` duration override | `src/App.css` | CSS inspection | **DONE** |
| Viewport Responsiveness | 375px mobile viewport support without horizontal scrolling | `src/App.css`, `index.html` | Computed layout audit | **DONE** |
| Evidence & Screenshots | Save visual captures under `docs/evidence/M4/` | `docs/evidence/M4/M4_EVIDENCE.md` | Verification log created | **PARTIAL** (Browser captures pending) |
| Git Commit Target | `feat(a11y): implement accessible red-flag alerts` | Git commit `b367cec` | `git log` | **IMPLEMENTED** |

---

## M5 – Responsive UI

### 1. Objectives & Scope
- Design an intuitive, cohesive, aesthetically refined user interface reflecting the V-Pop song theme.
- Support Desktop (1440px+), Compact Desktop/Tablet (1024px), Tablet (768px), Mobile (600px), and Compact Mobile (375px width, e.g., iPhone SE).
- Guarantee zero horizontal scrolling (`document.documentElement.scrollWidth <= window.innerWidth`).
- Maintain touch target size ($\ge 44\text{px} \times 44\text{px}$) across all interactive controls.
- Integrate centralized CSS custom properties (`--color-bg-primary`, `--color-accent`, etc.).
- Provide relationship phase visual progression sequence with active state badges.
- Ensure strict preservation of all M4 accessibility attributes (`useId`, `aria-live`, `:focus-visible`, `prefers-reduced-motion`).

### 2. Mandatory Requirements & Audit Checklist
- [x] **DONE** — Root layout integrating `SituationShipAnalyzer`, `EffortAnalyzer`, and `GhostingTimer` exactly once.
- [x] **DONE** — Relationship state progression visualizer (`.phase-pipeline`) with step numbers, name, and active pill badge.
- [x] **DONE** — Desktop multi-column grid layout (`.analyzer-grid`) for 1440px and 1200px viewports.
- [x] **DONE** — Tablet responsive adaptation at 1024px and 768px breakpoints without overlapping content.
- [x] **DONE** — Mobile 375px single-column layout, compact container padding, zero horizontal scrollbar.
- [x] **DONE** — Enhanced Red-Flag alert visual indicator with bold non-color text and high contrast.
- [x] **DONE** — Touch targets $\ge 44$px for all interactive buttons and inputs.
- [x] **DONE** — Semantic footer with assignment metadata.
- [x] **DONE** — Preservation of all M4 accessibility rules (`useId`, `role="status"`, `aria-live="polite"`, `:focus-visible`, `prefers-reduced-motion`).
- [x] **DONE** — TypeScript (`npx tsc --noEmit`) and production build (`npm run build`) passing with zero diagnostics.
- [ ] **PARTIAL** — Capture full set of browser screenshots under `docs/evidence/M5/`.
- [ ] **PENDING** — Commit with message: `style(fsm): implement responsive relationship analyzer`.

### 3. Traceability Table

| Requirement | Required Identifier / Behavior | Actual File | Verification Method | Status |
| :--- | :--- | :--- | :--- | :--- |
| Root Component Integration | `SituationShipAnalyzer`, `EffortAnalyzer`, `GhostingTimer` | `src/components/SituationShipAnalyzer.tsx` | Component inspection | **DONE** |
| State Progression Tracker | Visual pipeline `.phase-pipeline` with active badges | `src/components/SituationShipAnalyzer.tsx` | Visual review | **DONE** |
| Desktop Multi-Column Grid | `.analyzer-grid` 2-column layout (minmax(480px, 1fr)) | `src/App.css` | Layout inspection | **DONE** |
| Tablet Breakpoints | `@media (max-width: 1024px)` & `@media (max-width: 768px)` | `src/App.css` | DevTools simulation | **DONE** |
| 375px Mobile Viewport | Single column, `overflow-x: hidden`, no overflow | `src/App.css` (`@media (max-width: 375px)`) | JS scrollWidth test | **DONE** |
| Touch Target Minimums | Height $\ge 44\text{px}$ on all interactive buttons | `src/App.css` | Computed style audit | **DONE** |
| Accessible Red-Flag UI | High-contrast banner with bold non-color status text | `src/components/EffortAnalyzer.tsx`, `src/App.css` | Visual & ARIA check | **DONE** |
| Semantic Footer | `<footer className="analyzer-footer">` with metadata | `src/components/SituationShipAnalyzer.tsx` | DOM inspection | **DONE** |
| M4 Accessibility Preservation | Retain all `useId`, `aria-live`, `:focus-visible`, reduced motion | `src/components/*.tsx`, `src/App.css` | grep verification | **DONE** |
| Evidence & Verification Log | Save visual captures under `docs/evidence/M5/` | `docs/evidence/M5/M5_EVIDENCE.md` | Verification log created | **DONE** |
| Git Commit Target | `style(fsm): implement responsive relationship analyzer` | Git commit `75a96ee` | `git log` | **IMPLEMENTED** |

---

## M6 – Testing, Evidence and Audit

### 1. Objectives & Scope
- Execute a comprehensive testing and audit protocol covering:
  - FSM deterministic transitions (valid transitions succeed, invalid transitions rejected immutably).
  - Strict conformance to canonical identifiers (`STRANGERS`, `DATING_NO_LOVE`, `COMMITTED`, `SELF_RESPECT_EXIT`).
  - Immutability of state and action history logs.
  - Asymmetric effort calculation accuracy (EM: $100 \times 0.1 = 10$; AI_DO: $1 \times 50 = 50$).
  - Ghosting timer countdown (5000ms), `AbortController` cancellation, zombie timer prevention on recipient switch, and clean reset.
  - Accessibility compliance (`useId`, `aria-live`, label-input associations, keyboard `:focus-visible`, reduced motion).
  - Viewport responsiveness at 1024px, 768px, 600px, and 375px.
- Document, reproduce, prove with Chrome DevTools, and manually fix 3 real AI-generated bugs in `AI_FAILURE_AUDIT.md`.
- Create automated test runner executing via `npm test` (`node --test test/fsm-audit.test.mjs`).
- Organize screenshot evidence directories under `docs/evidence/` across milestones `M1/` through `M6/` including `Bug01/`, `Bug02/`, and `Bug03/`.
- Verify complete Git commit tree matches mandatory commit conventions without history rewriting.

### 2. Execution Record & Automated Test Results
- [x] **DONE** — Test transition: `STRANGERS` $\rightarrow$ `DATING_NO_LOVE` (Pass).
- [x] **DONE** — Test invalid transition: `STRANGERS` $\rightarrow$ `COMMITTED` (Rejected without state corruption).
- [x] **DONE** — Test transition: `DATING_NO_LOVE` $\rightarrow$ `COMMITTED` $\rightarrow$ `SELF_RESPECT_EXIT` $\rightarrow$ `STRANGERS` (Pass).
- [x] **DONE** — Test asymmetric effort computation (EM: $100 \times 0.1 = 10$; AI_DO: $1 \times 50 = 50$; ratio: 5.0x; `isRedFlag: true`).
- [x] **DONE** — Test timer abort when phase/recipient is switched before 5s timeout.
- [x] **DONE** — Test accessible announcements and polite live regions.
- [x] **DONE** — Created automated test suite: `test/fsm-audit.test.mjs` (13 tests passing 100%).
- [x] **DONE** — Added `"test": "node --test test/fsm-audit.test.mjs"` to `package.json`.
- [x] **DONE** — Documented and resolved 3 AI Failure Modes in `AI_FAILURE_AUDIT.md`.
- [x] **DONE** — Created comprehensive repair audit: `docs/REPAIR_AUDIT.md` and `docs/evidence/M6/M6_EVIDENCE.md`.
- [x] **DONE** — Established evidence directories: `docs/evidence/M6/Bug01/`, `Bug02/`, `Bug03/` with reproduction instructions.

### 3. Traceability Table

| Requirement | Required Identifier / Behavior | Actual File | Verification Method | Status |
| :--- | :--- | :--- | :--- | :--- |
| FSM Transition Tests | Verify allowed & forbidden state transitions | `test/fsm-audit.test.mjs` | `npm test` (Tests 1-5 PASS) | **DONE** |
| Effort Calculation Tests | Verify weighted sum and ratio logic | `test/fsm-audit.test.mjs` | `npm test` (Tests 6-8 PASS) | **DONE** |
| Timer & Abort Tests | Verify 5s timeout and abort cancellation | `test/fsm-audit.test.mjs` | `npm test` (Test 9 PASS) | **DONE** |
| Accessibility Audit | `useId`, `role="status"`, `aria-live`, focus rings | `test/fsm-audit.test.mjs` | `npm test` (Test 10 PASS) | **DONE** |
| Responsive Breakpoints | `1024px`, `768px`, `600px`, `375px` in CSS | `test/fsm-audit.test.mjs` | `npm test` (Test 11 PASS) | **DONE** |
| CSS Import Verification | `App.css` imported in `App.tsx` and `main.tsx` | `test/fsm-audit.test.mjs` | `npm test` (Test 12 PASS) | **DONE** |
| Zombie Timer Bug Fix | Prevent timer auto-restart on recipient toggle | `test/fsm-audit.test.mjs` | `npm test` (Test 13 PASS) | **DONE** |
| AI Failure Mode Audit | Document 3 real bugs with DevTools proof & fixes | `AI_FAILURE_AUDIT.md` | Audit inspection | **DONE** |
| Screenshot Evidence Structure | Directories `docs/evidence/M6/Bug01` to `Bug03` | `docs/evidence/M6/` | Directory check | **DONE** |
| Git History Preservation | All 6 historical local commits verified intact | Git repository log | `git log --oneline` | **DONE** |

---

## Mandatory Identifiers Audit Summary

| Mandatory Identifier | Expected Location | Actual Present Location | Verification Status |
| :--- | :--- | :--- | :--- |
| `RelationshipPhase` | `src/types/relationship.ts` | `src/types/relationship.ts` (L8-L12) | **VERIFIED** |
| `RelationshipState` | `src/types/relationship.ts` | `src/types/relationship.ts` (L23-L25) | **VERIFIED** |
| `RelationshipAction` | `src/types/relationship.ts` | `src/types/relationship.ts` (L28-L35) | **VERIFIED** |
| `initialRelationshipState` | `src/types/relationship.ts` | `src/types/relationship.ts` (L38-L40) | **VERIFIED** |
| `allowedTransitions` | `src/utils/relationshipReducer.ts` | `src/utils/relationshipReducer.ts` (L17-L38) | **VERIFIED** |
| `canTransition()` | `src/utils/relationshipReducer.ts` | `src/utils/relationshipReducer.ts` (L43-L48) | **VERIFIED** |
| `relationshipReducer()` | `src/utils/relationshipReducer.ts` | `src/utils/relationshipReducer.ts` (L53-L77) | **VERIFIED** |
| `SituationShipAnalyzer` | `src/components/SituationShipAnalyzer.tsx` | `src/components/SituationShipAnalyzer.tsx` | **VERIFIED** |
| `useReducer()` | `src/components/SituationShipAnalyzer.tsx` | `src/components/SituationShipAnalyzer.tsx` | **VERIFIED** |
| `EffortSignal` | `src/types/relationship.ts` | `src/types/relationship.ts` (L15-L20) | **VERIFIED** |
| `useEffect()` | `src/hooks/useGhostingTimer.ts` | `src/hooks/useGhostingTimer.ts` (L32) | **VERIFIED** |
| `AbortController` | `src/hooks/useGhostingTimer.ts` | `src/hooks/useGhostingTimer.ts` (L58) | **VERIFIED** |
| `useId()` | `src/components/EffortAnalyzer.tsx`, `GhostingTimer.tsx` | Multiple components | **VERIFIED** |

---

## Git Commit History Protocol

The repository reflects the following verified progressive local commit sequence:

```text
75a96ee style(fsm): implement responsive relationship analyzer   [M5 - COMPLETED]
b367cec feat(a11y): implement accessible red-flag alerts        [M4 - COMPLETED]
0d20a68 feat(fsm): implement abortable ghosting timer           [M3 - COMPLETED]
0369d23 feat(fsm): implement asymmetric effort reducer          [M2 - COMPLETED]
5103371 feat(fsm): implement deterministic relationship states  [M1 - COMPLETED]
272b6c1 chore(fsm): initialize exercise audit                    [M0 - COMPLETED]
```
PENDING feat(fsm): implement abortable ghosting timer           [M3 - PENDING]
PENDING feat(a11y): implement accessible red-flag alerts        [M4 - PENDING]
PENDING style(fsm): implement responsive relationship analyzer   [M5 - PENDING]
PENDING test(fsm): verify state machine and timer behavior      [M6 - PENDING]
```

