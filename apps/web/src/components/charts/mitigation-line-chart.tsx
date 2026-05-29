"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { TimeBucketCount } from "@/lib/types";

type MitigationLineChartProps = {
  data: TimeBucketCount[];
};

export function MitigationLineChart({ data }: MitigationLineChartProps) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="4 4" vertical={false} />
          <XAxis
            dataKey="bucket"
            stroke="var(--muted-foreground)"
            tickLine={false}
            axisLine={false}
            tickMargin={12}
          />
          <YAxis
            stroke="var(--muted-foreground)"
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
          <Tooltip
            cursor={{ stroke: "var(--primary)", strokeOpacity: 0.3 }}
            contentStyle={{
              background: "var(--popover)",
              border: "1px solid var(--border)",
              borderRadius: "16px",
            }}
          />
          <Line
            type="monotone"
            dataKey="count"
            stroke="var(--chart-1)"
            strokeWidth={3}
            dot={{ fill: "var(--chart-1)", strokeWidth: 0, r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
