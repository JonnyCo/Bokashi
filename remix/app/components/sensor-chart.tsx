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
  type ChartConfig,
  ChartTooltipContent,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
} from "./ui/chart";
import type { HistoricalDataPoint } from "~/types";

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

  // Determine if data spans more than 1 day to adjust tick formatting
  const timeSpan = React.useMemo(() => {
    if (!data || data.length < 2) return "day";

    const timestamps = data
      .filter((d) => d.timestamp)
      .map((d) => d.timestamp as number)
      .sort((a, b) => a - b);

    if (timestamps.length < 2) return "day";

    const firstDate = new Date(timestamps[0]);
    const lastDate = new Date(timestamps[timestamps.length - 1]);
    const diffMs = lastDate.getTime() - firstDate.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    if (diffDays >= 30) return "month";
    if (diffDays >= 7) return "week"; // Changed from 7 to 2 days
    return "day";
  }, [data]);

  // Formatter for X-axis ticks based on timespan
  const formatXAxisTick = React.useCallback(
    (value: string) => {
      if (!value) return "";

      // Check if the value is already formatted as a date (like "Jan 15")
      if (value.includes(" ")) {
        return value; // It's already formatted as a date
      }

      // For data points with actual timestamps, find the corresponding timestamp
      const dataPoint = data.find((d) => d.time === value);
      if (dataPoint?.timestamp) {
        const date = new Date(dataPoint.timestamp);

        if (timeSpan === "month") {
          // For months, show month/day
          return date.toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
          });
        } else if (timeSpan === "week") {
          // For weeks, show day of week
          return date.toLocaleDateString(undefined, {
            weekday: "short",
            day: "numeric",
          });
        }
      }

      // Default or day view: just return the time
      return value;
    },
    [data, timeSpan]
  );

  const CustomTooltip = ({
    active,
    payload,
    label,
  }: TooltipProps<ValueType, NameType>) => {
    if (active && payload && payload.length) {
      // Get the full date from the timestamp if available
      let dateDisplay = label;

      // First check if the label already contains date information (like from 7-day view)
      if (label && (label.includes(",") || label.includes(" "))) {
        dateDisplay = label; // Use the formatted date label
      }
      // Otherwise try to format from timestamp
      else if (payload[0]?.payload?.timestamp) {
        try {
          const timestamp = payload[0].payload.timestamp;
          // Format date as "MMM DD, YYYY at HH:MM AM/PM"
          const date = new Date(timestamp);
          dateDisplay =
            date.toLocaleDateString(undefined, {
              year: "numeric",
              month: "short",
              day: "numeric",
            }) +
            " at " +
            date.toLocaleTimeString(undefined, {
              hour: "2-digit",
              minute: "2-digit",
            });
        } catch (e) {
          console.error("Error formatting date:", e);
        }
      }

      return (
        <div className="bg-background/95 backdrop-blur-sm border border-border rounded-md shadow-lg p-3 min-w-[200px] z-50">
          <div className="text-sm font-semibold border-b pb-1.5 mb-1.5">
            {dateDisplay}
          </div>
          <div className="space-y-1.5">
            {payload.map((item, index) => {
              // Handle null or undefined values
              const value = item.value;
              const displayValue =
                value !== null && value !== undefined
                  ? typeof value === "number" && !Number.isInteger(value)
                    ? Number(value).toFixed(2)
                    : value
                  : "N/A";

              // Get the proper label from the chart config
              const dataKey = item.dataKey as keyof typeof chartConfig;
              const properLabel = chartConfig[dataKey]?.label || item.name;

              return (
                <div
                  key={`item-${index}`}
                  className="flex items-center justify-between gap-2 w-full py-1 hover:bg-muted/40 px-1 rounded"
                >
                  <div className="flex items-center gap-1.5">
                    <span
                      className="h-3 w-3 shrink-0 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm">{properLabel}:</span>
                  </div>
                  <span className="font-medium ml-auto text-sm">
                    {displayValue} {units[index] ?? ""}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-full w-full relative overflow-visible">
      <ChartContainer
        config={chartConfig}
        className="h-full w-full relative overflow-visible"
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            accessibilityLayer
            data={data}
            margin={{
              top: 10,
              right: 20,
              left: 10,
              bottom: 10,
            }}
            onMouseMove={(e) => {
              // This ensures the tooltip activates properly
              if (e) {
                const { activeTooltipIndex } = e;
                if (
                  activeTooltipIndex !== undefined &&
                  data[activeTooltipIndex]
                ) {
                  // The chart is already handling the tooltip, this just ensures it's reactive
                }
              }
            }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              opacity={0.3}
            />
            <XAxis
              dataKey="time"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
              interval="preserveStartEnd"
              tickFormatter={formatXAxisTick}
              minTickGap={15}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
              width={30}
              allowDecimals={false}
            />
            <RechartsTooltip
              cursor={{
                stroke: "hsl(var(--muted-foreground))",
                strokeWidth: 1,
                strokeDasharray: "3 3",
              }}
              content={<CustomTooltip />}
              wrapperStyle={{
                zIndex: 9999,
                visibility: "visible",
                position: "absolute",
                backgroundColor: "transparent",
                border: "none",
                pointerEvents: "none",
                boxShadow: "none",
              }}
              allowEscapeViewBox={{ x: true, y: true }}
            />
            <ChartLegend content={<ChartLegendContent />} />
            {dataKeys.map((key, index) => (
              <Area
                key={key}
                dataKey={key}
                type="monotone"
                fill={colors[index % colors.length]}
                fillOpacity={0.2}
                stroke={colors[index % colors.length]}
                strokeWidth={1.5}
                stackId="a"
                dot={false}
                connectNulls={true}
                activeDot={{
                  r: 5,
                  strokeWidth: 1.5,
                  fill: "hsl(var(--background))",
                  stroke: colors[index % colors.length],
                }}
                isAnimationActive={true}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
}
