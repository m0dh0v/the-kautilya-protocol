import React, { useState } from "react";
import { Database, CheckCircle2, AlertCircle, RefreshCw, Copy, ExternalLink, ShieldCheck, Terminal, Server, ArrowRight } from "lucide-react";

interface DatabaseConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: {
    mongodb: { configured: boolean; connected: boolean; entityCount?: number; databaseName?: string; error?: string };
    neo4j: { configured: boolean; connected: boolean; nodeCount?: number; relationshipCount?: number; uri?: string; error?: string };
    activeMode: string;
  } | null;
  onRefreshStatus: () => Promise<void>;
}

export function DatabaseConnectModal({ isOpen, onClose, status, onRefreshStatus }: DatabaseConnectModalProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedMessage, setSeedMessage] = useState<string | null>(null);
  const [isSyncingAtlas, setIsSyncingAtlas] = useState(false);
  const [atlasSyncMessage, setAtlasSyncMessage] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefreshStatus();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSeed = async () => {
    setIsSeeding(true);
    setSeedMessage(null);
    try {
      const res = await fetch("/api/database/seed", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setSeedMessage(`Seeded successfully: ${data.syncResult?.mongodbCount || 0} entities to MongoDB, ${data.syncResult?.neo4jCount || 0} nodes to Neo4j.`);
        await onRefreshStatus();
      } else {
        setSeedMessage(`Error: ${data.error || "Failed to seed"}`);
      }
    } catch (err: any) {
      setSeedMessage(`Error: ${err.message}`);
    } finally {
      setIsSeeding(false);
    }
  };

  const handleSyncAtlasToNeo4j = async () => {
    setIsSyncingAtlas(true);
    setAtlasSyncMessage(null);
    try {
      const res = await fetch("/api/database/sync-atlas-to-neo4j", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseId: "NCRB-WD-2024-092" }),
      });
      const data = await res.json();
      if (data.success) {
        setAtlasSyncMessage(`Projected ${data.result.entities} Atlas entities and ${data.result.relationships} relationships into Neo4j.`);
        await onRefreshStatus();
      } else {
        setAtlasSyncMessage(`Sync error: ${data.result?.errors?.join(" ") || data.error || "Neo4j sync failed."}`);
      }
    } catch (err: any) {
      setAtlasSyncMessage(`Sync error: ${err.message}`);
    } finally {
      setIsSyncingAtlas(false);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const isLive = status?.mongodb.connected || status?.neo4j.connected;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col bg-slate-950 border border-cyan-500/40 rounded-2xl shadow-[0_0_50px_rgba(0,240,255,0.25)] overflow-hidden font-sans text-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-cyan-500/30 bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-cyan-400 shadow-[0_0_12px_rgba(0,240,255,0.3)]">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-wide text-white uppercase font-mono flex items-center gap-2">
                Real-Time Database Gateway
                {isLive ? (
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/40 rounded-full font-mono">
                    LIVE CONNECTION ACTIVE
                  </span>
                ) : (
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-500/40 rounded-full font-mono">
                    FALLBACK BENCHMARK DATA
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Connect MongoDB Atlas & Neo4j to pipe real-time intelligence into NETRA 404
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-mono bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 transition-colors cursor-pointer disabled:opacity-50"
              title="Re-check database connections"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
              <span>{isRefreshing ? "Testing..." : "Test Link"}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Live Status Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* MongoDB Atlas Status Card */}
            <div className={`p-4 rounded-xl border transition-all ${
              status?.mongodb.connected
                ? "bg-emerald-950/20 border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.15)]"
                : status?.mongodb.configured
                ? "bg-amber-950/20 border-amber-500/40"
                : "bg-slate-900/60 border-slate-800"
            }`}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`w-3 h-3 rounded-full ${
                    status?.mongodb.connected ? "bg-emerald-400 shadow-[0_0_8px_#34d399]" : "bg-slate-600"
                  }`} />
                  <div>
                    <h3 className="font-bold text-sm text-white font-mono">MongoDB Cloud Atlas</h3>
                    <p className="text-[11px] text-slate-400 font-mono">
                      FIRs, CDRs, Suspect Dossiers, Bank Trails
                    </p>
                  </div>
                </div>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                  status?.mongodb.connected
                    ? "bg-emerald-900 text-emerald-200 border border-emerald-500/30"
                    : "bg-slate-800 text-slate-400"
                }`}>
                  {status?.mongodb.connected ? "CONNECTED" : status?.mongodb.configured ? "CONFIG ERROR" : "NOT SET"}
                </span>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-800/80 text-xs font-mono space-y-1">
                {status?.mongodb.connected ? (
                  <>
                    <div className="flex justify-between text-slate-300">
                      <span className="text-slate-400">Database:</span>
                      <span className="text-cyan-300">{status.mongodb.databaseName || "kautilya_db"}</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span className="text-slate-400">Live Ingested Entities:</span>
                      <span className="text-emerald-300 font-bold">{status.mongodb.entityCount ?? 0}</span>
                    </div>
                  </>
                ) : (
                  <p className="text-[11px] text-slate-400">
                    {status?.mongodb.error || "Provide MONGODB_URI in Settings to enable real-time ingestion."}
                  </p>
                )}
              </div>
            </div>

            {/* Neo4j Status Card */}
            <div className={`p-4 rounded-xl border transition-all ${
              status?.neo4j.connected
                ? "bg-emerald-950/20 border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.15)]"
                : status?.neo4j.configured
                ? "bg-amber-950/20 border-amber-500/40"
                : "bg-slate-900/60 border-slate-800"
            }`}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`w-3 h-3 rounded-full ${
                    status?.neo4j.connected ? "bg-emerald-400 shadow-[0_0_8px_#34d399]" : "bg-slate-600"
                  }`} />
                  <div>
                    <h3 className="font-bold text-sm text-white font-mono">Neo4j Graph Database</h3>
                    <p className="text-[11px] text-slate-400 font-mono">
                      Syndicate Topology, Shortest Path, Centrality
                    </p>
                  </div>
                </div>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                  status?.neo4j.connected
                    ? "bg-emerald-900 text-emerald-200 border border-emerald-500/30"
                    : "bg-slate-800 text-slate-400"
                }`}>
                  {status?.neo4j.connected ? "CONNECTED" : status?.neo4j.configured ? "CONFIG ERROR" : "NOT SET"}
                </span>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-800/80 text-xs font-mono space-y-1">
                {status?.neo4j.connected ? (
                  <>
                    <div className="flex justify-between text-slate-300">
                      <span className="text-slate-400">Live Graph Nodes:</span>
                      <span className="text-cyan-300 font-bold">{status.neo4j.nodeCount ?? 0}</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span className="text-slate-400">Live Relationships:</span>
                      <span className="text-emerald-300 font-bold">{status.neo4j.relationshipCount ?? 0}</span>
                    </div>
                  </>
                ) : (
                  <p className="text-[11px] text-slate-400">
                    {status?.neo4j.error || "Provide NEO4J_URI, USERNAME & PASSWORD to stream live graph edges."}
                  </p>
                )}
              </div>
            </div>

          </div>

          {/* Seed Initial Data Action */}
          <div className="p-4 rounded-xl bg-slate-900/70 border border-cyan-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-xs font-bold text-cyan-300 uppercase tracking-wide font-mono flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                Initialize / Seed Connected Databases
              </h4>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                Populate connected MongoDB and Neo4j with Operation Durga's 24 entities and 30 relationships.
              </p>
            </div>
            <button
              onClick={handleSeed}
              disabled={isSeeding}
              className="shrink-0 px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 border border-cyan-400/50 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              <Server className={`w-3.5 h-3.5 ${isSeeding ? "animate-spin" : ""}`} />
              <span>{isSeeding ? "Seeding..." : "Seed Database Now"}</span>
            </button>
          </div>

          {seedMessage && (
            <div className="p-3 rounded-lg bg-cyan-950/60 border border-cyan-500/40 text-xs font-mono text-cyan-200">
              {seedMessage}
            </div>
          )}

          <div className="p-4 rounded-xl bg-slate-900/70 border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-xs font-bold text-emerald-300 uppercase tracking-wide font-mono flex items-center gap-1.5">
                <ArrowRight className="w-4 h-4 text-emerald-400" />
                Project Atlas Data to Neo4j
              </h4>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                Read `entities` and `relationships` imported through Compass and upsert them into Neo4j for Console analysis.
              </p>
            </div>
            <button
              onClick={handleSyncAtlasToNeo4j}
              disabled={isSyncingAtlas || !status?.mongodb.connected || !status?.neo4j.connected}
              className="shrink-0 px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-400/50 transition-all cursor-pointer disabled:opacity-40 flex items-center gap-1.5"
            >
              <ArrowRight className={`w-3.5 h-3.5 ${isSyncingAtlas ? "animate-pulse" : ""}`} />
              <span>{isSyncingAtlas ? "Projecting..." : "Sync Atlas to Neo4j"}</span>
            </button>
          </div>

          {atlasSyncMessage && (
            <div className="p-3 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-xs font-mono text-emerald-200">
              {atlasSyncMessage}
            </div>
          )}

          {/* Quick Setup Instructions for Partner & You */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono flex items-center gap-1.5">
              <Terminal className="w-4 h-4 text-cyan-400" />
              Integration Parameters Required
            </h3>

            {/* Config 1: MongoDB */}
            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold font-mono text-emerald-400">1. MongoDB Atlas Cloud URI</span>
                <button
                  onClick={() => copyToClipboard("MONGODB_URI", "mongo_var")}
                  className="text-[11px] font-mono text-slate-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
                >
                  <Copy className="w-3 h-3" />
                  {copiedKey === "mongo_var" ? "Copied" : "Copy Name"}
                </button>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-[11px] font-mono text-slate-300 break-all select-all">
                mongodb+srv://&lt;username&gt;:&lt;password&gt;@cluster0.abcde.mongodb.net/kautilya_db?retryWrites=true&w=majority
              </div>
              <p className="text-[11px] text-slate-400">
                • In MongoDB Atlas, go to <span className="text-slate-200">Network Access</span> and ensure IP Access is enabled (<code className="text-cyan-300">0.0.0.0/0</code> for cloud containers).
              </p>
            </div>

            {/* Config 2: Neo4j */}
            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold font-mono text-cyan-400">2. Neo4j Graph Connection</span>
                <span className="text-[11px] text-slate-400 font-mono">From Partner's Device</span>
              </div>
              
              <div className="text-[11px] text-slate-300 space-y-2">
                <div className="p-2 rounded bg-slate-950 border border-slate-800/80 font-mono">
                  <div className="text-amber-400 font-bold mb-1">Option A: If your partner uses free Neo4j AuraDB (Recommended):</div>
                  <div className="text-slate-400">URI: <span className="text-cyan-300">neo4j+s://&lt;db-id&gt;.databases.neo4j.io</span></div>
                </div>

                <div className="p-2 rounded bg-slate-950 border border-slate-800/80 font-mono">
                  <div className="text-amber-400 font-bold mb-1">Option B: If Neo4j is running locally on their laptop:</div>
                  <div className="text-slate-400">Have your partner run this command in their terminal:</div>
                  <div className="bg-black/60 p-1.5 rounded mt-1 text-cyan-300 flex items-center justify-between">
                    <code>ngrok tcp 7687</code>
                    <button
                      onClick={() => copyToClipboard("ngrok tcp 7687", "ngrok_cmd")}
                      className="text-[10px] text-slate-400 hover:text-white cursor-pointer ml-2"
                    >
                      {copiedKey === "ngrok_cmd" ? "Copied" : "Copy"}
                    </button>
                  </div>
                  <div className="text-slate-400 mt-1">Then use the resulting ngrok URL: <span className="text-cyan-300">bolt://4.tcp.ngrok.io:&lt;port&gt;</span></div>
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-cyan-500/30 bg-slate-900/80 flex items-center justify-between text-xs font-mono text-slate-400">
          <div>Status: <span className="text-cyan-300 font-bold">{status?.activeMode || "fallback_sample"}</span></div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-200 font-bold cursor-pointer"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
}
