# Exercise 3 — Task Decomposition: KRAFTON PUBG Vietnam Series (PVS) Live Telemetry

Scope: `<PubgMatchTelemetry />` — a fault-tolerant, *simulated* live-telemetry card for three Vietnamese PVS squads.
The service is a local simulation (timer + `Math.random`); no real KRAFTON API is used or claimed.

## 1. Tasks

| # | Task | Files | Status |
|---|------|-------|--------|
| 1 | Squad dataset (CES / TE / GE) kept separate from the UI | `src/data/pubgVnSquads.js` | Done |
| 2 | Simulated telemetry service: 1800 ms delay, 35 % packet loss on Erangel/Miramar only, `AbortSignal` support with timer + listener cleanup | `src/services/pubgTelemetry.js` | Done |
| 3 | 4-state machine `IDLE / LOADING / SUCCESS / ERROR`, one `AbortController` per request, `AbortError` ignored, retry via `retryTick` | `src/components/PubgMatchTelemetry.jsx` | Done |
| 4 | Blue-Zone Skeleton (min-height 220 px, pulse animation, `aria-busy`, reduced-motion fallback) | `PubgMatchTelemetry.jsx`, `PubgMatchTelemetry.module.css` | Done |
| 5 | Accessible error panel `<section role="alert">` + `Reconnect Satellite (Retry)` button, visible focus ring, **no `window.alert()`** | same | Done |
| 6 | Squad selector with `aria-pressed`, responsive layout | `src/App.jsx`, `src/index.css`, module CSS | Done |
| 7 | Audit, fixes, documentation | this file, `AI_FAILURE_AUDIT.md` | Done |

## 2. State machine

```
            squadId or retryTick changes
IDLE ──► LOADING ──► SUCCESS   (resolved, current request only)
            │
            ├──────► ERROR     (non-abort rejection) ──[Retry]──► LOADING
            └─ AbortError → ignored (cleanup of the previous effect)
```

* `useEffect([squadId, retryTick])` creates a new `AbortController`, sets `LOADING`, calls the service with `controller.signal`.
* Cleanup `controller.abort()` runs when `squadId` changes, on retry, and on unmount → the service rejects with `AbortError`, clears its timer and removes its listener; the component `return`s without touching state.

## 3. Defects found by the audit and fixed (commit `fix(ex3): ...`)

| Defect | How it was found | Fix |
|--------|------------------|-----|
| `GET /favicon.ico` → 404 shown as a console error | Headless Chrome run, console check (`K1`) | `<link rel="icon" href="data:,">` in `index.html` |
| On ≤ 520 px the 3rd metric ("WWCD Probability") sat alone in a half-width cell; same for the skeleton | Screenshot review at 320/375 px | `.metric:last-child` / `.skeletonMetric:last-child` span the full row |
| Extra empty space under the status line and above the error heading (default `<p>`/`<h2>` margins) | Screenshot review | `.status { margin: 0 }`, `.error h2 { margin-top: 0 }` |
| Success panel was not a live region (the lab's reference contract uses `aria-live='polite'`) | Compared with the Sprint 3 reference contract | `aria-live="polite"` on the success `<section>` |

## 4. Verification actually performed

Environment: macOS, Node 24, Vite 8 dev server (`React.StrictMode` on), real headless Google Chrome driven over the DevTools protocol; service tests run in Node through Vite's SSR loader. Scripts are scratch files (not part of the repo).

**Service — 19/19 passed**
* Taego never fails (300 requests with `Math.random()=0`; 3000 with real random: 0 failures).
* Erangel/Miramar fail at `random=0.349999` and succeed at `random=0.35` (strict `< 0.35`); observed rates over 3000 runs: Erangel 36.0 %, Miramar 35.6 %.
* Delay ≈ 1801 ms.
* Abort mid-flight → `AbortError`, timer cleared, listener removed; completed and failed requests also remove the listener; pre-aborted signal rejects immediately without creating a timer; unknown squad → normal error; zero dangling timers.

**UI in Chrome — 54/54 passed (final run)**
* Skeleton: `aria-busy="true"`, label, computed `min-height: 220px`, 6 placeholders running `blueZonePulse`; disappears on success; `prefers-reduced-motion: reduce` → 0 animated elements.
* All three squads show the exact spec data and the correct `aria-pressed` button.
* Erangel/Miramar forced failure → `<section role="alert">` with heading, message and button text exactly `Reconnect Satellite (Retry)`; Tab reaches the button with a 3 px outline; retry → `LOADING` immediately; retry that fails again → `ERROR`; retry that succeeds → `SUCCESS`.
* Taego with `random=0` still succeeds.
* Rapid CES → TE → GE (three variants: synchronous, 120 ms apart, and with forced failures): final state is Genius Esports, 3 timers created / 2 cleared / 1 fired / 0 pending, **no alert ever rendered**, stale squads never rendered.
* StrictMode double-mount: 2 created, 1 cleared, 1 fired, 0 pending.
* Contrast ≥ 4.5 : 1 for all measured text (min 6.46 : 1); no horizontal overflow at 375 px and 320 px in all three states; buttons ≥ 40 px tall; console: no errors/warnings/exceptions.

**Static checks:** `npm run build` ✓ · `git diff --check` ✓ · no `alert(` anywhere in `src/` or `index.html` ✓.

## 5. Not tested

* Chrome DevTools "Slow 3G" throttling and a measured CLS value (Checkpoint 3). The skeleton (220 px) is shorter than the success card, but nothing is rendered below the card, so no sibling content moves; the number was not measured.
* Production bundle behaviour (`vite preview`) — only the build was run; behaviour tests ran against the dev server.
* Real devices / Safari / Firefox.

Manual steps: `npm run dev` → DevTools › Network › *Slow 3G* → reload and watch the Performance panel for CLS; click CES → TE → GE quickly and check the Network/Console panels for false errors.

## 6. Git history (Exercise 3)

Required commits (both exist):

* `4fa6150` `feat(ex3): implement PUBG VN 4-state telemetry & AbortController`
* `4094b83` `feat(ex3): add skeleton UI & retry alert`

History also contains earlier commits with the same two messages (`df6b909`, `4eeaf60`) and three intermediate commits (`5f9c31a`, `676ca38`, `370bbde`) from an iteration that was later reverted by hand. History was **not rewritten**. The audit fixes in §3 and these docs were added as separate follow-up commits.
