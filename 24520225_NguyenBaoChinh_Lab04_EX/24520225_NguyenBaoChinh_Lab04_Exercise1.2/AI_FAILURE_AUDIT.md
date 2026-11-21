# AI Failure Audit — Exercise 1.2: React Router v7 Layout Architecture

## 1. Project Context

This audit evaluates **Exercise 1.2 (`24520225_NguyenBaoChinh_Lab04_Exercise1.2`)**, the second stage of the Lab 04 React development sequence:
- **Upstream Inheritance from Exercise 1.1**: Retains `React.lazy(() => import('./PersonDetail.jsx'))` and `<Suspense fallback={<Skeleton aria-busy="true" aria-live="polite" />}>`.
- **Exercise 1.2 Core Scope**: Implements declarative routing with **React Router v7** (`react-router: ^7.18.6`), shared layout nesting (`<Outlet />` and active `<NavLink>`), a two-column master-detail directory (`/people` and `/people/:id`), dynamic parameter extraction (`useParams()`), safe entity lookup (`people.find()`), resilient 404 entity fallback (`NotFoundState`), semantic HTML definition lists (`<dl>`, `<dt>`, `<dd>`), and responsive CSS Grid (`grid-template-columns: minmax(280px, 1fr) 2fr`).
- **Downstream Continuation into Exercise 1.3**: Exercise 1.3 inherits this entire Exercise 1.2 codebase and adds the `/validation` route for legacy `useEffect` anti-pattern auditing.

Companion Exercise 1.2 Documents:
- [`PROJECT_STRUCTURE.md`](file:///Users/chinh/UIT%20lecture/WebApplicationDevelopment/Lab/Lab04/Exercise/24520225_NguyenBaoChinh_Lab04_Exercise1.2/PROJECT_STRUCTURE.md)
- [`TASK_DECOMPOSITION.md`](file:///Users/chinh/UIT%20lecture/WebApplicationDevelopment/Lab/Lab04/Exercise/24520225_NguyenBaoChinh_Lab04_Exercise1.2/TASK_DECOMPOSITION.md)
- [`project-rules.md`](file:///Users/chinh/UIT%20lecture/WebApplicationDevelopment/Lab/Lab04/Exercise/24520225_NguyenBaoChinh_Lab04_Exercise1.2/project-rules.md)

---

## 2. Exercise 1.2 Specific Requirements

1. **Shared Layout Architecture & Nested Routes**:
   - Configure `<BrowserRouter>` and `<Routes>` with a top-level layout route rendering persistent header navigation, `<Outlet />`, and footer.
   - Provide `<NavLink>` navigation between `Home` (`/`) and `People` (`/people`) with automatic active styling (`.nav-link.active`).
2. **Master-Detail Directory & Responsive CSS Grid**:
   - Render the `People` directory using `.people-layout` with `grid-template-columns: minmax(280px, 1fr) 2fr` on desktop and `1fr` at `@media (max-width: 768px)`.
   - Select a person directly from the `.people-master` `<NavLink>` list (no fabricated search input).
3. **Safe URL Parameter Extraction (`useParams()`)**:
   - Extract `:id` dynamically from `/people/:id` inside `PersonDetail` using `const { id } = useParams();`.
4. **Robust Fallback & 404 Entity Handling (`people.find()`)**:
   - Locate the selected person using `const person = people.find((p) => p.id === id);`.
   - When `person` is `undefined` (invalid/nonexistent ID), render `<NotFoundState id={id} />` (`404 - Person Not Found`) instead of crashing.
5. **Semantic HTML Definition Lists (`<dl>`, `<dt>`, `<dd>`)**:
   - Render person attributes (`Name:`, `Role:`, `Department:`, `Status:`) using `<dl className="person-details">`, `<dt>`, and `<dd>`.

---

## 3. Expected vs. Actual Implementation

| Requirement Area | Expected Specification | Actual Implementation in `24520225_NguyenBaoChinh_Lab04_Exercise1.2` | Audit Verdict |
| :--- | :--- | :--- | :---: |
| **React Router v7 Setup** | Import from `'react-router'`; use `<Routes>` and `<Route element={...}>` | `src/App.tsx` (lines 3, 53–82) imports `{ BrowserRouter, Routes, Route, NavLink, Outlet } from 'react-router'` and nests `/`, `people`, `people/:id`, and `*`. | **MATCHES** |
| **Active `<NavLink>` State** | `className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}` with `end` on `/` | Implemented in both `src/App.tsx` (lines 26–40) and `src/layouts/MainLayout.tsx` (lines 12–29), plus `.person-link.active` in `src/pages/PeoplePage.tsx` (lines 11–19). | **MATCHES** |
| **Exercise 1.1 Suspense Preservation** | Keep `React.lazy` + `<Suspense fallback={<Skeleton />}>` on `PersonDetail` | `src/App.tsx` (lines 12–14, 65–74) dynamically imports `./PersonDetail.jsx` and wraps `<PersonDetail people={people} />` in `<Suspense fallback={<Skeleton aria-busy="true" aria-live="polite" />}>`. | **MATCHES** |
| **Safe Lookup & 404 Fallback** | `useParams()` + `people.find()` + 404 fallback UI | `src/PersonDetail.jsx` (lines 21–27) and `src/PersonDetail.tsx` (lines 33–39) extract `const { id } = useParams()`, run `people.find((p) => p.id === id)`, and return `<NotFoundState id={id} />` when `!person`. | **MATCHES** |
| **Semantic Definition List** | `<dl>`, `<dt>`, `<dd>` key-value pairs | `src/PersonDetail.jsx` (lines 30–42) renders `<dl className="person-details">` with `<dt>` and `<dd>` for Name, Role, Department, and Status. | **MATCHES** |
| **Responsive CSS Grid** | `grid-template-columns: minmax(280px, 1fr) 2fr` | `src/App.css` (lines 119–130) defines `.people-layout { display: grid; grid-template-columns: minmax(280px, 1fr) 2fr; gap: 24px; align-items: start; }` and `@media (max-width: 768px) { grid-template-columns: 1fr; }`. | **MATCHES** |

---

## 4. AI-Generated Mistakes, Incorrect Assumptions & Architectural Problems

### 4.1. Incorrect Assumptions Avoided
- **No Unrequested Search Box Added**: AI assistants frequently hallucinate a search/filter input on directory pages. Inspection of `src/pages/PeoplePage.tsx` confirms the interface strictly implements master-detail selection via `<NavLink to={`/people/${person.id}`}>` items.
- **No Legacy React Router v5 `<Switch>` or `component={...}` Props**: All routes use React Router v7 `<Routes>` and `element={...}` props imported directly from `'react-router'`.

### 4.2. AI Failure Modes Audited

| ID | Failure | Root Cause | Impact | Detection | Prevention |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **EX1.2-AF01** | **Unrecovered Invalid Route Parameter (`/people/999`)** | Early iterations of `PersonDetail` returned a bare text box without displaying the invalid ID or providing a navigation recovery link back to `/people`. | Users navigating to a nonexistent person URL had no direct in-card recovery action or accessible `role="alert"` notification. | Detected during Exercise 1.2.2 edge-case verification of `/people/999`. | Implemented `NotFoundState({ id })` with `role="alert"`, `.not-found-code` (`404`), explicit ID display, and `<Link to="/people" className="back-to-people-btn">` (`commit 59c5d28`). |
| **EX1.2-AF02** | **Loss of Exercise 1.1 `<Suspense>` Boundary During Router Migration** | Initial routing commit (`894b83f`) imported `PersonDetail` statically in `App.tsx`, temporarily bypassing Exercise 1.1's `React.lazy` and `<Suspense fallback={<Skeleton />}>` wrapper. | Regressed Exercise 1.1 code splitting so `PersonDetail` was bundled back into the main chunk. | Detected by inspecting `vite build` output chunks and comparing `App.tsx` against Exercise 1.1 requirements. | Restored `const PersonDetail = React.lazy(() => import('./PersonDetail.jsx'))` and `<Suspense fallback={<Skeleton aria-busy="true" aria-live="polite" />}>` inside the `<Route path=":id">` element (`commits 59c5d28, 92043a9`). |
| **EX1.2-AF03** | **Root `<NavLink to="/">` Remaining Active on Child Routes** | Omitting the `end` prop on `<NavLink to="/">` causes React Router to prefix-match `/` on every route (`/people`, `/people/2`). | Both `Home` and `People` navigation tabs appeared active simultaneously. | Detected by visual inspection of `.nav-link.active` when navigating to `/people`. | Always include the boolean `end` prop on root `<NavLink to="/" end>` (`MainLayout.tsx` line 17, `App.tsx` line 28). |
| **EX1.2-AF04** | **TypeScript `.jsx` Import Rejection (`allowJs`)** | Adding `.jsx` modules (`PersonDetail.jsx`, `App.jsx`, `MainLayout.jsx`) alongside `.tsx` files caused `tsc -b` to fail until `"allowJs": true` was added to `tsconfig.app.json`. | Blocked `npm run build` during TypeScript project references compilation. | Caught by `npm run build` (`tsc -b && vite build`). | Configure `"allowJs": true` in `tsconfig.app.json` (`commit 89dfa8d`). |

---

## 5. Verification Matrix (Exercise 1.2)

All checks below were executed against `24520225_NguyenBaoChinh_Lab04_Exercise1.2`:

| Requirement | Verification Method | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :---: |
| **ESLint Static Analysis** | `npm run lint` (`eslint .`) | `0 errors, 0 warnings` | Exited with code `0` (`0 errors, 0 warnings`) | **PASS** |
| **TypeScript & Vite Build (Lazy Chunk)** | `npm run build` (`tsc -b && vite build`) | Zero TS errors; separate `PersonDetail` chunk emitted | Emitted `dist/assets/PersonDetail-DX6lH2Nh.js` (`0.97 kB`) and `dist/assets/PersonDetail-mlLM2bRR.css` (`1.98 kB`) | **PASS** |
| **Home & People Active `<NavLink>`** | Navigate `/` and `/people` in browser | Only the current route tab has class `nav-link active` | Verified exclusive `.nav-link.active` state on `/` and `/people` | **PASS** |
| **Index Outlet on `/people`** | Navigate to `/people` | Right panel displays `Select a person to view details.` | Rendered `<p>Select a person to view details.</p>` inside `.people-detail-panel` | **PASS** |
| **Valid Dynamic ID (`/people/2`) & Semantic `<dl>`** | Navigate to `/people/2` | `useParams()` + `people.find()` renders `<dl class="person-details">` for `Nguyen Bao Chinh` | Rendered `<dl>` with `<dt>`/`<dd>` pairs: `Nguyen Bao Chinh`, `Student`, `Information Technology`, `Active` | **PASS** |
| **Invalid Dynamic ID (`/people/999`) 404 Fallback** | Navigate to `/people/999` | Renders `NotFoundState` (`404 - Person Not Found`, `ID: "999"`) with recovery link to `/people` | Rendered `<div class="not-found-state" role="alert">` without throwing runtime errors | **PASS** |
| **Wildcard 404 Route (`*`)** | Navigate to `/nonexistent-page` | Renders `NotFoundPage` (`404 - Page Not Found`) with `<Link to="/">` | Rendered `404 - Page Not Found` view | **PASS** |
| **Responsive CSS Grid (`minmax(280px, 1fr) 2fr`)** | Inspect `src/App.css` & test mobile viewport | `minmax(280px, 1fr) 2fr` on desktop; collapses to `1fr` at `<= 768px` | Verified in `src/App.css` lines 119–130 | **PASS** |

---

## 6. Lessons Learned (Exercise 1.2)

1. **Preserve Upstream Capabilities When Upgrading Architecture**: Migrating a single-view app (Exercise 1.1) to React Router v7 (Exercise 1.2) must wrap route-level detail components in the existing `<Suspense fallback={<Skeleton />}>` boundary so code splitting is never lost.
2. **Treat URL Parameters as Untrusted User Input**: Values returned by `useParams()` can be arbitrary strings (`/people/999`). Always guard `Array.prototype.find()` results with an explicit `if (!person) return <NotFoundState id={id} />;` fallback before accessing properties.
3. **Use Semantic HTML for Key-Value Entity Views**: Replacing generic `<div>` pairs with `<dl>`, `<dt>`, and `<dd>` improves document semantics and screen-reader key-value association while simplifying CSS Grid alignment (`.person-details { display: grid; grid-template-columns: 140px 1fr; }`).
