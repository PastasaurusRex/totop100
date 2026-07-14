"use client";

import { Toggle } from "@/components/ui/toggle";
import { Badge } from "@/components/ui/badge";
import { Check, Leaf } from "lucide-react";
import { cn } from "@/lib/utils";

export const RADIUS_OPTIONS = [2, 5, 10, null] as const;
export type RadiusKm = (typeof RADIUS_OPTIONS)[number];
export type VisitedFilter = "all" | "unvisited" | "visited";

type FilterBarProps = {
  hasLocation: boolean;
  radius: RadiusKm;
  onRadiusChange: (r: RadiusKm) => void;
  vegOnly: boolean;
  onVegOnlyChange: (v: boolean) => void;
  visitedFilter: VisitedFilter;
  onVisitedFilterChange: (v: VisitedFilter) => void;
};

const VISITED_LABEL: Record<VisitedFilter, string> = {
  all: "All spots",
  unvisited: "Not visited",
  visited: "Visited",
};

export function FilterBar({
  hasLocation,
  radius,
  onRadiusChange,
  vegOnly,
  onVegOnlyChange,
  visitedFilter,
  onVisitedFilterChange,
}: FilterBarProps) {
  const cycleVisited = () => {
    const order: VisitedFilter[] = ["all", "unvisited", "visited"];
    onVisitedFilterChange(order[(order.indexOf(visitedFilter) + 1) % order.length]);
  };

  return (
    <div className="scrollbar-none -mx-4 flex items-center gap-1.5 overflow-x-auto px-4 pb-0.5">
      {hasLocation && (
        <div className="bg-muted flex shrink-0 items-center rounded-full p-0.5">
          {RADIUS_OPTIONS.map((r) => (
            <button
              key={r ?? "all"}
              type="button"
              onClick={() => onRadiusChange(r)}
              className={cn(
                "rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap transition-colors",
                radius === r
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground",
              )}
            >
              {r === null ? "Any distance" : `${r} km`}
            </button>
          ))}
        </div>
      )}
      <Toggle
        size="sm"
        variant="outline"
        pressed={vegOnly}
        onPressedChange={onVegOnlyChange}
        className="h-7 shrink-0 gap-1 rounded-full px-2.5 text-xs aria-pressed:bg-green-600/10 aria-pressed:text-green-700 dark:aria-pressed:text-green-400"
      >
        <Leaf className="size-3.5" /> Veg friendly
      </Toggle>
      <button type="button" onClick={cycleVisited} className="shrink-0">
        <Badge
          variant={visitedFilter === "all" ? "outline" : "default"}
          className="h-7 gap-1 rounded-full px-2.5 text-xs font-medium"
        >
          {visitedFilter === "visited" && <Check className="size-3.5" />}
          {VISITED_LABEL[visitedFilter]}
        </Badge>
      </button>
    </div>
  );
}
