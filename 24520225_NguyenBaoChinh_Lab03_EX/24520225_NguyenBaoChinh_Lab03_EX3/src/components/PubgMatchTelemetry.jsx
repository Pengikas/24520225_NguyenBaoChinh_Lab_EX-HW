
import { useEffect, useState } from "react";
import { fetchKraftonPubgTelemetry } from "../services/pubgTelemetry";
import styles from "./PubgMatchTelemetry.module.css";

const INITIAL_VIEW = {
    status: "IDLE",
    data: null,
    error: null,
};

function TelemetrySkeleton() {
    return (
        <section
            className={styles.skeleton}
            aria-label="Loading match telemetry"
            aria-busy="true"
        >
            <div className={styles.skeletonTitle} />
            <div className={styles.skeletonLine} />
            <div className={`${styles.skeletonLine} ${styles.skeletonLineShort}`} />

            <div className={styles.skeletonMetrics} aria-hidden="true">
                <div className={styles.skeletonMetric} />
                <div className={styles.skeletonMetric} />
                <div className={styles.skeletonMetric} />
            </div>

            <p className="visually-hidden">Loading PUBG VN telemetry...</p>
        </section>
    );
}

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
        return <TelemetrySkeleton />;
    }

    if (view.status === "ERROR") {
        return (
            <section className={styles.error} role="alert">
                <h2>Satellite Connection Lost</h2>
                <p>{view.error}</p>
                <button
                    className={styles.retryButton}
                    type="button"
                    onClick={() => setRetryTick((tick) => tick + 1)}
                >
                    Reconnect Satellite (Retry)
                </button>
            </section>
        );
    }

    const squad = view.data;

    return (
        <section
            className={styles.panel}
            aria-label={`${squad.name} match telemetry`}
        >
            <h2>{squad.name}</h2>
            <p className={styles.subtitle}>
                {squad.map} · Blue Zone Phase {squad.phase}
            </p>

            <dl className={styles.metrics}>
                <div className={styles.metric}>
                    <dt>Players Alive</dt>
                    <dd>{squad.alive}</dd>
                </div>

                <div className={styles.metric}>
                    <dt>Kills</dt>
                    <dd>{squad.kills}</dd>
                </div>

                <div className={styles.metric}>
                    <dt>WWCD Probability</dt>
                    <dd>{squad.wwcdProb}%</dd>
                </div>
            </dl>

            <p className={styles.status}>
                Match Status: {squad.status}
            </p>
        </section>
    );
}
