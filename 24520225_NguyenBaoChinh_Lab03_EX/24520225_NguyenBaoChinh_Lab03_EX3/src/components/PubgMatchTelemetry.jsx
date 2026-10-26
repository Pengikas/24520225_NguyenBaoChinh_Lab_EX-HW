
import { useEffect, useState } from "react";
import { fetchKraftonPubgTelemetry } from "../services/pubgTelemetry";

const INITIAL_VIEW = {
    status: "IDLE",
    data: null,
    error: null,
};

export default function PubgMatchTelemetry({ squadId }) {
    const [view, setView] = useState(INITIAL_VIEW);
    const [retryTick, setRetryTick] = useState(0);

    useEffect(() => {
        const controller = new AbortController();

        setView({
            status: "LOADING",
            data: null,
            error: null,
        });

        fetchKraftonPubgTelemetry(squadId, {
            signal: controller.signal,
        })
            .then((data) => {
                setView({
                    status: "SUCCESS",
                    data,
                    error: null,
                });
            })
            .catch((error) => {
                if (error.name === "AbortError") {
                    return;
                }

                setView({
                    status: "ERROR",
                    data: null,
                    error: error.message || "Unable to load telemetry.",
                });
            });

        return () => controller.abort();
    }, [squadId, retryTick]);

    if (view.status === "IDLE" || view.status === "LOADING") {
        return (
            <section aria-busy="true" aria-label="Loading match telemetry">
                <p>Loading PUBG VN telemetry...</p>
            </section>
        );
    }

    if (view.status === "ERROR") {
        return (
            <section role="alert">
                <h2>Satellite Connection Lost</h2>
                <p>{view.error}</p>
                <button onClick={() => setRetryTick((tick) => tick + 1)}>
                    Reconnect Satellite (Retry)
                </button>
            </section>
        );
    }

    const squad = view.data;

    return (
        <section aria-label={`${squad.name} match telemetry`}>
            <h2>{squad.name}</h2>
            <dl>
                <dt>Map</dt>
                <dd>{squad.map}</dd>

                <dt>Blue Zone Phase</dt>
                <dd>{squad.phase}</dd>

                <dt>Players Alive</dt>
                <dd>{squad.alive}</dd>

                <dt>Kills</dt>
                <dd>{squad.kills}</dd>

                <dt>WWCD Probability</dt>
                <dd>{squad.wwcdProb}%</dd>

                <dt>Status</dt>
                <dd>{squad.status}</dd>
            </dl>
        </section>
    );
}
