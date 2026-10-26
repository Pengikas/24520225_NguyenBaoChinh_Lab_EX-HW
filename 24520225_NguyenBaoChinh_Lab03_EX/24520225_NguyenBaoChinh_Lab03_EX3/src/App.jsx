
import { useState } from "react";
import { pubgVnSquads } from "./data/pubgVnSquads";
import PubgMatchTelemetry from "./components/PubgMatchTelemetry";

export default function App() {
    const [squadId, setSquadId] = useState("te");

    return (
        <main className="app">
            <header className="page-header">
                <p className="eyebrow">KRAFTON · PUBG VIETNAM SERIES</p>
                <h1>Live Match Telemetry</h1>
                <p>Monitor squad status and Blue Zone conditions.</p>
            </header>

            <nav className="squad-selector" aria-label="Select PUBG squad">
                {pubgVnSquads.map((squad) => (
                    <button
                        key={squad.id}
                        type="button"
                        aria-pressed={squadId === squad.id}
                        className={squadId === squad.id ? "squad-button active" : "squad-button"}
                        onClick={() => setSquadId(squad.id)}
                    >
                        {squad.name}
                    </button>
                ))}
            </nav>

            <PubgMatchTelemetry squadId={squadId} />
        </main>
    );
}
