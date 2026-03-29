import { Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AiInsightCardProps {
  insight: string;
  highlightedTerms?: string[];
}

export function AiInsightCard({ insight, highlightedTerms = [] }: AiInsightCardProps) {
  const highlighted = highlightedTerms.reduce((text, term) => {
    return text.replace(
      new RegExp(`(${term})`, "gi"),
      `<span class="text-primary-600 font-semibold">$1</span>`
    );
  }, insight);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg bg-primary-50 flex items-center justify-center">
          <Sparkles className="w-3.5 h-3.5 text-primary-600" />
        </div>
        <h3 className="text-sm font-semibold text-gray-900">
          AI Insight of the Day
        </h3>
      </div>
      <p
        className="text-sm text-gray-600 leading-relaxed"
        dangerouslySetInnerHTML={{ __html: highlighted }}
      />
      <Button variant="secondary" size="sm" className="mt-4 gap-1.5">
        Apply Strategy <ArrowRight className="w-3 h-3" />
      </Button>
    </div>
  );
}
