"use client";

import { HistoryList } from "@/components/history/history-list";
import { clearHistory, getStoredHistory } from "@/lib/storage/local-storage";
import { History, Trash2 } from "lucide-react";
import { useState } from "react";

export default function HistoryPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleClearAll = () => {
    const items = getStoredHistory();
    if (items.length === 0) return;
    if (confirm("Are you sure you want to clear all history records? This cannot be undone.")) {
      clearHistory();
      setRefreshKey((k) => k + 1);
      window.dispatchEvent(new Event("modelpilot_history_updated"));
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-100">
                Analysis History
              </h1>
              <p className="text-xs text-zinc-400">
                Inspect past task evaluations, feedback outcomes, and strategies
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleClearAll}
          className="text-xs px-3 py-1.5 rounded-lg border border-zinc-800 hover:border-rose-500/40 text-zinc-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear All History</span>
        </button>
      </div>

      <HistoryList key={refreshKey} />
    </div>
  );
}
