# AI Failure Audit — Exercise 1.1: Performance & Resiliency Architectural Upgrades

## 1. Project Context

This audit evaluates **Exercise 1.1 (`24520225_NguyenBaoChinh_Lab04_Exercise1.1`)**, the first stage of the Lab 04 React coursework progression:
- **Exercise 1.1 (Current Scope)**: Implements component-level code splitting via `React.lazy()` and resilient asynchronous rendering via `<Suspense>` with a WAI-ARIA accessible `Skeleton` loading fallback.
- **Downstream Inheritance**: The `PersonDetail` and `Skeleton` components built in Exercise 1.1 are inherited directly by **Exercise 1.2** (which mounts them on the dynamic React Router v7 `/people/:id` route) and **Exercise 1.3** (which preserves the `/people/:id` lazy route alongside the `/validation` anti-pattern dashboard).

Companion Exercise 1.1 Documents:
- [`PROJECT_STRUCTURE.md`](file:///Users/chinh/UIT%20lecture/WebApplicationDevelopment/Lab/Lab04/Exercise/24520225_NguyenBaoChinh_Lab04_Exercise1.1/PROJECT_STRUCTURE.md)
- [`TASK_DECOMPOSITION.md`](file:///Users/chinh/UIT%20lecture/WebApplicationDevelopment/Lab/Lab04/Exercise/24520225_NguyenBaoChinh_Lab04_Exercise1.1/TASK_DECOMPOSITION.md)
- [`project-rules.md`](file:///Users/chinh/UIT%20lecture/WebApplicationDevelopment/Lab/Lab04/Exercise/24520225_NguyenBaoChinh_Lab04_Exercise1.1/project-rules.md)

---

## 2. Exercise 1.1 Specific Requirements

1. **Dynamic Component Code Splitting (`React.lazy`)**:
   - Load `PersonDetail` asynchronously using `React.lazy(() => import(...))` rather than a static top-level ES import.
   - Ensure the production bundler (Vite / Rollup) emits a separate JavaScript chunk for `PersonDetail`.
2. **Resilient `<Suspense>` Fallback Boundary**:
   - Wrap `<PersonDetail />` in `<Suspense fallback={<Skeleton aria-busy="true" aria-live="polite" />}>`.
3. **Accessible WAI-ARIA `Skeleton` Component**:
   - Render a semantic `<section className="skeleton-card">` containing `aria-busy="true"`, `aria-live="polite"`, and `aria-label="Loading person details"`.
   - Animate skeleton placeholders with a CSS `.shimmer` gradient animation and match `.person-detail` card dimensions (`min-height: 320px`) to prevent layout shift.
4. **Responsive Card Layout**:
   - Adapt `.person-detail` and `.skeleton-card` from horizontal flex (`align-items: flex-start; gap: 24px`) on desktop to vertical column stacking (`flex-direction: column; padding: 20px`) at `@media (max-width: 600px)`.

---

## 3. Expected vs. Actual Implementation

| Architectural Dimension | Expected Specification | Actual Implementation in `24520225_NguyenBaoChinh_Lab04_Exercise1.1` | Audit Verdict |
| :--- | :--- | :--- | :---: |
| **Lazy Loading** | `const PersonDetail = React.lazy(() => import('./PersonDetail'))` | `src/App.tsx` (lines 7–10) uses `React.lazy(async () => { await new Promise((resolve) => setTimeout(resolve, 10000)); return import('./PersonDetail.jsx'); })` for DevTools inspection; `src/PersonDetail.tsx` (lines 6–8) provides immediate `React.lazy(() => import('./PersonDetail.jsx'))`. | **MATCHES** |
| **Suspense Boundary** | `<Suspense fallback={<Skeleton aria-busy="true" aria-live="polite" />}>` | `src/App.tsx` (lines 27–36) and `src/PersonDetail.tsx` (lines 13–22) wrap `<PersonDetail />` in `<Suspense>` with explicit `aria-busy="true"` and `aria-live="polite"`. | **MATCHES** |
| **WAI-ARIA Attributes** | `aria-busy`, `aria-live`, `aria-label` on `Skeleton` root element | `src/Skeleton.tsx` (lines 13–18) applies `aria-busy={ariaBusy}`, `aria-live={ariaLive}`, and `aria-label="Loading person details"` to `<section className="skeleton-card">`. | **MATCHES** |
| **Dimensional Parity & CLS Prevention** | `Skeleton` and `PersonDetail` share matching card geometry | Both `src/Skeleton.css` (lines 1–15) and `src/PersonDetail.css` (lines 1–15) specify `width: 100%; min-height: 320px; padding: 32px; border-radius: 16px; gap: 24px;`. | **MATCHES** |

---

## 4. AI-Generated Mistakes, Incorrect Assumptions & Architectural Problems

### 4.1. Incorrect Assumptions Avoided
- **No Premature Router or Search Box Invention**: A common AI mistake is to prematurely add React Router or search/filter inputs into Exercise 1.1. Inspection of `package.json` and `src/` confirms Exercise 1.1 contains only `react` and `react-dom` (`^19.3.1`), keeping routing strictly in Exercise 1.2.

### 4.2. Architectural Problems & AI Failure Modes Audited

| ID | Failure | Root Cause | Impact | Detection | Prevention |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **EX1.1-AF01** | **Mixed `.tsx` / `.jsx` Dynamic Import Type Error** | `src/App.tsx` and `src/PersonDetail.tsx` dynamically import `./PersonDetail.jsx`. Without `"allowJs": true` in `tsconfig.app.json`, TypeScript (`tsc -b`) rejects `.jsx` imports. | `npm run build` fails during the `tsc -b` type-checking phase. | Detected by running `npm run build` (`tsc -b && vite build`). | Enable `"allowJs": true` in `tsconfig.app.json` (`commit 1266443`) and run `npm run build` before every commit. |
| **EX1.1-AF02** | **Hardcoded Artificial Delay Left Undocumented** | `src/App.tsx` includes a `10000ms` `setTimeout` inside `React.lazy` to give developers time to inspect the `<Skeleton />` in Chrome DevTools Accessibility Tree, which can look like a hung load if undocumented. | Automated tests or users waiting <10 seconds see only the Skeleton fallback unless aware of the 10-second inspection window. | Detected by inspecting `src/App.tsx` lines 6–10 (`// Dynamic import via React.lazy (temporary 10s delay so you can test in Console)`). | Document the 10s inspection delay clearly and remove the artificial timer when migrating `PersonDetail` into Exercise 1.2's multi-route layout. |
| **EX1.1-AF03** | **Missing WAI-ARIA Live Region on Loading Skeletons** | Naive AI skeleton implementations render plain `<div class="skeleton">` blocks with no `aria-busy` or `aria-live` attributes. | Screen readers fail to announce that person details are currently loading. | Detected via DOM attribute inspection and Chrome DevTools Accessibility panel. | Enforce `SkeletonProps` contract requiring `aria-busy="true"`, `aria-live="polite"`, and `aria-label="Loading person details"`. |
| **EX1.1-AF04** | **Cumulative Layout Shift (CLS) on Suspense Resolution** | If the fallback skeleton has a smaller height or different padding than `PersonDetail`, the footer jumps downward when the lazy chunk resolves. | Poor Core Web Vitals (CLS) and jarring visual jump on module load. | Detected by comparing computed box heights of `.skeleton-card` and `.person-detail`. | Enforce identical outer container rules (`min-height: 320px; padding: 32px; border-radius: 16px`) across `Skeleton.css` and `PersonDetail.css`. |

---

## 5. Verification Matrix (Exercise 1.1)

Every verification check below was executed in `24520225_NguyenBaoChinh_Lab04_Exercise1.1`:

| Requirement | Verification Method | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :---: |
| **ESLint Static Analysis** | `npm run lint` (`eslint .`) | `0 errors, 0 warnings` | Exited with code `0` (`0 errors, 0 warnings`) | **PASS** |
| **TypeScript & Vite Production Build** | `npm run build` (`tsc -b && vite build`) | Separate lazy chunk emitted for `PersonDetail` | Emitted `dist/assets/PersonDetail-C4fd9K2h.js` (`0.94 kB`) and `dist/assets/PersonDetail-BJlwYmW4.css` (`1.10 kB`) separate from `index-*.js` | **PASS** |
| **WAI-ARIA Skeleton Attributes** | Inspect `src/Skeleton.tsx` & rendered DOM | `<section class="skeleton-card" aria-busy="true" aria-live="polite" aria-label="Loading person details">` | Verified exact attributes on `<section className="skeleton-card">` | **PASS** |
| **Shimmer Keyframe Animation** | Inspect `src/Skeleton.css` | `@keyframes shimmer` with `1.5s infinite linear` gradient transition | Verified `.shimmer` and `@keyframes shimmer` in `src/Skeleton.css` lines 73–91 | **PASS** |
| **Responsive Mobile Breakpoint (`<= 600px`)** | Inspect `src/App.css`, `src/PersonDetail.css`, `src/Skeleton.css` | `.person-detail` and `.skeleton-card` switch to `flex-direction: column; padding: 20px;` at `max-width: 600px` | Verified `@media (max-width: 600px)` rules in all three stylesheets | **PASS** |

---

## 6. Lessons Learned (Exercise 1.1)

1. **`React.lazy()` Requires Default Exports and Bundler Chunk Verification**: Always verify code splitting by inspecting `vite build` output in `dist/assets/` to confirm that the dynamically imported module was actually split into a separate chunk.
2. **Loading States Are an Accessibility Contract**: Visual shimmer animations alone are invisible to assistive technologies; pairing `<Suspense>` fallbacks with `aria-busy="true"`, `aria-live="polite"`, and descriptive `aria-label` attributes ensures inclusive UX.
3. **Dimensional Parity Prevents Layout Shift**: Designing `<Skeleton />` with the exact outer dimensions (`min-height: 320px`, `80px` avatar, 4 field rows) of the target component eliminates layout jump when the lazy chunk resolves.
