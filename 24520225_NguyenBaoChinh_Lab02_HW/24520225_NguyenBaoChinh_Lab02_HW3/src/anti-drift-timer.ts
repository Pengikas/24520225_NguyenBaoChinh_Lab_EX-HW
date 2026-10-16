// anti-drift-timer.ts
// Precision Anti-Drift Countdown Implementation for Vietnam Flash-Sale E-Commerce

/**
 * Creates a zero-drift countdown timer using requestAnimationFrame and Date.now() delta.
 * In contrast to drift-prone setInterval (which accumulates delay due to macrotask queue latency
 * and GC pauses), this implementation dynamically recalculates remaining time against targetTime.
 *
 * @param durationMs Countdown duration in milliseconds
 * @param onTick Callback invoked on each animation frame with accurate remaining ms
 * @returns Disposal function to cancel animation loop
 */
export function createAntiDriftTimer(
  durationMs: number,
  onTick: (remaining: number) => void
): () => void {
  const targetTime = Date.now() + durationMs;
  let rafId: number;
  let isCancelled = false;

  function tick() {
    if (isCancelled) return;
    const remaining = Math.max(0, targetTime - Date.now());
    onTick(remaining);
    if (remaining > 0) {
      rafId = requestAnimationFrame(tick); // Zero drift compared to setInterval
    }
  }

  rafId = requestAnimationFrame(tick);
  return () => {
    isCancelled = true;
    cancelAnimationFrame(rafId);
  };
}

/**
 * Drift-prone countdown timer implementation using standard setInterval.
 * Provided for side-by-side empirical telemetry benchmark and AI failure mode demonstrations.
 * Demonstrates cumulative drift: each tick assumes exact delta (e.g. 100ms or 1000ms),
 * but browser task scheduling delays cause it to fall behind true wall-clock time.
 *
 * @param durationMs Countdown duration in milliseconds
 * @param onTick Callback invoked on each interval tick with drift-affected remaining ms
 * @param intervalMs Interval frequency in milliseconds (default: 50ms for high-res comparison)
 * @returns Disposal function to clear interval
 */
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
    // Positive drift means setInterval is lagging behind (reporting more time left than actually exists)
    const driftMs = simulatedRemaining - actualRemaining;

    onTick(simulatedRemaining, actualRemaining, driftMs);

    if (simulatedRemaining <= 0 || actualRemaining <= 0) {
      clearInterval(intervalId);
    }
  }, intervalMs);

  return () => clearInterval(intervalId);
}

/**
 * Formats milliseconds into high-precision digital countdown display components.
 * e.g., 90123 ms -> { hours: '00', minutes: '01', seconds: '30', milliseconds: '123' }
 */
export function formatCountdown(ms: number): {
  hours: string;
  minutes: string;
  seconds: string;
  milliseconds: string;
  totalFormatted: string;
  shortFormatted: string;
} {
  const safeMs = Math.max(0, Math.floor(ms));
  const totalSeconds = Math.floor(safeMs / 1000);

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const milliseconds = safeMs % 1000;

  const pad = (n: number, width = 2) => n.toString().padStart(width, '0');

  const hStr = pad(hours);
  const mStr = pad(minutes);
  const sStr = pad(seconds);
  const msStr = pad(milliseconds, 3);

  return {
    hours: hStr,
    minutes: mStr,
    seconds: sStr,
    milliseconds: msStr,
    totalFormatted: `${hStr}:${mStr}:${sStr}.${msStr}`,
    shortFormatted: `${mStr}:${sStr}.${Math.floor(milliseconds / 10).toString().padStart(2, '0')}`,
  };
}

/**
 * Diagnostic utility to inject a synchronous CPU blocking workload for testing timer drift resistance.
 * This simulates a long task (e.g. heavy DOM reflow or JSON parsing) blocking the main thread.
 */
export function blockMainThreadSync(blockMs = 250): number {
  const start = performance.now();
  let iterations = 0;
  while (performance.now() - start < blockMs) {
    iterations += Math.sqrt(Math.random());
  }
  return Math.round(performance.now() - start);
}
