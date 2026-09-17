import React, { useState } from "react";
import { Entity, Relationship } from "../types/intelligence";
import {
  Crown,
  Network,
  AlertTriangle,
  Zap,
  Target,
  Sparkles,
  ChevronRight,
  TrendingUp,
  ShieldCheck,
  Building,
  User,
  ArrowRight,
} from "lucide-react";

interface InfluencerMatrixProps {
  nodes: Entity[];
  links: Relationship[];
  onSelectNodeById: (id: string) => void;
  onTracePathToKingpin: (startId: string) => void;
}

export const InfluencerMatrix: React.FC<InfluencerMatrixProps> = ({
  nodes,
  links,
  onSelectNodeById,
  onTracePathToKingpin,
}) => {
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiReport, setAiReport] = useState<{
    executiveSummary: string;
    keyInfluencers: Array<{ id: string; title: string; influenceType: string; vulnerability: string }>;
    disruptionStrategy: string;
  } | null>(null);

  // Compute ranking locally
  const sortedByBetweenness = [...nodes].sort((a, b) => (b.betweenness || 0) - (a.betweenness || 0));
  const sortedByDegree = [...nodes].sort((a, b) => (b.degree || 0) - (a.degree || 0));

  const runAIDisruptionAssessment = async () => {
    setIsGeneratingAI(true);
    try {
      const payload = {
        nodes: nodes.map((n) => ({ id: n.id, name: n.name, role: n.role, riskLevel: n.riskLevel })),
        links: links.map((l) => ({
          source: typeof l.source === "object" ? (l.source as any).id : l.source,
          target: typeof l.target === "object" ? (l.target as any).id : l.target,
          type: l.relationshipType,
        })),
        metrics: {
          topBetweenness: sortedByBetweenness.slice(0, 3).map((n) => ({ name: n.name, score: n.betweenness })),
          topDegree: sortedByDegree.slice(0, 3).map((n) => ({ name: n.name, degree: n.degree })),
        },
      };

      const res = await fetch("/api/ai/influencers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      setAiReport(data);
    } catch (err) {
      console.error("Failed to run AI assessment:", err);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  return (
    <div id="influencer-matrix-view" className="w-full h-full flex flex-col bg-slate-50 text-slate-900 overflow-y-auto p-4 sm:p-6 space-y-6">
      {/* Header with AI Trigger */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-amber-600" />
            <h2 className="text-lg font-bold text-slate-900">Key Influencers & Centrality Hierarchy</h2>
          </div>
          <p className="text-xs text-slate-600 mt-0.5">
            Algorithmic ranking of critical command figures, high-betweenness cutouts, and operational bottlenecks.
          </p>
        </div>

        <button
          id="btn-run-influencer-ai"
          onClick={runAIDisruptionAssessment}
          disabled={isGeneratingAI}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md transition-all self-start sm:self-auto disabled:opacity-50 cursor-pointer"
        >
          <Sparkles className="w-4 h-4 text-orange-400" />
          <span>{isGeneratingAI ? "Synthesizing Topology..." : "AI Disruption Strategy"}</span>
        </button>
      </div>

      {/* AI Disruption Strategy Banner (if generated) */}
      {aiReport && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-md">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
            <Zap className="w-4 h-4 text-amber-500" />
            <span>AI Operational Disruption Plan (Gemini Intelligence)</span>
          </div>
          <p className="text-xs text-slate-700 leading-relaxed">{aiReport.executiveSummary}</p>

          <div className="space-y-2">
            <h4 className="text-[11px] font-bold text-slate-500 uppercase">Target Vulnerability Profiles:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {aiReport.keyInfluencers?.map((inf, idx) => (
                <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-900">{inf.title}</span>
                    <span className="text-[10px] text-slate-500 font-mono">{inf.influenceType}</span>
                  </div>
                  <p className="text-[11px] text-slate-600">{inf.vulnerability}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-900">
            <strong>Optimal Intervention Sequence:</strong> {aiReport.disruptionStrategy}
          </div>
        </div>
      )}

      {/* Key Influencer Cards */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
          <Target className="w-4 h-4 text-red-600" />
          <span>Priority High-Value Targets (HVTs)</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedByBetweenness.slice(0, 6).map((node, idx) => {
            const isTopCutout = (node.betweenness || 0) > 0.35;
            const isApexKingpin = node.role.toLowerCase().includes("mastermind") || node.role.toLowerCase().includes("kingpin");

            return (
              <div
                key={node.id}
                className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-xs hover:shadow-md ${
                  isApexKingpin
                    ? "bg-red-50/70 border-red-200 hover:border-red-400"
                    : isTopCutout
                    ? "bg-amber-50/70 border-amber-200 hover:border-amber-400"
                    : "bg-white border-slate-200 hover:border-slate-300"
                }`}
                onClick={() => onSelectNodeById(node.id)}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                        #{idx + 1} Ranked
                      </span>
                      {isApexKingpin && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-red-100 text-red-800 border border-red-200">
                          Apex Mastermind
                        </span>
                      )}
                      {isTopCutout && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-200">
                          Critical Broker
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm font-bold text-slate-900">{node.name}</h4>
                    <p className="text-xs text-blue-700 font-semibold line-clamp-1">{node.role}</p>
                  </div>
                </div>

                <div className="mt-3.5 pt-3 border-t border-slate-200/80 grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-500 block text-[10px] font-medium">Betweenness Centrality:</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                        <div
                          className="h-full bg-amber-500 rounded-full"
                          style={{ width: `${Math.min(100, ((node.betweenness || 0) / 0.8) * 100)}%` }}
                        ></div>
                      </div>
                      <span className="font-mono text-amber-700 font-bold">{(node.betweenness || 0).toFixed(2)}</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-500 block text-[10px] font-medium">Direct Connections:</span>
                    <span className="font-mono text-slate-800 font-bold">{node.degree || 0} links</span>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between text-xs pt-1.5 border-t border-slate-100">
                  <span className="text-[10px] text-slate-500 font-medium">{node.community}</span>
                  <span className="text-[11px] text-blue-700 flex items-center gap-0.5 font-bold hover:underline">
                    Inspect <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Analytical Explainer for Law Enforcement */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 text-xs space-y-2 text-slate-700 shadow-sm">
        <h4 className="font-bold text-slate-900 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-blue-700" />
          <span>Graph Theory Metrics in Criminal Network Analysis (SNA)</span>
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-slate-600 pt-1">
          <div>
            <span className="text-amber-800 font-bold block mb-0.5">Betweenness Centrality (Brokers / Cutouts):</span>
            Measures how often an entity falls on the shortest path between any two other individuals. In organized crime syndicates, figures with high betweenness are the <em>indispensable intermediaries</em> (such as Madam Sunita Rao). If neutralized, the kingpin cannot issue commands to safehouses or couriers.
          </div>
          <div>
            <span className="text-blue-800 font-bold block mb-0.5">Degree Centrality (Operational Hubs):</span>
            Counts direct links. Identifies operational nodes managing numerous accounts, burner phones, or vehicles (such as Hawala banker Rajan Verma). These nodes provide the most evidentiary touchpoints for legal search warrants and freezing orders under CrPC / BNSS.
          </div>
        </div>
      </div>
    </div>
  );
};
