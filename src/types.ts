/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'Admin Master' | 'Promotor' | 'FDV' | 'Sala de Matrícula' | 'QG' | 'Líder/FDV' | 'SSA' | 'Gestor Unidade' | 'Gestor Comercial' | 'Acadêmico' | 'Promotor/rua' | 'Gerente Comercial (Comercial)' | 'FDV (Comercial)' | 'Financeiro' | 'Técnico';

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  nome?: string;
  cpf?: string;
  dataNascimento?: string;
  phone?: string;
  role: UserRole;
  chavePix?: string;
  telegram?: string;
  blocked?: boolean;
  mustChangePassword?: boolean;
  botNumber?: string;
  unidade?: string;
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
    qgLigacoes?: boolean;
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
  status?: string;
  fotos?: string[];
  creatorId?: string;
  creatorRole?: string;
  createdAt: any;
  metaBoletos?: number;
  metaInscritos?: number;
  boletosFeitos?: number;
  leadsFeitos?: number;
  precisaPromotor?: boolean;
  promotoresSelecionados?: string[];
  presencaPromotores?: { [promoterUid: string]: boolean };
  dadosPresencaPromotores?: { [promoterUid: string]: { empresa?: 'GR15' | 'RP7'; horas?: number } };
  valorPromotor?: number;
  valorOrcado?: number;
  statusPagamentoPromotores?: { [promoterUid: string]: 'Pendente' | 'Recusada' | 'Realizada' };
  colaboradorId?: string;
  colaboradorNome?: string;
  colaboradoresIds?: string[];
  colaboradoresNomes?: string[];
  tipoAtividade?: 'Ação' | 'Visita';
  empresaParceiraId?: string;
  empresaParceiraNome?: string;
  unidade?: string;
  horario?: string;
}

export interface Campanha {
  id: string;
  nome: string;
  dataInicio: string;
  dataFim: string;
  objetivo: string;
  status?: string;
  createdAt: any;
}

export interface Lead {
  id: string;
  acao: string;
  acaoId?: string;
  nome: string;
  telefone: string;
  cpf?: string;
  cursoInteresse?: string;
  empresa?: string;
  status: 'Pendente' | 'Sem retorno' | 'Interessado' | 'Não Interessado' | 'Convertido';
  converted?: boolean;
  createdAt: any;
  promotorId: string;
  promotorName: string;
  promotorRole?: string;
  linkadoA?: string;
  unidade?: string;
  email?: string;
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
  unidade?: string;
  email?: string;
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
  semestre?: string;
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
  acao?: string;
  acaoId?: string;
  unidade?: string;
  createdAt: any;
}

export interface ControleConcorrencia {
  id: string;
  ies: string;
  curso: string;
  valor: number;
  bairro: string;
  descontoExtra?: string;
  observacao?: string;
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
  oculto?: boolean;
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
  oculto?: boolean;
  createdAt: any;
}

export interface PlannerTask {
  id: string;
  dayOfWeek: string;
  atendenteName: string;
  baseName: string;
}

export interface FiesProuniVaga {
  id: string;
  periodo: string;
  codCurso: string;
  curso: string;
  turno: string;
  metodologia: string;
  bolsa: '50%' | '100%';
  vagas: number;
  unidade?: string;
  createdAt: any;
  updatedAt?: any;
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
  unidade?: string;
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
  cidade?: string;
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
  notificado3d?: boolean;
  notificado7d?: boolean;
  notificado15d?: boolean;
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

export interface EvasaoRecord {
  id: string;
  atendimento: string;
  tipoAtendimento: string;
  horario: string;
  unidade: string;
  modalidade: string;
  matricula: string;
  curso: string;
  safra: string;
  nome: string;
  contato: string;
  status: string;
  pendencia: string;
  resultado: string;
  trancamentoCancelamento: string;
  periodo?: string;
  tipoSolicitacao?: string;
  observacao?: string;
  createdAt: any;
  updatedAt?: any;
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
  aaTecnico?: number;
  ytdTecnico?: number;
  realizadoTecnico?: number;
  aaPosGraduacao?: number;
  ytdPosGraduacao?: number;
  realizadoPosGraduacao?: number;
  createdAt: any;
}

export interface QgLigacao {
  id: string;
  nome: string;
  diaSemana: string | string[];
  horario: string;
  createdAt: any;
}

export interface BotConfig {
  id?: string;
  url: string;
  active: boolean;
  trainingContext?: string;
  botNames?: Record<string, string>;
  loginLogo?: string;
  openRouterApiKey?: string;
  telegramBotUrl?: string;
  telegramApiKey?: string;
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
  unidade?: string;
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

export interface PedidoCursoEntry {
  id: string;
  nome: string;
  telefone: string;
  curso: string;
  createdAt: any;
}

export interface IsencaoEntry {
  id: string;
  nome: string;
  cpf: string;
  telefone: string;
  numeroOportunidade?: string;
  curso: string;
  cursoOrigem?: string;
  universidadeOrigem?: string;
  formaIngresso?: string;
  inseridoDigitaliza: 'Sim' | 'Não';
  status: 'Pendente' | 'Solicitado' | 'Deferido';
  boletoPago: boolean;
  resultado?: 'Convertido' | 'Sem interesse';
  observacaoResultado?: string;
  createdAt: any;
  updatedAt?: any;
  createdByNome?: string;
  unidade?: string;
}

export interface Ligacao {
  id: string;
  candidatoId: string; // Lead ID or BaseEntry ID
  candidatoNome: string;
  candidatoTelefone: string;
  origem: 'Lead' | 'Base';
  origemId: string; // acaoId or baseName
  status: 'Não atendeu' | 'Sem interesse' | 'Interesse' | 'Convertido';
  observacao?: string;
  atendenteId: string;
  atendenteNome: string;
  unidade?: string;
  createdAt: any;
}

export interface PeriodAnalysis {
  periodo: string;
  meta: number;
  realizado: number;
}

export interface AnalysisScheme {
  id: string;
  nome: string;
  periodos: PeriodAnalysis[];
  createdAt: any;
}



