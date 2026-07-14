# Toronto Top 100

A mobile-first web app for the "Toronto Top 100 Under $100" restaurant list. It finds the restaurants near you, filters by vegetarian-friendly and visited status, and opens each spot directly in Google Maps. Visited check-offs sync across devices through a shared backend, so two people can use the same list.

Built with Next.js, shadcn/ui, [mapcn](https://mapcn.dev) (MapLibre), Inter from [rsms.me/inter](https://rsms.me/inter), and Upstash Redis.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000. Without Upstash env vars, visited state is kept in memory (resets on server restart), which is fine for development. Geolocation works on localhost; to simulate a location, append `?lat=43.6532&lng=-79.3832` to the URL.

## Deploy (Vercel + Upstash, both free)

1. Push this folder to a GitHub repository.
2. On [vercel.com](https://vercel.com), choose **Add New → Project**, import the repository, and deploy (defaults are fine).
3. In the Vercel project, go to **Storage → Create Database → Upstash (Redis)** in the marketplace, and create the free database. Vercel injects `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` automatically.
4. Redeploy. Share the URL with the other person — anyone with the link can toggle visited state, so keep it private.

On a phone, open the URL and use "Add to Home Screen" to install it like an app.

## Updating the list

When the Google Sheet changes, download it again as a web page and run:

```bash
node scripts/parse-sheet.mjs "C:\path\to\Copy of Sheet1.html"
```

This rewrites `src/data/restaurants.json`, keeping existing coordinates and Google Maps links by restaurant id. New restaurants come out with `lat: null` and are listed in the script output — they need coordinates and a `gmapsUrl` filled in (easiest: ask Claude to resolve them the same way the original 100 were resolved).

## Data model

`src/data/restaurants.json` — one entry per restaurant: `id`, `name`, `cuisine`, `area`, `city`, `vegFriendly`, `visitedInitial` (from the sheet's color coding), `lat`, `lng`, `address`, `gmapsUrl` (canonical Google Maps place link).

Visited state lives in Upstash Redis as a set (`visited`), seeded from `visitedInitial` on first request, and is read/written via `/api/visited`.
