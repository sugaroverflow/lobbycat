import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

// v0.5: mono-forward register per CONCEPT-v0.5 §6.3. Mono is the system
// default; sans is the prose face (~20% of visible glyphs).
//
// Fonts are placeholders for the swatch session — Berkeley Mono / MD IO /
// Departure Mono are the candidates in §6.3. JetBrains Mono carries until
// then. The `--font-mono` and `--font-sans` CSS variables let the swatch
// session swap a self-hosted face in one place.
const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-sans",
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
      className={`${inter.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-canvas text-prose">
        {children}
      </body>
    </html>
  );
}
