"use client";

import { getStoredHistory } from "@/lib/storage/local-storage";

import { Compass, Cpu, Gauge, History, Settings, Sparkles } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { useEffect, useState } from "react";

import { ThemeToggle } from "./theme-toggle";


export function Navbar() {
  const pathname = usePathname();
  const [historyCount, setHistoryCount] = useState<number>(0);

  useEffect(() => {
    const updateCount = () => {
      const items = getStoredHistory();
      setHistoryCount(items.length);
    };

    updateCount();
    window.addEventListener("storage", updateCount);
    window.addEventListener("modelpilot_history_updated", updateCount);

    return () => {
      window.removeEventListener("storage", updateCount);
      window.removeEventListener("modelpilot_history_updated", updateCount);
    };
  }, [pathname]);

  const navItems = [
    { label: "Analyzer", href: "/", icon: Sparkles },
    { label: "History", href: "/history", icon: History, count: historyCount },
    { label: "Analytics", href: "/analytics", icon: Compass },
    { label: "Calibration Lab", href: "/settings/calibration", icon: Gauge },
    { label: "Catalog", href: "/settings", icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-200/80 dark:border-white/[0.08] bg-white/85 dark:bg-[#08090d]/85 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-7 h-7 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
              <Cpu className="w-4 h-4 text-blue-400 dark:text-blue-600" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm tracking-tight text-zinc-900 dark:text-zinc-100">
                Model<span className="text-blue-600 dark:text-blue-400">Pilot</span>
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 sm:gap-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 px-2.5 py-1.2 rounded-md text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-zinc-100 dark:bg-zinc-800/90 text-zinc-900 dark:text-zinc-100 shadow-xs border border-zinc-300/80 dark:border-white/[0.12]"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100/60 dark:hover:bg-zinc-800/40 border border-transparent"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-blue-600 dark:text-blue-400" : "text-zinc-400"}`} />
                <span className="hidden md:inline">{item.label}</span>
                {item.count !== undefined && item.count > 0 && (
                  <span
                    className={`ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-mono font-semibold ${
                      isActive
                        ? "bg-blue-500/20 text-blue-700 dark:text-blue-300"
                        : "bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                    }`}
                  >
                    {item.count}
                  </span>
                )}
              </Link>
            );
          })}

          <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800 mx-1" />

          {/* Theme Toggle */}
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
