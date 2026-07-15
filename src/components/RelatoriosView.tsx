import React, { useState, useMemo, useRef } from "react";
import { 
  BarChart3, 
  Download, 
  Users, 
  CheckCircle2, 
  TrendingUp, 
  UserPlus, 
  Target, 
  GraduationCap, 
  Database,
  Calendar,
  Building2,
  Boxes,
  FileText,
  Clock,
  LayoutDashboard,
  CheckCircle,
  Phone,
  XCircle,
  Search,
  History as HistoryIcon,
  ChevronUp,
  ChevronDown
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area
} from "recharts";
import { cn } from "../lib/utils";
import { 
  UserProfile, 
  Lead, 
  BaseEntry, 
  FiesProuniEntry, 
  CalendarioAcao, 
  EmpresaParceira, 
  InsumoPedido, 
  InsumoEstoque,
  InsumoBaixa,
  IsencaoEntry,
  PedidoCursoEntry,
  MetaDia,
  Ligacao,
  AnalysisScheme
} from "../types";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { InsumosDashboard } from "./InsumosDashboard";

// Reusing StatCard or defining it locally for portability
const StatCard = ({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string;
  value: string | number;
  icon: any;
  color: string;
}) => (
  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-4">
    <div className={cn("p-3 rounded-xl text-white", color)}>
      <Icon size={24} />
    </div>
    <div>
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
    </div>
  </div>
);

interface RelatoriosViewProps {
  leads: Lead[];
  bases: BaseEntry[];
  fiesProuni: FiesProuniEntry[];
  calendarioAcoes: CalendarioAcao[];
  empresasParceiras: EmpresaParceira[];
  insumosPedidos: InsumoPedido[];
  insumosEstoque: InsumoEstoque[];
  insumosBaixas: InsumoBaixa[];
  isencoes: IsencaoEntry[];
  pedidosCursos?: PedidoCursoEntry[];
  metaDia?: MetaDia[];
  ligacoes?: Ligacao[];
  analysisSchemes?: AnalysisScheme[];
  profile: UserProfile;
  onToast: (m: string, t?: "success" | "error") => void;
}

export function RelatoriosView({
  leads,
  bases,
  fiesProuni,
  calendarioAcoes,
  empresasParceiras,
  insumosPedidos,
  insumosEstoque,
  insumosBaixas,
  isencoes,
  pedidosCursos = [],
  metaDia = [],
  ligacoes = [],
  analysisSchemes = [],
  profile,
  onToast
}: RelatoriosViewProps) {
  const [activeTab, setActiveTab] = useState<
    "historico" | "bases" | "fiesProuni" | "planoAcao" | "empresas" | "insumos" | "isencoes" | "pedidos_cursos" | "metaDia" | "ligacoes" | "crescimento"
  >("historico");

  const dashboardRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const exportToPDF = async () => {
    if (!dashboardRef.current) return;
    setIsExporting(true);
    onToast("Gerando PDF...");

    try {
      const canvas = await html2canvas(dashboardRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "px",
        format: [canvas.width / 2, canvas.height / 2],
      });

      pdf.addImage(imgData, "PNG", 0, 0, canvas.width / 2, canvas.height / 2);
      pdf.save(`Relatorio_${activeTab}_${new Date().toISOString().split("T")[0]}.pdf`);
      onToast("PDF exportado com sucesso!", "success");
    } catch (err) {
      console.error("Erro ao exportar PDF:", err);
      onToast("Erro ao exportar PDF.", "error");
    } finally {
      setIsExporting(false);
    }
  };

  // --- Filtering data for Unit Restriction ---
  const isPrivileged = 
    profile.role === "Admin Master" || 
    profile.role === "Gestor Comercial" || 
    profile.role === "Gerente Comercial (Comercial)";

  const filteredLeads = useMemo(() => {
    if (!isPrivileged) {
      return leads.filter(l => l.unidade === profile.unidade);
    }
    return leads;
  }, [leads, profile, isPrivileged]);

  const filteredBases = useMemo(() => {
    if (!isPrivileged) {
      return bases.filter(b => b.unidade === profile.unidade);
    }
    return bases;
  }, [bases, profile, isPrivileged]);

  const filteredFiesProuni = useMemo(() => {
    if (!fiesProuni) return [];
    if (!isPrivileged) {
      return fiesProuni.filter(f => f && f.unidade === profile.unidade);
    }
    return fiesProuni;
  }, [fiesProuni, profile, isPrivileged]);

  const filteredPlanoAcoes = useMemo(() => {
    if (!isPrivileged) {
      return calendarioAcoes.filter(a => a.unidade === profile.unidade);
    }
    return calendarioAcoes;
  }, [calendarioAcoes, profile, isPrivileged]);

  // --- Historico Leads Stats ---
  const historicoStats = useMemo(() => {
    const total = filteredLeads.length;
    const conv = filteredLeads.filter((l) => l.converted).length;
    const rate = total > 0 ? ((conv / total) * 100).toFixed(1) : "0";
    
    const statusGroups: Record<string, number> = {
      "Pendente": 0, "Convertido": 0, "Sem retorno": 0, "Interessado": 0, "Não Interessado": 0,
    };
    filteredLeads.forEach(l => {
      const s = l.converted ? "Convertido" : (l.status || "Pendente");
      if (statusGroups[s] !== undefined) statusGroups[s] += 1;
      else statusGroups["Pendente"] += 1;
    });

    const courseGroups: Record<string, number> = {};
    filteredLeads.forEach(l => {
      const c = l.cursoInteresse || "Não Informado";
      courseGroups[c] = (courseGroups[c] || 0) + 1;
    });
    const byCourse = Object.entries(courseGroups)
      .map(([name, count]) => ({
        name,
        count,
        percentage: total > 0 ? ((count / total) * 100).toFixed(1) : "0"
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return { total, conv, rate, byStatus: Object.entries(statusGroups).map(([name, count]) => ({ name, count, percentage: total > 0 ? ((count / total) * 100).toFixed(1) : "0" })), byCourse };
  }, [filteredLeads]);

  // --- Bases Stats ---
  const basesStats = useMemo(() => {
    const total = filteredBases.length;
    const groups: { [key: string]: number } = { "Pendente": 0, "Interessado": 0, "Convertido": 0, "Não tem interesse": 0, "Sem retorno": 0 };
    filteredBases.forEach((b) => {
      const s = b.status || "Pendente";
      if (groups[s] !== undefined) groups[s] += 1;
    });

    const productGroups: { [key: string]: number } = { "Graduação": 0, "Técnico": 0, "Pós-graduação": 0 };
    filteredBases.forEach((b) => {
      const p = b.produto || "Graduação";
      if (productGroups[p] !== undefined) productGroups[p] += 1;
    });

    return {
      total,
      byStatus: Object.entries(groups).map(([name, count]) => ({ name, count, percentage: total > 0 ? ((count / total) * 100).toFixed(1) : "0" })),
      byProduct: Object.entries(productGroups).map(([name, count]) => ({ name, count, percentage: total > 0 ? ((count / total) * 100).toFixed(1) : "0" }))
    };
  }, [filteredBases]);

  // --- Fies/Prouni Stats ---
  const fiesStats = useMemo(() => {
    const data = filteredFiesProuni || [];
    const total = data.length;
    const fies = data.filter(i => i && i.tipo === "FIES").length;
    const prouni = data.filter(i => i && i.tipo === "PROUNI").length;
    const matriculados = data.filter(i => i && i.numeroMatricula).length;
    
    return { total, fies, prouni, matriculados };
  }, [filteredFiesProuni]);

  // --- Plano de Ação Stats ---
  const [planoDataInicio, setPlanoDataInicio] = useState("");
  const [planoDataFim, setPlanoDataFim] = useState("");
  const [planoFiltroFdv, setPlanoFiltroFdv] = useState("");
  const [planoFiltroUnidade, setPlanoFiltroUnidade] = useState("");

  const filteredCalendarioAcoes = useMemo(() => {
    return filteredPlanoAcoes.filter((a) => {
      if (planoDataInicio && a.dataInicio < planoDataInicio) return false;
      if (planoDataFim && a.dataInicio > planoDataFim) return false;
      if (planoFiltroUnidade && a.unidade !== planoFiltroUnidade) return false;
      if (planoFiltroFdv) {
        const nomes = a.colaboradoresNomes?.length ? a.colaboradoresNomes : (a.colaboradorNome ? [a.colaboradorNome] : []);
        if (!nomes.includes(planoFiltroFdv)) return false;
      }
      return true;
    });
  }, [filteredPlanoAcoes, planoDataInicio, planoDataFim, planoFiltroFdv, planoFiltroUnidade]);

  const planoStats = useMemo(() => {
    const total = filteredCalendarioAcoes.length;
    const concluida = filteredCalendarioAcoes.filter(a => a.concluida).length;
    const pendente = total - concluida;
    
    let totalLeadsFeitos = 0;
    let totalBoletosFeitos = 0;

    const typeGroups: Record<string, number> = {};
    filteredCalendarioAcoes.forEach(a => {
      const t = a.nome.split(" ")[0] || "Outros"; // Simple heuristic for type
      typeGroups[t] = (typeGroups[t] || 0) + 1;
      totalLeadsFeitos += (Number(a.leadsFeitos) || 0);
      totalBoletosFeitos += (Number(a.boletosFeitos) || 0);
    });

    return { 
      total, 
      concluida, 
      pendente, 
      totalLeadsFeitos,
      totalBoletosFeitos,
      byType: Object.entries(typeGroups).map(([name, count]) => ({ name, count, percentage: total > 0 ? ((count / total) * 100).toFixed(1) : "0" })).sort((a,b) => b.count - a.count).slice(0, 5) 
    };
  }, [filteredCalendarioAcoes]);

  const uniqueUnidades = useMemo(() => {
    const units = new Set<string>();
    calendarioAcoes.forEach(a => {
      if (a.unidade) units.add(a.unidade);
    });
    return Array.from(units).sort();
  }, [calendarioAcoes]);

  const fdvsComercialUnicos = useMemo(() => {
    const fdvs = new Set<string>();
    calendarioAcoes.forEach(a => {
      if (a.colaboradoresNomes && a.colaboradoresNomes.length > 0) {
        a.colaboradoresNomes.forEach(n => fdvs.add(n));
      } else if (a.colaboradorNome) {
        fdvs.add(a.colaboradorNome);
      }
    });
    return Array.from(fdvs).sort();
  }, [calendarioAcoes]);

  const leadsPorPromotorPorAcao = useMemo(() => {
    const result: Record<string, Record<string, number>> = {};
    filteredCalendarioAcoes.forEach(a => {
      result[a.nome] = {};
    });
    
    leads.forEach(l => {
      if (l.acaoId) {
        const acao = filteredCalendarioAcoes.find(a => a.id === l.acaoId);
        if (acao) {
          const promotor = l.promotorName || "Sem promotor";
          result[acao.nome][promotor] = (result[acao.nome][promotor] || 0) + 1;
        }
      }
    });
    return result;
  }, [filteredCalendarioAcoes, leads]);

  const acoesNaoConcluidas = useMemo(() => {
    return filteredCalendarioAcoes.filter(a => !a.concluida);
  }, [filteredCalendarioAcoes]);

  // --- Empresas Stats ---
  const empresasStats = useMemo(() => {
    const total = empresasParceiras.length;
    const conveniadas = empresasParceiras.filter(e => e.statusEmpresa === "Conveniada").length;
    const emTratativa = empresasParceiras.filter(e => e.statusEmpresa === "Em tratativa").length;
    const classificacao = {
      Ouro: empresasParceiras.filter(e => e.classificacao === "Ouro").length,
      Prata: empresasParceiras.filter(e => e.classificacao === "Prata").length,
      Bronze: empresasParceiras.filter(e => e.classificacao === "Bronze").length,
    };

    return { total, conveniadas, emTratativa, classificacao };
  }, [empresasParceiras]);

  // --- Insumos Stats ---
  const insumosStats = useMemo(() => {
    const totalPedidos = insumosPedidos.length;
    const entregues = insumosPedidos.filter(p => p.status === "Entregue").length;
    const totalItensEstoque = insumosEstoque.reduce((acc, curr) => acc + curr.quantidade, 0);
    const itensCriticos = insumosEstoque.filter(e => e.quantidade < (e.estoqueMinimo || 5)).length;

    return { totalPedidos, entregues, totalItensEstoque, itensCriticos };
  }, [insumosPedidos, insumosEstoque]);

  // --- Isenções Stats ---
  const isencoesStats = useMemo(() => {
    const total = isencoes.length;
    const pendente = isencoes.filter((i) => i.status === "Pendente").length;
    const solicitado = isencoes.filter((i) => i.status === "Solicitado").length;
    const deferido = isencoes.filter((i) => i.status === "Deferido").length;
    const convertido = isencoes.filter((i) => i.resultado === "Convertido").length;
    const boletoPago = isencoes.filter((i) => i.boletoPago).length;

    const byCursoMap: Record<string, number> = {};
    const byOrigemMap: Record<string, number> = {};

    isencoes.forEach(i => {
      if (i.curso) {
        byCursoMap[i.curso] = (byCursoMap[i.curso] || 0) + 1;
      }
      if (i.universidadeOrigem) {
        byOrigemMap[i.universidadeOrigem] = (byOrigemMap[i.universidadeOrigem] || 0) + 1;
      }
    });

    const byCurso = Object.entries(byCursoMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({
        name,
        count,
        percentage: total > 0 ? ((count / total) * 100).toFixed(1) : "0",
      }));

    const byOrigem = Object.entries(byOrigemMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({
        name,
        count,
        percentage: total > 0 ? ((count / total) * 100).toFixed(1) : "0",
      }));

    return { total, pendente, solicitado, deferido, convertido, boletoPago, byCurso, byOrigem };
  }, [isencoes]);

  const metaDiaStats = useMemo(() => {
    const now = new Date();
    const today = now.toISOString().split("T")[0];
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    const initialStats = () => ({
      aaPresencial: 0, ytdPresencial: 0, realizadoPresencial: 0,
      aaSemipresencial: 0, ytdSemipresencial: 0, realizadoSemipresencial: 0,
      aaDigital: 0, ytdDigital: 0, realizadoDigital: 0,
      aaTecnico: 0, ytdTecnico: 0, realizadoTecnico: 0,
      aaPosGraduacao: 0, ytdPosGraduacao: 0, realizadoPosGraduacao: 0,
    });

    const reduceMeta = (items: MetaDia[]) => items.reduce((acc, curr) => {
      acc.aaPresencial += Number(curr.aaPresencial) || 0;
      acc.ytdPresencial += Number(curr.ytdPresencial) || 0;
      acc.realizadoPresencial += Number(curr.realizadoPresencial) || 0;

      acc.aaSemipresencial += Number(curr.aaSemipresencial) || 0;
      acc.ytdSemipresencial += Number(curr.ytdSemipresencial) || 0;
      acc.realizadoSemipresencial += Number(curr.realizadoSemipresencial) || 0;

      acc.aaDigital += Number(curr.aaDigital) || 0;
      acc.ytdDigital += Number(curr.ytdDigital) || 0;
      acc.realizadoDigital += Number(curr.realizadoDigital) || 0;

      acc.aaTecnico += Number(curr.aaTecnico) || 0;
      acc.ytdTecnico += Number(curr.ytdTecnico) || 0;
      acc.realizadoTecnico += Number(curr.realizadoTecnico) || 0;

      acc.aaPosGraduacao += Number(curr.aaPosGraduacao) || 0;
      acc.ytdPosGraduacao += Number(curr.ytdPosGraduacao) || 0;
      acc.realizadoPosGraduacao += Number(curr.realizadoPosGraduacao) || 0;

      return acc;
    }, initialStats());

    const allTime = reduceMeta(metaDia);
    const weekly = reduceMeta(metaDia.filter(m => m.data >= oneWeekAgo));
    const monthly = reduceMeta(metaDia.filter(m => m.data >= oneMonthAgo));

    return { allTime, weekly, monthly };
  }, [metaDia]);

  // --- Pedidos de Cursos Stats ---
  const pedidosCursosStats = useMemo(() => {
    const total = pedidosCursos.length;
    
    const byCursoMap: Record<string, number> = {};
    pedidosCursos.forEach(p => {
      if (p.curso) {
        const cursoNorm = p.curso.trim();
        byCursoMap[cursoNorm] = (byCursoMap[cursoNorm] || 0) + 1;
      }
    });

    const byCurso = Object.entries(byCursoMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({
        name,
        count,
        percentage: total > 0 ? ((count / total) * 100).toFixed(1) : "0",
      }));

    return { total, byCurso };
  }, [pedidosCursos]);

  // --- Ligações Stats ---
  const [ligacoesDataInicio, setLigacoesDataInicio] = useState("");
  const [ligacoesDataFim, setLigacoesDataFim] = useState("");
  const [ligacoesFiltroAtendente, setLigacoesFiltroAtendente] = useState("");
  const [ligacoesFiltroOrigem, setLigacoesFiltroOrigem] = useState("");
  const [ligacoesSearchTerm, setLigacoesSearchTerm] = useState("");

  const filteredLigacoes = useMemo(() => {
    return ligacoes.filter(l => {
      const callDate = l.createdAt?.seconds ? new Date(l.createdAt.seconds * 1000).toISOString().split('T')[0] : '';
      if (ligacoesDataInicio && callDate < ligacoesDataInicio) return false;
      if (ligacoesDataFim && callDate > ligacoesDataFim) return false;
      if (ligacoesFiltroAtendente && l.atendenteId !== ligacoesFiltroAtendente) return false;
      if (ligacoesFiltroOrigem && l.origemId !== ligacoesFiltroOrigem) return false;
      
      if (ligacoesSearchTerm) {
        const search = ligacoesSearchTerm.toLowerCase();
        return (
          l.atendenteNome?.toLowerCase().includes(search) || 
          l.candidatoNome?.toLowerCase().includes(search)
        );
      }
      
      return true;
    });
  }, [ligacoes, ligacoesDataInicio, ligacoesDataFim, ligacoesFiltroAtendente, ligacoesFiltroOrigem, ligacoesSearchTerm]);

  const ligacoesStats = useMemo(() => {
    const total = filteredLigacoes.length;
    const naoAtendeu = filteredLigacoes.filter(l => l.status === 'Não atendeu').length;
    const semInteresse = filteredLigacoes.filter(l => l.status === 'Sem interesse').length;
    const interesse = filteredLigacoes.filter(l => l.status === 'Interesse').length;
    const convertido = filteredLigacoes.filter(l => l.status === 'Convertido').length;

    const byStaff: Record<string, number> = {};
    const bySource: Record<string, { total: number, interesse: number, convertido: number }> = {};

    filteredLigacoes.forEach(l => {
      byStaff[l.atendenteNome] = (byStaff[l.atendenteNome] || 0) + 1;
      
      if (!bySource[l.origemId]) bySource[l.origemId] = { total: 0, interesse: 0, convertido: 0 };
      bySource[l.origemId].total += 1;
      if (l.status === 'Interesse') bySource[l.origemId].interesse += 1;
      if (l.status === 'Convertido') bySource[l.origemId].convertido += 1;
    });

    const staffChart = Object.entries(byStaff)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({
        name,
        count,
        percentage: total > 0 ? ((count / total) * 100).toFixed(1) : "0"
      }));

    const sourceRanking = Object.entries(bySource)
      .map(([id, stats]) => {
        const sourceName = calendarioAcoes.find(a => a.id === id)?.nome || id;
        return {
          name: sourceName,
          interesse: stats.interesse,
          total: stats.total,
          convertido: stats.convertido,
          rate: stats.total > 0 ? ((stats.interesse / stats.total) * 100).toFixed(1) : "0",
          convRate: stats.total > 0 ? ((stats.convertido / stats.total) * 100).toFixed(1) : "0"
        };
      })
      .sort((a, b) => Number(b.convRate) - Number(a.convRate))
      .slice(0, 10);

    const staffConvRanking = Object.entries(filteredLigacoes.reduce((acc, l) => {
      if (!acc[l.atendenteNome]) acc[l.atendenteNome] = { total: 0, conv: 0 };
      acc[l.atendenteNome].total += 1;
      if (l.status === 'Convertido') acc[l.atendenteNome].conv += 1;
      return acc;
    }, {} as Record<string, { total: number, conv: number }>))
      .map(([name, stats]) => ({
        name,
        conv: stats.conv,
        total: stats.total,
        rate: stats.total > 0 ? ((stats.conv / stats.total) * 100).toFixed(1) : "0"
      }))
      .sort((a, b) => b.conv - a.conv)
      .slice(0, 10);

    return { total, naoAtendeu, semInteresse, interesse, convertido, staffChart, sourceRanking, staffConvRanking };
  }, [filteredLigacoes, calendarioAcoes]);

  const atendentesUnicos = useMemo(() => {
    const atendentes = new Map<string, string>();
    ligacoes.forEach(l => atendentes.set(l.atendenteId, l.atendenteNome));
    return Array.from(atendentes.entries()).map(([id, name]) => ({ id, name }));
  }, [ligacoes]);

  const origensUnicas = useMemo(() => {
    const origens = new Set<string>();
    ligacoes.forEach(l => origens.add(l.origemId));
    return Array.from(origens).map(id => {
      const sourceName = calendarioAcoes.find(a => a.id === id)?.nome || id;
      return { id, name: sourceName };
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [ligacoes, calendarioAcoes]);

  const ligacoesChartDataByStaff = useMemo(() => {
    const data: Record<string, { name: string, atendidas: number, naoAtendidas: number, convertidas: number }> = {};
    filteredLigacoes.forEach(l => {
      if (!data[l.atendenteId]) {
        data[l.atendenteId] = { name: l.atendenteNome, atendidas: 0, naoAtendidas: 0, convertidas: 0 };
      }
      if (l.status === 'Não atendeu') {
        data[l.atendenteId].naoAtendidas += 1;
      } else if (l.status === 'Convertido') {
        data[l.atendenteId].convertidas += 1;
      } else {
        data[l.atendenteId].atendidas += 1;
      }
    });
    return Object.values(data).sort((a, b) => (a.atendidas + a.naoAtendidas + a.convertidas) - (b.atendidas + b.naoAtendidas + b.convertidas)).slice(0, 10);
  }, [filteredLigacoes]);

  const ligacoesChartDataByDate = useMemo(() => {
    const data: Record<string, { date: string, dateObj: Date, atendidas: number, naoAtendidas: number, convertidas: number }> = {};
    filteredLigacoes.forEach(l => {
      if (!l.createdAt?.seconds) return;
      const d = new Date(l.createdAt.seconds * 1000);
      const dateKey = d.toLocaleDateString('pt-BR');
      if (!data[dateKey]) {
        data[dateKey] = { 
          date: dateKey, 
          dateObj: new Date(d.getFullYear(), d.getMonth(), d.getDate()), 
          atendidas: 0, 
          naoAtendidas: 0,
          convertidas: 0
        };
      }
      if (l.status === 'Não atendeu') {
        data[dateKey].naoAtendidas += 1;
      } else if (l.status === 'Convertido') {
        data[dateKey].convertidas += 1;
      } else {
        data[dateKey].atendidas += 1;
      }
    });
    return Object.values(data)
      .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime())
      .slice(-15);
  }, [filteredLigacoes]);

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Relatórios e Dashboards</h2>
          <p className="text-slate-500 text-sm">Visualize o desempenho geral de todas as áreas do sistema.</p>
        </div>
        <button
          onClick={exportToPDF}
          disabled={isExporting}
          className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 disabled:opacity-50"
        >
          {isExporting ? <Clock className="animate-spin" size={20} /> : <Download size={20} />}
          <span>{isExporting ? "Gerando..." : "Exportar PDF"}</span>
        </button>
      </div>

      {/* Tabs Navigation */}
      <div className="flex flex-wrap gap-2 bg-slate-100 p-1 rounded-2xl border border-slate-200 w-fit">
        {[
          { id: "historico", label: "Leads", icon: Users },
          { id: "bases", label: "Bases", icon: Database },
          { id: "fiesProuni", label: "Fies/Prouni", icon: GraduationCap },
          { id: "planoAcao", label: "Plano de Ação", icon: Calendar },
          { id: "empresas", label: "Empresas", icon: Building2 },
          { id: "insumos", label: "Insumos", icon: Boxes },
          { id: "isencoes", label: "Isenções", icon: FileText },
          { id: "pedidos_cursos", label: "Pedidos de Cursos", icon: UserPlus },
          { id: "ligacoes", label: "Ligações", icon: Phone },
          { id: "metaDia", label: "Meta Dia", icon: Target },
          { id: "crescimento", label: "Crescimento", icon: TrendingUp },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all",
              activeTab === tab.id
                ? "bg-white text-blue-600 shadow-md"
                : "text-slate-500 hover:bg-white/50",
            )}
          >
            <tab.icon size={16} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Dashboard Content Container (for PDF Capture) */}
      <div ref={dashboardRef} className="space-y-8 bg-slate-50 p-6 rounded-3xl border border-slate-100">
        <div className="flex justify-between items-center border-b border-slate-200 pb-4">
          <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
            {activeTab === "historico" && <Users className="text-blue-600" />}
            {activeTab === "bases" && <Database className="text-blue-600" />}
            {activeTab === "fiesProuni" && <GraduationCap className="text-blue-600" />}
            {activeTab === "planoAcao" && <Calendar className="text-blue-600" />}
            {activeTab === "empresas" && <Building2 className="text-blue-600" />}
            {activeTab === "insumos" && <Boxes className="text-blue-600" />}
            {activeTab === "isencoes" && <FileText className="text-blue-600" />}
            {activeTab === "pedidos_cursos" && <UserPlus className="text-blue-600" />}
            {activeTab === "ligacoes" && <Phone className="text-blue-600" />}
            {activeTab === "metaDia" && <Target className="text-blue-600" />}
            Dashboard: {activeTab === "historico" ? "Histórico de Leads" : 
                        activeTab === "bases" ? "Bases de Candidatos" :
                        activeTab === "fiesProuni" ? "Fies e Prouni" :
                        activeTab === "planoAcao" ? "Plano de Ação" :
                        activeTab === "empresas" ? "Empresas Parceiras" : 
                        activeTab === "insumos" ? "Controle de Insumos" : 
                        activeTab === "isencoes" ? "Acompanhamento de Isenções" : 
                        activeTab === "ligacoes" ? "Controle de Ligações" :
                        activeTab === "metaDia" ? "Meta Dia" : "Pedidos de Cursos"}
          </h3>
          <span className="text-xs font-mono text-slate-400">Gerado em: {new Date().toLocaleString("pt-BR")}</span>
        </div>

        {activeTab === "historico" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard title="Total de Leads" value={historicoStats.total} icon={Users} color="bg-blue-500" />
              <StatCard title="Convertidos" value={historicoStats.conv} icon={CheckCircle2} color="bg-emerald-500" />
              <StatCard title="Taxa de Conv." value={`${historicoStats.rate}%`} icon={TrendingUp} color="bg-purple-500" />
              <StatCard title="Últimos 30 dias" value={leads.filter(l => new Date(l.createdAt || "").getTime() > Date.now() - 30 * 24 * 60 * 60 * 1000).length} icon={Clock} color="bg-amber-500" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartSection title="Status dos Leads" data={historicoStats.byStatus} />
              <ChartSection title="Cursos de Interesse (Top 5)" data={historicoStats.byCourse} />
            </div>
          </div>
        )}

        {activeTab === "bases" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <StatCard title="Total em Bases" value={basesStats.total} icon={Database} color="bg-blue-500" />
              <StatCard title="Interessados" value={basesStats.byStatus.find(s => s.name === "Interessado")?.count || 0} icon={Target} color="bg-amber-500" />
              <StatCard title="Convertidos" value={basesStats.byStatus.find(s => s.name === "Convertido")?.count || 0} icon={CheckCircle} color="bg-emerald-500" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartSection title="Distribuição por Status" data={basesStats.byStatus} />
              <ChartSection title="Produtos" data={basesStats.byProduct} />
            </div>
          </div>
        )}

        {activeTab === "fiesProuni" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard title="Total Inscritos" value={fiesStats.total} icon={GraduationCap} color="bg-blue-500" />
              <StatCard title="FIES" value={fiesStats.fies} icon={FileText} color="bg-indigo-500" />
              <StatCard title="PROUNI" value={fiesStats.prouni} icon={FileText} color="bg-purple-500" />
              <StatCard title="Matriculados" value={fiesStats.matriculados} icon={CheckCircle2} color="bg-emerald-500" />
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <h4 className="text-sm font-bold text-slate-800 mb-4">Métricas de Processo</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600 font-medium">Docs Entregues (Sim)</span>
                    <span className="font-bold">{filteredFiesProuni.filter(i => i && i.docsEntreguesStatus === "Sim").length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600 font-medium">Entrevistas Realizadas</span>
                    <span className="font-bold">{filteredFiesProuni.filter(i => i && i.status === "Entrevistado").length}</span>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600 font-medium">TCB Assinado</span>
                    <span className="font-bold">{filteredFiesProuni.filter(i => i && i.tcbAssinado).length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600 font-medium">Concluído Digitaliza</span>
                    <span className="font-bold">{filteredFiesProuni.filter(i => i && i.digitalizaStatus === "Concluído").length}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "planoAcao" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-4 rounded-xl border border-slate-200">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Data Início</label>
                <input type="date" value={planoDataInicio} onChange={e => setPlanoDataInicio(e.target.value)} className="w-full text-sm border-slate-200 rounded-lg p-2" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Data Fim</label>
                <input type="date" value={planoDataFim} onChange={e => setPlanoDataFim(e.target.value)} className="w-full text-sm border-slate-200 rounded-lg p-2" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Unidade</label>
                <select value={planoFiltroUnidade} onChange={e => setPlanoFiltroUnidade(e.target.value)} className="w-full text-sm border-slate-200 rounded-lg p-2">
                  <option value="">Todas</option>
                  {uniqueUnidades.map(u => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">FDV Comercial</label>
                <select value={planoFiltroFdv} onChange={e => setPlanoFiltroFdv(e.target.value)} className="w-full text-sm border-slate-200 rounded-lg p-2">
                  <option value="">Todos</option>
                  {fdvsComercialUnicos.map(fdv => (
                    <option key={fdv} value={fdv}>{fdv}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              <StatCard title="Total de Ações" value={planoStats.total} icon={Calendar} color="bg-blue-500" />
              <StatCard title="Concluídas" value={planoStats.concluida} icon={CheckCircle2} color="bg-emerald-500" />
              <StatCard title="Pendentes" value={planoStats.pendente} icon={Clock} color="bg-amber-500" />
              <StatCard title="Leads Gerados" value={planoStats.totalLeadsFeitos} icon={Users} color="bg-indigo-500" />
              <StatCard title="Boletos Gerados" value={planoStats.totalBoletosFeitos} icon={FileText} color="bg-purple-500" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartSection title="Tipos de Ação" data={planoStats.byType} />
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <h4 className="text-sm font-bold text-slate-800 mb-4">Ações por Período</h4>
                <div className="space-y-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Próximos 7 dias</span>
                    <span className="font-bold">{filteredCalendarioAcoes.filter(a => {
                      const d = new Date(a.dataInicio).getTime();
                      return d > Date.now() && d < Date.now() + 7 * 24 * 60 * 60 * 1000;
                    }).length}</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full" />
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Em andamento (Hoje)</span>
                    <span className="font-bold">{filteredCalendarioAcoes.filter(a => a.dataInicio === new Date().toISOString().split("T")[0]).length}</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Leads por promotor em cada ação */}
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm max-h-96 overflow-y-auto">
                <h4 className="text-sm font-bold text-slate-800 mb-4">Leads por Promotor em Cada Ação</h4>
                {Object.keys(leadsPorPromotorPorAcao).length > 0 ? (
                  <div className="space-y-4">
                    {Object.entries(leadsPorPromotorPorAcao).map(([acaoNome, promotores]) => (
                      <div key={acaoNome} className="border-b border-slate-100 pb-3 last:border-0">
                        <div className="text-sm font-semibold text-slate-800 mb-2">{acaoNome}</div>
                        {Object.keys(promotores).length > 0 ? (
                          <div className="space-y-1">
                            {Object.entries(promotores).map(([promotor, count]) => (
                              <div key={promotor} className="flex justify-between text-xs items-center pl-2">
                                <span className="text-slate-600">{promotor}</span>
                                <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-full">{count} leads</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-xs text-slate-400 pl-2">Nenhum lead registrado</div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-slate-400">Nenhuma ação encontrada.</div>
                )}
              </div>

              {/* Ações Não Concluídas */}
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm max-h-96 overflow-y-auto">
                <h4 className="text-sm font-bold text-slate-800 mb-4">Resumo das Ações Não Concluídas</h4>
                {acoesNaoConcluidas.length > 0 ? (
                  <div className="space-y-3">
                    {acoesNaoConcluidas.map(acao => (
                      <div key={acao.id} className="p-3 bg-rose-50/50 border border-rose-100 rounded-xl">
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-sm font-bold text-slate-800">{acao.nome}</span>
                          <span className="text-xs font-medium text-rose-600 px-2 py-0.5 bg-rose-100 rounded-full flex items-center gap-1">
                            <Clock size={12} /> Pendente
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 mb-1 flex items-center gap-2">
                          <Calendar size={12} /> {acao.dataInicio.split("-").reverse().join("/")} 
                          {acao.dataFim && acao.dataFim !== acao.dataInicio ? ` a ${acao.dataFim.split("-").reverse().join("/")}` : ""}
                        </div>
                        <div className="text-xs text-slate-500 truncate"><strong className="font-medium text-slate-600">Local:</strong> {acao.local || "Não informado"}</div>
                        {(acao.colaboradoresNomes?.length ? acao.colaboradoresNomes.join(", ") : acao.colaboradorNome) && (
                          <div className="text-xs text-slate-500 mt-1">
                            <strong className="font-medium text-slate-600">Responsável (FDV):</strong> {acao.colaboradoresNomes?.length ? acao.colaboradoresNomes.join(", ") : acao.colaboradorNome}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-emerald-600 flex items-center gap-2 p-3 bg-emerald-50 rounded-xl">
                    <CheckCircle2 size={16} /> Todas as ações do período foram concluídas.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "empresas" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard title="Total Empresas" value={empresasStats.total} icon={Building2} color="bg-blue-500" />
              <StatCard title="Conveniadas" value={empresasStats.conveniadas} icon={CheckCircle2} color="bg-emerald-500" />
              <StatCard title="Em Tratativa" value={empresasStats.emTratativa} icon={Clock} color="bg-amber-500" />
              <StatCard title="Class. Ouro" value={empresasStats.classificacao.Ouro} icon={Sparkles} color="bg-yellow-500" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartSection title="Classificação" data={[
                { name: "Ouro", count: empresasStats.classificacao.Ouro, percentage: empresasStats.total > 0 ? ((empresasStats.classificacao.Ouro/empresasStats.total)*100).toFixed(1) : "0" },
                { name: "Prata", count: empresasStats.classificacao.Prata, percentage: empresasStats.total > 0 ? ((empresasStats.classificacao.Prata/empresasStats.total)*100).toFixed(1) : "0" },
                { name: "Bronze", count: empresasStats.classificacao.Bronze, percentage: empresasStats.total > 0 ? ((empresasStats.classificacao.Bronze/empresasStats.total)*100).toFixed(1) : "0" },
              ]} />
            </div>
          </div>
        )}

        {activeTab === "insumos" && (
          <InsumosDashboard pedidos={insumosPedidos} baixas={insumosBaixas} title="Painel de Insumos" />
        )}

        {activeTab === "isencoes" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
              <StatCard title="Total" value={isencoesStats.total} icon={FileText} color="bg-slate-500" />
              <StatCard title="Pendentes" value={isencoesStats.pendente} icon={Clock} color="bg-amber-500" />
              <StatCard title="Solicitados" value={isencoesStats.solicitado} icon={CheckCircle2} color="bg-blue-500" />
              <StatCard title="Deferidos" value={isencoesStats.deferido} icon={CheckCircle} color="bg-emerald-500" />
              <StatCard title="Boleto Pago" value={isencoesStats.boletoPago} icon={CheckCircle2} color="bg-purple-500" />
              <StatCard title="Convertidos" value={isencoesStats.convertido} icon={TrendingUp} color="bg-emerald-600" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartSection title="Cursos Mais Buscados (Top 5)" data={isencoesStats.byCurso} />
              <ChartSection title="Instituição de Origem (Top 5)" data={isencoesStats.byOrigem} />
            </div>
          </div>
        )}

        {activeTab === "pedidos_cursos" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              <StatCard title="Total de Preenchimentos" value={pedidosCursosStats.total} icon={FileText} color="bg-blue-500" />
            </div>
            <div className="grid grid-cols-1 gap-6">
              <ChartSection title="Cursos Mais Pedidos" data={pedidosCursosStats.byCurso} />
            </div>
          </div>
        )}

        {activeTab === "ligacoes" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 bg-white p-4 rounded-xl border border-slate-200">
              <div className="md:col-span-1">
                <label className="block text-xs font-medium text-slate-500 mb-1">Buscar por Nome</label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <input 
                    type="text" 
                    value={ligacoesSearchTerm} 
                    onChange={e => setLigacoesSearchTerm(e.target.value)} 
                    placeholder="Staff ou Candidato..."
                    className="w-full text-sm border-slate-200 rounded-lg pl-9 p-2 focus:ring-2 focus:ring-blue-500 transition-all outline-none" 
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Início</label>
                <input type="date" value={ligacoesDataInicio} onChange={e => setLigacoesDataInicio(e.target.value)} className="w-full text-sm border-slate-200 rounded-lg p-2" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Fim</label>
                <input type="date" value={ligacoesDataFim} onChange={e => setLigacoesDataFim(e.target.value)} className="w-full text-sm border-slate-200 rounded-lg p-2" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Funcionário</label>
                <select value={ligacoesFiltroAtendente} onChange={e => setLigacoesFiltroAtendente(e.target.value)} className="w-full text-sm border-slate-200 rounded-lg p-2">
                  <option value="">Todos</option>
                  {atendentesUnicos.map(a => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Base / Ação</label>
                <select value={ligacoesFiltroOrigem} onChange={e => setLigacoesFiltroOrigem(e.target.value)} className="w-full text-sm border-slate-200 rounded-lg p-2">
                  <option value="">Todas</option>
                  {origensUnicas.map(o => (
                    <option key={o.id} value={o.id}>{o.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <StatCard title="Total Ligações" value={ligacoesStats.total} icon={Phone} color="bg-blue-500" />
              <StatCard title="Não Atendeu" value={ligacoesStats.naoAtendeu} icon={Clock} color="bg-amber-500" />
              <StatCard title="Sem Interesse" value={ligacoesStats.semInteresse} icon={XCircle} color="bg-rose-500" />
              <StatCard title="Interesse" value={ligacoesStats.interesse} icon={CheckCircle2} color="bg-emerald-500" />
              <StatCard title="Convertido" value={ligacoesStats.convertido} icon={CheckCircle} color="bg-blue-600" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm h-[400px]">
                <h4 className="text-sm font-bold text-slate-800 mb-6 flex items-center justify-between">
                  Proporção por Colaborador
                  <span className="text-[10px] text-slate-400 font-normal uppercase tracking-wider">Top 10 Volume</span>
                </h4>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ligacoesChartDataByStaff} layout="vertical" margin={{ left: 40, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600, fill: '#64748b' }} width={100} />
                    <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase' }} />
                    <Bar dataKey="atendidas" name="Atendidas" stackId="a" fill="#10b981" barSize={20} />
                    <Bar dataKey="convertidas" name="Convertidas" stackId="a" fill="#3b82f6" barSize={20} />
                    <Bar dataKey="naoAtendidas" name="Não Atendidas" stackId="a" fill="#f59e0b" barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm h-[400px]">
                <h4 className="text-sm font-bold text-slate-800 mb-6 flex items-center justify-between">
                  Desempenho por Data
                  <span className="text-[10px] text-slate-400 font-normal uppercase tracking-wider">Últimos 15 dias</span>
                </h4>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={ligacoesChartDataByDate}>
                    <defs>
                      <linearGradient id="colorAtendidas" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorConvertidas" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorNaoAtendidas" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600, fill: '#64748b' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600, fill: '#64748b' }} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase' }} />
                    <Area type="monotone" dataKey="atendidas" name="Atendidas" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorAtendidas)" />
                    <Area type="monotone" dataKey="convertidas" name="Convertidas" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorConvertidas)" />
                    <Area type="monotone" dataKey="naoAtendidas" name="Não Atendidas" stroke="#f59e0b" strokeWidth={3} fillOpacity={1} fill="url(#colorNaoAtendidas)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center justify-between">
                  Melhores Retornos (Bases/Ações)
                  <span className="text-[10px] text-slate-400 font-normal uppercase tracking-wider">Top Conversão</span>
                </h4>
                <div className="space-y-4">
                  {ligacoesStats.sourceRanking.length > 0 ? (
                    ligacoesStats.sourceRanking.map((source, i) => (
                      <div key={source.name} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-black text-slate-200">#{(i + 1).toString().padStart(2, '0')}</span>
                          <div>
                            <p className="text-sm font-bold text-slate-800 truncate max-w-[200px]">{source.name}</p>
                            <p className="text-[10px] text-slate-500 font-medium">
                              {source.total} ligações • {source.interesse} interessados • {source.convertido} convertidos
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-black text-blue-600">{source.convRate}%</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">Conversão</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-400 text-center py-8 italic">Nenhum dado disponível.</p>
                  )}
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center justify-between">
                  Conversões por Atendente
                  <span className="text-[10px] text-slate-400 font-normal uppercase tracking-wider">Top Conversores</span>
                </h4>
                <div className="space-y-4">
                  {ligacoesStats.staffConvRanking.length > 0 ? (
                    ligacoesStats.staffConvRanking.map((staff, i) => (
                      <div key={staff.name} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                            {staff.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-800">{staff.name}</p>
                            <p className="text-[10px] text-slate-500 font-medium">
                              {staff.total} ligações • {staff.conv} conversões
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-black text-blue-600">{staff.rate}%</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">Taxa</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-400 text-center py-8 italic">Nenhum dado disponível.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                <HistoryIcon size={16} />
                Lista de Registros
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="p-4">Data/Hora</th>
                      <th className="p-4">Colaborador</th>
                      <th className="p-4">Candidato</th>
                      <th className="p-4">Base/Ação</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Observação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredLigacoes.length > 0 ? (
                      filteredLigacoes.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)).map((l) => (
                        <tr key={l.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-4 font-medium text-slate-500 whitespace-nowrap">
                            {l.createdAt?.toDate().toLocaleString("pt-BR")}
                          </td>
                          <td className="p-4 font-bold text-slate-900">{l.atendenteNome}</td>
                          <td className="p-4">
                            <div className="font-bold text-slate-900">{l.candidatoNome}</div>
                            <div className="text-xs text-slate-500">{l.candidatoTelefone}</div>
                          </td>
                          <td className="p-4 text-slate-600">
                            {origensUnicas.find(o => o.id === l.origemId)?.name || l.origemId}
                          </td>
                          <td className="p-4">
                            <span className={cn(
                              "px-2 py-1 rounded-full text-[10px] font-bold uppercase",
                              l.status === 'Convertido' ? "bg-blue-100 text-blue-700" :
                              l.status === 'Interesse' ? "bg-emerald-100 text-emerald-700" :
                              l.status === 'Sem interesse' ? "bg-rose-100 text-rose-700" :
                              "bg-amber-100 text-amber-700"
                            )}>
                              {l.status}
                            </span>
                          </td>
                          <td className="p-4 text-slate-500 italic max-w-xs truncate" title={l.observacao}>
                            {l.observacao || "-"}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-400 italic">
                          Nenhum registro encontrado.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === "metaDia" && (
          <div className="space-y-12">
            {[
              { title: "Geral (Todo o Período)", stats: metaDiaStats.allTime },
              { title: "Mensal (Últimos 30 Dias)", stats: metaDiaStats.monthly },
              { title: "Semanal (Últimos 7 Dias)", stats: metaDiaStats.weekly }
            ].map(section => (
              <div key={section.title} className="space-y-4">
                <h4 className="font-bold text-slate-800 text-lg border-b pb-2">{section.title}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                  <ModalidadeCard 
                    title="B.U Presencial" 
                    aa={section.stats.aaPresencial + section.stats.aaSemipresencial} 
                    realizado={section.stats.realizadoPresencial + section.stats.realizadoSemipresencial} 
                  />
                  <ModalidadeCard 
                    title="Presencial" 
                    aa={section.stats.aaPresencial} 
                    realizado={section.stats.realizadoPresencial} 
                  />
                  <ModalidadeCard 
                    title="Semipresencial" 
                    aa={section.stats.aaSemipresencial} 
                    realizado={section.stats.realizadoSemipresencial} 
                  />
                  <ModalidadeCard 
                    title="EAD (Digital)" 
                    aa={section.stats.aaDigital} 
                    realizado={section.stats.realizadoDigital} 
                  />
                  <ModalidadeCard 
                    title="Curso Técnico" 
                    aa={section.stats.aaTecnico} 
                    realizado={section.stats.realizadoTecnico} 
                  />
                  <ModalidadeCard 
                    title="Pós-Graduação" 
                    aa={section.stats.aaPosGraduacao} 
                    realizado={section.stats.realizadoPosGraduacao} 
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "crescimento" && (
          <div className="space-y-12">
            {analysisSchemes.length === 0 ? (
              <div className="bg-white p-12 rounded-3xl border border-slate-100 text-center space-y-4">
                <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto">
                  <TrendingUp size={32} />
                </div>
                <h4 className="text-xl font-bold text-slate-800">Nenhuma análise de crescimento configurada</h4>
                <p className="text-slate-500 max-w-sm mx-auto">As análises de crescimento são configuradas pelo administrador no painel administrativo.</p>
              </div>
            ) : (
              analysisSchemes.map((scheme) => (
                <div key={scheme.id} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-2xl font-bold text-slate-900">{scheme.nome}</h3>
                      <p className="text-slate-500 text-sm">Análise de crescimento trienal comparativa</p>
                    </div>
                    <div className="bg-blue-50 text-blue-600 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
                      Relatório Consolidado
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {scheme.periodos.map((p, idx) => {
                      const entregue = p.meta > 0 ? (p.realizado / p.meta) * 100 : 0;
                      let crescMeta = 0;
                      let crescBase = 0;

                      if (idx > 0) {
                        const prev = scheme.periodos[idx - 1];
                        if (prev.meta > 0) {
                          crescMeta = ((p.meta - prev.meta) / prev.meta) * 100;
                        }
                        if (prev.realizado > 0) {
                          crescBase = ((p.realizado - prev.realizado) / prev.realizado) * 100;
                        }
                      }

                      return (
                        <div key={idx} className="bg-slate-50/50 rounded-2xl p-6 border border-slate-100 relative overflow-hidden group hover:border-blue-200 transition-all">
                          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform">
                            <Calendar size={48} className="text-blue-600" />
                          </div>
                          
                          <div className="relative z-10 space-y-4">
                            <span className="text-xs font-black text-blue-600 uppercase tracking-widest">{p.periodo}</span>
                            
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase">Meta</p>
                                <p className="text-lg font-bold text-slate-800">{p.meta}</p>
                              </div>
                              <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase">Realizado</p>
                                <p className="text-lg font-bold text-slate-800">{p.realizado}</p>
                              </div>
                            </div>

                            <div className="space-y-1">
                              <div className="flex justify-between items-center">
                                <span className="text-[10px] font-bold text-slate-500 uppercase">Entregue</span>
                                <span className={cn("text-sm font-black", entregue >= 100 ? "text-emerald-600" : "text-rose-500")}>
                                  {entregue.toFixed(1)}%
                                </span>
                              </div>
                              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                <div 
                                  className={cn("h-full rounded-full transition-all duration-1000", entregue >= 100 ? "bg-emerald-500" : "bg-blue-500")}
                                  style={{ width: `${Math.min(entregue, 100)}%` }}
                                />
                              </div>
                            </div>

                            {idx > 0 && (
                              <div className="pt-3 border-t border-slate-200/50 grid grid-cols-2 gap-2">
                                <div className="space-y-0.5">
                                  <p className="text-[9px] font-bold text-slate-400 uppercase leading-none">Cresc. Meta</p>
                                  <div className={cn("flex items-center text-xs font-bold", crescMeta >= 0 ? "text-emerald-600" : "text-rose-500")}>
                                    {crescMeta >= 0 ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                    {Math.abs(crescMeta).toFixed(1)}%
                                  </div>
                                </div>
                                <div className="space-y-0.5 text-right">
                                  <p className="text-[9px] font-bold text-slate-400 uppercase leading-none">Cresc. Base</p>
                                  <div className={cn("flex items-center justify-end text-xs font-bold", crescBase >= 0 ? "text-emerald-600" : "text-rose-500")}>
                                    {crescBase >= 0 ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                    {Math.abs(crescBase).toFixed(1)}%
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4">
                    <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100">
                      <h4 className="text-sm font-bold text-slate-800 mb-6 flex items-center">
                        <BarChart3 size={18} className="text-blue-600 mr-2" />
                        Evolução Meta vs. Realizado
                      </h4>
                      <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={scheme.periodos}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis dataKey="periodo" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: "#64748b" }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: "#64748b" }} />
                            <Tooltip 
                              contentStyle={{ borderRadius: "16px", border: "none", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }}
                              cursor={{ fill: "rgba(30, 64, 175, 0.05)" }}
                            />
                            <Legend wrapperStyle={{ fontSize: "10px", fontWeight: "bold", paddingTop: "20px" }} />
                            <Bar dataKey="meta" name="Meta" fill="#94a3b8" radius={[4, 4, 0, 0]} barSize={30} />
                            <Bar dataKey="realizado" name="Realizado" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={30} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100">
                      <h4 className="text-sm font-bold text-slate-800 mb-6 flex items-center">
                        <TrendingUp size={18} className="text-blue-600 mr-2" />
                        Curva de Crescimento (%)
                      </h4>
                      <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={scheme.periodos.map((p, idx) => {
                            let crescMeta = 0;
                            let crescBase = 0;
                            if (idx > 0) {
                              const prev = scheme.periodos[idx - 1];
                              if (prev.meta > 0) crescMeta = ((p.meta - prev.meta) / prev.meta) * 100;
                              if (prev.realizado > 0) crescBase = ((p.realizado - prev.realizado) / prev.realizado) * 100;
                            }
                            return {
                              periodo: p.periodo,
                              "Cresc. Meta": Number(crescMeta.toFixed(1)),
                              "Cresc. Base": Number(crescBase.toFixed(1))
                            };
                          })}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis dataKey="periodo" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: "#64748b" }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: "#64748b" }} />
                            <Tooltip 
                              contentStyle={{ borderRadius: "16px", border: "none", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }}
                            />
                            <Legend wrapperStyle={{ fontSize: "10px", fontWeight: "bold", paddingTop: "20px" }} />
                            <Line type="monotone" dataKey="Cresc. Meta" stroke="#94a3b8" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: "white" }} />
                            <Line type="monotone" dataKey="Cresc. Base" stroke="#10b981" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: "white" }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const ModalidadeCard = ({ title, aa, realizado }: { title: string, aa: number, realizado: number }) => {
  const percent = aa > 0 ? ((realizado / aa) * 100).toFixed(1) : 0;
  return (
    <div className="p-4 rounded-xl border border-slate-100 shadow-sm bg-white flex flex-col justify-between">
      <div>
        <h5 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3 leading-tight h-8">{title}</h5>
        <div className="flex justify-between items-end">
          <div>
            <div className="text-[10px] text-slate-400 font-bold uppercase">Realizado</div>
            <div className="text-xl font-black text-slate-800">{realizado}</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-slate-400 font-bold uppercase">A.A</div>
            <div className="text-sm font-bold text-slate-600">{aa}</div>
          </div>
        </div>
      </div>
      <div className="mt-3 pt-2 border-t border-slate-50 flex items-center justify-between">
        <span className="text-[10px] font-bold text-slate-400 uppercase">Curva A.A</span>
        <span className={cn("text-xs font-bold", realizado >= aa ? "text-emerald-600" : "text-rose-500")}>
          {percent}%
        </span>
      </div>
    </div>
  );
};

const ChartSection = ({ title, data }: { title: string; data: any[] }) => (
  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
    <h3 className="text-base font-bold text-slate-800 mb-4">{title}</h3>
    <div className="space-y-3">
      {data.map((item) => (
        <div key={item.name} className="space-y-1">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-slate-600 truncate max-w-[200px]">{item.name}</span>
            <span className="text-slate-800 font-bold">
              {item.count} <span className="text-slate-400 font-normal">({item.percentage}%)</span>
            </span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all"
              style={{ width: `${item.percentage}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  </div>
);

const Sparkles = ({ size, className }: { size: number; className?: string }) => (
  <Target size={size} className={className} />
);
