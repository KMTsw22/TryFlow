"use client";

interface Props {
  data: { name: string; count: number }[];
  total: number;
}

const COLORS = [
  "bg-blue-500", "bg-cyan-500", "bg-teal-500", "bg-blue-400", "bg-cyan-400",
];

export function FeatureBreakdownChart({ data, total }: Props) {
  const max = Math.max(...data.map(d => d.count), 1);

  return (
    <div className="space-y-3">
      {data.map((item, i) => {
        const pct = Math.round((item.count / max) * 100);
        const sharePct = total > 0 ? Math.round((item.count / total) * 100) : 0;
        return (
          <div key={item.name}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-gray-800 truncate max-w-[60%]">{item.name}</span>
              <span className="text-xs text-gray-500 shrink-0">
                <span className="font-bold text-gray-900">{item.count}</span> votes · {sharePct}%
              </span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${COLORS[i % COLORS.length]}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
