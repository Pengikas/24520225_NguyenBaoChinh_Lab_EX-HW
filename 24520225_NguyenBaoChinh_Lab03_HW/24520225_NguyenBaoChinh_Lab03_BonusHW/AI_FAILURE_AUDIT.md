# AI Failure Audit & Architectural Override Log

**Course**: Web Application Development  
**Student Name**: Nguyen Bao Chinh  
**Student ID**: 24520225  
**Project**: `24520225_NguyenBaoChinh_Lab03_BonusHW`  
**Theme**: V-Pop Applied Creative Exercise – *Hẹn Hò Nhưng Không Yêu* (Finite State Machine & Asymmetric Effort Engine)

---

## 1. Executive Summary

This document audits regressions, edge cases, AI-generated code errors, and accessibility defects identified throughout development, alongside manual human overrides and verified architectural remedies.

---

## 2. Milestone 4 – Accessibility Engineering & Red-Flag Audit

### A. Initial Accessibility Deficiencies Identified
1. **Unused `useId` and Hardcoded Form IDs**:
   - In `GhostingTimer.tsx`, `useId` was imported from React but never instantiated. The component hardcoded `id="ghosting-recipient"` on the `<select>` element. In a multi-instance or server-rendered context, hardcoded IDs risk collisions and break accessibility label association.
2. **Missing Live Region on Primary FSM Phase Output**:
   - In `SituationShipAnalyzer.tsx`, the current relationship phase was rendered using a plain `<output className="phase-value">{phase}</output>` lacking `role="status"` and `aria-live="polite"`. Assistive technology users were not notified when the relationship state transitioned between `FRIENDS`, `DATING_NO_LOVE`, `OFFICIAL_LOVE`, and `GHOSTED_EXIT`.
3. **Double Return Bug in Parent Container**:
   - In `SituationShipAnalyzer.tsx`, an accidental duplicate `return` statement was introduced during previous milestone merging. The first return statement mounted only an empty header, `<EffortAnalyzer />`, and `<GhostingTimer />`, causing the entire M1 FSM control panel to be unreachable dead code.
4. **Missing Global Focus Ring & Reduced Motion Preferences**:
   - While certain button classes had local focus styles, no global `:focus-visible` rule was defined, creating inconsistency across custom and native elements. Furthermore, `@media (prefers-reduced-motion: reduce)` was completely absent from stylesheet definitions.

### B. Architectural Overrides & Fixes Applied
1. **Deterministic `useId()` Binding**:
   - In `EffortAnalyzer.tsx`, instantiated `actorId`, `stepsId`, and `multiplierId` via React `useId()`, strictly binding `<label htmlFor={id}>` to `<select id={id}>` and `<input id={id}>`.
   - In `GhostingTimer.tsx`, instantiated `recipientId = useId()` and bound it directly to the message recipient label and select.
2. **Accessible Live Regions with `role="status"` and `aria-live="polite"`**:
   - In `SituationShipAnalyzer.tsx`, augmented the phase output with `role="status"`, `aria-live="polite"`, and `aria-atomic="true"`:
     ```tsx
     <output
         className="phase-value"
         role="status"
         aria-live="polite"
         aria-atomic="true"
     >
         {phase}
     </output>
     ```
   - In `EffortAnalyzer.tsx`, verified that the Red-Flag condition is rendered within an accessible container:
     ```tsx
     <output role="status" aria-live="polite" aria-atomic="true">
         {summary.redFlagMessage}
     </output>
     ```
   - Maintained semantic headings (`<h3>` with explicit text `RED FLAG` vs `BALANCED STATUS`), ensuring that color is never the sole indicator of danger.
3. **Single Source of Truth Restored in `SituationShipAnalyzer.tsx`**:
   - Eliminated the double-return defect. Unified the M1 hero, M1 state machine controls, M2 effort analyzer, and M3 ghosting timer into a single semantic `<main className="analyzer">` layout.
4. **Universal Focus Visibility & Reduced Motion CSS**:
   - Added in `src/App.css`:
     ```css
     :focus-visible {
       outline: 3px solid #ff647f;
       outline-offset: 3px;
     }

     @media (prefers-reduced-motion: reduce) {
       *,
       *::before,
       *::after {
         scroll-behavior: auto !important;
         animation-duration: 0.01ms !important;
         animation-iteration-count: 1 !important;
         transition-duration: 0.01ms !important;
       }
     }
     ```

### C. Automated Verifications & Regression Audits
1. **Interactive Element Semantics**:
   - Verified that no clickable non-semantic elements exist:
     ```bash
     grep -R -nE "<div[^>]*onClick|<span[^>]*onClick" src
     ```
     Result: 0 occurrences. All interactive elements use native `<button type="button">`, `<button type="submit">`, or `<select>`.
2. **Static Type Safety & Production Build**:
   - `npx tsc --noEmit` exited 0 with zero type diagnostics.
   - `npm run build` executed successfully (`tsc -b && vite build`) in 718ms.

### D. Remaining Limitations & Manual Audit Needs
- Screen reader verbal announcements (VoiceOver / NVDA) require real-time physical verification in the browser to confirm that announcement verbosity does not flood the user when rapid effort updates occur.
- Lighthouse Accessibility audit requires running Chrome DevTools on a running dev server instance to certify a 100% WCAG score.

---

## 3. Milestone 5 – Responsive Relationship Analyzer UI Audit

### A. Initial UI & Responsive Problems Found
1. **Vertical Monolithic Stacking on Desktop Viewports**:
   - Prior to M5, `.state-panel`, `.effort-panel`, and `.ghosting-panel` were stacked in a single vertical column regardless of screen width. On a 1440px desktop display, this left excessive negative margins and stretched form inputs unnecessarily wide.
2. **Missing Phase Progression Pipeline**:
   - The 4 relationship states were only displayed as transition buttons. The UI lacked an intuitive visual indicator showing the directed sequence (`FRIENDS` $\rightarrow$ `DATING_NO_LOVE` $\rightarrow$ `OFFICIAL_LOVE` $\rightarrow$ `GHOSTED_EXIT`) and the user's current position within that lifecycle.
3. **Absence of Standard Breakpoints (1024px, 768px, 375px)**:
   - Only a rudimentary `@media (max-width: 600px)` existed in `App.css`. Explicit adaptations for 1024px tablet landscape, 768px tablet portrait, and compact mobile 375px (e.g., iPhone SE) were missing.
4. **Duplicate CSS Rules**:
   - A redundant block of `:focus-visible` and `@media (prefers-reduced-motion: reduce)` was duplicated at the end of `src/App.css`.

### B. Architectural Overrides & Responsive Fixes Applied
1. **Desktop Multi-Column Grid (`.analyzer-grid`)**:
   - Encapsulated `<EffortAnalyzer />` and `<GhostingTimer />` within an auto-fitting CSS grid container (`grid-template-columns: repeat(auto-fit, minmax(480px, 1fr))`). On 1440px+ displays, these panels align side-by-side with 28px gutters, creating a cohesive dashboard.
2. **Relationship Phase Progression Pipeline (`.phase-pipeline`)**:
   - Implemented a semantic status region showcasing steps 1 through 4. Active phase receives a prominent `.current` highlight and `ACTIVE` pill badge; valid transitions receive `.available` borders; locked states are muted.
3. **Multi-tier Responsive Media Queries**:
   - `@media (max-width: 1024px)`: Collapses the multi-column grid to 1fr, pipeline to 2 columns.
   - `@media (max-width: 768px)`: Switches effort cards to single-column, scales padding to 22px.
   - `@media (max-width: 600px)`: Transitions buttons to full width, stacks form controls.
   - `@media (max-width: 375px)`: Reduces container padding to 10px, scales typography cleanly (`clamp(22px, ...)`), stacks log items vertically, ensuring `document.documentElement.scrollWidth <= window.innerWidth` (no horizontal overflow).
4. **Centralized CSS Variables**:
   - Established design tokens in `:root` (`--color-bg-primary`, `--color-accent`, etc.) to unify colors, border radii, and hover states across all components.
5. **Zero M4 Accessibility Regressions**:
   - Retained all `useId()`, `<output role="status" aria-live="polite">`, `:focus-visible`, and `prefers-reduced-motion` declarations.

### C. Automated Verifications & Production Build
- `npx tsc --noEmit`: Exited 0 with zero diagnostics.
- `npm run build`: Bundled cleanly in 265ms (`dist/index.html` 0.48 kB, `dist/assets/index-*.js` 229 kB).
- Media query inspection verified all target breakpoints (`1024px`, `768px`, `600px`, `375px`).
- No non-semantic click handlers detected.

### D. Remaining Manual Audit Items
- Capturing high-resolution browser screenshots at 1440px, 1024px, 768px, and 375px viewports to populate `docs/evidence/M5/`.
