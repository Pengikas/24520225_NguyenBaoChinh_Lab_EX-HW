
import React, { Suspense } from 'react';
import './App.css';

import Skeleton from './Skeleton';

// Dynamic import via React.lazy
const PersonDetail = React.lazy(() =>
  import('./PersonDetail')
);

function App() {
  return (
    <main className="app-container">

      <header className="app-header">
        <h1>Exercise 1.1</h1>
        <p>
          Performance & Resiliency Architectural Upgrades
        </p>
      </header>

      <section className="content-section">
        <h2>Person Information</h2>

        {/* Resilient wrapper with Skeleton fallback */}
        <Suspense
          fallback={
            <Skeleton
              aria-busy="true"
              aria-live="polite"
            />
          }
        >
          <PersonDetail />
        </Suspense>
      </section>

      <footer className="app-footer">
        React Lazy Loading & Suspense
      </footer>

    </main>
  );
}

export default App;
