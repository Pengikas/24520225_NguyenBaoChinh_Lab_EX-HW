import { useParams } from 'react-router';
import type { Person } from './data/people';
import './PersonDetail.css';

interface PersonDetailProps {
  people: Person[];
}

function NotFoundState() {
  return (
    <div className="not-found-state">
      <h2>404 - Person Not Found</h2>
      <p>The person you are looking for does not exist.</p>
    </div>
  );
}

const PersonDetail = ({ people }: PersonDetailProps) => {
  const { id } = useParams();

  const person = people.find(p => p.id === id);

  if (!person) return <NotFoundState />;

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
