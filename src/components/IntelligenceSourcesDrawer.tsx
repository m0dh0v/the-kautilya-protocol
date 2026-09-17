import React, { useState } from "react";
import { IntelligenceSource, Entity, Relationship, SuspiciousPattern } from "../types/intelligence";
import {
  FileText,
  Phone,
  CreditCard,
  Eye,
  Shield,
  Clock,
  UserCheck,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  Lock,
} from "lucide-react";

interface IntelligenceSourcesDrawerProps {
  sources: IntelligenceSource[];
  onOpenIngestionModal: () => void;
  onSelectSnippetToExtract: (text: string, type: string, title: string) => void;
}

export const IntelligenceSourcesDrawer: React.FC<IntelligenceSourcesDrawerProps> = ({
  sources,
  onOpenIngestionModal,
  onSelectSnippetToExtract,
}) => {
  const [activeType, setActiveType] = useState<string>("all");

  const filteredSources = sources.filter((s) => {
    if (activeType === "all") return true;
    return s.type === activeType;
  });

  const getSourceIcon = (type: string) => {
    switch (type) {
      case "fir":
        return <FileText className="w-4 h-4 text-red-400" />;
      case "cdr":
        return <Phone className="w-4 h-4 text-sky-400" />;
      case "financial":
        return <CreditCard className="w-4 h-4 text-emerald-400" />;
      case "surveillance":
        return <Eye className="w-4 h-4 text-amber-400" />;
      default:
        return <Shield className="w-4 h-4 text-indigo-400" />;
    }
  };

  return (
    <div id="intelligence-sources-drawer" className="w-full h-full flex flex-col bg-slate-900 text-slate-100 overflow-hidden">
      {/* Header */}
      <div className="p-3.5 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-bold text-slate-100">Multi-Source Intelligence Feed</h3>
          </div>
          <p className="text-[11px] text-slate-400">
            {sources.length} Ingested intelligence artifacts verified on blockchain
          </p>
        </div>
        <button
          id="btn-add-intel-source"
          onClick={onOpenIngestionModal}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow transition-all cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Ingest Data</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="p-2 border-b border-slate-800 bg-slate-950/40 flex items-center gap-1 overflow-x-auto no-scrollbar">
        {(
          [
            { id: "all", label: "All" },
            { id: "fir", label: "FIRs" },
            { id: "cdr", label: "CDRs" },
            { id: "financial", label: "Financial" },
            { id: "surveillance", label: "Surveillance" },
          ] as const
        ).map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setActiveType(id)}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
              activeType === id
                ? "bg-slate-800 text-indigo-300 border border-slate-700 font-semibold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Sources List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {filteredSources.map((src) => (
          <div
            key={src.id}
            className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition-all space-y-2"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800">
                  {getSourceIcon(src.type)}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">{src.title}</h4>
                  <span className="text-[10px] text-slate-400 font-mono">{src.refNo}</span>
                </div>
              </div>
              <span className="flex items-center gap-1 text-[9px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                <Lock className="w-2.5 h-2.5" />
                Verified
              </span>
            </div>

            <p className="text-[11px] text-slate-300 font-mono bg-slate-900/90 rounded-lg p-2.5 leading-relaxed line-clamp-3">
              {src.rawSnippet}
            </p>

            <div className="flex items-center justify-between pt-1 text-[10px] text-slate-500 font-mono border-t border-slate-800/80">
              <span>{src.officer}</span>
              <button
                onClick={() => onSelectSnippetToExtract(src.rawSnippet, src.type, src.title)}
                className="text-indigo-400 hover:text-indigo-300 font-sans font-medium flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3" />
                <span>Re-Analyze with AI</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
