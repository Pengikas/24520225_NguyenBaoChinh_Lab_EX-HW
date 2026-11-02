
import { useReducer, useState, useId } from 'react';
import type { FormEvent } from 'react';
import type { EffortSignal } from '../types/relationship';

import {
    effortReducer,
    initialEffortState,
    deriveEffortState,
} from '../utils/effortReducer';

export function EffortAnalyzer() {
    // Independent input states.
    const [actor, setActor] = useState<'EM' | 'AI_DO'>('EM');
    const [steps, setSteps] = useState('100');
    const [multiplier, setMultiplier] = useState('0.1');
    const actorId = useId();
    const stepsId = useId();
    const multiplierId = useId();
    // Immutable effort action log.
    const [state, dispatch] = useReducer(
        effortReducer,
        initialEffortState,
    );

    // Derived state is calculated from the action log.
    const summary = deriveEffortState(state.signals);

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const parsedSteps = Number(steps);
        const parsedMultiplier = Number(multiplier);

        if (
            !Number.isFinite(parsedSteps) ||
            !Number.isFinite(parsedMultiplier) ||
            parsedSteps < 0 ||
            parsedMultiplier < 0
        ) {
            return;
        }

        const signal: EffortSignal = {
            id: crypto.randomUUID(),
            actor,
            steps: parsedSteps,
            multiplier: parsedMultiplier,
        };

        dispatch({
            type: 'ADD_SIGNAL',
            signal,
        });
    }

    function addExample() {
        const exampleSignals: EffortSignal[] = [
            {
                id: crypto.randomUUID(),
                actor: 'EM',
                steps: 100,
                multiplier: 0.1,
            },
            {
                id: crypto.randomUUID(),
                actor: 'AI_DO',
                steps: 1,
                multiplier: 50,
            },
        ];

        exampleSignals.forEach((signal) => {
            dispatch({
                type: 'ADD_SIGNAL',
                signal,
            });
        });
    }

    function handleReset() {
        dispatch({
            type: 'RESET_LOG',
        });
    }

    return (
        <section className="effort-panel" aria-labelledby="effort-heading">
            <header>
                <p className="section-label">MILESTONE 02</p>

                <h2 id="effort-heading">
                    Asymmetric Effort Analyzer
                </h2>

                <p>
                    Cố trăm lần chưa chắc bằng một phần đúng trọng lượng.
                </p>
            </header>


            <form className="effort-form" onSubmit={handleSubmit}>
                <label htmlFor={actorId}>
                    Actor
                </label>

                <select
                    id={actorId}
                    value={actor}
                    onChange={(event) =>
                        setActor(event.target.value as 'EM' | 'AI_DO')
                    }
                >
                    <option value="EM">EM</option>
                    <option value="AI_DO">AI_DO</option>
                </select>

                <label htmlFor={stepsId}>
                    Steps
                </label>

                <input
                    id={stepsId}
                    type="number"
                    min="0"
                    step="any"
                    value={steps}
                    onChange={(event) => setSteps(event.target.value)}
                    required
                />

                <label htmlFor={multiplierId}>
                    Multiplier
                </label>

                <input
                    id={multiplierId}
                    type="number"
                    min="0"
                    step="any"
                    value={multiplier}
                    onChange={(event) =>
                        setMultiplier(event.target.value)
                    }
                    required
                />

                <button type="submit">
                    Add Effort Signal
                </button>
            </form>


            <div className="effort-actions">
                <button type="button" onClick={addExample}>
                    Load Assignment Example
                </button>

                <button type="button" onClick={handleReset}>
                    Reset Effort Logs
                </button>
            </div>

            <div className="effort-results">
                <article className="effort-card">
                    <h3>EM</h3>
                    <p>Raw steps: {summary.emSteps}</p>
                    <strong>
                        {summary.emWeightedEffort.toFixed(2)}
                    </strong>
                    <span>Weighted effort</span>
                </article>

                <article className="effort-card">
                    <h3>AI_DO</h3>
                    <p>Raw steps: {summary.aiDoSteps}</p>
                    <strong>
                        {summary.aiDoWeightedEffort.toFixed(2)}
                    </strong>
                    <span>Weighted effort</span>
                </article>
            </div>

            <div className="effort-total">
                <p>
                    Total weighted effort
                </p>

                <strong>
                    {summary.totalWeightedEffort.toFixed(2)}
                </strong>

                <p>
                    Imbalance ratio:{' '}
                    {summary.imbalanceRatio === null
                        ? 'N/A'
                        : `${summary.imbalanceRatio.toFixed(2)}x`}
                </p>
            </div>


            <section
                className={`red-flag ${summary.isRedFlag ? 'active' : ''
                    }`}
                aria-labelledby="red-flag-heading"
            >
                <h3 id="red-flag-heading">
                    {summary.isRedFlag ? 'RED FLAG' : 'BALANCED STATUS'}
                </h3>

                <output
                    role="status"
                    aria-live="polite"
                    aria-atomic="true"
                >
                    {summary.redFlagMessage}
                </output>
            </section>


            <div className="effort-log">
                <h3>Immutable Action Logs</h3>

                {state.signals.length === 0 ? (
                    <p>No effort signals recorded.</p>
                ) : (
                    <ul>
                        {state.signals.map((signal) => (
                            <li key={signal.id}>
                                <span>
                                    {signal.actor}: {signal.steps} ×{' '}
                                    {signal.multiplier} ={' '}
                                    {(signal.steps * signal.multiplier).toFixed(2)}
                                </span>

                                <button
                                    type="button"
                                    aria-label={`Remove ${signal.actor} effort signal`}
                                    onClick={() =>
                                        dispatch({
                                            type: 'REMOVE_SIGNAL',
                                            id: signal.id,
                                        })
                                    }
                                >
                                    Remove
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </section>
    );
}
