"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  createMitigator,
  createMonitoredAsn,
} from "@/lib/api";
import { Mitigator, MonitoredAsn } from "@/lib/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type CadastrosManagerProps = {
  monitoredAsns: MonitoredAsn[];
  mitigators: Mitigator[];
};

export function CadastrosManager({
  monitoredAsns,
  mitigators,
}: CadastrosManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function handleSubmit(
    type: "monitorado" | "mitigador",
    formData: FormData,
  ) {
    const nome = String(formData.get("nome") ?? "").trim();
    const asn = Number(formData.get("asn"));

    if (!nome || Number.isNaN(asn)) {
      setMessage("Preencha nome e ASN corretamente.");
      return;
    }

    startTransition(async () => {
      try {
        if (type === "monitorado") {
          await createMonitoredAsn({ nome, asn });
        } else {
          await createMitigator({ nome, asn });
        }

        setMessage("Cadastro realizado com sucesso.");
        router.refresh();
      } catch (error) {
        setMessage(
          error instanceof Error ? error.message : "Falha ao salvar cadastro.",
        );
      }
    });
  }

  return (
    <Tabs defaultValue="monitorados" className="gap-4">
      <TabsList variant="line" className="w-full justify-start rounded-2xl bg-card/60 p-2">
        <TabsTrigger value="monitorados">ASN monitorados</TabsTrigger>
        <TabsTrigger value="mitigadores">Mitigadores</TabsTrigger>
      </TabsList>

      {message ? (
        <div className="threat-badge threat-warning w-fit normal-case tracking-normal">
          {message}
        </div>
      ) : null}

      <TabsContent value="monitorados" className="space-y-4">
        <CadastroForm
          title="Novo ASN monitorado"
          description="Amplie o escopo da coleta com novos alvos de observação."
          pending={isPending}
          onSubmit={(formData) => handleSubmit("monitorado", formData)}
        />
        <CadastroList
          title="ASN monitorados ativos"
          items={monitoredAsns.map((item) => ({
            title: item.nome,
            subtitle: `AS${item.asn}`,
          }))}
        />
      </TabsContent>

      <TabsContent value="mitigadores" className="space-y-4">
        <CadastroForm
          title="Novo mitigador"
          description="Cadastre ASN reconhecidos como mitigadores para enriquecer a análise."
          pending={isPending}
          onSubmit={(formData) => handleSubmit("mitigador", formData)}
        />
        <CadastroList
          title="Mitigadores conhecidos"
          items={mitigators.map((item) => ({
            title: item.nome,
            subtitle: `AS${item.asn}`,
          }))}
        />
      </TabsContent>
    </Tabs>
  );
}

function CadastroForm({
  title,
  description,
  pending,
  onSubmit,
}: {
  title: string;
  description: string;
  pending: boolean;
  onSubmit: (formData: FormData) => void;
}) {
  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <p className="data-label">Cadastro</p>
          <h2 className="section-title">{title}</h2>
        </div>
        <p className="max-w-xl text-sm text-muted-foreground">{description}</p>
      </div>
      <form
        action={onSubmit}
        className="panel-body grid gap-4 md:grid-cols-[1.4fr_1fr_auto]"
      >
        <input
          className="input-shell h-11 rounded-2xl border px-4 text-sm"
          type="text"
          name="nome"
          placeholder="Nome amigável"
        />
        <input
          className="input-shell h-11 rounded-2xl border px-4 text-sm"
          type="number"
          name="asn"
          placeholder="ASN"
        />
        <button
          className="inline-flex h-11 items-center justify-center rounded-2xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
          type="submit"
          disabled={pending}
        >
          {pending ? "Salvando..." : "Salvar"}
        </button>
      </form>
    </section>
  );
}

function CadastroList({
  title,
  items,
}: {
  title: string;
  items: Array<{ title: string; subtitle: string }>;
}) {
  return (
    <section className="table-shell">
      <div className="panel-header border-b-0">
        <div>
          <p className="data-label">Inventário</p>
          <h2 className="section-title">{title}</h2>
        </div>
      </div>
      <div className="grid gap-px bg-border/60">
        {items.map((item) => (
          <div
            key={`${item.title}-${item.subtitle}`}
            className="flex items-center justify-between bg-card/90 px-5 py-4"
          >
            <span className="font-medium text-foreground">{item.title}</span>
            <span className="font-mono text-sm text-muted-foreground">
              {item.subtitle}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
