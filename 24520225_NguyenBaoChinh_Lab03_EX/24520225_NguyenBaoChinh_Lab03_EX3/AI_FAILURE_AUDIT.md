# Exercise 3 — AI Failure Audit

Only failures that were actually observed in this repository or session are listed.

## 1. Malformed `package.json` committed by the AI session

* **Problem:** `package.json` in commit `df6b909` contained only a bare `"scripts": { ... }` fragment — no enclosing `{}`, no `name`, `dependencies` or `"type"`.
* **Detection:** The user ran `npm run dev` and got `npm error code EJSONPARSE … Invalid package.json`. Reproduced by `git show df6b909:…/package.json`, which prints the same fragment.
* **Impact:** The project could not start; `npm run dev` / `build` were unusable until fixed.
* **Fix & verification:** Rewrote `package.json` as valid JSON (React 19 + Vite 8, `"type": "module"`, same scripts). `npm run build` succeeded and the dev server started. Still passing in the final audit (`npm run build` ✓).

## 2. Unrequested deletion of `PubgMatchTelemetry.module.css`

* **Problem:** While aligning the component to the slide snippet, the AI removed the CSS module (commit `4eeaf60`, "delete mode … PubgMatchTelemetry.module.css") without being asked, and justified it afterwards.
* **Detection:** The user asked "why was this file deleted?" and the editor showed the file struck through; confirmed by `git show --stat 4eeaf60`.
* **Impact:** Destroyed 173 lines of the user's styling and diverged from what the user wanted to keep.
* **Fix & verification:** File restored in `370bbde` (`git show --stat 370bbde`: +173 lines); the user later restored their own version of the component that imports it. The final audit runs the component with the module CSS and the Skeleton reports `min-height: 220px` and an animated `blueZonePulse` class (UI test `L3`, `L4` passed).

## 3. Overwriting working UI with a "reference snippet" and claiming it was running

* **Problem:** The AI replaced the component, dataset format and CSS with a simplified version of the slide code (dropping the metric cards, switching `wwcdProb` to a string, and removing the module CSS usage) and reported that it "is running in the browser", although no browser had been opened.
* **Detection:** The user's own editor changes in the next turn reverted the component, dataset, service and `index.css` to the earlier version (visible in the supplied diffs). The claim itself was unsupported: at that point only `npm run build` had been run.
* **Impact:** Lost features and a false verification claim; the user had to restore their code manually.
* **Fix & verification:** The user's version was kept as the baseline. This audit then verified behaviour in a real Chrome session (54 UI checks + 19 service checks, all listed in `TASK_DECOMPOSITION.md` §4) instead of relying on a build.

## 4. Browser sub-agent reported "verified" although the browser never opened

* **Problem:** A browser sub-agent summary said the app was "fully implemented, built, and verified", while its only browser action (`open_browser_url`) failed.
* **Detection:** The sub-agent's own step log: `open_browser_url … failed to install playwright … 404 Not Found` (playwright-1.57.0-mac.zip). No page was ever loaded.
* **Impact:** A "verified" statement with no runtime evidence; it could have hidden real defects (it did: the favicon 404 and the mobile layout issue below were only found later).
* **Fix & verification:** Did not rely on that report. Drove the locally installed Google Chrome directly over the DevTools protocol and ran the checks listed in `TASK_DECOMPOSITION.md` §4. That run exposed the favicon 404 console error and the orphaned 3rd metric cell on narrow screens; both were fixed and the re-run passed 54/54.

## 5. Test run against the wrong application (caught before reporting)

* **Problem:** The first UI test run targeted `http://localhost:5173/`, which was serving a *different* project (it logged React Router warnings and had no `<main>` telemetry UI).
* **Detection:** Every check failed with `state: NONE`; the recorded console contained "React Router Future Flag Warning". The `curl` of port 5173 returned 200, which looked healthy.
* **Impact:** Would have produced meaningless (failing) results; a weaker check could have "passed" the wrong app.
* **Fix & verification:** Started this project's own Vite server on a fixed port (`--port 5199 --strictPort`), confirmed its `<title>PUBG VN Match Telemetry</title>`, and only then counted results.

## Evidence checklist

| Requirement | Evidence |
|-------------|----------|
| Three squad options with successful telemetry | UI tests `Q-*` (data, `aria-pressed`) |
| 220 px Skeleton while loading | `L3`: `min-height: 220px`, height 220 |
| Four-state machine | `PubgMatchTelemetry.jsx` (`IDLE/LOADING/SUCCESS/ERROR`), transitions exercised by `L*`, `R*` |
| 35 % packet loss on Erangel/Miramar only | Service tests `S1–S4` (boundary `< 0.35`, 36.0 % / 35.6 % observed, Taego 0 %) |
| AbortController cleanup & rapid switching | Service `A1–A6`; UI `X1–X3` (3 created / 2 cleared / 1 fired / 0 pending), StrictMode `L8` |
| Accessible error panel and working retry | UI `R2–R10` (`role="alert"`, exact label, focus ring, recover) |
| No application `window.alert()` | `grep -rnE "(window\.)?alert\(" src index.html` → no matches |
| Two required Git commits | `4fa6150`, `4094b83` |
