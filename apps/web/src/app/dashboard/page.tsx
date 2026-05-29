import type { ReactNode } from "react";
import { Activity, Network, ShieldCheck, Waypoints } from "lucide-react";

import { ApiStatus } from "@/components/api-status";
import { AsnBarChart } from "@/components/charts/asn-bar-chart";
import { MitigationLineChart } from "@/components/charts/mitigation-line-chart";
import { FilterBar } from "@/components/filter-bar";
import { getDashboardSnapshot, pickRouteFilters, tryApi } from "@/lib/api";
import { formatDateTime, formatNumber, formatPercentage } from "@/lib/format";
import { SearchParams } from "@/lib/types";

type DashboardPageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  const params = await searchParams;
  const filters = pickRouteFilters(params);
  const { data, error } = await tryApi(
    () => getDashboardSnapshot(filters),
    {
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
    },
  );
  const { summary, mitigationFrequency, topMitigators, topOrigins } = data;

  return (
    <div className="space-y-6">
      <section className="panel panel-body">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="data-label">Situação atual</p>
            <h2 className="section-title text-2xl sm:text-3xl">
              Panorama de mitigação e recorrência
            </h2>
          </div>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            Acompanhe o volume de rotas, a proporção de eventos mitigados e os ASN
            que mais aparecem nas últimas coletas filtradas.
          </p>
        </div>
      </section>

      <FilterBar action="/dashboard" filters={filters} />

      {error ? <ApiStatus message={error} /> : null}

      <section className="dashboard-grid md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          icon={<Activity className="size-4" />}
          label="Rotas observadas"
          value={formatNumber(summary.total_routes)}
          helper={`${formatNumber(summary.non_mitigated_routes)} sem mitigação`}
          tone="info"
        />
        <KpiCard
          icon={<ShieldCheck className="size-4" />}
          label="Rotas mitigadas"
          value={formatNumber(summary.mitigated_routes)}
          helper={formatPercentage(summary.mitigation_rate)}
          tone="success"
        />
        <KpiCard
          icon={<Waypoints className="size-4" />}
          label="Prefixos distintos"
          value={formatNumber(summary.distinct_prefixes)}
          helper={`${formatNumber(summary.distinct_origin_asns)} ASN de origem`}
          tone="warning"
        />
        <KpiCard
          icon={<Network className="size-4" />}
          label="Última coleta"
          value={formatDateTime(summary.latest_collection_at)}
          helper={`${formatNumber(summary.distinct_mitigators)} mitigadores detectados`}
          tone="info"
        />
      </section>

      <section className="dashboard-grid xl:grid-cols-[1.4fr_1fr]">
        <article className="panel">
          <div className="panel-header">
            <div>
              <p className="data-label">Série temporal</p>
              <h3 className="section-title">Frequência diária de mitigação</h3>
            </div>
          </div>
          <div className="panel-body">
            <MitigationLineChart data={mitigationFrequency} />
          </div>
        </article>

        <article className="panel">
          <div className="panel-header">
            <div>
              <p className="data-label">Contexto</p>
              <h3 className="section-title">Leituras rápidas</h3>
            </div>
          </div>
          <div className="panel-body space-y-4">
            <Insight
              label="Mitigação"
              value={formatPercentage(summary.mitigation_rate)}
              description="Percentual de eventos classificados com mitigador no AS-PATH."
            />
            <Insight
              label="Superfície"
              value={formatNumber(summary.distinct_prefixes)}
              description="Quantidade de prefixos distintos aparecendo na janela analisada."
            />
            <Insight
              label="Diversidade"
              value={formatNumber(summary.distinct_origin_asns)}
              description="Número de ASN de origem únicos observados na amostra."
            />
          </div>
        </article>
      </section>

      <section className="dashboard-grid xl:grid-cols-2">
        <article className="panel">
          <div className="panel-header">
            <div>
              <p className="data-label">Ranking</p>
              <h3 className="section-title">Mitigadores mais recorrentes</h3>
            </div>
          </div>
          <div className="panel-body">
            <AsnBarChart
              data={topMitigators.map((item) => ({
                label: item.name ? `${item.name} (AS${item.asn})` : `AS${item.asn ?? "-"}`,
                count: item.count,
              }))}
              color="var(--chart-1)"
            />
          </div>
        </article>

        <article className="panel">
          <div className="panel-header">
            <div>
              <p className="data-label">Origem</p>
              <h3 className="section-title">ASN com maior volume</h3>
            </div>
          </div>
          <div className="panel-body">
            <AsnBarChart
              data={topOrigins.map((item) => ({
                label: `AS${item.asn ?? "-"}`,
                count: item.count,
              }))}
              color="var(--chart-3)"
            />
          </div>
        </article>
      </section>
    </div>
  );
}

function KpiCard({
  icon,
  label,
  value,
  helper,
  tone,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  helper: string;
  tone: "success" | "warning" | "info";
}) {
  const toneClass =
    tone === "success"
      ? "threat-normal"
      : tone === "warning"
        ? "threat-warning"
        : "threat-badge border-primary/30 bg-primary/10 text-primary";

  return (
    <article className="kpi-card">
      <div className="panel-body space-y-5">
        <div className="flex items-center justify-between">
          <span className="data-label">{label}</span>
          <span className={`threat-badge ${toneClass}`}>{icon}</span>
        </div>
        <div>
          <p className="metric-value">{value}</p>
          <p className="mt-2 text-sm text-muted-foreground">{helper}</p>
        </div>
      </div>
    </article>
  );
}

function Insight({
  label,
  value,
  description,
}: {
  label: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-3xl border border-border/70 bg-background/35 p-4">
      <div className="flex items-baseline justify-between gap-4">
        <span className="data-label">{label}</span>
        <span className="font-mono text-lg font-semibold text-foreground">{value}</span>
      </div>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">{description}</p>
    </div>
  );
}
