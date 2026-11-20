import { NavLink, Outlet } from 'react-router';
import '../App.css';

export default function MainLayout() {
  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Exercise 1.2 &amp; 1.3</h1>
        <p>React Router v7 Layout Architecture &amp; Legacy Validation Anti-Patterns</p>

        <nav className="main-navigation">
          <NavLink
            to="/"
            className={({ isActive }) =>
              isActive ? 'nav-link active' : 'nav-link'
            }
            end
          >
            Home
          </NavLink>

          <NavLink
            to="/people"
            className={({ isActive }) =>
              isActive ? 'nav-link active' : 'nav-link'
            }
          >
            People
          </NavLink>

          <NavLink
            to="/validation"
            className={({ isActive }) =>
              isActive ? 'nav-link active' : 'nav-link'
            }
          >
            Exercise 1.3: Validation
          </NavLink>
        </nav>
      </header>

      <main className="content-section">
        <Outlet />
      </main>

      <footer className="app-footer">
        React Router v7
      </footer>
    </div>
  );
}
