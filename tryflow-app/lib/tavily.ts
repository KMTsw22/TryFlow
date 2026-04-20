// Tavily search client — LLM-friendly web search API.
// https://tavily.com
//
// Single search per call. Pre-fetch pattern: we call this BEFORE the LLM
// and inject results into the user message. Agents cannot invent URLs
// because route.ts validates every cited URL against these results.

export type TavilyResult = {
  url: string;
  title: string;
  content: string;
  score: number;
};

export type TavilySearchResponse = {
  query: string;
  results: TavilyResult[];
  answer?: string;
};

type TavilySearchOptions = {
  query: string;
  maxResults?: number;
  searchDepth?: "basic" | "advanced";
  includeDomains?: string[];
};

const TAVILY_ENDPOINT = "https://api.tavily.com/search";

export function hasTavilyKey(): boolean {
  return !!process.env.TAVILY_API_KEY;
}

export async function tavilySearch(
  opts: TavilySearchOptions
): Promise<TavilySearchResponse | null> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch(TAVILY_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: apiKey,
        query: opts.query,
        search_depth: opts.searchDepth ?? "basic",
        max_results: opts.maxResults ?? 5,
        include_answer: false,
        ...(opts.includeDomains && opts.includeDomains.length > 0
          ? { include_domains: opts.includeDomains }
          : {}),
      }),
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) {
      console.warn(`Tavily ${res.status}: ${await res.text().catch(() => "")}`);
      return null;
    }

    const data = (await res.json()) as TavilySearchResponse;
    return data;
  } catch (err) {
    console.warn("Tavily search failed:", err);
    return null;
  }
}
