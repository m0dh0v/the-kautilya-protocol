import React, { useState } from "react";
import { Entity, Relationship } from "../types/intelligence";
import { findShortestPath } from "../utils/graphAnalytics";
import {
  Compass,
  ArrowRight,
  Target,
  Sparkles,
  Link,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Zap,
} from "lucide-react";

interface ShortestPathFinderProps {
  nodes: Entity[];
  links: Relationship[];
  initialStartId?: string | null;
  onHighlightPath: (nodeIds: string[], linkIds: string[]) => void;
  onSelectNodeById: (id: string) => void;
}

export const ShortestPathFinder: React.FC<ShortestPathFinderProps> = ({
  nodes,
  links,
  initialStartId,
  onHighlightPath,
  onSelectNodeById,
}) => {
  const [startId, setStartId] = useState<string>(initialStartId || nodes[0]?.id || "");
  const [endId, setEndId] = useState<string>(nodes.find((n) => n.id !== startId)?.id || "");
  const [result, setResult] = useState<{ pathNodeIds: string[]; pathLinkIds: string[] } | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleCompute = () => {
    if (!startId || !endId) return;
    const path = findShortestPath(startId, endId, links);
    setResult(path);
    setHasSearched(true);
    if (path) {
      onHighlightPath(path.pathNodeIds, path.pathLinkIds);
    } else {
      onHighlightPath([], []);
    }
  };

  const handleReset = () => {
    setResult(null);
    setHasSearched(false);
    onHighlightPath([], []);
  };

  const quickPairs = [
    {
      label: "Kingpin ➔ Safehouse",
      start: "person_vikram_singh",
      end: "loc_paharganj_safehouse",
    },
    {
      label: "Kingpin ➔ Hawala Cash Vault",
      start: "person_vikram_singh",
      end: "loc_chandni_chowk_hawala",
    },
    {
      label: "Recruiter ➔ Overseas Crypto Wallet",
      start: "person_sunita_rao",
      end: "fin_crypto_tr7n",
    },
    {
      label: "Job Portal Dev ➔ Safehouse Scorpio",
      start: "person_kunal_mehta",
      end: "veh_dl_1c_ab_4921",
    },
  ];

  const handleApplyPair = (pair: (typeof quickPairs)[0]) => {
    setStartId(pair.start);
    setEndId(pair.end);
    const path = findShortestPath(pair.start, pair.end, links);
    setResult(path);
    setHasSearched(true);
    if (path) {
      onHighlightPath(path.pathNodeIds, path.pathLinkIds);
    }
  };

  return (
    <div id="shortest-path-finder-view" className="w-full h-full flex flex-col bg-slate-50 text-slate-900 overflow-y-auto p-4 sm:p-6 space-y-5">
      {/* Header */}
      <div className="border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <Compass className="w-5 h-5 text-blue-700" />
          <h2 className="text-base sm:text-lg font-bold text-slate-900">Connection Pathfinder & Broker Trace</h2>
        </div>
        <p className="text-xs text-slate-600 mt-0.5">
          Uncover the hidden intermediaries, front entities, and degrees of separation connecting any two targets.
        </p>
      </div>

      {/* Quick Pair Chips */}
      <div>
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
          Tactical Trajectory Presets:
        </span>
        <div className="flex flex-wrap gap-2">
          {quickPairs.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleApplyPair(p)}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-xs text-slate-800 font-semibold shadow-2xs transition-all cursor-pointer"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Target Selector Inputs */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4 shadow-2xs">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Origin Entity (Source A)</label>
            <select
              value={startId}
              onChange={(e) => setStartId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900"
            >
              {nodes.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.name} ({n.type})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Target Entity (Destination B)</label>
            <select
              value={endId}
              onChange={(e) => setEndId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900"
            >
              {nodes.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.name} ({n.type})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          {hasSearched && (
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-semibold cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear Path</span>
            </button>
          )}
          <button
            onClick={handleCompute}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow transition-all cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Trace Shortest Connection</span>
          </button>
        </div>
      </div>

      {/* Results Display */}
      {hasSearched && (
        <div className="space-y-3 animate-in fade-in">
          {result && result.pathNodeIds.length > 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs sm:text-sm font-bold text-slate-900">
                    Connection Path Found ({result.pathNodeIds.length - 1} Degrees of Separation)
                  </span>
                </div>
                <span className="text-[11px] text-blue-700 font-mono font-bold bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                  Highlighted on Graph
                </span>
              </div>

              {/* Step by step timeline */}
              <div className="space-y-2 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-200">
                {result.pathNodeIds.map((nId, idx) => {
                  const node = nodes.find((n) => n.id === nId);
                  if (!node) return null;
                  const isStart = idx === 0;
                  const isEnd = idx === result.pathNodeIds.length - 1;

                  return (
                    <div
                      key={nId}
                      onClick={() => onSelectNodeById(node.id)}
                      className="relative flex items-center gap-3 pl-8 py-1 group cursor-pointer"
                    >
                      <div
                        className={`absolute left-2 w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center transition-all ${
                          isStart
                            ? "border-emerald-600 bg-emerald-100"
                            : isEnd
                            ? "border-red-600 bg-red-100"
                            : "border-blue-600 bg-blue-50"
                        }`}
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-800"></div>
                      </div>

                      <div className="flex-1 bg-slate-50 border border-slate-200 group-hover:border-slate-400 rounded-xl p-3 flex items-center justify-between transition-all">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900 group-hover:text-blue-700">
                              {node.name}
                            </span>
                            <span className="text-[10px] font-mono text-slate-500 uppercase">({node.type})</span>
                          </div>
                          <p className="text-[11px] text-blue-700 font-medium">{node.role}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 font-mono font-bold">
                            Step #{idx + 1}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Legal Intermediary Takeaway */}
              {result.pathNodeIds.length > 2 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 leading-relaxed">
                  <strong>Critical Intermediary Cutout:</strong> Notice that{" "}
                  <strong className="underline">{nodes.find((n) => n.id === result.pathNodeIds[1])?.name}</strong> serves as the indispensable link.
                  Securing witness statements or call records for this node will legally tie Origin to Target.
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white border border-red-200 rounded-2xl p-4 flex items-center gap-2.5 text-xs text-red-800 shadow-2xs">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>No direct path found between the selected entities under current link filters.</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
