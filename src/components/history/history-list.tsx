"use client";

import { RecommendationCard } from "@/components/recommendation/recommendation-card";

import { deleteHistoryItem, getStoredHistory } from "@/lib/storage/local-storage";

import { formatDate } from "@/lib/utils";

import { HistoryItem } from "@/types";

import {
  ArrowLeft,
  Calendar,
  ChevronRight,
  Clock,
  Filter,
  History,
  Search,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";


export function HistoryList() {
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);

  const loadHistory = () => {
    const items = getStoredHistory();
    setHistoryItems(items);
  };

  useEffect(() => {
    // Hydrate from localStorage after mount: it does not exist during server rendering.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadHistory();
  }, []);

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm("Delete this analysis from history?")) {
      deleteHistoryItem(id);
      loadHistory();
      if (selectedItem?.id === id) {
        setSelectedItem(null);
      }
      window.dispatchEvent(new Event("modelpilot_history_updated"));
    }
  };

  const filteredItems = historyItems.filter((item) => {
    const matchesSearch =
      item.taskText.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.recommendation.modelName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.recommendation.taskProfile.summary.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType =
      typeFilter === "all" || item.recommendation.taskProfile.taskType === typeFilter;

    return matchesSearch && matchesType;
  });

  // If inspecting a specific history item
  if (selectedItem) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setSelectedItem(null)}
            className="inline-flex items-center gap-2 text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to history list
          </button>
          <div className="flex items-center gap-3 text-xs text-zinc-400">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {new Date(selectedItem.timestamp).toLocaleDateString()}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {new Date(selectedItem.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
        </div>

        {/* Task description quote */}
        <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
          <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block mb-1">
            Prompt Analyzed
          </span>
          <p className="text-sm text-zinc-200 font-mono whitespace-pre-wrap">
            {selectedItem.taskText}
          </p>
        </div>

        <RecommendationCard
          recommendation={selectedItem.recommendation}
          historyId={selectedItem.id}
          initialFeedback={selectedItem.feedback}
          onFeedbackSaved={(fb) => {
            setSelectedItem((prev) => (prev ? { ...prev, feedback: fb } : null));
            loadHistory();
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search past tasks, models, or summaries..."
            className="w-full bg-zinc-900/70 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-zinc-100 placeholder:text-zinc-400 focus:outline-hidden focus:border-blue-500/80 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-zinc-400" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-zinc-900/70 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-zinc-200 focus:outline-hidden focus:border-blue-500"
          >
            <option value="all">All Task Types</option>
            <option value="coding">Coding</option>
            <option value="architecture">Architecture</option>
            <option value="debugging">Debugging</option>
            <option value="security">Security</option>
            <option value="research">Research</option>
            <option value="review">Review</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      {/* History Items List */}
      {filteredItems.length === 0 ? (
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/30 p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-zinc-800/50 flex items-center justify-center mx-auto text-zinc-400">
            <History className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-zinc-200">
            {historyItems.length === 0
              ? "No task analyses yet"
              : "No analyses match your search"}
          </h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            {historyItems.length === 0
              ? "Analyze your first task on the dashboard to build up your history and personal optimization stats."
              : "Try adjusting your search terms or filters."}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredItems.map((item) => {
            const profile = item.recommendation.taskProfile;
            const rec = item.recommendation;
            return (
              <div
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className="group rounded-xl border border-zinc-800/80 bg-zinc-900/40 hover:bg-zinc-900/80 hover:border-zinc-700/80 p-4 transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-zinc-100 truncate">
                      {profile.summary || item.taskText.slice(0, 70)}
                    </span>
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700/60">
                      {profile.taskType}
                    </span>
                  </div>

                  <p className="text-xs text-zinc-400 line-clamp-1">
                    {item.taskText}
                  </p>

                  <div className="flex items-center gap-3 text-[11px] text-zinc-400 pt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(item.timestamp)}
                    </span>
                    <span>•</span>
                    <span className="text-blue-400 font-medium">
                      {rec.modelName} · {rec.effort}
                    </span>
                    <span>•</span>
                    <span>Score {rec.taskScore}/100</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  {item.feedback ? (
                    <span className="text-[11px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20 capitalize">
                      {item.feedback.outcome ?? "Rated"}
                    </span>
                  ) : (
                    <span className="text-[11px] text-zinc-400 italic">No feedback</span>
                  )}

                  <button
                    type="button"
                    onClick={(e) => handleDelete(e, item.id)}
                    title="Delete item"
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-200 transition-colors" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
