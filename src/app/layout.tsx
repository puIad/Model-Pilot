import { Navbar } from "@/components/layout/navbar";
import { ThemeProvider } from "@/components/layout/theme-provider";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ModelPilot | AI Model & Reasoning Effort Recommender",
  description:
    "Evaluate task complexity, risk, ambiguity, and verifiability to recommend the minimum viable AI model and reasoning effort.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors canvas-grid">
        <ThemeProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <footer className="border-t border-zinc-200/80 dark:border-white/[0.08] py-5 text-xs text-zinc-500 dark:text-zinc-400 bg-white/50 dark:bg-black/20 backdrop-blur-xs">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-zinc-700 dark:text-zinc-300">ModelPilot</span>
                <span>/</span>
                <span>Minimum viable model capability & effort</span>
              </div>
              <div className="flex items-center gap-4 text-[11px] font-mono text-zinc-500">
                <span>Deterministic Engine</span>
                <span>•</span>
                <span>Zero Provider Bias</span>
              </div>
            </div>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}
