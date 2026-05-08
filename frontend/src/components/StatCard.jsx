export default function StatCard({ label, value, hint }) {
  return (
    <div className="card">
      <p className="text-sm text-slate-300">{label}</p>
      <h3 className="mt-3 text-3xl font-black">{value}</h3>
      {hint && <p className="mt-2 text-xs text-cyan-200">{hint}</p>}
    </div>
  );
}
