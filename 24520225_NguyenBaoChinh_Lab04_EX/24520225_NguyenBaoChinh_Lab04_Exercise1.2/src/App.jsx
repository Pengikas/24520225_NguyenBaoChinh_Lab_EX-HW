// 1. Replace Switch with Routes
import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, NavLink, Outlet } from 'react-router';
import HomePage from './pages/HomePage';
import PeoplePage from './pages/PeoplePage';
import NotFoundPage from './pages/NotFoundPage';
import Skeleton from './Skeleton';
import { people } from './data/people';
import './App.css';

// Dynamic import via React.lazy
const PersonDetail = React.lazy(() =>
  import('./PersonDetail.jsx')
);

const Home = () => <HomePage />;

// 3. Layout with Outlet & Active NavLink
const Layout = () => (
  <div className="app-container">
    <header className="app-header">
      <h1>Exercise 1.2</h1>
      <p>React Router v7 Layout Architecture</p>

      <nav className="main-navigation">
        <NavLink
          to="/"
          end
          className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
        >
          Home
        </NavLink>

        <NavLink
          to="/people"
          className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
        >
          People
        </NavLink>
      </nav>
    </header>

    <main className="content-section">
      <Outlet />
    </main>

    <footer className="app-footer">React Router v7</footer>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 2. Element prop & Layout nesting */}
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />

          <Route path="people" element={<PeoplePage />}>
            <Route index element={<p>Select a person to view details.</p>} />
            <Route
              path=":id"
              element={
                // Resilient wrapper with Skeleton fallback
                <Suspense
                  fallback={
                    <Skeleton
                      aria-busy="true"
                      aria-live="polite"
                    />
                  }
                >
                  <PersonDetail people={people} />
                </Suspense>
              }
            />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
