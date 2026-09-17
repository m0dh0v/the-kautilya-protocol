import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, Polygon, LayersControl, LayerGroup, AttributionControl, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Entity } from "../types/intelligence";

interface CrimeLocationMapProps {
  entities: Entity[];
  heightClassName?: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  crime_scene: "#ef4444", // red
  last_known_location: "#f97316", // orange
  police_station: "#22d3ee", // cyan — matches the app's accent color
  other: "#94a3b8", // slate
};

const CATEGORY_LABELS: Record<string, string> = {
  crime_scene: "Crime Scene",
  last_known_location: "Last Known Location",
  police_station: "Police Station",
  other: "Location",
};

function makeDivIcon(color: string) {
  return L.divIcon({
    className: "",
    html: `<div style="
      position: relative; width: 30px; height: 42px; transform: translateY(-8px);
      filter: drop-shadow(0 8px 8px rgba(0,0,0,0.65));
    ">
      <div style="
        position: absolute; left: 7px; top: 0; width: 16px; height: 16px;
        border-radius: 9999px 9999px 9999px 2px; transform: rotate(-45deg);
        background: linear-gradient(135deg, ${color}, ${color}99);
        border: 2px solid rgba(255,255,255,0.9); box-shadow: 0 0 0 3px ${color}33, 0 0 18px ${color};
      ">
        <div style="width: 5px; height: 5px; margin: 3.5px; border-radius: 9999px; background: #fff; opacity: 0.9;"></div>
      </div>
      <div style="
        position: absolute; left: 13px; top: 14px; width: 4px; height: 19px;
        background: linear-gradient(90deg, ${color}55, ${color}, ${color}44);
        transform: skewX(-8deg); box-shadow: 0 0 8px ${color};
      "></div>
      <div style="
        position: absolute; left: 2px; bottom: 2px; width: 26px; height: 7px;
        border-radius: 50%; background: ${color}66; filter: blur(3px);
      "></div>
    </div>`,
    iconSize: [30, 42],
    iconAnchor: [15, 40],
  });
}

// Straight-line ("as the crow flies") distance in km between two coordinates
function haversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function criticalityColor(level: string | undefined): string {
  if (level === "critical") return "#ef4444";
  if (level === "high") return "#f97316";
  if (level === "medium") return "#facc15";
  return "#22d3ee";
}

function criticalityPolygon(entity: Entity): [number, number][] {
  const radiusByLevel: Record<string, number> = { critical: 0.55, high: 0.4, medium: 0.28, low: 0.18 };
  const radius = radiusByLevel[entity.attributes.criticality || entity.riskLevel] || 0.28;
  const latitude = entity.latitude!;
  const longitude = entity.longitude!;
  return Array.from({ length: 12 }, (_, index) => {
    const angle = (Math.PI / 6) * index;
    return [latitude + Math.sin(angle) * radius, longitude + Math.cos(angle) * radius] as [number, number];
  });
}

export default function CrimeLocationMap({ entities, heightClassName = "h-[520px]" }: CrimeLocationMapProps) {
  // Only entities that actually have coordinates can go on the map
  const located = useMemo(
    () =>
      entities.filter(
        (e) =>
          typeof e.latitude === "number" &&
          typeof e.longitude === "number" &&
          !Number.isNaN(e.latitude) &&
          !Number.isNaN(e.longitude)
      ),
    [entities]
  );

  const crimeScenes = located.filter((e) => e.locationCategory === "crime_scene");
  const lastKnown = located.filter((e) => e.locationCategory === "last_known_location");
  const policeStations = located.filter((e) => e.locationCategory === "police_station");

  const networkConnections = useMemo(() => {
    const grouped = new Map<string, Entity[]>();
    crimeScenes.forEach((site) => {
      const network = site.attributes.associatedNetwork;
      if (!network) return;
      network.split("|").map((value) => value.trim()).filter(Boolean).forEach((key) => {
        const sites = grouped.get(key) || [];
        sites.push(site);
        grouped.set(key, sites);
      });
    });

    return Array.from(grouped.entries()).flatMap(([network, sites]) =>
      sites.slice(1).map((site, index) => ({ network, from: sites[index], to: site }))
    );
  }, [crimeScenes]);

  // For every crime scene / last-known point, auto-find the nearest police station
  // and build a connecting line to it — no manual linking required.
  const connections = useMemo(() => {
    const anchors = [...crimeScenes, ...lastKnown];
    return anchors
      .map((anchor) => {
        if (policeStations.length === 0) return null;
        let nearest = policeStations[0];
        let minDist = Infinity;
        for (const ps of policeStations) {
          const d = haversineDistanceKm(anchor.latitude!, anchor.longitude!, ps.latitude!, ps.longitude!);
          if (d < minDist) {
            minDist = d;
            nearest = ps;
          }
        }
        return { from: anchor, to: nearest, distanceKm: minDist };
      })
      .filter((c): c is { from: Entity; to: Entity; distanceKm: number } => c !== null);
  }, [crimeScenes, lastKnown, policeStations]);

  // Also connect crime scene -> last known location for the same case, when both exist
  const crimeToLastKnown = useMemo(() => {
    if (crimeScenes.length === 0 || lastKnown.length === 0) return [];
    // naive pairing: connect each crime scene to the nearest last-known point
    return crimeScenes.map((cs) => {
      let nearest = lastKnown[0];
      let minDist = Infinity;
      for (const lk of lastKnown) {
        const d = haversineDistanceKm(cs.latitude!, cs.longitude!, lk.latitude!, lk.longitude!);
        if (d < minDist) {
          minDist = d;
          nearest = lk;
        }
      }
      return { from: cs, to: nearest };
    });
  }, [crimeScenes, lastKnown]);

  return (
    <div className={`${heightClassName} relative w-full overflow-hidden bg-slate-950`}>
      <div className="pointer-events-none absolute inset-0 z-[500] shadow-[inset_0_0_90px_rgba(2,6,23,0.72)]" />
      <div className="absolute left-5 top-5 z-[501] border-l-2 border-cyan-400 bg-slate-950/85 px-4 py-3 font-mono text-[10px] uppercase tracking-[0.16em] text-cyan-100 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-2"><span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" /> Crime Map // Station View</div>
        <div className="mt-1 text-[9px] tracking-wider text-slate-400">{located.length} locations / {connections.length} station links / {networkConnections.length} network links</div>
        {located.length === 0 && <div className="mt-2 max-w-[220px] normal-case tracking-normal text-amber-300">Live records have no latitude/longitude fields.</div>}
      </div>
      <div className="absolute bottom-5 left-5 z-[501] flex flex-wrap gap-3 border-l-2 border-cyan-400 bg-slate-950/80 px-3 py-2 font-mono text-[9px] uppercase tracking-wider text-slate-200 backdrop-blur-md">
        {Object.entries(CATEGORY_LABELS).map(([category, label]) => (
          <span key={category} className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: CATEGORY_COLORS[category], boxShadow: `0 0 8px ${CATEGORY_COLORS[category]}` }} />{label}</span>
        ))}
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 border border-red-400 bg-red-400/20" />Operational Perimeter</span>
        <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 bg-cyan-400" />Nearest Station</span>
        <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 bg-violet-400" />Same Network</span>
      </div>
      <MapContainer center={[28.6139, 77.209]} zoom={5} zoomControl attributionControl={false} style={{ height: "100%", width: "100%", background: "#0b1120" }}>
        <AttributionControl prefix={false} position="bottomright" />
        <LayersControl position="topright">
          <LayersControl.BaseLayer name="Standard Map">
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap contributors' />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer checked name="Satellite">
            <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" attribution="Tiles &copy; Esri — Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community" />
          </LayersControl.BaseLayer>
          <LayersControl.Overlay checked name="Investigation Routes">
            <LayerGroup>
              {crimeToLastKnown.map((c, i) => <Polyline key={`cs-lk-${i}`} positions={[[c.from.latitude!, c.from.longitude!], [c.to.latitude!, c.to.longitude!]]} pathOptions={{ color: "#f97316", weight: 2, dashArray: "5 7", opacity: 0.75 }} />)}
              {connections.map((c, i) => <Polyline key={`ps-${i}`} positions={[[c.from.latitude!, c.from.longitude!], [c.to.latitude!, c.to.longitude!]]} pathOptions={{ color: "#06b6d4", weight: 2, opacity: 0.9 }} />)}
              {networkConnections.map((c, i) => <Polyline key={`network-${c.network}-${i}`} positions={[[c.from.latitude!, c.from.longitude!], [c.to.latitude!, c.to.longitude!]]} pathOptions={{ color: "#a78bfa", weight: 2, dashArray: "3 8", opacity: 0.9 }} />)}
            </LayerGroup>
          </LayersControl.Overlay>
          <LayersControl.Overlay checked name="Formal Criticality Perimeters">
            <LayerGroup>
              {crimeScenes.map((site) => {
                const level = site.attributes.criticality || site.riskLevel;
                const color = criticalityColor(level);
                return (
                  <Polygon
                    key={`criticality-${site.id}`}
                    positions={criticalityPolygon(site)}
                    pathOptions={{ color, fillColor: color, fillOpacity: 0.1, weight: 1.5, dashArray: "8 6", lineCap: "square", lineJoin: "miter" }}
                  >
                    <Popup>
                      <strong>{site.name}</strong>
                      <div style={{ fontSize: 12 }}>Criticality: {String(level).toUpperCase()}</div>
                      <div style={{ fontSize: 12 }}>Casualties: {site.attributes.casualties ?? 0}</div>
                      <div style={{ fontSize: 12 }}>Injuries: {site.attributes.injuries ?? 0}</div>
                      <div style={{ fontSize: 12 }}>Network: {site.attributes.associatedNetwork || "Unattributed"}</div>
                    </Popup>
                  </Polygon>
                );
              })}
            </LayerGroup>
          </LayersControl.Overlay>
        </LayersControl>
        <FitToLocations locations={located} />

        {located.map((e) => (
          <Marker
            key={e.id}
            position={[e.latitude!, e.longitude!]}
            icon={makeDivIcon(CATEGORY_COLORS[e.locationCategory || "other"])}
          >
            <Popup>
              <div style={{ minWidth: 180 }}>
                <strong>{e.name}</strong>
                <div style={{ fontSize: 12, opacity: 0.8 }}>{e.role}</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>
                  {CATEGORY_LABELS[e.locationCategory || "other"]}
                </div>
                {e.attributes?.address && <div style={{ fontSize: 12 }}>{e.attributes.address}</div>}
                {e.attributes?.associatedNetwork && <div style={{ fontSize: 12 }}>Network: {e.attributes.associatedNetwork}</div>}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

function FitToLocations({ locations }: { locations: Entity[] }) {
  const map = useMap();
  const bounds = L.latLngBounds(locations.map((location) => [location.latitude!, location.longitude!]));

  useEffect(() => {
    if (locations.length > 0) map.fitBounds(bounds, { padding: [72, 72], maxZoom: 11, animate: true });
  }, [locations, map, bounds]);

  return null;
}