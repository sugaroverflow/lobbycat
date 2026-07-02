import { chromium } from "playwright";
import { readFileSync } from "node:fs";

// Targets are derived from the authoritative roles source map so the scout can
// never drift from the curated URLs. We browser-scout the entries that are not
// straightforward scripted-fetch ATS endpoints: careers pages that need a
// rendered DOM, plus anything explicitly flagged needs_browser.
// Optional CLI filter: `node pw-scout.mjs slug1 slug2` limits to those slugs.
const SOURCE_MAP = "research/sources/role-sources.json";
const BROWSER_STATUSES = new Set(["careers_page_found", "needs_browser"]);
// `--json` emits a machine-readable health diff (one record per slug) so
// heartbeats can flag URL rot automatically instead of eyeballing prose.
const rawArgs = process.argv.slice(2);
const emitJson = rawArgs.includes("--json");
const cliSlugs = new Set(rawArgs.filter((a) => !a.startsWith("--")));
const report = [];
const sourceMap = JSON.parse(readFileSync(new URL(SOURCE_MAP, import.meta.url), "utf8"));
const targets = (sourceMap.sources || [])
  .filter((e) => e && e.url && BROWSER_STATUSES.has(e.roleSourceStatus))
  .filter((e) => cliSlugs.size === 0 || cliSlugs.has(e.slug))
  .map((e) => [e.slug, e.url]);
console.log(`# pw-scout: ${targets.length} target(s) from ${SOURCE_MAP} (verified map ${sourceMap._updated || "?"})`);

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({
  userAgent: "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
  viewport: { width: 1360, height: 900 },
});
for (const [slug, url] of targets) {
  const page = await ctx.newPage();
  const results = [];
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
    await page.waitForTimeout(6000);
    const items = await page.evaluate(() => {
      const rows = [];
      const noise = /^(cookie|privacy|accessibility|home|about|contact|apply now|apply|search|menu|close|read more|learn more|find out|next|previous|log in|sign in|©|save|toggle|filter|sort|show more|view all)/i;
      const roleish = /(policy|counsel|governance|regulat|compliance|responsible|trust.{0,3}safety|ethics|public affairs|research fellow|advocacy|safeguard|analyst|associate|director|manager|lead|officer|principal|lawyer|solicitor|adviser|advisor|researcher|specialist|coordinator|programme|programm|scientist|engineer)/i;
      const seen = new Set();
      // Try structured job cards first
      const cards = document.querySelectorAll('[class*="job"], [class*="vacancy"], [class*="opportunity"], [class*="role"], [class*="position"], [class*="offer"], article, li, tr');
      for (const el of cards) {
        const text = (el.innerText || "").trim();
        if (!text || text.length < 15 || text.length > 400) continue;
        if (!roleish.test(text)) continue;
        const a = el.querySelector("a[href]");
        const href = a ? a.href : "";
        const key = text.slice(0, 80);
        if (seen.has(key)) continue;
        seen.add(key);
        rows.push({ text: text.replace(/\s+/g, " ").trim(), href });
        if (rows.length >= 30) break;
      }
      // Also scan all anchors for direct role-titled ones
      for (const a of document.querySelectorAll("a[href]")) {
        const text = (a.innerText || "").replace(/\s+/g, " ").trim();
        if (!text || text.length < 10 || text.length > 200) continue;
        if (noise.test(text)) continue;
        if (!roleish.test(text)) continue;
        const key = text.slice(0, 80);
        if (seen.has(key)) continue;
        seen.add(key);
        rows.push({ text, href: a.href });
        if (rows.length >= 40) break;
      }
      // Fall-back: page-level "no vacancies" detection
      const body = (document.body.innerText || "").toLowerCase();
      const emptyHints = [];
      for (const p of ["no vacancies", "no current vacancies", "no current opportunities", "no open positions", "there are currently no", "there are no", "no jobs", "check back", "no open roles"]) {
        if (body.includes(p)) emptyHints.push(p);
      }
      return { rows, emptyHints, urlFinal: location.href, title: document.title };
    });
    // Health classification: error already handled in catch; here we split
    // reachable pages into candidates_found / empty / unknown.
    const health = items.rows.length
      ? "candidates_found"
      : items.emptyHints.length
      ? "empty"
      : "unknown";
    report.push({
      slug,
      url,
      urlFinal: items.urlFinal,
      title: items.title,
      health,
      candidates: items.rows.length,
      emptyHints: items.emptyHints,
    });
    if (!emitJson) {
      console.log(`\n## ${slug}`);
      console.log(`URL ${items.urlFinal}`);
      console.log(`TITLE ${items.title}`);
      if (items.emptyHints.length) console.log(`EMPTY_HINTS: ${items.emptyHints.join(" | ")}`);
      for (const r of items.rows.slice(0, 20)) {
        console.log(`- ${r.text.slice(0, 180)}`);
        if (r.href) console.log(`  ${r.href}`);
      }
      if (!items.rows.length && !items.emptyHints.length) console.log("(no candidates, no empty hint)");
    }
  } catch (e) {
    report.push({ slug, url, health: "error", error: e.message });
    if (!emitJson) console.log(`\n## ${slug}\nERROR ${e.message}`);
  } finally {
    await page.close();
  }
}
await browser.close();

if (emitJson) {
  const summary = report.reduce((acc, r) => {
    acc[r.health] = (acc[r.health] || 0) + 1;
    return acc;
  }, {});
  process.stdout.write(
    JSON.stringify({ _scouted: new Date().toISOString(), summary, results: report }, null, 2) + "\n",
  );
}
