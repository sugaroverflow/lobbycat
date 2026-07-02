#!/usr/bin/env node

import { chromium } from "playwright";

const targets = [
  {
    slug: "microsoft-ai-london",
    url: "https://jobs.careers.microsoft.com/global/en/search?lc=London%2C%20United%20Kingdom&rt=Professional&l=en_us",
  },
  {
    slug: "meta-london-policy",
    url: "https://www.metacareers.com/jobs/?offices[0]=London%2C%20United%20Kingdom",
  },
  {
    slug: "quantumblack-london",
    url: "https://www.mckinsey.com/careers/search-jobs?locations=London&query=QuantumBlack",
  },
  {
    slug: "oxford-internet-institute",
    url: "https://www.oii.ox.ac.uk/people/vacancies/",
  },
  {
    slug: "ico-ai",
    url: "https://ico.org.uk/about-the-ico/jobs/",
  },
  {
    slug: "bank-of-england-ai",
    url: "https://www.bankofengland.co.uk/careers",
  },
  {
    slug: "i-dot-ai",
    url: "https://ai.gov.uk/opportunities/",
  },
  {
    slug: "royal-society-policy",
    url: "https://royalsociety.occupop-careers.com/",
  },
  {
    slug: "bbc-responsible-ai",
    url: "https://careers.bbc.co.uk/",
  },
  {
    slug: "bennett-cambridge",
    url: "https://www.jobs.cam.ac.uk/job/?unit=u00601",
  },
];

const keep = /\b(ai|artificial intelligence|policy|public affairs|governance|regulat|legal|counsel|safety|security|responsible|trust|ethic|data|digital|technology|quantumblack|mckinsey|research fellow|civil service|vacanc|job)\b/i;
const noisy = /\b(cookie|privacy notice|accessibility|newsletter|sign in|saved jobs|job alert|equal opportunity|terms|close|menu)\b/i;

function compact(text) {
  return String(text || "").replace(/\s+/g, " ").trim();
}

const browser = await chromium.launch({ headless: true });
for (const target of targets) {
  const page = await browser.newPage({ viewport: { width: 1360, height: 900 } });
  try {
    await page.goto(target.url, { waitUntil: "domcontentloaded", timeout: 45000 });
    await page.waitForTimeout(6000);
    const candidates = await page.evaluate(
      ({ keepSource, noisySource }) => {
        const keep = new RegExp(keepSource, "i");
        const noisy = new RegExp(noisySource, "i");
        const rows = [];
        const seen = new Set();
        for (const a of document.querySelectorAll("a[href]")) {
          const text = a.innerText || a.textContent || "";
          const href = new URL(a.getAttribute("href"), location.href).href;
          const context = [
            text,
            a.closest("li, article, section, div")?.innerText || "",
          ]
            .join(" ")
            .replace(/\s+/g, " ")
            .trim();
          if (!keep.test(context) && !keep.test(href)) continue;
          if (noisy.test(text) && context.length < 160) continue;
          const key = `${href}::${context.slice(0, 120)}`;
          if (seen.has(key)) continue;
          seen.add(key);
          rows.push({ text: text.trim(), href, context: context.slice(0, 360) });
        }
        return rows.slice(0, 40);
      },
      { keepSource: keep.source, noisySource: noisy.source },
    );
    console.log(`\n## ${target.slug}`);
    console.log(`URL ${page.url()}`);
    if (!candidates.length) {
      console.log("(no candidates)");
    }
    for (const row of candidates) {
      console.log(`- ${compact(row.text) || "(untitled)"}`);
      console.log(`  ${row.href}`);
      console.log(`  ${compact(row.context)}`);
    }
  } catch (error) {
    console.log(`\n## ${target.slug}`);
    console.log(`ERROR ${error.message}`);
  } finally {
    await page.close();
  }
}
await browser.close();
