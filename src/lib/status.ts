import type {
  Apontamento,
  Pendencia,
  Pergunta,
  Resposta,
  StatusResultado,
} from "@/lib/types";

function respostaAtende(pergunta: Pergunta, resposta: Resposta | undefined, fotos: string[]): boolean {
  if (pergunta.tipo === "foto") {
    return fotos.length > 0;
  }
  if (!resposta) return false;
  const { valor } = resposta;
  if (pergunta.tipo === "boolean") return valor === "sim" || valor === "nao_aplica";
  if (valor === null || valor === undefined) return false;
  if (typeof valor === "string") return valor.trim().length > 0;
  return true;
}

// Calcula apenas os três estados do Full Kit (Não Iniciado / Liberado / Não Liberado).
// A conclusão da atividade é um evento separado (ver ServicoNotavel.concluidoEm) e nunca
// entra nessa conta: não existe ação manual capaz de alterar esses três status.
export function calcularStatus(
  perguntas: Pergunta[],
  apontamento: Apontamento | undefined
): StatusResultado {
  if (!apontamento) {
    return {
      status: "nao_iniciado",
      pendencias: perguntas
        .filter((p) => p.obrigatoria)
        .map((p) => ({ perguntaId: p.id, texto: p.texto })),
    };
  }

  const respostasPorPergunta = new Map(
    apontamento.respostas.map((r) => [r.perguntaId, r] as const)
  );

  const pendencias: Pendencia[] = perguntas
    .filter((p) => p.obrigatoria)
    .filter((p) => !respostaAtende(p, respostasPorPergunta.get(p.id), apontamento.fotos))
    .map((p) => ({ perguntaId: p.id, texto: p.texto }));

  return {
    status: pendencias.length === 0 ? "liberado" : "nao_liberado",
    pendencias,
  };
}
