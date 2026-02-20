import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export function BarChartCard({ title, data, barKey, color }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
      <div className="text-sm font-semibold">{title}</div>
      <div className="h-72 mt-3">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
            <Tooltip
              contentStyle={{ background: '#0b1220', border: '1px solid #1f2937' }}
              labelStyle={{ color: '#e2e8f0' }}
              itemStyle={{ color: '#e2e8f0' }}
            />
            <Bar dataKey={barKey} fill={color} radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
