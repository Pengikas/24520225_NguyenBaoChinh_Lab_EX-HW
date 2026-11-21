// PersonDetail.tsx — Lazy Loading
import React, { Suspense } from 'react';
import Skeleton from './Skeleton';

// Dynamic import via React.lazy
const PersonDetail = React.lazy(() =>
  import('./PersonDetail.jsx')
);

export default function PersonDetailLazy() {
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
      <PersonDetail />
    </Suspense>
  );
}
