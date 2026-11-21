import { Link, useParams } from 'react-router';
import { people as defaultPeople } from './data/people';
import './PersonDetail.css';

export function NotFoundState({ id }) {
  return (
    <div className="not-found-state" role="alert">
      <div className="not-found-code">404</div>
      <h2>404 - Person Not Found</h2>
      <p>
        The requested person{id ? ` (ID: "${id}")` : ''} could not be found in the directory.
      </p>
      <Link to="/people" className="back-to-people-btn">
        ← Return to People Directory
      </Link>
    </div>
  );
}

// Lookup logic & JSX rendering
const PersonDetail = ({ people = defaultPeople }) => {
  const { id } = useParams();
  const person = people.find((p) => p.id === id);

  if (!person) {
    return <NotFoundState id={id} />;
  }

  return (
    <dl className="person-details">
      <dt>Name:</dt>
      <dd>{person.name}</dd>

      <dt>Role:</dt>
      <dd>{person.role}</dd>

      <dt>Department:</dt>
      <dd>{person.department}</dd>

      <dt>Status:</dt>
      <dd>{person.status}</dd>
    </dl>
  );
};

export default PersonDetail;
