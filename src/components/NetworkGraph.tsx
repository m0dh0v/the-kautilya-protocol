import React, { useEffect, useRef, useState, useMemo } from "react";
import * as d3 from "d3";
import { Entity, Relationship, EntityType, RiskLevel } from "../types/intelligence";
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Filter,
  Layers,
  User,
  Building2,
  MapPin,
  Phone,
  Car,
  CreditCard,
  ShieldAlert,
  Sliders,
  Play,
  Pause,
} from "lucide-react";

interface NetworkGraphProps {
  nodes: Entity[];
  links: Relationship[];
  selectedNodeId: string | null;
  onSelectNode: (node: Entity | null) => void;
  highlightedPathNodeIds?: string[];
  highlightedPathLinkIds?: string[];
  focusedCommunity?: string | null;
}

const entityTypeColors: Record<EntityType, { fill: string; border: string; label: string }> = {
  person: { fill: "#4f46e5", border: "#818cf8", label: "Person" }, // Indigo
  organization: { fill: "#059669", border: "#34d399", label: "Organization" }, // Emerald
  location: { fill: "#d97706", border: "#fbbf24", label: "Location" }, // Amber
  phone: { fill: "#0284c7", border: "#38bdf8", label: "Phone / IMEI" }, // Sky
  vehicle: { fill: "#e11d48", border: "#fb7185", label: "Vehicle" }, // Rose
  financial_account: { fill: "#16a34a", border: "#4ade80", label: "Bank / Crypto" }, // Green
};

const riskBorderColors: Record<RiskLevel, string> = {
  critical: "#ef4444", // Red glow
  high: "#f97316", // Orange glow
  medium: "#eab308", // Yellow
  low: "#3b82f6", // Blue
};

export const NetworkGraph: React.FC<NetworkGraphProps> = ({
  nodes,
  links,
  selectedNodeId,
  onSelectNode,
  highlightedPathNodeIds = [],
  highlightedPathLinkIds = [],
  focusedCommunity,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Filters state
  const [activeTypes, setActiveTypes] = useState<Set<EntityType>>(
    new Set(["person", "organization", "location", "phone", "vehicle", "financial_account"])
  );
  const [minRisk, setMinRisk] = useState<"all" | "high_critical">("all");
  const [isSimulationRunning, setIsSimulationRunning] = useState(true);
  const [chargeStrength, setChargeStrength] = useState(-320);
  const [linkDistance, setLinkDistance] = useState(110);
  const [showLabels, setShowLabels] = useState(true);
  const [showEdgeLabels, setShowEdgeLabels] = useState(true);

  // D3 simulation reference
  const simulationRef = useRef<d3.Simulation<d3.SimulationNodeDatum, undefined> | null>(null);
  const zoomBehaviorRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  // Filtered dataset
  const filteredNodes = useMemo(() => {
    return nodes.filter((node) => {
      if (!activeTypes.has(node.type)) return false;
      if (minRisk === "high_critical" && node.riskLevel !== "critical" && node.riskLevel !== "high") {
        return false;
      }
      if (focusedCommunity && node.community !== focusedCommunity) {
        return false;
      }
      return true;
    });
  }, [nodes, activeTypes, minRisk, focusedCommunity]);

  const filteredNodeIds = useMemo(() => new Set(filteredNodes.map((n) => n.id)), [filteredNodes]);

  const filteredLinks = useMemo(() => {
    return links.filter((link) => {
      const sId = typeof link.source === "object" ? (link.source as any).id : link.source;
      const tId = typeof link.target === "object" ? (link.target as any).id : link.target;
      return filteredNodeIds.has(sId) && filteredNodeIds.has(tId);
    });
  }, [links, filteredNodeIds]);

  const isLargeGraph = filteredNodes.length > 500;

  // Main D3 force simulation setup
  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth || 800;
    const height = containerRef.current.clientHeight || 600;

    const svg = d3.select(svgRef.current);
    const previousTransform = d3.zoomTransform(svgRef.current);
    svg.selectAll("*").remove(); // clean slate

    // Definitions (Arrowheads and glows)
    const defs = svg.append("defs");

    // Glow filter for critical threats
    const filter = defs.append("filter").attr("id", "glow").attr("x", "-50%").attr("y", "-50%").attr("width", "200%").attr("height", "200%");
    filter.append("feGaussianBlur").attr("stdDeviation", "3").attr("result", "coloredBlur");
    const feMerge = filter.append("feMerge");
    feMerge.append("feMergeNode").attr("in", "coloredBlur");
    feMerge.append("feMergeNode").attr("in", "SourceGraphic");

    // Path highlight glow
    const pathFilter = defs.append("filter").attr("id", "path-glow");
    pathFilter.append("feGaussianBlur").attr("stdDeviation", "4").attr("result", "blur");
    const pMerge = pathFilter.append("feMerge");
    pMerge.append("feMergeNode").attr("in", "blur");
    pMerge.append("feMergeNode").attr("in", "SourceGraphic");

    // Arrow markers
    defs
      .append("marker")
      .attr("id", "arrowhead")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 26)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-4L8,0L0,4")
      .attr("fill", "#64748b");

    defs
      .append("marker")
      .attr("id", "arrowhead-highlight")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 26)
      .attr("refY", 0)
      .attr("markerWidth", 7)
      .attr("markerHeight", 7)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-4L8,0L0,4")
      .attr("fill", "#d97706");

    const g = svg.append("g").attr("class", "main-graph-container");

    // Setup zoom & pan
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.15, 3])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom);
    svg.call(zoom.transform, previousTransform);
    zoomBehaviorRef.current = zoom;

    // Clone data for simulation
    const simNodes: any[] = filteredNodes.map((n) => ({ ...n }));
    const simLinks: any[] = filteredLinks.map((l) => ({
      ...l,
      source: typeof l.source === "object" ? (l.source as any).id : l.source,
      target: typeof l.target === "object" ? (l.target as any).id : l.target,
    }));

    const simulation = d3
      .forceSimulation(simNodes)
      .force(
        "link",
        d3
          .forceLink(simLinks)
          .id((d: any) => d.id)
          .distance(linkDistance)
      )
      .force("charge", d3.forceManyBody().strength(isLargeGraph ? Math.max(-180, chargeStrength * 0.6) : chargeStrength))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius((d: any) => (isLargeGraph ? 14 : (d as Entity).betweenness ? 32 : 24)))
      .alphaDecay(isLargeGraph ? 0.09 : 0.028)
      .velocityDecay(isLargeGraph ? 0.45 : 0.4);

    simulationRef.current = simulation;

    // Render Links
    const linkGroup = g.append("g").attr("class", "links");
    const linkElements = linkGroup
      .selectAll("line")
      .data(simLinks)
      .enter()
      .append("line")
      .attr("stroke", (d: any) => {
        if (highlightedPathLinkIds.includes(d.id)) return "#f59e0b"; // amber for path
        if (d.relationshipType === "transferred_funds") return "#10b981"; // neon emerald
        if (d.relationshipType === "subordinate_to" || d.relationshipType === "co_accused") return "#f43f5e"; // rose/crimson
        return "#0284c7"; // neon sky blue
      })
      .attr("stroke-width", (d: any) => {
        if (highlightedPathLinkIds.includes(d.id)) return 4;
        return Math.max(1.5, Math.min(4, d.weight ? d.weight / 2.5 : 2));
      })
      .attr("stroke-dasharray", (d: any) => (d.relationshipType === "communicated_with" ? "4 3" : undefined))
      .attr("marker-end", (d: any) => (highlightedPathLinkIds.includes(d.id) ? "url(#arrowhead-highlight)" : "url(#arrowhead)"))
      .attr("opacity", (d: any) => {
        if (highlightedPathLinkIds.length > 0) {
          return highlightedPathLinkIds.includes(d.id) ? 1 : 0.2;
        }
        return 0.7;
      });

    // Render Edge Labels
    const linkTextGroup = g.append("g").attr("class", "link-labels");
    const linkTextElements = linkTextGroup
      .selectAll("text")
      .data(simLinks)
      .enter()
      .append("text")
      .attr("class", "text-[10px] font-mono fill-cyan-300/90 font-semibold select-none pointer-events-none drop-shadow-[0_0_4px_rgba(0,0,0,0.8)]")
      .attr("text-anchor", "middle")
      .attr("dy", -3)
      .style("opacity", !isLargeGraph && showEdgeLabels ? 0.9 : 0)
      .text((d: any) => {
        if (d.amount) return d.amount;
        if (d.frequency) return `${d.frequency}x calls`;
        return d.relationshipType.replace(/_/g, " ");
      });

    // Render Nodes
    const nodeGroup = g.append("g").attr("class", "nodes");
    const nodeElements = nodeGroup
      .selectAll("g")
      .data(simNodes)
      .enter()
      .append("g")
      .attr("class", "cursor-pointer select-none")
      .call(
        d3
          .drag<SVGGElement, any>()
          .on("start", (event, d) => {
            if (!event.active && simulationRef.current) simulationRef.current.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on("drag", (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on("end", (event, d) => {
            if (!event.active && simulationRef.current) simulationRef.current.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          })
      )
      .on("click", (event, d: any) => {
        event.stopPropagation();
        const originalNode = nodes.find((n) => n.id === d.id);
        onSelectNode(originalNode || null);
      });

    // Background deselect click
    svg.on("click", () => {
      onSelectNode(null);
    });

    // Outer Halo for High Betweenness / Risk
    nodeElements
      .append("circle")
      .attr("r", (d: any) => {
        const base = d.type === "person" ? 22 : 18;
        return d.betweenness && d.betweenness > 0.4 ? base + 8 : base + 4;
      })
      .attr("fill", "none")
      .attr("stroke", (d: any) => riskBorderColors[d.riskLevel as RiskLevel] || "#94a3b8")
      .attr("stroke-width", (d: any) => (d.id === selectedNodeId ? 3.5 : 2))
      .attr("stroke-dasharray", (d: any) => (d.riskLevel === "critical" ? undefined : "3 2"))
      .attr("opacity", (d: any) => {
        if (highlightedPathNodeIds.length > 0) {
          return highlightedPathNodeIds.includes(d.id) ? 1 : 0.25;
        }
        return d.id === selectedNodeId ? 1 : 0.8;
      });

    // Core Node Circle
    nodeElements
      .append("circle")
      .attr("r", (d: any) => (d.type === "person" ? 20 : 16))
      .attr("fill", (d: any) => entityTypeColors[d.type as EntityType]?.fill || "#334155")
      .attr("stroke", (d: any) => (d.id === selectedNodeId ? "#0f172a" : "#ffffff"))
      .attr("stroke-width", (d: any) => (d.id === selectedNodeId ? 3 : 2))
      .attr("opacity", (d: any) => {
        if (highlightedPathNodeIds.length > 0) {
          return highlightedPathNodeIds.includes(d.id) ? 1 : 0.3;
        }
        return 1;
      });

    // Entity Icon inside node circle
    nodeElements
      .append("text")
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "central")
      .attr("fill", "#ffffff")
      .attr("font-size", (d: any) => (d.type === "person" ? "14px" : "11px"))
      .attr("font-family", "system-ui")
      .text((d: any) => {
        switch (d.type) {
          case "person":
            return "👤";
          case "organization":
            return "🏢";
          case "location":
            return "📍";
          case "phone":
            return "📱";
          case "vehicle":
            return "🚗";
          case "financial_account":
            return "💳";
          default:
            return "●";
        }
      });

    // Node Labels
    if (showLabels) {
      const labelNodes = isLargeGraph
        ? nodeElements.filter((d: any) => d.riskLevel === "critical" || d.riskLevel === "high" || d.type === "location" || d.id === selectedNodeId)
        : nodeElements;

      labelNodes
        .append("text")
        .attr("class", "text-[11px] font-bold fill-slate-100 pointer-events-none drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]")
        .attr("text-anchor", "middle")
        .attr("dy", (d: any) => (d.type === "person" ? 34 : 30))
        .text((d: any) => {
          const maxL = 16;
          return d.name.length > maxL ? d.name.substring(0, maxL) + "…" : d.name;
        })
        .attr("opacity", (d: any) => {
          if (highlightedPathNodeIds.length > 0) {
            return highlightedPathNodeIds.includes(d.id) ? 1 : 0.3;
          }
          return 1;
        });

      // Role subtitle label
      labelNodes
        .append("text")
        .attr("class", "text-[9px] font-mono fill-cyan-400 font-semibold pointer-events-none drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]")
        .attr("text-anchor", "middle")
        .attr("dy", (d: any) => (d.type === "person" ? 45 : 41))
        .text((d: any) => {
          const r = d.role || "";
          return r.length > 20 ? r.substring(0, 18) + "…" : r;
        })
        .attr("opacity", (d: any) => {
          if (highlightedPathNodeIds.length > 0) {
            return highlightedPathNodeIds.includes(d.id) ? 0.9 : 0.2;
          }
          return 0.85;
        });
    }

    // Tick update function
    let frameRequested = false;
    let animationFrame = 0;
    const renderFrame = () => {
      frameRequested = false;
      linkElements
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      if (!isLargeGraph) {
        linkTextElements
          .attr("x", (d: any) => (d.source.x + d.target.x) / 2)
          .attr("y", (d: any) => (d.source.y + d.target.y) / 2);
      }

      nodeElements.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    };

    simulation.on("tick", () => {
      if (!frameRequested) {
        frameRequested = true;
        animationFrame = requestAnimationFrame(renderFrame);
      }
    });

    return () => {
      simulation.stop();
      cancelAnimationFrame(animationFrame);
    };
  }, [
    filteredNodes,
    filteredLinks,
    selectedNodeId,
    highlightedPathNodeIds,
    highlightedPathLinkIds,
    chargeStrength,
    linkDistance,
    showLabels,
    showEdgeLabels,
    isLargeGraph,
  ]);

  // Zoom control helpers
  const handleZoom = (factor: number) => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.transition().duration(250).call(zoomBehaviorRef.current.scaleBy, factor);
  };

  const handleResetZoom = () => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.transition().duration(400).call(zoomBehaviorRef.current.transform, d3.zoomIdentity);
  };

  const toggleType = (type: EntityType) => {
    setActiveTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        if (next.size > 1) next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-slate-950/75 backdrop-blur-md text-slate-100 overflow-hidden select-none" ref={containerRef}>
      {/* Subtle Dot Grid pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-25"
        style={{
          backgroundImage: "radial-gradient(#00f0ff 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* Top Floating Control Bar */}
      <div className="absolute top-4 left-4 z-20 flex flex-wrap items-center gap-2 bg-slate-950/90 backdrop-blur-xl border border-cyan-500/30 rounded-xl p-1.5 shadow-[0_0_20px_rgba(0,240,255,0.15)]">
        {/* Entity Type Filter Chips */}
        <div className="flex items-center gap-1 border-r border-slate-800 pr-2 mr-1">
          {(
            [
              { type: "person", label: "Person", icon: User },
              { type: "organization", label: "Org", icon: Building2 },
              { type: "location", label: "Location", icon: MapPin },
              { type: "phone", label: "Phone", icon: Phone },
              { type: "vehicle", label: "Vehicle", icon: Car },
              { type: "financial_account", label: "Account", icon: CreditCard },
            ] as const
          ).map(({ type, label, icon: Icon }) => {
            const isActive = activeTypes.has(type);
            return (
              <button
                key={type}
                id={`filter-type-${type}`}
                onClick={() => toggleType(type)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer font-mono ${
                  isActive
                    ? "bg-cyan-950 text-cyan-300 border border-cyan-400/50 shadow-[0_0_10px_rgba(0,240,255,0.25)]"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                }`}
                title={`Toggle ${label} nodes`}
              >
                <Icon className="w-3 h-3" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            );
          })}
        </div>

        {/* Risk Threshold Filter */}
        <button
          id="toggle-risk-filter"
          onClick={() => setMinRisk((prev) => (prev === "all" ? "high_critical" : "all"))}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer font-mono ${
            minRisk === "high_critical"
              ? "bg-red-950 text-red-300 border border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.3)]"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
          <span>{minRisk === "high_critical" ? "Critical & High Only" : "All Risks"}</span>
        </button>

        {/* Labels Toggle */}
        <button
          id="toggle-labels"
          onClick={() => setShowLabels(!showLabels)}
          className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer font-mono ${
            showLabels
              ? "bg-cyan-950 border-cyan-500/50 text-cyan-300 font-bold shadow-[0_0_10px_rgba(0,240,255,0.2)]"
              : "bg-transparent border-transparent text-slate-500 hover:text-slate-300"
          }`}
        >
          Labels
        </button>
      </div>

      {/* Floating Canvas Controls (Bottom Right) */}
      <div className="absolute bottom-4 right-4 z-20 flex flex-col gap-1.5 bg-slate-950/90 backdrop-blur-xl border border-cyan-500/30 rounded-xl p-1.5 shadow-[0_0_20px_rgba(0,240,255,0.15)]">
        <button
          id="btn-zoom-in"
          onClick={() => handleZoom(1.25)}
          className="p-1.5 rounded-lg hover:bg-cyan-950/50 text-cyan-300 hover:text-cyan-100 transition-colors cursor-pointer"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          id="btn-zoom-out"
          onClick={() => handleZoom(0.8)}
          className="p-1.5 rounded-lg hover:bg-cyan-950/50 text-cyan-300 hover:text-cyan-100 transition-colors cursor-pointer"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          id="btn-reset-zoom"
          onClick={handleResetZoom}
          className="p-1.5 rounded-lg hover:bg-cyan-950/50 text-cyan-300 hover:text-cyan-100 transition-colors cursor-pointer"
          title="Reset View"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Floating Legend / Stats (Bottom Left) */}
      <div className="absolute bottom-4 left-4 z-20 bg-slate-950/90 backdrop-blur-xl border border-cyan-500/30 rounded-xl px-3.5 py-2 text-xs flex items-center gap-4 text-slate-300 shadow-[0_0_20px_rgba(0,240,255,0.15)] font-mono">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]"></span>
          <span className="font-semibold text-red-300">Critical Threat</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)]"></span>
          <span className="font-semibold text-orange-300">High Risk</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]"></span>
          <span className="font-semibold text-amber-300">Medium</span>
        </div>
        <div className="text-slate-600">|</div>
        <div className="text-[11px] text-slate-300 font-medium">
          Showing <span className="text-cyan-300 font-bold">{filteredNodes.length}</span> entities •{" "}
          <span className="text-cyan-300 font-bold">{filteredLinks.length}</span> links
        </div>
      </div>

      {/* The Main Interactive SVG */}
      <svg id="network-analysis-svg" ref={svgRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
    </div>
  );
};
