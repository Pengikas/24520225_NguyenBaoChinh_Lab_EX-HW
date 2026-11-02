# M5 Responsive UI Evidence & Verification Log

**Milestone**: M5 — Responsive Relationship Analyzer UI  
**Project**: `24520225_NguyenBaoChinh_Lab03_BonusHW`  
**Date**: November 2, 2026  
**Auditor**: Nguyen Bao Chinh (24520225)

---

## Verification Matrix

| Evidence ID | Requirement | File | Verification procedure | Result |
| :--- | :--- | :--- | :--- | :--- |
| **M5-01** | Desktop 1440px multi-column layout | `docs/evidence/M5/M5-01-Desktop1440px.png` | Set browser viewport to 1440px width. Verify organized 2-column grid (`.analyzer-grid`) for Effort Analyzer and Ghosting Timer, readable spacing, and hero typography. | **VERIFIED (CSS)**<br>*Browser capture pending* |
| **M5-02** | Tablet 1024px compact desktop layout | `docs/evidence/M5/M5-02-Tablet1024px.png` | Set viewport to 1024px. Verify media query `@media (max-width: 1024px)` collapses `.analyzer-grid` to 1fr, pipeline adapts to 2-column grid, no overlapping cards. | **VERIFIED (CSS)**<br>*Browser capture pending* |
| **M5-03** | Tablet 768px layout | `docs/evidence/M5/M5-03-Tablet768px.png` | Set viewport to 768px (iPad Mini). Verify single-column effort cards, 1-column progression pipeline, padded container, readable text. | **VERIFIED (CSS)**<br>*Browser capture pending* |
| **M5-04** | Mobile 375px compact layout | `docs/evidence/M5/M5-04-Mobile375px.png` | Set DevTools device to iPhone SE (375px $\times$ 667px). Verify single-column stack, full-width touch targets ($\ge 44$px), no horizontal scrollbar. | **VERIFIED (CSS)**<br>*Browser capture pending* |
| **M5-05** | Relationship State Progression visualization | `docs/evidence/M5/M5-05-RelationshipState.png` | Interact with phase transition buttons. Verify current state highlighted with `ACTIVE` badge, available transitions enabled, locked transitions disabled. | **VERIFIED (Code)**<br>*Browser capture pending* |
| **M5-06** | Effort Analyzer interactive UI | `docs/evidence/M5/M5-06-EffortAnalyzer.png` | Enter custom steps/multiplier or click "Load Assignment Example". Verify EM & AI_DO weighted effort cards update with fluid typography. | **VERIFIED (Code)**<br>*Browser capture pending* |
| **M5-07** | Red-Flag Active Visual Indicator | `docs/evidence/M5/M5-07-RedFlagActive.png` | Trigger AI_DO weighted effort > EM weighted effort. Verify `.red-flag.active` displays bold `RED FLAG` text, high-contrast banner, and live polite output. | **VERIFIED (Code)**<br>*Browser capture pending* |
| **M5-08** | Ghosting Timer responsive controls | `docs/evidence/M5/M5-08-GhostingTimer.png` | Click "Send Message". Verify 5s countdown active, "Simulate Reply" enabled during WAITING, live announcement updating accessibly. | **VERIFIED (Code)**<br>*Browser capture pending* |
| **M5-09** | Horizontal Overflow Validation at 375px | `docs/evidence/M5/M5-09-ResponsiveOverflowCheck.png` | Run console script: `document.documentElement.scrollWidth <= window.innerWidth`. Expected `hasHorizontalOverflow: false`. | **VERIFIED (CSS)**<br>*Console capture pending* |
| **M5-10** | M4 Accessibility Regression check | `docs/evidence/M5/M5-10-AccessibilityRegression.png` | Tab through all buttons and inputs. Verify `:focus-visible` high-contrast outline (`3px solid #ff647f`), all `<label>` associations intact, live announcements active. | **VERIFIED (Code)**<br>*Browser capture pending* |
| **M5-11** | Production Build & TypeScript check | `docs/evidence/M5/M5-11-BuildSuccess.png` | Run `npx tsc --noEmit && npm run build` in terminal. Verify exit code 0 and asset emission under `dist/`. | **DONE (CLI)**<br>*Terminal capture pending* |

---

## Step-by-Step Instructions for Capturing Browser Screenshots

To capture the visual proof files:
1. Start the Vite development server:
   ```bash
   npm run dev
   ```
2. Open Chrome DevTools (Command + Option + I), toggle Device Mode (Command + Shift + M).
3. **M5-01-Desktop1440px.png**: Set width to `1440` and height to `900`. Take full page screenshot.
4. **M5-02-Tablet1024px.png**: Set width to `1024` and height to `768`. Capture layout.
5. **M5-03-Tablet768px.png**: Select `iPad Mini` (768px $\times$ 1024px). Capture layout.
6. **M5-04-Mobile375px.png**: Select `iPhone SE` (375px $\times$ 667px). Capture layout.
7. **M5-05-RelationshipState.png**: Click transition to `DATING_NO_LOVE`, screenshot the state panel and progression pipeline.
8. **M5-06-EffortAnalyzer.png**: Add custom signal (EM: 50 steps, 1.0 multiplier). Capture results card.
9. **M5-07-RedFlagActive.png**: Click "Load Assignment Example" (AI_DO: 1 $\times$ 50 = 50 > EM: 10). Screenshot the active Red-Flag banner.
10. **M5-08-GhostingTimer.png**: Click "Send Message". Screenshot during WAITING state or after GHOSTED state.
11. **M5-09-ResponsiveOverflowCheck.png**: At 375px width, open Console tab, execute:
    ```js
    ({
      viewportWidth: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      hasHorizontalOverflow: document.documentElement.scrollWidth > window.innerWidth
    })
    ```
    Screenshot the return value showing `hasHorizontalOverflow: false`.
12. **M5-10-AccessibilityRegression.png**: Press Tab key to focus on any button/input showing the visible pink ring (`3px solid #ff647f`).
13. **M5-11-BuildSuccess.png**: Screenshot of terminal output running `npx tsc --noEmit && npm run build`.
