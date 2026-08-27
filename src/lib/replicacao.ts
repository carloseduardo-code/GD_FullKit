import type { Etapa, Obra, Pergunta, ServicoNotavel } from "@/lib/types";
import { caminhoEtapa } from "@/lib/planejamento";

export interface DadosReplicacao {
  obras: Obra[];
  etapas: Etapa[];
  servicos: ServicoNotavel[];
  perguntas: Pergunta[];
}

// O mesmo serviço notável quase nunca vem digitado igual em duas obras: muda a caixa,
// o acento, um espaço a mais e o "³" que às vezes é digitado como "3". Para casar
// "Concreto Magro (m³)" com "concreto magro (m3)" comparamos por esta chave.
export function chaveServico(nome: string): string {
  return nome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/³/g, "3")
    .replace(/²/g, "2")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export interface ModeloFullKit {
  servico: ServicoNotavel;
  obra: Obra;
  qtdPerguntas: number;
}

// Serviços de OUTRAS obras que têm o mesmo nome e já têm FULL KIT montado,
// do mais completo para o menos completo.
export function modelosDeFullKit(
  nome: string,
  obraDestinoId: string,
  dados: DadosReplicacao,
  obraModeloId?: string
): ModeloFullKit[] {
  const chave = chaveServico(nome);
  const obraPorId = new Map(dados.obras.map((o) => [o.id, o] as const));
  const obraPorEtapa = new Map(dados.etapas.map((e) => [e.id, e.obraId] as const));

  const qtdPorServico = new Map<string, number>();
  dados.perguntas.forEach((p) => qtdPorServico.set(p.servicoId, (qtdPorServico.get(p.servicoId) ?? 0) + 1));

  return dados.servicos
    .filter((sv) => chaveServico(sv.nome) === chave)
    .flatMap((sv) => {
      const obraId = obraPorEtapa.get(sv.etapaId);
      const obra = obraId ? obraPorId.get(obraId) : undefined;
      const qtdPerguntas = qtdPorServico.get(sv.id) ?? 0;
      if (!obra || obraId === obraDestinoId || qtdPerguntas === 0) return [];
      if (obraModeloId && obraId !== obraModeloId) return [];
      return [{ servico: sv, obra, qtdPerguntas }];
    })
    .sort((a, b) => b.qtdPerguntas - a.qtdPerguntas || a.obra.nome.localeCompare(b.obra.nome));
}

export interface ItemPlano {
  servico: ServicoNotavel;
  etapa: string;
  qtdAtual: number;
  modelo?: ModeloFullKit;
}

export interface PlanoReplicacao {
  copiar: ItemPlano[];
  jaPreenchidos: ItemPlano[];
  semModelo: ItemPlano[];
  perguntasACopiar: number;
}

// Para cada serviço da obra destino: quem já tem FULL KIT fica intacto, quem está vazio
// recebe o FULL KIT mais completo encontrado com o mesmo nome em outra obra.
export function planejarReplicacao(
  obraDestinoId: string,
  dados: DadosReplicacao,
  obraModeloId?: string
): PlanoReplicacao {
  const etapasDaObra = dados.etapas.filter((e) => e.obraId === obraDestinoId);
  const idsEtapas = new Set(etapasDaObra.map((e) => e.id));

  const qtdPorServico = new Map<string, number>();
  dados.perguntas.forEach((p) => qtdPorServico.set(p.servicoId, (qtdPorServico.get(p.servicoId) ?? 0) + 1));

  const plano: PlanoReplicacao = { copiar: [], jaPreenchidos: [], semModelo: [], perguntasACopiar: 0 };

  dados.servicos
    .filter((sv) => idsEtapas.has(sv.etapaId))
    .sort((a, b) => a.ordem - b.ordem)
    .forEach((servico) => {
      const qtdAtual = qtdPorServico.get(servico.id) ?? 0;
      const etapa = caminhoEtapa(servico.etapaId, etapasDaObra)
        .map((e) => e.nome)
        .join(" › ");

      if (qtdAtual > 0) {
        plano.jaPreenchidos.push({ servico, etapa, qtdAtual });
        return;
      }

      const modelo = modelosDeFullKit(servico.nome, obraDestinoId, dados, obraModeloId)[0];
      if (!modelo) {
        plano.semModelo.push({ servico, etapa, qtdAtual });
        return;
      }

      plano.copiar.push({ servico, etapa, qtdAtual, modelo });
      plano.perguntasACopiar += modelo.qtdPerguntas;
    });

  return plano;
}

// Obras que podem servir de modelo, com quantos serviços delas já têm FULL KIT.
export function obrasModelo(obraDestinoId: string, dados: DadosReplicacao): { obra: Obra; servicosComFullKit: number }[] {
  const servicosComPerguntas = new Set(dados.perguntas.map((p) => p.servicoId));
  const etapaParaObra = new Map(dados.etapas.map((e) => [e.id, e.obraId] as const));

  const porObra = new Map<string, number>();
  dados.servicos.forEach((sv) => {
    if (!servicosComPerguntas.has(sv.id)) return;
    const obraId = etapaParaObra.get(sv.etapaId);
    if (!obraId || obraId === obraDestinoId) return;
    porObra.set(obraId, (porObra.get(obraId) ?? 0) + 1);
  });

  return dados.obras
    .flatMap((obra) => {
      const servicosComFullKit = porObra.get(obra.id) ?? 0;
      return servicosComFullKit > 0 ? [{ obra, servicosComFullKit }] : [];
    })
    .sort((a, b) => b.servicosComFullKit - a.servicosComFullKit || a.obra.nome.localeCompare(b.obra.nome));
}
