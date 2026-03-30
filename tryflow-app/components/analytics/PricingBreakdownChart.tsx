"use client";

interface Props {
  data: { name: string; count: number }[];
  total: number;
}

const COLORS = [
  "bg-purple-500", "bg-violet-400", "bg-indigo-400", "bg-purple-300", "bg-violet-300",
];

export function PricingBreakdownChart({ data, total }: Props) {
  return (
    <div className="space-y-3">
      {data.map((item, i) => {
        const pct = total > 0 ? Math.round((item.count / total) * 100) : 0;
        return (
          <div key={item.name}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-gray-800">{item.name}</span>
              <span className="text-xs text-gray-500">
                <span className="font-bold text-gray-900">{item.count}</span> clicks · {pct}%
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
