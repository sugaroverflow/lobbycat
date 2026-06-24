"use client";

/**
 * Global error boundary — catches errors thrown in the root layout itself
 * (or that escape every other error.tsx in the tree).
 *
 * Per Next.js docs, this file MUST be a Client Component AND render its
 * own <html> + <body> tags because it replaces the root layout entirely.
 *
 * v0.7.1 reliability Track B. Voice intentionally hardcoded here too —
 * we cannot rely on the rest of the app loading at this point.
 */

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[lobbycat] global error boundary caught:", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          backgroundColor: "#090014",
          color: "#E0E0E0",
          fontFamily:
            "'Share Tech Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem",
        }}
      >
        <main
          role="alert"
          aria-live="polite"
          style={{
            maxWidth: 480,
            width: "100%",
            textAlign: "center",
            backgroundColor: "#1a103c",
            border: "1px solid #FF00FF",
            boxShadow: "0 0 24px rgba(255, 0, 255, 0.18)",
            padding: "2rem 1.75rem",
          }}
        >
          {/* Plain <img> here on purpose — next/image needs the app shell
              that just failed to mount. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/cat/lobbycat.png"
            alt="lobbycat — pixel cat sprite, shrugging"
            width={96}
            height={96}
            style={{ imageRendering: "pixelated", marginBottom: "1.25rem" }}
          />

          <h1
            style={{
              fontSize: "1.5rem",
              letterSpacing: "0.05em",
              color: "#00FFFF",
              marginBottom: "0.75rem",
              fontFamily:
                "'Orbitron', ui-sans-serif, system-ui, -apple-system, sans-serif",
            }}
          >
            The cat shrugged. Hard.
          </h1>

          <p
            style={{
              fontSize: "0.875rem",
              color: "rgba(224,224,224,0.8)",
              marginBottom: "1.5rem",
              lineHeight: 1.5,
            }}
          >
            ~ The cat has dropped the whole tray. One moment. ~
            <br />
            <span style={{ color: "rgba(224,224,224,0.6)" }}>
              Refresh the page, or come back in a minute.
            </span>
          </p>

          <button
            type="button"
            onClick={() => reset()}
            style={{
              backgroundColor: "#FF00FF",
              color: "#090014",
              border: "1px solid #FF00FF",
              padding: "0.6rem 1.4rem",
              fontFamily: "inherit",
              fontSize: "0.875rem",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              cursor: "pointer",
            }}
          >
            try again
          </button>

          {error.digest ? (
            <p
              style={{
                marginTop: "1.5rem",
                fontSize: "0.75rem",
                color: "rgba(224,224,224,0.5)",
              }}
            >
              error code:{" "}
              <code
                style={{
                  backgroundColor: "#120932",
                  padding: "0.1rem 0.4rem",
                  userSelect: "all",
                }}
              >
                {error.digest}
              </code>
            </p>
          ) : null}
        </main>
      </body>
    </html>
  );
}
