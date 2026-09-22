

import React, { useState, useMemo, useEffect, useRef } from "react";
import { CaseData, Entity, Relationship, SuspiciousPattern } from "./types/intelligence";
import { initialCaseData } from "./data/sampleCaseData";
import { computeGraphMetrics } from "./utils/graphAnalytics";
import { NetworkGraph } from "./components/NetworkGraph";
import { EntityInspector } from "./components/EntityInspector";
import { InfluencerMatrix } from "./components/InfluencerMatrix";
import { SuspiciousPatternsPanel } from "./components/SuspiciousPatternsPanel";
import { BlockchainLedgerView } from "./components/BlockchainLedgerView";
import { InvestigativeCopilot } from "./components/InvestigativeCopilot";
import { ShortestPathFinder } from "./components/ShortestPathFinder";
import { DataIngestionModal } from "./components/DataIngestionModal";
import { ExportDossierModal } from "./components/ExportDossierModal";
import { IntelligenceSourcesDrawer } from "./components/IntelligenceSourcesDrawer";
import { DatabaseConnectModal } from "./components/DatabaseConnectModal";
import { NetraLogo, RruShieldLogo, SitaicsCircularLogo } from "./components/Logos";
import { CyberHologramCanvas } from "./components/CyberHologramCanvas";
import { HomeView } from "./components/HomeView";
import { AboutUsView } from "./components/AboutUsView";
import { GalleryView } from "./components/GalleryView";
import { ProtocolsTrainingView } from "./components/ProtocolsTrainingView";
import CrimeLocationMap from "./components/CrimeLocationMap";
import { LoginPage } from "./components/LoginPage";

import {
  Network,
  Crown,
  AlertTriangle,
  Lock,
  Bot,
  Compass,
  FileUp,
  FileText,
  Search,
  ChevronDown,
  X,
  Database,
  CheckCircle2,
  FolderOpen,
  BookOpen,
  Image as ImageIcon,
  Info,
  Layers,
} from "lucide-react";

export type AppView =
  | "home"
  | "about"
  | "gallery"
  | "protocols"
  | "network"
  | "map"
  | "influencers"
  | "patterns"
  | "blockchain"
  | "copilot"
  | "pathfinder";

export default function App() {
  const [caseData, setCaseData] = useState<CaseData>({
    ...initialCaseData,
    nodes: [],
    entities: [],
    links: [],
  });
  const [currentView, setCurrentView] = useState<AppView>("home");

  // Selected Entity state (for inspector)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Path highlighting state
  const [highlightedPathNodeIds, setHighlightedPathNodeIds] = useState<string[]>([]);
  const [highlightedPathLinkIds, setHighlightedPathLinkIds] = useState<string[]>([]);

  // Search input state
  const [searchParameters, setSearchParameters] = useState<string[]>([]);
  const [searchResults, setSearchResults] = useState<Entity[]>([]);

  // Modals / Drawers state
  const [isIngestionModalOpen, setIsIngestionModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isSourcesDrawerOpen, setIsSourcesDrawerOpen] = useState(false);
  const [isDbModalOpen, setIsDbModalOpen] = useState(false);
  const [dbStatus, setDbStatus] = useState<any>(null);
  const [graphSource, setGraphSource] = useState("waiting_live_data");
  const [graphCounts, setGraphCounts] = useState({ nodes: 0, links: 0 });
  const [graphError, setGraphError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [pathfinderInitialStartId, setPathfinderInitialStartId] = useState<string | null>(null);
  const graphSignatureRef = useRef<string | null>(null);
  const graphFetchInFlightRef = useRef(false);

  // Poll database status and real-time graph updates
  const fetchDatabaseStatus = async () => {
    try {
      const res = await fetch("/api/database/status");
      if (res.ok) {
        const data = await res.json();
        setDbStatus(data);
      }
    } catch (err) {
      console.warn("Could not check database status", err);
    }
  };

  const fetchLiveGraph = async () => {
    if (graphFetchInFlightRef.current) return;
    graphFetchInFlightRef.current = true;

    try {
      const res = await fetch("/api/graph/data");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.nodes) && Array.isArray(data.links) && data.nodes.length > 0) {
          const signature = JSON.stringify({
            nodes: data.nodes
              .map((node: Entity) => ({ id: node.id, type: node.type, name: node.name, riskLevel: node.riskLevel }))
              .sort((a: { id: string }, b: { id: string }) => a.id.localeCompare(b.id)),
            links: data.links
              .map((link: Relationship) => ({
                id: link.id,
                source: typeof link.source === "object" ? link.source.id : link.source,
                target: typeof link.target === "object" ? link.target.id : link.target,
                relationshipType: link.relationshipType,
                weight: link.weight,
              }))
              .sort((a: { id: string }, b: { id: string }) => a.id.localeCompare(b.id)),
          });

          if (graphSignatureRef.current !== signature) {
            graphSignatureRef.current = signature;
            setCaseData((prev) => ({
              ...prev,
              nodes: data.nodes,
              entities: data.nodes,
              links: data.links,
            }));
          }
          setGraphSource(data.dataSource || "unknown");
          setGraphCounts(data.graphCounts || { nodes: data.nodes.length, links: data.links.length });
          setGraphError(null);
        }
        if (data.error) {
          setGraphError(data.error);
          setGraphSource(data.dataSource || "no_live_source");
          setCaseData((prev) => ({ ...prev, nodes: [], entities: [], links: [] }));
        }
      } else {
        const data = await res.json().catch(() => ({}));
        setGraphError(data.error || `Live graph request failed (${res.status}).`);
        setGraphSource(data.dataSource || "no_live_source");
        setCaseData((prev) => ({ ...prev, nodes: [], entities: [], links: [] }));
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not fetch real-time graph data";
      setGraphError(message);
      setCaseData((prev) => ({ ...prev, nodes: [], entities: [], links: [] }));
    } finally {
      graphFetchInFlightRef.current = false;
    }
  };

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setIsAuthenticated(Boolean(data.authenticated));
      })
      .catch(() => {
        if (!cancelled) setIsAuthenticated(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;

    fetchDatabaseStatus();
    fetchLiveGraph();

    const interval = setInterval(() => {
      fetchDatabaseStatus();
      fetchLiveGraph();
    }, 120000);

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // Nav Dropdowns open state
  const [openDropdowns, setOpenDropdowns] = useState<Set<string>>(new Set());
  const dropdownRef = useRef<HTMLDivElement>(null);

  const toggleDropdown = (dropdown: string) => {
    setOpenDropdowns((previous) => {
      const next = new Set(previous);
      if (next.has(dropdown)) {
        next.delete(dropdown);
      } else {
        next.add(dropdown);
      }
      return next;
    });
  };

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdowns(new Set());
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Enriched nodes with computed graph analytics (Betweenness, Degree, PageRank)
  const { enrichedNodes } = useMemo(() => {
    const rawNodes = caseData.nodes || caseData.entities || [];
    const rawLinks = caseData.links || [];
    return computeGraphMetrics(rawNodes, rawLinks);
  }, [caseData.nodes, caseData.entities, caseData.links]);

  const selectedEntity = useMemo(() => {
    return enrichedNodes.find((n) => n.id === selectedNodeId) || null;
  }, [enrichedNodes, selectedNodeId]);

  const focusedGraph = useMemo(() => {
    if (!searchParameters.length) {
      return { nodes: enrichedNodes, links: caseData.links };
    }

    const terms = searchParameters.map((parameter) => parameter.toLowerCase().trim()).filter(Boolean);
    const matches = enrichedNodes.filter((node) => {
      const searchableText = [node.id, node.name, node.role, ...Object.values(node.attributes)]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return terms.every((term) => searchableText.includes(term));
    });
    const visibleIds = new Set(matches.map((node) => node.id));

    return {
      nodes: enrichedNodes.filter((node) => visibleIds.has(node.id)),
      links: caseData.links.filter((link) => {
        const sourceId = typeof link.source === "object" ? link.source.id : link.source;
        const targetId = typeof link.target === "object" ? link.target.id : link.target;
        return visibleIds.has(sourceId) && visibleIds.has(targetId);
      }),
    };
  }, [caseData.links, enrichedNodes, searchParameters]);

  // Handle Search
  useEffect(() => {
    if (!searchParameters.length) {
      setSearchResults([]);
      return;
    }
    const matches = enrichedNodes.filter((node) => {
      const searchableText = [node.id, node.name, node.role, ...Object.values(node.attributes)]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return searchParameters.every((parameter) => searchableText.includes(parameter.toLowerCase().trim()));
    });
    setSearchResults(matches.slice(0, 6));
  }, [searchParameters, enrichedNodes]);

  // Path highlighting helpers
  const handleHighlightPath = (nodeIds: string[], linkIds: string[]) => {
    setHighlightedPathNodeIds(nodeIds);
    setHighlightedPathLinkIds(linkIds);
  };

  const handleHighlightEntities = (entityIds: string[]) => {
    setHighlightedPathNodeIds(entityIds);
    setHighlightedPathLinkIds([]);
    setCurrentView("network");
  };

  const handleTracePathToKingpin = (startId: string) => {
    setPathfinderInitialStartId(startId);
    setCurrentView("pathfinder");
  };

  const handleOpenPathFinder = (startId: string) => {
    setPathfinderInitialStartId(startId);
    setCurrentView("pathfinder");
  };

  // Data Ingestion callback
  const handleDataIngested = (
    newEntities: Entity[],
    newLinks: Relationship[],
    newPatterns: SuspiciousPattern[],
    sourceTitle: string
  ) => {
    setCaseData((prev) => {
      const currentNodes = prev.nodes || prev.entities || [];
      const existingIds = new Set(currentNodes.map((e) => e.id));
      const freshEntities = newEntities.filter((e) => !existingIds.has(e.id));

      const updatedEntities = [...currentNodes, ...freshEntities];
      const updatedLinks = [...(prev.links || []), ...newLinks];
      const updatedPatterns = [...newPatterns, ...(prev.suspiciousPatterns || [])];

      // Asynchronously synchronize newly ingested nodes & edges to MongoDB Atlas and Neo4j
      fetch("/api/graph/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nodes: updatedEntities,
          links: updatedLinks,
          caseId: prev.caseId,
        }),
      })
        .then(() => fetchDatabaseStatus())
        .catch((err) => console.warn("Background DB sync error:", err));

      return {
        ...prev,
        nodes: updatedEntities,
        entities: updatedEntities,
        links: updatedLinks,
        suspiciousPatterns: updatedPatterns,
      };
    });
    setCurrentView("network");
  };

  if (isAuthenticated === null) {
    return <div className="flex h-screen items-center justify-center bg-[#030712] font-mono text-xs text-cyan-300">Authenticating Kautilya Protocol...</div>;
  }

  if (!isAuthenticated) {
    return <LoginPage onSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <div id="app-root" className="w-full h-screen flex flex-col md:flex-row bg-[#030712] text-slate-100 overflow-hidden font-sans relative select-none">
      {/* ========================================================================= */}
      {/* ANIMATED HACKER BACKGROUND (IRON MAN STARK HUD / CEREBRO NEURAL MATRIX)   */}
      {/* ========================================================================= */}
      <CyberHologramCanvas showControls={false} />
      {/* ========================================================================= */}
      {/* 1. TOP HEADER - STARK TACTICAL FLIGHT DECK / CEREBRO COMMAND CONSOLE      */}
      {/* ========================================================================= */}
      <header className="w-full md:w-56 lg:w-60 md:h-full md:overflow-y-auto bg-slate-950/90 backdrop-blur-xl border-b md:border-b-0 md:border-r border-cyan-500/25 shrink-0 z-[1000] shadow-[4px_0_30px_rgba(0,240,255,0.08)] relative flex flex-col">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-7 h-20 md:h-auto md:contents w-full flex items-center justify-between md:flex-col md:justify-start relative">
          {/* Left: Team NETRA 404 Logo with Arc-Reactor Glow */}
          <div
            onClick={() => setCurrentView("home")}
            className="flex items-center justify-center gap-2 cursor-pointer group select-none transition-transform hover:scale-[1.02] md:order-3 md:mt-auto md:mb-5 md:pt-5 md:w-full md:border-t md:border-cyan-400/15"
            title="Return to Cyber Command Portal"
          >
            <NetraLogo
              className="h-9 sm:h-10 md:h-10"
              iconClassName="text-cyan-400 drop-shadow-[0_0_14px_rgba(0,240,255,0.7)]"
              textClassName="text-white drop-shadow-[0_0_10px_rgba(0,240,255,0.35)]"
              subtitleClassName="text-cyan-400/90 font-mono tracking-[0.25em]"
            />
          </div>

          {/* Center: Project Name & Sanskrit Motto with Holographic Illumination */}
          <div className="absolute left-1/2 -translate-x-1/2 text-center px-2 flex flex-col items-center justify-center md:static md:translate-x-0 md:order-1 md:w-full md:pt-8 md:pb-7 md:border-b md:border-cyan-400/15">
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-2xl md:text-[25px] leading-[1.2] font-black tracking-[0.16em] text-transparent bg-clip-text bg-gradient-to-b from-white via-cyan-100 to-cyan-400 uppercase font-serif-official drop-shadow-[0_0_15px_rgba(0,240,255,0.4)]">
                <span className="block">THE</span>
                <span className="block">KAUTILYA</span>
                <span className="block">PROTOCOL</span>
              </h1>
            </div>
            <p className="text-[11px] sm:text-sm font-semibold text-cyan-200/90 tracking-wider mt-2 font-hindi drop-shadow-[0_0_8px_rgba(0,240,255,0.3)]">
              संबंधेषु रहस्यं, विश्लेषणे सत्यं।
            </p>
            <div className="hidden sm:flex items-center gap-2 text-[8px] font-mono text-cyan-400/80 uppercase tracking-[0.18em] mt-2">
              <span>In relationships lies the mystery, in analysis lies the truth</span>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. SUB-NAVIGATION BAR (HACKER HUD STYLING WITH ACTIVE STATES & DROPDOWNS) */}
        {/* ========================================================================= */}
        <div ref={dropdownRef} className="relative z-[1001] order-2 bg-slate-950/75 border-b md:border-b-0 border-cyan-500/20 backdrop-blur-lg">
          <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-7 min-h-12 md:min-h-0 md:py-4 flex flex-col md:items-stretch gap-3">
            {/* Nav Links */}
            <nav className="flex flex-wrap md:flex-col items-stretch gap-1 sm:gap-2 h-full text-xs font-bold text-slate-300">
              {/* HOME */}
              <button
                id="nav-link-home"
                onClick={() => {
                  setCurrentView("home");
                  setOpenDropdowns(new Set());
                }}
                className={`w-full text-left px-3.5 py-2.5 rounded-lg transition-all cursor-pointer font-mono ${
                  currentView === "home"
                    ? "text-cyan-300 bg-cyan-950/60 border border-cyan-400/50 shadow-[0_0_15px_rgba(0,240,255,0.25)] font-extrabold"
                    : "hover:text-cyan-200 hover:bg-slate-900/70 border border-transparent"
                }`}
              >
                HOME
              </button>

              {/* ABOUT US */}
              <button
                id="nav-link-about"
                onClick={() => {
                  setCurrentView("about");
                  setOpenDropdowns(new Set());
                }}
                className={`w-full text-left px-3.5 py-2.5 rounded-lg transition-all cursor-pointer font-mono ${
                  currentView === "about"
                    ? "text-cyan-300 bg-cyan-950/60 border border-cyan-400/50 shadow-[0_0_15px_rgba(0,240,255,0.25)] font-extrabold"
                    : "hover:text-cyan-200 hover:bg-slate-900/70 border border-transparent"
                }`}
              >
                ABOUT US
              </button>

              {/* GALLERY */}
              <button
                id="nav-link-gallery"
                onClick={() => {
                  setCurrentView("gallery");
                  setOpenDropdowns(new Set());
                }}
                className={`w-full text-left px-3.5 py-2.5 rounded-lg transition-all cursor-pointer font-mono ${
                  currentView === "gallery"
                    ? "text-cyan-300 bg-cyan-950/60 border border-cyan-400/50 shadow-[0_0_15px_rgba(0,240,255,0.25)] font-extrabold"
                    : "hover:text-cyan-200 hover:bg-slate-900/70 border border-transparent"
                }`}
              >
                GALLERY
              </button>

              {/* CRIME MAP */}
<button
  id="nav-link-map"
  onClick={() => {
    setCurrentView("map");
    setOpenDropdowns(new Set());
  }}
  className={`w-full text-left px-3.5 py-2.5 rounded-lg transition-all cursor-pointer font-mono ${
    currentView === "map"
      ? "text-cyan-300 bg-cyan-950/60 border border-cyan-400/50 shadow-[0_0_15px_rgba(0,240,255,0.25)] font-extrabold"
      : "hover:text-cyan-200 hover:bg-slate-900/70 border border-transparent"
  }`}
>
  CRIME MAP
</button>

              {/* INTELLIGENCE DROPDOWN */}
              <div className="relative">
                <button
                  id="nav-dropdown-intelligence"
                  onClick={() => toggleDropdown("intelligence")}
                  className={`w-full justify-between flex items-center gap-1 px-3.5 py-2.5 rounded-lg transition-all cursor-pointer font-mono ${
                    ["network", "influencers", "patterns", "copilot"].includes(currentView)
                      ? "text-cyan-300 bg-cyan-950/60 border border-cyan-400/50 shadow-[0_0_15px_rgba(0,240,255,0.25)] font-extrabold"
                      : "hover:text-cyan-200 hover:bg-slate-900/70 border border-transparent"
                  }`}
                >
                  <span>INTELLIGENCE</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-cyan-400 transition-transform ${openDropdowns.has("intelligence") ? "rotate-180" : ""}`} />
                </button>

                {openDropdowns.has("intelligence") && (
                  <div className="mt-1.5 w-full bg-slate-950/95 border border-cyan-500/40 rounded-2xl shadow-[0_0_30px_rgba(0,240,255,0.2)] py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150 backdrop-blur-xl divide-y divide-slate-800/80">
                    <div className="flex items-center justify-between px-4 pb-2 mb-1 border-b border-slate-800/80">
                      <span className="text-[9px] font-mono uppercase tracking-[0.18em] text-cyan-400/70">Intelligence</span>
                    </div>
                    <button
                      onClick={() => {
                        setCurrentView("network");
                        setOpenDropdowns(new Set());
                      }}
                      className="w-full text-left px-4 py-2.5 hover:bg-cyan-950/40 flex items-center gap-2.5 text-xs text-slate-200 font-semibold cursor-pointer group"
                    >
                      <Network className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
                      <div>
                        <div className="text-cyan-200">Interactive Network Graph</div>
                        <div className="text-[10px] text-slate-400 font-normal">D3.js force topology &amp; links</div>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        setCurrentView("influencers");
                        setOpenDropdowns(new Set());
                      }}
                      className="w-full text-left px-4 py-2.5 hover:bg-cyan-950/40 flex items-center gap-2.5 text-xs text-slate-200 font-semibold cursor-pointer group"
                    >
                      <Crown className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                      <div>
                        <div className="text-amber-200">Key Influencer Centrality Matrix</div>
                        <div className="text-[10px] text-slate-400 font-normal">Betweenness, degree, and PageRank</div>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        setCurrentView("patterns");
                        setOpenDropdowns(new Set());
                      }}
                      className="w-full text-left px-4 py-2.5 hover:bg-cyan-950/40 flex items-center justify-between text-xs text-slate-200 font-semibold cursor-pointer group"
                    >
                      <div className="flex items-center gap-2.5">
                        <AlertTriangle className="w-4 h-4 text-red-400 group-hover:scale-110 transition-transform" />
                        <div>
                          <div className="text-red-200">Suspicious Anomaly Patterns</div>
                          <div className="text-[10px] text-slate-400 font-normal">Hawala, smurfing, and proxy rings</div>
                        </div>
                      </div>
                      <span className="px-1.5 py-0.5 rounded-full bg-red-950/80 border border-red-500/40 text-red-300 text-[10px] font-bold">
                        {caseData.suspiciousPatterns.length}
                      </span>
                    </button>

                    <button
                      onClick={() => {
                        setCurrentView("copilot");
                        setOpenDropdowns(new Set());
                      }}
                      className="w-full text-left px-4 py-2.5 hover:bg-cyan-950/40 flex items-center gap-2.5 text-xs text-slate-200 font-semibold cursor-pointer group"
                    >
                      <Bot className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
                      <div>
                        <div className="text-indigo-200">Investigative AI Copilot</div>
                        <div className="text-[10px] text-slate-400 font-normal">J.A.R.V.I.S. neural query assistant</div>
                      </div>
                    </button>
                  </div>
                )}
              </div>

              {/* CASE MANAGEMENT DROPDOWN */}
              <div className="relative">
                <button
                  id="nav-dropdown-case"
                  onClick={() => toggleDropdown("case")}
                  className={`w-full justify-between flex items-center gap-1 px-3.5 py-2.5 rounded-lg transition-all cursor-pointer font-mono ${
                    currentView === "pathfinder"
                      ? "text-cyan-300 bg-cyan-950/60 border border-cyan-400/50 shadow-[0_0_15px_rgba(0,240,255,0.25)] font-extrabold"
                      : "hover:text-cyan-200 hover:bg-slate-900/70 border border-transparent"
                  }`}
                >
                  <span>CASE MANAGEMENT</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-cyan-400 transition-transform ${openDropdowns.has("case") ? "rotate-180" : ""}`} />
                </button>

                {openDropdowns.has("case") && (
                  <div className="mt-1.5 w-full bg-slate-950/95 border border-cyan-500/40 rounded-2xl shadow-[0_0_30px_rgba(0,240,255,0.2)] py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150 backdrop-blur-xl divide-y divide-slate-800/80">
                    <div className="flex items-center justify-between px-4 pb-2 mb-1 border-b border-slate-800/80">
                      <span className="text-[9px] font-mono uppercase tracking-[0.18em] text-cyan-400/70">Case Management</span>
                    </div>
                    <button
                      onClick={() => {
                        setIsIngestionModalOpen(true);
                        setOpenDropdowns(new Set());
                      }}
                      className="w-full text-left px-4 py-2.5 hover:bg-cyan-950/40 flex items-center gap-2.5 text-xs text-slate-200 font-semibold cursor-pointer group"
                    >
                      <FileUp className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                      <div>
                        <div className="text-emerald-200">Ingest Multi-Agency Data</div>
                        <div className="text-[10px] text-slate-400 font-normal">FIR, CDR, bank statement parser</div>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        setIsExportModalOpen(true);
                        setOpenDropdowns(new Set());
                      }}
                      className="w-full text-left px-4 py-2.5 hover:bg-cyan-950/40 flex items-center gap-2.5 text-xs text-slate-200 font-semibold cursor-pointer group"
                    >
                      <FileText className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
                      <div>
                        <div className="text-cyan-200">Export Legal Dossier</div>
                        <div className="text-[10px] text-slate-400 font-normal">Section 65B court-admissible PDF</div>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        setIsSourcesDrawerOpen(true);
                        setOpenDropdowns(new Set());
                      }}
                      className="w-full text-left px-4 py-2.5 hover:bg-cyan-950/40 flex items-center justify-between text-xs text-slate-200 font-semibold cursor-pointer group"
                    >
                      <div className="flex items-center gap-2.5">
                        <Database className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
                        <div>
                          <div className="text-purple-200">Intelligence Feeds &amp; FIRs</div>
                          <div className="text-[10px] text-slate-400 font-normal">Verified evidence repository</div>
                        </div>
                      </div>
                      <span className="px-1.5 py-0.5 rounded-full bg-purple-950/80 border border-purple-500/40 text-purple-300 text-[10px] font-bold">
                        {caseData.sources.length}
                      </span>
                    </button>

                    <button
                      onClick={() => {
                        setCurrentView("pathfinder");
                        setOpenDropdowns(new Set());
                      }}
                      className="w-full text-left px-4 py-2.5 hover:bg-cyan-950/40 flex items-center gap-2.5 text-xs text-slate-200 font-semibold cursor-pointer group"
                    >
                      <Compass className="w-4 h-4 text-sky-400 group-hover:scale-110 transition-transform" />
                      <div>
                        <div className="text-sky-200">Pathfinder &amp; Broker Trace</div>
                        <div className="text-[10px] text-slate-400 font-normal">Find shortest link &amp; cutout fronts</div>
                      </div>
                    </button>
                  </div>
                )}
              </div>

              {/* PROTOCOLS & TRAINING DROPDOWN */}
              <div className="relative">
                <button
                  id="nav-dropdown-training"
                  onClick={() => toggleDropdown("training")}
                  className={`w-full justify-between flex items-center gap-1 px-3.5 py-2.5 rounded-lg transition-all cursor-pointer font-mono ${
                    ["protocols", "blockchain"].includes(currentView)
                      ? "text-cyan-300 bg-cyan-950/60 border border-cyan-400/50 shadow-[0_0_15px_rgba(0,240,255,0.25)] font-extrabold"
                      : "hover:text-cyan-200 hover:bg-slate-900/70 border border-transparent"
                  }`}
                >
                  <span>PROTOCOLS &amp; TRAINING</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-cyan-400 transition-transform ${openDropdowns.has("training") ? "rotate-180" : ""}`} />
                </button>

                {openDropdowns.has("training") && (
                  <div className="mt-1.5 w-full bg-slate-950/95 border border-cyan-500/40 rounded-2xl shadow-[0_0_30px_rgba(0,240,255,0.2)] py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150 backdrop-blur-xl divide-y divide-slate-800/80">
                    <div className="flex items-center justify-between px-4 pb-2 mb-1 border-b border-slate-800/80">
                      <span className="text-[9px] font-mono uppercase tracking-[0.18em] text-cyan-400/70">Protocols &amp; Training</span>
                    </div>
                    <button
                      onClick={() => {
                        setCurrentView("protocols");
                        setOpenDropdowns(new Set());
                      }}
                      className="w-full text-left px-4 py-2.5 hover:bg-cyan-950/40 flex items-center gap-2.5 text-xs text-slate-200 font-semibold cursor-pointer group"
                    >
                      <BookOpen className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                      <div>
                        <div className="text-emerald-200">SOPs &amp; Cyber Training</div>
                        <div className="text-[10px] text-slate-400 font-normal">Standard police operating procedures</div>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        setCurrentView("blockchain");
                        setOpenDropdowns(new Set());
                      }}
                      className="w-full text-left px-4 py-2.5 hover:bg-cyan-950/40 flex items-center gap-2.5 text-xs text-slate-200 font-semibold cursor-pointer group"
                    >
                      <Lock className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                      <div>
                        <div className="text-amber-200">Immutable Audit Ledger</div>
                        <div className="text-[10px] text-slate-400 font-normal">Cryptographic SHA-256 chain of custody</div>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            </nav>

            {/* Right: Active Case Details & Cyber Quick Search */}
            <div className="flex items-center gap-3 md:pt-3 md:mt-1 md:border-t md:border-cyan-400/10">
              {/* Database Gateway / Real-Time Sync Indicator */}
              <button
                id="btn-database-gateway"
                onClick={() => setIsDbModalOpen(true)}
                className={`flex items-center gap-1.5 text-[10px] font-mono px-3.5 py-2 rounded-full border transition-all cursor-pointer ${
                  dbStatus?.mongodb?.connected || dbStatus?.neo4j?.connected
                    ? "bg-emerald-950/80 text-emerald-300 border-emerald-500/50 shadow-[0_0_12px_rgba(16,185,129,0.3)] hover:bg-emerald-900/80"
                    : "bg-cyan-950/60 text-cyan-300 border-cyan-500/40 shadow-[0_0_10px_rgba(0,240,255,0.15)] hover:bg-cyan-900/60"
                }`}
                title="Real-Time Database Gateway: Click to view MongoDB Atlas & Neo4j sync settings"
              >
                <Database className={`w-3.5 h-3.5 ${dbStatus?.mongodb?.connected || dbStatus?.neo4j?.connected ? "text-emerald-400 animate-pulse" : "text-cyan-400"}`} />
                <span className="font-bold">
                  {dbStatus?.mongodb?.connected && dbStatus?.neo4j?.connected
                    ? "LIVE: NEO4J + ATLAS"
                    : dbStatus?.neo4j?.connected
                    ? "LIVE: NEO4J"
                    : dbStatus?.mongodb?.connected
                    ? "LIVE: ATLAS"
                    : "DB GATEWAY"}
                </span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 3. MAIN WORKSPACE / CONTENT AREA */}
      {/* ========================================================================= */}
      <main className="flex-1 flex overflow-hidden relative">
        <div className="flex-1 h-full overflow-hidden flex flex-col">
          {/* HOME VIEW */}
          {currentView === "home" && (
            <HomeView
              onSearch={(parameters) => {
                setSearchParameters(parameters);
                setCurrentView("network");
              }}
              onSelectTab={(tab) => setCurrentView(tab)}
              onSelectEntity={(entityId) => {
                setSelectedNodeId(entityId);
                setCurrentView("network");
              }}
              allNodes={enrichedNodes}
              totalLinksCount={caseData.links.length}
              suspiciousPatternsCount={caseData.suspiciousPatterns.length}
            />
          )}

          {/* ABOUT US VIEW */}
          {currentView === "about" && (
            <AboutUsView onBackToHome={() => setCurrentView("home")} />
          )}

          {/* GALLERY VIEW */}
          {currentView === "gallery" && (
            <GalleryView onBackToHome={() => setCurrentView("home")} />
          )}

          {/* PROTOCOLS & TRAINING VIEW */}
          {currentView === "protocols" && (
            <ProtocolsTrainingView
              onSelectTab={(tab) => setCurrentView(tab)}
              onBackToHome={() => setCurrentView("home")}
            />
          )}

          {/* INTERACTIVE NETWORK GRAPH VIEW */}
          {currentView === "network" && (
            <div className="relative flex-1 min-h-0">
              <NetworkGraph
                nodes={focusedGraph.nodes}
                links={focusedGraph.links}
                selectedNodeId={selectedNodeId}
                onSelectNode={(node) => setSelectedNodeId(node ? node.id : null)}
                highlightedPathNodeIds={highlightedPathNodeIds}
                highlightedPathLinkIds={highlightedPathLinkIds}
              />
              <aside className="absolute right-4 top-4 z-30 w-[min(300px,calc(100%-2rem))]">
                <HomeView
                  compact
                  initialParameters={searchParameters}
                  onSearch={(parameters) => setSearchParameters(parameters)}
                  onSelectTab={(tab) => setCurrentView(tab)}
                  onSelectEntity={(entityId) => setSelectedNodeId(entityId)}
                  allNodes={enrichedNodes}
                  totalLinksCount={caseData.links.length}
                  suspiciousPatternsCount={caseData.suspiciousPatterns.length}
                />
              </aside>
              <div className="pointer-events-none absolute right-5 top-5 z-20 rounded-lg border border-cyan-400/30 bg-slate-950/85 px-3 py-2 font-mono text-[10px] uppercase tracking-wider text-cyan-200 shadow-lg backdrop-blur-md">
                <div>Source: {graphSource.replaceAll("_", " ")}</div>
                <div className="mt-1 text-slate-400">{focusedGraph.nodes.length} nodes / {focusedGraph.links.length} links</div>
                {graphError && <div className="mt-1 max-w-[260px] normal-case tracking-normal text-red-300">{graphError}</div>}
              </div>
            </div>
          )}

          {/* CRIME LOCATION MAP VIEW */}
{currentView === "map" && (
  <div className="flex-1 min-h-0 overflow-hidden">
    <CrimeLocationMap entities={enrichedNodes} heightClassName="h-full" />
  </div>
)}

          {/* INFLUENCER CENTRALITY MATRIX VIEW */}
          {currentView === "influencers" && (
            <InfluencerMatrix
              nodes={enrichedNodes}
              links={caseData.links}
              onSelectNodeById={(id) => {
                setSelectedNodeId(id);
                setCurrentView("network");
              }}
              onTracePathToKingpin={handleTracePathToKingpin}
            />
          )}

          {/* SUSPICIOUS PATTERNS VIEW */}
          {currentView === "patterns" && (
            <SuspiciousPatternsPanel
              patterns={caseData.suspiciousPatterns}
              allNodes={enrichedNodes}
              onSelectNodeById={(id) => {
                setSelectedNodeId(id);
                setCurrentView("network");
              }}
              onHighlightEntities={handleHighlightEntities}
            />
          )}

          {/* BLOCKCHAIN AUDIT LEDGER VIEW */}
          {currentView === "blockchain" && <BlockchainLedgerView />}

          {/* INVESTIGATIVE AI COPILOT VIEW */}
          {currentView === "copilot" && (
            <InvestigativeCopilot
              nodes={enrichedNodes}
              links={caseData.links}
              onHighlightEntities={handleHighlightEntities}
              onSelectNodeById={(id) => {
                setSelectedNodeId(id);
                setCurrentView("network");
              }}
            />
          )}

          {/* PATHFINDER & BROKER TRACE VIEW */}
          {currentView === "pathfinder" && (
            <ShortestPathFinder
              nodes={enrichedNodes}
              links={caseData.links}
              initialStartId={pathfinderInitialStartId}
              onHighlightPath={handleHighlightPath}
              onSelectNodeById={(id) => {
                setSelectedNodeId(id);
                setCurrentView("network");
              }}
            />
          )}
        </div>

        {/* Slide-over Entity Inspector Panel */}
        {selectedEntity && (
          <aside className="w-80 lg:w-96 h-full shrink-0 z-20 shadow-2xl transition-all animate-in slide-in-from-right duration-200">
            <EntityInspector
              entity={selectedEntity}
              allNodes={enrichedNodes}
              allLinks={caseData.links}
              onClose={() => setSelectedNodeId(null)}
              onSelectNodeById={(id) => setSelectedNodeId(id)}
              onTracePathToKingpin={handleTracePathToKingpin}
              onOpenPathFinder={handleOpenPathFinder}
            />
          </aside>
        )}

        {/* Slide-over Intelligence Sources Feed Drawer */}
        {isSourcesDrawerOpen && (
          <aside className="w-80 lg:w-96 h-full shrink-0 z-20 shadow-2xl border-l border-slate-200 transition-all animate-in slide-in-from-right duration-200">
            <div className="relative h-full bg-white">
              <button
                onClick={() => setIsSourcesDrawerOpen(false)}
                className="absolute top-3 right-3 z-30 p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
              <IntelligenceSourcesDrawer
                sources={caseData.sources}
                onOpenIngestionModal={() => {
                  setIsSourcesDrawerOpen(false);
                  setIsIngestionModalOpen(true);
                }}
                onSelectSnippetToExtract={() => {
                  setIsSourcesDrawerOpen(false);
                  setIsIngestionModalOpen(true);
                }}
              />
            </div>
          </aside>
        )}
      </main>

      {/* Multi-Source Ingestion Modal */}
      <DataIngestionModal
        isOpen={isIngestionModalOpen}
        onClose={() => setIsIngestionModalOpen(false)}
        onDataIngested={handleDataIngested}
      />

      {/* Official Legal Dossier Export Modal */}
      <ExportDossierModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        caseData={caseData}
        enrichedNodes={enrichedNodes}
      />

      {/* Real-Time Database Gateway Modal */}
      <DatabaseConnectModal
        isOpen={isDbModalOpen}
        onClose={() => setIsDbModalOpen(false)}
        status={dbStatus}
        onRefreshStatus={fetchDatabaseStatus}
      />
    </div>
  );
}
