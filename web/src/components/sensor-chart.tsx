"use client";

import * as React from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";
import type { TooltipProps } from "recharts";
import type {
  NameType,
  ValueType,
} from "recharts/types/component/DefaultTooltipContent";

import {
  ChartContainer,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { HistoricalDataPoint } from "../types";

interface SensorChartProps {
  data: HistoricalDataPoint[];
  dataKeys: Extract<keyof HistoricalDataPoint, string>[];
  colors: string[];
  units: string[];
}

export default function SensorChart({
  data,
  dataKeys,
  colors,
  units,
}: SensorChartProps) {
  const chartConfig = React.useMemo(() => {
    const config: ChartConfig = {};
    dataKeys.forEach((key, index) => {
      config[key] = {
        label: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, " "),
        color: colors[index % colors.length],
      };
    });
    return config;
  }, [dataKeys, colors]);

  const CustomTooltip = ({
    active,
    payload,
    label,
  }: TooltipProps<ValueType, NameType>) => {
    if (active && payload && payload.length) {
      return (
        <ChartTooltipContent
          className="w-[180px]"
          label={label}
          payload={payload}
          labelFormatter={(value) => `Time: ${value}`}
          formatter={(value, _, item, index) => (
            <div className="flex items-center justify-between gap-2 w-full">
              <div className="flex items-center gap-1.5">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
                  style={{ backgroundColor: item.color }}
                />
                {item.name}:
              </div>
              <span className="font-medium ml-auto">
                {value} {units[index] ?? ""}
              </span>
            </div>
          )}
        />
      );
    }
    return null;
  };

  return (
    <ChartContainer config={chartConfig} className="h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          accessibilityLayer
          data={data}
          margin={{
            top: 10,
            right: 20,
            left: 10,
            bottom: 0,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.5} />
          <XAxis
            dataKey="time"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
          />
          <RechartsTooltip cursor={false} content={<CustomTooltip />} />
          <ChartLegend content={<ChartLegendContent />} />
          {dataKeys.map((key) => (
            <Area
              key={key}
              dataKey={key}
              type="monotone"
              fill={`var(--color-${key})`}
              fillOpacity={0.3}
              stroke={`var(--color-${key})`}
              strokeWidth={2}
              stackId="a"
              dot={false}
              activeDot={{
                r: 5,
                strokeWidth: 1,
                fill: "hsl(var(--background))",
                stroke: `var(--color-${key})`,
              }}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
