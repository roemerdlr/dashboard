import { unstable_cache } from 'next/cache';

// Cache tags: each cached query is tagged with the tables it reads, and each
// Server Action that writes a table invalidates that table's tag with
// updateTag(), so the next read goes back to Postgres.
export const CACHE_TAGS = {
  invoices: 'invoices',
  customers: 'customers',
  revenue: 'revenue',
  users: 'users',
  roles: 'roles',
} as const;

export type CacheTag = (typeof CACHE_TAGS)[keyof typeof CACHE_TAGS];

// Safety net for changes made outside the app (e.g. editing the database by
// hand): cached results are refreshed at least this often.
const CACHE_REVALIDATE_SECONDS = 60 * 60;

// Caches a database query across requests and users (on Vercel, in the shared
// Data Cache). The query's arguments are part of the cache key.
// Results are stored as JSON, so Date values come back as ISO strings.
export function cachedQuery<Args extends unknown[], Result>(
  query: (...args: Args) => Promise<Result>,
  key: string,
  tags: CacheTag[],
) {
  return unstable_cache(query, [key], {
    tags,
    revalidate: CACHE_REVALIDATE_SECONDS,
  });
}
