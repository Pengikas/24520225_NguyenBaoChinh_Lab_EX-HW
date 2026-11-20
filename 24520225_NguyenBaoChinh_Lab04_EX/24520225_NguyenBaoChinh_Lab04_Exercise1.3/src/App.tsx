import React, { Suspense } from 'react';
import {
  BrowserRouter,
  Route,
  Routes,
} from 'react-router';

import MainLayout from './layouts/MainLayout';
import HomePage from './pages/HomePage';
import PeoplePage from './pages/PeoplePage';
import ValidationPage from './pages/ValidationPage';
import NotFoundPage from './pages/NotFoundPage';

import Skeleton from './Skeleton';
import { people } from './data/people';

// Dynamic import via React.lazy (Preserved from Exercise 1.1)
const PersonDetail = React.lazy(() => import('./PersonDetail'));

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<HomePage />} />

          <Route path="/people" element={<PeoplePage />}>
            <Route
              index
              element={<p>Select a person to view details.</p>}
            />

            <Route
              path=":id"
              element={
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

          <Route path="/validation" element={<ValidationPage />} />

          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
