import { useEffect, useState } from 'react';
import { fetchKraftonPubgTelemetry } from '../services/pubgTelemetry';

export function PubgMatchTelemetry({ squadId = 'te' }) {
  const [view, setView] = useState({ status: 'IDLE', data: null, error: null });
  const [retryTick, setRetryTick] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setView({ status: 'LOADING', data: null, error: null });
    fetchKraftonPubgTelemetry(squadId, { signal: controller.signal })
      .then((payload) => setView({ status: 'SUCCESS', data: payload, error: null }))
      .catch((err) => {
        if (err.name === 'AbortError') return;
        setView({ status: 'ERROR', data: null, error: err.message });
      });
    return () => controller.abort();
  }, [squadId, retryTick]);

  if (view.status === 'LOADING') return <section aria-busy='true' className='skeleton'>Syncing KRAFTON Radar...</section>;
  if (view.status === 'ERROR') return (
    <section role='alert'>
      <p>Blue-Zone Link Lost: {view.error}</p>
      <button type='button' onClick={() => setRetryTick((t) => t + 1)}>Reconnect Satellite</button>
    </section>
  );
  return <article aria-live='polite'><h3>{view.data?.name} — Kills: {view.data?.kills}</h3></article>;
}

export default PubgMatchTelemetry;
