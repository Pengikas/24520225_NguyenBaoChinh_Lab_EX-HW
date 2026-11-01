# HW 3: KRAFTON x PUBG Vietnam Championship & Airdrop Arena

**Student Name:** Nguyen Bao Chinh  
**Student ID (MSSV):** 24520225  
**Course:** Web Application Development (Lab 03 - Homework 3)  
**Foundation:** Upgraded from Lab 02 HW3 (`High-Concurrency Flash-Sale E-Commerce Engine`)  
**Tech Stack:** React 19, TypeScript 5 (Strict), Vite 5, `usePubgAirdropTimer` Zero-Drift Hook, `InventoryLockFSM`, `ConcurrencyEngine`.

---

## 🎯 Project Overview & Domain Architecture

This project upgrades the Lab 02 Vietnam Flash-Sale application into the **KRAFTON x PUBG Vietnam Championship & Airdrop Arena** while preserving and reusing all core Lab 02 concurrency, state machine, and zero-drift timer foundations.

### 1. Strict Domain Contracts (`src/types.ts`)
Implements the exact Homework 3 PUBG domain contracts alongside the retained Lab 02 `InventoryLockFSM` contracts:

```typescript
export type DropPhase = 'WARMUP' | 'AIRDROP_LIVE' | 'LOOTED_OUT' | 'EXPIRED';

export interface PubgCrateDrop {
  readonly id: string;
  readonly title: string;
  readonly priceVnd: number;
  readonly remainingStock: number;
  readonly dropEpochMs: number;
}

export interface PubgVnSquadStanding {
  readonly squadId: string;
  readonly squadName: string;
  readonly wwcdCount: number;
  readonly placementPts: number;
  readonly killPts: number;
}
```
All currency amounts are formatted using `new Intl.NumberFormat('vi-VN')`.

### 2. Zero-Drift Airdrop & Ticket Countdown (`src/hooks/usePubgAirdropTimer.js` & `src/anti-drift-timer.ts`)
- Implements `usePubgAirdropTimer(targetEpochMs, serverOffsetMs = 0)` using absolute epoch delta `Math.max(0, targetEpochMs - (Date.now() + serverOffsetMs))` synchronized every `200ms` and immediately upon `document.addEventListener('visibilitychange', onWake)` when a background browser tab becomes `'visible'`.
- Retains Lab 02's `createAntiDriftTimer`, `createDriftProneIntervalTimer`, `formatCountdown`, and `blockMainThreadSync` for side-by-side empirical drift benchmarking.

### 3. Optimistic Crate/Ticket Claim & HTTP 409 Rollback (`src/concurrency-engine.ts` & `src/inventory-state-machine.ts`)
- Reuses Lab 02's `InventoryLockFSM` and `ConcurrencyEngine` to manage **PVS Grand Finals VIP Tickets** and **G-Coin Crates**.
- Decrements displayed inventory optimistically upon claim while locking the drop with an in-flight `claimId` to block duplicate clicks.
- Handles **HTTP 409 Conflict (`409 Looted Out`)** by automatically executing `RELEASE_LOCK` on the FSM to roll back the optimistic inventory decrement and restore exact stock conservation:
  $$\text{totalStock} = \text{availableStock} + \text{reservedStock} + \text{soldStock}, \quad \text{availableStock} \ge 0$$

### 4. PUBG Vietnam Leaderboard & Live Kill-Feed (`src/App.tsx` & `src/products-data.ts`)
- Tracks the 4 official squads using `PubgVnSquadStanding`:
  - **The Expendables** (`te`)
  - **Cerberus Esports** (`ces`)
  - **Roy Esports** (`ge`)
  - **AGG** (`agg`)
- Derives Total Points (`placementPts + killPts`), Kill Share %, and Rank during render (`useMemo`) without mutating the `PubgVnSquadStanding` contract or using redundant `useEffect` synchronization.
- Supports squad filtering (`ALL`, `te`, `ces`, `ge`, `agg`), search filtering, minimum WWCD filtering, and multi-column sorting (`TOTAL_PTS`, `KILL_PTS`, `PLACEMENT_PTS`, `WWCD`).
- Streams live tournament kill-feed events with `AbortController` teardown and stale-closure-free functional updates.

---

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Start development server (http://localhost:3001)
npm run dev

# Run TypeScript typecheck & production build
npm run build
```
