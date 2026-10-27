# PROJECT_STRUCTURE.md

## Exercise 3: KRAFTON PUBG Vietnam Series (PVS) Live Match Telemetry

**Course:** Web Application Development (Lab 03 — Exercise 3)  
**Deliverable:** Fault-tolerant, reactive live telemetry dashboard simulating PUBG Vietnam Series (PVS) squad status. Built with **React 19**, **Vite 8**, Semantic HTML5, CSS Modules, a 4-state asynchronous Finite State Machine (`IDLE / LOADING / SUCCESS / ERROR`), race-condition mitigation via `AbortController`, Blue-Zone pulse skeleton loading with reduced-motion support, and accessible error recovery (`role="alert"`).  
**Student Name:** Nguyen Bao Chinh | **Student ID:** 24520225  
**Date:** October 26, 2026  

---

## 1. Directory Tree

```text
24520225_NguyenBaoChinh_Lab03_EX3/
├── index.html                                 # HTML5 entry host document with inline favicon data URI
├── package.json                               # Project metadata, React 19 dependencies & Vite build scripts
├── package-lock.json                          # Pinned dependency tree for deterministic reproduction
├── .gitignore                                 # Ignores node_modules, dist, and local OS artifacts
├── AI_FAILURE_AUDIT.md                        # Empirical audit of 5 observed AI failure modes & mitigations
├── TASK_DECOMPOSITION.md                      # Work Breakdown Structure (WBS), verification log & Git mapping
├── PROJECT_STRUCTURE.md                       # Comprehensive architecture specification & component contracts
│
└── src/                                       # Application source code
    ├── main.jsx                               # React 19 root bootstrap mounting into #root (StrictMode enabled)
    ├── App.jsx                                # Root view hosting squad navigation & <PubgMatchTelemetry />
    ├── index.css                              # Global CSS design tokens, reset, typography, and navbar styling
    │
    ├── components/                            # UI Components
    │   ├── PubgMatchTelemetry.jsx             # Core telemetry component implementing 4-state FSM & AbortController
    │   └── PubgMatchTelemetry.module.css      # Scoped CSS Module for skeleton animations, error alerts & metric cards
    │
    ├── data/                                  # Static Domain Datasets
    │   └── pubgVnSquads.js                    # Normalized PVS squad dataset (CES, TE, GE) with match statistics
    │
    └── services/                              # Asynchronous Infrastructure Layer
        └── pubgTelemetry.js                   # Simulated telemetry service with 1800ms delay & 35% packet loss
```

---

## 2. File Responsibilities & Architectural Roles

| File Path | Classification | Primary Responsibility | Key Invariants & Contracts |
|---|---|---|---|
| `src/components/PubgMatchTelemetry.jsx` | Core UI Component | Manages telemetry data fetching lifecycle, 4-state FSM, error handling, and conditional rendering | Instantiates a fresh `AbortController` per fetch; clears previous request on unmount/re-fetch; ignores `AbortError`; renders `<TelemetrySkeleton />` during `IDLE`/`LOADING`, accessible `<section role="alert">` on `ERROR`, and `<section aria-live="polite">` on `SUCCESS`. |
| `src/components/PubgMatchTelemetry.module.css` | Scoped Styling | Scoped layout styles for the skeleton pulse, telemetry card, error panel, and responsive grid | Enforces `min-height: 220px` skeleton barrier to minimize CLS; defines `@keyframes blueZonePulse`; provides `@media (prefers-reduced-motion: reduce)` override; spans last metric full-width on mobile (≤520px). |
| `src/services/pubgTelemetry.js` | Infrastructure Service | Simulates remote satellite telemetry retrieval over an unreliable network link | Resolves promise after 1800 ms timeout; simulates 35% packet loss (`Math.random() < 0.35`) strictly on `Erangel` and `Miramar` (Taego is 100% stable); registers and detaches `abort` listener; cleans up timer immediately upon abortion. |
| `src/data/pubgVnSquads.js` | Domain Data Model | Exports immutable `pubgVnSquads` array representing 3 Vietnamese competitive squads | Strictly typed squad entities containing `id`, `name`, `map`, `alive` (0-4), `kills`, `phase` (1-8), `wwcdProb` (0-100), and `status`. |
| `src/App.jsx` | Root View Component | Coordinates top-level page layout, header, and squad selector controls | Maintains `squadId` state (default `'te'`); renders accessible `<button aria-pressed="...">` squad selectors; passes active `squadId` to `<PubgMatchTelemetry />`. |
| `src/main.jsx` | Application Bootstrap | Mounts root React element into DOM node `#root` | Wrapped in `<React.StrictMode>` to enforce side-effect purity, cleanup validation, and double-mount verification. |
| `src/index.css` | Global Design System | Defines PUBG-inspired dark military theme tokens, reset, typography, and selector pill styles | High-contrast color palette (`#f3a51e` gold, `#0d131a` navy dark, `#ffffff` text); accessible `:focus-visible` outlines; zero horizontal scrollbar overflow. |
| `index.html` | Host Document | Static entry point shell for Vite bundler | Declares viewport meta tags, sets `<title>PUBG VN Match Telemetry</title>`, and provides `<link rel="icon" href="data:,">` to prevent favicon 404 noise. |
| `package.json` | Project Manifest | Configures project metadata, dependencies (`react@^19.0.0`, `react-dom@^19.0.0`), and devDependencies (`vite@^8.3.4`) | Declares ES module execution (`"type": "module"`) with standard `dev`, `build`, and `preview` scripts. |
| `AI_FAILURE_AUDIT.md` | Empirical Audit | Records 5 concrete AI failure modes encountered during development and their rigorous empirical fixes | Documents invalid JSON package manifests, unrequested CSS deletion, phantom browser verification claims, and wrong-port test collisions. |
| `TASK_DECOMPOSITION.md` | Process Engineering | 7-task breakdown structure with test verification logs (19 service tests, 54 UI checks) and Git commit hashes | Maps implementation progress directly to verifiable acceptance criteria and immutable commit milestones. |
| `PROJECT_STRUCTURE.md` | Architecture Documentation | Comprehensive system design, data flow diagrams, component contracts, and accessibility specifications | Single source of truth for repository structure and runtime execution logic. |

---

## 3. Asynchronous Lifecycle & State Machine Architecture

The component adheres to a strict 4-state Finite State Machine ensuring no race conditions, stale updates, or uncaught rejections:

```text
                           [User selects squadId / Clicks Retry]
                                             │
                                             ▼
                                  ┌────────────────────┐
                                  │   status: IDLE     │
                                  └──────────┬─────────┘
                                             │
                                             │ useEffect() triggers
                                             ▼
                                  ┌────────────────────┐
                ┌────────────────►│  status: LOADING   │◄────────────────┐
                │                 │  (renders Skeleton)│                 │
                │                 └──────────┬─────────┘                 │
                │                            │                           │
                │         fetchKraftonPubgTelemetry(squadId)             │
                │                            │                           │
                │              ┌─────────────┴─────────────┐             │
                │              │                           │             │
        Promise resolves       │                   Promise rejects       │
                │              │                   (Non-AbortError)      │
                ▼              ▼                           ▼             │
     ┌────────────────────┐    │                ┌────────────────────┐   │
     │  status: SUCCESS   │    │                │   status: ERROR    │   │
     │  (renders metrics) │    │                │ (renders Alert UI) ├───┘
     └────────────────────┘    │                └────────────────────┘ [User clicks Retry]
                               │
                      signal.aborted === true
                               │
                               ▼
                    [AbortError Ignored]
            (State remains untouched; no leak)
```

### Race-Condition Mitigation Contract
1. **Per-Fetch AbortController:** On every execution of `useEffect`, a fresh `const controller = new AbortController()` is created.
2. **Explicit Teardown:** The effect cleanup function invokes `controller.abort()`. When switching rapidly (e.g. `CES` → `TE` → `GE`), pending requests are aborted immediately, preventing out-of-order state overwrites.
3. **Filter Abort Rejections:** In `catch(error)`, if `error.name === "AbortError"`, execution terminates silently without updating state or displaying a false error.
4. **Retry Loop:** Retries increment an internal `retryTick` counter, cleanly re-triggering the effect lifecycle without mutating the existing `squadId`.

---

## 4. Domain Data Model & Simulation Rules

### 4.1. Squad Schema (`pubgVnSquads.js`)
```javascript
{
    id: "te",                        // Unique squad identifier (ces | te | ge)
    name: "The Expendables",        // Official competitive roster name
    map: "Taego",                   // Active battleground (Erangel | Miramar | Taego)
    alive: 4,                       // Active squad members remaining (0 - 4)
    kills: 11,                      // Total squad kill count
    phase: 5,                       // Active Blue Zone Phase (1 - 8)
    wwcdProb: 42,                   // WWCD (Winner Winner Chicken Dinner) probability percentage
    status: "Holding Blue Zone edge" // Tactical operational status
}
```

### 4.2. Network Simulation Rules (`pubgTelemetry.js`)
* **Latency Guarantee:** Every simulated satellite request incurs an intentional 1,800 ms response latency.
* **Map Reliability Isolation:**
  * **Taego:** 100% deterministic packet transmission (`0%` packet loss).
  * **Erangel & Miramar:** Simulated atmospheric interference with strict **35% packet loss** threshold (`Math.random() < 0.35`).
* **Resource Disposals:** Timeout identifiers (`clearTimeout`) and event listeners (`removeEventListener`) are disposed in both normal resolution paths and aborted cancellation paths to ensure zero memory leaks.

---

## 5. Accessibility (A11y) & UX Standards

1. **Skeleton Region Semantics:**
   - The `<TelemetrySkeleton />` container is annotated with `aria-busy="true"` and `aria-label="Loading match telemetry"`.
   - Metric placeholders are marked with `aria-hidden="true"` accompanied by a `.visually-hidden` screen-reader narration.
   - Respects user accessibility preferences via `@media (prefers-reduced-motion: reduce)` by disabling pulse animations.
2. **Accessible Error Alert:**
   - Failure state is presented inside `<section role="alert">` to trigger immediate assistive screen reader announcement.
   - Fully interactive button labelled `"Reconnect Satellite (Retry)"` with a visible high-contrast `3px solid #ff7b00` focus ring.
   - Explicitly rejects invasive modal popups (`window.alert()`).
3. **Live Region Updates:**
   - The telemetry panel features `aria-live="polite"` so new match statistics are narrated cleanly without interrupting active screen reader tasks.
4. **Selector Navigation:**
   - Squad switch buttons leverage `aria-pressed="true|false"` to communicate toggle state in accordance with WAI-ARIA button patterns.
   - All interactive touch targets meet or exceed minimum dimensions (≥ 40 px height).
5. **Color Contrast:**
   - Text elements achieve a contrast ratio ≥ 6.46:1 against dark backgrounds, comfortably surpassing WCAG AA standards (4.5:1).
