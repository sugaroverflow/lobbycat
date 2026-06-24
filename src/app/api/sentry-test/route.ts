// TODO(lotus, post-verification): remove this endpoint once Fatima has
// confirmed a Sentry event lands after deploy. It exists purely to prove the
// pipeline works — GET it, get a 500, watch Sentry light up.
export const dynamic = "force-dynamic";

export function GET() {
  throw new Error(
    "sentry-test: intentional throw to verify Sentry capture pipeline",
  );
}
