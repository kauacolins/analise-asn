import { ApiStatus } from "@/components/api-status";
import { CadastrosManager } from "@/components/cadastros-manager";
import { getMitigators, getMonitoredAsns, tryApi } from "@/lib/api";

export default async function CadastrosPage() {
  const [monitoredAsnsResult, mitigatorsResult] = await Promise.all([
    tryApi(() => getMonitoredAsns(), []),
    tryApi(() => getMitigators(), []),
  ]);
  const error = monitoredAsnsResult.error ?? mitigatorsResult.error;

  return (
    <div className="space-y-6">
      <section className="panel panel-body">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="data-label">Configuração de monitoramento</p>
            <h2 className="section-title text-2xl sm:text-3xl">
              Cadastros operacionais
            </h2>
          </div>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            Administre os ASN monitorados e os mitigadores conhecidos para manter
            a coleta útil e a classificação das rotas mais precisa.
          </p>
        </div>
      </section>

      {error ? <ApiStatus message={error} /> : null}

      <CadastrosManager
        monitoredAsns={monitoredAsnsResult.data}
        mitigators={mitigatorsResult.data}
      />
    </div>
  );
}
