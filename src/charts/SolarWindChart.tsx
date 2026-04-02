import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import { CHART_COLORS, CHART_MARGINS, CHART_FONT } from "./theme";
import type { SolarWindSample } from "@/data/targets/types";

interface SolarWindChartProps {
  data: SolarWindSample[];
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function SolarWindChart({ data }: SolarWindChartProps) {
  const chartData = data.map((s) => ({
    time: s.timestamp.getTime(),
    bt: s.bt,
    bz: s.bz,
  }));

  const latestBt = data.at(-1)?.bt;
  const latestBz = data.at(-1)?.bz;

  return (
    <div>
      <ResponsiveContainer width="100%" height={160}>
        <LineChart data={chartData} margin={CHART_MARGINS}>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
          <XAxis
            dataKey="time"
            stroke={CHART_COLORS.axis}
            tick={{ fill: CHART_COLORS.axis, ...CHART_FONT }}
            tickFormatter={formatTime}
            minTickGap={50}
          />
          <YAxis
            stroke={CHART_COLORS.axis}
            tick={{ fill: CHART_COLORS.axis, ...CHART_FONT }}
            width={35}
          />
          <ReferenceLine y={0} stroke={CHART_COLORS.axis} strokeDasharray="2 4" strokeOpacity={0.4} />
          <Tooltip
            contentStyle={{
              background: CHART_COLORS.tooltipBg,
              border: `1px solid ${CHART_COLORS.tooltipBorder}`,
              borderRadius: 6,
              ...CHART_FONT,
            }}
            labelStyle={{ color: CHART_COLORS.axis }}
            labelFormatter={formatTime}
            formatter={(value: number, name: string) => [
              `${value.toFixed(1)} nT`,
              name === "bt" ? "Bt (total)" : "Bz (north-south)",
            ]}
          />
          <Line
            type="monotone"
            dataKey="bt"
            name="bt"
            stroke={CHART_COLORS.cyan}
            dot={false}
            strokeWidth={1.5}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="bz"
            name="bz"
            stroke={CHART_COLORS.amber}
            dot={false}
            strokeWidth={1.5}
            strokeDasharray="4 2"
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-1.5 px-1">
        <div className="flex items-center gap-1.5">
          <span className="w-4 h-px bg-cyan inline-block" />
          <span className="text-[8px] font-mono text-text-muted">
            Bt {latestBt != null ? `${latestBt.toFixed(1)} nT` : ""}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-4 h-px bg-amber inline-block border-dashed" style={{ borderTop: "1.5px dashed var(--color-amber)", background: "none" }} />
          <span className="text-[8px] font-mono text-text-muted">
            Bz {latestBz != null ? `${latestBz.toFixed(1)} nT` : ""}
          </span>
        </div>
      </div>
      <p className="text-[7px] font-mono text-text-muted/50 mt-1 px-1">
        Bz &lt; 0 (southward) = geomagnetically active
      </p>
    </div>
  );
}
