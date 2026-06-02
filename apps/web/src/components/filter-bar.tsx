import { RouteFilters } from "@/lib/types";

type FilterBarProps = {
  action: string;
  filters: RouteFilters;
};

export function FilterBar({ action, filters }: FilterBarProps) {
  return (
    <form action={action} className="filter-panel">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="data-label">Filtros da API</p>
          <h2 className="section-title">Janela de analise</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button className="primary-action" type="submit">
            Aplicar filtros
          </button>
          <a className="secondary-action" href={action}>
            Limpar
          </a>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-6">
        <Field label="Inicio" name="start" type="datetime-local" value={filters.start} />
        <Field label="Fim" name="end" type="datetime-local" value={filters.end} />
        <Field
          label="Prefixo"
          name="prefix"
          placeholder="203.0.113.0/24"
          value={filters.prefix}
        />
        <Field
          label="ASN origem"
          name="origin_asn"
          type="number"
          placeholder="64512"
          value={filters.origin_asn}
        />
        <Field
          label="ASN mitigador"
          name="mitigator_asn"
          type="number"
          placeholder="13335"
          value={filters.mitigator_asn}
        />

        <label className="flex flex-col gap-2">
          <span className="data-label">Mitigacao</span>
          <select
            className="field-control"
            name="is_mitigated"
            defaultValue={filters.is_mitigated ?? ""}
          >
            <option value="">Todos</option>
            <option value="true">Mitigados</option>
            <option value="false">Nao mitigados</option>
          </select>
        </label>
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-3">
        <Field
          label="Origem da coleta"
          name="source_id"
          placeholder="source_id"
          value={filters.source_id}
        />
        <Field
          label="Community contem"
          name="community_contains"
          placeholder="65000:100"
          value={filters.community_contains}
        />
        <Field
          label="AS-PATH contem"
          name="as_path_contains"
          placeholder="64512"
          value={filters.as_path_contains}
        />
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  placeholder,
  type = "text",
  value,
}: {
  label: string;
  name: string;
  placeholder?: string;
  type?: string;
  value?: string;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="data-label">{label}</span>
      <input
        className="field-control"
        type={type}
        name={name}
        placeholder={placeholder}
        defaultValue={value ?? ""}
      />
    </label>
  );
}
