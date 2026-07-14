import data from "@/data/restaurants.json";

export type Restaurant = {
  id: string;
  name: string;
  cuisine: string;
  area: string;
  city: string;
  vegFriendly: boolean;
  visitedInitial: boolean;
  lat: number;
  lng: number;
  address: string;
  gmapsUrl: string;
};

export const restaurants = data as Restaurant[];

export function directionsUrl(r: Restaurant): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${r.lat},${r.lng}`;
}
