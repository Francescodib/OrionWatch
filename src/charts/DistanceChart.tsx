import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import { CHART_COLORS, CHART_MARGINS, CHART_FONT } from "./theme";
import type { SpacecraftState } from "@/data/targets/types";
import type { TrajectoryData } from "@/data/adapters/horizons";

interface DistanceChartProps {
  trajectory: TrajectoryData | null;
  history: SpacecraftState[];
  showMoon: boolean;
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatTimeShort(ts: number): string {
  return new Date(ts).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDistance(v: number): string {
  if (v >= 1e9) return `${(v / 1e9).toFixed(1)}B`;
  if (v >= 1e6) return `${(v / 1e6).toFixed(1)}M`;
  if (v >= 1e3) return `${(v / 1e3).toFixed(v >= 1e5 ? 0 : 1)}k`;
  return String(Math.round(v));
}

export default function DistanceChart({
  trajectory,
  history,
  showMoon,
}: DistanceChartProps) {
  const isTrajectoryMode = trajectory && (trajectory.past.length + trajectory.future.length) >= 2;

  const chartData = isTrajectoryMode
    ? [...trajectory.past, ...trajectory.future].map((s) => ({
        time: s.timestamp.getTime(),
        earth: Math.round(s.distanceFromEarthKm),
        moon: showMoon ? Math.round(s.distanceFromMoonKm) : undefined,
      }))
    : history.map((s) => ({
        time: s.timestamp.getTime(),
        earth: Math.round(s.distanceFromEarthKm),
        moon: showMoon ? Math.round(s.distanceFromMoonKm) : undefined,
      }));

  if (chartData.length < 2) return null;

  const nowTs = Date.now();
  const timeFormatter = isTrajectoryMode ? formatTime : formatTimeShort;

  // Auto-scale Y-axis for tight ranges
  const earthValues = chartData.map((d) => d.earth);
  const minVal = Math.min(...earthValues);
  const maxVal = Math.max(...earthValues);
  const range = maxVal - minVal;
  const needsZoom = range < minVal * 0.01 && range > 0;
  const padding = needsZoom ? Math.max(range * 2, minVal * 0.005) : 0;
  const yDomain: [number, number] | undefined = needsZoom
    ? [Math.floor(minVal - padding), Math.ceil(maxVal + padding)]
    : undefined;

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={chartData} margin={CHART_MARGINS}>
        <defs>
          <linearGradient id="earthProfileGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={CHART_COLORS.cyan} stopOpacity={0.25} />
            <stop offset="100%" stopColor={CHART_COLORS.cyan} stopOpacity={0.02} />
          </linearGradient>
          <linearGradient id="moonProfileGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={CHART_COLORS.amber} stopOpacity={0.15} />
            <stop offset="100%" stopColor={CHART_COLORS.amber} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
        <XAxis
          dataKey="time"
          type="number"
          domain={["dataMin", "dataMax"]}
          stroke={CHART_COLORS.axis}
          tick={{ fill: CHART_COLORS.axis, ...CHART_FONT }}
          tickFormatter={timeFormatter}
          minTickGap={50}
        />
        <YAxis
          type="number"
          stroke={CHART_COLORS.axis}
          tick={{ fill: CHART_COLORS.axis, ...CHART_FONT }}
          width={50}
          domain={yDomain ?? [0, "auto"]}
          allowDataOverflow={!!yDomain}
          tickFormatter={formatDistance}
        />
        <Tooltip
          contentStyle={{
            background: "rgba(10, 14, 26, 0.95)",
            border: `1px solid ${CHART_COLORS.tooltipBorder}`,
            borderRadius: 4,
            ...CHART_FONT,
          }}
          labelFormatter={(ts: number) =>
            new Date(ts).toLocaleString("en-US", {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })
          }
          formatter={(value: number, name: string) => [
            `${value.toLocaleString("en-US")} km`,
            name === "earth" ? "Earth" : "Moon",
          ]}
        />

        {/* Current time marker (trajectory mode only) */}
        {isTrajectoryMode && (
          <ReferenceLine
            x={nowTs}
            stroke={CHART_COLORS.amber}
            strokeWidth={1.5}
            strokeDasharray="4 3"
            label={{
              value: "NOW",
              fill: CHART_COLORS.amber,
              fontSize: 9,
              fontFamily: "Space Mono, monospace",
              position: "insideTopRight",
            }}
          />
        )}

        <Area
          type="monotone"
          dataKey="earth"
          name="earth"
          stroke={CHART_COLORS.cyan}
          fill="url(#earthProfileGrad)"
          strokeWidth={1.5}
          dot={false}
          isAnimationActive={false}
        />
        {showMoon && (
          <Area
            type="monotone"
            dataKey="moon"
            name="moon"
            stroke={CHART_COLORS.amber}
            fill="url(#moonProfileGrad)"
            strokeWidth={1}
            dot={false}
            isAnimationActive={false}
          />
        )}
      </AreaChart>
    </ResponsiveContainer>
  );
}
