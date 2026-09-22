import React, { useState } from "react";
import { Activity, CheckCircle, Database, Plus, X, ChevronRight } from "lucide-react";
import { Entity } from "../types/intelligence";
import { NetraLogo } from "./Logos";

interface HomeViewProps {
  onSearch: (parameters: string[]) => void;
  onSelectTab: (tab: "network" | "influencers" | "patterns" | "blockchain" | "copilot" | "pathfinder") => void;
  onSelectEntity: (entityId: string) => void;
  allNodes: Entity[];
  totalLinksCount: number;
  suspiciousPatternsCount: number;
  compact?: boolean;
  initialParameters?: string[];
}

interface CrossRefParam {
  id: string;
  value: string;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onSearch,
  onSelectTab,
  onSelectEntity,
  allNodes,
  totalLinksCount,
  suspiciousPatternsCount,
  compact = false,
  initialParameters = [],
}) => {
  const [paramValue, setParamValue] = useState("");
  const [activeParams, setActiveParams] = useState<CrossRefParam[]>(() =>
    initialParameters.map((value, index) => ({ id: `initial-${index}`, value }))
  );

  const handleInitialize = (e: React.FormEvent) => {
    e.preventDefault();
    const parameters = activeParams.map((param) => param.value);
    if (parameters.length) onSearch(parameters);
    else onSelectTab("network");
  };

  const handleAddParam = () => {
    if (!paramValue.trim()) return;
    setActiveParams((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        value: paramValue.trim(),
      },
    ]);
    setParamValue("");
  };

  const handleRemoveParam = (id: string) => {
    setActiveParams((prev) => prev.filter((p) => p.id !== id));
  };

  // Sample priority suspects for quick investigation
  const quickSuspects = allNodes.filter((n) => n.riskLevel === "critical" || n.riskLevel === "high").slice(0, 4);

  return (
    <div
      id="home-middle-portal"
      className={`relative w-full ${compact ? "overflow-visible" : "flex-1 min-h-full overflow-y-auto overflow-x-hidden"} flex flex-col select-none`}
    >
      {/* Main Container - The Middle Part of Frontend */}
      <div className={`${compact ? "w-full p-0" : "w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 flex-1 flex flex-col justify-center gap-10"} relative z-10`}>
        
        {/* ========================================================================= */}
        {/* CENTRAL INVESTIGATIVE SEARCH & CROSS-REFERENCE TARGET CONSOLE             */}
        {/* Styled as a futuristic Iron Man / Cerebro cyber terminal console          */}
        {/* ========================================================================= */}
        <div className={`w-full ${compact ? "max-w-none rounded-2xl p-4" : "max-w-3xl mx-auto rounded-3xl p-5 sm:p-7"} bg-slate-950/90 shadow-[0_0_30px_rgba(0,240,255,0.12)] border border-slate-700/70 backdrop-blur-xl transition-all relative overflow-hidden group`}>
          {/* Subtle Cyber Grid accent inside panel */}
          <div
            className="absolute inset-0 pointer-events-none opacity-5"
            style={{
              backgroundImage: "linear-gradient(to right, #00f0ff 1px, transparent 1px), linear-gradient(to bottom, #00f0ff 1px, transparent 1px)",
              backgroundSize: "20px 20px",
            }}
          />

          {/* Corner brackets */}
          <div className="absolute top-2 left-2 text-cyan-400 font-mono text-xs opacity-60">┌──</div>
          <div className="absolute top-2 right-2 text-cyan-400 font-mono text-xs opacity-60">──┐</div>
          <div className="absolute bottom-2 left-2 text-cyan-400 font-mono text-xs opacity-60">└──</div>
          <div className="absolute bottom-2 right-2 text-cyan-400 font-mono text-xs opacity-60">──┘</div>

          {/* Console Header Bar */}
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-cyan-500/20 text-xs font-mono">
            <div className="flex items-center gap-2 text-cyan-300">
              <span className="font-bold tracking-wider">SEARCH PARAMETERS</span>
            </div>
          </div>

          <form onSubmit={handleInitialize} className="w-full">
          <div className="pt-1">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                  PARAMETERS
                </span>
              </div>
              <span className="text-xs font-bold text-cyan-300 font-mono bg-cyan-950/70 px-2.5 py-0.5 rounded-lg border border-cyan-500/30 shadow-[0_0_10px_rgba(0,240,255,0.2)]">
                {activeParams.length} Added
              </span>
            </div>

            {/* Input Row: unrestricted value + Add button */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
              <input
                id="param-value-input"
                type="text"
                value={paramValue}
                onChange={(e) => setParamValue(e.target.value)}
                placeholder="Enter any parameter"
                className="w-full sm:col-span-10 bg-slate-900/80 border border-slate-700/80 focus:border-cyan-400 focus:shadow-[0_0_10px_rgba(0,240,255,0.25)] rounded-xl px-3.5 py-2 text-xs sm:text-sm text-cyan-100 placeholder-slate-500 focus:outline-none transition-all font-mono"
              />
              <div className="sm:col-span-2">
                <button
                  type="button"
                  id="btn-add-param"
                  onClick={handleAddParam}
                  className="w-full h-full bg-cyan-950/70 hover:bg-cyan-900/80 active:bg-cyan-800 text-cyan-300 font-bold text-xs sm:text-sm border border-cyan-500/40 rounded-xl py-2 px-3 flex items-center justify-center gap-1 transition-all cursor-pointer shadow-[0_0_10px_rgba(0,240,255,0.2)] font-mono"
                >
                  <Plus className="w-4 h-4 text-cyan-400" />
                  <span>ADD</span>
                </button>
              </div>
            </div>

            {/* Active Parameter Badges */}
            {activeParams.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3 pt-2">
                {activeParams.map((p) => (
                  <span
                    key={p.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-900/90 border border-cyan-500/30 text-xs font-mono text-cyan-200 shadow-[0_0_8px_rgba(0,240,255,0.15)]"
                  >
                    <span className="text-white font-bold">{p.value}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveParam(p.id)}
                      className="text-slate-400 hover:text-red-400 ml-1 transition-colors cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <button
              type="submit"
              id="btn-portal-initialize"
              className="w-full mt-5 bg-cyan-950/80 hover:bg-cyan-900/90 text-cyan-100 border border-cyan-400/35 font-black text-xs sm:text-sm tracking-widest uppercase px-5 py-3 rounded-xl transition-all cursor-pointer shadow-[0_0_15px_rgba(0,240,255,0.18)] flex items-center justify-center gap-1.5 font-mono active:scale-[0.98]"
            >
              <span>INITIALIZE</span>
              <ChevronRight className="w-4 h-4 stroke-[3]" />
            </button>
          </div>
          </form>
        </div>

        {/* ========================================================================= */}
        {/* THREE STATISTIC METRIC CARDS - STARK HUD TELEMETRY TILES                   */}
        {/* ========================================================================= */}
        {!compact && <div className="w-full max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 mt-5 sm:mt-6">
          {/* Card 1: Active Surveillance */}
          <div
            onClick={() => onSelectTab("network")}
            className="bg-slate-950/80 rounded-2xl border border-cyan-500/30 p-5 shadow-[0_0_20px_rgba(0,240,255,0.1)] hover:shadow-[0_0_30px_rgba(0,240,255,0.25)] hover:border-cyan-400 transition-all cursor-pointer flex flex-col items-center justify-center text-center group relative overflow-hidden backdrop-blur-md"
          >
            <div className="mb-2 text-cyan-400 group-hover:scale-110 transition-transform">
              <Activity className="w-6 h-6 stroke-[2.2] animate-pulse" />
            </div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-cyan-300 font-mono mb-1">
              ACTIVE SURVEILLANCE
            </span>
            <span className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight drop-shadow-[0_0_10px_rgba(0,240,255,0.5)]">
              1,204
            </span>
            <span className="text-[10px] text-cyan-400/70 font-mono mt-0.5">24 Active Links</span>
          </div>

          {/* Card 2: Neutralized Threats */}
          <div
            onClick={() => onSelectTab("patterns")}
            className="bg-slate-950/80 rounded-2xl border border-emerald-500/30 p-5 shadow-[0_0_20px_rgba(16,185,129,0.1)] hover:shadow-[0_0_30px_rgba(16,185,129,0.25)] hover:border-emerald-400 transition-all cursor-pointer flex flex-col items-center justify-center text-center group relative overflow-hidden backdrop-blur-md"
          >
            <div className="mb-2 text-emerald-400 group-hover:scale-110 transition-transform">
              <CheckCircle className="w-6 h-6 stroke-[2.2]" />
            </div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-300 font-mono mb-1">
              NEUTRALIZED THREATS
            </span>
            <span className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]">
              8,432
            </span>
            <span className="text-[10px] text-emerald-400/70 font-mono mt-0.5">{suspiciousPatternsCount} Patterns Flagged</span>
          </div>

          {/* Card 3: Nodes In Matrix */}
          <div
            onClick={() => onSelectTab("influencers")}
            className="bg-slate-950/80 rounded-2xl border border-amber-500/30 p-5 shadow-[0_0_20px_rgba(251,191,36,0.1)] hover:shadow-[0_0_30px_rgba(251,191,36,0.25)] hover:border-amber-400 transition-all cursor-pointer flex flex-col items-center justify-center text-center group relative overflow-hidden backdrop-blur-md"
          >
            <div className="mb-2 text-amber-400 group-hover:scale-110 transition-transform">
              <Database className="w-6 h-6 stroke-[2.2]" />
            </div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-300 font-mono mb-1">
              NODES IN MATRIX
            </span>
            <span className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight drop-shadow-[0_0_10px_rgba(251,191,36,0.5)]">
              45.9k
            </span>
            <span className="text-[10px] text-amber-400/70 font-mono mt-0.5">{allNodes.length} Verified Targets</span>
          </div>
        </div>}
      </div>
    </div>
  );
};
