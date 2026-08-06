import type { Apontamento, Etapa, Pergunta, ServicoNotavel, Obra } from "@/lib/types";

const OBRA_ID = "obra-1";

const obras: Obra[] = [
  {
    id: OBRA_ID,
    nome: "Complexo Industrial Vale",
    endereco: "Rod. BR-262, km 45 - Nova Lima/MG",
  },
];

const GRUPO_ID = "etapa-grupo-s103-s107";
const PRELIMINARES_ID = "etapa-preliminares-s103-s107";
const PISO_ID = "etapa-piso-s103-s107";

const etapasFixas: Etapa[] = [
  { id: GRUPO_ID, obraId: OBRA_ID, nome: "Sapata S103@S107", ordem: 1, predecessorasIds: [] },
  {
    id: PRELIMINARES_ID,
    obraId: OBRA_ID,
    etapaPaiId: GRUPO_ID,
    nome: "Serviços Preliminares",
    ordem: 1,
    predecessorasIds: [],
  },
];

const servicosFixos: ServicoNotavel[] = [
  { id: "serv-prelim-demolicao", etapaId: PRELIMINARES_ID, nome: "Demolição (m³)", ordem: 1, dataInicioPrevista: "2026-08-04", dataFimPrevista: "2026-08-07" },
  { id: "serv-prelim-escavacao", etapaId: PRELIMINARES_ID, nome: "Escavação (m³)", ordem: 2, dataInicioPrevista: "2026-08-05", dataFimPrevista: "2026-08-11" },
  { id: "serv-prelim-epc", etapaId: PRELIMINARES_ID, nome: "EPC", ordem: 3, dataInicioPrevista: "2026-08-11", dataFimPrevista: "2026-08-12" },
  { id: "serv-prelim-protecao", etapaId: PRELIMINARES_ID, nome: "Proteção (Cobertura)", ordem: 4, dataInicioPrevista: "2026-08-12", dataFimPrevista: "2026-08-13" },
  { id: "serv-prelim-regularizacao", etapaId: PRELIMINARES_ID, nome: "Regularização (m²)", ordem: 5, dataInicioPrevista: "2026-08-13", dataFimPrevista: "2026-08-14" },
  { id: "serv-prelim-concreto-magro", etapaId: PRELIMINARES_ID, nome: "Concreto Magro (m³)", ordem: 6, dataInicioPrevista: "2026-08-14", dataFimPrevista: "2026-08-14" },
];

interface DataServico {
  nome: string;
  inicio: string;
  fim: string;
}

function sapataBranch(params: {
  numero: string;
  ordemNoGrupo: number;
  pedestais: string;
  servicosFooting: DataServico[];
  servicosPedestal: DataServico[];
}) {
  const footingId = `etapa-sapata-${params.numero}`;
  const pedestalId = `etapa-pedestal-${params.numero}`;

  const etapas: Etapa[] = [
    {
      id: footingId,
      obraId: OBRA_ID,
      etapaPaiId: GRUPO_ID,
      nome: `Sapata S${params.numero}`,
      ordem: params.ordemNoGrupo,
      predecessorasIds: [PRELIMINARES_ID],
    },
    {
      id: pedestalId,
      obraId: OBRA_ID,
      etapaPaiId: footingId,
      nome: `Pedestal ${params.pedestais}`,
      ordem: 1,
      predecessorasIds: [footingId],
    },
  ];

  const servicos: ServicoNotavel[] = [
    ...params.servicosFooting.map((sv, i) => ({
      id: `serv-sapata-${params.numero}-${i}`,
      etapaId: footingId,
      nome: sv.nome,
      ordem: i + 1,
      dataInicioPrevista: sv.inicio,
      dataFimPrevista: sv.fim,
    })),
    ...params.servicosPedestal.map((sv, i) => ({
      id: `serv-pedestal-${params.numero}-${i}`,
      etapaId: pedestalId,
      nome: sv.nome,
      ordem: i + 1,
      dataInicioPrevista: sv.inicio,
      dataFimPrevista: sv.fim,
    })),
  ];

  return { footingId, pedestalId, etapas, servicos };
}

const s107 = sapataBranch({
  numero: "107",
  ordemNoGrupo: 2,
  pedestais: "PE107A/ 107B/ 107C/ 107D",
  servicosFooting: [
    { nome: "Armação (kg)", inicio: "2026-08-17", fim: "2026-08-18" },
    { nome: "Fôrma (m²)", inicio: "2026-08-18", fim: "2026-08-20" },
    { nome: "Concreto (m³)", inicio: "2026-08-20", fim: "2026-08-21" },
    { nome: "Reaterro (m³)", inicio: "2026-08-21", fim: "2026-08-24" },
  ],
  servicosPedestal: [
    { nome: "EPC", inicio: "2026-10-07", fim: "2026-10-08" },
    { nome: "Armação (kg)", inicio: "2026-10-08", fim: "2026-10-09" },
    { nome: "Chumbador (kg)", inicio: "2026-10-09", fim: "2026-10-14" },
    { nome: "Armação (kg)", inicio: "2026-10-14", fim: "2026-10-14" },
    { nome: "Fôrma (m²)", inicio: "2026-10-14", fim: "2026-10-15" },
    { nome: "Concreto (m³)", inicio: "2026-10-15", fim: "2026-10-16" },
    { nome: "Curo de Concreto", inicio: "2026-10-16", fim: "2026-10-19" },
    { nome: "Desforma (m²)", inicio: "2026-10-19", fim: "2026-10-19" },
    { nome: "Reaterro (m³)", inicio: "2026-10-19", fim: "2026-10-20" },
  ],
});

const s106 = sapataBranch({
  numero: "106",
  ordemNoGrupo: 3,
  pedestais: "PE106A/ 106B/ 106C/ 106D",
  servicosFooting: [
    { nome: "Armação (kg)", inicio: "2026-08-18", fim: "2026-08-19" },
    { nome: "Fôrma (m²)", inicio: "2026-08-20", fim: "2026-08-21" },
    { nome: "Concreto (m³)", inicio: "2026-08-24", fim: "2026-08-24" },
    { nome: "Reaterro (m³)", inicio: "2026-08-24", fim: "2026-08-25" },
  ],
  servicosPedestal: [
    { nome: "EPC", inicio: "2026-10-08", fim: "2026-10-09" },
    { nome: "Armação (kg)", inicio: "2026-10-09", fim: "2026-10-13" },
    { nome: "Chumbador (kg)", inicio: "2026-10-14", fim: "2026-10-16" },
    { nome: "Armação (kg)", inicio: "2026-10-16", fim: "2026-10-16" },
    { nome: "Fôrma (m²)", inicio: "2026-10-16", fim: "2026-10-19" },
    { nome: "Concreto (m³)", inicio: "2026-10-19", fim: "2026-10-20" },
    { nome: "Curo de Concreto", inicio: "2026-10-20", fim: "2026-10-23" },
    { nome: "Desforma (m²)", inicio: "2026-10-23", fim: "2026-10-23" },
    { nome: "Reaterro (m³)", inicio: "2026-10-23", fim: "2026-10-26" },
  ],
});

const s105 = sapataBranch({
  numero: "105",
  ordemNoGrupo: 4,
  pedestais: "PE105A/ 105B/ 105C/ 105D",
  servicosFooting: [
    { nome: "Armação (kg)", inicio: "2026-08-19", fim: "2026-08-20" },
    { nome: "Fôrma (m²)", inicio: "2026-08-21", fim: "2026-08-25" },
    { nome: "Concreto (m³)", inicio: "2026-08-25", fim: "2026-08-26" },
    { nome: "Reaterro (m³)", inicio: "2026-08-26", fim: "2026-08-27" },
  ],
  servicosPedestal: [
    { nome: "EPC", inicio: "2026-10-09", fim: "2026-10-13" },
    { nome: "Armação (kg)", inicio: "2026-10-13", fim: "2026-10-14" },
    { nome: "Chumbador (kg)", inicio: "2026-10-14", fim: "2026-10-16" },
    { nome: "Armação (kg)", inicio: "2026-10-16", fim: "2026-10-16" },
    { nome: "Fôrma (m²)", inicio: "2026-10-16", fim: "2026-10-19" },
    { nome: "Concreto (m³)", inicio: "2026-10-19", fim: "2026-10-20" },
    { nome: "Curo de Concreto", inicio: "2026-10-20", fim: "2026-10-23" },
    { nome: "Desforma (m²)", inicio: "2026-10-23", fim: "2026-10-23" },
    { nome: "Reaterro (m³)", inicio: "2026-10-23", fim: "2026-10-26" },
  ],
});

const s104 = sapataBranch({
  numero: "104",
  ordemNoGrupo: 5,
  pedestais: "PE104A/ 104B/ 104C/ 104D",
  servicosFooting: [
    { nome: "Armação (kg)", inicio: "2026-08-20", fim: "2026-08-21" },
    { nome: "Fôrma (m²)", inicio: "2026-08-25", fim: "2026-08-26" },
    { nome: "Concreto (m³)", inicio: "2026-08-27", fim: "2026-08-27" },
    { nome: "Reaterro (m³)", inicio: "2026-08-27", fim: "2026-08-28" },
  ],
  servicosPedestal: [
    { nome: "EPC", inicio: "2026-10-13", fim: "2026-10-14" },
    { nome: "Armação (kg)", inicio: "2026-10-14", fim: "2026-10-15" },
    { nome: "Chumbador (kg)", inicio: "2026-10-15", fim: "2026-10-19" },
    { nome: "Armação (kg)", inicio: "2026-10-19", fim: "2026-10-19" },
    { nome: "Fôrma (m²)", inicio: "2026-10-19", fim: "2026-10-20" },
    { nome: "Concreto (m³)", inicio: "2026-10-20", fim: "2026-10-21" },
    { nome: "Curo de Concreto", inicio: "2026-10-21", fim: "2026-10-24" },
    { nome: "Desforma (m²)", inicio: "2026-10-26", fim: "2026-10-26" },
    { nome: "Reaterro (m³)", inicio: "2026-10-26", fim: "2026-10-27" },
  ],
});

const s103 = sapataBranch({
  numero: "103",
  ordemNoGrupo: 6,
  pedestais: "PE103A/ 103B/ 103C/ 103D",
  servicosFooting: [
    { nome: "Armação (kg)", inicio: "2026-08-21", fim: "2026-08-24" },
    { nome: "Fôrma (m²)", inicio: "2026-08-26", fim: "2026-08-27" },
    { nome: "Concreto (m³)", inicio: "2026-08-28", fim: "2026-08-31" },
    { nome: "Reaterro (m³)", inicio: "2026-08-31", fim: "2026-08-31" },
  ],
  servicosPedestal: [
    { nome: "EPC", inicio: "2026-10-14", fim: "2026-10-15" },
    { nome: "Armação (kg)", inicio: "2026-10-15", fim: "2026-10-16" },
    { nome: "Chumbador (kg)", inicio: "2026-10-16", fim: "2026-10-20" },
    { nome: "Armação (kg)", inicio: "2026-10-20", fim: "2026-10-20" },
    { nome: "Fôrma (m²)", inicio: "2026-10-20", fim: "2026-10-21" },
    { nome: "Concreto (m³)", inicio: "2026-10-21", fim: "2026-10-22" },
    { nome: "Curo de Concreto", inicio: "2026-10-22", fim: "2026-10-25" },
    { nome: "Desforma (m²)", inicio: "2026-10-26", fim: "2026-10-26" },
    { nome: "Reaterro (m³)", inicio: "2026-10-26", fim: "2026-10-27" },
  ],
});

const sapatas = [s107, s106, s105, s104, s103];

const etapaPiso: Etapa = {
  id: PISO_ID,
  obraId: OBRA_ID,
  etapaPaiId: GRUPO_ID,
  nome: "Piso da S103 @ S107 - Serviço Complementares",
  ordem: 7,
  predecessorasIds: sapatas.map((s) => s.pedestalId),
};

const servicosPiso: ServicoNotavel[] = [
  { id: "serv-piso-concreto-magro", etapaId: PISO_ID, nome: "Concreto Magro (m³)", ordem: 1, dataInicioPrevista: "2026-10-28", dataFimPrevista: "2026-10-28" },
  { id: "serv-piso-tela", etapaId: PISO_ID, nome: "Tela (kg)", ordem: 2, dataInicioPrevista: "2026-10-28", dataFimPrevista: "2026-10-29" },
  { id: "serv-piso-junta", etapaId: PISO_ID, nome: "Junta", ordem: 3, dataInicioPrevista: "2026-10-28", dataFimPrevista: "2026-10-29" },
  { id: "serv-piso-forma", etapaId: PISO_ID, nome: "Fôrma (m²)", ordem: 4, dataInicioPrevista: "2026-10-29", dataFimPrevista: "2026-10-30" },
  { id: "serv-piso-concreto", etapaId: PISO_ID, nome: "Concreto (m³)", ordem: 5, dataInicioPrevista: "2026-10-30", dataFimPrevista: "2026-10-30" },
];

const SERVICO_DEMO_ID = "serv-sapata-107-0";

const perguntas: Pergunta[] = [
  { id: "p-arm-1", servicoId: SERVICO_DEMO_ID, texto: "Projeto estrutural liberado?", tipo: "boolean", obrigatoria: true, ordem: 1 },
  { id: "p-arm-2", servicoId: SERVICO_DEMO_ID, texto: "Aço disponível?", tipo: "boolean", obrigatoria: true, ordem: 2 },
  { id: "p-arm-3", servicoId: SERVICO_DEMO_ID, texto: "Aço cortado?", tipo: "boolean", obrigatoria: true, ordem: 3 },
  { id: "p-arm-4", servicoId: SERVICO_DEMO_ID, texto: "Armadores disponíveis?", tipo: "boolean", obrigatoria: true, ordem: 4 },
  { id: "p-arm-5", servicoId: SERVICO_DEMO_ID, texto: "Ferramentas disponíveis?", tipo: "boolean", obrigatoria: true, ordem: 5 },
  { id: "p-arm-6", servicoId: SERVICO_DEMO_ID, texto: "Frente liberada?", tipo: "boolean", obrigatoria: true, ordem: 6 },
  { id: "p-arm-7", servicoId: SERVICO_DEMO_ID, texto: "Inspeção da qualidade realizada?", tipo: "boolean", obrigatoria: true, ordem: 7 },
  { id: "p-arm-8", servicoId: SERVICO_DEMO_ID, texto: "Fotos anexadas?", tipo: "foto", obrigatoria: true, ordem: 8 },
];

const apontamentos: Apontamento[] = [
  {
    id: "apont-arm-107",
    servicoId: SERVICO_DEMO_ID,
    respostas: [
      { perguntaId: "p-arm-1", valor: "sim" },
      { perguntaId: "p-arm-2", valor: "sim" },
      { perguntaId: "p-arm-3", valor: "sim" },
      { perguntaId: "p-arm-4", valor: "sim" },
      { perguntaId: "p-arm-5", valor: "nao_aplica" },
      { perguntaId: "p-arm-6", valor: "nao" },
      { perguntaId: "p-arm-7", valor: "nao" },
    ],
    fotos: ["foto-armacao-s107.jpg"],
    observacoes: "Falta liberação de frente e inspeção de qualidade.",
    autor: "João Apontador",
    criadoEm: new Date("2026-08-16T14:30:00").toISOString(),
  },
];

const etapas: Etapa[] = [
  ...etapasFixas,
  ...sapatas.flatMap((s) => s.etapas),
  etapaPiso,
];

const servicos: ServicoNotavel[] = [
  ...servicosFixos,
  ...sapatas.flatMap((s) => s.servicos),
  ...servicosPiso,
];

export const SEED = { obras, etapas, servicos, perguntas, apontamentos };
