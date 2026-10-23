# TASK_DECOMPOSITION.md

## Homework 3: High-Concurrency Flash-Sale E-Commerce Engine

**Course:** Web Application Development (Lab 02 — Homework 3)  
**Student:** Nguyen Bao Chinh (MSSV: 24520225)  
**Project:** High-Concurrency Flash-Sale E-Commerce Engine  
**Timeline:** 1-Week Production Engineering Sprint  
**Deliverables:** High-precision Zero-Drift Countdown Timer using `requestAnimationFrame` and `Date.now()` delta, Optimistic Inventory Lock Finite State Machine (`InventoryLockFSM`) preventing overselling under extreme concurrency, distributed Concurrency Engine & Bot Flood Simulator (`ConcurrencyEngine`), live empirical telemetry benchmark comparing RAF timer vs drift-prone `setInterval` with CPU throttling simulator, Vietnam 11.11 Mega-Sale storefront interface with checkout flow, automated invariant verification suite (`telemetry-verifier.ts`), and comprehensive AI Failure Mode Audit (`AI_FAILURE_AUDIT.md`).

---

## 1. Sprint Overview & Milestone Roadmap

The objective of Homework 3 is to architect and deliver an enterprise-grade flash-sale e-commerce simulation designed to withstand extreme traffic spikes during Vietnam Mega-Sale campaigns (e.g., Shopee / Lazada 11.11 Midnight Flash Sales). The architecture addresses three central computer science and web engineering challenges:
1. **Clock Drift & Main-Thread Blocking:** Standard JavaScript timers (`setInterval`) drift significantly under UI workloads, garbage collection passes, and background tab throttling. A zero-drift synchronization mechanism is required to guarantee synchronized countdowns down to the exact millisecond across all clients.
2. **High-Concurrency Race Conditions & Stock Conservation:** Simulating thousands of simultaneous bot and human checkout requests against ultra-scarce inventory (e.g., 5 iPhone 16 Pro Max units) without overselling, deadlocks, or phantom inventory leaks.
3. **Optimistic Locking & Finite State Machine (FSM):** Enforcing atomic inventory reservation tokens with auto-expiring 30-second leases to prevent inventory hoarding while maintaining mathematical stock conservation at all times.

```text
+---------------------------------------------------------------------------------------------------+
|                           HOMEWORK 3: 1-WEEK PRODUCTION SPRINT ROADMAP                            |
|                                                                                                   |
| [Day 1]  Phase 1: Precision Anti-Drift Countdown Timer Engine (`anti-drift-timer.ts`)              |
| [Day 2]  Phase 2: Optimistic Inventory Lock Finite State Machine (`inventory-state-machine.ts`)  |
| [Day 3]  Phase 3: High-Concurrency Engine & Bot Flood Simulator (`concurrency-engine.ts`)         |
| [Day 4]  Phase 4: Vietnam 11.11 Mega-Sale Catalog & Domain Modeling (`products-data.ts`, `types`) |
| [Day 5]  Phase 5: Flash-Sale Dashboard, Checkout Modal & Concurrency Console (`App.tsx`, CSS)      |
| [Day 6]  Phase 6: Automated Telemetry Suite & Invariant Stress Testing (`telemetry-verifier.ts`)  |
| [Day 7]  Phase 7: AI Failure Mode Audit, DevTools Profiling & Final Conventional Commits Packaging |
+---------------------------------------------------------------------------------------------------+
```

---

## 2. Work Breakdown Structure (WBS)

### Phase 1: Precision Anti-Drift Countdown Timer Engine (Day 1)
* **Goal:** Implement the high-precision zero-drift countdown timer, provide an unmount disposal contract, and build a drift-prone `setInterval` counterpart for empirical comparison.
* **Component:** [src/anti-drift-timer.ts](file:///Users/chinh/UIT%20lecture/WebApplicationDevelopment/Lab/Lab02/Homework/24520225_NguyenBaoChinh_Lab02_HW3/src/anti-drift-timer.ts)
* **Implementation Tasks:**
  1. **Zero-Drift Timer Implementation:** Implement `createAntiDriftTimer(durationMs, onTick)` strictly adhering to the assignment specification:
     ```typescript
     export function createAntiDriftTimer(durationMs: number, onTick: (remaining: number) => void): () => void {
       const targetTime = Date.now() + durationMs;
       let rafId: number;
       let isCancelled = false;

       function tick() {
         if (isCancelled) return;
         const remaining = Math.max(0, targetTime - Date.now());
         onTick(remaining);
         if (remaining > 0) {
           rafId = requestAnimationFrame(tick);
         }
       }
       rafId = requestAnimationFrame(tick);
       return () => {
         isCancelled = true;
         cancelAnimationFrame(rafId);
       };
     }
     ```
  2. **Mathematical Drift Invariance:** Ensure `remaining = Math.max(0, targetTime - Date.now())` recalculates against absolute system wall-clock time on every frame, achieving **0 ms cumulative drift** even when frames drop.
  3. **Comparative Drift-Prone Timer:** Implement `createDriftProneIntervalTimer()` using naive `setInterval` with fixed decrements to measure and visualize accumulated drift in milliseconds under real browser loads.
  4. **High-Precision Formatting Utility:** Implement `formatCountdown(ms)` returning `{ hours, minutes, seconds, milliseconds, totalFormatted, shortFormatted }` with zero allocation overhead.
  5. **Synchronous CPU Blocking Simulator:** Implement `blockMainThreadSync(blockMs = 300)` executing a heavy busy-wait loop to prove that `setInterval` falls behind by ~300ms while `createAntiDriftTimer` immediately recovers with zero drift.

---

### Phase 2: Optimistic Inventory Lock Finite State Machine (Day 2)
* **Goal:** Architect a deterministic Finite State Machine (FSM) enforcing optimistic inventory reservation, 30-second lease timeouts, and stock conservation invariants.
* **Component:** [src/inventory-state-machine.ts](file:///Users/chinh/UIT%20lecture/WebApplicationDevelopment/Lab/Lab02/Homework/24520225_NguyenBaoChinh_Lab02_HW3/src/inventory-state-machine.ts)
* **Implementation Tasks:**
  1. **FSM State Space Definition:** Model the 7 discrete states:
     - `AVAILABLE`: Product units in stock ready for customer reservation.
     - `RESERVED`: Optimistically locked by customer with a 30-second lease token (`lockId`). Stock is decremented from available and held in reserved pool.
     - `CHECKING_OUT`: Customer has opened the payment modal.
     - `PURCHASED`: Payment confirmed, lock converted to finalized order, stock permanently moved to sold pool.
     - `LOCK_EXPIRED`: 30-second lease timeout elapsed without payment. Held stock is automatically returned to available pool.
     - `CANCELLED`: User voluntarily released the lock.
     - `OUT_OF_STOCK`: Available stock reaches 0 and no reservations remain.
  2. **Transition Protocol:** Implement `transition(event: FSMEvent): FSMTransitionResult`:
     - `ACQUIRE_LOCK`: Guards against `availableStock <= 0` (returns `410 Gone`). Decrements available, increments reserved, advances optimistic version, schedules auto-expiry timer, returns `200 OK` with `InventoryLockLease`.
     - `START_CHECKOUT`: Verifies lease validity and expiration. Transitions state to `CHECKING_OUT`.
     - `COMPLETE_PURCHASE`: Clears lease timer, decrements reserved stock, increments sold stock, advances version, transitions to `PURCHASED`.
     - `EXPIRE_LOCK`: Triggered by auto-expiry timer. Clears lease, decrements reserved stock, returns stock to `availableStock += 1`, transitions to `LOCK_EXPIRED` (status `408 Request Timeout`).
     - `RELEASE_LOCK`: User cancels reservation. Clears timer, restores stock to available pool, transitions to `CANCELLED`.
  3. **Stock Conservation Invariant:** Enforce at all times:
     $$\text{totalStock} = \text{availableStock} + \text{reservedStock} + \text{soldStock}$$
     $$\text{availableStock} \ge 0, \quad \text{reservedStock} \ge 0$$
  4. **Memory Leak Prevention:** Implement `destroy()` to clear all active `window.setTimeout` timers, subscribers, and lease references upon unmount.

---

### Phase 3: High-Concurrency Engine & Bot Flood Simulator (Day 3)
* **Goal:** Build the central orchestration layer managing multiple product FSMs, order persistence, telemetry logging, and hyper-concurrent bot attack simulations.
* **Component:** [src/concurrency-engine.ts](file:///Users/chinh/UIT%20lecture/WebApplicationDevelopment/Lab/Lab02/Homework/24520225_NguyenBaoChinh_Lab02_HW3/src/concurrency-engine.ts)
* **Implementation Tasks:**
  1. **Multi-Product FSM Registry:** Initialize and map `InventoryLockFSM` instances for each product in the catalog.
  2. **Optimistic Concurrency Control (OCC) Pipeline:**
     - Expose `requestReservation()`, `startCheckout()`, `completePurchase()`, and `releaseReservation()`.
     - Return standardized HTTP-like response status codes (`200 OK`, `409 Conflict`, `410 Gone`, `408 Request Timeout`, `404 Not Found`).
  3. **High-Throughput Bot Flood Simulator:**
     - Implement `simulateBotFlood(productId, botCount, arrivalWindowMs)`.
     - Dispatch concurrent asynchronous worker tasks with randomized artificial micro-jitter (0–20ms) attacking scarce product inventory (e.g., 5 items).
     - Calculate peak RPS (Requests Per Second) and track successful locks vs 409/410 rejections.
  4. **Ring-Buffer Concurrency Telemetry Log:**
     - Maintain an in-memory chronological event log formatted with millisecond precision (`HH:MM:SS.mmm`), thread identifiers (`bot-worker-042`), action types, status codes, and state versions.
     - Cap log size at 250 entries to prevent memory bloat and garbage collection latency.
  5. **Telemetry Aggregator:** Record `totalRequests`, `successfulReservations`, `conflicts409`, `lockTimeouts`, `completedOrders`, and `oversellViolations`.

---

### Phase 4: Vietnam 11.11 Mega-Sale Catalog & Domain Modeling (Day 4)
* **Goal:** Define strict TypeScript domain interfaces and construct a realistic Vietnam e-commerce flash-sale product catalog with flash discounts and vouchers.
* **Components:** [src/types.ts](file:///Users/chinh/UIT%20lecture/WebApplicationDevelopment/Lab/Lab02/Homework/24520225_NguyenBaoChinh_Lab02_HW3/src/types.ts), [src/products-data.ts](file:///Users/chinh/UIT%20lecture/WebApplicationDevelopment/Lab/Lab02/Homework/24520225_NguyenBaoChinh_Lab02_HW3/src/products-data.ts)
* **Implementation Tasks:**
  1. **Domain Type Definitions:** Define strict types for `LockState`, `ProductInventory`, `InventoryLockLease`, `OrderRecord`, `ConcurrencyLogEntry`, and `ConcurrencyMetrics`.
  2. **Realistic Vietnam Product Catalog:**
     - iPhone 16 Pro Max 256GB Desert Titanium (Stock: 5, 34.990.000₫ -> 24.493.000₫, -30%)
     - Sony WH-1000XM5 ANC (Stock: 8, 8.490.000₫ -> 4.245.000₫, -50%)
     - NuPhy Air75 V2 Mechanical Keyboard (Stock: 12, 2.890.000₫ -> 1.734.000₫, -40%)
     - Nồi Chiên Không Dầu Lock&Lock 5.2L (Stock: 15, 3.250.000₫ -> 975.000₫, -70%)
     - Giày Biti's Hunter Street x VietMax (Stock: 20, 1.299.000₫ -> 649.500₫, -50%)
     - Dyson V12 Detect Slim (Stock: 4, 19.990.000₫ -> 11.994.000₫, -40%)
  3. **Voucher System:** Define claimable Vietnam mega-sale promotional voucher codes (`SHOPEE1111`, `FREESHIPEXTRA`, `MIDNIGHTVIP`).

---

### Phase 5: Flash-Sale Dashboard, Checkout Modal & Concurrency Console (Day 5)
* **Goal:** Assemble the full interactive application UI with Shopee/Lazada aesthetic, live stock meters, real-time drift telemetry HUD, and checkout flow.
* **Components:** [src/App.tsx](file:///Users/chinh/UIT%20lecture/WebApplicationDevelopment/Lab/Lab02/Homework/24520225_NguyenBaoChinh_Lab02_HW3/src/App.tsx), [src/App.css](file:///Users/chinh/UIT%20lecture/WebApplicationDevelopment/Lab/Lab02/Homework/24520225_NguyenBaoChinh_Lab02_HW3/src/App.css)
* **Implementation Tasks:**
  1. **Top Flash-Sale Banner & Countdown HUD:** Render live countdown ticker displaying `HH:MM:SS:mmm` driven by `createAntiDriftTimer` with zero frame lag.
  2. **Side-by-Side Telemetry Benchmark Panel:** Display real-time drift metrics comparing the Anti-Drift Timer against standard `setInterval`, featuring the interactive CPU Throttling simulator button (`blockMainThreadSync(300)`).
  3. **Product Flash-Sale Grid:** Display dynamic stock progress bars, discount badges, and atomic "Reserve Flash Deal (30s Lock)" action buttons.
  4. **Active Reservations & Checkout Modal:** Provide real-time lease countdown progress, payment method selector (MoMo, VNPay, ShopeePay, COD), and order confirmation.
  5. **Interactive Bot Flood Trigger:** Allow users to choose bot concurrency levels (10, 25, 50, 100 bots) and fire simultaneous flood attacks against any product.
  6. **Live Concurrency Terminal Console:** Real-time log stream showing thread activity, status codes, and atomic state transitions.
  7. **Styling & Aesthetics:** Implement responsive dark glassmorphism aesthetic with high-contrast Vietnamese e-commerce color cues (Shopee orange `#ee4d2d`, neon gold `#facc15`, emerald `#10b981`, and danger red `#ef4444`).

---

### Phase 6: Automated Telemetry Suite & Invariant Stress Testing (Day 6)
* **Goal:** Implement an automated test runner that runs on application mount and outputs empirical verification proofs to the browser console.
* **Component:** [src/telemetry-verifier.ts](file:///Users/chinh/UIT%20lecture/WebApplicationDevelopment/Lab/Lab02/Homework/24520225_NguyenBaoChinh_Lab02_HW3/src/telemetry-verifier.ts)
* **Implementation Tasks:**
  1. **Automated Concurrency Invariant Test:**
     - Implement `runConcurrencyInvariantTest(totalStock = 5, concurrentWorkers = 100)`.
     - Automatically verify that exactly 5 workers succeed, 95 workers receive conflict rejections, and `oversellViolations === 0`.
  2. **Empirical Timer Drift Benchmark:**
     - Implement `benchmarkTimerDrift(durationMs = 1500, checkIntervalMs = 50)`.
     - Quantify drift accumulation over 1500ms and print comparative metrics table to DevTools console.
  3. **Automated Console Telemetry:** Group and format test results using styled `console.group()` and color-coded verification badges.

---

### Phase 7: AI Failure Mode Audit, DevTools Profiling & Packaging (Day 7)
* **Goal:** Produce the mandatory 15% evaluation audit report detailing 3 classic AI flaws, verify memory safety with Chrome DevTools, and finalize conventional commits.
* **Components:** [AI_FAILURE_AUDIT.md](file:///Users/chinh/UIT%20lecture/WebApplicationDevelopment/Lab/Lab02/Homework/24520225_NguyenBaoChinh_Lab02_HW3/AI_FAILURE_AUDIT.md), [README.md](file:///Users/chinh/UIT%20lecture/WebApplicationDevelopment/Lab/Lab02/Homework/24520225_NguyenBaoChinh_Lab02_HW3/README.md)
* **Implementation Tasks:**
  1. **AI Failure Audit Documentation:** Detail the Top 3 AI Failure Modes:
     - *Flaw 1 (Security):* Raw `innerHTML` / `dangerouslySetInnerHTML` injection (CWE-79 XSS) -> Refactored to React JSX virtual DOM text escaping and `Element.replaceChildren()`.
     - *Flaw 2 (Memory Safety):* Zombie timers and event listeners without cleanup -> Refactored with explicit teardown functions and `cancelAnimationFrame()`.
     - *Flaw 3 (Performance):* Volatile `key={Math.random()}` triggering 60fps DOM thrashing -> Refactored to stable deterministic domain identifiers (`key={product.id}`).
  2. **Memory Heap Snapshot Verification:** Profile application heap in Chrome DevTools to ensure zero detached DOM trees or orphaned timers.
  3. **Conventional Commits & Git Packaging:** Adhere to minimum 8 discrete conventional commits across feature, refactor, and documentation milestones.

---

## 3. Risk Assessment & Architectural Mitigation Matrix

| # | Risk Category | Failure Mode / Threat Scenario | Impact Severity | Architectural Mitigation Strategy | Verification & Quality Gate |
|---|---|---|---|---|---|
| **R1** | **Timer Precision** | Background tab throttling or long-running CPU tasks cause `setInterval` countdown to lag behind true wall clock. | **Critical** (Flash sale countdown desynchronization, early/late checkout exploits) | Use `requestAnimationFrame` and dynamically recompute delta against absolute `targetTime = Date.now() + durationMs` on every tick. | CPU Throttling Simulator button (`blockMainThreadSync(300)`) proving 0ms drift in `telemetry-verifier.ts`. |
| **R2** | **Concurrency & Stock** | Simultaneous checkout requests from bot networks result in negative inventory (overselling). | **Catastrophic** (Financial loss, unfulfillable orders) | Finite State Machine (`InventoryLockFSM`) with atomic reservation transitions and version checks. | `runConcurrencyInvariantTest(5, 100)` asserting `oversellViolations === 0` and stock conservation. |
| **R3** | **Inventory Hoarding** | Users reserve scarce items but abandon the checkout flow, locking inventory indefinitely. | **High** (Artificial stock starvation, lost revenue) | Auto-expiring 30-second lease tokens (`lockTimers`). Unclaimed stock is automatically rolled back to `availableStock`. | Automated timer expiry transition tests (`EXPIRE_LOCK`) returning status `408 Request Timeout`. |
| **R4** | **Memory Leaks** | High-frequency timers and log arrays cause memory bloat and eventual browser tab crash. | **High** (Browser freezing, high garbage collection latency) | Explicit lifecycle disposal hooks in `useEffect`, `InventoryLockFSM.destroy()`, and capped 250-item log ring buffer. | Chrome DevTools Heap Snapshot comparison showing zero retained orphaned timers or closures. |
| **R5** | **DOM Performance** | Rapid millisecond countdown updates cause full React DOM re-renders and UI stutter. | **Medium** (Poor user experience, dropped frames below 60fps) | Decouple timer callbacks from unrelated component trees; use deterministic stable React keys (`key={product.id}`). | Chrome DevTools Performance Profiler verifying 60fps frame rate without paint flashing. |
| **R6** | **Security (XSS)** | AI-generated code introduces unescaped string injection in product notices and user names. | **Critical** (Account takeover, malicious script injection) | Complete ban on `innerHTML` and `dangerouslySetInnerHTML`; use typed React JSX text nodes and DOM text nodes. | Static code audit and synthetic payload injection tests documented in `AI_FAILURE_AUDIT.md`. |

---

## 4. Definition of Done (DoD) Checklist

- [x] **Zero-Drift Countdown Timer:** Implemented in `src/anti-drift-timer.ts` using `requestAnimationFrame` and `Date.now()` delta.
- [x] **Comparative Telemetry Benchmark:** Live side-by-side comparison with `setInterval` displaying cumulative drift in milliseconds.
- [x] **CPU Throttling Simulator:** Interactive button executing `blockMainThreadSync(300)` demonstrating immediate timer recovery.
- [x] **Optimistic Inventory Lock FSM:** 7 discrete states (`AVAILABLE`, `RESERVED`, `CHECKING_OUT`, `PURCHASED`, `LOCK_EXPIRED`, `CANCELLED`, `OUT_OF_STOCK`) with 30-second lease timeout.
- [x] **Strict Stock Conservation Invariant:** Verified mathematically:
  $$\text{totalStock} = \text{availableStock} + \text{reservedStock} + \text{soldStock}$$
- [x] **Zero-Oversell Guarantee:** Under 100 concurrent bot workers against 5 stock units, exactly 5 reservations succeed and 0 overselling occurs.
- [x] **Concurrency Engine & Bot Flood Simulator:** Supports 10, 25, 50, and 100 bot flood simulations with real-time RPS tracking.
- [x] **Live Concurrency Terminal Log:** Formatted with millisecond timestamps, thread IDs, action types, and HTTP status codes (200, 409, 410, 408).
- [x] **Vietnam 11.11 Flash-Sale Experience:** Realistic Vietnamese product catalog with VND currency formatting, discount badges, and voucher codes.
- [x] **Interactive Checkout Modal:** Support for multiple payment methods (MoMo, VNPay, ShopeePay, COD) with order generation.
- [x] **Automated Telemetry Test Suite:** Mount-time execution of `runConcurrencyInvariantTest` and `benchmarkTimerDrift` logging to DevTools console.
- [x] **AI Failure Mode Audit (`AI_FAILURE_AUDIT.md`):** Comprehensive documentation of 3 AI flaws (XSS, zombie timers, phantom keys) with CVSS scores, reproduction steps, and refactored code.
- [x] **Conventional Commits:** Clean Git commit history adhering to the Conventional Commits specification.
