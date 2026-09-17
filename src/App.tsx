

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
import { CyberHologramCanvas, CyberThemeMode } from "./components/CyberHologramCanvas";
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
  const [searchQuery, setSearchQuery] = useState("");
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
    try {
      const res = await fetch("/api/graph/data");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.nodes) && Array.isArray(data.links) && data.nodes.length > 0) {
          setCaseData((prev) => ({
            ...prev,
            nodes: data.nodes,
            entities: data.nodes,
            links: data.links,
          }));
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
    }, 15000);

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // Nav Dropdowns open state
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [cyberTheme, setCyberTheme] = useState<CyberThemeMode>("arc-cyan");

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
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

  // Handle Search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const q = searchQuery.toLowerCase();
    const matches = enrichedNodes.filter(
      (n) =>
        n.name.toLowerCase().includes(q) ||
        n.role.toLowerCase().includes(q) ||
        n.attributes.alias?.toLowerCase().includes(q) ||
        n.attributes.contact?.includes(q)
    );
    setSearchResults(matches.slice(0, 6));
  }, [searchQuery, enrichedNodes]);

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
    <div id="app-root" className="w-full h-screen flex flex-col bg-[#030712] text-slate-100 overflow-hidden font-sans relative select-none">
      {/* ========================================================================= */}
      {/* ANIMATED HACKER BACKGROUND (IRON MAN STARK HUD / CEREBRO NEURAL MATRIX)   */}
      {/* ========================================================================= */}
      <CyberHologramCanvas theme={cyberTheme} onThemeChange={setCyberTheme} />

      {/* ========================================================================= */}
      {/* 1. TOP HEADER - STARK TACTICAL FLIGHT DECK / CEREBRO COMMAND CONSOLE      */}
      {/* ========================================================================= */}
      <header className="w-full bg-slate-950/80 backdrop-blur-xl border-b border-cyan-500/25 shrink-0 z-[1000] shadow-[0_4px_30px_rgba(0,240,255,0.08)] relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between relative">
          {/* Left: Team NETRA 404 Logo with Arc-Reactor Glow */}
          <div
            onClick={() => setCurrentView("home")}
            className="flex items-center gap-3 cursor-pointer group select-none transition-transform hover:scale-[1.02]"
            title="Return to Cyber Command Portal"
          >
            <NetraLogo
              className="h-11 sm:h-12"
              iconClassName="text-cyan-400 drop-shadow-[0_0_14px_rgba(0,240,255,0.7)]"
              textClassName="text-white drop-shadow-[0_0_10px_rgba(0,240,255,0.35)]"
              subtitleClassName="text-cyan-400/90 font-mono tracking-[0.25em]"
            />
          </div>

          {/* Center: Project Name & Sanskrit Motto with Holographic Illumination */}
          <div className="absolute left-1/2 -translate-x-1/2 text-center px-2 flex flex-col items-center justify-center">
            <div className="flex items-center gap-2">
              <span className="text-cyan-400 font-mono text-[10px] hidden md:inline opacity-70">[</span>
              <h1 className="text-xl sm:text-2xl md:text-[27px] font-black tracking-[0.22em] text-transparent bg-clip-text bg-gradient-to-b from-white via-cyan-100 to-cyan-400 uppercase font-serif-official drop-shadow-[0_0_15px_rgba(0,240,255,0.4)]">
                THE KAUTILYA PROTOCOL
              </h1>
              <span className="text-cyan-400 font-mono text-[10px] hidden md:inline opacity-70">]</span>
            </div>
            <p className="text-xs sm:text-sm font-semibold text-cyan-200/90 tracking-wider mt-0.5 font-hindi drop-shadow-[0_0_8px_rgba(0,240,255,0.3)]">
              संबंधेषु रहस्यं, विश्लेषणे सत्यं।
            </p>
            <div className="hidden sm:flex items-center gap-2 text-[9px] font-mono text-cyan-400/80 uppercase tracking-widest mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
              <span>In relationships lies the mystery, in analysis lies the truth</span>
            </div>
          </div>
        </div>

        {/* Indian Flag Tricolor Photon Energy Strip */}
        <div className="w-full h-1 bg-gradient-to-r from-[#FF9933] via-[#FFFFFF] to-[#138808] shadow-[0_0_12px_rgba(255,153,51,0.7),0_0_12px_rgba(19,136,8,0.7)] relative z-10" />

        {/* ========================================================================= */}
        {/* 2. SUB-NAVIGATION BAR (HACKER HUD STYLING WITH ACTIVE STATES & DROPDOWNS) */}
        {/* ========================================================================= */}
        <div ref={dropdownRef} className="relative z-[1001] bg-slate-950/75 border-b border-cyan-500/20 backdrop-blur-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-12 flex items-center justify-between">
            {/* Nav Links */}
            <nav className="flex items-center gap-1 sm:gap-2 h-full text-xs font-bold text-slate-300">
              {/* HOME */}
              <button
                id="nav-link-home"
                onClick={() => {
                  setCurrentView("home");
                  setActiveDropdown(null);
                }}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer font-mono ${
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
                  setActiveDropdown(null);
                }}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer font-mono ${
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
                  setActiveDropdown(null);
                }}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer font-mono ${
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
    setActiveDropdown(null);
  }}
  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer font-mono ${
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
                  onClick={() => setActiveDropdown(activeDropdown === "intelligence" ? null : "intelligence")}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all cursor-pointer font-mono ${
                    ["network", "influencers", "patterns", "copilot"].includes(currentView)
                      ? "text-cyan-300 bg-cyan-950/60 border border-cyan-400/50 shadow-[0_0_15px_rgba(0,240,255,0.25)] font-extrabold"
                      : "hover:text-cyan-200 hover:bg-slate-900/70 border border-transparent"
                  }`}
                >
                  <span>INTELLIGENCE</span>
                  <ChevronDown className="w-3.5 h-3.5 text-cyan-400" />
                </button>

                {activeDropdown === "intelligence" && (
                  <div className="absolute top-full left-0 mt-1.5 w-64 bg-slate-950/95 border border-cyan-500/40 rounded-2xl shadow-[0_0_30px_rgba(0,240,255,0.2)] py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150 backdrop-blur-xl divide-y divide-slate-800/80">
                    <button
                      onClick={() => {
                        setCurrentView("network");
                        setActiveDropdown(null);
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
                        setActiveDropdown(null);
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
                        setActiveDropdown(null);
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
                        setActiveDropdown(null);
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
                  onClick={() => setActiveDropdown(activeDropdown === "case" ? null : "case")}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all cursor-pointer font-mono ${
                    currentView === "pathfinder"
                      ? "text-cyan-300 bg-cyan-950/60 border border-cyan-400/50 shadow-[0_0_15px_rgba(0,240,255,0.25)] font-extrabold"
                      : "hover:text-cyan-200 hover:bg-slate-900/70 border border-transparent"
                  }`}
                >
                  <span>CASE MANAGEMENT</span>
                  <ChevronDown className="w-3.5 h-3.5 text-cyan-400" />
                </button>

                {activeDropdown === "case" && (
                  <div className="absolute top-full left-0 mt-1.5 w-64 bg-slate-950/95 border border-cyan-500/40 rounded-2xl shadow-[0_0_30px_rgba(0,240,255,0.2)] py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150 backdrop-blur-xl divide-y divide-slate-800/80">
                    <button
                      onClick={() => {
                        setIsIngestionModalOpen(true);
                        setActiveDropdown(null);
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
                        setActiveDropdown(null);
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
                        setActiveDropdown(null);
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
                        setActiveDropdown(null);
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
                  onClick={() => setActiveDropdown(activeDropdown === "training" ? null : "training")}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all cursor-pointer font-mono ${
                    ["protocols", "blockchain"].includes(currentView)
                      ? "text-cyan-300 bg-cyan-950/60 border border-cyan-400/50 shadow-[0_0_15px_rgba(0,240,255,0.25)] font-extrabold"
                      : "hover:text-cyan-200 hover:bg-slate-900/70 border border-transparent"
                  }`}
                >
                  <span>PROTOCOLS &amp; TRAINING</span>
                  <ChevronDown className="w-3.5 h-3.5 text-cyan-400" />
                </button>

                {activeDropdown === "training" && (
                  <div className="absolute top-full left-0 mt-1.5 w-64 bg-slate-950/95 border border-cyan-500/40 rounded-2xl shadow-[0_0_30px_rgba(0,240,255,0.2)] py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150 backdrop-blur-xl divide-y divide-slate-800/80">
                    <button
                      onClick={() => {
                        setCurrentView("protocols");
                        setActiveDropdown(null);
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
                        setActiveDropdown(null);
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
            <div className="flex items-center gap-3">
              {/* Cyber Quick Search */}
              <div className="relative hidden lg:block w-48 xl:w-60">
                <div className="flex items-center bg-slate-900/80 border border-cyan-500/30 rounded-xl px-2.5 py-1 focus-within:border-cyan-400 focus-within:shadow-[0_0_12px_rgba(0,240,255,0.25)] transition-all">
                  <Search className="w-3.5 h-3.5 text-cyan-400 mr-1.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Trace target..."
                    className="w-full bg-transparent text-xs text-cyan-100 placeholder-cyan-700/60 focus:outline-none font-mono"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery("")} className="text-cyan-400 hover:text-white cursor-pointer">
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-slate-950/95 border border-cyan-500/40 rounded-xl shadow-[0_0_25px_rgba(0,240,255,0.2)] z-50 overflow-hidden divide-y divide-slate-800">
                    {searchResults.map((ent) => (
                      <div
                        key={ent.id}
                        onClick={() => {
                          setSelectedNodeId(ent.id);
                          setSearchQuery("");
                          setCurrentView("network");
                        }}
                        className="p-2 hover:bg-cyan-950/50 cursor-pointer flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-bold text-cyan-200 font-mono">{ent.name}</span>
                          <span className="text-[10px] text-cyan-400/80 font-mono block">{ent.role}</span>
                        </div>
                        <span className="text-[9px] uppercase font-bold text-slate-400 font-mono">{ent.type}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Database Gateway / Real-Time Sync Indicator */}
              <button
                id="btn-database-gateway"
                onClick={() => setIsDbModalOpen(true)}
                className={`flex items-center gap-1.5 text-[11px] font-mono px-3 py-1 rounded-full border transition-all cursor-pointer ${
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

              {/* Case Badge - High-Tech Holographic Badge */}
              <div className="hidden sm:flex items-center gap-2 text-[11px] font-mono bg-emerald-950/60 text-emerald-300 px-3 py-1 rounded-full border border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-bold text-emerald-200">FIR 104/2024</span>
                <span className="opacity-40">•</span>
                <span className="text-emerald-400 font-semibold">SEC 65B CERTIFIED</span>
              </div>
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
              onSearch={(query) => {
                setSearchQuery(query);
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
                nodes={enrichedNodes}
                links={caseData.links}
                selectedNodeId={selectedNodeId}
                onSelectNode={(node) => setSelectedNodeId(node ? node.id : null)}
                highlightedPathNodeIds={highlightedPathNodeIds}
                highlightedPathLinkIds={highlightedPathLinkIds}
              />
              <div className="pointer-events-none absolute right-5 top-5 z-20 rounded-lg border border-cyan-400/30 bg-slate-950/85 px-3 py-2 font-mono text-[10px] uppercase tracking-wider text-cyan-200 shadow-lg backdrop-blur-md">
                <div>Source: {graphSource.replaceAll("_", " ")}</div>
                <div className="mt-1 text-slate-400">{graphCounts.nodes || enrichedNodes.length} nodes / {graphCounts.links || caseData.links.length} links</div>
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
