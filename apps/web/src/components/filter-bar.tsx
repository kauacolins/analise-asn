import { RouteFilters } from "@/lib/types";

type FilterBarProps = {
  action: string;
  filters: RouteFilters;
};

export function FilterBar({ action, filters }: FilterBarProps) {
  return (
    <form action={action} className="panel panel-body">
      <div className="dashboard-grid md:grid-cols-2 xl:grid-cols-6">
        <label className="flex flex-col gap-2">
          <span className="data-label">Início</span>
          <input
            className="input-shell h-10 rounded-xl border px-3 text-sm"
            type="datetime-local"
            name="start"
            defaultValue={filters.start ?? ""}
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="data-label">Fim</span>
          <input
            className="input-shell h-10 rounded-xl border px-3 text-sm"
            type="datetime-local"
            name="end"
            defaultValue={filters.end ?? ""}
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="data-label">Prefixo</span>
          <input
            className="input-shell h-10 rounded-xl border px-3 text-sm"
            type="text"
            name="prefix"
            placeholder="203.0.113.0/24"
            defaultValue={filters.prefix ?? ""}
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="data-label">ASN origem</span>
          <input
            className="input-shell h-10 rounded-xl border px-3 text-sm"
            type="number"
            name="origin_asn"
            placeholder="64512"
            defaultValue={filters.origin_asn ?? ""}
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="data-label">ASN mitigador</span>
          <input
            className="input-shell h-10 rounded-xl border px-3 text-sm"
            type="number"
            name="mitigator_asn"
            placeholder="13335"
            defaultValue={filters.mitigator_asn ?? ""}
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="data-label">Mitigação</span>
          <select
            className="input-shell h-10 rounded-xl border px-3 text-sm"
            name="is_mitigated"
            defaultValue={filters.is_mitigated ?? ""}
          >
            <option value="">Todos</option>
            <option value="true">Mitigados</option>
            <option value="false">Não mitigados</option>
          </select>
        </label>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          className="inline-flex h-10 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          type="submit"
        >
          Aplicar filtros
        </button>
        <a
          className="inline-flex h-10 items-center justify-center rounded-xl border border-border/70 px-4 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          href={action}
        >
          Limpar
        </a>
      </div>
    </form>
  );
}
