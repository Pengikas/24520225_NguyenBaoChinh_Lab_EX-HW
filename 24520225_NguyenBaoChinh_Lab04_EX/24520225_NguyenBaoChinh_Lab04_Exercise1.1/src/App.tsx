import React, { Suspense } from 'react';
import './App.css';

import Skeleton from './Skeleton';

// Dynamic import via React.lazy (temporary 10s delay so you can test in Console)
const PersonDetail = React.lazy(async () => {
  await new Promise((resolve) => setTimeout(resolve, 10000));
  return import('./PersonDetail.jsx');
});

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
