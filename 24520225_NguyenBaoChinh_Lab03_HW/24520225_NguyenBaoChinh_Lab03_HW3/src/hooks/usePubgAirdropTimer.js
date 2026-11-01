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
