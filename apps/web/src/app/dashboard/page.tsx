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
      <Card className="py-0 shadow-sm">
        <CardContent className="flex flex-col gap-4 px-5 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="data-label">Dashboard</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
              Monitoramento BGP
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Visao operacional de rotas, superficie observada e eventos com mitigacao.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="lg" className="text-muted-foreground">
              <CalendarDays className="size-4" />
              Periodo
            </Button>
            <CompactStat
              label="Ultima coleta"
              value={formatDateTime(summary.latest_collection_at)}
            />
            <CompactStat
              label="Taxa mitigada"
              value={formatPercentage(summary.mitigation_rate)}
            />
          </div>
        </CardContent>
      </Card>

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
        <Card className="gap-0 py-0 shadow-sm">
          <CardHeader className="border-b px-5 py-4">
            <div>
              <p className="data-label">Serie temporal</p>
              <CardTitle className="section-title">Frequencia diaria de mitigacao</CardTitle>
            </div>
            <CardAction>
              <Badge variant="secondary" className="h-7 px-3">
              tendencia
              </Badge>
            </CardAction>
          </CardHeader>
          <CardContent className="px-5 py-4">
            <MitigationLineChart data={mitigationFrequency} />
          </CardContent>
        </Card>

        <Card className="gap-0 py-0 shadow-sm">
          <CardHeader className="border-b px-5 py-4">
            <div>
              <p className="data-label">Leituras rapidas</p>
              <CardTitle className="section-title">Contexto operacional</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 px-5 py-4">
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
          </CardContent>
        </Card>
      </section>

      <section className="dashboard-grid xl:grid-cols-2">
        <Card className="gap-0 py-0 shadow-sm">
          <CardHeader className="border-b px-5 py-4">
            <div>
              <p className="data-label">Ranking</p>
              <CardTitle className="section-title">Mitigadores mais recorrentes</CardTitle>
            </div>
            <CardAction>
              <Button variant="ghost" size="sm" render={<Link href="/eventos" />}>
                abrir eventos
                <ArrowUpRight className="size-4" />
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent className="px-5 py-4">
            <AsnBarChart
              data={topMitigators.map((item) => ({
                label: item.name
                  ? `${item.name} (AS${item.asn})`
                  : `AS${item.asn ?? "-"}`,
                count: item.count,
              }))}
              color="var(--chart-3)"
            />
          </CardContent>
        </Card>

        <Card className="gap-0 py-0 shadow-sm">
          <CardHeader className="border-b px-5 py-4">
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
              color="var(--chart-1)"
            />
          </CardContent>
        </Card>
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
    <Card className="kpi-card gap-0 py-0">
      <div className="flex items-center justify-between gap-4">
        <span className="data-label">{label}</span>
        <Badge variant="outline" className={`h-7 gap-1.5 px-2.5 ${toneClass}`}>
          {icon}
        </Badge>
      </div>
      <div className="mt-5">
        <p className="metric-value">{value}</p>
        <p className="mt-2 text-sm text-muted-foreground">{helper}</p>
      </div>
    </Card>
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
    <div className="rounded-lg border bg-muted/45 p-4">
      <div className="flex items-baseline justify-between gap-4">
        <span className="data-label">{label}</span>
        <span className="font-mono text-base font-semibold text-foreground">
          {value}
        </span>
      </div>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">{description}</p>
    </div>
  );
}

function CompactStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="h-9 rounded-lg border bg-background px-3 py-1.5 shadow-xs">
      <p className="text-[0.62rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
        {label}
      </p>
      <p className="text-xs font-semibold text-foreground">{value}</p>
    </div>
  );
}
