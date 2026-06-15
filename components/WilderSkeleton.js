export function WilderSkeleton({ variant = "text", className = "", style }) {
  return (
    <div
      className={`wilder-skeleton wilder-skeleton--${variant}${className ? ` ${className}` : ""}`}
      style={style}
      aria-hidden="true"
    />
  );
}

export function WilderSkeletonList({ count = 3, variant = "row", className = "" }) {
  return (
    <div
      className={`wilder-skeleton-list${className ? ` ${className}` : ""}`}
      aria-busy="true"
      aria-hidden="true"
    >
      {Array.from({ length: count }, (_, i) => (
        <WilderSkeleton key={i} variant={variant} />
      ))}
    </div>
  );
}
