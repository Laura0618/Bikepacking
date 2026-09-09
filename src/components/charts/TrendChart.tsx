import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface TrendPoint {
  label: string;
  value: number;
}

interface TrendChartProps {
  data: TrendPoint[];
  color?: string;
  unit?: string;
  name: string;
}

export function TrendChart({
  data,
  color = '#2f5d3a',
  unit = '',
  name,
}: TrendChartProps): JSX.Element {
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e6efe6" />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
          <YAxis tick={{ fontSize: 11 }} unit={unit ? ` ${unit}` : ''} width={44} />
          <Tooltip
            formatter={(value: number) => [`${value}${unit ? ` ${unit}` : ''}`, name]}
            labelFormatter={(label: string) => `Semana del ${label}`}
          />
          <Line
            type="monotone"
            dataKey="value"
            name={name}
            stroke={color}
            strokeWidth={2.5}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
