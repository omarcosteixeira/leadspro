import React, { useState, useEffect, useMemo } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  sendPasswordResetEmail,
  updatePassword,
  updateProfile,
  User
} from 'firebase/auth';
import { 
  collection, 
  query, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  doc, 
  deleteDoc, 
  serverTimestamp, 
  where,
  or,
  limit,
  getDoc,
  setDoc,
  getDocs
} from 'firebase/firestore';
import { 
  LayoutDashboard, 
  UserPlus, 
  History, 
  Database, 
  GraduationCap, 
  Settings, 
  LogOut, 
  Plus, 
  Trash2, 
  ExternalLink, 
  CheckCircle2, 
  XCircle, 
  Phone, 
  Search,
  Users,
  TrendingUp,
  Calendar,
  Download,
  Upload,
  Menu,
  X,
  ChevronRight,
  AlertCircle,
  FileText,
  Clock,
  Calculator,
  ShieldCheck,
  Megaphone,
  Sun,
  Edit2,
  MapPin,
  Lock,
  Unlock,
  Circle,
  KeyRound,
  Building2,
  MessageSquare,
  Mail,
  Globe,
  Copy,
  Bot,
  Send,
  Bell
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db, COLLECTIONS, handleFirestoreError, OperationType, secondaryAuth } from './firebase';
import { cn, formatPhone, getWhatsAppUrl, validateCPF, formatCPF } from './lib/utils';
import * as XLSX from 'xlsx';
import { 
  UserProfile, 
  Lead, 
  BaseEntry, 
  GapEntry, 
  PlannerTask, 
  LinkUtil, 
  UserRole,
  FiesProuniEntry,
  Campanha,
  BomDiaCaptacao,
  ForecastCaptacao,
  BomDiaMetrics,
  PeriodoCaptacao,
  CalendarioAcao,
  EmpresaParceira,
  WhatsAppMessage,
  MapaoAcademicoEntry,
  BaseDisparoEntry,
  BotConfig
} from './types';

// --- Helpers ---
const exportToExcel = (data: any[], fileName: string) => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Dados");
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
};

const importFromExcel = (file: File, callback: (data: any[]) => void) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    const bstr = e.target?.result;
    const workbook = XLSX.read(bstr, { type: 'binary' });
    const worksheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[worksheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);
    callback(data);
  };
  reader.readAsBinaryString(file);
};

function WhatsAppMessageSelector({ 
  isOpen, 
  onClose, 
  messages, 
  onSelect, 
  leadName,
  botConfig,
  onSendBot,
  forceBotOnly
}: { 
  isOpen: boolean;
  onClose: () => void;
  messages: WhatsAppMessage[];
  onSelect: (msg: string) => void;
  leadName: string;
  botConfig?: BotConfig;
  onSendBot?: (msg: string) => void;
  forceBotOnly?: boolean;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[80vh]"
      >
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div>
            <h3 className="text-xl font-bold text-slate-900">{forceBotOnly ? 'Disparo em Massa' : 'Selecionar Mensagem'}</h3>
            <p className="text-xs text-slate-500 font-medium mt-1">
              {forceBotOnly ? 'Escolha o modelo para enviar a todos.' : `Escolha como enviar para ${leadName}`}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-full transition-all">
            <X size={20} />
          </button>
        </div>
        <div className="p-4 overflow-y-auto space-y-3 flex-1">
          {messages.length > 0 ? messages.map((msg, idx) => {
            const preview = forceBotOnly ? msg.texto : msg.texto.replace('[nome]', leadName);
            const canUseBot = botConfig?.url && onSendBot;
            
            return (
              <div
                key={msg.id}
                className="w-full text-left p-4 rounded-2xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/50 transition-all flex flex-col space-y-3"
              >
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Modelo {idx + 1}</span>
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                    <MessageSquare size={16} />
                  </div>
                </div>
                <p className="text-sm text-slate-600 line-clamp-3 leading-relaxed whitespace-pre-wrap">{preview || <span className="italic opacity-50">Mensagem vazia</span>}</p>
                
                <div className="flex space-x-2 pt-2 border-t border-slate-100">
                  {canUseBot && (
                    <button 
                      onClick={() => {
                        // Pass the raw template if mass sending, else the formatted preview
                        onSendBot(forceBotOnly ? msg.texto : preview);
                        onClose();
                      }}
                      className="flex-1 bg-blue-600 text-white py-2 rounded-xl text-xs font-bold hover:bg-blue-700 transition flex items-center justify-center space-x-1"
                    >
                      <Bot size={14} />
                      <span>{forceBotOnly ? 'Iniciar Disparo em Massa' : 'Bot ARGO\'S'}</span>
                    </button>
                  )}
                  {!forceBotOnly && (
                    <button 
                      onClick={() => {
                        onSelect(preview);
                        onClose();
                      }}
                      className={`flex-1 ${canUseBot ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-100' : 'bg-emerald-500 text-white hover:bg-emerald-600'} py-2 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1`}
                    >
                      <Send size={14} />
                      <span>{canUseBot ? 'WhatsApp Web' : 'Enviar WhatsApp'}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          }) : (
            <div className="text-center py-12">
              <p className="text-slate-400 italic">Nenhum modelo cadastrado.</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// --- Constants ---
const HOLIDAYS = [
  '2024-01-01', '2024-03-29', '2024-04-21', '2024-05-01', '2024-05-30', '2024-07-09', '2024-09-07', '2024-10-12', '2024-11-02', '2024-11-15', '2024-11-20', '2024-12-25',
  '2025-01-01', '2025-04-18', '2025-04-21', '2025-05-01', '2025-06-19', '2025-09-07', '2025-10-12', '2025-11-02', '2025-11-15', '2025-11-20', '2025-12-25',
  '2026-01-01', '2026-04-03', '2026-04-21', '2026-05-01', '2026-06-04', '2026-09-07', '2026-10-12', '2026-11-02', '2026-11-15', '2026-11-20', '2026-12-25',
];

const getWorkingDaysRemaining = (endDateStr: string) => {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const dataFim = new Date(endDateStr);
  dataFim.setHours(0, 0, 0, 0);
  
  if (dataFim < hoje) return 0;

  let count = 0;
  let curDate = new Date(hoje.getTime());
  // Start counting from today if it's a working day
  while (curDate <= dataFim) {
    const dayOfWeek = curDate.getDay(); // 0 = Sunday
    const dateString = curDate.toISOString().split('T')[0];
    const isSunday = dayOfWeek === 0;
    const isHoliday = HOLIDAYS.includes(dateString);

    if (!isSunday && !isHoliday) {
      count++;
    }
    curDate.setDate(curDate.getDate() + 1);
  }
  return count;
};

const getWorkingDaysBetween = (startDateStr: string, endDateStr: string) => {
  const start = new Date(startDateStr);
  start.setHours(0, 0, 0, 0);
  const end = new Date(endDateStr);
  end.setHours(0, 0, 0, 0);
  
  if (end < start) return 0;

  let count = 0;
  let curDate = new Date(start.getTime());
  while (curDate <= end) {
    const dayOfWeek = curDate.getDay();
    const dateString = curDate.toISOString().split('T')[0];
    const isSunday = dayOfWeek === 0;
    const isHoliday = HOLIDAYS.includes(dateString);

    if (!isSunday && !isHoliday) {
      count++;
    }
    curDate.setDate(curDate.getDate() + 1);
  }
  return count;
};

const ROLES: Record<string, UserRole> = {
  ADMIN_MASTER: 'Admin Master',
  PROMOTOR: 'Promotor',
  FDV: 'FDV',
  SALA_MATRICULA: 'Sala de Matrícula',
  QG: 'QG',
  LIDER_FDV: 'Líder/FDV',
  SSA: 'SSA',
  GESTOR_UNIDADE: 'Gestor Unidade',
  GESTOR_COMERCIAL: 'Gestor Comercial',
  ACADEMICO: 'Acadêmico'
};

const VIEW_PERMISSIONS: Record<string, UserRole[]> = {
  dashboard: [ROLES.ADMIN_MASTER, ROLES.FDV, ROLES.SALA_MATRICULA, ROLES.QG, ROLES.LIDER_FDV, ROLES.GESTOR_UNIDADE, ROLES.GESTOR_COMERCIAL],
  cadastro: [ROLES.ADMIN_MASTER, ROLES.PROMOTOR, ROLES.FDV, ROLES.SALA_MATRICULA, ROLES.QG, ROLES.LIDER_FDV, ROLES.GESTOR_UNIDADE, ROLES.GESTOR_COMERCIAL],
  historico: [ROLES.ADMIN_MASTER, ROLES.FDV, ROLES.SALA_MATRICULA, ROLES.QG, ROLES.LIDER_FDV, ROLES.GESTOR_COMERCIAL],
  bases: [ROLES.ADMIN_MASTER, ROLES.SALA_MATRICULA, ROLES.QG, ROLES.LIDER_FDV],
  gap: [ROLES.ADMIN_MASTER, ROLES.SALA_MATRICULA, ROLES.LIDER_FDV],
  fiesProuni: [ROLES.ADMIN_MASTER, ROLES.SALA_MATRICULA, ROLES.LIDER_FDV, ROLES.SSA],
  campanhas: [ROLES.ADMIN_MASTER, ROLES.LIDER_FDV, ROLES.SALA_MATRICULA, ROLES.QG, ROLES.FDV, ROLES.GESTOR_UNIDADE, ROLES.GESTOR_COMERCIAL],
  calendario: [ROLES.ADMIN_MASTER, ROLES.FDV, ROLES.SALA_MATRICULA, ROLES.LIDER_FDV, ROLES.GESTOR_UNIDADE, ROLES.GESTOR_COMERCIAL],
  empresas: [ROLES.ADMIN_MASTER, ROLES.FDV, ROLES.SALA_MATRICULA, ROLES.LIDER_FDV, ROLES.GESTOR_UNIDADE, ROLES.GESTOR_COMERCIAL],
  calculo: [ROLES.ADMIN_MASTER, ROLES.FDV, ROLES.SALA_MATRICULA, ROLES.QG, ROLES.LIDER_FDV, ROLES.GESTOR_UNIDADE, ROLES.GESTOR_COMERCIAL, ROLES.PROMOTOR, ROLES.SSA],
  mapao: [ROLES.ADMIN_MASTER, ROLES.FDV, ROLES.SALA_MATRICULA, ROLES.LIDER_FDV, ROLES.SSA, ROLES.GESTOR_UNIDADE, ROLES.GESTOR_COMERCIAL, ROLES.ACADEMICO],
  basesDisparo: [ROLES.ADMIN_MASTER, ROLES.LIDER_FDV, ROLES.SALA_MATRICULA, ROLES.QG, ROLES.FDV, ROLES.GESTOR_UNIDADE, ROLES.GESTOR_COMERCIAL],
  admin: [ROLES.ADMIN_MASTER, ROLES.LIDER_FDV]
};

// --- Components ---
function PasswordChangeModal({ onComplete }: { onComplete: () => void }) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    setLoading(true);
    setError('');
    try {
      if (auth.currentUser) {
        await updatePassword(auth.currentUser, newPassword);
        onComplete();
      }
    } catch (err: any) {
      setError("Erro ao atualizar senha. Tente sair e entrar novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-8 rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full"
      >
        <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
          <KeyRound size={32} />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Troca de Senha Obrigatória</h2>
        <p className="text-slate-500 mb-6">
          Para sua segurança, você deve alterar sua senha padrão antes de continuar.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Nova Senha</label>
            <input 
              type="password" 
              required 
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Mínimo 6 caracteres"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Confirmar Nova Senha</label>
            <input 
              type="password" 
              required 
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {error && (
            <div className="p-3 bg-rose-50 text-rose-600 text-xs font-bold rounded-xl flex items-center space-x-2">
              <AlertCircle size={14} />
              <span>{error}</span>
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 disabled:opacity-50"
          >
            {loading ? 'Atualizando...' : 'Atualizar Senha'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

const Toast = ({ message, type, onClose }: { message: string, type: 'success' | 'error', onClose: () => void }) => (
  <motion.div 
    initial={{ x: 100, opacity: 0 }}
    animate={{ x: 0, opacity: 1 }}
    exit={{ x: 100, opacity: 0 }}
    className={cn(
      "fixed top-5 right-5 z-50 p-4 rounded-lg shadow-lg flex items-center space-x-2 text-white",
      type === 'success' ? "bg-emerald-600" : "bg-rose-600"
    )}
  >
    {type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
    <span className="font-medium">{message}</span>
    <button onClick={onClose} className="ml-2 hover:opacity-80"><X size={16} /></button>
  </motion.div>
);

function MapaoAcademicoView({ 
  mapao, 
  onToast, 
  profile 
}: { 
  mapao: MapaoAcademicoEntry[], 
  onToast: (m: string, t?: 'success' | 'error') => void,
  profile: UserProfile 
}) {
  const [showModal, setShowModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<MapaoAcademicoEntry | null>(null);
  
  const defaultDisciplina = { codDisc: '', disciplina: '', dia: 'Segunda-feira', horario: '', turma: '', tipoDisciplina: 'PRESENCIAL', professor: '', matricula: '', observacao: '', linkAula: '' };
  
  const [formData, setFormData] = useState<Partial<MapaoAcademicoEntry>>({
    modalidade: 'Presencial',
    tipoCurso: 'GRADUACAO',
    periodo: '',
    disciplinas: [{ ...defaultDisciplina }]
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingEntry) {
        await updateDoc(doc(db, COLLECTIONS.MAPAO_ACADEMICO, editingEntry.id), {
          ...formData,
          createdAt: serverTimestamp()
        });
        onToast("Registro atualizado!");
      } else {
        await addDoc(collection(db, COLLECTIONS.MAPAO_ACADEMICO), {
          ...formData,
          createdAt: serverTimestamp()
        });
        onToast("Registro cadastrado!");
      }
      setShowModal(false);
      setEditingEntry(null);
      setFormData({ modalidade: 'Presencial', tipoCurso: 'GRADUACAO', disciplinas: [{ ...defaultDisciplina }] });
    } catch (err: any) {
      onToast("Erro ao salvar.", 'error');
    }
  };

  const handleDuplicate = async (entry: MapaoAcademicoEntry) => {
    try {
      const { id, ...data } = entry;
      await addDoc(collection(db, COLLECTIONS.MAPAO_ACADEMICO), {
        ...data,
        createdAt: serverTimestamp()
      });
      onToast("Registro duplicado!");
    } catch (err: any) {
      onToast("Erro ao duplicar.", 'error');
    }
  };

  const handleAddDisciplina = () => {
    if (formData.disciplinas && formData.disciplinas.length < 7) {
      setFormData(prev => ({
        ...prev,
        disciplinas: [...(prev.disciplinas || []), { ...defaultDisciplina }]
      }));
    }
  };

  const handleRemoveDisciplina = (index: number) => {
    const newDisciplinas = [...(formData.disciplinas || [])];
    newDisciplinas.splice(index, 1);
    setFormData(prev => ({ ...prev, disciplinas: newDisciplinas }));
  };

  const handleChangeDisciplina = (index: number, field: string, value: string) => {
    const newDisciplinas: any = [...(formData.disciplinas || [])];
    newDisciplinas[index][field] = value;
    if (field === 'dia' && value === 'Virtual') {
      newDisciplinas[index].horario = '';
    }
    setFormData(prev => ({ ...prev, disciplinas: newDisciplinas }));
  };

  const canEdit = profile.role === ROLES.LIDER_FDV || profile.role === ROLES.ACADEMICO;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Mapão Acadêmico</h2>
          <p className="text-sm text-slate-500">Gestão de cursos, disciplinas e horários</p>
        </div>
        {canEdit && (
          <button 
            onClick={() => { setEditingEntry(null); setFormData({ modalidade: 'Presencial', tipoCurso: 'GRADUACAO', disciplinas: [{ ...defaultDisciplina }] }); setShowModal(true); }}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center space-x-2"
          >
            <Plus size={20} />
            <span>Novo Cadastro</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {mapao.map(entry => {
          const disciplinasList = entry.disciplinas || [];


          return (
            <motion.div 
              key={entry.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "p-5 rounded-3xl border shadow-sm transition-all relative group flex flex-col",
                entry.tipoCurso === 'GRADUACAO' ? "bg-white border-blue-100" : "bg-white border-emerald-100"
              )}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex gap-2">
                  <span className={cn(
                    "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                    entry.tipoCurso === 'GRADUACAO' ? "bg-blue-100 text-blue-600" : "bg-emerald-100 text-emerald-600"
                  )}>
                    {entry.tipoCurso}
                  </span>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600">
                    {entry.modalidade}
                  </span>
                </div>
                <div className="flex space-x-1">
                  {canEdit && (
                    <>
                      <button 
                        onClick={() => { 
                          setEditingEntry(entry); 
                          setFormData({
                            ...entry,
                            disciplinas: disciplinasList.length > 0 ? disciplinasList : [{...defaultDisciplina}]
                          }); 
                          setShowModal(true); 
                        }}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        title="Editar"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button 
                        onClick={() => handleDuplicate(entry)}
                        className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                        title="Duplicar"
                      >
                        <Copy size={14} />
                      </button>
                      <button 
                        onClick={async () => { if(window.confirm('Excluir?')) await deleteDoc(doc(db, COLLECTIONS.MAPAO_ACADEMICO, entry.id)); }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                        title="Excluir"
                      >
                        <Trash2 size={14} />
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="flex-1 flex flex-row gap-6">
                <div className="w-1/3 flex flex-col justify-center border-r border-slate-100 pr-6">
                  <h3 className="text-xl font-bold text-slate-900 leading-tight mb-1">{entry.curso}</h3>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">{entry.periodo}</p>
                </div>
                <div className="w-2/3 grid grid-cols-2 gap-3">
                {disciplinasList.map((disc, idx) => (
                  <div key={idx} className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex flex-col justify-between">
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">{disc.codDisc}</p>
                      <p className="text-sm font-bold text-slate-800 leading-tight mb-2">{disc.disciplina}</p>
                      <p className="text-[10px] text-slate-600 font-medium">Prof: {disc.professor}</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div className="flex items-center space-x-1.5 text-slate-600 bg-white px-2 py-1 rounded-lg border border-slate-100">
                        <Clock size={10} className="text-blue-500" />
                        <span className="text-[9px] font-bold truncate">{disc.horario}</span>
                      </div>
                      <div className="flex items-center space-x-1.5 text-slate-600 bg-white px-2 py-1 rounded-lg border border-slate-100">
                        <Users size={10} className="text-emerald-500" />
                        <span className="text-[9px] font-bold truncate">{disc.turma}</span>
                      </div>
                    </div>
                  </div>
                ))}
                </div>
                {disciplinasList.length === 0 && (
                   <p className="text-xs text-slate-500 italic text-center py-4">Nenhuma disciplina cadastrada.</p>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[2.5rem] shadow-2xl max-w-3xl w-full p-8 overflow-y-auto max-h-[90vh] custom-scrollbar"
          >
             <div className="flex justify-between items-center mb-6 sticky top-0 bg-white py-2 z-10 border-b border-slate-100">
              <h3 className="text-2xl font-bold text-slate-900">{editingEntry ? 'Editar Curso' : 'Novo Cadastro Acadêmico'}</h3>
              <button type="button" onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-all text-slate-400">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-slate-100">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Período</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-700"
                    value={formData.periodo || ''}
                    onChange={e => setFormData({...formData, periodo: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Tipo de Curso</label>
                  <select 
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-700"
                    value={formData.tipoCurso}
                    onChange={e => setFormData({...formData, tipoCurso: e.target.value as any})}
                    required
                  >
                    <option value="GRADUACAO">GRADUAÇÃO</option>
                    <option value="TECNICO">TÉCNICO</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Modalidade</label>
                  <select 
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-700"
                    value={formData.modalidade}
                    onChange={e => setFormData({...formData, modalidade: e.target.value})}
                    required
                  >
                    <option value="Presencial">Presencial</option>
                    <option value="EAD">EAD</option>
                    <option value="Semipresencial">Semipresencial</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Nome do Curso</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-700"
                    value={formData.curso || ''}
                    onChange={e => setFormData({...formData, curso: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-4">
                   <h4 className="font-bold text-slate-800 text-lg">Disciplinas do Curso</h4>
                   {((formData.disciplinas?.length || 0) < 7) && (
                     <button type="button" onClick={handleAddDisciplina} className="text-sm flex items-center gap-1 text-blue-600 hover:text-blue-700 font-bold bg-blue-50 px-3 py-1.5 rounded-xl">
                       <Plus size={16} /> Adicionar ({formData.disciplinas?.length || 0}/7)
                     </button>
                   )}
                </div>

                <div className="space-y-4">
                  {formData.disciplinas?.map((disc, idx) => (
                    <div key={idx} className="bg-slate-50 border border-slate-200 p-5 rounded-2xl relative">
                      {formData.disciplinas && formData.disciplinas.length > 1 && (
                        <button type="button" onClick={() => handleRemoveDisciplina(idx)} className="absolute top-4 right-4 text-rose-400 hover:text-rose-600 hover:bg-rose-50 p-1.5 rounded-lg transition-colors">
                          <Trash2 size={16} />
                        </button>
                      )}
                      <h5 className="text-xs font-bold uppercase text-slate-400 mb-4">Disciplina {idx + 1}</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">Código</label>
                          <input 
                            type="text" 
                            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 outline-none text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500"
                            value={disc.codDisc}
                            onChange={e => handleChangeDisciplina(idx, 'codDisc', e.target.value)}
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">Disciplina</label>
                          <input 
                            type="text" 
                            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 outline-none text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500"
                            value={disc.disciplina}
                            onChange={e => handleChangeDisciplina(idx, 'disciplina', e.target.value)}
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">Dia da Semana</label>
                          <select 
                            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 outline-none text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500"
                            value={disc.dia}
                            onChange={e => handleChangeDisciplina(idx, 'dia', e.target.value)}
                            required
                          >
                            {["Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado", "Virtual"].map(d => (
                              <option key={d} value={d}>{d}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">Horário {disc.dia === 'Virtual' ? '(Não se aplica)' : ''}</label>
                          <input 
                            type="text" 
                            placeholder={disc.dia === 'Virtual' ? "Virtual" : "Ex: 19:00 - 22:00"}
                            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 outline-none text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:bg-slate-100"
                            value={disc.horario}
                            onChange={e => handleChangeDisciplina(idx, 'horario', e.target.value)}
                            required={disc.dia !== 'Virtual'}
                            disabled={disc.dia === 'Virtual'}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">Turma</label>
                          <input 
                            type="text" 
                            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 outline-none text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500"
                            value={disc.turma}
                            onChange={e => handleChangeDisciplina(idx, 'turma', e.target.value)}
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">Tipo Disciplina</label>
                          <select 
                            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 outline-none text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500"
                            value={disc.tipoDisciplina}
                            onChange={e => handleChangeDisciplina(idx, 'tipoDisciplina', e.target.value)}
                            required
                          >
                            <option value="PRESENCIAL">Presencial</option>
                            <option value="ONLINE">Online</option>
                            <option value="TEAMS">Teams</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex space-x-4 pt-4 sticky bottom-0 bg-white py-4 border-t border-slate-100 z-10">
                <button 
                  type="submit" 
                  className="flex-1 bg-blue-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all"
                >
                  {editingEntry ? 'Salvar Alterações' : 'Cadastrar'}
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="px-8 bg-slate-100 text-slate-600 font-bold py-4 rounded-2xl hover:bg-slate-200 transition-all border border-slate-200"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function BasesDisparoView({ bases, onToast }: { bases: BaseDisparoEntry[], onToast: (m: string, t?: 'success' | 'error') => void }) {
  const [showModal, setShowModal] = useState(false);
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [formData, setFormData] = useState<Partial<BaseDisparoEntry>>({
    data: new Date().toISOString().split('T')[0],
    totalDisparos: 0,
    positivos: 0,
    negativos: 0
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, COLLECTIONS.BASES_DISPARO), {
        ...formData,
        createdAt: serverTimestamp()
      });
      onToast("Base registrada!");
      setShowModal(false);
      setFormData({ data: new Date().toISOString().split('T')[0], totalDisparos: 0, positivos: 0, negativos: 0 });
    } catch (err: any) {
      onToast("Erro ao registrar.", 'error');
    }
  };

  const filteredBases = bases.filter(b => b.data === filterDate);

  const totalDisparos = filteredBases.reduce((acc, b) => acc + b.totalDisparos, 0);
  const totalPositivos = filteredBases.reduce((acc, b) => acc + b.positivos, 0);
  const totalNegativos = filteredBases.reduce((acc, b) => acc + b.negativos, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Bases de Disparo</h2>
          <p className="text-sm text-slate-500">Métricas diárias de disparos e conversão</p>
        </div>
        <div className="flex items-center space-x-4">
          <input 
            type="date"
            className="px-4 py-2.5 rounded-2xl border border-slate-200 text-sm font-bold text-slate-700"
            value={filterDate}
            onChange={e => setFilterDate(e.target.value)}
          />
          <button 
            onClick={() => setShowModal(true)}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center space-x-2"
          >
            <Plus size={20} />
            <span>Registrar Base</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase mb-1">Total de Disparos</p>
          <p className="text-3xl font-black text-blue-600">{totalDisparos}</p>
        </div>
        <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100 shadow-sm">
          <p className="text-xs font-bold text-emerald-500 uppercase mb-1">Total Positivos</p>
          <p className="text-3xl font-black text-emerald-600">{totalPositivos}</p>
          <p className="text-xs font-bold text-emerald-500 mt-2">
            Taxa: {totalDisparos > 0 ? ((totalPositivos / totalDisparos) * 100).toFixed(1) : 0}%
          </p>
        </div>
        <div className="bg-rose-50 p-6 rounded-3xl border border-rose-100 shadow-sm">
          <p className="text-xs font-bold text-rose-500 uppercase mb-1">Total Negativos</p>
          <p className="text-3xl font-black text-rose-600">{totalNegativos}</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h3 className="text-xl font-bold text-slate-900">Listagem Diária</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider">
                <th className="px-6 py-4">Nome da Base</th>
                <th className="px-6 py-4">Total Disparos</th>
                <th className="px-6 py-4">Positivos</th>
                <th className="px-6 py-4">Negativos</th>
                <th className="px-6 py-4">Conversão</th>
                <th className="px-6 py-4">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredBases.map(b => (
                <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-900">{b.nomeBase}</td>
                  <td className="px-6 py-4 font-bold text-blue-600">{b.totalDisparos}</td>
                  <td className="px-6 py-4 font-bold text-emerald-600">{b.positivos}</td>
                  <td className="px-6 py-4 font-bold text-rose-600">{b.negativos}</td>
                  <td className="px-6 py-4 font-bold text-slate-700">
                    {b.totalDisparos > 0 ? ((b.positivos / b.totalDisparos) * 100).toFixed(1) : 0}%
                  </td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={async () => { if(window.confirm('Excluir?')) await deleteDoc(doc(db, COLLECTIONS.BASES_DISPARO, b.id)); }}
                      className="text-rose-500 hover:bg-rose-100 p-2 rounded-xl transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredBases.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">
                    Nenhum registro para esta data.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[2.5rem] shadow-2xl max-w-lg w-full p-8"
          >
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-bold text-slate-900">Registrar Métricas da Base</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-all text-slate-400">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Data do Disparo</label>
                <input 
                  type="date" 
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-700"
                  value={formData.data}
                  onChange={e => setFormData({...formData, data: e.target.value})}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Nome da Base</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-700"
                  value={formData.nomeBase}
                  onChange={e => setFormData({...formData, nomeBase: e.target.value})}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Total</label>
                  <input 
                    type="number" 
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-700"
                    value={formData.totalDisparos}
                    onChange={e => setFormData({...formData, totalDisparos: Number(e.target.value)})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Positivos</label>
                  <input 
                    type="number" 
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-700"
                    value={formData.positivos}
                    onChange={e => setFormData({...formData, positivos: Number(e.target.value)})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Negativos</label>
                  <input 
                    type="number" 
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-700"
                    value={formData.negativos}
                    onChange={e => setFormData({...formData, negativos: Number(e.target.value)})}
                    required
                  />
                </div>
              </div>

              <div className="flex space-x-4 pt-4">
                <button 
                  type="submit" 
                  className="flex-1 bg-blue-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all"
                >
                  Registrar
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="px-8 bg-slate-100 text-slate-600 font-bold py-4 rounded-2xl hover:bg-slate-200 transition-all"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}

const StatCard = ({ title, value, icon: Icon, color, trend }: { title: string, value: string | number, icon: any, color: string, trend?: string }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
    <div>
      <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">{title}</p>
      <p className="text-3xl font-bold text-slate-900">{value}</p>
      {trend && <p className="text-xs text-emerald-600 font-medium mt-1 flex items-center"><TrendingUp size={12} className="mr-1" /> {trend}</p>}
    </div>
    <div className={cn("p-4 rounded-2xl", color)}>
      <Icon size={24} className="text-white" />
    </div>
  </div>
);

// --- Main App ---

function CampanhasView({ campanhas, onToast }: { campanhas: Campanha[], onToast: (m: string, t?: 'success' | 'error') => void }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [editingCampanha, setEditingCampanha] = useState<Campanha | null>(null);
  const [selectedCampanha, setSelectedCampanha] = useState<Campanha | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  const getEffectiveStatus = (camp: Campanha) => {
    const today = new Date().toISOString().split('T')[0];
    if (today < camp.dataInicio) return 'Agendada';
    if (today > camp.dataFim) return 'Finalizada';
    return 'Ativa';
  };

  const filteredCampanhas = useMemo(() => {
    return campanhas.filter(camp => {
      const effectiveStatus = getEffectiveStatus(camp);
      const matchesSearch = camp.nome.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = !statusFilter || effectiveStatus === statusFilter;
      const matchesDate = !dateFilter || (dateFilter >= camp.dataInicio && dateFilter <= camp.dataFim);
      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [campanhas, searchTerm, statusFilter, dateFilter]);

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const payload = {
      nome: formData.get('nome') as string,
      dataInicio: formData.get('dataInicio') as string,
      dataFim: formData.get('dataFim') as string,
      objetivo: formData.get('objetivo') as string,
      updatedAt: serverTimestamp(),
    };

    try {
      if (editingCampanha) {
        await updateDoc(doc(db, COLLECTIONS.CAMPANHAS, editingCampanha.id), payload);
        onToast("Campanha atualizada!");
      } else {
        await addDoc(collection(db, COLLECTIONS.CAMPANHAS), { ...payload, createdAt: serverTimestamp() });
        onToast("Campanha criada!");
      }
      setIsModalOpen(false);
      setEditingCampanha(null);
    } catch (err: any) {
      handleFirestoreError(err, OperationType.WRITE, COLLECTIONS.CAMPANHAS);
      onToast("Erro ao salvar campanha.", 'error');
    }
  };

  const handleExport = () => {
    const data = filteredCampanhas.map(c => ({
      Nome: c.nome,
      'Data Início': c.dataInicio,
      'Data Fim': c.dataFim,
      Status: c.status,
      Objetivo: c.objetivo
    }));
    exportToExcel(data, 'Campanhas');
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    importFromExcel(file, async (data) => {
      try {
        const batch = data.map(item => ({
          nome: item.Nome || item.nome || '',
          dataInicio: item['Data Início'] || item.dataInicio || '',
          dataFim: item['Data Fim'] || item.dataFim || '',
          status: item.Status || item.status || 'Ativa',
          objetivo: item.Objetivo || item.objetivo || '',
          createdAt: serverTimestamp()
        }));

        for (const entry of batch) {
          await addDoc(collection(db, COLLECTIONS.CAMPANHAS), entry);
        }
        onToast(`${batch.length} campanhas importadas!`);
      } catch (err: any) {
        onToast("Erro ao importar campanhas.", 'error');
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Campanhas</h2>
        <div className="flex space-x-2">
          <button 
            onClick={() => { setEditingCampanha(null); setIsModalOpen(true); }}
            className="bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center space-x-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
          >
            <Plus size={20} />
            <span>Nova Campanha</span>
          </button>
          <label className="bg-blue-50 text-blue-600 px-4 py-2 rounded-xl flex items-center space-x-2 hover:bg-blue-100 transition-all text-sm font-bold cursor-pointer">
            <Upload size={18} />
            <span>Importar</span>
            <input type="file" accept=".xlsx, .xls" onChange={handleImport} className="hidden" />
          </label>
          <button 
            onClick={handleExport}
            className="bg-slate-100 text-slate-600 px-4 py-2 rounded-xl flex items-center space-x-2 hover:bg-slate-200 transition-all text-sm font-bold"
          >
            <Download size={18} />
            <span>Exportar</span>
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por nome..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
          />
        </div>
        <select 
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
        >
          <option value="">Todos os Status</option>
          <option value="Ativa">Ativa</option>
          <option value="Agendada">Agendada</option>
          <option value="Finalizada">Finalizada</option>
        </select>
        <input 
          type="date" 
          value={dateFilter}
          onChange={e => setDateFilter(e.target.value)}
          className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCampanhas.map(camp => {
          const effectiveStatus = getEffectiveStatus(camp);
          return (
            <div 
              key={camp.id} 
              className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between cursor-pointer hover:shadow-md transition-all"
              onClick={() => { setSelectedCampanha(camp); setIsDetailModalOpen(true); }}
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-bold text-slate-900">{camp.nome}</h3>
                  <span className={cn(
                    "px-2 py-1 rounded-full text-[10px] font-bold uppercase",
                    effectiveStatus === 'Ativa' ? "bg-emerald-100 text-emerald-600" :
                    effectiveStatus === 'Agendada' ? "bg-blue-100 text-blue-600" :
                    "bg-slate-100 text-slate-600"
                  )}>
                    {effectiveStatus}
                  </span>
                </div>
                <p className="text-sm text-slate-500 mb-4 line-clamp-2">{camp.objetivo}</p>
                <div className="flex items-center space-x-4 text-xs text-slate-400">
                  <div className="flex items-center space-x-1">
                    <Calendar size={14} />
                    <span>{camp.dataInicio} - {camp.dataFim}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {filteredCampanhas.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-400 italic">Nenhuma campanha encontrada.</div>
        )}
      </div>

      <AnimatePresence>
        {isDetailModalOpen && selectedCampanha && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-lg space-y-6"
            >
              <h2 className="text-2xl font-bold text-slate-900">{selectedCampanha.nome}</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase">Período</p>
                  <p className="text-sm text-slate-700">{selectedCampanha.dataInicio} - {selectedCampanha.dataFim}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase">Objetivo</p>
                  <p className="text-sm text-slate-700">{selectedCampanha.objetivo}</p>
                </div>
              </div>
              <div className="flex space-x-4 pt-4">
                <button 
                  onClick={() => setIsDetailModalOpen(false)}
                  className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all"
                >
                  Fechar
                </button>
                <button 
                  onClick={() => { setEditingCampanha(selectedCampanha); setIsDetailModalOpen(false); setIsModalOpen(true); }}
                  className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all"
                >
                  Editar Campanha
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-xl font-bold text-slate-900">
                  {editingCampanha ? 'Editar Campanha' : 'Nova Campanha'}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleSave} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Nome da Campanha</label>
                  <input name="nome" defaultValue={editingCampanha?.nome} required className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Início</label>
                    <input type="date" name="dataInicio" defaultValue={editingCampanha?.dataInicio} required className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Fim</label>
                    <input type="date" name="dataFim" defaultValue={editingCampanha?.dataFim} required className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Status</label>
                  <select name="status" defaultValue={editingCampanha?.status || 'Ativa'} className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="Ativa">Ativa</option>
                    <option value="Pausada">Pausada</option>
                    <option value="Finalizada">Finalizada</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Objetivo</label>
                  <textarea name="objetivo" defaultValue={editingCampanha?.objetivo} rows={3} className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200">
                  {editingCampanha ? 'Salvar Alterações' : 'Criar Campanha'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FiesProuniView({ 
  data, 
  onToast, 
  profile, 
  whatsappMessages, 
  periodos,
  botConfig,
  onSendBot,
  onMassSendBot
}: { 
  data: FiesProuniEntry[], 
  onToast: (m: string, t?: 'success' | 'error') => void,
  profile: UserProfile,
  whatsappMessages: WhatsAppMessage[],
  periodos: PeriodoCaptacao[],
  botConfig: BotConfig,
  onSendBot: (tel: string, msg: string) => void;
  onMassSendBot: (messages: {telefone: string, message: string}[]) => void;
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [periodoFilter, setPeriodoFilter] = useState('');
  const [tipoFilter, setTipoFilter] = useState('');
  const [listaFilter, setListaFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [bolsaFilter, setBolsaFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<FiesProuniEntry | null>(null);
  const [cpfInput, setCpfInput] = useState('');

  const isAdmin = profile.role === ROLES.LIDER_FDV;

  useEffect(() => {
    if (editingEntry) {
      setCpfInput(formatCPF(editingEntry.cpf));
    } else {
      setCpfInput('');
    }
  }, [editingEntry, isModalOpen]);

  const filteredData = data.filter(item => {
    const matchesSearch = item.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.cpf.includes(searchTerm) || 
                          item.curso.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (item.lista && item.lista.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          (item.responsavelEntrevista && item.responsavelEntrevista.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          (item.status && item.status.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesPeriodo = !periodoFilter || item.periodo === periodoFilter;
    const matchesTipo = !tipoFilter || item.tipo === tipoFilter;
    const matchesLista = !listaFilter || item.lista === listaFilter;
    const matchesStatus = !statusFilter || item.status === statusFilter;
    const matchesBolsa = !bolsaFilter || item.bolsa === bolsaFilter;
    return matchesSearch && matchesPeriodo && matchesTipo && matchesLista && matchesStatus && matchesBolsa;
  });

  const uniqueListas = Array.from(new Set(data.map(i => i.lista).filter(Boolean))).sort();
  const uniqueStatuses = Array.from(new Set(data.map(i => i.status).filter(Boolean))).sort();

  const stats = {
    total: filteredData.length,
    pendentes: filteredData.filter(i => i.docsEntreguesStatus === 'Pendente').length,
    parcial: filteredData.filter(i => i.docsEntreguesStatus === 'Parcial').length,
    entregaram: filteredData.filter(i => i.docsEntreguesStatus === 'Sim').length,
    comInscricao: filteredData.filter(i => i.inscricaoSales).length,
    comMatricula: filteredData.filter(i => i.numeroMatricula).length,
    emAnalise: filteredData.filter(i => i.digitalizaStatus === 'Em Análise').length,
    concluido: filteredData.filter(i => i.digitalizaStatus === 'Concluído').length,
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const cpf = formData.get('cpf') as string;

    if (!validateCPF(cpf)) {
      onToast("CPF inválido. Por favor, verifique os 11 dígitos.", 'error');
      return;
    }

    const payload = {
      nome: formData.get('nome') as string,
      cpf: cpf.replace(/\D/g, ''), // Store only digits
      telefone: formData.get('telefone') as string,
      email: formData.get('email') as string,
      endereco: formData.get('endereco') as string,
      status: formData.get('status') as string,
      tipo: formData.get('tipo') as 'FIES' | 'PROUNI',
      bolsa: formData.get('bolsa') as 'Parcial' | 'Total',
      metodologia: formData.get('metodologia') as string,
      curso: formData.get('curso') as string,
      inscricaoSales: formData.get('inscricaoSales') as string,
      numeroMatricula: formData.get('numeroMatricula') as string,
      tcbAssinado: formData.get('tcbAssinado') === 'on',
      digitalizaStatus: formData.get('digitalizaStatus') as any,
      docsEntreguesStatus: formData.get('docsEntreguesStatus') as any,
      sisprouniStatus: formData.get('sisprouniStatus') as any,
      responsavelEntrevista: formData.get('responsavelEntrevista') as string,
      dataEntrevista: formData.get('dataEntrevista') as string,
      observacao: formData.get('observacao') as string,
      periodo: formData.get('periodo') as string,
      lista: formData.get('lista') as string,
      posicaoRanking: formData.get('posicaoRanking') as string,
      documentosEntregues: (formData.get('documentos') as string)?.split(',').map(s => s.trim()).filter(Boolean) || [],
      updatedAt: serverTimestamp(),
    };

    try {
      if (editingEntry) {
        await updateDoc(doc(db, COLLECTIONS.FIES_PROUNI, editingEntry.id), payload);
        onToast("Registro atualizado!");
      } else {
        await addDoc(collection(db, COLLECTIONS.FIES_PROUNI), { ...payload, createdAt: serverTimestamp() });
        onToast("Registro cadastrado!");
      }
      setIsModalOpen(false);
      setEditingEntry(null);
    } catch (err: any) {
      handleFirestoreError(err, OperationType.WRITE, COLLECTIONS.FIES_PROUNI);
      onToast("Erro ao salvar registro.", 'error');
    }
  };

  const handleExport = () => {
    const exportData = filteredData.map(item => ({
      Nome: item.nome,
      CPF: item.cpf,
      Telefone: item.telefone || '',
      Email: item.email || '',
      Endereço: item.endereco || '',
      Status: item.status || '',
      Tipo: item.tipo,
      Bolsa: item.bolsa,
      Curso: item.curso,
      Ranking: item.posicaoRanking || '',
      Lista: item.lista || '',
      Periodo: item.periodo || '',
      Metodologia: item.metodologia || '',
      'Responsável Entrevista': item.responsavelEntrevista || '',
      'Data Entrevista': item.dataEntrevista || '',
      'Status Docs': item.docsEntreguesStatus || '',
      'Inscrição Sales': item.inscricaoSales || '',
      'Número Matrícula': item.numeroMatricula || '',
      'Status Digitaliza': item.digitalizaStatus,
      'SISPROUNI': item.sisprouniStatus || 'Pendente',
      'TCB Assinado': item.tcbAssinado ? 'Sim' : 'Não',
      'Documentos Entregues': item.documentosEntregues?.join(', ') || '',
      Observação: item.observacao || ''
    }));
    exportToExcel(exportData, 'Fies_Prouni');
  };

  const [selectedEntries, setSelectedEntries] = useState<string[]>([]);
  
  const handleBulkDelete = async () => {
    if (selectedEntries.length === 0) return;
    if (window.confirm(`Deseja excluir ${selectedEntries.length} registros Fies/Prouni selecionados?`)) {
        try {
            for (const id of selectedEntries) {
                await deleteDoc(doc(db, COLLECTIONS.FIES_PROUNI, id));
            }
            onToast(`${selectedEntries.length} registros removidos.`);
            setSelectedEntries([]);
        } catch (err: any) {
            onToast("Erro ao excluir registros.", 'error');
        }
    }
  };

  const handleDeleteIndividual = async (id: string) => {
    if (window.confirm('Deseja excluir este registro?')) {
        try {
            await deleteDoc(doc(db, COLLECTIONS.FIES_PROUNI, id));
            onToast("Registro removido.");
        } catch (err: any) {
            onToast("Erro ao excluir registro.", 'error');
        }
    }
  };

  const toggleSelect = (id: string, checked: boolean) => {
    if (checked) {
        setSelectedEntries([...selectedEntries, id]);
    } else {
        setSelectedEntries(selectedEntries.filter(s => s !== id));
    }
  };

  const toggleSelectAll = (checked: boolean) => {
      if (checked) {
          setSelectedEntries(filteredData.map(b => b.id));
      } else {
          setSelectedEntries([]);
      }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Acompanhamento Fies/Prouni</h2>
        <div className="flex space-x-2">
          <button 
            onClick={() => { setEditingEntry(null); setIsModalOpen(true); }}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-indigo-700 transition-colors"
          >
            <Plus size={20} />
            <span>Novo Cadastro</span>
          </button>
          <label className="bg-blue-50 text-blue-600 px-4 py-2 rounded-xl flex items-center space-x-2 hover:bg-blue-100 transition-all text-sm font-bold cursor-pointer">
            <Upload size={18} />
            <span>Importação indisponível</span>
          </label>
          <button 
            onClick={handleExport}
            className="bg-slate-100 text-slate-600 px-4 py-2 rounded-xl flex items-center space-x-2 hover:bg-slate-200 transition-all text-sm font-bold"
          >
            <Download size={18} />
            <span>Exportar Excel</span>
          </button>
        </div>
      </div>

      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Candidatos" value={stats.total} icon={Users} color="bg-blue-500" />
        <StatCard title="Pendentes Doc" value={stats.pendentes} icon={AlertCircle} color="bg-red-500" />
        <StatCard title="Docs Parciais" value={stats.parcial} icon={Clock} color="bg-amber-500" />
        <StatCard title="Docs Entregues" value={stats.entregaram} icon={CheckCircle2} color="bg-green-500" />
        <StatCard title="Com Inscrição" value={stats.comInscricao} icon={FileText} color="bg-indigo-500" />
        <StatCard title="Com Matrícula" value={stats.comMatricula} icon={GraduationCap} color="bg-purple-500" />
        <StatCard title="Em Análise" value={stats.emAnalise} icon={Clock} color="bg-amber-500" />
        <StatCard title="Docs OK" value={stats.concluido} icon={ShieldCheck} color="bg-emerald-500" />
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Pesquisar por nome, CPF ou curso..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select 
          className="px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
          value={periodoFilter}
          onChange={(e) => setPeriodoFilter(e.target.value)}
        >
          <option value="">Todos os Períodos</option>
          {periodos.map(p => <option key={p.id} value={p.nome}>{p.nome}</option>)}
        </select>
        <select 
          className="px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
          value={tipoFilter}
          onChange={(e) => setTipoFilter(e.target.value)}
        >
          <option value="">Fies & Prouni</option>
          <option value="FIES">Apenas FIES</option>
          <option value="PROUNI">Apenas PROUNI</option>
        </select>
        <select 
          className="px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
          value={bolsaFilter}
          onChange={(e) => setBolsaFilter(e.target.value)}
        >
          <option value="">Todas as Bolsas</option>
          <option value="Total">Total</option>
          <option value="Parcial">Parcial</option>
        </select>
        <select 
          className="px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
          value={listaFilter}
          onChange={(e) => setListaFilter(e.target.value)}
        >
          <option value="">Todas as Listas</option>
          {uniqueListas.map(l => <option key={l} value={l}>{l}</option>)}
        </select>
        <select 
          className="px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">Todos os Status</option>
          {uniqueStatuses.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4">
                  <input type="checkbox" checked={selectedEntries.length === filteredData.length && filteredData.length > 0} onChange={e => toggleSelectAll(e.target.checked)} />
                </th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Candidato</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Lista/Status</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Tipo/Bolsa</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Curso/Metodologia</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Documentação</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Digitaliza</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">TCB</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600 flex items-center gap-4">
                  {selectedEntries.length > 0 && (
                      <button onClick={handleBulkDelete} className="text-rose-600 font-bold hover:underline">excluir selecionados</button>
                  )}
                  {selectedEntries.length > 0 && botConfig.url && (
                      <button 
                         onClick={() => {
                            const selectedObjs = data.filter(g => selectedEntries.includes(g.id));
                            const payloads = selectedObjs.map(item => {
                               const isMatAcadOk = item.numeroMatricula && item.numeroMatricula.trim().length > 0;
                               const type = isMatAcadOk ? 'fiesProuni_1' : 'fiesProuni_0';
                               const msgTemplate = whatsappMessages.find(m => m.tipo === type || m.tipo === 'fiesProuni');
                               const text = msgTemplate ? msgTemplate.texto.replace('[nome]', item.nome) : `Olá ${item.nome}, tudo bem?`;
                               return {
                                   telefone: item.telefone,
                                   message: text
                               };
                            });
                            onMassSendBot(payloads);
                            setSelectedEntries([]);
                         }} 
                         className="text-blue-600 font-bold hover:underline py-1 px-2 bg-blue-50 rounded-lg flex items-center gap-1"
                      >
                         <Bot size={14} /> Em Massa
                      </button>
                  )}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredData.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                      <input type="checkbox" checked={selectedEntries.includes(item.id)} onChange={e => toggleSelect(item.id, e.target.checked)} />
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{item.nome}</div>
                    <div className="text-[10px] font-bold text-indigo-500">Ranking: {item.posicaoRanking || '-'}</div>
                    <div className="text-xs text-gray-500">{formatCPF(item.cpf)}</div>
                    <div className="text-xs text-gray-400">{item.periodo}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-bold text-indigo-600">{item.lista || '-'}</div>
                    <div className="text-[10px] text-slate-500 uppercase font-bold">{item.status || 'Sem Status'}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${item.tipo === 'FIES' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                      {item.tipo}
                    </span>
                    <div className="text-xs text-gray-500 mt-1">{item.bolsa}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-700">{item.curso}</div>
                    <div className="text-xs text-gray-500">{item.metodologia}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                      item.docsEntreguesStatus === 'Sim' ? 'bg-green-100 text-green-700' :
                      item.docsEntreguesStatus === 'Parcial' ? 'bg-amber-100 text-amber-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {item.docsEntreguesStatus || 'Pendente'}
                    </span>
                    <div className="text-[10px] text-slate-400 mt-1">
                      {item.documentosEntregues?.length || 0} docs
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      item.digitalizaStatus === 'Concluído' ? 'bg-green-100 text-green-700' :
                      item.digitalizaStatus === 'Em Análise' ? 'bg-amber-100 text-amber-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {item.digitalizaStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {item.tcbAssinado ? (
                      <CheckCircle2 className="text-green-500" size={20} />
                    ) : (
                      <Clock className="text-gray-300" size={20} />
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => { setEditingEntry(item); setIsModalOpen(true); }}
                        className="text-indigo-600 hover:text-indigo-800 font-medium text-sm p-2 hover:bg-indigo-50 rounded-lg transition-all"
                        title="Editar"
                      >
                        <Edit2 size={18} />
                      </button>
                      {item.telefone && (
                        <>
                          {botConfig.url && (
                            <button 
                              onClick={() => {
                                const isMatAcadOk = item.numeroMatricula && item.numeroMatricula.trim().length > 0;
                                const type = isMatAcadOk ? 'fiesProuni_1' : 'fiesProuni_0';
                                const msgObj = whatsappMessages.find(m => m.tipo === type || m.tipo === 'fiesProuni');
                                const msg = (msgObj ? msgObj.texto : `Olá [nome], tudo bem?`).replace('[nome]', item.nome);
                                onSendBot(item.telefone, msg);
                              }}
                              className="text-blue-600 hover:text-blue-800 p-2 hover:bg-blue-50 rounded-lg transition-all"
                              title="Enviar pelo Bot ARGO'S"
                            >
                              <Bot size={18} />
                            </button>
                          )}
                          <a 
                            href={getWhatsAppUrl(item.telefone, (() => {
                              const isMatAcadOk = item.numeroMatricula && item.numeroMatricula.trim().length > 0;
                              const type = isMatAcadOk ? 'fiesProuni_1' : 'fiesProuni_0';
                              const msg = whatsappMessages.find(m => m.tipo === type || m.tipo === 'fiesProuni');
                              if (msg) return msg.texto.replace('[nome]', item.nome);
                              return `Olá ${item.nome}, tudo bem?`;
                            })())}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-600 hover:text-emerald-800 p-2 hover:bg-emerald-50 rounded-lg transition-all"
                            title="Enviar WhatsApp"
                          >
                            <MessageSquare size={18} />
                          </a>
                        </>
                      )}
                      <button 
                        onClick={() => handleDeleteIndividual(item.id)}
                        className="text-rose-400 hover:text-rose-600 p-2 hover:bg-rose-50 rounded-lg transition-all"
                        title="Excluir"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
                <h3 className="text-xl font-bold text-gray-800">
                  {editingEntry ? 'Editar Registro' : 'Novo Cadastro Fies/Prouni'}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleSave} className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                    <input name="nome" defaultValue={editingEntry?.nome} required className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">CPF</label>
                    <input 
                      name="cpf" 
                      value={cpfInput}
                      onChange={(e) => setCpfInput(formatCPF(e.target.value))}
                      required 
                      placeholder="000.000.000-00"
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                    <input name="telefone" defaultValue={editingEntry?.telefone} className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input name="email" type="email" defaultValue={editingEntry?.email} className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
                    <input name="endereco" defaultValue={editingEntry?.endereco} className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select name="status" defaultValue={editingEntry?.status || 'Pendente'} className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500">
                      <option value="Pendente">Pendente</option>
                      <option value="Aprovado">Aprovado</option>
                      <option value="Reprovado">Reprovado</option>
                      <option value="Em Análise">Em Análise</option>
                      <option value="Desistente">Desistente</option>
                      <option value="Não compareceu">Não compareceu</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                    <select name="tipo" defaultValue={editingEntry?.tipo || 'PROUNI'} className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500">
                      <option value="FIES">FIES</option>
                      <option value="PROUNI">PROUNI</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bolsa</label>
                    <select name="bolsa" defaultValue={editingEntry?.bolsa || 'Total'} className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500">
                      <option value="Total">Total</option>
                      <option value="Parcial">Parcial</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Período</label>
                    <input name="periodo" defaultValue={editingEntry?.periodo} placeholder="Ex: 2025.1" className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Lista</label>
                    <input name="lista" defaultValue={editingEntry?.lista} placeholder="Ex: Lista 1" className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Posição no Ranking</label>
                    <input name="posicaoRanking" defaultValue={editingEntry?.posicaoRanking} placeholder="Ex: 15º" className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Curso</label>
                    <input name="curso" defaultValue={editingEntry?.curso} required className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Metodologia</label>
                    <input name="metodologia" defaultValue={editingEntry?.metodologia} className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Inscrição Sales</label>
                    <input name="inscricaoSales" defaultValue={editingEntry?.inscricaoSales} className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Número Matrícula</label>
                    <input name="numeroMatricula" defaultValue={editingEntry?.numeroMatricula} className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status Digitaliza</label>
                    <select name="digitalizaStatus" defaultValue={editingEntry?.digitalizaStatus || 'Não Postado'} className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500">
                      <option value="Não Postado">Não Postado</option>
                      <option value="Em Análise">Em Análise</option>
                      <option value="Concluído">Concluído</option>
                      <option value="Documento reprovado">Documento reprovado</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status Documentos</label>
                    <select name="docsEntreguesStatus" defaultValue={editingEntry?.docsEntreguesStatus || 'Pendente'} className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500">
                      <option value="Pendente">Pendente</option>
                      <option value="Parcial">Parcial</option>
                      <option value="Sim">Sim (Tudo Entregue)</option>
                      <option value="Não compareceu">Não compareceu</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">SISPROUNI</label>
                    <select name="sisprouniStatus" defaultValue={editingEntry?.sisprouniStatus || 'Pendente'} className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500">
                      <option value="Pendente">Pendente</option>
                      <option value="Aprovado">Aprovado</option>
                      <option value="Reprovado">Reprovado</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Responsável Entrevista</label>
                    <input 
                      name="responsavelEntrevista" 
                      defaultValue={editingEntry?.responsavelEntrevista || profile.name} 
                      readOnly={!isAdmin}
                      className={`w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 ${!isAdmin ? 'bg-slate-50 text-slate-500' : ''}`} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Data Entrevista</label>
                    <input 
                      name="dataEntrevista" 
                      type="date"
                      defaultValue={editingEntry?.dataEntrevista || new Date().toISOString().split('T')[0]} 
                      readOnly={!isAdmin}
                      className={`w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 ${!isAdmin ? 'bg-slate-50 text-slate-500' : ''}`} 
                    />
                  </div>
                  <div className="flex items-center space-x-2 pt-8">
                    <input type="checkbox" name="tcbAssinado" defaultChecked={editingEntry?.tcbAssinado} className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500" />
                    <label className="text-sm font-medium text-gray-700">TCB Assinado</label>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Documentos Entregues (separados por vírgula)</label>
                  <input name="documentos" defaultValue={editingEntry?.documentosEntregues?.join(', ')} placeholder="Ex: RG, CPF, Diploma" className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Observações / O que falta</label>
                  <textarea name="observacao" defaultValue={editingEntry?.observacao} rows={3} className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div className="pt-4">
                  <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">
                    {editingEntry ? 'Salvar Alterações' : 'Cadastrar Candidato'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState('cadastro');
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Data States
  const [leads, setLeads] = useState<Lead[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [bases, setBases] = useState<BaseEntry[]>([]);
  const [gap, setGap] = useState<GapEntry[]>([]);
  const [fiesProuni, setFiesProuni] = useState<FiesProuniEntry[]>([]);
  const [campanhas, setCampanhas] = useState<Campanha[]>([]);
  const [bomDia, setBomDia] = useState<BomDiaCaptacao[]>([]);
  const [forecast, setForecast] = useState<ForecastCaptacao[]>([]);
  const [planner, setPlanner] = useState<PlannerTask[]>([]);
  const [periodos, setPeriodos] = useState<PeriodoCaptacao[]>([]);
  const [calendarioAcoes, setCalendarioAcoes] = useState<CalendarioAcao[]>([]);
  const [empresasParceiras, setEmpresasParceiras] = useState<EmpresaParceira[]>([]);
  const [whatsappMessages, setWhatsappMessages] = useState<WhatsAppMessage[]>([]);
  const [links, setLinks] = useState<LinkUtil[]>([]);
  const [mapao, setMapao] = useState<MapaoAcademicoEntry[]>([]);
  const [basesDisparo, setBasesDisparo] = useState<BaseDisparoEntry[]>([]);
  const [botConfig, setBotConfig] = useState<BotConfig>({ url: '', active: false });
  const [botStatuses, setBotStatuses] = useState<Record<string, { status: string, pairingCode?: string, qrCode?: string, qrUrl?: string, active?: boolean }>>({});
  const [initialActionData, setInitialActionData] = useState<Partial<CalendarioAcao> | null>(null);
  const [activePopup, setActivePopup] = useState<{ title: string; message: string } | null>(null);
  const [massSendProgress, setMassSendProgress] = useState<{ total: number, sent: number, active: boolean, info: string }>({ total: 0, sent: 0, active: false, info: '' });

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const showPopup = (title: string, message: string) => {
    setActivePopup({ title, message });
  };

  const handleSendBotMessage = async (telefone: string, message: string) => {
    if (!botConfig.url) {
      showToast('O Bot ARGO\'S não está configurado na URL principal.', 'error');
      return;
    }

    const currentBotNumber = profile?.botNumber;
    if (!currentBotNumber) {
       showToast('Você ainda não tem um número de WhatsApp configurado (Administração -> GestãoPro).', 'error');
       return;
    }
    
    const safeBotNumber = currentBotNumber.replace(/\D/g, '');
    
    // Format phone: remove non-numeric, strip leading zero if present
    let rawPhone = telefone.replace(/\D/g, '');
    if (rawPhone.startsWith('0')) rawPhone = rawPhone.substring(1);
    // Add country code if not present and has standard length
    if (rawPhone.length === 10 || rawPhone.length === 11) {
      rawPhone = `55${rawPhone}`;
    }

    try {
      const cleanUrl = botConfig.url.endsWith('/') ? botConfig.url.slice(0, -1) : botConfig.url;
      const response = await fetch(`${cleanUrl}/api/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ botNumber: safeBotNumber, number: rawPhone, message, force: true, manual: true })
      });
      
      if (response.ok) {
        showToast('Mensagem enviada com sucesso pelo Bot ARGO\'S!');
      } else {
        const errData = await response.json().catch(() => ({}));
        showToast(errData.error || 'Falha ao enviar mensagem pelo Bot.', 'error');
      }
    } catch (err: any) {
      if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
         showToast(`Erro de rede: O servidor no Railway está offline, dormindo, ou com erro de CORS.`, 'error');
      } else {
         showToast(`Erro de conexão com o Bot: ${err.message}`, 'error');
      }
    }
  };

  const handleMassSendBotMessages = async (messages: {telefone: string, message: string}[]) => {
     if(massSendProgress.active) {
       showToast("Já existe um envio em massa em andamento.", "error");
       return;
     }
     
     if (messages.length === 0) return;
     if (!window.confirm(`Deseja iniciar o envio em massa via bot para ${messages.length} contatos?`)) return;
     
     setMassSendProgress({ total: messages.length, sent: 0, active: true, info: 'Iniciando...' });
     
     let sentCount = 0;
     for (let i = 0; i < messages.length; i++) {
        if (i > 0) {
           if (sentCount % 5 === 0) {
              setMassSendProgress(prev => ({ ...prev, info: `Pausa de 2 min... (${sentCount}/${messages.length})` }));
              await new Promise(resolve => setTimeout(resolve, 120000));
           } else {
              setMassSendProgress(prev => ({ ...prev, info: `Aguardando 30s... (${sentCount}/${messages.length})` }));
              await new Promise(resolve => setTimeout(resolve, 30000));
           }
        }

        setMassSendProgress(prev => ({ ...prev, info: `Enviando... (${sentCount + 1}/${messages.length})` }));
        try {
           await handleSendBotMessage(messages[i].telefone, messages[i].message);
        } catch(e) {
           console.error("Error sending bot message in mass: ", e);
        }
        sentCount++;
     }
     
     setMassSendProgress({ total: 0, sent: 0, active: false, info: '' });
     showToast("Envio em massa concluído!", "success");
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // 1. Try to get profile by UID
          let userDoc = await getDoc(doc(db, COLLECTIONS.USERS, user.uid));
          
          if (!userDoc.exists()) {
            // 2. If not found by UID, try to find by email (for pre-registered users)
            const q = query(collection(db, COLLECTIONS.USERS), where("email", "==", user.email));
            const querySnap = await getDocs(q);
            
            if (!querySnap.empty) {
              // Found by email, use this document
              const existingDoc = querySnap.docs[0];
              const data = existingDoc.data();
              
              // If the document ID is not the UID, we should ideally migrate it
              // but for now we'll just use it. Wait, if we use it, rules might fail
              // because rules expect path/.../users/{uid}.
              // So we MUST migrate it to a document with UID as ID.
              await setDoc(doc(db, COLLECTIONS.USERS, user.uid), {
                ...data,
                uid: user.uid,
                updatedAt: serverTimestamp()
              });
              
              // Delete the old document if it had a different ID
              if (existingDoc.id !== user.uid) {
                try {
                  await deleteDoc(doc(db, COLLECTIONS.USERS, existingDoc.id));
                } catch (e) {
                  console.warn("Could not delete old user document, likely due to rules. Skipping.", e);
                }
              }
              
              userDoc = await getDoc(doc(db, COLLECTIONS.USERS, user.uid));
            } else {
              // 3. Create default profile if not exists at all
              let role = ROLES.PROMOTOR;
              const allUsers = await getDocs(query(collection(db, COLLECTIONS.USERS), limit(1)));
              if (allUsers.empty) role = ROLES.LIDER_FDV;
              
              const newProfile = {
                uid: user.uid,
                email: user.email!,
                name: user.email!.split('@')[0],
                role,
                mustChangePassword: false, // Default for self-signup
                createdAt: serverTimestamp(),
                dashboardWidgets: { stats: true, links: true, planner: true }
              };
              await setDoc(doc(db, COLLECTIONS.USERS, user.uid), newProfile);
              userDoc = await getDoc(doc(db, COLLECTIONS.USERS, user.uid));
            }
          }
          
          if (userDoc.exists()) {
            setProfile({ uid: user.uid, ...userDoc.data() } as UserProfile);
          }
          setUser(user);
        } catch (error: any) {
          console.error("Error fetching/creating profile details:", {
            code: error.code,
            message: error.message,
            stack: error.stack
          });
          showToast(`Erro ao carregar perfil: ${error.message}`, "error");
          setUser(null);
          setProfile(null);
        }
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || !profile) return;

    // Listeners
    const unsubUsers = onSnapshot(collection(db, COLLECTIONS.USERS), snap => {
      setUsers(snap.docs.map(d => ({ uid: d.id, ...d.data() } as UserProfile)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, COLLECTIONS.USERS));

    let unsubPlanner = () => {};
    if (VIEW_PERMISSIONS.dashboard.includes(profile.role)) {
      unsubPlanner = onSnapshot(collection(db, COLLECTIONS.PLANNER), snap => {
        setPlanner(snap.docs.map(d => ({ id: d.id, ...d.data() } as PlannerTask)));
      }, (err) => handleFirestoreError(err, OperationType.LIST, COLLECTIONS.PLANNER));
    }

    let unsubLinks = () => {};
    if (VIEW_PERMISSIONS.dashboard.includes(profile.role)) {
      unsubLinks = onSnapshot(collection(db, COLLECTIONS.LINKS), snap => {
        setLinks(snap.docs.map(d => ({ id: d.id, ...d.data() } as LinkUtil)));
      }, (err) => handleFirestoreError(err, OperationType.LIST, COLLECTIONS.LINKS));
    }

    let leadsQuery;
    if ([ROLES.ADMIN_MASTER, ROLES.LIDER_FDV, ROLES.SALA_MATRICULA, ROLES.QG, ROLES.GESTOR_UNIDADE].includes(profile.role)) {
      leadsQuery = query(collection(db, COLLECTIONS.LEADS));
    } else if (profile.role === ROLES.FDV) {
      leadsQuery = query(collection(db, COLLECTIONS.LEADS), or(where("promotorId", "==", user.uid), where("promotorRole", "==", ROLES.PROMOTOR)));
    } else if (profile.role === ROLES.GESTOR_COMERCIAL) {
      leadsQuery = query(collection(db, COLLECTIONS.LEADS), or(where("promotorId", "==", user.uid), where("promotorRole", "in", [ROLES.PROMOTOR, ROLES.FDV])));
    } else if (profile.role === ROLES.PROMOTOR) {
      leadsQuery = query(collection(db, COLLECTIONS.LEADS), where("promotorId", "==", user.uid));
    } else {
      leadsQuery = query(collection(db, COLLECTIONS.LEADS), where("promotorId", "==", "none"));
    }

    const unsubLeads = onSnapshot(leadsQuery, snap => {
      setLeads(snap.docs.map(d => ({ id: d.id, ...d.data() } as Lead)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, COLLECTIONS.LEADS));

    let unsubBases = () => {};
    if (VIEW_PERMISSIONS.bases.includes(profile.role)) {
      unsubBases = onSnapshot(collection(db, COLLECTIONS.BASES), snap => {
        setBases(snap.docs.map(d => ({ id: d.id, ...d.data() } as BaseEntry)));
      }, (err) => handleFirestoreError(err, OperationType.LIST, COLLECTIONS.BASES));
    }

    let unsubGap = () => {};
    if (VIEW_PERMISSIONS.gap.includes(profile.role)) {
      unsubGap = onSnapshot(collection(db, COLLECTIONS.GAP), snap => {
        setGap(snap.docs.map(d => ({ id: d.id, ...d.data() } as GapEntry)));
      }, (err) => handleFirestoreError(err, OperationType.LIST, COLLECTIONS.GAP));
    }

    let unsubFiesProuni = () => {};
    if (VIEW_PERMISSIONS.fiesProuni.includes(profile.role)) {
      unsubFiesProuni = onSnapshot(collection(db, COLLECTIONS.FIES_PROUNI), snap => {
        setFiesProuni(snap.docs.map(d => ({ id: d.id, ...d.data() } as FiesProuniEntry)));
      }, (err) => handleFirestoreError(err, OperationType.LIST, COLLECTIONS.FIES_PROUNI));
    }

    let unsubCampanhas = () => {};
    if (VIEW_PERMISSIONS.campanhas.includes(profile.role)) {
      unsubCampanhas = onSnapshot(collection(db, COLLECTIONS.CAMPANHAS), snap => {
        setCampanhas(snap.docs.map(d => ({ id: d.id, ...d.data() } as Campanha)));
      }, (err) => handleFirestoreError(err, OperationType.LIST, COLLECTIONS.CAMPANHAS));
    }

    let unsubBomDia = () => {};
    if (VIEW_PERMISSIONS.dashboard.includes(profile.role)) {
      unsubBomDia = onSnapshot(collection(db, COLLECTIONS.BOM_DIA), snap => {
        setBomDia(snap.docs.map(d => ({ id: d.id, ...d.data() } as BomDiaCaptacao)));
      }, (err) => handleFirestoreError(err, OperationType.LIST, COLLECTIONS.BOM_DIA));
    }

    let unsubForecast = () => {};
    if (VIEW_PERMISSIONS.dashboard.includes(profile.role)) {
      unsubForecast = onSnapshot(collection(db, COLLECTIONS.FORECAST), snap => {
        setForecast(snap.docs.map(d => ({ id: d.id, ...d.data() } as ForecastCaptacao)));
      }, (err) => handleFirestoreError(err, OperationType.LIST, COLLECTIONS.FORECAST));
    }

    let unsubPeriodos = () => {};
    if (VIEW_PERMISSIONS.dashboard.includes(profile.role)) {
      unsubPeriodos = onSnapshot(collection(db, COLLECTIONS.PERIODO_CAPTACAO), snap => {
        setPeriodos(snap.docs.map(d => ({ id: d.id, ...d.data() } as PeriodoCaptacao)));
      }, (err) => handleFirestoreError(err, OperationType.LIST, COLLECTIONS.PERIODO_CAPTACAO));
    }

    let calendarioQuery;
    if ([ROLES.ADMIN_MASTER, ROLES.LIDER_FDV, ROLES.SALA_MATRICULA, ROLES.GESTOR_UNIDADE, ROLES.GESTOR_COMERCIAL].includes(profile.role)) {
      calendarioQuery = query(collection(db, COLLECTIONS.CALENDARIO_ACOES));
    } else if (profile.role === ROLES.FDV) {
      calendarioQuery = query(collection(db, COLLECTIONS.CALENDARIO_ACOES), or(where("creatorId", "==", user.uid), where("creatorRole", "==", ROLES.PROMOTOR)));
    } else {
      calendarioQuery = query(collection(db, COLLECTIONS.CALENDARIO_ACOES), where("creatorId", "==", "none"));
    }

    let unsubCalendario = () => {};
    if (VIEW_PERMISSIONS.calendario.includes(profile.role)) {
      unsubCalendario = onSnapshot(calendarioQuery, snap => {
        setCalendarioAcoes(snap.docs.map(d => ({ id: d.id, ...d.data() } as CalendarioAcao)));
      }, (err) => handleFirestoreError(err, OperationType.LIST, COLLECTIONS.CALENDARIO_ACOES));
    }

    let unsubEmpresas = () => {};
    if (VIEW_PERMISSIONS.empresas.includes(profile.role)) {
      unsubEmpresas = onSnapshot(collection(db, COLLECTIONS.EMPRESAS_PARCEIRAS), snap => {
        setEmpresasParceiras(snap.docs.map(d => ({ id: d.id, ...d.data() } as EmpresaParceira)));
      }, (err) => handleFirestoreError(err, OperationType.LIST, COLLECTIONS.EMPRESAS_PARCEIRAS));
    }

    const unsubWhatsApp = onSnapshot(collection(db, COLLECTIONS.WHATSAPP_MESSAGES), snap => {
      setWhatsappMessages(snap.docs.map(d => ({ id: d.id, ...d.data() } as WhatsAppMessage)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, COLLECTIONS.WHATSAPP_MESSAGES));

    let unsubMapao = () => {};
    if (VIEW_PERMISSIONS.mapao.includes(profile.role)) {
      unsubMapao = onSnapshot(collection(db, COLLECTIONS.MAPAO_ACADEMICO), snap => {
        setMapao(snap.docs.map(d => ({ id: d.id, ...d.data() } as MapaoAcademicoEntry)));
      }, (err) => handleFirestoreError(err, OperationType.LIST, COLLECTIONS.MAPAO_ACADEMICO));
    }

    let unsubBasesDisparo = () => {};
    if (VIEW_PERMISSIONS.basesDisparo.includes(profile.role)) {
      unsubBasesDisparo = onSnapshot(collection(db, COLLECTIONS.BASES_DISPARO), snap => {
        setBasesDisparo(snap.docs.map(d => ({ id: d.id, ...d.data() } as BaseDisparoEntry)));
      }, (err) => handleFirestoreError(err, OperationType.LIST, COLLECTIONS.BASES_DISPARO));
    }

    const unsubBotConfig = onSnapshot(doc(db, COLLECTIONS.BOT_CONFIG, 'main'), snap => {
      if (snap.exists()) {
        setBotConfig({ id: snap.id, ...snap.data() } as BotConfig);
      } else {
        setBotConfig({ url: '', active: false });
      }
    });

    return () => {
      unsubUsers();
      unsubPlanner();
      unsubLinks();
      unsubLeads();
      unsubBases();
      unsubGap();
      unsubFiesProuni();
      unsubCampanhas();
      unsubBomDia();
      unsubForecast();
      unsubPeriodos();
      unsubCalendario();
      unsubEmpresas();
      unsubWhatsApp();
      unsubMapao();
      unsubBasesDisparo();
      unsubBotConfig();
    };
  }, [user, profile]);

  useEffect(() => {
    if (!botConfig.url) return;
    
    let intervalId: NodeJS.Timeout;
    
    const checkBotStatus = async () => {
      try {
        const cleanUrl = botConfig.url.endsWith('/') ? botConfig.url.slice(0, -1) : botConfig.url;
        const res = await fetch(`${cleanUrl}/api/status`);
        if (res.ok) {
          const data = await res.json();
          if (data.bots) {
             setBotStatuses(data.bots);
          }
        }
      } catch (e) {
        // optionally ignore
      }
    };
    
    checkBotStatus();
    intervalId = setInterval(checkBotStatus, 3000);
    return () => clearInterval(intervalId);
  }, [botConfig.url]);

  const knownLeadsRef = React.useRef<Set<string> | null>(null);
  const knownCampanhasRef = React.useRef<Set<string> | null>(null);

  useEffect(() => {
    if (!profile) return;
    if (profile.role !== ROLES.LIDER_FDV && profile.role !== ROLES.SALA_MATRICULA) return;

    if (knownLeadsRef.current === null) {
      knownLeadsRef.current = new Set(leads.map(l => l.id!));
      return;
    }

    let hasNew = false;
    leads.forEach(l => {
      if (!knownLeadsRef.current!.has(l.id!)) {
        knownLeadsRef.current!.add(l.id!);
        hasNew = true;
      }
    });

    if (hasNew) {
      showPopup("Novo Lead!", "Um novo lead foi adicionado no Histórico.");
    }
  }, [leads, profile]);

  useEffect(() => {
    if (!profile) return;
    if (profile.role !== ROLES.LIDER_FDV && profile.role !== ROLES.SALA_MATRICULA) return;

    if (knownCampanhasRef.current === null) {
      knownCampanhasRef.current = new Set(campanhas.map(c => c.id!));
      return;
    }

    let hasNew = false;
    campanhas.forEach(c => {
      if (!knownCampanhasRef.current!.has(c.id!)) {
        knownCampanhasRef.current!.add(c.id!);
        hasNew = true;
      }
    });

    if (hasNew) {
      showPopup("Nova Campanha!", "Uma nova campanha foi adicionada.");
    }
  }, [campanhas, profile]);

  const canView = (view: string) => {
    if (!profile) return false;
    if (profile.email === "canaldonutri@gmail.com" || profile.email === "marcos.teixeira@estacio.br" || profile.role === 'Admin Master') {
      return true;
    }
    return VIEW_PERMISSIONS[view]?.includes(profile.role);
  };

  useEffect(() => {
    if (profile && !canView(currentView)) {
      const availableViews = ['dashboard', 'cadastro', 'historico', 'bases', 'gap', 'fiesProuni', 'campanhas', 'calendario', 'empresas', 'calculo', 'mapao', 'basesDisparo', 'admin'];
      const firstAvailable = availableViews.find(v => canView(v));
      if (firstAvailable) {
        setCurrentView(firstAvailable);
      }
    }
  }, [profile, currentView]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!user) {
    return <AuthScreen onToast={showToast} />;
  }

  if (profile?.blocked) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-rose-100 text-center max-w-md">
          <XCircle size={64} className="text-rose-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900">Acesso Bloqueado</h2>
          <p className="text-slate-500 mt-2">Sua conta foi suspensa. Entre em contato com o administrador para mais informações.</p>
          <button 
            onClick={() => signOut(auth)}
            className="mt-6 w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition-all"
          >
            Sair
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <AnimatePresence>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </AnimatePresence>

      <AnimatePresence>
        {activePopup && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white p-6 md:p-8 rounded-3xl shadow-xl border border-slate-100 max-w-sm w-full text-center relative"
            >
              <button onClick={() => setActivePopup(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors">
                <X size={20} />
              </button>
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4 border-4 border-blue-50">
                <Bell size={32} className="text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">{activePopup.title}</h3>
              <p className="text-sm text-slate-600 mb-6">{activePopup.message}</p>
              <button 
                onClick={() => setActivePopup(null)}
                className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-200"
              >
                Ciente
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {massSendProgress.active && (
           <motion.div 
             initial={{ y: 100, opacity: 0 }}
             animate={{ y: 0, opacity: 1 }}
             exit={{ y: 100, opacity: 0 }}
             className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white px-6 py-4 rounded-2xl shadow-2xl border border-slate-200 z-[300] flex flex-col items-center gap-2 max-w-sm w-[90%]"
           >
             <div className="flex items-center gap-3 w-full">
               <div className="p-2 bg-blue-100 text-blue-600 rounded-full animate-pulse">
                 <Bot size={20} />
               </div>
               <div className="flex-1">
                 <h4 className="font-bold text-slate-800 text-sm">Disparo em Massa (Bot)</h4>
                 <p className="text-xs text-slate-500">{massSendProgress.info}</p>
               </div>
               <div className="font-bold text-blue-600">
                 {(massSendProgress.sent / (massSendProgress.total || 1) * 100).toFixed(0)}%
               </div>
             </div>
             <div className="w-full bg-slate-100 rounded-full h-2 mt-2 overflow-hidden">
               <div 
                 className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                 style={{ width: `${(massSendProgress.sent / (massSendProgress.total || 1)) * 100}%` }}
               />
             </div>
           </motion.div>
        )}
      </AnimatePresence>

      {profile?.mustChangePassword && (
        <PasswordChangeModal 
          onComplete={async () => {
            try {
              if (user) {
                await updateDoc(doc(db, COLLECTIONS.USERS, user.uid), {
                  mustChangePassword: false,
                  updatedAt: serverTimestamp()
                });
                setProfile(prev => prev ? { ...prev, mustChangePassword: false } : null);
                showToast("Senha atualizada com sucesso!");
              }
            } catch (err: any) {
              showToast("Erro ao atualizar status do perfil.", 'error');
            }
          }} 
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="h-full flex flex-col">
          <div className="p-6 flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
              <TrendingUp size={24} />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Leads Pro</h1>
          </div>

          <nav className="flex-1 px-4 space-y-1">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
              { id: 'cadastro', label: 'Novo Lead', icon: UserPlus },
              { id: 'historico', label: 'Histórico', icon: History },
              { id: 'bases', label: 'Bases', icon: Database },
              { id: 'gap', label: 'GAP Acadêmico', icon: GraduationCap },
              { id: 'fiesProuni', label: 'Fies/Prouni', icon: FileText },
              { id: 'mapao', label: 'Mapão Acadêmico', icon: MapPin },
              { id: 'basesDisparo', label: 'Bases de Disparo', icon: Globe },
              { id: 'campanhas', label: 'Campanhas', icon: Megaphone },
              { id: 'calendario', label: 'Calendário de Ações', icon: Calendar },
              { id: 'empresas', label: 'Empresas Parceiras', icon: Building2 },
              { id: 'calculo', label: 'Cálculo de Remuneração', icon: Calculator },
              { id: 'admin', label: 'Administração', icon: Settings },
            ].map((item) => canView(item.id) && (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentView(item.id);
                  setIsSidebarOpen(false);
                }}
                className={cn(
                  "w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all",
                  currentView === item.id 
                    ? "bg-blue-50 text-blue-600" 
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <item.icon size={20} />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="p-4 border-t border-slate-100">
            <div className="bg-slate-50 p-4 rounded-2xl mb-4">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Usuário</p>
              <p className="text-sm font-bold text-slate-900 truncate">{profile?.name}</p>
              <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 text-blue-600 text-[10px] font-bold rounded-full">
                {profile?.role}
              </span>
            </div>
            
            <div className="space-y-1">
              <button 
                onClick={async () => {
                  if (user?.email) {
                    try {
                      await sendPasswordResetEmail(auth, user.email);
                      showToast("E-mail de redefinição enviado!");
                    } catch (err: any) {
                      showToast("Erro ao enviar e-mail.", 'error');
                    }
                  }
                }}
                className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all"
              >
                <KeyRound size={20} />
                <span>Trocar Senha</span>
              </button>

              <button 
                onClick={() => signOut(auth)}
                className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold text-rose-600 hover:bg-rose-50 transition-all"
              >
                <LogOut size={20} />
                <span>Sair do Sistema</span>
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="lg:hidden p-2 text-slate-500 hover:bg-slate-50 rounded-lg"
          >
            <Menu size={24} />
          </button>
          <div className="flex-1 lg:flex-none">
            <h2 className="text-lg font-bold text-slate-900 capitalize ml-2 lg:ml-0">
              {currentView.replace('-', ' ')}
            </h2>
          </div>
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-2 text-sm text-slate-500">
              <Calendar size={16} />
              <span>{new Date().toLocaleDateString('pt-BR')}</span>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 lg:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {currentView === 'dashboard' && <DashboardView leads={leads} planner={planner} links={links} profile={profile!} onToast={showToast} campanhas={campanhas} bomDia={bomDia} forecast={forecast} periodos={periodos} />}
              {currentView === 'cadastro' && <CadastroView onToast={showToast} profile={profile!} />}
              {currentView === 'historico' && <HistoricoView leads={leads} profile={profile!} onToast={showToast} users={users} whatsappMessages={whatsappMessages} botConfig={botConfig} onSendBot={handleSendBotMessage} onMassSendBot={handleMassSendBotMessages} />}
              {currentView === 'bases' && <BasesView bases={bases} onToast={showToast} whatsappMessages={whatsappMessages} botConfig={botConfig} onSendBot={handleSendBotMessage} onMassSendBot={handleMassSendBotMessages} />}
              {currentView === 'gap' && <GapView gap={gap} onToast={showToast} whatsappMessages={whatsappMessages} botConfig={botConfig} onSendBot={handleSendBotMessage} onMassSendBot={handleMassSendBotMessages} />}
              {currentView === 'fiesProuni' && <FiesProuniView data={fiesProuni} onToast={showToast} profile={profile!} whatsappMessages={whatsappMessages} periodos={periodos} botConfig={botConfig} onSendBot={handleSendBotMessage} onMassSendBot={handleMassSendBotMessages} />}
              {currentView === 'mapao' && <MapaoAcademicoView mapao={mapao} onToast={showToast} profile={profile!} />}
              {currentView === 'basesDisparo' && <BasesDisparoView bases={basesDisparo} onToast={showToast} />}
              {currentView === 'campanhas' && <CampanhasView campanhas={campanhas} onToast={showToast} />}
              {currentView === 'calculo' && <CalculoRemuneracaoView />}
              {currentView === 'calendario' && <CalendarioAcoesView data={calendarioAcoes} onToast={showToast} profile={profile!} initialData={initialActionData} onClearInitialData={() => setInitialActionData(null)} />}
              {currentView === 'empresas' && (
                <EmpresasParceirasView 
                  data={empresasParceiras} 
                  onToast={showToast} 
                  onGenerateAction={(empresa) => {
                    setInitialActionData({
                      nome: `Ação na empresa ${empresa.nome}`,
                      local: empresa.endereco,
                      observacao: `Responsável: ${empresa.responsavel}\nTelefone: ${empresa.telefone}`
                    });
                    setCurrentView('calendario');
                  }} 
                />
              )}
              {currentView === 'admin' && <AdminView users={users} links={links} onToast={showToast} leads={leads} bases={bases} gap={gap} planner={planner} campanhas={campanhas} bomDia={bomDia} forecast={forecast} periodos={periodos} whatsappMessages={whatsappMessages} empresasParceiras={empresasParceiras} botConfig={botConfig} botStatuses={botStatuses} setBotStatuses={setBotStatuses} />}
            </motion.div>
          </AnimatePresence>

          <footer className="mt-12 py-6 border-t border-slate-200 text-center">
            <p className="text-sm text-slate-500 font-medium">
              Sistema Criado por <span className="font-bold text-slate-900">Agencia Argo's</span> - 
              <a 
                href={getWhatsAppUrl('24992777019', 'Gostaria de realizar um orçamento para um sistema')} 
                target="_blank" 
                rel="noopener noreferrer"
                className="ml-1 text-blue-600 hover:underline font-bold"
              >
                Telefone: (24) 99277-7019
              </a>
            </p>
          </footer>
        </div>
      </main>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-30 lg:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
}

// --- View Components ---

function AuthScreen({ onToast }: { onToast: (m: string, t?: 'success' | 'error') => void }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (!isLogin && password.length < 6) {
      onToast("A senha deve ter pelo menos 6 caracteres.", 'error');
      setLoading(false);
      return;
    }
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCred.user, { displayName: name });
        // Profile creation is handled in useEffect of main App
        onToast("Conta criada com sucesso!");
      }
    } catch (err: any) {
      console.error("Auth error details (AuthScreen):", {
        code: err.code,
        message: err.message,
        stack: err.stack
      });
      onToast(`Erro: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-md bg-white p-8 rounded-3xl shadow-xl border border-slate-100"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200 mx-auto mb-4">
            <TrendingUp size={32} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Gestão de Leads Pro</h2>
          <p className="text-slate-500 mt-2">{isLogin ? 'Bem-vindo de volta!' : 'Crie sua conta agora'}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Nome Completo</label>
              <input 
                type="text" 
                value={name} 
                onChange={e => setName(e.target.value)} 
                required 
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="Seu nome"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Email</label>
            <input 
              type="email" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              required 
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              placeholder="seu@email.com"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Senha</label>
            <input 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required 
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              placeholder="••••••••"
            />
          </div>

          {isLogin && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={async () => {
                  if (!email) {
                    onToast("Por favor, digite seu e-mail primeiro.", 'error');
                    return;
                  }
                  try {
                    await sendPasswordResetEmail(auth, email);
                    onToast("E-mail de redefinição enviado!");
                  } catch (err: any) {
                    onToast("Erro ao enviar e-mail.", 'error');
                  }
                }}
                className="text-xs font-bold text-blue-600 hover:text-blue-700"
              >
                Esqueci minha senha
              </button>
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-200 transition-all disabled:opacity-50"
          >
            {loading ? 'Processando...' : (isLogin ? 'Entrar no Sistema' : 'Criar Minha Conta')}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm font-semibold text-blue-600 hover:text-blue-800"
          >
            {isLogin ? 'Não tem uma conta? Cadastre-se' : 'Já tem uma conta? Faça login'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function DashboardView({ leads, planner, links, profile, onToast, campanhas, bomDia, forecast, periodos }: { 
  leads: Lead[], 
  planner: PlannerTask[], 
  links: LinkUtil[],
  profile: UserProfile,
  onToast: (m: string, t?: 'success' | 'error') => void,
  campanhas: Campanha[],
  bomDia: BomDiaCaptacao[],
  forecast: ForecastCaptacao[],
  periodos: PeriodoCaptacao[]
}) {
  const [isCustomizing, setIsCustomizing] = useState(false);
  const widgets = profile.dashboardWidgets || { stats: false, links: true, planner: true, campanhas: false, bomDia: true, forecast: true, periodo: true };

  const today = new Date().toISOString().split('T')[0];
  const activePeriod = periodos.find(p => today >= p.inicioInscricao && today <= p.fimMatFin);

  const days = ["Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado", "Domingo"];

  const toggleWidget = async (key: keyof NonNullable<UserProfile['dashboardWidgets']>) => {
    try {
      const newWidgets = { ...widgets, [key]: !widgets[key] };
      await updateDoc(doc(db, COLLECTIONS.USERS, profile.uid), {
        dashboardWidgets: newWidgets
      });
      onToast("Preferências salvas!");
    } catch (err: any) {
      onToast("Erro ao salvar preferências.", 'error');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Dashboard</h2>
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => setIsCustomizing(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all"
          >
            <Settings size={18} />
            <span>Personalizar</span>
          </button>
        </div>
      </div>

      {/* Bom Dia Captação (Complete - All cards) */}
      {widgets.bomDia && bomDia.length > 0 && (
         <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-6">
               <div className="flex items-center space-x-2 text-emerald-600">
                  <Sun size={24} />
                  <h3 className="text-xl font-bold text-slate-900">Bom Dia Captação</h3>
               </div>
               <p className="text-xs text-slate-400 font-medium">
                  Última atualização: {new Date(bomDia[bomDia.length - 1].data).toLocaleDateString()}
               </p>
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-6">
               {bomDia.map(card => (
                  <div key={card.id} className="bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden">
                     <div className="bg-emerald-600 p-4">
                        <h4 className="font-bold text-white text-sm uppercase tracking-wider">{card.titulo}</h4>
                     </div>
                     <div className="p-4">
                        <table className="w-full text-xs">
                           <thead>
                              <tr className="text-slate-400 font-bold uppercase tracking-tighter">
                                 <th className="text-left pb-2">Indicador</th>
                                 <th className="text-center pb-2">INSC</th>
                                 <th className="text-center pb-2">MAT FIN</th>
                                 <th className="text-center pb-2">MAT ACAD</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-slate-200">
                              {[
                                 { label: 'Meta Final', data: card.metaFinal, color: 'text-slate-600' },
                                 { label: 'Meta Dia', data: card.metaDia, color: 'text-slate-600' },
                                 { label: 'Ano Anterior', data: card.anoAnterior, color: 'text-slate-400' },
                                 { label: 'Real', data: card.real, color: 'text-emerald-600 font-bold' }
                              ].map((row, idx) => (
                                 <tr key={idx} className="hover:bg-white/50 transition-colors">
                                    <td className="py-2 font-semibold text-slate-500">{row.label}</td>
                                    <td className={cn("py-2 text-center", row.color)}>{row.data?.insc ?? 0}</td>
                                    <td className={cn("py-2 text-center", row.color)}>{row.data?.matFin ?? 0}</td>
                                    <td className={cn("py-2 text-center", row.color)}>{row.data?.matAcad ?? 0}</td>
                                 </tr>
                              ))}
                              {/* Calculated Rows */}
                              {[
                                 { 
                                    label: '% Meta Dia', 
                                    calc: (m: keyof BomDiaMetrics) => (card.metaDia && card.metaDia[m] > 0 && card.real) ? `${((card.real[m] / card.metaDia[m]) * 100).toFixed(0)}%` : '0%',
                                    color: 'text-blue-600 font-bold'
                                 },
                                 { 
                                    label: '% Ano Ant.', 
                                    calc: (m: keyof BomDiaMetrics) => (card.anoAnterior && card.anoAnterior[m] > 0 && card.real) ? `${((card.real[m] / card.anoAnterior[m]) * 100).toFixed(0)}%` : '0%',
                                    color: 'text-slate-500 font-bold'
                                 },
                                 { 
                                    label: 'Gap Meta Dia', 
                                    calc: (m: keyof BomDiaMetrics) => (card.real && card.metaDia) ? card.real[m] - card.metaDia[m] : 0,
                                    color: (m: keyof BomDiaMetrics) => (card.real && card.metaDia && (card.real[m] - card.metaDia[m]) >= 0) ? 'text-emerald-600' : 'text-rose-600'
                                 },
                                 { 
                                    label: 'Gap Ano Ant.', 
                                    calc: (m: keyof BomDiaMetrics) => (card.real && card.anoAnterior) ? card.real[m] - card.anoAnterior[m] : 0,
                                    color: (m: keyof BomDiaMetrics) => (card.real && card.anoAnterior && (card.real[m] - card.anoAnterior[m]) >= 0) ? 'text-emerald-600' : 'text-rose-600'
                                 },
                                 { 
                                    label: 'Gap Meta Final', 
                                    calc: (m: keyof BomDiaMetrics) => (card.real && card.metaFinal) ? card.real[m] - card.metaFinal[m] : 0,
                                    color: (m: keyof BomDiaMetrics) => (card.real && card.metaFinal && (card.real[m] - card.metaFinal[m]) >= 0) ? 'text-emerald-600' : 'text-rose-600'
                                 }
                              ].map((row, idx) => (
                                 <tr key={`calc-${idx}`} className="bg-slate-100/50">
                                    <td className="py-1.5 font-bold text-[9px] text-slate-400 uppercase">{row.label}</td>
                                    <td className={cn("py-1.5 text-center text-[10px] font-bold", typeof row.color === 'function' ? row.color('insc') : row.color)}>{row.calc('insc')}</td>
                                    <td className={cn("py-1.5 text-center text-[10px] font-bold", typeof row.color === 'function' ? row.color('matFin') : row.color)}>{row.calc('matFin')}</td>
                                    <td className={cn("py-1.5 text-center text-[10px] font-bold", typeof row.color === 'function' ? row.color('matAcad') : row.color)}>{row.calc('matAcad')}</td>
                                 </tr>
                              ))}
                           </tbody>
                        </table>
                     </div>
                  </div>
               ))}
            </div>
         </section>
      )}

      {/* Forecasts (Complete - All cards) */}
      {widgets.forecast && forecast.length > 0 && (
         <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-6">
               <h3 className="text-xl font-bold text-slate-900">Forecasts de Captação</h3>
               <TrendingUp size={24} className="text-blue-600" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
               {forecast.map(f => {
                  const percFech = f.metaFechamento > 0 ? ((f.realizado / f.metaFechamento) * 100).toFixed(1) : '0';
                  const gapFech = f.realizado - f.metaFechamento;
                  const dataFim = new Date(f.dataFim);
                  const hoje = new Date();
                  const diffTime = dataFim.getTime() - hoje.getTime();
                  const diasRestantes = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
                  const pacing = (Math.abs(gapFech) / diasRestantes).toFixed(1);

                  return (
                     <div key={f.id} className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                        <div className="flex justify-between items-start mb-4">
                           <div>
                              <h4 className="font-bold text-slate-900">{f.nome}</h4>
                              <p className="text-[10px] text-slate-500 font-medium">Até {new Date(f.dataFim).toLocaleDateString('pt-BR')}</p>
                           </div>
                           <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${Number(percFech) >= 100 ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
                              {percFech}%
                           </span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 mb-4">
                           <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase">Realizado</p>
                              <p className="text-lg font-bold text-emerald-600">{f.realizado || 0}</p>
                           </div>
                           <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase">Meta</p>
                              <p className="text-lg font-bold text-slate-700">{f.metaFechamento || 0}</p>
                           </div>
                        </div>

                        <div className="space-y-3 pt-4 border-t border-slate-200/60">
                           <div className="flex justify-between items-center">
                              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1 border-l-2 border-slate-400">Meta Dia YTD</span>
                              <span className="text-xs font-bold text-slate-700">{f.metaDiaYTD || 0}</span>
                           </div>
                           <div className="flex justify-between items-center">
                              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1 border-l-2 border-rose-400">Gap Fechamento</span>
                              <span className={`text-xs font-bold ${gapFech >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                 {gapFech >= 0 ? '+' : ''}{gapFech}
                              </span>
                           </div>
                           <div className="flex justify-between items-center">
                              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1 border-l-2 border-blue-400">Pacing (por dia)</span>
                              <span className="text-xs font-bold text-blue-600">{pacing}</span>
                           </div>
                           <div className="flex justify-between items-center bg-slate-200/50 p-2 rounded-lg mt-2">
                              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Dias Restantes</span>
                              <span className="text-xs font-bold text-slate-800">{diasRestantes}</span>
                           </div>
                        </div>
                     </div>
                  );
               })}
            </div>
         </section>
      )}

      {widgets.periodo && periodos.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-slate-900">Períodos da Captação</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {periodos.map(p => {
              const isActive = today >= p.inicioInscricao && today <= p.fimMatFin;
              return (
                <div key={p.id} className={cn(
                  "bg-white p-5 rounded-3xl shadow-sm border transition-all",
                  isActive ? "border-blue-500 ring-4 ring-blue-50" : "border-slate-100"
                )}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className={cn(
                        "p-2 rounded-xl",
                        isActive ? "bg-blue-600 text-white" : "bg-blue-100 text-blue-600"
                      )}>
                        <Calendar size={20} />
                      </div>
                      <h4 className="font-bold text-slate-900">{p.nome}</h4>
                    </div>
                    {isActive && (
                      <span className="px-2 py-1 bg-emerald-100 text-emerald-600 text-[10px] font-bold rounded-full uppercase">Ativo</span>
                    )}
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-slate-50 rounded-2xl">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Inscrição</p>
                        <p className="text-xs font-bold text-slate-700">
                          {new Date(p.inicioInscricao).toLocaleDateString('pt-BR')} - {new Date(p.fimInscricao).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <span className="text-xs font-bold text-blue-600">{getWorkingDaysBetween(p.inicioInscricao, p.fimInscricao)} dias</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-slate-50 rounded-2xl">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Mat Fin</p>
                        <p className="text-xs font-bold text-slate-700">
                          {new Date(p.inicioMatFin).toLocaleDateString('pt-BR')} - {new Date(p.fimMatFin).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-blue-600 block">{getWorkingDaysBetween(p.inicioMatFin, p.fimMatFin)} dias úteis</span>
                        <span className="text-[10px] font-bold text-slate-500 block">{getWorkingDaysRemaining(p.fimMatFin)} dias restantes</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-slate-50 rounded-2xl">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Mat Acad</p>
                        <p className="text-xs font-bold text-slate-700">
                          {new Date(p.inicioMatAcad).toLocaleDateString('pt-BR')} - {new Date(p.fimMatAcad).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <span className="text-xs font-bold text-blue-600">{getWorkingDaysBetween(p.inicioMatAcad, p.fimMatAcad)} dias</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {widgets.links && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-slate-900">Links Úteis</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {links.map(link => (
              <a 
                key={link.id} 
                href={link.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center space-x-3 hover:border-blue-200 hover:bg-blue-50/30 transition-all group"
              >
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-all">
                  <ExternalLink size={18} />
                </div>
                <span className="font-bold text-slate-700 truncate">{link.nome}</span>
              </a>
            ))}
            {links.length === 0 && <p className="text-slate-400 text-sm italic">Nenhum link cadastrado.</p>}
          </div>
        </section>
      )}

      {widgets.planner && (
        <section>
          <h3 className="text-xl font-bold text-slate-900 mb-4">Planner da Semana</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
            {days.map(day => {
              const tasks = planner.filter(t => t.dayOfWeek === day);
              return (
                <div key={day} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
                  <div className="bg-slate-50 px-4 py-2 border-b border-slate-100">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{day.split('-')[0]}</span>
                  </div>
                  <div className="p-4 flex-1 space-y-2">
                    {tasks.length > 0 ? tasks.map(task => (
                      <div key={task.id} className="p-2 bg-blue-50 border-l-4 border-blue-600 rounded-r-lg">
                        <p className="text-xs font-bold text-blue-900">{task.atendenteName}</p>
                        <p className="text-[10px] text-blue-600 font-medium">{task.baseName}</p>
                      </div>
                    )) : (
                      <div className="h-full flex items-center justify-center">
                        <p className="text-xs text-slate-300 italic">Folga</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Customization Modal */}
      <AnimatePresence>
        {isCustomizing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-xl font-bold text-slate-900">Personalizar Dashboard</h3>
                <button onClick={() => setIsCustomizing(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={24} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-sm text-slate-500 mb-4">Escolha quais blocos você deseja visualizar na sua tela principal.</p>
                
                {[
                  { id: 'periodo', label: 'Períodos da Captação', icon: Calendar },
                  { id: 'bomDia', label: 'Bom Dia Captação', icon: Sun },
                  { id: 'forecast', label: 'Forecasts', icon: TrendingUp },
                  { id: 'links', label: 'Links Úteis', icon: ExternalLink },
                  { id: 'planner', label: 'Planner da Semana', icon: Calendar },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => toggleWidget(item.id as any)}
                    className={cn(
                      "w-full flex items-center justify-between p-4 rounded-xl border transition-all",
                      widgets[item.id as keyof typeof widgets]
                        ? "bg-blue-50 border-blue-200 text-blue-900"
                        : "bg-white border-slate-100 text-slate-500"
                    )}
                  >
                    <div className="flex items-center space-x-3">
                      <item.icon size={20} />
                      <span className="font-bold">{item.label}</span>
                    </div>
                    <div className={cn(
                      "w-10 h-6 rounded-full relative transition-all",
                      widgets[item.id as keyof typeof widgets] ? "bg-blue-600" : "bg-slate-200"
                    )}>
                      <div className={cn(
                        "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                        widgets[item.id as keyof typeof widgets] ? "left-5" : "left-1"
                      )} />
                    </div>
                  </button>
                ))}
              </div>
              <div className="p-6 bg-slate-50 border-t border-slate-100">
                <button 
                  onClick={() => setIsCustomizing(false)}
                  className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 transition-all"
                >
                  Concluído
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CadastroView({ onToast, profile }: { onToast: (m: string, t?: 'success' | 'error') => void, profile: UserProfile }) {
  const [formData, setFormData] = useState({
    acao: '',
    nome: '',
    telefone: '',
    cpf: '',
    cursoInteresse: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addDoc(collection(db, COLLECTIONS.LEADS), {
        ...formData,
        converted: false,
        createdAt: serverTimestamp(),
        promotorId: profile.uid,
        promotorName: profile.name,
        promotorRole: profile.role
      });
      onToast("Lead cadastrado com sucesso!");
      setFormData({ acao: '', nome: '', telefone: '', cpf: '', cursoInteresse: '' });
    } catch (err: any) {
      onToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
        <h3 className="text-2xl font-bold text-slate-900 mb-6">Cadastrar Novo Lead</h3>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-1">Ação / Origem</label>
              <input 
                type="text" 
                required
                value={formData.acao}
                onChange={e => setFormData({...formData, acao: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="Ex: Evento Junino, Facebook, etc."
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-1">Nome do Candidato</label>
              <input 
                type="text" 
                required
                value={formData.nome}
                onChange={e => setFormData({...formData, nome: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="Nome completo"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Telefone (WhatsApp)</label>
              <input 
                type="tel" 
                required
                value={formData.telefone}
                onChange={e => setFormData({...formData, telefone: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="DDD + Número"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">CPF (Opcional)</label>
              <input 
                type="text" 
                value={formData.cpf}
                onChange={e => setFormData({...formData, cpf: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="000.000.000-00"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-1">Curso de Interesse</label>
              <input 
                type="text" 
                value={formData.cursoInteresse}
                onChange={e => setFormData({...formData, cursoInteresse: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="Ex: Administração, Direito..."
              />
            </div>
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-200 transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            <Plus size={20} />
            <span>{loading ? 'Salvando...' : 'Salvar Lead'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}

function HistoricoView({ 
  leads, 
  profile, 
  onToast, 
  users, 
  whatsappMessages,
  botConfig,
  onSendBot,
  onMassSendBot
}: { 
  leads: Lead[]; 
  profile: UserProfile; 
  onToast: (m: string, t?: 'success' | 'error') => void; 
  users: UserProfile[]; 
  whatsappMessages: WhatsAppMessage[];
  botConfig: BotConfig;
  onSendBot: (tel: string, msg: string) => void;
  onMassSendBot: (messages: {telefone: string, message: string}[]) => void;
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [selectedEntries, setSelectedEntries] = useState<string[]>([]);
  const [massSelectorOpen, setMassSelectorOpen] = useState(false);
  
  const filteredLeads = useMemo(() => {
    return leads
      .filter(l => 
        l.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
        l.telefone.includes(searchTerm) ||
        l.acao.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  }, [leads, searchTerm]);

  const stats = useMemo(() => {
    const total = filteredLeads.length;
    const conv = filteredLeads.filter(l => l.converted).length;
    const userLeads = filteredLeads.filter(l => l.promotorId === profile.uid).length;
    return { total, conv, userLeads, rate: total > 0 ? ((conv/total)*100).toFixed(1) : '0' };
  }, [filteredLeads, profile]);

  const toggleSelect = (id: string, checked: boolean) => {
    if (checked) {
        setSelectedEntries(prev => [...prev, id]);
    } else {
        setSelectedEntries(prev => prev.filter(s => s !== id));
    }
  };

  const toggleSelectAll = (checked: boolean) => {
      if (checked) {
          setSelectedEntries(filteredLeads.map(l => l.id));
      } else {
          setSelectedEntries([]);
      }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, COLLECTIONS.LEADS, id), { status: newStatus });
      onToast("Status atualizado!");
    } catch (err: any) {
      handleFirestoreError(err, OperationType.UPDATE, `${COLLECTIONS.LEADS}/${id}`);
      onToast("Erro ao atualizar status.", 'error');
    }
  };

  const handleMoveToGap = async (lead: Lead) => {
    try {
      await addDoc(collection(db, COLLECTIONS.GAP), {
        nome: lead.nome,
        telefone: lead.telefone,
        matAcad: false,
        documentos: {},
        leadId: lead.id,
        createdAt: serverTimestamp()
      });
      onToast("Candidato movido para o GAP!");
    } catch (err: any) {
      handleFirestoreError(err, OperationType.CREATE, COLLECTIONS.GAP);
      onToast("Erro ao mover para o GAP.", 'error');
    }
  };

  const handleExport = () => {
    const data = filteredLeads.map(l => ({
      Nome: l.nome,
      Telefone: l.telefone,
      CPF: l.cpf || '',
      Curso: l.cursoInteresse || '',
      Acao: l.acao,
      Promotor: l.promotorName,
      Status: l.converted ? 'Convertido' : 'Pendente',
      Data: l.createdAt?.seconds ? new Date(l.createdAt.seconds * 1000).toLocaleDateString() : ''
    }));
    exportToExcel(data, 'Historico_Leads');
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    importFromExcel(file, async (data) => {
      try {
        const batch = data.map(item => ({
          nome: item.Nome || item.nome || '',
          telefone: String(item.Telefone || item.telefone || ''),
          cpf: String(item.CPF || item.cpf || '').replace(/\D/g, ''),
          cursoInteresse: item.Curso || item.cursoInteresse || '',
          acao: item.Acao || item.acao || 'Importação',
          promotorId: 'import',
          promotorName: item.Promotor || item.promotorName || 'Sistema',
          converted: item.Status === 'Convertido' || item.converted === true,
          createdAt: serverTimestamp()
        }));

        for (const entry of batch) {
          await addDoc(collection(db, COLLECTIONS.LEADS), entry);
        }
        onToast(`${batch.length} leads importados!`);
      } catch (err: any) {
        onToast("Erro ao importar leads.", 'error');
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Histórico de Leads</h2>
        <div className="flex space-x-2">
          <label className="bg-blue-50 text-blue-600 px-4 py-2 rounded-xl flex items-center space-x-2 hover:bg-blue-100 transition-all text-sm font-bold cursor-pointer">
            <Upload size={18} />
            <span>Importar</span>
            <input type="file" accept=".xlsx, .xls" onChange={handleImport} className="hidden" />
          </label>
          <button 
            onClick={handleExport}
            className="bg-slate-100 text-slate-600 px-4 py-2 rounded-xl flex items-center space-x-2 hover:bg-slate-200 transition-all text-sm font-bold"
          >
            <Download size={18} />
            <span>Exportar</span>
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Filtrados" value={stats.total} icon={Users} color="bg-blue-500" />
        <StatCard title="Convertidos" value={stats.conv} icon={CheckCircle2} color="bg-emerald-500" />
        <StatCard title="Taxa" value={`${stats.rate}%`} icon={TrendingUp} color="bg-purple-500" />
        <StatCard title="Meus Leads" value={stats.userLeads} icon={UserPlus} color="bg-amber-500" />
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h3 className="text-xl font-bold text-slate-900">Lista de Leads</h3>
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar por nome, telefone ou ação..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                <th className="px-6 py-4 w-12">
                  <input type="checkbox" checked={selectedEntries.length === filteredLeads.length && filteredLeads.length > 0} onChange={e => toggleSelectAll(e.target.checked)} />
                </th>
                <th className="px-6 py-4">Candidato</th>
                <th className="px-6 py-4">Ação / Origem</th>
                <th className="px-6 py-4">Promotor</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">
                  {selectedEntries.length > 0 && botConfig.url && (
                      <button 
                         onClick={() => setMassSelectorOpen(true)} 
                         className="text-blue-600 font-bold hover:underline py-1 px-2 bg-blue-50 rounded-lg flex items-center gap-1"
                      >
                         <Bot size={14} /> Em Massa
                      </button>
                  )}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLeads.map(lead => (
                <tr key={lead.id} className="hover:bg-slate-50/50 transition-all">
                  <td className="px-6 py-4">
                      <input type="checkbox" checked={selectedEntries.includes(lead.id)} onChange={e => toggleSelect(lead.id, e.target.checked)} />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-900">{lead.nome}</span>
                      <span className="text-xs text-slate-500">{formatPhone(lead.telefone)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{lead.acao}</td>
                  <td className="px-6 py-4 text-sm text-slate-600 font-medium">{lead.promotorName}</td>
                  <td className="px-6 py-4">
                    <select 
                      value={lead.status || 'Pendente'}
                      onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                      className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-bold uppercase transition-all border-none focus:ring-0",
                        lead.status === 'Convertido' ? "bg-emerald-100 text-emerald-600" :
                        lead.status === 'Interessado' ? "bg-blue-100 text-blue-600" :
                        lead.status === 'Não Interessado' ? "bg-rose-100 text-rose-600" :
                        lead.status === 'Sem retorno' ? "bg-slate-100 text-slate-600" :
                        "bg-amber-100 text-amber-600"
                      )}
                    >
                      <option value="Pendente">Pendente</option>
                      <option value="Sem retorno">Sem retorno</option>
                      <option value="Interessado">Interessado</option>
                      <option value="Não Interessado">Não Interessado</option>
                      <option value="Convertido">Convertido</option>
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <button 
                        onClick={() => {
                          setSelectedLead(lead);
                          setSelectorOpen(true);
                        }}
                        className="inline-flex items-center space-x-1 text-emerald-600 hover:text-emerald-700 font-bold text-sm"
                      >
                        <MessageSquare size={14} />
                        <span>WhatsApp</span>
                      </button>
                      {lead.status === 'Convertido' && (
                        <button 
                          onClick={() => handleMoveToGap(lead)}
                          className="text-purple-600 hover:text-purple-700 font-bold text-sm flex items-center space-x-1"
                          title="Mover para GAP Acadêmico"
                        >
                          <GraduationCap size={14} />
                          <span>GAP</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredLeads.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">Nenhum lead encontrado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <WhatsAppMessageSelector 
        isOpen={selectorOpen}
        onClose={() => setSelectorOpen(false)}
        leadName={selectedLead?.nome || ''}
        messages={whatsappMessages.filter(m => m.tipo === 'historico')}
        onSelect={(msg) => {
          if (selectedLead) {
            window.open(getWhatsAppUrl(selectedLead.telefone, msg), '_blank');
          }
        }}
        botConfig={botConfig}
        onSendBot={(msg) => {
          if (selectedLead) {
            onSendBot(selectedLead.telefone, msg);
          }
        }}
      />
      
      <WhatsAppMessageSelector 
        isOpen={massSelectorOpen}
        onClose={() => setMassSelectorOpen(false)}
        leadName="Candidatos"
        messages={whatsappMessages.filter(m => m.tipo === 'historico')}
        onSelect={(msg) => {
          // not used for mass send
        }}
        botConfig={botConfig}
        onSendBot={(msgTemplate) => {
          const selectedLeadObjs = leads.filter(l => selectedEntries.includes(l.id));
          const messagesPayload = selectedLeadObjs.map(l => ({
            telefone: l.telefone,
            message: msgTemplate.replace('[nome]', l.nome)
          }));
          onMassSendBot(messagesPayload);
          setMassSelectorOpen(false);
          setSelectedEntries([]);
        }}
        forceBotOnly={true}
      />
    </div>
  );
}

function BasesView({ 
  bases, 
  onToast, 
  whatsappMessages,
  botConfig,
  onSendBot,
  onMassSendBot
}: { 
  bases: BaseEntry[]; 
  onToast: (m: string, t?: 'success' | 'error') => void; 
  whatsappMessages: WhatsAppMessage[];
  botConfig: BotConfig;
  onSendBot: (tel: string, msg: string) => void;
  onMassSendBot: (messages: {telefone: string, message: string}[]) => void;
}) {
  const [formData, setFormData] = useState({
    nomeBase: '',
    nome: '',
    telefone: '',
    cpf: '',
    curso: '',
    produto: 'Graduação' as 'Graduação' | 'Técnico' | 'Pós-graduação',
    numeroOportunidade: '',
    semestre: '',
    metodologia: '',
    formaIngresso: '',
    numeroMatricula: ''
  });
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [baseFilter, setBaseFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [produtoFilter, setProdutoFilter] = useState('');
  const [cursoFilter, setCursoFilter] = useState('');
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<BaseEntry | null>(null);
  const [massSelectorOpen, setMassSelectorOpen] = useState(false);

  const filteredBases = bases.filter(b => {
    const matchesSearch = b.nome.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBase = !baseFilter || b.nomeBase === baseFilter;
    const matchesStatus = !statusFilter || b.status === statusFilter;
    const matchesProduto = !produtoFilter || b.produto === produtoFilter;
    const matchesCurso = !cursoFilter || b.curso.toLowerCase().includes(cursoFilter.toLowerCase());
    return matchesSearch && matchesBase && matchesStatus && matchesProduto && matchesCurso;
  });

  const uniqueBases = Array.from(new Set(bases.map(b => b.nomeBase))).sort();
  const uniqueProdutos = ['Graduação', 'Técnico', 'Pós-graduação'];
  const uniqueCursos = Array.from(new Set(bases.map(b => b.curso))).sort();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addDoc(collection(db, COLLECTIONS.BASES), {
        ...formData,
        status: 'Pendente',
        createdAt: serverTimestamp()
      });
      onToast("Registro salvo na base!");
      setFormData({ 
        nomeBase: '', 
        nome: '', 
        telefone: '', 
        cpf: '', 
        curso: '',
        produto: 'Graduação',
        numeroOportunidade: '',
        semestre: '',
        metodologia: '',
        formaIngresso: ''
      });
    } catch (err: any) {
      onToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const [selectedEntries, setSelectedEntries] = useState<string[]>([]);
  
  const handleBulkDelete = async () => {
    if (selectedEntries.length === 0) return;
    if (window.confirm(`Deseja excluir ${selectedEntries.length} registros selecionados?`)) {
        try {
            for (const id of selectedEntries) {
                await deleteDoc(doc(db, COLLECTIONS.BASES, id));
            }
            onToast(`${selectedEntries.length} registros removidos.`);
            setSelectedEntries([]);
        } catch (err: any) {
            onToast("Erro ao excluir registros.", 'error');
        }
    }
  };

  const toggleSelect = (id: string, checked: boolean) => {
    if (checked) {
        setSelectedEntries([...selectedEntries, id]);
    } else {
        setSelectedEntries(selectedEntries.filter(s => s !== id));
    }
  };

  const toggleSelectAll = (checked: boolean) => {
      if (checked) {
          setSelectedEntries(filteredBases.map(b => b.id));
      } else {
          setSelectedEntries([]);
      }
  };

  const handleStatusChange = async (entry: BaseEntry, status: string) => {
    try {
      await updateDoc(doc(db, COLLECTIONS.BASES, entry.id), { status });
      
      if (status === 'Convertido') {
         // Logic for transferring to GAP
         const q = query(collection(db, COLLECTIONS.GAP), where("cpf", "==", entry.cpf || ''));
         const snap = await getDocs(q);
         if (snap.empty && entry.cpf) {
             await addDoc(collection(db, COLLECTIONS.GAP), {
                nome: entry.nome,
                telefone: entry.telefone,
                cpf: entry.cpf,
                produto: entry.produto,
                numeroOportunidade: entry.numeroOportunidade,
                curso: entry.curso,
                metodologia: entry.metodologia,
                formaIngresso: entry.formaIngresso,
                semestre: entry.semestre,
                matAcad: false,
                documentos: {},
                createdAt: serverTimestamp()
             });
             onToast("Candidato convertido e enviado para GAP!");
         } else {
             onToast("Status atualizado!");
         }
      } else {
        onToast("Status da base atualizado!");
      }
    } catch (err: any) {
      onToast(err.message, 'error');
    }
  };

  const handleDeleteBase = async (id: string) => {
    if (window.confirm('Deseja excluir este registro da base?')) {
      try {
        await deleteDoc(doc(db, COLLECTIONS.BASES, id));
        onToast("Registro removido.");
      } catch (err: any) {
        onToast("Erro ao excluir registro.", 'error');
      }
    }
  };

  const handleExport = () => {
    const data = bases.map(b => ({
      Nome: b.nome,
      Telefone: b.telefone,
      CPF: b.cpf || '',
      Curso: b.curso,
      Base: b.nomeBase,
      Status: b.status
    }));
    exportToExcel(data, 'Bases_Trabalho');
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    importFromExcel(file, async (data) => {
      try {
        const batch = data.map(item => ({
          nome: item.Nome || item.nome || '',
          telefone: String(item.Telefone || item.telefone || ''),
          cpf: String(item.CPF || item.cpf || '').replace(/\D/g, ''),
          curso: item.Curso || item.curso || '',
          nomeBase: item.Base || item.nomeBase || 'Importado',
          status: item.Status || item.status || 'Pendente',
          createdAt: serverTimestamp()
        }));

        for (const entry of batch) {
          await addDoc(collection(db, COLLECTIONS.BASES), entry);
        }
        onToast(`${batch.length} registros importados com sucesso!`);
      } catch (err: any) {
        onToast("Erro ao importar dados.", 'error');
      }
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center max-w-xl mx-auto">
        <h3 className="text-xl font-bold text-slate-900">Bases</h3>
        <div className="flex space-x-2">
          <label className="bg-blue-50 text-blue-600 px-4 py-2 rounded-xl flex items-center space-x-2 hover:bg-blue-100 transition-all text-sm font-bold cursor-pointer">
            <Upload size={18} />
            <span>Importar</span>
            <input type="file" accept=".xlsx, .xls" onChange={handleImport} className="hidden" />
          </label>
          <button 
            onClick={handleExport}
            className="bg-slate-100 text-slate-600 px-4 py-2 rounded-xl flex items-center space-x-2 hover:bg-slate-200 transition-all text-sm font-bold"
          >
            <Download size={18} />
            <span>Exportar</span>
          </button>
        </div>
      </div>
      <div className="max-w-xl mx-auto">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <h3 className="text-xl font-bold text-slate-900 mb-4">Novo Registro em Base</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input 
              placeholder="Nome da Base (Ex: Junho 2024)" 
              required 
              value={formData.nomeBase}
              onChange={e => setFormData({...formData, nomeBase: e.target.value})}
              className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <div className="grid grid-cols-2 gap-4">
              <input 
                placeholder="Nome" 
                required 
                value={formData.nome}
                onChange={e => setFormData({...formData, nome: e.target.value})}
                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <input 
                placeholder="Telefone" 
                required 
                value={formData.telefone}
                onChange={e => setFormData({...formData, telefone: e.target.value})}
                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <input 
                placeholder="CPF" 
                value={formData.cpf}
                onChange={e => setFormData({...formData, cpf: e.target.value})}
                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <input 
                placeholder="N° Oportunidade" 
                required 
                value={formData.numeroOportunidade}
                onChange={e => setFormData({...formData, numeroOportunidade: e.target.value})}
                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <input 
                placeholder="Semestre" 
                required 
                value={formData.semestre}
                onChange={e => setFormData({...formData, semestre: e.target.value})}
                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <select 
                value={formData.produto}
                onChange={e => setFormData({...formData, produto: e.target.value as any})}
                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
              >
                {uniqueProdutos.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <input 
                placeholder="Metodologia" 
                required 
                value={formData.metodologia}
                onChange={e => setFormData({...formData, metodologia: e.target.value})}
                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <input 
                placeholder="Forma de Ingresso" 
                required 
                value={formData.formaIngresso}
                onChange={e => setFormData({...formData, formaIngresso: e.target.value})}
                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <input 
              placeholder="Curso" 
              required 
              value={formData.curso}
              onChange={e => setFormData({...formData, curso: e.target.value})}
              className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50"
            >
              {loading ? 'Salvando...' : 'Adicionar à Base'}
            </button>
          </form>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h3 className="text-xl font-bold text-slate-900">Bases a Trabalhar</h3>
          <div className="flex flex-wrap gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Buscar por nome..."
                className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 w-48"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <select 
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500"
              value={baseFilter}
              onChange={e => setBaseFilter(e.target.value)}
            >
              <option value="">Todas as Bases</option>
              {uniqueBases.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
            <select 
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500"
              value={produtoFilter}
              onChange={e => setProdutoFilter(e.target.value)}
            >
              <option value="">Todos os Produtos</option>
              {uniqueProdutos.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <select 
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500"
              value={cursoFilter}
              onChange={e => setCursoFilter(e.target.value)}
            >
              <option value="">Todos os Cursos</option>
              {uniqueCursos.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select 
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="">Todos Status</option>
              <option value="Pendente">Pendente</option>
              <option value="Interessado">Interessado</option>
              <option value="Convertido">Convertido</option>
              <option value="Não tem interesse">Não tem interesse</option>
              <option value="Sem retorno">Sem retorno</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                <th className="px-6 py-4 w-12 text-center">
                  #
                </th>
                <th className="px-6 py-4 w-12">
                  <input type="checkbox" checked={selectedEntries.length === filteredBases.length && filteredBases.length > 0} onChange={e => toggleSelectAll(e.target.checked)} />
                </th>
                <th className="px-6 py-4">Nome</th>
                <th className="px-6 py-4">Base</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 flex items-center gap-4">
                  {selectedEntries.length > 0 && (
                      <button onClick={handleBulkDelete} className="text-rose-600 font-bold hover:underline">excluir selecionados</button>
                  )}
                  {selectedEntries.length > 0 && botConfig.url && (
                      <button 
                         onClick={() => setMassSelectorOpen(true)} 
                         className="text-blue-600 font-bold hover:underline py-1 px-2 bg-blue-50 rounded-lg flex items-center gap-1"
                      >
                         <Bot size={14} /> Em Massa
                      </button>
                  )}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBases.map((entry, index) => (
                <tr key={entry.id} className="hover:bg-slate-50/50 transition-all">
                  <td className="px-6 py-4 text-center font-bold text-slate-400 text-xs">
                    {index + 1}
                  </td>
                  <td className="px-6 py-4">
                    <input type="checkbox" checked={selectedEntries.includes(entry.id)} onChange={e => toggleSelect(entry.id, e.target.checked)} />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-900">{entry.nome}</span>
                      <span className="text-xs text-slate-500">{entry.curso}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{entry.nomeBase}</td>
                  <td className="px-6 py-4">
                    <select 
                      value={entry.status}
                      onChange={e => handleStatusChange(entry, e.target.value)}
                      className={cn(
                        "px-2 py-1 rounded-lg text-xs font-bold outline-none border-none",
                        entry.status === 'Pendente' && "bg-slate-100 text-slate-600",
                        entry.status === 'Interessado' && "bg-blue-100 text-blue-600",
                        entry.status === 'Convertido' && "bg-emerald-100 text-emerald-600",
                        entry.status === 'Não tem interesse' && "bg-rose-100 text-rose-600",
                        entry.status === 'Sem retorno' && "bg-orange-100 text-orange-600"
                      )}
                    >
                      <option value="Pendente">Pendente</option>
                      <option value="Interessado">Interessado</option>
                      <option value="Convertido">Convertido</option>
                      <option value="Não tem interesse">Não tem interesse</option>
                      <option value="Sem retorno">Sem retorno</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 flex items-center space-x-2">
                    <button 
                      onClick={() => {
                        setSelectedEntry(entry);
                        setSelectorOpen(true);
                      }}
                      className="text-emerald-600 hover:text-emerald-700 font-bold text-sm flex items-center space-x-1"
                    >
                      <MessageSquare size={14} />
                      <span>WhatsApp</span>
                    </button>
                    <button 
                      onClick={() => handleDeleteBase(entry.id)}
                      className="text-rose-400 hover:text-rose-600 p-2 hover:bg-rose-50 rounded-lg transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredBases.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">Nenhum registro encontrado com os filtros aplicados.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <WhatsAppMessageSelector 
        isOpen={selectorOpen}
        onClose={() => setSelectorOpen(false)}
        leadName={selectedEntry?.nome || ''}
        messages={whatsappMessages.filter(m => m.tipo === 'bases')}
        onSelect={(msg) => {
          if (selectedEntry) {
            window.open(getWhatsAppUrl(selectedEntry.telefone, msg), '_blank');
          }
        }}
        botConfig={botConfig}
        onSendBot={(msg) => {
          if (selectedEntry) {
            onSendBot(selectedEntry.telefone, msg);
          }
        }}
      />
      
      <WhatsAppMessageSelector 
        isOpen={massSelectorOpen}
        onClose={() => setMassSelectorOpen(false)}
        leadName="Candidatos"
        messages={whatsappMessages.filter(m => m.tipo === 'bases')}
        onSelect={(msg) => {}}
        botConfig={botConfig}
        onSendBot={(msgTemplate) => {
          const selectedLeadObjs = bases.filter(b => selectedEntries.includes(b.id));
          const messagesPayload = selectedLeadObjs.map(l => ({
            telefone: l.telefone,
            message: msgTemplate.replace('[nome]', l.nome)
          }));
          onMassSendBot(messagesPayload);
          setMassSelectorOpen(false);
          setSelectedEntries([]);
        }}
        forceBotOnly={true}
      />
    </div>
  );
}

function GapView({ 
  gap, 
  onToast, 
  whatsappMessages,
  botConfig,
  onSendBot,
  onMassSendBot
}: { 
  gap: GapEntry[]; 
  onToast: (m: string, t?: 'success' | 'error') => void; 
  whatsappMessages: WhatsAppMessage[];
  botConfig: BotConfig;
  onSendBot: (tel: string, msg: string) => void;
  onMassSendBot: (messages: {telefone: string, message: string}[]) => void;
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [cpfFilter, setCpfFilter] = useState('');
  const [produtoFilter, setProdutoFilter] = useState('');
  const [cursoFilter, setCursoFilter] = useState('');
  const [periodoFilter, setPeriodoFilter] = useState('');
  const [matAcadFilter, setMatAcadFilter] = useState('');
  const [gapFilter, setGapFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<GapEntry | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedEntries, setSelectedEntries] = useState<string[]>([]);
  
  const handleBulkDelete = async () => {
    if (selectedEntries.length === 0) return;
    if (window.confirm(`Deseja excluir ${selectedEntries.length} registros selecionados do GAP?`)) {
        try {
            for (const id of selectedEntries) {
                await deleteDoc(doc(db, COLLECTIONS.GAP, id));
            }
            onToast(`${selectedEntries.length} registros no GAP removidos.`);
            setSelectedEntries([]);
        } catch (err: any) {
            onToast("Erro ao excluir registros do GAP.", 'error');
        }
    }
  };

  const toggleSelect = (id: string, checked: boolean) => {
    if (checked) {
        setSelectedEntries([...selectedEntries, id]);
    } else {
        setSelectedEntries(selectedEntries.filter(s => s !== id));
    }
  };

  const toggleSelectAll = (checked: boolean) => {
      if (checked) {
          setSelectedEntries(filteredGap.map(g => g.id));
      } else {
          setSelectedEntries([]);
      }
  };
  const [formData, setFormData] = useState({
    nome: '',
    telefone: '',
    cpf: '',
    produto: 'Graduação' as any,
    numeroOportunidade: '',
    curso: '',
    semestre: '',
    metodologia: '',
    formaIngresso: '',
    numeroMatricula: '',
    periodo: ''
  });

  const docLabels: Record<string, string> = { 
    rg: 'RG', 
    cpf: 'CPF', 
    diploma: 'Diploma', 
    enem: 'ENEM', 
    historico: 'Hist.', 
    planoEnsino: 'Plano', 
    contrato: 'Contr.', 
    carta: 'Carta' 
  };

  const stats = useMemo(() => {
    const total = gap.length;
    const matFin = total; 
    const matAcadOk = gap.filter(g => g.matAcad).length;
    const pendingDocs = matFin - matAcadOk;
    const conversionRate = total > 0 ? ((matAcadOk / total) * 100).toFixed(1) : '0';
    return { matFin, matAcadOk, pendingDocs, conversionRate };
  }, [gap]);

  const filteredGap = useMemo(() => {
    return gap.filter(g => {
      const matchesSearch = g.nome.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCpf = !cpfFilter || g.cpf?.includes(cpfFilter);
      const matchesProduto = !produtoFilter || g.produto === produtoFilter;
      const matchesCurso = !cursoFilter || g.curso.toLowerCase().includes(cursoFilter.toLowerCase());
      const matchesPeriodo = !periodoFilter || g.periodo?.toLowerCase().includes(periodoFilter.toLowerCase());
      const matchesMatAcad = !matAcadFilter || (matAcadFilter === 'Sim' ? g.matAcad : !g.matAcad);
      
      const docs = g.documentos || {};
      const hasGap = Object.keys(docLabels).some(key => !(docs as any)[key]);
      const matchesGap = !gapFilter || (gapFilter === 'Sim' ? hasGap : !hasGap);
      const matchesAll = matchesSearch && matchesCpf && matchesProduto && matchesCurso && matchesPeriodo && matchesMatAcad && matchesGap;
      return matchesAll;
    });
  }, [gap, searchTerm, cpfFilter, produtoFilter, cursoFilter, periodoFilter, matAcadFilter, gapFilter]);

  const toggleDoc = async (id: string, docKey: string, current: boolean) => {
    try {
      const entry = gap.find(g => g.id === id);
      if (!entry) return;
      const newDocs = { ...(entry.documentos || {}) };
      (newDocs as any)[docKey] = !current;
      await updateDoc(doc(db, COLLECTIONS.GAP, id), { documentos: newDocs });
      onToast("Documento atualizado!");
    } catch (err: any) {
      onToast("Erro ao atualizar documento.", 'error');
    }
  };

  const toggleMatAcad = async (id: string, current: boolean) => {
    try {
      await updateDoc(doc(db, COLLECTIONS.GAP, id), { matAcad: !current });
      onToast("Status de matrícula atualizado!");
    } catch (err: any) {
      onToast("Erro ao atualizar matrícula.", 'error');
    }
  };

  const handleDeleteGap = async (id: string) => {
    if (window.confirm('Deseja excluir este registro do GAP?')) {
      try {
        await deleteDoc(doc(db, COLLECTIONS.GAP, id));
        onToast("Registro removido.");
      } catch (err: any) {
        onToast("Erro ao excluir registro.", 'error');
      }
    }
  };

  const getGapWhatsAppMessage = (entry: GapEntry) => {
    const docs = entry.documentos || {};
    const missingDocs = Object.entries(docLabels)
      .filter(([key]) => !(docs as any)[key])
      .map(([_, label]) => label);

    // If matAcad is OK, use gap_1
    if (entry.matAcad) {
      const msgOk = whatsappMessages.find(m => m.tipo === 'gap_1');
      if (msgOk) return msgOk.texto.replace('[nome]', entry.nome);
      return `Olá ${entry.nome}, vimos que sua matrícula acadêmica está ok! Parabéns!`;
    }
    
    // Add logic to include registration number automatically if it exists
    let message = '';
    const customMsg = whatsappMessages.find(m => m.tipo === 'gap' || m.tipo === 'gap_0');
    if (customMsg) {
      message = customMsg.texto.replace('[nome]', entry.nome);
      if (missingDocs.length > 0) {
        message = message.replace('[pendencias]', missingDocs.join(', '));
      }
    } else if (missingDocs.length > 0) {
       message = `Olá ${entry.nome}, tudo bem? Sou da equipe de captação e meu contato é referente à sua matrícula no curso de ${entry.curso}. Identificamos que sua matrícula ainda não foi finalizada devido à pendência dos seguintes documentos: ${missingDocs.join(', ')}. É fundamental regularizar essa situação o quanto antes para garantir sua vaga e evitar o cancelamento do processo.`;
    }

    if (entry.numeroMatricula) {
        message += `\n\nNº Matrícula: ${entry.numeroMatricula}`;
    }
    
    return message;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingEntry) {
        await updateDoc(doc(db, COLLECTIONS.GAP, editingEntry.id), {
          ...formData,
          updatedAt: serverTimestamp()
        });
        onToast("Candidato atualizado com sucesso!");
      } else {
        await addDoc(collection(db, COLLECTIONS.GAP), {
          ...formData,
          matAcad: false,
          documentos: {},
          createdAt: serverTimestamp()
        });
        onToast("Candidato cadastrado no GAP!");
      }
      setIsModalOpen(false);
      setEditingEntry(null);
      setFormData({
        nome: '', telefone: '', cpf: '', produto: 'Graduação',
        numeroOportunidade: '', curso: '', metodologia: '',
        formaIngresso: '', numeroMatricula: '', periodo: ''
      } as any);
    } catch (err: any) {
      onToast("Erro ao salvar.", 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const data = filteredGap.map(g => ({
      Nome: g.nome,
      Telefone: g.telefone,
      CPF: g.cpf,
      Produto: g.produto,
      Curso: g.curso,
      Periodo: g.periodo || '',
      Matricula: g.numeroMatricula || '',
      MatAcad: g.matAcad ? 'Sim' : 'Não',
      Documentos: Object.entries(docLabels)
        .map(([key, label]) => `${label}: ${(g.documentos as any)?.[key] ? 'OK' : 'Pendente'}`)
        .join(', ')
    }));
    exportToExcel(data, 'Gap_Academico');
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    importFromExcel(file, async (data) => {
      try {
        const batch = data.map(item => ({
          nome: item.Nome || item.nome || '',
          cpf: String(item.CPF || item.cpf || '').replace(/\D/g, ''),
          telefone: String(item.Telefone || item.telefone || ''),
          produto: item.Produto || item.produto || '',
          curso: item.Curso || item.curso || '',
          periodo: item.Periodo || item.periodo || '',
          numeroMatricula: String(item.Matricula || item.numeroMatricula || ''),
          matAcad: item.MatAcad === 'Sim' || item.matAcad === true,
          documentos: {},
          createdAt: serverTimestamp()
        }));

        for (const entry of batch) {
          await addDoc(collection(db, COLLECTIONS.GAP), entry);
        }
        onToast(`${batch.length} registros importados!`);
      } catch (err: any) {
        onToast("Erro ao importar dados.", 'error');
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Mat. Financeira" value={stats.matFin} icon={Database} color="bg-blue-500" />
        <StatCard title="Mat. Acadêmica OK" value={stats.matAcadOk} icon={CheckCircle2} color="bg-emerald-500" />
        <StatCard title="Gap (Docs Pendentes)" value={stats.pendingDocs} icon={Clock} color="bg-amber-500" />
        <StatCard title="Taxa Conv. Acad" value={`${stats.conversionRate}%`} icon={TrendingUp} color="bg-purple-500" />
      </div>

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">GAP Acadêmico</h2>
        <div className="flex space-x-2">
          <button 
            onClick={() => {
              setEditingEntry(null);
              setFormData({
                nome: '', telefone: '', cpf: '', produto: 'Graduação',
                numeroOportunidade: '', curso: '', metodologia: '',
                formaIngresso: '', numeroMatricula: '', periodo: ''
              } as any);
              setIsModalOpen(true);
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center space-x-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
          >
            <Plus size={20} />
            <span>Cadastrar</span>
          </button>
          <label className="bg-blue-50 text-blue-600 px-4 py-2 rounded-xl flex items-center space-x-2 hover:bg-blue-100 transition-all text-sm font-bold cursor-pointer">
            <Upload size={18} />
            <span>Importar</span>
            <input type="file" accept=".xlsx, .xls" onChange={handleImport} className="hidden" />
          </label>
          <button 
            onClick={handleExport}
            className="bg-slate-100 text-slate-600 px-4 py-2 rounded-xl flex items-center space-x-2 hover:bg-slate-200 transition-all text-sm font-bold"
          >
            <Download size={18} />
            <span>Exportar</span>
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <input 
          placeholder="Nome..." 
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input 
          placeholder="CPF..." 
          value={cpfFilter}
          onChange={e => setCpfFilter(e.target.value)}
          className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select 
          value={produtoFilter}
          onChange={e => setProdutoFilter(e.target.value)}
          className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Produto</option>
          <option value="Graduação">Graduação</option>
          <option value="Técnico">Técnico</option>
          <option value="Pós-graduação">Pós-graduação</option>
        </select>
        <input 
          placeholder="Curso..." 
          value={cursoFilter}
          onChange={e => setCursoFilter(e.target.value)}
          className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input 
          placeholder="Período..." 
          value={periodoFilter}
          onChange={e => setPeriodoFilter(e.target.value)}
          className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select 
          value={matAcadFilter}
          onChange={e => setMatAcadFilter(e.target.value)}
          className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Mat. Acadêmica</option>
          <option value="Sim">Sim</option>
          <option value="Não">Não</option>
        </select>
        <select 
          value={gapFilter}
          onChange={e => setGapFilter(e.target.value)}
          className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Gap (Docs)</option>
          <option value="Sim">Com Pendência</option>
          <option value="Não">Sem Pendência</option>
        </select>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                <th className="px-6 py-4 w-12">
                  <input type="checkbox" checked={selectedEntries.length === filteredGap.length && filteredGap.length > 0} onChange={e => toggleSelectAll(e.target.checked)} />
                </th>
                <th className="px-6 py-4">Candidato</th>
                <th className="px-6 py-4">Curso / Produto</th>
                <th className="px-6 py-4">Documentação</th>
                <th className="px-6 py-4">Mat. Acad.</th>
                <th className="px-6 py-4 flex items-center gap-4">
                  {selectedEntries.length > 0 && (
                      <button onClick={handleBulkDelete} className="text-rose-600 font-bold hover:underline">excluir selecionados</button>
                  )}
                  {selectedEntries.length > 0 && botConfig.url && (
                      <button 
                         onClick={() => {
                            const selectedObjs = gap.filter(g => selectedEntries.includes(g.id));
                            const payloads = selectedObjs.map(g => ({
                                telefone: g.telefone,
                                message: getGapWhatsAppMessage(g)
                            }));
                            onMassSendBot(payloads);
                            setSelectedEntries([]);
                         }} 
                         className="text-blue-600 font-bold hover:underline py-1 px-2 bg-blue-50 rounded-lg flex items-center gap-1"
                      >
                         <Bot size={14} /> Em Massa
                      </button>
                  )}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredGap.map(entry => (
                <tr key={entry.id} className="hover:bg-slate-50/50 transition-all">
                  <td className="px-6 py-4">
                      <input type="checkbox" checked={selectedEntries.includes(entry.id)} onChange={e => toggleSelect(entry.id, e.target.checked)} />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-900">{entry.nome}</span>
                      <span className="text-xs text-slate-500">{entry.cpf}</span>
                      <span className="text-xs text-slate-500">{formatPhone(entry.telefone)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-slate-700">{entry.curso}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] text-slate-400">{entry.produto}</span>
                        {entry.periodo && <span className="text-[10px] text-slate-400">• {entry.periodo}</span>}
                      </div>
                      {entry.numeroMatricula && <span className="text-[10px] font-bold text-blue-600">Mat: {entry.numeroMatricula}</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                      {Object.entries(docLabels).map(([key, label]) => (
                        <button
                          key={key}
                          onClick={() => toggleDoc(entry.id, key, !!(entry.documentos as any)?.[key])}
                          className={cn(
                            "px-2 py-0.5 rounded text-[9px] font-bold transition-all",
                            (entry.documentos as any)?.[key] 
                              ? "bg-emerald-100 text-emerald-600" 
                              : "bg-slate-100 text-slate-400"
                          )}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => toggleMatAcad(entry.id, entry.matAcad)}
                      className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-bold uppercase",
                        entry.matAcad ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"
                      )}
                    >
                      {entry.matAcad ? 'OK' : 'Pendente'}
                    </button>
                  </td>
                  <td className="px-6 py-4 flex items-center space-x-2">
                    {botConfig.url && (
                      <button 
                        onClick={() => onSendBot(entry.telefone, getGapWhatsAppMessage(entry))}
                        className="text-blue-600 hover:text-blue-700 font-bold text-sm bg-blue-50 p-2 rounded-lg"
                        title="Enviar pelo Bot ARGO'S"
                      >
                        <Bot size={16} />
                      </button>
                    )}
                    <a 
                      href={getWhatsAppUrl(entry.telefone, getGapWhatsAppMessage(entry))} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-emerald-600 hover:text-emerald-700 font-bold text-sm bg-emerald-50 p-2 rounded-lg"
                      title="Abrir WhatsApp"
                    >
                      <MessageSquare size={16} />
                    </a>
                    <button 
                      onClick={() => {
                        setEditingEntry(entry);
                        setFormData({
                          nome: entry.nome || '',
                          telefone: entry.telefone || '',
                          cpf: entry.cpf || '',
                          produto: entry.produto || 'Graduação',
                          numeroOportunidade: entry.numeroOportunidade || '',
                          curso: entry.curso || '',
                          semestre: entry.semestre || '',
                          metodologia: entry.metodologia || '',
                          formaIngresso: entry.formaIngresso || '',
                          numeroMatricula: entry.numeroMatricula || '',
                          periodo: entry.periodo || ''
                        });
                        setIsModalOpen(true);
                      }}
                      className="text-blue-400 hover:text-blue-600 p-2 hover:bg-blue-50 rounded-lg transition-all"
                      title="Editar"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => handleDeleteGap(entry.id)}
                      className="text-rose-400 hover:text-rose-600 p-2 hover:bg-rose-50 rounded-lg transition-all"
                      title="Excluir"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredGap.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">Nenhum registro no GAP.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-xl w-full max-w-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-xl font-bold text-slate-900">{editingEntry ? 'Editar Candidato' : 'Cadastrar no GAP'}</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleRegister} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 mb-1">Nome Completo</label>
                  <input required value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">CPF</label>
                  <input required value={formData.cpf} onChange={e => setFormData({...formData, cpf: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Telefone</label>
                  <input required value={formData.telefone} onChange={e => setFormData({...formData, telefone: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Produto</label>
                  <select value={formData.produto} onChange={e => setFormData({...formData, produto: e.target.value as any})} className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm">
                    <option value="Graduação">Graduação</option>
                    <option value="Técnico">Técnico</option>
                    <option value="Pós-graduação">Pós-graduação</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">N° Oportunidade</label>
                  <input value={formData.numeroOportunidade} onChange={e => setFormData({...formData, numeroOportunidade: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Curso</label>
                  <input required value={formData.curso} onChange={e => setFormData({...formData, curso: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Período</label>
                  <input value={formData.periodo} onChange={e => setFormData({...formData, periodo: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm" placeholder="Ex: 2024.1" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Semestre</label>
                  <input value={formData.semestre} onChange={e => setFormData({...formData, semestre: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Metodologia</label>
                  <input value={formData.metodologia} onChange={e => setFormData({...formData, metodologia: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Forma de Ingresso</label>
                  <input value={formData.formaIngresso} onChange={e => setFormData({...formData, formaIngresso: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Nº Matrícula</label>
                  <input value={formData.numeroMatricula} onChange={e => setFormData({...formData, numeroMatricula: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm" />
                </div>
                <div className="md:col-span-2">
                  <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-all disabled:opacity-50">
                    {loading ? 'Salvando...' : (editingEntry ? 'Salvar Alterações' : 'Cadastrar Candidato')}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CalendarioAcoesView({ 
  data, 
  onToast, 
  profile,
  initialData,
  onClearInitialData
}: { 
  data: CalendarioAcao[], 
  onToast: (m: string, t?: 'success' | 'error') => void, 
  profile: UserProfile,
  initialData?: Partial<CalendarioAcao> | null,
  onClearInitialData?: () => void
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'concluida' | 'pendente'>('all');
  const [dateFilter, setDateFilter] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [editingAction, setEditingAction] = useState<CalendarioAcao | null>(null);
  
  const [newAction, setNewAction] = useState({
    nome: '',
    dataInicio: '',
    dataFim: '',
    local: '',
    observacao: '',
    concluida: false,
    fotos: ['', '', '']
  });

  useEffect(() => {
    if (initialData) {
      setNewAction({
        nome: initialData.nome || '',
        dataInicio: initialData.dataInicio || '',
        dataFim: initialData.dataFim || '',
        local: initialData.local || '',
        observacao: initialData.observacao || '',
        concluida: false,
        fotos: ['', '', '']
      });
      setIsAdding(true);
      if (onClearInitialData) onClearInitialData();
    }
  }, [initialData]);

  const filteredData = data.filter(item => {
    const matchesSearch = item.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         item.local.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' ? true : 
                         statusFilter === 'concluida' ? item.concluida : !item.concluida;
    const matchesDate = dateFilter === '' ? true : 
                       (item.dataInicio <= dateFilter && item.dataFim >= dateFilter);
    return matchesSearch && matchesStatus && matchesDate;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...newAction,
        fotos: newAction.fotos.filter(f => f.trim() !== ''),
        updatedAt: serverTimestamp()
      };

      if (editingAction) {
        await updateDoc(doc(db, COLLECTIONS.CALENDARIO_ACOES, editingAction.id), payload);
        onToast("Ação atualizada com sucesso!");
      } else {
        await addDoc(collection(db, COLLECTIONS.CALENDARIO_ACOES), {
          ...payload,
          creatorId: profile.uid,
          creatorRole: profile.role,
          createdAt: serverTimestamp()
        });
        onToast("Ação agendada com sucesso!");
      }
      setIsAdding(false);
      setEditingAction(null);
      setNewAction({ nome: '', dataInicio: '', dataFim: '', local: '', observacao: '', concluida: false, fotos: ['', '', ''] });
    } catch (err: any) {
      handleFirestoreError(err, OperationType.WRITE, COLLECTIONS.CALENDARIO_ACOES);
      onToast("Erro ao salvar ação.", 'error');
    }
  };

  const toggleStatus = async (action: CalendarioAcao) => {
    try {
      await updateDoc(doc(db, COLLECTIONS.CALENDARIO_ACOES, action.id), {
        concluida: !action.concluida
      });
      onToast(action.concluida ? "Ação marcada como pendente" : "Ação concluída!");
    } catch (err: any) {
      onToast("Erro ao atualizar status.", 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Deseja excluir esta ação?')) {
      try {
        await deleteDoc(doc(db, COLLECTIONS.CALENDARIO_ACOES, id));
        onToast("Ação removida.");
      } catch (err: any) {
        onToast("Erro ao excluir ação.", 'error');
      }
    }
  };

  const handleExport = () => {
    const exportData = filteredData.map(item => ({
      Nome: item.nome,
      'Data Início': item.dataInicio,
      'Data Fim': item.dataFim,
      Local: item.local,
      Observação: item.observacao,
      Status: item.concluida ? 'Concluída' : 'Pendente'
    }));
    exportToExcel(exportData, 'Calendario_Acoes');
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    importFromExcel(file, async (importData) => {
      try {
        const batch = importData.map(item => ({
          nome: item.Nome || item.nome || '',
          dataInicio: item['Data Início'] || item.dataInicio || '',
          dataFim: item['Data Fim'] || item.dataFim || '',
          local: item.Local || item.local || '',
          observacao: item.Observação || item.observacao || '',
          concluida: item.Status === 'Concluída' || item.concluida === true,
          fotos: [],
          creatorId: profile.uid,
          creatorRole: profile.role,
          createdAt: serverTimestamp()
        }));

        for (const entry of batch) {
          await addDoc(collection(db, COLLECTIONS.CALENDARIO_ACOES), entry);
        }
        onToast(`${batch.length} ações importadas!`);
      } catch (err: any) {
        onToast("Erro ao importar ações.", 'error');
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-200">
            <Calendar size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Calendário de Ações</h2>
            <p className="text-slate-500 text-sm">Gerencie as ações e eventos da equipe</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <button 
            onClick={() => setIsAdding(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center space-x-2"
          >
            <Plus size={20} />
            <span>Nova Ação</span>
          </button>
          <label className="bg-blue-50 text-blue-600 px-4 py-2 rounded-xl flex items-center space-x-2 hover:bg-blue-100 transition-all text-sm font-bold cursor-pointer">
            <Upload size={18} />
            <span>Importar</span>
            <input type="file" accept=".xlsx, .xls" onChange={handleImport} className="hidden" />
          </label>
          <button 
            onClick={handleExport}
            className="bg-slate-100 text-slate-600 px-4 py-2 rounded-xl flex items-center space-x-2 hover:bg-slate-200 transition-all text-sm font-bold"
          >
            <Download size={18} />
            <span>Exportar</span>
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 ml-1">Pesquisar</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Nome ou local..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 ml-1">Status</label>
          <select 
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500 transition-all"
          >
            <option value="all">Todos os Status</option>
            <option value="concluida">Concluídas</option>
            <option value="pendente">Pendentes</option>
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 ml-1">Data</label>
          <input 
            type="date" 
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
            className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500 transition-all"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredData.map(action => (
          <motion.div 
            layout
            key={action.id} 
            className={cn(
              "bg-white p-6 rounded-3xl shadow-sm border transition-all",
              action.concluida ? "border-emerald-100 bg-emerald-50/10" : "border-slate-100"
            )}
          >
            <div className="flex justify-between items-start mb-4">
              <div className={cn(
                "p-2 rounded-xl",
                action.concluida ? "bg-emerald-100 text-emerald-600" : "bg-blue-100 text-blue-600"
              )}>
                <Calendar size={20} />
              </div>
              <div className="flex space-x-1">
                <button 
                  onClick={() => {
                    setEditingAction(action);
                    setNewAction({
                      nome: action.nome,
                      dataInicio: action.dataInicio,
                      dataFim: action.dataFim,
                      local: action.local,
                      observacao: action.observacao,
                      concluida: action.concluida,
                      fotos: [...(action.fotos || []), '', '', ''].slice(0, 3)
                    });
                    setIsAdding(true);
                  }}
                  className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-all"
                >
                  <Edit2 size={16} />
                </button>
                <button 
                  onClick={() => handleDelete(action.id)}
                  className="p-2 text-rose-400 hover:bg-rose-50 rounded-lg transition-all"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            <h3 className="text-lg font-bold text-slate-900 mb-1">{action.nome}</h3>
            <div className="flex items-center space-x-2 text-slate-500 text-xs mb-4">
              <MapPin size={14} />
              <span>{action.local}</span>
            </div>

            <div className="bg-slate-50 p-3 rounded-2xl mb-4">
              <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase mb-1">
                <span>Período</span>
              </div>
              <p className="text-xs font-bold text-slate-700">
                {new Date(action.dataInicio).toLocaleDateString('pt-BR')} {action.dataFim !== action.dataInicio && `- ${new Date(action.dataFim).toLocaleDateString('pt-BR')}`}
              </p>
            </div>

            {action.fotos && action.fotos.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mb-4">
                {action.fotos.map((foto, idx) => (
                  <div key={idx} className="aspect-square rounded-xl overflow-hidden bg-slate-100 border border-slate-200 relative group">
                    <img src={foto} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    <a 
                      href={foto} 
                      download={`foto_${idx+1}.jpg`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                      title="Fazer Download"
                    >
                      <Download size={20} />
                    </a>
                  </div>
                ))}
              </div>
            )}

            {action.observacao && (
              <div className="mb-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Observações</p>
                <p className="text-xs text-slate-600 leading-relaxed">{action.observacao}</p>
              </div>
            )}

            <button 
              onClick={() => toggleStatus(action)}
              className={cn(
                "w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center space-x-2",
                action.concluida 
                  ? "bg-emerald-600 text-white hover:bg-emerald-700" 
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              )}
            >
              {action.concluida ? (
                <>
                  <CheckCircle2 size={18} />
                  <span>Concluída</span>
                </>
              ) : (
                <>
                  <Circle size={18} />
                  <span>Marcar como Concluída</span>
                </>
              )}
            </button>
          </motion.div>
        ))}
        {filteredData.length === 0 && (
          <div className="col-span-full py-20 text-center">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
              <Calendar size={40} />
            </div>
            <p className="text-slate-400 italic">Nenhuma ação encontrada para os filtros aplicados.</p>
          </div>
        )}
      </div>

      {isAdding && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden"
          >
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-900">{editingAction ? 'Editar Ação' : 'Nova Ação'}</h3>
              <button onClick={() => { setIsAdding(false); setEditingAction(null); }} className="text-slate-400 hover:bg-slate-50 p-2 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Nome da Ação *</label>
                <input 
                  required
                  value={newAction.nome}
                  onChange={e => setNewAction({...newAction, nome: e.target.value})}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm"
                  placeholder="Ex: Blitz no Centro"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Data Início *</label>
                  <input 
                    type="date"
                    required
                    value={newAction.dataInicio}
                    onChange={e => setNewAction({...newAction, dataInicio: e.target.value})}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Data Fim *</label>
                  <input 
                    type="date"
                    required
                    value={newAction.dataFim}
                    onChange={e => setNewAction({...newAction, dataFim: e.target.value})}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Local *</label>
                <input 
                  required
                  value={newAction.local}
                  onChange={e => setNewAction({...newAction, local: e.target.value})}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm"
                  placeholder="Ex: Praça Central"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Observações</label>
                <textarea 
                  value={newAction.observacao}
                  onChange={e => setNewAction({...newAction, observacao: e.target.value})}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm min-h-[100px]"
                  placeholder="O que será feito?"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2">Fotos (até 3 URLs)</label>
                <div className="space-y-2">
                  {newAction.fotos.map((foto, idx) => (
                    <input 
                      key={idx}
                      placeholder={`URL da Foto ${idx + 1}`}
                      value={foto}
                      onChange={e => {
                        const next = [...newAction.fotos];
                        next[idx] = e.target.value;
                        setNewAction({...newAction, fotos: next});
                      }}
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm"
                    />
                  ))}
                </div>
              </div>
              <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100">
                {editingAction ? 'Salvar Alterações' : 'Agendar Ação'}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function EmpresasParceirasView({ 
  data, 
  onToast, 
  onGenerateAction 
}: { 
  data: EmpresaParceira[], 
  onToast: (m: string, t?: 'success' | 'error') => void,
  onGenerateAction: (empresa: EmpresaParceira) => void
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmpresa, setEditingEmpresa] = useState<EmpresaParceira | null>(null);

  const filteredData = data.filter(emp => 
    emp.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.responsavel.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const payload = {
      nome: formData.get('nome') as string,
      responsavel: formData.get('responsavel') as string,
      telefone: formData.get('telefone') as string,
      email: formData.get('email') as string,
      endereco: formData.get('endereco') as string,
      linkMaps: formData.get('linkMaps') as string,
      updatedAt: serverTimestamp(),
    };

    try {
      if (editingEmpresa) {
        await updateDoc(doc(db, COLLECTIONS.EMPRESAS_PARCEIRAS, editingEmpresa.id), payload);
        onToast("Empresa atualizada!");
      } else {
        await addDoc(collection(db, COLLECTIONS.EMPRESAS_PARCEIRAS), { ...payload, createdAt: serverTimestamp() });
        onToast("Empresa cadastrada!");
      }
      setIsModalOpen(false);
      setEditingEmpresa(null);
    } catch (err: any) {
      handleFirestoreError(err, OperationType.WRITE, COLLECTIONS.EMPRESAS_PARCEIRAS);
      onToast("Erro ao salvar empresa.", 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Deseja excluir esta empresa?')) {
      try {
        await deleteDoc(doc(db, COLLECTIONS.EMPRESAS_PARCEIRAS, id));
        onToast("Empresa removida.");
      } catch (err: any) {
        onToast("Erro ao excluir empresa.", 'error');
      }
    }
  };

  const handleExport = () => {
    const exportData = filteredData.map(emp => ({
      Nome: emp.nome,
      Responsável: emp.responsavel,
      Telefone: emp.telefone,
      Email: emp.email,
      Endereço: emp.endereco,
      'Link Maps': emp.linkMaps
    }));
    exportToExcel(exportData, 'Empresas_Parceiras');
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    importFromExcel(file, async (importData) => {
      try {
        const batch = importData.map(item => ({
          nome: item.Nome || item.nome || '',
          responsavel: item.Responsável || item.responsavel || '',
          telefone: String(item.Telefone || item.telefone || ''),
          email: item.Email || item.email || '',
          endereco: item.Endereço || item.endereco || '',
          linkMaps: item['Link Maps'] || item.linkMaps || '',
          createdAt: serverTimestamp()
        }));

        for (const entry of batch) {
          await addDoc(collection(db, COLLECTIONS.EMPRESAS_PARCEIRAS), entry);
        }
        onToast(`${batch.length} empresas importadas!`);
      } catch (err: any) {
        onToast("Erro ao importar empresas.", 'error');
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-200">
            <Building2 size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Empresas Parceiras</h2>
            <p className="text-slate-500 text-sm">Gestão de parcerias e convênios</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <button 
            onClick={() => { setEditingEmpresa(null); setIsModalOpen(true); }}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center space-x-2"
          >
            <Plus size={20} />
            <span>Nova Empresa</span>
          </button>
          <label className="bg-blue-50 text-blue-600 px-4 py-2 rounded-xl flex items-center space-x-2 hover:bg-blue-100 transition-all text-sm font-bold cursor-pointer">
            <Upload size={18} />
            <span>Importar</span>
            <input type="file" accept=".xlsx, .xls" onChange={handleImport} className="hidden" />
          </label>
          <button 
            onClick={handleExport}
            className="bg-slate-100 text-slate-600 px-4 py-2 rounded-xl flex items-center space-x-2 hover:bg-slate-200 transition-all text-sm font-bold"
          >
            <Download size={18} />
            <span>Exportar</span>
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por nome, responsável ou email..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredData.map(emp => (
          <div key={emp.id} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between hover:border-blue-200 transition-all group">
            <div>
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{emp.nome}</h3>
                <div className="flex space-x-1">
                  <button onClick={() => { setEditingEmpresa(emp); setIsModalOpen(true); }} className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-all">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => handleDelete(emp.id)} className="p-2 text-rose-400 hover:bg-rose-50 rounded-lg transition-all">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-center space-x-3 text-sm text-slate-600">
                  <Users size={16} className="text-slate-400" />
                  <span>{emp.responsavel}</span>
                </div>
                <div className="flex items-center space-x-3 text-sm text-slate-600">
                  <Phone size={16} className="text-slate-400" />
                  <span>{formatPhone(emp.telefone)}</span>
                </div>
                <div className="flex items-center space-x-3 text-sm text-slate-600">
                  <Mail size={16} className="text-slate-400" />
                  <span className="truncate">{emp.email}</span>
                </div>
                <div className="flex items-center space-x-3 text-sm text-slate-600">
                  <MapPin size={16} className="text-slate-400" />
                  <span className="truncate">{emp.endereco}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col space-y-2">
              {emp.linkMaps && (
                <a 
                  href={emp.linkMaps} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-center space-x-2 w-full py-2 bg-slate-50 text-slate-600 rounded-xl font-bold text-xs hover:bg-slate-100 transition-all"
                >
                  <Globe size={14} />
                  <span>Ver no Maps</span>
                </a>
              )}
              <button 
                onClick={() => onGenerateAction(emp)}
                className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center justify-center space-x-2"
              >
                <Calendar size={18} />
                <span>Gerar Ação</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-xl font-bold text-slate-900">
                  {editingEmpresa ? 'Editar Empresa' : 'Nova Empresa Parceira'}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleSave} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Nome da Empresa</label>
                  <input name="nome" defaultValue={editingEmpresa?.nome} required className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Responsável</label>
                  <input name="responsavel" defaultValue={editingEmpresa?.responsavel} required className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Telefone</label>
                    <input name="telefone" defaultValue={editingEmpresa?.telefone} required className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Email</label>
                    <input name="email" type="email" defaultValue={editingEmpresa?.email} className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Endereço</label>
                  <input name="endereco" defaultValue={editingEmpresa?.endereco} className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Link no Maps</label>
                  <input name="linkMaps" defaultValue={editingEmpresa?.linkMaps} placeholder="https://goo.gl/maps/..." className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200">
                  {editingEmpresa ? 'Salvar Alterações' : 'Cadastrar Empresa'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CalculoRemuneracaoView() {
  const [salario, setSalario] = useState<string>('');
  const [multiplo, setMultiplo] = useState<string>('');

  const resultado = useMemo(() => {
    const vSalario = parseFloat(salario.replace(',', '.')) || 0;
    const vMultiplo = parseFloat(multiplo.replace(',', '.')) || 0;
    
    // Formula: Salário Base * Múltiplo da RV
    return vSalario * vMultiplo;
  }, [salario, multiplo]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-slate-900">Cálculo de Remuneração</h2>
        <p className="text-slate-500">Preencha os campos abaixo para calcular a remuneração total</p>
      </div>

      <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        <div className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-700">Salário Base</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">R$</span>
                <input 
                  type="text" 
                  value={salario}
                  onChange={(e) => setSalario(e.target.value)}
                  placeholder="0,00"
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-700">Múltiplo da RV</label>
              <input 
                type="text" 
                value={multiplo}
                onChange={(e) => setMultiplo(e.target.value)}
                placeholder="Ex: 1.5"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium"
              />
            </div>
          </div>

          <div className="pt-8 border-t border-slate-100">
            <div className="bg-blue-600 rounded-3xl p-8 text-white text-center space-y-2 shadow-lg shadow-blue-200">
              <span className="text-blue-100 text-sm font-bold uppercase tracking-wider">Remuneração Total Estimada</span>
              <div className="text-4xl md:text-5xl font-black">
                {formatCurrency(resultado)}
              </div>
              <p className="text-blue-100/80 text-xs pt-2">
                Fórmula: Salário Base × Múltiplo da RV
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-start space-x-3">
        <AlertCircle className="text-amber-500 shrink-0" size={20} />
        <p className="text-xs text-amber-700 leading-relaxed">
          Este cálculo é uma estimativa baseada nos valores informados. 
          Consulte as regras vigentes de sua unidade para confirmação dos valores finais.
        </p>
      </div>
    </div>
  );
}

function AdminView({ users, links, onToast, leads, bases, gap, planner, campanhas, bomDia, forecast, periodos, whatsappMessages, empresasParceiras, botConfig, botStatuses, setBotStatuses }: { 
  users: UserProfile[], 
  links: LinkUtil[], 
  onToast: (m: string, t?: 'success' | 'error') => void,
  leads: Lead[],
  bases: BaseEntry[],
  gap: GapEntry[],
  planner: PlannerTask[],
  campanhas: Campanha[],
  bomDia: BomDiaCaptacao[],
  forecast: ForecastCaptacao[],
  periodos: PeriodoCaptacao[],
  whatsappMessages: WhatsAppMessage[],
  empresasParceiras: EmpresaParceira[],
  botConfig: BotConfig,
  botStatuses: Record<string, { status: string, pairingCode?: string, qrCode?: string, qrUrl?: string, active?: boolean }>,
  setBotStatuses: React.Dispatch<React.SetStateAction<Record<string, { status: string, pairingCode?: string, qrCode?: string, qrUrl?: string, active?: boolean }>>>
}) {
  const [activeTab, setActiveTab] = useState<'usuarios' | 'bomDia' | 'forecast' | 'planner' | 'periodo' | 'links' | 'whatsapp' | 'backup' | 'treinamento'>('usuarios');
  const [isProcessingPdf, setIsProcessingPdf] = useState(false);

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      onToast("Por favor, selecione um arquivo PDF.", "error");
      return;
    }

    setIsProcessingPdf(true);
    try {
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let text = '';

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items.map((item: any) => item.str).join(' ');
        text += `\n--- Página ${i} ---\n` + pageText + '\n';
      }

      const currentContext = botConfig.trainingContext || '';
      const newContext = currentContext + (currentContext ? '\n\n' : '') + `=== Conteúdo do Arquivo: ${file.name} ===\n` + text;
      
      await setDoc(doc(db, COLLECTIONS.BOT_CONFIG, 'main'), { 
        trainingContext: newContext,
        updatedAt: serverTimestamp() 
      }, { merge: true });
      
      onToast("PDF processado e adicionado ao contexto com sucesso!");
      
    } catch (err: any) {
      console.error(err);
      onToast(`Erro ao processar PDF: ${err.message}`, 'error');
    } finally {
      setIsProcessingPdf(false);
      e.target.value = '';
    }
  };

  const [newLink, setNewLink] = useState({ nome: '', url: '' });
  const [newPlanner, setNewPlanner] = useState({ atendenteName: '', baseName: '', dayOfWeek: 'Segunda-feira' });
  const [newPeriodo, setNewPeriodo] = useState({
    nome: '',
    inicioInscricao: '',
    fimInscricao: '',
    inicioMatFin: '',
    fimMatFin: '',
    inicioMatAcad: '',
    fimMatAcad: ''
  });
  const [newBomDia, setNewBomDia] = useState({
    titulo: '',
    metaFinal: { insc: 0, matFin: 0, matAcad: 0 },
    metaDia: { insc: 0, matFin: 0, matAcad: 0 },
    anoAnterior: { insc: 0, matFin: 0, matAcad: 0 },
    real: { insc: 0, matFin: 0, matAcad: 0 }
  });
  const [newForecast, setNewForecast] = useState({ 
    nome: '', 
    dataInicio: new Date().toISOString().split('T')[0], 
    dataFim: new Date().toISOString().split('T')[0], 
    metaDiaYTD: 0, 
    realizado: 0, 
    metaFechamento: 0 
  });

  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [editingBomDia, setEditingBomDia] = useState<BomDiaCaptacao | null>(null);
  const [editingForecast, setEditingForecast] = useState<ForecastCaptacao | null>(null);
  const [isAddingUser, setIsAddingUser] = useState(false);

  const handleUpdateUser = async (uid: string, data: Partial<UserProfile>) => {
    try {
      await updateDoc(doc(db, COLLECTIONS.USERS, uid), {
        ...data,
        updatedAt: serverTimestamp()
      });
      onToast("Usuário atualizado!");
      setEditingUser(null);
    } catch (err: any) {
      onToast(err.message, 'error');
    }
  };

  const handleDeleteUser = async (uid: string) => {
    if (window.confirm('Deseja excluir permanentemente este usuário? Esta ação não pode ser desfeita.')) {
      try {
        await deleteDoc(doc(db, COLLECTIONS.USERS, uid));
        onToast("Usuário excluído com sucesso.");
      } catch (err: any) {
        handleFirestoreError(err, OperationType.DELETE, `${COLLECTIONS.USERS}/${uid}`);
        onToast("Erro ao excluir usuário.", 'error');
      }
    }
  };

  const handleAddLink = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, COLLECTIONS.LINKS), newLink);
      onToast("Link adicionado!");
      setNewLink({ nome: '', url: '' });
    } catch (err: any) {
      onToast(err.message, 'error');
    }
  };

  const handleAddBomDia = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingBomDia) {
        await updateDoc(doc(db, COLLECTIONS.BOM_DIA, editingBomDia.id), {
          ...newBomDia,
          updatedAt: serverTimestamp()
        });
        onToast("Bom Dia atualizado!");
        setEditingBomDia(null);
      } else {
        await addDoc(collection(db, COLLECTIONS.BOM_DIA), {
          ...newBomDia,
          data: new Date().toISOString().split('T')[0],
          createdAt: serverTimestamp()
        });
        onToast("Bom Dia adicionado!");
      }
      setNewBomDia({
        titulo: '',
        metaFinal: { insc: 0, matFin: 0, matAcad: 0 },
        metaDia: { insc: 0, matFin: 0, matAcad: 0 },
        anoAnterior: { insc: 0, matFin: 0, matAcad: 0 },
        real: { insc: 0, matFin: 0, matAcad: 0 }
      });
    } catch (err: any) {
      onToast("Erro ao salvar Bom Dia.", 'error');
    }
  };

  const handleAddForecast = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingForecast) {
        await updateDoc(doc(db, COLLECTIONS.FORECAST, editingForecast.id), {
          ...newForecast,
          updatedAt: serverTimestamp()
        });
        onToast("Forecast atualizado!");
        setEditingForecast(null);
      } else {
        await addDoc(collection(db, COLLECTIONS.FORECAST), {
          ...newForecast,
          createdAt: serverTimestamp()
        });
        onToast("Forecast criado!");
      }
      setNewForecast({ 
        nome: '', 
        dataInicio: new Date().toISOString().split('T')[0], 
        dataFim: new Date().toISOString().split('T')[0], 
        metaDiaYTD: 0, 
        realizado: 0, 
        metaFechamento: 0 
      });
    } catch (err: any) {
      onToast("Erro ao salvar Forecast.", 'error');
    }
  };

  const handleAddPlanner = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, COLLECTIONS.PLANNER), {
        ...newPlanner,
        createdAt: serverTimestamp()
      });
      onToast("Planner adicionado!");
      setNewPlanner({ atendenteName: '', baseName: '', dayOfWeek: 'Segunda-feira' });
    } catch (err: any) {
      onToast("Erro ao salvar Planner.", 'error');
    }
  };

  const handleAddPeriodo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, COLLECTIONS.PERIODO_CAPTACAO), {
        ...newPeriodo,
        createdAt: serverTimestamp()
      });
      onToast("Período adicionado!");
      setNewPeriodo({
        nome: '',
        inicioInscricao: '',
        fimInscricao: '',
        inicioMatFin: '',
        fimMatFin: '',
        inicioMatAcad: '',
        fimMatAcad: ''
      });
    } catch (err: any) {
      onToast("Erro ao salvar Período.", 'error');
    }
  };

  const handleBackup = () => {
    const data = { leads, bases, gap, planner, links, users, campanhas, bomDia, forecast, periodos, whatsappMessages, empresasParceiras };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_angra_leads_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    onToast("Backup gerado com sucesso!");
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex overflow-x-auto space-x-2 border-b border-slate-200 pb-4 mb-6 scrollbar-hide">
        {[
          { id: 'usuarios', label: 'Usuários' },
          { id: 'bomDia', label: 'Bom Dia Captação' },
          { id: 'forecast', label: 'Forecast' },
          { id: 'planner', label: 'Planner da Semana' },
          { id: 'periodo', label: 'Período da Captação' },
          { id: 'whatsapp', label: 'Gestão WhatsApp' },
          { id: 'treinamento', label: 'Treinamento Bot' },
          { id: 'links', label: 'Links Úteis' },
          { id: 'backup', label: 'Backup e Segurança' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
              activeTab === tab.id 
                ? 'bg-blue-600 text-white shadow-md shadow-blue-200' 
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'usuarios' && (
        <section className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h3 className="text-xl font-bold text-slate-900">Gerenciar Usuários</h3>
            <button 
              onClick={() => setIsAddingUser(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center space-x-2 text-sm"
            >
              <UserPlus size={18} />
              <span>Novo Usuário</span>
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                  <th className="px-6 py-4">Nome</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Telefone</th>
                  <th className="px-6 py-4">Cargo</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map(u => (
                  <tr key={u.uid} className={cn("hover:bg-slate-50 transition-colors", u.blocked && "bg-rose-50/50")}>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-xs">
                          {u.name.charAt(0)}
                        </div>
                        <span className="font-bold text-slate-900">{u.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">{u.email}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">{u.phone || '-'}</td>
                    <td className="px-6 py-4">
                      <select 
                        value={u.role}
                        onChange={(e) => handleUpdateUser(u.uid, { role: e.target.value as UserRole })}
                        className="text-xs font-bold border-none bg-transparent focus:ring-0 text-slate-700"
                      >
                        {Object.values(ROLES).map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-2 py-1 rounded-full text-[10px] font-bold uppercase",
                        u.blocked ? "bg-rose-100 text-rose-600" : "bg-emerald-100 text-emerald-600"
                      )}>
                        {u.blocked ? 'Bloqueado' : 'Ativo'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={() => setEditingUser(u)}
                          className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-all"
                          title="Editar Perfil"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleUpdateUser(u.uid, { blocked: !u.blocked })}
                          className={cn(
                            "p-2 rounded-lg transition-all",
                            u.blocked ? "text-emerald-500 hover:bg-emerald-50" : "text-amber-500 hover:bg-amber-50"
                          )}
                          title={u.blocked ? "Desbloquear" : "Bloquear"}
                        >
                          {u.blocked ? <Unlock size={16} /> : <Lock size={16} />}
                        </button>
                        <button 
                          onClick={() => handleDeleteUser(u.uid)}
                          className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                          title="Excluir Usuário"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {editingUser && (
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
              >
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                  <h3 className="text-xl font-bold text-slate-900">Editar Perfil</h3>
                  <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:bg-slate-50 p-2 rounded-lg">
                    <X size={20} />
                  </button>
                </div>
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    handleUpdateUser(editingUser.uid, {
                      name: formData.get('name') as string,
                      phone: formData.get('phone') as string,
                      email: formData.get('email') as string,
                      chavePix: formData.get('chavePix') as string,
                      botNumber: formData.get('botNumber') as string,
                    });
                  }} 
                  className="p-6 space-y-4"
                >
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Nome Completo</label>
                    <input 
                      name="name"
                      required
                      defaultValue={editingUser.name}
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Email</label>
                    <input 
                      name="email"
                      type="email"
                      required
                      defaultValue={editingUser.email}
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Telefone (Contato)</label>
                    <input 
                      name="phone"
                      defaultValue={editingUser.phone}
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm"
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Telefone da IA (Multi-Device)</label>
                    <input 
                      name="botNumber"
                      defaultValue={editingUser.botNumber || ''}
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm"
                      placeholder="Ex: 5511999999999 (Somente números)"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Este será o número de WhatsApp usado pelo sistema para enviar mensagens desta conta.</p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Chave PIX (Opcional)</label>
                    <input 
                      name="chavePix"
                      defaultValue={editingUser.chavePix}
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm"
                      placeholder="CPF, Email, Telefone ou Chave Aleatória"
                    />
                  </div>
                  <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100">
                    Salvar Alterações
                  </button>
                </form>
              </motion.div>
            </div>
          )}

          {isAddingUser && (
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
              >
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                  <h3 className="text-xl font-bold text-slate-900">Novo Usuário</h3>
                  <button onClick={() => setIsAddingUser(false)} className="text-slate-400 hover:bg-slate-50 p-2 rounded-lg">
                    <X size={20} />
                  </button>
                </div>
                <form 
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    const email = formData.get('email') as string;
                    const name = formData.get('name') as string;
                    const role = formData.get('role') as UserRole;
                    
                    try {
                      // Create user in Auth using secondary app to avoid signing out admin
                      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, '123456');
                      await updateProfile(userCredential.user, { displayName: name });
                      const newUid = userCredential.user.uid;

                      // Create profile in Firestore
                      await setDoc(doc(db, COLLECTIONS.USERS, newUid), {
                        uid: newUid,
                        name,
                        email,
                        role,
                        phone: formData.get('phone') as string,
                        chavePix: formData.get('chavePix') as string,
                        blocked: false,
                        mustChangePassword: true,
                        createdAt: serverTimestamp(),
                        updatedAt: serverTimestamp()
                      });

                      onToast("Usuário criado com sucesso! Senha padrão: 123456");
                      setIsAddingUser(false);
                      // Sign out from secondary auth to clean up
                      await signOut(secondaryAuth);
                    } catch (err: any) {
                      console.error("Auth error details (UsersView):", {
                        code: err.code,
                        message: err.message,
                        stack: err.stack
                      });
                      onToast(err.message === 'Firebase: Error (auth/email-already-in-use).' 
                        ? "Este email já está em uso." 
                        : `Erro ao criar usuário: ${err.message}`, 'error');
                    }
                  }} 
                  className="p-6 space-y-4"
                >
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Nome Completo</label>
                    <input name="name" required className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Email (Google)</label>
                    <input name="email" type="email" required className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Cargo</label>
                    <select name="role" className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm">
                      {Object.values(ROLES).map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Telefone</label>
                      <input name="phone" className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm" placeholder="(00) 00000-0000" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Chave PIX</label>
                      <input name="chavePix" className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm" />
                    </div>
                  </div>
                  <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100">
                    Criar Usuário
                  </button>
                </form>
              </motion.div>
            </div>
          )}
        </section>
      )}

      {activeTab === 'bomDia' && (
        <div className="space-y-8">
          <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-900">{editingBomDia ? 'Editar Card' : 'Adicionar Novo Card'}</h3>
              {editingBomDia && (
                <button 
                  onClick={() => {
                    setEditingBomDia(null);
                    setNewBomDia({
                      titulo: '',
                      metaFinal: { insc: 0, matFin: 0, matAcad: 0 },
                      metaDia: { insc: 0, matFin: 0, matAcad: 0 },
                      anoAnterior: { insc: 0, matFin: 0, matAcad: 0 },
                      real: { insc: 0, matFin: 0, matAcad: 0 }
                    });
                  }}
                  className="text-slate-400 hover:text-slate-600 text-sm font-bold"
                >
                  Cancelar Edição
                </button>
              )}
            </div>
            <form onSubmit={handleAddBomDia} className="space-y-6">
              <div>
                <label className="flex items-center space-x-2 text-xs font-bold text-slate-500 mb-2">
                  <TrendingUp size={14} className="text-blue-600" />
                  <span>Título do Card *</span>
                </label>
                <input 
                  required 
                  placeholder="Ex: CAPTAÇÃO BU PRESENCIAL 25.1" 
                  value={newBomDia.titulo}
                  onChange={e => setNewBomDia({...newBomDia, titulo: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                />
              </div>

              {[
                { key: 'metaFinal', label: 'Meta Final', color: 'border-orange-200 bg-orange-50/30' },
                { key: 'metaDia', label: 'Meta Dia', color: 'border-slate-200 bg-slate-50/30' },
                { key: 'anoAnterior', label: 'Ano Anterior', color: 'border-slate-200 bg-slate-50/30' },
                { key: 'real', label: 'Real', color: 'border-blue-200 bg-blue-50/30' }
              ].map((section) => (
                <div key={section.key} className={cn("p-4 rounded-2xl border", section.color)}>
                  <h4 className="text-sm font-bold text-slate-700 mb-4">{section.label}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">INSC *</label>
                      <input 
                        type="number" 
                        required 
                        value={newBomDia[section.key as keyof typeof newBomDia].insc}
                        onChange={e => {
                          const val = Number(e.target.value);
                          setNewBomDia({
                            ...newBomDia,
                            [section.key]: { ...(newBomDia[section.key as keyof typeof newBomDia] as BomDiaMetrics), insc: val }
                          });
                        }}
                        className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">MAT FIN *</label>
                      <input 
                        type="number" 
                        required 
                        value={newBomDia[section.key as keyof typeof newBomDia].matFin}
                        onChange={e => {
                          const val = Number(e.target.value);
                          setNewBomDia({
                            ...newBomDia,
                            [section.key]: { ...(newBomDia[section.key as keyof typeof newBomDia] as BomDiaMetrics), matFin: val }
                          });
                        }}
                        className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">MAT ACAD *</label>
                      <input 
                        type="number" 
                        required 
                        value={newBomDia[section.key as keyof typeof newBomDia].matAcad}
                        onChange={e => {
                          const val = Number(e.target.value);
                          setNewBomDia({
                            ...newBomDia,
                            [section.key]: { ...(newBomDia[section.key as keyof typeof newBomDia] as BomDiaMetrics), matAcad: val }
                          });
                        }}
                        className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm"
                      />
                    </div>
                  </div>
                </div>
              ))}

              <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100">
                Salvar Card Bom Dia
              </button>
            </form>
          </section>

          <section className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-xl font-bold text-slate-900">Cards Cadastrados</h3>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {bomDia.map(card => (
                <div key={card.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center">
                  <div>
                    <p className="font-bold text-slate-900">{card.titulo}</p>
                    <p className="text-[10px] text-slate-500">{new Date(card.data).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => {
                        setEditingBomDia(card);
                        setNewBomDia({
                          titulo: card.titulo,
                          metaFinal: card.metaFinal,
                          metaDia: card.metaDia,
                          anoAnterior: card.anoAnterior,
                          real: card.real
                        });
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button 
                      onClick={async () => {
                      if (window.confirm('Deseja excluir este card?')) {
                        try {
                          await deleteDoc(doc(db, COLLECTIONS.BOM_DIA, card.id));
                          onToast("Card removido.");
                        } catch (err: any) {
                          onToast("Erro ao excluir card.", 'error');
                        }
                      }
                    }}
                    className="text-rose-500 hover:bg-rose-50 p-2 rounded-lg transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
            {bomDia.length === 0 && <p className="col-span-full text-center text-slate-400 italic py-8">Nenhum card cadastrado.</p>}
          </div>
          </section>
        </div>
      )}

      {activeTab === 'forecast' && (
        <div className="space-y-8">
          <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-slate-900">{editingForecast ? 'Editar Forecast' : 'Novo Forecast'}</h3>
              {editingForecast && (
                <button 
                  onClick={() => {
                    setEditingForecast(null);
                    setNewForecast({ 
                      nome: '', 
                      dataInicio: new Date().toISOString().split('T')[0], 
                      dataFim: new Date().toISOString().split('T')[0], 
                      metaDiaYTD: 0, 
                      realizado: 0, 
                      metaFechamento: 0 
                    });
                  }}
                  className="text-slate-400 hover:text-slate-600 text-sm font-bold"
                >
                  Cancelar Edição
                </button>
              )}
            </div>
            <form onSubmit={handleAddForecast} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-3">
                <label className="block text-xs font-bold text-slate-500 mb-1">Nome do Forecast</label>
                <input 
                  required
                  value={newForecast.nome} 
                  onChange={e => setNewForecast({...newForecast, nome: e.target.value})} 
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm" 
                  placeholder="Ex: Captação 2024.2"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Data Início</label>
                <input 
                  type="date" 
                  required
                  value={newForecast.dataInicio} 
                  onChange={e => setNewForecast({...newForecast, dataInicio: e.target.value})} 
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Data Final</label>
                <input 
                  type="date" 
                  required
                  value={newForecast.dataFim} 
                  onChange={e => setNewForecast({...newForecast, dataFim: e.target.value})} 
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Meta Dia (YTD)</label>
                <input 
                  type="number" 
                  required
                  value={newForecast.metaDiaYTD} 
                  onChange={e => setNewForecast({...newForecast, metaDiaYTD: Number(e.target.value)})} 
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Realizado</label>
                <input 
                  type="number" 
                  required
                  value={newForecast.realizado} 
                  onChange={e => setNewForecast({...newForecast, realizado: Number(e.target.value)})} 
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Meta Fechamento</label>
                <input 
                  type="number" 
                  required
                  value={newForecast.metaFechamento} 
                  onChange={e => setNewForecast({...newForecast, metaFechamento: Number(e.target.value)})} 
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm" 
                />
              </div>
              <button type="submit" className="md:col-span-3 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-all">
                Criar Forecast
              </button>
            </form>
          </section>

          <section className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-xl font-bold text-slate-900">Forecasts Ativos</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider">
                    <th className="px-4 py-4">Nome</th>
                    <th className="px-4 py-4">Período</th>
                    <th className="px-4 py-4">YTD (Meta Dia)</th>
                    <th className="px-4 py-4">Realizado</th>
                    <th className="px-4 py-4">% YTD</th>
                    <th className="px-4 py-4">Meta Fech.</th>
                    <th className="px-4 py-4">% Fech.</th>
                    <th className="px-4 py-4">Gap Fech.</th>
                    <th className="px-4 py-4">Pacing</th>
                    <th className="px-4 py-4">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {forecast.map(f => {
                    const percYTD = f.metaDiaYTD > 0 ? ((f.realizado / f.metaDiaYTD) * 100).toFixed(1) : '0';
                    const percFech = f.metaFechamento > 0 ? ((f.realizado / f.metaFechamento) * 100).toFixed(1) : '0';
                    const gapFech = f.realizado - f.metaFechamento;
                    
                    const diasRestantes = getWorkingDaysRemaining(f.dataFim);
                    const pacing = f.realizado >= f.metaFechamento ? '0' : (Math.abs(gapFech) / Math.max(1, diasRestantes)).toFixed(1);

                    return (
                      <tr key={f.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-4 font-bold text-slate-900">{f.nome}</td>
                        <td className="px-4 py-4 text-slate-500">
                          {new Date(f.dataInicio).toLocaleDateString('pt-BR')} - {new Date(f.dataFim).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-4 py-4 font-bold text-blue-600">{f.metaDiaYTD}</td>
                        <td className="px-4 py-4 font-bold text-emerald-600">{f.realizado}</td>
                        <td className="px-4 py-4">
                          <span className={`px-2 py-1 rounded-full font-bold ${Number(percYTD) >= 100 ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                            {percYTD}%
                          </span>
                        </td>
                        <td className="px-4 py-4 font-bold text-slate-700">{f.metaFechamento}</td>
                        <td className="px-4 py-4 font-bold text-blue-600">{percFech}%</td>
                        <td className={`px-4 py-4 font-bold ${gapFech >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {gapFech}
                        </td>
                        <td className="px-4 py-4 font-bold text-slate-900">{pacing}/dia</td>
                        <td className="px-4 py-4">
                          <div className="flex items-center space-x-1">
                            <button 
                              onClick={() => {
                                setEditingForecast(f);
                                setNewForecast({
                                  nome: f.nome,
                                  dataInicio: f.dataInicio,
                                  dataFim: f.dataFim,
                                  metaDiaYTD: f.metaDiaYTD,
                                  realizado: f.realizado,
                                  metaFechamento: f.metaFechamento
                                });
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                              }}
                              className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button 
                              onClick={async () => {
                                if (window.confirm('Deseja excluir este forecast?')) {
                                  try {
                                    await deleteDoc(doc(db, COLLECTIONS.FORECAST, f.id));
                                    onToast("Forecast removido.");
                                  } catch (err: any) {
                                    onToast("Erro ao excluir forecast.", 'error');
                                  }
                                }
                              }}
                              className="text-rose-500 hover:bg-rose-50 p-2 rounded-lg transition-all"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      {activeTab === 'planner' && (
        <div className="space-y-8">
          <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 max-w-4xl mx-auto">
            <h3 className="text-xl font-bold text-slate-900 mb-4">Novo Planner</h3>
            <form onSubmit={handleAddPlanner} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Nome do Atendente</label>
                <input 
                  required
                  value={newPlanner.atendenteName} 
                  onChange={e => setNewPlanner({...newPlanner, atendenteName: e.target.value})} 
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Base a ser Trabalhada</label>
                <input 
                  required
                  value={newPlanner.baseName} 
                  onChange={e => setNewPlanner({...newPlanner, baseName: e.target.value})} 
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Dia da Semana</label>
                <select 
                  value={newPlanner.dayOfWeek} 
                  onChange={e => setNewPlanner({...newPlanner, dayOfWeek: e.target.value})} 
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm"
                >
                  {["Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"].map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <button type="submit" className="md:col-span-3 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-all">
                Adicionar ao Planner
              </button>
            </form>
          </section>

          <section className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-xl font-bold text-slate-900">Planner Configurado</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider">
                    <th className="px-4 py-4">Dia</th>
                    <th className="px-4 py-4">Atendente</th>
                    <th className="px-4 py-4">Base</th>
                    <th className="px-4 py-4">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {planner.sort((a, b) => {
                    const days = ["Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado", "Domingo"];
                    return days.indexOf(a.dayOfWeek) - days.indexOf(b.dayOfWeek);
                  }).map(p => (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-4 font-bold text-slate-900">{p.dayOfWeek}</td>
                      <td className="px-4 py-4 text-slate-700">{p.atendenteName}</td>
                      <td className="px-4 py-4 text-slate-500">{p.baseName}</td>
                      <td className="px-4 py-4">
                        <button 
                          onClick={async () => {
                            if (window.confirm('Deseja excluir este item?')) {
                              await deleteDoc(doc(db, COLLECTIONS.PLANNER, p.id));
                              onToast("Item removido.");
                            }
                          }}
                          className="text-rose-500 hover:bg-rose-50 p-2 rounded-lg transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      {activeTab === 'periodo' && (
        <div className="space-y-8">
          <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 max-w-4xl mx-auto">
            <h3 className="text-xl font-bold text-slate-900 mb-4">Novo Período de Captação</h3>
            <form onSubmit={handleAddPeriodo} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-500 mb-1">Nome do Período</label>
                <input 
                  required
                  value={newPeriodo.nome} 
                  onChange={e => setNewPeriodo({...newPeriodo, nome: e.target.value})} 
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm" 
                  placeholder="Ex: 2024.2"
                />
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                <h4 className="text-sm font-bold text-slate-700">Inscrição</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Início</label>
                    <input type="date" required value={newPeriodo.inicioInscricao} onChange={e => setNewPeriodo({...newPeriodo, inicioInscricao: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Fim</label>
                    <input type="date" required value={newPeriodo.fimInscricao} onChange={e => setNewPeriodo({...newPeriodo, fimInscricao: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs" />
                  </div>
                </div>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                <h4 className="text-sm font-bold text-slate-700">Mat Fin</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Início</label>
                    <input type="date" required value={newPeriodo.inicioMatFin} onChange={e => setNewPeriodo({...newPeriodo, inicioMatFin: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Fim</label>
                    <input type="date" required value={newPeriodo.fimMatFin} onChange={e => setNewPeriodo({...newPeriodo, fimMatFin: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs" />
                  </div>
                </div>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                <h4 className="text-sm font-bold text-slate-700">Mat Acad</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Início</label>
                    <input type="date" required value={newPeriodo.inicioMatAcad} onChange={e => setNewPeriodo({...newPeriodo, inicioMatAcad: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Fim</label>
                    <input type="date" required value={newPeriodo.fimMatAcad} onChange={e => setNewPeriodo({...newPeriodo, fimMatAcad: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs" />
                  </div>
                </div>
              </div>
              <button type="submit" className="md:col-span-2 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-all">
                Salvar Período
              </button>
            </form>
          </section>

          <section className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-xl font-bold text-slate-900">Períodos Cadastrados</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider">
                    <th className="px-4 py-4">Nome</th>
                    <th className="px-4 py-4">Inscrição (Dias)</th>
                    <th className="px-4 py-4">Mat Fin (Dias)</th>
                    <th className="px-4 py-4">Mat Acad (Dias)</th>
                    <th className="px-4 py-4">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {periodos.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-4 font-bold text-slate-900">{p.nome}</td>
                      <td className="px-4 py-4">
                        <p className="text-slate-700">{new Date(p.inicioInscricao).toLocaleDateString('pt-BR')} - {new Date(p.fimInscricao).toLocaleDateString('pt-BR')}</p>
                        <p className="text-blue-600 font-bold">{getWorkingDaysBetween(p.inicioInscricao, p.fimInscricao)} dias úteis</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-slate-700">{new Date(p.inicioMatFin).toLocaleDateString('pt-BR')} - {new Date(p.fimMatFin).toLocaleDateString('pt-BR')}</p>
                        <p className="text-blue-600 font-bold">{getWorkingDaysBetween(p.inicioMatFin, p.fimMatFin)} dias úteis</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-slate-700">{new Date(p.inicioMatAcad).toLocaleDateString('pt-BR')} - {new Date(p.fimMatAcad).toLocaleDateString('pt-BR')}</p>
                        <p className="text-blue-600 font-bold">{getWorkingDaysBetween(p.inicioMatAcad, p.fimMatAcad)} dias úteis</p>
                      </td>
                      <td className="px-4 py-4">
                        <button 
                          onClick={async () => {
                            if (window.confirm('Deseja excluir este período?')) {
                              await deleteDoc(doc(db, COLLECTIONS.PERIODO_CAPTACAO, p.id));
                              onToast("Período removido.");
                            }
                          }}
                          className="text-rose-500 hover:bg-rose-50 p-2 rounded-lg transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      {activeTab === 'whatsapp' && (
        <div className="space-y-6">
          <section className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-xl font-bold text-slate-900">Integração Bot ARGO'S</h3>
              <p className="text-slate-500 text-sm">Configure a conexão com a inteligência artificial</p>
            </div>
            <div className="p-6">
              <div className="flex flex-col gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">URL do App Railway (API do Bot)</label>
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      placeholder="https://seu-app-no-railway.app"
                      defaultValue={botConfig.url}
                      onBlur={async (e) => {
                        let newUrl = e.target.value.trim();
                        if (newUrl && !newUrl.startsWith('http://') && !newUrl.startsWith('https://')) {
                          newUrl = `https://${newUrl}`;
                          e.target.value = newUrl;
                        }
                        if (newUrl === botConfig.url) return;
                        try {
                          await setDoc(doc(db, COLLECTIONS.BOT_CONFIG, 'main'), { 
                            url: newUrl,
                            active: botConfig.active || false,
                            updatedAt: serverTimestamp() 
                          }, { merge: true });
                          onToast("URL do Bot atualizada!");
                        } catch (err: any) {
                          onToast(`Erro ao salvar URL: ${err.message}`, 'error');
                        }
                      }}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    />
                    <button 
                      onClick={async () => {
                        if (!botConfig.url) {
                          onToast('Insira uma URL primeiro.', 'error');
                          return;
                        }
                        try {
                          const cleanUrl = botConfig.url.endsWith('/') ? botConfig.url.slice(0, -1) : botConfig.url;
                          const res = await fetch(`${cleanUrl}/api/status`, {
                            method: 'GET'
                          });
                          if (res.ok) {
                            const data = await res.json();
                            onToast(`Servidor online! Status: ${data.name || 'OK'}`, 'success');
                          } else {
                            onToast(`Servidor respondeu com erro ${res.status}.`, 'error');
                          }
                        } catch (e: any) {
                          onToast(`Falha de rede (CORS/Offline): O Railway pode estar reiniciando o bot ou o bot está quebrado. Erro: ${e.message}`, 'error');
                        }
                      }}
                      className="bg-blue-100 text-blue-700 px-4 py-3 rounded-xl hover:bg-blue-200 transition-colors whitespace-nowrap text-sm font-bold"
                    >
                      Testar Conexão
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Insira a URL base do servidor onde seu bot está rodando (ex: https://meubot.up.railway.app).</p>
                </div>
                <div className="pt-4 border-t border-slate-100">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-slate-800">Gestão de Sessões WhatsApp (Multi-Device)</h3>
                    <button
                      onClick={() => {
                         const num = prompt("Digite o número no formato 5511999999999:");
                         if (num) {
                            const cleanUrl = botConfig.url.endsWith('/') ? botConfig.url.slice(0, -1) : botConfig.url;
                            fetch(`${cleanUrl}/api/connect`, {
                               method: 'POST',
                               headers: { 'Content-Type': 'application/json' },
                               body: JSON.stringify({ botNumber: num.replace(/\D/g, '') })
                            }).then(() => onToast('Solicitação enviada. Aguarde o QRCode/Pairing Code.'))
                              .catch(() => onToast('Erro ao enviar solicitação para API no Railway', 'error'));
                         }
                      }}
                      className="bg-green-600 text-white text-xs px-3 py-2 rounded-lg font-bold hover:bg-green-700 transition"
                    >
                      + Novo Número
                    </button>
                  </div>
                  
                  {Object.keys(botStatuses || {}).length === 0 ? (
                    <p className="text-sm text-slate-500 italic">Nenhum número conectado ou conectando. Adicione um clicando no botão acima.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       {Object.entries(botStatuses || {}).map(([botNumber, info]) => (
                         <div key={botNumber} className="border border-slate-200 rounded-xl p-4 flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                              <div className="font-bold text-slate-700 text-lg">{botNumber}</div>
                              <span className={`px-2 py-1 rounded-full text-xs font-bold ${info?.status === 'online' ? 'bg-green-100 text-green-700' : info?.status === 'pairing' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}`}>
                                 {info?.status?.toUpperCase() || 'DESCONHECIDO'}
                              </span>
                            </div>
                            
                            {info?.status === 'pairing' && (info?.pairingCode || info?.qrUrl) && (
                              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 mt-2 text-center flex flex-col gap-4 items-center">
                                 {info?.qrUrl && (
                                    <div>
                                       <p className="text-xs text-slate-500 mb-2">Escaneie o QR Code:</p>
                                       <img src={info.qrUrl} alt="QR Code WhatsApp" className="mx-auto rounded" />
                                    </div>
                                 )}
                                 
                                 {info?.pairingCode && (
                                    <div>
                                       <p className="text-xs text-slate-500 mb-1">{info?.qrUrl ? 'Ou use' : 'Use'} o Pairing Code:</p>
                                       <p className="text-2xl tracking-widest font-mono font-bold text-slate-800">{info.pairingCode}</p>
                                    </div>
                                 )}
                              </div>
                            )}

                            {info?.status === 'online' && (
                              <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
                                <span className="text-xs font-bold text-slate-600">Auto-Reply (IA)</span>
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={async () => {
                                      const newActive = !(info as any)?.active;
                                      
                                      // Optimistic update
                                      setBotStatuses(prev => ({
                                        ...prev,
                                        [botNumber]: {
                                          ...prev[botNumber],
                                          active: newActive
                                        }
                                      }));
                                      
                                      try {
                                        const cleanUrl = botConfig.url.endsWith('/') ? botConfig.url.slice(0, -1) : botConfig.url;
                                        const res = await fetch(`${cleanUrl}/api/toggle`, {
                                          method: 'POST',
                                          headers: { 'Content-Type': 'application/json' },
                                          body: JSON.stringify({ botNumber, active: newActive })
                                        });
                                        if (res.ok) {
                                          onToast(`IA para ${botNumber} alterada para ${newActive ? 'ON' : 'OFF'}`);
                                        } else {
                                          onToast(`Erro ao alterar IA. API pode estar indisponível.`, 'error');
                                          // Revert back
                                          setBotStatuses(prev => ({
                                            ...prev,
                                            [botNumber]: {
                                              ...prev[botNumber],
                                              active: !newActive
                                            }
                                          }));
                                        }
                                      } catch (e) {
                                        onToast(`Erro de rede ao alterar IA para ${botNumber}.`, 'error');
                                        // Revert back
                                        setBotStatuses(prev => ({
                                          ...prev,
                                          [botNumber]: {
                                            ...prev[botNumber],
                                            active: !newActive
                                          }
                                        }));
                                      }
                                    }}
                                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${(info as any)?.active ? 'bg-blue-600' : 'bg-slate-200'}`}
                                  >
                                    <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${(info as any)?.active ? 'translate-x-5' : 'translate-x-1'}`} />
                                  </button>
                                  <span className="text-[10px] text-slate-500">
                                     {(info as any)?.active ? 'ON' : 'OFF'}
                                  </span>
                                </div>
                              </div>
                            )}
                         </div>
                       ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-xl font-bold text-slate-900">Mensagens Padrão do WhatsApp</h3>
              <p className="text-slate-500 text-sm">Gerencie múltiplos modelos de mensagens para cada categoria</p>
            </div>
          <div className="p-6 space-y-12">
            {[
              { id: 'historico', label: 'Histórico', multi: true },
              { id: 'bases', label: 'Bases', multi: true },
              { id: 'gap', label: 'GAP Acadêmico', multi: false, subLabels: ['Padrão', 'Matrícula Acadêmica OK'] },
              { id: 'fiesProuni', label: 'Fies/Prouni', multi: false, subLabels: ['Padrão', 'Matrícula Acadêmica OK'] }
            ].map(tipo => {
              const messages = whatsappMessages.filter(m => m.tipo === tipo.id);
              
              if (tipo.multi) {
                return (
                  <div key={tipo.id} className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider">{tipo.label}</h4>
                      <button 
                        onClick={async () => {
                          try {
                            await addDoc(collection(db, COLLECTIONS.WHATSAPP_MESSAGES), { 
                              tipo: tipo.id, 
                              texto: '', 
                              createdAt: serverTimestamp() 
                            });
                            onToast("Novo modelo adicionado!");
                          } catch (err: any) {
                            onToast("Erro ao adicionar modelo.", 'error');
                          }
                        }}
                        className="text-blue-600 hover:text-blue-700 text-xs font-bold flex items-center space-x-1"
                      >
                        <Plus size={14} />
                        <span>Novo Modelo</span>
                      </button>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                      {messages.map((msg, idx) => (
                        <div key={msg.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 relative group">
                          <label className="block text-[10px] font-bold text-slate-400 mb-1">MODELO {idx + 1}</label>
                          <textarea 
                            defaultValue={msg.texto}
                            onBlur={async (e) => {
                              const novoTexto = e.target.value;
                              if (novoTexto === msg.texto) return;
                              try {
                                await updateDoc(doc(db, COLLECTIONS.WHATSAPP_MESSAGES, msg.id), { texto: novoTexto, updatedAt: serverTimestamp() });
                                onToast("Modelo atualizado!");
                              } catch (err: any) {
                                onToast("Erro ao salvar.", 'error');
                              }
                            }}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm min-h-[100px]"
                          />
                          <button 
                            onClick={async () => {
                              if (window.confirm('Excluir este modelo?')) {
                                await deleteDoc(doc(db, COLLECTIONS.WHATSAPP_MESSAGES, msg.id));
                                onToast("Modelo removido.");
                              }
                            }}
                            className="absolute top-4 right-4 text-rose-400 opacity-0 group-hover:opacity-100 transition-all hover:text-rose-600"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }

              return (
                <div key={tipo.id} className="space-y-4">
                  <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider">{tipo.label}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {tipo.subLabels?.map((label, idx) => {
                      // We'll use a specific identifier for GAP/FiesProuni subtypes
                      const subtypeId = `${tipo.id}_${idx}`;
                      const msg = whatsappMessages.find(m => m.tipo === subtypeId);
                      return (
                        <div key={subtypeId} className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                          <label className="block text-xs font-bold text-slate-500 mb-2">{label}</label>
                          <textarea 
                            defaultValue={msg?.texto || ''}
                            onBlur={async (e) => {
                              const novoTexto = e.target.value;
                              if (novoTexto === (msg?.texto || '')) return;
                              try {
                                if (msg) {
                                  await updateDoc(doc(db, COLLECTIONS.WHATSAPP_MESSAGES, msg.id), { texto: novoTexto, updatedAt: serverTimestamp() });
                                } else {
                                  await addDoc(collection(db, COLLECTIONS.WHATSAPP_MESSAGES), { tipo: subtypeId, texto: novoTexto, createdAt: serverTimestamp() });
                                }
                                onToast("Mensagem atualizada!");
                              } catch (err: any) {
                                onToast("Erro ao salvar.", 'error');
                              }
                            }}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm min-h-[120px]"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            <p className="text-[10px] text-slate-400 mt-2 italic text-center">Dica: Use [nome] para inserir o nome do lead automaticamente.</p>
          </div>
        </section>
        </div>
      )}

      {activeTab === 'treinamento' && (
        <section className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden max-w-4xl mx-auto">
          <div className="p-6 border-b border-slate-100">
            <h3 className="text-xl font-bold text-slate-900">Treinamento do Bot</h3>
            <p className="text-slate-500 text-sm">Insira o texto sobre a sua empresa para refinar as respostas da IA.</p>
          </div>
          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Contexto da Empresa</label>
              <textarea 
                placeholder="Insira aqui informações sobre preços, cursos, política da empresa..."
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm min-h-[300px]"
                defaultValue={botConfig.trainingContext || ''}
                onBlur={async (e) => {
                  const newContext = e.target.value.trim();
                  if (newContext === botConfig.trainingContext) return;
                  try {
                    await setDoc(doc(db, COLLECTIONS.BOT_CONFIG, 'main'), { 
                      trainingContext: newContext,
                      updatedAt: serverTimestamp() 
                    }, { merge: true });
                    onToast("Treinamento do Bot atualizado!");
                  } catch (err: any) {
                    onToast(`Erro ao salvar treinamento: ${err.message}`, 'error');
                  }
                }}
              />
              <p className="text-xs text-slate-400 mt-2">Dica: Quanto mais claro e objetivo for o texto, melhores serão as respostas da IA.</p>
            </div>
            
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center text-center">
               <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
                  {isProcessingPdf ? (
                    <span className="animate-spin text-xl font-bold">...</span>
                  ) : (
                    <span className="font-bold text-xl">PDF</span>
                  )}
               </div>
               <h4 className="font-bold text-slate-800 mb-2">Treinamento via PDF</h4>
               <p className="text-xs text-slate-500 max-w-sm mb-4">Faça o upload de um arquivo PDF para extrair o texto automaticamente e anexá-lo ao contexto da empresa.</p>
               <label className="cursor-pointer bg-blue-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-blue-700 transition-colors">
                 {isProcessingPdf ? "Processando..." : "Selecionar PDF"}
                 <input type="file" accept=".pdf" className="hidden" onChange={handlePdfUpload} disabled={isProcessingPdf} />
               </label>
            </div>
          </div>
        </section>
      )}

      {activeTab === 'links' && (
        <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 max-w-2xl mx-auto">
          <h3 className="text-xl font-bold text-slate-900 mb-4">Links Úteis</h3>
          <form onSubmit={handleAddLink} className="flex gap-2 mb-6">
            <input 
              placeholder="Nome" 
              required 
              value={newLink.nome}
              onChange={e => setNewLink({...newLink, nome: e.target.value})}
              className="flex-1 px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            />
            <input 
              placeholder="URL" 
              required 
              value={newLink.url}
              onChange={e => setNewLink({...newLink, url: e.target.value})}
              className="flex-1 px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            />
            <button type="submit" className="bg-blue-600 text-white p-2 rounded-xl hover:bg-blue-700 transition-all">
              <Plus size={20} />
            </button>
          </form>
          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
            {links.map(l => (
              <div key={l.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-sm font-bold text-slate-700">{l.nome}</span>
                <button 
                  onClick={async () => {
                    await deleteDoc(doc(db, COLLECTIONS.LINKS, l.id));
                    onToast("Link removido.");
                  }}
                  className="text-rose-500 hover:bg-rose-50 p-2 rounded-lg transition-all"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {activeTab === 'backup' && (
        <section className="bg-rose-50 p-6 rounded-3xl border border-rose-100 max-w-2xl mx-auto">
          <h3 className="text-xl font-bold text-rose-900 mb-4">Backup e Segurança</h3>
          <p className="text-sm text-rose-600 mb-6">
            Gere um arquivo JSON contendo todos os dados do sistema para segurança ou migração.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <button 
              onClick={handleBackup}
              className="flex-1 bg-white text-rose-600 border border-rose-200 font-bold py-3 rounded-2xl hover:bg-rose-100 transition-all flex items-center justify-center space-x-2"
            >
              <Download size={20} />
              <span>Gerar Backup</span>
            </button>
            <button 
              className="flex-1 bg-rose-600 text-white font-bold py-3 rounded-2xl hover:bg-rose-700 transition-all flex items-center justify-center space-x-2"
            >
              <Upload size={20} />
              <span>Restaurar Dados</span>
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
