import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  Apontamento,
  Etapa,
  Obra,
  Pergunta,
  Resposta,
  ServicoNotavel,
  StatusResultado,
  TipoPergunta,
} from "@/lib/types";
import { calcularStatus } from "@/lib/status";
import { SEED } from "@/lib/seed";

function id(): string {
  return crypto.randomUUID();
}

function nowIso(): string {
  return new Date().toISOString();
}

interface FullKitState {
  obras: Obra[];
  etapas: Etapa[];
  servicos: ServicoNotavel[];
  perguntas: Pergunta[];
  apontamentos: Apontamento[];

  addObra: (nome: string, endereco: string) => Obra;
  updateObra: (id: string, patch: Partial<Omit<Obra, "id">>) => void;
  removeObra: (id: string) => void;

  addEtapa: (obraId: string, nome: string, etapaPaiId?: string) => Etapa;
  updateEtapa: (id: string, patch: Partial<Omit<Etapa, "id" | "obraId">>) => void;
  removeEtapa: (id: string) => void;
  reorderEtapa: (id: string, direcao: "subir" | "descer") => void;

  addServico: (etapaId: string, nome: string) => ServicoNotavel;
  updateServico: (id: string, patch: Partial<Omit<ServicoNotavel, "id" | "etapaId">>) => void;
  removeServico: (id: string) => void;
  reorderServico: (id: string, direcao: "subir" | "descer") => void;

  addPergunta: (servicoId: string, texto: string, tipo: TipoPergunta, obrigatoria: boolean) => Pergunta;
  updatePergunta: (id: string, patch: Partial<Omit<Pergunta, "id" | "servicoId">>) => void;
  removePergunta: (id: string) => void;
  reorderPergunta: (id: string, direcao: "subir" | "descer") => void;

  salvarApontamento: (input: {
    servicoId: string;
    respostas: Resposta[];
    fotos: string[];
    observacoes: string;
    autor: string;
  }) => Apontamento;

  getUltimoApontamento: (servicoId: string) => Apontamento | undefined;
  getStatusServico: (servicoId: string) => StatusResultado;
}

function reorder<T extends { id: string; ordem: number }>(
  items: T[],
  itemId: string,
  direcao: "subir" | "descer"
): T[] {
  const sorted = [...items].sort((a, b) => a.ordem - b.ordem);
  const index = sorted.findIndex((i) => i.id === itemId);
  if (index === -1) return items;
  const swapWith = direcao === "subir" ? index - 1 : index + 1;
  if (swapWith < 0 || swapWith >= sorted.length) return items;
  const a = sorted[index];
  const b = sorted[swapWith];
  const ordemA = a.ordem;
  a.ordem = b.ordem;
  b.ordem = ordemA;
  return sorted;
}

export const useFullKitStore = create<FullKitState>()(
  persist(
    (set, get) => ({
      obras: SEED.obras,
      etapas: SEED.etapas,
      servicos: SEED.servicos,
      perguntas: SEED.perguntas,
      apontamentos: SEED.apontamentos,

      addObra: (nome, endereco) => {
        const obra: Obra = { id: id(), nome, endereco };
        set((s) => ({ obras: [...s.obras, obra] }));
        return obra;
      },
      updateObra: (obraId, patch) =>
        set((s) => ({
          obras: s.obras.map((o) => (o.id === obraId ? { ...o, ...patch } : o)),
        })),
      removeObra: (obraId) =>
        set((s) => {
          const etapaIds = new Set(s.etapas.filter((e) => e.obraId === obraId).map((e) => e.id));
          const servicoIds = new Set(s.servicos.filter((sv) => etapaIds.has(sv.etapaId)).map((sv) => sv.id));
          return {
            obras: s.obras.filter((o) => o.id !== obraId),
            etapas: s.etapas.filter((e) => e.obraId !== obraId),
            servicos: s.servicos.filter((sv) => !etapaIds.has(sv.etapaId)),
            perguntas: s.perguntas.filter((p) => !servicoIds.has(p.servicoId)),
            apontamentos: s.apontamentos.filter((a) => !servicoIds.has(a.servicoId)),
          };
        }),

      addEtapa: (obraId, nome, etapaPaiId) => {
        const irmas = get().etapas.filter((e) => e.obraId === obraId && e.etapaPaiId === etapaPaiId);
        const ordem = irmas.length > 0 ? Math.max(...irmas.map((e) => e.ordem)) + 1 : 1;
        const anterior = irmas.find((e) => e.ordem === ordem - 1);
        const etapa: Etapa = {
          id: id(),
          obraId,
          etapaPaiId,
          nome,
          ordem,
          predecessorasIds: anterior ? [anterior.id] : [],
        };
        set((s) => ({ etapas: [...s.etapas, etapa] }));
        return etapa;
      },
      updateEtapa: (etapaId, patch) =>
        set((s) => ({
          etapas: s.etapas.map((e) => (e.id === etapaId ? { ...e, ...patch } : e)),
        })),
      removeEtapa: (etapaId) =>
        set((s) => {
          const idsParaRemover = new Set<string>();
          const coletar = (alvoId: string) => {
            idsParaRemover.add(alvoId);
            s.etapas.filter((e) => e.etapaPaiId === alvoId).forEach((e) => coletar(e.id));
          };
          coletar(etapaId);

          const servicoIds = new Set(
            s.servicos.filter((sv) => idsParaRemover.has(sv.etapaId)).map((sv) => sv.id)
          );

          return {
            etapas: s.etapas
              .filter((e) => !idsParaRemover.has(e.id))
              .map((e) => ({
                ...e,
                predecessorasIds: e.predecessorasIds.filter((pid) => !idsParaRemover.has(pid)),
              })),
            servicos: s.servicos.filter((sv) => !idsParaRemover.has(sv.etapaId)),
            perguntas: s.perguntas.filter((p) => !servicoIds.has(p.servicoId)),
            apontamentos: s.apontamentos.filter((a) => !servicoIds.has(a.servicoId)),
          };
        }),
      reorderEtapa: (etapaId, direcao) =>
        set((s) => {
          const etapa = s.etapas.find((e) => e.id === etapaId);
          if (!etapa) return s;
          const mesmoGrupo = (e: Etapa) => e.obraId === etapa.obraId && e.etapaPaiId === etapa.etapaPaiId;
          const irmas = s.etapas.filter(mesmoGrupo);
          const reordenadas = reorder(irmas, etapaId, direcao);
          const outras = s.etapas.filter((e) => !mesmoGrupo(e));
          return { etapas: [...outras, ...reordenadas] };
        }),

      addServico: (etapaId, nome) => {
        const servicosDaEtapa = get().servicos.filter((sv) => sv.etapaId === etapaId);
        const ordem =
          servicosDaEtapa.length > 0 ? Math.max(...servicosDaEtapa.map((sv) => sv.ordem)) + 1 : 1;
        const servico: ServicoNotavel = { id: id(), etapaId, nome, ordem };
        set((s) => ({ servicos: [...s.servicos, servico] }));
        return servico;
      },
      updateServico: (servicoId, patch) =>
        set((s) => ({
          servicos: s.servicos.map((sv) => (sv.id === servicoId ? { ...sv, ...patch } : sv)),
        })),
      removeServico: (servicoId) =>
        set((s) => ({
          servicos: s.servicos.filter((sv) => sv.id !== servicoId),
          perguntas: s.perguntas.filter((p) => p.servicoId !== servicoId),
          apontamentos: s.apontamentos.filter((a) => a.servicoId !== servicoId),
        })),
      reorderServico: (servicoId, direcao) =>
        set((s) => {
          const servico = s.servicos.find((sv) => sv.id === servicoId);
          if (!servico) return s;
          const daEtapa = s.servicos.filter((sv) => sv.etapaId === servico.etapaId);
          const reordenados = reorder(daEtapa, servicoId, direcao);
          const outros = s.servicos.filter((sv) => sv.etapaId !== servico.etapaId);
          return { servicos: [...outros, ...reordenados] };
        }),

      addPergunta: (servicoId, texto, tipo, obrigatoria) => {
        const perguntasDoServico = get().perguntas.filter((p) => p.servicoId === servicoId);
        const ordem =
          perguntasDoServico.length > 0 ? Math.max(...perguntasDoServico.map((p) => p.ordem)) + 1 : 1;
        const pergunta: Pergunta = { id: id(), servicoId, texto, tipo, obrigatoria, ordem };
        set((s) => ({ perguntas: [...s.perguntas, pergunta] }));
        return pergunta;
      },
      updatePergunta: (perguntaId, patch) =>
        set((s) => ({
          perguntas: s.perguntas.map((p) => (p.id === perguntaId ? { ...p, ...patch } : p)),
        })),
      removePergunta: (perguntaId) =>
        set((s) => ({ perguntas: s.perguntas.filter((p) => p.id !== perguntaId) })),
      reorderPergunta: (perguntaId, direcao) =>
        set((s) => {
          const pergunta = s.perguntas.find((p) => p.id === perguntaId);
          if (!pergunta) return s;
          const doServico = s.perguntas.filter((p) => p.servicoId === pergunta.servicoId);
          const reordenadas = reorder(doServico, perguntaId, direcao);
          const outras = s.perguntas.filter((p) => p.servicoId !== pergunta.servicoId);
          return { perguntas: [...outras, ...reordenadas] };
        }),

      salvarApontamento: ({ servicoId, respostas, fotos, observacoes, autor }) => {
        const apontamento: Apontamento = {
          id: id(),
          servicoId,
          respostas,
          fotos,
          observacoes,
          autor,
          criadoEm: nowIso(),
        };
        set((s) => ({ apontamentos: [...s.apontamentos, apontamento] }));
        return apontamento;
      },

      getUltimoApontamento: (servicoId) => {
        const doServico = get().apontamentos.filter((a) => a.servicoId === servicoId);
        if (doServico.length === 0) return undefined;
        return doServico.reduce((mais, atual) => (atual.criadoEm > mais.criadoEm ? atual : mais));
      },

      getStatusServico: (servicoId) => {
        const perguntas = get().perguntas.filter((p) => p.servicoId === servicoId);
        const ultimo = get().getUltimoApontamento(servicoId);
        return calcularStatus(perguntas, ultimo);
      },
    }),
    {
      name: "fullkit-mock-store",
      version: 3,
      migrate: (persistedState, version) => {
        const state = persistedState as {
          etapas?: Array<Partial<Etapa> & { id: string }>;
          apontamentos?: unknown;
          elementos?: unknown;
        };

        if (version < 2) {
          state.etapas = (state.etapas ?? []).map((e) => ({
            ...e,
            predecessorasIds: e.predecessorasIds ?? [],
          }));
        }

        if (version < 3) {
          delete state.elementos;
          state.apontamentos = [];
        }

        return state;
      },
    }
  )
);
