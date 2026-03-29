import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string;
  change: number;
  icon: React.ReactNode;
  className?: string;
}

export function StatsCard({
  title,
  value,
  change,
  icon,
  className,
}: StatsCardProps) {
  const isPositive = change >= 0;

  return (
    <div
      className={cn(
        "bg-white rounded-2xl border border-gray-200 p-6 shadow-sm",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600">
          {icon}
        </div>
        <span
          className={cn(
            "flex items-center gap-1 text-xs font-semibold",
            isPositive ? "text-emerald-600" : "text-red-500"
          )}
        >
          {isPositive ? (
            <TrendingUp className="w-3 h-3" />
          ) : (
            <TrendingDown className="w-3 h-3" />
          )}
          {isPositive ? "+" : ""}
          {change}%
        </span>
      </div>
      <p className="mt-4 text-sm text-gray-500">{title}</p>
      <p className="mt-1 text-3xl font-bold text-gray-900">{value}</p>
    </div>
  );
}
