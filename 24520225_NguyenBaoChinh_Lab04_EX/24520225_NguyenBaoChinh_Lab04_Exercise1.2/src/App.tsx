import {
  BrowserRouter,
  Route,
  Routes,
} from 'react-router';

import MainLayout from './layouts/MainLayout';
import HomePage from './pages/HomePage';
import PeoplePage from './pages/PeoplePage';
import NotFoundPage from './pages/NotFoundPage';

import PersonDetail from './PersonDetail';
import { people } from './data/people';

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
              element={<PersonDetail people={people} />}
            />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
