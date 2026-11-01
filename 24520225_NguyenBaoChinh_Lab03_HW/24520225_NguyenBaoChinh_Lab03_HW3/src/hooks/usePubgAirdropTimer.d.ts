export function usePubgAirdropTimer(
  targetEpochMs: number,
  serverOffsetMs?: number
): {
  remainingMs: number;
  isLive: boolean;
};
