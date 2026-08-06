import type { Etapa, ServicoNotavel, StatusResultado } from "@/lib/types";

export function descendentes(etapaId: string, todasEtapas: Etapa[]): Etapa[] {
  const filhas = todasEtapas.filter((e) => e.etapaPaiId === etapaId);
  return filhas.flatMap((filha) => [filha, ...descendentes(filha.id, todasEtapas)]);
}

export function servicosDoSubtree(
  etapaId: string,
  todasEtapas: Etapa[],
  todosServicos: ServicoNotavel[]
): ServicoNotavel[] {
  const etapaIds = new Set([etapaId, ...descendentes(etapaId, todasEtapas).map((e) => e.id)]);
  return todosServicos.filter((sv) => etapaIds.has(sv.etapaId));
}

export function caminhoEtapa(etapaId: string, todasEtapas: Etapa[]): Etapa[] {
  const porId = new Map(todasEtapas.map((e) => [e.id, e] as const));
  const caminho: Etapa[] = [];
  let atual = porId.get(etapaId);
  while (atual) {
    caminho.unshift(atual);
    atual = atual.etapaPaiId ? porId.get(atual.etapaPaiId) : undefined;
  }
  return caminho;
}

export interface ProgressoEtapa {
  pronto: number;
  emAndamento: number;
  naoIniciado: number;
  pendencias: number;
  total: number;
  percentual: number;
}

export function progressoEtapa(
  etapaId: string,
  todasEtapas: Etapa[],
  todosServicos: ServicoNotavel[],
  getStatusServico: (servicoId: string) => StatusResultado
): ProgressoEtapa {
  const servicos = servicosDoSubtree(etapaId, todasEtapas, todosServicos);

  let pronto = 0;
  let emAndamento = 0;
  let naoIniciado = 0;
  let pendencias = 0;

  servicos.forEach((servico) => {
    const resultado = getStatusServico(servico.id);
    if (resultado.status === "pronto") {
      pronto++;
    } else if (resultado.status === "bloqueado") {
      emAndamento++;
      pendencias += resultado.pendencias.length;
    } else {
      naoIniciado++;
    }
  });

  const total = pronto + emAndamento + naoIniciado;
  const percentual = total > 0 ? Math.round((pronto / total) * 100) : 0;

  return { pronto, emAndamento, naoIniciado, pendencias, total, percentual };
}

export interface JanelaDatas {
  inicio?: string;
  fim?: string;
}

export function janelaDatasServicos(servicos: ServicoNotavel[]): JanelaDatas {
  const inicios = servicos
    .map((s) => s.dataInicioPrevista)
    .filter((d): d is string => !!d)
    .sort();
  const fins = servicos
    .map((s) => s.dataFimPrevista)
    .filter((d): d is string => !!d)
    .sort();
  return {
    inicio: inicios[0],
    fim: fins[fins.length - 1],
  };
}

export function etapaLiberada(etapa: Etapa, progressoPorEtapaId: Map<string, ProgressoEtapa>): boolean {
  if (etapa.predecessorasIds.length === 0) return true;
  return etapa.predecessorasIds.every((id) => (progressoPorEtapaId.get(id)?.percentual ?? 0) === 100);
}

export function etapaAtrasada(janela: JanelaDatas, progresso: ProgressoEtapa): boolean {
  if (!janela.fim || progresso.percentual >= 100) return false;
  return new Date(janela.fim) < new Date();
}

export function predecessorasPendentes(
  etapa: Etapa,
  todasEtapas: Etapa[],
  progressoPorEtapaId: Map<string, ProgressoEtapa>
): Etapa[] {
  return etapa.predecessorasIds
    .map((id) => todasEtapas.find((e) => e.id === id))
    .filter((e): e is Etapa => !!e)
    .filter((e) => (progressoPorEtapaId.get(e.id)?.percentual ?? 0) < 100);
}

export function sucessorasDe(etapaId: string, todasEtapas: Etapa[]): Etapa[] {
  return todasEtapas.filter((e) => e.predecessorasIds.includes(etapaId));
}
