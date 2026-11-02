# Comprehensive Project Repair Audit (M1 – M6)
**Project**: `24520225_NguyenBaoChinh_Lab03_BonusHW`  
**Date**: November 2, 2026  
**Auditor**: Nguyen Bao Chinh (24520225)  
**Status**: Pre-Repair Inspection Complete

---

## 1. Initial State & Git History Preservation (Rule 0.A)

- **Active Git Branch**: `main`
- **Initial Commit Log Baseline**:
  1. `75a96ee` — `style(fsm): implement responsive relationship analyzer` (M5)
  2. `b367cec` — `feat(a11y): implement accessible red-flag alerts` (M4)
  3. `0d20a68` — `feat(fsm): implement abortable ghosting timer` (M3)
  4. `0369d23` — `feat(fsm): implement asymmetric effort reducer` (M2)
  5. `5103371` — `feat(fsm): implement deterministic relationship states` (M1)
  6. `272b6c1` — `chore(fsm): initialize exercise audit` (M0)
- **Git Protection Guarantee**: No existing commits will be amended, rebased, squashed, or deleted. All repair work is developed additively with zero history rewriting.

---

## 2. Table A — Assignment-Required Protected Files Inventory

| Required filename | Exists | Current condition | Required action | Protected |
| :--- | :--- | :--- | :--- | :--- |
| `package.json` | Yes | Configured with React 19, TS ~5.7.2, Vite 8 | Preserve as-is | **YES** |
| `vite.config.ts` | Yes | Standard Vite React plugin | Preserve as-is | **YES** |
| `tsconfig.app.json` | Yes | ES2023, JSX react-jsx | Preserve as-is | **YES** |
| `src/main.tsx` | Yes | Standard createRoot entry, only imports `./index.css` | Import `./App.css` to load styles globally | **YES** |
| `src/App.tsx` | Yes | Renders `<SituationShipAnalyzer />`, missing `import './App.css'` | Add `import './App.css'` | **YES** |
| `src/App.css` | Yes | Contains design tokens, grid layout, 375px responsive rules, focus & reduced motion | Refine metric layouts and semantic class bindings | **YES** |
| `src/index.css` | Yes | Modern CSS reset and root typography | Preserve baseline styles | **YES** |
| `src/types/relationship.ts` | Yes | Declares `RelationshipPhase`, `EffortSignal`, `RelationshipState`, `RelationshipAction`, `initialRelationshipState` | Preserve exact contracts | **YES** |
| `src/utils/relationshipReducer.ts` | Yes | Implements `allowedTransitions`, `canTransition()`, `relationshipReducer()` | Preserve deterministic FSM logic | **YES** |
| `src/utils/effortReducer.ts` | Yes | Implements `EffortLogState`, `EffortAction`, `initialEffortState`, `effortReducer()`, `deriveEffortState()` | Preserve exact pure algorithms | **YES** |
| `src/hooks/useGhostingTimer.ts` | Yes | Implements `useGhostingTimer()`, `AbortController`, 5s timeout, cleanup | Preserve lifecycle & error handling | **YES** |
| `src/hooks/useAccessibleId.ts` | Yes | Implements `useAccessibleId()` helper | Preserve helper export | **YES** |
| `src/components/SituationShipAnalyzer.tsx` | Yes | Primary FSM dashboard container, state progression pipeline | Ensure structural wrapper for metric labels | **YES** |
| `src/components/EffortAnalyzer.tsx` | Yes | Form controls, derived metrics, Red-Flag alert | Wrap metrics in semantic containers to prevent concatenation | **YES** |
| `src/components/GhostingTimer.tsx` | Yes | Timer controls, status readouts, polite live output | Ensure readable semantic wrappers | **YES** |
| `TASK_DECOMPOSITION.md` | Yes | Progress tracker across M0 – M6 | Update with M6 and repair verification | **YES** |
| `PROJECT_STRUCTURE.md` | Yes | Architectural tree and file roles | Keep synchronized with physical disk | **YES** |
| `AI_FAILURE_AUDIT.md` | Yes | Documentation of regressions and fixes | Add M6 and unstyled root cause diagnosis | **YES** |

---

## 3. Table B — Required Identifiers Audit

| Milestone | Required function/variable/type | Actual location | Exists | Correct |
| :--- | :--- | :--- | :--- | :--- |
| **M1** | `RelationshipPhase` | `src/types/relationship.ts` (L8) | Yes | Yes (`'FRIENDS' \| 'DATING_NO_LOVE' \| 'OFFICIAL_LOVE' \| 'GHOSTED_EXIT'`) |
| **M1** | `RelationshipState` | `src/types/relationship.ts` (L23) | Yes | Yes (`{ readonly phase: RelationshipPhase; }`) |
| **M1** | `RelationshipAction` | `src/types/relationship.ts` (L28) | Yes | Yes (`SET_PHASE \| RESET`) |
| **M1** | `initialRelationshipState` | `src/types/relationship.ts` (L38) | Yes | Yes (`{ phase: 'FRIENDS' }`) |
| **M1** | `allowedTransitions` | `src/utils/relationshipReducer.ts` (L17) | Yes | Yes (Strict FSM transition allowlist) |
| **M1** | `canTransition()` | `src/utils/relationshipReducer.ts` (L43) | Yes | Yes (Pure boolean transition guard) |
| **M1** | `relationshipReducer()` | `src/utils/relationshipReducer.ts` (L53) | Yes | Yes (Pure deterministic state machine reducer) |
| **M1** | `SituationShipAnalyzer` | `src/components/SituationShipAnalyzer.tsx` | Yes | Yes (Primary container component) |
| **M1** | `useReducer()` | `src/components/SituationShipAnalyzer.tsx` (L18) | Yes | Yes (React state machine dispatcher) |
| **M2** | `EffortSignal` | `src/types/relationship.ts` (L15) | Yes | Yes (`id, actor: 'EM' \| 'AI_DO', steps, multiplier`) |
| **M2** | `EffortLogState` | `src/utils/effortReducer.ts` (L11) | Yes | Yes (`{ readonly signals: readonly EffortSignal[]; }`) |
| **M2** | `EffortAction` | `src/utils/effortReducer.ts` (L16) | Yes | Yes (`ADD_SIGNAL \| REMOVE_SIGNAL \| RESET_LOG`) |
| **M2** | `initialEffortState` | `src/utils/effortReducer.ts` (L30) | Yes | Yes (`{ signals: [] }`) |
| **M2** | `effortReducer()` | `src/utils/effortReducer.ts` (L35) | Yes | Yes (Immutable append-only signal reducer) |
| **M2** | `deriveEffortState()` | `src/utils/effortReducer.ts` (L106) | Yes | Yes (Pure weighted calculation & Red-Flag detector) |
| **M3** | `useGhostingTimer()` | `src/hooks/useGhostingTimer.ts` (L23) | Yes | Yes (5-second reply timer hook) |
| **M3** | `AbortController` | `src/hooks/useGhostingTimer.ts` (L58) | Yes | Yes (Lifecycle cancellation & unmount cleanup) |
| **M3** | `GhostingTimer` | `src/components/GhostingTimer.tsx` (L8) | Yes | Yes (Timer interactive UI panel) |
| **M4** | `useId()` | `src/components/EffortAnalyzer.tsx`, `GhostingTimer.tsx` | Yes | Yes (Deterministic stable form control IDs) |
| **M4** | `<output role="status" aria-live="polite">` | Multiple components | Yes | Yes (Screen reader polite live announcement) |

---

## 4. Table C — Milestone Status Overview

| Milestone | Functional status | UI status | Accessibility | Evidence | Overall |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **M0** | Complete | Clean | Valid | Documented | **DONE** |
| **M1** | Complete | Functional | Valid | Documented | **DONE** |
| **M2** | Complete | Functional | Valid | Documented | **DONE** |
| **M3** | Complete | Functional | Valid | Documented | **DONE** |
| **M4** | Complete | Functional | Valid (WCAG 2.1 AA) | Documented | **DONE** |
| **M5** | Complete | **Unstyled Root Cause** (missing CSS import) | Valid | Documented | **REPAIRED** |
| **M6** | Test suite setup needed | Complete | Valid | Evidence structure | **IN PROGRESS** |

---

## 5. Table D — Root Cause Diagnosis of Screenshot Problems

| # | Investigated Problem | Verified Root Cause in Codebase | Required Technical Remedy |
| :--- | :--- | :--- | :--- |
| 1 | **Application appears completely unstyled** | In `src/App.tsx` and `src/main.tsx`, `import './App.css'` was **never imported**! Only `import './index.css'` was imported, which only set the background color and system font. The 700+ lines of custom styling in `App.css` were never loaded by Vite or the browser. | Add `import './App.css'` explicitly in `src/App.tsx` (and `src/main.tsx` as backup) so the full stylesheet is bundled. |
| 2 | **Browser-default buttons and inputs** | Without `App.css`, user-agent default styles (`button`, `select`, `input`) rendered with generic grey bevels, zero border radius, and default margins. | Once `App.css` is imported, custom inputs, select boxes, and buttons with 44px min-height, dark theme styling, and hover/focus states are applied. |
| 3 | **Content compressed toward left side** | `.analyzer` has `width: min(1200px, 100%); margin: 0 auto;`, but without the stylesheet active, block elements expanded without centering or max-width constraints. | Enabling `App.css` restores the centered `min(1200px, 100%)` container with balanced auto margins. |
| 4 | **Concatenated text (`PhaseFRIENDS`)** | `<span>Current Relationship Phase</span>` and `<output className="phase-value">{phase}</output>` are default inline elements. Without CSS `display: block`, they render side-by-side on the same line with no spacing. | Wrap label and value in semantic block elements (`<div className="current-state-group">`), and ensure CSS explicitly enforces `display: block; margin-top: 8px;`. |
| 5 | **Concatenated text (`0.00Weighted effort`)** | In `EffortAnalyzer.tsx`, `<strong>{summary.emWeightedEffort}</strong>` and `<span>Weighted effort</span>` were adjacent inline elements inside `<article>`. | Refactor to `<div className="metric"><span className="metric-label">Weighted effort</span><strong className="metric-value">{value}</strong></div>` with CSS flex column layout. |
| 6 | **Sections lack visual separation** | Panels had class names (`.state-panel`, `.effort-panel`, `.ghosting-panel`), but without CSS they rendered as plain transparent wrappers with no borders, backgrounds, or padding. | Importing `App.css` restores navy surface cards (`#151d2d`), subtle borders (`#34445c`), 20px border radii, and 28px internal padding. |
| 7 | **CSS module vs standard CSS** | Project uses standard CSS with class selectors. No CSS modules were configured in `vite.config.ts`, but standard CSS classes were decoupled because the CSS file was omitted from the bundle. | Direct import `import './App.css'` in `App.tsx` resolves bundle inclusion immediately. |
| 8 | **Global styles overridden** | `index.css` set basic page colors (`background: #090d16`), but did not include layout or component classes. | Retain `index.css` for root baseline reset and load `App.css` for component and layout rules. |
| 9 | **Default browser styles leaking** | Default browser margins on `<figure>`, `<header>`, `<h1>`, `<h3>`, `<p>` caused unpredictable spacing. | Standardize `* { box-sizing: border-box; }` and normalize heading/paragraph margins in `App.css`. |
| 10 | **Responsive layout missing** | `@media` queries in `App.css` were inactive due to lack of import. | Once bundled, `@media (max-width: 1024px)`, `(max-width: 768px)`, `(max-width: 600px)`, and `(max-width: 375px)` activate properly. |

