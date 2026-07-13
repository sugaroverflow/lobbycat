// One-off publications-scoped browser probe for A&O Shearman AI insight indexes.
// The /insights/... listing pages are JS-gated ("Loading results" on static
// fetch), so a plain fetch cannot enumerate datelines. This renders the DOM and
// extracts article links + any visible datelines so a heartbeat can test whether
// publications[] (ceiling 2025-05-19) is stale. Read-only; prints, writes nothing.
import { chromium } from "playwright";

const TARGETS = [
  ["on-tech", "https://www.aoshearman.com/en/insights/ao-shearman-on-tech"],
  ["on-data", "https://www.aoshearman.com/en/insights/ao-shearman-on-data"],
];

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({
  userAgent:
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
  viewport: { width: 1360, height: 900 },
});

for (const [label, url] of TARGETS) {
  const page = await ctx.newPage();
  console.log(`\n## ${label}\nURL ${url}`);
  try {
    await page.goto(url, { waitUntil: "networkidle", timeout: 45000 });
    await page.waitForTimeout(4000);
    const data = await page.evaluate(() => {
      const out = [];
      const seen = new Set();
      // Insight article links live under /insights/ao-shearman-on-*/<slug>
      for (const a of document.querySelectorAll('a[href*="/insights/ao-shearman-on-"]')) {
        const href = a.href;
        // skip the index pages themselves
        if (/\/ao-shearman-on-(tech|data)$/.test(href.replace(/\/$/, ""))) continue;
        if (seen.has(href)) continue;
        seen.add(href);
        // Try to find a nearby dateline in the card
        let card = a.closest("article, li, div[class*='card'], div[class*='result'], div[class*='item']") || a.parentElement;
        let dateText = "";
        if (card) {
          const t = card.querySelector("time");
          if (t) dateText = (t.getAttribute("datetime") || t.innerText || "").trim();
          if (!dateText) {
            const m = (card.innerText || "").match(/\b(\d{1,2}\s+\w+\s+20\d{2}|20\d{2}-\d{2}-\d{2}|\w+\s+\d{1,2},?\s+20\d{2})\b/);
            if (m) dateText = m[1];
          }
        }
        const title = (a.innerText || "").replace(/\s+/g, " ").trim().slice(0, 140);
        out.push({ title, href, dateText });
        if (out.length >= 40) break;
      }
      const bodyHasLoading = (document.body.innerText || "").includes("Loading results");
      return { out, bodyHasLoading, title: document.title, urlFinal: location.href };
    });
    console.log(`TITLE ${data.title}`);
    console.log(`urlFinal ${data.urlFinal}  loadingResultsStillPresent=${data.bodyHasLoading}`);
    console.log(`article links found: ${data.out.length}`);
    for (const r of data.out.slice(0, 25)) {
      console.log(`- [${r.dateText || "no-date"}] ${r.title}`);
      console.log(`  ${r.href}`);
    }
  } catch (e) {
    console.log(`ERROR ${e.message}`);
  } finally {
    await page.close();
  }
}
await browser.close();
