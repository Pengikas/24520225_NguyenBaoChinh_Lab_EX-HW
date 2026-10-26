
import { pubgVnSquads } from "../data/pubgVnSquads";

export function fetchKraftonPubgTelemetry(
    squadId,
    { signal } = {},
) {
    return new Promise((resolve, reject) => {
        const squad = pubgVnSquads.find(
            (item) => item.id === squadId,
        );

        if (!squad) {
            reject(new Error("Squad not found."));
            return;
        }

        if (signal?.aborted) {
            reject(new DOMException("Request aborted", "AbortError"));
            return;
        }

        const timeoutId = setTimeout(() => {
            signal?.removeEventListener("abort", handleAbort);

            const hasPacketLoss =
                ["Erangel", "Miramar"].includes(squad.map) &&
                Math.random() < 0.35;

            if (hasPacketLoss) {
                reject(new Error("Satellite telemetry connection lost."));
                return;
            }

            resolve(squad);
        }, 1800);

        function handleAbort() {
            clearTimeout(timeoutId);
            signal?.removeEventListener("abort", handleAbort);
            reject(new DOMException("Request aborted", "AbortError"));
        }

        signal?.addEventListener("abort", handleAbort, {
            once: true,
        });
    });
}
