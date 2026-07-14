"use client";

import { useCallback, useEffect, useState } from "react";
import { restaurants } from "@/lib/restaurants";

const initial = restaurants.filter((r) => r.visitedInitial).map((r) => r.id);

/** Shared visited-state, synced through /api/visited (Upstash-backed). */
export function useVisited() {
  const [visited, setVisited] = useState<Set<string>>(new Set(initial));

  useEffect(() => {
    let cancelled = false;
    fetch("/api/visited")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { visited: string[] } | null) => {
        if (data && !cancelled) setVisited(new Set(data.visited));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const toggle = useCallback((id: string, value: boolean) => {
    // Optimistic update; reconcile with the server response.
    setVisited((prev) => {
      const next = new Set(prev);
      if (value) next.add(id);
      else next.delete(id);
      return next;
    });
    fetch("/api/visited", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, visited: value }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { visited: string[] } | null) => {
        if (data) setVisited(new Set(data.visited));
      })
      .catch(() => {});
  }, []);

  return { visited, toggle };
}
