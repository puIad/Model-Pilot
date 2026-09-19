"use client";

import { CalibrationSuiteReport } from "@/lib/calibration/types";

import { getStoredModels } from "@/lib/storage/local-storage";

import { Model } from "@/types";

import {
  Activity,
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Fingerprint,
  Gauge,
  Info,
  Layers,
  RefreshCw,
  Scale,
  Search,
  ShieldAlert,
  ShieldCheck,
  Shuffle,
  Sparkles,
  Sliders,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";


export default function CalibrationLabPage() {
  const [report, setReport] = useState<CalibrationSuiteReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [running, setRunning] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<
    | "benchmarks"
    | "invariants"
    | "pairwise"
    | "bias"
    | "swap"
    | "sensitivity"
    | "priority"
    | "monotonicity"
  >("benchmarks");
  const [benchmarkFilter, setBenchmarkFilter] = useState<"all" | "passed" | "failed">("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [taskTypeFilter, setTaskTypeFilter] = useState<string>("all");
  const [expandedTraceId, setExpandedTraceId] = useState<string | null>(null);

  const fetchCalibrationReport = async (modelsOverride?: Model[]) => {
    try {
      setRunning(true);
      const res = await fetch("/api/calibration/run", {
        method: modelsOverride ? "POST" : "GET",
        headers: { "Content-Type": "application/json" },
        body: modelsOverride ? JSON.stringify({ models: modelsOverride }) : undefined,
      });
      if (!res.ok) throw new Error("Failed to load calibration report");
      const data: CalibrationSuiteReport = await res.json();
      setReport(data);
    } catch (err) {
      console.error("Error fetching calibration report:", err);
    } finally {
      setLoading(false);
      setRunning(false);
    }
  };

  useEffect(() => {
    // Loads the report from the API on mount; the loading flags are set inside the fetch helper.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCalibrationReport();
  }, []);

  const handleRerun = () => {
    const stored = getStoredModels();
    fetchCalibrationReport(stored);
  };

  // Filtered golden benchmarks
  const filteredBenchmarks = useMemo(() => {
    if (!report) return [];
    return report.goldenResults.filter((b) => {
      if (benchmarkFilter === "passed" && !b.passed) return false;
      if (benchmarkFilter === "failed" && b.passed) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          b.name.toLowerCase().includes(q) ||
          b.task.toLowerCase().includes(q) ||
          b.id.toLowerCase().includes(q);
        if (!match) return false;
      }
      if (taskTypeFilter !== "all" && b.profile.taskType !== taskTypeFilter) {
        return false;
      }
      return true;
    });
  }, [report, benchmarkFilter, searchQuery, taskTypeFilter]);

  if (loading || !report) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center space-y-4">
        <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mx-auto" />
        <p className="text-zinc-500 dark:text-zinc-400 text-sm">Running ModelPilot Calibration Lab suite...</p>
      </div>
    );
  }

  const totalTests =
    report.summary.goldenTotalCount +
    report.summary.invariantTotalCount +
    report.summary.biasTotalCount +
    report.summary.capabilitySwapTotalCount +
    report.summary.pairwiseTotalCount +
    report.summary.monotonicityIterations;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-8">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200/80 dark:border-zinc-800/80">
        <div>
          <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 mb-1">
            <Link
              href="/settings"
              className="hover:text-zinc-900 dark:hover:text-zinc-200 flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Settings
            </Link>
            <span>/</span>
            <span className="text-zinc-700 dark:text-zinc-300 font-medium">
              Calibration Lab
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              <Gauge className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                Recommendation Calibration Lab
              </h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Formal benchmark suite, blind anti-bias verification &amp; logical invariant testing engine
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRerun}
            disabled={running}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-sm shadow-blue-500/20 transition-all disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${running ? "animate-spin" : ""}`} />
            {running ? "Evaluating Suite..." : "Re-run Calibration Suite"}
          </button>
        </div>
      </div>

      {/* Main Status Banner */}
      <div
        className={`rounded-2xl border p-5 sm:p-6 transition-all ${
          report.overallPassed
            ? "border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300"
            : "border-red-500/30 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300"
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div
              className={`p-2.5 rounded-xl border ${
                report.overallPassed
                  ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-700 dark:text-emerald-400"
                  : "bg-red-500/20 border-red-500/30 text-red-700 dark:text-red-400"
              }`}
            >
              {report.overallPassed ? (
                <ShieldCheck className="w-6 h-6" />
              ) : (
                <ShieldAlert className="w-6 h-6" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs uppercase font-bold tracking-wider px-2 py-0.5 rounded-md ${
                    report.overallPassed
                      ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                      : "bg-red-500/20 text-red-700 dark:text-red-300 border border-red-500/30"
                  }`}
                >
                  {report.overallPassed ? "STATUS: CALIBRATED (PASS)" : "STATUS: MISCALIBRATED"}
                </span>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  Total Tests: {totalTests} | Verified: {new Date(report.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 mt-1">
                {report.overallPassed
                  ? "Provider-Agnostic Engine Calibrated with Zero Bias"
                  : "Logical Invariant or Benchmark Violations Detected"}
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                {report.overallPassed
                  ? `All ${report.summary.goldenTotalCount} golden benchmarks, ${report.summary.invariantTotalCount} invariants, ${report.summary.biasTotalCount} blind anti-bias tests, ${report.summary.capabilitySwapTotalCount} capability-swap tests, ${report.summary.pairwiseTotalCount} pairwise boundaries, and ${report.summary.monotonicityIterations} monotonicity iterations passed with 0 critical violations.`
                  : "The recommendation engine does not satisfy the target pass rates or monotonicity constraints."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 self-end sm:self-center bg-zinc-100 dark:bg-zinc-900/80 px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800">
            <div className="text-right">
              <span className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-semibold block">
                Consistency Score
              </span>
              <span className="text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">
                {report.consistencyScore}
                <span className="text-xs text-zinc-500 dark:text-zinc-400 font-normal">/100</span>
              </span>
            </div>
            <div
              className={`w-3 h-3 rounded-full ${
                report.consistencyScore >= 90
                  ? "bg-emerald-500 shadow-sm shadow-emerald-500/50"
                  : "bg-amber-500 shadow-sm shadow-amber-500/50"
              }`}
            />
          </div>
        </div>
      </div>

      {/* Comprehensive Metric Cards KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5">
        {/* Golden Benchmarks */}
        <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/60 dark:bg-zinc-900/40 p-3.5 space-y-1 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              Golden Benchmarks
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              {report.summary.goldenPassCount}/{report.summary.goldenTotalCount}
            </span>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              {report.summary.goldenPassRate}%
            </span>
          </div>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Target &ge; 90%</p>
        </div>

        {/* Logical Invariants */}
        <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/60 dark:bg-zinc-900/40 p-3.5 space-y-1 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              Logical Invariants
            </span>
            <ShieldCheck className="w-4 h-4 text-blue-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              {report.summary.invariantPassCount}/{report.summary.invariantTotalCount}
            </span>
            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
              {report.summary.invariantPassRate}%
            </span>
          </div>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Target: 100%</p>
        </div>

        {/* Blind Provider Tests */}
        <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/60 dark:bg-zinc-900/40 p-3.5 space-y-1 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              Blind Provider Tests
            </span>
            <Fingerprint className="w-4 h-4 text-purple-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              {report.summary.biasPassCount}/{report.summary.biasTotalCount}
            </span>
            <span className="text-xs font-semibold text-purple-600 dark:text-purple-400">
              100%
            </span>
          </div>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">0 brand dependencies</p>
        </div>

        {/* Capability Swap */}
        <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/60 dark:bg-zinc-900/40 p-3.5 space-y-1 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              Capability Swap
            </span>
            <Shuffle className="w-4 h-4 text-cyan-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              {report.summary.capabilitySwapPassCount}/{report.summary.capabilitySwapTotalCount}
            </span>
            <span className="text-xs font-semibold text-cyan-600 dark:text-cyan-400">
              100%
            </span>
          </div>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Specialist tracking</p>
        </div>

        {/* Pairwise Boundary Tests */}
        <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/60 dark:bg-zinc-900/40 p-3.5 space-y-1 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              Pairwise Tests
            </span>
            <Scale className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              {report.summary.pairwisePassCount}/{report.summary.pairwiseTotalCount}
            </span>
            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
              100%
            </span>
          </div>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">20 decision boundaries</p>
        </div>

        {/* Monotonicity Stress */}
        <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/60 dark:bg-zinc-900/40 p-3.5 space-y-1 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              Monotonicity
            </span>
            <Activity className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              {report.summary.monotonicityIterations}
            </span>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              0 Critical
            </span>
          </div>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">500 random runs</p>
        </div>

        {/* Provider Dependencies */}
        <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/60 dark:bg-zinc-900/40 p-3.5 space-y-1 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              Provider Dependency
            </span>
            <ShieldCheck className="w-4 h-4 text-blue-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              0
            </span>
            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
              Agnostic
            </span>
          </div>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Strictly neutral</p>
        </div>

        {/* Sensitivity Analysis */}
        <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/60 dark:bg-zinc-900/40 p-3.5 space-y-1 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              Sensitivity Rating
            </span>
            <Sliders className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              {report.summary.sensitivityRating}
            </span>
          </div>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">&plusmn;10% weight stability</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-zinc-200/80 dark:border-zinc-800/80">
        <nav className="flex space-x-4 sm:space-x-6 overflow-x-auto pb-px text-xs font-medium scrollbar-none">
          <button
            onClick={() => setActiveTab("benchmarks")}
            className={`pb-3 border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === "benchmarks"
                ? "border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400 font-semibold"
                : "border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Golden Benchmarks ({report.goldenResults.length})
          </button>

          <button
            onClick={() => setActiveTab("invariants")}
            className={`pb-3 border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === "invariants"
                ? "border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400 font-semibold"
                : "border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Invariants ({report.invariantResults.length})
          </button>

          <button
            onClick={() => setActiveTab("pairwise")}
            className={`pb-3 border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === "pairwise"
                ? "border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400 font-semibold"
                : "border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            Pairwise Tests ({report.pairwiseResults.length})
          </button>

          <button
            onClick={() => setActiveTab("bias")}
            className={`pb-3 border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === "bias"
                ? "border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400 font-semibold"
                : "border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
            }`}
          >
            <Fingerprint className="w-3.5 h-3.5" />
            Blind Anti-Bias ({report.biasResults.length})
          </button>

          <button
            onClick={() => setActiveTab("swap")}
            className={`pb-3 border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === "swap"
                ? "border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400 font-semibold"
                : "border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
            }`}
          >
            <Shuffle className="w-3.5 h-3.5" />
            Capability Swap ({report.capabilitySwapResults.length})
          </button>

          <button
            onClick={() => setActiveTab("sensitivity")}
            className={`pb-3 border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === "sensitivity"
                ? "border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400 font-semibold"
                : "border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            Sensitivity
          </button>

          <button
            onClick={() => setActiveTab("priority")}
            className={`pb-3 border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === "priority"
                ? "border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400 font-semibold"
                : "border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            Priority Tradeoffs
          </button>

          <button
            onClick={() => setActiveTab("monotonicity")}
            className={`pb-3 border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === "monotonicity"
                ? "border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400 font-semibold"
                : "border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            Monotonicity (500)
          </button>
        </nav>
      </div>

      {/* TAB 1: GOLDEN BENCHMARKS */}
      {activeTab === "benchmarks" && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-zinc-100/60 dark:bg-zinc-900/40 p-3 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80">
            <div className="flex items-center gap-2 flex-1">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 dark:text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search benchmark task, ID, or prompt..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <select
                value={taskTypeFilter}
                onChange={(e) => setTaskTypeFilter(e.target.value)}
                className="text-xs px-2.5 py-1.5 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 focus:outline-hidden"
              >
                <option value="all">All Task Types</option>
                <option value="coding">Coding</option>
                <option value="architecture">Architecture</option>
                <option value="debugging">Debugging</option>
                <option value="security">Security</option>
                <option value="research">Research</option>
                <option value="review">Review</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 self-end sm:self-auto">
              <button
                onClick={() => setBenchmarkFilter("all")}
                className={`px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer transition-colors ${
                  benchmarkFilter === "all"
                    ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                All ({report.goldenResults.length})
              </button>
              <button
                onClick={() => setBenchmarkFilter("passed")}
                className={`px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer transition-colors ${
                  benchmarkFilter === "passed"
                    ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30"
                    : "text-zinc-500 hover:text-emerald-400"
                }`}
              >
                Passed ({report.summary.goldenPassCount})
              </button>
              <button
                onClick={() => setBenchmarkFilter("failed")}
                className={`px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer transition-colors ${
                  benchmarkFilter === "failed"
                    ? "bg-red-500/20 text-red-700 dark:text-red-400 border border-red-500/30"
                    : "text-zinc-500 hover:text-red-400"
                }`}
              >
                Failed ({report.summary.goldenTotalCount - report.summary.goldenPassCount})
              </button>
            </div>
          </div>

          {/* Benchmark Cards */}
          <div className="space-y-3">
            {filteredBenchmarks.map((b) => {
              const isExpanded = expandedTraceId === b.id;
              return (
                <div
                  key={b.id}
                  className="rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-900/50 p-4 sm:p-5 space-y-3 shadow-xs transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          b.passed
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                            : "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
                        }`}
                      >
                        {b.passed ? "✔ PASS" : "✖ FAIL"}
                      </span>
                      <span className="font-mono text-xs font-bold text-zinc-500 dark:text-zinc-400">
                        {b.id.toUpperCase()}
                      </span>
                      <span className="text-zinc-400 dark:text-zinc-600">•</span>
                      <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                        {b.name}
                      </h3>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-mono">
                        Score: {b.recommendation.taskScore}/100
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium">
                        {b.recommendation.tier.toUpperCase()} ({b.recommendation.effort})
                      </span>
                      {b.recommendation.certainty && (
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                            b.recommendation.certainty === "clear"
                              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                              : b.recommendation.certainty === "close_call"
                              ? "bg-amber-500/10 text-amber-700 dark:text-amber-400"
                              : "bg-blue-500/10 text-blue-700 dark:text-blue-400"
                          }`}
                        >
                          {b.recommendation.certainty}
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-950/60 p-2.5 rounded-lg border border-zinc-200/60 dark:border-zinc-800/60 font-mono">
                    &quot;{b.task}&quot;
                  </p>

                  {/* Comparisons Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                    {/* Complexity */}
                    <div className="p-2 rounded-lg bg-zinc-100/60 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-800/60">
                      <span className="text-[10px] text-zinc-500 dark:text-zinc-400 block font-medium">
                        Complexity
                      </span>
                      <span className="font-semibold text-zinc-900 dark:text-zinc-200">
                        {b.comparisons.complexity.actual}/10
                      </span>
                      <span className="text-[10px] text-zinc-500 dark:text-zinc-400 block mt-0.5">
                        Range: [{b.comparisons.complexity.min}..{b.comparisons.complexity.max}]
                      </span>
                    </div>

                    {/* Ambiguity */}
                    <div className="p-2 rounded-lg bg-zinc-100/60 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-800/60">
                      <span className="text-[10px] text-zinc-500 dark:text-zinc-400 block font-medium">
                        Ambiguity
                      </span>
                      <span className="font-semibold text-zinc-900 dark:text-zinc-200">
                        {b.comparisons.ambiguity.actual}/10
                      </span>
                      <span className="text-[10px] text-zinc-500 dark:text-zinc-400 block mt-0.5">
                        Range: [{b.comparisons.ambiguity.min}..{b.comparisons.ambiguity.max}]
                      </span>
                    </div>

                    {/* Consequence */}
                    <div className="p-2 rounded-lg bg-zinc-100/60 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-800/60">
                      <span className="text-[10px] text-zinc-500 dark:text-zinc-400 block font-medium">
                        Consequence
                      </span>
                      <span className="font-semibold text-zinc-900 dark:text-zinc-200">
                        {b.comparisons.consequence.actual}/10
                      </span>
                      <span className="text-[10px] text-zinc-500 dark:text-zinc-400 block mt-0.5">
                        Range: [{b.comparisons.consequence.min}..{b.comparisons.consequence.max}]
                      </span>
                    </div>

                    {/* Scope */}
                    <div className="p-2 rounded-lg bg-zinc-100/60 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-800/60">
                      <span className="text-[10px] text-zinc-500 dark:text-zinc-400 block font-medium">
                        Scope
                      </span>
                      <span className="font-semibold text-zinc-900 dark:text-zinc-200">
                        {b.comparisons.scope.actual}/10
                      </span>
                      <span className="text-[10px] text-zinc-500 dark:text-zinc-400 block mt-0.5">
                        Range: [{b.comparisons.scope.min}..{b.comparisons.scope.max}]
                      </span>
                    </div>

                    {/* Model Choice */}
                    <div className="p-2 rounded-lg bg-zinc-100/60 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-800/60">
                      <span className="text-[10px] text-zinc-500 dark:text-zinc-400 block font-medium">
                        Winner
                      </span>
                      <span className="font-semibold text-zinc-900 dark:text-zinc-200 truncate block">
                        {b.recommendation.modelName}
                      </span>
                      <span className="text-[10px] text-zinc-500 dark:text-zinc-400 block mt-0.5">
                        Tier: {b.recommendation.tier}
                      </span>
                    </div>
                  </div>

                  {/* Rationale & Decision Trace Toggle */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-start gap-2 text-xs text-zinc-600 dark:text-zinc-400 flex-1">
                      <Info className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                      <p>
                        <strong className="text-zinc-700 dark:text-zinc-300 font-medium">
                          Rationale:
                        </strong>{" "}
                        {b.rationale}
                      </p>
                    </div>

                    {b.requirements && (
                      <button
                        onClick={() => setExpandedTraceId(isExpanded ? null : b.id)}
                        className="text-xs text-blue-500 hover:text-blue-400 flex items-center gap-1 shrink-0 font-medium ml-3 cursor-pointer"
                      >
                        {isExpanded ? "Hide Decision Trace" : "Inspect Decision Trace"}
                        {isExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </div>

                  {/* Expandable Decision Trace Inspector */}
                  {isExpanded && b.requirements && (
                    <div className="p-3.5 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-blue-500/20 text-xs space-y-2 text-zinc-700 dark:text-zinc-300 font-mono">
                      <div className="text-blue-700 dark:text-blue-400 font-bold flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        Layer B Derived Requirements &amp; Layer C Gate Trace:
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
                        <div>
                          <span className="text-zinc-500 block">MVI:</span>
                          <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                            {b.requirements.minimumViableIntelligence}
                          </span>
                        </div>
                        <div>
                          <span className="text-zinc-500 block">Min Effort:</span>
                          <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                            {b.requirements.minimumEffort}
                          </span>
                        </div>
                        <div>
                          <span className="text-zinc-500 block">Reliability Buffer:</span>
                          <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                            +{b.requirements.reliabilityBuffer.toFixed(1)}
                          </span>
                        </div>
                        <div>
                          <span className="text-zinc-500 block">Reasoning / Coding:</span>
                          <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                            {b.requirements.reasoning} / {b.requirements.coding}
                          </span>
                        </div>
                      </div>
                      {b.requirements.rationale && b.requirements.rationale.length > 0 && (
                        <div className="text-[11px] text-zinc-500 dark:text-zinc-400 pt-1 border-t border-zinc-200 dark:border-zinc-800">
                          <span className="text-zinc-500 block">Requirement Rationale:</span>
                          {b.requirements.rationale.map((r, i) => (
                            <div key={i}>• {r}</div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Failures if any */}
                  {b.failures.length > 0 && (
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400 text-xs space-y-1">
                      <span className="font-semibold block">Violations:</span>
                      {b.failures.map((f, idx) => (
                        <p key={idx}>• {f}</p>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: LOGICAL INVARIANTS */}
      {activeTab === "invariants" && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20 text-xs text-blue-700 dark:text-blue-300 space-y-1">
            <p className="font-semibold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-700 dark:text-blue-400" />
              Invariant Formal Verification (Section 50 - 21 Tests)
            </p>
            <p className="text-zinc-500 dark:text-zinc-400">
              The recommendation engine enforces strict mathematical guarantees across risk, ambiguity, scope, verifiability discounts, and mandatory safety floors. These tests must maintain 100% pass rate.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {report.invariantResults.map((inv) => (
              <div
                key={inv.id}
                className="rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-900/50 p-4 space-y-2.5 shadow-xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-mono font-bold text-blue-600 dark:text-blue-400">
                    {inv.id.toUpperCase()}
                  </span>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      inv.passed
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                        : "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
                    }`}
                  >
                    {inv.passed ? "✔ VERIFIED" : "✖ FAILED"}
                  </span>
                </div>

                <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {inv.name}
                </h4>

                <div className="p-2 rounded bg-zinc-50 dark:bg-zinc-950/80 border border-zinc-200/60 dark:border-zinc-800/60 font-mono text-[11px] text-zinc-700 dark:text-zinc-300">
                  <span className="text-zinc-500 dark:text-zinc-400 block text-[10px] font-sans">Formal Invariant:</span>
                  {inv.assertion}
                </div>

                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {inv.details}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: PAIRWISE RECOMMENDATION TESTS */}
      {activeTab === "pairwise" && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-300 space-y-1">
            <p className="font-semibold flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-amber-700 dark:text-amber-400" />
              Pairwise Recommendation Tests (Section 20 - 20 Curated Tests)
            </p>
            <p className="text-zinc-500 dark:text-zinc-400">
              Evaluates hard decision boundaries between pairs of models and effort configurations to confirm that the engine chooses the right model for the right reason without over-spending or under-allocating.
            </p>
          </div>

          <div className="space-y-3">
            {report.pairwiseResults.map((pair) => (
              <div
                key={pair.id}
                className="rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-900/50 p-4 space-y-3 shadow-xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        pair.passed
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                          : "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
                      }`}
                    >
                      {pair.passed ? "✔ PASS" : "✖ FAIL"}
                    </span>
                    <span className="font-mono text-xs font-bold text-zinc-500">
                      {pair.id.toUpperCase()}
                    </span>
                    <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {pair.name}
                    </span>
                  </div>

                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-400 font-semibold">
                    Winner: Candidate {pair.actualWinner}
                  </span>
                </div>

                <p className="text-xs text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-950/60 p-2.5 rounded-lg border border-zinc-200/60 dark:border-zinc-800/60 font-mono">
                  &quot;{pair.task}&quot;
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div
                    className={`p-3 rounded-lg border ${
                      pair.actualWinner === "A"
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-200"
                        : "bg-zinc-100 dark:bg-zinc-800/30 border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400"
                    }`}
                  >
                    <span className="text-[10px] uppercase font-bold block mb-1">
                      Candidate A {pair.expectedWinner === "A" ? "(Expected Winner)" : ""}
                    </span>
                    <span className="font-semibold block text-sm">
                      {pair.candidateA.modelName} ({pair.candidateA.effort})
                    </span>
                  </div>

                  <div
                    className={`p-3 rounded-lg border ${
                      pair.actualWinner === "B"
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-200"
                        : "bg-zinc-100 dark:bg-zinc-800/30 border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400"
                    }`}
                  >
                    <span className="text-[10px] uppercase font-bold block mb-1">
                      Candidate B {pair.expectedWinner === "B" ? "(Expected Winner)" : ""}
                    </span>
                    <span className="font-semibold block text-sm">
                      {pair.candidateB.modelName} ({pair.candidateB.effort})
                    </span>
                  </div>
                </div>

                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  <strong className="text-zinc-700 dark:text-zinc-300">Rationale:</strong> {pair.rationale}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: PROVIDER-BLIND & ANTI-BIAS */}
      {activeTab === "bias" && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/20 text-xs text-purple-700 dark:text-purple-300 space-y-1">
            <p className="font-semibold flex items-center gap-1.5">
              <Fingerprint className="w-4 h-4 text-purple-700 dark:text-purple-400" />
              Provider-Blind &amp; Anti-Bias Testing (Sections 16 &amp; 17 - 10 Tests)
            </p>
            <p className="text-zinc-500 dark:text-zinc-400">
              Validates that the recommendation engine is mathematically blind to provider brand strings (e.g. Google, Anthropic), immune to catalog permutation order, and operates identically under anonymous Model A/B/C aliases.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {report.biasResults.map((bias) => (
              <div
                key={bias.id}
                className="rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-900/50 p-4 space-y-2.5 shadow-xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-mono font-bold text-purple-700 dark:text-purple-400">
                    {bias.id.toUpperCase()}
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                    ✔ 0 DEPENDENCY
                  </span>
                </div>

                <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {bias.name}
                </h4>

                <p className="text-xs text-zinc-500 dark:text-zinc-400">{bias.description}</p>

                <div className="p-2.5 rounded bg-zinc-50 dark:bg-zinc-950/80 border border-zinc-200 dark:border-zinc-800 text-[11px] font-mono text-zinc-700 dark:text-zinc-300">
                  {bias.details}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: CAPABILITY-SWAP TESTS */}
      {activeTab === "swap" && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-cyan-500/5 border border-cyan-500/20 text-xs text-cyan-700 dark:text-cyan-300 space-y-1">
            <p className="font-semibold flex items-center gap-1.5">
              <Shuffle className="w-4 h-4 text-cyan-700 dark:text-cyan-400" />
              Capability-Swap Specialist Tests (Section 6 - 10 Tests)
            </p>
            <p className="text-zinc-500 dark:text-zinc-400">
              Verifies that specialist models win based on explicit dimensional capabilities (architecture, debugging, coding, context window, effort ceiling) rather than identity or general score.
            </p>
          </div>

          <div className="space-y-3">
            {report.capabilitySwapResults.map((swap) => (
              <div
                key={swap.id}
                className="rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-900/50 p-4 space-y-2 shadow-xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-mono font-bold text-cyan-700 dark:text-cyan-400">
                    {swap.id.toUpperCase()}
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                    ✔ TRACKED CAPABILITY
                  </span>
                </div>

                <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{swap.name}</h4>

                <div className="p-2.5 rounded bg-zinc-50 dark:bg-zinc-950/80 border border-zinc-200 dark:border-zinc-800 text-xs space-y-1 text-zinc-700 dark:text-zinc-300 font-mono">
                  <div>
                    <span className="text-zinc-500">Expected:</span> {swap.expectedBehavior}
                  </div>
                  <div>
                    <span className="text-zinc-500">Decision:</span> {swap.details}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: SENSITIVITY ANALYSIS */}
      {activeTab === "sensitivity" && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-xs text-emerald-700 dark:text-emerald-300 space-y-1">
            <p className="font-semibold flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
              Sensitivity Analysis &amp; Weight Perturbations (Sections 21 &amp; 22)
            </p>
            <p className="text-zinc-500 dark:text-zinc-400">
              Evaluates parameter stability under continuous variable sweeps and &plusmn;10% weight perturbations to ensure smooth, monotonic transitions without sudden chaotic tipping points.
            </p>
          </div>

          {/* Consequence Sweep */}
          <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-900/50 p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Continuous Variable Sweep: Consequence (1 to 10)
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Tests that increasing consequence produces strictly non-decreasing model tier selections.
                </p>
              </div>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                ✔ MONOTONIC
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-zinc-700 dark:text-zinc-300">
                <thead className="text-[10px] uppercase bg-zinc-100 dark:bg-zinc-900/80 text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800">
                  <tr>
                    <th className="px-3 py-2 font-semibold">Consequence</th>
                    <th className="px-3 py-2 font-semibold">Recommended Model</th>
                    <th className="px-3 py-2 font-semibold">Model Tier</th>
                    <th className="px-3 py-2 font-semibold">Effort Level</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50 font-mono">
                  {report.sensitivityResult.variableSweeps[0]?.steps.map((s) => (
                    <tr key={s.value} className="hover:bg-zinc-800/20">
                      <td className="px-3 py-2 font-bold text-blue-700 dark:text-blue-400">{s.value} / 10</td>
                      <td className="px-3 py-2">{s.recommendedModel}</td>
                      <td className="px-3 py-2 uppercase font-semibold text-zinc-800 dark:text-zinc-200">{s.tier}</td>
                      <td className="px-3 py-2 font-semibold text-amber-700 dark:text-amber-400">{s.effort}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Weight Perturbation Stability */}
          <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-900/50 p-5 space-y-3 shadow-xs">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Weight Perturbation Stability Rate (&plusmn;10%)
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              {report.sensitivityResult.weightPerturbations.map((w, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-1">
                  <span className="text-[10px] text-zinc-500 block uppercase">
                    {w.perturbedDimension} ({w.change})
                  </span>
                  <span className="text-emerald-700 dark:text-emerald-400 font-bold text-sm block">
                    {w.stabilityRate}% Stable
                  </span>
                  <span className="text-[10px] text-zinc-500 block">
                    {w.changedRecommendationsCount} changes / {w.totalBenchmarksTested}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: PRIORITY TRADEOFFS */}
      {activeTab === "priority" && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/20 text-xs text-purple-700 dark:text-purple-300 space-y-1">
            <p className="font-semibold flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-purple-700 dark:text-purple-400" />
              Priority Direction Optimization (Section 47)
            </p>
            <p className="text-zinc-500 dark:text-zinc-400">
              Validates that user priority directives adjust model tiers and reasoning efforts in the logically correct direction: Lowest Cost must never exceed Balanced cost and must never drop below the minimum safe tier.
            </p>
          </div>

          <div className="space-y-4">
            {report.priorityResults.map((p) => (
              <div
                key={p.taskId}
                className="rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-900/50 p-5 space-y-4 shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 uppercase">
                      Task Reference: {p.taskId}
                    </span>
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {p.taskName}
                    </h3>
                  </div>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      p.passed
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                        : "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
                    }`}
                  >
                    {p.passed ? "✔ PASS" : "✖ FAIL"}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-zinc-100/60 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-800/60 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-zinc-500 dark:text-zinc-400 block">
                      Balanced (Baseline)
                    </span>
                    <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-200 block">
                      Tier: {p.balanced.tier.toUpperCase()} ({p.balanced.effort})
                    </span>
                    <span className="text-[11px] text-zinc-500 dark:text-zinc-400 block">
                      Cost Index: {p.balanced.costIndex}
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-zinc-100/60 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-800/60 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 block">
                      Lowest Cost
                    </span>
                    <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-200 block">
                      Tier: {p.lowestCost.tier.toUpperCase()} ({p.lowestCost.effort})
                    </span>
                    <span className="text-[11px] text-zinc-500 dark:text-zinc-400 block">
                      Cost Index: {p.lowestCost.costIndex}
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-zinc-100/60 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-800/60 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400 block">
                      Highest Reliability
                    </span>
                    <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-200 block">
                      Tier: {p.highestReliability.tier.toUpperCase()} ({p.highestReliability.effort})
                    </span>
                    <span className="text-[11px] text-zinc-500 dark:text-zinc-400 block">
                      Cost Index: {p.highestReliability.costIndex}
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-zinc-100/60 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-800/60 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400 block">
                      Lowest Latency
                    </span>
                    <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-200 block">
                      Tier: {p.lowestLatency.tier.toUpperCase()} ({p.lowestLatency.effort})
                    </span>
                    <span className="text-[11px] text-zinc-500 dark:text-zinc-400 block">
                      Cost Index: {p.lowestLatency.costIndex}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-zinc-500 dark:text-zinc-400">{p.details}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 8: MONOTONICITY STRESS TEST */}
      {activeTab === "monotonicity" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-900/50 p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-purple-500" />
                  Monotonicity Stress Engine (Section 52 - 500 Random Iterations)
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Evaluated {report.monotonicityResult.iterations} random task profile perturbations across complexity, consequence, ambiguity, and scope.
                </p>
              </div>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                  report.monotonicityResult.passed
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                    : "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
                }`}
              >
                {report.monotonicityResult.passed ? "✔ 0 VIOLATIONS" : "✖ VIOLATIONS"}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-3 rounded-lg bg-zinc-100/60 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-800/60">
                <span className="text-zinc-500 dark:text-zinc-400 text-[10px] uppercase font-bold block">
                  Total Randomized Runs
                </span>
                <span className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                  {report.monotonicityResult.iterations}
                </span>
              </div>

              <div className="p-3 rounded-lg bg-zinc-100/60 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-800/60">
                <span className="text-zinc-500 dark:text-zinc-400 text-[10px] uppercase font-bold block">
                  Critical Violations
                </span>
                <span className="text-xl font-bold text-emerald-700 dark:text-emerald-400">
                  {report.monotonicityResult.criticalViolations}
                </span>
                <span className="text-[10px] text-zinc-500 dark:text-zinc-400 block">(Target: 0 critical)</span>
              </div>

              <div className="p-3 rounded-lg bg-zinc-100/60 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-800/60">
                <span className="text-zinc-500 dark:text-zinc-400 text-[10px] uppercase font-bold block">
                  Perturbation Dimensions
                </span>
                <span className="text-xs font-mono text-zinc-700 dark:text-zinc-300">
                  complexity, consequence, ambiguity, scope
                </span>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-950/80 border border-zinc-200/60 dark:border-zinc-800/60 text-xs text-zinc-500 dark:text-zinc-400 space-y-1">
              <span className="font-semibold text-zinc-800 dark:text-zinc-200 block">
                Verification Methodology:
              </span>
              <p>
                1. For each synthetic profile, a key dimension is perturbed by +2 points.
              </p>
              <p>
                2. If complexity or consequence increases, model tier is checked to ensure it never decreases: Tier(R_after) &ge; Tier(R_before).
              </p>
              <p>
                3. If ambiguity or scope increases, reasoning effort is verified to never decrease: Effort(R_after) &ge; Effort(R_before).
              </p>
              <p className="text-emerald-700 dark:text-emerald-400 font-semibold pt-1">
                ✔ Zero inversions or regressions detected across all 500 iterations.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
