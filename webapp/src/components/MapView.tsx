"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import type { Map as LeafletMap } from "leaflet";
import Supercluster from "supercluster";
import type { EventProps } from "@/lib/types";
import { eventPinIcon, clusterIcon } from "@/lib/markers";

// Singapore — same default home region as the Expo app.
const DEFAULT_CENTER: [number, number] = [1.3521, 103.8198];
const DEFAULT_ZOOM = 12;
const MAX_MARKERS = 30;

// Clean, minimal light basemap (free, no API key) — closest to the app's look.
const TILE_URL = "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
const TILE_ATTR =
  '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';

type ClusterFeature = Supercluster.PointFeature<{ eventId: string }>;
type ClusterOrPoint =
  | Supercluster.ClusterFeature<{}>
  | ClusterFeature;

function ClusterLayer({
  events,
  joinedIds,
  onSelectEvent,
}: {
  events: EventProps[];
  joinedIds: Set<string>;
  onSelectEvent: (e: EventProps) => void;
}) {
  const map = useMap();
  const [version, setVersion] = useState(0); // bumps on move/zoom to recompute

  useMapEvents({
    moveend: () => setVersion((v) => v + 1),
    zoomend: () => setVersion((v) => v + 1),
  });

  const eventsById = useMemo(() => {
    const m = new Map<string, EventProps>();
    for (const e of events) m.set(e.id, e);
    return m;
  }, [events]);

  const index = useMemo(() => {
    const idx = new Supercluster<{ eventId: string }>({
      radius: 70,
      maxZoom: 16,
      minPoints: 2,
    });
    idx.load(
      events.map((e) => ({
        type: "Feature" as const,
        properties: { eventId: e.id },
        geometry: {
          type: "Point" as const,
          coordinates: [e.location_lng!, e.location_lat!],
        },
      })),
    );
    return idx;
  }, [events]);

  const clusters = useMemo(() => {
    const b = map.getBounds();
    const bbox: [number, number, number, number] = [
      b.getWest(),
      b.getSouth(),
      b.getEast(),
      b.getNorth(),
    ];
    let z = Math.round(map.getZoom());
    let result = index.getClusters(bbox, z) as ClusterOrPoint[];
    // Same safety clamp as the app: drop a zoom level until under the ceiling.
    while (result.length > MAX_MARKERS && z > 0) {
      z -= 1;
      result = index.getClusters(bbox, z) as ClusterOrPoint[];
    }
    if (result.length > MAX_MARKERS) result = result.slice(0, MAX_MARKERS);
    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, version, map]);

  return (
    <>
      {clusters.map((feature) => {
        const [lng, lat] = feature.geometry.coordinates;
        const props = feature.properties as any;

        if (props.cluster) {
          const clusterId = props.cluster_id as number;
          const count = props.point_count as number;
          return (
            <Marker
              key={`cluster-${clusterId}`}
              position={[lat, lng]}
              icon={clusterIcon(count)}
              eventHandlers={{
                click: () => {
                  const targetZoom = Math.min(
                    index.getClusterExpansionZoom(clusterId),
                    18,
                  );
                  map.flyTo([lat, lng], targetZoom, { duration: 0.5 });
                },
              }}
            />
          );
        }

        const ev = eventsById.get(props.eventId);
        if (!ev) return null;
        return (
          <Marker
            key={`event-${ev.id}`}
            position={[lat, lng]}
            icon={eventPinIcon(ev, joinedIds.has(ev.id))}
            zIndexOffset={joinedIds.has(ev.id) ? 1000 : 0}
            eventHandlers={{ click: () => onSelectEvent(ev) }}
          />
        );
      })}
    </>
  );
}

export interface MapViewProps {
  events: EventProps[];
  joinedIds: Set<string>;
  onSelectEvent: (e: EventProps) => void;
  onMapReady?: (map: LeafletMap) => void;
}

export default function MapView({
  events,
  joinedIds,
  onSelectEvent,
  onMapReady,
}: MapViewProps) {
  const readyRef = useRef(false);

  return (
    <MapContainer
      center={DEFAULT_CENTER}
      zoom={DEFAULT_ZOOM}
      zoomControl={false}
      attributionControl
      className="h-full w-full"
      // Keep gestures buttery in in-app browsers.
      preferCanvas
      ref={(m) => {
        if (m && !readyRef.current) {
          readyRef.current = true;
          onMapReady?.(m);
        }
      }}
    >
      <TileLayer url={TILE_URL} attribution={TILE_ATTR} />
      <ClusterLayer events={events} joinedIds={joinedIds} onSelectEvent={onSelectEvent} />
    </MapContainer>
  );
}
