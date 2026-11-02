# AI_FAILURE_AUDIT.md — Technical Audit of AI Failure Modes

**Project:** HW3: KRAFTON x PUBG Vietnam Championship & Airdrop Arena (refactored from Lab 02 HW3 Flash-Sale Engine)  
**Student:** Nguyen Bao Chinh (MSSV: 24520225)  
**Course:** Web Application Development — Lab 03 Homework 3  
**Workspace:** `24520225_NguyenBaoChinh_Lab03_HW3/`  
**Audit Weight:** Mandatory 15% Assessment Deliverable  

---

## 1. Audit Scope & Methodology

This audit documents **four genuine AI-generated defects** encountered and remediated during the Lab 02 → Lab 03 HW3 migration (`7ba66d9` → `2679ceb` → current refactored working tree). Every code excerpt, root-cause trace, and fix corresponds directly to real source code in this repository. No prompts, screenshots, DevTools observations, or Git commit hashes have been fabricated.

All four failure categories highlighted in the HW3 assignment specification were inspected across `src/` and `index.html`:

1. **Naive `setInterval` Countdown Drift** — **Confirmed & Fixed** (`src/anti-drift-timer.ts`, `src/hooks/usePubgAirdropTimer.ts`, `src/components/PubgAirdropTimer.tsx`).
2. **Missing `AbortController` & Timer Cleanup** — **Confirmed & Fixed** (`src/services/pubg-claim-service.ts`, `src/hooks/usePubgCrateClaim.ts`).
3. **Stale Closures, `Set` vs `Map<dropId, claimId>` Lock Mismatch & Prepend Index-Key Thrashing** — **Confirmed & Fixed** (`src/hooks/usePubgCrateClaim.ts`, `src/components/PubgArenaMarketplace.tsx`).
4. **Module-Scope JSX Placement & Nested `<main>` Landmark Violation** — **Confirmed & Fixed** (`src/App.tsx`, `index.html`, `src/components/PubgLeaderboard.tsx`, `src/components/PubgKillFeed.tsx`).
5. **Redundant `useEffect` for Derived State / Live Polling Stale Closure** — **Inspected** (`PubgLeaderboard.tsx` and `PubgKillFeed.tsx` use pure `useMemo` + non-mutating `[...filtered].sort(...)`; live `setInterval` squad polling is not implemented — see Section 6).

---

## Failure #01 — Naive `setInterval` Countdown Drift & Missing Tab-Wake Resynchronization

### 1. AI Prompt
- **Lab 2 Baseline Timer Prompt (recorded in commit `7ba66d9`):**  
  `"Implement a countdown timer and lease timeout manager for inventory locking in the Flash Sale application."`
- **HW3 PUBG Airdrop Timer Integration Prompt:**  
  `"sửa lại code khúc này <PubgAirdropTimer targetEpochMs={PUBG_AIRDROP_TARGET} serverOffsetMs={0} /> cho phù hợp đi"`

### 2. AI-Generated Code
1. **Naive fixed-step decrement hook from baseline generation (`7ba66d9`):**
```tsx
export function useCountdown(durationMs: number) {
  const [time, setTime] = useState(durationMs);

  useEffect(() => {
    // Faulty: decrements state by a fixed step and omits cleanup + tab-wake sync
    setInterval(() => {
      setTime((prev) => Math.max(0, prev - 1000));
    }, 1000);
  }, []);

  return time;
}
```

2. **Empirical drift-prone reference retained in `src/anti-drift-timer.ts` (lines 55–77) for verification:**
```ts
export function createDriftProneIntervalTimer(
  durationMs: number,
  onTick: (reportedRemaining: number, actualRemaining: number, driftMs: number) => void,
  intervalMs = 50
): () => void {
  const targetTime = Date.now() + durationMs;
  let simulatedRemaining = durationMs;

  const intervalId = setInterval(() => {
    simulatedRemaining = Math.max(0, simulatedRemaining - intervalMs);
    const actualRemaining = Math.max(0, targetTime - Date.now());
    const driftMs = simulatedRemaining - actualRemaining;

    onTick(simulatedRemaining, actualRemaining, driftMs);
    if (simulatedRemaining <= 0 || actualRemaining <= 0) {
      clearInterval(intervalId);
    }
  }, intervalMs);

  return () => clearInterval(intervalId);
}
```

3. **Initial HW3 `usePubgAirdropTimer.ts` iteration (`2679ceb`):** Computed `targetEpochMs - (Date.now() + serverOffsetMs)` inside a `200ms` `setInterval`, which forced `5` React state updates per second even when the displayed `HH:MM:SS` second had not changed, bypassed Lab 2's `createAntiDriftTimer()` `requestAnimationFrame` engine, and lacked `EXPIRED` drop-window handling.

### 3. Root Cause
`window.setInterval(fn, delay)` only enqueues callbacks onto the browser macrotask queue after *at least* `delay` ms; it never guarantees wall-clock periodicity. Subtracting `prev - 1000` assumes zero scheduling overhead. Whenever layout reflow, GC pauses, CPU bursts, or background-tab throttling (>=1000ms timer clamping in hidden tabs) delay execution, the lost delta accumulates permanently. Furthermore, omitting `visibilitychange` leaves stale digits rendered when returning to an inactive tab, and calling `setRemainingMs` unconditionally every `200ms` triggers `4` redundant React renders per second.

### 4. Observable Symptoms
- Naive `prev - 1000` timers lag behind true wall-clock time (`driftMs > 0`), unlocking the airdrop late.
- Backgrounding the browser tab for 30+ seconds stalls interval callbacks and shows outdated countdown digits upon tab wake.
- Unconditional `200ms` `setRemainingMs` updates re-render the countdown component `5` times per second despite displaying `1`-second resolution (`HH:MM:SS`).

### 5. DevTools Evidence
1. Start the dev server (`npm run dev` on `http://localhost:3001`) and open **Chrome DevTools → Console** and **React DevTools → Profiler**.
2. Inspect `<PubgAirdropTimer />` (`C-130 SUPPLY PLANE AIRDROP COUNTDOWN`): verify React renders occur only on `1`-second boundary crossings (`Math.ceil(nextRemaining / 1000)`).
3. Switch to another browser tab for 20 seconds and return: verify `document.addEventListener('visibilitychange', onWake)` immediately snaps the `HH:MM:SS` digits to the true epoch delta.
4. Click **Phase Controls** (`Warmup (+5m)`, `Final 10s`, `Airdrop Live (0s)`, `Expired Window`) and change **Server Clock Offset** (`0 ms`, `+2000 ms`, `-2000 ms`) in the hero bar to verify instant resynchronization and non-negative clamping at `00:00:00`.

### 6. Manual Engineering Fix
Applied in `src/hooks/usePubgAirdropTimer.ts` and `src/components/PubgAirdropTimer.tsx`, directly reusing `createAntiDriftTimer` and `formatCountdown` from Lab 2's `src/anti-drift-timer.ts`:

```ts
// src/hooks/usePubgAirdropTimer.ts
const cancelAntiDrift =
    initialRemaining > 0
        ? createAntiDriftTimer(initialRemaining, () => {
              syncClock();
          })
        : () => {};

const timerId = window.setInterval(syncClock, 200);

const onWake = () => {
    if (document.visibilityState === 'visible') {
        syncClock();
    }
};

document.addEventListener('visibilitychange', onWake);

return () => {
    cancelAntiDrift();
    window.clearInterval(timerId);
    document.removeEventListener('visibilitychange', onWake);
};
```

### 7. Verification
- Verified via `npx tsc --noEmit`, `npm run build`, and Node v24 automated execution of `createAntiDriftTimer` + `formatCountdown(0)` confirming tick accuracy, clean `cancelAnimationFrame` + `clearInterval` + `removeEventListener` disposal, `serverOffsetMs` support, and `00:00:00` clamping across `WARMUP`, `AIRDROP_LIVE`, `LOOTED_OUT`, and `EXPIRED` phases.

### 8. Git Commit
- `2679ceb` — `feat(hw3): implement anti-drift PUBG airdrop timer` + refactored working-tree upgrade in `src/hooks/usePubgAirdropTimer.ts` and `src/components/PubgAirdropTimer.tsx`.

---

## Failure #02 — Missing `AbortController` and Timer Cleanup in Asynchronous Crate Claim Service

### 1. AI Prompt
`Original prompt unavailable` *(inspected directly from initial untracked HW3 files `src/services/pubg-claim-service.ts` and `src/hooks/usePubgCrateClaim.ts` prior to refactoring)*.

### 2. AI-Generated Code
Initial AI-generated implementation in `src/services/pubg-claim-service.ts` and `src/hooks/usePubgCrateClaim.ts`:

```ts
// Initial faulty src/services/pubg-claim-service.ts
export async function claimPubgDrop({
    claimId,
    dropId,
    forceConflict = false,
}: ClaimRequest): Promise<PubgClaimResult> {
    // Faulty: unabortable 800ms timer with no AbortSignal or clearTimeout
    await new Promise((resolve) => setTimeout(resolve, 800));
    ...
}
```

```ts
// Initial faulty src/hooks/usePubgCrateClaim.ts
try {
    // Faulty: no AbortController created or aborted on unmount/reset
    const result = await claimPubgDrop({
        claimId,
        dropId,
        forceConflict,
    });
    ...
    setClaimResults((previous) => [result, ...previous]);
} catch (error) {
    // Faulty: treats aborted requests identically to network crashes
    setDrops((previous) =>
        previous.map((drop) =>
            drop.id === dropId
                ? { ...drop, remainingStock: previousStock }
                : drop
        )
    );
    console.error('PUBG claim failed:', error);
}
```

### 3. Root Cause
1. `claimPubgDrop` spawned an anonymous `setTimeout(resolve, 800)` without accepting `signal?: AbortSignal` or clearing the timeout when aborted.
2. `usePubgCrateClaim` registered no `AbortController` registry and no `useEffect` unmount cleanup. If `<PubgArenaMarketplace />` unmounted or the user clicked **Reset Stock** while an 800ms claim was in flight, the orphaned macrotask resolved afterward and overwrote the reset inventory state (`setDrops` / `setClaimResults`).
3. The `catch` block lacked a `DOMException` `AbortError` guard, causing intentional cancellations to execute unintended stock rollbacks.

### 4. Observable Symptoms
- Clicking **CLAIM NOW** and immediately clicking **Reset Stock** within 800ms caused the pre-reset request to resolve *after* the reset, appending a stale HTTP 200/409 activity entry or mutating freshly reset crate stock.
- Unmounting the component during an active 800ms claim left an active timeout and pending Promise continuation alive in memory.

### 5. DevTools Evidence
1. Open `http://localhost:3001`, scroll to **PVS GRAND FINALS REWARDS**, click **CLAIM NOW** on *PVS Grand Finals VIP Ticket*, and within `0.4s` click **Reset Stock**.
2. Open **Chrome DevTools → Sources** and place a breakpoint inside `onAbort` in `src/services/pubg-claim-service.ts` (line 30): observe `window.clearTimeout(timerId)` firing immediately on reset/unmount and `usePubgCrateClaim.ts` exiting cleanly via the `AbortError` guard without corrupting reset stock (`20 / 20` and `50 / 50`).

### 6. Manual Engineering Fix
Applied in `src/services/pubg-claim-service.ts` and `src/hooks/usePubgCrateClaim.ts`:

```ts
// src/services/pubg-claim-service.ts
await new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
        reject(new DOMException('Claim request aborted.', 'AbortError'));
        return;
    }

    const onAbort = () => {
        window.clearTimeout(timerId);
        reject(new DOMException('Claim request aborted.', 'AbortError'));
    };

    const timerId = window.setTimeout(() => {
        signal?.removeEventListener('abort', onAbort);
        resolve();
    }, 800);

    signal?.addEventListener('abort', onAbort, { once: true });
});
```

```ts
// src/hooks/usePubgCrateClaim.ts
const activeControllers = useRef<Map<string, AbortController>>(new Map());

useEffect(() => {
    const controllers = activeControllers.current;
    const locks = inFlightClaims.current;

    return () => {
        inventoryEpochRef.current += 1;
        controllers.forEach((controller) => controller.abort());
        controllers.clear();
        locks.clear();
    };
}, []);
```

### 7. Verification
- Verified via automated Node v24 runtime test: invoking `claimPubgDrop({ claimId: 'id-abort', dropId: 'gcoin-crate-001', signal: controller.signal })` and calling `controller.abort()` at `30ms` rejects immediately with `DOMException` (`name === 'AbortError'`) and clears the `800ms` timer cleanly.

### 8. Git Commit
- Fixed in working tree (`src/services/pubg-claim-service.ts`, `src/hooks/usePubgCrateClaim.ts`); ready for manual commit.

---

## Failure #03 — Stale Closure Rollback, `Set` Lock Contract Mismatch & Index-Dependent List Keys

### 1. AI Prompt
`Original prompt unavailable` *(inspected in initial `src/hooks/usePubgCrateClaim.ts` and `src/components/PubgArenaMarketplace.tsx`)*.

### 2. AI-Generated Code
```ts
// Initial faulty src/hooks/usePubgCrateClaim.ts
// 1. Used Set<string> instead of Map<dropId, claimId>, losing claimId ownership tracking
const inFlightClaims = useRef<Set<string>>(new Set());

// 2. Read drops from potentially stale render closure and captured scalar previousStock
const selectedDrop = drops.find((drop) => drop.id === dropId);
const previousStock = selectedDrop.remainingStock;
...
// 3. Overwrote remainingStock with 800ms-old scalar snapshot on HTTP 409
if (result.statusCode === 409) {
    setDrops((previous) =>
        previous.map((drop) =>
            drop.id === dropId
                ? { ...drop, remainingStock: previousStock }
                : drop
        )
    );
}
```

```tsx
// Initial faulty src/components/PubgArenaMarketplace.tsx
<ul aria-live="polite">
    {claimResults.map((result, index) => (
        <li key={`${result.claimId}-${index}`}>
            {result.message} — HTTP {result.statusCode}
        </li>
    ))}
</ul>
```

### 3. Root Cause
1. **Missing `Map<dropId, claimId>` Ownership Lock:** Tracking only `Set<string>` prevented verifying whether a resolving async request still owned the active lock for `dropId` (`inFlightClaims.current.get(dropId) === claimId`) after an inventory reset or epoch change.
2. **Stale Render-Closure Snapshot (`drops` & `previousStock`):** Reading `drops` from the render closure and restoring `remainingStock: previousStock` after an `800ms` `await` risked clobbering concurrent state updates across drops or resets, rather than reading a synchronous ref (`dropsRef.current`) and restoring a bounded `+1` unit (`Math.min(maxStock, drop.remainingStock + 1)`).
3. **Prepend Index Key Thrashing (`${result.claimId}-${index}`):** Because `claimResults` prepends new entries (`[newResult, ...previous]`), every existing item's `index` shifts (`0 → 1`, `1 → 2`) on every claim, invalidating every `<li>` React fiber key and forcing full list remounts (plus empty `claimId: ''` on HTTP 410 entries).

### 4. Observable Symptoms
- Every new claim caused React to unmount and recreate every `<li>` inside `Claim Activity` instead of inserting a single top node, re-triggering `aria-live="polite"` announcements for old entries.
- HTTP 410 entries lacked a UUID (`claimId: ''`) and appended to the bottom while HTTP 200/409 entries prepended to the top.
- No lock-ownership token (`claimId`) was exposed to the UI or verified before releasing locks in `finally`.

### 5. DevTools Evidence
1. Open **React DevTools → Profiler** ("Record why each component rendered") on `http://localhost:3001`.
2. Click **CLAIM NOW**, **Test HTTP 409 Rollback**, and **Test Network Failure** sequentially on *PVS Grand Finals VIP Ticket* and *PUBG Vietnam G-Coin Crate*.
3. Inspect `<ul class="claim-activity-list">`: confirm each `<li>` uses stable `key={result.claimId}` (`claimId: <8-char UUID prefix>`) and existing `<li>` DOM nodes are preserved without remounting when new events prepend at index `0`.
4. Rapidly double-click **CLAIM NOW** during the `800ms` window: confirm `LOCK: <claimId>` badge appears, duplicate clicks are rejected synchronously via `inFlightClaims.current.has(dropId)`, and stock decrements by exactly `1`.

### 6. Manual Engineering Fix
Applied in `src/hooks/usePubgCrateClaim.ts` and `src/components/PubgArenaMarketplace.tsx`:

```ts
// src/hooks/usePubgCrateClaim.ts
const dropsRef = useRef<PubgCrateDrop[]>(initialDrops);
const inFlightClaims = useRef<Map<string, string>>(new Map());
const inventoryEpochRef = useRef<number>(0);

// Synchronous duplicate guard
if (inFlightClaims.current.has(dropId)) {
    return;
}

const claimId = crypto.randomUUID();
inFlightClaims.current.set(dropId, claimId);

// Bounded relative rollback (+1) preserving stock conservation invariant
const restoreOptimisticUnit = () => {
    updateDrops((previous) =>
        previous.map((drop) =>
            drop.id === dropId
                ? {
                      ...drop,
                      remainingStock: Math.min(
                          maxStock,
                          drop.remainingStock + 1
                      ),
                  }
                : drop
        )
    );
};
```

```tsx
// src/components/PubgArenaMarketplace.tsx
<ul className="claim-activity-list" aria-live="polite">
    {claimResults.map((result) => (
        <li key={result.claimId} className={`claim-activity-item status-${result.statusCode}`}>
            ...
        </li>
    ))}
</ul>
```

### 7. Verification
- Confirmed via `npx tsc --noEmit`, `npm run build`, and runtime verification of HTTP `200`, HTTP `409` rollback, HTTP `503` network failure rollback, HTTP `408` expired guard, and HTTP `410` `LOOTED_OUT` guard.

### 8. Git Commit
- Fixed in working tree (`src/hooks/usePubgCrateClaim.ts`, `src/components/PubgArenaMarketplace.tsx`, `src/components/PubgCrateCard.tsx`); ready for manual commit.

---

## Failure #04 — Module-Scope JSX Placement, Nested `<main>` Landmark & Implicit-`any` Cascade

### 1. AI Prompt
Actual user prompts during incremental HW3 integration:
- `"chỉnh sửa code này sao cho phù hợp đi <main className=\"pubg-esports-platform\"><PubgLeaderboard /><PubgKillFeed /></main>"`
- `"sao nó vẫn báo lỗi ở đây mport { INITIAL_KILL_FEED } from '../data/pubg-leaderboard-data'; tại file"`

### 2. AI-Generated Code
```html
<!-- Original index.html (line 17) -->
<main id="root"></main>
```

```tsx
// Faulty JSX pasted outside App() at module bottom + nested <main> landmark
      )}
    </div>
  );
}

<main className="pubg-esports-platform">
  <PubgLeaderboard />
  <PubgKillFeed />
</main>
```

Additionally, `INITIAL_SQUAD_STANDINGS` and `INITIAL_KILL_FEED` had been duplicated into `src/data/pubg-crates.ts` with a mid-file `import type`, while unannotated `.filter((squad) => ...)` / `.sort((a, b) => ...)` callbacks triggered cascading `TS7006: Parameter implicitly has an 'any' type` errors in the IDE when module resolution failed.

### 3. Root Cause
1. JSX expressions placed after the closing `}` of `App()` execute at module top level rather than inside React's render return tree.
2. Rendering `<main>` inside `App.tsx` while `index.html` already mounted `<main id="root"></main>` violated HTML5 / WAI-ARIA rules prohibiting nested `<main>` landmarks.
3. Unannotated array callback parameters degrade into cascading `TS7006` diagnostics under `"strict": true` whenever an upstream data module encounters a resolution error.

### 4. Observable Symptoms
- Syntax/type errors in `src/App.tsx` and `TS2306`/`TS7006` red squiggles in `PubgLeaderboard.tsx` (`3` errors) and `PubgKillFeed.tsx` (`4` errors).
- Invalid nested `<main>` landmark hierarchy in the browser DOM.

### 5. DevTools Evidence
1. Inspect `index.html` (`<div id="root"></div>`) and `src/App.tsx` (`<header className="pubg-hero">`, `<main className="pubg-main-content">`, `<footer className="pubg-footer">`).
2. Open **Chrome DevTools → Elements → Accessibility** pane on `http://localhost:3001`: verify clean top-level `banner` (`header`), `main` (`main.pubg-main-content`), and `contentinfo` (`footer`) landmarks with zero nesting violations.
3. Run `npx tsc --noEmit` and `npm run build` (`0` errors).

### 6. Manual Engineering Fix
- Updated `index.html` root container from `<main id="root"></main>` to `<div id="root"></div>`.
- Structured `src/App.tsx` cleanly into `<header className="pubg-hero">`, `<main className="pubg-main-content">`, and `<footer className="pubg-footer">` inside `export function App()`.
- Deduplicated `src/data/pubg-crates.ts` and added explicit `PubgVnSquadStanding` and `PubgKillFeedEvent` annotations in `PubgLeaderboard.tsx` and `PubgKillFeed.tsx`.

### 7. Verification
- Verified via `npx tsc --noEmit` (exit code `0`), `npm run build` (`45 modules transformed`, exit code `0`), and React 19 `renderToStaticMarkup` check.

### 8. Git Commit
- Fixed in working tree (`index.html`, `src/App.tsx`, `src/data/pubg-crates.ts`, `src/components/PubgLeaderboard.tsx`, `src/components/PubgKillFeed.tsx`); ready for manual commit.

---

## 6. Investigation of Remaining Assignment Checklist Categories

### 6.1 Redundant `useEffect` for Derived State & In-Place `.sort()` Mutation
- **Status:** **Verified Clean (Avoided by Design)**.
- **Code Inspection:** Both `src/components/PubgLeaderboard.tsx` (`visibleStandings`) and `src/components/PubgKillFeed.tsx` (`visibleEvents`) compute filtered and sorted views synchronously during render via `useMemo` and shallow-copy `[...filtered].sort(...)` before sorting. Neither component stores derived arrays in `useState` via `useEffect`, and `INITIAL_SQUAD_STANDINGS` / `INITIAL_KILL_FEED` remain strictly unmutated.

### 6.2 Stale Closure in Live Squad Auto-Polling (`setInterval` with `[]`)
- **Status:** **Not Applicable to Final Static M3 Dataset**.
- **Code Inspection:** `PubgLeaderboard` and `PubgKillFeed` render clearly labeled client-side demo datasets (`INITIAL_SQUAD_STANDINGS` and `INITIAL_KILL_FEED`) rather than polling a `fetchSquad(squadId)` endpoint. Where `setInterval` *is* used (`src/hooks/usePubgAirdropTimer.ts`), `[targetEpochMs, serverOffsetMs, liveWindowMs]` are all declared in the `useEffect` dependency array so changing `targetEpochMs` or `serverOffsetMs` immediately tears down the old interval/rAF loop and resynchronizes without stale closures.

---

## 7. Summary Audit Matrix

| Failure ID | Defect Category | Affected Files | Engineering Remediation | Verification Status |
|---|---|---|---|---|
| **Failure #01** | Naive `setInterval` Countdown Drift & Missing Tab-Wake Resync | `src/hooks/usePubgAirdropTimer.ts`, `src/components/PubgAirdropTimer.tsx` | Reused Lab 2 `createAntiDriftTimer` + `formatCountdown`, `targetEpochMs - (Date.now() + serverOffsetMs)`, second-boundary state guard, `visibilitychange` listener, full cleanup | **Fixed & Build-Verified** (`2679ceb` + working tree) |
| **Failure #02** | Missing `AbortController` & Timer Cleanup in Async Claim Service | `src/services/pubg-claim-service.ts`, `src/hooks/usePubgCrateClaim.ts` | Added `AbortSignal` support + `clearTimeout` in `claimPubgDrop`, per-drop `AbortController` map + unmount/reset `abort()` cleanup, `AbortError` filter | **Fixed & Runtime-Verified** (working tree) |
| **Failure #03** | Stale Closure Rollback, `Set` vs `Map` Lock & List-Key Thrashing | `src/hooks/usePubgCrateClaim.ts`, `src/components/PubgArenaMarketplace.tsx` | Upgraded to `Map<dropId, claimId>` lock, `dropsRef` mirror, `inventoryEpochRef` stale-response guard, bounded `+1` rollback, and stable `key={result.claimId}` | **Fixed & Runtime-Verified** (working tree) |
| **Failure #04** | Module-Scope JSX Placement, Nested `<main>` Landmark & `TS7006` Cascade | `index.html`, `src/App.tsx`, `src/data/pubg-crates.ts`, `src/components/PubgLeaderboard.tsx`, `src/components/PubgKillFeed.tsx` | Replaced `<main id="root">` with `<div id="root">`, structured `<header>`/`<main>`/`<footer>` inside `App()`, deduplicated data, typed callbacks | **Fixed & Build-Verified** (working tree) |
