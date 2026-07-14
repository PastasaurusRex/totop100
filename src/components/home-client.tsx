"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LocateOff, Maximize2, Search, X } from "lucide-react";
import { MapView } from "@/components/map-view";
import { RestaurantCard } from "@/components/restaurant-card";
import { FilterBar, type RadiusKm, type VisitedFilter } from "@/components/filter-bar";
import { restaurants, type Restaurant } from "@/lib/restaurants";
import { distanceKm } from "@/lib/geo";
import { useLocation } from "@/lib/use-location";
import { useVisited } from "@/lib/use-visited";
import { cn } from "@/lib/utils";

export function HomeClient() {
  const location = useLocation();
  const { visited, toggle } = useVisited();

  const [query, setQuery] = useState("");
  const [radius, setRadius] = useState<RadiusKm>(null);
  const [vegOnly, setVegOnly] = useState(false);
  const [visitedFilter, setVisitedFilter] = useState<VisitedFilter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mapExpanded, setMapExpanded] = useState(false);

  const position = location.position;

  const distances = useMemo(() => {
    const m = new globalThis.Map<string, number>();
    if (position) {
      for (const r of restaurants) {
        m.set(r.id, distanceKm(position, { lat: r.lat, lng: r.lng }));
      }
    }
    return m;
  }, [position]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = restaurants.filter((r) => {
      if (vegOnly && !r.vegFriendly) return false;
      if (visitedFilter === "visited" && !visited.has(r.id)) return false;
      if (visitedFilter === "unvisited" && visited.has(r.id)) return false;
      if (q && !`${r.name} ${r.cuisine} ${r.area}`.toLowerCase().includes(q))
        return false;
      if (radius !== null && position) {
        const d = distances.get(r.id);
        if (d === undefined || d > radius) return false;
      }
      return true;
    });
    if (position) {
      list = [...list].sort(
        (a, b) => (distances.get(a.id) ?? Infinity) - (distances.get(b.id) ?? Infinity),
      );
    } else {
      list = [...list].sort(
        (a, b) => a.area.localeCompare(b.area) || a.name.localeCompare(b.name),
      );
    }
    return list;
  }, [query, vegOnly, visitedFilter, visited, radius, position, distances]);

  const selected: Restaurant | null =
    restaurants.find((r) => r.id === selectedId) ?? null;

  const showOnMap = (id: string) => {
    setSelectedId(id);
    setMapExpanded(true);
  };

  const resetFilters = () => {
    setQuery("");
    setRadius(null);
    setVegOnly(false);
    setVisitedFilter("all");
  };

  return (
    <div className="mx-auto flex w-full max-w-lg flex-1 flex-col">
      <header className="sticky top-0 z-20 space-y-2.5 border-b bg-background/95 px-4 pb-2.5 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur">
        <div className="flex items-baseline justify-between">
          <h1 className="min-w-0 truncate text-lg font-bold tracking-tight">
            Toronto Top 100 Under $100
          </h1>
          <span className="text-muted-foreground shrink-0 text-xs">
            {filtered.length} of {restaurants.length}
          </span>
        </div>
        <div className="relative">
          <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name or cuisine…"
            className="h-9 rounded-full pl-8 text-sm"
          />
          {query && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => setQuery("")}
              className="text-muted-foreground absolute top-1/2 right-2.5 -translate-y-1/2"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
        <FilterBar
          hasLocation={position !== null}
          radius={radius}
          onRadiusChange={setRadius}
          vegOnly={vegOnly}
          onVegOnlyChange={setVegOnly}
          visitedFilter={visitedFilter}
          onVisitedFilterChange={setVisitedFilter}
        />
      </header>

      <main className="flex-1 space-y-3 px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
        {(location.status === "denied" || location.status === "unavailable") && (
          <Card className="text-muted-foreground flex-row items-center gap-2.5 rounded-xl p-3 text-xs">
            <LocateOff className="size-4 shrink-0" />
            {location.status === "denied"
              ? "Location is off — enable it in your browser settings to sort by distance."
              : "Location unavailable — showing all restaurants grouped by area."}
          </Card>
        )}

        <div
          className={cn(
            "relative overflow-hidden rounded-xl border shadow-sm",
            mapExpanded ? "fixed inset-0 z-50 rounded-none border-0" : "h-[36vh] min-h-56",
          )}
        >
          <MapView
            items={filtered}
            userPosition={position}
            distances={distances}
            selected={selected}
            onSelect={setSelectedId}
            visited={visited}
            onToggleVisited={toggle}
            onPositionUpdate={location.update}
          />
          <Button
            size="icon"
            variant="secondary"
            aria-label={mapExpanded ? "Close full-screen map" : "Expand map"}
            onClick={() => setMapExpanded(!mapExpanded)}
            className={cn(
              "absolute z-10 size-9 rounded-full shadow-md",
              mapExpanded
                ? "top-[max(0.75rem,env(safe-area-inset-top))] right-3"
                : "top-2.5 right-2.5",
            )}
          >
            {mapExpanded ? <X className="size-4" /> : <Maximize2 className="size-4" />}
          </Button>
        </div>

        {location.status === "loading" && (
          <p className="text-muted-foreground text-center text-xs">
            Getting your location…
          </p>
        )}

        <div className="space-y-2.5">
          {filtered.map((r) => (
            <RestaurantCard
              key={r.id}
              restaurant={r}
              distanceKm={distances.get(r.id)}
              isVisited={visited.has(r.id)}
              onToggleVisited={(v) => toggle(r.id, v)}
              onShowOnMap={() => showOnMap(r.id)}
            />
          ))}
          {filtered.length === 0 && (
            <Card className="items-center gap-2 rounded-xl p-6 text-center">
              <p className="text-sm font-medium">No restaurants match</p>
              <p className="text-muted-foreground text-xs">
                Try widening the radius or clearing filters.
              </p>
              <Button size="sm" variant="outline" className="mt-1" onClick={resetFilters}>
                Reset filters
              </Button>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
