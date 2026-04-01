"use client";

import { useRouter, useSearchParams } from "next/navigation";

type Experiment = { id: string; product_name: string };

export function ProjectSelector({ experiments }: { experiments: Experiment[] }) {
  const router = useRouter();
  const params = useSearchParams();
  const current = params.get("project") ?? "all";

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value;
    if (val === "all") router.push("/analytics");
    else router.push(`/analytics?project=${val}`);
  }

  return (
    <select
      value={current}
      onChange={onChange}
      className="h-8 pl-3 pr-8 text-xs font-semibold bg-white border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
    >
      <option value="all">All Projects</option>
      {experiments.map((e) => (
        <option key={e.id} value={e.id}>{e.product_name}</option>
      ))}
    </select>
  );
}
