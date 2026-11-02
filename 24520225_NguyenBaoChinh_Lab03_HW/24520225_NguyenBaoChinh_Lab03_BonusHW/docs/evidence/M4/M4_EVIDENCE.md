# M4 Accessibility Evidence & Verification Log

**Milestone**: M4 — Red-Flag Alert and Accessibility Engineering  
**Project**: `24520225_NguyenBaoChinh_Lab03_BonusHW`  
**Date**: November 2, 2026  
**Auditor**: Nguyen Bao Chinh (24520225)

---

## Verification Matrix

| ID | Requirement | Evidence file | Verification method | Result |
| :--- | :--- | :--- | :--- | :--- |
| **M4-01** | Stable & unique IDs via React `useId()` | `docs/evidence/M4/M4-01-UseId.png` | Code audit & grep inspection of `useId()` in `EffortAnalyzer.tsx` (`actorId`, `stepsId`, `multiplierId`) and `GhostingTimer.tsx` (`recipientId`). | **VERIFIED (Code)**<br>*Browser screenshot pending manual capture* |
| **M4-02** | Explicit label-to-control association | `docs/evidence/M4/M4-02-LabelAssociation.png` | Audited `<label htmlFor={id}>` matches `<select id={id}>` and `<input id={id}>` in all forms. | **VERIFIED (Code)**<br>*Browser screenshot pending manual capture* |
| **M4-03** | Accessible Red-Flag Alert (`role="status"`, `aria-live="polite"`) | `docs/evidence/M4/M4-03-RedFlagAlert.png` | Inspected `<output role="status" aria-live="polite" aria-atomic="true">` inside `.red-flag` section in `EffortAnalyzer.tsx`. Text includes explicit `RED FLAG` / `BALANCED STATUS` indicators. | **VERIFIED (Code)**<br>*Browser screenshot pending manual capture* |
| **M4-04** | Live Status Announcements for FSM Phase & Timer | `docs/evidence/M4/M4-04-StatusOutput.png` | Verified polite status output in `SituationShipAnalyzer.tsx` (L80-82) and `GhostingTimer.tsx` (L134-138). | **VERIFIED (Code)**<br>*Browser screenshot pending manual capture* |
| **M4-05** | High-contrast visible focus rings | `docs/evidence/M4/M4-05-KeyboardFocus.png` | Added global `:focus-visible { outline: 3px solid #ff647f; outline-offset: 3px; }` in `src/App.css`. | **VERIFIED (Code)**<br>*Browser screenshot pending manual capture* |
| **M4-06** | Keyboard navigation & semantic elements | `docs/evidence/M4/M4-06-KeyboardInteraction.png` | Audited absence of non-semantic clickable divs/spans (`grep -R -nE "<div[^>]*onClick\|<span[^>]*onClick"` returned 0). Verified button `type="button"`, `type="submit"`, and `aria-pressed`. | **VERIFIED (Code)**<br>*Browser screenshot pending manual capture* |
| **M4-07** | Reduced motion support (`prefers-reduced-motion`) | `docs/evidence/M4/M4-07-ReducedMotion.png` | Verified `@media (prefers-reduced-motion: reduce)` block in `src/App.css` suppressing animations and setting instantaneous transitions. | **VERIFIED (Code)**<br>*Browser screenshot pending manual capture* |
| **M4-08** | Responsive layout at 375px mobile viewport | `docs/evidence/M4/M4-08-Responsive375px.png` | Verified fluid grid layouts, max-width constraints, single-column fallback on `< 600px` without horizontal scrolling. | **VERIFIED (Code)**<br>*Browser screenshot pending manual capture* |
| **M4-09** | TypeScript & Vite Production Build Verification | `docs/evidence/M4/M4-09-TypeScriptBuild.png` | Executed `npx tsc --noEmit` and `npm run build` with zero errors (dist bundle created in 718ms). | **VERIFIED (CLI)**<br>*Terminal capture pending* |
| **M4-10** | Lighthouse Accessibility Audit Score | `docs/evidence/M4/M4-10-LighthouseAccessibility.png` | Chrome DevTools Lighthouse / axe DevTools accessibility panel audit. | **PENDING**<br>*Requires active browser runtime audit* |

---

## Instructions for Capturing Browser Screenshots

To populate the screenshots in `docs/evidence/M4/`:
1. Start the Vite development server:
   ```bash
   npm run dev
   ```
2. Open Chrome at `http://localhost:5173/`.
3. **M4-01-UseId.png & M4-02-LabelAssociation.png**: Inspect the form in Chrome DevTools Elements panel. Highlight the `<label>` and corresponding `<select>`/`<input>` showing the generated IDs (e.g. `:r0:`, `:r1:`).
4. **M4-03-RedFlagAlert.png**: Click "Load Assignment Example" (EM: 100x0.1, AI_DO: 1x50). Capture the red-flag banner with `<output role="status" aria-live="polite">` displaying the active Red Flag alert.
5. **M4-04-StatusOutput.png**: Click a phase transition button or "Send Message". Capture the live output element updating dynamically.
6. **M4-05-KeyboardFocus.png & M4-06-KeyboardInteraction.png**: Tab through the interface using the keyboard. Capture the prominent outline ring on focused buttons and inputs.
7. **M4-07-ReducedMotion.png**: In Chrome DevTools, open the Rendering tab, emulate `prefers-reduced-motion: reduce`, and capture the applied styles.
8. **M4-08-Responsive375px.png**: In Chrome DevTools Device Mode, set the viewport to iPhone SE (375px $\times$ 667px). Capture the full page showing zero horizontal overflow.
9. **M4-09-TypeScriptBuild.png**: Screenshot of terminal running `npx tsc --noEmit && npm run build` exiting code 0.
10. **M4-10-LighthouseAccessibility.png**: Run Lighthouse Accessibility audit in Chrome DevTools and screenshot the resulting score report.
