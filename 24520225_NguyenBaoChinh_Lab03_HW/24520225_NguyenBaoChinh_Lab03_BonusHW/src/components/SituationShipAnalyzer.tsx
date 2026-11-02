
import { useReducer } from 'react';
import { EffortAnalyzer } from './EffortAnalyzer';
import { GhostingTimer } from './GhostingTimer';

import {
    initialRelationshipState,
    type RelationshipPhase,
} from '../types/relationship';

import {
    allowedTransitions,
    relationshipReducer,
} from '../utils/relationshipReducer';

export function SituationShipAnalyzer() {
    // Single source of truth for relationship phase.
    const [state, dispatch] = useReducer(
        relationshipReducer,
        initialRelationshipState,
    );

    const { phase } = state;

    // All available relationship phases.
    const phases: RelationshipPhase[] = [
        'FRIENDS',
        'DATING_NO_LOVE',
        'OFFICIAL_LOVE',
        'GHOSTED_EXIT',
    ];

    // Only allow transitions defined in the FSM contract.
    const availableTransitions = allowedTransitions[phase];

    // Handle relationship state transition.
    function handleTransition(nextPhase: RelationshipPhase) {
        dispatch({
            type: 'SET_PHASE',
            phase: nextPhase,
        });
    }

    // Reset the relationship state.
    function handleReset() {
        dispatch({
            type: 'RESET',
        });
    }

    return (
        <main className="analyzer">
            <header className="hero">
                <div className="eyebrow">
                    APPLIED CREATIVE EXERCISE (V-POP FSM)
                </div>

                <h1>
                    Bonus Exercise: Hẹn Hò Nhưng Không Yêu
                </h1>

                <p>
                    Deterministic Relationship State Machine
                </p>
            </header>

            <section
                className="state-panel"
                aria-labelledby="relationship-heading"
            >
                <h2 id="relationship-heading">
                    Relationship State Machine
                </h2>

                <div className="current-state">
                    <span>Current Relationship Phase</span>

                    <output
                        className="phase-value"
                        role="status"
                        aria-live="polite"
                        aria-atomic="true"
                    >
                        {phase}
                    </output>
                </div>

                <div className="phase-list">
                    {phases.map((item) => (
                        <button
                            key={item}
                            type="button"
                            disabled={
                                !availableTransitions.includes(item)
                            }
                            aria-pressed={phase === item}
                            onClick={() => handleTransition(item)}
                        >
                            {item}
                        </button>
                    ))}
                </div>

                <div className="transition-info">
                    <h3>Available Transitions</h3>

                    <ul>
                        {availableTransitions.map((item) => (
                            <li key={item}>{item}</li>
                        ))}
                    </ul>
                </div>

                <button
                    type="button"
                    className="reset-button"
                    onClick={handleReset}
                >
                    Reset Relationship
                </button>
            </section>

            {/* M2 Asymmetric Effort Analyzer */}
            <EffortAnalyzer />

            {/* M3 Seen Không Rep - Ghosting Timer */}
            <GhostingTimer phase={phase} />
        </main>
    );
}
