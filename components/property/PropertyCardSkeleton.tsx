export function PropertyCardSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-border bg-surface p-4">
      <div className="h-4 w-2/3 rounded bg-border" />
      <div className="mt-2 h-5 w-1/3 rounded bg-border" />
      <div className="mt-3 h-3 w-1/2 rounded bg-border" />
      <div className="mt-2 h-3 w-3/4 rounded bg-border" />
    </div>
  );
}
