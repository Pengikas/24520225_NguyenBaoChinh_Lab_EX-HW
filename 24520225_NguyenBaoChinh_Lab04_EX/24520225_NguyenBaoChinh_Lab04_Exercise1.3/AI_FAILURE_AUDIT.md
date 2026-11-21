# AI Failure Audit — Lab 4

## 1. Project Context

This audit documents the complete engineering history, architectural verification, and AI failure mode analysis for **Lab 04: Multi-Route SPA Architecture & Legacy Validation Anti-Patterns** (`24520225_NguyenBaoChinh_Lab04_Exercise1.3`).

The application was developed across three cumulative stages:
- **Exercise 1.1**: Asynchronous component code splitting (`React.lazy`) and resilient `<Suspense>` boundaries with a WAI-ARIA compliant `Skeleton` fallback (`src/Skeleton.tsx`, `src/PersonDetail.tsx`).
- **Exercise 1.2**: Declarative multi-route SPA architecture using React Router v7 (`BrowserRouter`, `Routes`, `Route`, `NavLink`, `Outlet`, `useParams`), master-detail directory layout (`/people` and `/people/:id`), safe entity lookup via `people.find()`, non-crashing 404 entity fallback (`NotFoundState`), semantic `<dl>/<dt>/<dd>` definition lists, and responsive CSS Grid (`grid-template-columns: minmax(280px, 1fr) 2fr`).
- **Exercise 1.3**: Architectural deconstruction of legacy `useEffect` chaining across `InputField` and `SimpleForm` (`/validation`), featuring all five chained `useEffect` hooks (`syncToParent`, `validateField`, `calcFormValidity`, `syncErrorsToChild`, `autoScrollToError`), live execution tracing (`ExecutionTrace.tsx` and `docs/exercise-1.3/execution_trace.log`), reproducible asynchronous validation race conditions (**MODE A: Legacy Async Validation** vs. **MODE B: Protected Validation**), and an isolated non-executing demonstration of **Infinite Loop Risk** (`Maximum update depth exceeded`).

Cross-references:
- For the complete directory tree and component architecture, see [`PROJECT_STRUCTURE.md`](file:///Users/chinh/UIT%20lecture/WebApplicationDevelopment/Lab/Lab04/Exercise/24520225_NguyenBaoChinh_Lab04_Exercise1.3/PROJECT_STRUCTURE.md).
- For the 4-Stage Contract-First milestone breakdown (`G0`–`G4`), see [`TASK_DECOMPOSITION.md`](file:///Users/chinh/UIT%20lecture/WebApplicationDevelopment/Lab/Lab04/Exercise/24520225_NguyenBaoChinh_Lab04_Exercise1.3/TASK_DECOMPOSITION.md).
- For mandatory engineering governance and Git safety rules, see [`project-rules.md`](file:///Users/chinh/UIT%20lecture/WebApplicationDevelopment/Lab/Lab04/Exercise/24520225_NguyenBaoChinh_Lab04_Exercise1.3/project-rules.md).

---

## 2. Exercise 1.1 Audit — Code Splitting & Accessible Suspense Fallback

### 2.1. Original Requirements & Expected Implementation
- Dynamically import `PersonDetail` using `React.lazy()` so the bundler emits a dedicated asynchronous JavaScript chunk.
- Wrap `PersonDetail` in `<Suspense>` using an accessible `Skeleton` component as the `fallback` prop.
- Expose WAI-ARIA attributes (`aria-busy="true"`, `aria-live="polite"`, `aria-label="Loading person details"`) on the `Skeleton` container so screen readers announce loading transitions.
- Provide a visual shimmer placeholder matching the dimensions of the profile view.

### 2.2. Actual Implementation Inspected
- **Lazy Import**: [`src/App.tsx`](file:///Users/chinh/UIT%20lecture/WebApplicationDevelopment/Lab/Lab04/Exercise/24520225_NguyenBaoChinh_Lab04_Exercise1.3/src/App.tsx#L12-L15) declares `const PersonDetail = React.lazy(() => import('./PersonDetail.jsx'));` and renders it inside `<Suspense fallback={<Skeleton aria-busy="true" aria-live="polite" />}>` on the `/people/:id` route.
- **Accessible Skeleton**: [`src/Skeleton.tsx`](file:///Users/chinh/UIT%20lecture/WebApplicationDevelopment/Lab/Lab04/Exercise/24520225_NguyenBaoChinh_Lab04_Exercise1.3/src/Skeleton.tsx#L8-L18) accepts typed `SkeletonProps` (`'aria-busy'?: boolean | 'true' | 'false'`, `'aria-live'?: 'off' | 'polite' | 'assertive'`) and applies them to `<section className="skeleton-card">`.
- **Chunk Split Verification**: Running `npm run build` (`tsc -b && vite build`) produces separate chunks: `dist/assets/PersonDetail-osYEGf6f.js` (`0.97 kB`) and `dist/assets/PersonDetail-mlLM2bRR.css` (`1.98 kB`).

### 2.3. AI-Generated Mistakes Detected & Corrected in Exercise 1.1
- **Failure Mode (Destructive Overwrite of Previous Exercise)**: During the initial transition to Exercise 1.3, a naive implementation overwrote `src/App.tsx` with a standalone Exercise 1.3 view, temporarily removing the `React.lazy(() => import('./PersonDetail'))` and `<Suspense fallback={<Skeleton />}>` boundary from Exercise 1.1.
- **Correction**: Restored the full `<BrowserRouter>` route hierarchy in `src/App.tsx` so Exercise 1.1's `React.lazy` + `<Suspense fallback={<Skeleton aria-busy="true" aria-live="polite" />}>` remains active on `/people/:id` alongside `/validation`.

---

## 3. Exercise 1.2 Audit — React Router v7 Layout Architecture

### 3.1. Audited Architectural Pillars
1. **Shared Layout & Nested Routes (`<Outlet />` & `<NavLink>`)**:
   - Audited in [`src/App.tsx`](file:///Users/chinh/UIT%20lecture/WebApplicationDevelopment/Lab/Lab04/Exercise/24520225_NguyenBaoChinh_Lab04_Exercise1.3/src/App.tsx#L20-L57) and [`src/layouts/MainLayout.tsx`](file:///Users/chinh/UIT%20lecture/WebApplicationDevelopment/Lab/Lab04/Exercise/24520225_NguyenBaoChinh_Lab04_Exercise1.3/src/layouts/MainLayout.tsx).
   - Uses `<NavLink to="/" end>` so the `Home` link is only styled `.nav-link.active` on the exact `/` path, while `/people` and `/validation` activate their respective tabs.
   - Child routes render inside `<main className="content-section"><Outlet /></main>`.
2. **Safe URL Parameter Extraction (`useParams()`)**:
   - Audited in [`src/PersonDetail.jsx`](file:///Users/chinh/UIT%20lecture/WebApplicationDevelopment/Lab/Lab04/Exercise/24520225_NguyenBaoChinh_Lab04_Exercise1.3/src/PersonDetail.jsx#L21-L23) and [`src/PersonDetail.tsx`](file:///Users/chinh/UIT%20lecture/WebApplicationDevelopment/Lab/Lab04/Exercise/24520225_NguyenBaoChinh_Lab04_Exercise1.3/src/PersonDetail.tsx#L33-L35).
   - Dynamically extracts `const { id } = useParams();` without hardcoding entity indices.
3. **Robust Fallback & 404 Handling (`people.find()`)**:
   - Looks up the selected entity via `const person = people.find((p) => p.id === id);`.
   - When `person` is `undefined` (such as `/people/999`), returns `<NotFoundState id={id} />` (`role="alert"`), rendering a styled `404 - Person Not Found` panel with the missing ID and a `<Link to="/people">` recovery button instead of throwing a runtime `TypeError: Cannot read properties of undefined`.
4. **Semantic HTML Definition Lists (`<dl>`, `<dt>`, `<dd>`)**:
   - Audited in [`src/PersonDetail.jsx`](file:///Users/chinh/UIT%20lecture/WebApplicationDevelopment/Lab/Lab04/Exercise/24520225_NguyenBaoChinh_Lab04_Exercise1.3/src/PersonDetail.jsx#L29-L43): renders `<dl className="person-details">` with four semantic `<dt>`/`<dd>` pairs (`Name:`, `Role:`, `Department:`, `Status:`).
5. **Responsive Master-Detail CSS Grid**:
   - Audited in [`src/App.css`](file:///Users/chinh/UIT%20lecture/WebApplicationDevelopment/Lab/Lab04/Exercise/24520225_NguyenBaoChinh_Lab04_Exercise1.3/src/App.css#L120-L131): `.people-layout` uses `display: grid; grid-template-columns: minmax(280px, 1fr) 2fr; gap: 24px; align-items: start;` and collapses to `grid-template-columns: 1fr;` at `@media (max-width: 768px)`.
   - No fabricated search box was added; selection occurs directly from the `.people-master` `<NavLink>` list as specified.

### 3.2. AI-Generated Mistakes Detected & Corrected in Exercise 1.2
- **Mixed `.jsx` and `.tsx` Module Resolution Failure**: When Exercise 1.2 introduced `.jsx` counterparts (`PersonDetail.jsx`, `App.jsx`, `Skeleton.jsx`), `tsc -b` initially required `"allowJs": true` in `tsconfig.app.json`. Enabling `"allowJs": true` allowed seamless interoperability between `.tsx` and `.jsx` modules.

---

## 4. Exercise 1.3 Audit — Legacy Validation Anti-Patterns

### 4.1. Five Chained `useEffect` Hooks Audit
All five required hooks are explicitly implemented and labeled in [`src/components/InputField.tsx`](file:///Users/chinh/UIT%20lecture/WebApplicationDevelopment/Lab/Lab04/Exercise/24520225_NguyenBaoChinh_Lab04_Exercise1.3/src/components/InputField.tsx) and [`src/components/SimpleForm.tsx`](file:///Users/chinh/UIT%20lecture/WebApplicationDevelopment/Lab/Lab04/Exercise/24520225_NguyenBaoChinh_Lab04_Exercise1.3/src/components/SimpleForm.tsx):

| Hook # | Identifier | Component Location | Dependencies | Audited Behavior |
| :---: | :--- | :--- | :--- | :--- |
| **#1** | `syncToParent()` | `src/components/InputField.tsx` (lines 28–35) | `[localValue, value, onValueChange, onTraceStep]` | Logs `'useEffect #1: syncToParent()'` and invokes `onValueChange(localValue)` whenever `localValue !== value`. |
| **#2** | `validateField()` | `src/components/SimpleForm.tsx` (lines 128–143) | `[formData, validationErrors, pushTraceStep]` | Logs `'useEffect #2: validateField()'`, evaluates `validateField(formData)`, and updates `validationErrors` if serialized errors changed. |
| **#3** | `calcFormValidity()` | `src/components/SimpleForm.tsx` (lines 146–160) | `[validationErrors, formData, isFormValid, pushTraceStep]` | Logs `'useEffect #3: calcFormValidity()'` and updates boolean `isFormValid` when `Object.keys(validationErrors).length === 0 && formData.name.trim().length >= 3`. |
| **#4** | `syncErrorsToChild()` | `src/components/SimpleForm.tsx` (lines 163–176) | `[validationErrors, childErrors, pushTraceStep]` | Logs `'useEffect #4: syncErrorsToChild()'` and copies `validationErrors` to `childErrors` prop passed down to `InputField`. |
| **#5** | `autoScrollToError()` | `src/components/InputField.tsx` (lines 38–48) | `[error, onTraceStep]` | Logs `'useEffect #5: autoScrollToError()'` and calls `inputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })` when `error` is truthy. |

### 4.2. Cascading Re-renders & Execution Trace Accuracy Audit
- **Conceptual Trace vs. Measured React 19 Commits**:
  - The conceptual trace in `execution_trace.log` illustrates 5 chained `useEffect` dependency hops across the parent-child boundary (`InputField` → `SimpleForm` → `InputField`).
  - In actual runtime execution under React 19, automatic state batching groups synchronous state updates (`setValidationErrors`, `setIsFormValid`, `setChildErrors`) scheduled within the same commit tick, and equality guards (`JSON.stringify(nextErrors) !== JSON.stringify(validationErrors)`) skip redundant re-renders when typing from `'a'` to `'ab'` (where the error message `"Name must contain at least 3 characters"` remains identical).
  - [`src/components/ExecutionTrace.tsx`](file:///Users/chinh/UIT%20lecture/WebApplicationDevelopment/Lab/Lab04/Exercise/24520225_NguyenBaoChinh_Lab04_Exercise1.3/src/components/ExecutionTrace.tsx#L84-L108) explicitly separates the conceptual diagram from the live measured counters (`Observed InputField Renders`, `Observed SimpleForm Renders`, `Observed Effect Hook Executions`) and explains React 19 batching in the UI.

### 4.3. Race Conditions Audit (MODE A: Legacy vs. MODE B: Protected)
- Audited in [`src/components/SimpleForm.tsx`](file:///Users/chinh/UIT%20lecture/WebApplicationDevelopment/Lab/Lab04/Exercise/24520225_NguyenBaoChinh_Lab04_Exercise1.3/src/components/SimpleForm.tsx#L195-L296):
  - **MODE A (`LEGACY`)**: Dispatches async validation where short invalid inputs (`"a"`, `650ms`) resolve slower than valid 3-character inputs (`"abc"`, `140ms`). In automated headless Chrome testing, running the rapid typing burst `"a" → "ab" → "abc"` caused Request `#3 ("abc")` to resolve first at `140ms` (`VALID`), followed by Request `#1 ("a")` resolving last at `650ms` (`STALE_OVERWROTE`), corrupting the displayed state for `"abc"` with `INVALID: "a" must contain at least 3 characters`.
  - **MODE B (`PROTECTED`)**: Compares each request's sequence number `seq` against `latestRaceSeqRef.current` (`const isStale = seq < latestRaceSeqRef.current`). Out-of-order responses `#1 ("a")` and `#2 ("ab")` are marked `IGNORED_STALE`, preserving the valid state `[Req #6 for "abc"] → VALID: "abc" accepted`.

### 4.4. Infinite Loop Risk Audit
- Audited in [`src/components/SimpleForm.tsx`](file:///Users/chinh/UIT%20lecture/WebApplicationDevelopment/Lab/Lab04/Exercise/24520225_NguyenBaoChinh_Lab04_Exercise1.3/src/components/SimpleForm.tsx#L25-L31):
  - Displays the dangerous code pattern `useEffect(() => { setFormState({ ...formState }); });` inside a non-executing `<pre className="ex13-code-fixture">` block with the explicit warning banner `"Demonstration only – intentionally unsafe code is not executed."`, preventing application crashes while explaining why allocating a new object reference on every render triggers `Uncaught Error: Maximum update depth exceeded`.

---

## 5. AI Failure Categories

| ID | Failure | Root Cause | Impact | Detection | Prevention |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **AF-01** | **Destructive App Entry Overwrite** | AI initially replaced `src/App.tsx` with a standalone Exercise 1.3 component instead of integrating `/validation` into the existing React Router v7 `<Routes>` tree. | Temporarily broke Exercise 1.1 (`React.lazy` + `Skeleton`) and Exercise 1.2 (`/people/:id` master-detail routes). | Detected via `git show HEAD:src/App.tsx` inspection and route regression check. | Enforce **Strict Project Preservation Rules** (`project-rules.md` Section 5 & 7): inspect `App.tsx` first and only add child `<Route path="validation">` entries. |
| **AF-02** | **Ref Mutation During Render (`react-hooks/refs`)** | AI placed `renderCountRef.current += 1` directly inside the component body of `SimpleForm.tsx` during render. | Caused `npm run lint` to fail with `2 errors` (`Cannot access/update ref value during render`). | Caught immediately by running `npm run lint` (`eslint-plugin-react-hooks` v7). | Never read or mutate `.current` during render; update telemetry counters inside `useEffect` or event callbacks. |
| **AF-03** | **Unannotated Synchronous `setState` in `useEffect` (`react-hooks/set-state-in-effect`)** | React Hooks ESLint v7 flags synchronous `setState` calls inside `useEffect` bodies because they cause cascading renders (the exact anti-pattern Exercise 1.3 demonstrates). | Caused `npm run lint` to fail with `3 errors` in `SimpleForm.tsx` (`useEffect #2, #3, #4`) and `1 error` in `InputField.tsx`. | Caught by `npm run lint` gate before commit. | Remove unnecessary sync effect in `InputField.tsx`, and document intentional anti-pattern hooks in `SimpleForm.tsx` with scoped `// eslint-disable-next-line react-hooks/set-state-in-effect` justifications. |
| **AF-04** | **Ignored `.log` Artifact in `.gitignore`** | Standard Vite `.gitignore` includes `*.log`, causing `git add execution_trace.log` to fail with exit code `1`. | Blocked staging of required `execution_trace.log` and `docs/exercise-1.3/execution_trace.log` files. | Caught during Git staging (`The following paths are ignored by one of your .gitignore files: execution_trace.log`). | Verify `git status` after staging and use `git add -f` for required `.log` deliverable artifacts. |
| **AF-05** | **Dev Server Not Running (`ERR_CONNECTION_REFUSED`)** | User opened `http://localhost:5173` while the Vite dev server process was not running in the background. | Browser displayed `This site can't be reached (localhost refused to connect)`. | Reported via user screenshot and verified by starting `npm run dev -- --port 5173`. | Always verify active dev/preview server processes before instructing browser navigation. |
| **AF-06** | **Conceptual vs. Measured Render Count Conflation** | Assuming 5 chained `useEffect` hooks always produce 5 physical DOM commits per keystroke without accounting for React 19 automatic batching or equality guards. | Misleading telemetry if "5 renders" is hardcoded as a measured runtime metric. | Detected by comparing actual `InputField` and `SimpleForm` render counters during typing (`'a'` → `'ab'` → `'abc'`). | Track and display actual component renders separately from effect hook executions in `ExecutionTrace.tsx`. |

---

## 6. Verification Matrix

All requirements below were executed and verified against the actual running application (`tsc -b && vite build`, `eslint .`, and headless Google Chrome via Playwright):

| Exercise | Requirement | Verification Method | Expected Result | Actual Result | Status |
| :---: | :--- | :--- | :--- | :--- | :---: |
| **Ex 1.1** | `React.lazy()` dynamic import of `PersonDetail` | `npm run build` chunk inspection | Separate JS/CSS chunk emitted for `PersonDetail` | Emitted `dist/assets/PersonDetail-osYEGf6f.js` (`0.97 kB`) and `PersonDetail-mlLM2bRR.css` (`1.98 kB`) | **PASS** |
| **Ex 1.1** | Accessible `<Suspense fallback={<Skeleton />}>` | Inspect `src/Skeleton.tsx` & DOM attributes | `aria-busy="true"`, `aria-live="polite"`, `aria-label="Loading person details"` | `<section class="skeleton-card" aria-busy="true" aria-live="polite" aria-label="Loading person details">` verified | **PASS** |
| **Ex 1.2** | Shared layout with `<Outlet />` and active `<NavLink>` | Navigate `/`, `/people`, `/validation` in Chrome | Active link receives `.nav-link.active`; layout header/footer persist | Verified across all 3 navigation links with `end` on `/` | **PASS** |
| **Ex 1.2** | Safe `useParams()` & `people.find()` on `/people/:id` | Navigate to `http://localhost:4173/people/2` | Renders `Nguyen Bao Chinh`, `Student`, `Information Technology`, `Active` inside `<dl class="person-details">` | Rendered exact `<dl>/<dt>/<dd>` attributes for ID `"2"` | **PASS** |
| **Ex 1.2** | Robust 404 fallback on invalid person ID | Navigate to `http://localhost:4173/people/999` | Displays `404 - Person Not Found` with `ID: "999"` and recovery link without crashing | Rendered `<div class="not-found-state" role="alert">404 - Person Not Found</div>` | **PASS** |
| **Ex 1.2** | Responsive Master-Detail CSS Grid | Inspect `.people-layout` in `src/App.css` | `grid-template-columns: minmax(280px, 1fr) 2fr` on desktop; `1fr` at `<=768px` | Verified in `src/App.css` lines 120–130 | **PASS** |
| **Ex 1.3** | Five chained `useEffect` hooks (#1–#5) | Inspect `InputField.tsx` & `SimpleForm.tsx` + Console logs | All 5 hooks (`syncToParent`, `validateField`, `calcFormValidity`, `syncErrorsToChild`, `autoScrollToError`) execute and log | All 5 hooks verified in source code, Console logs, and `ExecutionTrace` stream | **PASS** |
| **Ex 1.3** | **TC01**: Empty input validation | Load `/validation` with empty input `""` | Displays `⚠ Name is required`; Form Validity is `Invalid`; Submit disabled | Displayed `⚠ Name is required` and `Invalid` status | **PASS** |
| **Ex 1.3** | **TC02 & TC03**: Short invalid inputs `"a"` and `"ab"` | Type `"a"` then `"ab"` into `#full-name-input` | Displays `⚠ Name must contain at least 3 characters`; Submit disabled | Displayed `⚠ Name must contain at least 3 characters` for both `"a"` and `"ab"` | **PASS** |
| **Ex 1.3** | **TC04, TC05 & TC06**: Valid inputs `"abc"` and `"Nguyen Bao Chinh"` + Submit | Type `"abc"`, then `"Nguyen Bao Chinh"`, click Submit | Error clears, status becomes `Valid`, Submit displays `✓ Form submitted successfully for "Nguyen Bao Chinh"!` | Status changed to `Valid` and green banner confirmed submission | **PASS** |
| **Ex 1.3** | **TC07 & Race Condition MODE A (Legacy)** | Trigger rapid typing burst (`"a"` 650ms → `"ab"` 400ms → `"abc"` 140ms) in Mode A | Stale Request `#1 ("a")` resolves last and overwrites valid `"abc"` state (`STALE_OVERWROTE`) | Displayed `[Req #1 for "a"] → INVALID` and `🚨 STATE CORRUPTION DETECTED (MODE A)` | **PASS** |
| **Ex 1.3** | **Race Condition MODE B (Protected)** | Trigger rapid typing burst (`"a"` → `"ab"` → `"abc"`) in Mode B | Sequence ID guard (`latestRaceSeqRef.current`) ignores stale `#1` and `#2` (`IGNORED_STALE`), keeping `"abc"` valid | Displayed `[Req #6 for "abc"] → VALID: "abc" accepted` and `✓ STALE RESPONSES IGNORED (MODE B)` | **PASS** |
| **Ex 1.3** | **Infinite Loop Risk** safe isolation | Inspect Infinite Loop Risk card on `/validation` | Displays `setFormState({ ...formState })` fixture and warning `"Demonstration only – intentionally unsafe code is not executed."` | Verified non-executing code block and safety banner; zero runtime crash | **PASS** |
| **Ex 1.3** | Required `execution_trace.log` file & Responsive `375px` layout | Inspect `docs/exercise-1.3/execution_trace.log` & test `375x900` viewport | Log file exists with full trace; `scrollWidth > clientWidth` is `false` at `375px` | File verified at `docs/exercise-1.3/execution_trace.log`; `375px` horizontal overflow: `false` | **PASS** |

---

## 7. Lessons Learned

1. **Single Source of Truth Over Parent-Child State Mirroring**: Maintaining `localValue` inside `InputField` alongside `formData.name` in `SimpleForm` requires bidirectional `useEffect` synchronization (`useEffect #1` and `useEffect #4`), doubling render passes and creating tight coupling. Controlled inputs should lift state to a single owner and pass `value` and `onChange` directly.
2. **Derive State During Render Instead of Chaining `useEffect`**: Synchronous values like `validationErrors` (`useEffect #2`) and `isFormValid` (`useEffect #3`) are pure functions of `formData`. Computing them inline during render (or via `useMemo` when expensive) eliminates 3 out of the 5 chained `useEffect` hooks and prevents cascading re-renders entirely.
3. **Always Guard Asynchronous Effects Against Out-of-Order Resolution**: Network or asynchronous validation effects must track a monotonically increasing request sequence ID (`latestRaceSeqRef.current`) or an `AbortController` / cleanup boolean flag (`let ignore = false; return () => { ignore = true; }`) so slow stale responses cannot overwrite newer user input.
4. **Enforce Static Analysis Gates (`eslint-plugin-react-hooks` v7)**: Modern React Hooks lint rules (`react-hooks/refs` and `react-hooks/set-state-in-effect`) catch both ref mutations during render and cascading synchronous `setState` calls inside effects at build time before they reach production.
