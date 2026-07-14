"use client";

import { useEffect, useMemo, useRef } from "react";
import {
  Map as MapCanvas,
  MapControls,
  MapClusterLayer,
  MapMarker,
  MarkerContent,
  MapPopup,
  type MapRef,
} from "@/components/ui/map";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ExternalLink, Leaf, Navigation } from "lucide-react";
import { directionsUrl, type Restaurant } from "@/lib/restaurants";
import { formatDistance, TORONTO, type LatLng } from "@/lib/geo";
import { cn } from "@/lib/utils";

// The preset's teal primary as hex — MapLibre canvas paint can't read oklch vars.
const PIN = "#0f766e";
const CLUSTER_COLORS: [string, string, string] = ["#0f766e", "#0d5f59", "#0b4f4a"];

type MapViewProps = {
  items: Restaurant[];
  userPosition: LatLng | null;
  distances: globalThis.Map<string, number>;
  selected: Restaurant | null;
  onSelect: (id: string | null) => void;
  visited: Set<string>;
  onToggleVisited: (id: string, value: boolean) => void;
  className?: string;
};

export function MapView({
  items,
  userPosition,
  distances,
  selected,
  onSelect,
  visited,
  onToggleVisited,
  className,
}: MapViewProps) {
  const mapRef = useRef<MapRef>(null);

  const geojson = useMemo<GeoJSON.FeatureCollection<GeoJSON.Point, { id: string }>>(
    () => ({
      type: "FeatureCollection",
      features: items.map((r) => ({
        type: "Feature",
        geometry: { type: "Point", coordinates: [r.lng, r.lat] },
        properties: { id: r.id },
      })),
    }),
    [items],
  );

  // Fly to the user once their position arrives.
  const flewToUser = useRef(false);
  useEffect(() => {
    if (userPosition && mapRef.current && !flewToUser.current) {
      flewToUser.current = true;
      mapRef.current.flyTo({
        center: [userPosition.lng, userPosition.lat],
        zoom: 12.5,
        duration: 1200,
      });
    }
  }, [userPosition]);

  // Fly to a restaurant when it gets selected (marker tap or list tap).
  useEffect(() => {
    const map = mapRef.current;
    if (selected && map) {
      map.flyTo({
        center: [selected.lng, selected.lat],
        zoom: Math.max(map.getZoom(), 14),
        duration: 800,
      });
    }
  }, [selected]);

  const selectedDistance = selected ? distances.get(selected.id) : undefined;

  return (
    <MapCanvas
      ref={mapRef}
      center={[TORONTO.lng, TORONTO.lat]}
      zoom={11}
      className={cn("h-full w-full", className)}
      attributionControl={false}
    >
      <MapControls position="bottom-right" />
      <MapClusterLayer
        data={geojson}
        pointColor={PIN}
        clusterColors={CLUSTER_COLORS}
        clusterThresholds={[10, 30]}
        clusterMaxZoom={13}
        onPointClick={(feature) => onSelect(feature.properties?.id ?? null)}
      />
      {userPosition && (
        <MapMarker longitude={userPosition.lng} latitude={userPosition.lat}>
          <MarkerContent>
            <span className="relative flex size-4">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-500 opacity-40" />
              <span className="relative inline-flex size-4 rounded-full border-2 border-white bg-blue-600 shadow" />
            </span>
          </MarkerContent>
        </MapMarker>
      )}
      {selected && (
        <MapPopup
          longitude={selected.lng}
          latitude={selected.lat}
          onClose={() => onSelect(null)}
          closeButton
          className="w-72 p-4"
        >
          <div className="space-y-2.5">
            <div className="space-y-1 pr-5">
              <p className="text-sm leading-tight font-semibold">{selected.name}</p>
              <p className="text-muted-foreground text-xs">
                {selected.cuisine} · {selected.area}
                {selectedDistance !== undefined && (
                  <> · {formatDistance(selectedDistance)}</>
                )}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {selected.vegFriendly && (
                <Badge variant="secondary" className="gap-1 text-[11px]">
                  <Leaf className="size-3 text-green-600" /> Veg friendly
                </Badge>
              )}
              <label className="flex cursor-pointer items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-medium">
                <Checkbox
                  className="size-3.5"
                  checked={visited.has(selected.id)}
                  onCheckedChange={(v) => onToggleVisited(selected.id, v === true)}
                />
                Visited
              </label>
            </div>
            <div className="flex gap-2 pt-0.5">
              <Button
                size="sm"
                className="h-8 flex-1 text-xs"
                nativeButton={false}
                render={
                  <a href={selected.gmapsUrl} target="_blank" rel="noopener noreferrer" />
                }
              >
                <ExternalLink className="size-3.5" /> View
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-8 flex-1 text-xs"
                nativeButton={false}
                render={
                  <a
                    href={directionsUrl(selected)}
                    target="_blank"
                    rel="noopener noreferrer"
                  />
                }
              >
                <Navigation className="size-3.5" /> Directions
              </Button>
            </div>
          </div>
        </MapPopup>
      )}
    </MapCanvas>
  );
}
