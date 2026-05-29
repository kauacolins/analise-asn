import Link from "next/link";

import { ApiStatus } from "@/components/api-status";
import { FilterBar } from "@/components/filter-bar";
import { getRoutes, pickRouteFilters, tryApi } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import { SearchParams } from "@/lib/types";

type EventosPageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function EventosPage({ searchParams }: EventosPageProps) {
  const params = await searchParams;
  const filters = pickRouteFilters(params);
  const offset = Number(Array.isArray(params.offset) ? params.offset[0] : params.offset ?? "0");
  const limit = Number(Array.isArray(params.limit) ? params.limit[0] : params.limit ?? "25");
  const { data: routes, error } = await tryApi(
    () => getRoutes({ ...filters, offset, limit }),
    [],
  );

  return (
    <div className="space-y-6">
      <section className="panel panel-body">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="data-label">Triagem operacional</p>
            <h2 className="section-title text-2xl sm:text-3xl">Fila de eventos BGP</h2>
          </div>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            Filtre eventos por período, ASN, mitigação ou padrão textual e avance
            para o detalhe da rota quando algo merecer investigação.
          </p>
        </div>
      </section>

      <FilterBar action="/eventos" filters={filters} />

      {error ? <ApiStatus message={error} /> : null}

      <section className="table-shell overflow-x-auto">
        <div className="panel-header">
          <div>
            <p className="data-label">Eventos recentes</p>
            <h3 className="section-title">{routes.length} itens retornados</h3>
          </div>
        </div>
        <table className="min-w-full text-sm">
          <thead className="bg-background/30 text-left text-muted-foreground">
            <tr>
              <th className="px-5 py-4 font-medium">Status</th>
              <th className="px-5 py-4 font-medium">Prefixo</th>
              <th className="px-5 py-4 font-medium">ASN origem</th>
              <th className="px-5 py-4 font-medium">Mitigador</th>
              <th className="px-5 py-4 font-medium">AS-PATH</th>
              <th className="px-5 py-4 font-medium">Coletado em</th>
              <th className="px-5 py-4 font-medium text-right">Ação</th>
            </tr>
          </thead>
          <tbody>
            {routes.map((route) => (
              <tr key={route.id} className="border-t border-border/60">
                <td className="px-5 py-4">
                  <span
                    className={`threat-badge ${
                      route.is_mitigated ? "threat-warning" : "threat-normal"
                    }`}
                  >
                    {route.is_mitigated ? "Mitigado" : "Sem mitigação"}
                  </span>
                </td>
                <td className="px-5 py-4 font-mono text-foreground">{route.prefixo}</td>
                <td className="px-5 py-4 font-mono text-muted-foreground">
                  {route.asn_origem ? `AS${route.asn_origem}` : "-"}
                </td>
                <td className="px-5 py-4 font-mono text-muted-foreground">
                  {route.asn_mitigador ? `AS${route.asn_mitigador}` : "-"}
                </td>
                <td className="max-w-[26rem] px-5 py-4 font-mono text-xs text-muted-foreground">
                  <span className="line-clamp-2">{route.as_path}</span>
                </td>
                <td className="px-5 py-4 text-muted-foreground">
                  {formatDateTime(route.collected_at)}
                </td>
                <td className="px-5 py-4 text-right">
                  <Link
                    href={`/eventos/${route.id}`}
                    className="inline-flex items-center rounded-xl border border-border/70 px-3 py-2 font-medium text-foreground transition-colors hover:bg-accent"
                  >
                    Ver detalhe
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="flex items-center justify-between">
        <a
          href={`/eventos?${new URLSearchParams({
            ...Object.fromEntries(
              Object.entries(filters).flatMap(([key, value]) =>
                value ? [[key, value]] : [],
              ),
            ),
            limit: String(limit),
            offset: String(Math.max(offset - limit, 0)),
          }).toString()}`}
          className="inline-flex h-10 items-center justify-center rounded-xl border border-border/70 px-4 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          Página anterior
        </a>
        <a
          href={`/eventos?${new URLSearchParams({
            ...Object.fromEntries(
              Object.entries(filters).flatMap(([key, value]) =>
                value ? [[key, value]] : [],
              ),
            ),
            limit: String(limit),
            offset: String(offset + limit),
          }).toString()}`}
          className="inline-flex h-10 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          Próxima página
        </a>
      </section>
    </div>
  );
}
