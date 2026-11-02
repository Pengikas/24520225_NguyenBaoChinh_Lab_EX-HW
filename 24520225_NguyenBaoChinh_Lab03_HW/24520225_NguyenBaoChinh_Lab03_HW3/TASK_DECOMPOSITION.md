# TASK_DECOMPOSITION.md — HW3 Implementation & Verification Plan

**Project:** HW3: KRAFTON x PUBG Vietnam Championship & Airdrop Arena  
**Student:** Nguyen Bao Chinh (MSSV: 24520225)  
**Course:** Web Application Development — Lab 03 Homework 3  
**Workspace:** `24520225_NguyenBaoChinh_Lab03_HW3/`  

---

## Milestone Summary Overview

| Milestone | Scope | Git / Working-Tree Status | Status |
|---|---|---|---|
| **M0** | Repository Inspection, Lab 2 Reuse Map & Flash-Sale Removal | `7ba66d9` + working-tree cleanup (`D src/products-data.ts`) | **Verified** |
| **M1** | Zero-Drift Airdrop Timer (`usePubgAirdropTimer`, `PubgAirdropTimer`) | `2679ceb` + working-tree phase & `createAntiDriftTimer` upgrade | **Verified (Build & Runtime)** |
| **M2** | Optimistic Crate/Ticket Claim, `Map<dropId, claimId>` Lock & 409 Rollback | Working tree (`src/hooks/usePubgCrateClaim.ts`, `src/services/pubg-claim-service.ts`, `src/components/Pubg*`) | **Verified (Build & Runtime)** |
| **M3** | PUBG Vietnam Leaderboard & Live Kill-Feed | Working tree (`src/components/PubgLeaderboard.tsx`, `src/components/PubgKillFeed.tsx`, `src/data/pubg-leaderboard-data.ts`) | **Verified (Build & Runtime)** |
| **M4** | AI Failure Mode Audit (`AI_FAILURE_AUDIT.md`) | Working tree (`AI_FAILURE_AUDIT.md`) | **Implemented (Manual Screenshots Pending)** |
| **M5** | Full PUBG UI Redesign, TypeScript Check & Production Build QA | Working tree (`index.html`, `src/App.tsx`, `src/App.css`, `dist/`) | **Verified (`tsc` & `vite build` Pass)** |
| **M6** | Final Documentation & Manual Submission Packaging | Working tree (`*.md`) | **Ready for Manual Screenshots & Git Commit** |

---

## M0 — Repository Inspection, Lab 2 Reuse & E-Commerce Domain Removal

### Objectives
Inspect the Lab 2 Flash-Sale baseline (`7ba66d9`), preserve reusable engineering logic (`createAntiDriftTimer`, `formatCountdown`, `InventoryLockFSM`), upgrade to React `19.3.1`, and completely remove obsolete 11.11 e-commerce UI, products, vouchers, customer/shipping/payment states, and checkout modals from the rendered application.

### Source Files
- Preserved Lab 2 modules: `src/anti-drift-timer.ts`, `src/inventory-state-machine.ts`, `src/concurrency-engine.ts`, `src/telemetry-verifier.ts`, `src/types.ts`
- Removed obsolete e-commerce catalog: `src/products-data.ts`
- Refactored shell: `index.html`, `src/App.tsx`, `src/App.css`

### Implementation Tasks
- [x] Inspect all source files, dependencies (`react@19.3.1`, `typescript@5.6.3`, `vite@5.4`), and Git history (`7ba66d9`, `2679ceb`).
- [x] Map reusable Lab 2 functions (`createAntiDriftTimer`, `formatCountdown`, `InventoryLockFSM` invariants) to HW3 modules.
- [x] Remove all Flash Sale headings, consumer electronics SKUs, vouchers, BUY NOW actions, shipping/payment fields, and checkout modals from `src/App.tsx` and `index.html`.
- [x] Delete `src/products-data.ts` after verifying zero remaining imports.
- [x] Audit `dist/` production bundle to confirm `0` Flash Sale strings remain.

### Acceptance Criteria
- Zero Flash Sale products, vouchers, or checkout modals appear anywhere in the rendered DOM or compiled `dist/` bundle.
- `src/anti-drift-timer.ts` is actively imported and reused by the HW3 countdown module.

---

## M1 — Zero-Drift Airdrop Timer

### Objectives
Implement `usePubgAirdropTimer(targetEpochMs, serverOffsetMs)` and `PubgAirdropTimer` anchored to an absolute epoch using `Math.max(0, targetEpochMs - (Date.now() + serverOffsetMs))`, reusing Lab 2's `createAntiDriftTimer` and `formatCountdown`, supporting `visibilitychange` resynchronization, and displaying `WARMUP`, `AIRDROP_LIVE`, `LOOTED_OUT`, and `EXPIRED` states.

### Source Files
- `src/anti-drift-timer.ts`
- `src/hooks/usePubgAirdropTimer.ts`
- `src/components/PubgAirdropTimer.tsx`

### Implementation Tasks
- [x] Reuse `createAntiDriftTimer()` (`requestAnimationFrame` + wall-clock delta) inside `usePubgAirdropTimer`.
- [x] Compute remaining milliseconds strictly via `Math.max(0, targetEpochMs - (Date.now() + serverOffsetMs))`.
- [x] Support `serverOffsetMs` clock-offset compensation and `targetEpochMs` prop resynchronization.
- [x] Resynchronize immediately on `document.addEventListener('visibilitychange', onWake)`.
- [x] Clean up `cancelAntiDrift()`, `window.clearInterval(timerId)`, and `document.removeEventListener('visibilitychange', onWake)` on unmount/re-sync.
- [x] Render `HH:MM:SS` via `formatCountdown` alongside `WARMUP`, `AIRDROP LIVE`, `LOOTED OUT`, and `EXPIRED` banners and phase verification presets.
- [ ] Capture manual browser DevTools screenshot of background-tab wake resynchronization.

---

## M2 — Optimistic Crate/Ticket Claim and 409 Rollback

### Objectives
Support *PVS Grand Finals VIP Tickets* (`500.000 ₫`) and *PUBG Vietnam G-Coin Crates* (`200.000 ₫`) with `vi-VN` VND formatting, synchronous `Map<string, string>` (`dropId -> claimId`) duplicate-click locking, optimistic `-1` stock deduction, simulated `800ms` async claim service with `AbortController` support, and automatic `+1` rollback on HTTP `409` conflicts or network failures (`503`).

### Source Files
- `src/types/pubg-vn-arena-contract.ts`
- `src/data/pubg-crates.ts`
- `src/services/pubg-claim-service.ts`
- `src/hooks/usePubgCrateClaim.ts`
- `src/components/PubgCrateCard.tsx`
- `src/components/PubgArenaMarketplace.tsx`

### Implementation Tasks
- [x] Format prices using `new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(priceVnd)`.
- [x] Implement synchronous `inFlightClaims = useRef<Map<string, string>>(new Map())` (`dropId -> claimId`) lock.
- [x] Generate unique `claimId` via `crypto.randomUUID()` and reject duplicate in-flight clicks for the same `dropId`.
- [x] Deduct `remainingStock - 1` optimistically and restore bounded `+1` stock on HTTP `409` Conflict or network failure (`503`).
- [x] Guard expired drops (`HTTP 408`) and exhausted stock (`HTTP 410 LOOTED_OUT`).
- [x] Wire `AbortController` + `AbortSignal` unmount/reset cancellation and `inventoryEpochRef` stale-result protection.
- [x] Release locks in `finally` and render stable `key={result.claimId}` telemetry items with transparent mock-service labeling.
- [ ] Capture manual browser screenshots of optimistic `-1` deduction, `LOCK: <claimId>` badge, and HTTP `409` rollback log.

---

## M3 — PUBG Vietnam Leaderboard and Kill-Feed

### Objectives
Render independent, accessible `PubgLeaderboard` and `PubgKillFeed` components for *The Expendables* (`te`), *Cerberus Esports* (`ces`), *Roy Esports* (`roy`), and *AGG* (`agg`) using non-mutating `useMemo` derivations, multi-metric sorting, combined kill-feed filters, empty-result states, and clear static-demo data labels.

### Source Files
- `src/data/pubg-leaderboard-data.ts`
- `src/components/PubgLeaderboard.tsx`
- `src/components/PubgKillFeed.tsx`

### Implementation Tasks
- [x] Include all four required Vietnamese squads (`te`, `ces`, `roy`, `agg`).
- [x] Implement squad filtering and sorting by `wwcdCount`, `placementPts`, and `killPts` in both `asc` and `desc` order via `[...filtered].sort(...)`.
- [x] Implement kill-feed squad filter + event filter (`ALL`, `KILL`, `KNOCK`, `ELIMINATION`) supporting combined filters and empty results (e.g., `AGG` + `KNOCK`).
- [x] Preserve `INITIAL_SQUAD_STANDINGS` and `INITIAL_KILL_FEED` without mutation.
- [x] Label static demo datasets clearly and use accessible `<label htmlFor>`, `<table>`, `<caption>`, and `aria-live="polite"` markup.
- [ ] Capture manual browser screenshots of sorting modes and combined kill-feed filters.

---

## M4 — AI Failure Mode Audit (`AI_FAILURE_AUDIT.md`)

### Implementation Tasks
- [x] Document 4 genuine AI failure modes caught during Lab 2 → HW3 development (Naive `setInterval` Drift, Missing `AbortController` Cleanup, Stale Closure Rollback & `Set` Lock / Index-Key Thrashing, and Module-Scope JSX / Nested `<main>` Landmark Violation).
- [x] Record exact root causes, observable symptoms, DevTools reproduction steps, and verified manual fixes applied in `src/`.
- [ ] Attach manual Chrome/React DevTools screenshots prior to final submission if required by submission portal.

---

## M5 & M6 — UI Redesign, Verification & Submission Readiness

### Implementation Tasks
- [x] Redesign `src/App.tsx`, `src/App.css`, and `index.html` into the 5-section dark-navy + PUBG gold/orange esports layout.
- [x] Pass `npx tsc --noEmit` with `0` errors.
- [x] Pass `npm run build` (`tsc && vite build`) with `0` errors (`dist/index.html` `1.28 kB`, `dist/assets/index-BexohGSk.css` `17.78 kB`, `dist/assets/index-BVLu2F2i.js` `245.90 kB`).
- [x] Verify SSR HTML output (`renderToStaticMarkup`), M1/M2/M3 Node v24 invariants, and `0` Flash Sale strings in `dist/`.
- [x] Update `AI_FAILURE_AUDIT.md`, `PROJECT_STRUCTURE.md`, and `TASK_DECOMPOSITION.md` to match the final codebase.
- [ ] Review `git status` / `git diff` and create manual Git commits when ready for submission.
