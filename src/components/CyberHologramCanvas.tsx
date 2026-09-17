import React, { useEffect, useRef, useState, useCallback } from "react";
import { Sliders, Eye, Zap, Shield, Crosshair, RefreshCw } from "lucide-react";

export type CyberThemeMode = "arc-cyan" | "cerebro-red" | "jarvis-gold" | "matrix-green";

interface CyberHologramCanvasProps {
  theme?: CyberThemeMode;
  onThemeChange?: (theme: CyberThemeMode) => void;
  className?: string;
  showControls?: boolean;
}

interface ParticleNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  baseRadius: number;
  alpha: number;
  layer: number; // 1, 2, 3 for depth
  pulseOffset: number;
}

interface DataPacket {
  fromNode: number;
  toNode: number;
  progress: number;
  speed: number;
}

export const CyberHologramCanvas: React.FC<CyberHologramCanvasProps> = ({
  theme = "arc-cyan",
  onThemeChange,
  className = "",
  showControls = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [currentTheme, setCurrentTheme] = useState<CyberThemeMode>(theme);
  const [radarActive, setRadarActive] = useState(true);
  const [particlesActive, setParticlesActive] = useState(true);
  const [mouseTracking, setMouseTracking] = useState(true);
  const [isHudMenuOpen, setIsHudMenuOpen] = useState(false);

  // Sync prop changes
  useEffect(() => {
    setCurrentTheme(theme);
  }, [theme]);

  const handleSelectTheme = (t: CyberThemeMode) => {
    setCurrentTheme(t);
    if (onThemeChange) {
      onThemeChange(t);
    }
  };

  // Color profiles for HUD modes
  const themeColors = {
    "arc-cyan": {
      name: "Iron Man Arc Cyan",
      primary: "#00f0ff",
      secondary: "#0284c7",
      accent: "#38bdf8",
      glow: "rgba(0, 240, 255, 0.45)",
      particleFill: "#00f0ff",
      linkStroke: "rgba(0, 240, 255, 0.16)",
      ringStroke: "rgba(0, 240, 255, 0.22)",
      radarGradient: "rgba(0, 240, 255, 0.12)",
      bgGradientTop: "#020714",
      bgGradientBottom: "#040c1a",
      reticle: "#38bdf8",
    },
    "cerebro-red": {
      name: "Cerebro Neural Red",
      primary: "#ff2a55",
      secondary: "#f59e0b",
      accent: "#f43f5e",
      glow: "rgba(255, 42, 85, 0.45)",
      particleFill: "#ff2a55",
      linkStroke: "rgba(255, 42, 85, 0.18)",
      ringStroke: "rgba(255, 42, 85, 0.25)",
      radarGradient: "rgba(255, 42, 85, 0.14)",
      bgGradientTop: "#120307",
      bgGradientBottom: "#18060c",
      reticle: "#fb7185",
    },
    "jarvis-gold": {
      name: "J.A.R.V.I.S. Gold HUD",
      primary: "#fbbf24",
      secondary: "#d97706",
      accent: "#fef08a",
      glow: "rgba(251, 191, 36, 0.45)",
      particleFill: "#fbbf24",
      linkStroke: "rgba(251, 191, 36, 0.18)",
      ringStroke: "rgba(251, 191, 36, 0.22)",
      radarGradient: "rgba(251, 191, 36, 0.12)",
      bgGradientTop: "#0e0903",
      bgGradientBottom: "#160f04",
      reticle: "#fde047",
    },
    "matrix-green": {
      name: "Cyber Terminal Green",
      primary: "#10b981",
      secondary: "#059669",
      accent: "#34d399",
      glow: "rgba(16, 185, 129, 0.45)",
      particleFill: "#10b981",
      linkStroke: "rgba(16, 185, 129, 0.16)",
      ringStroke: "rgba(16, 185, 129, 0.22)",
      radarGradient: "rgba(16, 185, 129, 0.12)",
      bgGradientTop: "#020f0a",
      bgGradientBottom: "#04140c",
      reticle: "#6ee7b7",
    },
  }[currentTheme];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Mouse coordinates
    const mouse = {
      x: width / 2,
      y: height / 2,
      targetX: width / 2,
      targetY: height / 2,
      isHovering: false,
    };

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);

    const handleMouseMove = (e: MouseEvent) => {
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;
      mouse.isHovering = true;
    };

    const handleMouseLeave = () => {
      mouse.isHovering = false;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);

    // Initialize Synaptic Neural Nodes (Iron Man / Cerebro nodes)
    const nodeCount = Math.min(Math.floor((width * height) / 22000), 55);
    const nodes: ParticleNode[] = [];

    for (let i = 0; i < nodeCount; i++) {
      const layer = Math.random() < 0.3 ? 1 : Math.random() < 0.7 ? 2 : 3;
      const baseRadius = layer === 1 ? 1.5 : layer === 2 ? 2.2 : 3.2;
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * (0.35 / layer),
        vy: (Math.random() - 0.5) * (0.35 / layer),
        radius: baseRadius,
        baseRadius,
        alpha: layer === 1 ? 0.35 : layer === 2 ? 0.65 : 0.9,
        layer,
        pulseOffset: Math.random() * Math.PI * 2,
      });
    }

    // Traveling data packets
    const packets: DataPacket[] = [];
    const maxPackets = 14;

    const spawnPacket = () => {
      if (nodes.length < 2 || packets.length >= maxPackets) return;
      const fromIdx = Math.floor(Math.random() * nodes.length);
      // Find nearest neighbor
      let bestIdx = -1;
      let minDist = 180;
      for (let j = 0; j < nodes.length; j++) {
        if (j === fromIdx) continue;
        const dx = nodes[fromIdx].x - nodes[j].x;
        const dy = nodes[fromIdx].y - nodes[j].y;
        const dist = Math.hypot(dx, dy);
        if (dist < minDist && dist > 20) {
          minDist = dist;
          bestIdx = j;
        }
      }

      if (bestIdx !== -1) {
        packets.push({
          fromNode: fromIdx,
          toNode: bestIdx,
          progress: 0,
          speed: 0.008 + Math.random() * 0.014,
        });
      }
    };

    // Radar scan angles
    let radarAngle = 0;
    let ringRotate1 = 0;
    let ringRotate2 = 0;
    let ringRotate3 = 0;
    let time = 0;

    // Render loop
    const render = () => {
      time += 0.02;

      // Smooth mouse follow
      mouse.x += (mouse.targetX - mouse.x) * 0.08;
      mouse.y += (mouse.targetY - mouse.y) * 0.08;

      ctx.clearRect(0, 0, width, height);

      // Deep Cyber Space Background
      const bgGrad = ctx.createLinearGradient(0, 0, width, height);
      bgGrad.addColorStop(0, themeColors.bgGradientTop);
      bgGrad.addColorStop(1, themeColors.bgGradientBottom);
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // 1. Cybernetic Tech Hex / Dot Grid overlay
      const gridSize = 40;
      ctx.fillStyle = themeColors.ringStroke;
      for (let x = 20; x < width; x += gridSize) {
        for (let y = 20; y < height; y += gridSize) {
          if ((x / gridSize + y / gridSize) % 3 === 0) {
            ctx.fillRect(x, y, 1.2, 1.2);
          }
        }
      }

      // Center HUD coordinates for rotating rings
      const centerX = width / 2;
      const centerY = height / 2;
      const baseHudRadius = Math.min(width, height) * 0.32;

      // 2. Rotating Stark HUD / Cerebro Tactical Rings
      if (radarActive) {
        ringRotate1 += 0.0025;
        ringRotate2 -= 0.0035;
        ringRotate3 += 0.0015;

        // Outer Graduated Compass HUD Ring
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(ringRotate1);

        ctx.strokeStyle = themeColors.ringStroke;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(0, 0, baseHudRadius, 0, Math.PI * 2);
        ctx.stroke();

        // 36 Compass graduation ticks
        for (let i = 0; i < 36; i++) {
          const angle = (i * Math.PI) / 18;
          const isMajor = i % 9 === 0;
          const tickLen = isMajor ? 12 : 5;
          const r1 = baseHudRadius - tickLen;
          const r2 = baseHudRadius;

          ctx.beginPath();
          ctx.moveTo(Math.cos(angle) * r1, Math.sin(angle) * r1);
          ctx.lineTo(Math.cos(angle) * r2, Math.sin(angle) * r2);
          ctx.strokeStyle = isMajor ? themeColors.primary : themeColors.ringStroke;
          ctx.lineWidth = isMajor ? 1.5 : 0.8;
          ctx.stroke();
        }
        ctx.restore();

        // Inner Segmented Tactical Ring (Counter-rotating)
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(ringRotate2);

        const innerRadius = baseHudRadius * 0.65;
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = themeColors.primary;
        // 4 arc segments
        for (let a = 0; a < 4; a++) {
          const start = a * (Math.PI / 2) + 0.15;
          const end = (a + 1) * (Math.PI / 2) - 0.15;
          ctx.beginPath();
          ctx.arc(0, 0, innerRadius, start, end);
          ctx.stroke();
        }

        // Concentric innermost pulse circle
        ctx.beginPath();
        ctx.arc(0, 0, baseHudRadius * 0.28, 0, Math.PI * 2);
        ctx.strokeStyle = themeColors.ringStroke;
        ctx.stroke();

        ctx.restore();

        // Radar Sweeping Cone (Iron Man Target Sweep / Cerebro Neural Scanner)
        radarAngle += 0.015;
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(radarAngle);

        const sweepRadius = baseHudRadius * 1.15;
        const sweepGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, sweepRadius);
        sweepGrad.addColorStop(0, "transparent");
        sweepGrad.addColorStop(0.8, themeColors.radarGradient);
        sweepGrad.addColorStop(1, "transparent");

        ctx.fillStyle = sweepGrad;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, sweepRadius, -0.4, 0);
        ctx.closePath();
        ctx.fill();

        // Leading bright edge line
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(sweepRadius, 0);
        ctx.strokeStyle = themeColors.primary;
        ctx.lineWidth = 1.5;
        ctx.shadowColor = themeColors.primary;
        ctx.shadowBlur = 10;
        ctx.stroke();
        ctx.shadowBlur = 0;

        ctx.restore();
      }

      // 3. Update and draw Neural Synapse Nodes & Connections
      if (particlesActive) {
        // Randomly spawn data packet
        if (Math.random() < 0.04) {
          spawnPacket();
        }

        // Draw links between nearby nodes
        ctx.lineWidth = 0.8;
        for (let i = 0; i < nodes.length; i++) {
          const a = nodes[i];

          for (let j = i + 1; j < nodes.length; j++) {
            const b = nodes[j];
            const dx = a.x - b.x;
            const dy = a.y - b.y;
            const dist = Math.hypot(dx, dy);

            if (dist < 140) {
              const alpha = (1 - dist / 140) * 0.35;
              ctx.strokeStyle = themeColors.linkStroke;
              ctx.beginPath();
              ctx.moveTo(a.x, a.y);
              ctx.lineTo(b.x, b.y);
              ctx.stroke();
            }
          }
        }

        // Update and render data packets traveling along links
        for (let p = packets.length - 1; p >= 0; p--) {
          const packet = packets[p];
          packet.progress += packet.speed;

          if (packet.progress >= 1 || !nodes[packet.fromNode] || !nodes[packet.toNode]) {
            packets.splice(p, 1);
            continue;
          }

          const n1 = nodes[packet.fromNode];
          const n2 = nodes[packet.toNode];
          const px = n1.x + (n2.x - n1.x) * packet.progress;
          const py = n1.y + (n2.y - n1.y) * packet.progress;

          // Glowing energy photon packet
          ctx.beginPath();
          ctx.arc(px, py, 2.2, 0, Math.PI * 2);
          ctx.fillStyle = "#ffffff";
          ctx.shadowColor = themeColors.primary;
          ctx.shadowBlur = 8;
          ctx.fill();
          ctx.shadowBlur = 0;
        }

        // Update & draw nodes
        for (let i = 0; i < nodes.length; i++) {
          const node = nodes[i];

          // Gentle movement
          node.x += node.vx;
          node.y += node.vy;

          // Bounce off boundaries
          if (node.x < 0 || node.x > width) node.vx *= -1;
          if (node.y < 0 || node.y > height) node.vy *= -1;

          // Subtle interaction with mouse
          if (mouseTracking && mouse.isHovering) {
            const mdx = node.x - mouse.x;
            const mdy = node.y - mouse.y;
            const mdist = Math.hypot(mdx, mdy);
            if (mdist < 120 && mdist > 0) {
              const force = (120 - mdist) * 0.001;
              node.x += (mdx / mdist) * force * 15;
              node.y += (mdy / mdist) * force * 15;
            }
          }

          // Pulsing glow radius
          const pulse = Math.sin(time * 2 + node.pulseOffset) * 0.4;
          const r = Math.max(1, node.baseRadius + pulse);

          ctx.beginPath();
          ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
          ctx.fillStyle = themeColors.particleFill;
          ctx.globalAlpha = node.alpha;
          ctx.shadowColor = themeColors.primary;
          ctx.shadowBlur = node.layer === 3 ? 12 : 4;
          ctx.fill();
          ctx.globalAlpha = 1.0;
          ctx.shadowBlur = 0;

          // Concentric tactical halo on larger nodes
          if (node.layer === 3) {
            ctx.beginPath();
            ctx.arc(node.x, node.y, r * 2.8, 0, Math.PI * 2);
            ctx.strokeStyle = themeColors.ringStroke;
            ctx.lineWidth = 0.7;
            ctx.stroke();
          }
        }
      }

      // 4. Interactive Stark Target Reticle over Cursor
      if (mouseTracking && mouse.isHovering) {
        ctx.save();
        ctx.translate(mouse.x, mouse.y);

        const reticleRadius = 24;
        const cornerLen = 8;

        ctx.strokeStyle = themeColors.reticle;
        ctx.lineWidth = 1.5;
        ctx.shadowColor = themeColors.primary;
        ctx.shadowBlur = 8;

        // 4 corner HUD brackets [ + ]
        // Top-left
        ctx.beginPath();
        ctx.moveTo(-reticleRadius, -reticleRadius + cornerLen);
        ctx.lineTo(-reticleRadius, -reticleRadius);
        ctx.lineTo(-reticleRadius + cornerLen, -reticleRadius);
        ctx.stroke();

        // Top-right
        ctx.beginPath();
        ctx.moveTo(reticleRadius - cornerLen, -reticleRadius);
        ctx.lineTo(reticleRadius, -reticleRadius);
        ctx.lineTo(reticleRadius, -reticleRadius + cornerLen);
        ctx.stroke();

        // Bottom-left
        ctx.beginPath();
        ctx.moveTo(-reticleRadius, reticleRadius - cornerLen);
        ctx.lineTo(-reticleRadius, reticleRadius);
        ctx.lineTo(-reticleRadius + cornerLen, reticleRadius);
        ctx.stroke();

        // Bottom-right
        ctx.beginPath();
        ctx.moveTo(reticleRadius - cornerLen, reticleRadius);
        ctx.lineTo(reticleRadius, reticleRadius);
        ctx.lineTo(reticleRadius, reticleRadius - cornerLen);
        ctx.stroke();

        // Tiny center crosshair
        ctx.beginPath();
        ctx.moveTo(-4, 0);
        ctx.lineTo(4, 0);
        ctx.moveTo(0, -4);
        ctx.lineTo(0, 4);
        ctx.stroke();

        // Tiny coordinate telemetry readout
        ctx.shadowBlur = 0;
        ctx.fillStyle = themeColors.reticle;
        ctx.font = "8px 'JetBrains Mono', monospace";
        ctx.fillText(
          `LOCK: ${Math.round(mouse.x)}, ${Math.round(mouse.y)}`,
          reticleRadius + 6,
          -reticleRadius + 8
        );

        ctx.restore();
      }

      // 5. Subtle CRT Scanline effect drifting down
      const scanY = (time * 60) % height;
      const scanGrad = ctx.createLinearGradient(0, scanY - 30, 0, scanY + 30);
      scanGrad.addColorStop(0, "rgba(0, 240, 255, 0)");
      scanGrad.addColorStop(0.5, "rgba(0, 240, 255, 0.025)");
      scanGrad.addColorStop(1, "rgba(0, 240, 255, 0)");
      ctx.fillStyle = scanGrad;
      ctx.fillRect(0, scanY - 30, width, 60);

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [currentTheme, radarActive, particlesActive, mouseTracking, themeColors]);

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 pointer-events-none z-0 overflow-hidden ${className}`}
      aria-hidden="true"
    >
      {/* Background HTML5 Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />

      {/* Subtle Holographic Vignette Overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 45%, rgba(2, 6, 23, 0.75) 100%)",
        }}
      />

      {/* Floating Tactical HUD Command Chip (Interactive Control in bottom right) */}
      {showControls && (
        <div className="absolute bottom-4 right-4 z-40 pointer-events-auto select-none">
          <div className="relative">
            {isHudMenuOpen && (
              <div className="absolute bottom-full right-0 mb-2 w-72 bg-slate-950/95 border border-cyan-500/40 rounded-2xl p-3 shadow-2xl backdrop-blur-xl text-cyan-100 font-mono text-xs animate-in fade-in slide-in-from-bottom-2 duration-150">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-cyan-500/30">
                  <div className="flex items-center gap-1.5 font-bold text-cyan-300">
                    <Zap className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                    <span>HOLOGRAPHIC HUD CONTROLS</span>
                  </div>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-500/30">
                    J.A.R.V.I.S.
                  </span>
                </div>

                {/* Theme presets */}
                <div className="space-y-1.5 mb-3">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                    Visual Spectrum Mode:
                  </span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {(
                      [
                        { id: "arc-cyan", name: "Iron Man Arc", color: "bg-cyan-400" },
                        { id: "cerebro-red", name: "Cerebro Red", color: "bg-red-500" },
                        { id: "jarvis-gold", name: "Stark Gold", color: "bg-amber-400" },
                        { id: "matrix-green", name: "Matrix Cyber", color: "bg-emerald-400" },
                      ] as const
                    ).map((t) => (
                      <button
                        key={t.id}
                        onClick={() => handleSelectTheme(t.id)}
                        className={`flex items-center gap-2 p-1.5 rounded-lg border text-left transition-all cursor-pointer ${
                          currentTheme === t.id
                            ? "bg-cyan-500/20 border-cyan-400 text-white shadow-[0_0_10px_rgba(0,240,255,0.3)]"
                            : "bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                        }`}
                      >
                        <span className={`w-2.5 h-2.5 rounded-full ${t.color} shrink-0`} />
                        <span className="text-[10px] truncate">{t.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Toggles */}
                <div className="space-y-1.5 pt-2 border-t border-slate-800 text-[11px]">
                  <button
                    onClick={() => setRadarActive(!radarActive)}
                    className="w-full flex items-center justify-between px-2 py-1 rounded bg-slate-900/70 hover:bg-slate-800 text-slate-300 cursor-pointer"
                  >
                    <span>Radar Sweep &amp; Reticle Rings</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                        radarActive ? "text-cyan-400 bg-cyan-950/70" : "text-slate-500"
                      }`}
                    >
                      {radarActive ? "ONLINE" : "MUTED"}
                    </span>
                  </button>

                  <button
                    onClick={() => setParticlesActive(!particlesActive)}
                    className="w-full flex items-center justify-between px-2 py-1 rounded bg-slate-900/70 hover:bg-slate-800 text-slate-300 cursor-pointer"
                  >
                    <span>Neural Synapses &amp; Data Packets</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                        particlesActive ? "text-cyan-400 bg-cyan-950/70" : "text-slate-500"
                      }`}
                    >
                      {particlesActive ? "ACTIVE" : "OFF"}
                    </span>
                  </button>

                  <button
                    onClick={() => setMouseTracking(!mouseTracking)}
                    className="w-full flex items-center justify-between px-2 py-1 rounded bg-slate-900/70 hover:bg-slate-800 text-slate-300 cursor-pointer"
                  >
                    <span>Stark Cursor Target Lock</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                        mouseTracking ? "text-cyan-400 bg-cyan-950/70" : "text-slate-500"
                      }`}
                    >
                      {mouseTracking ? "ENABLED" : "OFF"}
                    </span>
                  </button>
                </div>
              </div>
            )}

            {/* Launcher button */}
            <button
              onClick={() => setIsHudMenuOpen(!isHudMenuOpen)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-950/85 hover:bg-slate-900 border border-cyan-500/40 text-cyan-300 shadow-[0_0_15px_rgba(0,240,255,0.25)] hover:shadow-[0_0_20px_rgba(0,240,255,0.4)] backdrop-blur-md transition-all cursor-pointer font-mono text-xs"
              title="Toggle HUD Background Controls"
            >
              <Crosshair className="w-3.5 h-3.5 text-cyan-400 animate-spin-slow" />
              <span className="font-bold tracking-wider">HUD: {themeColors.name.split(" ")[0]}</span>
              <Sliders className="w-3 h-3 text-cyan-400" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
