// PersonDetail.tsx — Lazy Loading
import React, { Suspense } from 'react';
import { Link, useParams } from 'react-router';
import { people as defaultPeople, type Person } from './data/people';
import Skeleton from './Skeleton';
import './PersonDetail.css';

// Dynamic import via React.lazy
const PersonDetail = React.lazy(() =>
  import('./PersonDetail.jsx')
);

export interface PersonDetailProps {
  people?: Person[];
}

export function NotFoundState({ id }: { id?: string }) {
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

// Lookup logic & JSX rendering (TypeScript implementation)
export const PersonDetailContent = ({ people = defaultPeople }: PersonDetailProps) => {
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

export default function PersonDetailLazy({ people = defaultPeople }: PersonDetailProps) {
  return (
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
  );
}
