"use client";

import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { AlertTriangle, Check, ChevronRight, Clock, Lock, MapPin, XCircle } from "lucide-react";
import { useFullKitStore } from "@/lib/store";
import { useShallow } from "zustand/react/shallow";
import {
  etapaAtrasada,
  etapaLiberada,
  janelaDatasServicos,
  predecessorasPendentes,
  progressoEtapa,
  servicosDoSubtree,
  situacaoEtapa,
  type ProgressoEtapa,
  type SituacaoEtapa,
} from "@/lib/planejamento";
import { SituacaoEtapaBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const CORES_SITUACAO: Record<SituacaoEtapa, string> = {
  nao_iniciada: "bg-muted-foreground/40",
  em_andamento: "bg-primary/40",
  nao_liberada: "bg-destructive",
  liberada: "bg-primary/70",
  concluida: "bg-primary",
};

const ROTULOS_SITUACAO: Record<SituacaoEtapa, (total: number) => string> = {
  nao_iniciada: (n) => (n === 1 ? "não iniciada" : "não iniciadas"),
  em_andamento: () => "em andamento",
  nao_liberada: (n) => (n === 1 ? "não liberada" : "não liberadas"),
  liberada: (n) => (n === 1 ? "liberada" : "liberadas"),
  concluida: (n) => (n === 1 ? "concluída" : "concluídas"),
};

const ICONE_SITUACAO: Record<SituacaoEtapa, React.ReactNode> = {
  nao_iniciada: <Lock className="size-[13px]" />,
  em_andamento: <Clock className="size-[13px]" />,
  nao_liberada: <AlertTriangle className="size-[13px]" />,
  liberada: <Check className="size-[13px]" />,
  concluida: <Check className="size-[13px]" />,
};

const ESTILO_MARCADOR: Record<SituacaoEtapa, string> = {
  nao_iniciada: "bg-card border border-border text-muted-foreground",
  em_andamento: "bg-primary-tint text-primary-tint-foreground",
  nao_liberada: "bg-destructive-tint text-destructive-tint-foreground border border-destructive-tint-border",
  liberada: "bg-primary text-primary-foreground",
  concluida: "bg-primary text-primary-foreground",
};

export default function PainelGestorPage() {
  const { obraId } = useParams<{ obraId: string }>();
  const obra = useFullKitStore((s) => s.obras.find((o) => o.id === obraId));
  const etapas = useFullKitStore(useShallow((s) => s.etapas.filter((e) => e.obraId === obraId)));
  const servicos = useFullKitStore((s) => s.servicos);
  const getStatusServico = useFullKitStore((s) => s.getStatusServico);

  if (!obra) return notFound();

  const etapasRaiz = etapas.filter((e) => !e.etapaPaiId).sort((a, b) => a.ordem - b.ordem);

  const progressoPorEtapaId = new Map<string, ProgressoEtapa>();
  etapas.forEach((etapa) => {
    progressoPorEtapaId.set(etapa.id, progressoEtapa(etapa.id, etapas, servicos, getStatusServico));
  });

  let concluidaTotal = 0;
  let totalGeral = 0;
  progressoPorEtapaId.forEach((p) => {
    concluidaTotal += p.concluida;
    totalGeral += p.total;
  });
  const percentualGeral = totalGeral > 0 ? Math.round((concluidaTotal / totalGeral) * 100) : 0;

  const etapasComStatus = etapasRaiz.map((etapa) => {
    const progresso = progressoPorEtapaId.get(etapa.id)!;
    const janela = janelaDatasServicos(servicosDoSubtree(etapa.id, etapas, servicos));
    const liberada = etapaLiberada(etapa, progressoPorEtapaId);
    const situacao = situacaoEtapa(progresso);
    const atrasada = etapaAtrasada(janela, progresso);
    const pendentes = predecessorasPendentes(etapa, etapas, progressoPorEtapaId);
    return { etapa, progresso, janela, liberada, situacao, atrasada, pendentes };
  });

  const contagem = (situacao: SituacaoEtapa) =>
    etapasComStatus.filter((e) => e.situacao === situacao).length;
  const resumo: { situacao: SituacaoEtapa; total: number }[] = (
    ["nao_iniciada", "em_andamento", "nao_liberada", "liberada", "concluida"] as const
  )
    .map((situacao) => ({ situacao, total: contagem(situacao) }))
    .filter((item) => item.total > 0);
  const nBloqueadas = etapasComStatus.filter((e) => !e.liberada).length;
  const totalPendencias = etapasComStatus.reduce((acc, e) => acc + e.progresso.pendencias, 0);

  return (
    <div className="flex flex-col gap-5.5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold tracking-[0.08em] text-primary uppercase">
            Painel do gestor
          </span>
          <h1 className="text-[26px] font-bold tracking-tight text-foreground">{obra.nome}</h1>
          {obra.endereco && (
            <p className="flex items-center gap-1.5 text-[13.5px] text-muted-foreground">
              <MapPin className="size-3.5" />
              {obra.endereco}
            </p>
          )}
        </div>
        <div className="flex items-center gap-4.5 rounded-[14px] border border-border bg-card px-5.5 py-4">
          <div className="flex flex-col gap-0.5">
            <span className="text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
              Avanço físico
            </span>
            <span className="text-[32px] leading-[1.05] font-bold tracking-tight tabular-nums text-primary">
              {percentualGeral}%
            </span>
          </div>
          <span className="h-9.5 w-px bg-border" />
          <div className="flex flex-col gap-0.5">
            <span className="text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
              Pendências
            </span>
            <span className="text-[32px] leading-[1.05] font-bold tracking-tight tabular-nums text-destructive">
              {totalPendencias}
            </span>
          </div>
          <span className="h-9.5 w-px bg-border" />
          <div className="flex flex-col gap-0.5">
            <span className="text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
              Serviços
            </span>
            <span className="text-[32px] leading-[1.05] font-bold tracking-tight tabular-nums text-foreground">
              {concluidaTotal}/{totalGeral}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {resumo.map(({ situacao, total }) => (
          <span
            key={situacao}
            className="inline-flex h-[30px] items-center gap-1.5 rounded-full border border-border bg-card px-3.5 text-[12.5px] font-semibold text-foreground/80"
          >
            <span className={cn("size-[7px] rounded-full", CORES_SITUACAO[situacao])} />
            {total} {ROTULOS_SITUACAO[situacao](total)}
          </span>
        ))}
        {nBloqueadas > 0 && (
          <span className="inline-flex h-[30px] items-center gap-1.5 rounded-full border border-border bg-card px-3.5 text-[12.5px] font-semibold text-foreground/80">
            <span className="size-[7px] rounded-full bg-muted-foreground/40" />
            {nBloqueadas} bloqueada{nBloqueadas === 1 ? "" : "s"} por predecessora
          </span>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold tracking-tight text-foreground">Fluxo executivo</h2>
          <span className="text-[12.5px] text-muted-foreground">
            Ordem de precedência · {etapasComStatus.length} etapa{etapasComStatus.length === 1 ? "" : "s"} raiz
          </span>
        </div>

        {etapasComStatus.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhuma etapa cadastrada nesta obra.</p>
        )}

        <div className="flex flex-col gap-2.5">
          {etapasComStatus.map(({ etapa, situacao, liberada, atrasada, pendentes, progresso }, index) => {
            const servicosDaEtapa = servicosDoSubtree(etapa.id, etapas, servicos);
            const naoLiberado = servicosDaEtapa.find(
              (sv) => !sv.concluidoEm && getStatusServico(sv.id).status === "nao_liberado"
            );
            const pendenciasDoServico = naoLiberado ? getStatusServico(naoLiberado.id).pendencias : [];
            const ultimaLinha = index === etapasComStatus.length - 1;

            return (
              <div key={etapa.id} className="flex gap-3.5">
                <div className="flex w-[26px] shrink-0 flex-col items-center pt-5">
                  <span
                    className={cn(
                      "flex size-[26px] items-center justify-center rounded-full",
                      ESTILO_MARCADOR[situacao]
                    )}
                  >
                    {ICONE_SITUACAO[situacao]}
                  </span>
                  {!ultimaLinha && <span className="mt-1.5 w-0.5 flex-1 bg-border" />}
                </div>

                <div
                  className={cn(
                    "flex-1 overflow-hidden rounded-[14px] border bg-card",
                    situacao === "nao_liberada" ? "border-destructive-tint-border" : "border-border"
                  )}
                >
                  <Link
                    href={`/gestao/${obraId}/etapa/${etapa.id}`}
                    className="flex items-center gap-4.5 p-5 hover:bg-[oklch(0.985_0.004_155)]"
                  >
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[15.5px] font-bold tracking-tight text-foreground">{etapa.nome}</span>
                        <SituacaoEtapaBadge situacao={situacao} />
                        {!liberada && <Badge variant="secondary">Bloqueada</Badge>}
                        {atrasada && (
                          <Badge variant="destructive">
                            <Clock data-icon="inline-start" className="size-3" />
                            Atrasada
                          </Badge>
                        )}
                      </div>
                      {!liberada && pendentes.length > 0 ? (
                        <p className="text-xs text-muted-foreground">
                          Aguardando: {pendentes.map((p) => p.nome).join(", ")}
                        </p>
                      ) : servicosDaEtapa.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {servicosDaEtapa.map((servico) => {
                            const concluida = !!servico.concluidoEm;
                            const status = getStatusServico(servico.id).status;
                            return (
                              <span
                                key={servico.id}
                                className="inline-flex h-6 items-center gap-1.5 rounded-full border border-border bg-[oklch(0.98_0.003_155)] px-2.5 text-xs font-medium text-foreground/70"
                              >
                                <span
                                  className={cn(
                                    "size-1.5 shrink-0 rounded-full",
                                    concluida && "bg-primary",
                                    !concluida && status === "liberado" && "bg-primary/40",
                                    !concluida && status === "nao_liberado" && "bg-destructive",
                                    !concluida && status === "nao_iniciado" && "bg-muted-foreground/40"
                                  )}
                                />
                                {servico.nome}
                              </span>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">Nenhum serviço notável cadastrado.</p>
                      )}
                    </div>
                    <div className="hidden w-[140px] shrink-0 flex-col gap-1.5 sm:flex">
                      <div className="flex items-center justify-between text-[11.5px] font-semibold text-muted-foreground">
                        <span>Avanço</span>
                        <span className="tabular-nums text-foreground">{progresso.percentual}%</span>
                      </div>
                      <div className="h-[5px] overflow-hidden rounded-full bg-muted">
                        <div
                          className={cn(
                            "h-full rounded-full",
                            situacao === "nao_liberada" ? "bg-destructive" : "bg-primary"
                          )}
                          style={{ width: `${progresso.percentual}%` }}
                        />
                      </div>
                    </div>
                    <ChevronRight className="size-[17px] shrink-0 text-muted-foreground" />
                  </Link>

                  {situacao === "nao_liberada" && pendenciasDoServico.length > 0 && (
                    <div className="flex items-center gap-2.5 border-t border-destructive-tint-border/60 bg-destructive-tint px-5 py-2.5">
                      <XCircle className="size-3.5 shrink-0 text-destructive" />
                      <span className="min-w-0 flex-1 truncate text-[12.5px] text-destructive-tint-foreground">
                        {pendenciasDoServico.map((p) => p.texto).join(" · ")}
                      </span>
                      <Link
                        href={`/gestao/${obraId}/servico/${naoLiberado!.id}`}
                        className="inline-flex h-[26px] shrink-0 items-center gap-1.5 rounded-lg bg-destructive px-2.5 text-xs font-semibold text-white"
                      >
                        Abrir FULL KIT
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
