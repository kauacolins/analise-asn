import Link from "next/link";
import type { ReactNode } from "react";
import {
  Activity,
  ArrowUpRight,
  DatabaseZap,
  Network,
  RadioTower,
  Route,
  ShieldCheck,
  Waypoints,
} from "lucide-react";

import { ApiStatus } from "@/components/api-status";
import { AsnBarChart } from "@/components/charts/asn-bar-chart";
import { MitigationLineChart } from "@/components/charts/mitigation-line-chart";
import { FilterBar } from "@/components/filter-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getDashboardSnapshot, pickRouteFilters, tryApi } from "@/lib/api";
import { formatDateTime, formatNumber, formatPercentage } from "@/lib/format";
import { CountByLabel, SearchParams } from "@/lib/types";

type DashboardPageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  const params = await searchParams;
  const filters = pickRouteFilters(params);
  const { data, error } = await tryApi(() => getDashboardSnapshot(filters), {
    summary: {
      total_routes: 0,
      mitigated_routes: 0,
      non_mitigated_routes: 0,
      mitigation_rate: 0,
      distinct_prefixes: 0,
      distinct_mitigators: 0,
      distinct_origin_asns: 0,
      latest_collection_at: null,
    },
    mitigationFrequency: [],
    topMitigators: [],
    topOrigins: [],
    topPrefixes: [],
    topAsPaths: [],
  });

  const {
    summary,
    mitigationFrequency,
    topMitigators,
    topOrigins,
    topPrefixes,
    topAsPaths,
  } = data;

  const activeFilters = Object.values(filters).filter(Boolean).length;
  const collectionStatus = summary.latest_collection_at
    ? "Coleta sincronizada"
    : "Aguardando coleta";

  return (
    <div className="page-shell">
      <section className="hero-panel px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="max-w-3xl">

            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Analise ASN
            </h1>

          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[28rem]">
            <SignalCard
              icon={<DatabaseZap className="size-4" />}
              label={collectionStatus}
              value={formatDateTime(summary.latest_collection_at)}
            />
            <SignalCard
              icon={<ShieldCheck className="size-4" />}
              label="Taxa mitigada"
              value={formatPercentage(summary.mitigation_rate)}
            />
          </div>
        </div>
      </section>

      {error ? <ApiStatus message={error} /> : null}

      {/* <FilterBar action="/dashboard" filters={filters} /> */}

      <section className="dashboard-grid md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          icon={<Activity className="size-4" />}
          label="Rotas observadas"
          value={formatNumber(summary.total_routes)}
          helper={`${formatNumber(summary.non_mitigated_routes)} sem mitigacao`}
        />
        <KpiCard
          icon={<ShieldCheck className="size-4" />}
          label="Rotas mitigadas"
          value={formatNumber(summary.mitigated_routes)}
          helper={formatPercentage(summary.mitigation_rate)}
        />
        <KpiCard
          icon={<Waypoints className="size-4" />}
          label="Prefixos distintos"
          value={formatNumber(summary.distinct_prefixes)}
          helper={`${formatNumber(summary.distinct_origin_asns)} ASN de origem`}
        />
        <KpiCard
          icon={<Network className="size-4" />}
          label="Mitigadores"
          value={formatNumber(summary.distinct_mitigators)}
          helper={`${activeFilters} filtros ativos`}
        />
      </section>

      <section className="dashboard-grid xl:grid-cols-[1.55fr_0.95fr]">
        <Card className="monitor-card gap-0 py-0">
          <CardHeader className="card-heading">
            <div>
              <p className="data-label">Serie temporal</p>
              <CardTitle className="section-title">
                Frequencia diaria de mitigacao
              </CardTitle>
            </div>
            <CardAction>
              <Badge variant="secondary" className="status-pill">
                tempo real
              </Badge>
            </CardAction>
          </CardHeader>
          <CardContent className="px-5 py-4">
            <MitigationLineChart data={mitigationFrequency} />
          </CardContent>
        </Card>

        <Card className="monitor-card gap-0 py-0">
          <CardHeader className="card-heading">
            <div>
              <p className="data-label">Coletas</p>
              <CardTitle className="section-title">Status operacional</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 px-5 py-4">
            <OperationalRow label="Ultima coleta" value={formatDateTime(summary.latest_collection_at)} />
            <OperationalRow label="Rotas salvas" value={formatNumber(summary.total_routes)} />
            <OperationalRow label="Superficie" value={`${formatNumber(summary.distinct_prefixes)} prefixos`} />
            <Button
              variant="outline"
              size="lg"
              className="mt-2 w-full justify-between"
              render={<Link href="/coletas" />}
            >
              Ver coletas
              <ArrowUpRight className="size-4" />
            </Button>
          </CardContent>
        </Card>
      </section>

      <section className="dashboard-grid xl:grid-cols-2">
        <Card className="monitor-card gap-0 py-0">
          <CardHeader className="card-heading">
            <div>
              <p className="data-label">Ranking</p>
              <CardTitle className="section-title">
                Mitigadores mais recorrentes
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="px-5 py-4">
            <AsnBarChart
              data={topMitigators.map((item) => ({
                label: item.name
                  ? `${item.name} (AS${item.asn})`
                  : `AS${item.asn ?? "-"}`,
                count: item.count,
              }))}
              color="var(--chart-1)"
            />
          </CardContent>
        </Card>

        <Card className="monitor-card gap-0 py-0">
          <CardHeader className="card-heading">
            <div>
              <p className="data-label">Origem</p>
              <CardTitle className="section-title">ASN com maior volume</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="px-5 py-4">
            <AsnBarChart
              data={topOrigins.map((item) => ({
                label: `AS${item.asn ?? "-"}`,
                count: item.count,
              }))}
              color="var(--chart-3)"
            />
          </CardContent>
        </Card>
      </section>

      <section className="dashboard-grid xl:grid-cols-2">
        <RankingTable
          title="Prefixos mais observados"
          eyebrow="Rotas"
          icon={<Route className="size-4" />}
          data={topPrefixes}
        />
        <RankingTable
          title="AS-PATH recorrentes"
          eyebrow="Investigacao"
          icon={<Waypoints className="size-4" />}
          data={topAsPaths}
        />
      </section>
    </div>
  );
}

function KpiCard({
  icon,
  label,
  value,
  helper,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <Card className="kpi-card gap-0">
      <div className="flex items-center justify-between gap-4">
        <span className="data-label">{label}</span>
        <span className="icon-chip">{icon}</span>
      </div>
      <div className="mt-5">
        <p className="metric-value">{value}</p>
        <p className="mt-2 text-sm text-muted-foreground">{helper}</p>
      </div>
    </Card>
  );
}

function SignalCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="signal-card">
      <span className="icon-chip">{icon}</span>
      <div className="min-w-0">
        <p className="data-label">{label}</p>
        <p className="truncate font-mono text-sm font-semibold text-foreground">
          {value}
        </p>
      </div>
    </div>
  );
}

function OperationalRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border bg-muted/35 px-4 py-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-right font-mono text-sm font-semibold text-foreground">
        {value}
      </span>
    </div>
  );
}

function RankingTable({
  title,
  eyebrow,
  icon,
  data,
}: {
  title: string;
  eyebrow: string;
  icon: ReactNode;
  data: CountByLabel[];
}) {
  return (
    <Card className="monitor-card gap-0 py-0">
      <CardHeader className="card-heading">
        <div>
          <p className="data-label">{eyebrow}</p>
          <CardTitle className="section-title">{title}</CardTitle>
        </div>
        <span className="icon-chip">{icon}</span>
      </CardHeader>
      <CardContent className="px-5 py-2">
        <div className="divide-y">
          {data.length ? (
            data.slice(0, 6).map((item) => (
              <div
                className="grid grid-cols-[1fr_auto] items-center gap-4 py-3"
                key={item.label}
              >
                <span className="truncate font-mono text-sm text-foreground">
                  {item.label}
                </span>
                <span className="rounded-md bg-accent px-2 py-1 font-mono text-xs font-semibold text-accent-foreground">
                  {formatNumber(item.count)}
                </span>
              </div>
            ))
          ) : (
            <p className="py-6 text-sm text-muted-foreground">
              Nenhum dado encontrado para a janela atual.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
