import type { PaginatedResult, QueryParams } from "@/types";

/**
 * Base URL for the real backend (see /server). Configurable via Vite env var
 * so production builds can point at a deployed API instead of localhost.
 *
 * Run the backend with:  npm run server   (node server/index.mjs)
 */
export const API_BASE_URL =
  (import.meta as unknown as { env?: Record<string, string> }).env
    ?.VITE_API_URL || "http://localhost:4000/api";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function request<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
    });
  } catch (err) {
    throw new ApiError(
      `Could not reach the AssetFlow API at ${API_BASE_URL}. Is the backend running? Start it with "npm run server". (${(err as Error).message})`,
      0,
    );
  }

  const text = await res.text();
  const body = text ? JSON.parse(text) : undefined;

  if (!res.ok) {
    const message =
      (body && typeof body === "object" && "error" in body && String(body.error)) ||
      `Request failed with status ${res.status}`;
    throw new ApiError(message, res.status);
  }
  return body as T;
}

function buildQueryString(params?: QueryParams): string {
  if (!params) return "";
  const usp = new URLSearchParams();
  if (params.search) usp.set("search", params.search);
  if (params.page) usp.set("page", String(params.page));
  if (params.pageSize) usp.set("pageSize", String(params.pageSize));
  if (params.sortBy) usp.set("sortBy", params.sortBy);
  if (params.sortDir) usp.set("sortDir", params.sortDir);
  if (params.filters && Object.keys(params.filters).length) {
    usp.set("filters", JSON.stringify(params.filters));
  }
  const qs = usp.toString();
  return qs ? `?${qs}` : "";
}

/**
 * Thin typed REST client for a single backend resource. This is the direct
 * replacement for the old in-memory `createCollectionService` — same method
 * names/signatures so every page in the app kept working unchanged.
 */
export function createApiResource<T extends { id: string }>(resourceName: string) {
  const base = `/${resourceName}`;
  return {
    all(): Promise<T[]> {
      return request<T[]>(base);
    },
    query(params?: QueryParams): Promise<PaginatedResult<T>> {
      return request<PaginatedResult<T>>(`${base}/query${buildQueryString(params)}`);
    },
    getById(id: string): Promise<T | undefined> {
      return request<T>(`${base}/${id}`).catch((err) => {
        if (err instanceof ApiError && err.status === 404) return undefined;
        throw err;
      });
    },
    create(payload: Partial<T>): Promise<T> {
      return request<T>(base, { method: "POST", body: JSON.stringify(payload) });
    },
    update(id: string, patch: Partial<T>): Promise<T | undefined> {
      return request<T>(`${base}/${id}`, {
        method: "PATCH",
        body: JSON.stringify(patch),
      }).catch((err) => {
        if (err instanceof ApiError && err.status === 404) return undefined;
        throw err;
      });
    },
    remove(id: string): Promise<{ id: string }> {
      return request<{ id: string }>(`${base}/${id}`, { method: "DELETE" });
    },
  };
}

export { request as apiRequest };
