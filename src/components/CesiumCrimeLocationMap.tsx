import { useEffect, useMemo, useRef, useState } from "react";
import {
  Cartesian2,
  Cartesian3,
  Color,
  EllipsoidTerrainProvider,
  Entity,
  HeightReference,
  HorizontalOrigin,
  ImageryLayer,
  LabelStyle,
  PinBuilder,
  PolylineGlowMaterialProperty,
  PolylineDashMaterialProperty,
  UrlTemplateImageryProvider,
  VerticalOrigin,
  Viewer,
} from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";
import type { Entity as IntelligenceEntity } from "../types/intelligence";

interface CesiumCrimeLocationMapProps {
  entities: IntelligenceEntity[];
  heightClassName?: string;
}

const COLORS: Record<string, string> = {
  crime_scene: "#ff355e",
  last_known_location: "#ff9d2e",
  police_station: "#00e5ff",
  other: "#b8c7d9",
};

const LABELS: Record<string, string> = {
  crime_scene: "Crime Scene",
  last_known_location: "Last Known",
  police_station: "Police Station",
  other: "Location",
};

function cssColor(category?: string) {
  return COLORS[category || "other"] || COLORS.other;
}

function cesiumColor(category?: string) {
  return Color.fromCssColorString(cssColor(category));
}

export default function CesiumCrimeLocationMap({
  entities,
  heightClassName = "h-[520px]",
}: CesiumCrimeLocationMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const creditContainerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Viewer | null>(null);
  const streetLayerRef = useRef<ImageryLayer | null>(null);
  const routeEntitiesRef = useRef<Entity[]>([]);
  const markerEntitiesRef = useRef<Entity[]>([]);
  const [selected, setSelected] = useState<IntelligenceEntity | null>(null);
  const [layers, setLayers] = useState({ streets: true, routes: true, markers: true, atmosphere: true });

  const located = useMemo(
    () => entities.filter((entity) => Number.isFinite(entity.latitude) && Number.isFinite(entity.longitude)),
    [entities]
  );
  const stations = located.filter((entity) => entity.locationCategory === "police_station");
  const anchors = located.filter((entity) => entity.locationCategory !== "police_station");

  useEffect(() => {
    if (!containerRef.current || located.length === 0) return;

    const viewer = new Viewer(containerRef.current, {
      animation: false,
      baseLayerPicker: false,
      fullscreenButton: false,
      geocoder: false,
      homeButton: false,
      infoBox: false,
      navigationHelpButton: false,
      sceneModePicker: false,
      selectionIndicator: false,
      timeline: false,
      requestRenderMode: true,
      creditContainer: creditContainerRef.current || undefined,
      terrainProvider: new EllipsoidTerrainProvider(),
      baseLayer: new ImageryLayer(
        new UrlTemplateImageryProvider({
          url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
          credit: "Esri World Imagery",
        })
      ),
    });

    viewerRef.current = viewer;
    creditContainerRef.current?.style.setProperty("display", "none", "important");
    const streetOverlay = new ImageryLayer(
      new UrlTemplateImageryProvider({
        url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
        credit: "Esri World Street Map",
      })
    );
    viewer.imageryLayers.add(streetOverlay);
    streetOverlay.alpha = 0.24;
    streetLayerRef.current = streetOverlay;
    viewer.scene.globe.enableLighting = true;
    viewer.scene.globe.showGroundAtmosphere = true;
    viewer.scene.globe.baseColor = Color.fromCssColorString("#020611");
    viewer.scene.fog.enabled = true;
    viewer.scene.fog.density = 0.00018;
    viewer.scene.backgroundColor = Color.fromCssColorString("#020611");
    viewer.scene.screenSpaceCameraController.enableCollisionDetection = false;
    // Own wheel zoom so the camera always advances along its center ray.
    // Cesium's default cursor-relative zoom can make the globe slide vertically.
    viewer.scene.screenSpaceCameraController.enableZoom = false;

    const preventPageScroll = (event: WheelEvent) => {
      event.preventDefault();
      zoomGlobe(viewer, event.deltaY < 0);
    };
    containerRef.current.addEventListener("wheel", preventPageScroll, { passive: false });

    const pinBuilder = new PinBuilder();
    const addMarker = (entity: IntelligenceEntity) => {
      const category = entity.locationCategory || "other";
      const cesiumEntity = viewer.entities.add({
        id: entity.id,
        name: entity.name,
        position: Cartesian3.fromDegrees(entity.longitude!, entity.latitude!, category === "police_station" ? 45 : 80),
        point: {
          pixelSize: category === "police_station" ? 9 : 12,
          color: cesiumColor(category).withAlpha(0.95),
          outlineColor: Color.WHITE.withAlpha(0.9),
          outlineWidth: 2,
          heightReference: HeightReference.CLAMP_TO_GROUND,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
        billboard: {
          image: pinBuilder.fromColor(cesiumColor(category), category === "police_station" ? 28 : 34).toDataURL(),
          verticalOrigin: VerticalOrigin.BOTTOM,
          horizontalOrigin: HorizontalOrigin.CENTER,
          heightReference: HeightReference.CLAMP_TO_GROUND,
          scale: category === "police_station" ? 0.72 : 0.82,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
        label: {
          text: entity.name,
          show: false,
          font: "600 12px monospace",
          fillColor: Color.WHITE,
          outlineColor: Color.BLACK,
          outlineWidth: 4,
          style: LabelStyle.FILL_AND_OUTLINE,
          showBackground: true,
          backgroundColor: Color.fromCssColorString("#020611").withAlpha(0.8),
          backgroundPadding: new Cartesian2(8, 5),
          pixelOffset: new Cartesian2(0, -48),
          horizontalOrigin: HorizontalOrigin.CENTER,
          verticalOrigin: VerticalOrigin.BOTTOM,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          scaleByDistance: undefined,
        },
        properties: { intelligenceEntity: entity },
      });
      const ringEntity = viewer.entities.add({
        position: Cartesian3.fromDegrees(entity.longitude!, entity.latitude!, 5),
        ellipse: {
          semiMajorAxis: category === "police_station" ? 85 : 120,
          semiMinorAxis: category === "police_station" ? 85 : 120,
          material: cesiumColor(category).withAlpha(0.1),
          height: 0,
          outline: true,
          outlineColor: cesiumColor(category).withAlpha(0.72),
          outlineWidth: 2,
        },
      });
      markerEntitiesRef.current.push(cesiumEntity, ringEntity);
      return cesiumEntity;
    };

    located.forEach(addMarker);
    anchors.forEach((from) => {
      if (stations.length === 0) return;
      const nearest = stations.reduce((best, station) => {
        const bestDistance = Cartesian3.distance(
          Cartesian3.fromDegrees(from.longitude!, from.latitude!),
          Cartesian3.fromDegrees(best.longitude!, best.latitude!)
        );
        const nextDistance = Cartesian3.distance(
          Cartesian3.fromDegrees(from.longitude!, from.latitude!),
          Cartesian3.fromDegrees(station.longitude!, station.latitude!)
        );
        return nextDistance < bestDistance ? station : best;
      }, stations[0]);

      const routeEntity = viewer.entities.add({
        polyline: {
          positions: Cartesian3.fromDegreesArrayHeights([
            from.longitude!, from.latitude!, 80,
            nearest.longitude!, nearest.latitude!, 45,
          ]),
          width: 3,
          material: from.locationCategory === "last_known_location"
            ? new PolylineDashMaterialProperty({
                color: Color.fromCssColorString("#ff9d2e").withAlpha(0.9),
                dashLength: 18,
              })
            : new PolylineGlowMaterialProperty({
                glowPower: 0.28,
                taperPower: 0.55,
                color: Color.fromCssColorString("#00e5ff").withAlpha(0.9),
              }),
        },
      });
      routeEntitiesRef.current.push(routeEntity);
    });

    const handler = viewer.screenSpaceEventHandler;
    handler.setInputAction((movement: any) => {
      const picked = viewer.scene.pick(movement.position);
      const pickedEntity = picked?.id as Entity | undefined;
      const data = pickedEntity?.properties?.intelligenceEntity?.getValue?.(viewer.clock.currentTime) as IntelligenceEntity | undefined;
      setSelected(data || null);
    }, 2);

    viewer.flyTo(viewer.entities, { duration: 1.8 });

    return () => {
      containerRef.current?.removeEventListener("wheel", preventPageScroll);
      if (!viewer.isDestroyed()) viewer.destroy();
      viewerRef.current = null;
      streetLayerRef.current = null;
      routeEntitiesRef.current = [];
      markerEntitiesRef.current = [];
    };
  }, [located, anchors, stations]);

  useEffect(() => {
    if (streetLayerRef.current) streetLayerRef.current.show = layers.streets;
    routeEntitiesRef.current.forEach((entity) => { entity.show = layers.routes; });
    markerEntitiesRef.current.forEach((entity) => { entity.show = layers.markers; });
    if (viewerRef.current && !viewerRef.current.isDestroyed()) {
      viewerRef.current.scene.globe.showGroundAtmosphere = layers.atmosphere;
      viewerRef.current.scene.requestRender();
    }
  }, [layers]);

  if (located.length === 0) {
    return <div className={`${heightClassName} flex items-center justify-center rounded-xl border border-slate-800 bg-slate-950/50 text-sm text-slate-500`}>No entities with coordinates yet.</div>;
  }

  return (
    <div className={`${heightClassName} relative w-full overflow-hidden bg-[#020611]`}>
      <div ref={containerRef} className="absolute inset-0 cesium-viewer" />
      <div
        ref={creditContainerRef}
        className="pointer-events-auto absolute bottom-2 right-4 z-30 max-w-[220px] overflow-hidden text-right text-[8px] font-mono text-slate-400/35 [&_.cesium-credit-logoContainer]:hidden [&_.cesium-credit-expand-link]:hidden [&_.cesium-credit-textContainer]:text-[8px] [&_.cesium-credit-textContainer]:text-slate-400/35"
        aria-label="Map data attribution"
      />
      <div className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(circle_at_center,transparent_48%,rgba(0,8,20,0.72)_100%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-24 bg-gradient-to-b from-[#020611]/55 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-24 bg-gradient-to-t from-[#020611]/65 to-transparent" />
      <div className="absolute left-8 top-7 z-30 font-mono text-[10px] uppercase tracking-[0.22em] text-cyan-100 drop-shadow-[0_0_8px_rgba(0,229,255,0.7)]">
        <div className="flex items-center gap-2"><span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400 shadow-[0_0_12px_#34d399]" /> Crime Map</div>
        <div className="mt-1 text-[9px] tracking-wider text-slate-300/70">{located.length} contacts // {stations.length} command points</div>
      </div>
      <div className="absolute right-8 top-7 z-30 flex items-center gap-2 font-mono text-cyan-100 drop-shadow-[0_0_8px_rgba(0,229,255,0.7)]">
        <button
          type="button"
          title="Zoom out"
          aria-label="Zoom out"
          onClick={() => zoomGlobe(viewerRef.current, false)}
          className="flex h-8 w-8 items-center justify-center border border-cyan-300/40 bg-slate-950/35 text-lg leading-none transition-colors hover:bg-cyan-400/20"
        >
          −
        </button>
        <button
          type="button"
          title="Zoom in"
          aria-label="Zoom in"
          onClick={() => zoomGlobe(viewerRef.current, true)}
          className="flex h-8 w-8 items-center justify-center border border-cyan-300/40 bg-slate-950/35 text-lg leading-none transition-colors hover:bg-cyan-400/20"
        >
          +
        </button>
      </div>
      <div className="absolute right-8 top-20 z-30 w-40 font-mono text-[9px] uppercase tracking-[0.14em] text-slate-200/85">
        <div className="mb-2 text-cyan-300/80">Map Layers</div>
        {([
          ["streets", "Street grid"],
          ["routes", "Intel routes"],
          ["markers", "Contact markers"],
          ["atmosphere", "Atmosphere"],
        ] as const).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setLayers((current) => ({ ...current, [key]: !current[key] }))}
            className="flex w-full items-center gap-2 py-1 text-left transition-colors hover:text-cyan-200"
          >
            <span className={`h-2 w-2 rounded-sm border ${layers[key] ? "border-cyan-300 bg-cyan-300 shadow-[0_0_8px_#00e5ff]" : "border-slate-500 bg-transparent"}`} />
            {label}
          </button>
        ))}
      </div>
      <div className="absolute bottom-7 left-8 z-30 flex flex-wrap gap-3 font-mono text-[9px] uppercase tracking-wider text-slate-200/80 drop-shadow-[0_0_7px_rgba(0,229,255,0.55)]">
        {Object.entries(LABELS).map(([category, label]) => <span key={category} className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full" style={{ background: COLORS[category], boxShadow: `0 0 9px ${COLORS[category]}` }} />{label}</span>)}
      </div>
      {selected && (
        <div className="absolute right-8 top-7 z-30 max-w-[260px] font-mono text-xs text-white drop-shadow-[0_0_8px_rgba(0,229,255,0.65)]">
          <div className="mb-2 text-[9px] uppercase tracking-[0.2em] text-cyan-300">Tracked Contact</div>
          <div className="font-bold">{selected.name}</div>
          <div className="mt-1 text-slate-300/75">{selected.role}</div>
          <div className="mt-3 text-[10px] uppercase text-slate-400">{LABELS[selected.locationCategory || "other"]}</div>
          <div className="text-cyan-200">{selected.latitude?.toFixed(4)} / {selected.longitude?.toFixed(4)}</div>
        </div>
      )}
    </div>
  );
}

function zoomGlobe(viewer: Viewer | null, inward: boolean) {
  if (!viewer || viewer.isDestroyed()) return;
  const minimumHeight = 1800;
  const currentHeight = viewer.camera.positionCartographic.height;
  const distance = Math.max(120, Cartesian3.magnitude(viewer.camera.positionWC) * 0.18);
  if (inward) {
    if (currentHeight <= minimumHeight) return;
    viewer.camera.zoomIn(Math.min(distance, currentHeight - minimumHeight));
  } else {
    viewer.camera.zoomOut(distance);
  }
  viewer.scene.requestRender();
}

function categoryLineColor(category?: string) {
  return category === "last_known_location" ? "#ff9d2e" : "#00e5ff";
}
