# TASK_DECOMPOSITION.md

## Homework 1: Production Enterprise Data-Grid (WCAG 2.2 AA)

**Course:** Web Application Development (Lab 02 — Homework 1)  
**Student:** Nguyen Bao Chinh (MSSV: 24520225)  
**Project:** Production Enterprise Data-Grid Component System  
**Timeline:** 1-Week Production Engineering Sprint  
**Deliverables:** Full-featured accessible Data-Grid (`DataGrid<T>`), strict generic contracts (`data-grid-contract.ts`), 2D roving tabindex keyboard navigation, multi-column sorting, instant filtering, windowed pagination, WCAG 2.2 AA (4.5:1+ contrast & focus appearance), verified 100/100 Lighthouse score, and zero "div-soup" native table semantics.

---

## 1. Sprint Overview & Milestone Roadmap

The objective of Homework 1 is to build an industrial-strength, enterprise-grade accessible Data-Grid component system in React and TypeScript. In contrast to naive UI libraries relying on nested generic `<div>` containers ("div-soup") or brittle keyboard handlers, this implementation enforces strict W3C WAI-ARIA Authoring Practices (APG) Grid Pattern semantics, zero XSS vulnerability, deterministic 2D roving tabindex navigation, and 100/100 Lighthouse audit scores.

```text
+---------------------------------------------------------------------------------------------------+
|                           HOMEWORK 1: 1-WEEK PRODUCTION SPRINT ROADMAP                            |
|                                                                                                   |
| [Day 1]  Phase 1: Strict Generic Data Contract & ARIA Invariant Design (`data-grid-contract.ts`) |
| [Day 2]  Phase 2: Semantic HTML5 Structure & "Zero Div-Soup" Tree (`DataGrid.tsx`)                |
| [Day 3]  Phase 3: 2D Spatial Roving Tabindex & Keyboard Navigation Engine (APG Pattern)           |
| [Day 4]  Phase 4: High-Performance Data Pipeline (Filtering, Multi-Sort, Windowed Pagination)    |
| [Day 5]  Phase 5: WCAG 2.2 Level AA Contrast System & Focus Appearance Tokens (`DataGrid.css`)  |
| [Day 6]  Phase 6: Enterprise Demo Harness & Live Region Status Announcements (`App.tsx`)         |
| [Day 7]  Phase 7: Lighthouse 100/100 Audit, Screen Reader Verification & Engineering Audit        |
+---------------------------------------------------------------------------------------------------+
```

---

## 2. Work Breakdown Structure (WBS)

### Phase 1: Strict Generic Data Contract & ARIA Invariant Design (Day 1)
* **Goal:** Define strict generic TypeScript interfaces governing column metadata, grid properties, and accessibility invariants without any `any` leakage.
* **Component:** [data-grid-contract.ts](file:///Users/chinh/UIT%20lecture/WebApplicationDevelopment/Lab/Lab02/Homework/24520225_NguyenBaoChinh_Lab02_HW1/src/data-grid-contract.ts)
* **Detailed Specifications:**
  - Define `ColumnDef<T>`:
    ```typescript
    export interface ColumnDef<T> {
      header: string;
      accessorKey: keyof T;
      sortable?: boolean;
    }
    ```
  - Define `DataGridProps<T>`:
    ```typescript
    export interface DataGridProps<T> {
      data: T[];
      columns: ColumnDef<T>[];
      onRowSelect?: (item: T) => void;
      ariaLabel: string;
    }
    ```
  - **Invariant Guarantee:** The component strictly conforms to the ARIA Grid pattern (`role="grid"`, `role="row"`, `role="columnheader"`, `role="gridcell"`).

---

### Phase 2: Semantic HTML5 Structure & "Zero Div-Soup" Architecture (Day 2)
* **Goal:** Replace all non-semantic container anti-patterns with native HTML5 table elements, ensuring structural accessibility across all assistive technologies.
* **Component:** [DataGrid.tsx](file:///Users/chinh/UIT%20lecture/WebApplicationDevelopment/Lab/Lab02/Homework/24520225_NguyenBaoChinh_Lab02_HW1/src/DataGrid.tsx) & [index.html](file:///Users/chinh/UIT%20lecture/WebApplicationDevelopment/Lab/Lab02/Homework/24520225_NguyenBaoChinh_Lab02_HW1/index.html)
* **Implementation Tasks:**
  1. Root Landmark: Wrap data-grid in `<section className="dg-wrapper" aria-label="...">` with semantic `<header role="toolbar">` and `<nav aria-label="Table pagination">`.
  2. Native Table Hierarchy:
     - Root table: `<table role="grid" aria-rowcount={...} aria-colcount={...} className="dg-table">`
     - Header group: `<thead>` enclosing `<tr role="row" aria-rowindex={1}>`
     - Column Headers: `<th scope="col" role="columnheader" aria-colindex={colIdx + 1}>`
     - Body rows: `<tbody>` enclosing `<tr role="row" aria-rowindex={...} aria-selected={isSelected}>`
     - Data cells: `<td role="gridcell" aria-colindex={colIdx + 1}>`
  3. Interactive Controls: Use semantic `<button type="button">` for sort triggers and pagination controls. Never use clickable `<div>` or `<span>`.

---

### Phase 3: 2D Spatial Roving Tabindex & Keyboard Navigation Engine (Day 3)
* **Goal:** Implement the W3C ARIA APG Grid roving tabindex pattern allowing keyboard-only users to navigate two-dimensional grid coordinates seamlessly.
* **Component:** [DataGrid.tsx](file:///Users/chinh/UIT%20lecture/WebApplicationDevelopment/Lab/Lab02/Homework/24520225_NguyenBaoChinh_Lab02_HW1/src/DataGrid.tsx)
* **Implementation Tasks:**
  1. Coordinate Model: Maintain single coordinate state `focusedCoord: { row: number; col: number }`:
     - `row = 0`: Header row (`<thead>`).
     - `row = 1..N`: Body rows corresponding to visible page items (`paginatedData`).
  2. Dynamic Roving Tabindex:
     - Only the currently focused cell receives `tabIndex={0}`.
     - All other cells receive `tabIndex={-1}`.
     - When focusing a cell containing an interactive sort button, delegate focus into the button or keep container cell focus synchronized.
  3. Keystroke Dispatcher (`handleKeyDown`):
     - `ArrowRight`: Move coordinate `col + 1`, bounded by `columns.length - 1`.
     - `ArrowLeft`: Move coordinate `col - 1`, bounded by `0`.
     - `ArrowDown`: Move coordinate `row + 1`, bounded by `paginatedData.length`.
     - `ArrowUp`: Move coordinate `row - 1`, bounded by `0`.
     - `Home`: Jump directly to column `0` on the current row.
     - `End`: Jump directly to column `columns.length - 1` on the current row.
     - `Enter`: Trigger selection callback `onRowSelect?.(rowItem)`.
     - `Space`: Toggle row selection state in `selectedRowIds` Set and update `aria-selected`.

---

### Phase 4: High-Performance Data Pipeline (Day 4)
* **Goal:** Construct a reactive, memoized data transformation pipeline with deterministic execution order: Filtering $\rightarrow$ Sorting $\rightarrow$ Pagination.
* **Component:** [DataGrid.tsx](file:///Users/chinh/UIT%20lecture/WebApplicationDevelopment/Lab/Lab02/Homework/24520225_NguyenBaoChinh_Lab02_HW1/src/DataGrid.tsx)
* **Implementation Tasks:**
  1. Real-Time Filtering (`filteredData`):
     - Case-insensitive search across all configured column accessors.
     - Fast return for empty search query.
     - Search input rendered with `type="search"`, labeled via `htmlFor={searchInputId}`.
     - Automatically resets `currentPage` to 1 and `focusedCoord` to `{ row: 0, col: 0 }` on filter changes.
  2. Multi-Direction Sorting (`sortedData`):
     - Sort state: `sortConfig: { key: keyof T | null; direction: 'ascending' | 'descending' }`.
     - Toggle cycle: Ascending $\rightarrow$ Descending $\rightarrow$ Ascending on re-click.
     - Reflect state to assistive technology via `aria-sort="ascending" | "descending" | "none"`.
  3. Windowed Pagination (`paginatedData`):
     - Compute `totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize))`.
     - Slice data based on `(currentPage - 1) * pageSize`.
     - Disable Previous button on page 1; disable Next button on final page.
     - Announce total items and active page via accessible status elements.
  4. Live Region Announcements:
     - `<output id={liveRegionId} className="sr-only" aria-live="polite" aria-atomic="true">` announcing dynamic record counts and page shifts.

---

### Phase 5: WCAG 2.2 Level AA Contrast System & Focus Appearance (Day 5)
* **Goal:** Design a custom tokenized CSS color palette exceeding WCAG 2.2 AA contrast thresholds ($\ge 4.5:1$ for normal text, $\ge 3:1$ for UI boundaries), paired with prominent focus indicators.
* **Component:** [DataGrid.css](file:///Users/chinh/UIT%20lecture/WebApplicationDevelopment/Lab/Lab02/Homework/24520225_NguyenBaoChinh_Lab02_HW1/src/DataGrid.css)
* **Implementation Tasks:**
  1. Design Tokens:
     - Primary text `--text-primary: #111827` on white surface: **16.5:1** contrast.
     - Secondary text `--text-secondary: #374151` on white surface: **10.3:1** contrast.
     - Border color `--border-color: #6b7280` on white surface: **4.8:1** contrast.
     - Row selected text `--row-selected-text: #1e3a8a` on selected background `#dbeafe`: **8.9:1** contrast.
     - Primary button `--btn-bg: #1e40af` with white text: **8.7:1** contrast.
     - Disabled button text `--btn-disabled-text: #4b5563` on `#e5e7eb`: **5.7:1** contrast.
  2. WCAG 2.2 Focus Appearance (SC 2.4.11 / 2.4.13):
     - Focus ring `--focus-ring: #1d4ed8` (contrast **8.5:1**).
     - Applied via `:focus-visible` with `outline: 3px solid var(--focus-ring)` and `outline-offset: -3px`.
  3. Screen Reader Utility:
     - Zero-dimension clipped `.sr-only` class ensuring screen reader readability without visual distortion.

---

### Phase 6: Enterprise Demo Harness & Integration (Day 6)
* **Goal:** Assemble an enterprise employee directory test fixture validating generic type parametrization, row inspection callbacks, and interactive keyboard selection.
* **Component:** [App.tsx](file:///Users/chinh/UIT%20lecture/WebApplicationDevelopment/Lab/Lab02/Homework/24520225_NguyenBaoChinh_Lab02_HW1/src/App.tsx)
* **Implementation Tasks:**
  1. Type Schema: Define `EmployeeRecord` (`id`, `name`, `department`, `role`, `status`).
  2. Mock Data Set: Populate diverse records across IT, AppSec, Data Science, DevOps, QA, and Frontend Platform.
  3. Column Definitions: Configure sortable flags for `id`, `name`, `department`, `status`, and non-sortable for `role`.
  4. Inspection Panel: Render active record preview container when `activeRecord` is selected via Enter key, wired with `aria-live="polite"`.

---

### Phase 7: Verification, Lighthouse Audit & Engineering Documentation (Day 7)
* **Goal:** Perform automated and manual audits across all compliance gates, verify 100/100 Lighthouse score, and author comprehensive audit documentation.
* **Artifacts:** [AI_FAILURE_AUDIT.md](file:///Users/chinh/UIT%20lecture/WebApplicationDevelopment/Lab/Lab02/Homework/24520225_NguyenBaoChinh_Lab02_HW1/AI_FAILURE_AUDIT.md), [TASK_DECOMPOSITION.md](file:///Users/chinh/UIT%20lecture/WebApplicationDevelopment/Lab/Lab02/Homework/24520225_NguyenBaoChinh_Lab02_HW1/TASK_DECOMPOSITION.md), [PROJECT_STRUCTURE.md](file:///Users/chinh/UIT%20lecture/WebApplicationDevelopment/Lab/Lab02/Homework/24520225_NguyenBaoChinh_Lab02_HW1/PROJECT_STRUCTURE.md)
* **Verification Protocols:**
  - Automated Lighthouse CI run verifying 100/100 Accessibility and 100/100 Best Practices.
  - Keyboard navigation matrix test (Arrow traversal, Enter inspection, Space selection).
  - DOM security audit confirming zero `dangerouslySetInnerHTML` or `innerHTML` injections (CWE-79 immunity).

---

## 3. Risk Assessment & Mitigation Matrix

| # | Identified Risk | Severity | Root Cause | Engineering Mitigation |
|:---:|:---|:---:|:---|:---|
| **R1** | **XSS Injection via Cell Content** | Critical | Untrusted database records rendered using raw HTML string interpolation. | Enforce native JSX text node interpolation `{String(item[col.accessorKey] ?? '')}` to guarantee automatic DOM text escaping. |
| **R2** | **Keyboard Focus Trapping / Coordinate Overflow** | High | Unbounded index arithmetic when navigating across filtered or truncated page boundaries. | Clamp 2D coordinates strictly to `[0, paginatedData.length]` and `[0, columns.length - 1]`; reset coordinate on search and pagination change. |
| **R3** | **Loss of Screen Reader Context ("Div-Soup")** | High | Using generic `<div>` grids lacking columnheader and row relationships. | Enforce native `<table>`, `<thead>`, `<tbody>`, `<th>`, `<td>` with ARIA grid roles (`grid`, `row`, `columnheader`, `gridcell`). |
| **R4** | **Sub-par Color Contrast (< 4.5:1)** | Medium | Subtle gray borders or text failing WCAG 2.2 AA standards. | Calibrate color palette using audited tokens: text at 16.5:1 and 10.3:1, selected text at 8.9:1, borders at 4.8:1. |
| **R5** | **Live Region Noise Flooding** | Medium | Continuous `aria-live="assertive"` announcements on every keystroke. | Use `aria-live="polite"` on `<output>` with `aria-atomic="true"`, batching updates only upon calculated page or record transitions. |

---

## 4. Definition of Done (DoD) Checklist

- [x] **Contract Compliance:** `ColumnDef<T>` and `DataGridProps<T>` implemented with full generic type safety in [data-grid-contract.ts](file:///Users/chinh/UIT%20lecture/WebApplicationDevelopment/Lab/Lab02/Homework/24520225_NguyenBaoChinh_Lab02_HW1/src/data-grid-contract.ts).
- [x] **Zero Div-Soup:** 100% native semantic HTML5 table structure (`<table>`, `<thead>`, `<tbody>`, `<th scope="col">`, `<button>`).
- [x] **W3C ARIA APG Grid Semantics:** Explicit `role="grid"`, `role="row"`, `role="columnheader"`, `role="gridcell"`, `aria-rowcount`, `aria-colcount`, `aria-rowindex`, `aria-colindex`, `aria-sort`, `aria-selected`.
- [x] **2D Roving Tabindex:** Single `tabIndex={0}` active cell, seamless navigation with Up/Down/Left/Right arrow keys, Home, End, Enter (select), and Space (toggle).
- [x] **Data Processing Pipeline:** Real-time multi-field filter, multi-state sorting, and windowed pagination with page boundary guards.
- [x] **WCAG 2.2 AA Contrast & Focus:** All text elements exceed 4.5:1 contrast; 3px high-visibility focus ring conforms to SC 2.4.11/2.4.13.
- [x] **Lighthouse Score:** Verified 100/100 on Accessibility and 100/100 on Best Practices.
- [x] **Security Audit:** Zero `innerHTML` vulnerabilities; complete analysis documented in [AI_FAILURE_AUDIT.md](file:///Users/chinh/UIT%20lecture/WebApplicationDevelopment/Lab/Lab02/Homework/24520225_NguyenBaoChinh_Lab02_HW1/AI_FAILURE_AUDIT.md).
