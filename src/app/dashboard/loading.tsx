export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl animate-pulse space-y-4" aria-label="Loading">
      <div className="h-8 w-64 rounded-lg bg-line" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => <div key={i} className="h-28 rounded-2xl bg-white" />)}
      </div>
      <div className="h-72 rounded-2xl bg-white" />
    </div>
  );
}
