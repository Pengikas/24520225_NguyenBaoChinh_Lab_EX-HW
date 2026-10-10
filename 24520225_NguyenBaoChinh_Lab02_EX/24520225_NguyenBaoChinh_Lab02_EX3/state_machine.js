export const STATES = Object.freeze({
  IDLE: "IDLE",
  LOADING: "LOADING",
  SUCCESS: "SUCCESS",
  ERROR: "ERROR",
});

export function createInitialState() {
  return { status: STATES.IDLE };
}

export function transition(stateOrNext, maybeNext) {
  const nextState = maybeNext !== undefined ? maybeNext : stateOrNext;
  switch (nextState.status) {
    case STATES.IDLE:
    case STATES.LOADING:
      return nextState;

    case STATES.SUCCESS:
      if (!Array.isArray(nextState.data)) {
        throw new Error("SUCCESS requires an array of data");
      }
      return nextState;

    case STATES.ERROR:
      return {
        status: STATES.ERROR,
        error: String(nextState.error || "Unknown error"),
      };

    default:
      throw new Error(
        `Invalid state: ${nextState.status}`
      );
  }
}