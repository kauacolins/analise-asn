export type SearchParams = Record<string, string | string[] | undefined>;

export type RouteFilters = {
  start?: string;
  end?: string;
  prefix?: string;
  origin_asn?: string;
  mitigator_asn?: string;
  is_mitigated?: string;
  community_contains?: string;
  as_path_contains?: string;
};

export type AnalyticsSummary = {
  total_routes: number;
  mitigated_routes: number;
  non_mitigated_routes: number;
  mitigation_rate: number;
  distinct_prefixes: number;
  distinct_mitigators: number;
  distinct_origin_asns: number;
  latest_collection_at: string | null;
};

export type CountByAsn = {
  asn: number | null;
  name?: string | null;
  count: number;
};

export type CountByLabel = {
  label: string;
  count: number;
};

export type TimeBucketCount = {
  bucket: string;
  count: number;
};

export type HourlyIncidencePoint = {
  hour: number;
  count: number;
};

export type WeekdayIncidencePoint = {
  weekday: number;
  label: string;
  count: number;
};

export type BgpRoute = {
  id: number;
  prefixo: string;
  asn_origem: number | null;
  as_path: string;
  asn_mitigador: number | null;
  is_mitigated: boolean;
  community: string | null;
  source_id: string | null;
  collected_at: string;
  created_at: string;
};

export type MonitoredAsn = {
  id: number;
  nome: string;
  asn: number;
};

export type Mitigator = {
  id: number;
  nome: string;
  asn: number;
};

export type CollectorRunResponse = {
  monitored_asns: number;
  prefixes_seen: number;
  routes_saved: number;
  mitigated_routes: number;
};
