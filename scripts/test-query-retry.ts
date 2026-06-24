/**
 * Integration test for the Neon query retry layer.
 *
 * Doesn't talk to a real DB — exercises withRetry + isRetryableError directly
 * with stub query functions that fail on the first N attempts. Run with:
 *
 *   pnpm tsx scripts/test-query-retry.ts
 *
 * Exits non-zero on failure so it can be wired into CI later.
 */
import { isRetryableError, withRetry } from "../src/db/index";

let passed = 0;
let failed = 0;

function check(name: string, ok: boolean, detail?: string) {
  if (ok) {
    passed++;
    console.log(`  ok  - ${name}`);
  } else {
    failed++;
    console.error(`  FAIL - ${name}${detail ? `: ${detail}` : ""}`);
  }
}

async function run() {
  // --- isRetryableError classification ---------------------------------------
  check("ECONNRESET is retryable", isRetryableError({ code: "ECONNRESET" }));
  check("ETIMEDOUT is retryable", isRetryableError({ code: "ETIMEDOUT" }));
  check("undici socket err is retryable", isRetryableError({ code: "UND_ERR_SOCKET" }));
  check("HTTP 503 is retryable", isRetryableError({ status: 503 }));
  check("HTTP 502 is retryable", isRetryableError({ status: 502 }));
  check(
    "HTTP 500 via sourceError is retryable",
    isRetryableError({ sourceError: { status: 500 } }),
  );
  check("SQLSTATE 08006 is retryable", isRetryableError({ code: "08006" }));
  check(
    'message "fetch failed" is retryable',
    isRetryableError({ message: "fetch failed" }),
  );

  check("HTTP 400 is NOT retryable", !isRetryableError({ status: 400 }));
  check("HTTP 404 is NOT retryable", !isRetryableError({ status: 404 }));
  check("syntax error (42601) NOT retryable", !isRetryableError({ code: "42601" }));
  check(
    "unique violation (23505) NOT retryable",
    !isRetryableError({ code: "23505" }),
  );
  check("plain Error NOT retryable", !isRetryableError(new Error("boom")));

  // --- withRetry behaviour ---------------------------------------------------
  {
    // Succeeds first try.
    let calls = 0;
    const result = await withRetry(async () => {
      calls++;
      return "ok";
    });
    check("succeeds first try", result === "ok" && calls === 1, `calls=${calls}`);
  }

  {
    // Transient: fails twice, succeeds on third. Should retry through.
    let calls = 0;
    const start = Date.now();
    const result = await withRetry(
      async () => {
        calls++;
        if (calls < 3) {
          const err: Error & { status?: number } = new Error("upstream blip");
          err.status = 503;
          throw err;
        }
        return "ok";
      },
      { delays: [10, 20] },
    );
    const elapsed = Date.now() - start;
    check(
      "retries on transient until success",
      result === "ok" && calls === 3,
      `calls=${calls}`,
    );
    check(
      "backoff delays were respected (>=30ms)",
      elapsed >= 30,
      `elapsed=${elapsed}ms`,
    );
  }

  {
    // Transient all three attempts: throws the *last* error.
    let calls = 0;
    let threw: unknown;
    try {
      await withRetry(
        async () => {
          calls++;
          const err: Error & { status?: number } = new Error(`attempt ${calls} 503`);
          err.status = 503;
          throw err;
        },
        { delays: [1, 2] },
      );
    } catch (e) {
      threw = e;
    }
    check("gives up after MAX_ATTEMPTS", calls === 3, `calls=${calls}`);
    check(
      "throws the final error",
      threw instanceof Error && /attempt 3/.test(threw.message),
      `threw=${threw instanceof Error ? threw.message : threw}`,
    );
  }

  {
    // Non-retryable: bails immediately.
    let calls = 0;
    let threw: unknown;
    try {
      await withRetry(
        async () => {
          calls++;
          const err: Error & { status?: number } = new Error("bad sql");
          err.status = 400;
          throw err;
        },
        { delays: [1, 2] },
      );
    } catch (e) {
      threw = e;
    }
    check(
      "does NOT retry non-retryable",
      calls === 1 && threw instanceof Error,
      `calls=${calls}`,
    );
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

run().catch((e) => {
  console.error("test harness crashed:", e);
  process.exit(1);
});
