import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { TabNav } from "@/components/tab-nav";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Can U Deliver",
  description:
    "Will this company deliver on its claims? A credibility verdict for retail investors.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${mono.variable} dark`} suppressHydrationWarning>
      <body className="h-full">
        <ThemeProvider>
          <div className="flex h-screen w-screen flex-col overflow-hidden">
            <TabNav />
            <main className="flex-1 overflow-hidden">{children}</main>
          </div>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
