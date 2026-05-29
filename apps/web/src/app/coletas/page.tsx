import { CollectionRunner } from "@/components/collection-runner";

export default function ColetasPage() {
  return (
    <div className="space-y-6">
      <section className="panel panel-body">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="data-label">Pipeline operacional</p>
            <h2 className="section-title text-2xl sm:text-3xl">
              Execução de coleta
            </h2>
          </div>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            Acione a coleta manualmente quando precisar validar novas entradas,
            investigar um pico recente ou conferir se a integração com o backend
            está respondendo corretamente.
          </p>
        </div>
      </section>

      <CollectionRunner />
    </div>
  );
}
