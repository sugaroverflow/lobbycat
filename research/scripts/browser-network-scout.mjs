#!/usr/bin/env node

import { chromium } from "playwright";

const targets = [
  ["odi", "https://theodi.livevacancies.co.uk/#/"],
  ["frontier-economics", "https://frontiereconomics.wd3.myworkdayjobs.com/Frontier_Economics_Careers"],
  ["bbc-ai-london", "https://careers.bbc.co.uk/search/?q=AI&locationsearch=London&locale=en_GB"],
  [
    "microsoft-london-policy",
    "https://apply.careers.microsoft.com/api/pcsx/search?domain=microsoft.com&query=responsible%20AI&location=London%2C%20United%20Kingdom&start=0",
  ],
  ["meta-london-policy", "https://www.metacareers.com/jobs/?q=policy&offices[0]=London%2C%20United%20Kingdom"],
];

const keepUrls = [
  /core-easywebats\.com\/v1\/job\/all/i,
  /livevacancies\.co\.uk\/get\/(?:init\/data|companydetails)/i,
  /\/wday\/cxs\/[^/]+\/[^/?]+\/jobs(?:\?|$)/i,
  /\/wday\/cxs\/[^/]+\/[^/?]+\/sidebar(?:\?|$)/i,
  /careers\.bbc\.co\.uk\/services\/recruiting\/v1\/jobs/i,
  /apply\.careers\.microsoft\.com\/api\/pcsx\/search/i,
  /apply\.careers\.microsoft\.com\/api\/pcsx\/position_details/i,
  /metacareers\.com\/graphql/i,
];

const skipUrls = [
  /compiled-lang/i,
  /asset-manifest/i,
  /google-analytics/i,
  /recaptcha/i,
  /onecollector/i,
  /\/vslog/i,
  /position_insights/i,
  /match_details/i,
  /overrides/i,
  /similar_positions/i,
  /job_cart/i,
  /\/assets\/(?:logo|banner)/i,
  /report-violation/i,
  /sense\/device-detection/i,
  /cdn\.acsbapp/i,
  /cloudfront\.net/i,
];

const skipTypes = /(image|font|text\/css|javascript|octet-stream)/i;

function shouldLog(resUrl, contentType) {
  if (skipUrls.some((pattern) => pattern.test(resUrl))) return false;
  if (skipTypes.test(contentType) && !/json/i.test(contentType)) return false;
  return keepUrls.some((pattern) => pattern.test(resUrl));
}

const browser = await chromium.launch({ headless: true });
for (const [slug, url] of targets) {
  const page = await browser.newPage({ viewport: { width: 1360, height: 900 } });
  const seen = new Set();
  page.on("response", async (res) => {
    const resUrl = res.url();
    const type = res.headers()["content-type"] || "";
    if (!shouldLog(resUrl, type)) return;
    if (seen.has(resUrl)) return;
    seen.add(resUrl);
    let preview = "";
    try {
      preview = (await res.text()).replace(/\s+/g, " ").slice(0, 500);
    } catch {
      preview = "(body unavailable)";
    }
    console.log(`\n[${slug}] ${res.status()} ${type}`);
    console.log(resUrl);
    console.log(preview);
  });
  try {
    console.log(`\n## ${slug}`);
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
    await page.waitForTimeout(10000);
  } catch (error) {
    console.log(`[${slug}] ERROR ${error.message}`);
  } finally {
    await page.close();
  }
}
await browser.close();
