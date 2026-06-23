import type { Metadata } from "next";
import { Orbitron, Share_Tech_Mono } from "next/font/google";
import "./globals.css";
import { RescoringCat } from "@/components/rescoring-cat";

// v0.7 Vaporwave register per REFACTOR-v0.7 §4.2:
//   - Orbitron       — geometric, futuristic; headings / hero / section heads
//   - Share Tech Mono — terminal-flavoured monospace; body / UI / labels
// Both Google Fonts. The variables wire into --font-sans-loaded and
// --font-mono-loaded in vaporwave.css so tokens resolve identically across
// calm-cousin and theatre surfaces.
const mono = Share_Tech_Mono({
  variable: "--font-mono-loaded",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

const sans = Orbitron({
  variable: "--font-sans-loaded",
  weight: ["400", "500", "700", "900"],
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "lobbycat",
  description:
    "A curated map of London's AI-policy companies, organised across six frames.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${sans.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-canvas text-prose">
        {children}
        {/* v0.6 step 11.5: floating animated cat while a frame-edit rescore
            is in flight. Mounted at layout level so it persists across page
            transitions during the worker run. */}
        <RescoringCat />
      </body>
    </html>
  );
}
