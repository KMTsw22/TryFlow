"use client";

import { useState } from "react";
import { ExternalLink, AlertCircle, RefreshCw } from "lucide-react";

interface Props {
  url: string;
  productName: string;
}

export function ProjectEmbed({ url, productName }: Props) {
  const [blocked, setBlocked] = useState(false);

  return (
    <div className="relative w-full" style={{ height: "75vh" }}>
      {blocked ? (
        <div className="flex flex-col items-center justify-center h-full bg-gray-50 gap-4 text-center px-6">
          <AlertCircle className="w-10 h-10 text-amber-400" />
          <p className="text-gray-700 font-semibold">
            {productName} doesn&apos;t allow embedding
          </p>
          <p className="text-sm text-gray-400 max-w-sm">
            This site blocks iframes. Open it directly in a new tab to try it out.
          </p>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-purple-600 text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-purple-700 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Open {productName}
          </a>
        </div>
      ) : (
        <>
          <iframe
            src={url}
            title={productName}
            className="w-full h-full border-0"
            onError={() => setBlocked(true)}
            onLoad={(e) => {
              try {
                // If the iframe loaded but is cross-origin blocked, contentDocument will throw
                const doc = (e.target as HTMLIFrameElement).contentDocument;
                if (!doc) setBlocked(true);
              } catch {
                // cross-origin — that's fine, just can't read doc
              }
            }}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
          />
          {/* Refresh hint overlay — bottom right */}
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute bottom-4 right-4 inline-flex items-center gap-1.5 bg-white/90 backdrop-blur-sm border border-gray-200 text-gray-700 text-xs font-medium px-3 py-1.5 rounded-full shadow hover:bg-white transition"
          >
            <RefreshCw className="w-3 h-3" />
            Open in new tab
          </a>
        </>
      )}
    </div>
  );
}
