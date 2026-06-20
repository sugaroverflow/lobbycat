import { SiteShell } from "@/components/site-shell";

/**
 * v0.5 §9 Step 2 reference render — the swatch-session deliverable.
 *
 * Side-by-side view of the six Machine palette roles, the type scale, the
 * pixel cat sprite set, and a sample of v0.4 chrome (drawer, button, pill,
 * readout) so Fatima can eyeball the navy / dark-green / cyan / coral combo
 * before any production surface is touched.
 *
 * Not linked from the nav. Reachable at /machine-test only. Deletable once
 * Step 4 (Rebuild) ships and the production surfaces themselves carry the
 * reference renders implicitly.
 */
export default function MachineTestPage() {
  return (
    <SiteShell>
      <div className="max-w-[72rem] mx-auto px-6 py-12 space-y-16">
        <header>
          <div className="eyebrow mb-3">REFERENCE RENDER · machine · v0.5</div>
          <h1 className="text-3xl tracking-tight">
            Machine swatch session — reference render
          </h1>
          <p className="prose-face mt-4 text-[var(--fg-prose-soft)]">
            The six palette roles, the type scale, the pixel cat, and a sample
            of v0.4 chrome under the Machine tokens. Use this to spot if
            anything reads off-pitch before the production surfaces are
            re-skinned. — Lotus 🪷
          </p>
        </header>

        {/* Palette */}
        <section>
          <div className="eyebrow mb-4">PALETTE · 6 roles</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                role: "--bg-canvas",
                desc: "deep navy — full-bleed surfaces",
                bg: "var(--bg-canvas)",
                fg: "var(--fg-prose)",
              },
              {
                role: "--bg-panel",
                desc: "dark green — cards, modals, drawers",
                bg: "var(--bg-panel)",
                fg: "var(--fg-prose)",
              },
              {
                role: "--accent-action",
                desc: "electric blue — primary CTAs, focus",
                bg: "var(--accent-action)",
                fg: "var(--bg-canvas)",
              },
              {
                role: "--readout-cyan",
                desc: "cyan readouts — data voice",
                bg: "var(--readout-cyan)",
                fg: "var(--bg-canvas)",
              },
              {
                role: "--signal-coral",
                desc: "coral signals — errors, recent-change",
                bg: "var(--signal-coral)",
                fg: "var(--bg-canvas)",
              },
              {
                role: "--fg-prose",
                desc: "warm off-white — body copy",
                bg: "var(--fg-prose)",
                fg: "var(--bg-canvas)",
              },
            ].map((swatch) => (
              <div
                key={swatch.role}
                className="rounded-[var(--radius-panel)] border border-[var(--rule)] p-4 flex flex-col gap-2"
                style={{ background: swatch.bg, color: swatch.fg }}
              >
                <div className="text-xs tracking-[0.14em] uppercase opacity-80">
                  {swatch.role}
                </div>
                <div className="text-sm">{swatch.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Type scale */}
        <section>
          <div className="eyebrow mb-4">TYPE · mono-forward, sans for prose</div>
          <div className="space-y-3 border border-[var(--rule)] rounded-[var(--radius-panel)] p-6 bg-[var(--bg-panel)]">
            <p className="text-4xl tracking-tight">
              Display mono — 40 companies, 6 frames
            </p>
            <p className="text-2xl tracking-tight">
              Heading mono — Map · Compare · Frames · About
            </p>
            <p className="text-xl tracking-tight">
              Subhead mono — Geographic remit × Working style
            </p>
            <p className="text-base">
              Body mono — frame name · n/5 · readout label
            </p>
            <p className="text-sm text-[var(--fg-prose-soft)]">
              Whisper mono — every surprise has a reason
            </p>
            <p className="eyebrow">
              EYEBROW — variant pill, axis label, readout
            </p>
            <hr className="border-[var(--rule)] my-2" />
            <p className="prose-face">
              Prose face (sans) — this is what fit-notes, frame descriptions,
              and the comic captions look like at reading length. Lower
              personality than the mono; sits behind the mono rather than
              fighting it. Inter for now; the swatch session may swap it.
            </p>
            <p className="cat-voice prose-face">
              — and this is the cat speaking, italic in the sans face. Used
              for Surprise reasons, comic captions, the chat panel turn.
            </p>
          </div>
        </section>

        {/* Cat sprites */}
        <section>
          <div className="eyebrow mb-4">CAT · 5-pose pixel sprite set</div>
          <div className="border border-[var(--rule)] rounded-[var(--radius-panel)] p-6 bg-[var(--bg-panel-sunk)]">
            <img
              src="/cat/pixel/sprites.png"
              alt="Pixel cat sprite set — idle, blink, paw-up, mid-shrug, points-at-thing"
              className="w-full h-auto image-pixelated mix-blend-screen"
              style={{ imageRendering: "pixelated" }}
            />
            <p className="prose-face mt-4 text-sm text-[var(--fg-prose-muted)]">
              Five poses, left to right: idle, blink, paw-up, mid-shrug,
              points-at-thing. Generated as a first-pass sprite sheet. The
              swatch session is the place to refine the silhouette and re-cut
              into clean 64×64 cells.
            </p>
          </div>
        </section>

        {/* Sample chrome — drawer shape, button, pill, readout */}
        <section>
          <div className="eyebrow mb-4">CHROME · sample drawer / pill / readout</div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Mock drawer */}
            <div className="rounded-[var(--radius-panel)] border border-[var(--rule)] bg-[var(--bg-panel)] p-6">
              <div className="flex items-baseline justify-between">
                <h3 className="text-xl tracking-tight">Google DeepMind</h3>
                <span className="eyebrow">S-TIER</span>
              </div>
              <p className="prose-face mt-3 text-sm text-[var(--fg-prose-soft)]">
                London&rsquo;s biggest AI-policy operation by headcount. Inside
                a Big Tech parent, which shapes the work — the policy function
                is established, specialist, and reaches across DSIT, AISI, EU
                AI Office, NIST in parallel.
              </p>
              <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                {[
                  ["Geographic remit", "5/5"],
                  ["Policy area scope", "5/5"],
                  ["Stage of company", "5/5"],
                  ["Policy posture", "2/5"],
                  ["Working style", "3/5"],
                  ["Team style", "4/5"],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between border-b border-[var(--rule)] py-1">
                    <dt className="text-[var(--fg-prose-soft)]">{k}</dt>
                    <dd className="text-[var(--readout-cyan)]">{v}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-5 flex gap-3">
                <button
                  className="rounded-[var(--radius-tight)] px-4 py-2 text-sm tracking-tight"
                  style={{
                    background: "var(--accent-action)",
                    color: "var(--bg-canvas)",
                  }}
                >
                  Open full view →
                </button>
                <button
                  className="rounded-[var(--radius-tight)] px-4 py-2 text-sm tracking-tight border border-[var(--rule)] text-[var(--fg-prose)]"
                >
                  Add to compare
                </button>
              </div>
            </div>

            {/* Mock Surprise modal */}
            <div className="rounded-[var(--radius-panel)] border border-[var(--rule)] bg-[var(--bg-panel)] p-6">
              <div className="inline-flex items-center gap-2 rounded-[var(--radius-tight)] px-2 py-1 text-xs tracking-[0.14em]"
                style={{ background: "color-mix(in oklch, var(--readout-cyan) 18%, transparent)", color: "var(--readout-cyan)" }}>
                ADJ · adjacency
              </div>
              <h3 className="text-xl tracking-tight mt-3">Wayve</h3>
              <p className="prose-face cat-voice text-sm text-[var(--fg-prose-soft)] mt-2">
                — sits close to Anthropic on this view, but a 1 on{" "}
                <span className="text-[var(--fg-prose)]">policy posture</span>{" "}
                where Anthropic is also a 1 — and a 1 on{" "}
                <span className="text-[var(--fg-prose)]">team style</span>,
                building the practice from scratch on AV regulation.
              </p>
              <dl className="mt-4 space-y-1 text-sm">
                {[
                  ["Geographic remit", "3/5"],
                  ["Policy area scope", "2/5"],
                  ["Stage of company", "3/5"],
                  ["Working style", "3/5"],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between text-[var(--readout-cyan-dim)]">
                    <dt>{k}</dt>
                    <dd>{v}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-5 flex items-center gap-3">
                <button className="rounded-[var(--radius-tight)] px-4 py-2 text-sm" style={{ background: "var(--accent-action)", color: "var(--bg-canvas)" }}>
                  Open →
                </button>
                <button className="rounded-[var(--radius-tight)] px-4 py-2 text-sm border border-[var(--rule)] text-[var(--fg-prose)]">
                  Surprise me again
                </button>
              </div>
              <p className="prose-face text-xs text-[var(--fg-prose-muted)] mt-4">
                every surprise has a reason — here&rsquo;s yours
              </p>
            </div>
          </div>
        </section>

        {/* Signal coral demo */}
        <section>
          <div className="eyebrow mb-4">SIGNAL · coral, sparingly</div>
          <div className="rounded-[var(--radius-panel)] border border-[var(--rule)] bg-[var(--bg-panel)] p-6 flex items-center gap-4">
            <span style={{ color: "var(--signal-coral)" }}>try again</span>
            <span className="text-[var(--fg-prose-muted)]">·</span>
            <span style={{ color: "var(--signal-coral)" }}>
              recent change · 3 → 4 on policy area scope
            </span>
            <span className="text-[var(--fg-prose-muted)]">·</span>
            <button style={{ color: "var(--signal-coral)" }} className="underline-offset-2 underline">
              Forget me
            </button>
          </div>
        </section>

        <footer className="border-t border-[var(--rule)] pt-6 text-xs text-[var(--fg-prose-muted)]">
          /machine-test · v0.5 reference render · delete this route once Step 4
          rebuild lands and production surfaces carry the references implicitly.
        </footer>
      </div>
    </SiteShell>
  );
}
