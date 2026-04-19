"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/live", label: "LIVE MODE" },
  { href: "/depth", label: "DEPTH MODE" },
];

export function TabNav() {
  const pathname = usePathname();
  return (
    <nav
      className="flex h-12 items-stretch border-b text-xs uppercase tracking-widest"
      style={{
        borderColor: "var(--border)",
        background: "var(--panel)",
      }}
    >
      <div
        className="flex items-center px-4 font-bold"
        style={{ color: "var(--accent)", letterSpacing: "0.18em" }}
      >
        CAN U DELIVER
      </div>
      <div
        className="h-full w-px"
        style={{ background: "var(--border)" }}
      />
      {TABS.map((t) => {
        const active = pathname?.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            className="flex items-center px-5 transition-colors"
            style={{
              color: active ? "var(--foreground)" : "var(--muted-foreground)",
              borderBottom: active
                ? "2px solid var(--accent)"
                : "2px solid transparent",
              background: active ? "var(--background)" : "transparent",
            }}
          >
            {t.label}
          </Link>
        );
      })}
      <div className="ml-auto flex items-center px-4 text-[10px]" style={{ color: "var(--muted-foreground)" }}>
        v0.1 · MOCK STREAM
      </div>
    </nav>
  );
}
