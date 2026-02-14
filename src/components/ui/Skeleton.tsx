interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div
      className={`bg-glupp-card-alt animate-pulse rounded-glupp ${className}`}
    />
  );
}
