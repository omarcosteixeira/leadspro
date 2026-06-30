import React, { useState, useEffect, useMemo } from "react";
import { BotReport, UserProfile } from "../types";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  collection,
  query,
  where,
  getDocs,
  Timestamp,
} from "firebase/firestore";
import { db, COLLECTIONS } from "../firebase";
import { 
  FileText, 
  Calendar, 
  Users, 
  MessageSquare, 
  Target, 
  Sparkles, 
  Send, 
  Brain, 
  Loader2, 
  ArrowRight,
  Activity,
  Award,
  ShieldAlert,
  Percent,
  Briefcase,
  CheckCircle,
  TrendingUp,
  RefreshCw,
  BarChart3
} from "lucide-react";
import { startOfDay, endOfDay, subDays, format, parseISO } from "date-fns";
import { motion, AnimatePresence } from "motion/react";

interface RelatoriosViewProps {
  profile: UserProfile;
}

interface AICard {
  title: string;
  value: string;
  icon: string;
  color: string;
}

interface AIChart {
  type: "bar" | "line" | "pie";
  title: string;
  data: { name: string; value: number }[];
  xKey: string;
  yKey: string;
}

interface AIReport {
  title: string;
  answer: string;
  cards: AICard[];
  chart: AIChart | null;
  suggestions: string[];
}

export function RelatoriosView({ profile }: RelatoriosViewProps) {
  // Navigation / Tabs
  const [activeTab, setActiveTab] = useState<"ai" | "bot">("ai");

  // Original reports state (Bot Argo's)
  const [reports, setReports] = useState<BotReport[]>([]);
  const [loadingReports, setLoadingReports] = useState(true);
  const [period, setPeriod] = useState(0);

  // AI-powered Dashboard states
  const [dbStats, setDbStats] = useState<any>(null);
  const [dbLoading, setDbLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiStep, setAiStep] = useState(0);
  const [currentReport, setCurrentReport] = useState<AIReport | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  // Fetch bot reports (original feature)
  useEffect(() => {
    const fetchReports = async () => {
      setLoadingReports(true);
      try {
        let startDt = startOfDay(subDays(new Date(), period));
        let endDt = endOfDay(new Date());

        const q = query(
          collection(db, COLLECTIONS.BOT_REPORTS),
          where("sentAt", ">=", Timestamp.fromDate(startDt)),
          where("sentAt", "<=", Timestamp.fromDate(endDt)),
        );

        const snap = await getDocs(q);
        const data = snap.docs.map(
          (d) => ({ id: d.id, ...d.data() }) as BotReport,
        );
        setReports(data);
      } catch (err: any) {
        console.error("Error fetching bot reports:", err);
      } finally {
        setLoadingReports(false);
      }
    };
    fetchReports();
  }, [period]);

  // Aggregate stats from entire Firestore database for AI context (Leads, Empresas, Calendario, Users)
  const fetchAllSystemData = async () => {
    setDbLoading(true);
    try {
      const [leadsSnap, empresasSnap, acoesSnap, usuariosSnap, botReportsSnap] = await Promise.allSettled([
        getDocs(collection(db, COLLECTIONS.LEADS)),
        getDocs(collection(db, COLLECTIONS.EMPRESAS_PARCEIRAS)),
        getDocs(collection(db, COLLECTIONS.CALENDARIO_ACOES)),
        getDocs(collection(db, COLLECTIONS.USERS)),
        getDocs(collection(db, COLLECTIONS.BOT_REPORTS)),
      ]);

      const leadsDocs = leadsSnap.status === 'fulfilled' ? leadsSnap.value.docs.map(d => d.data()) : [];
      const empresasDocs = empresasSnap.status === 'fulfilled' ? empresasSnap.value.docs.map(d => d.data()) : [];
      const acoesDocs = acoesSnap.status === 'fulfilled' ? acoesSnap.value.docs.map(d => d.data()) : [];
      const usuariosDocs = usuariosSnap.status === 'fulfilled' ? usuariosSnap.value.docs.map(d => d.data()) : [];
      const botReportsDocs = botReportsSnap.status === 'fulfilled' ? botReportsSnap.value.docs.map(d => d.data()) : [];

      // Compute Leads summary
      const totalLeads = leadsDocs.length;
      const leadsByStatus: Record<string, number> = {};
      const leadsByPromotorMap: Record<string, { name: string; count: number; role?: string }> = {};
      const leadsByCurso: Record<string, number> = {};
      const leadsByAcao: Record<string, number> = {};

      leadsDocs.forEach((l: any) => {
        const st = l.status || "Pendente";
        leadsByStatus[st] = (leadsByStatus[st] || 0) + 1;

        const pId = l.promotorId || "Desconhecido";
        const pName = l.promotorName || "Sem Nome";
        if (!leadsByPromotorMap[pId]) {
          leadsByPromotorMap[pId] = { name: pName, count: 0, role: l.promotorRole };
        }
        leadsByPromotorMap[pId].count += 1;

        const cur = l.cursoInteresse || "Não Informado";
        leadsByCurso[cur] = (leadsByCurso[cur] || 0) + 1;

        const ac = l.acao || "Não Informada";
        leadsByAcao[ac] = (leadsByAcao[ac] || 0) + 1;
      });

      // Compute Empresas summary
      const totalEmpresas = empresasDocs.length;
      const empresasByStatus: Record<string, number> = {};
      const empresasByClassificacao: Record<string, number> = {};
      const empresasBySeguimento: Record<string, number> = {};

      empresasDocs.forEach((e: any) => {
        const st = e.statusEmpresa || "Não Informada";
        empresasByStatus[st] = (empresasByStatus[st] || 0) + 1;

        const cl = e.classificacao || "Não Informada";
        empresasByClassificacao[cl] = (empresasByClassificacao[cl] || 0) + 1;

        const seg = e.seguimento || "Não Informado";
        empresasBySeguimento[seg] = (empresasBySeguimento[seg] || 0) + 1;
      });

      // Compute Acoes summary
      const totalAcoes = acoesDocs.length;
      const acoesByAtividade: Record<string, number> = {};
      let concluidas = 0;
      let pendentes = 0;
      let linkedToEmpresas = 0;
      const acoesByLocal: Record<string, number> = {};

      acoesDocs.forEach((a: any) => {
        const act = a.tipoAtividade || "Ação";
        acoesByAtividade[act] = (acoesByAtividade[act] || 0) + 1;

        if (a.concluida) concluidas += 1;
        else pendentes += 1;

        if (a.empresaParceiraId) linkedToEmpresas += 1;

        const loc = a.local || "Não Informado";
        acoesByLocal[loc] = (acoesByLocal[loc] || 0) + 1;
      });

      // Compute Users summary
      const totalUsers = usuariosDocs.length;
      const usersByRole: Record<string, number> = {};
      usuariosDocs.forEach((u: any) => {
        const r = u.role || "Sem Cargo";
        usersByRole[r] = (usersByRole[r] || 0) + 1;
      });

      // Compute Bot Reports summary
      const totalBotReports = botReportsDocs.length;
      const botByUserMap: Record<string, number> = {};
      const botByBaseMap: Record<string, number> = {};

      botReportsDocs.forEach((r: any) => {
        const uName = r.userName || "Desconhecido";
        botByUserMap[uName] = (botByUserMap[uName] || 0) + 1;

        const bName = r.baseName || r.tipoContato || "Desconhecida";
        botByBaseMap[bName] = (botByBaseMap[bName] || 0) + 1;
      });

      const summary = {
        leads: {
          total: totalLeads,
          byStatus: leadsByStatus,
          byPromotor: Object.entries(leadsByPromotorMap).map(([id, p]) => ({ id, promotorName: p.name, count: p.count, role: p.role })),
          byCurso: Object.entries(leadsByCurso).map(([curso, count]) => ({ curso, count })),
          byAcao: Object.entries(leadsByAcao).map(([acao, count]) => ({ acao, count }))
        },
        empresas: {
          total: totalEmpresas,
          byStatus: empresasByStatus,
          byClassificacao: empresasByClassificacao,
          bySeguimento: empresasBySeguimento
        },
        acoes: {
          total: totalAcoes,
          byAtividade: acoesByAtividade,
          concluidas,
          pendentes,
          linkedToEmpresas,
          byLocal: Object.entries(acoesByLocal).map(([local, count]) => ({ local, count }))
        },
        usuarios: {
          total: totalUsers,
          byRole: usersByRole
        },
        botReports: {
          total: totalBotReports,
          byUser: Object.entries(botByUserMap).map(([name, count]) => ({ name, count })),
          byBase: Object.entries(botByBaseMap).map(([name, count]) => ({ name, count }))
        }
      };

      setDbStats(summary);
    } catch (err) {
      console.error("Error computing system data summary:", err);
    } finally {
      setDbLoading(false);
    }
  };

  useEffect(() => {
    fetchAllSystemData();
  }, []);

  // Handle AI analysis execution
  const executeAIAnalysis = async (queryText: string) => {
    if (!queryText.trim() || !dbStats) return;
    setAiLoading(true);
    setAiError(null);
    setAiStep(0);

    const stepIntervals = [
      setTimeout(() => setAiStep(1), 800),
      setTimeout(() => setAiStep(2), 2200),
      setTimeout(() => setAiStep(3), 3800),
    ];

    try {
      const response = await fetch("/api/reports/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: queryText, dataSummary: dbStats }),
      });

      const result = await response.json();
      stepIntervals.forEach(clearTimeout);

      if (result.success && result.report) {
        setAiStep(4);
        setTimeout(() => {
          setCurrentReport(result.report);
          setAiLoading(false);
        }, 500);
      } else {
        throw new Error(result.error || "Erro desconhecido na análise da IA.");
      }
    } catch (err: any) {
      console.error("Error running AI reports analysis:", err);
      setAiError(err.message || "Erro de rede ao conectar com a IA do Goorq.");
      setAiLoading(false);
    }
  };

  // Original statistics (Bot Argo's)
  const { totalSends, byUser, byBase, byDate } = useMemo(() => {
    let sends = reports.length;
    const userMap: Record<string, { name: string; count: number }> = {};
    const baseMap: Record<string, number> = {};
    const dateMap: Record<string, number> = {};

    reports.forEach((r) => {
      if (!userMap[r.userId]) {
        userMap[r.userId] = { name: r.userName, count: 0 };
      }
      userMap[r.userId].count += 1;

      const bKey = r.baseName || r.tipoContato || "Desconhecido";
      if (!baseMap[bKey]) baseMap[bKey] = 0;
      baseMap[bKey] += 1;

      if (r.sentAt) {
        const dtStr = format(r.sentAt.toDate(), "yyyy-MM-dd");
        if (!dateMap[dtStr]) dateMap[dtStr] = 0;
        dateMap[dtStr] += 1;
      }
    });

    const byUserArr = Object.values(userMap).sort((a, b) => b.count - a.count);
    const byBaseArr = Object.entries(baseMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
    const byDateArr = Object.entries(dateMap)
      .map(([date, count]) => ({
        date: format(parseISO(date), "dd/MM"),
        count,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      totalSends: sends,
      byUser: byUserArr,
      byBase: byBaseArr,
      byDate: byDateArr,
    };
  }, [reports]);

  const COLORS = [
    "#3B82F6",
    "#10B981",
    "#F59E0B",
    "#EF4444",
    "#8B5CF6",
    "#EC4899",
    "#06B6D4",
    "#14B8A6",
  ];

  // Helper icons getter
  const getIconComponent = (iconName: string) => {
    switch (iconName?.toLowerCase()) {
      case "users": return <Users className="w-6 h-6 text-inherit" id={`icon-${iconName}`} />;
      case "target": return <Target className="w-6 h-6 text-inherit" id={`icon-${iconName}`} />;
      case "file-text": return <FileText className="w-6 h-6 text-inherit" id={`icon-${iconName}`} />;
      case "check-circle": return <CheckCircle className="w-6 h-6 text-inherit" id={`icon-${iconName}`} />;
      case "trending-up": return <TrendingUp className="w-6 h-6 text-inherit" id={`icon-${iconName}`} />;
      case "briefcase": return <Briefcase className="w-6 h-6 text-inherit" id={`icon-${iconName}`} />;
      case "activity": return <Activity className="w-6 h-6 text-inherit" id={`icon-${iconName}`} />;
      case "calendar": return <Calendar className="w-6 h-6 text-inherit" id={`icon-${iconName}`} />;
      case "message-square": return <MessageSquare className="w-6 h-6 text-inherit" id={`icon-${iconName}`} />;
      case "award": return <Award className="w-6 h-6 text-inherit" id={`icon-${iconName}`} />;
      case "percent": return <Percent className="w-6 h-6 text-inherit" id={`icon-${iconName}`} />;
      case "shield-alert": return <ShieldAlert className="w-6 h-6 text-inherit" id={`icon-${iconName}`} />;
      default: return <FileText className="w-6 h-6 text-inherit" id={`icon-default`} />;
    }
  };

  const getColorClasses = (colorName: string) => {
    switch (colorName?.toLowerCase()) {
      case "blue": return { bg: "bg-blue-50 text-blue-600 border-blue-100", iconBg: "bg-blue-100 text-blue-600" };
      case "emerald": return { bg: "bg-emerald-50 text-emerald-600 border-emerald-100", iconBg: "bg-emerald-100 text-emerald-600" };
      case "purple": return { bg: "bg-purple-50 text-purple-600 border-purple-100", iconBg: "bg-purple-100 text-purple-600" };
      case "amber": return { bg: "bg-amber-50 text-amber-600 border-amber-100", iconBg: "bg-amber-100 text-amber-600" };
      case "rose": return { bg: "bg-rose-50 text-rose-600 border-rose-100", iconBg: "bg-rose-100 text-rose-600" };
      case "cyan": return { bg: "bg-cyan-50 text-cyan-600 border-cyan-100", iconBg: "bg-cyan-100 text-cyan-600" };
      case "indigo": return { bg: "bg-indigo-50 text-indigo-600 border-indigo-100", iconBg: "bg-indigo-100 text-indigo-600" };
      case "slate": return { bg: "bg-slate-50 text-slate-600 border-slate-100", iconBg: "bg-slate-100 text-slate-600" };
      default: return { bg: "bg-blue-50 text-blue-600 border-blue-100", iconBg: "bg-blue-100 text-blue-600" };
    }
  };

  // Custom high fidelity markdown rendering helper
  const renderMarkdown = (text: string) => {
    if (!text) return null;
    const lines = text.split("\n");
    const renderedElements: React.ReactNode[] = [];
    let currentTableRows: React.ReactNode[] = [];
    let isInsideTable = false;

    const pushCurrentTable = (key: number) => {
      if (currentTableRows.length > 0) {
        renderedElements.push(
          <div key={`table-container-${key}`} className="overflow-x-auto my-5 border border-slate-200/70 rounded-2xl shadow-sm">
            <table className="min-w-full divide-y divide-slate-200">
              <tbody className="bg-white divide-y divide-slate-100">
                {currentTableRows}
              </tbody>
            </table>
          </div>
        );
        currentTableRows = [];
        isInsideTable = false;
      }
    };

    lines.forEach((line, i) => {
      let trimmed = line.trim();
      
      // Check if table row
      if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
        isInsideTable = true;
        const cells = trimmed.split("|").map(c => c.trim()).filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
        if (cells.every(c => c.match(/^[-:]+$/))) {
          return;
        }
        
        const isHeader = currentTableRows.length === 0;
        
        currentTableRows.push(
          <tr key={`tr-${i}`} className={isHeader ? "bg-slate-50/70" : "hover:bg-slate-50/50 transition-colors"}>
            {cells.map((cell, idx) => {
              if (isHeader) {
                return (
                  <th key={idx} className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                    {parseInlineMarkdown(cell)}
                  </th>
                );
              } else {
                return (
                  <td key={idx} className="px-4 py-2.5 text-sm text-slate-600 font-medium">
                    {parseInlineMarkdown(cell)}
                  </td>
                );
              }
            })}
          </tr>
        );
      } else {
        if (isInsideTable) {
          pushCurrentTable(i);
        }
        
        // Check if bullet point
        if (trimmed.startsWith("-") || trimmed.startsWith("*")) {
          const content = trimmed.substring(1).trim();
          renderedElements.push(
            <li key={i} className="ml-5 list-disc text-slate-600 text-sm mb-1.5 leading-relaxed">
              {parseInlineMarkdown(content)}
            </li>
          );
        }
        // Check if numbered point
        else if (trimmed.match(/^(\d+)\.\s+(.*)/)) {
          const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
          const content = numMatch![2].trim();
          renderedElements.push(
            <li key={i} className="ml-5 list-decimal text-slate-600 text-sm mb-1.5 leading-relaxed">
              {parseInlineMarkdown(content)}
            </li>
          );
        }
        // Blank line
        else if (trimmed === "") {
          renderedElements.push(<div key={i} className="h-2" />);
        }
        // Normal text
        else {
          renderedElements.push(
            <p key={i} className="text-slate-600 text-sm mb-2.5 leading-relaxed">
              {parseInlineMarkdown(trimmed)}
            </p>
          );
        }
      }
    });

    if (isInsideTable) {
      pushCurrentTable(lines.length);
    }

    return renderedElements;
  };

  const parseInlineMarkdown = (text: string) => {
    const parts = [];
    let currentText = text;
    
    while (currentText.includes("**")) {
      const startIdx = currentText.indexOf("**");
      const endIdx = currentText.indexOf("**", startIdx + 2);
      if (endIdx === -1) break;
      
      if (startIdx > 0) {
        parts.push(currentText.substring(0, startIdx));
      }
      parts.push(
        <strong className="font-extrabold text-slate-800" key={startIdx}>
          {currentText.substring(startIdx + 2, endIdx)}
        </strong>
      );
      currentText = currentText.substring(endIdx + 2);
    }
    
    if (currentText) {
      parts.push(currentText);
    }
    
    return parts.length > 0 ? parts : text;
  };

  const searchSuggestions = [
    { label: "Leads por Promotor", query: "Quantas leads por promotor estão cadastradas no sistema?" },
    { label: "Empresas Cadastradas", query: "Quantas empresas parceiras temos cadastradas e qual o status delas?" },
    { label: "Ações por Empresa", query: "Quantas ações ou visitas estão vinculadas a empresas parceiras?" },
    { label: "Status de Conversão", query: "Qual é o status geral de conversão de leads no sistema?" },
    { label: "Cursos de Interesse", query: "Quais são os cursos de maior interesse entre as leads?" },
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-12" id="relatorios-view-root">
      {/* Header Container */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-5" id="relatorios-header">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2" id="relatorios-title">
            <Sparkles className="text-blue-600 animate-pulse" />
            Painel de Inteligência de Dados
          </h2>
          <p className="text-slate-500 font-medium text-sm mt-1" id="relatorios-subtitle">
            Gere relatórios automatizados de qualquer informação do sistema usando IA
          </p>
        </div>

        {/* Tab Selector buttons */}
        <div className="bg-slate-100 p-1 rounded-xl flex text-xs font-bold shrink-0 border border-slate-200/50" id="relatorios-tab-selector">
          <button
            onClick={() => setActiveTab("ai")}
            className={`px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 ${activeTab === "ai" ? "bg-white text-slate-800 shadow-sm" : "text-slate-600 hover:text-slate-800"}`}
            id="tab-btn-ai"
          >
            <Brain size={14} className="text-blue-500" />
            Dashboard Inteligente IA
          </button>
          <button
            onClick={() => setActiveTab("bot")}
            className={`px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 ${activeTab === "bot" ? "bg-white text-slate-800 shadow-sm" : "text-slate-600 hover:text-slate-800"}`}
            id="tab-btn-bot"
          >
            <MessageSquare size={14} className="text-emerald-500" />
            Métricas Bot Argo's
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "ai" ? (
          <motion.div
            key="ai_tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
            id="ai-tab-container"
          >
            {/* Search Input Box */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/60" id="ai-search-box">
              <label className="block text-sm font-black text-slate-700 mb-2" id="ai-search-label">
                O que você gostaria de analisar hoje no sistema?
              </label>
              
              <div className="flex flex-col sm:flex-row gap-3" id="ai-search-input-group">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Ex: Quantas leads por promotor temos cadastradas? ou Quantas empresas estão conveniadas?"
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-slate-800 text-sm"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        executeAIAnalysis(searchQuery);
                      }
                    }}
                    id="ai-search-input"
                  />
                  <Brain className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                </div>
                
                <button
                  onClick={() => executeAIAnalysis(searchQuery)}
                  disabled={aiLoading || dbLoading || !searchQuery.trim()}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm px-6 py-3.5 rounded-2xl shadow-sm transition-all hover:shadow flex items-center justify-center gap-2 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                  id="ai-analyze-btn"
                >
                  {aiLoading ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <Sparkles size={18} />
                  )}
                  Analisar com IA
                </button>
              </div>

              {/* Suggestions row */}
              <div className="mt-4" id="ai-suggestions-section">
                <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider block mb-2">
                  Pesquisas Frequentes
                </span>
                <div className="flex flex-wrap gap-2" id="ai-suggestions-list">
                  {searchSuggestions.map((s, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setSearchQuery(s.query);
                        executeAIAnalysis(s.query);
                      }}
                      disabled={aiLoading || dbLoading}
                      className="text-xs font-bold bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-blue-600 border border-slate-200/80 rounded-xl px-3.5 py-2 transition-all flex items-center gap-1 hover:border-blue-200 cursor-pointer"
                      id={`suggestion-btn-${idx}`}
                    >
                      <ArrowRight size={12} className="text-blue-500 shrink-0" />
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Error Message */}
            {aiError && (
              <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 text-rose-600 text-sm font-bold flex items-center gap-3 animate-fade-in" id="ai-error-banner">
                <ShieldAlert className="shrink-0 text-rose-500" />
                <span>{aiError}</span>
              </div>
            )}

            {/* AI Loading State Screen */}
            {aiLoading && (
              <div className="bg-white rounded-3xl p-12 border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center space-y-6" id="ai-loading-screen">
                <div className="relative" id="ai-loading-logo">
                  <div className="w-16 h-16 bg-blue-100 rounded-3xl flex items-center justify-center text-blue-600 animate-bounce">
                    <Brain size={36} />
                  </div>
                  <div className="absolute -inset-1 rounded-3xl border-2 border-blue-500 animate-ping opacity-25"></div>
                </div>

                <div className="space-y-2 max-w-sm" id="ai-loading-steps">
                  <h3 className="font-black text-slate-800 text-lg">Processando sua análise...</h3>
                  <p className="text-slate-400 text-sm font-medium">Nosso analista virtual está varrendo as coleções em tempo real.</p>
                </div>

                {/* Animated steps */}
                <div className="w-full max-w-xs bg-slate-50 rounded-2xl p-4 border border-slate-100 text-left space-y-3 font-semibold text-xs" id="ai-loading-timeline">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${aiStep >= 0 ? "bg-emerald-500" : "bg-slate-300 animate-pulse"}`} />
                    <span className={aiStep >= 0 ? "text-emerald-600" : "text-slate-400"}>Buscando dados das coleções...</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${aiStep >= 1 ? "bg-emerald-500" : aiStep === 0 ? "bg-slate-300" : "bg-blue-500 animate-pulse"}`} />
                    <span className={aiStep >= 1 ? "text-emerald-600" : aiStep === 0 ? "text-slate-400" : "text-blue-500 font-bold"}>Compilando estatísticas...</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${aiStep >= 2 ? "bg-emerald-500" : aiStep < 2 ? "bg-slate-300" : "bg-blue-500 animate-pulse"}`} />
                    <span className={aiStep >= 2 ? "text-emerald-600" : aiStep < 2 ? "text-slate-400" : "text-blue-500 font-bold"}>Goorq AI interpretando e processando...</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${aiStep >= 3 ? "bg-emerald-500" : aiStep < 3 ? "bg-slate-300" : "bg-blue-500 animate-pulse"}`} />
                    <span className={aiStep >= 3 ? "text-emerald-600" : aiStep < 3 ? "text-slate-400" : "text-blue-500 font-bold"}>Formatando tabelas e gráficos...</span>
                  </div>
                </div>
              </div>
            )}

            {/* AI Custom Report Result */}
            {!aiLoading && currentReport && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
                id="ai-report-results"
              >
                {/* Result Title & Banner */}
                <div className="bg-gradient-to-r from-blue-500/10 via-indigo-500/5 to-transparent border border-blue-100 rounded-3xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4" id="ai-report-banner">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 bg-blue-100 px-2.5 py-1 rounded-full">
                      Relatório Gerado com IA
                    </span>
                    <h3 className="text-xl font-black text-slate-800 tracking-tight mt-1.5" id="report-rendered-title">
                      {currentReport.title}
                    </h3>
                  </div>
                  <div className="text-right" id="report-rendered-timestamp">
                    <span className="text-xs font-bold text-slate-400 block">Gerado em:</span>
                    <span className="text-xs font-black text-slate-600">{format(new Date(), "dd/MM/yyyy 'às' HH:mm")}</span>
                  </div>
                </div>

                {/* Dynamic Metrics Cards */}
                {currentReport.cards && currentReport.cards.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="ai-report-cards">
                    {currentReport.cards.map((c, idx) => {
                      const colorSet = getColorClasses(c.color);
                      return (
                        <div
                          key={idx}
                          className={`bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-all`}
                          id={`ai-report-card-${idx}`}
                        >
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${colorSet.iconBg}`}>
                            {getIconComponent(c.icon)}
                          </div>
                          <div>
                            <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider">
                              {c.title}
                            </span>
                            <span className="text-2xl font-black text-slate-800">
                              {c.value}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Grid for Chart & Markdown analysis */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="ai-report-body-grid">
                  {/* Chart component */}
                  {currentReport.chart && (
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 lg:col-span-5 flex flex-col" id="ai-report-chart-container">
                      <h4 className="font-extrabold text-slate-800 mb-4 text-sm uppercase tracking-wider flex items-center gap-2">
                        <BarChart3 size={16} className="text-blue-500" />
                        {currentReport.chart.title}
                      </h4>
                      
                      <div className="h-64 flex-1" id="ai-chart-canvas">
                        <ResponsiveContainer width="100%" height="100%">
                          {currentReport.chart.type === "bar" ? (
                            <BarChart data={currentReport.chart.data} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                              <XAxis dataKey="name" stroke="#64748B" fontSize={10} fontWeight="bold" />
                              <YAxis stroke="#64748B" fontSize={10} fontWeight="bold" />
                              <RechartsTooltip
                                cursor={{ fill: "#F8FAFC" }}
                                contentStyle={{
                                  borderRadius: "12px",
                                  border: "none",
                                  boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.05)",
                                  fontWeight: "bold",
                                  fontSize: "12px"
                                }}
                              />
                              <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]}>
                                {currentReport.chart.data.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Bar>
                            </BarChart>
                          ) : currentReport.chart.type === "line" ? (
                            <LineChart data={currentReport.chart.data} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                              <XAxis dataKey="name" stroke="#64748B" fontSize={10} fontWeight="bold" />
                              <YAxis stroke="#64748B" fontSize={10} fontWeight="bold" />
                              <RechartsTooltip
                                contentStyle={{
                                  borderRadius: "12px",
                                  border: "none",
                                  boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.05)",
                                  fontWeight: "bold",
                                  fontSize: "12px"
                                }}
                              />
                              <Line type="monotone" dataKey="value" stroke="#3B82F6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                            </LineChart>
                          ) : (
                            <PieChart>
                              <Pie
                                data={currentReport.chart.data}
                                cx="50%"
                                cy="50%"
                                innerRadius={50}
                                outerRadius={80}
                                paddingAngle={4}
                                dataKey="value"
                                nameKey="name"
                                label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                                labelLine={false}
                              >
                                {currentReport.chart.data.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <RechartsTooltip
                                contentStyle={{
                                  borderRadius: "12px",
                                  border: "none",
                                  boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.05)",
                                  fontWeight: "bold",
                                  fontSize: "12px"
                                }}
                              />
                              <Legend iconType="circle" wrapperStyle={{ fontSize: "11px", fontWeight: "bold" }} />
                            </PieChart>
                          )}
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}

                  {/* Markdown Report Analysis */}
                  <div className={`bg-white rounded-3xl shadow-sm border border-slate-100 p-6 flex flex-col ${currentReport.chart ? "lg:col-span-7" : "lg:col-span-12"}`} id="ai-report-text-container">
                    <h4 className="font-extrabold text-slate-800 mb-4 text-sm uppercase tracking-wider flex items-center gap-2">
                      <FileText size={16} className="text-indigo-500" />
                      Análise e Insights Estratégicos
                    </h4>
                    <div className="prose max-w-none text-slate-600 overflow-y-auto flex-1 pr-1 font-medium" id="ai-report-rendered-markdown">
                      {renderMarkdown(currentReport.answer)}
                    </div>
                  </div>
                </div>

                {/* Suggestions / Next logical questions */}
                {currentReport.suggestions && currentReport.suggestions.length > 0 && (
                  <div className="bg-slate-50 border border-slate-200/50 rounded-3xl p-5" id="ai-next-questions-section">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-wider block mb-2.5">
                      Pergunte em Seguida (Sugestões de IA)
                    </span>
                    <div className="flex flex-wrap gap-2" id="ai-next-questions-list">
                      {currentReport.suggestions.map((s, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setSearchQuery(s);
                            executeAIAnalysis(s);
                          }}
                          disabled={aiLoading}
                          className="text-xs font-bold bg-white hover:bg-slate-100 text-slate-700 hover:text-blue-600 border border-slate-200 rounded-xl px-4 py-2.5 transition-all shadow-sm cursor-pointer hover:border-blue-200"
                          id={`suggested-question-btn-${idx}`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* AI Welcome State (before queries run) */}
            {!currentReport && !aiLoading && (
              <div className="bg-white rounded-3xl border border-slate-200/60 p-8 text-center flex flex-col items-center justify-center space-y-5 shadow-sm" id="ai-welcome-box">
                <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center" id="ai-welcome-logo">
                  <Brain size={30} />
                </div>
                
                <div className="space-y-1.5 max-w-lg" id="ai-welcome-messages">
                  <h3 className="font-black text-slate-800 text-lg">Olá, {profile.name}! Eu sou o Goorq AI.</h3>
                  <p className="text-slate-500 font-medium text-sm leading-relaxed">
                    Sua IA de apoio está conectada e possui leitura em tempo real sobre leads, promotores, ações de empresas, históricos e muito mais.
                  </p>
                  <p className="text-slate-400 text-xs font-semibold">
                    Digite qualquer pergunta sobre o seu negócio no campo de busca ou clique em um dos atalhos sugeridos acima para ver a mágica acontecer!
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl pt-4" id="ai-welcome-features">
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 text-center">
                    <span className="text-blue-500 font-black text-lg block">Leads</span>
                    <p className="text-slate-400 text-xs font-bold mt-1">Análise de promotores e canais de entrada.</p>
                  </div>
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 text-center">
                    <span className="text-emerald-500 font-black text-lg block">Parcerias</span>
                    <p className="text-slate-400 text-xs font-bold mt-1">Classificação, visitas e convênios.</p>
                  </div>
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 text-center">
                    <span className="text-purple-500 font-black text-lg block">Ações</span>
                    <p className="text-slate-400 text-xs font-bold mt-1">Visitas presenciais e campanhas vinculadas.</p>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="bot_tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
            id="bot-tab-container"
          >
            {/* Period Selector (original feature) */}
            <div className="flex justify-end" id="bot-period-filter">
              <div className="bg-white p-1 rounded-xl shadow-sm border border-slate-200 flex text-sm font-bold">
                <button
                  onClick={() => setPeriod(0)}
                  className={`px-4 py-2 rounded-lg transition-all ${period === 0 ? "bg-blue-600 text-white shadow" : "text-slate-600 hover:bg-slate-100"}`}
                  id="period-btn-0"
                >
                  Hoje
                </button>
                <button
                  onClick={() => setPeriod(7)}
                  className={`px-4 py-2 rounded-lg transition-all ${period === 7 ? "bg-blue-600 text-white shadow" : "text-slate-600 hover:bg-slate-100"}`}
                  id="period-btn-7"
                >
                  7 Dias
                </button>
                <button
                  onClick={() => setPeriod(30)}
                  className={`px-4 py-2 rounded-lg transition-all ${period === 30 ? "bg-blue-600 text-white shadow" : "text-slate-600 hover:bg-slate-100"}`}
                  id="period-btn-30"
                >
                  30 Dias
                </button>
              </div>
            </div>

            {loadingReports ? (
              <div className="flex flex-col items-center justify-center py-20 text-blue-500" id="bot-loading-spinner">
                <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                <span className="mt-4 font-bold text-sm">Carregando métricas de envios...</span>
              </div>
            ) : (
              <>
                {/* Metric Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6" id="bot-metric-cards">
                  <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex items-center gap-4">
                    <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
                      <MessageSquare size={28} />
                    </div>
                    <div>
                      <h3 className="text-slate-500 text-sm font-bold uppercase tracking-wider">
                        Total de Envios (Bot)
                      </h3>
                      <span className="text-4xl font-black text-slate-800">
                        {totalSends}
                      </span>
                    </div>
                  </div>

                  <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex items-center gap-4">
                    <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0">
                      <Users size={28} />
                    </div>
                    <div>
                      <h3 className="text-slate-500 text-sm font-bold uppercase tracking-wider">
                        Usuários Ativos (Envios)
                      </h3>
                      <span className="text-4xl font-black text-slate-800">
                        {byUser.length}
                      </span>
                    </div>
                  </div>

                  <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex items-center gap-4">
                    <div className="w-14 h-14 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center shrink-0">
                      <Target size={28} />
                    </div>
                    <div className="flex-1 w-0">
                      <h3 className="text-slate-500 text-sm font-bold uppercase tracking-wider truncate">
                        Base Mais Trabalhada
                      </h3>
                      <span className="text-2xl font-black text-slate-800 truncate block">
                        {byBase.length > 0 ? byBase[0].name : "-"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Grid for charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="bot-charts-grid">
                  <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
                    <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                      <Users size={18} className="text-slate-400" /> Envios por Usuário
                    </h3>
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={byUser}
                          layout="vertical"
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            horizontal={false}
                            stroke="#E2E8F0"
                          />
                          <XAxis
                            type="number"
                            stroke="#64748B"
                            fontSize={12}
                            fontWeight="bold"
                          />
                          <YAxis
                            dataKey="name"
                            type="category"
                            width={120}
                            stroke="#64748B"
                            fontSize={11}
                            fontWeight="bold"
                          />
                          <RechartsTooltip
                            cursor={{ fill: "#F1F5F9" }}
                            contentStyle={{
                              borderRadius: "16px",
                              border: "none",
                              boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
                              fontWeight: "bold",
                            }}
                          />
                          <Bar
                            dataKey="count"
                            name="Envios"
                            fill="#3B82F6"
                            radius={[0, 4, 4, 0]}
                          >
                            {byUser.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={COLORS[index % COLORS.length]}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
                    <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                      <Target size={18} className="text-slate-400" /> Envios por Base
                    </h3>
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={byBase}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={5}
                            dataKey="count"
                            nameKey="name"
                            label={({ name, percent }) =>
                              `${(percent * 100).toFixed(0)}%`
                            }
                            labelLine={false}
                          >
                            {byBase.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={COLORS[index % COLORS.length]}
                              />
                            ))}
                          </Pie>
                          <RechartsTooltip
                            contentStyle={{
                              borderRadius: "16px",
                              border: "none",
                              boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
                              fontWeight: "bold",
                            }}
                          />
                          <Legend
                            iconType="circle"
                            wrapperStyle={{
                              fontSize: "12px",
                              fontWeight: "bold",
                              color: "#64748B",
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {period > 0 && (
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 lg:col-span-2">
                      <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <Calendar size={18} className="text-slate-400" /> Volume de Envios ao Longo do Tempo
                      </h3>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart
                            data={byDate}
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid
                              strokeDasharray="3 3"
                              vertical={false}
                              stroke="#E2E8F0"
                            />
                            <XAxis
                              dataKey="date"
                              stroke="#64748B"
                              fontSize={12}
                              fontWeight="bold"
                            />
                            <YAxis stroke="#64748B" fontSize={12} fontWeight="bold" />
                            <RechartsTooltip
                              contentStyle={{
                                borderRadius: "16px",
                                border: "none",
                                boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
                                fontWeight: "bold",
                              }}
                            />
                            <Line
                              type="monotone"
                              dataKey="count"
                              name="Envios"
                              stroke="#3B82F6"
                              strokeWidth={4}
                              dot={{ r: 4, strokeWidth: 2 }}
                              activeDot={{ r: 8 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
