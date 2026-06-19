/**
 * Claude Haiku summariser for RSS items.
 *
 * Returns one short sentence + 2-3 topic tags. Network/parse failures fall
 * back to a deterministic excerpt-based summary so the pipeline still ships
 * rows when ANTHROPIC_API_KEY is missing or the API hiccups.
 */

export type RssSummary = {
  summary: string;
  topics: string[];
};

const SYSTEM = `You summarise blog/press posts from AI companies for a job-search dashboard.
Return STRICT JSON, no preamble, no markdown:
{"summary": "<one sentence, max 25 words>", "topics": ["topic1","topic2"]}
Topics: 2-3 short lowercase phrases (e.g. "safety", "eu ai act", "frontier models", "hiring").
Summary: factual, no hype, no "this post". State what was announced or argued.`;

function fallback(title: string, excerpt: string): RssSummary {
  const summary = excerpt
    ? excerpt.split(/(?<=[.!?])\s+/)[0].slice(0, 200)
    : title.slice(0, 200);
  return { summary, topics: [] };
}

export async function summariseItem(
  title: string,
  excerpt: string,
): Promise<RssSummary> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return fallback(title, excerpt);

  const userMsg = `TITLE: ${title}\n\nEXCERPT: ${excerpt.slice(0, 1500)}`;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-3-5-haiku-latest",
        max_tokens: 200,
        system: SYSTEM,
        messages: [{ role: "user", content: userMsg }],
      }),
    });
    if (!res.ok) return fallback(title, excerpt);
    const data = (await res.json()) as {
      content?: Array<{ type: string; text?: string }>;
    };
    const text = data.content?.find((c) => c.type === "text")?.text ?? "";
    // Extract the first {...} block; the model occasionally wraps in prose.
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return fallback(title, excerpt);
    const parsed = JSON.parse(match[0]) as {
      summary?: unknown;
      topics?: unknown;
    };
    const summary =
      typeof parsed.summary === "string" && parsed.summary.trim()
        ? parsed.summary.trim()
        : fallback(title, excerpt).summary;
    const topics = Array.isArray(parsed.topics)
      ? parsed.topics
          .filter((t): t is string => typeof t === "string")
          .map((t) => t.toLowerCase().trim())
          .filter(Boolean)
          .slice(0, 3)
      : [];
    return { summary, topics };
  } catch {
    return fallback(title, excerpt);
  }
}
