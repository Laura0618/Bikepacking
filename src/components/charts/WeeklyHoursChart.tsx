import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { WeeklyHoursPoint } from '../../types';

export function WeeklyHoursChart({ data }: { data: WeeklyHoursPoint[] }): JSX.Element {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e6efe6" />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
          <YAxis tick={{ fontSize: 11 }} unit=" h" width={44} />
          <Tooltip
            formatter={(value: number, name: string) => [`${value} h`, name]}
            labelFormatter={(label: string) => `Semana del ${label}`}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="plannedHours" name="Planificado" fill="#8fbdd6" radius={[4, 4, 0, 0]} />
          <Bar dataKey="actualHours" name="Realizado" fill="#2f5d3a" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
