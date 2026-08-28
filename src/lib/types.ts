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
  // De qual FULL KIT do catálogo este serviço nasceu (informativo).
  fullKitId?: string;
}

// Uma pergunta de checklist, seja ela a pergunta real de um serviço numa obra
// ou a pergunta de um FULL KIT do catálogo — o editor e a pré-visualização
// funcionam igual para as duas.
export interface PerguntaBase {
  id: string;
  texto: string;
  tipo: TipoPergunta;
  obrigatoria: boolean;
  ordem: number;
}

export interface Pergunta extends PerguntaBase {
  servicoId: string;
}

// Catálogo: um FULL KIT cadastrado uma vez e reaproveitado ao montar o fluxo
// de qualquer obra. Ao usar o modelo, as perguntas são copiadas para o serviço,
// então editar o modelo depois não mexe nas obras já montadas.
export interface FullKitModelo {
  id: string;
  nome: string;
  descricao: string;
}

export interface PerguntaModelo extends PerguntaBase {
  fullKitId: string;
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
