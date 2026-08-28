import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

export interface ChartPoint {
  label: string
  value: number
}

export function ProgressChart({ data, unit }: { data: ChartPoint[]; unit: string }) {
  if (data.length < 2) {
    return (
      <div className="grid h-52 place-items-center rounded-2xl bg-zinc-900 text-sm text-zinc-500">
        Log at least two sessions to see a trend.
      </div>
    )
  }
  return (
    <div className="h-52 rounded-2xl bg-zinc-900 p-3 pl-0">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid stroke="#27272a" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: '#71717a', fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: '#3f3f46' }}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fill: '#71717a', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={40}
            domain={['auto', 'auto']}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#18181b',
              border: '1px solid #3f3f46',
              borderRadius: 12,
              color: '#f4f4f5',
              fontSize: 13,
            }}
            formatter={(value) => [`${Math.round(Number(value) * 10) / 10} ${unit}`, '']}
            separator=""
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#60a5fa"
            strokeWidth={2}
            dot={{ r: 3, fill: '#60a5fa', strokeWidth: 0 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
