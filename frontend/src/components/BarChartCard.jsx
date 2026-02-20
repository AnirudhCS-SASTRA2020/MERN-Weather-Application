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
    <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm">
      <div className="text-sm font-semibold">{title}</div>
      <div className="h-72 mt-3">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="name" tick={{ fill: '#475569', fontSize: 12 }} />
            <YAxis tick={{ fill: '#475569', fontSize: 12 }} />
            <Tooltip
              contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0' }}
              labelStyle={{ color: '#0f172a' }}
              itemStyle={{ color: '#0f172a' }}
            />
            <Bar dataKey={barKey} fill={color} radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
