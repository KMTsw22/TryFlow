import { Trophy } from "lucide-react";

interface WinningVariantCardProps {
  planName: string;
  price: string;
  experimentName: string;
}

export function WinningVariantCard({
  planName,
  price,
  experimentName,
}: WinningVariantCardProps) {
  return (
    <div className="bg-primary-600 rounded-2xl p-6 text-white shadow-sm flex flex-col justify-between h-full">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-primary-200">
          Winning Variant
        </span>
        <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
          <Trophy className="w-4 h-4 text-white" />
        </div>
      </div>
      <div>
        <p className="text-sm text-primary-200 mt-4">Best Performing Price</p>
        <p className="text-4xl font-bold mt-1">{price}</p>
        <p className="text-xs text-primary-200 mt-1">{planName}</p>
      </div>
      <p className="text-xs text-primary-300 mt-4 truncate">{experimentName}</p>
    </div>
  );
}
