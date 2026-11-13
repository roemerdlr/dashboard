// Shared by the list pages (server) and the Pagination component (client).

// Options offered in the "rows per page" dropdown. The first one is the default.
export const PAGE_SIZES = [6, 10, 20, 50] as const;
export const DEFAULT_PAGE_SIZE = PAGE_SIZES[0];

// Only accept a size from the list, so ?pageSize=100000 can't be used to
// load a whole table at once.
export function parsePageSize(value: string | null | undefined): number {
  const size = Number(value);
  return (PAGE_SIZES as readonly number[]).includes(size)
    ? size
    : DEFAULT_PAGE_SIZE;
}

// Reads ?page= and keeps it within 1..totalPages (e.g. after a search or a
// larger page size leaves fewer pages than the URL asks for).
export function parsePage(
  value: string | null | undefined,
  totalPages: number,
): number {
  const page = Math.floor(Number(value)) || 1;
  return Math.min(Math.max(page, 1), Math.max(totalPages, 1));
}

export function getTotalPages(totalItems: number, pageSize: number) {
  return Math.ceil(totalItems / pageSize);
}
