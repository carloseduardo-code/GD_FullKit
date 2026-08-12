export type TipoPergunta = "boolean" | "texto" | "numero" | "foto";

export interface Obra {
  id: string;
  nome: string;
  endereco: string;
}

export interface Etapa {
  id: string;
  obraId: string;
  etapaPaiId?: string;
  nome: string;
  ordem: number;
  predecessorasIds: string[];
}

export interface ServicoNotavel {
  id: string;
  etapaId: string;
  nome: string;
  ordem: number;
  dataInicioPrevista?: string;
  dataFimPrevista?: string;
  concluidoEm?: string;
}

export interface Pergunta {
  id: string;
  servicoId: string;
  texto: string;
  tipo: TipoPergunta;
  obrigatoria: boolean;
  ordem: number;
}

export type RespostaBooleana = "sim" | "nao" | "nao_aplica";

export interface Resposta {
  perguntaId: string;
  valor: RespostaBooleana | string | number | null;
}

export interface Apontamento {
  id: string;
  servicoId: string;
  respostas: Resposta[];
  fotos: string[];
  observacoes: string;
  autor: string;
  criadoEm: string;
}

export type StatusServico = "liberado" | "nao_liberado" | "nao_iniciado";

export interface Pendencia {
  perguntaId: string;
  texto: string;
}

export interface StatusResultado {
  status: StatusServico;
  pendencias: Pendencia[];
}
