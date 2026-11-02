
/**
 * M1 - Relationship Finite State Machine
 * M2 - EffortSignal type contract
 */

// 1. Strict relationship phase definition.
// [OK] DETERMINISTIC FINITE STATE MACHINE CONTRACT:
export type RelationshipPhase =
    | 'FRIENDS'
    | 'DATING_NO_LOVE' // 'Hẹn hò nhưng không yêu'
    | 'OFFICIAL_LOVE' // Verified mutual commitment
    | 'GHOSTED_EXIT'; // Unmounted & memory freed

// 2. Asymmetric effort signal contract.
export interface EffortSignal {
    readonly id: string;
    readonly actor: 'EM' | 'AI_DO';
    readonly steps: number;
    readonly multiplier: number;
}

// 3. Relationship state.
export interface RelationshipState {
    readonly phase: RelationshipPhase;
}

// 4. Actions accepted by the FSM reducer.
export type RelationshipAction =
    | {
        readonly type: 'SET_PHASE';
        readonly phase: RelationshipPhase;
    }
    | {
        readonly type: 'RESET';
    };

// 5. Initial relationship state.
export const initialRelationshipState: RelationshipState = {
    phase: 'FRIENDS',
};
