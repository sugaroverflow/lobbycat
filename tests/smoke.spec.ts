import { test, expect, request as pwRequest } from "@playwright/test";

// Smoke suite — verifies the gate works and the main authenticated
// pages render without a Next.js error boundary. Designed to run
// against a Vercel preview URL (PREVIEW_URL) or prod.
//
// Login is a Next.js server action: POSTing the /login form with the
// correct password sets the `lc_auth` httpOnly cookie and redirects.
// We grab that cookie via a fresh browser context, then reuse it for
// the authenticated GETs via APIRequestContext (no JS rendering needed
// for the "did the page error" check — Next.js error boundaries ship
// the string `next-error` into the HTML when something blew up).

const PASSWORD = process.env.TEST_LOBBYCAT_PASSWORD || "";

test.describe("smoke", () => {
  test("login page renders and prompts for a password", async ({ request }) => {
    const res = await request.get("/login");
    expect(res.status()).toBe(200);
    const body = await res.text();
    expect(body.toLowerCase()).toContain("password");
  });

  test("login with TEST_LOBBYCAT_PASSWORD sets the auth cookie", async ({
    browser,
  }) => {
    test.skip(!PASSWORD, "TEST_LOBBYCAT_PASSWORD not set");
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto("/login");
    await page.fill('input[name="password"]', PASSWORD);
    await Promise.all([
      page.waitForURL((url) => !url.pathname.startsWith("/login"), {
        timeout: 15_000,
      }),
      page.click('button[type="submit"], input[type="submit"], form button'),
    ]);
    const cookies = await ctx.cookies();
    const auth = cookies.find((c) => c.name === "lc_auth");
    expect(auth, "lc_auth cookie should be set after login").toBeTruthy();
    expect(auth?.httpOnly).toBe(true);
    await ctx.close();
  });

  test("authenticated pages render without a Next.js error", async ({
    playwright,
    baseURL,
  }) => {
    test.skip(!PASSWORD, "TEST_LOBBYCAT_PASSWORD not set");
    if (!baseURL) throw new Error("baseURL required");

    // Get an auth cookie via a real browser submit (handles server action).
    const browser = await playwright.chromium.launch();
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto(`${baseURL}/login`);
    await page.fill('input[name="password"]', PASSWORD);
    await Promise.all([
      page.waitForURL((url) => !url.pathname.startsWith("/login"), {
        timeout: 15_000,
      }),
      page.click('button[type="submit"], input[type="submit"], form button'),
    ]);
    const cookies = await ctx.cookies();
    await browser.close();

    // Replay against an APIRequestContext for cheap HTML checks.
    const apiCtx = await pwRequest.newContext({ baseURL });
    await apiCtx.storageState({}); // ensure clean
    // Manually add the lc_auth cookie:
    const lc = cookies.find((c) => c.name === "lc_auth");
    if (!lc) throw new Error("did not get lc_auth cookie from login");

    for (const path of ["/", "/wizard", "/frames", "/about"]) {
      const res = await apiCtx.get(path, {
        headers: { cookie: `lc_auth=${lc.value}` },
      });
      expect(res.status(), `GET ${path} status`).toBe(200);
      const body = await res.text();
      expect(
        body.includes("next-error"),
        `GET ${path} should not include 'next-error' in body`,
      ).toBe(false);
    }
    await apiCtx.dispose();
  });

  test("GET /api/health returns 200 with status: ok", async ({ request }) => {
    const res = await request.get("/api/health");
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(json.status).toBe("ok");
  });
});
