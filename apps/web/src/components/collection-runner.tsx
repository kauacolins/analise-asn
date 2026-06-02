"use client";

import { useState, useTransition } from "react";

import { runCollection } from "@/lib/api";
import { CollectorRunResponse } from "@/lib/types";

export function CollectionRunner() {
  const [result, setResult] = useState<CollectorRunResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleRun() {
    setError(null);

    startTransition(async () => {
      try {
        const response = await runCollection();
        setResult(response);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Falha ao executar coleta.");
      }
    });
  }

  return (
    <section className="monitor-card">
      <div className="panel-header">
        <div>
          <p className="data-label">Operacao</p>
          <h2 className="section-title">Executar coleta manual</h2>
        </div>
        <button
          className="primary-action h-11 disabled:opacity-60"
          type="button"
          onClick={handleRun}
          disabled={isPending}
        >
          {isPending ? "Coletando..." : "Rodar coleta"}
        </button>
      </div>

      <div className="panel-body grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <div className="rounded-lg border border-border/70 bg-background/50 p-5">
          <p className="data-label">Objetivo</p>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            Dispara a coleta imediatamente sem depender do agendamento. Ideal
            para validar ASN monitorados, investigar um aumento recente de
            eventos ou confirmar se a pipeline esta integra.
          </p>
          {error ? (
            <div className="mt-4 threat-badge threat-critical w-fit normal-case tracking-normal">
              {error}
            </div>
          ) : null}
        </div>

        <div className="rounded-lg border border-border/70 bg-background/50 p-5">
          <p className="data-label">Ultimo retorno</p>
          {result ? (
            <div className="mt-4 grid gap-3 text-sm">
              <Metric label="ASN monitorados" value={result.monitored_asns} />
              <Metric label="Prefixos vistos" value={result.prefixes_seen} />
              <Metric label="Rotas salvas" value={result.routes_saved} />
              <Metric label="Rotas mitigadas" value={result.mitigated_routes} />
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">
              Ainda nao ha execucao manual nesta sessao.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border/70 bg-card/70 px-4 py-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono font-semibold text-foreground">{value}</span>
    </div>
  );
}
