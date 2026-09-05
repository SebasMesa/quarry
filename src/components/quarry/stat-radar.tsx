import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";
import { ATTRIBUTE_LABELS } from "@/lib/data/archetypes";
import type { Stat } from "@/lib/data/types";

export function StatRadar({ stats, height = 240 }: { stats: Stat[]; height?: number }) {
  const data = stats.map((s) => ({
    attr: ATTRIBUTE_LABELS[s.attribute_key],
    value: s.value,
  }));

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} outerRadius="72%">
          <PolarGrid stroke="var(--border)" />
          <PolarAngleAxis
            dataKey="attr"
            tick={{
              fill: "var(--muted-foreground)",
              fontSize: 10,
              fontFamily: "var(--font-mono)",
            }}
          />
          <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
          <Radar
            dataKey="value"
            stroke="var(--amber)"
            fill="var(--amber)"
            fillOpacity={0.22}
            strokeWidth={1.5}
            isAnimationActive={false}
            dot={{ r: 2, fill: "var(--brass)" }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
