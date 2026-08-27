import { create } from "zustand";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase/client";
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
import { descendentes } from "@/lib/planejamento";
import { planejarReplicacao } from "@/lib/replicacao";
import { nomeDuplicado } from "@/lib/utils";

const ETAPA_SELECT = "id, obraId:obra_id, etapaPaiId:etapa_pai_id, nome, ordem, predecessorasIds:predecessoras_ids";
const SERVICO_SELECT =
  "id, etapaId:etapa_id, nome, ordem, dataInicioPrevista:data_inicio_prevista, dataFimPrevista:data_fim_prevista, concluidoEm:concluido_em";
const PERGUNTA_SELECT = "id, servicoId:servico_id, texto, tipo, obrigatoria, ordem";
const APONTAMENTO_SELECT = "id, servicoId:servico_id, respostas, fotos, observacoes, autor, criadoEm:criado_em";

function normalizarEtapa(row: Etapa): Etapa {
  return { ...row, etapaPaiId: row.etapaPaiId ?? undefined };
}

function normalizarServico(row: ServicoNotavel): ServicoNotavel {
  return {
    ...row,
    dataInicioPrevista: row.dataInicioPrevista ?? undefined,
    dataFimPrevista: row.dataFimPrevista ?? undefined,
    concluidoEm: row.concluidoEm ?? undefined,
  };
}

function linhaEtapa(patch: Partial<Etapa>): Record<string, unknown> {
  const linha: Record<string, unknown> = {};
  if ("obraId" in patch) linha.obra_id = patch.obraId;
  if ("etapaPaiId" in patch) linha.etapa_pai_id = patch.etapaPaiId ?? null;
  if ("nome" in patch) linha.nome = patch.nome;
  if ("ordem" in patch) linha.ordem = patch.ordem;
  if ("predecessorasIds" in patch) linha.predecessoras_ids = patch.predecessorasIds;
  return linha;
}

function linhaServico(patch: Partial<ServicoNotavel>): Record<string, unknown> {
  const linha: Record<string, unknown> = {};
  if ("etapaId" in patch) linha.etapa_id = patch.etapaId;
  if ("nome" in patch) linha.nome = patch.nome;
  if ("ordem" in patch) linha.ordem = patch.ordem;
  if ("dataInicioPrevista" in patch) linha.data_inicio_prevista = patch.dataInicioPrevista ?? null;
  if ("dataFimPrevista" in patch) linha.data_fim_prevista = patch.dataFimPrevista ?? null;
  if ("concluidoEm" in patch) linha.concluido_em = patch.concluidoEm ?? null;
  return linha;
}

function linhaPergunta(patch: Partial<Pergunta>): Record<string, unknown> {
  const linha: Record<string, unknown> = {};
  if ("servicoId" in patch) linha.servico_id = patch.servicoId;
  if ("texto" in patch) linha.texto = patch.texto;
  if ("tipo" in patch) linha.tipo = patch.tipo;
  if ("obrigatoria" in patch) linha.obrigatoria = patch.obrigatoria;
  if ("ordem" in patch) linha.ordem = patch.ordem;
  return linha;
}

function linhaPerguntaNova(p: Pergunta): Record<string, unknown> {
  return {
    id: p.id,
    servico_id: p.servicoId,
    texto: p.texto,
    tipo: p.tipo,
    obrigatoria: p.obrigatoria,
    ordem: p.ordem,
  };
}

function falhaEscrita(mensagem: string): never {
  toast.error(mensagem);
  throw new Error(mensagem);
}

function nomeComSufixoCopia(nomeBase: string, existentes: string[]): string {
  let candidato = `${nomeBase} (cópia)`;
  let contador = 2;
  while (nomeDuplicado(candidato, existentes)) {
    candidato = `${nomeBase} (cópia ${contador})`;
    contador++;
  }
  return candidato;
}

interface ClonarEstruturaResultado {
  etapas: Etapa[];
  servicos: ServicoNotavel[];
  perguntas: Pergunta[];
  etapaIdMap: Map<string, string>;
}

// Clona um conjunto de etapas (mais os serviços e perguntas dentro delas) para dentro de uma obra
// destino. Usado tanto por "duplicar etapa" (etapas = a etapa + sua subárvore, mesma obra) quanto
// por "duplicar obra" (etapas = a árvore inteira, obra nova). Os ids novos são gerados no cliente
// (crypto.randomUUID) para não depender da ordem de retorno de um insert em lote — assim dá pra
// montar os objetos locais direto, sem precisar reconsultar o Supabase.
async function clonarEstrutura(params: {
  etapas: Etapa[];
  servicos: ServicoNotavel[];
  perguntas: Pergunta[];
  obraDestinoId?: string;
  etapaPaiDestinoId?: string;
  overridesTopo?: Map<string, { nome: string; ordem: number }>;
}): Promise<ClonarEstruturaResultado> {
  const { etapas, servicos, perguntas, obraDestinoId, etapaPaiDestinoId, overridesTopo } = params;

  const idsNoConjunto = new Set(etapas.map((e) => e.id));
  const etapaIdMap = new Map<string, string>();
  etapas.forEach((e) => etapaIdMap.set(e.id, crypto.randomUUID()));

  function camposClonados(e: Etapa) {
    const override = overridesTopo?.get(e.id);
    const pai = e.etapaPaiId;
    const ehTopo = !pai || !idsNoConjunto.has(pai);
    return {
      etapaPaiId: ehTopo ? etapaPaiDestinoId : etapaIdMap.get(pai!),
      nome: override?.nome ?? e.nome,
      ordem: override?.ordem ?? e.ordem,
    };
  }

  const novasEtapas: Etapa[] = etapas.map((e) => ({
    id: etapaIdMap.get(e.id)!,
    obraId: obraDestinoId ?? e.obraId,
    predecessorasIds: [],
    ...camposClonados(e),
  }));

  // Nível por nível: um filho só pode ser inserido depois que o pai já existe no banco.
  let pendentes = [...etapas];
  const jaInseridas = new Set<string>();
  while (pendentes.length > 0) {
    const prontas = pendentes.filter((e) => {
      const pai = e.etapaPaiId;
      const ehTopo = !pai || !idsNoConjunto.has(pai);
      return ehTopo || jaInseridas.has(pai!);
    });
    if (prontas.length === 0) break;

    const linhas = prontas.map((e) => {
      const campos = camposClonados(e);
      return {
        id: etapaIdMap.get(e.id)!,
        obra_id: obraDestinoId ?? e.obraId,
        etapa_pai_id: campos.etapaPaiId ?? null,
        nome: campos.nome,
        ordem: campos.ordem,
        predecessoras_ids: [] as string[],
      };
    });

    const { error } = await supabase.from("etapas").insert(linhas);
    if (error) {
      toast.error("Não foi possível duplicar a estrutura de etapas.");
      throw new Error("Falha ao duplicar etapas.");
    }

    prontas.forEach((e) => jaInseridas.add(e.id));
    pendentes = pendentes.filter((e) => !jaInseridas.has(e.id));
  }

  const servicoIdMap = new Map<string, string>();
  servicos.forEach((sv) => servicoIdMap.set(sv.id, crypto.randomUUID()));
  const novosServicos: ServicoNotavel[] = servicos.map((sv) => ({
    id: servicoIdMap.get(sv.id)!,
    etapaId: etapaIdMap.get(sv.etapaId) ?? sv.etapaId,
    nome: sv.nome,
    ordem: sv.ordem,
  }));

  if (novosServicos.length > 0) {
    const { error } = await supabase.from("servicos").insert(
      novosServicos.map((sv) => ({ id: sv.id, etapa_id: sv.etapaId, nome: sv.nome, ordem: sv.ordem }))
    );
    if (error) {
      toast.error("Não foi possível duplicar os serviços.");
      throw new Error("Falha ao duplicar serviços.");
    }
  }

  const novasPerguntas: Pergunta[] = perguntas.map((p) => ({
    id: crypto.randomUUID(),
    servicoId: servicoIdMap.get(p.servicoId)!,
    texto: p.texto,
    tipo: p.tipo,
    obrigatoria: p.obrigatoria,
    ordem: p.ordem,
  }));

  if (novasPerguntas.length > 0) {
    const { error } = await supabase.from("perguntas").insert(
      novasPerguntas.map((p) => ({
        id: p.id,
        servico_id: p.servicoId,
        texto: p.texto,
        tipo: p.tipo,
        obrigatoria: p.obrigatoria,
        ordem: p.ordem,
      }))
    );
    if (error) {
      toast.error("Não foi possível duplicar as perguntas.");
      throw new Error("Falha ao duplicar perguntas.");
    }
  }

  const upsertsPredecessoras = etapas
    .map((e) => ({
      id: etapaIdMap.get(e.id)!,
      predecessoras_ids: e.predecessorasIds.map((pid) => etapaIdMap.get(pid)).filter((v): v is string => !!v),
    }))
    .filter((linha) => linha.predecessoras_ids.length > 0);

  if (upsertsPredecessoras.length > 0) {
    const { error } = await supabase.from("etapas").upsert(upsertsPredecessoras);
    if (error) {
      toast.error("Estrutura duplicada, mas não foi possível recriar os vínculos de predecessoras.");
    } else {
      const porId = new Map(upsertsPredecessoras.map((u) => [u.id, u.predecessoras_ids]));
      novasEtapas.forEach((e) => {
        const pred = porId.get(e.id);
        if (pred) e.predecessorasIds = pred;
      });
    }
  }

  return { etapas: novasEtapas, servicos: novosServicos, perguntas: novasPerguntas, etapaIdMap };
}

interface FullKitState {
  carregado: boolean;
  obras: Obra[];
  etapas: Etapa[];
  servicos: ServicoNotavel[];
  perguntas: Pergunta[];
  apontamentos: Apontamento[];

  carregarTudo: () => Promise<void>;

  addObra: (nome: string, endereco: string) => Promise<Obra>;
  updateObra: (id: string, patch: Partial<Omit<Obra, "id">>) => Promise<void>;
  removeObra: (id: string) => Promise<void>;
  duplicarObra: (id: string, novoNome: string) => Promise<Obra>;

  addEtapa: (obraId: string, nome: string, etapaPaiId?: string) => Promise<Etapa>;
  updateEtapa: (id: string, patch: Partial<Omit<Etapa, "id" | "obraId">>) => Promise<void>;
  removeEtapa: (id: string) => Promise<void>;
  reorderEtapa: (id: string, direcao: "subir" | "descer") => Promise<void>;
  duplicarEtapa: (id: string) => Promise<Etapa>;

  addServico: (etapaId: string, nome: string) => Promise<ServicoNotavel>;
  updateServico: (id: string, patch: Partial<Omit<ServicoNotavel, "id" | "etapaId">>) => Promise<void>;
  removeServico: (id: string) => Promise<void>;
  reorderServico: (id: string, direcao: "subir" | "descer") => Promise<void>;
  duplicarServico: (id: string) => Promise<ServicoNotavel>;
  marcarConcluido: (id: string) => Promise<void>;
  desmarcarConcluido: (id: string) => Promise<void>;
  resetFullKit: (id: string) => Promise<void>;

  addPergunta: (servicoId: string, texto: string, tipo: TipoPergunta, obrigatoria: boolean) => Promise<Pergunta>;
  updatePergunta: (id: string, patch: Partial<Omit<Pergunta, "id" | "servicoId">>) => Promise<void>;
  removePergunta: (id: string) => Promise<void>;
  reorderPergunta: (id: string, direcao: "subir" | "descer") => Promise<void>;
  copiarFullKit: (servicoDestinoId: string, servicoModeloId: string) => Promise<number>;
  replicarFullKitsDaObra: (obraId: string, obraModeloId?: string) => Promise<{ servicos: number; perguntas: number }>;

  salvarApontamento: (input: {
    servicoId: string;
    respostas: Resposta[];
    fotos: string[];
    observacoes: string;
    autor: string;
  }) => Promise<Apontamento>;

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
  const resultado = [...sorted];
  const ordemA = resultado[index].ordem;
  const ordemB = resultado[swapWith].ordem;
  resultado[index] = { ...resultado[index], ordem: ordemB };
  resultado[swapWith] = { ...resultado[swapWith], ordem: ordemA };
  return resultado;
}

export const useFullKitStore = create<FullKitState>()((set, get) => ({
  carregado: false,
  obras: [],
  etapas: [],
  servicos: [],
  perguntas: [],
  apontamentos: [],

  carregarTudo: async () => {
    const [obrasRes, etapasRes, servicosRes, perguntasRes, apontamentosRes] = await Promise.all([
      supabase.from("obras").select("id, nome, endereco"),
      supabase.from("etapas").select(ETAPA_SELECT),
      supabase.from("servicos").select(SERVICO_SELECT),
      supabase.from("perguntas").select(PERGUNTA_SELECT),
      supabase.from("apontamentos").select(APONTAMENTO_SELECT),
    ]);

    const erro =
      obrasRes.error || etapasRes.error || servicosRes.error || perguntasRes.error || apontamentosRes.error;
    if (erro) {
      toast.error("Não foi possível carregar os dados do Supabase. Confira se o schema.sql já foi executado.");
      set({ carregado: true });
      return;
    }

    set({
      obras: (obrasRes.data ?? []) as Obra[],
      etapas: ((etapasRes.data ?? []) as Etapa[]).map(normalizarEtapa),
      servicos: ((servicosRes.data ?? []) as ServicoNotavel[]).map(normalizarServico),
      perguntas: (perguntasRes.data ?? []) as Pergunta[],
      apontamentos: (apontamentosRes.data ?? []) as Apontamento[],
      carregado: true,
    });
  },

  addObra: async (nome, endereco) => {
    const { data, error } = await supabase.from("obras").insert({ nome, endereco }).select("id, nome, endereco").single();
    if (error || !data) falhaEscrita("Não foi possível criar a obra.");
    const obra = data as Obra;
    set((s) => ({ obras: [...s.obras, obra] }));
    return obra;
  },
  updateObra: async (obraId, patch) => {
    const { error } = await supabase.from("obras").update(patch).eq("id", obraId);
    if (error) falhaEscrita("Não foi possível atualizar a obra.");
    set((s) => ({ obras: s.obras.map((o) => (o.id === obraId ? { ...o, ...patch } : o)) }));
  },
  removeObra: async (obraId) => {
    const { error } = await supabase.from("obras").delete().eq("id", obraId);
    if (error) falhaEscrita("Não foi possível excluir a obra.");
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
    });
  },
  duplicarObra: async (obraId, novoNome) => {
    const atual = get();
    const original = atual.obras.find((o) => o.id === obraId);
    if (!original) throw new Error("Obra não encontrada.");

    const { data, error: erroObra } = await supabase
      .from("obras")
      .insert({ nome: novoNome, endereco: original.endereco })
      .select("id, nome, endereco")
      .single();
    if (erroObra || !data) falhaEscrita("Não foi possível criar a obra duplicada.");
    const novaObra = data as Obra;

    const etapasOrigem = atual.etapas.filter((e) => e.obraId === obraId);
    const etapaIdsOrigem = new Set(etapasOrigem.map((e) => e.id));
    const servicosOrigem = atual.servicos.filter((sv) => etapaIdsOrigem.has(sv.etapaId));
    const servicoIdsOrigem = new Set(servicosOrigem.map((sv) => sv.id));
    const perguntasOrigem = atual.perguntas.filter((p) => servicoIdsOrigem.has(p.servicoId));

    try {
      const resultado = await clonarEstrutura({
        etapas: etapasOrigem,
        servicos: servicosOrigem,
        perguntas: perguntasOrigem,
        obraDestinoId: novaObra.id,
      });
      set((s) => ({
        obras: [...s.obras, novaObra],
        etapas: [...s.etapas, ...resultado.etapas],
        servicos: [...s.servicos, ...resultado.servicos],
        perguntas: [...s.perguntas, ...resultado.perguntas],
      }));
      return novaObra;
    } catch (erro) {
      await supabase.from("obras").delete().eq("id", novaObra.id);
      throw erro;
    }
  },

  addEtapa: async (obraId, nome, etapaPaiId) => {
    const irmas = get().etapas.filter((e) => e.obraId === obraId && e.etapaPaiId === etapaPaiId);
    const ordem = irmas.length > 0 ? Math.max(...irmas.map((e) => e.ordem)) + 1 : 1;
    const anterior = irmas.find((e) => e.ordem === ordem - 1);
    const predecessorasIds = anterior ? [anterior.id] : [];

    const { data, error } = await supabase
      .from("etapas")
      .insert({
        obra_id: obraId,
        etapa_pai_id: etapaPaiId ?? null,
        nome,
        ordem,
        predecessoras_ids: predecessorasIds,
      })
      .select(ETAPA_SELECT)
      .single();
    if (error || !data) falhaEscrita("Não foi possível criar a etapa.");
    const etapa = normalizarEtapa(data as Etapa);
    set((s) => ({ etapas: [...s.etapas, etapa] }));
    return etapa;
  },
  updateEtapa: async (etapaId, patch) => {
    const { error } = await supabase.from("etapas").update(linhaEtapa(patch)).eq("id", etapaId);
    if (error) falhaEscrita("Não foi possível atualizar a etapa.");
    set((s) => ({
      etapas: s.etapas.map((e) => (e.id === etapaId ? { ...e, ...patch } : e)),
    }));
  },
  removeEtapa: async (etapaId) => {
    const { error } = await supabase.from("etapas").delete().eq("id", etapaId);
    if (error) falhaEscrita("Não foi possível excluir a etapa.");
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
    });
  },
  reorderEtapa: async (etapaId, direcao) => {
    const atual = get();
    const etapa = atual.etapas.find((e) => e.id === etapaId);
    if (!etapa) return;
    const mesmoGrupo = (e: Etapa) => e.obraId === etapa.obraId && e.etapaPaiId === etapa.etapaPaiId;
    const irmas = atual.etapas.filter(mesmoGrupo);
    const reordenadas = reorder(irmas, etapaId, direcao);
    if (reordenadas === irmas) return;

    const outras = atual.etapas.filter((e) => !mesmoGrupo(e));
    set({ etapas: [...outras, ...reordenadas] });

    const alteradas = reordenadas.filter((e) => irmas.find((i) => i.id === e.id)?.ordem !== e.ordem);
    const { error } = await supabase.from("etapas").upsert(
      alteradas.map((e) => ({ id: e.id, ordem: e.ordem }))
    );
    if (error) toast.error("Não foi possível salvar a nova ordem das etapas.");
  },
  duplicarEtapa: async (etapaId) => {
    const atual = get();
    const original = atual.etapas.find((e) => e.id === etapaId);
    if (!original) throw new Error("Etapa não encontrada.");

    const subtree = [original, ...descendentes(etapaId, atual.etapas)];
    const subtreeIds = new Set(subtree.map((e) => e.id));
    const servicosOrigem = atual.servicos.filter((sv) => subtreeIds.has(sv.etapaId));
    const servicoIdsOrigem = new Set(servicosOrigem.map((sv) => sv.id));
    const perguntasOrigem = atual.perguntas.filter((p) => servicoIdsOrigem.has(p.servicoId));

    const irmaos = atual.etapas.filter(
      (e) => e.obraId === original.obraId && e.etapaPaiId === original.etapaPaiId
    );
    const ordem = Math.max(...irmaos.map((e) => e.ordem)) + 1;
    const nome = nomeComSufixoCopia(original.nome, irmaos.map((e) => e.nome));

    const resultado = await clonarEstrutura({
      etapas: subtree,
      servicos: servicosOrigem,
      perguntas: perguntasOrigem,
      obraDestinoId: original.obraId,
      etapaPaiDestinoId: original.etapaPaiId,
      overridesTopo: new Map([[original.id, { nome, ordem }]]),
    });

    set((s) => ({
      etapas: [...s.etapas, ...resultado.etapas],
      servicos: [...s.servicos, ...resultado.servicos],
      perguntas: [...s.perguntas, ...resultado.perguntas],
    }));

    const novoId = resultado.etapaIdMap.get(original.id)!;
    return resultado.etapas.find((e) => e.id === novoId)!;
  },

  addServico: async (etapaId, nome) => {
    const servicosDaEtapa = get().servicos.filter((sv) => sv.etapaId === etapaId);
    const ordem =
      servicosDaEtapa.length > 0 ? Math.max(...servicosDaEtapa.map((sv) => sv.ordem)) + 1 : 1;

    const { data, error } = await supabase
      .from("servicos")
      .insert({ etapa_id: etapaId, nome, ordem })
      .select(SERVICO_SELECT)
      .single();
    if (error || !data) falhaEscrita("Não foi possível criar o serviço.");
    const servico = normalizarServico(data as ServicoNotavel);
    set((s) => ({ servicos: [...s.servicos, servico] }));
    return servico;
  },
  updateServico: async (servicoId, patch) => {
    const { error } = await supabase.from("servicos").update(linhaServico(patch)).eq("id", servicoId);
    if (error) falhaEscrita("Não foi possível atualizar o serviço.");
    set((s) => ({
      servicos: s.servicos.map((sv) => (sv.id === servicoId ? { ...sv, ...patch } : sv)),
    }));
  },
  removeServico: async (servicoId) => {
    const { error } = await supabase.from("servicos").delete().eq("id", servicoId);
    if (error) falhaEscrita("Não foi possível excluir o serviço.");
    set((s) => ({
      servicos: s.servicos.filter((sv) => sv.id !== servicoId),
      perguntas: s.perguntas.filter((p) => p.servicoId !== servicoId),
      apontamentos: s.apontamentos.filter((a) => a.servicoId !== servicoId),
    }));
  },
  reorderServico: async (servicoId, direcao) => {
    const atual = get();
    const servico = atual.servicos.find((sv) => sv.id === servicoId);
    if (!servico) return;
    const daEtapa = atual.servicos.filter((sv) => sv.etapaId === servico.etapaId);
    const reordenados = reorder(daEtapa, servicoId, direcao);
    if (reordenados === daEtapa) return;

    const outros = atual.servicos.filter((sv) => sv.etapaId !== servico.etapaId);
    set({ servicos: [...outros, ...reordenados] });

    const alterados = reordenados.filter((sv) => daEtapa.find((d) => d.id === sv.id)?.ordem !== sv.ordem);
    const { error } = await supabase.from("servicos").upsert(
      alterados.map((sv) => ({ id: sv.id, ordem: sv.ordem }))
    );
    if (error) toast.error("Não foi possível salvar a nova ordem dos serviços.");
  },
  duplicarServico: async (servicoId) => {
    const atual = get();
    const original = atual.servicos.find((sv) => sv.id === servicoId);
    if (!original) throw new Error("Serviço não encontrado.");

    const irmaos = atual.servicos.filter((sv) => sv.etapaId === original.etapaId);
    const ordem = Math.max(...irmaos.map((sv) => sv.ordem)) + 1;
    const nome = nomeComSufixoCopia(original.nome, irmaos.map((sv) => sv.nome));
    const perguntasOrigem = atual.perguntas.filter((p) => p.servicoId === servicoId);

    const resultado = await clonarEstrutura({
      etapas: [],
      servicos: [{ ...original, nome, ordem }],
      perguntas: perguntasOrigem,
    });

    set((s) => ({
      servicos: [...s.servicos, ...resultado.servicos],
      perguntas: [...s.perguntas, ...resultado.perguntas],
    }));

    return resultado.servicos[0];
  },
  marcarConcluido: async (servicoId) => {
    await get().updateServico(servicoId, { concluidoEm: new Date().toISOString() });
  },
  desmarcarConcluido: async (servicoId) => {
    await get().updateServico(servicoId, { concluidoEm: undefined });
  },
  resetFullKit: async (servicoId) => {
    const { error: erroApontamentos } = await supabase
      .from("apontamentos")
      .delete()
      .eq("servico_id", servicoId);
    if (erroApontamentos) falhaEscrita("Não foi possível limpar as respostas do Full Kit.");

    const { error: erroServico } = await supabase
      .from("servicos")
      .update({ concluido_em: null })
      .eq("id", servicoId);
    if (erroServico) falhaEscrita("Não foi possível limpar as respostas do Full Kit.");

    set((s) => ({
      apontamentos: s.apontamentos.filter((a) => a.servicoId !== servicoId),
      servicos: s.servicos.map((sv) => (sv.id === servicoId ? { ...sv, concluidoEm: undefined } : sv)),
    }));
  },

  addPergunta: async (servicoId, texto, tipo, obrigatoria) => {
    const perguntasDoServico = get().perguntas.filter((p) => p.servicoId === servicoId);
    const ordem =
      perguntasDoServico.length > 0 ? Math.max(...perguntasDoServico.map((p) => p.ordem)) + 1 : 1;

    const { data, error } = await supabase
      .from("perguntas")
      .insert({ servico_id: servicoId, texto, tipo, obrigatoria, ordem })
      .select(PERGUNTA_SELECT)
      .single();
    if (error || !data) falhaEscrita("Não foi possível criar a pergunta.");
    const pergunta = data as Pergunta;
    set((s) => ({ perguntas: [...s.perguntas, pergunta] }));
    return pergunta;
  },
  updatePergunta: async (perguntaId, patch) => {
    const { error } = await supabase.from("perguntas").update(linhaPergunta(patch)).eq("id", perguntaId);
    if (error) falhaEscrita("Não foi possível atualizar a pergunta.");
    set((s) => ({
      perguntas: s.perguntas.map((p) => (p.id === perguntaId ? { ...p, ...patch } : p)),
    }));
  },
  removePergunta: async (perguntaId) => {
    const { error } = await supabase.from("perguntas").delete().eq("id", perguntaId);
    if (error) falhaEscrita("Não foi possível excluir a pergunta.");
    set((s) => ({ perguntas: s.perguntas.filter((p) => p.id !== perguntaId) }));
  },
  reorderPergunta: async (perguntaId, direcao) => {
    const atual = get();
    const pergunta = atual.perguntas.find((p) => p.id === perguntaId);
    if (!pergunta) return;
    const doServico = atual.perguntas.filter((p) => p.servicoId === pergunta.servicoId);
    const reordenadas = reorder(doServico, perguntaId, direcao);
    if (reordenadas === doServico) return;

    const outras = atual.perguntas.filter((p) => p.servicoId !== pergunta.servicoId);
    set({ perguntas: [...outras, ...reordenadas] });

    const alteradas = reordenadas.filter((p) => doServico.find((d) => d.id === p.id)?.ordem !== p.ordem);
    const { error } = await supabase.from("perguntas").upsert(
      alteradas.map((p) => ({ id: p.id, ordem: p.ordem }))
    );
    if (error) toast.error("Não foi possível salvar a nova ordem das perguntas.");
  },

  // Copia o FULL KIT de um serviço de outra obra para um serviço ainda sem perguntas.
  copiarFullKit: async (servicoDestinoId, servicoModeloId) => {
    const atual = get();
    if (atual.perguntas.some((p) => p.servicoId === servicoDestinoId)) {
      falhaEscrita("Este serviço já tem perguntas. Apague-as antes de copiar de outra obra.");
    }

    const doModelo = atual.perguntas
      .filter((p) => p.servicoId === servicoModeloId)
      .sort((a, b) => a.ordem - b.ordem);
    if (doModelo.length === 0) falhaEscrita("O serviço escolhido como modelo não tem perguntas.");

    const novas: Pergunta[] = doModelo.map((p) => ({
      id: crypto.randomUUID(),
      servicoId: servicoDestinoId,
      texto: p.texto,
      tipo: p.tipo,
      obrigatoria: p.obrigatoria,
      ordem: p.ordem,
    }));

    const { error } = await supabase.from("perguntas").insert(novas.map(linhaPerguntaNova));
    if (error) falhaEscrita("Não foi possível copiar o FULL KIT.");

    set((s) => ({ perguntas: [...s.perguntas, ...novas] }));
    return novas.length;
  },

  // Preenche de uma vez todos os serviços vazios da obra, casando pelo nome com os
  // serviços de mesmo nome de outra obra. Serviço que já tem pergunta não é tocado.
  replicarFullKitsDaObra: async (obraId, obraModeloId) => {
    const atual = get();
    const plano = planejarReplicacao(obraId, atual, obraModeloId);
    if (plano.copiar.length === 0) return { servicos: 0, perguntas: 0 };

    const novas: Pergunta[] = plano.copiar.flatMap((item) =>
      atual.perguntas
        .filter((p) => p.servicoId === item.modelo!.servico.id)
        .sort((a, b) => a.ordem - b.ordem)
        .map((p) => ({
          id: crypto.randomUUID(),
          servicoId: item.servico.id,
          texto: p.texto,
          tipo: p.tipo,
          obrigatoria: p.obrigatoria,
          ordem: p.ordem,
        }))
    );

    const { error } = await supabase.from("perguntas").insert(novas.map(linhaPerguntaNova));
    if (error) falhaEscrita("Não foi possível replicar os FULL KITs.");

    set((s) => ({ perguntas: [...s.perguntas, ...novas] }));
    return { servicos: plano.copiar.length, perguntas: novas.length };
  },

  salvarApontamento: async ({ servicoId, respostas, fotos, observacoes, autor }) => {
    const { data, error } = await supabase
      .from("apontamentos")
      .insert({ servico_id: servicoId, respostas, fotos, observacoes, autor })
      .select(APONTAMENTO_SELECT)
      .single();
    if (error || !data) falhaEscrita("Não foi possível salvar o apontamento.");
    const apontamento = data as Apontamento;
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
}));
