# Project Structure & Architecture – V-POP FSM Bonus Exercise

**Course**: Web Application Development  
**Student Name**: Nguyen Bao Chinh  
**Student ID**: 24520225  
**Project**: `24520225_NguyenBaoChinh_Lab03_BonusHW`  
**Theme**: V-Pop Applied Creative Exercise – *Hẹn Hò Nhưng Không Yêu* (Finite State Machine & Asymmetric Effort Engine)

---

## 1. Actual Current Filesystem Structure

The following tree represents the **real, verified filesystem state** as of November 2, 2026. Every file listed under `[EXISTING]` has been confirmed on disk. Planned components and directories are explicitly marked to distinguish implemented artifacts from future milestones.

```text
24520225_NguyenBaoChinh_Lab03_BonusHW/
│
├── .gitignore                          [EXISTING] Standard Git exclusion rules (node_modules, dist, logs)
├── README.md                           [EXISTING] Vite project starter documentation
├── TASK_DECOMPOSITION.md               [EXISTING] Single source of truth for milestones and traceability
├── PROJECT_STRUCTURE.md                [EXISTING] Current architectural mapping and file responsibilities
├── eslint.config.js                    [EXISTING] Flat ESLint configuration (TS & React Hooks rules)
├── index.html                          [EXISTING] HTML5 entry point hosting root DOM element (#root)
├── package.json                        [EXISTING] Manifest defining scripts and locked dependencies
├── package-lock.json                   [EXISTING] Deterministic package dependency tree
├── tsconfig.json                       [EXISTING] Root TypeScript solution configuration
├── tsconfig.app.json                   [EXISTING] TypeScript application compiler settings (ES2023)
├── tsconfig.node.json                  [EXISTING] TypeScript Node/Vite tooling compiler settings
├── vite.config.ts                      [EXISTING] Vite bundler configuration with React plugin
│
├── public/                             [EXISTING] Static unbundled web assets
│   ├── favicon.svg                     [EXISTING] Browser tab icon
│   └── icons.svg                       [EXISTING] Vector sprite graphic
│
├── src/                                [EXISTING] Application TypeScript source code
│   ├── App.css                         [EXISTING] Component styling, typography, and responsive rules
│   ├── App.tsx                         [EXISTING] Top-level shell rendering SituationShipAnalyzer
│   ├── index.css                       [EXISTING] Global CSS reset, color variables, and body defaults
│   ├── main.tsx                        [EXISTING] React 19 entry point with createRoot and StrictMode
│   │
│   ├── assets/                         [EXISTING] Static imported assets
│   │   ├── hero.png                    [EXISTING] Promotional visual banner
│   │   ├── react.svg                   [EXISTING] React logo graphic
│   │   └── vite.svg                    [EXISTING] Vite logo graphic
│   │
│   ├── components/                     [EXISTING] React UI presentation components
│   │   └── SituationShipAnalyzer.tsx   [EXISTING] Main UI container for FSM states and transitions
│   │
│   ├── types/                          [EXISTING] TypeScript interfaces and type aliases
│   │   └── relationship.ts             [EXISTING] Contracts: RelationshipPhase, EffortSignal, State, Actions
│   │
│   └── utils/                          [EXISTING] Pure business logic, reducers, and guards
│       └── relationshipReducer.ts      [EXISTING] FSM allowed transitions, canTransition, relationshipReducer
│
├── docs/                               [PLANNED / MISSING] Documentation & audit evidence directory
│   └── evidence/                       [PLANNED / MISSING] Milestone audit captures
│       ├── M0/                         [PLANNED / MISSING] Environment check & initial build screenshots
│       ├── M1/                         [PLANNED / MISSING] Deterministic FSM transitions screenshots
│       ├── M2/                         [PLANNED / MISSING] Asymmetric effort calculations screenshots
│       ├── M3/                         [PLANNED / MISSING] Ghosting timer and AbortController screenshots
│       ├── M4/                         [PLANNED / MISSING] Screen-reader announcement & a11y screenshots
│       ├── M5/                         [PLANNED / MISSING] Responsive viewports (375px/tablet/desktop)
│       └── M6/                         [PLANNED / MISSING] Comprehensive verification & Git history
│
└── AI_FAILURE_AUDIT.md                 [PLANNED / MISSING] AI failure cases and manual architectural overrides
```

---

## 2. Source File Responsibilities & Content Audits

### Root Configuration & Entry Files

| File Path | Status | Key Responsibilities & Implementation Details |
| :--- | :--- | :--- |
| `package.json` | **EXISTING** | Declares project metadata, development scripts (`dev`, `build`, `lint`, `preview`), core runtime libraries (`react` 19.3.1, `react-dom` 19.3.1), and pinned dev dependencies (`typescript` ~5.7.2, `vite` ^8.3.5, `@vitejs/plugin-react` ^6.1.2). |
| `tsconfig.app.json` | **EXISTING** | Configures TypeScript compilation for browser code: target `ES2023`, library `ES2023` + `DOM`, bundler module resolution, `verbatimModuleSyntax: true`, and `jsx: react-jsx`. |
| `tsconfig.node.json` | **EXISTING** | Configures TypeScript for build configurations: target `ES2023`, module `nodenext`, strict checking. |
| `vite.config.ts` | **EXISTING** | Configures Vite bundling pipeline with `@vitejs/plugin-react`. |
| `index.html` | **EXISTING** | HTML5 entry point specifying viewport metadata (`width=device-width, initial-scale=1.0`), favicon link, and root mounting node `<div id="root">`. |

### Application Source Files (`src/`)

| File Path | Status | Key Responsibilities & Implementation Details |
| :--- | :--- | :--- |
| `src/main.tsx` | **EXISTING** | Mounts root React application into `#root` DOM element using `createRoot()` wrapped with `React.StrictMode`. Imports `index.css`. |
| `src/App.tsx` | **EXISTING** | Root functional component serving as an ergonomic wrapper that renders `<SituationShipAnalyzer />`. |
| `src/index.css` | **EXISTING** | Sets up global system font stack, modern CSS reset, background colors (`#090d16`), and dark-mode color scheme defaults. |
| `src/App.css` | **EXISTING** | Scoped styling for `.analyzer`, `.hero`, `.state-panel`, fluid typography via `clamp()`, interactive focus rings (`:focus-visible`), and media queries supporting screens down to 375px. |

### Domain Models & Types (`src/types/`)

| File Path | Status | Key Responsibilities & Implementation Details |
| :--- | :--- | :--- |
| `src/types/relationship.ts` | **EXISTING** | Contains strict TypeScript contracts: <br>• `RelationshipPhase`: Union `'FRIENDS' \| 'DATING_NO_LOVE' \| 'OFFICIAL_LOVE' \| 'GHOSTED_EXIT'`. <br>• `EffortSignal`: Immutable interface with `id`, `actor: 'EM' \| 'AI_DO'`, `steps: number`, `multiplier: number`. <br>• `RelationshipState`: Readonly state object wrapping `phase`. <br>• `RelationshipAction`: Discriminated action union (`SET_PHASE`, `RESET`). <br>• `initialRelationshipState`: Immutable default state object (`phase: 'FRIENDS'`). |

### Business Logic & State Machines (`src/utils/`)

| File Path | Status | Key Responsibilities & Implementation Details |
| :--- | :--- | :--- |
| `src/utils/relationshipReducer.ts` | **EXISTING** | Contains pure FSM logic without side effects: <br>• `allowedTransitions`: Directed state graph mapping valid phase changes. <br>• `canTransition(current, next)`: Pure boolean guard validating allowed transitions. <br>• `relationshipReducer(state, action)`: State transition reducer rejecting forbidden transitions and maintaining immutability. |
| `src/utils/effortCalculations.ts` | **PLANNED** | *Planned for M2*: Pure derived-state calculations for total weighted effort, reciprocity ratios, and red-flag detection thresholds. |

### UI Components (`src/components/`)

| File Path | Status | Key Responsibilities & Implementation Details |
| :--- | :--- | :--- |
| `src/components/SituationShipAnalyzer.tsx` | **EXISTING** | Implements the primary user interface: <br>• Manages FSM state via `useReducer(relationshipReducer, initialRelationshipState)`. <br>• Renders hero header with theme description. <br>• Displays deterministic current phase in `<output className="phase-value">{phase}</output>`. <br>• Renders transition buttons with dynamic `disabled` states governed by `canTransition()`. <br>• Displays list of available next transitions. <br>• Provides reset action button. <br>*Planned expansions for M2–M4*: Effort signal logging controls, 5s ghosting timer with `AbortController`, and `<output role="status" aria-live="polite">` screen reader announcements. |

---

## 3. Classification of Project Files

### A. Implemented & Verified Files (Existing on Disk)
- Configuration: `package.json`, `package-lock.json`, `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`, `vite.config.ts`, `eslint.config.js`, `.gitignore`.
- Documentation: `README.md`, `TASK_DECOMPOSITION.md`, `PROJECT_STRUCTURE.md`.
- HTML & Assets: `index.html`, `public/favicon.svg`, `public/icons.svg`, `src/assets/hero.png`, `src/assets/react.svg`, `src/assets/vite.svg`.
- Source Code:
  - `src/main.tsx`
  - `src/App.tsx`
  - `src/index.css`
  - `src/App.css`
  - `src/types/relationship.ts`
  - `src/utils/relationshipReducer.ts`
  - `src/components/SituationShipAnalyzer.tsx`

### B. Planned Files (Required for Upcoming Milestones)
- `src/utils/effortCalculations.ts` – Required for M2 (pure effort calculations and red-flag detection).
- `docs/evidence/M0/` to `docs/evidence/M6/` – Required for M6 audit and visual evidence.
- `AI_FAILURE_AUDIT.md` – Required for comprehensive assignment submission and reflection.

### C. Missing Required Identifiers & Functions (As of Current Snapshot)
The following mandatory functions and hooks are required by the assignment but are **not yet implemented** in the active codebase:
1. `computeTotalEffort()` / `calculateWeightedEffort()` – Missing (M2).
2. `detectRedFlags()` – Missing (M2).
3. `useEffect()` with 5-second ghosting timer – Missing (M3).
4. `AbortController` instantiation and cancellation logic – Missing (M3).
5. `useId()` for form input labeling – Missing (M4).
6. `<output role="status" aria-live="polite">` – Missing (M4).

---

## 4. Verification and Consistency Checklist

- [x] All paths listed as `[EXISTING]` physically exist in `/Users/chinh/UIT lecture/WebApplicationDevelopment/Lab/Lab03/Homework/24520225_NguyenBaoChinh_Lab03_BonusHW`.
- [x] No planned file is falsely claimed to be already implemented.
- [x] All mandatory identifiers from the specification (`RelationshipPhase`, `RelationshipState`, `RelationshipAction`, `initialRelationshipState`, `allowedTransitions`, `canTransition()`, `relationshipReducer()`, `SituationShipAnalyzer`, `useReducer()`, `EffortSignal`) are accurately traced.
- [x] Milestone progression is fully synchronized between `TASK_DECOMPOSITION.md` and `PROJECT_STRUCTURE.md`.

