# AI Failure Mode Audit: KRAFTON x PUBG Vietnam Championship & Airdrop Arena

**Document Identifier:** `AI_FAILURE_AUDIT.md`  
**Project:** HW 3: KRAFTON x PUBG Vietnam Championship & Airdrop Arena  
**Course:** Web Application Development (Lab 03 - Homework 3)  
**Author / Student:** Nguyen Bao Chinh (MSSV: 24520225)  
**Foundation:** Upgraded from Lab 02 HW3 (`High-Concurrency Flash-Sale E-Commerce Engine`)  

---

## 1. Executive Summary

During the implementation and deliberate reproduction testing of **Homework 3: KRAFTON x PUBG Vietnam Championship & Airdrop Arena**, we audited the four core React 19 / TypeScript concurrency and timing failure categories specified in Image 4. Each failure mode was reproduced, inspected with Chrome DevTools and our automated telemetry verifier (`src/telemetry-verifier.ts`), and refactored into production-grade code:

1. **Failure #01: Stale Closures in PUBG Live Auto-Polling** — `setInterval` callback capturing initial `squadStandings` and `pollTickCount` from the mount closure (`[]`), overwriting live kill points with `initial + 1` on every tick.
2. **Failure #02: Redundant `useEffect` for Derived State** — Storing derived leaderboard `totalPts` (`placementPts + killPts`), filtered standings, and `DropPhase` in duplicate `useState` hooks synchronized via `useEffect`, causing extra render passes and transient frame desynchronization.
3. **Failure #03: Missing `AbortController` and Asynchronous Cleanup** — Unmounted or toggled live kill-feed polling and asynchronous optimistic crate claims continuing to resolve without `AbortController` cancellation or `window.clearInterval` / `removeEventListener` cleanup.
4. **Failure #04: Naive `setInterval` Countdown Drift** — Decrementing `remainingMs` by a fixed delta (`setRemainingMs(prev => prev - 200)`) instead of recalculating against `targetEpochMs - (Date.now() + serverOffsetMs)` and listening to `visibilitychange`.

---

## Failure #01: Stale Closures in PUBG Live Auto-Polling

- **Prompt:** `"Implement a 4.5-second auto-polling interval in React that simulates live PVS tournament eliminations, increments the attacker squad's killPts in squadStandings, and appends the new elimination event to killFeed."`
- **AI Code:**
  ```tsx
  // Problematic AI-generated auto-polling hook with stale closure
  useEffect(() => {
    if (!isLivePollingFeed) return;

    const timerId = window.setInterval(() => {
      // BUG: Captures `squadStandings`, `killFeed`, and `pollTickCount` from the initial render closure!
      const nextTick = pollTickCount + 1;
      setPollTickCount(nextTick);

      const updatedStandings = squadStandings.map((sq) =>
        sq.squadId === 'te' ? { ...sq, killPts: sq.killPts + 1 } : sq
      );
      setSquadStandings(updatedStandings);

      setKillFeed([newKillEvent, ...killFeed]);
    }, 4500);

    return () => window.clearInterval(timerId);
  }, [isLivePollingFeed]); // squadStandings, killFeed, pollTickCount omitted from deps
  ```
- **Bug:** Because the `useEffect` dependency array only includes `[isLivePollingFeed]` while the interval callback directly reads the outer state variables `squadStandings`, `killFeed`, and `pollTickCount`, the closure permanently captures their initial mount values (`pollTickCount = 0`, `The Expendables killPts = 114`). On tick #1, `te.killPts` becomes `114 + 1 = 115`. On tick #2 (4.5s later), the callback still reads the stale `114` from its lexical closure and sets `te.killPts` to `114 + 1 = 115` again, freezing the scoreboard after the first tick and wiping out previously prepended kill-feed entries.
- **DevTools Proof:**
  1. Opened Chrome DevTools **Components (React DevTools)** and **Sources** panel, placing a logpoint inside the `setInterval` callback: `console.log('Captured te.killPts:', squadStandings[0].killPts, 'Tick:', pollTickCount)`.
  2. Across 5 consecutive polling intervals (22.5 seconds), the console logged `Captured te.killPts: 114, Tick: 0` on every single tick.
  3. The DOM table cell `[data-testid="total-pts-te"]` incremented once from `182` to `183` and never advanced past `183`.
- **Engineering Fix:**
  Replaced direct lexical state reads with a mutable `useRef` counter (`pollCounterRef.current += 1`) and React functional state updaters (`setSquadStandings(prev => ...)` and `setKillFeed(prev => ...)`), wrapped in a stable `useCallback`:
  ```tsx
  // Corrected implementation in src/App.tsx
  const pollCounterRef = useRef<number>(0);

  const triggerLiveKillEvent = useCallback((forcedSquadId?: string) => {
    pollCounterRef.current += 1;
    const currentTick = pollCounterRef.current;
    setPollTickCount(currentTick);
    // ...
    // Functional state updates always receive the latest state snapshot `prev`
    setKillFeed((prev) => [newKill, ...prev.slice(0, 19)]);
    setSquadStandings((prev) =>
      prev.map((sq) =>
        sq.squadId === attackerSquadId
          ? {
              ...sq,
              killPts: sq.killPts + 1,
              placementPts: isWwcdFinisher ? sq.placementPts + 10 : sq.placementPts,
              wwcdCount: isWwcdFinisher ? sq.wwcdCount + 1 : sq.wwcdCount,
            }
          : sq
      )
    );
  }, []);
  ```
- **Commit:** `1231090` (`feat(ui): build KRAFTON PUBG Vietnam arena interface`)

---

## Failure #02: Redundant useEffect for Derived State

- **Prompt:** `"Filter and sort the PUBG Vietnam squad leaderboard by total points (placementPts + killPts), kill points, or WWCD count, and compute each crate's DropPhase ('WARMUP' | 'AIRDROP_LIVE' | 'LOOTED_OUT' | 'EXPIRED')."`
- **AI Code:**
  ```tsx
  // Problematic AI-generated derived state synchronization via useEffect
  const [filteredStandings, setFilteredStandings] = useState<PubgVnSquadStanding[]>([]);
  const [dropPhase, setDropPhase] = useState<DropPhase>('WARMUP');

  useEffect(() => {
    const next = squadStandings
      .filter((s) => selectedSquadFilter === 'ALL' || s.squadId === selectedSquadFilter)
      .sort((a, b) => (b.placementPts + b.killPts) - (a.placementPts + a.killPts));
    setFilteredStandings(next);
  }, [squadStandings, selectedSquadFilter, sortField]);

  useEffect(() => {
    if (remainingStock <= 0) setDropPhase('LOOTED_OUT');
    else if (isLive) setDropPhase('AIRDROP_LIVE');
    else setDropPhase('WARMUP');
  }, [remainingStock, isLive]);
  ```
- **Bug:** Storing purely derived values (`filteredStandings`, `totalPts = placementPts + killPts`, and `dropPhase`) inside separate `useState` hooks and synchronizing them inside `useEffect` violates React's unidirectional render model:
  1. Every filter click or 200ms timer tick triggers two full React render commits: Commit #1 renders with stale `filteredStandings` / stale `dropPhase`, then `useEffect` fires and calls `setState`, forcing Commit #2.
  2. For 1 frame after `remainingStock` hits `0`, `dropPhase` remains `'AIRDROP_LIVE'`, briefly leaving the claim button enabled on an already-looted crate.
  3. Furthermore, adding `totalPts` to `PubgVnSquadStanding` would violate the strict domain contract in Image 2.
- **DevTools Proof:**
  1. Recorded a profile in **React DevTools Profiler** while toggling squad filters (`ALL` -> `te` -> `ces`) and during countdown expiration (`remainingMs: 200 -> 0`).
  2. Observed cascaded double commits (`Commit #1: 1.8ms` followed immediately by `Commit #2: 1.6ms` with reason `"Hooks changed: State"`).
  3. Inspected `[data-testid="claim-btn-pubg-mythic-crate-01"]` during stock exhaustion: the button remained enabled for one intermediate render pass before `useEffect` updated `dropPhase` to `'LOOTED_OUT'`.
- **Engineering Fix:**
  Eliminated all redundant `useState` + `useEffect` pairs for derived values. Computed `dropPhase`, `filteredAndSortedStandings`, and `totalPts = sq.placementPts + sq.killPts` deterministically during render using `useMemo`:
  ```tsx
  // Corrected implementation in src/App.tsx
  const dropPhase: DropPhase = useMemo(() => {
    if (forceExpired) return 'EXPIRED';
    if (drop.remainingStock <= 0 && product.reservedStock <= 0) return 'LOOTED_OUT';
    if (!isLive) return 'WARMUP';
    if (drop.remainingStock <= 0) return 'LOOTED_OUT';
    return 'AIRDROP_LIVE';
  }, [forceExpired, drop.remainingStock, product.reservedStock, isLive]);

  const filteredAndSortedStandings = useMemo(() => {
    // Purely derived during render in a single pass
    const filtered = squadStandings.filter(/* ... */);
    return [...filtered].sort(/* ... */);
  }, [squadStandings, selectedSquadFilter, squadSearchQuery, minWwcdFilter, sortField, sortDirection]);
  ```
- **Commit:** `f5e7dd5` (`feat(types): define PUBG arena domain contracts`) and `1231090` (`feat(ui): build KRAFTON PUBG Vietnam arena interface`)

---

## Failure #03: Missing AbortController and Asynchronous Cleanup

- **Prompt:** `"Create a live kill-feed polling effect and an optimistic crate claim handler that communicates with the server and updates inventory state."`
- **AI Code:**
  ```tsx
  // Problematic AI-generated polling & async handler without AbortController or listener teardown
  useEffect(() => {
    if (isLivePollingFeed) {
      window.setInterval(async () => {
        const res = await fetchLiveKillFeedTick();
        setKillFeed((prev) => [res, ...prev]);
      }, 4500);
    }
  }, [isLivePollingFeed]); // BUG: Missing clearInterval, missing AbortController!
  ```
- **Bug:** When the user pauses auto-polling (`isLivePollingFeed` toggled from `true` to `false`) or when the component unmounts:
  1. Without returning a cleanup function calling `window.clearInterval(pollIntervalId)` and `abortController.abort()`, every toggle spawns an additional zombie `setInterval` timer running in parallel.
  2. In-flight asynchronous operations continue executing after unmount or pause, mutating state and leaking closures (`CWE-401`).
  3. Similarly, in `InventoryLockFSM`, failing to clear active 30s lease `setTimeout` handles upon `destroy()` leaves orphaned timers in memory.
- **DevTools Proof:**
  1. Opened Chrome DevTools **Memory** panel and **Performance** monitor.
  2. Toggled the Auto-Polling button ON/OFF 10 times with the flawed AI code: observed 10 concurrent interval timers firing simultaneously every 4.5s, multiplying kill-feed insertions by 10x.
  3. Took Heap Snapshots before and after unmount: observed retained `Timer` callbacks and uncollected `AbortSignal` / closure references.
- **Engineering Fix:**
  Enforced symmetric `AbortController` cancellation and interval/listener teardown across `App.tsx`, `usePubgAirdropTimer.js`, and `InventoryLockFSM.destroy()`:
  ```tsx
  // Corrected implementation in src/App.tsx
  useEffect(() => {
    if (!isLivePollingFeed) return;

    const abortController = new AbortController();
    const { signal } = abortController;

    const pollIntervalId = window.setInterval(() => {
      if (signal.aborted) return;
      triggerLiveKillEvent();
    }, 4500);

    return () => {
      abortController.abort();
      window.clearInterval(pollIntervalId);
    };
  }, [isLivePollingFeed, triggerLiveKillEvent]);
  ```
- **Commit:** `e67db84` (`feat(claim): implement optimistic crate and ticket claims`) and `1231090` (`feat(ui): build KRAFTON PUBG Vietnam arena interface`)

---

## Failure #04: Naive setInterval Countdown Drift

- **Prompt:** `"Write a React countdown hook usePubgAirdropTimer(targetEpochMs, serverOffsetMs) that counts down to 0 and returns { remainingMs, isLive }."`
- **AI Code:**
  ```javascript
  // Problematic AI-generated naive decrementing countdown hook
  export function usePubgAirdropTimer(targetEpochMs, serverOffsetMs = 0) {
    const [remainingMs, setRemainingMs] = useState(
      Math.max(0, targetEpochMs - (Date.now() + serverOffsetMs))
    );

    useEffect(() => {
      // BUG: Naive fixed 200ms subtraction accumulates event-loop lag & freezes in background tabs!
      const timerId = window.setInterval(() => {
        setRemainingMs((prev) => Math.max(0, prev - 200));
      }, 200);

      return () => window.clearInterval(timerId);
    }, [targetEpochMs, serverOffsetMs]);

    return { remainingMs, isLive: remainingMs === 0 };
  }
  ```
- **Bug:** Subtracting a constant `200` on each `setInterval` callback assumes `setInterval` fires with zero latency. In reality:
  1. Main-thread CPU blocking (e.g. heavy DOM rendering or GC pauses) delays macrotask execution, causing cumulative positive drift.
  2. When the user switches to another browser tab, Chromium throttles background `setInterval` timers to 1 tick per second (or suspends them entirely), causing the naive countdown to fall behind real wall-clock time by seconds or minutes and fail to unlock the airdrop at `targetEpochMs`.
- **DevTools Proof:**
  1. Executed our automated benchmark `benchmarkTimerDrift(600, 50)` in `src/telemetry-verifier.ts` and clicked the **"Inject 300ms Main-Thread CPU Lag (`blockMainThreadSync(300)`)"** button in the UI.
  2. DevTools Console logged:
     ```text
     [Timer Drift Telemetry Benchmark]
     Elapsed Wall Clock: 604ms
     setInterval Expected Ticks: 12, Actual: 11
     setInterval Cumulative Drift: +54ms
     Anti-Drift Timer Delta: 0ms (Direct Wall Clock Delta)
     ```
  3. After injecting a 300ms synchronous main-thread block, the naive `setInterval` readout lagged behind by `+300ms`, whereas `usePubgAirdropTimer` immediately recalculated `Math.max(0, targetEpochMs - (Date.now() + serverOffsetMs))` with `0ms` drift and resynchronized instantly on `visibilitychange` when switching tabs.
- **Engineering Fix:**
  Implemented the exact wall-clock delta and `visibilitychange` wake synchronization contract in [`src/hooks/usePubgAirdropTimer.js`](file:///Users/chinh/UIT%20lecture/WebApplicationDevelopment/Lab/Lab03/Homework/24520225_NguyenBaoChinh_Lab03_HW3/src/hooks/usePubgAirdropTimer.js):
  ```javascript
  import { useEffect, useState } from 'react';

  export function usePubgAirdropTimer(targetEpochMs, serverOffsetMs = 0) {
    const calcRemaining = () =>
      Math.max(0, targetEpochMs - (Date.now() + serverOffsetMs));

    const [remainingMs, setRemainingMs] = useState(calcRemaining);

    useEffect(() => {
      const syncClock = () => setRemainingMs(calcRemaining());

      syncClock();

      const timerId = window.setInterval(syncClock, 200);

      const onWake = () => {
        if (document.visibilityState === 'visible') syncClock();
      };

      document.addEventListener('visibilitychange', onWake);

      return () => {
        window.clearInterval(timerId);
        document.removeEventListener('visibilitychange', onWake);
      };
    }, [targetEpochMs, serverOffsetMs]);

    return { remainingMs, isLive: remainingMs === 0 };
  }
  ```
- **Commit:** `751a9f5` (`feat(timer): implement anti-drift PUBG airdrop hook`)

---

## 2. Comparison Summary: AI-Generated vs. Manually Corrected Implementation

| Audit Dimension | Flawed AI Implementation | Manually Corrected Engineering Implementation |
| :--- | :--- | :--- |
| **Live Auto-Polling State** | Read `squadStandings` & `pollTickCount` directly from stale mount closure (`[]`). | Used `pollCounterRef` + functional state updaters (`setSquadStandings(prev => ...)`). |
| **Leaderboard & Phase Derivation** | Duplicated `filteredStandings` and `dropPhase` in `useState` synced via `useEffect` (double renders). | Computed `filteredAndSortedStandings`, `totalPts`, and `dropPhase` during render via `useMemo`. |
| **Async & Unmount Hygiene** | Registered intervals and listeners without `AbortController` or teardown cleanup. | Enforced `AbortController.abort()`, `clearInterval`, `removeEventListener`, and `fsm.destroy()`. |
| **Countdown Accuracy** | Used `setRemainingMs(prev => prev - 200)` which drifts under CPU load and background tab throttling. | Computed `Math.max(0, targetEpochMs - (Date.now() + serverOffsetMs))` every 200ms + `visibilitychange` wake sync. |
| **Security & DOM Keys (Lab 02 Retained)** | Used raw `innerHTML` and volatile `key={Math.random()}`. | Strictly escaped JSX text nodes and deterministic keys (`key={drop.id}`, `key={sq.squadId}`, `key={log.id}`). |
