import React, { useState } from "react";
import {
  Search,
  Activity,
  CheckCircle,
  Database,
  Plus,
  X,
  ArrowRight,
  Shield,
  AlertTriangle,
  Lock,
  Users,
  ChevronRight,
  Crosshair,
  Zap,
  Terminal,
  Radio,
  Cpu,
} from "lucide-react";
import { Entity } from "../types/intelligence";
import { NetraLogo } from "./Logos";

interface HomeViewProps {
  onSearch: (query: string) => void;
  onSelectTab: (tab: "network" | "influencers" | "patterns" | "blockchain" | "copilot" | "pathfinder") => void;
  onSelectEntity: (entityId: string) => void;
  allNodes: Entity[];
  totalLinksCount: number;
  suspiciousPatternsCount: number;
}

interface CrossRefParam {
  id: string;
  key: string;
  value: string;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onSearch,
  onSelectTab,
  onSelectEntity,
  allNodes,
  totalLinksCount,
  suspiciousPatternsCount,
}) => {
  const [primaryQuery, setPrimaryQuery] = useState("");
  const [paramKey, setParamKey] = useState("");
  const [paramValue, setParamValue] = useState("");
  const [activeParams, setActiveParams] = useState<CrossRefParam[]>([
    { id: "1", key: "phone", value: "+91-98712-40192" },
    { id: "2", key: "case", value: "FIR-104-NCRB" },
  ]);

  const handleInitialize = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (primaryQuery.trim()) {
      onSearch(primaryQuery.trim());
    } else {
      onSelectTab("network");
    }
  };

  const handleAddParam = () => {
    if (!paramKey.trim() || !paramValue.trim()) return;
    setActiveParams((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        key: paramKey.trim(),
        value: paramValue.trim(),
      },
    ]);
    setParamKey("");
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
      className="relative flex-1 w-full overflow-y-auto overflow-x-hidden min-h-full flex flex-col justify-between select-none"
    >
      {/* ========================================================================= */}
      {/* BACKGROUND ACCENTS: SUBTLE TRICOLOR ENERGY PLASMA GLOW ON TOP & BOTTOM    */}
      {/* (THE ANIMATED HUD CANVAS RUNS BEHIND THIS TRANSPARENT PORTAL)             */}
      {/* ========================================================================= */}
      <div className="absolute inset-0 pointer-events-none -z-10 overflow-hidden">
        {/* Top Saffron / Solar Energy Wash */}
        <div
          className="absolute -top-16 left-1/2 -translate-x-1/2 w-[720px] h-48 opacity-20 blur-3xl pointer-events-none"
          style={{
            background: "radial-gradient(ellipse at center, #FF9933 0%, rgba(255, 153, 51, 0) 70%)",
          }}
        />

        {/* Bottom Emerald Cyber Plasma Wash */}
        <div
          className="absolute -bottom-16 left-1/2 -translate-x-1/2 w-[720px] h-48 opacity-20 blur-3xl pointer-events-none"
          style={{
            background: "radial-gradient(ellipse at center, #10b981 0%, rgba(16, 185, 129, 0) 70%)",
          }}
        />
      </div>

      {/* Main Container - The Middle Part of Frontend */}
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-12 flex-1 flex flex-col justify-between relative z-10">
        
        {/* ========================================================================= */}
        {/* CENTERPIECE: STARK ARC REACTOR / CEREBRO CHAMBER EMBLEM & NETRA 404       */}
        {/* ========================================================================= */}
        <div className="flex flex-col items-center justify-center text-center my-2 sm:my-4 animate-in fade-in zoom-in-95 duration-300">
          
          {/* Holographic Arc Reactor Pedestal */}
          <div
            className="cursor-pointer group select-none relative transition-transform duration-300 hover:scale-[1.02]"
            onClick={() => onSelectTab("network")}
            title="Launch Interactive Neural Graph"
          >
            {/* Outer Rotating HUD Concentric Rings (Iron Man HUD / Cerebro chamber) */}
            <div className="absolute -inset-4 sm:-inset-6 pointer-events-none flex items-center justify-center">
              {/* Rotating outer ring */}
              <svg
                viewBox="0 0 200 200"
                className="w-full h-full text-cyan-500/25 animate-hud-spin absolute"
              >
                <circle
                  cx="100"
                  cy="100"
                  r="92"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                  strokeDasharray="6 8"
                />
                {/* 4 Cardinal Reticles */}
                <line x1="100" y1="4" x2="100" y2="12" stroke="currentColor" strokeWidth="1.5" />
                <line x1="100" y1="188" x2="100" y2="196" stroke="currentColor" strokeWidth="1.5" />
                <line x1="4" y1="100" x2="12" y2="100" stroke="currentColor" strokeWidth="1.5" />
                <line x1="188" y1="100" x2="196" y2="100" stroke="currentColor" strokeWidth="1.5" />
              </svg>

              {/* Counter-rotating inner segmented ring */}
              <svg
                viewBox="0 0 200 200"
                className="w-full h-full text-cyan-400/30 animate-hud-spin-reverse absolute"
              >
                <circle
                  cx="100"
                  cy="100"
                  r="78"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeDasharray="24 16"
                />
              </svg>
            </div>

            {/* Central High-Tech Glass Capsule */}
            <div className="relative px-6 py-4 sm:px-8 sm:py-5 rounded-3xl bg-slate-950/85 border border-cyan-500/40 shadow-[0_0_40px_rgba(0,240,255,0.18)] backdrop-blur-xl flex flex-col sm:flex-row items-center gap-4 sm:gap-6 group-hover:border-cyan-400/80 group-hover:shadow-[0_0_50px_rgba(0,240,255,0.3)] transition-all">
              {/* Corner HUD brackets */}
              <span className="absolute top-2 left-2 text-cyan-400 text-xs font-mono select-none opacity-60">┌</span>
              <span className="absolute top-2 right-2 text-cyan-400 text-xs font-mono select-none opacity-60">┐</span>
              <span className="absolute bottom-2 left-2 text-cyan-400 text-xs font-mono select-none opacity-60">└</span>
              <span className="absolute bottom-2 right-2 text-cyan-400 text-xs font-mono select-none opacity-60">┘</span>

              {/* Emblem from netra-404.jpeg glowing with Arc Reactor Cyan */}
              <div className="relative">
                <div className="absolute inset-0 bg-cyan-400/20 blur-xl rounded-full" />
                <NetraLogo
                  showText={false}
                  className="h-16 sm:h-20 md:h-24 w-auto relative z-10"
                  iconClassName="text-cyan-400 drop-shadow-[0_0_16px_rgba(0,240,255,0.85)] animate-arc-pulse"
                />
              </div>

              {/* Exact Bold Uppercase Team Name: NETRA 404 with Metallic Shimmer */}
              <div className="flex flex-col items-center sm:items-start text-center sm:text-left relative z-10">
                <div className="flex items-center gap-2">
                  <span className="text-3xl sm:text-4xl md:text-5xl font-black tracking-[0.25em] text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-cyan-300 font-sans uppercase drop-shadow-[0_0_15px_rgba(0,240,255,0.45)]">
                    NETRA 404
                  </span>
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping hidden sm:inline-block" />
                </div>
                <span className="text-[11px] sm:text-xs font-bold tracking-[0.28em] text-cyan-300 uppercase mt-1 font-mono flex items-center gap-1.5">
                  <Zap className="w-3 h-3 text-cyan-400" />
                  <span>DEFENCE &amp; INTEL VIGILANCE UNIT</span>
                </span>
              </div>
            </div>
          </div>

          {/* Tactical Telemetry & National Security Motto */}
          <div className="mt-3 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <p className="text-xs sm:text-sm font-semibold text-cyan-200/90 tracking-wide font-hindi drop-shadow-[0_0_6px_rgba(0,240,255,0.3)]">
              संबंधेषु रहस्यं, विश्लेषणे सत्यं। (In relationships lies the mystery, in analysis lies the truth)
            </p>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* CENTRAL INVESTIGATIVE SEARCH & CROSS-REFERENCE TARGET CONSOLE             */}
        {/* Styled as a futuristic Iron Man / Cerebro cyber terminal console          */}
        {/* ========================================================================= */}
        <div className="w-full max-w-3xl mx-auto bg-slate-950/85 rounded-3xl shadow-[0_0_45px_rgba(0,240,255,0.14)] border border-cyan-500/40 p-5 sm:p-7 backdrop-blur-xl transition-all relative overflow-hidden group">
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
              <Terminal className="w-4 h-4 text-cyan-400" />
              <span className="font-bold tracking-wider">TARGET ACQUISITION CONSOLE</span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-cyan-400/80">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span>RADAR SYNCHRONIZED</span>
            </div>
          </div>

          <form onSubmit={handleInitialize} className="w-full">
            {/* Primary Search Input & INITIALIZE Button */}
            <div className="relative flex items-center bg-slate-900/90 border border-cyan-500/40 rounded-2xl p-1.5 focus-within:border-cyan-400 focus-within:shadow-[0_0_20px_rgba(0,240,255,0.3)] transition-all">
              <span className="text-cyan-400 font-mono text-xs pl-3 pr-1 select-none font-bold">
                $&gt;
              </span>
              <input
                id="portal-primary-search"
                type="text"
                value={primaryQuery}
                onChange={(e) => setPrimaryQuery(e.target.value)}
                placeholder="Target ID, Name, Alias, Phone, Crypto Wallet, Hash..."
                className="w-full bg-transparent text-xs sm:text-sm md:text-base text-cyan-100 placeholder-cyan-700/60 focus:outline-none py-2 px-2 font-mono"
              />
              <button
                type="submit"
                id="btn-portal-initialize"
                className="shrink-0 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs sm:text-sm tracking-widest uppercase px-5 sm:px-6 py-3 rounded-xl transition-all cursor-pointer shadow-[0_0_15px_rgba(0,240,255,0.4)] hover:shadow-[0_0_25px_rgba(0,240,255,0.6)] flex items-center gap-1.5 font-mono active:scale-[0.98]"
              >
                <span>INITIALIZE</span>
                <ChevronRight className="w-4 h-4 stroke-[3]" />
              </button>
            </div>
          </form>

          {/* Cross-Reference Parameters Section */}
          <div className="mt-5 pt-4 border-t border-slate-800/80">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-300 font-mono flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse"></span>
                  MULTI-AGENCY CROSS-REFERENCE PARAMETERS
                </span>
              </div>
              <span className="text-xs font-bold text-cyan-300 font-mono bg-cyan-950/70 px-2.5 py-0.5 rounded-lg border border-cyan-500/30 shadow-[0_0_10px_rgba(0,240,255,0.2)]">
                {activeParams.length} Linked Traces
              </span>
            </div>

            {/* Input Row: Key + Value + Add Button */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
              <div className="sm:col-span-5">
                <input
                  id="param-key-input"
                  type="text"
                  value={paramKey}
                  onChange={(e) => setParamKey(e.target.value)}
                  placeholder="Key (e.g., phone, bank, vehicle, hash)"
                  className="w-full bg-slate-900/80 border border-slate-700/80 focus:border-cyan-400 focus:shadow-[0_0_10px_rgba(0,240,255,0.25)] rounded-xl px-3.5 py-2 text-xs sm:text-sm text-cyan-100 placeholder-slate-500 focus:outline-none transition-all font-mono"
                />
              </div>
              <div className="sm:col-span-5">
                <input
                  id="param-value-input"
                  type="text"
                  value={paramValue}
                  onChange={(e) => setParamValue(e.target.value)}
                  placeholder="Value (e.g., RJ14-CC-1992, HDFC-0012)"
                  className="w-full bg-slate-900/80 border border-slate-700/80 focus:border-cyan-400 focus:shadow-[0_0_10px_rgba(0,240,255,0.25)] rounded-xl px-3.5 py-2 text-xs sm:text-sm text-cyan-100 placeholder-slate-500 focus:outline-none transition-all font-mono"
                />
              </div>
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
                    <span className="font-bold text-cyan-400 uppercase">{p.key}:</span>
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
          </div>
        </div>

        {/* ========================================================================= */}
        {/* THREE STATISTIC METRIC CARDS - STARK HUD TELEMETRY TILES                   */}
        {/* ========================================================================= */}
        <div className="w-full max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 mt-5 sm:mt-6">
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
        </div>

        {/* ========================================================================= */}
        {/* PRIORITY INTELLIGENCE BRIEFING & SUSPECT LAUNCHPAD (DEFCON ALERT)         */}
        {/* ========================================================================= */}
        <div className="w-full max-w-3xl mx-auto mt-5 bg-slate-950/85 border border-red-500/30 rounded-2xl p-4 sm:p-5 shadow-[0_0_25px_rgba(239,68,68,0.12)] backdrop-blur-md">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-950/80 text-red-300 border border-red-500/40 uppercase font-mono flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                  <span>ACTIVE SYNDICATE</span>
                </span>
                <h3 className="text-xs sm:text-sm font-bold text-white font-mono">
                  FIR 104/2024: Cross-Border Human Trafficking &amp; Hawala Nexus
                </h3>
              </div>
              <p className="text-xs text-slate-300 max-w-2xl font-sans leading-relaxed">
                Multi-agency intelligence linking safehouses across Delhi NCR, Kathmandu transit corridors, and Hawala banking rings (IPC 370 / BNS 143, PMLA 2002).
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => onSelectTab("network")}
                className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white rounded-xl text-xs font-bold transition-all shadow-[0_0_15px_rgba(239,68,68,0.4)] cursor-pointer font-mono"
              >
                <span>Launch Graph</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Quick Target Chips */}
          <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">
              Priority Targets:
            </span>
            {quickSuspects.map((s) => (
              <button
                key={s.id}
                onClick={() => {
                  onSelectEntity(s.id);
                  onSelectTab("network");
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-red-500/30 hover:border-red-400 text-xs font-semibold text-slate-200 transition-all cursor-pointer font-mono"
              >
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                <span>{s.name}</span>
                <span className="text-[10px] text-red-300">({s.role})</span>
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
