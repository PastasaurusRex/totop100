// Re-parse the Google Sheets HTML export into src/data/restaurants.json,
// preserving already-resolved coordinates/links by id.
//
// Usage: node scripts/parse-sheet.mjs "C:\path\to\Copy of Sheet1.html"
//
// Cell-class legend (from the sheet's own INDEX block):
//   s8  = peach #fce5cd -> vegetarian friendly
//   s10 = green #b6d7a8 -> already visited
//   s11 = white         -> neither
// New rows get lat/lng/address/gmapsUrl = null and must be resolved
// (see the "Updating the list" section in README.md) before the app builds.

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const src = process.argv[2];
if (!src) {
  console.error("usage: node scripts/parse-sheet.mjs <sheet-export.html>");
  process.exit(1);
}

const AREA = {
  "TORONTO WEST": ["Toronto West", "Toronto"],
  "TORONTO DOWNTOWN": ["Downtown", "Toronto"],
  "TORONTO MIDTOWN": ["Midtown", "Toronto"],
  "TORONTO NORTH": ["North York", "Toronto"],
  "TORONTO EAST": ["Toronto East", "Toronto"],
  ETOBICOKE: ["Etobicoke", "Etobicoke"],
  SCARBOROUGH: ["Scarborough", "Scarborough"],
  BRAMPTON: ["Brampton", "Brampton"],
  MARKHAM: ["Markham", "Markham"],
  MISSISSAUGA: ["Mississauga", "Mississauga"],
  VAUGHN: ["Vaughan", "Vaughan"],
};
// Visited rows lose their veg color in the sheet; per the list's owner,
// every visited spot except Burger Drops is also veg-friendly.
const VISITED_NOT_VEG = new Set(["Burger Drops"]);

const decode = (s) =>
  s
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, " ")
    .trim();
const slugify = (name) =>
  name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const html = readFileSync(src, "utf-8");
const rows = [...html.matchAll(/<tr[^>]*>(.*?)<\/tr>/gs)].map((m) => m[1]);

let area = null;
const parsed = [];
for (const row of rows) {
  const cells = [...row.matchAll(/<td([^>]*)>(.*?)<\/td>/gs)]
    .map(([, attrs, cell]) => ({
      cls: (attrs.match(/class="(\S+)/) || [])[1] ?? "",
      text: decode(cell),
    }))
    .filter((c) => c.text);
  if (cells.length === 0) continue;
  if (cells[0].cls === "s5") {
    area = AREA[cells[0].text];
    continue;
  }
  if (area && cells.length >= 2 && ["s8", "s10", "s11"].includes(cells[0].cls)) {
    const name = cells[0].text;
    const visited = cells[0].cls === "s10";
    parsed.push({
      id: slugify(name),
      name,
      cuisine: cells[1].text,
      area: area[0],
      city: area[1],
      vegFriendly: cells[0].cls === "s8" || (visited && !VISITED_NOT_VEG.has(name)),
      visitedInitial: visited,
    });
  }
}

const outPath = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "src",
  "data",
  "restaurants.json",
);
const existing = existsSync(outPath)
  ? new Map(JSON.parse(readFileSync(outPath, "utf-8")).map((r) => [r.id, r]))
  : new Map();

const merged = parsed.map((r) => {
  const prev = existing.get(r.id);
  return {
    ...r,
    lat: prev?.lat ?? null,
    lng: prev?.lng ?? null,
    address: prev?.address ?? null,
    gmapsUrl: prev?.gmapsUrl ?? null,
  };
});

writeFileSync(outPath, JSON.stringify(merged, null, 2) + "\n", "utf-8");
const unresolved = merged.filter((r) => r.lat === null);
console.log(`wrote ${merged.length} restaurants to ${outPath}`);
if (unresolved.length) {
  console.log(`NEEDS RESOLVING (no coordinates yet): ${unresolved.map((r) => r.name).join(", ")}`);
}
