import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import restaurants from "@/data/restaurants.json";

const KEY = "visited";
const SEEDED_KEY = "visited:seeded";
const initialVisited = restaurants.filter((r) => r.visitedInitial).map((r) => r.id);

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? Redis.fromEnv()
    : null;

// Dev fallback when Upstash env vars are absent: per-process memory only.
const memory = new Set<string>(initialVisited);

async function getVisited(): Promise<string[]> {
  if (!redis) return [...memory];
  const seeded = await redis.get(SEEDED_KEY);
  if (!seeded) {
    if (initialVisited.length > 0) {
      await redis.sadd(KEY, initialVisited[0], ...initialVisited.slice(1));
    }
    await redis.set(SEEDED_KEY, 1);
  }
  return await redis.smembers(KEY);
}

export async function GET() {
  return NextResponse.json({ visited: await getVisited() });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | { id?: string; visited?: boolean }
    | null;
  if (!body?.id || typeof body.visited !== "boolean") {
    return NextResponse.json({ error: "expected { id, visited }" }, { status: 400 });
  }
  if (!restaurants.some((r) => r.id === body.id)) {
    return NextResponse.json({ error: "unknown id" }, { status: 400 });
  }
  if (redis) {
    await getVisited(); // ensure seeded before first write
    if (body.visited) await redis.sadd(KEY, body.id);
    else await redis.srem(KEY, body.id);
    return NextResponse.json({ visited: await redis.smembers(KEY) });
  }
  if (body.visited) memory.add(body.id);
  else memory.delete(body.id);
  return NextResponse.json({ visited: [...memory] });
}
