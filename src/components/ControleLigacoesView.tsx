import React, { useState, useMemo } from "react";
import { 
  Phone, 
  Search, 
  Loader2, 
  History, 
  User, 
  MessageSquare, 
  CheckCircle2, 
  XCircle, 
  Clock,
  ChevronRight,
  Database,
  Building2,
  RefreshCw,
  IdCard,
  GraduationCap
} from "lucide-react";
import { 
  Lead, 
  BaseEntry, 
  CalendarioAcao, 
  UserProfile, 
  Ligacao 
} from "../types";
import { cn, formatPhone } from "../lib/utils";
import { motion, AnimatePresence } from "motion/react";

interface ControleLigacoesViewProps {
  leads: Lead[];
  bases: BaseEntry[];
  acoes: CalendarioAcao[];
  ligacoes: Ligacao[];
  profile: UserProfile;
  onSaveLigacao: (ligacao: Partial<Ligacao>) => Promise<void>;
  onToast: (m: string, t?: "success" | "error") => void;
}

export default function ControleLigacoesView({
  leads,
  bases,
  acoes,
  ligacoes,
  profile,
  onSaveLigacao,
  onToast
}: ControleLigacoesViewProps) {
  const [sourceType, setSourceType] = useState<"Base" | "Lead" | null>(null);
  const [selectedSourceId, setSelectedSourceId] = useState<string>("");
  const [currentCandidate, setCurrentCandidate] = useState<Lead | BaseEntry | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [observation, setObservation] = useState("");
  const [showObservation, setShowObservation] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<'Não atendeu' | 'Sem interesse' | 'Interesse' | 'Convertido' | null>(null);

  // Get unique base names
  const baseNames = useMemo(() => {
    const names = new Set(bases.map(b => b.nomeBase));
    return Array.from(names).sort();
  }, [bases]);

  // Get unique actions from leads (Historico)
  const actionOptions = useMemo(() => {
    const names = new Set(leads.map(l => l.acao).filter(Boolean));
    return Array.from(names).sort();
  }, [leads]);

  const handleStartCall = () => {
    if (!selectedSourceId) {
      onToast("Selecione uma base ou ação para continuar.", "error");
      return;
    }

    let candidates: (Lead | BaseEntry)[] = [];
    if (sourceType === "Base") {
      candidates = bases.filter(b => b.nomeBase === selectedSourceId);
    } else {
      candidates = leads.filter(l => l.acao === selectedSourceId);
    }

    // Filter out converted candidates
    const filtered = candidates.filter(c => {
      const status = (c as any).status;
      return status !== 'Convertido' && !(c as any).converted;
    });

    if (filtered.length === 0) {
      onToast("Não há candidatos disponíveis nesta seleção.", "error");
      return;
    }

    // Filter out candidates called today
    const today = new Date().toISOString().split('T')[0];
    const available = filtered.filter(c => {
      const lastCall = ligacoes
        .filter(l => l.candidatoId === c.id)
        .sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds)[0];
      
      if (!lastCall || !lastCall.createdAt) return true;
      
      const callDate = new Date(lastCall.createdAt.seconds * 1000).toISOString().split('T')[0];
      return callDate !== today;
    });

    if (available.length === 0) {
      onToast("Todos os candidatos desta lista já foram contatados hoje.", "error");
      return;
    }

    // Pick a random candidate or follow a "padrão de trocas" (just pick the first available)
    setCurrentCandidate(available[0]);
    setObservation("");
    setShowObservation(false);
    setSelectedStatus(null);
  };

  const handleAction = async (status: 'Não atendeu' | 'Sem interesse' | 'Interesse' | 'Convertido') => {
    if (!currentCandidate) return;

    if ((status === 'Sem interesse' || status === 'Interesse' || status === 'Convertido') && !showObservation) {
      setSelectedStatus(status);
      setShowObservation(true);
      return;
    }

    setIsSaving(true);
    try {
      await onSaveLigacao({
        candidatoId: currentCandidate.id,
        candidatoNome: currentCandidate.nome,
        candidatoTelefone: currentCandidate.telefone,
        origem: sourceType as 'Lead' | 'Base',
        origemId: selectedSourceId,
        status: status,
        observacao: observation,
        atendenteId: profile.uid,
        atendenteNome: profile.nome || profile.name,
        unidade: profile.unidade,
      });

      onToast("Ligação registrada com sucesso!", "success");
      
      // Clear current and move to next (automatically or let user click start again)
      setCurrentCandidate(null);
      setObservation("");
      setShowObservation(false);
      setSelectedStatus(null);
      
      // Optionally auto-start next call
      // handleStartCall(); 
    } catch (err) {
      console.error(err);
      onToast("Erro ao salvar ligação.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const candidateHistory = useMemo(() => {
    if (!currentCandidate) return [];
    return ligacoes
      .filter(l => l.candidatoId === currentCandidate.id)
      .sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds);
  }, [currentCandidate, ligacoes]);

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
          <div className="p-2 bg-blue-500 rounded-lg text-white shadow-lg shadow-blue-200">
            <Phone size={24} />
          </div>
          Controle de Ligações
        </h2>
      </div>

      {!currentCandidate ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200 border border-slate-100"
        >
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => {
                  setSourceType("Base");
                  setSelectedSourceId("");
                }}
                className={cn(
                  "p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-3",
                  sourceType === "Base" 
                    ? "border-blue-500 bg-blue-50 text-blue-700" 
                    : "border-slate-100 hover:border-blue-200 text-slate-500"
                )}
              >
                <Database size={32} />
                <span className="font-bold">Bases</span>
              </button>
              <button
                onClick={() => {
                  setSourceType("Lead");
                  setSelectedSourceId("");
                }}
                className={cn(
                  "p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-3",
                  sourceType === "Lead" 
                    ? "border-blue-500 bg-blue-50 text-blue-700" 
                    : "border-slate-100 hover:border-blue-200 text-slate-500"
                )}
              >
                <Building2 size={32} />
                <span className="font-bold">Leads (Ações)</span>
              </button>
            </div>

            {sourceType && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="space-y-4"
              >
                <label className="block text-sm font-bold text-slate-700">
                  Selecione {sourceType === "Base" ? "a Base" : "a Ação"}
                </label>
                <select
                  value={selectedSourceId}
                  onChange={(e) => setSelectedSourceId(e.target.value)}
                  className="w-full p-4 rounded-xl border-2 border-slate-100 focus:border-blue-500 transition-all outline-none bg-slate-50 font-medium"
                >
                  <option value="">Selecione...</option>
                  {sourceType === "Base" ? (
                    baseNames.map(name => (
                      <option key={name} value={name}>{name}</option>
                    ))
                  ) : (
                    actionOptions.map(acao => (
                      <option key={acao} value={acao}>{acao}</option>
                    ))
                  )}
                </select>

                <button
                  onClick={handleStartCall}
                  className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2"
                >
                  <RefreshCw size={20} />
                  Iniciar Nova Ligação
                </button>
              </motion.div>
            )}
          </div>
        </motion.div>
      ) : (
        <div className="space-y-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200 border border-slate-100"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-slate-100 rounded-2xl text-slate-600">
                  <User size={32} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900">{currentCandidate.nome}</h3>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-1">
                    <p className="text-slate-500 font-bold flex items-center gap-2">
                      <Phone size={16} />
                      {formatPhone(currentCandidate.telefone)}
                    </p>
                    {currentCandidate.cpf && (
                      <p className="text-slate-500 font-bold flex items-center gap-2">
                        <IdCard size={16} />
                        {currentCandidate.cpf}
                      </p>
                    )}
                    {((currentCandidate as any).cursoInteresse || (currentCandidate as any).curso) && (
                      <p className="text-slate-500 font-bold flex items-center gap-2">
                        <GraduationCap size={16} />
                        {(currentCandidate as any).cursoInteresse || (currentCandidate as any).curso}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <span className="px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-xs font-bold uppercase tracking-wider">
                  {sourceType}
                </span>
              </div>
            </div>

            {candidateHistory.length > 0 && (
              <div className="mb-8 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <History size={16} />
                  Histórico de Ligações
                </h4>
                <div className="space-y-4 max-h-48 overflow-y-auto pr-2">
                  {candidateHistory.map((h, i) => (
                    <div key={h.id} className="flex gap-4 items-start">
                      <div className={cn(
                        "mt-1 p-1 rounded-full",
                        h.status === 'Convertido' ? "bg-blue-500" :
                        h.status === 'Interesse' ? "bg-emerald-500" : 
                        h.status === 'Sem interesse' ? "bg-rose-500" : "bg-amber-500"
                      )} />
                      <div>
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                          <span>{h.atendenteNome}</span>
                          <span>•</span>
                          <span>{h.createdAt?.toDate().toLocaleString("pt-BR")}</span>
                        </div>
                        <p className="text-sm font-bold text-slate-900">{h.status}</p>
                        {h.observacao && (
                          <p className="text-sm text-slate-600 mt-1 italic">"{h.observacao}"</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <AnimatePresence mode="wait">
              {showObservation ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                >
                  <label className="block text-sm font-bold text-slate-700">
                    Observação ({selectedStatus})
                  </label>
                  <textarea
                    value={observation}
                    onChange={(e) => setObservation(e.target.value)}
                    placeholder="Descreva o motivo ou detalhes do interesse..."
                    className="w-full p-4 rounded-xl border-2 border-slate-100 focus:border-blue-500 transition-all outline-none bg-slate-50 font-medium min-h-[120px]"
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setShowObservation(false);
                        setSelectedStatus(null);
                      }}
                      className="flex-1 bg-slate-100 text-slate-600 py-4 rounded-xl font-bold hover:bg-slate-200 transition-all"
                    >
                      Voltar
                    </button>
                    <button
                      disabled={isSaving || !observation.trim()}
                      onClick={() => selectedStatus && handleAction(selectedStatus)}
                      className="flex-[2] bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 transition-all disabled:opacity-50 shadow-lg shadow-blue-200"
                    >
                      {isSaving ? <Loader2 className="animate-spin mx-auto" /> : "Confirmar e Salvar"}
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="grid grid-cols-1 md:grid-cols-3 gap-4"
                >
                  <button
                    disabled={isSaving}
                    onClick={() => handleAction('Não atendeu')}
                    className="p-6 rounded-2xl border-2 border-amber-100 bg-amber-50 text-amber-700 hover:bg-amber-100 transition-all flex flex-col items-center gap-2 group"
                  >
                    <Clock className="group-hover:scale-110 transition-transform" size={28} />
                    <span className="font-bold">Não atendeu</span>
                  </button>
                  <button
                    disabled={isSaving}
                    onClick={() => handleAction('Sem interesse')}
                    className="p-6 rounded-2xl border-2 border-rose-100 bg-rose-50 text-rose-700 hover:bg-rose-100 transition-all flex flex-col items-center gap-2 group"
                  >
                    <XCircle className="group-hover:scale-110 transition-transform" size={28} />
                    <span className="font-bold">Sem interesse</span>
                  </button>
                  <button
                    disabled={isSaving}
                    onClick={() => handleAction('Interesse')}
                    className="p-6 rounded-2xl border-2 border-emerald-100 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-all flex flex-col items-center gap-2 group"
                  >
                    <CheckCircle2 className="group-hover:scale-110 transition-transform" size={28} />
                    <span className="font-bold">Interesse</span>
                  </button>
                  <button
                    disabled={isSaving}
                    onClick={() => handleAction('Convertido')}
                    className="p-6 rounded-2xl border-2 border-blue-100 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-all flex flex-col items-center gap-2 group"
                  >
                    <CheckCircle2 className="group-hover:scale-110 transition-transform" size={28} />
                    <span className="font-bold">Convertido</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              onClick={() => setCurrentCandidate(null)}
              className="mt-8 text-slate-400 font-bold text-sm hover:text-slate-600 transition-all flex items-center justify-center gap-2 w-full"
            >
              Cancelar e voltar para seleção
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
