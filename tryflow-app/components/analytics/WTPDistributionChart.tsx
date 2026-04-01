"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface Props {
  values: number[];
  min: number;
  max: number;
}

export function WTPDistributionChart({ values, min, max }: Props) {
  if (values.length === 0) return (
    <div className="py-10 text-center text-gray-400 text-sm">No responses yet</div>
  );

  // Build buckets: split range into ~8 buckets
  const bucketCount = Math.min(8, max - min + 1);
  const step = Math.ceil((max - min) / bucketCount);
  const buckets: { label: string; count: number }[] = [];

  for (let i = 0; i < bucketCount; i++) {
    const lo = min + i * step;
    const hi = Math.min(lo + step - 1, max);
    buckets.push({
      label: lo === hi ? `$${lo}` : `$${lo}–$${hi}`,
      count: values.filter((v) => v >= lo && v <= hi).length,
    });
  }

  const avg = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
  const sorted = [...values].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <div className="flex-1 bg-teal-50 rounded-xl p-3 text-center">
          <p className="text-[10px] text-teal-600 font-semibold uppercase tracking-wider">Average WTP</p>
          <p className="text-2xl font-extrabold text-teal-700 mt-0.5">${avg}</p>
        </div>
        <div className="flex-1 bg-purple-50 rounded-xl p-3 text-center">
          <p className="text-[10px] text-purple-600 font-semibold uppercase tracking-wider">Median WTP</p>
          <p className="text-2xl font-extrabold text-purple-700 mt-0.5">${median}</p>
        </div>
        <div className="flex-1 bg-gray-50 rounded-xl p-3 text-center">
          <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Responses</p>
          <p className="text-2xl font-extrabold text-gray-700 mt-0.5">{values.length}</p>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={buckets} barSize={24} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip
            contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }}
            formatter={(v: number) => [v, "Responses"]}
          />
          <Bar dataKey="count" fill="#0D9488" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
