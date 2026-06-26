# Assumptions log — v0.7.1 reliability

## Track A — Neon query retry (`reliability/query-retry`)

- **Wrapping at the `neon()` client level catches all drizzle-http queries.**
  drizzle's `neon-http` driver calls `client(query, params, options)` for every
  statement (including the per-statement calls drizzle makes inside a `.transaction()`
  pseudo-batch). We wrap the client as a callable `Proxy` and intercept `apply`, so
  every invocation goes through `withRetry`. We do **not** instrument drizzle's
  per-method calls — too brittle across drizzle versions.
- **Retry counts apply per query, not per logical request.** If a page renders
  three queries and the second fails transiently twice, we burn ~400ms of backoff
  on that one query; the other two are unaffected. Acceptable for now.
- **Backoff is fixed at [100ms, 300ms]** (no jitter). Two retries is small enough
  that synchronized stampedes against Neon's proxy aren't a realistic concern at
  current traffic. Revisit if we add a third attempt.
- **5xx classification trusts Neon's `status` field.** If a future Neon driver
  version stops setting `status` on the thrown error, the regex fallback on
  `message` ("fetch failed", "socket hang up", "other side closed") still catches
  the common transient cases. The trade-off is we may occasionally retry a
  malformed 5xx that's actually permanent; cost is two extra round-trips.
- **SQLSTATE `08xxx` (connection exception) is treated as transient.** Includes
  `08006` connection_failure, `08001` sqlclient_unable_to_establish_sqlconnection,
  etc. We do **not** retry on `40001` serialization_failure or `40P01` deadlock —
  those should bubble up so callers can decide whether a retry makes sense at
  their level.
- **No retry test in CI yet.** `scripts/test-query-retry.ts` runs locally via
  `tsx` and asserts 19 classification + behaviour cases. Wire into CI when we
  add a test runner; for now run manually:
  `npx tsx scripts/test-query-retry.ts`.
