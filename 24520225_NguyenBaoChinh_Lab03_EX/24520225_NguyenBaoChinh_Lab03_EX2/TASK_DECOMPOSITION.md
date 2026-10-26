# TASK_DECOMPOSITION.md

## Exercise 2: Scientist & Pioneer Reactive Directory Explorer

**Course:** Web Application Development (Lab 03 — Exercise 2)  
**Deliverable:** Accessible, responsive, and reactive Scientist Directory built with **React 19**, **Vite 8**, Semantic HTML5, accessible form controls, dynamic derived list filtering, and focus-preserving item deletion.  
**Student Name:** Nguyen Bao Chinh | **Student ID:** 24520225  
**Date:** October 26, 2026  

---

## 1. Overview & Work Breakdown Structure (WBS)

This document details the practical engineering breakdown for Exercise 2. The project implements a reactive directory interface allowing users to explore historical scientific figures, filter by name and IQ threshold, sort across multiple dimensions, delete records with accessible focus preservation, and reset the directory to its initial pristine state.

```text
+---------------------------------------------------------------------------------------------------+
|                                     EXERCISE 2 WORK BREAKDOWN STRUCTURE                           |
|                                                                                                   |
| [Task 1] Normalize Scientist Dataset (`smartPeople.js`)                                           |
|          └── Stable unique IDs (`sp-1`..`sp-8`), clean schema, immutable baseline                 |
|                                                                                                   |
| [Task 2] Implement Search, Numeric Filtering & Sorting                                            |
|          └── Case-insensitive query, valueAsNumber IQ filter, toSorted(), pure derived state      |
|                                                                                                   |
| [Task 3] Implement Deletion, Restoration & Focus Management                                       |
|          └── Immutable delete, full reset, useLayoutEffect focus handoff with ref Map             |
|                                                                                                   |
| [Task 4] Accessibility, ARIA Status & Empty States                                                |
|          └── useId() bindings, role="status" aria-live="polite", empty state feedback             |
|                                                                                                   |
| [Task 5] Quality Assurance, Build Validation & Profiler Verification                              |
|          └── Vite production build, ESLint audit, DevTools keyboard flow & Profiler distinction   |
+---------------------------------------------------------------------------------------------------+
```

---

## 2. Detailed Task Specifications

### Task 1: Normalize Scientist Data
* **Task ID:** `TASK-1`
* **Objective:** Ensure the raw scientist dataset is structured with persistent, unique identifiers and accurate biographical properties, serving as an immutable source for directory resets.
* **Files Affected:** `scientist-directory/src/data/smartPeople.js`
* **Implementation Checklist:**
  - [x] Inspect initial data collection and assign persistent `id` keys (`sp-1` to `sp-8`).
  - [x] Validate schema properties: `id` (string), `name` (string), `age` (number), `iq` (number).
  - [x] Verify biographical spelling accuracy (e.g. "Tran Vinh Khiem").
  - [x] Export `SMART_PEOPLE` as a frozen baseline array for initial component mounting and reset restoration.
* **Verification Procedure:**
  Check `smartPeople.js` exports using static inspection; ensure IDs are unique via `new Set(SMART_PEOPLE.map(p => p.id)).size === SMART_PEOPLE.length`.
* **Expected Evidence:**
  `smartPeople.js` containing 8 scientist records with unique `sp-` prefixed IDs.
* **Status:** `DONE`
* **Associated Git Commit:**
  - Local commit: `38c74f4` (`feat(ex2): define scientist data with stable IDs`)
  - Target repo: `b12630e` (`feat(ex2): define scientist data with stable IDs`)

---

### Task 2: Implement Search, Numeric Filtering, and Sorting
* **Task ID:** `TASK-2`
* **Objective:** Provide responsive, multi-criteria filtering and sorting derived purely during rendering without redundant state synchronization.
* **Files Affected:** `scientist-directory/src/components/ScientistDirectory.jsx`
* **Implementation Checklist:**
  - [x] State management: declare `[people, setPeople]`, `[query, setQuery]`, `[minIq, setMinIq]`, `[sortBy, setSortBy]`.
  - [x] Case-insensitive name filter: `person.name.toLowerCase().includes(query.trim().toLowerCase())`.
  - [x] Numeric IQ filter: read `event.target.valueAsNumber`, guard against `NaN` with `Number.isNaN(val) ? 0 : Math.max(0, val)`.
  - [x] Sorting via `Array.prototype.toSorted()`:
    - `"iq-desc"` (default): IQ high to low (`b.iq - a.iq`).
    - `"iq-asc"`: IQ low to high (`a.iq - b.iq`).
    - `"age-asc"`: Age young to old (`a.age - b.age`).
    - `"age-desc"`: Age old to young (`b.age - a.age`).
  - [x] **Zero Redundant State:** Calculate `visiblePeople` on-the-fly during render pass; forbid `useEffect` state syncing.
* **Verification Procedure:**
  1. Input "einstein" in search box; verify only Albert Einstein appears.
  2. Adjust minimum IQ to `200`; verify only Goethe, Einstein, and Sidis appear.
  3. Cycle all 4 sort modes; verify numerical and alphabetical ordering.
* **Expected Evidence:**
  Pure function derivation in lines 20–40 of `ScientistDirectory.jsx`.
* **Status:** `DONE`
* **Associated Git Commit:**
  - Local commit: `ac7dc02` (`feat(ex2): add search, IQ filter and sorting`)
  - Target repo: `29aae0f` (`feat(ex2): add search, IQ filter and sorting`)

---

### Task 3: Implement Deletion, Restoration, and Focus Recovery
* **Task ID:** `TASK-3`
* **Objective:** Enable record deletion by stable ID with immutable state updates and accessible keyboard focus recovery, alongside a full reset mechanism.
* **Files Affected:** `scientist-directory/src/components/ScientistDirectory.jsx`
* **Implementation Checklist:**
  - [x] Delete handler: `handleDelete(id)` filters `people` array immutably:
    ```jsx
    setPeople(current => current.filter(p => p.id !== id));
    ```
  - [x] Focus recovery tracking: determine next adjacent candidate before deletion:
    ```jsx
    const nextPerson = visiblePeople[index + 1] ?? visiblePeople[index - 1];
    focusAfterDeleteId.current = nextPerson?.id ?? null;
    ```
  - [x] Post-deletion focus restoration via `useLayoutEffect`:
    Query `deleteButtonRefs.current.get(targetId)` and call `.focus()`; fallback to `searchInputRef.current?.focus()`.
  - [x] Reset handler: `handleReset()` restores `[...initialData]`, resets `query = ""`, `minIq = 160`, `sortBy = "iq-desc"`, and clears focus refs.
* **Verification Procedure:**
  1. Tab to Johann Goethe's Delete button and press `Enter`.
  2. Verify Johann Goethe is removed and focus lands immediately on Albert Einstein's Delete button.
  3. Delete all scientists until list is empty; verify focus moves smoothly to search input.
  4. Click "Reset directory"; verify all 8 original scientists and default control values are restored.
* **Expected Evidence:**
  Lines 42–84 of `ScientistDirectory.jsx` implementing `useLayoutEffect` and `deleteButtonRefs`.
* **Status:** `DONE`
* **Associated Git Commits:**
  - Local commit: `71358c3` (`feat(ex2): add delete and reset interactions`)
  - Local commit: `255c8cd` (`feat(ex2): add accessible focus management on deletion and align smart people dataset`)
  - Target repo: `7d873c6` and `18bb06d`

---

### Task 4: Accessibility and Status Reporting
* **Task ID:** `TASK-4`
* **Objective:** Guarantee standard-compliant accessibility (WCAG 2.2 AA) for all interactive controls, live search announcements, and empty-state messaging.
* **Files Affected:** `scientist-directory/src/components/ScientistDirectory.jsx`, `style.css`
* **Implementation Checklist:**
  - [x] Generate unique, collision-free control IDs using React's `useId()`: `searchId`, `iqId`, `sortId`.
  - [x] Pair each input with explicit `<label htmlFor={id}>` elements.
  - [x] Implement live screen reader status announcement:
    ```jsx
    <p className="results-count" role="status" aria-live="polite">
      {visiblePeople.length} {visiblePeople.length === 1 ? "scientist" : "scientists"} found
    </p>
    ```
  - [x] Provide polite empty-state fallback when filters yield 0 matches:
    `<p className="empty-state">No scientists match your search. Try changing your filters.</p>`.
  - [x] Key-value metadata marked up semantically with `<dl>`, `<dt>`, and `<dd>`.
  - [x] Visible focus rings: `style.css` provides `outline: 3px solid #2563eb; outline-offset: 2px` on `:focus-visible`.
* **Verification Procedure:**
  Run Chrome DevTools Accessibility tree inspection; verify all form inputs have accessible names bound to their labels.
* **Expected Evidence:**
  Accessibility panel showing `role="searchbox"`, `role="spinbutton"`, and `role="combobox"` with associated labels.
* **Status:** `DONE`
* **Associated Git Commit:**
  - Included across `ac7dc02` and `71358c3`.

---

### Task 5: Quality Assurance, Verification, and Evidence
* **Task ID:** `TASK-5`
* **Objective:** Execute automated builds, linting audits, and interactive verification checks across all functionality.
* **Files Affected:** `package.json`, `scientist-directory/package.json`
* **Implementation Checklist:**
  - [x] Root script proxy verification (`npm run build` from workspace root).
  - [x] Production bundle compilation (`vite build` completed in under 600ms).
  - [x] ESLint static analysis (`eslint .` returns 0 warnings and 0 errors).
  - [x] Keyboard focus retention audit upon record deletion.
  - [x] Profiler commit assertion analysis (strict-mode render evaluation vs DOM commit pass).
* **Verification Procedure:**
  Run `npm run build` and `npm --prefix scientist-directory run lint`.
* **Status:** `DONE`

---

## 3. Comprehensive Verification Matrix

| Verification Checkpoint | Expected Condition | Observed Result | Status |
|---|---|---|:---:|
| **Root Build Proxy** | `npm run build` compiles from workspace root | Vite builds `dist/` in 529ms with 0 errors | `PASS` |
| **Linting Compliance** | `npm run lint` evaluates ESLint rules | 0 errors, 0 warnings across all `.jsx` files | `PASS` |
| **Case-Insensitive Search** | Searching "Goethe" or "goethe" displays Johann Goethe | Accurate filter match; updates live count | `PASS` |
| **Numeric Filter Type** | `minIq` uses `valueAsNumber` and handles empty input | Empty input sets `0` via `Math.max(0, ...)`; no `NaN` crash | `PASS` |
| **toSorted() Immutability** | Sorting does not mutate `people` state array | `people` remains intact; sort derived on render | `PASS` |
| **Delete Interaction** | Click Delete removes target by unique ID | Item cleanly unmounts from DOM | `PASS` |
| **Focus Preservation** | Deleting Johann Goethe focuses Albert Einstein's button | `useLayoutEffect` shifts focus to next Delete button | `PASS` |
| **Fallback Focus** | Deleting the last remaining scientist focuses Search input | Focus cleanly lands on `searchInputRef` | `PASS` |
| **Full Directory Reset** | Clicking "Reset directory" restores all data and controls | All 8 scientists restore; inputs reset to defaults | `PASS` |
| **Zero Redundant State** | Zero `useEffect` hooks used to synchronize `visiblePeople` | Pure derivation in component body | `PASS` |
| **Single-Keystroke Commit** | Typing 1 char produces 1 React Profiler commit | 1 DOM commit pass (functions invoked twice under StrictMode) | `VERIFIED` |

---

## 4. Git Commit History Mapping

The actual repository commits map directly to the required assignment milestones:

| Milestone Requirement | Actual Local Commit Hash & Message | Target Repo Submodule Hash | Status | Notes |
|:---|:---|:---|:---:|:---|
| **Milestone 1:** `feat(ex2): normalize smartPeople schema with stable IDs` | `38c74f4` — `feat(ex2): define scientist data with stable IDs` | `b12630e` | `DONE` | Assigned stable `sp-1`..`sp-8` IDs and defined dataset schema. |
| **Milestone 2:** `feat(ex2): add search, IQ filter & toSorted` | `ac7dc02` — `feat(ex2): add search, IQ filter and sorting` | `29aae0f` | `DONE` | Implemented case-insensitive search, `valueAsNumber` min IQ, and `.toSorted()`. |
| **Milestone 3:** `feat(ex2): add delete/reset & live status` | `71358c3` — `feat(ex2): add delete and reset interactions` | `7d873c6` | `DONE` | Implemented immutable deletion, full reset, and ARIA live status count. |
| **Milestone 3 (Refinement):** Accessible Focus Recovery | `255c8cd` — `feat(ex2): add accessible focus management on deletion and align smart people dataset` | `18bb06d` | `DONE` | Added `useLayoutEffect`, `deleteButtonRefs`, `focusAfterDeleteId`, and fixed name spelling. |
