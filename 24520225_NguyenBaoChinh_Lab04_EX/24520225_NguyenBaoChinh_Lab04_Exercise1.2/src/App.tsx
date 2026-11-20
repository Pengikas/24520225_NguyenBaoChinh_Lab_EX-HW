import { BrowserRouter, Route, Routes } from 'react-router';

import MainLayout from './layouts/MainLayout';
import HomePage from './pages/HomePage';
import PeoplePage from './pages/PeoplePage';
import NotFoundPage from './pages/NotFoundPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/people" element={<PeoplePage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
