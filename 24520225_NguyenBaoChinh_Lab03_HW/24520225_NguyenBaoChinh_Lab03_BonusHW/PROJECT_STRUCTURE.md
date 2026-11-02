# Project Structure & Architecture – V-POP FSM Bonus Exercise

**Course**: Web Application Development  
**Student Name**: Nguyen Bao Chinh  
**Student ID**: 24520225  
**Project**: `24520225_NguyenBaoChinh_Lab03_BonusHW`  
**Theme**: V-Pop Applied Creative Exercise – *Hẹn Hò Nhưng Không Yêu* (Finite State Machine & Asymmetric Effort Engine)

---

## 1. Actual Current Filesystem Structure

The following tree represents the **real, verified filesystem state** as of Milestone 4. Every file listed under `[EXISTING]` has been confirmed on disk.

```text
24520225_NguyenBaoChinh_Lab03_BonusHW/
│
├── .gitignore                          [EXISTING] Standard Git exclusion rules (node_modules, dist, logs)
├── README.md                           [EXISTING] Vite project starter documentation
├── TASK_DECOMPOSITION.md               [EXISTING] Single source of truth for milestones and traceability
├── PROJECT_STRUCTURE.md                [EXISTING] Current architectural mapping and file responsibilities
├── AI_FAILURE_AUDIT.md                 [EXISTING] AI failure cases, regressions, and architectural overrides
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
│   ├── App.css                         [EXISTING] Component styling, focus-visible outline, reduced motion
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
│   │   ├── SituationShipAnalyzer.tsx   [EXISTING] Main container: FSM phase, status output, transitions
│   │   ├── EffortAnalyzer.tsx          [EXISTING] M2+M4: Asymmetric effort inputs, useId, Red-Flag alert
│   │   └── GhostingTimer.tsx           [EXISTING] M3+M4: 5s timer, useId, polite status announcement
│   │
│   ├── hooks/                          [EXISTING] Custom React lifecycle and utility hooks
│   │   ├── useGhostingTimer.ts         [EXISTING] M3: 5s timer with AbortController and cleanup
│   │   └── useAccessibleId.ts          [EXISTING] M4: Accessible ID generation helper with prefix
│   │
│   ├── types/                          [EXISTING] TypeScript interfaces and type aliases
│   │   └── relationship.ts             [EXISTING] Contracts: RelationshipPhase, EffortSignal, State, Actions
│   │
│   └── utils/                          [EXISTING] Pure business logic, reducers, and guards
│       ├── relationshipReducer.ts      [EXISTING] FSM allowed transitions, canTransition, relationshipReducer
│       └── effortReducer.ts            [EXISTING] M2: effortReducer, deriveEffortState, pure selectors
│
└── docs/                               [EXISTING] Documentation & audit evidence directory
    └── evidence/                       [EXISTING] Milestone audit captures
        └── M4/                         [EXISTING] Milestone 4 accessibility verification
            └── M4_EVIDENCE.md          [EXISTING] M4 verification table and manual capture protocol
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
| `src/App.css` | **EXISTING** | Scoped styling for `.analyzer`, `.hero`, `.state-panel`, `.effort-panel`, `.ghosting-panel`, fluid typography via `clamp()`, universal `:focus-visible` ring (`3px solid #ff647f`), `@media (prefers-reduced-motion: reduce)`, and media queries supporting 375px mobile viewports. |

### Domain Models & Types (`src/types/`)

| File Path | Status | Key Responsibilities & Implementation Details |
| :--- | :--- | :--- |
| `src/types/relationship.ts` | **EXISTING** | Contains strict TypeScript contracts: <br>• `RelationshipPhase`: Union `'FRIENDS' \| 'DATING_NO_LOVE' \| 'OFFICIAL_LOVE' \| 'GHOSTED_EXIT'`. <br>• `EffortSignal`: Immutable interface with `id`, `actor: 'EM' \| 'AI_DO'`, `steps: number`, `multiplier: number`. <br>• `RelationshipState`: Readonly state object wrapping `phase`. <br>• `RelationshipAction`: Discriminated action union (`SET_PHASE`, `RESET`). <br>• `initialRelationshipState`: Immutable default state object (`phase: 'FRIENDS'`). |

### Business Logic & State Machines (`src/utils/`)

| File Path | Status | Key Responsibilities & Implementation Details |
| :--- | :--- | :--- |
| `src/utils/relationshipReducer.ts` | **EXISTING** | Pure FSM logic without side effects: <br>• `allowedTransitions`: Directed state graph mapping valid phase changes. <br>• `canTransition(current, next)`: Pure boolean guard validating allowed transitions. <br>• `relationshipReducer(state, action)`: State transition reducer rejecting forbidden transitions and maintaining immutability. |
| `src/utils/effortReducer.ts` | **EXISTING** | M2 logic: <br>• `effortReducer()`: Immutable action log management (`ADD_SIGNAL`, `REMOVE_SIGNAL`, `RESET_LOG`). <br>• `deriveEffortState()`: Pure derived-state calculation of total weighted effort, imbalance ratio, and `isRedFlag`. |

### UI Components (`src/components/`)

| File Path | Status | Key Responsibilities & Implementation Details |
| :--- | :--- | :--- |
| `src/components/SituationShipAnalyzer.tsx` | **EXISTING** | Primary container component: <br>• Manages FSM state via `useReducer(relationshipReducer, initialRelationshipState)`. <br>• Renders hero header with theme description. <br>• Displays deterministic current phase with `<output className="phase-value" role="status" aria-live="polite" aria-atomic="true">{phase}</output>`. <br>• Renders transition buttons with dynamic `disabled` states governed by `canTransition()`. <br>• Displays list of available next transitions. <br>• Renders child milestone panels: `<EffortAnalyzer />` and `<GhostingTimer phase={phase} />`. |
| `src/components/EffortAnalyzer.tsx` | **EXISTING** | M2 + M4 component: <br>• Form inputs bound with React `useId()` (`actorId`, `stepsId`, `multiplierId`). <br>• Explicit `<label htmlFor={id}>` for every input and select. <br>• Displays derived weighted effort for EM and AI_DO. <br>• Accessible Red-Flag alert container: `<output role="status" aria-live="polite" aria-atomic="true">{summary.redFlagMessage}</output>`. <br>• Non-color visual indicators (`RED FLAG` vs `BALANCED STATUS`). |
| `src/components/GhostingTimer.tsx` | **EXISTING** | M3 + M4 component: <br>• Recipient select control bound with React `useId()` (`recipientId`). <br>• Explicit `<label htmlFor={recipientId}>`. <br>• Controls: "Send Message", "Simulate Reply", "Reset Timer". <br>• Accessible status announcement: `<output className="ghosting-announcement" role="status" aria-live="polite" aria-atomic="true">{statusLabels[status]}</output>`. |

### Custom Hooks (`src/hooks/`)

| File Path | Status | Key Responsibilities & Implementation Details |
| :--- | :--- | :--- |
| `src/hooks/useGhostingTimer.ts` | **EXISTING** | M3 hook: <br>• Manages 5000ms reply timeout with `useEffect()`. <br>• Instantiates `new AbortController()`, cancels timer on abort, suppresses `AbortError`. <br>• Transitions status from `IDLE` $\rightarrow$ `WAITING` $\rightarrow$ `GHOSTED` / `REPLIED` / `ABORTED`. |
| `src/hooks/useAccessibleId.ts` | **EXISTING** | M4 helper hook: <br>• Combines React `useId()` with custom string prefix to generate stable semantic IDs. |

---

## 3. Classification of Project Files

### A. Implemented & Verified Files (Existing on Disk)
- Configuration: `package.json`, `package-lock.json`, `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`, `vite.config.ts`, `eslint.config.js`, `.gitignore`.
- Documentation: `README.md`, `TASK_DECOMPOSITION.md`, `PROJECT_STRUCTURE.md`, `AI_FAILURE_AUDIT.md`, `docs/evidence/M4/M4_EVIDENCE.md`.
- HTML & Assets: `index.html`, `public/favicon.svg`, `public/icons.svg`, `src/assets/hero.png`, `src/assets/react.svg`, `src/assets/vite.svg`.
- Source Code:
  - `src/main.tsx`
  - `src/App.tsx`
  - `src/index.css`
  - `src/App.css`
  - `src/types/relationship.ts`
  - `src/utils/relationshipReducer.ts`
  - `src/utils/effortReducer.ts`
  - `src/hooks/useGhostingTimer.ts`
  - `src/hooks/useAccessibleId.ts`
  - `src/components/SituationShipAnalyzer.tsx`
  - `src/components/EffortAnalyzer.tsx`
  - `src/components/GhostingTimer.tsx`

### B. Planned Files (Required for Upcoming Milestones)
- `docs/evidence/M5/` – Milestone 5 responsive screenshots.
- `docs/evidence/M6/` – Milestone 6 final verification & audit suite captures.
