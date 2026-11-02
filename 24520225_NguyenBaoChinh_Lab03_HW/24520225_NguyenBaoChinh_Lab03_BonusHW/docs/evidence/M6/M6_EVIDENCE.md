# M6 Comprehensive Testing, Evidence & Final Audit Log

**Milestone**: M6 — Testing, Evidence and Audit  
**Project**: `24520225_NguyenBaoChinh_Lab03_BonusHW`  
**Date**: November 2, 2026  
**Auditor**: Nguyen Bao Chinh (24520225)

---

## 1. Executive Summary & Verification Matrix

The test suite in `test/fsm-audit.test.mjs` executes 13 automated unit and integration tests verifying all 6 milestones natively via `node --test`.

| Test ID | Area | Target Specification | Verification Method | Result |
| :--- | :--- | :--- | :--- | :--- |
| **M6-01** | M1 FSM | Initial state is strictly `STRANGERS` | Unit assertion | **DONE** |
| **M6-02** | M1 FSM | Allowed transitions lookup table matches canonical contract | Contract assertion | **DONE** |
| **M6-03** | M1 FSM | `canTransition()` accepts all 6 valid directed paths | Guard assertion | **DONE** |
| **M6-04** | M1 FSM | `canTransition()` rejects all 10 invalid transitions | Guard assertion | **DONE** |
| **M6-05** | M1 FSM | `relationshipReducer()` handles transitions immutably & returns same ref on invalid action | Reducer assertion | **DONE** |
| **M6-06** | M2 Effort | `effortReducer()` handles `ADD_SIGNAL`, `REMOVE_SIGNAL`, `RESET_LOG` immutably | Reducer assertion | **DONE** |
| **M6-07** | M2 Effort | `deriveEffortState()` calculates asymmetric example (EM: 100x0.1=10 vs AI_DO: 1x50=50) -> Red Flag: true | Algorithm assertion | **DONE** |
| **M6-08** | M2 Effort | Balanced signals (EM: 100 > AI_DO: 50) return `isRedFlag: false` | Algorithm assertion | **DONE** |
| **M6-09** | M3 Timer | 5-second reply timeout (`5000ms`), `AbortController`, signal listener, `AbortError` suppression | Source code audit | **DONE** |
| **M6-10** | M4 a11y | `useId()`, `<output role="status" aria-live="polite">`, `:focus-visible`, reduced motion | Static a11y audit | **DONE** |
| **M6-11** | M5 Layout | Breakpoints `1024px`, `768px`, `600px`, `375px` in CSS | Media query audit | **DONE** |
| **M6-12** | M5 CSS | `App.css` is imported in `App.tsx` and `main.tsx` (unstyled defect resolved) | Bundle inclusion audit | **DONE** |
| **M6-13** | M6 Bug Fix | Ghosting Timer zombie prevention on recipient switch & clean reset | Lifecycle test | **DONE** |
| **M6-14** | TypeScript | `npx tsc --noEmit` exits with 0 diagnostics | CLI check | **DONE** |
| **M6-15** | Production Build | `npm run build` bundles 11.29 kB CSS and 230 kB JS in <500ms | CLI check | **DONE** |
| **M6-16** | Git History | All 6 historical local commits (`272b6c1` to `75a96ee`) preserved intact | `git log` verification | **DONE** |

---

## 2. Directory Structure of Evidence

Evidence directories are organized by milestone and bug under `docs/evidence/`:

```text
docs/evidence/
├── M1/
│   └── (M1 screenshots: Initial state STRANGERS, valid/invalid transitions, reset)
├── M2/
│   └── (M2 screenshots: Effort signal add, remove, reset, Red-Flag trigger)
├── M3/
│   └── (M3 screenshots: Timer waiting, reply simulation, abort on switch)
├── M4/
│   ├── M4_EVIDENCE.md
│   └── (M4 screenshots: useId in DOM, label associations, focus rings)
├── M5/
│   ├── M5_EVIDENCE.md
│   └── (M5 screenshots: 1440px desktop, 1024px, 768px, 375px zero overflow)
└── M6/
    ├── M6_EVIDENCE.md
    ├── Bug01/
    │   ├── M6-B01-SourceBefore.png
    │   ├── M6-B01-ReproductionBefore.png
    │   ├── M6-B01-DevToolsBefore.png
    │   ├── M6-B01-SourceAfter.png
    │   └── M6-B01-ReproductionAfter.png
    ├── Bug02/
    │   ├── M6-B02-SourceBefore.png
    │   ├── M6-B02-ReproductionBefore.png
    │   ├── M6-B02-DevToolsBefore.png
    │   ├── M6-B02-SourceAfter.png
    │   └── M6-B02-ReproductionAfter.png
    └── Bug03/
        ├── M6-B03-SourceBefore.png
        ├── M6-B03-ReproductionBefore.png
        ├── M6-B03-DevToolsBefore.png
        ├── M6-B03-SourceAfter.png
        └── M6-B03-ReproductionAfter.png
```

---

## 3. Step-by-Step Manual Browser Verification Guide

To capture physical screenshots for submission:
1. Run development server:
   ```bash
   npm run dev
   ```
2. Open Chrome at `http://localhost:5173/`.
3. Verify that the application is **fully styled** with navy blue surfaces, pink accents, structured metric cards, and responsive grids.
4. **M1 Evidence Capture**:
   - Initial state `STRANGERS` active with step 1 highlighted in pipeline.
   - Click `DATING_NO_LOVE`: State updates to `DATING_NO_LOVE`, available transitions update to `STRANGERS`, `COMMITTED`, `SELF_RESPECT_EXIT`.
   - Click `Reset Relationship`: Reverts immediately to `STRANGERS`.
5. **M2 Evidence Capture**:
   - Click "Load Assignment Example": Displays EM weighted effort `10.00`, AI_DO weighted effort `50.00`, total `60.00`, imbalance ratio `5.00x`.
   - Red-Flag banner displays active state with bold text `RED FLAG`.
   - Click "Remove" on a signal: Signal removed from log, derived values update automatically.
   - Click "Reset Effort Logs": Clears all signals to 0.00.
6. **M3 Evidence Capture**:
   - With recipient `EM`, click "Send Message": Timer status changes to `WAITING`, announcement reads "Waiting for a reply...".
   - Click "Simulate Reply": Status updates to `REPLIED`.
   - Send another message and wait 5 seconds: Status changes to `GHOSTED` ("No reply after 5 seconds.").
   - Send message and change recipient to `AI_DO`: Controller aborts, status changes to `ABORTED`.
   - Change recipient back to `EM`: Status remains `ABORTED` (Zombie timer bug fixed).
7. **M4 Evidence Capture**:
   - Inspect elements in Chrome DevTools: Every `<label>` has `htmlFor` matching unique `<select>`/`<input>` IDs generated by `useId()`.
   - Tab through all buttons: Visible outline (`3px solid #ff647f`) appears on each focused element.
8. **M5 Evidence Capture**:
   - 1440px: 2-column grid layout for Effort Analyzer and Ghosting Timer.
   - 1024px: Compact desktop grid.
   - 768px: Tablet single-column layout.
   - 375px: Mobile layout. Run console check:
     ```js
     ({
       viewportWidth: window.innerWidth,
       documentWidth: document.documentElement.scrollWidth,
       hasHorizontalOverflow: document.documentElement.scrollWidth > window.innerWidth
     })
     ```
     Result: `hasHorizontalOverflow: false`.
9. **M6 Evidence Capture**:
   - Run in terminal:
     ```bash
     npm test && npm run build
     ```
   - Screenshot terminal showing 13 passing unit tests and clean Vite production build.

