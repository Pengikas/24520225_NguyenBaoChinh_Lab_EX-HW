# HW 3: High-Concurrency Flash-Sale E-Commerce Engine

**Student Name:** Nguyen Bao Chinh  
**Student ID (MSSV):** 24520225  
**Course:** Web Application Development (Lab 02 - HW 3)  
**Evaluation Scope:** Vietnam Mega-Sale 11.11 Simulation, Zero-Drift Countdown Timer, Optimistic Inventory Lock FSM, Concurrency Bot Flood, AI Failure Audit.

---

## 🎯 Project Overview & Architectural Specifications

This application implements **HW 3: High-Concurrency Flash-Sale E-Commerce Engine**, engineered specifically for high-traffic Vietnam e-commerce mega-sales (Shopee / Lazada 11.11 Midnight Flash Sale simulation).

### 1. Zero-Drift Countdown Timer (`src/anti-drift-timer.ts`)
- Implements the exact precision anti-drift countdown specification using `requestAnimationFrame` and `Date.now()` delta:
  ```typescript
  export function createAntiDriftTimer(durationMs: number, onTick: (remaining: number) => void) {
    const targetTime = Date.now() + durationMs;
    let rafId: number;

    function tick() {
      const remaining = Math.max(0, targetTime - Date.now());
      onTick(remaining);
      if (remaining > 0) {
        rafId = requestAnimationFrame(tick); // Zero drift compared to setInterval
      }
    }
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }
  ```
- **Zero-Drift Invariant:** Recalculates `Math.max(0, targetTime - Date.now())` on every frame. Even if background tab throttling occurs or long tasks block the main thread, the timer instantly synchronizes with the true wall clock with **0 ms cumulative drift**.
- **Side-by-Side Empirical Telemetry Benchmark:** Features a live comparison with standard `setInterval(100ms)` displaying real-time accumulated drift (ms).
- **CPU Throttling Simulator Button:** Includes an interactive tool that executes a 300ms synchronous CPU workload (`blockMainThreadSync(300)`), visibly proving that `setInterval` falls behind by ~300ms while the Zero-Drift Timer stays 100% accurate.

### 2. Optimistic Inventory Lock Finite State Machine (`src/inventory-state-machine.ts`)
- Models optimistic inventory leasing as a deterministic Finite State Machine (FSM):
  - **`AVAILABLE`**: Product units in stock ready for customer reservation.
  - **`RESERVED`**: Optimistically locked by customer with a 30-second lease token (`lockId`). Stock is deducted from available and held in reserved pool.
  - **`CHECKING_OUT`**: Customer has initiated checkout modal.
  - **`PURCHASED`**: Payment confirmed, lock converted to finalized order, stock permanently decremented.
  - **`LOCK_EXPIRED`**: 30-second lease timeout elapsed without payment. Held stock is automatically returned to available pool.
  - **`CANCELLED`**: User voluntarily released the lock.
  - **`OUT_OF_STOCK`**: Available stock reaches 0 and no reservations remain.
- **Stock Conservation Invariant:**
  $$\text{totalStock} = \text{availableStock} + \text{reservedStock} + \text{soldStock}$$
  $$\text{availableStock} \ge 0 \quad (\text{Strict Zero Overselling Guarantee})$$

### 3. Concurrency Engine & Bot Flood Simulator (`src/concurrency-engine.ts`)
- Simulates sudden traffic spikes (10, 25, 50, 100 concurrent bot workers) attacking limited inventory (e.g. 5 iPhone 16 Pro Max units).
- **Optimistic Concurrency Control (OCC):** Uses version vectors to detect conflicts and return `409 Conflict` on race conditions, or `410 Gone` when items are sold out.
- **Live Concurrency Terminal Log:** Displays millisecond-level timestamps, thread identifiers (`bot-worker-012`), status codes (200, 409, 410, 408), and state machine versions.

### 4. Vietnam 11.11 Flash-Sale Experience (`src/App.tsx`, `src/products-data.ts`)
- Realistic catalog: Apple iPhone 16 Pro Max, Sony WH-1000XM5 ANC, NuPhy Air75 V2, Lock&Lock 5.2L Air Fryer, Biti's Hunter Street x VietMax, Dyson V12 Detect Slim.
- Prices in VND (`₫`), flash sale discount badges (-50% to -70%), live stock meter bars, and interactive claimable vouchers (`SHOPEE1111`, `FREESHIPEXTRA`, `MIDNIGHTVIP`).
- Checkout modal with interactive payment method selection (MoMo, VNPay, ShopeePay, COD).

### 5. Mandatory AI Failure Mode Audit (`AI_FAILURE_AUDIT.md`)
- Covers the Top 3 Classic AI Failure Modes in UI Development:
  1. **Security:** Raw `innerHTML` ingestion (XSS) -> refactored to React JSX virtual DOM escaping and `replaceChildren()`.
  2. **Memory Leaks:** Zombie timers and event listeners without unmounting cleanup -> refactored with explicit teardown functions and `cancelAnimationFrame()`.
  3. **Phantom Keys:** Volatile `key={Math.random()}` triggering full DOM destruction on 60fps renders -> refactored to stable deterministic domain keys (`key={product.id}`).

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3001](http://localhost:3001) in your browser.

### 3. Build for Production
```bash
npm run build
```

### 4. Preview Production Build
```bash
npm run preview
```

---

## 🧪 Automated Telemetry & Test Suite

The application includes an automated verification suite in [`src/telemetry-verifier.ts`](file:///Users/chinh/UIT%20lecture/WebApplicationDevelopment/Lab/Lab02/Homework/24520225_NguyenBaoChinh_Lab02_HW3/src/telemetry-verifier.ts) that runs on application mount and logs empirical proof to the Chrome DevTools Console:
- **`runConcurrencyInvariantTest(5, 50)`**: Dispatches 50 concurrent workers against 5 stock units, proving that exactly 5 succeed, 45 receive conflict rejections, and oversell violations remain strictly 0.
- **`benchmarkTimerDrift(1500, 50)`**: Calculates cumulative drift over 1500ms, proving `setInterval` drifts by tens of milliseconds while the Anti-Drift Timer maintains 0 ms drift.
