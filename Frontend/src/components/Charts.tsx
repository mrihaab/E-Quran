import React from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';

// Color schemes for consistent theming
const COLORS = {
  primary: ['#3B82F6', '#1D4ED8', '#1E40AF', '#1E3A8A'],
  success: ['#10B981', '#059669', '#047857', '#065F46'],
  warning: ['#F59E0B', '#D97706', '#B45309', '#92400E'],
  danger: ['#EF4444', '#DC2626', '#B91C1C', '#991B1B'],
  purple: ['#8B5CF6', '#7C3AED', '#6D28D9', '#5B21B6'],
  blue: ['#3B82F6', '#2563EB', '#1D4ED8', '#1E40AF'],
  green: ['#10B981', '#059669', '#047857', '#065F46'],
  orange: ['#F97316', '#EA580C', '#C2410C', '#9A3412']
};

// Custom tooltip component
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-slate-200 rounded-lg shadow-lg">
        <p className="text-sm font-semibold text-slate-900">{`${label}`}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {`${entry.dataKey}: ${entry.value}${entry.unit || ''}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Progress Bar Component (for completion percentages)
export const ProgressBar = ({
  value,
  max = 100,
  color = 'primary',
  showPercentage = true,
  height = 'h-3',
  className = ''
}: {
  value: number;
  max?: number;
  color?: keyof typeof COLORS;
  showPercentage?: boolean;
  height?: string;
  className?: string;
}) => {
  const percentage = Math.min((value / max) * 100, 100);
  const colorScheme = COLORS[color] || COLORS.primary;

  return (
    <div className={`w-full bg-slate-100 ${height} rounded-full overflow-hidden ${className}`}>
      <div
        className={`${height} rounded-full transition-all duration-500 ease-out`}
        style={{
          width: `${percentage}%`,
          backgroundColor: colorScheme[0]
        }}
      />
      {showPercentage && (
        <div className="text-xs text-slate-600 mt-1 text-right">
          {Math.round(percentage)}%
        </div>
      )}
    </div>
  );
};

// Line Chart Component (for progress over time)
export const ProgressLineChart = ({
  data,
  title,
  dataKey = 'value',
  color = 'primary',
  height = 300,
  showGrid = true,
  showLegend = false
}: {
  data: any[];
  title?: string;
  dataKey?: string;
  color?: keyof typeof COLORS;
  height?: number;
  showGrid?: boolean;
  showLegend?: boolean;
}) => {
  const colorScheme = COLORS[color] || COLORS.primary;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      {title && <h3 className="text-lg font-bold text-slate-900 mb-4">{title}</h3>}
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />}
          <XAxis
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: '#64748b' }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: '#64748b' }}
          />
          <Tooltip content={<CustomTooltip />} />
          {showLegend && <Legend />}
          <Line
            type="monotone"
            dataKey={dataKey}
            stroke={colorScheme[0]}
            strokeWidth={3}
            dot={{ fill: colorScheme[0], strokeWidth: 2, r: 6 }}
            activeDot={{ r: 8, stroke: colorScheme[0], strokeWidth: 2, fill: '#fff' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

// Bar Chart Component (for comparisons)
export const ComparisonBarChart = ({
  data,
  title,
  dataKey = 'value',
  color = 'primary',
  height = 300,
  showGrid = true,
  showLegend = false
}: {
  data: any[];
  title?: string;
  dataKey?: string;
  color?: keyof typeof COLORS;
  height?: number;
  showGrid?: boolean;
  showLegend?: boolean;
}) => {
  const colorScheme = COLORS[color] || COLORS.primary;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      {title && <h3 className="text-lg font-bold text-slate-900 mb-4">{title}</h3>}
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />}
          <XAxis
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: '#64748b' }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: '#64748b' }}
          />
          <Tooltip content={<CustomTooltip />} />
          {showLegend && <Legend />}
          <Bar
            dataKey={dataKey}
            fill={colorScheme[0]}
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

// Pie Chart Component (for distribution)
export const DistributionPieChart = ({
  data,
  title,
  dataKey = 'value',
  nameKey = 'name',
  colors = 'primary',
  height = 300,
  showLegend = true
}: {
  data: any[];
  title?: string;
  dataKey?: string;
  nameKey?: string;
  colors?: keyof typeof COLORS;
  height?: number;
  showLegend?: boolean;
}) => {
  const colorScheme = COLORS[colors] || COLORS.primary;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      {title && <h3 className="text-lg font-bold text-slate-900 mb-4">{title}</h3>}
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : '0'}%`}
            outerRadius={80}
            fill={colorScheme[0]}
            dataKey={dataKey}
            nameKey={nameKey}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colorScheme[index % colorScheme.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          {showLegend && <Legend />}
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

// Donut Chart Component (alternative to pie chart)
export const DonutChart = ({
  data,
  title,
  dataKey = 'value',
  nameKey = 'name',
  colors = 'primary',
  height = 300,
  showLegend = true,
  innerRadius = 60
}: {
  data: any[];
  title?: string;
  dataKey?: string;
  nameKey?: string;
  colors?: keyof typeof COLORS;
  height?: number;
  showLegend?: boolean;
  innerRadius?: number;
}) => {
  const colorScheme = COLORS[colors] || COLORS.primary;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      {title && <h3 className="text-lg font-bold text-slate-900 mb-4">{title}</h3>}
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={100}
            paddingAngle={5}
            dataKey={dataKey}
            nameKey={nameKey}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colorScheme[index % colorScheme.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          {showLegend && <Legend />}
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

// Area Chart Component (for trends over time)
export const TrendAreaChart = ({
  data,
  title,
  dataKey = 'value',
  color = 'primary',
  height = 300,
  showGrid = true,
  showLegend = false
}: {
  data: any[];
  title?: string;
  dataKey?: string;
  color?: keyof typeof COLORS;
  height?: number;
  showGrid?: boolean;
  showLegend?: boolean;
}) => {
  const colorScheme = COLORS[color] || COLORS.primary;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      {title && <h3 className="text-lg font-bold text-slate-900 mb-4">{title}</h3>}
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />}
          <XAxis
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: '#64748b' }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: '#64748b' }}
          />
          <Tooltip content={<CustomTooltip />} />
          {showLegend && <Legend />}
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke={colorScheme[0]}
            fill={colorScheme[0]}
            fillOpacity={0.3}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};