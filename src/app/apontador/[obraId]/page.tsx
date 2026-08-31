"use client";

import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { AlertTriangle, ArrowRight, CheckCircle2, ChevronRight, ClipboardList, Lock, Search } from "lucide-react";
import { useFullKitStore } from "@/lib/store";
import { useShallow } from "zustand/react/shallow";
import {
  etapaAtrasada,
  etapaLiberada,
  janelaDatasServicos,
  progressoEtapa,
  servicosDoSubtree,
  situacaoEtapa,
  type ProgressoEtapa,
} from "@/lib/planejamento";
import { cn } from "@/lib/utils";

export default function DashboardApontadorPage() {
  const { obraId } = useParams<{ obraId: string }>();
  const obra = useFullKitStore((s) => s.obras.find((o) => o.id === obraId));
  const etapas = useFullKitStore(useShallow((s) => s.etapas.filter((e) => e.obraId === obraId)));
  const servicos = useFullKitStore((s) => s.servicos);
  const getStatusServico = useFullKitStore((s) => s.getStatusServico);

  if (!obra) return notFound();

  const etapasRaiz = etapas.filter((e) => !e.etapaPaiId).sort((a, b) => a.ordem - b.ordem);

  const progressoPorEtapaId = new Map<string, ProgressoEtapa>();
  etapas.forEach((e) => progressoPorEtapaId.set(e.id, progressoEtapa(e.id, etapas, servicos, getStatusServico)));

  const gargalos = etapasRaiz
    .map((etapa) => {
      const progresso = progressoPorEtapaId.get(etapa.id)!;
      const janela = janelaDatasServicos(servicosDoSubtree(etapa.id, etapas, servicos));
      return { etapa, progresso, atrasada: etapaAtrasada(janela, progresso) };
    })
    .filter((item) => item.atrasada || item.progresso.pendencias > 0);

  const alvoApontarAgora = gargalos[0]?.etapa ?? etapasRaiz[0];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex gap-2.5">
        {alvoApontarAgora ? (
          <Link
            href={`/apontador/${obraId}/etapa/${alvoApontarAgora.id}`}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-[14px] bg-primary text-[14px] font-bold text-primary-foreground"
            style={{ height: 50 }}
          >
            <ClipboardList className="size-[17px]" />
            Apontar agora
          </Link>
        ) : (
          <span className="flex flex-1 items-center justify-center gap-1.5 rounded-[14px] border border-border text-[14px] font-semibold text-muted-foreground" style={{ height: 50 }}>
            Nenhuma etapa cadastrada
          </span>
        )}
        <span className="flex size-[50px] shrink-0 items-center justify-center rounded-[14px] border border-border bg-card text-foreground/70">
          <Search className="size-[19px]" />
        </span>
      </div>

      {gargalos.length > 0 && (
        <div className="flex flex-col gap-2.5">
          <span className="text-[12.5px] font-bold tracking-[0.08em] text-muted-foreground uppercase">
            Precisa de ação
          </span>
          <div className="overflow-hidden rounded-[14px] border border-destructive-tint-border bg-card">
            {gargalos.slice(0, 3).map(({ etapa, progresso, atrasada }, i) => (
              <Link
                key={etapa.id}
                href={`/apontador/${obraId}/etapa/${etapa.id}`}
                className={cn(
                  "flex flex-col gap-1.5 p-4",
                  i > 0 && "border-t border-destructive-tint-border/60"
                )}
              >
                <div className="flex items-center gap-2">
                  <span className="text-[15px] font-bold text-foreground">{etapa.nome}</span>
                  {progresso.pendencias > 0 && (
                    <span className="inline-flex h-5 items-center rounded-full bg-destructive-tint px-2 text-[11px] font-semibold text-destructive-tint-foreground">
                      {progresso.pendencias} pendência{progresso.pendencias === 1 ? "" : "s"}
                    </span>
                  )}
                </div>
                <span className="text-[12.5px] text-muted-foreground">
                  {atrasada ? "Atrasada" : `${progresso.percentual}% concluído`}
                </span>
              </Link>
            ))}
            <Link
              href={`/apontador/${obraId}/etapa/${gargalos[0].etapa.id}`}
              className="flex h-[46px] items-center justify-center gap-1.5 border-t border-destructive-tint-border/60 bg-destructive-tint text-[13.5px] font-bold text-destructive-tint-foreground"
            >
              Abrir FULL KIT
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2.5">
        <span className="text-[12.5px] font-bold tracking-[0.08em] text-muted-foreground uppercase">
          Etapas da obra
        </span>
        {etapasRaiz.length === 0 && (
          <p className="py-4 text-sm text-muted-foreground">Nenhuma etapa cadastrada nesta obra ainda.</p>
        )}
        {etapasRaiz.map((etapa) => {
          const progresso = progressoPorEtapaId.get(etapa.id)!;
          const situacao = situacaoEtapa(progresso);
          const liberada = etapaLiberada(etapa, progressoPorEtapaId);
          return (
            <Link
              key={etapa.id}
              href={`/apontador/${obraId}/etapa/${etapa.id}`}
              className="flex items-center gap-3 rounded-[14px] border border-border bg-card p-3.5"
            >
              <span
                className={cn(
                  "flex size-[38px] shrink-0 items-center justify-center rounded-[10px]",
                  situacao === "nao_liberada" && "bg-destructive-tint text-destructive-tint-foreground",
                  situacao !== "nao_liberada" && !liberada && "bg-[oklch(0.96_0.004_155)] text-muted-foreground",
                  situacao !== "nao_liberada" && liberada && "bg-primary-tint text-primary-tint-foreground"
                )}
              >
                {situacao === "nao_liberada" ? (
                  <AlertTriangle className="size-[17px]" />
                ) : !liberada ? (
                  <Lock className="size-4" />
                ) : (
                  <CheckCircle2 className="size-[17px]" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <span className="block truncate text-[14.5px] font-bold text-foreground">{etapa.nome}</span>
                {liberada ? (
                  <div className="flex items-center gap-2 pt-1">
                    <div className="h-[5px] flex-1 overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn("h-full", situacao === "nao_liberada" ? "bg-destructive" : "bg-primary")}
                        style={{ width: `${progresso.percentual}%` }}
                      />
                    </div>
                    <span className="text-[11.5px] font-semibold text-foreground/70">{progresso.percentual}%</span>
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">Aguardando etapa anterior</span>
                )}
              </div>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
