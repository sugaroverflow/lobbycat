// Sentry server-side init. THE IMPORTANT ONE — this is what captures the opaque
// "An error occurred in the Server Components render" errors with full stack
// traces and digests on the server.
//
// Loaded by src/instrumentation.ts during the Node.js runtime register() phase.
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  debug: false,
  sendDefaultPii: false,

  // Defense in depth — even if something tries to attach user_profile data to
  // a breadcrumb or event, scrub it before it leaves the box.
  beforeBreadcrumb(breadcrumb) {
    if (breadcrumb.data && typeof breadcrumb.data === "object") {
      const scrubbed = { ...breadcrumb.data };
      for (const key of Object.keys(scrubbed)) {
        if (/user_profile|email|phone|name/i.test(key)) {
          scrubbed[key] = "[scrubbed]";
        }
      }
      breadcrumb.data = scrubbed;
    }
    return breadcrumb;
  },

  beforeSend(event) {
    // Strip anything that looks like PII from the user context. Sentry shouldn't
    // be populating this when sendDefaultPii is false, but belt + braces.
    if (event.user) {
      delete event.user.email;
      delete event.user.ip_address;
      delete event.user.username;
    }
    return event;
  },
});
