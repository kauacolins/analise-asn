import Link from "next/link";
import type { ReactNode } from "react";
import {
  Activity,
  ArrowUpRight,
  CalendarDays,
  Network,
  ShieldCheck,
  Waypoints,
} from "lucide-react";

import { ApiStatus } from "@/components/api-status";
import { AsnBarChart } from "@/components/charts/asn-bar-chart";
import { MitigationLineChart } from "@/components/charts/mitigation-line-chart";
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
  });

  const { summary, mitigationFrequency, topMitigators, topOrigins } = data;

  return (
    <div className="page-shell">
      <section className="flex flex-col gap-4 rounded-lg border border-slate-200/75 bg-white px-5 py-4 shadow-[0_10px_24px_rgba(148,163,184,0.08)] lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="data-label">Dashboard</p>
          <h2 className="mt-1 text-2xl font-semibold text-slate-950">
            Monitoramento BGP
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 text-sm text-slate-500">
            <CalendarDays className="size-4" />
            Time period
          </span>
          <CompactStat
            label="Ultima coleta"
            value={formatDateTime(summary.latest_collection_at)}
          />
          <CompactStat
            label="Taxa mitigada"
            value={formatPercentage(summary.mitigation_rate)}
          />
        </div>
      </section>

      {error ? <ApiStatus message={error} /> : null}

      <section className="dashboard-grid md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          icon={<Activity className="size-4" />}
          label="Rotas observadas"
          value={formatNumber(summary.total_routes)}
          helper={`${formatNumber(summary.non_mitigated_routes)} sem mitigacao`}
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
          label="Mitigadores"
          value={formatNumber(summary.distinct_mitigators)}
          helper="atores reconhecidos na janela atual"
          tone="info"
        />
      </section>

      <section className="dashboard-grid xl:grid-cols-[1.45fr_0.95fr]">
        <article className="panel">
          <div className="panel-header">
            <div>
              <p className="data-label">Serie temporal</p>
              <h3 className="section-title">Frequencia diaria de mitigacao</h3>
            </div>
            <span className="rounded-md bg-slate-50 px-3 py-1 text-sm text-slate-500">
              tendencia
            </span>
          </div>
          <div className="panel-body">
            <MitigationLineChart data={mitigationFrequency} />
          </div>
        </article>

        <article className="panel">
          <div className="panel-header">
            <div>
              <p className="data-label">Leituras rapidas</p>
              <h3 className="section-title">Contexto operacional</h3>
            </div>
          </div>
          <div className="panel-body space-y-3">
            <Insight
              label="Mitigacao"
              value={formatPercentage(summary.mitigation_rate)}
              description="Eventos classificados com mitigador no AS-PATH."
            />
            <Insight
              label="Superficie"
              value={formatNumber(summary.distinct_prefixes)}
              description="Prefixos distintos na janela analisada."
            />
            <Insight
              label="Diversidade"
              value={formatNumber(summary.distinct_origin_asns)}
              description="ASN de origem unicos observados."
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
            <Link
              href="/eventos"
              className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900"
            >
              abrir eventos
              <ArrowUpRight className="size-4" />
            </Link>
          </div>
          <div className="panel-body">
            <AsnBarChart
              data={topMitigators.map((item) => ({
                label: item.name
                  ? `${item.name} (AS${item.asn})`
                  : `AS${item.asn ?? "-"}`,
                count: item.count,
              }))}
              color="var(--chart-3)"
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
              color="var(--chart-1)"
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
        : "border-blue-100 bg-blue-50 text-blue-700";

  return (
    <article className="kpi-card">
      <div className="flex items-center justify-between gap-4">
        <span className="data-label">{label}</span>
        <span className={`threat-badge ${toneClass}`}>{icon}</span>
      </div>
      <div className="mt-5">
        <p className="metric-value">{value}</p>
        <p className="mt-2 text-sm text-slate-500">{helper}</p>
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
    <div className="rounded-lg border border-slate-200/75 bg-slate-50/70 p-4">
      <div className="flex items-baseline justify-between gap-4">
        <span className="data-label">{label}</span>
        <span className="font-mono text-base font-semibold text-slate-900">
          {value}
        </span>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-500">{description}</p>
    </div>
  );
}

function CompactStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="h-9 rounded-md border border-slate-200 bg-white px-3 py-1.5">
      <p className="text-[0.62rem] font-semibold uppercase tracking-[0.1em] text-slate-400">
        {label}
      </p>
      <p className="text-xs font-semibold text-slate-900">{value}</p>
    </div>
  );
}
