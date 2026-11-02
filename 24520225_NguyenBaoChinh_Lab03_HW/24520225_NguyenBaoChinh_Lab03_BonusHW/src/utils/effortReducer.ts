
import type { EffortSignal } from '../types/relationship';

/**
 * M2 - Asymmetric Effort Reducer
 *
 * All effort signals are stored as immutable action logs.
 */

// 1. Immutable effort log state.
export interface EffortLogState {
    readonly signals: readonly EffortSignal[];
}

// 2. Actions supported by the effort reducer.
export type EffortAction =
    | {
        readonly type: 'ADD_SIGNAL';
        readonly signal: EffortSignal;
    }
    | {
        readonly type: 'REMOVE_SIGNAL';
        readonly id: string;
    }
    | {
        readonly type: 'RESET_LOG';
    };

// 3. Initial effort state.
export const initialEffortState: EffortLogState = {
    signals: [],
};

// 4. Immutable reducer.
export function effortReducer(
    state: EffortLogState,
    action: EffortAction,
): EffortLogState {
    switch (action.type) {
        case 'ADD_SIGNAL': {
            const { signal } = action;

            // Reject invalid effort signals.
            if (
                !signal.id ||
                !Number.isFinite(signal.steps) ||
                !Number.isFinite(signal.multiplier) ||
                signal.steps < 0 ||
                signal.multiplier < 0
            ) {
                return state;
            }

            // Prevent duplicate IDs.
            if (state.signals.some((item) => item.id === signal.id)) {
                return state;
            }

            return {
                ...state,
                signals: [...state.signals, signal],
            };
        }

        case 'REMOVE_SIGNAL': {
            const nextSignals = state.signals.filter(
                (signal) => signal.id !== action.id,
            );

            // Preserve the original reference if nothing changed.
            if (nextSignals.length === state.signals.length) {
                return state;
            }

            return {
                ...state,
                signals: nextSignals,
            };
        }

        case 'RESET_LOG': {
            return initialEffortState;
        }

        default: {
            return state;
        }
    }
}

// 5. Derived effort state.
export interface DerivedEffortState {
    readonly emSteps: number;
    readonly aiDoSteps: number;
    readonly emWeightedEffort: number;
    readonly aiDoWeightedEffort: number;
    readonly totalWeightedEffort: number;
    readonly imbalanceRatio: number | null;
    readonly isRedFlag: boolean;
    readonly redFlagMessage: string;
}

// 6. Pure derived-state function.
//
// This function never modifies the original signals.
export function deriveEffortState(
    signals: readonly EffortSignal[],
): DerivedEffortState {
    const totals = signals.reduce(
        (result, signal) => {
            const weightedEffort =
                signal.steps * signal.multiplier;

            if (signal.actor === 'EM') {
                return {
                    ...result,
                    emSteps: result.emSteps + signal.steps,
                    emWeightedEffort:
                        result.emWeightedEffort + weightedEffort,
                };
            }

            return {
                ...result,
                aiDoSteps: result.aiDoSteps + signal.steps,
                aiDoWeightedEffort:
                    result.aiDoWeightedEffort + weightedEffort,
            };
        },
        {
            emSteps: 0,
            aiDoSteps: 0,
            emWeightedEffort: 0,
            aiDoWeightedEffort: 0,
        },
    );

    const {
        emSteps,
        aiDoSteps,
        emWeightedEffort,
        aiDoWeightedEffort,
    } = totals;

    const totalWeightedEffort =
        emWeightedEffort + aiDoWeightedEffort;

    const imbalanceRatio =
        emWeightedEffort === 0
            ? null
            : aiDoWeightedEffort / emWeightedEffort;

    const isRedFlag =
        aiDoWeightedEffort > emWeightedEffort;

    return {
        emSteps,
        aiDoSteps,
        emWeightedEffort,
        aiDoWeightedEffort,
        totalWeightedEffort,
        imbalanceRatio,
        isRedFlag,
        redFlagMessage: isRedFlag
            ? 'Red Flag: AI_DO weighted effort exceeds EM weighted effort.'
            : 'Effort balance: No AI_DO-over-EM imbalance detected.',
    };
}
