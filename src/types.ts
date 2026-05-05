/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'Admin Master' | 'Promotor' | 'FDV' | 'Sala de Matrícula' | 'QG' | 'Líder/FDV' | 'SSA' | 'Gestor Unidade' | 'Gestor Comercial' | 'Acadêmico';

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  phone?: string;
  role: UserRole;
  chavePix?: string;
  blocked?: boolean;
  mustChangePassword?: boolean;
  botNumber?: string;
  createdAt: any;
  updatedAt?: any;
  dashboardWidgets?: {
    stats: boolean;
    links: boolean;
    planner: boolean;
    campanhas: boolean;
    bomDia: boolean;
    forecast: boolean;
    periodo: boolean;
  };
}

export interface CalendarioAcao {
  id: string;
  nome: string;
  dataInicio: string;
  dataFim: string;
  local: string;
  observacao: string;
  concluida: boolean;
  fotos?: string[];
  creatorId?: string;
  creatorRole?: string;
  createdAt: any;
}

export interface Campanha {
  id: string;
  nome: string;
  dataInicio: string;
  dataFim: string;
  objetivo: string;
  createdAt: any;
}

export interface Lead {
  id: string;
  acao: string;
  nome: string;
  telefone: string;
  cpf?: string;
  cursoInteresse?: string;
  status: 'Pendente' | 'Sem retorno' | 'Interessado' | 'Não Interessado' | 'Convertido';
  createdAt: any;
  promotorId: string;
  promotorName: string;
  promotorRole?: string;
}

export interface BaseEntry {
  id: string;
  nomeBase: string;
  nome: string;
  telefone: string;
  cpf?: string;
  curso: string;
  produto: 'Graduação' | 'Técnico' | 'Pós-graduação';
  numeroOportunidade: string;
  semestre: string;
  metodologia: string;
  formaIngresso: string;
  status: 'Pendente' | 'Interessado' | 'Convertido' | 'Não tem interesse' | 'Sem retorno';
  createdAt: any;
}

export interface GapEntry {
  id: string;
  nome: string;
  telefone: string;
  cpf: string;
  produto: 'Graduação' | 'Técnico' | 'Pós-graduação';
  numeroOportunidade: string;
  curso: string;
  metodologia: string;
  formaIngresso: string;
  matAcad: boolean;
  numeroMatricula?: string;
  periodo?: string;
  documentos: {
    rg?: boolean;
    cpf?: boolean;
    diploma?: boolean;
    enem?: boolean;
    historico?: boolean;
    planoEnsino?: boolean;
    contrato?: boolean;
    carta?: boolean;
  };
  createdAt: any;
}

export interface BomDiaMetrics {
  insc: number;
  matFin: number;
  matAcad: number;
}

export interface BomDiaCaptacao {
  id: string;
  titulo: string;
  metaFinal: BomDiaMetrics;
  metaDia: BomDiaMetrics;
  anoAnterior: BomDiaMetrics;
  real: BomDiaMetrics;
  data: string;
  createdAt: any;
}

export interface ForecastCaptacao {
  id: string;
  nome: string;
  dataInicio: string;
  dataFim: string;
  metaDiaYTD: number;
  realizado: number;
  metaFechamento: number;
  createdAt: any;
}

export interface PlannerTask {
  id: string;
  dayOfWeek: string;
  atendenteName: string;
  baseName: string;
}

export interface FiesProuniEntry {
  id: string;
  nome: string;
  cpf: string;
  telefone: string;
  tipo: 'FIES' | 'PROUNI';
  bolsa: 'Parcial' | 'Total';
  metodologia: string;
  curso: string;
  inscricaoSales: string;
  numeroMatricula: string;
  tcbAssinado: boolean;
  digitalizaStatus: 'Não Postado' | 'Em Análise' | 'Concluído' | 'Documento reprovado';
  documentosEntregues: string[];
  docsEntreguesStatus: 'Sim' | 'Parcial' | 'Pendente' | 'Não compareceu';
  responsavelEntrevista: string;
  dataEntrevista: string;
  email: string;
  status: string;
  endereco: string;
  observacao: string;
  periodo: string;
  lista: string;
  posicaoRanking: string;
  sisprouniStatus?: 'Pendente' | 'Aprovado' | 'Reprovado';
  createdAt: any;
}

export interface LinkUtil {
  id: string;
  nome: string;
  url: string;
}

export interface PeriodoCaptacao {
  id: string;
  nome: string;
  inicioInscricao: string;
  fimInscricao: string;
  inicioMatFin: string;
  fimMatFin: string;
  inicioMatAcad: string;
  fimMatAcad: string;
  createdAt: any;
}

export interface EmpresaParceira {
  id: string;
  nome: string;
  responsavel: string;
  telefone: string;
  email: string;
  endereco: string;
  linkMaps: string;
  createdAt: any;
}

export interface WhatsAppMessage {
  id: string;
  tipo: 'historico' | 'bases' | 'gap' | 'fiesProuni' | 'gap_0' | 'gap_1' | 'fiesProuni_0' | 'fiesProuni_1' | 'gap_ok' | 'fiesProuni_ok' | 'bases_renovacao';
  texto: string;
  updatedAt: any;
}

export interface Aviso {
  id: string;
  url: string;
  titulo?: string;
  descricao?: string;
  createdAt: any;
}

export interface MapaoDisciplina {
  codDisc: string;
  disciplina: string;
  dia: string;
  horario: string;
  turma: string;
  tipoDisciplina: 'PRESENCIAL' | 'TEAMS' | 'ONLINE' | string;
  professor: string;
  matricula: string;
  observacao: string;
  linkAula?: string;
}

export interface MapaoAcademicoEntry {
  id: string;
  modalidade: string;
  curso: string;
  periodo: string;
  tipoCurso: 'GRADUACAO' | 'TECNICO';
  disciplinas: MapaoDisciplina[];
  createdAt: any;
}

export interface BaseDisparoEntry {
  id: string;
  data: string;
  nomeBase: string;
  totalDisparos: number;
  positivos: number;
  negativos: number;
  createdAt: any;
}

export interface BotConfig {
  id?: string;
  url: string;
  active: boolean;
  trainingContext?: string;
  updatedAt?: any;
}
