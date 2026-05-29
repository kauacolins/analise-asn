import {
  AnalyticsSummary,
  BgpRoute,
  CollectorRunResponse,
  CountByAsn,
  Mitigator,
  MonitoredAsn,
  RouteFilters,
  SearchParams,
  TimeBucketCount,
} from "@/lib/types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? process.env.API_URL ?? "http://localhost:8000";

type QueryValue = string | number | boolean | undefined;
export class ApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApiError";
  }
}

function normalizeValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function pickRouteFilters(searchParams: SearchParams): RouteFilters {
  return {
    start: normalizeValue(searchParams.start),
    end: normalizeValue(searchParams.end),
    prefix: normalizeValue(searchParams.prefix),
    origin_asn: normalizeValue(searchParams.origin_asn),
    mitigator_asn: normalizeValue(searchParams.mitigator_asn),
    is_mitigated: normalizeValue(searchParams.is_mitigated),
    community_contains: normalizeValue(searchParams.community_contains),
    as_path_contains: normalizeValue(searchParams.as_path_contains),
  };
}

export function buildQuery(params: Record<string, QueryValue>) {
  const search = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === "") {
      return;
    }

    search.set(key, String(value));
  });

  const queryString = search.toString();
  return queryString ? `?${queryString}` : "";
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
      cache: "no-store",
    });
  } catch {
    throw new ApiError(
      "A API não está acessível no momento. Verifique se o backend está rodando em http://localhost:8000.",
    );
  }

  if (!response.ok) {
    const message = await response.text();
    throw new ApiError(message || `Falha ao consultar ${path}`);
  }

  return response.json() as Promise<T>;
}

export async function tryApi<T>(
  action: () => Promise<T>,
  fallback: T,
): Promise<{ data: T; error: string | null }> {
  try {
    const data = await action();
    return { data, error: null };
  } catch (error) {
    const message =
      error instanceof ApiError
        ? error.message
        : "Não foi possível carregar os dados da API.";
    return { data: fallback, error: message };
  }
}

export async function getDashboardSnapshot(filters: RouteFilters) {
  const query = buildQuery({
    ...filters,
    limit: 8,
  });

  const [summary, mitigationFrequency, topMitigators, topOrigins] =
    await Promise.all([
      apiFetch<AnalyticsSummary>(`/analytics/summary${buildQuery(filters)}`),
      apiFetch<TimeBucketCount[]>(
        `/analytics/mitigation-frequency${buildQuery(filters)}`,
      ),
      apiFetch<CountByAsn[]>(`/analytics/top-mitigators${query}`),
      apiFetch<CountByAsn[]>(`/analytics/volume-by-origin-asn${query}`),
    ]);

  return {
    summary,
    mitigationFrequency,
    topMitigators,
    topOrigins,
  };
}

export async function getRoutes(params: RouteFilters & { limit?: number; offset?: number }) {
  return apiFetch<BgpRoute[]>(`/routes${buildQuery(params)}`);
}

export async function getRoute(routeId: number) {
  return apiFetch<BgpRoute>(`/routes/${routeId}`);
}

export async function getMonitoredAsns() {
  return apiFetch<MonitoredAsn[]>("/monitored-asns");
}

export async function createMonitoredAsn(payload: { nome: string; asn: number }) {
  return apiFetch<MonitoredAsn>("/monitored-asns", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getMitigators() {
  return apiFetch<Mitigator[]>("/mitigators");
}

export async function createMitigator(payload: { nome: string; asn: number }) {
  return apiFetch<Mitigator>("/mitigators", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function runCollection() {
  return apiFetch<CollectorRunResponse>("/collect", {
    method: "POST",
  });
}
