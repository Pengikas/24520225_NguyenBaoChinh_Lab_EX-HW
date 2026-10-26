# PROJECT_STRUCTURE.md

## Exercise 2: Scientist & Pioneer Reactive Directory Explorer

**Course:** Web Application Development (Lab 03 — Exercise 2)  
**Deliverable:** Accessible, responsive, and reactive Scientist Directory built with **React 19**, **Vite 8**, Semantic HTML5, accessible form controls, dynamic derived list filtering, and focus-preserving item deletion.  
**Student Name:** Nguyen Bao Chinh | **Student ID:** 24520225  
**Date:** October 26, 2026  

---

## 1. Directory Tree

```text
24520225_NguyenBaoChinh_Lab03_EX2/
├── package.json                             # Root manifest with npm proxy scripts routing to scientist-directory
├── package-lock.json                        # Root lockfile
├── AI_FAILURE_AUDIT.md                      # Detailed audit of 7 AI-generated bugs, build failures, and a11y risks
├── TASK_DECOMPOSITION.md                    # 5-phase Work Breakdown Structure (WBS) with commit mapping
├── PROJECT_STRUCTURE.md                     # Comprehensive architecture specification and file role directory
│
├── scientist-directory/                     # Primary React 19 + Vite 8 Application
│   ├── index.html                           # HTML5 host document mounting React root (<div id="root">)
│   ├── package.json                         # Project dependencies (React 19.3.1, Vite 8.3.4, ESLint 10)
│   ├── package-lock.json                    # Pinned dependency tree for reproducible builds
│   ├── vite.config.js                       # Vite build configuration using @vitejs/plugin-react
│   ├── eslint.config.js                     # ESLint configuration enforcing React Hooks and Refresh rules
│   ├── .gitignore                           # Git ignore rules for node_modules, dist, and local logs
│   ├── README.md                            # Starter documentation for Vite template
│   ├── public/                              # Static public assets served directly
│   │   ├── favicon.svg                      # Application browser favicon
│   │   └── icons.svg                        # SVG symbol sprite definitions
│   └── src/                                 # Application source code
│       ├── main.jsx                         # React 19 bootstrapping entry point (createRoot, StrictMode)
│       ├── App.jsx                          # Root component hosting <ScientistDirectory />
│       ├── style.css                        # Active directory layout, CSS grid controls, cards, and focus styling
│       ├── index.css                        # Global CSS reset and default typography tokens
│       ├── App.css                          # Legacy template CSS (retained from Vite scaffolding)
│       ├── components/                      # UI Component modular hierarchy
│       │   └── ScientistDirectory.jsx       # Core reactive directory component with search, filter, sort & delete
│       ├── data/                            # Static data definitions
│       │   └── smartPeople.js               # Normalized scientist dataset with stable unique IDs (sp-1..sp-8)
│       └── assets/                          # Static image and SVG assets
│           ├── hero.png                     # Hero graphic asset
│           ├── react.svg                    # React framework logo
│           └── vite.svg                     # Vite bundler logo
│
└── [Preserved Legacy Standalone Files — Lab 02]
    ├── mini_react.js                        # Custom Virtual DOM & useState runtime (preserved from Lab 02)
    ├── state_machine.js                     # 4-state Finite State Machine validator (preserved from Lab 02)
    ├── app.js                               # Standalone script for Lab 02 Task Manager & State Machine
    ├── styles.css                           # Standalone dark-mode stylesheet for Lab 02
    ├── index.html                           # Standalone HTML mounting host for Lab 02 app.js
    └── test_runner.js                       # Standalone automated assertion test runner for Lab 02
```

---

## 2. File Responsibilities & Architectural Roles

### 2.1. Primary React 19 Application Files (`scientist-directory/`)

| File Path | Classification | Primary Responsibility | Key Invariants & Contracts |
|---|---|---|---|
| `scientist-directory/src/components/ScientistDirectory.jsx` | Core UI Component | Main interactive directory view managing search, minimum IQ filtering, multi-criteria sorting, deletion, and full reset | Derives `visiblePeople` purely during rendering using `.filter()` and `.toSorted()`; enforces accessible focus restoration via `useLayoutEffect` and `deleteButtonRefs`. |
| `scientist-directory/src/data/smartPeople.js` | Data Model | Exports immutable `SMART_PEOPLE` baseline array of scientist figures | Every entity possesses a unique persistent `id` (`sp-1` through `sp-8`), `name`, `age`, and `iq`. |
| `scientist-directory/src/App.jsx` | Root Component | Top-level view container rendering `<ScientistDirectory />` | Lightweight container decoupling the application wrapper from directory domain logic. |
| `scientist-directory/src/main.jsx` | Application Bootstrap | Entry point initializing React 19 root into `#root` DOM element | Enforces `StrictMode`, asserts existence of `#root` container, imports `./style.css`. |
| `scientist-directory/src/style.css` | Component Styles | Defines CSS grid layout for `.controls` (3 columns), responsive card grid (`.people-list`), and high-contrast `:focus-visible` rings | Mobile-first media query at `600px` collapsing controls and card grid to single column. |
| `scientist-directory/index.html` | Host Document | Host HTML shell for Vite dev server and production builds | Configures viewport meta tags, browser favicon, and module script entry `<script type="module" src="/src/main.jsx">`. |
| `scientist-directory/package.json` | Project Manifest | Declares dependencies (`react@^19.3.1`, `react-dom@^19.3.1`) and devDependencies (`vite@^8.3.4`, `eslint@^10.13.0`) | Exposes `dev`, `build`, `lint`, and `preview` npm scripts. |
| `scientist-directory/vite.config.js` | Build Configuration | Configures Vite build pipeline with `@vitejs/plugin-react` | Enables Fast Refresh and optimized JSX transformation. |
| `scientist-directory/eslint.config.js` | Code Quality Config | Flat ESLint config checking React hooks and refresh rules | Enforces strict Hook dependency rules (`react-hooks/exhaustive-deps`). |

### 2.2. Root Workspace Files

| File Path | Classification | Primary Responsibility |
|---|---|---|
| `package.json` | Root Proxy Manifest | Provides top-level npm script aliases (`dev`, `build`, `preview`) using `--prefix scientist-directory` to ensure seamless command execution from workspace root. |
| `AI_FAILURE_AUDIT.md` | Audit Documentation | Formal engineering report documenting 7 AI failure modes and anti-patterns with empirical verification evidence. |
| `TASK_DECOMPOSITION.md` | Process Documentation | 5-phase Work Breakdown Structure (WBS) with task acceptance criteria, verification matrix, and Git milestone mapping. |
| `PROJECT_STRUCTURE.md` | Architecture Documentation | Single source of truth detailing directory structure, file roles, and runtime rendering flow. |

### 2.3. Preserved Legacy Files (Lab 02 Standalone Artifacts)

The files `mini_react.js`, `state_machine.js`, `app.js`, `test_runner.js`, `styles.css`, and root `index.html` were inherited from earlier laboratory exercises (Lab 02). In accordance with assignment instructions:
1. **Preservation:** They are intentionally kept in the workspace root without deletion.
2. **Isolation:** Source code inspection confirms that **none** of these files are imported by `scientist-directory/src/main.jsx`, `App.jsx`, or any component in the React 19 application. They do not pollute the Vite module dependency graph or affect production builds.

---

## 3. Data Flow & Component Architecture

```text
[smartPeople.js]
       │
       │ (initialData)
       ▼
[ScientistDirectory.jsx]
       ├── State: [people, setPeople]            (Initialized to initialData copy)
       ├── State: [query, setQuery]              (Search string)
       ├── State: [minIq, setMinIq]              (Numeric threshold, default 160)
       ├── State: [sortBy, setSortBy]            (Sort key: "iq-desc" | "iq-asc" | "age-asc" | "age-desc")
       ├── Ref:   deleteButtonRefs               (Map<personId, HTMLButtonElement>)
       ├── Ref:   focusAfterDeleteId             (Tracks adjacent target ID post-deletion)
       ├── Ref:   searchInputRef                 (Fallback focus target)
       │
       ▼ (Pure Derivation during Render)
   visiblePeople = people
       .filter(p => matchesName(p.name, query) && p.iq >= minIq)
       .toSorted(sortComparator(sortBy))
       │
       ├──► <header>           (Title & subtitle)
       ├──► <section.controls> (Search input, Min IQ number input, Sort select, Reset button)
       ├──► <p.results-count>  (Live status announcement: role="status" aria-live="polite")
       └──► <ul.people-list>   (Cards mapped by key={person.id})
                 └── <li.person-card>
                          ├── <h2>{person.name}</h2>
                          ├── <dl> Age & IQ </dl>
                          └── <button> Delete (stores ref, calls handleDelete)
```

---

## 4. Execution & Verification Guide

### 4.1. Development Server
Run from either the workspace root or inside `scientist-directory/`:
```bash
# From workspace root
npm run dev

# Or directly within the subproject
cd scientist-directory && npm run dev
```
*Expected Output:* Vite dev server initializes and serves the application (default port `http://localhost:5173/` or `http://localhost:5175/` if port 5173 is occupied).

### 4.2. Production Build
```bash
# From workspace root
npm run build
```
*Expected Output:*
```text
vite v8.3.5 building client environment for production...
✓ 18 modules transformed.
dist/index.html                   0.46 kB │ gzip:  0.29 kB
dist/assets/index-mesNBpTX.css    0.93 kB │ gzip:  0.49 kB
dist/assets/index-BDuXk9en.js   222.89 kB │ gzip: 69.83 kB
✓ built in 597ms
```

### 4.3. Code Quality & Linting
```bash
npm --prefix scientist-directory run lint
```
*Expected Output:* Exits with code 0 (clean output, 0 errors, 0 warnings).
