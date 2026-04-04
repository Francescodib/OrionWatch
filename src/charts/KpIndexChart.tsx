import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import { CHART_COLORS, CHART_FONT } from "./theme";
import type { KpIndexSample } from "@/data/targets/types";

interface KpIndexChartProps {
  data: KpIndexSample[];
}

function getKpColor(kp: number): string {
  if (kp >= 7) return CHART_COLORS.red;
  if (kp >= 5) return CHART_COLORS.amber;
  if (kp >= 4) return "#ddaa00";
  return CHART_COLORS.green;
}

function getKpLevel(kp: number): { label: string; color: string } {
  if (kp >= 7) return { label: "Severe storm", color: CHART_COLORS.red };
  if (kp >= 5) return { label: "Geomagnetic storm", color: CHART_COLORS.amber };
  if (kp >= 4) return { label: "Unsettled", color: "#ddaa00" };
  if (kp >= 2) return { label: "Quiet", color: CHART_COLORS.green };
  return { label: "Very quiet", color: CHART_COLORS.green };
}

export default function KpIndexChart({ data }: KpIndexChartProps) {
  // Show last 30 Kp readings for readability
  const chartData = data.slice(-30).map((s) => ({
    time: s.timestamp.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
    kp: s.kpIndex,
  }));

  const latestKp = data.at(-1)?.kpIndex ?? 0;
  const level = getKpLevel(latestKp);

  return (
    <div>
      <ResponsiveContainer width="100%" height={120}>
        <BarChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
          <XAxis
            dataKey="time"
            stroke={CHART_COLORS.axis}
            tick={{ fill: CHART_COLORS.axis, ...CHART_FONT }}
            minTickGap={40}
          />
          <YAxis
            domain={[0, 9]}
            ticks={[0, 3, 5, 7, 9]}
            stroke={CHART_COLORS.axis}
            tick={{ fill: CHART_COLORS.axis, ...CHART_FONT }}
            width={25}
          />
          <ReferenceLine y={5} stroke={CHART_COLORS.amber} strokeDasharray="3 3" strokeOpacity={0.5} label="" />
          <Tooltip
            contentStyle={{
              background: CHART_COLORS.tooltipBg,
              border: `1px solid ${CHART_COLORS.tooltipBorder}`,
              borderRadius: 6,
              ...CHART_FONT,
            }}
            formatter={(value: number) => [
              `Kp ${value} — ${getKpLevel(value).label}`,
              "",
            ]}
          />
          <Bar dataKey="kp" name="Kp" isAnimationActive={false}>
            {chartData.map((entry, i) => (
              <Cell key={i} fill={getKpColor(entry.kp)} fillOpacity={0.8} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex items-center justify-between mt-1.5 px-1">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm inline-block" style={{ background: CHART_COLORS.green, opacity: 0.8 }} />
            <span className="text-[9px] font-mono text-text-muted">0-3</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm inline-block" style={{ background: "#ddaa00", opacity: 0.8 }} />
            <span className="text-[9px] font-mono text-text-muted">4</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm inline-block" style={{ background: CHART_COLORS.amber, opacity: 0.8 }} />
            <span className="text-[9px] font-mono text-text-muted">5-6</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm inline-block" style={{ background: CHART_COLORS.red, opacity: 0.8 }} />
            <span className="text-[9px] font-mono text-text-muted">7-9</span>
          </div>
        </div>
        <span className="text-[9px] font-mono font-bold" style={{ color: level.color }}>
          Kp {latestKp} — {level.label}
        </span>
      </div>
    </div>
  );
}
