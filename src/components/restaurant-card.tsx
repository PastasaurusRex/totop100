"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { ExternalLink, Leaf, MapPin, Navigation } from "lucide-react";
import { directionsUrl, type Restaurant } from "@/lib/restaurants";
import { formatDistance } from "@/lib/geo";
import { cn } from "@/lib/utils";

type RestaurantCardProps = {
  restaurant: Restaurant;
  distanceKm: number | undefined;
  isVisited: boolean;
  onToggleVisited: (value: boolean) => void;
  onShowOnMap: () => void;
};

export function RestaurantCard({
  restaurant: r,
  distanceKm,
  isVisited,
  onToggleVisited,
  onShowOnMap,
}: RestaurantCardProps) {
  return (
    <Card
      className={cn(
        "gap-2 rounded-xl p-3.5 transition-colors active:bg-accent",
        isVisited && "opacity-70",
      )}
      role="button"
      tabIndex={0}
      onClick={onShowOnMap}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onShowOnMap();
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{r.name}</p>
          <p className="text-muted-foreground truncate text-xs">
            {r.cuisine} · {r.area}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          {distanceKm !== undefined && (
            <span className="text-primary inline-flex items-center gap-1 text-xs font-semibold tabular-nums">
              <MapPin className="size-3" />
              {formatDistance(distanceKm)}
            </span>
          )}
          {r.vegFriendly && (
            <Badge variant="secondary" className="gap-1 px-1.5 text-[10px]">
              <Leaf className="size-2.5 text-green-600" /> Veg
            </Badge>
          )}
        </div>
      </div>
      <div
        className="flex items-center justify-between gap-2 pt-0.5"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <label className="text-muted-foreground flex cursor-pointer items-center gap-1.5 py-1 text-xs font-medium">
          <Checkbox
            className="size-4"
            checked={isVisited}
            onCheckedChange={(v) => onToggleVisited(v === true)}
          />
          Visited
        </label>
        <div className="flex gap-1.5">
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-xs"
            nativeButton={false}
            render={<a href={r.gmapsUrl} target="_blank" rel="noopener noreferrer" />}
          >
            <ExternalLink className="size-3.5" /> View
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-xs"
            nativeButton={false}
            render={<a href={directionsUrl(r)} target="_blank" rel="noopener noreferrer" />}
          >
            <Navigation className="size-3.5" /> Directions
          </Button>
        </div>
      </div>
    </Card>
  );
}
