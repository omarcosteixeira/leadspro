/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'Admin Master' | 'Promotor' | 'FDV' | 'Sala de Matrícula' | 'QG' | 'Líder/FDV' | 'SSA' | 'Gestor Unidade' | 'Gestor Comercial' | 'Acadêmico' | 'Promotor/rua' | 'Gerente Comercial (Comercial)' | 'FDV (Comercial)' | 'Financeiro' | 'Técnico';

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  cpf?: string;
  dataNascimento?: string;
  phone?: string;
  role: UserRole;
  chavePix?: string;
  blocked?: boolean;
  mustChangePassword?: boolean;
  botNumber?: string;
  servidor?: 'principal' | 'comercial';
  linkadoA?: string; // used for Promotor/rua to link to FDV
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
    aniversarios?: boolean;
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
  metaBoletos?: number;
  metaInscritos?: number;
  precisaPromotor?: boolean;
  promotoresSelecionados?: string[];
  presencaPromotores?: { [promoterUid: string]: boolean };
  dadosPresencaPromotores?: { [promoterUid: string]: { empresa?: 'GR15' | 'RP7'; horas?: number } };
  valorPromotor?: number;
  valorOrcado?: number;
  statusPagamentoPromotores?: { [promoterUid: string]: 'Agendada' | 'Recusada' | 'Realizada' };
  colaboradorId?: string;
  colaboradorNome?: string;
  tipoAtividade?: 'Ação' | 'Visita';
  empresaParceiraId?: string;
  empresaParceiraNome?: string;
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
  empresa?: string;
  status: 'Pendente' | 'Sem retorno' | 'Interessado' | 'Não Interessado' | 'Convertido';
  createdAt: any;
  promotorId: string;
  promotorName: string;
  promotorRole?: string;
  linkadoA?: string;
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
  periodo?: string;
  numeroMatricula?: string;
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
  matAcad: boolean | string;
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
  telefone: string; // company phone
  email: string;
  endereco: string;
  bairro?: string;
  linkMaps: string;
  telefoneResponsavel?: string;
  classificacao?: 'Bronze' | 'Prata' | 'Ouro' | '';
  seguimento?: string;
  cnpj?: string;
  statusEmpresa?: 'Conveniada' | 'Em tratativa' | 'Cancelada' | 'Não visitada' | '';
  linkSales?: string;
  createdAt: any;
  unidadesVinculadas?: string[];
  consultorId?: string;
  consultorNome?: string;
  lembrete?: string;
}

export interface WhatsAppMessage {
  id: string;
  tipo: 'historico' | 'bases' | 'gap' | 'fiesProuni' | 'gap_0' | 'gap_1' | 'fiesProuni_0' | 'fiesProuni_1' | 'gap_ok' | 'fiesProuni_ok' | 'bases_renovacao';
  texto: string;
  nome?: string;
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

export interface MetaDia {
  id: string;
  data: string;
  aaPresencial: number;
  ytdPresencial: number;
  realizadoPresencial: number;
  aaSemipresencial: number;
  ytdSemipresencial: number;
  realizadoSemipresencial: number;
  aaDigital: number;
  ytdDigital: number;
  realizadoDigital: number;
  createdAt: any;
}

export interface BotConfig {
  id?: string;
  url: string;
  active: boolean;
  trainingContext?: string;
  botNames?: Record<string, string>;
  loginLogo?: string;
  groqApiKey?: string;
  updatedAt?: any;
}

export interface SolicitacaoFolga {
  id: string;
  solicitanteId: string;
  solicitanteNome: string;
  solicitanteEmail: string;
  solicitanteRole: UserRole;
  dataInicio: string;  // Format YYYY-MM-DD
  dataFim: string;     // Format YYYY-MM-DD
  tipo: 'Folga' | 'Férias';
  status: 'Pendente' | 'Aprovado' | 'Recusado';
  aprovadoPorId?: string;
  aprovadoPorNome?: string;
  justificativa?: string;
  createdAt: any;
  updatedAt?: any;
}

export interface CursoDisponivel {
  id: string;
  nomeUnidade: string;
  produto: 'Graduação' | 'Técnico' | 'Pós-graduação';
  curso: string;
  metodologia: string;
  duracao: string;
  turno?: string;
  createdAt: any;
}

export interface InsumoItem {
  material: string;
  quantidade: number;
}

export interface InsumoPedido {
  id: string;
  professorNome: string;
  cursoNome: string;
  disciplinaNome: string;
  motivoUso: string;
  itens: InsumoItem[];
  status: 'Pendente' | 'Aprovado' | 'Rejeitado' | 'Em Andamento' | 'Entregue';
  solicitanteId: string;
  solicitanteNome: string;
  tipoFicha?: 'docente' | 'administrativo';
  createdAt: any;
  updatedAt?: any;
}

export interface InsumoEstoque {
  id: string;
  material: string;
  quantidade: number;
  unidadeMedida?: string;
  estoqueMinimo?: number;
  descricao?: string;
  updatedAt: any;
}

export interface InsumoItemComercial {
  material: string;
  quantidade: number;
}

export interface InsumoPedidoComercial {
  id: string;
  motivoUso: string;
  itens: InsumoItemComercial[];
  status: 'Pendente' | 'Aprovado' | 'Rejeitado' | 'Em Andamento' | 'Entregue';
  solicitanteId: string;
  solicitanteNome: string;
  createdAt: any;
  updatedAt?: any;
  professorNome?: string;
  cursoNome?: string;
  disciplinaNome?: string;
  tipoFicha?: 'docente' | 'administrativo';
  matricula?: string;
}

export interface InsumoEstoqueComercial {
  id: string;
  material: string;
  quantidade: number;
  unidadeMedida?: string;
  estoqueMinimo?: number;
  descricao?: string;
  ownerId: string;
  ownerName: string;
  updatedAt: any;
}

export interface Funcionario {
  id: string;
  nome: string;
  email: string;
  tipo: 'docente' | 'administrativo';
  matricula: string;
  createdAt: any;
}

export interface InsumoBaixa {
  id: string;
  materialId: string;
  materialNome: string;
  quantidade: number;
  motivo: 'Uso em aula' | 'Uso no setor' | 'Material vencido(lixo)';
  realizadoPor: string;
  createdAt: any;
}

export interface BotReport {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  telefone: string;
  tipoContato: 'leads' | 'bases' | 'bases_renovacao' | 'fies_prouni' | 'gap' | 'outro';
  baseName?: string;
  sentAt: any;
}



