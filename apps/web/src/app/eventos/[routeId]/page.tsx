import Link from "next/link";
import { notFound } from "next/navigation";

import { ApiStatus } from "@/components/api-status";
import { ApiError, getRoute } from "@/lib/api";
import { formatDateTime } from "@/lib/format";

type EventoDetalhePageProps = {
  params: Promise<{ routeId: string }>;
};

export default async function EventoDetalhePage({
  params,
}: EventoDetalhePageProps) {
  const { routeId } = await params;
  const numericRouteId = Number(routeId);

  if (Number.isNaN(numericRouteId)) {
    notFound();
  }

  let route;
  let apiError: string | null = null;

  try {
    route = await getRoute(numericRouteId);
  } catch (error) {
    if (error instanceof ApiError) {
      apiError = error.message;
    } else {
      notFound();
    }
  }

  if (apiError || !route) {
    return (
      <div className="space-y-6">
        <section className="panel panel-body">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="data-label">Detalhe do evento</p>
              <h2 className="section-title text-2xl sm:text-3xl">
                Evento indisponível no momento
              </h2>
            </div>
            <Link
              href="/eventos"
              className="inline-flex h-10 items-center justify-center rounded-xl border border-border/70 px-4 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              Voltar para eventos
            </Link>
          </div>
        </section>
        <ApiStatus message={apiError ?? "Não foi possível carregar o evento."} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="panel panel-body">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="data-label">Detalhe do evento</p>
            <h2 className="section-title text-2xl sm:text-3xl">{route.prefixo}</h2>
          </div>
          <Link
            href="/eventos"
            className="inline-flex h-10 items-center justify-center rounded-xl border border-border/70 px-4 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            Voltar para eventos
          </Link>
        </div>
      </section>

      <section className="dashboard-grid lg:grid-cols-[1.1fr_0.9fr]">
        <article className="panel">
          <div className="panel-header">
            <div>
              <p className="data-label">Contexto técnico</p>
              <h3 className="section-title">Informações da rota</h3>
            </div>
            <span
              className={`threat-badge ${
                route.is_mitigated ? "threat-warning" : "threat-normal"
              }`}
            >
              {route.is_mitigated ? "Mitigado" : "Sem mitigação"}
            </span>
          </div>
          <div className="panel-body grid gap-4 sm:grid-cols-2">
            <DetailItem label="ID do evento" value={String(route.id)} />
            <DetailItem
              label="Coletado em"
              value={formatDateTime(route.collected_at)}
            />
            <DetailItem
              label="ASN de origem"
              value={route.asn_origem ? `AS${route.asn_origem}` : "-"}
            />
            <DetailItem
              label="ASN mitigador"
              value={route.asn_mitigador ? `AS${route.asn_mitigador}` : "-"}
            />
            <DetailItem label="Source ID" value={route.source_id ?? "-"} />
            <DetailItem label="Criado em" value={formatDateTime(route.created_at)} />
          </div>
        </article>

        <article className="panel">
          <div className="panel-header">
            <div>
              <p className="data-label">Leitura operacional</p>
              <h3 className="section-title">Resumo de análise</h3>
            </div>
          </div>
          <div className="panel-body space-y-4">
            <SummaryBlock
              title="Prefixo observado"
              value={route.prefixo}
              description="Use este prefixo para cruzar novas consultas na fila de eventos."
            />
            <SummaryBlock
              title="Communities"
              value={route.community ?? "Sem communities registradas"}
              description="Esse campo pode ajudar a identificar políticas, tags ou sinais de mitigação."
            />
          </div>
        </article>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="data-label">Trajeto</p>
            <h3 className="section-title">AS-PATH</h3>
          </div>
        </div>
        <div className="panel-body">
          <div className="rounded-3xl border border-border/70 bg-background/45 p-5 font-mono text-sm leading-7 text-foreground">
            {route.as_path.split(",").map((segment) => (
              <span
                key={`${route.id}-${segment}`}
                className="mr-2 inline-flex rounded-xl border border-border/60 bg-card/80 px-3 py-2"
              >
                AS{segment.trim()}
              </span>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-border/70 bg-background/35 p-4">
      <p className="data-label">{label}</p>
      <p className="mt-2 break-all font-mono text-sm text-foreground">{value}</p>
    </div>
  );
}

function SummaryBlock({
  title,
  value,
  description,
}: {
  title: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-3xl border border-border/70 bg-background/35 p-4">
      <p className="data-label">{title}</p>
      <p className="mt-3 font-mono text-sm leading-6 text-foreground">{value}</p>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">{description}</p>
    </div>
  );
}
