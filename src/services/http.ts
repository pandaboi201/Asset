import type { PaginatedResult, QueryParams } from "@/types";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

export function delay<T>(value: T, ms = 450): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

function toQueryString(params?: QueryParams): string {
  if (!params) return "";
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.page) query.set("page", String(params.page));
  if (params.pageSize) query.set("pageSize", String(params.pageSize));
  if (params.sortBy) query.set("sortBy", params.sortBy);
  if (params.sortDir) query.set("sortDir", params.sortDir);
  
  if (params.filters) {
    for (const [key, allowed] of Object.entries(params.filters)) {
      if (allowed == null || (Array.isArray(allowed) && allowed.length === 0)) {
        continue;
      }
      query.set(`filters[${key}]`, JSON.stringify(allowed));
    }
  }

  return `?${query.toString()}`;
}

/**
 * Connected HTTP service for the real backend.
 */
export function createCollectionService<T extends Record<string, unknown>>(
  endpoint: string
) {
  const baseUrl = `${API_BASE}/${endpoint}`;

  return {
    async all(): Promise<T[]> {
      const res = await fetch(`${baseUrl}/all`);
      if (!res.ok) throw new Error(`Failed to fetch ${endpoint}/all`);
      return res.json();
    },
    async query(params?: QueryParams): Promise<PaginatedResult<T>> {
      const res = await fetch(`${baseUrl}/query${toQueryString(params)}`);
      if (!res.ok) throw new Error(`Failed to query ${endpoint}`);
      return res.json();
    },
    async getById(id: string): Promise<T | undefined> {
      const res = await fetch(`${baseUrl}/${id}`);
      if (!res.ok) {
        if (res.status === 404) return undefined;
        throw new Error(`Failed to fetch ${endpoint}/${id}`);
      }
      return res.json();
    },
    async create(payload: T): Promise<T> {
      const res = await fetch(`${baseUrl}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const text = await res.text();
        console.error(`Error from server for ${endpoint}:`, text);
        throw new Error(`Failed to create ${endpoint}`);
      }
      return res.json();
    },
    async bulkCreate(payloads: Partial<T>[]): Promise<{ success: number; failed: number; errors: any[]; results: T[] }> {
      const res = await fetch(`${baseUrl}/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payloads)
      });
      if (!res.ok) {
        const text = await res.text();
        console.error(`Error from server for ${endpoint}/bulk:`, text);
        throw new Error(`Failed to bulk create ${endpoint}`);
      }
      return res.json();
    },
    async update(id: string, patch: Partial<T>): Promise<T | undefined> {
      const res = await fetch(`${baseUrl}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch)
      });
      if (!res.ok) throw new Error(`Failed to update ${endpoint}/${id}`);
      return res.json();
    },
    async remove(id: string): Promise<{ id: string }> {
      const res = await fetch(`${baseUrl}/${id}`, {
        method: "DELETE"
      });
      if (!res.ok) throw new Error(`Failed to delete ${endpoint}/${id}`);
      return res.json();
    },
    reset(): void {
      console.warn("reset() is not supported in the live API");
    }
  };
}
