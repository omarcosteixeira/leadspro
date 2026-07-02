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
  CheckCircle
} from "lucide-react";
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
  InsumoBaixa
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
  profile,
  onToast
}: RelatoriosViewProps) {
  const [activeTab, setActiveTab] = useState<
    "historico" | "bases" | "fiesProuni" | "planoAcao" | "empresas" | "insumos"
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

  // --- Historico Leads Stats ---
  const historicoStats = useMemo(() => {
    const total = leads.length;
    const conv = leads.filter((l) => l.converted).length;
    const rate = total > 0 ? ((conv / total) * 100).toFixed(1) : "0";
    
    const statusGroups: Record<string, number> = {
      "Pendente": 0, "Convertido": 0, "Sem retorno": 0, "Interessado": 0, "Não Interessado": 0,
    };
    leads.forEach(l => {
      const s = l.converted ? "Convertido" : (l.status || "Pendente");
      if (statusGroups[s] !== undefined) statusGroups[s] += 1;
      else statusGroups["Pendente"] += 1;
    });

    const courseGroups: Record<string, number> = {};
    leads.forEach(l => {
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
  }, [leads]);

  // --- Bases Stats ---
  const basesStats = useMemo(() => {
    const total = bases.length;
    const groups: { [key: string]: number } = { "Pendente": 0, "Interessado": 0, "Convertido": 0, "Não tem interesse": 0, "Sem retorno": 0 };
    bases.forEach((b) => {
      const s = b.status || "Pendente";
      if (groups[s] !== undefined) groups[s] += 1;
    });

    const productGroups: { [key: string]: number } = { "Graduação": 0, "Técnico": 0, "Pós-graduação": 0 };
    bases.forEach((b) => {
      const p = b.produto || "Graduação";
      if (productGroups[p] !== undefined) productGroups[p] += 1;
    });

    return {
      total,
      byStatus: Object.entries(groups).map(([name, count]) => ({ name, count, percentage: total > 0 ? ((count / total) * 100).toFixed(1) : "0" })),
      byProduct: Object.entries(productGroups).map(([name, count]) => ({ name, count, percentage: total > 0 ? ((count / total) * 100).toFixed(1) : "0" }))
    };
  }, [bases]);

  // --- Fies/Prouni Stats ---
  const fiesStats = useMemo(() => {
    const total = fiesProuni.length;
    const fies = fiesProuni.filter(i => i.tipo === "FIES").length;
    const prouni = fiesProuni.filter(i => i.tipo === "PROUNI").length;
    const matriculados = fiesProuni.filter(i => i.numeroMatricula).length;
    
    return { total, fies, prouni, matriculados };
  }, [fiesProuni]);

  // --- Plano de Ação Stats ---
  const planoStats = useMemo(() => {
    const total = calendarioAcoes.length;
    const concluida = calendarioAcoes.filter(a => a.concluida).length;
    const pendente = total - concluida;
    
    const typeGroups: Record<string, number> = {};
    calendarioAcoes.forEach(a => {
      const t = a.nome.split(" ")[0] || "Outros"; // Simple heuristic for type
      typeGroups[t] = (typeGroups[t] || 0) + 1;
    });

    return { total, concluida, pendente, byType: Object.entries(typeGroups).map(([name, count]) => ({ name, count, percentage: total > 0 ? ((count / total) * 100).toFixed(1) : "0" })).sort((a,b) => b.count - a.count).slice(0, 5) };
  }, [calendarioAcoes]);

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
            Dashboard: {activeTab === "historico" ? "Histórico de Leads" : 
                        activeTab === "bases" ? "Bases de Candidatos" :
                        activeTab === "fiesProuni" ? "Fies e Prouni" :
                        activeTab === "planoAcao" ? "Plano de Ação" :
                        activeTab === "empresas" ? "Empresas Parceiras" : "Controle de Insumos"}
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
                    <span className="font-bold">{fiesProuni.filter(i => i.docsEntreguesStatus === "Sim").length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600 font-medium">Entrevistas Realizadas</span>
                    <span className="font-bold">{fiesProuni.filter(i => i.status === "Entrevistado").length}</span>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600 font-medium">TCB Assinado</span>
                    <span className="font-bold">{fiesProuni.filter(i => i.tcbAssinado).length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600 font-medium">Concluído Digitaliza</span>
                    <span className="font-bold">{fiesProuni.filter(i => i.digitalizaStatus === "Concluído").length}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "planoAcao" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <StatCard title="Total de Ações" value={planoStats.total} icon={Calendar} color="bg-blue-500" />
              <StatCard title="Concluídas" value={planoStats.concluida} icon={CheckCircle2} color="bg-emerald-500" />
              <StatCard title="Pendentes" value={planoStats.pendente} icon={Clock} color="bg-amber-500" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartSection title="Tipos de Ação" data={planoStats.byType} />
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <h4 className="text-sm font-bold text-slate-800 mb-4">Ações por Período</h4>
                <div className="space-y-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Próximos 7 dias</span>
                    <span className="font-bold">{calendarioAcoes.filter(a => {
                      const d = new Date(a.dataInicio).getTime();
                      return d > Date.now() && d < Date.now() + 7 * 24 * 60 * 60 * 1000;
                    }).length}</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full" />
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Em andamento (Hoje)</span>
                    <span className="font-bold">{calendarioAcoes.filter(a => a.dataInicio === new Date().toISOString().split("T")[0]).length}</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full" />
                </div>
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
      </div>
    </div>
  );
}

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
