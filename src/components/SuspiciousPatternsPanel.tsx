import React, { useState } from "react";
import { SuspiciousPattern, Entity } from "../types/intelligence";
import {
  AlertTriangle,
  Flame,
  ShieldAlert,
  Clock,
  CheckCircle2,
  Filter,
  Search,
  ArrowRight,
  RefreshCw,
  Sparkles,
} from "lucide-react";

interface SuspiciousPatternsPanelProps {
  patterns: SuspiciousPattern[];
  allNodes: Entity[];
  onSelectNodeById: (id: string) => void;
  onHighlightEntities: (entityIds: string[]) => void;
}

export const SuspiciousPatternsPanel: React.FC<SuspiciousPatternsPanelProps> = ({
  patterns,
  allNodes,
  onSelectNodeById,
  onHighlightEntities,
}) => {
  const [selectedPatternId, setSelectedPatternId] = useState<string | null>(patterns[0]?.id || null);
  const [severityFilter, setSeverityFilter] = useState<"all" | "critical" | "high">("all");

  const filteredPatterns = patterns.filter((p) => {
    if (severityFilter === "all") return true;
    return p.severity === severityFilter;
  });

  const activePattern = patterns.find((p) => p.id === selectedPatternId) || patterns[0];

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case "critical":
        return "bg-red-100 text-red-800 border border-red-200";
      case "high":
        return "bg-orange-100 text-orange-800 border border-orange-200";
      case "medium":
        return "bg-amber-100 text-amber-800 border border-amber-200";
      default:
        return "bg-blue-100 text-blue-800 border border-blue-200";
    }
  };

  const handleFocusPattern = (pat: SuspiciousPattern) => {
    setSelectedPatternId(pat.id);
    onHighlightEntities(pat.involvedEntities);
  };

  return (
    <div id="suspicious-patterns-panel" className="w-full h-full flex flex-col md:flex-row bg-slate-50 text-slate-900 overflow-hidden">
      {/* Pattern List (Left) */}
      <div className="w-full md:w-5/12 border-r border-slate-200 flex flex-col overflow-y-auto bg-white">
        <div className="p-4 border-b border-slate-200 bg-white sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-600" />
              <h2 className="text-sm font-bold text-slate-900">Suspicious Patterns ({patterns.length})</h2>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setSeverityFilter("all")}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  severityFilter === "all" ? "bg-slate-900 text-white shadow-2xs" : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setSeverityFilter("critical")}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  severityFilter === "critical" ? "bg-red-100 text-red-800 border border-red-300" : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                Critical
              </button>
            </div>
          </div>
        </div>

        <div className="p-3.5 space-y-3">
          {filteredPatterns.map((pat) => {
            const isSelected = pat.id === activePattern?.id;
            return (
              <div
                key={pat.id}
                onClick={() => handleFocusPattern(pat)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                  isSelected
                    ? "bg-orange-50/50 border-orange-400 shadow-sm ring-1 ring-orange-200"
                    : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 shadow-2xs"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${getSeverityBadge(pat.severity)}`}>
                    {pat.severity} Anomaly
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {new Date(pat.detectedTimestamp).toLocaleDateString()}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-slate-900 leading-snug">{pat.patternName}</h4>
                <p className="text-[11px] text-slate-600 mt-1 line-clamp-2 leading-relaxed">{pat.description}</p>
                <div className="mt-2.5 text-[10px] text-blue-700 font-mono font-semibold flex items-center gap-1">
                  <span>{pat.involvedEntities.length} entities involved</span>
                  <ArrowRight className="w-3 h-3 ml-auto text-blue-600" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Pattern Details (Right) */}
      <div className="w-full md:w-7/12 flex flex-col overflow-y-auto p-5 sm:p-6 space-y-5 bg-slate-50">
        {activePattern ? (
          <>
            <div className="border-b border-slate-200 pb-4">
              <div className="flex items-center gap-2 mb-1.5">
                <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${getSeverityBadge(activePattern.severity)}`}>
                  {activePattern.severity} Pattern
                </span>
                <span className="text-xs text-slate-500 font-mono">ID: {activePattern.id}</span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">{activePattern.patternName}</h3>
              <p className="text-xs sm:text-sm text-slate-700 mt-2.5 leading-relaxed bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
                {activePattern.description}
              </p>
            </div>

            {/* Forensic Indicators */}
            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Forensic Detection Indicators</span>
              </h4>
              <div className="space-y-2">
                {activePattern.indicators.map((ind, i) => (
                  <div key={i} className="flex items-start gap-2.5 bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-800 shadow-2xs">
                    <span className="text-orange-500 font-bold mt-0.5">•</span>
                    <span className="leading-relaxed">{ind}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Involved Entities Pill Matrix */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Directly Linked Entities ({activePattern.involvedEntities.length})
                </h4>
                <button
                  onClick={() => onHighlightEntities(activePattern.involvedEntities)}
                  className="text-xs text-blue-700 hover:text-blue-900 font-bold underline cursor-pointer"
                >
                  Highlight on Graph
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {activePattern.involvedEntities.map((entId) => {
                  const ent = allNodes.find((n) => n.id === entId);
                  if (!ent) return null;
                  return (
                    <div
                      key={ent.id}
                      onClick={() => onSelectNodeById(ent.id)}
                      className="p-3 rounded-xl bg-white border border-slate-200 hover:border-blue-400 cursor-pointer transition-all shadow-2xs flex items-center justify-between"
                    >
                      <div>
                        <span className="text-xs font-bold text-slate-900 block">{ent.name}</span>
                        <span className="text-[10px] text-blue-700 font-mono font-medium">{ent.role}</span>
                      </div>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${getSeverityBadge(ent.riskLevel)}`}>
                        {ent.riskLevel}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        ) : (
          <div className="h-full flex items-center justify-center text-slate-400 text-xs italic">
            Select a suspicious pattern to view detailed analysis.
          </div>
        )}
      </div>
    </div>
  );
};
