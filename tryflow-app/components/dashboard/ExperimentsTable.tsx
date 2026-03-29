"use client";

import Link from "next/link";
import { MoreHorizontal, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Experiment {
  id: string;
  name: string;
  type: string;
  status: "RUNNING" | "PAUSED" | "ENDED" | "DRAFT";
  visitors: number;
  conversionRate: number;
  date: string;
}

interface ExperimentsTableProps {
  experiments: Experiment[];
}

const STATUS_CONFIG = {
  RUNNING: { label: "Running", variant: "running" as const },
  PAUSED: { label: "Paused", variant: "paused" as const },
  ENDED: { label: "Ended", variant: "ended" as const },
  DRAFT: { label: "Draft", variant: "draft" as const },
};

const TYPE_ICON: Record<string, string> = {
  pricing: "A",
  cta: "B",
  headline: "H",
};

export function ExperimentsTable({ experiments }: ExperimentsTableProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <h2 className="text-base font-semibold text-gray-900">
          Recent Experiments
        </h2>
        <Link
          href="/experiments"
          className="text-sm text-primary-600 font-medium hover:text-primary-700 flex items-center gap-1"
        >
          View All <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
              Experiment Name
            </th>
            <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
              Status
            </th>
            <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
              Visitors
            </th>
            <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
              Conversion Rate
            </th>
            <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
              Date
            </th>
            <th className="px-6 py-3" />
          </tr>
        </thead>
        <tbody>
          {experiments.map((exp) => {
            const status = STATUS_CONFIG[exp.status];
            return (
              <tr
                key={exp.id}
                className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-primary-100 flex items-center justify-center text-xs font-bold text-primary-700">
                      {TYPE_ICON[exp.type] ?? "E"}
                    </div>
                    <span className="font-medium text-gray-900">{exp.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <Badge variant={status.variant}>{status.label}</Badge>
                </td>
                <td className="px-6 py-4 text-gray-600">
                  {exp.visitors.toLocaleString()}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <span className="text-gray-900 font-medium">
                      {exp.conversionRate.toFixed(1)}%
                    </span>
                    <div className="w-16 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-full bg-primary-500 rounded-full"
                        style={{ width: `${Math.min(exp.conversionRate * 4, 100)}%` }}
                      />
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-500">{exp.date}</td>
                <td className="px-6 py-4">
                  <button className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
