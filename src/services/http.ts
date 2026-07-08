import type { PaginatedResult, QueryParams } from "@/types";

/**
 * Simulated network latency so loading states are visible in the UI.
 * A real HTTP client would replace `delay` with fetch/axios calls.
 */
export function delay<T>(value: T, ms = 450): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

function getField<T>(item: T, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object") {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, item);
}

export interface CollectionServiceOptions<T> {
  /** Fields scanned when a free-text `search` is provided. */
  searchable: (keyof T | string)[];
  /** How to derive an item's id. */
  idKey?: keyof T;
}

/**
 * Build a fully-typed in-memory collection service that mimics a REST resource.
 * Swap the internal array operations for real API calls to go live.
 */
export function createCollectionService<T extends Record<string, unknown>>(
  seed: T[],
  options: CollectionServiceOptions<T>,
) {
  const idKey = (options.idKey ?? "id") as keyof T;
  // Clone so demo mutations don't corrupt the original seed on hot reload.
  let store: T[] = seed.map((item) => ({ ...item }));

  function applyQuery(params: QueryParams = {}): PaginatedResult<T> {
    const {
      search,
      page = 1,
      pageSize = 10,
      sortBy,
      sortDir = "asc",
      filters = {},
    } = params;

    let rows = [...store];

    // Free-text search.
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      rows = rows.filter((row) =>
        options.searchable.some((field) => {
          const value = getField(row, field as string);
          return value != null && String(value).toLowerCase().includes(q);
        }),
      );
    }

    // Field filters (exact match, supports array of allowed values).
    for (const [key, allowed] of Object.entries(filters)) {
      if (allowed == null || (Array.isArray(allowed) && allowed.length === 0)) {
        continue;
      }
      const allowedList = Array.isArray(allowed) ? allowed : [allowed];
      rows = rows.filter((row) => {
        const value = getField(row, key);
        return allowedList.includes(String(value));
      });
    }

    // Sorting.
    if (sortBy) {
      rows.sort((a, b) => {
        const av = getField(a, sortBy);
        const bv = getField(b, sortBy);
        if (av == null) return 1;
        if (bv == null) return -1;
        if (typeof av === "number" && typeof bv === "number") {
          return sortDir === "asc" ? av - bv : bv - av;
        }
        const cmp = String(av).localeCompare(String(bv));
        return sortDir === "asc" ? cmp : -cmp;
      });
    }

    const total = rows.length;
    const start = (page - 1) * pageSize;
    const data = rows.slice(start, start + pageSize);
    return { data, total, page, pageSize };
  }

  return {
    /** List everything (no pagination) — handy for charts and selects. */
    all(): Promise<T[]> {
      return delay([...store]);
    },
    /** Paginated / filtered / sorted query. */
    query(params?: QueryParams): Promise<PaginatedResult<T>> {
      return delay(applyQuery(params));
    },
    getById(id: string): Promise<T | undefined> {
      return delay(store.find((item) => String(item[idKey]) === id));
    },
    create(payload: T): Promise<T> {
      store = [payload, ...store];
      return delay(payload);
    },
    update(id: string, patch: Partial<T>): Promise<T | undefined> {
      let updated: T | undefined;
      store = store.map((item) => {
        if (String(item[idKey]) === id) {
          updated = { ...item, ...patch };
          return updated;
        }
        return item;
      });
      return delay(updated);
    },
    remove(id: string): Promise<{ id: string }> {
      store = store.filter((item) => String(item[idKey]) !== id);
      return delay({ id });
    },
    /** Reset back to the original seed (used by mock reset actions). */
    reset(): void {
      store = seed.map((item) => ({ ...item }));
    },
  };
}
