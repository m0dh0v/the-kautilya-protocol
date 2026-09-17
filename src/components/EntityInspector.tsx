import React from "react";
import { Entity, Relationship } from "../types/intelligence";
import {
  X,
  ShieldAlert,
  Link2,
  Share2,
  Activity,
  FileText,
  Phone,
  Building2,
  MapPin,
  Car,
  CreditCard,
  User,
  ArrowUpRight,
  Target,
  Compass,
} from "lucide-react";

interface EntityInspectorProps {
  entity: Entity;
  allNodes: Entity[];
  allLinks: Relationship[];
  onClose: () => void;
  onSelectNodeById: (id: string) => void;
  onTracePathToKingpin: (startId: string) => void;
  onOpenPathFinder: (startId: string) => void;
}

export const EntityInspector: React.FC<EntityInspectorProps> = ({
  entity,
  allNodes,
  allLinks,
  onClose,
  onSelectNodeById,
  onTracePathToKingpin,
  onOpenPathFinder,
}) => {
  // Find connected links and neighbor entities
  const connectedLinks = allLinks.filter((l) => {
    const sId = typeof l.source === "object" ? (l.source as any).id : l.source;
    const tId = typeof l.target === "object" ? (l.target as any).id : l.target;
    return sId === entity.id || tId === entity.id;
  });

  const neighborEntities = connectedLinks.map((l) => {
    const sId = typeof l.source === "object" ? (l.source as any).id : l.source;
    const tId = typeof l.target === "object" ? (l.target as any).id : l.target;
    const otherId = sId === entity.id ? tId : sId;
    const otherNode = allNodes.find((n) => n.id === otherId);
    return {
      link: l,
      node: otherNode,
    };
  });

  const getRiskBadge = (level: string) => {
    switch (level) {
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

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "person":
        return <User className="w-5 h-5 text-indigo-600" />;
      case "organization":
        return <Building2 className="w-5 h-5 text-emerald-600" />;
      case "location":
        return <MapPin className="w-5 h-5 text-amber-600" />;
      case "phone":
        return <Phone className="w-5 h-5 text-sky-600" />;
      case "vehicle":
        return <Car className="w-5 h-5 text-rose-600" />;
      case "financial_account":
        return <CreditCard className="w-5 h-5 text-green-600" />;
      default:
        return <Activity className="w-5 h-5 text-slate-600" />;
    }
  };

  return (
    <div
      id="entity-inspector-panel"
      className="w-full h-full flex flex-col bg-white border-l border-slate-200 text-slate-900 overflow-y-auto shadow-2xl"
    >
      {/* Header */}
      <div className="p-4 border-b border-slate-200 flex items-start justify-between bg-white sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
            {getTypeIcon(entity.type)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${getRiskBadge(entity.riskLevel)}`}>
                {entity.riskLevel} Risk
              </span>
              <span className="text-xs font-mono text-slate-500 uppercase">{entity.type}</span>
            </div>
            <h2 className="text-base font-bold text-slate-900 mt-1">{entity.name}</h2>
            <p className="text-xs text-blue-700 font-semibold">{entity.role}</p>
          </div>
        </div>
        <button
          id="btn-close-entity-inspector"
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-4 space-y-5">
        {/* Quick Investigative Actions */}
        <div className="grid grid-cols-2 gap-2">
          <button
            id="btn-trace-to-kingpin"
            onClick={() => onTracePathToKingpin(entity.id)}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#0B1329] hover:bg-[#152244] text-white text-xs font-bold shadow transition-all cursor-pointer"
          >
            <Target className="w-3.5 h-3.5" />
            <span>Trace to Kingpin</span>
          </button>
          <button
            id="btn-open-pathfinder"
            onClick={() => onOpenPathFinder(entity.id)}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold border border-slate-200 transition-all cursor-pointer shadow-2xs"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Pathfinder</span>
          </button>
        </div>

        {/* Network Metrics Card */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5">
          <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2.5 flex items-center gap-1.5 font-sans">
            <Activity className="w-3.5 h-3.5 text-blue-600" />
            <span>Graph Analytics Centrality</span>
          </h3>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-white border border-slate-200 rounded-xl p-2 shadow-2xs">
              <span className="text-[10px] text-slate-500 font-medium block">Degree (Edges)</span>
              <span className="text-sm font-bold text-blue-700 font-mono">{entity.degree ?? connectedLinks.length}</span>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-2 shadow-2xs">
              <span className="text-[10px] text-slate-500 font-medium block">Betweenness</span>
              <span className="text-sm font-bold text-amber-700 font-mono">
                {entity.betweenness !== undefined ? entity.betweenness.toFixed(3) : "N/A"}
              </span>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-2 shadow-2xs">
              <span className="text-[10px] text-slate-500 font-medium block">PageRank</span>
              <span className="text-sm font-bold text-emerald-700 font-mono">
                {entity.pageRank !== undefined ? entity.pageRank.toFixed(3) : "N/A"}
              </span>
            </div>
          </div>
          {entity.betweenness && entity.betweenness > 0.3 && (
            <div className="mt-2.5 px-2.5 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 font-medium">
              ⚠️ <strong>High Centrality Cutout:</strong> Critical intermediary. Severing this entity fragments the network into isolated clusters.
            </div>
          )}
          {entity.community && (
            <div className="mt-2 text-[11px] text-slate-600 flex items-center justify-between border-t border-slate-200 pt-2 font-medium">
              <span>Community Ring:</span>
              <span className="font-bold text-slate-900">{entity.community}</span>
            </div>
          )}
        </div>

        {/* Intelligence Attributes */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2">
          <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Intelligence Dossier & Attributes</h3>
          {entity.attributes.alias && (
            <div className="text-xs">
              <span className="text-slate-500 block">Aliases / Known As:</span>
              <span className="text-slate-900 font-medium">{entity.attributes.alias}</span>
            </div>
          )}
          {entity.attributes.contact && (
            <div className="text-xs">
              <span className="text-slate-500 block">Contact / MSISDN:</span>
              <span className="text-slate-900 font-mono">{entity.attributes.contact}</span>
            </div>
          )}
          {entity.attributes.location && (
            <div className="text-xs">
              <span className="text-slate-500 block">Operational Location:</span>
              <span className="text-slate-900">{entity.attributes.location}</span>
            </div>
          )}
          {entity.attributes.criminalRecord && (
            <div className="text-xs bg-red-50 border border-red-200 rounded-xl p-2.5">
              <span className="text-red-800 font-bold block mb-0.5">NCRB Criminal History Record:</span>
              <span className="text-red-900 text-[11px] leading-relaxed">{entity.attributes.criminalRecord}</span>
            </div>
          )}
          {entity.attributes.details && (
            <div className="text-xs">
              <span className="text-slate-500 block">Investigative Notes:</span>
              <p className="text-slate-700 text-[11px] leading-relaxed mt-0.5">{entity.attributes.details}</p>
            </div>
          )}
        </div>

        {/* Connected Entities Web */}
        <div>
          <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Link2 className="w-3.5 h-3.5 text-blue-600" />
              <span>Direct Network Links ({neighborEntities.length})</span>
            </span>
          </h3>
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {neighborEntities.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No direct links filtered.</p>
            ) : (
              neighborEntities.map(({ link, node }, idx) => {
                if (!node) return null;
                return (
                  <div
                    key={link.id || idx}
                    onClick={() => onSelectNodeById(node.id)}
                    className="group p-2.5 rounded-xl bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50/40 cursor-pointer transition-all shadow-2xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs">{getTypeIcon(node.type)}</span>
                        <span className="text-xs font-bold text-slate-800 group-hover:text-blue-700">{node.name}</span>
                      </div>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${getRiskBadge(node.riskLevel)}`}>
                        {node.riskLevel}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-[11px]">
                      <span className="text-blue-700 font-mono font-medium">{link.relationshipType.replace(/_/g, " ")}</span>
                      {link.amount && <span className="text-emerald-700 font-bold">{link.amount}</span>}
                    </div>
                    {link.evidenceSummary && (
                      <p className="text-[10px] text-slate-600 mt-1 line-clamp-2 leading-relaxed">{link.evidenceSummary}</p>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
