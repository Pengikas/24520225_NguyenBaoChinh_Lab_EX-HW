import { useCallback, useState } from 'react';
import ArchitecturalFlaws from '../components/ArchitecturalFlaws';
import ExecutionTrace from '../components/ExecutionTrace';
import SimpleForm, { type TraceLogEntry } from '../components/SimpleForm';

export default function ValidationPage() {
  const [liveTrace, setLiveTrace] = useState<TraceLogEntry[]>([]);
  const [metrics, setMetrics] = useState({
    inputFieldRenders: 1,
    simpleFormRenders: 1,
    effectPassCount: 0,
    lastKeystrokeValue: 'a',
  });

  const handleTraceUpdate = useCallback(
    (
      logs: TraceLogEntry[],
      nextMetrics: {
        inputFieldRenders: number;
        simpleFormRenders: number;
        effectPassCount: number;
        lastKeystrokeValue: string;
      }
    ) => {
      setLiveTrace([...logs]);
      setMetrics(nextMetrics);
    },
    []
  );

  return (
    <div className="ex13-dashboard">
      <header className="ex13-header">
        <span className="ex13-badge">ANTI-PATTERN</span>
        <h1>Exercise 1.3: Legacy Validation Anti-Patterns</h1>
        <p className="ex13-subtitle">
          Deconstructing <span className="ex13-wavy">useEffect</span> Chaining Across{' '}
          <span className="ex13-wavy">InputField</span> &amp;{' '}
          <span className="ex13-wavy">SimpleForm</span>
        </p>
      </header>

      {/* Top 2-Column Architectural Spec Section matching Reference Image */}
      <div className="ex13-hero-grid">
        <ArchitecturalFlaws />

        <ExecutionTrace
          liveTrace={liveTrace}
          inputFieldRenders={metrics.inputFieldRenders}
          simpleFormRenders={metrics.simpleFormRenders}
          effectPassCount={metrics.effectPassCount}
          lastKeystrokeValue={metrics.lastKeystrokeValue}
        />
      </div>

      {/* Interactive Functional Demonstrations Section Below */}
      <SimpleForm onTraceUpdate={handleTraceUpdate} />

      <footer className="ex13-slide-footer">
        LAB 4 // MULTI-ROUTE SPA ARCHITECTURE
      </footer>
    </div>
  );
}
