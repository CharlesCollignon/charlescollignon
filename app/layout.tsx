import type { Metadata } from "next";
import { Figtree } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

// Variable font: one file covers every weight.
const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Charles Collignon | Engineering Manager, Design and Product",
  description:
    "Portfolio of Charles Collignon, Engineering Manager for Design and Product. I design and build products end to end, from interface and design system to production code.",
  keywords: [
    "Engineering Manager",
    "Design Engineering",
    "Product Design",
    "Frontend",
    "React",
    "Next.js",
    "TypeScript",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <noscript>
          <style>{`[data-fade]{opacity:1!important;visibility:visible!important}`}</style>
        </noscript>
      </head>
      <body
        className={`${figtree.variable} font-sans antialiased`}
        suppressHydrationWarning
      >
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-100 focus:rounded-full focus:bg-zinc-900 focus:px-4 focus:py-2 focus:text-sm focus:text-white dark:focus:bg-zinc-100 dark:focus:text-zinc-900"
        >
          Skip to content
        </a>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <SpeedInsights />
          <Analytics />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
