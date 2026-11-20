import './Skeleton.css';

type SkeletonProps = {
  'aria-busy'?: boolean | 'true' | 'false';
  'aria-live'?: 'off' | 'polite' | 'assertive';
};

export default function Skeleton({
  'aria-busy': ariaBusy = 'true',
  'aria-live': ariaLive = 'polite',
}: SkeletonProps) {
  return (
    <section
      className="skeleton-card"
      aria-busy={ariaBusy}
      aria-live={ariaLive}
      aria-label="Loading person details"
    >
      {/* Avatar Skeleton */}
      <div className="skeleton-avatar shimmer"></div>

      {/* Person Information Skeleton */}
      <div className="skeleton-info">
        {/* Name */}
        <div className="skeleton-name shimmer"></div>

        {/* Role */}
        <div className="skeleton-role shimmer"></div>

        {/* Divider */}
        <div className="skeleton-divider"></div>

        {/* Full Name */}
        <div className="skeleton-field">
          <div className="skeleton-label shimmer"></div>
          <div className="skeleton-value shimmer"></div>
        </div>

        {/* Role */}
        <div className="skeleton-field">
          <div className="skeleton-label shimmer"></div>
          <div className="skeleton-value shimmer"></div>
        </div>

        {/* Department */}
        <div className="skeleton-field">
          <div className="skeleton-label shimmer"></div>
          <div className="skeleton-value shimmer"></div>
        </div>

        {/* Status */}
        <div className="skeleton-field">
          <div className="skeleton-label shimmer"></div>
          <div className="skeleton-status shimmer"></div>
        </div>
      </div>
    </section>
  );
}
