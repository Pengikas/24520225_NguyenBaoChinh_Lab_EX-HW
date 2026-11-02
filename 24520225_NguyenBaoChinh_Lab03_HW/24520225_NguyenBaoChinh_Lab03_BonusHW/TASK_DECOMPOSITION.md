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
| **M4** | Red-Flag Alert & Accessibility | `feat(a11y): implement accessible red-flag alerts` | *Pending commit* | **DONE (Code) / PARTIAL (Screenshots)** |
| **M5** | Responsive UI & Layout | `style(fsm): implement responsive relationship analyzer` | *Pending* | **PENDING** |
| **M6** | Testing, Evidence & Audit | `test(fsm): verify state machine and timer behavior` | *Pending* | **PENDING** |

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
- Strictly model the 4 relationship phases:
  1. `FRIENDS`: Initial platonic state.
  2. `DATING_NO_LOVE`: "Hẹn hò nhưng không yêu" (situationship).
  3. `OFFICIAL_LOVE`: Committed romantic partnership.
  4. `GHOSTED_EXIT`: Relationship terminated abruptly without closure.
- Enforce strict directed state transition rules:
  - `FRIENDS` $\rightarrow$ `DATING_NO_LOVE`
  - `DATING_NO_LOVE` $\rightarrow$ `FRIENDS` | `OFFICIAL_LOVE` | `GHOSTED_EXIT`
  - `OFFICIAL_LOVE` $\rightarrow$ `GHOSTED_EXIT`
  - `GHOSTED_EXIT` $\rightarrow$ `FRIENDS`
- Reject all illegal transitions gracefully without mutating previous state.
- Bind FSM state directly to the React component tree via `useReducer()`.

### 2. Required Tasks & Execution Record
- [x] Define union type `RelationshipPhase` with exact 4 literals.
- [x] Define state interface `RelationshipState` containing `phase: RelationshipPhase`.
- [x] Define action union `RelationshipAction` (`SET_PHASE`, `RESET`).
- [x] Define default immutable state `initialRelationshipState = { phase: 'FRIENDS' }`.
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
| Phase Literal Union | `RelationshipPhase = 'FRIENDS' \| 'DATING_NO_LOVE' \| 'OFFICIAL_LOVE' \| 'GHOSTED_EXIT'` | `src/types/relationship.ts` | Type checking (`tsc -b`) | **IMPLEMENTED** |
| State Interface | `RelationshipState { readonly phase: RelationshipPhase; }` | `src/types/relationship.ts` | Type checking (`tsc -b`) | **IMPLEMENTED** |
| Action Discriminated Union | `RelationshipAction` (`'SET_PHASE'`, `'RESET'`) | `src/types/relationship.ts` | Type checking (`tsc -b`) | **IMPLEMENTED** |
| Initial State Baseline | `initialRelationshipState = { phase: 'FRIENDS' }` | `src/types/relationship.ts` | Runtime validation | **IMPLEMENTED** |
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
| Git Commit Target | `feat(a11y): implement accessible red-flag alerts` | Git history | `git log` | **PENDING** |

---

## M5 – Responsive UI

### 1. Objectives & Scope
- Design an intuitive, aesthetically refined user interface reflecting the V-Pop song theme.
- Support Desktop (1200px+), Tablet (768px - 1024px), and Mobile viewports (down to 375px width, e.g., iPhone SE).
- Guarantee zero horizontal scrolling or layout clipping at 375px.
- Maintain minimum touch target size (44px $\times$ 44px) for all mobile buttons and interactive items.
- Ensure readable typography scaling (`clamp()` fluid font sizing).

### 2. Mandatory Requirements & Planned Tasks
- [x] Basic responsive grid layout and `clamp()` typography defined in `src/App.css`.
- [ ] Responsive grid/flex layout accommodating the complete analyzer (FSM controls, Effort Logger, Ghosting Timer, Red-Flag Banner).
- [ ] Test layout at viewport widths: 1440px, 1024px, 768px, 480px, and 375px.
- [ ] Verify touch target heights ($\ge 44\text{px}$) and padding.
- [ ] Commit with message: `style(fsm): implement responsive relationship analyzer`.

### 3. Traceability Table

| Requirement | Required Identifier / Behavior | Actual File | Verification Method | Status |
| :--- | :--- | :--- | :--- | :--- |
| 375px Mobile Viewport | No horizontal overflow (`overflow-x: hidden`) | `src/App.css`, `index.html` | Browser devtools (375px) | **PENDING** |
| Fluid Typography | `font-size: clamp(...)` scaling | `src/App.css` | Responsive inspection | **IMPLEMENTED** (Partially) |
| Touch Target Minimums | Height $\ge 44\text{px}$ on all buttons | `src/App.css` | Computed style audit | **IMPLEMENTED** (Partially) |
| Complete Interface Styling | Full styled panels for M2–M4 components | `src/App.css` | Visual review | **PENDING** |
| Git Commit Target | `style(fsm): implement responsive relationship analyzer` | Git history | `git log` | **PENDING** |

---

## M6 – Testing, Evidence and Audit

### 1. Objectives & Scope
- Execute a comprehensive testing and audit protocol covering:
  - FSM deterministic transitions (valid transitions succeed, invalid transitions rejected).
  - Immutability of state and action history logs.
  - Asymmetric effort calculation accuracy.
  - Ghosting timer countdown and `AbortController` cancellation.
  - Accessibility compliance (`aria-live`, label-input associations, keyboard accessibility).
  - Viewport responsiveness at 375px.
- Capture timestamped photographic evidence saved under `docs/evidence/` organized by milestone (`M0/` to `M6/`).
- Verify complete Git commit tree matches the mandatory commit naming conventions.

### 2. Mandatory Requirements & Planned Tasks
- [ ] Test transition: `FRIENDS` $\rightarrow$ `DATING_NO_LOVE` (Pass).
- [ ] Test invalid transition: `FRIENDS` $\rightarrow$ `OFFICIAL_LOVE` (Rejected without state corruption).
- [ ] Test transition: `DATING_NO_LOVE` $\rightarrow$ `OFFICIAL_LOVE` $\rightarrow$ `GHOSTED_EXIT` $\rightarrow$ `FRIENDS` (Pass).
- [ ] Test asymmetric effort computation (EM: $100 \times 0.1 = 10$; AI_DO: $1 \times 50 = 50$).
- [ ] Test timer abort when phase is switched before 5s timeout.
- [ ] Test accessible announcements with simulated screen-reader output.
- [ ] Capture evidence screenshots:
  - `docs/evidence/M0/` (build output, npm audit).
  - `docs/evidence/M1/` (deterministic states, valid/invalid transitions).
  - `docs/evidence/M2/` (asymmetric effort log, red flags).
  - `docs/evidence/M3/` (timer active, abort on state transition).
  - `docs/evidence/M4/` (accessibility DOM, aria-live outputs).
  - `docs/evidence/M5/` (responsive layout at 375px, 768px, 1200px).
  - `docs/evidence/M6/` (test results, git log graph).
- [ ] Update `TASK_DECOMPOSITION.md` and `PROJECT_STRUCTURE.md` to reflect verified results.
- [ ] Commit with message: `test(fsm): verify state machine and timer behavior`.

### 3. Traceability Table

| Requirement | Required Identifier / Behavior | Actual File | Verification Method | Status |
| :--- | :--- | :--- | :--- | :--- |
| FSM Transition Tests | Verify allowed & forbidden state transitions | Test file / Manual test suite | Test run verification | **PENDING** |
| Effort Calculation Tests | Verify weighted sum and ratio logic | Test file / Manual test suite | Calculation check | **PENDING** |
| Timer & Abort Tests | Verify 5s timeout and abort cancellation | Test file / Manual test suite | Timing audit | **PENDING** |
| Accessibility Audit | Lighthouse / axe accessibility score 100% | Chrome DevTools audit | a11y audit report | **PENDING** |
| Screenshot Evidence | Visual proofs saved under `docs/evidence/` | `docs/evidence/` directory | Filesystem check | **NOT VERIFIED** (Folder missing) |
| Git History Verification | 7 clean, descriptive commits conforming to standard | Git repository log | `git log --oneline` | **PENDING** (2/7 done) |
| Git Commit Target | `test(fsm): verify state machine and timer behavior` | Git history | `git log` | **PENDING** |

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
| `SituationShipAnalyzer` | `src/components/SituationShipAnalyzer.tsx` | `src/components/SituationShipAnalyzer.tsx` (L14-L116) | **VERIFIED** |
| `useReducer()` | `src/components/SituationShipAnalyzer.tsx` | `src/components/SituationShipAnalyzer.tsx` (L16-L19) | **VERIFIED** |
| `EffortSignal` | `src/types/relationship.ts` | `src/types/relationship.ts` (L15-L20) | **VERIFIED** |
| `useEffect()` | `src/components/SituationShipAnalyzer.tsx` | *Not yet imported in component* | **PENDING** |
| `AbortController` | `src/components/SituationShipAnalyzer.tsx` | *Not yet implemented in component* | **PENDING** |
| `useId()` | `src/components/SituationShipAnalyzer.tsx` | *Not yet imported in component* | **PENDING** |

---

## Git Commit History Protocol

The repository must reflect the following progressive local commit sequence upon project completion:

```text
272b6c1 chore(fsm): initialize exercise audit                    [M0 - COMPLETED]
5103371 feat(fsm): implement deterministic relationship states  [M1 - COMPLETED]
PENDING feat(fsm): implement asymmetric effort reducer          [M2 - PENDING]
PENDING feat(fsm): implement abortable ghosting timer           [M3 - PENDING]
PENDING feat(a11y): implement accessible red-flag alerts        [M4 - PENDING]
PENDING style(fsm): implement responsive relationship analyzer   [M5 - PENDING]
PENDING test(fsm): verify state machine and timer behavior      [M6 - PENDING]
```

