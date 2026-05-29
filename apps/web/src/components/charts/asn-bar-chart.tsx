"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Item = {
  label: string;
  count: number;
};

type AsnBarChartProps = {
  data: Item[];
  color: string;
};

export function AsnBarChart({ data, color }: AsnBarChartProps) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 8 }}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="4 4" horizontal={false} />
          <XAxis type="number" stroke="var(--muted-foreground)" axisLine={false} tickLine={false} />
          <YAxis
            type="category"
            dataKey="label"
            width={100}
            stroke="var(--muted-foreground)"
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: "color-mix(in oklab, var(--primary) 10%, transparent)" }}
            contentStyle={{
              background: "var(--popover)",
              border: "1px solid var(--border)",
              borderRadius: "16px",
            }}
          />
          <Bar dataKey="count" fill={color} radius={[0, 12, 12, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
