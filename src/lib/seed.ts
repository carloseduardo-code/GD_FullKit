import type {
  Apontamento,
  Elemento,
  Etapa,
  Obra,
  Pergunta,
  ServicoNotavel,
} from "@/lib/types";

const obras: Obra[] = [
  {
    id: "obra-1",
    nome: "Complexo Industrial Vale",
    endereco: "Rod. BR-262, km 45 - Nova Lima/MG",
  },
];

const elementos: Elemento[] = [
  { id: "elem-b100", obraId: "obra-1", nome: "B100", tipo: "Bloco" },
  { id: "elem-b101", obraId: "obra-1", nome: "B101", tipo: "Bloco" },
];

const etapas: Etapa[] = [
  { id: "etapa-preliminares", obraId: "obra-1", nome: "Atividades Preliminares", ordem: 1 },
  { id: "etapa-execucao-b100", obraId: "obra-1", nome: "Execução B100", ordem: 2 },
];

const servicos: ServicoNotavel[] = [
  { id: "serv-liberacao-area", etapaId: "etapa-preliminares", nome: "Liberação da Área", ordem: 1 },
  { id: "serv-plano-escavacao", etapaId: "etapa-preliminares", nome: "Plano de Escavação", ordem: 2 },
  { id: "serv-caminho-seguro", etapaId: "etapa-preliminares", nome: "Caminho Seguro", ordem: 3 },
  { id: "serv-escavacao", etapaId: "etapa-execucao-b100", nome: "Escavação", ordem: 1 },
  { id: "serv-regularizacao", etapaId: "etapa-execucao-b100", nome: "Regularização", ordem: 2 },
  { id: "serv-concreto-magro", etapaId: "etapa-execucao-b100", nome: "Concreto Magro", ordem: 3 },
  { id: "serv-arrasamento", etapaId: "etapa-execucao-b100", nome: "Arrasamento", ordem: 4 },
  { id: "serv-preparacao", etapaId: "etapa-execucao-b100", nome: "Preparação", ordem: 5 },
  { id: "serv-ensaio-pit", etapaId: "etapa-execucao-b100", nome: "Ensaio PIT", ordem: 6 },
  { id: "serv-relatorio-pit", etapaId: "etapa-execucao-b100", nome: "Relatório PIT", ordem: 7 },
  { id: "serv-devolutiva-vale", etapaId: "etapa-execucao-b100", nome: "Devolutiva Vale", ordem: 8 },
  { id: "serv-armacao", etapaId: "etapa-execucao-b100", nome: "Armação", ordem: 9 },
  { id: "serv-forma", etapaId: "etapa-execucao-b100", nome: "Fôrma", ordem: 10 },
  { id: "serv-concreto", etapaId: "etapa-execucao-b100", nome: "Concreto", ordem: 11 },
  { id: "serv-reaterro", etapaId: "etapa-execucao-b100", nome: "Reaterro", ordem: 12 },
];

const perguntas: Pergunta[] = [
  { id: "p-lib-1", servicoId: "serv-liberacao-area", texto: "Área liberada pela fiscalização?", tipo: "boolean", obrigatoria: true, ordem: 1 },
  { id: "p-lib-2", servicoId: "serv-liberacao-area", texto: "Isolamento concluído?", tipo: "boolean", obrigatoria: true, ordem: 2 },
  { id: "p-lib-3", servicoId: "serv-liberacao-area", texto: "Sinalização instalada?", tipo: "boolean", obrigatoria: true, ordem: 3 },
  { id: "p-lib-4", servicoId: "serv-liberacao-area", texto: "APR aprovada?", tipo: "boolean", obrigatoria: true, ordem: 4 },
  { id: "p-lib-5", servicoId: "serv-liberacao-area", texto: "Equipe autorizada?", tipo: "boolean", obrigatoria: true, ordem: 5 },
  { id: "p-lib-6", servicoId: "serv-liberacao-area", texto: "Fotos da área anexadas?", tipo: "foto", obrigatoria: true, ordem: 6 },

  { id: "p-arm-1", servicoId: "serv-armacao", texto: "Projeto estrutural liberado?", tipo: "boolean", obrigatoria: true, ordem: 1 },
  { id: "p-arm-2", servicoId: "serv-armacao", texto: "Aço disponível?", tipo: "boolean", obrigatoria: true, ordem: 2 },
  { id: "p-arm-3", servicoId: "serv-armacao", texto: "Aço cortado?", tipo: "boolean", obrigatoria: true, ordem: 3 },
  { id: "p-arm-4", servicoId: "serv-armacao", texto: "Armadores disponíveis?", tipo: "boolean", obrigatoria: true, ordem: 4 },
  { id: "p-arm-5", servicoId: "serv-armacao", texto: "Ferramentas disponíveis?", tipo: "boolean", obrigatoria: true, ordem: 5 },
  { id: "p-arm-6", servicoId: "serv-armacao", texto: "Frente liberada?", tipo: "boolean", obrigatoria: true, ordem: 6 },
  { id: "p-arm-7", servicoId: "serv-armacao", texto: "Inspeção da qualidade realizada?", tipo: "boolean", obrigatoria: true, ordem: 7 },
  { id: "p-arm-8", servicoId: "serv-armacao", texto: "Fotos anexadas?", tipo: "foto", obrigatoria: true, ordem: 8 },
];

const apontamentos: Apontamento[] = [
  {
    id: "apont-lib-1",
    elementoId: "elem-b100",
    servicoId: "serv-liberacao-area",
    respostas: [
      { perguntaId: "p-lib-1", valor: true },
      { perguntaId: "p-lib-2", valor: true },
      { perguntaId: "p-lib-3", valor: false },
      { perguntaId: "p-lib-4", valor: false },
      { perguntaId: "p-lib-5", valor: true },
    ],
    fotos: ["foto-area-1.jpg"],
    observacoes: "Aguardando aprovação da APR e instalação da sinalização.",
    autor: "João Apontador",
    criadoEm: new Date("2026-07-28T09:00:00").toISOString(),
  },
  {
    id: "apont-arm-1",
    elementoId: "elem-b100",
    servicoId: "serv-armacao",
    respostas: [
      { perguntaId: "p-arm-1", valor: true },
      { perguntaId: "p-arm-2", valor: true },
      { perguntaId: "p-arm-3", valor: true },
      { perguntaId: "p-arm-4", valor: true },
      { perguntaId: "p-arm-5", valor: true },
      { perguntaId: "p-arm-6", valor: false },
      { perguntaId: "p-arm-7", valor: false },
    ],
    fotos: ["foto-armacao-1.jpg"],
    observacoes: "Falta liberação de frente e inspeção de qualidade.",
    autor: "João Apontador",
    criadoEm: new Date("2026-08-01T14:30:00").toISOString(),
  },
];

export const SEED = { obras, elementos, etapas, servicos, perguntas, apontamentos };
