"use client";

import { useCallback, useEffect, useState } from "react";
import type { LatLng } from "@/lib/geo";

export type LocationState =
  | { status: "loading"; position: null }
  | { status: "granted"; position: LatLng }
  | { status: "denied" | "unavailable"; position: null };

export type UseLocationResult = LocationState & {
  /** Overwrite the known position, e.g. after a fresh recentre fix. */
  update: (position: LatLng) => void;
};

/**
 * Reads the user's location once on mount.
 * Dev override: append ?lat=43.65&lng=-79.40 to simulate a position
 * (the in-app preview browser cannot grant geolocation permission).
 */
export function useLocation(): UseLocationResult {
  const [state, setState] = useState<LocationState>({ status: "loading", position: null });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const lat = parseFloat(params.get("lat") ?? "");
    const lng = parseFloat(params.get("lng") ?? "");
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      setState({ status: "granted", position: { lat, lng } });
      return;
    }
    if (!("geolocation" in navigator)) {
      setState({ status: "unavailable", position: null });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        setState({
          status: "granted",
          position: { lat: pos.coords.latitude, lng: pos.coords.longitude },
        }),
      (err) =>
        setState({
          status: err.code === err.PERMISSION_DENIED ? "denied" : "unavailable",
          position: null,
        }),
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 },
    );
  }, []);

  const update = useCallback((position: LatLng) => {
    setState({ status: "granted", position });
  }, []);

  return { ...state, update };
}
