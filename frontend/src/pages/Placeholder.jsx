export function Placeholder({ title }) {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <div className="mt-2 text-sm text-slate-400">Coming next in this build.</div>
    </div>
  );
}
