import './Skeleton.css';

export default function Skeleton({
  'aria-busy': ariaBusy = 'true',
  'aria-live': ariaLive = 'polite',
}) {
  return (
    <section
      className="skeleton-card"
      aria-busy={ariaBusy}
      aria-live={ariaLive}
      aria-label="Loading person details"
    >
      <div className="skeleton-avatar shimmer"></div>

      <div className="skeleton-info">
        <div className="skeleton-name shimmer"></div>
        <div className="skeleton-role shimmer"></div>
        <div className="skeleton-divider"></div>

        <div className="skeleton-field">
          <div className="skeleton-label shimmer"></div>
          <div className="skeleton-value shimmer"></div>
        </div>

        <div className="skeleton-field">
          <div className="skeleton-label shimmer"></div>
          <div className="skeleton-value shimmer"></div>
        </div>

        <div className="skeleton-field">
          <div className="skeleton-label shimmer"></div>
          <div className="skeleton-value shimmer"></div>
        </div>

        <div className="skeleton-field">
          <div className="skeleton-label shimmer"></div>
          <div className="skeleton-status shimmer"></div>
        </div>
      </div>
    </section>
  );
}
