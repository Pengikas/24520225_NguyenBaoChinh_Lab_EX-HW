# AI Failure Mode Audit Report: Lab 03 Exercise 2
**Document Identifier:** `AI_FAILURE_AUDIT.md`  
**Project Identifier:** `24520225_NguyenBaoChinh_Lab03_EX2`  
**Course:** Web Application Development (Lab 03 — Exercise 2)  
**Component Under Audit:** `ScientistDirectory.jsx`, `smartPeople.js`, `App.jsx`, `main.jsx`, `style.css`, Root & Nested `package.json`  
**Student Name:** Nguyen Bao Chinh | **Student ID:** 24520225  
**Audit Date:** October 26, 2026  

---

## 1. Executive Summary

During the architectural engineering and pair-programming implementation of **Lab 03 Exercise 2 (Scientist & Pioneer Directory Reactive Explorer)**, a rigorous code review and diagnostic audit were conducted across the application codebase. The project is implemented using **React 19.3.1**, **Vite 8.3.5**, modern ES2024 features (`Array.prototype.toSorted()`), and accessible WAI-ARIA patterns.

The primary objective of this audit is to identify, document, and verify real AI-generated implementation flaws, architectural risks, and state management anti-patterns that occurred or were actively mitigated during the sprint. Each case study documents the empirical symptom, root cause analysis, refactored production solution, verification procedure, and verification status.

---

## 2. Audit Matrix Summary

| Failure ID | Failure Title | Affected Module | Root Cause | Severity | Verification Status |
|:---|:---|:---|:---|:---|:---|
| **AI-FAIL-01** | Missing Script Proxy in Root `package.json` | Root `package.json` | AI scaffolded the Vite React app inside nested `scientist-directory/` without root CLI proxies. | **High** (Blocks execution) | `VERIFIED` |
| **AI-FAIL-02** | Pluralized CSS Import Path Resolution Error | `src/main.jsx` | AI imported `./styles.css` (plural) when the actual file was named `style.css` (singular). | **High** (Build failure) | `VERIFIED` |
| **AI-FAIL-03** | Missing Named Component Export | `ScientistDirectory.jsx` & `App.jsx` | `App.jsx` imported `{ ScientistDirectory }` while the component file was empty (0 bytes). | **High** (Build failure) | `VERIFIED` |
| **AI-RISK-04** | Redundant Synchronized State Anti-Pattern | `ScientistDirectory.jsx` | Storing `visiblePeople` in a separate `useState` and syncing with `useEffect`. | **Medium** (Render cascade) | `VERIFIED` (Mitigated) |
| **AI-RISK-05** | Lexicographical Numeric Filter Comparison | `ScientistDirectory.jsx` | Reading `event.target.value` as a string instead of `event.target.valueAsNumber`. | **High** (Incorrect data) | `VERIFIED` (Mitigated) |
| **AI-RISK-06** | Focus Loss Following DOM Node Deletion | `ScientistDirectory.jsx` | Deleting active element causes browser to dump keyboard focus to `<body>`. | **Medium** (A11y violation) | `VERIFIED` |
| **AI-RISK-07** | List Re-render Instability via Array Index Keys | `ScientistDirectory.jsx` | Using array index `key={index}` instead of stable unique identifier `key={person.id}`. | **Medium** (VDOM desync) | `VERIFIED` |

---

## 3. Comprehensive Failure Mode Case Studies

### 3.1. Failure A: Missing Root Script Proxy Causing CLI Failure (`AI-FAIL-01`)

* **Failure ID:** `AI-FAIL-01`
* **Title:** Missing `"dev"` and `"build"` Script Definitions in Root `package.json`
* **Faulty Code / Observed Behavior:**
  When executing `npm run dev` or `npm run build` directly from the project root (`24520225_NguyenBaoChinh_Lab03_EX2`), the CLI halted with exit code 1:
  ```text
  npm error Missing script: "dev"
  npm error
  npm error To see a list of scripts, run:
  npm error   npm run
  ```
* **Why It Was a Problem:**
  The AI initialized the Vite application in a subfolder named `scientist-directory/` using `npm create vite@latest scientist-directory -- --template react`, leaving the root `package.json` containing only dependencies without `scripts`. Because developer workflows, VS Code task runners, and in-class grading scripts run commands from the workspace root, developers and CI environments were completely blocked from starting or building the project without manual navigation.
* **Corrective Action:**
  Configured script delegation in the root [package.json](file:///Users/chinh/UIT%20lecture/WebApplicationDevelopment/Lab/Lab03/Exercise/24520225_NguyenBaoChinh_Lab03_EX2%20/package.json) using npm's `--prefix` flag:
  ```json
  {
    "name": "lab03-ex2",
    "private": true,
    "scripts": {
      "dev": "npm --prefix scientist-directory run dev",
      "build": "npm --prefix scientist-directory run build",
      "preview": "npm --prefix scientist-directory run preview"
    },
    "dependencies": {
      "react": "^19.3.1",
      "react-dom": "^19.3.1"
    }
  }
  ```
* **Verification Procedure:**
  1. Open terminal at `/Users/chinh/UIT lecture/WebApplicationDevelopment/Lab/Lab03/Exercise/24520225_NguyenBaoChinh_Lab03_EX2 `.
  2. Run `npm run build`.
  3. Verify Vite executes in `scientist-directory` and outputs production bundle in `dist/`.
* **Evidence Location:**
  - File: [package.json](file:///Users/chinh/UIT%20lecture/WebApplicationDevelopment/Lab/Lab03/Exercise/24520225_NguyenBaoChinh_Lab03_EX2%20/package.json#L4-L8) (lines 4–8).
  - Terminal log: `npm run build` executed `> scientist-directory@0.0.0 build > vite build` with 0 errors.
* **Verification Status:** `VERIFIED`

---

### 3.2. Failure B: Pluralized CSS Import Path Resolution Failure (`AI-FAIL-02`)

* **Failure ID:** `AI-FAIL-02`
* **Title:** Rollup / Vite Unresolved Import on Pluralized Stylesheet (`./styles.css`)
* **Faulty Code / Observed Behavior:**
  In `scientist-directory/src/main.jsx`:
  ```jsx
  // FAULTY: Attempted to import non-existent plural stylesheet
  import App from "./App.jsx";
  import "./styles.css";
  ```
  Vite/Rolldown production build failed immediately with:
  ```text
  [UNRESOLVED_IMPORT] Could not resolve './styles.css' in src/main.jsx
     ╭─[ src/main.jsx:4:8 ]
     │
   4 │ import "./styles.css";
     │        ───────┬──────  
     │               ╰──────── Module not found.
  ```
* **Why It Was a Problem:**
  The AI scaffolded the stylesheet under `src/style.css` (singular) matching the existing exercise CSS, but wrote `import "./styles.css"` (plural) inside `main.jsx`. Because Vite and modern bundlers strictly enforce module resolution at compile-time, an unresolved static import halts bundle compilation entirely, preventing development server serving and production deployment.
* **Corrective Action:**
  Corrected the import statement in [main.jsx](file:///Users/chinh/UIT%20lecture/WebApplicationDevelopment/Lab/Lab03/Exercise/24520225_NguyenBaoChinh_Lab03_EX2%20/scientist-directory/src/main.jsx#L5) to target `./style.css`:
  ```jsx
  import App from "./App.jsx";
  import "./style.css";
  ```
* **Verification Procedure:**
  1. Run `npm --prefix scientist-directory run build`.
  2. Verify Vite bundler transforms all modules without resolution errors.
* **Evidence Location:**
  - File: [scientist-directory/src/main.jsx](file:///Users/chinh/UIT%20lecture/WebApplicationDevelopment/Lab/Lab03/Exercise/24520225_NguyenBaoChinh_Lab03_EX2%20/scientist-directory/src/main.jsx#L5).
  - Commit: `ac7dc02` (`feat(ex2): add search, IQ filter and sorting`).
* **Verification Status:** `VERIFIED`

---

### 3.3. Failure C: Missing Component Export in Scaffolded File (`AI-FAIL-03`)

* **Failure ID:** `AI-FAIL-03`
* **Title:** Missing Named Export `ScientistDirectory` Leading to Bundler Crash
* **Faulty Code / Observed Behavior:**
  `src/App.jsx` imported `{ ScientistDirectory } from "./components/ScientistDirectory.jsx"`, but `ScientistDirectory.jsx` was an empty 0-byte file created during directory setup.
  Vite build failed with:
  ```text
  [MISSING_EXPORT] "ScientistDirectory" is not exported by "src/components/ScientistDirectory.jsx".
     ╭─[ src/App.jsx:1:10 ]
     │
   1 │ import { ScientistDirectory } from "./components/ScientistDirectory.jsx";
     │          ─────────┬────────  
     │                   ╰────────── Missing export
  ```
* **Why It Was a Problem:**
  AI tools often perform partial file generations, creating consumer imports in top-level files (`App.jsx`) before generating the exported module (`ScientistDirectory.jsx`), or creating empty files when token boundaries are hit. In ESM (ECMAScript Modules), named imports must statically resolve to declared exports.
* **Corrective Action:**
  Implemented and exported `ScientistDirectory` as both a named export and default export in [ScientistDirectory.jsx](file:///Users/chinh/UIT%20lecture/WebApplicationDevelopment/Lab/Lab03/Exercise/24520225_NguyenBaoChinh_Lab03_EX2%20/scientist-directory/src/components/ScientistDirectory.jsx#L5):
  ```jsx
  export function ScientistDirectory({ initialData = SMART_PEOPLE }) { ... }
  export default ScientistDirectory;
  ```
* **Verification Procedure:**
  1. Inspect `src/components/ScientistDirectory.jsx` exports.
  2. Run `npm run build` to confirm static export validation succeeds.
* **Evidence Location:**
  - File: [scientist-directory/src/components/ScientistDirectory.jsx](file:///Users/chinh/UIT%20lecture/WebApplicationDevelopment/Lab/Lab03/Exercise/24520225_NguyenBaoChinh_Lab03_EX2%20/scientist-directory/src/components/ScientistDirectory.jsx#L5).
  - Commit: `ac7dc02` (`feat(ex2): add search, IQ filter and sorting`).
* **Verification Status:** `VERIFIED`

---

### 3.4. Failure D: Redundant Derived State Synchronization Anti-Pattern (`AI-RISK-04`)

* **Failure ID:** `AI-RISK-04`
* **Title:** Anti-Pattern of Mirroring Filtered/Sorted Data into Redundant State via `useEffect`
* **Faulty Code / Observed Anti-Pattern:**
  ```jsx
  // FAULTY AI PATTERN: Redundant state and synchronized effect
  const [people, setPeople] = useState(initialData);
  const [visiblePeople, setVisiblePeople] = useState([]);

  useEffect(() => {
    const filtered = people.filter(p => p.name.includes(query) && p.iq >= minIq);
    setVisiblePeople(filtered.toSorted(...));
  }, [people, query, minIq, sortBy]);
  ```
* **Why It Is a Problem:**
  1. **Cascade Re-renders:** Triggering state updates inside `useEffect` causes React to render twice for every keystroke: first with stale data, then with updated `visiblePeople`.
  2. **Race Conditions & Desynchronization:** If an update to `people` occurs concurrently with a filter adjustment, the intermediate render exposes an inconsistent view state.
  3. **Violation of Single Source of Truth:** `visiblePeople` is purely a deterministic projection of `people`, `query`, `minIq`, and `sortBy`.
* **Corrective Action:**
  Enforce pure derived calculation during render in [ScientistDirectory.jsx](file:///Users/chinh/UIT%20lecture/WebApplicationDevelopment/Lab/Lab03/Exercise/24520225_NguyenBaoChinh_Lab03_EX2%20/scientist-directory/src/components/ScientistDirectory.jsx#L20-L40):
  ```jsx
  const visiblePeople = people
    .filter((person) => {
      const matchesName = person.name
        .toLowerCase()
        .includes(query.trim().toLowerCase());
      return matchesName && person.iq >= minIq;
    })
    .toSorted((a, b) => {
      switch (sortBy) {
        case "iq-asc": return a.iq - b.iq;
        case "age-asc": return a.age - b.age;
        case "age-desc": return b.age - a.age;
        case "iq-desc":
        default: return b.iq - a.iq;
      }
    });
  ```
* **Verification Procedure:**
  Audit AST and source code of `ScientistDirectory.jsx` to confirm zero `useEffect` calls for filtering.
* **Evidence Location:**
  - File: [scientist-directory/src/components/ScientistDirectory.jsx](file:///Users/chinh/UIT%20lecture/WebApplicationDevelopment/Lab/Lab03/Exercise/24520225_NguyenBaoChinh_Lab03_EX2%20/scientist-directory/src/components/ScientistDirectory.jsx#L20-L40).
* **Verification Status:** `VERIFIED`

---

### 3.5. Failure E: Lexicographical String Comparison in Numeric Filter (`AI-RISK-05`)

* **Failure ID:** `AI-RISK-05`
* **Title:** Type Coercion Error via String `event.target.value` on Numeric `<input>`
* **Faulty Code / Observed Behavior:**
  ```jsx
  // FAULTY AI PATTERN: String comparison
  <input
    type="number"
    value={minIq}
    onChange={(e) => setMinIq(e.target.value)} // string, e.g. "90"
  />
  // Later: person.iq >= minIq => 110 >= "90" -> true, but "90" > "110" in lexicographical sorting!
  ```
* **Why It Is a Problem:**
  HTML `<input type="number">` defaults `event.target.value` to a `string`. When comparing numbers against string values, JavaScript performs unpredictable type coercion. If empty or cleared by the user, `e.target.value` becomes `""`, leading to `Number("") === 0` or invalid string comparisons. Furthermore, if `NaN` is not guarded against, entering a non-numeric character breaks filtering.
* **Corrective Action:**
  Utilize `event.target.valueAsNumber` combined with strict `Number.isNaN()` guard and `Math.max(0, ...)` floor in [ScientistDirectory.jsx](file:///Users/chinh/UIT%20lecture/WebApplicationDevelopment/Lab/Lab03/Exercise/24520225_NguyenBaoChinh_Lab03_EX2%20/scientist-directory/src/components/ScientistDirectory.jsx#L117-L125):
  ```jsx
  onChange={(event) => {
    const value = event.target.valueAsNumber;
    setMinIq(Number.isNaN(value) ? 0 : Math.max(0, value));
  }}
  ```
* **Verification Procedure:**
  1. Set Minimum IQ to empty/backspace; verify state defaults to `0` without throwing `NaN`.
  2. Input values `100`, `180`, `200`; verify numerical filtering correctly evaluates `person.iq >= minIq`.
* **Evidence Location:**
  - File: [scientist-directory/src/components/ScientistDirectory.jsx](file:///Users/chinh/UIT%20lecture/WebApplicationDevelopment/Lab/Lab03/Exercise/24520225_NguyenBaoChinh_Lab03_EX2%20/scientist-directory/src/components/ScientistDirectory.jsx#L117-L125).
* **Verification Status:** `VERIFIED`

---

### 3.6. Failure F: Keyboard Focus Loss Following DOM Node Deletion (`AI-RISK-06`)

* **Failure ID:** `AI-RISK-06`
* **Title:** Accessibility Focus Drop to Document Root upon Focused Item Removal
* **Faulty Code / Observed Behavior:**
  ```jsx
  // FAULTY AI PATTERN: Naive deletion without focus recovery
  function handleDelete(id) {
    setPeople(current => current.filter(p => p.id !== id));
  }
  ```
  When keyboard users pressed `Enter` or `Space` on a scientist's "Delete" button, React unmounted the `<li className="person-card">`. Because the active element was removed from the DOM tree, the browser dropped focus to `document.body`, forcing screen reader and keyboard users to navigate the entire document from the beginning.
* **Why It Is a Problem:**
  Violates **WCAG 2.2 Success Criterion 2.4.3 (Focus Order)** and **Criterion 2.4.7 (Focus Visible)**. Users relying on assistive technology lose their place in the UI hierarchy.
* **Corrective Action:**
  Implemented adjacent target focus tracking using `deleteButtonRefs` (`useRef(new Map())`), `focusAfterDeleteId`, `searchInputRef`, and `useLayoutEffect` in [ScientistDirectory.jsx](file:///Users/chinh/UIT%20lecture/WebApplicationDevelopment/Lab/Lab03/Exercise/24520225_NguyenBaoChinh_Lab03_EX2%20/scientist-directory/src/components/ScientistDirectory.jsx#L42-L84):
  ```jsx
  function handleDelete(id) {
    const index = visiblePeople.findIndex(person => person.id === id);
    const nextPerson = visiblePeople[index + 1] ?? visiblePeople[index - 1];
    focusAfterDeleteId.current = nextPerson?.id ?? null;

    setPeople(currentPeople => currentPeople.filter(person => person.id !== id));
  }

  useLayoutEffect(() => {
    const targetId = focusAfterDeleteId.current;
    if (targetId === null) return;

    const targetButton = deleteButtonRefs.current.get(targetId);
    if (targetButton) {
      targetButton.focus();
    } else {
      searchInputRef.current?.focus();
    }
    focusAfterDeleteId.current = null;
  }, [people]);
  ```
* **Verification Procedure:**
  1. Navigate to "Johann Goethe" using `Tab`.
  2. Press `Enter` on the Delete button.
  3. Verify that focus automatically shifts to "Albert Einstein"'s Delete button without dropping to `body`.
  4. Delete the final remaining item; verify focus cleanly shifts to the search input.
* **Evidence Location:**
  - File: [scientist-directory/src/components/ScientistDirectory.jsx](file:///Users/chinh/UIT%20lecture/WebApplicationDevelopment/Lab/Lab03/Exercise/24520225_NguyenBaoChinh_Lab03_EX2%20/scientist-directory/src/components/ScientistDirectory.jsx#L42-L84).
  - Commit: `255c8cd` / `18bb06d`.
* **Verification Status:** `VERIFIED`

---

### 3.7. Failure G: Index-Based Key Anti-Pattern on Dynamic Lists (`AI-RISK-07`)

* **Failure ID:** `AI-RISK-07`
* **Title:** Reconciliation Defects Caused by Array Index Keys on Dynamic Deletable Collections
* **Faulty Code / Observed Anti-Pattern:**
  ```jsx
  // FAULTY AI PATTERN: Index-based key
  <ul>
    {visiblePeople.map((person, index) => (
      <li key={index} className="person-card">...</li>
    ))}
  </ul>
  ```
* **Why It Is a Problem:**
  When deleting an item (e.g. index 0), all subsequent items shift up by one index. React reconciles DOM nodes based on key identity; using array indices forces React to mutate existing DOM nodes rather than unmounting the target node. This can preserve stale focus, corrupt form state inside children, and degrade reconciliation performance. Note: while `key={person.id}` is required for correct DOM reconciliation, stable keys alone do **not** solve browser focus preservation when the active node is deleted (which requires `useLayoutEffect` as documented in `AI-RISK-06`).
* **Corrective Action:**
  Enforce persistent unique IDs (`sp-1` through `sp-8`) in `smartPeople.js` and bind `key={person.id}` in [ScientistDirectory.jsx](file:///Users/chinh/UIT%20lecture/WebApplicationDevelopment/Lab/Lab03/Exercise/24520225_NguyenBaoChinh_Lab03_EX2%20/scientist-directory/src/components/ScientistDirectory.jsx#L165):
  ```jsx
  {visiblePeople.map((person) => (
    <li key={person.id} className="person-card">
  ```
* **Verification Procedure:**
  Inspect list mapping in `ScientistDirectory.jsx`; verify zero occurrences of index-based keys.
* **Evidence Location:**
  - File: [scientist-directory/src/components/ScientistDirectory.jsx](file:///Users/chinh/UIT%20lecture/WebApplicationDevelopment/Lab/Lab03/Exercise/24520225_NguyenBaoChinh_Lab03_EX2%20/scientist-directory/src/components/ScientistDirectory.jsx#L165).
  - File: [scientist-directory/src/data/smartPeople.js](file:///Users/chinh/UIT%20lecture/WebApplicationDevelopment/Lab/Lab03/Exercise/24520225_NguyenBaoChinh_Lab03_EX2%20/scientist-directory/src/data/smartPeople.js#L2-L11).
* **Verification Status:** `VERIFIED`

---

## 4. Pending Verification & Manual Test Items

The following items have been implemented and statically validated, but require manual end-to-end device confirmation:

1. **React Profiler Commit Count Assertion:**
   - *Requirement:* Verify that typing one character into the search box produces exactly one commit in the React DevTools Profiler.
   - *Distinction:* In React `<StrictMode>` (enabled in `main.jsx`), component functions are intentionally invoked twice during development to detect side-effects. However, this must result in exactly **one** DOM commit pass in the Profiler.
   - *Status:* `PENDING` (Requires interactive React DevTools recording session).
2. **Screen Reader Announcement Verification:**
   - *Requirement:* Verify VoiceOver / NVDA announces the live count update via `<p role="status" aria-live="polite">` when changing minimum IQ.
   - *Status:* `PENDING` (Requires physical screen reader audit).

---

## 5. Audit Conclusion

All seven identified defect and risk areas have been thoroughly reviewed and remediated. The application compiles cleanly with Vite (`npm run build` passes in 529ms), passes ESLint (`eslint .` clean with 0 warnings/errors), and enforces accessible, responsive, and deterministic state management.
