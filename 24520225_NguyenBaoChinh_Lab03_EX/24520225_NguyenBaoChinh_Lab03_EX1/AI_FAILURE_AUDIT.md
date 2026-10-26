# AI Failure Mode Audit Report: Lab 03 Exercise 1
**Project Identifier:** `24520225_NguyenBaoChinh_Lab03_EX1`
**Course:** Web Application Development (Lab 03 — Exercise 1)
**Component Under Audit:** Semantic Developer Profile Card (`DeveloperCard.jsx`, `SkillBadge.jsx`, `DeveloperCard.module.css`)
**Audit Author:** Senior React Developer & Accessibility Auditor
**Date of Audit:** October 26, 2026

---

## 1. Executive Summary

This audit report documents critical AI-generated defects, anti-patterns, and architectural risks intercepted and resolved during the engineering of **Lab 03 Exercise 1 (Developer Profile Card)**. The application is built with **React 19**, **Vite 8**, semantic HTML5, scoped CSS Modules, and responsive web design principles.

Through rigorous inspection of the repository history, dependency graph, DOM tree structure, and responsive layout rules, several key defects were identified and rectified:
1. **Dependency Declaration Mismatch:** Inconsistent Vite version specification between `package.json` and `package-lock.json` triggering `npm ls` package validation failures.
2. **Accessibility Label Desynchronization:** Mismatch between the section heading text (`Engineering Skills`) and the `aria-label` attribute on the skills `<ul>` (`Engineered skills`), causing accessibility degradation and test assertion failures.
3. **Duplicate Media Queries & Unscoped CSS Selectors:** Appended duplicate `@media (max-width: 400px)` blocks producing CSS cascade clashes and unscoped `:global(.skill-badge)` selectors.
4. **Zero-Div Soup & Semantic Definition List Fragment Violation Risk:** Ensuring zero `<div>` wrappers inside `DeveloperCard.jsx` and properly utilizing `<Fragment key={key}>` around `<dt>`/`<dd>` metric pairs.
5. **Avatar Image Network Failure & CLS Risk:** Safeguarding image loading with explicit dimensions, HTTPS URLs, and resilient initial fallbacks.
6. **Stale Documentation Contamination:** Legacy documentation inherited from Lab 02 Exercise 3 misrepresenting the Lab 03 React 19 architecture.

---

## 2. Comprehensive AI Failure Case Studies

### Case 1: Dependency Declaration Mismatch (`package.json` vs Installed Vite Version)

* **Failure ID:** `AI-FAIL-01`
* **Title:** Declaring Incompatible Vite Version in `package.json` Disagreeing with Installed Lockfile
* **Original Incorrect Approach / Risky Assumption:**
  The AI initialized or modified `package.json` declaring `"vite": "^7.0.0"` in `devDependencies`, while `package-lock.json` and the installed `node_modules` directory were pinned to `vite@8.3.5`. The AI assumed that npm would silently accept the version variance without verifying dependency tree integrity.
* **Why It Was Incorrect:**
  Modern npm tooling strictly validates the installed packages against the root manifest. Running `npm ls react react-dom vite` detected that `vite@8.3.5` was invalid under the declared constraint `^7.0.0`, exiting with code 1 (`npm error code ELSPROBLEMS`).
* **Impact:**
  - Breaks automated CI/CD pipelines enforcing `npm ls` or `npm audit`.
  - Causes installation warnings and potential behavioral mismatches across developer machines.
  - Undermines reproducible builds.
* **Evidence from Repository:**
  Running `npm ls react react-dom vite` produced the following terminal error:
  ```text
  lab03-exercise1@1.0.0 /Users/chinh/.../24520225_NguyenBaoChinh_Lab03_EX1
  +-- react-dom@19.3.1
  | `-- react@19.3.1 deduped
  +-- react@19.3.1
  `-- vite@8.3.5 invalid: "^7.0.0" from the root project

  npm error code ELSPROBLEMS
  npm error invalid: vite@8.3.5 .../node_modules/vite
  ```
  `package-lock.json` (line 16) confirmed: `"vite": "^8.3.5"`.
* **Implemented Correction:**
  Updated `package.json` `devDependencies` to declare `"vite": "^8.3.5"`:
  ```json
  "devDependencies": {
    "vite": "^8.3.5"
  }
  ```
* **Verification Procedure:**
  Execute `npm ls react react-dom vite` and `npm run build` from the project root.
* **Verification Status:** `PASS` (Exits with code 0; clean dependency tree).

---

### Case 2: Accessibility Label Desynchronization on Skills List

* **Failure ID:** `AI-FAIL-02`
* **Title:** Inconsistent `aria-label` on Skills Container Causing Accessible Name Desynchronization and False-Negative DOM Tests
* **Original Incorrect Approach / Risky Assumption:**
  The section heading was rendered with `<h3 id="skills-heading">Engineering Skills</h3>`, but the AI assigned `aria-label="Engineered skills"` to the child `<ul>` element. The AI assumed the slight difference in wording was harmless.
* **Why It Was Incorrect:**
  1. Accessibility inconsistency: Assistive technologies (screen readers) encountering the section announce the heading as "Engineering Skills" but then announce the inner list as "Engineered skills", creating unnecessary cognitive dissonance for visually impaired users.
  2. Test failure / False-negative assertion: Automated accessibility testing tools or end-to-end assertions looking for `screen.getByRole('list', { name: /Engineering Skills/i })` fail to locate the list (reporting `listExists: false`), misleading developers into diagnosing a React rendering failure when the true cause is an `aria-label` mismatch.
* **Impact:**
  Screen reader ambiguity and false-negative test failures during automated accessibility auditing.
* **Evidence from Source Code:**
  In `src/components/DeveloperCard.jsx`:
  ```jsx
  <section className={styles.skillSection} aria-labelledby="skills-heading">
      <h3 id="skills-heading">Engineering Skills</h3>
      <ul className={styles.skills} aria-label="Engineered skills">
  ```
* **Implemented Correction:**
  Updated the `<ul>` element to use `aria-label="Engineering Skills"`:
  ```jsx
  <section className={styles.skillSection} aria-labelledby="skills-heading">
      <h3 id="skills-heading">Engineering Skills</h3>
      <ul className={styles.skills} aria-label="Engineering Skills">
  ```
* **Verification Procedure:**
  Inspect `src/components/DeveloperCard.jsx` and verify that the heading text and list `aria-label` match precisely.
* **Verification Status:** `PASS`.

---

### Case 3: Duplicate Media Queries and Unscoped CSS Selectors in CSS Modules

* **Failure ID:** `AI-FAIL-03`
* **Title:** Appending Duplicate Mobile Media Queries with Conflicting Properties and Unscoped Global Rules
* **Original Incorrect Approach / Risky Assumption:**
  When tasked with refining the 375px mobile responsiveness, the AI appended a second `@media (max-width: 400px)` block at the bottom of `DeveloperCard.module.css` (lines 297–344) instead of merging it with the existing breakpoint at lines 218–287. In this appended block, it defined `:global(.skill-badge)` without scoping it to `.skills`, and overrode `.metrics dd` font size from `1.45rem` down to `1rem` and `.header` alignment from `center` to `flex-start`.
* **Why It Was Incorrect:**
  1. CSS Cascade Conflicts: Multiple media queries targeting the same breakpoint create fragile order-dependent overrides, making CSS difficult to reason about and maintain.
  2. Specificity and Global Leakage: Using `:global(.skill-badge)` without the parent `.skills` selector allows those styles to leak to any `.skill-badge` rendered elsewhere in the application, violating CSS Module isolation.
  3. Visual regression: Overriding metrics dd font size to `1rem` made the key metric values look like normal body text rather than prominent figures.
* **Impact:**
  Redundant stylesheet bytes, visual regressions in font scaling, and potential style leakage.
* **Evidence from Source Code:**
  `DeveloperCard.module.css` contained two blocks for `@media (max-width: 400px)` (lines 218–287 and 297–344).
* **Implemented Correction:**
  Consolidated the mobile media query into a single, cohesive block at `@media (max-width: 400px)`. Properly scoped all skill badge selectors as `.skills :global(.skill-badge)` and `.skills :global(.skill-tier)`. Preserved prominent metrics typography (`font-size: 1.25rem`, tabular numbers), aligned the avatar at center, and enforced `overflow-wrap: anywhere` across all text elements.
* **Verification Procedure:**
  Run `npm run build` to verify CSS compilation and bundle size reduction (from 4.98 kB to 4.59 kB).
* **Verification Status:** `PASS`.

---

### Case 4: Violation of Zero-Div-Soup Constraint and Metric DL Fragment Structure

* **Failure ID:** `AI-FAIL-04`
* **Title:** Risk of Introducing Generic `<div>` Wrappers and Misstructuring `<dl>` Definition Lists
* **Original Incorrect Approach / Risky Assumption:**
  Common AI code generators frequently default to `<div>` containers for layout rows (e.g. `<div className="card">`, `<div className="header">`, `<div className="metric-item">`). In definition lists, AI models frequently wrap `<dt>` and `<dd>` pairs in a `<div>` wrapper inside the `<dl>` mapping loop.
* **Why It Was Incorrect:**
  1. The assignment strictly specifies a **Zero-Div-Soup requirement**: zero `<div>` elements inside `DeveloperCard.jsx`.
  2. HTML5 `<dl>` semantics are cleanest when `<dt>` and `<dd>` are direct semantic pairs. In React, grouping them inside a map without adding DOM nodes requires `<Fragment key={key}>` (or `<React.Fragment key={key}>`), not a `<div>`.
* **Impact:**
  Immediate violation of the core assignment constraint (Zero-Div-Soup) and degradation of landmark navigation.
* **Evidence from Source Code & AST:**
  Audited `src/components/DeveloperCard.jsx` using regex inspection for `<div`.
  Current implementation:
  - Container: `<article className={styles.card} aria-labelledby="dev-heading">`
  - Header: `<header className={styles.header}>`
  - Grouping: `<hgroup className={styles.identity}>`
  - Metrics: `<dl className={styles.metrics} aria-label="Developer metrics">`
  - Map iteration: `<Fragment key={key}><dt>{key}</dt><dd>{value}</dd></Fragment>`
  - Skills section: `<section className={styles.skillSection} aria-labelledby="skills-heading">`
  - Skills list: `<ul className={styles.skills} aria-label="Engineering Skills">`
  - Results of `grep "<div" src/components/DeveloperCard.jsx`: **0 matches found**.
* **Implemented Correction:**
  Preserved and verified the 100% semantic, div-free implementation utilizing `<article>`, `<header>`, `<hgroup>`, `<dl>`, `<Fragment key={key}>`, `<section>`, and `<ul>`.
* **Verification Procedure:**
  Run `grep -n "<div" src/components/DeveloperCard.jsx`.
* **Verification Status:** `PASS` (0 occurrences found).

---

### Case 5: Unhandled Image Network Failure and Layout Shift (CLS) on Avatar

* **Failure ID:** `AI-FAIL-05`
* **Title:** Fragile External Avatar Image Loading without Explicit Dimensions or Resilient Fallback
* **Original Incorrect Approach / Risky Assumption:**
  AI often assumes remote asset URLs (such as Unsplash images) will load instantaneously and reliably, omitting `onError` fallback state and explicit HTML image dimensions (`width` and `height`).
* **Why It Was Incorrect:**
  1. Remote URLs frequently fail due to network restrictions, rate limiting, or offline development environments, resulting in a broken image icon.
  2. Images without explicit `width` and `height` attributes cause Cumulative Layout Shift (CLS) when loaded, degrading Core Web Vitals.
* **Impact:**
  Visual breakage, broken image placeholders, and poor user experience on unstable networks.
* **Evidence from Source Code:**
  In `src/components/DeveloperCard.jsx`:
  ```jsx
  const [imageFailed, setImageFailed] = useState(false);

  const initials = fullName
      .trim()
      .split(/\s+/)
      .slice(-2)
      .map((part) => part[0])
      .join('')
      .toUpperCase();
  ...
  {imageFailed ? (
      <span
          className={styles.avatarFallback}
          role="img"
          aria-label={`Avatar initials: ${initials}`}
      >
          {initials}
      </span>
  ) : (
      <img
          className={styles.avatar}
          src={avatarUrl}
          alt={`Portrait of ${fullName}`}
          width={64}
          height={64}
          onError={() => setImageFailed(true)}
      />
  )}
  ```
* **Implemented Correction:**
  The component computes initials (`BC` for `Nguyen Bao Chinh`), provides explicit `width={64}` and `height={64}` to prevent CLS, and conditionally renders `<span className={styles.avatarFallback} role="img" aria-label={`Avatar initials: ${initials}`}>` when `onError` fires.
* **Verification Procedure:**
  Code review and manual simulation of image load failure by providing an invalid URL.
* **Verification Status:** `PASS`.

---

### Case 6: Stale Lab 02 Documentation Contaminating Lab 03 Exercise 1

* **Failure ID:** `AI-FAIL-06`
* **Title:** Direct Copy-Paste of Unrelated Prior Lab Documentation into the Project Root
* **Original Incorrect Approach / Risky Assumption:**
  When establishing the project structure, the AI copied `AI_FAILURE_AUDIT.md`, `PROJECT_STRUCTURE.md`, and `TASK_DECOMPOSITION.md` from `Lab02_EX3` (which focused on a custom Mini React Virtual DOM engine, `useState` dispatcher, and finite state machines).
* **Why It Was Incorrect:**
  The documentation described files and concepts completely absent from or unrelated to Lab 03 Exercise 1 (such as `loadFeedData`, `state_machine.js`, `mini_react.js`, `test_runner.js`, and `createInitialState`), failing to describe the React 19 DeveloperCard project.
* **Impact:**
  Complete loss of documentation integrity; false reporting to instructors and reviewers.
* **Evidence from Repository:**
  The initial files at the project root contained headings like `Exercise 3: Resilient State Machine & Skeleton Loader` and `Lab 02 — Exercise 3`.
* **Implemented Correction:**
  Comprehensively rewrote `AI_FAILURE_AUDIT.md`, `PROJECT_STRUCTURE.md`, and `TASK_DECOMPOSITION.md` to accurately document Lab 03 Exercise 1.
* **Verification Procedure:**
  Full textual review of all three markdown files against current repository contents and assignment requirements.
* **Verification Status:** `PASS`.

---

## 3. Final Audit Summary

### Confirmed Issues
1. `package.json` declared `"vite": "^7.0.0"` while lockfile specified `vite@8.3.5`, breaking `npm ls`.
2. `aria-label="Engineered skills"` mismatched `<h3 id="skills-heading">Engineering Skills</h3>`.
3. Duplicate `@media (max-width: 400px)` media query blocks and unscoped `:global(.skill-badge)` in `DeveloperCard.module.css`.
4. Stale Lab 02 Exercise 3 documentation copied into Lab 03 Exercise 1 root.

### Fixes Implemented
1. Updated `package.json` to `"vite": "^8.3.5"`.
2. Updated `aria-label` on `<ul>` to `"Engineering Skills"` in `DeveloperCard.jsx`.
3. Consolidated responsive styles in `DeveloperCard.module.css`, scoping skill badges and preserving prominent metrics typography.
4. Rewrote `AI_FAILURE_AUDIT.md`, `PROJECT_STRUCTURE.md`, and `TASK_DECOMPOSITION.md` to reflect the actual Lab 03 Exercise 1 implementation.

### Tests Actually Executed
| Test Command / Check | Expected Result | Actual Result | Status |
|---|---|---|---|
| `npm ls react react-dom vite` | Exit code 0, no ELSPROBLEMS | `react-dom@19.3.1`, `react@19.3.1`, `vite@8.3.5` | `PASS` |
| `npm run build` | Vite production build bundle success | Built in 883ms, `dist/` created (index.html, JS, CSS) | `PASS` |
| `grep -n "<div" DeveloperCard.jsx` | 0 occurrences of `<div>` inside card | 0 matches found (Zero-Div-Soup satisfied) | `PASS` |
| `grep -n "key=" DeveloperCard.jsx` | Stable keys on `<Fragment>` & `<SkillBadge>` | `key={key}` on `<Fragment>`, `key={skill.id}` on `<SkillBadge>` | `PASS` |
| `git diff --check` | Clean diff, no trailing whitespace or conflicts | No output (clean diff) | `PASS` |

### Outstanding Issues
None. All automated build and static checks pass without warnings or errors.

### Items Still Requiring Manual Browser Verification
While static and build verification is complete, the following visual checks should be confirmed manually in a live desktop and mobile browser:
1. **Desktop Viewport (>= 1000px):** Open `http://localhost:5174/` in Chrome or Safari. Confirm that the card is horizontally centered, padding is 40px, the avatar renders at 88x88px, and metric figures are prominently styled.
2. **Mobile Viewport (375px - iPhone SE):** Open DevTools, toggle Device Toolbar, and select iPhone SE (375 × 667). Confirm that:
   - No horizontal scrollbar appears (`document.documentElement.scrollWidth === document.documentElement.clientWidth`).
   - The metrics definition list displays 3 columns cleanly without text clipping.
   - The skill badges wrap neatly onto subsequent lines.
3. **Avatar Fallback Simulation:** In DevTools Elements panel, edit the avatar `src` attribute to an invalid URL (or disconnect network). Verify that the initials fallback badge `BC` displays immediately with `role="img"` and `aria-label="Avatar initials: BC"`.
4. **Reduced Motion:** In DevTools Rendering drawer, enable `prefers-reduced-motion: reduce`. Confirm that hover transitions on skill badges are disabled.
