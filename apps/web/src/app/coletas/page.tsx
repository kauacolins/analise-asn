import { CollectionRunner } from "@/components/collection-runner";

export default function ColetasPage() {
  return (
    <div className="page-shell">
      <section className="hero-panel px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="data-label">Pipeline operacional</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
              Coletas BGP
            </h1>
          </div>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            Execute uma coleta manual e verifique rapidamente o retorno do
            backend antes de analisar os indicadores no dashboard.
          </p>
        </div>
      </section>

      <CollectionRunner />
    </div>
  );
}
