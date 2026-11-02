
import {
    initialRelationshipState,
    type RelationshipAction,
    type RelationshipPhase,
    type RelationshipState,
} from '../types/relationship.ts';

/**
 * Explicitly define all permitted transitions.
 *
 * FRIENDS -> DATING_NO_LOVE
 * DATING_NO_LOVE -> FRIENDS | OFFICIAL_LOVE | GHOSTED_EXIT
 * OFFICIAL_LOVE -> GHOSTED_EXIT
 * GHOSTED_EXIT -> FRIENDS
 */
export const allowedTransitions: Record<
    RelationshipPhase,
    readonly RelationshipPhase[]
> = {
    FRIENDS: [
        'DATING_NO_LOVE',
    ],

    DATING_NO_LOVE: [
        'FRIENDS',
        'OFFICIAL_LOVE',
        'GHOSTED_EXIT',
    ],

    OFFICIAL_LOVE: [
        'GHOSTED_EXIT',
    ],

    GHOSTED_EXIT: [
        'FRIENDS',
    ],
};

/**
 * Check whether a transition is permitted.
 */
export function canTransition(
    current: RelationshipPhase,
    next: RelationshipPhase,
): boolean {
    return allowedTransitions[current].includes(next);
}

/**
 * Deterministic finite state machine reducer.
 */
export function relationshipReducer(
    state: RelationshipState,
    action: RelationshipAction,
): RelationshipState {
    switch (action.type) {
        case 'SET_PHASE': {
            if (!canTransition(state.phase, action.phase)) {
                return state;
            }

            return {
                ...state,
                phase: action.phase,
            };
        }

        case 'RESET': {
            return initialRelationshipState;
        }

        default: {
            return state;
        }
    }
}
