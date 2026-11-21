import { NavLink, Outlet } from 'react-router';
import { people } from '../data/people';

export default function PeoplePage() {
  return (
    <div className="people-layout">
      <aside className="people-master">
        <h2>People</h2>

        {people.map(person => (
          <NavLink
            key={person.id}
            to={`/people/${person.id}`}
            className={({ isActive }) =>
              isActive ? 'person-link active' : 'person-link'
            }
          >
            {person.name}
          </NavLink>
        ))}
      </aside>

      <section className="people-detail-panel">
        <Outlet />
      </section>
    </div>
  );
}
