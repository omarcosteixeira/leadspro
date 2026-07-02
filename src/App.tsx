import React, { useState, useEffect, useMemo } from "react";
import { initializeApp, getApp } from "firebase/app";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updatePassword,
  updateProfile,
  getAuth,
  User,
} from "firebase/auth";
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
  getDocs,
  writeBatch,
} from "firebase/firestore";
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
  User as UserIcon,
  TrendingUp,
  Calendar,
  Download,
  Upload,
  Menu,
  X,
  Check,
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
  Bell,
  Monitor,
  Maximize,
  Cloud,
  RefreshCw,
  Play,
  Pause,
  ChevronUp,
  ChevronDown,
  Target,
  Cake,
  CheckSquare,
  Square,
  Coins,
  BookOpen,
  Briefcase,
  Boxes,
  Smartphone,
  Chrome,
  BarChart3,
  List,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import {
  auth,
  db,
  COLLECTIONS,
  handleFirestoreError,
  OperationType,
  secondaryAuth,
  firebaseConfigPrincipal,
  firebaseConfigComercial,
} from "./firebase";
import {
  cn,
  formatPhone,
  getWhatsAppUrl,
  validateCPF,
  formatCPF,
} from "./lib/utils";
import * as XLSX from "xlsx";
import { EmailMarketingView } from "./components/EmailMarketingView";
import { RelatoriosView } from "./components/RelatoriosView";
import { ControleConcorrenciaView } from "./components/ControleConcorrenciaView";
import Mapa3D from "./components/Mapa3D";
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
  BotConfig,
  MetaDia,
  QgLigacao,
  SolicitacaoFolga,
  CursoDisponivel,
  InsumoPedido,
  InsumoEstoque,
  InsumoBaixa,
  InsumoPedidoComercial,
  InsumoEstoqueComercial,
  IsencaoEntry,
  ControleConcorrencia,
} from "./types";
import { ProfileModal } from "./components/ProfileModal";
import { PublicRegistrationForm } from "./components/PublicRegistrationForm";
import { PublicInsumoForm } from "./components/PublicInsumoForm";
import { MessageTemplateModal } from "./components/MessageTemplateModal";
import { CursosDisponiveisView } from "./components/CursosDisponiveisView";
import { ControleInsumosView } from "./components/ControleInsumosView";
import { ControleInsumosComercialView } from "./components/ControleInsumosComercialView";
import { WhatsAppMessageEditor } from "./components/WhatsAppMessageEditor";
import { AdminFuncionariosView } from "./components/AdminFuncionariosView";
import { IsencoesView } from "./components/IsencoesView";
import { WhatsAppMessageSelector } from "./components/WhatsAppMessageSelector";
import { MultiSelect } from "./components/MultiSelect";

// --- Helpers ---
export const replaceMessageVariables = (
  template: string,
  lead: any,
): string => {
  if (!template) return "";
  let text = template;
  text = text.replace(/\[nome\]/gi, lead.nome || "");
  text = text.replace(/\[curso\]/gi, lead.curso || lead.cursoInteresse || "");
  text = text.replace(/\[matr[ií]cula\]/gi, lead.numeroMatricula || "");

  // Novas variáveis
  text = text.replace(
    /\[unidade\]/gi,
    lead.unidade || lead.nome_unidade || "nossa unidade",
  );
  text = text.replace(
    /\[data_contato\]/gi,
    new Date().toLocaleDateString("pt-BR"),
  );

  const hour = new Date().getHours();
  const saudacao =
    hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
  text = text.replace(/\[saudacao\]/gi, saudacao);

  if (lead.missingDocs) {
    text = text.replace(
      /\[pendencias\]/gi,
      Array.isArray(lead.missingDocs)
        ? lead.missingDocs.join(", ")
        : lead.missingDocs,
    );
  }

  return text;
};

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
    const workbook = XLSX.read(bstr, { type: "binary" });
    const worksheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[worksheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);
    callback(data);
  };
  reader.readAsBinaryString(file);
};

// Component WhatsAppMessageSelector moved to src/components/WhatsAppMessageSelector.tsx

// --- Constants ---
const HOLIDAYS = [
  "2024-01-01",
  "2024-03-29",
  "2024-04-21",
  "2024-05-01",
  "2024-05-30",
  "2024-07-09",
  "2024-09-07",
  "2024-10-12",
  "2024-11-02",
  "2024-11-15",
  "2024-11-20",
  "2024-12-25",
  "2025-01-01",
  "2025-04-18",
  "2025-04-21",
  "2025-05-01",
  "2025-06-19",
  "2025-09-07",
  "2025-10-12",
  "2025-11-02",
  "2025-11-15",
  "2025-11-20",
  "2025-12-25",
  "2026-01-01",
  "2026-04-03",
  "2026-04-21",
  "2026-05-01",
  "2026-06-04",
  "2026-09-07",
  "2026-10-12",
  "2026-11-02",
  "2026-11-15",
  "2026-11-20",
  "2026-12-25",
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
    const dateString = curDate.toISOString().split("T")[0];
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
    const dateString = curDate.toISOString().split("T")[0];
    const isSunday = dayOfWeek === 0;
    const isHoliday = HOLIDAYS.includes(dateString);

    if (!isSunday && !isHoliday) {
      count++;
    }
    curDate.setDate(curDate.getDate() + 1);
  }
  return count;
};

const formatLocalDateString = (dateStr: string) => {
  if (!dateStr) return "";
  const dateOnly = dateStr.split("T")[0];
  if (dateOnly.includes("-")) {
    const parts = dateOnly.split("-");
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
  }
  return dateStr;
};

export const ROLES: Record<string, UserRole> = {
  ADMIN_MASTER: "Admin Master",
  PROMOTOR: "Promotor",
  FDV: "FDV",
  SALA_MATRICULA: "Sala de Matrícula",
  QG: "QG",
  LIDER_FDV: "Líder/FDV",
  SSA: "SSA",
  GESTOR_UNIDADE: "Gestor Unidade",
  GESTOR_COMERCIAL: "Gestor Comercial",
  ACADEMICO: "Acadêmico",
  PROMOTOR_RUA: "Promotor/rua",
  GESTOR_COMERCIAL_COMERCIAL: "Gerente Comercial (Comercial)",
  FDV_COMERCIAL: "FDV (Comercial)",
  FINANCEIRO: "Financeiro",
  TECNICO: "Técnico",
};

const VIEW_PERMISSIONS: Record<string, UserRole[]> = {
  dashboard: [
    ROLES.ADMIN_MASTER,
    ROLES.FDV,
    ROLES.SALA_MATRICULA,
    ROLES.QG,
    ROLES.LIDER_FDV,
    ROLES.SSA,
    ROLES.GESTOR_UNIDADE,
    ROLES.GESTOR_COMERCIAL,
    ROLES.ACADEMICO,
    ROLES.GESTOR_COMERCIAL_COMERCIAL,
    ROLES.FDV_COMERCIAL,
    ROLES.FINANCEIRO,
    ROLES.TECNICO,
  ],
  relatorios: [
    ROLES.ADMIN_MASTER,
    ROLES.LIDER_FDV,
    ROLES.GESTOR_UNIDADE,
    ROLES.GESTOR_COMERCIAL,
    ROLES.GESTOR_COMERCIAL_COMERCIAL,
  ],
  cadastro: [
    ROLES.ADMIN_MASTER,
    ROLES.PROMOTOR,
    ROLES.FDV,
    ROLES.SALA_MATRICULA,
    ROLES.QG,
    ROLES.LIDER_FDV,
    ROLES.GESTOR_UNIDADE,
    ROLES.GESTOR_COMERCIAL,
    ROLES.PROMOTOR_RUA,
    ROLES.FDV_COMERCIAL,
    ROLES.GESTOR_COMERCIAL_COMERCIAL,
  ],
  historico: [
    ROLES.ADMIN_MASTER,
    ROLES.FDV,
    ROLES.SALA_MATRICULA,
    ROLES.QG,
    ROLES.LIDER_FDV,
    ROLES.GESTOR_COMERCIAL,
    ROLES.FDV_COMERCIAL,
    ROLES.GESTOR_COMERCIAL_COMERCIAL,
  ],
  bases: [ROLES.ADMIN_MASTER, ROLES.SALA_MATRICULA, ROLES.QG, ROLES.LIDER_FDV],
  gap: [ROLES.ADMIN_MASTER, ROLES.SALA_MATRICULA, ROLES.LIDER_FDV],
  fiesProuni: [
    ROLES.ADMIN_MASTER,
    ROLES.SALA_MATRICULA,
    ROLES.LIDER_FDV,
    ROLES.SSA,
  ],
  campanhas: [
    ROLES.ADMIN_MASTER,
    ROLES.FDV,
    ROLES.SALA_MATRICULA,
    ROLES.QG,
    ROLES.LIDER_FDV,
    ROLES.SSA,
    ROLES.GESTOR_UNIDADE,
    ROLES.GESTOR_COMERCIAL,
    ROLES.ACADEMICO,
    ROLES.GESTOR_COMERCIAL_COMERCIAL,
    ROLES.FDV_COMERCIAL,
    ROLES.FINANCEIRO,
    ROLES.TECNICO,
  ],
  calendario: [
    ROLES.ADMIN_MASTER,
    ROLES.FDV,
    ROLES.SALA_MATRICULA,
    ROLES.LIDER_FDV,
    ROLES.GESTOR_UNIDADE,
    ROLES.GESTOR_COMERCIAL,
    ROLES.FDV_COMERCIAL,
    ROLES.GESTOR_COMERCIAL_COMERCIAL,
  ],
  empresas: [
    ROLES.ADMIN_MASTER,
    ROLES.FDV,
    ROLES.SALA_MATRICULA,
    ROLES.LIDER_FDV,
    ROLES.GESTOR_UNIDADE,
    ROLES.GESTOR_COMERCIAL,
    ROLES.FDV_COMERCIAL,
    ROLES.GESTOR_COMERCIAL_COMERCIAL,
  ],
  calculo: [
    ROLES.ADMIN_MASTER,
    ROLES.FDV,
    ROLES.SALA_MATRICULA,
    ROLES.QG,
    ROLES.LIDER_FDV,
    ROLES.GESTOR_UNIDADE,
    ROLES.GESTOR_COMERCIAL,
    ROLES.PROMOTOR,
    ROLES.SSA,
    ROLES.FDV_COMERCIAL,
    ROLES.GESTOR_COMERCIAL_COMERCIAL,
  ],
  mapao: [
    ROLES.ADMIN_MASTER,
    ROLES.FDV,
    ROLES.SALA_MATRICULA,
    ROLES.QG,
    ROLES.LIDER_FDV,
    ROLES.SSA,
    ROLES.GESTOR_UNIDADE,
    ROLES.GESTOR_COMERCIAL,
    ROLES.ACADEMICO,
    ROLES.GESTOR_COMERCIAL_COMERCIAL,
    ROLES.FDV_COMERCIAL,
    ROLES.FINANCEIRO,
    ROLES.TECNICO,
  ],
  basesDisparo: [
    ROLES.ADMIN_MASTER,
    ROLES.LIDER_FDV,
    ROLES.SALA_MATRICULA,
    ROLES.QG,
    ROLES.FDV,
    ROLES.GESTOR_UNIDADE,
    ROLES.GESTOR_COMERCIAL,
  ],
  basesRenovacao: [ROLES.ADMIN_MASTER, ROLES.LIDER_FDV, ROLES.SSA],
  avisos: [
    ROLES.ADMIN_MASTER,
    ROLES.FDV,
    ROLES.SALA_MATRICULA,
    ROLES.QG,
    ROLES.LIDER_FDV,
    ROLES.SSA,
    ROLES.GESTOR_UNIDADE,
    ROLES.GESTOR_COMERCIAL,
    ROLES.PROMOTOR,
    ROLES.ACADEMICO,
  ],
  emailMarketing: [
    ROLES.ADMIN_MASTER,
    ROLES.LIDER_FDV,
    ROLES.GESTOR_COMERCIAL,
    ROLES.GESTOR_COMERCIAL_COMERCIAL,
  ],
  controleConcorrencia: [
    ROLES.ADMIN_MASTER,
    ROLES.LIDER_FDV,
    ROLES.GESTOR_COMERCIAL,
    ROLES.GESTOR_COMERCIAL_COMERCIAL,
    ROLES.GESTOR_UNIDADE,
    ROLES.FDV,
    ROLES.FDV_COMERCIAL,
    ROLES.SALA_MATRICULA,
    ROLES.QG,
    ROLES.PROMOTOR,
    ROLES.PROMOTOR_RUA,
    ROLES.FINANCEIRO,
  ],
  admin: [
    ROLES.ADMIN_MASTER,
    ROLES.LIDER_FDV,
    ROLES.GESTOR_COMERCIAL_COMERCIAL,
    ROLES.GESTOR_COMERCIAL,
  ],
  controlePagamentos: [
    ROLES.ADMIN_MASTER,
    ROLES.LIDER_FDV,
    ROLES.GESTOR_COMERCIAL,
    ROLES.GESTOR_COMERCIAL_COMERCIAL,
    ROLES.FDV_COMERCIAL,
    ROLES.GESTOR_UNIDADE,
  ],
  cursos: [
    ROLES.ADMIN_MASTER,
    ROLES.FDV,
    ROLES.SALA_MATRICULA,
    ROLES.QG,
    ROLES.LIDER_FDV,
    ROLES.SSA,
    ROLES.GESTOR_UNIDADE,
    ROLES.GESTOR_COMERCIAL,
    ROLES.ACADEMICO,
    ROLES.GESTOR_COMERCIAL_COMERCIAL,
    ROLES.FDV_COMERCIAL,
    ROLES.FINANCEIRO,
    ROLES.TECNICO,
  ],
  controleInsumos: [
    ROLES.ADMIN_MASTER,
    ROLES.ACADEMICO,
    ROLES.FINANCEIRO,
    ROLES.TECNICO,
  ],
  controleInsumosComercial: [
    ROLES.ADMIN_MASTER,
    ROLES.FDV_COMERCIAL,
    ROLES.GESTOR_COMERCIAL_COMERCIAL,
  ],
  isencoes: [
    ROLES.ADMIN_MASTER,
    ROLES.SALA_MATRICULA,
    ROLES.LIDER_FDV,
    ROLES.SSA,
    ROLES.QG,
    ROLES.FDV,
    ROLES.GESTOR_UNIDADE,
    ROLES.GESTOR_COMERCIAL,
    ROLES.FDV_COMERCIAL,
    ROLES.GESTOR_COMERCIAL_COMERCIAL,
  ],
};

// --- Components ---
function PasswordChangeModal({ onComplete }: { onComplete: () => void }) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
    setError("");
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
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          Troca de Senha Obrigatória
        </h2>
        <p className="text-slate-500 mb-6">
          Para sua segurança, você deve alterar sua senha padrão antes de
          continuar.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">
              Nova Senha
            </label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Mínimo 6 caracteres"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">
              Confirmar Nova Senha
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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
            {loading ? "Atualizando..." : "Atualizar Senha"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

const Toast = ({
  message,
  type,
  onClose,
}: {
  message: string;
  type: "success" | "error";
  onClose: () => void;
}) => (
  <motion.div
    initial={{ x: 100, opacity: 0 }}
    animate={{ x: 0, opacity: 1 }}
    exit={{ x: 100, opacity: 0 }}
    className={cn(
      "fixed top-5 right-5 z-50 p-4 rounded-lg shadow-lg flex items-center space-x-2 text-white",
      type === "success" ? "bg-emerald-600" : "bg-rose-600",
    )}
  >
    {type === "success" ? (
      <CheckCircle2 size={20} />
    ) : (
      <AlertCircle size={20} />
    )}
    <span className="font-medium">{message}</span>
    <button onClick={onClose} className="ml-2 hover:opacity-80">
      <X size={16} />
    </button>
  </motion.div>
);

function MapaoAcademicoView({
  mapao,
  onToast,
  profile,
}: {
  mapao: MapaoAcademicoEntry[];
  onToast: (m: string, t?: "success" | "error") => void;
  profile: UserProfile;
}) {
  const [showModal, setShowModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<MapaoAcademicoEntry | null>(
    null,
  );

  const defaultDisciplina = {
    codDisc: "",
    disciplina: "",
    dia: "Segunda-feira",
    horario: "",
    turma: "",
    tipoDisciplina: "PRESENCIAL",
    professor: "",
    matricula: "",
    observacao: "",
    linkAula: "",
  };

  const [formData, setFormData] = useState<Partial<MapaoAcademicoEntry>>({
    modalidade: "Presencial",
    tipoCurso: "GRADUACAO",
    periodo: "",
    disciplinas: [{ ...defaultDisciplina }],
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    const isDuplicate = mapao.some(
      (m) =>
        m.curso?.toLowerCase() === formData.curso?.toLowerCase() &&
        m.modalidade === formData.modalidade &&
        m.periodo === formData.periodo &&
        m.id !== editingEntry?.id,
    );

    if (isDuplicate) {
      onToast(
        "Este curso/modalidade/período já está cadastrado no Mapão.",
        "error",
      );
      return;
    }

    try {
      if (editingEntry) {
        await updateDoc(doc(db, COLLECTIONS.MAPAO_ACADEMICO, editingEntry.id), {
          ...formData,
          createdAt: serverTimestamp(),
        });
        onToast("Registro atualizado!");
      } else {
        await addDoc(collection(db, COLLECTIONS.MAPAO_ACADEMICO), {
          ...formData,
          createdAt: serverTimestamp(),
        });
        onToast("Registro cadastrado!");
      }
      setShowModal(false);
      setEditingEntry(null);
      setFormData({
        modalidade: "Presencial",
        tipoCurso: "GRADUACAO",
        disciplinas: [{ ...defaultDisciplina }],
      });
    } catch (err: any) {
      onToast("Erro ao salvar.", "error");
    }
  };

  const handleDuplicate = async (entry: MapaoAcademicoEntry) => {
    try {
      const { id, ...data } = entry;
      await addDoc(collection(db, COLLECTIONS.MAPAO_ACADEMICO), {
        ...data,
        createdAt: serverTimestamp(),
      });
      onToast("Registro duplicado!");
    } catch (err: any) {
      onToast("Erro ao duplicar.", "error");
    }
  };

  const handleAddDisciplina = () => {
    if (formData.disciplinas && formData.disciplinas.length < 7) {
      setFormData((prev) => ({
        ...prev,
        disciplinas: [...(prev.disciplinas || []), { ...defaultDisciplina }],
      }));
    }
  };

  const handleRemoveDisciplina = (index: number) => {
    const newDisciplinas = [...(formData.disciplinas || [])];
    newDisciplinas.splice(index, 1);
    setFormData((prev) => ({ ...prev, disciplinas: newDisciplinas }));
  };

  const handleChangeDisciplina = (
    index: number,
    field: string,
    value: string,
  ) => {
    const newDisciplinas: any = [...(formData.disciplinas || [])];
    newDisciplinas[index][field] = value;
    if (field === "dia" && value === "Virtual") {
      newDisciplinas[index].horario = "";
    }
    setFormData((prev) => ({ ...prev, disciplinas: newDisciplinas }));
  };

  const canEdit =
    profile.role === ROLES.LIDER_FDV || profile.role === ROLES.ACADEMICO;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
            Mapão Acadêmico
          </h2>
          <p className="text-sm text-slate-500">
            Gestão de cursos, disciplinas e horários
          </p>
        </div>
        {canEdit && (
          <button
            onClick={() => {
              setEditingEntry(null);
              setFormData({
                modalidade: "Presencial",
                tipoCurso: "GRADUACAO",
                disciplinas: [{ ...defaultDisciplina }],
              });
              setShowModal(true);
            }}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center space-x-2"
          >
            <Plus size={20} />
            <span>Novo Cadastro</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {mapao.map((entry) => {
          const disciplinasList = entry.disciplinas || [];

          return (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "p-5 rounded-3xl border shadow-sm transition-all relative group flex flex-col",
                entry.tipoCurso === "GRADUACAO"
                  ? "bg-white border-blue-100"
                  : "bg-white border-emerald-100",
              )}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex gap-2">
                  <span
                    className={cn(
                      "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                      entry.tipoCurso === "GRADUACAO"
                        ? "bg-blue-100 text-blue-600"
                        : "bg-emerald-100 text-emerald-600",
                    )}
                  >
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
                            disciplinas:
                              disciplinasList.length > 0
                                ? disciplinasList
                                : [{ ...defaultDisciplina }],
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
                        onClick={async () => {
                          if (window.confirm("Excluir?"))
                            await deleteDoc(
                              doc(db, COLLECTIONS.MAPAO_ACADEMICO, entry.id),
                            );
                        }}
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
                  <h3 className="text-xl font-bold text-slate-900 leading-tight mb-1">
                    {entry.curso}
                  </h3>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">
                    {entry.periodo}
                  </p>
                </div>
                <div className="w-2/3 grid grid-cols-2 gap-3">
                  {disciplinasList.map((disc, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex flex-col justify-between"
                    >
                      <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                          {disc.codDisc}
                        </p>
                        <p className="text-sm font-bold text-slate-800 leading-tight mb-2">
                          {disc.disciplina}
                        </p>
                        <p className="text-[10px] text-slate-600 font-medium">
                          Prof: {disc.professor}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <div className="flex items-center space-x-1.5 text-slate-600 bg-white px-2 py-1 rounded-lg border border-slate-100">
                          <Clock size={10} className="text-blue-500" />
                          <span className="text-[9px] font-bold truncate">
                            {disc.horario}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1.5 text-slate-600 bg-white px-2 py-1 rounded-lg border border-slate-100">
                          <Users size={10} className="text-emerald-500" />
                          <span className="text-[9px] font-bold truncate">
                            {disc.turma}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {disciplinasList.length === 0 && (
                  <p className="text-xs text-slate-500 italic text-center py-4">
                    Nenhuma disciplina cadastrada.
                  </p>
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
              <h3 className="text-2xl font-bold text-slate-900">
                {editingEntry ? "Editar Curso" : "Novo Cadastro Acadêmico"}
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-slate-100 rounded-full transition-all text-slate-400"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-slate-100">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">
                    Período
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-700"
                    value={formData.periodo || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, periodo: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">
                    Tipo de Curso
                  </label>
                  <select
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-700"
                    value={formData.tipoCurso}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        tipoCurso: e.target.value as any,
                      })
                    }
                    required
                  >
                    <option value="GRADUACAO">GRADUAÇÃO</option>
                    <option value="TECNICO">TÉCNICO</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">
                    Modalidade
                  </label>
                  <select
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-700"
                    value={formData.modalidade}
                    onChange={(e) =>
                      setFormData({ ...formData, modalidade: e.target.value })
                    }
                    required
                  >
                    <option value="Presencial">Presencial</option>
                    <option value="EAD">EAD</option>
                    <option value="Semipresencial">Semipresencial</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">
                    Nome do Curso
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-700"
                    value={formData.curso || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, curso: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-bold text-slate-800 text-lg">
                    Disciplinas do Curso
                  </h4>
                  {(formData.disciplinas?.length || 0) < 7 && (
                    <button
                      type="button"
                      onClick={handleAddDisciplina}
                      className="text-sm flex items-center gap-1 text-blue-600 hover:text-blue-700 font-bold bg-blue-50 px-3 py-1.5 rounded-xl"
                    >
                      <Plus size={16} /> Adicionar (
                      {formData.disciplinas?.length || 0}/7)
                    </button>
                  )}
                </div>

                <div className="space-y-4">
                  {formData.disciplinas?.map((disc, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-50 border border-slate-200 p-5 rounded-2xl relative"
                    >
                      {formData.disciplinas &&
                        formData.disciplinas.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveDisciplina(idx)}
                            className="absolute top-4 right-4 text-rose-400 hover:text-rose-600 hover:bg-rose-50 p-1.5 rounded-lg transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      <h5 className="text-xs font-bold uppercase text-slate-400 mb-4">
                        Disciplina {idx + 1}
                      </h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">
                            Código
                          </label>
                          <input
                            type="text"
                            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 outline-none text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500"
                            value={disc.codDisc}
                            onChange={(e) =>
                              handleChangeDisciplina(
                                idx,
                                "codDisc",
                                e.target.value,
                              )
                            }
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">
                            Disciplina
                          </label>
                          <input
                            type="text"
                            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 outline-none text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500"
                            value={disc.disciplina}
                            onChange={(e) =>
                              handleChangeDisciplina(
                                idx,
                                "disciplina",
                                e.target.value,
                              )
                            }
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">
                            Dia da Semana
                          </label>
                          <select
                            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 outline-none text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500"
                            value={disc.dia}
                            onChange={(e) =>
                              handleChangeDisciplina(idx, "dia", e.target.value)
                            }
                            required
                          >
                            {[
                              "Segunda-feira",
                              "Terça-feira",
                              "Quarta-feira",
                              "Quinta-feira",
                              "Sexta-feira",
                              "Sábado",
                              "Virtual",
                            ].map((d) => (
                              <option key={d} value={d}>
                                {d}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">
                            Horário{" "}
                            {disc.dia === "Virtual" ? "(Não se aplica)" : ""}
                          </label>
                          <input
                            type="text"
                            placeholder={
                              disc.dia === "Virtual"
                                ? "Virtual"
                                : "Ex: 19:00 - 22:00"
                            }
                            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 outline-none text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:bg-slate-100"
                            value={disc.horario}
                            onChange={(e) =>
                              handleChangeDisciplina(
                                idx,
                                "horario",
                                e.target.value,
                              )
                            }
                            required={disc.dia !== "Virtual"}
                            disabled={disc.dia === "Virtual"}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">
                            Turma
                          </label>
                          <input
                            type="text"
                            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 outline-none text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500"
                            value={disc.turma}
                            onChange={(e) =>
                              handleChangeDisciplina(
                                idx,
                                "turma",
                                e.target.value,
                              )
                            }
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">
                            Tipo Disciplina
                          </label>
                          <select
                            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 outline-none text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500"
                            value={disc.tipoDisciplina}
                            onChange={(e) =>
                              handleChangeDisciplina(
                                idx,
                                "tipoDisciplina",
                                e.target.value,
                              )
                            }
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
                  {editingEntry ? "Salvar Alterações" : "Cadastrar"}
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

function BasesDisparoView({
  bases,
  onToast,
}: {
  bases: BaseDisparoEntry[];
  onToast: (m: string, t?: "success" | "error") => void;
}) {
  const [showModal, setShowModal] = useState(false);
  const [filterDate, setFilterDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [formData, setFormData] = useState<Partial<BaseDisparoEntry>>({
    data: new Date().toISOString().split("T")[0],
    totalDisparos: 0,
    positivos: 0,
    negativos: 0,
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, COLLECTIONS.BASES_DISPARO), {
        ...formData,
        createdAt: serverTimestamp(),
      });
      onToast("Base registrada!");
      setShowModal(false);
      setFormData({
        data: new Date().toISOString().split("T")[0],
        totalDisparos: 0,
        positivos: 0,
        negativos: 0,
      });
    } catch (err: any) {
      onToast("Erro ao registrar.", "error");
    }
  };

  const filteredBases = bases.filter((b) => b.data === filterDate);

  const totalDisparos = filteredBases.reduce(
    (acc, b) => acc + b.totalDisparos,
    0,
  );
  const totalPositivos = filteredBases.reduce((acc, b) => acc + b.positivos, 0);
  const totalNegativos = filteredBases.reduce((acc, b) => acc + b.negativos, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
            Bases de Disparo
          </h2>
          <p className="text-sm text-slate-500">
            Métricas diárias de disparos e conversão
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <input
            type="date"
            className="px-4 py-2.5 rounded-2xl border border-slate-200 text-sm font-bold text-slate-700"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
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
          <p className="text-xs font-bold text-slate-400 uppercase mb-1">
            Total de Disparos
          </p>
          <p className="text-3xl font-black text-blue-600">{totalDisparos}</p>
        </div>
        <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100 shadow-sm">
          <p className="text-xs font-bold text-emerald-500 uppercase mb-1">
            Total Positivos
          </p>
          <p className="text-3xl font-black text-emerald-600">
            {totalPositivos}
          </p>
          <p className="text-xs font-bold text-emerald-500 mt-2">
            Taxa:{" "}
            {totalDisparos > 0
              ? ((totalPositivos / totalDisparos) * 100).toFixed(1)
              : 0}
            %
          </p>
        </div>
        <div className="bg-rose-50 p-6 rounded-3xl border border-rose-100 shadow-sm">
          <p className="text-xs font-bold text-rose-500 uppercase mb-1">
            Total Negativos
          </p>
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
              {filteredBases.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-900">
                    {b.nomeBase}
                  </td>
                  <td className="px-6 py-4 font-bold text-blue-600">
                    {b.totalDisparos}
                  </td>
                  <td className="px-6 py-4 font-bold text-emerald-600">
                    {b.positivos}
                  </td>
                  <td className="px-6 py-4 font-bold text-rose-600">
                    {b.negativos}
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-700">
                    {b.totalDisparos > 0
                      ? ((b.positivos / b.totalDisparos) * 100).toFixed(1)
                      : 0}
                    %
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={async () => {
                        if (window.confirm("Excluir?"))
                          await deleteDoc(
                            doc(db, COLLECTIONS.BASES_DISPARO, b.id),
                          );
                      }}
                      className="text-rose-500 hover:bg-rose-100 p-2 rounded-xl transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredBases.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-slate-400 italic"
                  >
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
              <h3 className="text-2xl font-bold text-slate-900">
                Registrar Métricas da Base
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-slate-100 rounded-full transition-all text-slate-400"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">
                  Data do Disparo
                </label>
                <input
                  type="date"
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-700"
                  value={formData.data}
                  onChange={(e) =>
                    setFormData({ ...formData, data: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">
                  Nome da Base
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-700"
                  value={formData.nomeBase}
                  onChange={(e) =>
                    setFormData({ ...formData, nomeBase: e.target.value })
                  }
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">
                    Total
                  </label>
                  <input
                    type="number"
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-700"
                    value={formData.totalDisparos}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        totalDisparos: Number(e.target.value),
                      })
                    }
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">
                    Positivos
                  </label>
                  <input
                    type="number"
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-700"
                    value={formData.positivos}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        positivos: Number(e.target.value),
                      })
                    }
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">
                    Negativos
                  </label>
                  <input
                    type="number"
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-700"
                    value={formData.negativos}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        negativos: Number(e.target.value),
                      })
                    }
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

const StatCard = ({
  title,
  value,
  icon: Icon,
  color,
  trend,
}: {
  title: string;
  value: string | number;
  icon: any;
  color: string;
  trend?: string;
}) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
    <div>
      <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">
        {title}
      </p>
      <p className="text-3xl font-bold text-slate-900">{value}</p>
      {trend && (
        <p className="text-xs text-emerald-600 font-medium mt-1 flex items-center">
          <TrendingUp size={12} className="mr-1" /> {trend}
        </p>
      )}
    </div>
    <div className={cn("p-4 rounded-2xl", color)}>
      <Icon size={24} className="text-white" />
    </div>
  </div>
);

// --- Main App ---

function CampanhasView({
  campanhas,
  onToast,
}: {
  campanhas: Campanha[];
  onToast: (m: string, t?: "success" | "error") => void;
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [editingCampanha, setEditingCampanha] = useState<Campanha | null>(null);
  const [selectedCampanha, setSelectedCampanha] = useState<Campanha | null>(
    null,
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [startDateFilter, setStartDateFilter] = useState("");
  const [endDateFilter, setEndDateFilter] = useState("");

  const getEffectiveStatus = (camp: Campanha) => {
    const today = new Date().toISOString().split("T")[0];
    if (today < camp.dataInicio) return "Pendente";
    if (today > camp.dataFim) return "Finalizada";
    return "Ativa";
  };

  const filteredCampanhas = useMemo(() => {
    return campanhas.filter((camp) => {
      const effectiveStatus = getEffectiveStatus(camp);
      const matchesSearch = camp.nome
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesStatus = !statusFilter || effectiveStatus === statusFilter;

      let matchesDate = true;
      if (startDateFilter && endDateFilter) {
        matchesDate =
          camp.dataInicio <= endDateFilter && camp.dataFim >= startDateFilter;
      } else if (startDateFilter) {
        matchesDate = camp.dataFim >= startDateFilter;
      } else if (endDateFilter) {
        matchesDate = camp.dataInicio <= endDateFilter;
      }
      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [campanhas, searchTerm, statusFilter, startDateFilter, endDateFilter]);

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const payload = {
      nome: formData.get("nome") as string,
      dataInicio: formData.get("dataInicio") as string,
      dataFim: formData.get("dataFim") as string,
      objetivo: formData.get("objetivo") as string,
      updatedAt: serverTimestamp(),
    };

    const isDuplicate = campanhas.some(
      (c) =>
        c.nome.toLowerCase() === payload.nome.toLowerCase() &&
        c.id !== editingCampanha?.id,
    );
    if (isDuplicate) {
      onToast("Já existe uma campanha com este nome.", "error");
      return;
    }

    try {
      if (editingCampanha) {
        await updateDoc(
          doc(db, COLLECTIONS.CAMPANHAS, editingCampanha.id),
          payload,
        );
        onToast("Campanha atualizada!");
      } else {
        await addDoc(collection(db, COLLECTIONS.CAMPANHAS), {
          ...payload,
          createdAt: serverTimestamp(),
        });
        onToast("Campanha criada!");
      }
      setIsModalOpen(false);
      setEditingCampanha(null);
    } catch (err: any) {
      handleFirestoreError(err, OperationType.WRITE, COLLECTIONS.CAMPANHAS);
      onToast("Erro ao salvar campanha.", "error");
    }
  };

  const handleExport = () => {
    const data = filteredCampanhas.map((c) => ({
      Nome: c.nome,
      "Data Início": c.dataInicio,
      "Data Fim": c.dataFim,
      Status: c.status,
      Objetivo: c.objetivo,
    }));
    exportToExcel(data, "Campanhas");
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    importFromExcel(file, async (data) => {
      try {
        const getVal = (row: any, ...keys: string[]) => {
          const rowKeys = Object.keys(row);
          for (const key of keys) {
            const foundKey = rowKeys.find(k => k.toLowerCase() === key.toLowerCase());
            if (foundKey && row[foundKey] !== undefined) return row[foundKey];
          }
          return undefined;
        };

        const batch = data.map((item) => {
          const rawStatus = String(getVal(item, "Status", "status") || "").trim().toLowerCase();
          const finalStatus = rawStatus === "ativa" ? "Ativa" : rawStatus === "inativa" ? "Inativa" : rawStatus === "pendente" ? "Pendente" : "Ativa";

          return {
            nome: String(getVal(item, "Nome", "nome") || "").trim(),
            dataInicio: String(getVal(item, "Data Início", "dataInicio", "data_inicio") || "").trim(),
            dataFim: String(getVal(item, "Data Fim", "dataFim", "data_fim") || "").trim(),
            status: finalStatus,
            objetivo: String(getVal(item, "Objetivo", "objetivo") || "").trim(),
            createdAt: serverTimestamp(),
          };
        });

        let imported = 0;
        let skipped = 0;
        const inserted = new Set();
        for (const entry of batch) {
          if (!entry.nome) continue;
          const isDup =
            campanhas.some((c) => c.nome.trim().toLowerCase() === entry.nome.toLowerCase()) ||
            Array.from(inserted).some((name: any) => String(name).toLowerCase() === entry.nome.toLowerCase());
          if (!isDup) {
            await addDoc(collection(db, COLLECTIONS.CAMPANHAS), entry);
            inserted.add(entry.nome);
            imported++;
          } else {
            skipped++;
          }
        }
        onToast(
          `${imported} campanhas importadas! ${skipped > 0 ? `${skipped} ignoradas.` : ""}`,
        );
      } catch (err: any) {
        onToast("Erro ao importar campanhas.", "error");
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Campanhas</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => {
              setEditingCampanha(null);
              setIsModalOpen(true);
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center space-x-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
          >
            <Plus size={20} />
            <span>Nova Campanha</span>
          </button>
          <label className="bg-blue-50 text-blue-600 px-4 py-2 rounded-xl flex items-center space-x-2 hover:bg-blue-100 transition-all text-sm font-bold cursor-pointer">
            <Upload size={18} />
            <span>Importar</span>
            <input
              type="file"
              accept=".xlsx, .xls"
              onChange={handleImport}
              className="hidden"
            />
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
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            size={18}
          />
          <input
            type="text"
            placeholder="Buscar por nome..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
        >
          <option value="">Todos os Status</option>
          <option value="Ativa">Ativa</option>
          <option value="Pendente">Pendente</option>
          <option value="Finalizada">Finalizada</option>
        </select>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Período:
          </span>
          <input
            type="date"
            value={startDateFilter}
            onChange={(e) => setStartDateFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-semibold text-slate-600"
            title="Data de Início"
          />
          <span className="text-slate-400 text-xs font-bold">até</span>
          <input
            type="date"
            value={endDateFilter}
            onChange={(e) => setEndDateFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-semibold text-slate-600"
            title="Data de Fim"
          />
          {(startDateFilter || endDateFilter) && (
            <button
              onClick={() => {
                setStartDateFilter("");
                setEndDateFilter("");
              }}
              className="text-xs font-bold text-red-500 hover:text-red-700 hover:underline transition-all cursor-pointer px-2"
            >
              Limpar
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCampanhas.map((camp) => {
          const effectiveStatus = getEffectiveStatus(camp);
          return (
            <div
              key={camp.id}
              className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between cursor-pointer hover:shadow-md transition-all"
              onClick={() => {
                setSelectedCampanha(camp);
                setIsDetailModalOpen(true);
              }}
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-bold text-slate-900">
                    {camp.nome}
                  </h3>
                  <span
                    className={cn(
                      "px-2 py-1 rounded-full text-[10px] font-bold uppercase",
                      effectiveStatus === "Ativa"
                        ? "bg-emerald-100 text-emerald-600"
                        : effectiveStatus === "Pendente"
                          ? "bg-blue-100 text-blue-600"
                          : "bg-slate-100 text-slate-600",
                    )}
                  >
                    {effectiveStatus}
                  </span>
                </div>
                <p className="text-sm text-slate-500 mb-4 line-clamp-2">
                  {camp.objetivo}
                </p>
                <div className="flex items-center space-x-4 text-xs text-slate-400">
                  <div className="flex items-center space-x-1">
                    <Calendar size={14} />
                    <span>
                      {camp.dataInicio} - {camp.dataFim}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {filteredCampanhas.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-400 italic">
            Nenhuma campanha encontrada.
          </div>
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
              <h2 className="text-2xl font-bold text-slate-900">
                {selectedCampanha.nome}
              </h2>
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase">
                    Período
                  </p>
                  <p className="text-sm text-slate-700">
                    {selectedCampanha.dataInicio} - {selectedCampanha.dataFim}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase">
                    Objetivo
                  </p>
                  <p className="text-sm text-slate-700">
                    {selectedCampanha.objetivo}
                  </p>
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
                  onClick={() => {
                    setEditingCampanha(selectedCampanha);
                    setIsDetailModalOpen(false);
                    setIsModalOpen(true);
                  }}
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
                  {editingCampanha ? "Editar Campanha" : "Nova Campanha"}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleSave} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    Nome da Campanha
                  </label>
                  <input
                    name="nome"
                    defaultValue={editingCampanha?.nome}
                    required
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">
                      Início
                    </label>
                    <input
                      type="date"
                      name="dataInicio"
                      defaultValue={editingCampanha?.dataInicio}
                      required
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">
                      Fim
                    </label>
                    <input
                      type="date"
                      name="dataFim"
                      defaultValue={editingCampanha?.dataFim}
                      required
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    Status
                  </label>
                  <select
                    name="status"
                    defaultValue={editingCampanha?.status || "Ativa"}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="Ativa">Ativa</option>
                    <option value="Pausada">Pausada</option>
                    <option value="Finalizada">Finalizada</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    Objetivo
                  </label>
                  <textarea
                    name="objetivo"
                    defaultValue={editingCampanha?.objetivo}
                    rows={3}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
                >
                  {editingCampanha ? "Salvar Alterações" : "Criar Campanha"}
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
  onMassSendBot,
}: {
  data: FiesProuniEntry[];
  onToast: (m: string, t?: "success" | "error") => void;
  profile: UserProfile;
  whatsappMessages: WhatsAppMessage[];
  periodos: PeriodoCaptacao[];
  botConfig: BotConfig;
  onSendBot: (tel: string, msg: string) => void;
  onMassSendBot: (messages: { telefone: string; message: string }[]) => void;
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [periodoFilter, setPeriodoFilter] = useState("");
  const [tipoFilter, setTipoFilter] = useState("");
  const [listaFilter, setListaFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [bolsaFilter, setBolsaFilter] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<FiesProuniEntry | null>(
    null,
  );
  const [cpfInput, setCpfInput] = useState("");

  const isAdmin = profile.role === ROLES.LIDER_FDV;

  useEffect(() => {
    if (editingEntry) {
      setCpfInput(formatCPF(editingEntry.cpf));
    } else {
      setCpfInput("");
    }
  }, [editingEntry, isModalOpen]);

  const filteredData = data.filter((item) => {
    // Gestor Unidade filtering
    if (profile.role === "Gestor Unidade") {
      if (!profile.unidade || item.unidade !== profile.unidade) {
        return false;
      }
    }

    const matchesSearch =
      item.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.cpf.includes(searchTerm) ||
      item.curso.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.lista &&
        item.lista.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.responsavelEntrevista &&
        item.responsavelEntrevista
          .toLowerCase()
          .includes(searchTerm.toLowerCase())) ||
      (item.status &&
        item.status.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesPeriodo = !periodoFilter || item.periodo === periodoFilter;
    const matchesTipo = !tipoFilter || item.tipo === tipoFilter;
    const matchesLista = !listaFilter || item.lista === listaFilter;
    const matchesStatus = !statusFilter || item.status === statusFilter;
    const matchesBolsa = !bolsaFilter || item.bolsa === bolsaFilter;
    return (
      matchesSearch &&
      matchesPeriodo &&
      matchesTipo &&
      matchesLista &&
      matchesStatus &&
      matchesBolsa
    );
  });

  const uniqueListas = Array.from(
    new Set(data.map((i) => i.lista).filter(Boolean)),
  ).sort();
  const uniqueStatuses = Array.from(
    new Set(data.map((i) => i.status).filter(Boolean)),
  ).sort();

  const stats = {
    total: filteredData.length,
    pendentes: filteredData.filter((i) => i.docsEntreguesStatus === "Pendente")
      .length,
    parcial: filteredData.filter((i) => i.docsEntreguesStatus === "Parcial")
      .length,
    entregaram: filteredData.filter((i) => i.docsEntreguesStatus === "Sim")
      .length,
    comInscricao: filteredData.filter((i) => i.inscricaoSales).length,
    comMatricula: filteredData.filter((i) => i.numeroMatricula).length,
    emAnalise: filteredData.filter((i) => i.digitalizaStatus === "Em Análise")
      .length,
    concluido: filteredData.filter((i) => i.digitalizaStatus === "Concluído")
      .length,
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const cpf = formData.get("cpf") as string;

    if (!validateCPF(cpf)) {
      onToast("CPF inválido. Por favor, verifique os 11 dígitos.", "error");
      return;
    }

    const cleanCpf = cpf.replace(/\D/g, "");
    const isDuplicate = data.some(
      (item) => item.cpf === cleanCpf && item.id !== editingEntry?.id,
    );
    if (isDuplicate) {
      onToast("Este CPF já está cadastrado no FIES/Prouni.", "error");
      return;
    }

    const payload = {
      nome: formData.get("nome") as string,
      cpf: cpf.replace(/\D/g, ""), // Store only digits
      telefone: formData.get("telefone") as string,
      email: formData.get("email") as string,
      endereco: formData.get("endereco") as string,
      status: formData.get("status") as string,
      tipo: formData.get("tipo") as "FIES" | "PROUNI",
      bolsa: formData.get("bolsa") as "Parcial" | "Total",
      metodologia: formData.get("metodologia") as string,
      curso: formData.get("curso") as string,
      inscricaoSales: formData.get("inscricaoSales") as string,
      numeroMatricula: formData.get("numeroMatricula") as string,
      tcbAssinado: formData.get("tcbAssinado") === "on",
      digitalizaStatus: formData.get("digitalizaStatus") as any,
      docsEntreguesStatus: formData.get("docsEntreguesStatus") as any,
      sisprouniStatus: formData.get("sisprouniStatus") as any,
      responsavelEntrevista: formData.get("responsavelEntrevista") as string,
      dataEntrevista: formData.get("dataEntrevista") as string,
      observacao: formData.get("observacao") as string,
      periodo: formData.get("periodo") as string,
      lista: formData.get("lista") as string,
      posicaoRanking: formData.get("posicaoRanking") as string,
      documentosEntregues:
        (formData.get("documentos") as string)
          ?.split(",")
          .map((s) => s.trim())
          .filter(Boolean) || [],
      updatedAt: serverTimestamp(),
    };

    try {
      if (editingEntry) {
        await updateDoc(
          doc(db, COLLECTIONS.FIES_PROUNI, editingEntry.id),
          payload,
        );
        onToast("Registro atualizado!");
      } else {
        await addDoc(collection(db, COLLECTIONS.FIES_PROUNI), {
          ...payload,
          unidade: profile.unidade || "",
          createdAt: serverTimestamp(),
        });
        onToast("Registro cadastrado!");
      }
      setIsModalOpen(false);
      setEditingEntry(null);
    } catch (err: any) {
      handleFirestoreError(err, OperationType.WRITE, COLLECTIONS.FIES_PROUNI);
      onToast("Erro ao salvar registro.", "error");
    }
  };

  const handleExport = () => {
    const exportData = filteredData.map((item) => ({
      Nome: item.nome,
      CPF: item.cpf,
      Telefone: item.telefone || "",
      Email: item.email || "",
      Endereço: item.endereco || "",
      Status: item.status || "",
      Tipo: item.tipo,
      Bolsa: item.bolsa,
      Curso: item.curso,
      Ranking: item.posicaoRanking || "",
      Lista: item.lista || "",
      Periodo: item.periodo || "",
      Metodologia: item.metodologia || "",
      "Responsável Entrevista": item.responsavelEntrevista || "",
      "Data Entrevista": item.dataEntrevista || "",
      "Status Docs": item.docsEntreguesStatus || "",
      "Inscrição Sales": item.inscricaoSales || "",
      "Número Matrícula": item.numeroMatricula || "",
      "Status Digitaliza": item.digitalizaStatus,
      SISPROUNI: item.sisprouniStatus || "Pendente",
      "TCB Assinado": item.tcbAssinado ? "Sim" : "Não",
      "Documentos Entregues": item.documentosEntregues?.join(", ") || "",
      Observação: item.observacao || "",
    }));
    exportToExcel(exportData, "Fies_Prouni");
  };

  const [selectedEntries, setSelectedEntries] = useState<string[]>([]);

  const handleBulkDelete = async () => {
    if (selectedEntries.length === 0) return;
    if (
      window.confirm(
        `Deseja excluir ${selectedEntries.length} registros Fies/Prouni selecionados?`,
      )
    ) {
      try {
        for (const id of selectedEntries) {
          await deleteDoc(doc(db, COLLECTIONS.FIES_PROUNI, id));
        }
        onToast(`${selectedEntries.length} registros removidos.`);
        setSelectedEntries([]);
      } catch (err: any) {
        onToast("Erro ao excluir registros.", "error");
      }
    }
  };

  const handleDeleteIndividual = async (id: string) => {
    if (window.confirm("Deseja excluir este registro?")) {
      try {
        await deleteDoc(doc(db, COLLECTIONS.FIES_PROUNI, id));
        onToast("Registro removido.");
      } catch (err: any) {
        onToast("Erro ao excluir registro.", "error");
      }
    }
  };

  const toggleSelect = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedEntries([...selectedEntries, id]);
    } else {
      setSelectedEntries(selectedEntries.filter((s) => s !== id));
    }
  };

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedEntries(filteredData.map((b) => b.id));
    } else {
      setSelectedEntries([]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">
          Acompanhamento Fies/Prouni
        </h2>
        <div className="flex space-x-2">
          <button
            onClick={() => {
              setEditingEntry(null);
              setIsModalOpen(true);
            }}
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
        <StatCard
          title="Total Candidatos"
          value={stats.total}
          icon={Users}
          color="bg-blue-500"
        />
        <StatCard
          title="Pendentes Doc"
          value={stats.pendentes}
          icon={AlertCircle}
          color="bg-red-500"
        />
        <StatCard
          title="Docs Parciais"
          value={stats.parcial}
          icon={Clock}
          color="bg-amber-500"
        />
        <StatCard
          title="Docs Entregues"
          value={stats.entregaram}
          icon={CheckCircle2}
          color="bg-green-500"
        />
        <StatCard
          title="Com Inscrição"
          value={stats.comInscricao}
          icon={FileText}
          color="bg-indigo-500"
        />
        <StatCard
          title="Com Matrícula"
          value={stats.comMatricula}
          icon={GraduationCap}
          color="bg-purple-500"
        />
        <StatCard
          title="Em Análise"
          value={stats.emAnalise}
          icon={Clock}
          color="bg-amber-500"
        />
        <StatCard
          title="Docs OK"
          value={stats.concluido}
          icon={ShieldCheck}
          color="bg-emerald-500"
        />
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px] relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={18}
          />
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
          {periodos.map((p) => (
            <option key={p.id} value={p.nome}>
              {p.nome}
            </option>
          ))}
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
          {uniqueListas.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
        <select
          className="px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">Todos os Status</option>
          {uniqueStatuses.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4">
                  <input
                    type="checkbox"
                    checked={
                      selectedEntries.length === filteredData.length &&
                      filteredData.length > 0
                    }
                    onChange={(e) => toggleSelectAll(e.target.checked)}
                  />
                </th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">
                  Candidato
                </th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">
                  Lista/Status
                </th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">
                  Tipo/Bolsa
                </th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">
                  Curso/Metodologia
                </th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">
                  Documentação
                </th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">
                  Digitaliza
                </th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">
                  TCB
                </th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600 flex items-center gap-4">
                  {selectedEntries.length > 0 && (
                    <button
                      onClick={handleBulkDelete}
                      className="text-rose-600 font-bold hover:underline"
                    >
                      excluir selecionados
                    </button>
                  )}
                  {selectedEntries.length > 0 && botConfig.url && (
                    <button
                      onClick={() => {
                        const selectedObjs = data.filter((g) =>
                          selectedEntries.includes(g.id),
                        );
                        const payloads = selectedObjs.map((item) => {
                          const isMatAcadOk =
                            item.numeroMatricula &&
                            item.numeroMatricula.trim().length > 0;
                          const type = isMatAcadOk
                            ? "fiesProuni_1"
                            : "fiesProuni_0";
                          const msgTemplate = whatsappMessages.find(
                            (m) => m.tipo === type || m.tipo === "fiesProuni",
                          );
                          const text = msgTemplate
                            ? replaceMessageVariables(msgTemplate.texto, item)
                            : `Olá ${item.nome}, tudo bem?`;
                          return {
                            telefone: item.telefone,
                            message: text,
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
                <tr
                  key={item.id}
                  className="hover:bg-gray-50/50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedEntries.includes(item.id)}
                      onChange={(e) => toggleSelect(item.id, e.target.checked)}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{item.nome}</div>
                    <div className="text-[10px] font-bold text-indigo-500">
                      Ranking: {item.posicaoRanking || "-"}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatCPF(item.cpf)}
                    </div>
                    <div className="text-xs text-gray-400">{item.periodo}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-bold text-indigo-600">
                      {item.lista || "-"}
                    </div>
                    <div className="text-[10px] text-slate-500 uppercase font-bold">
                      {item.status || "Sem Status"}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-bold ${item.tipo === "FIES" ? "bg-blue-100 text-blue-700" : "bg-orange-100 text-orange-700"}`}
                    >
                      {item.tipo}
                    </span>
                    <div className="text-xs text-gray-500 mt-1">
                      {item.bolsa}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-700">{item.curso}</div>
                    <div className="text-xs text-gray-500">
                      {item.metodologia}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                        item.docsEntreguesStatus === "Sim"
                          ? "bg-green-100 text-green-700"
                          : item.docsEntreguesStatus === "Parcial"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-red-100 text-red-700"
                      }`}
                    >
                      {item.docsEntreguesStatus || "Pendente"}
                    </span>
                    <div className="text-[10px] text-slate-400 mt-1">
                      {item.documentosEntregues?.length || 0} docs
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        item.digitalizaStatus === "Concluído"
                          ? "bg-green-100 text-green-700"
                          : item.digitalizaStatus === "Em Análise"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-gray-100 text-gray-600"
                      }`}
                    >
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
                        onClick={() => {
                          setEditingEntry(item);
                          setIsModalOpen(true);
                        }}
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
                                const isMatAcadOk =
                                  item.numeroMatricula &&
                                  item.numeroMatricula.trim().length > 0;
                                const type = isMatAcadOk
                                  ? "fiesProuni_1"
                                  : "fiesProuni_0";
                                const msgObj = whatsappMessages.find(
                                  (m) =>
                                    m.tipo === type || m.tipo === "fiesProuni",
                                );
                                const msg = replaceMessageVariables(
                                  msgObj
                                    ? msgObj.texto
                                    : `Olá [nome], tudo bem?`,
                                  item,
                                );
                                onSendBot(item.telefone, msg);
                              }}
                              className="text-blue-600 hover:text-blue-800 p-2 hover:bg-blue-50 rounded-lg transition-all"
                              title="Enviar pelo Bot ARGO'S"
                            >
                              <Bot size={18} />
                            </button>
                          )}
                          <a
                            href={getWhatsAppUrl(
                              item.telefone,
                              (() => {
                                const isMatAcadOk =
                                  item.numeroMatricula &&
                                  item.numeroMatricula.trim().length > 0;
                                const type = isMatAcadOk
                                  ? "fiesProuni_1"
                                  : "fiesProuni_0";
                                const msg = whatsappMessages.find(
                                  (m) =>
                                    m.tipo === type || m.tipo === "fiesProuni",
                                );
                                if (msg)
                                  return replaceMessageVariables(
                                    msg.texto,
                                    item,
                                  );
                                return `Olá ${item.nome}, tudo bem?`;
                              })(),
                            )}
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
                  {editingEntry
                    ? "Editar Registro"
                    : "Novo Cadastro Fies/Prouni"}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleSave} className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nome Completo
                    </label>
                    <input
                      name="nome"
                      defaultValue={editingEntry?.nome}
                      required
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      CPF
                    </label>
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Telefone
                    </label>
                    <input
                      name="telefone"
                      defaultValue={editingEntry?.telefone}
                      onChange={(e) => {
                        e.target.value = formatPhone(e.target.value);
                      }}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      name="email"
                      type="email"
                      defaultValue={editingEntry?.email}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Endereço
                    </label>
                    <input
                      name="endereco"
                      defaultValue={editingEntry?.endereco}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      name="status"
                      defaultValue={editingEntry?.status || "Pendente"}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="Pendente">Pendente</option>
                      <option value="Aprovado">Aprovado</option>
                      <option value="Reprovado">Reprovado</option>
                      <option value="Em Análise">Em Análise</option>
                      <option value="Desistente">Desistente</option>
                      <option value="Não compareceu">Não compareceu</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo
                    </label>
                    <select
                      name="tipo"
                      defaultValue={editingEntry?.tipo || "PROUNI"}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="FIES">FIES</option>
                      <option value="PROUNI">PROUNI</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bolsa
                    </label>
                    <select
                      name="bolsa"
                      defaultValue={editingEntry?.bolsa || "Total"}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="Total">Total</option>
                      <option value="Parcial">Parcial</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Período
                    </label>
                    <input
                      name="periodo"
                      defaultValue={editingEntry?.periodo}
                      placeholder="Ex: 2025.1"
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Lista
                    </label>
                    <input
                      name="lista"
                      defaultValue={editingEntry?.lista}
                      placeholder="Ex: Lista 1"
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Posição no Ranking
                    </label>
                    <input
                      name="posicaoRanking"
                      defaultValue={editingEntry?.posicaoRanking}
                      placeholder="Ex: 15º"
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Curso
                    </label>
                    <input
                      name="curso"
                      defaultValue={editingEntry?.curso}
                      required
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Metodologia
                    </label>
                    <input
                      name="metodologia"
                      defaultValue={editingEntry?.metodologia}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Inscrição Sales
                    </label>
                    <input
                      name="inscricaoSales"
                      defaultValue={editingEntry?.inscricaoSales}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Número Matrícula
                    </label>
                    <input
                      name="numeroMatricula"
                      defaultValue={editingEntry?.numeroMatricula}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status Digitaliza
                    </label>
                    <select
                      name="digitalizaStatus"
                      defaultValue={
                        editingEntry?.digitalizaStatus || "Não Postado"
                      }
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="Não Postado">Não Postado</option>
                      <option value="Em Análise">Em Análise</option>
                      <option value="Concluído">Concluído</option>
                      <option value="Documento reprovado">
                        Documento reprovado
                      </option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status Documentos
                    </label>
                    <select
                      name="docsEntreguesStatus"
                      defaultValue={
                        editingEntry?.docsEntreguesStatus || "Pendente"
                      }
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="Pendente">Pendente</option>
                      <option value="Parcial">Parcial</option>
                      <option value="Sim">Sim (Tudo Entregue)</option>
                      <option value="Não compareceu">Não compareceu</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      SISPROUNI
                    </label>
                    <select
                      name="sisprouniStatus"
                      defaultValue={editingEntry?.sisprouniStatus || "Pendente"}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="Pendente">Pendente</option>
                      <option value="Aprovado">Aprovado</option>
                      <option value="Reprovado">Reprovado</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Responsável Entrevista
                    </label>
                    <input
                      name="responsavelEntrevista"
                      defaultValue={
                        editingEntry?.responsavelEntrevista || profile.name
                      }
                      readOnly={!isAdmin}
                      className={`w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 ${!isAdmin ? "bg-slate-50 text-slate-500" : ""}`}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Data Entrevista
                    </label>
                    <input
                      name="dataEntrevista"
                      type="date"
                      defaultValue={
                        editingEntry?.dataEntrevista ||
                        new Date().toISOString().split("T")[0]
                      }
                      readOnly={!isAdmin}
                      className={`w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 ${!isAdmin ? "bg-slate-50 text-slate-500" : ""}`}
                    />
                  </div>
                  <div className="flex items-center space-x-2 pt-8">
                    <input
                      type="checkbox"
                      name="tcbAssinado"
                      defaultChecked={editingEntry?.tcbAssinado}
                      className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                    />
                    <label className="text-sm font-medium text-gray-700">
                      TCB Assinado
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Documentos Entregues (separados por vírgula)
                  </label>
                  <input
                    name="documentos"
                    defaultValue={editingEntry?.documentosEntregues?.join(", ")}
                    placeholder="Ex: RG, CPF, Diploma"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Observações / O que falta
                  </label>
                  <textarea
                    name="observacao"
                    defaultValue={editingEntry?.observacao}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="pt-4">
                  <button
                    type="submit"
                    className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
                  >
                    {editingEntry ? "Salvar Alterações" : "Cadastrar Candidato"}
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
  const [currentView, setCurrentView] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("view") || "cadastro";
  });
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [insumosBaixas, setInsumosBaixas] = useState<InsumoBaixa[]>([]);
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Data States
  const [leads, setLeads] = useState<Lead[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [bases, setBases] = useState<BaseEntry[]>([]);
  const [gap, setGap] = useState<GapEntry[]>([]);
  const [isencoes, setIsencoes] = useState<IsencaoEntry[]>([]);
  const [fiesProuni, setFiesProuni] = useState<FiesProuniEntry[]>([]);
  const [campanhas, setCampanhas] = useState<Campanha[]>([]);
  const [bomDia, setBomDia] = useState<BomDiaCaptacao[]>([]);
  const [forecast, setForecast] = useState<ForecastCaptacao[]>([]);
  const [metaDia, setMetaDia] = useState<MetaDia[]>([]);
  const [qgLigacoes, setQgLigacoes] = useState<QgLigacao[]>([]);
  const [planner, setPlanner] = useState<PlannerTask[]>([]);
  const [periodos, setPeriodos] = useState<PeriodoCaptacao[]>([]);
  const [calendarioAcoes, setCalendarioAcoes] = useState<CalendarioAcao[]>([]);
  const [empresasParceiras, setEmpresasParceiras] = useState<EmpresaParceira[]>(
    [],
  );
  const [controleConcorrencia, setControleConcorrencia] = useState<ControleConcorrencia[]>([]);
  const [whatsappMessages, setWhatsappMessages] = useState<WhatsAppMessage[]>(
    [],
  );
  const [links, setLinks] = useState<LinkUtil[]>([]);
  const [mapao, setMapao] = useState<MapaoAcademicoEntry[]>([]);
  const [basesDisparo, setBasesDisparo] = useState<BaseDisparoEntry[]>([]);
  const [basesRenovacao, setBasesRenovacao] = useState<BaseEntry[]>([]);
  const [cursos, setCursos] = useState<CursoDisponivel[]>([]);
  const [insumosPedidos, setInsumosPedidos] = useState<InsumoPedido[]>([]);
  const [insumosEstoque, setInsumosEstoque] = useState<InsumoEstoque[]>([]);
  const [insumosPedidosComercial, setInsumosPedidosComercial] = useState<
    InsumoPedidoComercial[]
  >([]);
  const [insumosEstoqueComercial, setInsumosEstoqueComercial] = useState<
    InsumoEstoqueComercial[]
  >([]);
  const [botConfig, setBotConfig] = useState<BotConfig>({
    url: "",
    active: false,
  });
  const [botStatuses, setBotStatuses] = useState<
    Record<
      string,
      {
        status: string;
        pairingCode?: string;
        qrCode?: string;
        qrUrl?: string;
        active?: boolean;
      }
    >
  >({});
  const [initialActionData, setInitialActionData] =
    useState<Partial<CalendarioAcao> | null>(null);
  const [activePopup, setActivePopup] = useState<{
    title: string;
    message: string;
  } | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [massSendProgress, setMassSendProgress] = useState<{
    total: number;
    sent: number;
    active: boolean;
    info: string;
  }>({ total: 0, sent: 0, active: false, info: "" });
  const [isMassSendPaused, setIsMassSendPaused] = useState(false);
  const massSendControlRef = React.useRef({ paused: false, cancelled: false });

  const showToast = (
    message: string,
    type: "success" | "error" = "success",
  ) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const showPopup = (title: string, message: string) => {
    setActivePopup({ title, message });
  };

  const canView = (view: string) => {
    if (!profile) return false;
    if (
      profile.email === "canaldonutri@gmail.com" ||
      profile.email === "marcos.teixeira@estacio.br" ||
      profile.role === "Admin Master"
    ) {
      return true;
    }
    const isComercial =
      localStorage.getItem("servidor_selected") === "comercial";
    if (profile.role === ROLES.FINANCEIRO) {
      if (isComercial) {
        return view === "controlePagamentos";
      } else {
        return VIEW_PERMISSIONS[view]?.includes(profile.role) || false;
      }
    }
    return VIEW_PERMISSIONS[view]?.includes(profile.role) || false;
  };

  const callBotApi = async (
    path: string,
    options: { method?: "GET" | "POST"; body?: any } = {},
  ) => {
    // Determine the exact URL to fetch from, using the requested Railway API directly for send actions
    const directUrl =
      path === "/api/send"
        ? "https://argoscliente-production-170b.up.railway.app/api/send"
        : botConfig.url
          ? `${botConfig.url.endsWith("/") ? botConfig.url.slice(0, -1) : botConfig.url}${path}`
          : `https://argoscliente-production-170b.up.railway.app${path}`;

    const fetchOptions: RequestInit = {
      method: options.method || "GET",
      headers: {
        "Content-Type": "application/json",
      },
    };
    if (options.method === "POST" && options.body) {
      fetchOptions.body = JSON.stringify(options.body);
    }

    const response = await fetch(directUrl, fetchOptions);
    if (!response.ok) {
      const isJson = response.headers.get("content-type")?.includes("application/json");
      const json = isJson ? await response.json().catch(() => ({})) : {};
      throw new Error(
        json.error ||
          json.message ||
          `Erro ao conectar ao Bot (${response.status})`,
      );
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      const text = await response.text();
      throw new Error(
        `O Bot no Railway retornou uma resposta inesperada (formato não-JSON). O bot pode estar offline ou em reinicialização.`
      );
    }

    const resData = await response.json();

    // Support either direct raw JSON responses or wrapper structures with { success: boolean, data?: any }
    if (
      resData !== null &&
      typeof resData === "object" &&
      "success" in resData
    ) {
      if (!resData.success) {
        throw new Error(resData.data?.error || resData.error || `Falha no bot`);
      }
      return "data" in resData ? resData.data : resData;
    }

    return resData;
  };

  const sendAppWhatsApp = async (recipientPhone: string, message: string) => {
    let rawPhone = recipientPhone.replace(/\D/g, "");
    if (rawPhone.startsWith("0")) rawPhone = rawPhone.substring(1);
    if (rawPhone.length === 10 || rawPhone.length === 11) {
      rawPhone = `55${rawPhone}`;
    }
    if (!rawPhone) return;

    try {
      const finalMessage = message + "\n\nPor favor não responder nesse whatsapp. Pois ele é apenas um numero de assistência de envio.";
      await callBotApi("/api/send", {
        method: "POST",
        body: {
          botNumber: "5524993346717",
          number: rawPhone,
          message: finalMessage,
          force: true,
          manual: true,
        },
      });
      console.log(`WhatsApp sent to ${rawPhone} via bot 5524993346717`);
    } catch (err) {
      console.error("Error sending WhatsApp notification:", err);
    }
  };

  const handleSendBotMessage = async (telefone: string, message: string) => {
    const currentBotNumber = profile?.botNumber;
    let safeBotNumber = currentBotNumber
      ? currentBotNumber.replace(/\D/g, "")
      : "";

    // Auto-fallback: if the user's personal bot number is offline, not active,
    // or not set, look for any online bot session in the system to route the dispatch.
    const isUserBotOnline =
      safeBotNumber && (botStatuses as any)[safeBotNumber]?.status === "online";

    if (!isUserBotOnline) {
      const firstOnlineBot = Object.entries(botStatuses).find(
        ([_, info]) => (info as any)?.status === "online",
      )?.[0];
      if (firstOnlineBot) {
        console.log(
          `Fallback bot activated: Routing message via active online session: ${firstOnlineBot}`,
        );
        safeBotNumber = firstOnlineBot;
      } else if (!safeBotNumber) {
        showToast(
          "Você ainda não tem um número de WhatsApp configurado (Administração -> GestãoPro) e nenhum bot está ativo no momento.",
          "error",
        );
        return;
      }
    }

    // Format phone: remove non-numeric, strip leading zero if present
    let rawPhone = telefone.replace(/\D/g, "");
    if (rawPhone.startsWith("0")) rawPhone = rawPhone.substring(1);
    // Add country code if not present and has standard length
    if (rawPhone.length === 10 || rawPhone.length === 11) {
      rawPhone = `55${rawPhone}`;
    }

    try {
      const isTargetBot = safeBotNumber === "5524993346717";
      const finalMessage = isTargetBot
        ? message + "\n\nPor favor não responder nesse whatsapp. Pois ele é apenas um numero de assistência de envio."
        : message;

      await callBotApi("/api/send", {
        method: "POST",
        body: {
          botNumber: safeBotNumber,
          number: rawPhone,
          message: finalMessage,
          force: true,
          manual: true,
        },
      });
      showToast("Mensagem enviada com sucesso pelo Bot ARGO'S!");

      // Automatic Status Transition Logic upon message sent
      try {
        const phonesMatch = (p1?: string, p2?: string): boolean => {
          if (!p1 || !p2) return false;
          const c1 = p1.replace(/\D/g, "");
          const c2 = p2.replace(/\D/g, "");
          if (c1 === c2) return true;
          const s1 = c1.startsWith("55")
            ? c1.substring(2)
            : c1.startsWith("0")
              ? c1.substring(1)
              : c1;
          const s2 = c2.startsWith("55")
            ? c2.substring(2)
            : c2.startsWith("0")
              ? c2.substring(1)
              : c2;
          if (s1 === s2) return true;
          if (s1.length >= 8 && s2.length >= 8) {
            const last8_1 = s1.slice(-8);
            const last8_2 = s2.slice(-8);
            const ddd1 = s1.substring(0, 2);
            const ddd2 = s2.substring(0, 2);
            if (last8_1 === last8_2 && ddd1 === ddd2) return true;
          }
          return false;
        };

        const matchedLeads = leads.filter((item) =>
          phonesMatch(item.telefone, telefone),
        );
        const matchedBases = bases.filter((item) =>
          phonesMatch(item.telefone, telefone),
        );
        const matchedBasesRenovacao = basesRenovacao.filter((item) =>
          phonesMatch(item.telefone, telefone),
        );
        const matchedFiesProuni = fiesProuni.filter((item) =>
          phonesMatch(item.telefone, telefone),
        );

        const existsInGap = gap.some((g) => {
          if (phonesMatch(g.telefone, telefone)) return true;
          const matchedCpf =
            matchedLeads.find((l) => l.cpf)?.cpf ||
            matchedBases.find((b) => b.cpf)?.cpf ||
            matchedBasesRenovacao.find((br) => br.cpf)?.cpf ||
            matchedFiesProuni.find((fp) => fp.cpf)?.cpf;
          if (matchedCpf && g.cpf) {
            const c1 = matchedCpf.replace(/\D/g, "");
            const c2 = g.cpf.replace(/\D/g, "");
            if (c1 && c1 === c2) return true;
          }
          return false;
        });

        // 1. Process matched LEADS
        for (const lead of matchedLeads) {
          if (existsInGap) {
            if (lead.status !== "Convertido") {
              await updateDoc(doc(db, COLLECTIONS.LEADS, lead.id), {
                status: "Convertido",
              });
            }
          } else if (lead.status.toLowerCase() === "pendente") {
            await updateDoc(doc(db, COLLECTIONS.LEADS, lead.id), {
              status: "Sem retorno",
            });
          }
        }

        // 2. Process matched BASES
        for (const entry of matchedBases) {
          if (existsInGap) {
            if (entry.status !== "Convertido") {
              await updateDoc(doc(db, COLLECTIONS.BASES, entry.id), {
                status: "Convertido",
              });
            }
          } else if (entry.status.toLowerCase() === "pendente") {
            await updateDoc(doc(db, COLLECTIONS.BASES, entry.id), {
              status: "Sem retorno",
            });
          }
        }

        // 3. Process matched BASES_RENOVACAO
        for (const entry of matchedBasesRenovacao) {
          if (existsInGap) {
            if (entry.status !== "Convertido") {
              await updateDoc(doc(db, COLLECTIONS.BASES_RENOVACAO, entry.id), {
                status: "Convertido",
              });
            }
          } else if (entry.status.toLowerCase() === "pendente") {
            await updateDoc(doc(db, COLLECTIONS.BASES_RENOVACAO, entry.id), {
              status: "Sem retorno",
            });
          }
        }

        // 4. Process matched FIES_PROUNI
        for (const entry of matchedFiesProuni) {
          if (existsInGap) {
            if (entry.status !== "Convertido") {
              await updateDoc(doc(db, COLLECTIONS.FIES_PROUNI, entry.id), {
                status: "Convertido",
              });
            }
          } else if (
            entry.status &&
            entry.status.toLowerCase() === "pendente"
          ) {
            await updateDoc(doc(db, COLLECTIONS.FIES_PROUNI, entry.id), {
              status: "Sem retorno",
            });
          }
        }

        let tipoContato = "outro";
        let baseName = "";
        if (matchedLeads.length > 0) {
          tipoContato = "leads";
        } else if (matchedBases.length > 0) {
          tipoContato = "bases";
          baseName = matchedBases[0].nomeBase;
        } else if (matchedBasesRenovacao.length > 0) {
          tipoContato = "bases_renovacao";
          baseName = matchedBasesRenovacao[0].nomeBase;
        } else if (matchedFiesProuni.length > 0) {
          tipoContato = "fies_prouni";
        } else if (existsInGap) {
          tipoContato = "gap";
        }

        await addDoc(collection(db, COLLECTIONS.BOT_REPORTS), {
          userId: profile?.uid || "unknown",
          userName: profile?.nome || "Usuário Desconhecido",
          userRole: profile?.role || "unknown",
          telefone,
          tipoContato,
          baseName,
          sentAt: serverTimestamp(),
        });
      } catch (statusErr: any) {
        console.error(
          "[Auto Status Update] Failed to update statuses or log report:",
          statusErr,
        );
      }
    } catch (err: any) {
      showToast(`Erro ao enviar mensagem: ${err.message}`, "error");
    }
  };

  const sendSilentWhatsApp = async (telefone: string, message: string) => {
    const currentBotNumber = profile?.botNumber;
    let safeBotNumber = currentBotNumber
      ? currentBotNumber.replace(/\D/g, "")
      : "";

    const isUserBotOnline =
      safeBotNumber && (botStatuses as any)[safeBotNumber]?.status === "online";

    if (!isUserBotOnline) {
      const firstOnlineBot = Object.entries(botStatuses).find(
        ([_, info]) => (info as any)?.status === "online",
      )?.[0];
      if (firstOnlineBot) {
        safeBotNumber = firstOnlineBot;
      } else if (!safeBotNumber) {
        return;
      }
    }

    let rawPhone = telefone.replace(/\D/g, "");
    if (rawPhone.startsWith("0")) rawPhone = rawPhone.substring(1);
    if (rawPhone.length === 10 || rawPhone.length === 11) {
      rawPhone = `55${rawPhone}`;
    }

    try {
      const isTargetBot = safeBotNumber === "5524993346717";
      const finalMessage = isTargetBot
        ? message + "\n\nPor favor não responder nesse whatsapp. Pois ele é apenas um numero de assistência de envio."
        : message;

      await callBotApi("/api/send", {
        method: "POST",
        body: {
          botNumber: safeBotNumber,
          number: rawPhone,
          message: finalMessage,
          force: true,
          manual: true,
        },
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleMassSendBotMessages = async (
    messages: { telefone: string; message: string }[],
  ) => {
    if (massSendProgress.active) {
      showToast("Já existe um envio em massa em andamento.", "error");
      return;
    }

    if (messages.length === 0) return;
    if (
      !window.confirm(
        `Deseja iniciar o envio em massa via bot para ${messages.length} contatos?`,
      )
    )
      return;

    massSendControlRef.current = { paused: false, cancelled: false };
    setIsMassSendPaused(false);

    setMassSendProgress({
      total: messages.length,
      sent: 0,
      active: true,
      info: "Iniciando...",
    });

    const waitWithCheck = async (seconds: number, labelPrefix: string) => {
      for (let s = 0; s < seconds; s++) {
        if (massSendControlRef.current.cancelled) return;
        while (massSendControlRef.current.paused && !massSendControlRef.current.cancelled) {
          setMassSendProgress((prev) => ({
            ...prev,
            info: `Robô Pausado... (${prev.sent}/${messages.length})`,
          }));
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
        if (massSendControlRef.current.cancelled) return;
        const remaining = seconds - s;
        setMassSendProgress((prev) => ({
          ...prev,
          info: `${labelPrefix} (${remaining}s restantes)... (${prev.sent}/${messages.length})`,
        }));
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    };

    let sentCount = 0;
    for (let i = 0; i < messages.length; i++) {
      if (massSendControlRef.current.cancelled) {
        break;
      }

      while (massSendControlRef.current.paused && !massSendControlRef.current.cancelled) {
        setMassSendProgress((prev) => ({
          ...prev,
          info: `Robô Pausado... (${sentCount}/${messages.length})`,
        }));
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      if (massSendControlRef.current.cancelled) {
        break;
      }

      if (i > 0) {
        if (sentCount % 5 === 0) {
          await waitWithCheck(120, "Pausa de 2 min");
        } else {
          await waitWithCheck(30, "Aguardando cooldown");
        }
      }

      if (massSendControlRef.current.cancelled) {
        break;
      }

      while (massSendControlRef.current.paused && !massSendControlRef.current.cancelled) {
        setMassSendProgress((prev) => ({
          ...prev,
          info: `Robô Pausado... (${sentCount}/${messages.length})`,
        }));
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      if (massSendControlRef.current.cancelled) {
        break;
      }

      setMassSendProgress((prev) => ({
        ...prev,
        sent: sentCount,
        info: `Enviando... (${sentCount + 1}/${messages.length})`,
      }));

      try {
        await handleSendBotMessage(messages[i].telefone, messages[i].message);
      } catch (e) {
        console.error("Error sending bot message in mass: ", e);
      }
      sentCount++;
      setMassSendProgress((prev) => ({
        ...prev,
        sent: sentCount,
      }));
    }

    const wasCancelled = massSendControlRef.current.cancelled;
    setMassSendProgress({ total: 0, sent: 0, active: false, info: "" });
    setIsMassSendPaused(false);
    
    if (wasCancelled) {
      showToast("Envio em massa cancelado pelo usuário.", "error");
    } else {
      showToast("Envio em massa concluído!", "success");
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // 1. Try to get profile by UID
          let userDoc = await getDoc(doc(db, COLLECTIONS.USERS, user.uid));

          if (!userDoc.exists()) {
            // 2. If not found by UID, try to find by email (for pre-registered users)
            const q = query(
              collection(db, COLLECTIONS.USERS),
              where("email", "==", user.email),
            );
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
                updatedAt: serverTimestamp(),
              });

              // Delete the old document if it had a different ID
              if (existingDoc.id !== user.uid) {
                try {
                  await deleteDoc(doc(db, COLLECTIONS.USERS, existingDoc.id));
                } catch (e) {
                  console.warn(
                    "Could not delete old user document, likely due to rules. Skipping.",
                    e,
                  );
                }
              }

              userDoc = await getDoc(doc(db, COLLECTIONS.USERS, user.uid));
            } else {
              // 3. Create default profile if not exists at all
              let role = ROLES.PROMOTOR;
              let servidor: "principal" | "comercial" = "principal";
              let name = user.email!.split("@")[0];

              if (user.displayName) {
                const parts = user.displayName.split("|");
                name = parts[0] || name;
                if (parts.length > 1 && parts[1] === "comercial") {
                  servidor = "comercial";
                  role = "Promotor/rua" as any;
                }
              }

              if (
                user.email === "marcos.teixeira@estacio.br" ||
                user.email === "canaldonutri@gmail.com"
              ) {
                role = ROLES.ADMIN_MASTER;
              } else {
                const allUsers = await getDocs(
                  query(collection(db, COLLECTIONS.USERS), limit(1)),
                );
                if (allUsers.empty) {
                  role = (
                    servidor === "comercial"
                      ? "Gerente Comercial (Comercial)"
                      : ROLES.LIDER_FDV
                  ) as any;
                }
              }

              const newProfile = {
                uid: user.uid,
                email: user.email!,
                name,
                role,
                servidor,
                mustChangePassword: false, // Default for self-signup
                createdAt: serverTimestamp(),
                dashboardWidgets: { stats: true, links: true, planner: true },
              };
              await setDoc(doc(db, COLLECTIONS.USERS, user.uid), newProfile);
              userDoc = await getDoc(doc(db, COLLECTIONS.USERS, user.uid));
            }
          }

          if (userDoc.exists()) {
            const data = userDoc.data() as UserProfile;
            if (
              data.email === "marcos.teixeira@estacio.br" ||
              data.email === "canaldonutri@gmail.com"
            ) {
              data.role = ROLES.ADMIN_MASTER;
            }
            setProfile({ uid: user.uid, ...data } as UserProfile);
          }
          setUser(user);
        } catch (error: any) {
          console.error("Error fetching/creating profile details:", {
            code: error.code,
            message: error.message,
            stack: error.stack,
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
    if (!user) return;

    // Listeners for users require auth
    let unsubUsers = () => {};
    if (user) {
      unsubUsers = onSnapshot(
        collection(db, COLLECTIONS.USERS),
        (snap) => {
          setUsers(
            snap.docs.map((d) => ({ uid: d.id, ...d.data() }) as UserProfile),
          );
        },
        (err) =>
          handleFirestoreError(err, OperationType.LIST, COLLECTIONS.USERS),
      );
    }

    let unsubPlanner = () => {};
    if (profile && VIEW_PERMISSIONS.dashboard.includes(profile.role)) {
      unsubPlanner = onSnapshot(
        collection(db, COLLECTIONS.PLANNER),
        (snap) => {
          setPlanner(
            snap.docs.map((d) => ({ id: d.id, ...d.data() }) as PlannerTask),
          );
        },
        (err) =>
          handleFirestoreError(err, OperationType.LIST, COLLECTIONS.PLANNER),
      );
    }

    let unsubLinks = () => {};
    if (profile && VIEW_PERMISSIONS.dashboard.includes(profile.role)) {
      unsubLinks = onSnapshot(
        collection(db, COLLECTIONS.LINKS),
        (snap) => {
          setLinks(
            snap.docs.map((d) => ({ id: d.id, ...d.data() }) as LinkUtil),
          );
        },
        (err) =>
          handleFirestoreError(err, OperationType.LIST, COLLECTIONS.LINKS),
      );
    }

    let unsubLeads = () => {};
    if (profile) {
      let leadsQuery;
      if (
        [
          ROLES.ADMIN_MASTER,
          ROLES.LIDER_FDV,
          ROLES.SALA_MATRICULA,
          ROLES.QG,
          ROLES.GESTOR_UNIDADE,
        ].includes(profile.role)
      ) {
        leadsQuery = query(collection(db, COLLECTIONS.LEADS));
      } else if (profile.role === ROLES.GESTOR_COMERCIAL_COMERCIAL) {
        // Gerente Comercial (Comercial) ver everything in Comercial
        leadsQuery = query(
          collection(db, COLLECTIONS.LEADS),
          where("servidor", "==", "comercial"),
        );
      } else if (profile.role === ROLES.FDV_COMERCIAL) {
        // FDV (Comercial) sees their own leads and those from their linked promontors.
        leadsQuery = query(
          collection(db, COLLECTIONS.LEADS),
          or(
            where("promotorId", "==", user!.uid),
            where("linkadoA", "==", user!.uid),
          ),
        );
      } else if (profile.role === ROLES.FDV) {
        leadsQuery = query(
          collection(db, COLLECTIONS.LEADS),
          or(
            where("promotorId", "==", user!.uid),
            where("promotorRole", "==", ROLES.PROMOTOR),
          ),
        );
      } else if (profile.role === ROLES.GESTOR_COMERCIAL) {
        leadsQuery = query(
          collection(db, COLLECTIONS.LEADS),
          or(
            where("promotorId", "==", user!.uid),
            where("promotorRole", "in", [ROLES.PROMOTOR, ROLES.FDV]),
          ),
        );
      } else if (
        profile.role === ROLES.PROMOTOR ||
        profile.role === ROLES.PROMOTOR_RUA
      ) {
        leadsQuery = query(
          collection(db, COLLECTIONS.LEADS),
          where("promotorId", "==", user!.uid),
        );
      } else {
        leadsQuery = query(
          collection(db, COLLECTIONS.LEADS),
          where("promotorId", "==", "none"),
        );
      }

      unsubLeads = onSnapshot(
        leadsQuery,
        (snap) => {
          setLeads(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Lead));
        },
        (err) =>
          handleFirestoreError(err, OperationType.LIST, COLLECTIONS.LEADS),
      );
    }

    let unsubBases = () => {};
    if (profile && VIEW_PERMISSIONS.bases.includes(profile.role)) {
      unsubBases = onSnapshot(
        collection(db, COLLECTIONS.BASES),
        (snap) => {
          setBases(
            snap.docs.map((d) => ({ id: d.id, ...d.data() }) as BaseEntry),
          );
        },
        (err) =>
          handleFirestoreError(err, OperationType.LIST, COLLECTIONS.BASES),
      );
    }

    let unsubGap = () => {};
    if (profile && VIEW_PERMISSIONS.gap.includes(profile.role)) {
      unsubGap = onSnapshot(
        collection(db, COLLECTIONS.GAP),
        (snap) => {
          setGap(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as GapEntry));
        },
        (err) => handleFirestoreError(err, OperationType.LIST, COLLECTIONS.GAP),
      );
    }

    let unsubIsencoes = () => {};
    if (profile && VIEW_PERMISSIONS.isencoes.includes(profile.role)) {
      unsubIsencoes = onSnapshot(
        collection(db, COLLECTIONS.ISENCOES),
        (snap) => {
          setIsencoes(
            snap.docs.map((d) => ({ id: d.id, ...d.data() }) as IsencaoEntry),
          );
        },
        (err) =>
          handleFirestoreError(err, OperationType.LIST, COLLECTIONS.ISENCOES),
      );
    }

    let unsubFiesProuni = () => {};
    if (profile && VIEW_PERMISSIONS.fiesProuni.includes(profile.role)) {
      unsubFiesProuni = onSnapshot(
        collection(db, COLLECTIONS.FIES_PROUNI),
        (snap) => {
          setFiesProuni(
            snap.docs.map(
              (d) => ({ id: d.id, ...d.data() }) as FiesProuniEntry,
            ),
          );
        },
        (err) =>
          handleFirestoreError(
            err,
            OperationType.LIST,
            COLLECTIONS.FIES_PROUNI,
          ),
      );
    }

    let unsubCampanhas = () => {};
    if (profile && VIEW_PERMISSIONS.campanhas.includes(profile.role)) {
      unsubCampanhas = onSnapshot(
        collection(db, COLLECTIONS.CAMPANHAS),
        (snap) => {
          setCampanhas(
            snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Campanha),
          );
        },
        (err) =>
          handleFirestoreError(err, OperationType.LIST, COLLECTIONS.CAMPANHAS),
      );
    }

    let unsubBomDia = () => {};
    if (profile && VIEW_PERMISSIONS.dashboard.includes(profile.role)) {
      unsubBomDia = onSnapshot(
        collection(db, COLLECTIONS.BOM_DIA),
        (snap) => {
          setBomDia(
            snap.docs.map((d) => ({ id: d.id, ...d.data() }) as BomDiaCaptacao),
          );
        },
        (err) =>
          handleFirestoreError(err, OperationType.LIST, COLLECTIONS.BOM_DIA),
      );
    }

    let unsubForecast = () => {};
    if (profile && VIEW_PERMISSIONS.dashboard.includes(profile.role)) {
      unsubForecast = onSnapshot(
        collection(db, COLLECTIONS.FORECAST),
        (snap) => {
          setForecast(
            snap.docs.map(
              (d) => ({ id: d.id, ...d.data() }) as ForecastCaptacao,
            ),
          );
        },
        (err) =>
          handleFirestoreError(err, OperationType.LIST, COLLECTIONS.FORECAST),
      );
    }

    let unsubMetaDia = () => {};
    if (profile && VIEW_PERMISSIONS.dashboard.includes(profile.role)) {
      unsubMetaDia = onSnapshot(
        collection(db, COLLECTIONS.META_DIA),
        (snap) => {
          setMetaDia(
            snap.docs.map((d) => ({ id: d.id, ...d.data() }) as MetaDia),
          );
        },
        (err) =>
          handleFirestoreError(err, OperationType.LIST, COLLECTIONS.META_DIA),
      );
    }

    let unsubQgLigacoes = () => {};
    if (profile && VIEW_PERMISSIONS.dashboard.includes(profile.role)) {
      unsubQgLigacoes = onSnapshot(
        collection(db, COLLECTIONS.QG_LIGACOES),
        (snap) => {
          setQgLigacoes(
            snap.docs.map((d) => ({ id: d.id, ...d.data() }) as QgLigacao),
          );
        },
        (err) =>
          handleFirestoreError(err, OperationType.LIST, COLLECTIONS.QG_LIGACOES),
      );
    }

    let unsubPeriodos = () => {};
    if (profile && VIEW_PERMISSIONS.dashboard.includes(profile.role)) {
      unsubPeriodos = onSnapshot(
        collection(db, COLLECTIONS.PERIODO_CAPTACAO),
        (snap) => {
          setPeriodos(
            snap.docs.map(
              (d) => ({ id: d.id, ...d.data() }) as PeriodoCaptacao,
            ),
          );
        },
        (err) =>
          handleFirestoreError(
            err,
            OperationType.LIST,
            COLLECTIONS.PERIODO_CAPTACAO,
          ),
      );
    }

    let unsubCalendario = () => {};
    if (
      profile &&
      (VIEW_PERMISSIONS.calendario.includes(profile.role) ||
        VIEW_PERMISSIONS.controlePagamentos.includes(profile.role) ||
        canView("controlePagamentos"))
    ) {
      let calendarioQuery;
      if (
        [
          ROLES.ADMIN_MASTER,
          ROLES.LIDER_FDV,
          ROLES.SALA_MATRICULA,
          ROLES.GESTOR_UNIDADE,
          ROLES.GESTOR_COMERCIAL,
          ROLES.FINANCEIRO,
          ROLES.GESTOR_COMERCIAL_COMERCIAL,
        ].includes(profile.role)
      ) {
        calendarioQuery = query(collection(db, COLLECTIONS.CALENDARIO_ACOES));
      } else if (
        profile.role === ROLES.FDV ||
        profile.role === ROLES.FDV_COMERCIAL
      ) {
        calendarioQuery = query(
          collection(db, COLLECTIONS.CALENDARIO_ACOES),
          or(
            where("creatorId", "==", user!.uid),
            where("creatorRole", "==", ROLES.PROMOTOR),
            where("creatorRole", "==", ROLES.PROMOTOR_RUA),
            where("colaboradorId", "==", user!.uid),
            where("promotoresSelecionados", "array-contains", user!.uid),
          ),
        );
      } else if (
        profile.role === ROLES.PROMOTOR ||
        profile.role === ROLES.PROMOTOR_RUA
      ) {
        calendarioQuery = query(
          collection(db, COLLECTIONS.CALENDARIO_ACOES),
          or(
            where("creatorId", "==", user!.uid),
            where("colaboradorId", "==", user!.uid),
            where("promotoresSelecionados", "array-contains", user!.uid),
          ),
        );
      } else {
        calendarioQuery = query(
          collection(db, COLLECTIONS.CALENDARIO_ACOES),
          where("creatorId", "==", "none"),
        );
      }
      unsubCalendario = onSnapshot(
        calendarioQuery,
        (snap) => {
          setCalendarioAcoes(
            snap.docs.map((d) => ({ id: d.id, ...d.data() }) as CalendarioAcao),
          );
        },
        (err) =>
          handleFirestoreError(
            err,
            OperationType.LIST,
            COLLECTIONS.CALENDARIO_ACOES,
          ),
      );
    }

    let unsubEmpresas = () => {};
    if (profile && VIEW_PERMISSIONS.empresas.includes(profile.role)) {
      unsubEmpresas = onSnapshot(
        collection(db, COLLECTIONS.EMPRESAS_PARCEIRAS),
        (snap) => {
          setEmpresasParceiras(
            snap.docs.map(
              (d) => ({ id: d.id, ...d.data() }) as EmpresaParceira,
            ),
          );
        },
        (err) =>
          handleFirestoreError(
            err,
            OperationType.LIST,
            COLLECTIONS.EMPRESAS_PARCEIRAS,
          ),
      );
    }

    let unsubControleConcorrencia = () => {};
    if (profile && VIEW_PERMISSIONS.controleConcorrencia.includes(profile.role)) {
      unsubControleConcorrencia = onSnapshot(
        collection(db, COLLECTIONS.CONTROLE_CONCORRENCIA),
        (snap) => {
          setControleConcorrencia(
            snap.docs.map(
              (d) => ({ id: d.id, ...d.data() }) as ControleConcorrencia,
            ),
          );
        },
        (err) =>
          handleFirestoreError(
            err,
            OperationType.LIST,
            COLLECTIONS.CONTROLE_CONCORRENCIA,
          ),
      );
    }

    let unsubWhatsApp = () => {};
    if (user) {
      unsubWhatsApp = onSnapshot(
        collection(db, COLLECTIONS.WHATSAPP_MESSAGES),
        (snap) => {
          setWhatsappMessages(
            snap.docs.map(
              (d) => ({ id: d.id, ...d.data() }) as WhatsAppMessage,
            ),
          );
        },
        (err) =>
          handleFirestoreError(
            err,
            OperationType.LIST,
            COLLECTIONS.WHATSAPP_MESSAGES,
          ),
      );
    }

    let unsubMapao = () => {};
    if (profile && VIEW_PERMISSIONS.mapao.includes(profile.role)) {
      unsubMapao = onSnapshot(
        collection(db, COLLECTIONS.MAPAO_ACADEMICO),
        (snap) => {
          setMapao(
            snap.docs.map(
              (d) => ({ id: d.id, ...d.data() }) as MapaoAcademicoEntry,
            ),
          );
        },
        (err) =>
          handleFirestoreError(
            err,
            OperationType.LIST,
            COLLECTIONS.MAPAO_ACADEMICO,
          ),
      );
    }

    let unsubBasesDisparo = () => {};
    if (profile && VIEW_PERMISSIONS.basesDisparo.includes(profile.role)) {
      unsubBasesDisparo = onSnapshot(
        collection(db, COLLECTIONS.BASES_DISPARO),
        (snap) => {
          setBasesDisparo(
            snap.docs.map(
              (d) => ({ id: d.id, ...d.data() }) as BaseDisparoEntry,
            ),
          );
        },
        (err) =>
          handleFirestoreError(
            err,
            OperationType.LIST,
            COLLECTIONS.BASES_DISPARO,
          ),
      );
    }

    let unsubBasesRenovacao = () => {};
    if (profile && VIEW_PERMISSIONS.basesRenovacao.includes(profile.role)) {
      unsubBasesRenovacao = onSnapshot(
        collection(db, COLLECTIONS.BASES_RENOVACAO),
        (snap) => {
          setBasesRenovacao(
            snap.docs.map((d) => ({ id: d.id, ...d.data() }) as BaseEntry),
          );
        },
        (err) =>
          handleFirestoreError(
            err,
            OperationType.LIST,
            COLLECTIONS.BASES_RENOVACAO,
          ),
      );
    }

    let unsubCursos = () => {};
    if (profile && VIEW_PERMISSIONS.cursos.includes(profile.role)) {
      unsubCursos = onSnapshot(
        collection(db, COLLECTIONS.CURSOS),
        (snap) => {
          setCursos(
            snap.docs.map(
              (d) => ({ id: d.id, ...d.data() }) as CursoDisponivel,
            ),
          );
        },
        (err) =>
          handleFirestoreError(err, OperationType.LIST, COLLECTIONS.CURSOS),
      );
    }

    let unsubInsumosPedidos = () => {};
    let unsubInsumosEstoque = () => {};
    if (profile && VIEW_PERMISSIONS.controleInsumos.includes(profile.role)) {
      unsubInsumosPedidos = onSnapshot(
        collection(db, COLLECTIONS.INSUMOS_PEDIDOS),
        (snap) => {
          setInsumosPedidos(
            snap.docs.map((d) => ({ id: d.id, ...d.data() }) as InsumoPedido),
          );
        },
        (err) =>
          handleFirestoreError(
            err,
            OperationType.LIST,
            COLLECTIONS.INSUMOS_PEDIDOS,
          ),
      );

      unsubInsumosEstoque = onSnapshot(
        collection(db, COLLECTIONS.INSUMOS_ESTOQUE),
        (snap) => {
          setInsumosEstoque(
            snap.docs.map((d) => ({ id: d.id, ...d.data() }) as InsumoEstoque),
          );
        },
        (err) =>
          handleFirestoreError(
            err,
            OperationType.LIST,
            COLLECTIONS.INSUMOS_ESTOQUE,
          ),
      );
    }

    let unsubInsumosPedidosComercial = () => {};
    let unsubInsumosEstoqueComercial = () => {};
    let unsubInsumosBaixas = () => {};
    if (
      profile &&
      VIEW_PERMISSIONS.controleInsumosComercial.includes(profile.role)
    ) {
      const isGerenteOrAdmin =
        profile.role === ROLES.ADMIN_MASTER ||
        profile.role === "Admin Master" ||
        profile.role === "Gerente Comercial (Comercial)" ||
        profile.role === "Gestor Comercial";

      const qPedidosComercial = isGerenteOrAdmin
        ? collection(db, COLLECTIONS.INSUMOS_PEDIDOS_COMERCIAL)
        : query(
            collection(db, COLLECTIONS.INSUMOS_PEDIDOS_COMERCIAL),
            where("solicitanteId", "==", profile.uid),
          );

      const qEstoqueComercial = isGerenteOrAdmin
        ? collection(db, COLLECTIONS.INSUMOS_ESTOQUE_COMERCIAL)
        : query(
            collection(db, COLLECTIONS.INSUMOS_ESTOQUE_COMERCIAL),
            where("ownerId", "==", profile.uid),
          );

      unsubInsumosPedidosComercial = onSnapshot(
        qPedidosComercial,
        (snap) => {
          setInsumosPedidosComercial(
            snap.docs.map(
              (d) => ({ id: d.id, ...d.data() }) as InsumoPedidoComercial,
            ),
          );
        },
        (err) =>
          handleFirestoreError(
            err,
            OperationType.LIST,
            COLLECTIONS.INSUMOS_PEDIDOS_COMERCIAL,
          ),
      );

      unsubInsumosEstoqueComercial = onSnapshot(
        qEstoqueComercial,
        (snap) => {
          setInsumosEstoqueComercial(
            snap.docs.map(
              (d) => ({ id: d.id, ...d.data() }) as InsumoEstoqueComercial,
            ),
          );
        },
        (err) =>
          handleFirestoreError(
            err,
            OperationType.LIST,
            COLLECTIONS.INSUMOS_ESTOQUE_COMERCIAL,
          ),
      );

      unsubInsumosBaixas = onSnapshot(
        collection(db, COLLECTIONS.INSUMOS_BAIXAS),
        (snap) => {
          setInsumosBaixas(
            snap.docs.map((d) => ({ id: d.id, ...d.data() }) as InsumoBaixa),
          );
        },
        (err) =>
          handleFirestoreError(
            err,
            OperationType.LIST,
            COLLECTIONS.INSUMOS_BAIXAS,
          ),
      );
    }

    return () => {
      unsubUsers();
      unsubPlanner();
      unsubLinks();
      unsubLeads();
      unsubBases();
      unsubGap();
      unsubIsencoes();
      unsubFiesProuni();
      unsubCampanhas();
      unsubBomDia();
      unsubForecast();
      unsubMetaDia();
      unsubQgLigacoes();
      unsubPeriodos();
      unsubCalendario();
      unsubEmpresas();
      unsubWhatsApp();
      unsubMapao();
      unsubBasesDisparo();
      unsubBasesRenovacao();
      unsubCursos();
      unsubControleConcorrencia();
      unsubInsumosPedidos();
      unsubInsumosEstoque();
      unsubInsumosPedidosComercial();
      unsubInsumosEstoqueComercial();
      unsubInsumosBaixas();
    };
  }, [user, profile]);

  useEffect(() => {
    const unsubBotConfig = onSnapshot(
      doc(db, COLLECTIONS.BOT_CONFIG, "main"),
      (snap) => {
        if (snap.exists()) {
          setBotConfig({ id: snap.id, ...snap.data() } as BotConfig);
        } else {
          setBotConfig({ url: "", active: false });
        }
      },
      (err) => {
        console.warn("Could not load botConfig publicly:", err);
      },
    );
    return () => unsubBotConfig();
  }, []);

  useEffect(() => {
    // Test connection to Firestore as per instructions
    const testConnection = async () => {
      try {
        const { getDocFromServer, doc } = await import("firebase/firestore");
        await getDocFromServer(
          doc(db, COLLECTIONS.BOT_CONFIG, "connection_test"),
        );
        console.log("Firestore connection test: OK");
      } catch (err) {
        console.warn(
          "Firestore connection test check (expected error if doc doesn't exist):",
          err,
        );
      }
    };
    testConnection();
  }, []);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const checkBotStatus = async () => {
      try {
        const data = await callBotApi("/api/status");
        if (data && data.bots) {
          setBotStatuses(data.bots);
        }
      } catch (e: any) {
        console.debug("Bot check fail via proxy:", e.message);
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
    if (
      profile.role !== ROLES.LIDER_FDV &&
      profile.role !== ROLES.SALA_MATRICULA
    )
      return;

    if (knownLeadsRef.current === null) {
      knownLeadsRef.current = new Set(leads.map((l) => l.id!));
      return;
    }

    let hasNew = false;
    leads.forEach((l) => {
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
    if (
      profile.role !== ROLES.LIDER_FDV &&
      profile.role !== ROLES.SALA_MATRICULA
    )
      return;

    if (knownCampanhasRef.current === null) {
      knownCampanhasRef.current = new Set(campanhas.map((c) => c.id!));
      return;
    }

    let hasNew = false;
    campanhas.forEach((c) => {
      if (!knownCampanhasRef.current!.has(c.id!)) {
        knownCampanhasRef.current!.add(c.id!);
        hasNew = true;
      }
    });

    if (hasNew) {
      showPopup("Nova Campanha!", "Uma nova campanha foi adicionada.");
    }
  }, [campanhas, profile]);

  useEffect(() => {
    if (profile && !canView(currentView)) {
      const availableViews = [
        "dashboard",
        "cadastro",
        "historico",
        "bases",
        "gap",
        "fiesProuni",
        "mapao",
        "cursos",
        "basesDisparo",
        "campanhas",
        "calendario",
        "empresas",
        "calculo",
        "emailMarketing",
        "admin",
        "controlePagamentos",
      ];
      const firstAvailable = availableViews.find((v) => canView(v));
      if (firstAvailable) {
        setCurrentView(firstAvailable);
      }
    }
  }, [profile, currentView]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#01112c] flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (currentView === "pedido-insumos") {
    return (
      <div className="min-h-screen bg-[#01112c] flex flex-col justify-between">
        <AnimatePresence>
          {toast && (
            <Toast
              message={toast.message}
              type={toast.type}
              onClose={() => setToast(null)}
            />
          )}
        </AnimatePresence>
        <PublicInsumoForm onToast={showToast} />
      </div>
    );
  }

  if (currentView === "desconto") {
    return (
      <div className="min-h-screen bg-[#01112c] flex flex-col justify-between">
        <AnimatePresence>
          {toast && (
            <Toast
              message={toast.message}
              type={toast.type}
              onClose={() => setToast(null)}
            />
          )}
        </AnimatePresence>
        <PublicRegistrationForm onToast={showToast} />
      </div>
    );
  }

  if (!user) {
    return <AuthScreen onToast={showToast} botConfig={botConfig} />;
  }

  if (profile?.blocked) {
    return (
      <div className="min-h-screen bg-[#01112c] flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-rose-100 text-center max-w-md">
          <XCircle size={64} className="text-rose-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900">
            Acesso Bloqueado
          </h2>
          <p className="text-slate-500 mt-2">
            Sua conta foi suspensa. Entre em contato com o administrador para
            mais informações.
          </p>
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
    <div className="min-h-screen bg-[#01112c] flex">
      <AnimatePresence>
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
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
              <button
                onClick={() => setActivePopup(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={20} />
              </button>
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4 border-4 border-blue-50">
                <Bell size={32} className="text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                {activePopup.title}
              </h3>
              <p className="text-sm text-slate-600 mb-6">
                {activePopup.message}
              </p>
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
                <h4 className="font-bold text-slate-800 text-sm">
                  Disparo em Massa (Bot)
                </h4>
                <p className="text-xs text-slate-500">
                  {massSendProgress.info}
                </p>
              </div>
              <div className="font-bold text-blue-600">
                {(
                  (massSendProgress.sent / (massSendProgress.total || 1)) *
                  100
                ).toFixed(0)}
                %
              </div>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 mt-2 overflow-hidden">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${(massSendProgress.sent / (massSendProgress.total || 1)) * 100}%`,
                }}
              />
            </div>
            
            <div className="flex gap-2 w-full mt-2">
              <button
                type="button"
                onClick={() => {
                  const newPaused = !isMassSendPaused;
                  massSendControlRef.current.paused = newPaused;
                  setIsMassSendPaused(newPaused);
                  showToast(newPaused ? "Robô pausado!" : "Robô retomado!");
                }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-bold transition-all border ${
                  isMassSendPaused
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                    : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                }`}
              >
                {isMassSendPaused ? (
                  <>
                    <Play size={14} /> Retomar
                  </>
                ) : (
                  <>
                    <Pause size={14} /> Pausar
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm("Deseja realmente cancelar o envio em massa?")) {
                    massSendControlRef.current.cancelled = true;
                    massSendControlRef.current.paused = false;
                    setIsMassSendPaused(false);
                    showToast("Cancelando envio em massa...");
                  }
                }}
                className="bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
              >
                <X size={14} /> Cancelar
              </button>
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
                  updatedAt: serverTimestamp(),
                });
                setProfile((prev) =>
                  prev ? { ...prev, mustChangePassword: false } : null,
                );
                showToast("Senha atualizada com sucesso!");
              }
            } catch (err: any) {
              showToast("Erro ao atualizar status do perfil.", "error");
            }
          }}
        />
      )}

      <AnimatePresence>
        {isProfileModalOpen && profile && (
          <ProfileModal
            isOpen={isProfileModalOpen}
            onClose={() => setIsProfileModalOpen(false)}
            profile={profile}
            setProfile={setProfile}
            botConfig={botConfig}
            botStatuses={botStatuses}
            onToast={showToast}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 bg-[#011a3c] border-r border-[#092e5c] transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="h-full flex flex-col">
          <div className="p-6 flex items-center space-x-3">
            {botConfig?.loginLogo ? (
              <img
                src={botConfig.loginLogo}
                alt="Logo"
                className="w-full max-h-12 object-contain drop-shadow-md"
                referrerPolicy="no-referrer"
              />
            ) : (
              <>
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                  <TrendingUp size={24} />
                </div>
                <h1 className="text-xl font-bold text-white tracking-tight">
                  Gestão Oeste pro
                </h1>
              </>
            )}
          </div>

          <nav className="flex-1 px-4 space-y-1 overflow-y-auto pr-2">
            {[
              { id: "dashboard", label: "Rotina", icon: LayoutDashboard },
              { id: "relatorios", label: "Relatórios", icon: BarChart3 },
              { id: "cadastro", label: "Novo Lead", icon: UserPlus },
              { id: "historico", label: "Histórico", icon: History },
              { id: "bases", label: "Bases", icon: Database },
              { id: "gap", label: "GAP Acadêmico", icon: GraduationCap },
              { id: "isencoes", label: "Acompanhamento de Isenções", icon: ShieldCheck },
              { id: "fiesProuni", label: "Fies/Prouni", icon: FileText },
              { id: "mapao", label: "Mapão Acadêmico", icon: MapPin },
              { id: "cursos", label: "Cursos Disponíveis", icon: BookOpen },
              { id: "basesDisparo", label: "Bases de Disparo", icon: Globe },
              { id: "basesRenovacao", label: "Base Líquida", icon: Database },
              { id: "campanhas", label: "Campanhas", icon: Megaphone },
              { id: "calendario", label: "Plano de Ação", icon: Calendar },
              { id: "empresas", label: "Empresas Parceiras", icon: Building2 },
              { id: "controleConcorrencia", label: "Controle de Concorrência", icon: Target },
              {
                id: "calculo",
                label: "Cálculo de Remuneração",
                icon: Calculator,
              },
              {
                id: "controlePagamentos",
                label: "Controle de Pagamentos",
                icon: Coins,
              },
              {
                id: "controleInsumos",
                label: "Controle de Insumos",
                icon: Boxes,
              },
              {
                id: "controleInsumosComercial",
                label: "Controle de Insumos (Comercial)",
                icon: Boxes,
              },
              {
                id: "emailMarketing",
                label: "Envio de e-mail Marketing",
                icon: Mail,
              },
              { id: "admin", label: "Administração", icon: Settings },
            ].map(
              (item) =>
                canView(item.id) && (
                  <button
                    key={item.id}
                    onClick={() => {
                      setCurrentView(item.id);
                      setIsSidebarOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all",
                      currentView === item.id
                        ? "bg-blue-500/10 text-white"
                        : "text-slate-400 hover:bg-[#082a5c] hover:text-white",
                    )}
                  >
                    <item.icon size={20} />
                    <span>{item.label}</span>
                  </button>
                ),
            )}
          </nav>

          <div className="p-4 border-t border-[#092e5c]">
            <div className="bg-[#082a5c]/50 p-4 rounded-2xl mb-4">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                Usuário
              </p>
              <p className="text-sm font-bold text-white truncate">
                {profile?.name}
              </p>
              <span className="inline-block mt-1 px-2 py-0.5 bg-blue-500/20 text-blue-400 text-[10px] font-bold rounded-full">
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
                      showToast("Erro ao enviar e-mail.", "error");
                    }
                  }
                }}
                className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold text-slate-400 hover:bg-[#082a5c] hover:text-white transition-all"
              >
                <KeyRound size={20} />
                <span>Trocar Senha</span>
              </button>

              <button
                onClick={() => signOut(auth)}
                className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold text-rose-400 hover:bg-rose-500/10 transition-all"
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
        <header className="h-16 bg-[#011a3c] border-b border-[#092e5c] flex items-center justify-between px-4 lg:px-8 shrink-0">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="lg:hidden p-2 text-slate-400 hover:bg-[#082a5c] rounded-lg"
          >
            <Menu size={24} />
          </button>
          <div className="flex-1 lg:flex-none flex items-center space-x-3 flex-wrap gap-y-1">
            <h2 className="text-lg font-bold text-white capitalize ml-2 lg:ml-0">
              {currentView.replace("-", " ")}
            </h2>
            <span className="px-2.5 py-1 bg-gradient-to-r from-blue-600 to-sky-500 text-white text-[10px] font-extrabold rounded-md shadow-sm uppercase tracking-wider">
              Servidor:{" "}
              {localStorage.getItem("servidor_selected") === "comercial"
                ? "Comercial"
                : "SM"}
            </span>
            {isOnline ? (
              <span className="flex items-center space-x-1.5 px-2.5 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-extrabold rounded-md border border-emerald-500/20 shadow-sm uppercase tracking-wider">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
                <span>Online / Sincronizado</span>
              </span>
            ) : (
              <span className="flex items-center space-x-1.5 px-2.5 py-1 bg-amber-500/10 text-amber-400 text-[10px] font-extrabold rounded-md border border-amber-500/20 shadow-sm uppercase tracking-wider animate-pulse">
                <span className="w-1.5 h-1.5 bg-amber-400 rounded-full"></span>
                <span>Sem Conexão (Modo Cache Offline)</span>
              </span>
            )}
          </div>
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-2 text-sm text-slate-400">
              <Calendar size={16} />
              <span>{new Date().toLocaleDateString("pt-BR")}</span>
            </div>
            <button
              onClick={() => setIsProfileModalOpen(true)}
              className="flex items-center space-x-1.5 bg-[#082a5c]/50 hover:bg-[#082a5c] text-white px-3 py-1.5 rounded-xl border border-[#092e5c] text-sm font-semibold transition-all active:scale-95 cursor-pointer"
            >
              <UserIcon size={15} className="text-slate-300" />
              <span>Perfil</span>
            </button>
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
              {currentView === "dashboard" && (
                <DashboardView
                  leads={leads}
                  planner={planner}
                  links={links}
                  profile={profile!}
                  onToast={showToast}
                  campanhas={campanhas}
                  bomDia={bomDia}
                  forecast={forecast}
                  periodos={periodos}
                  metaDia={metaDia}
                  qgLigacoes={qgLigacoes}
                  users={users}
                />
              )}
              {currentView === "relatorios" && (
                <RelatoriosView
                  leads={leads}
                  bases={bases}
                  fiesProuni={fiesProuni}
                  calendarioAcoes={calendarioAcoes}
                  empresasParceiras={empresasParceiras}
                  insumosPedidos={insumosPedidos}
                  insumosEstoque={insumosEstoque}
                  insumosBaixas={insumosBaixas}
                  profile={profile!}
                  onToast={showToast}
                />
              )}
              {currentView === "cadastro" && (
                <CadastroView
                  onToast={showToast}
                  profile={profile!}
                  calendarioAcoes={calendarioAcoes}
                />
              )}
              {currentView === "historico" && (
                <HistoricoView
                  leads={leads}
                  profile={profile!}
                  onToast={showToast}
                  users={users}
                  whatsappMessages={whatsappMessages}
                  botConfig={botConfig}
                  onSendBot={handleSendBotMessage}
                  onMassSendBot={handleMassSendBotMessages}
                  gap={gap}
                  basesRenovacao={basesRenovacao}
                  calendarioAcoes={calendarioAcoes}
                />
              )}
              {currentView === "bases" && (
                <BasesView
                  bases={bases}
                  profile={profile!}
                  onToast={showToast}
                  whatsappMessages={whatsappMessages}
                  botConfig={botConfig}
                  onSendBot={handleSendBotMessage}
                  onMassSendBot={handleMassSendBotMessages}
                  gap={gap}
                  basesRenovacao={basesRenovacao}
                />
              )}
              {currentView === "gap" && (
                <GapView
                  gap={gap}
                  onToast={showToast}
                  profile={profile}
                  whatsappMessages={whatsappMessages}
                  botConfig={botConfig}
                  onSendBot={handleSendBotMessage}
                  onMassSendBot={handleMassSendBotMessages}
                  calendarioAcoes={calendarioAcoes}
                />
              )}
              {currentView === "isencoes" && (
                <IsencoesView
                  isencoes={isencoes}
                  gap={gap}
                  onToast={showToast}
                  profile={profile!}
                />
              )}
              {currentView === "fiesProuni" && (
                <FiesProuniView
                  data={fiesProuni}
                  onToast={showToast}
                  profile={profile!}
                  whatsappMessages={whatsappMessages}
                  periodos={periodos}
                  botConfig={botConfig}
                  onSendBot={handleSendBotMessage}
                  onMassSendBot={handleMassSendBotMessages}
                />
              )}
              {currentView === "mapao" && (
                <MapaoAcademicoView
                  mapao={mapao}
                  onToast={showToast}
                  profile={profile!}
                />
              )}
              {currentView === "cursos" && (
                <CursosDisponiveisView
                  cursos={cursos}
                  onToast={showToast}
                  profile={profile!}
                />
              )}
              {currentView === "basesDisparo" && (
                <BasesDisparoView bases={basesDisparo} onToast={showToast} />
              )}
              {currentView === "basesRenovacao" && (
                <BasesRenovacaoView
                  bases={basesRenovacao}
                  onToast={showToast}
                  profile={profile}
                  whatsappMessages={whatsappMessages}
                  botConfig={botConfig}
                  onSendBot={handleSendBotMessage}
                  onMassSendBot={handleMassSendBotMessages}
                />
              )}
              {currentView === "campanhas" && (
                <CampanhasView campanhas={campanhas} onToast={showToast} />
              )}
              {currentView === "calculo" && <CalculoRemuneracaoView />}
              {currentView === "emailMarketing" && (
                <EmailMarketingView onToast={showToast} />
              )}
              {currentView === "controlePagamentos" && (
                <ControlePagamentosView
                  calendarioAcoes={calendarioAcoes}
                  users={users}
                  onToast={showToast}
                  profile={profile}
                />
              )}
              {currentView === "controleInsumos" && (
                <ControleInsumosView
                  pedidos={insumosPedidos}
                  estoque={insumosEstoque}
                  profile={profile!}
                  onToast={showToast}
                  botConfig={botConfig}
                />
              )}
              {currentView === "controleInsumosComercial" && (
                <ControleInsumosComercialView
                  pedidos={insumosPedidosComercial}
                  estoque={insumosEstoqueComercial}
                  profile={profile!}
                  onToast={showToast}
                  botConfig={botConfig}
                />
              )}
              {currentView === "calendario" && (
                <CalendarioAcoesView
                  data={calendarioAcoes}
                  onToast={showToast}
                  profile={profile!}
                  initialData={initialActionData}
                  onClearInitialData={() => setInitialActionData(null)}
                  users={users}
                  callBotApi={callBotApi}
                  leads={leads}
                  gap={gap}
                  onSendWhatsApp={sendAppWhatsApp}
                />
              )}
              {currentView === "empresas" && (
                <EmpresasParceirasView
                  data={empresasParceiras}
                  leads={leads}
                  acoes={calendarioAcoes}
                  onToast={showToast}
                  cursos={cursos}
                  users={users}
                  onSendWhatsApp={sendAppWhatsApp}
                  onGenerateAction={(empresa) => {
                    setInitialActionData({
                      nome: `Ação na empresa ${empresa.nome}`,
                      local: empresa.endereco,
                      observacao: `Responsável: ${empresa.responsavel}\nTelefone: ${empresa.telefone}`,
                    });
                    setCurrentView("calendario");
                  }}
                />
              )}
              {currentView === "controleConcorrencia" && (
                <ControleConcorrenciaView
                  data={controleConcorrencia}
                  onToast={showToast}
                />
              )}
                  {currentView === "admin" && (
                    <AdminView
                      profile={profile}
                      users={users}
                      links={links}
                      onToast={showToast}
                      leads={leads}
                      bases={bases}
                      gap={gap}
                      planner={planner}
                      campanhas={campanhas}
                      bomDia={bomDia}
                      forecast={forecast}
                      periodos={periodos}
                      whatsappMessages={whatsappMessages}
                      empresasParceiras={empresasParceiras}
                      botConfig={botConfig}
                      botStatuses={botStatuses}
                      setBotStatuses={setBotStatuses}
                      callBotApi={callBotApi}
                      metaDia={metaDia}
                      qgLigacoes={qgLigacoes}
                      cursos={cursos}
                    />
                  )}
            </motion.div>
          </AnimatePresence>

          <footer className="mt-12 py-6 border-t border-slate-200 text-center">
            <p className="text-sm text-slate-500 font-medium">
              Sistema Criado por{" "}
              <span className="font-bold text-slate-900">Agencia Argo's</span> -
              <a
                href={getWhatsAppUrl(
                  "24992777019",
                  "Gostaria de realizar um orçamento para um sistema",
                )}
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

function AvisosView() {
  return null;
}

function AuthScreen({
  onToast,
  botConfig,
}: {
  onToast: (m: string, t?: "success" | "error") => void;
  botConfig?: BotConfig;
}) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [servidor, setServidor] = useState<"principal" | "comercial">(
    (localStorage.getItem("servidor_selected") as "principal" | "comercial") ||
      "principal",
  );
  const [loading, setLoading] = useState(false);

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallGuide, setShowInstallGuide] = useState(false);
  const [showApkModal, setShowApkModal] = useState(false);
  const [isAppInstalled, setIsAppInstalled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone ||
      document.referrer.includes("android-app://");
    setIsAppInstalled(isStandalone);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
    };
  }, []);

  const handleInstallClick = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult: { outcome: string }) => {
        if (choiceResult.outcome === "accepted") {
          console.log("User accepted the PWA install prompt");
          setIsAppInstalled(true);
        }
        setDeferredPrompt(null);
      });
    } else {
      setShowInstallGuide((prev) => !prev);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (!isLogin && password.length < 6) {
      onToast("A senha deve ter pelo menos 6 caracteres.", "error");
      setLoading(false);
      return;
    }
    try {
      if (isLogin) {
        try {
          // Attempt login on the CURRENTLY SELECTED server
          await signInWithEmailAndPassword(auth, email, password);
        } catch (err: any) {
          // If user login fails with invalid credentials or user not found,
          // let's check programmatically if the credentials are valid on the OTHER server!
          const isUserNotFound =
            err.code === "auth/user-not-found" ||
            err.code === "auth/invalid-credential";
          if (isUserNotFound) {
            const currentSelected = servidor;
            const alternativeServer =
              currentSelected === "principal" ? "comercial" : "principal";

            // Build the alternative config
            const altConfig =
              alternativeServer === "comercial"
                ? firebaseConfigComercial
                : firebaseConfigPrincipal;

            // Resolve alternative app
            let altApp;
            try {
              altApp = getApp("alternative_login_check");
            } catch {
              altApp = initializeApp(altConfig, "alternative_login_check");
            }
            const altAuth = getAuth(altApp);

            try {
              // Attempt login on the ALTERNATIVE server
              await signInWithEmailAndPassword(altAuth, email, password);
              // SUCCESS on the other server! Let's update localStorage and reload to apply the active configuration
              localStorage.setItem("servidor_selected", alternativeServer);
              onToast(
                `Login bem sucedido! Redirecionando para o Servidor ${alternativeServer === "principal" ? "Principal" : "Comercial"}...`,
                "success",
              );
              setTimeout(() => {
                window.location.reload();
              }, 1200);
              return;
            } catch (altErr) {
              // Failed on both servers, throw the original authentication error
              throw err;
            }
          } else {
            throw err;
          }
        }
      } else {
        const userCred = await createUserWithEmailAndPassword(
          auth,
          email,
          password,
        );
        // Pack the chosen servidor into displayName so App.tsx can extract it
        await updateProfile(userCred.user, {
          displayName: `${name}|${servidor}`,
        });
        onToast("Conta criada com sucesso!");
      }
    } catch (err: any) {
      console.error("Auth error details (AuthScreen):", {
        code: err.code,
        message: err.message,
        stack: err.stack,
      });
      let friendlyMessage = err.message;
      if (
        err.code === "auth/user-not-found" ||
        err.code === "auth/invalid-credential"
      ) {
        friendlyMessage =
          "E-mail ou senha inválidos em ambos os servidores (Principal / Comercial).";
      } else if (err.code === "auth/wrong-password") {
        friendlyMessage = "Senha incorreta.";
      }
      onToast(`Erro: ${friendlyMessage}`, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#011430] flex flex-col md:flex-row relative overflow-hidden font-sans text-white">
      {/* Absolute Ambient Background Lights */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-blue-500/15 blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full bg-cyan-500/10 blur-[130px] pointer-events-none z-0" />

      {/* LEFT COLUMN: Login panel container */}
      <div className="w-full md:w-[42%] lg:w-[38%] xl:w-[34%] bg-[#011a3c] border-r border-[#092e5c] p-8 sm:p-12 md:p-16 flex flex-col justify-between relative z-10 shadow-2xl min-h-screen">
        <div className="my-auto space-y-8">
          <div>
            {botConfig?.loginLogo ? (
              <div className="mb-6 flex">
                <img
                  src={botConfig.loginLogo}
                  alt="Logo"
                  className="max-h-32 w-full object-contain drop-shadow-lg"
                  referrerPolicy="no-referrer"
                />
              </div>
            ) : (
              <>
                <div className="w-16 h-16 bg-gradient-to-tr from-sky-500 to-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-sky-500/20 mb-6">
                  <TrendingUp size={32} />
                </div>
                <h2 className="text-3xl font-extrabold text-white tracking-tight">
                  Gestão Oeste pro
                </h2>
              </>
            )}
            <p className="text-slate-400 mt-2 text-sm">
              {isLogin
                ? "Bem-vindo de volta! Insira suas credenciais:"
                : "Preencha os dados e crie sua conta agora:"}
            </p>
          </div>

          {/* Servidor Selector (Principal vs Comercial) */}
          <div className="flex bg-[#032554] p-1.5 rounded-2xl border border-[#0b3c7c] shadow-inner">
            <button
              type="button"
              onClick={() => {
                if (servidor !== "principal") {
                  localStorage.setItem("servidor_selected", "principal");
                  window.location.reload();
                }
              }}
              className={`flex-1 py-3 text-xs font-extrabold rounded-xl transition-all cursor-pointer ${servidor === "principal" ? "bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow shadow-sky-500/20" : "text-slate-400 hover:text-white"}`}
            >
              Principal
            </button>
            <button
              type="button"
              onClick={() => {
                if (servidor !== "comercial") {
                  localStorage.setItem("servidor_selected", "comercial");
                  window.location.reload();
                }
              }}
              className={`flex-1 py-3 text-xs font-extrabold rounded-xl transition-all cursor-pointer ${servidor === "comercial" ? "bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow shadow-sky-500/20" : "text-slate-400 hover:text-white"}`}
            >
              Comercial
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 font-sans">
            {!isLogin && (
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Nome Completo
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full bg-[#032654] border border-[#0d4182] text-white px-4 py-3.5 rounded-xl focus:ring-2 focus:ring-sky-500 outline-none transition-all placeholder-slate-500 text-sm font-medium"
                  placeholder="Seu nome"
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-[#032654] border border-[#0d4182] text-white px-4 py-3.5 rounded-xl focus:ring-2 focus:ring-sky-500 outline-none transition-all placeholder-slate-500 text-sm font-medium"
                placeholder="seu@email.com"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Senha
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-[#032654] border border-[#0d4182] text-white px-4 py-3.5 rounded-xl focus:ring-2 focus:ring-sky-500 outline-none transition-all placeholder-slate-500 text-sm font-medium"
                placeholder="••••••••"
              />
            </div>

            {isLogin && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={async () => {
                    let resetEmail = email;
                    if (!resetEmail) {
                      const inputEmail = window.prompt("Por favor, digite seu e-mail para receber o link de redefinição de senha:");
                      if (!inputEmail) return;
                      resetEmail = inputEmail;
                    }
                    try {
                      await sendPasswordResetEmail(auth, resetEmail);
                      onToast("E-mail de redefinição enviado com sucesso! Verifique sua caixa de entrada.", "success");
                    } catch (err: any) {
                      onToast("Erro ao enviar e-mail. Verifique se o endereço é válido.", "error");
                    }
                  }}
                  className="text-xs font-bold text-sky-400 hover:text-sky-300 hover:underline transition-colors cursor-pointer"
                >
                  Esqueci minha senha
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-tr from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-bold py-4 rounded-xl shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] cursor-pointer"
            >
              {loading
                ? "Processando..."
                : isLogin
                  ? "Entrar no Sistema"
                  : "Criar Minha Conta"}
            </button>
          </form>

          <div className="mt-8 text-center pt-2 border-t border-[#092e5c]">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm font-semibold text-sky-400 hover:text-sky-300 hover:underline cursor-pointer"
            >
              {isLogin
                ? "Não tem uma conta? Cadastre-se"
                : "Já tem uma conta? Faça login"}
            </button>
          </div>

          {/* Android App Promotion Card on Login */}
          {!isAppInstalled && (
            <div className="mt-8 pt-6 border-t border-[#092e5c] space-y-4">
              <div className="bg-[#032554]/60 p-5 rounded-2xl border border-sky-500/10 text-white relative overflow-hidden transition-all duration-300">
                <div className="flex items-start space-x-3.5">
                  <div className="p-2.5 bg-sky-950/80 rounded-xl border border-sky-500/20 text-emerald-400 flex items-center justify-center shadow shrink-0">
                    <Smartphone size={24} />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-extrabold text-white leading-tight">
                      Instalar Aplicativo (Android)
                    </h4>
                    <p className="text-xs text-slate-300 leading-relaxed font-semibold">
                      Deseja usar no celular? Instale o App para usar{" "}
                      <strong className="text-emerald-400 font-extrabold">
                        com ou sem internet
                      </strong>
                      . Sincroniza automático ao conectar.
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 mt-4">
                  <button
                    onClick={handleInstallClick}
                    className="flex-1 flex items-center justify-center space-x-1.5 px-3 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold text-xs rounded-lg shadow-md hover:scale-[1.01] transition-all cursor-pointer"
                  >
                    <Download size={14} />
                    <span>Instalar no Aparelho</span>
                  </button>
                  <button
                    onClick={() => setShowInstallGuide(!showInstallGuide)}
                    className="px-3 py-2.5 bg-white/10 hover:bg-white/15 text-slate-100 font-bold text-xs rounded-lg transition-all cursor-pointer flex-1"
                  >
                    Instruções
                  </button>
                </div>

                {showInstallGuide && (
                  <div className="mt-4 pt-4 border-t border-[#092e5c] space-y-3 text-xs">
                    <div className="space-y-1">
                      <span className="text-[10px] font-black uppercase text-emerald-400">
                        Passo 1:
                      </span>
                      <p className="text-slate-300 font-semibold leading-relaxed">
                        Abra este endereço no{" "}
                        <strong className="text-white font-bold">
                          Google Chrome
                        </strong>{" "}
                        do seu Android.
                      </p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-black uppercase text-emerald-400">
                        Passo 2:
                      </span>
                      <p className="text-slate-300 font-semibold leading-relaxed">
                        Toque nos{" "}
                        <strong className="text-white font-bold">
                          três pontinhos (⋮)
                        </strong>{" "}
                        no canto superior direito.
                      </p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-black uppercase text-emerald-400">
                        Passo 3:
                      </span>
                      <p className="text-slate-300 font-semibold leading-relaxed">
                        Selecione{" "}
                        <strong className="text-emerald-400 font-extrabold">
                          "Instalar aplicativo"
                        </strong>{" "}
                        ou{" "}
                        <strong className="text-emerald-400 font-extrabold">
                          "Adicionar à tela inicial"
                        </strong>
                        .
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Humble system credits info */}
        <div className="text-center text-[10px] text-slate-500 font-mono tracking-widest mt-6">
          OESTE HUNTER © {new Date().getFullYear()}
        </div>
      </div>

      {/* RIGHT COLUMN: The majestic interactive Oeste Hunter logo artwork or Custom Logo */}
      <div className="hidden md:flex flex-1 items-center justify-center bg-[#01112c] p-12 relative overflow-hidden z-0">
        {/* Subtle grid mesh backdrop */}
        <div className="absolute inset-0 bg-[radial-gradient(#082a5c_1px,transparent_1px)] [background-size:24px_24px] opacity-25" />

        {/* Animated ambient outer halo circles */}
        <div className="absolute w-[600px] h-[600px] border border-[#0d4182]/20 rounded-full animate-pulse" />
        <div className="absolute w-[800px] h-[800px] border border-[#0d4182]/10 rounded-full opacity-60" />

        {/* SVG ART Container */}
        <div className="relative z-10 w-full flex justify-center">
          {botConfig?.loginLogo ? (
            <img
              src={botConfig.loginLogo}
              alt="Logo Promocional"
              className="w-full max-w-[560px] aspect-square rounded-3xl object-contain drop-shadow-[0_35px_60px_rgba(14,116,253,0.35)] border border-slate-700/40 p-12 bg-[#011a3c]/50 animate-fade-in"
              referrerPolicy="no-referrer"
            />
          ) : (
            /* Oeste Hunter Badge SVG */
            <svg
              viewBox="0 0 1000 1000"
              className="w-full max-w-[560px] aspect-square drop-shadow-[0_25px_60px_rgba(14,116,253,0.35)] select-none"
            >
              <defs>
                <linearGradient
                  id="blueRingGrad"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor="#0a397a" />
                  <stop offset="50%" stopColor="#125cb5" />
                  <stop offset="100%" stopColor="#082c5f" />
                </linearGradient>
                <linearGradient
                  id="wolfEyeGrad"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="0%"
                >
                  <stop offset="0%" stopColor="#00f0ff" />
                  <stop offset="100%" stopColor="#00a8ff" />
                </linearGradient>
                <linearGradient
                  id="muzzleGrad"
                  x1="0%"
                  y1="0%"
                  x2="0%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="100%" stopColor="#cfd8dc" />
                </linearGradient>
                <linearGradient
                  id="bannerGrad"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="0%"
                >
                  <stop offset="0%" stopColor="#010f24" />
                  <stop offset="50%" stopColor="#051c3d" />
                  <stop offset="100%" stopColor="#010d21" />
                </linearGradient>
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="8" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
                <filter
                  id="eyeGlow"
                  x="-50%"
                  y="-50%"
                  width="200%"
                  height="200%"
                >
                  <feGaussianBlur stdDeviation="6" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Target Crosshairs Reticle */}
              <g stroke="#ffffff" strokeWidth="2.5" opacity="0.3">
                {/* Vertical Crosshair Line */}
                <line x1="500" y1="20" x2="500" y2="980" />
                {/* Horizontal Crosshair Line */}
                <line x1="20" y1="500" x2="980" y2="500" />

                {/* Target ticks (top, bottom, left, right) */}
                <line x1="500" y1="80" x2="520" y2="80" />
                <line x1="500" y1="140" x2="515" y2="140" />
                <line x1="500" y1="200" x2="520" y2="200" />

                <line x1="500" y1="920" x2="520" y2="920" />
                <line x1="500" y1="860" x2="515" y2="860" />
                <line x1="500" y1="800" x2="520" y2="800" />

                <line x1="80" y1="500" x2="80" y2="520" />
                <line x1="140" y1="500" x2="140" y2="515" />
                <line x1="200" y1="500" x2="200" y2="520" />

                <line x1="920" y1="500" x2="920" y2="520" />
                <line x1="860" y1="500" x2="860" y2="515" />
                <line x1="800" y1="500" x2="800" y2="520" />
              </g>

              {/* Target Reticle Outer Box ticks */}
              <rect
                x="480"
                y="40"
                width="40"
                height="20"
                fill="none"
                stroke="#ffffff"
                strokeWidth="3"
                opacity="0.4"
              />
              <rect
                x="480"
                y="940"
                width="40"
                height="20"
                fill="none"
                stroke="#ffffff"
                strokeWidth="3"
                opacity="0.4"
              />
              <rect
                x="40"
                y="480"
                width="20"
                height="40"
                fill="none"
                stroke="#ffffff"
                strokeWidth="3"
                opacity="0.4"
              />
              <rect
                x="940"
                y="480"
                width="20"
                height="40"
                fill="none"
                stroke="#ffffff"
                strokeWidth="3"
                opacity="0.4"
              />

              {/* 1. Outer target circle with dashes */}
              <circle
                cx="500"
                cy="500"
                r="445"
                fill="none"
                stroke="#ffffff"
                strokeWidth="3"
                strokeDasharray="16 20"
                opacity="0.35"
              />

              {/* 2. Concentric circle borders */}
              <circle
                cx="500"
                cy="500"
                r="415"
                fill="none"
                stroke="#ffffff"
                strokeWidth="2.5"
                opacity="0.4"
              />

              {/* 3. Main Thick Ring Outer Rim */}
              <circle
                cx="500"
                cy="500"
                r="400"
                fill="none"
                stroke="#ffffff"
                strokeWidth="4"
              />

              {/* 4. The Mighty Blue Ring Body */}
              <circle
                cx="500"
                cy="500"
                r="348"
                fill="none"
                stroke="url(#blueRingGrad)"
                strokeWidth="100"
              />

              {/* 5. Inner Rim of the Blue Ring */}
              <circle
                cx="500"
                cy="500"
                r="298"
                fill="none"
                stroke="#ffffff"
                strokeWidth="4"
              />

              {/* 6. Main Inner Graphic Backdrop (Turquoise circle) */}
              <circle
                cx="500"
                cy="500"
                r="294"
                fill="#009be1"
                stroke="#ffffff"
                strokeWidth="2"
              />
              <circle cx="500" cy="500" r="275" fill="#0388c7" />

              {/* Curves for circular text alignment */}
              {/* Path for 'OESTE' arched on top (left-to-right) */}
              <path
                id="topArchPath"
                d="M 160,500 A 340,340 0 0,1 840,500"
                fill="none"
              />

              {/* Path for 'OESTE HUNTER' arched on bottom (right-to-left) */}
              <path
                id="bottomArchPath"
                d="M 840,500 A 340,340 0 0,1 160,500"
                fill="none"
              />

              {/* Arched Texts */}
              <text
                fontFamily="'Inter', sans-serif"
                fontWeight="900"
                fontSize="75"
                fill="#ffffff"
                letterSpacing="18"
              >
                <textPath
                  href="#topArchPath"
                  startOffset="50%"
                  textAnchor="middle"
                >
                  OESTE
                </textPath>
              </text>

              <text
                fontFamily="'Inter', sans-serif"
                fontWeight="900"
                fontSize="44"
                fill="#ffffff"
                letterSpacing="14"
              >
                <textPath
                  href="#bottomArchPath"
                  startOffset="50%"
                  textAnchor="middle"
                >
                  OESTE HUNTER
                </textPath>
              </text>

              {/* ======================================= */}
              {/* WOLF HEAD INTERIOR ELEMENT MASCOT ART   */}
              {/* ======================================= */}
              <g id="wolfMascot" transform="translate(0, -35)">
                {/* Wolf Ears Behind */}
                {/* Left ear dark back */}
                <polygon
                  points="350,330 435,420 380,480"
                  fill="#020f2b"
                  stroke="#ffffff"
                  strokeWidth="3"
                />
                {/* Left ear internal blue */}
                <polygon points="365,345 425,415 385,465" fill="#0096e6" />

                {/* Right ear dark back */}
                <polygon
                  points="650,330 565,420 620,480"
                  fill="#020f2b"
                  stroke="#ffffff"
                  strokeWidth="3"
                />
                {/* Right ear internal blue */}
                <polygon points="635,345 575,415 615,465" fill="#0096e6" />

                {/* Wolf Forehead and Cheek structure */}
                {/* Base Head polygon */}
                <polygon
                  points="500,380 340,500 370,625 500,680 630,625 660,500"
                  fill="#03112b"
                />

                {/* White outer framing highlights (Cheek fur) */}
                {/* Left cheek outer fluff */}
                <polygon
                  points="340,500 310,560 385,585"
                  fill="#ffffff"
                  stroke="#ffffff"
                  strokeWidth="2.5"
                />
                <polygon
                  points="310,560 330,630 400,610"
                  fill="#ffffff"
                  stroke="#ffffff"
                  strokeWidth="2.5"
                />

                {/* Right cheek outer fluff */}
                <polygon
                  points="660,500 690,560 615,585"
                  fill="#ffffff"
                  stroke="#ffffff"
                  strokeWidth="2.5"
                />
                <polygon
                  points="690,560 670,630 600,610"
                  fill="#ffffff"
                  stroke="#ffffff"
                  strokeWidth="2.5"
                />

                {/* Intermediate Blue Shadows Cheeks */}
                <polygon points="340,500 385,585 410,515" fill="#0a3c7c" />
                <polygon points="660,500 615,585 590,515" fill="#0a3c7c" />

                {/* Side Dark fur shades */}
                <polygon
                  points="410,515 385,585 440,590 460,530"
                  fill="#00183b"
                />
                <polygon
                  points="590,515 615,585 560,590 540,530"
                  fill="#00183b"
                />

                {/* Center forehead wolf shield (cyan core) */}
                <polygon points="500,380 460,470 500,510" fill="#00bdff" />
                <polygon points="500,380 540,470 500,510" fill="#00bdff" />

                <polygon points="500,395 470,470 500,500" fill="#ffffff" />
                <polygon points="500,395 530,470 500,500" fill="#ffffff" />

                {/* Wolf Eyes Areas (Black framing masks) */}
                <polygon
                  points="420,490 470,510 460,535 410,515"
                  fill="#010614"
                />
                <polygon
                  points="580,490 530,510 540,535 590,515"
                  fill="#010614"
                />

                {/* Fierce Cyan Eyes */}
                <polygon
                  points="432,498 462,510 452,525 430,512"
                  fill="url(#wolfEyeGrad)"
                  filter="url(#eyeGlow)"
                />
                <polygon
                  points="568,498 538,510 548,525 570,512"
                  fill="url(#wolfEyeGrad)"
                  filter="url(#eyeGlow)"
                />

                {/* Wolf Nose Bridge */}
                <polygon
                  points="500,510 460,530 475,590 500,610"
                  fill="#020f26"
                />
                <polygon
                  points="500,510 540,530 525,590 500,610"
                  fill="#020f26"
                />

                <polygon
                  points="500,510 480,530 485,585 500,600"
                  fill="#0080cf"
                />
                <polygon
                  points="500,510 520,530 515,585 500,600"
                  fill="#0080cf"
                />

                {/* Muzzle (White muzzle side facets) */}
                <polygon
                  points="500,610 440,590 445,635 500,665"
                  fill="url(#muzzleGrad)"
                  stroke="#ffffff"
                  strokeWidth="2.5"
                />
                <polygon
                  points="500,610 560,590 555,635 500,665"
                  fill="url(#muzzleGrad)"
                  stroke="#ffffff"
                  strokeWidth="2.5"
                />

                {/* Black Nose Tip */}
                <polygon points="500,620 475,605 525,605" fill="#010614" />
                <polygon points="500,620 485,635 515,635" fill="#010614" />
                <polygon
                  points="475,605 525,605 515,635 485,635"
                  fill="#010614"
                />
                {/* Nose shine */}
                <circle cx="500" cy="612" r="3" fill="#ffffff" />
              </g>

              {/* Left and Right Side Banners - NPS and CAPTAÇÃO DE ALUNOS */}
              {/* LEFT BANNER (NPS) */}
              <g id="leftBanner">
                <polygon
                  points="6,505 130,505 110,615 6,615 30,560"
                  fill="#07336e"
                  stroke="#ffffff"
                  strokeWidth="3"
                />
                <polygon
                  points="12,515 120,515 104,605 12,605"
                  fill="#0b4594"
                />

                <text
                  x="63"
                  y="578"
                  textAnchor="middle"
                  fontFamily="'Inter', sans-serif"
                  fontWeight="900"
                  fontSize="46"
                  fill="#ffffff"
                  letterSpacing="1"
                >
                  NPS
                </text>
              </g>

              {/* RIGHT BANNER (CAPTAÇÃO DE ALUNOS) */}
              <g id="rightBanner">
                <polygon
                  points="994,505 870,505 890,615 994,615 970,560"
                  fill="#07336e"
                  stroke="#ffffff"
                  strokeWidth="3"
                />
                <polygon
                  points="988,515 880,515 896,605 988,605"
                  fill="#0b4594"
                />

                <text
                  x="934"
                  y="555"
                  textAnchor="middle"
                  fontFamily="'Inter', sans-serif"
                  fontWeight="900"
                  fontSize="20"
                  fill="#ffffff"
                  letterSpacing="2"
                >
                  CAPTAÇÃO
                </text>
                <text
                  x="934"
                  y="583"
                  textAnchor="middle"
                  fontFamily="'Inter', sans-serif"
                  fontWeight="900"
                  fontSize="18"
                  fill="#ffffff"
                  letterSpacing="1"
                >
                  DE ALUNOS
                </text>
              </g>

              {/* Giant Horizontal Bottom Ribbon - HUNTER */}
              <g id="hunterBanner" transform="translate(0, 10)">
                {/* Banner Ribbon shadow back folds */}
                <polygon points="180,685 240,685 220,625" fill="#01050e" />
                <polygon points="820,685 760,685 780,625" fill="#01050e" />

                {/* Front Main Banner Body */}
                <polygon
                  points="180,625 820,625 790,735 210,735"
                  fill="url(#bannerGrad)"
                  stroke="#ffffff"
                  strokeWidth="6"
                />

                {/* Inner stroke accent */}
                <polygon
                  points="195,635 805,635 780,725 220,725"
                  fill="none"
                  stroke="#2575fc"
                  strokeWidth="3.5"
                  opacity="0.8"
                />

                {/* Bold Athletics display text - HUNTER */}
                <text
                  x="500"
                  y="702"
                  textAnchor="middle"
                  fontFamily="'Impact', 'Arial Black', 'Inter', sans-serif"
                  fontWeight="900"
                  fontSize="105"
                  fill="#ffffff"
                  letterSpacing="5"
                  filter="url(#glow)"
                >
                  HUNTER
                </text>
              </g>
            </svg>
          )}
        </div>
      </div>

      {/* APK Information Modal */}
      {showApkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative overflow-hidden">
            {/* Header / Icon */}
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
              <Download size={32} className="text-blue-600" />
            </div>

            <h3 className="text-xl font-black text-slate-800 text-center mb-2">
              Download do Arquivo APK
            </h3>
            <p className="text-sm text-slate-500 text-center font-medium leading-relaxed mb-6">
              O projeto nativo Android foi gerado e configurado usando
              Capacitor.
            </p>

            <div className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-100 mb-6">
              <div className="flex items-start gap-3">
                <div className="bg-emerald-100 text-emerald-600 p-1.5 rounded-lg shrink-0 mt-0.5">
                  <Smartphone size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">
                    1. Instalação Imediata (Via Chrome)
                  </h4>
                  <p className="text-xs text-slate-600 mt-1 font-medium">
                    Recomendado: Feche esta aba e clique em{" "}
                    <strong className="text-emerald-600">
                      "Instalar no Aparelho"
                    </strong>{" "}
                    na tela de login (usando o Google Chrome no seu celular)
                    para instalação automática PWA/WebAPK direta no aparelho.
                  </p>
                </div>
              </div>

              <div className="w-full h-px bg-slate-200"></div>

              <div className="flex items-start gap-3">
                <div className="bg-amber-100 text-amber-600 p-1.5 rounded-lg shrink-0 mt-0.5">
                  <Download size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">
                    2. Desenvolvedores (Compilação Nativa)
                  </h4>
                  <p className="text-xs text-slate-600 mt-1 font-medium">
                    Devido as limitações do ambiente Cloud, o arquivo{" "}
                    <strong className="font-bold">.apk</strong> real precisa ser
                    compilado localmente: Exporte os arquivos do app, abra a
                    pasta{" "}
                    <code className="bg-slate-200 px-1 py-0.5 rounded font-mono text-amber-800">
                      android/
                    </code>{" "}
                    no Android Studio e compile o APK.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowApkModal(false)}
                className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-all cursor-pointer"
              >
                Voltar à Tela Inicial
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DashboardView({
  leads,
  planner,
  links,
  profile,
  onToast,
  campanhas,
  bomDia,
  forecast,
  periodos,
  metaDia,
  qgLigacoes,
  users,
}: {
  leads: Lead[];
  planner: PlannerTask[];
  links: LinkUtil[];
  profile: UserProfile;
  onToast: (m: string, t?: "success" | "error") => void;
  campanhas: Campanha[];
  bomDia: BomDiaCaptacao[];
  forecast: ForecastCaptacao[];
  periodos: PeriodoCaptacao[];
  metaDia: MetaDia[];
  qgLigacoes: QgLigacao[];
  users: UserProfile[];
}) {
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallGuide, setShowInstallGuide] = useState(false);
  const [isAppInstalled, setIsAppInstalled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone ||
      document.referrer.includes("android-app://");
    setIsAppInstalled(isStandalone);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
    };
  }, []);

  const handleInstallClick = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult: { outcome: string }) => {
        if (choiceResult.outcome === "accepted") {
          console.log("User accepted the PWA install prompt");
          setIsAppInstalled(true);
        }
        setDeferredPrompt(null);
      });
    } else {
      setShowInstallGuide(true);
    }
  };

  const defaultWidgets = {
    stats: false,
    links: true,
    planner: true,
    campanhas: false,
    bomDia: true,
    forecast: true,
    periodo: true,
    qgLigacoes: true,
    aniversarios: true,
  };
  const widgets = profile?.dashboardWidgets
    ? { ...defaultWidgets, ...profile.dashboardWidgets }
    : defaultWidgets;

  const currentMonthNum = new Date().getMonth() + 1; // 1-12
  const monthNamesPt = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];
  const currentMonthName = monthNamesPt[currentMonthNum - 1];

  const currentDayNum = new Date().getDate();
  const checkIsToday = (dob: string) => {
    const parts = dob.split("-");
    if (parts.length !== 3) return false;
    return (
      parseInt(parts[2], 10) === currentDayNum &&
      parseInt(parts[1], 10) === currentMonthNum
    );
  };

  const birthdaysThisMonth = (users || [])
    .filter((u) => {
      if (u.blocked) return false;
      if (!u.dataNascimento) return false;
      const dateParts = u.dataNascimento.split("-");
      if (dateParts.length !== 3) return false;
      const birthMonth = parseInt(dateParts[1], 10);
      return birthMonth === currentMonthNum;
    })
    .sort((a, b) => {
      const dayA = parseInt(a.dataNascimento!.split("-")[2], 10);
      const dayB = parseInt(b.dataNascimento!.split("-")[2], 10);
      return dayA - dayB;
    });

  const today = new Date().toISOString().split("T")[0];
  const activePeriod = periodos.find(
    (p) => today >= p.inicioInscricao && today <= p.fimMatFin,
  );

  // Find meta for today, or find the latest meta as a fallback
  const todayEntry = metaDia.find((m) => m.data === today);
  const latestEntry =
    metaDia.length > 0
      ? [...metaDia].sort((a, b) => b.data.localeCompare(a.data))[0]
      : null;
  const activeMeta = todayEntry || latestEntry;

  const days = [
    "Segunda-feira",
    "Terça-feira",
    "Quarta-feira",
    "Quinta-feira",
    "Sexta-feira",
    "Sábado",
    "Domingo",
  ];

  const toggleWidget = async (
    key: keyof NonNullable<UserProfile["dashboardWidgets"]>,
  ) => {
    try {
      const newWidgets = { ...widgets, [key]: !widgets[key] };
      await updateDoc(doc(db, COLLECTIONS.USERS, profile.uid), {
        dashboardWidgets: newWidgets,
      });
      onToast("Preferências salvas!");
    } catch (err: any) {
      onToast("Erro ao salvar preferências.", "error");
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

      {/* Android App Promotion Card */}
      {!isAppInstalled && (
        <div
          id="android-app-prompt-card"
          className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-6 rounded-3xl text-white shadow-xl relative overflow-hidden border border-slate-700/60 transition-all duration-300"
        >
          {/* Decorative design bubbles */}
          <div className="absolute -top-16 -right-16 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl"></div>
          <div className="absolute -bottom-16 -left-16 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl"></div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="flex items-start space-x-4">
              <div className="p-3.5 bg-slate-800/80 rounded-2xl border border-slate-700/80 flex items-center justify-center shadow-lg transform hover:scale-105 transition-all shrink-0">
                <img
                  src="/icon.svg"
                  alt="Gestão Oeste"
                  className="w-12 h-12 rounded-xl object-contain"
                />
              </div>
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-wider rounded-md border border-emerald-500/30">
                    Instalação Android
                  </span>
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                    Suporte Offline Completo
                  </span>
                </div>
                <h3 className="text-xl font-black tracking-tight leading-none text-white">
                  Instalar Aplicativo Gestão Oeste no Android
                </h3>
                <p className="text-sm text-slate-300 max-w-2xl mt-1.5 leading-relaxed font-semibold">
                  Trabalhe de qualquer lugar! Faça pedidos de insumos e
                  visualize dados{" "}
                  <strong className="text-emerald-400 font-bold">
                    com ou sem internet
                  </strong>
                  . Ao voltar a ter conexão, o sistema sincroniza
                  automaticamente com o servidor.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3 shrink-0 self-end md:self-center">
              <button
                onClick={handleInstallClick}
                className="flex items-center space-x-2 px-5 py-3 bg-emerald-500 hover:bg-emerald-600 active:transform active:scale-95 text-slate-950 font-extrabold text-sm rounded-xl shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
              >
                <Smartphone size={18} />
                <span>Instalar Aplicativo</span>
              </button>
              <button
                onClick={() => setShowInstallGuide(!showInstallGuide)}
                className="flex items-center space-x-2 px-4 py-3 bg-white/10 hover:bg-white/15 text-slate-100 font-bold text-sm rounded-xl transition-all cursor-pointer"
              >
                <span>Instruções</span>
              </button>
            </div>
          </div>

          {/* Expanded Step-by-Step Installation Guide */}
          {showInstallGuide && (
            <div className="mt-6 pt-6 border-t border-slate-700/60 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm animate-fade-in">
              <div className="bg-slate-800/40 p-4 rounded-2xl border border-slate-700/40 space-y-2">
                <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-extrabold flex items-center justify-center text-xs">
                  1
                </span>
                <h4 className="font-extrabold text-white flex items-center gap-1.5 text-xs uppercase tracking-wider">
                  <Chrome size={14} className="text-emerald-400" /> No Google
                  Chrome
                </h4>
                <p className="text-slate-300 text-xs leading-relaxed font-semibold">
                  Abra este site no seu aparelho Android utilizando o navegador{" "}
                  <strong className="text-emerald-400 font-bold">
                    Google Chrome
                  </strong>
                  .
                </p>
              </div>

              <div className="bg-slate-800/40 p-4 rounded-2xl border border-slate-700/40 space-y-2">
                <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-extrabold flex items-center justify-center text-xs">
                  2
                </span>
                <h4 className="font-extrabold text-white flex items-center gap-1.5 text-xs uppercase tracking-wider">
                  <Smartphone size={14} className="text-emerald-400" /> Menu de
                  Opções
                </h4>
                <p className="text-slate-300 text-xs leading-relaxed font-semibold">
                  Toque nos{" "}
                  <strong className="text-white font-bold">
                    três pontinhos (⋮)
                  </strong>{" "}
                  localizados no canto superior direito do navegador Chrome.
                </p>
              </div>

              <div className="bg-slate-800/40 p-4 rounded-2xl border border-slate-700/40 space-y-2">
                <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-extrabold flex items-center justify-center text-xs">
                  3
                </span>
                <h4 className="font-extrabold text-white flex items-center gap-1.5 text-xs uppercase tracking-wider">
                  <Download size={14} className="text-emerald-400" /> Instalar
                  App
                </h4>
                <p className="text-slate-300 text-xs leading-relaxed font-semibold">
                  Selecione{" "}
                  <strong className="text-emerald-400 font-bold">
                    "Instalar aplicativo"
                  </strong>{" "}
                  ou{" "}
                  <strong className="text-emerald-400 font-bold">
                    "Adicionar à tela de início"
                  </strong>
                  . Um atalho oficial será criado no seu telefone!
                </p>
              </div>

              <div className="col-span-1 md:col-span-3 flex justify-end mt-2 animate-fade-in">
                <button
                  onClick={() => setShowInstallGuide(false)}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 rounded-lg hover:text-white transition-all font-bold cursor-pointer border border-slate-700"
                >
                  Fechar Instruções
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {activeMeta && (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div>
              <div className="flex items-center space-x-2 text-slate-900">
                <Target size={20} className="text-blue-600" />
                <h3 className="text-lg font-bold">
                  Acompanhamento de Meta Diária
                </h3>
              </div>
              <p className="text-xs text-slate-400 font-medium mt-1">
                Referente ao dia:{" "}
                <span className="font-bold">
                  {new Date(activeMeta.data + "T00:00:00").toLocaleDateString(
                    "pt-BR",
                  )}
                </span>
                {activeMeta.data === today
                  ? " (Hoje)"
                  : " (Última meta registrada)"}
              </p>
            </div>

            {(() => {
              const totYTD =
                activeMeta.ytdPresencial +
                activeMeta.ytdSemipresencial +
                activeMeta.ytdDigital;
              const totReal =
                activeMeta.realizadoPresencial +
                activeMeta.realizadoSemipresencial +
                activeMeta.realizadoDigital;

              let statusText = "Abaixo da Meta";
              let statusColor = "bg-rose-50 text-rose-600 border-rose-100";
              if (totReal > totYTD) {
                statusText = "Meta Superada!";
                statusColor =
                  "bg-emerald-50 text-emerald-600 border-emerald-100";
              } else if (totReal === totYTD) {
                statusText = "Meta Atingida";
                statusColor = "bg-blue-50 text-blue-600 border-blue-100";
              }

              return (
                <span
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-bold border mt-2 sm:mt-0",
                    statusColor,
                  )}
                >
                  {statusText}
                </span>
              );
            })()}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
            <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase">
                Boletos Necessários (YTD)
              </span>
              <span className="text-2xl font-black text-slate-800 mt-2">
                {activeMeta.ytdPresencial +
                  activeMeta.ytdSemipresencial +
                  activeMeta.ytdDigital}
              </span>
            </div>

            {(() => {
              const totYTD =
                activeMeta.ytdPresencial +
                activeMeta.ytdSemipresencial +
                activeMeta.ytdDigital;
              const totReal =
                activeMeta.realizadoPresencial +
                activeMeta.realizadoSemipresencial +
                activeMeta.realizadoDigital;

              let color = "text-rose-600";
              if (totReal > totYTD) color = "text-emerald-600";
              else if (totReal === totYTD) color = "text-blue-600";

              return (
                <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 flex flex-col justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">
                    Total Realizado
                  </span>
                  <span className={cn("text-2xl font-black mt-2", color)}>
                    {totReal}
                  </span>
                </div>
              );
            })()}

            <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase">
                Ano Anterior (A.A)
              </span>
              <span className="text-2xl font-black text-slate-500 mt-2">
                {activeMeta.aaPresencial +
                  activeMeta.aaSemipresencial +
                  activeMeta.aaDigital +
                  (activeMeta.aaTecnico || 0)}
              </span>
            </div>

            {(() => {
              const totYTD =
                activeMeta.ytdPresencial +
                activeMeta.ytdSemipresencial +
                activeMeta.ytdDigital +
                (activeMeta.ytdTecnico || 0);
              const totReal =
                activeMeta.realizadoPresencial +
                activeMeta.realizadoSemipresencial +
                activeMeta.realizadoDigital +
                (activeMeta.realizadoTecnico || 0);
              const pct = totYTD > 0 ? (totReal / totYTD) * 100 : 0;

              let pctBg = "bg-rose-50 text-rose-700";
              if (totReal > totYTD) pctBg = "bg-emerald-50 text-emerald-700";
              else if (totReal === totYTD) pctBg = "bg-blue-50 text-blue-700";

              return (
                <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 flex flex-col justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">
                    Aproveitamento
                  </span>
                  <div className="flex items-baseline space-x-2 mt-2">
                    <span
                      className={cn(
                        "text-xl font-extrabold px-2.5 py-0.5 rounded-lg",
                        pctBg,
                      )}
                    >
                      {pct.toFixed(0)}%
                    </span>
                  </div>
                </div>
              );
            })()}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2 border-t border-slate-100">
            {[
              {
                label: "Presencial",
                ytd: activeMeta.ytdPresencial,
                real: activeMeta.realizadoPresencial,
                aa: activeMeta.aaPresencial,
                accent: "border-l-4 border-l-blue-500",
              },
              {
                label: "Semipresencial",
                ytd: activeMeta.ytdSemipresencial,
                real: activeMeta.realizadoSemipresencial,
                aa: activeMeta.aaSemipresencial,
                accent: "border-l-4 border-l-orange-500",
              },
              {
                label: "Digital",
                ytd: activeMeta.ytdDigital,
                real: activeMeta.realizadoDigital,
                aa: activeMeta.aaDigital,
                accent: "border-l-4 border-l-indigo-500",
              },
              {
                label: "Curso Técnico",
                ytd: activeMeta.ytdTecnico || 0,
                real: activeMeta.realizadoTecnico || 0,
                aa: activeMeta.aaTecnico || 0,
                accent: "border-l-4 border-l-emerald-500",
              },
            ].map((modal, idx) => {
              let color = "text-rose-600";
              if (modal.real > modal.ytd) color = "text-emerald-600";
              else if (modal.real === modal.ytd) color = "text-blue-600";

              return (
                <div
                  key={idx}
                  className={cn(
                    "bg-slate-50/30 p-3 rounded-xl border border-slate-100 flex justify-between items-center",
                    modal.accent,
                  )}
                >
                  <div>
                    <span className="text-xs font-bold text-slate-700">
                      {modal.label}
                    </span>
                    <span className="block text-[10px] text-slate-400">
                      Ano Ant: {modal.aa}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">
                      Meta / Real
                    </span>
                    <span className="text-xs font-semibold text-slate-600">
                      {modal.ytd}
                    </span>
                    <span className="mx-1 text-slate-300">/</span>
                    <span className={cn("text-xs font-bold", color)}>
                      {modal.real}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Aniversariantes do Mês Widget */}
      {widgets.aniversarios !== false && (
        <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex items-center space-x-2 text-rose-500 mb-6">
            <Cake size={24} />
            <h3 className="text-xl font-bold text-slate-900">
              Aniversariantes do Mês ({currentMonthName})
            </h3>
          </div>
          {birthdaysThisMonth.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {birthdaysThisMonth.map((u) => {
                const bday = parseInt(u.dataNascimento!.split("-")[2], 10);
                const isToday = checkIsToday(u.dataNascimento!);
                return (
                  <div
                    key={u.uid}
                    className={cn(
                      "p-4 rounded-2xl border transition-all flex items-center justify-between",
                      isToday
                        ? "bg-rose-50/50 border-rose-200 shadow-sm shadow-rose-50"
                        : "bg-slate-50/50 border-slate-100 hover:border-slate-200",
                    )}
                  >
                    <div className="flex items-center space-x-3 overflow-hidden">
                      <div
                        className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0",
                          isToday
                            ? "bg-rose-600 text-white animate-bounce"
                            : "bg-blue-50 text-blue-600",
                        )}
                      >
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="overflow-hidden">
                        <h4 className="font-bold text-slate-800 text-sm truncate">
                          {u.name}
                        </h4>
                        <p className="text-[10px] text-slate-400 font-semibold truncate uppercase tracking-wider">
                          {u.role}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      {isToday ? (
                        <span className="inline-block px-2 py-1 bg-amber-100 text-amber-800 text-[10px] font-black rounded-lg uppercase tracking-wide animate-pulse">
                          Hoje! 🎉
                        </span>
                      ) : (
                        <span className="text-xs font-black text-slate-500">
                          Dia {bday}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 bg-slate-50/50 border border-dashed border-slate-200 rounded-2xl">
              <Cake size={32} className="mx-auto text-slate-300 mb-2" />
              <p className="text-sm text-slate-400 font-semibold">
                Nenhum aniversariante registrado neste mês de {currentMonthName}
                .
              </p>
            </div>
          )}
        </section>
      )}

      {/* Bom Dia Captação (Complete - All cards) */}
      {widgets.bomDia && bomDia.length > 0 && (
        <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2 text-emerald-600">
              <Sun size={24} />
              <h3 className="text-xl font-bold text-slate-900">
                Bom Dia Captação
              </h3>
            </div>
            <p className="text-xs text-slate-400 font-medium">
              Última atualização:{" "}
              {new Date(bomDia[bomDia.length - 1].data).toLocaleDateString()}
            </p>
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-6">
            {bomDia.map((card) => (
              <div
                key={card.id}
                className="bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden"
              >
                <div className="bg-emerald-600 p-4">
                  <h4 className="font-bold text-white text-sm uppercase tracking-wider">
                    {card.titulo}
                  </h4>
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
                        {
                          label: "Meta Final",
                          data: card.metaFinal,
                          color: "text-slate-600",
                        },
                        {
                          label: "Meta Dia",
                          data: card.metaDia,
                          color: "text-slate-600",
                        },
                        {
                          label: "Ano Anterior",
                          data: card.anoAnterior,
                          color: "text-slate-400",
                        },
                        {
                          label: "Real",
                          data: card.real,
                          color: "text-emerald-600 font-bold",
                        },
                      ].map((row, idx) => (
                        <tr
                          key={idx}
                          className="hover:bg-white/50 transition-colors"
                        >
                          <td className="py-2 font-semibold text-slate-500">
                            {row.label}
                          </td>
                          <td className={cn("py-2 text-center", row.color)}>
                            {row.data?.insc ?? 0}
                          </td>
                          <td className={cn("py-2 text-center", row.color)}>
                            {row.data?.matFin ?? 0}
                          </td>
                          <td className={cn("py-2 text-center", row.color)}>
                            {row.data?.matAcad ?? 0}
                          </td>
                        </tr>
                      ))}
                      {/* Calculated Rows */}
                      {[
                        {
                          label: "% Meta Dia",
                          calc: (m: keyof BomDiaMetrics) =>
                            card.metaDia && card.metaDia[m] > 0 && card.real
                              ? `${((card.real[m] / card.metaDia[m]) * 100).toFixed(0)}%`
                              : "0%",
                          color: "text-blue-600 font-bold",
                        },
                        {
                          label: "% Ano Ant.",
                          calc: (m: keyof BomDiaMetrics) =>
                            card.anoAnterior &&
                            card.anoAnterior[m] > 0 &&
                            card.real
                              ? `${((card.real[m] / card.anoAnterior[m]) * 100).toFixed(0)}%`
                              : "0%",
                          color: "text-slate-500 font-bold",
                        },
                        {
                          label: "Gap Meta Dia",
                          calc: (m: keyof BomDiaMetrics) =>
                            card.real && card.metaDia
                              ? card.real[m] - card.metaDia[m]
                              : 0,
                          color: (m: keyof BomDiaMetrics) =>
                            card.real &&
                            card.metaDia &&
                            card.real[m] - card.metaDia[m] >= 0
                              ? "text-emerald-600"
                              : "text-rose-600",
                        },
                        {
                          label: "Gap Ano Ant.",
                          calc: (m: keyof BomDiaMetrics) =>
                            card.real && card.anoAnterior
                              ? card.real[m] - card.anoAnterior[m]
                              : 0,
                          color: (m: keyof BomDiaMetrics) =>
                            card.real &&
                            card.anoAnterior &&
                            card.real[m] - card.anoAnterior[m] >= 0
                              ? "text-emerald-600"
                              : "text-rose-600",
                        },
                        {
                          label: "Gap Meta Final",
                          calc: (m: keyof BomDiaMetrics) =>
                            card.real && card.metaFinal
                              ? card.real[m] - card.metaFinal[m]
                              : 0,
                          color: (m: keyof BomDiaMetrics) =>
                            card.real &&
                            card.metaFinal &&
                            card.real[m] - card.metaFinal[m] >= 0
                              ? "text-emerald-600"
                              : "text-rose-600",
                        },
                      ].map((row, idx) => (
                        <tr key={`calc-${idx}`} className="bg-slate-100/50">
                          <td className="py-1.5 font-bold text-[9px] text-slate-400 uppercase">
                            {row.label}
                          </td>
                          <td
                            className={cn(
                              "py-1.5 text-center text-[10px] font-bold",
                              typeof row.color === "function"
                                ? row.color("insc")
                                : row.color,
                            )}
                          >
                            {row.calc("insc")}
                          </td>
                          <td
                            className={cn(
                              "py-1.5 text-center text-[10px] font-bold",
                              typeof row.color === "function"
                                ? row.color("matFin")
                                : row.color,
                            )}
                          >
                            {row.calc("matFin")}
                          </td>
                          <td
                            className={cn(
                              "py-1.5 text-center text-[10px] font-bold",
                              typeof row.color === "function"
                                ? row.color("matAcad")
                                : row.color,
                            )}
                          >
                            {row.calc("matAcad")}
                          </td>
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

      {/* QG Ligações Widget */}
      {widgets.qgLigacoes !== false && qgLigacoes && qgLigacoes.length > 0 && (
        <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-slate-900 flex items-center">
              <span className="bg-emerald-100 text-emerald-600 p-2 rounded-xl mr-3">
                <Phone size={20} />
              </span>
              QG Ligações
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {qgLigacoes.map((qg) => (
              <div
                key={qg.id}
                className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col justify-between items-start"
              >
                <div className="flex items-center space-x-2 text-emerald-600 mb-2 font-bold">
                  <Phone size={16} />
                  <span>{qg.nome}</span>
                </div>
                <div className="text-sm font-semibold text-slate-700">
                  {Array.isArray(qg.diaSemana) ? qg.diaSemana.join(", ") : qg.diaSemana}
                </div>
                <div className="text-xs text-slate-500 font-medium bg-emerald-100/50 px-2 py-1 rounded-md mt-2">
                  {qg.horario}
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
            <h3 className="text-xl font-bold text-slate-900">
              Forecasts de Captação
            </h3>
            <TrendingUp size={24} className="text-blue-600" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {[...forecast]
              .sort((a, b) => a.nome.localeCompare(b.nome))
              .map((f) => {
              const percFech =
                f.metaFechamento > 0
                  ? ((f.realizado / f.metaFechamento) * 100).toFixed(1)
                  : "0";
              const gapFech = f.realizado - f.metaFechamento;
              const dataFim = new Date(f.dataFim);
              const hoje = new Date();
              const diffTime = dataFim.getTime() - hoje.getTime();
              const diasRestantes = Math.max(
                1,
                Math.ceil(diffTime / (1000 * 60 * 60 * 24)),
              );
              const pacing = (Math.abs(gapFech) / diasRestantes).toFixed(1);

              return (
                <div
                  key={f.id}
                  className="bg-slate-50 p-5 rounded-2xl border border-slate-100"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-bold text-slate-900">{f.nome}</h4>
                      <p className="text-[10px] text-slate-500 font-medium">
                        Até{" "}
                        {f.dataFim.split("T")[0].split("-").reverse().join("/")}
                      </p>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-1 rounded-full ${Number(percFech) >= 100 ? "bg-emerald-100 text-emerald-600" : "bg-blue-100 text-blue-600"}`}
                    >
                      {percFech}%
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">
                        Realizado
                      </p>
                      <p className="text-lg font-bold text-emerald-600">
                        {f.realizado || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">
                        Meta
                      </p>
                      <p className="text-lg font-bold text-slate-700">
                        {f.metaFechamento || 0}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 pt-4 border-t border-slate-200/60">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1 border-l-2 border-slate-400">
                        Meta Dia YTD
                      </span>
                      <span className="text-xs font-bold text-slate-700">
                        {f.metaDiaYTD || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1 border-l-2 border-rose-400">
                        Gap Fechamento
                      </span>
                      <span
                        className={`text-xs font-bold ${gapFech >= 0 ? "text-emerald-600" : "text-rose-600"}`}
                      >
                        {gapFech >= 0 ? "+" : ""}
                        {gapFech}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1 border-l-2 border-blue-400">
                        Pacing (por dia)
                      </span>
                      <span className="text-xs font-bold text-blue-600">
                        {pacing}
                      </span>
                    </div>
                    <div className="flex justify-between items-center bg-slate-200/50 p-2 rounded-lg mt-2">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        Dias Restantes
                      </span>
                      <span className="text-xs font-bold text-slate-800">
                        {diasRestantes}
                      </span>
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
            <h3 className="text-xl font-bold text-slate-900">
              Períodos da Captação
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {periodos.map((p) => {
              const isActive =
                today >= p.inicioInscricao && today <= p.fimMatFin;
              return (
                <div
                  key={p.id}
                  className={cn(
                    "bg-white p-5 rounded-3xl shadow-sm border transition-all",
                    isActive
                      ? "border-blue-500 ring-4 ring-blue-50"
                      : "border-slate-100",
                  )}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div
                        className={cn(
                          "p-2 rounded-xl",
                          isActive
                            ? "bg-blue-600 text-white"
                            : "bg-blue-100 text-blue-600",
                        )}
                      >
                        <Calendar size={20} />
                      </div>
                      <h4 className="font-bold text-slate-900">{p.nome}</h4>
                    </div>
                    {isActive && (
                      <span className="px-2 py-1 bg-emerald-100 text-emerald-600 text-[10px] font-bold rounded-full uppercase">
                        Ativo
                      </span>
                    )}
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-slate-50 rounded-2xl">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">
                          Inscrição
                        </p>
                        <p className="text-xs font-bold text-slate-700">
                          {formatLocalDateString(p.inicioInscricao)} -{" "}
                          {formatLocalDateString(p.fimInscricao)}
                        </p>
                      </div>
                      <span className="text-xs font-bold text-blue-600">
                        {getWorkingDaysBetween(
                          p.inicioInscricao,
                          p.fimInscricao,
                        )}{" "}
                        dias
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-slate-50 rounded-2xl">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">
                          Mat Fin
                        </p>
                        <p className="text-xs font-bold text-slate-700">
                          {formatLocalDateString(p.inicioMatFin)} -{" "}
                          {formatLocalDateString(p.fimMatFin)}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-blue-600 block">
                          {getWorkingDaysBetween(p.inicioMatFin, p.fimMatFin)}{" "}
                          dias úteis
                        </span>
                        <span className="text-[10px] font-bold text-slate-500 block">
                          {getWorkingDaysRemaining(p.fimMatFin)} dias restantes
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-slate-50 rounded-2xl">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">
                          Mat Acad
                        </p>
                        <p className="text-xs font-bold text-slate-700">
                          {formatLocalDateString(p.inicioMatAcad)} -{" "}
                          {formatLocalDateString(p.fimMatAcad)}
                        </p>
                      </div>
                      <span className="text-xs font-bold text-blue-600">
                        {getWorkingDaysBetween(p.inicioMatAcad, p.fimMatAcad)}{" "}
                        dias
                      </span>
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
            {links.map((link) => (
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
                <span className="font-bold text-slate-700 truncate">
                  {link.nome}
                </span>
              </a>
            ))}
            {links.length === 0 && (
              <p className="text-slate-400 text-sm italic">
                Nenhum link cadastrado.
              </p>
            )}
          </div>
        </section>
      )}

      {widgets.planner && (
        <section>
          <h3 className="text-xl font-bold text-slate-900 mb-4">
            Planner da Semana
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
            {days.map((day) => {
              const tasks = planner.filter((t) => t.dayOfWeek === day);
              return (
                <div
                  key={day}
                  className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col"
                >
                  <div className="bg-slate-50 px-4 py-2 border-b border-slate-100">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      {day.split("-")[0]}
                    </span>
                  </div>
                  <div className="p-4 flex-1 space-y-2">
                    {tasks.length > 0 ? (
                      tasks.map((task) => (
                        <div
                          key={task.id}
                          className="p-2 bg-blue-50 border-l-4 border-blue-600 rounded-r-lg"
                        >
                          <p className="text-xs font-bold text-blue-900">
                            {task.atendenteName}
                          </p>
                          <p className="text-[10px] text-blue-600 font-medium">
                            {task.baseName}
                          </p>
                        </div>
                      ))
                    ) : (
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
                <h3 className="text-xl font-bold text-slate-900">
                  Personalizar Dashboard
                </h3>
                <button
                  onClick={() => setIsCustomizing(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X size={24} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-sm text-slate-500 mb-4">
                  Escolha quais blocos você deseja visualizar na sua tela
                  principal.
                </p>

                {[
                  {
                    id: "periodo",
                    label: "Períodos da Captação",
                    icon: Calendar,
                  },
                  { id: "bomDia", label: "Bom Dia Captação", icon: Sun },
                  { id: "forecast", label: "Forecasts", icon: TrendingUp },
                  { id: "links", label: "Links Úteis", icon: ExternalLink },
                  { id: "planner", label: "Planner da Semana", icon: Calendar },
                  { id: "qgLigacoes", label: "QG Ligações", icon: Phone },
                  {
                    id: "aniversarios",
                    label: "Aniversariantes do Mês",
                    icon: Cake,
                  },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => toggleWidget(item.id as any)}
                    className={cn(
                      "w-full flex items-center justify-between p-4 rounded-xl border transition-all",
                      widgets[item.id as keyof typeof widgets]
                        ? "bg-blue-50 border-blue-200 text-blue-900"
                        : "bg-white border-slate-100 text-slate-500",
                    )}
                  >
                    <div className="flex items-center space-x-3">
                      <item.icon size={20} />
                      <span className="font-bold">{item.label}</span>
                    </div>
                    <div
                      className={cn(
                        "w-10 h-6 rounded-full relative transition-all",
                        widgets[item.id as keyof typeof widgets]
                          ? "bg-blue-600"
                          : "bg-slate-200",
                      )}
                    >
                      <div
                        className={cn(
                          "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                          widgets[item.id as keyof typeof widgets]
                            ? "left-5"
                            : "left-1",
                        )}
                      />
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

function CadastroView({
  onToast,
  profile,
  calendarioAcoes = [],
}: {
  onToast: (m: string, t?: "success" | "error") => void;
  profile: UserProfile;
  calendarioAcoes?: CalendarioAcao[];
}) {
  const [formData, setFormData] = useState({
    acao: "",
    acaoId: "",
    nome: "",
    telefone: "",
    cpf: "",
    cursoInteresse: "",
  });
  const [loading, setLoading] = useState(false);
  const [activeForm, setActiveForm] = useState<"lead" | "promotor">("lead");
  const [promotorData, setPromotorData] = useState({
    nome: "",
    email: "",
    cpf: "",
    dataNascimento: "",
    phone: "",
    chavePix: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Duplicate check
    const cleanCpf = formData.cpf.replace(/\D/g, "");
    const cleanTelefone = formData.telefone.replace(/\D/g, "");

    if (cleanCpf) {
      const qCpf = query(
        collection(db, COLLECTIONS.LEADS),
        where("cpf", "==", cleanCpf),
      );
      const snapCpf = await getDocs(qCpf);
      if (!snapCpf.empty) {
        onToast(
          "Atenção: Este CPF já possui um lead cadastrado no sistema.",
          "error",
        );
        return;
      }
    } else if (cleanTelefone) {
      const qTel = query(
        collection(db, COLLECTIONS.LEADS),
        where("telefone", "==", cleanTelefone),
      );
      const snapTel = await getDocs(qTel);
      if (!snapTel.empty) {
        onToast(
          "Atenção: Este Telefone já possui um lead cadastrado no sistema.",
          "error",
        );
        return;
      }
    }

    setLoading(true);
    try {
      const newLeadData: any = {
        ...formData,
        cpf: cleanCpf,
        telefone: cleanTelefone,
        converted: false,
        createdAt: serverTimestamp(),
        promotorId: profile.uid,
        promotorName: profile.name,
        promotorRole: profile.role,
        unidade: profile.unidade || "",
        servidor: profile.servidor || "principal",
      };

      if (profile.linkadoA) {
        newLeadData.linkadoA = profile.linkadoA;
      }

      await addDoc(collection(db, COLLECTIONS.LEADS), newLeadData);
      
      if (newLeadData.acaoId && newLeadData.acaoId !== "manual") {
        try {
          const qLeads = query(
            collection(db, COLLECTIONS.LEADS),
            where("acaoId", "==", newLeadData.acaoId)
          );
          const snapLeads = await getDocs(qLeads);
          await updateDoc(doc(db, COLLECTIONS.CALENDARIO_ACOES, newLeadData.acaoId), {
            leadsFeitos: snapLeads.size
          });
        } catch (error) {
          console.error("Error auto-updating action leadsCount:", error);
        }
      }

      onToast("Lead cadastrado com sucesso!");
      setFormData({
        acao: "",
        acaoId: "",
        nome: "",
        telefone: "",
        cpf: "",
        cursoInteresse: "",
      });
    } catch (err: any) {
      onToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handlePromotorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanCpf = promotorData.cpf.replace(/\D/g, "");
    const cleanPhone = promotorData.phone.replace(/\D/g, "");
    const cleanEmail = promotorData.email.trim();

    if (!promotorData.nome || !cleanEmail || !cleanPhone) {
      onToast(
        "Por favor, preencha todos os campos obrigatórios (Nome, Email e Telefone).",
        "error",
      );
      return;
    }

    if (!cleanEmail.includes("@")) {
      onToast("Formato de email inválido.", "error");
      return;
    }

    setLoading(true);
    try {
      // 1. Create promoter in Auth with standard base password using secondaryAuth
      const userCredential = await createUserWithEmailAndPassword(
        secondaryAuth,
        cleanEmail,
        "123456",
      );
      await updateProfile(userCredential.user, {
        displayName: `${promotorData.nome}|comercial`,
      });
      const newUid = userCredential.user.uid;

      // 2. Create profile matching promoter/rua rules
      const profileData: any = {
        uid: newUid,
        name: promotorData.nome,
        email: cleanEmail,
        cpf: cleanCpf,
        dataNascimento: promotorData.dataNascimento,
        role: ROLES.PROMOTOR_RUA, // 'Promotor/rua'
        servidor: "comercial", // specified for commercial
        phone: cleanPhone,
        chavePix: promotorData.chavePix,
        blocked: false,
        mustChangePassword: true,
        linkadoA: profile.uid, // linked to the creator FDV
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // 3. Save profile document
      await setDoc(doc(db, COLLECTIONS.USERS, newUid), profileData);

      // 4. Sign out from secondary auth to avoid trace
      await signOut(secondaryAuth);

      onToast(
        "Promotor/rua cadastrado com sucesso! Senha padrão: 123456",
        "success",
      );
      setPromotorData({
        nome: "",
        email: "",
        cpf: "",
        dataNascimento: "",
        phone: "",
        chavePix: "",
      });
      setActiveForm("lead");
    } catch (err: any) {
      console.error("Auth error details (Promoter Registration):", err);
      let errorMsg = err.message;
      if (
        err.code === "auth/email-already-in-use" ||
        err.message?.includes("email-already-in-use")
      ) {
        errorMsg = "Este email já está em uso.";
      } else if (
        err.code === "auth/weak-password" ||
        err.message?.includes("weak-password")
      ) {
        errorMsg =
          "A senha de cadastro padrão deve conter pelo menos 6 caracteres.";
      } else if (
        err.code === "auth/invalid-email" ||
        err.message?.includes("invalid-email")
      ) {
        errorMsg = "Endereço de email inválido.";
      }
      onToast(`Erro ao criar promotor: ${errorMsg}`, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
        {profile?.role === ROLES.FDV_COMERCIAL && (
          <div className="flex space-x-2 bg-slate-50 p-1.5 rounded-2xl mb-6 border border-slate-100">
            <button
              type="button"
              onClick={() => setActiveForm("lead")}
              className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center space-x-2 ${
                activeForm === "lead"
                  ? "bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow shadow-sky-500/20"
                  : "text-slate-400 hover:text-slate-700"
              }`}
            >
              <UserPlus size={16} />
              <span>Cadastrar Novo Lead</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveForm("promotor")}
              className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center space-x-2 ${
                activeForm === "promotor"
                  ? "bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow shadow-sky-500/20"
                  : "text-slate-400 hover:text-slate-700"
              }`}
            >
              <Users size={16} />
              <span>Cadastrar Promotor de Rua</span>
            </button>
          </div>
        )}

        {activeForm === "lead" ? (
          <>
            <h3 className="text-2xl font-bold text-slate-900 mb-6">
              Cadastrar Novo Lead
            </h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2 space-y-2">
                  <label className="block text-sm font-bold text-slate-700">
                    Ação / Origem
                  </label>
                  {calendarioAcoes && calendarioAcoes.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="block text-xs font-semibold text-slate-500 mb-1">
                          Selecionar do Calendário
                        </span>
                        <select
                          value={formData.acaoId || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === "manual") {
                              setFormData({ ...formData, acaoId: "manual", acao: "" });
                            } else {
                              const matched = calendarioAcoes.find((a) => a.id === val);
                              setFormData({
                                ...formData,
                                acaoId: val,
                                acao: matched ? matched.nome : "",
                              });
                            }
                          }}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm bg-white"
                        >
                          <option value="">Selecione...</option>
                          {calendarioAcoes.map((act) => (
                            <option key={act.id} value={act.id}>
                              {act.nome} ({act.dataInicio})
                            </option>
                          ))}
                          <option value="manual">Outro (Digitar manualmente)</option>
                        </select>
                      </div>
                      {(formData.acaoId === "manual" || !formData.acaoId) && (
                        <div>
                          <span className="block text-xs font-semibold text-slate-500 mb-1">
                            Digitar Nome da Ação/Origem
                          </span>
                          <input
                            type="text"
                            required={!formData.acaoId || formData.acaoId === "manual"}
                            value={formData.acao}
                            onChange={(e) =>
                              setFormData({ ...formData, acao: e.target.value })
                            }
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
                            placeholder="Ex: Facebook, Panfletagem, etc."
                          />
                        </div>
                      )}
                    </div>
                  ) : (
                    <input
                      type="text"
                      required
                      value={formData.acao}
                      onChange={(e) =>
                        setFormData({ ...formData, acao: e.target.value })
                      }
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      placeholder="Ex: Evento Junino, Facebook, etc."
                    />
                  )}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    Nome do Candidato
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nome}
                    onChange={(e) =>
                      setFormData({ ...formData, nome: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    placeholder="Nome completo"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    Telefone (WhatsApp)
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.telefone}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        telefone: formatPhone(e.target.value),
                      })
                    }
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    placeholder="DDD + Número"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    CPF (Opcional)
                  </label>
                  <input
                    type="text"
                    value={formData.cpf}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        cpf: formatCPF(e.target.value),
                      })
                    }
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    placeholder="000.000.000-00"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    Curso de Interesse
                  </label>
                  <input
                    type="text"
                    value={formData.cursoInteresse}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        cursoInteresse: e.target.value,
                      })
                    }
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
                <span>{loading ? "Salvando..." : "Salvar Lead"}</span>
              </button>
            </form>
          </>
        ) : (
          <>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">
              Cadastrar Promotor de Rua
            </h3>
            <p className="text-xs text-slate-500 mb-6 font-medium">
              Os promotores cadastrados por você ficarão automaticamente
              vinculados ao seu perfil de FDV e herdarão todas as regras de
              visualização do sistema.
            </p>

            <form onSubmit={handlePromotorSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={promotorData.nome}
                    onChange={(e) =>
                      setPromotorData({ ...promotorData, nome: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    placeholder="Nome completo do promotor"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    Email (Google institucional ou pessoal) *
                  </label>
                  <input
                    type="email"
                    required
                    value={promotorData.email}
                    onChange={(e) =>
                      setPromotorData({
                        ...promotorData,
                        email: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    placeholder="exemplo@gmail.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    Telefone / WhatsApp *
                  </label>
                  <input
                    type="tel"
                    required
                    value={promotorData.phone}
                    onChange={(e) =>
                      setPromotorData({
                        ...promotorData,
                        phone: formatPhone(e.target.value),
                      })
                    }
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    placeholder="(00) 00000-0000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    CPF (Opcional)
                  </label>
                  <input
                    type="text"
                    value={promotorData.cpf}
                    onChange={(e) =>
                      setPromotorData({
                        ...promotorData,
                        cpf: formatCPF(e.target.value),
                      })
                    }
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    placeholder="000.000.000-00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    Data de Nascimento (Opcional)
                  </label>
                  <input
                    type="date"
                    value={promotorData.dataNascimento}
                    onChange={(e) =>
                      setPromotorData({
                        ...promotorData,
                        dataNascimento: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    Chave PIX (Opcional)
                  </label>
                  <input
                    type="text"
                    value={promotorData.chavePix}
                    onChange={(e) =>
                      setPromotorData({
                        ...promotorData,
                        chavePix: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    placeholder="CPF, E-mail, Telefone ou Aleatória"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-200 transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                <Plus size={20} />
                <span>
                  {loading ? "Cadastrando..." : "Cadastrar Promotor de Rua"}
                </span>
              </button>
            </form>
          </>
        )}
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
  onMassSendBot,
  gap,
  basesRenovacao,
  calendarioAcoes = [],
}: {
  leads: Lead[];
  profile: UserProfile;
  onToast: (m: string, t?: "success" | "error") => void;
  users: UserProfile[];
  whatsappMessages: WhatsAppMessage[];
  botConfig: BotConfig;
  onSendBot: (tel: string, msg: string) => void;
  onMassSendBot: (messages: { telefone: string; message: string }[]) => void;
  gap: GapEntry[];
  basesRenovacao: BaseEntry[];
  calendarioAcoes?: CalendarioAcao[];
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [courseFilter, setCourseFilter] = useState("");
  const [baseFilter, setBaseFilter] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [promotorFilter, setPromotorFilter] = useState("");
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [selectedEntries, setSelectedEntries] = useState<string[]>([]);
  const [massSelectorOpen, setMassSelectorOpen] = useState(false);
  const [isAddMsgModalOpen, setIsAddMsgModalOpen] = useState(false);
  const [newMsgData, setNewMsgData] = useState({ modelName: "", texto: "" });
  const [msgLoading, setMsgLoading] = useState(false);
  const [invalidLeadIds, setInvalidLeadIds] = useState<Set<string>>(new Set());
  const [blockedFilter, setBlockedFilter] = useState<
    "all" | "blocked" | "unblocked"
  >("all");

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [historicoSubTab, setHistoricoSubTab] = useState<"dashboard" | "lista">("dashboard");

  const [editFormData, setEditFormData] = useState({
    nome: "",
    telefone: "",
    cpf: "",
    cursoInteresse: "",
    acao: "",
    acaoId: "",
  });

  const handleVerificacao = () => {
    const invalidIds = new Set<string>();
    leads.forEach((lead) => {
      let match = false;

      if (
        gap.some(
          (g) =>
            (g.cpf &&
              lead.cpf &&
              g.cpf.replace(/\D/g, "") === lead.cpf.replace(/\D/g, "")) ||
            (g.telefone &&
              lead.telefone &&
              g.telefone.replace(/\D/g, "") ===
                lead.telefone.replace(/\D/g, "")) ||
            g.nome.toLowerCase().trim() === lead.nome.toLowerCase().trim(),
        )
      ) {
        match = true;
      }

      if (
        !match &&
        basesRenovacao.some(
          (b) =>
            (b.cpf &&
              lead.cpf &&
              b.cpf.replace(/\D/g, "") === lead.cpf.replace(/\D/g, "")) ||
            (b.telefone &&
              lead.telefone &&
              b.telefone.replace(/\D/g, "") ===
                lead.telefone.replace(/\D/g, "")) ||
            b.nome.toLowerCase().trim() === lead.nome.toLowerCase().trim(),
        )
      ) {
        match = true;
      }

      if (match) {
        invalidIds.add(lead.id);
      }
    });
    setInvalidLeadIds(invalidIds);
    onToast(
      `Verificação concluída: ${invalidIds.size} leads já estão cadastrados em GAP/Base Líquida.`,
      "success",
    );
  };

  const uniqueCursos = useMemo(() => {
    return Array.from(
      new Set(leads.map((l) => l.cursoInteresse).filter(Boolean)),
    ).sort();
  }, [leads]);

  const uniqueBases = useMemo(() => {
    return Array.from(new Set(leads.map((l) => l.acao).filter(Boolean))).sort();
  }, [leads]);

  const uniqueStatuses = [
    "Pendente",
    "Sem retorno",
    "Interessado",
    "Não Interessado",
    "Convertido",
  ];

  const uniquePromotores = useMemo(() => {
    return Array.from(
      new Set(leads.map((l) => l.promotorName).filter(Boolean)),
    ).sort();
  }, [leads]);

  const isAdmin = [
    ROLES.ADMIN_MASTER,
    ROLES.LIDER_FDV,
    ROLES.GESTOR_COMERCIAL,
    ROLES.GESTOR_COMERCIAL_COMERCIAL,
  ].includes(profile.role);

  const handleAddCustomMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMsgData.texto.trim()) return;
    setMsgLoading(true);
    try {
      await addDoc(collection(db, COLLECTIONS.WHATSAPP_MESSAGES), {
        tipo: "historico",
        texto: newMsgData.texto,
        nome: newMsgData.modelName || undefined,
        createdAt: serverTimestamp(),
      });
      onToast("Mensagem de histórico salva!");
      setNewMsgData({ modelName: "", texto: "" });
      setIsAddMsgModalOpen(false);
    } catch (err: any) {
      console.error("Erro ao salvar mensagem:", err);
      onToast(`Erro ao salvar mensagem: ${err.message}`, "error");
    } finally {
      setMsgLoading(false);
    }
  };

  const handleInsertDefaultHistoricoMessages = async () => {
    try {
      const existing = whatsappMessages.filter((m) => m.tipo === "historico");
      if (existing.length > 0) {
        if (
          !window.confirm(
            "Já existem mensagens para Histórico. Deseja adicionar as mensagens padrões mesmo assim?",
          )
        ) {
          return;
        }
      }

      const defaults = [
        "Olá [nome], tudo bem? Vimos aqui seu interesse no curso de [curso]. Podemos te ajudar?",
        "Oi [nome], aqui é da faculdade! Recebemos seu cadastro sobre o curso de [curso]. Qual o melhor horário para conversarmos?",
        "Olá [nome]! Qual a sua dúvida sobre o curso de [curso]?",
      ];

      for (const texto of defaults) {
        await addDoc(collection(db, COLLECTIONS.WHATSAPP_MESSAGES), {
          tipo: "historico",
          texto,
          createdAt: serverTimestamp(),
        });
      }
      onToast("Mensagens padrões de histórico inseridas!");
    } catch (err: any) {
      onToast("Erro ao inserir mensagens padrões.", "error");
    }
  };

  const filteredLeads = useMemo(() => {
    return leads
      .filter((l) => {
        // Gestor Unidade filtering
        if (profile.role === "Gestor Unidade") {
          if (!profile.unidade || l.unidade !== profile.unidade) {
            return false;
          }
        }

        const matchesSearch =
          !searchTerm ||
          l.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
          l.telefone.includes(searchTerm) ||
          l.acao.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCourse =
          !courseFilter || l.cursoInteresse === courseFilter;
        const matchesBase = baseFilter.length === 0 || baseFilter.includes(l.acao);
        const matchesStatus = !statusFilter || l.status === statusFilter;
        const matchesPromotor =
          !promotorFilter || l.promotorName === promotorFilter;
        const isBlocked = invalidLeadIds.has(l.id);
        const matchesBlocked =
          blockedFilter === "all" ||
          (blockedFilter === "blocked" && isBlocked) ||
          (blockedFilter === "unblocked" && !isBlocked);
        return (
          matchesSearch &&
          matchesCourse &&
          matchesBase &&
          matchesStatus &&
          matchesPromotor &&
          matchesBlocked
        );
      })
      .sort(
        (a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0),
      );
  }, [
    leads,
    searchTerm,
    courseFilter,
    baseFilter,
    statusFilter,
    promotorFilter,
    blockedFilter,
    invalidLeadIds,
  ]);

  const stats = useMemo(() => {
    const total = filteredLeads.length;
    const conv = filteredLeads.filter((l) => l.converted).length;
    const userLeads = filteredLeads.filter(
      (l) => l.promotorId === profile.uid,
    ).length;
    
    // Stats by Course (Top 5)
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

    // Stats by Status
    const statusGroups: Record<string, number> = {
      "Pendente": 0,
      "Convertido": 0,
      "Sem retorno": 0,
      "Interessado": 0,
      "Não Interessado": 0,
    };
    filteredLeads.forEach(l => {
      const s = l.converted ? "Convertido" : (l.status || "Pendente");
      if (statusGroups[s] !== undefined) statusGroups[s] += 1;
      else statusGroups["Pendente"] += 1;
    });
    const byStatus = Object.entries(statusGroups).map(([name, count]) => ({
      name,
      count,
      percentage: total > 0 ? ((count / total) * 100).toFixed(1) : "0"
    }));

    return {
      total,
      conv,
      userLeads,
      rate: total > 0 ? ((conv / total) * 100).toFixed(1) : "0",
      byCourse,
      byStatus
    };
  }, [filteredLeads, profile]);

  const toggleSelect = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedEntries((prev) => [...prev, id]);
    } else {
      setSelectedEntries((prev) => prev.filter((s) => s !== id));
    }
  };

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedEntries(
        filteredLeads.filter((l) => !invalidLeadIds.has(l.id)).map((l) => l.id),
      );
    } else {
      setSelectedEntries([]);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, COLLECTIONS.LEADS, id), { status: newStatus });
      onToast("Status atualizado!");
    } catch (err: any) {
      handleFirestoreError(
        err,
        OperationType.UPDATE,
        `${COLLECTIONS.LEADS}/${id}`,
      );
      onToast("Erro ao atualizar status.", "error");
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
        createdAt: serverTimestamp(),
      });
      onToast("Candidato movido para o GAP!");
    } catch (err: any) {
      handleFirestoreError(err, OperationType.CREATE, COLLECTIONS.GAP);
      onToast("Erro ao mover para o GAP.", "error");
    }
  };

  const handleDeleteLead = async (id: string) => {
    if (
      !window.confirm("Tem certeza que deseja excluir este lead do histórico?")
    )
      return;
    try {
      await deleteDoc(doc(db, COLLECTIONS.LEADS, id));
      onToast("Lead excluído com sucesso!", "success");
      setSelectedEntries((prev) => prev.filter((s) => s !== id));
    } catch (err: any) {
      console.error(err);
      onToast("Erro ao excluir lead.", "error");
    }
  };

  const handleBulkDelete = async () => {
    if (
      !window.confirm(
        `Tem certeza que deseja excluir ${selectedEntries.length} lead(s) do histórico?`,
      )
    )
      return;
    try {
      const firestoreBatch = writeBatch(db);
      selectedEntries.forEach((id) => {
        firestoreBatch.delete(doc(db, COLLECTIONS.LEADS, id));
      });
      await firestoreBatch.commit();
      onToast(
        `${selectedEntries.length} lead(s) excluído(s) com sucesso!`,
        "success",
      );
      setSelectedEntries([]);
    } catch (err) {
      console.error(err);
      onToast("Erro ao excluir leads em massa.", "error");
    }
  };

  const handleExport = () => {
    const data = filteredLeads.map((l) => ({
      Nome: l.nome,
      Telefone: l.telefone,
      CPF: l.cpf || "",
      Curso: l.cursoInteresse || "",
      Acao: l.acao,
      Promotor: l.promotorName,
      Status: l.converted ? "Convertido" : "Pendente",
      Data: l.createdAt?.seconds
        ? new Date(l.createdAt.seconds * 1000).toLocaleDateString()
        : "",
    }));
    exportToExcel(data, "Historico_Leads");
  };

  const handleEditClick = (lead: Lead) => {
    setEditingLead(lead);
    setEditFormData({
      nome: lead.nome,
      telefone: lead.telefone,
      cpf: lead.cpf || "",
      cursoInteresse: lead.cursoInteresse || "",
      acao: lead.acao,
      acaoId: lead.acaoId || "",
    });
    setEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLead) return;
    try {
      const prevAcaoId = editingLead.acaoId;
      const newAcaoId = editFormData.acaoId;

      await updateDoc(doc(db, COLLECTIONS.LEADS, editingLead.id), {
        nome: editFormData.nome,
        telefone: editFormData.telefone,
        cpf: editFormData.cpf,
        cursoInteresse: editFormData.cursoInteresse,
        acao: editFormData.acao,
        acaoId: newAcaoId || "",
      });

      if (prevAcaoId && prevAcaoId !== "manual" && prevAcaoId !== newAcaoId) {
        try {
          const qLeadsOld = query(
            collection(db, COLLECTIONS.LEADS),
            where("acaoId", "==", prevAcaoId),
          );
          const snapOld = await getDocs(qLeadsOld);
          await updateDoc(doc(db, COLLECTIONS.CALENDARIO_ACOES, prevAcaoId), {
            leadsFeitos: snapOld.size,
          });
        } catch (err) {
          console.error(err);
        }
      }

      if (newAcaoId && newAcaoId !== "manual") {
        try {
          const qLeadsNew = query(
            collection(db, COLLECTIONS.LEADS),
            where("acaoId", "==", newAcaoId),
          );
          const snapNew = await getDocs(qLeadsNew);
          await updateDoc(doc(db, COLLECTIONS.CALENDARIO_ACOES, newAcaoId), {
            leadsFeitos: snapNew.size,
          });
        } catch (err) {
          console.error(err);
        }
      }

      onToast("Lead atualizado com sucesso!", "success");
      setEditModalOpen(false);
      setEditingLead(null);
    } catch (err: any) {
      console.error(err);
      onToast("Erro ao editar lead.", "error");
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    importFromExcel(file, async (data) => {
      try {
        const getVal = (row: any, ...keys: string[]) => {
          const rowKeys = Object.keys(row);
          for (const key of keys) {
            const foundKey = rowKeys.find(k => k.toLowerCase() === key.toLowerCase());
            if (foundKey && row[foundKey] !== undefined) return row[foundKey];
          }
          return undefined;
        };

        const batch = data.map((item) => {
          const rawStatus = String(getVal(item, "Status", "status") || "").trim().toLowerCase();
          const isConverted = rawStatus === "convertido" || getVal(item, "converted") === true;

          return {
            nome: String(getVal(item, "Nome", "nome") || "").trim(),
            telefone: String(getVal(item, "Telefone", "telefone") || "").replace(/\D/g, ""),
            cpf: String(getVal(item, "CPF", "cpf") || "").replace(/\D/g, ""),
            cursoInteresse: String(getVal(item, "Curso", "cursoInteresse", "curso") || "").trim(),
            acao: String(getVal(item, "Acao", "acao", "Ação", "ação") || "Importação").trim(),
            promotorId: "import",
            promotorName: String(getVal(item, "Promotor", "promotorName") || "Sistema").trim(),
            converted: isConverted,
            unidade: profile.unidade || "",
            createdAt: serverTimestamp(),
          };
        });

        let imported = 0;
        let skipped = 0;
        const insertedCpfs = new Set();
        const insertedTels = new Set();

        for (const entry of batch) {
          const isDupCpf =
            entry.cpf &&
            (leads.some((l) => l.cpf === entry.cpf) ||
              insertedCpfs.has(entry.cpf));
          const isDupTel =
            entry.telefone &&
            (leads.some((l) => l.telefone === entry.telefone) ||
              insertedTels.has(entry.telefone));

          if (!isDupCpf && !isDupTel) {
            await addDoc(collection(db, COLLECTIONS.LEADS), entry);
            if (entry.cpf) insertedCpfs.add(entry.cpf);
            if (entry.telefone) insertedTels.add(entry.telefone);
            imported++;
          } else {
            skipped++;
          }
        }
        onToast(
          `${imported} leads importados! ${skipped > 0 ? `${skipped} ignorados por duplicidade.` : ""}`,
        );
      } catch (err: any) {
        onToast("Erro ao importar leads.", "error");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex items-center gap-1 bg-white p-1 rounded-2xl shadow-sm border border-slate-100 w-fit">
        <button
          onClick={() => setHistoricoSubTab("dashboard")}
          className={cn(
            "flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all",
            historicoSubTab === "dashboard"
              ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
              : "text-slate-500 hover:bg-slate-50",
          )}
        >
          <BarChart3 size={18} />
          <span>Dashboard</span>
        </button>
        <button
          onClick={() => setHistoricoSubTab("lista")}
          className={cn(
            "flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all",
            historicoSubTab === "lista"
              ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
              : "text-slate-500 hover:bg-slate-50",
          )}
        >
          <List size={18} />
          <span>Lista de Leads</span>
        </button>
      </div>

      {historicoSubTab === "dashboard" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total de Leads"
              value={stats.total}
              icon={Users}
              color="bg-blue-500"
            />
            <StatCard
              title="Convertidos"
              value={stats.conv}
              icon={CheckCircle2}
              color="bg-emerald-500"
            />
            <StatCard
              title="Taxa de Conv."
              value={`${stats.rate}%`}
              icon={TrendingUp}
              color="bg-purple-500"
            />
            <StatCard
              title="Meus Leads"
              value={stats.userLeads}
              icon={UserPlus}
              color="bg-amber-500"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Target size={18} className="text-blue-500" />
                Status dos Leads
              </h3>
              <div className="space-y-3">
                {stats.byStatus.map((s) => (
                  <div key={s.name} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-600 flex items-center gap-1.5">
                        <span className={cn(
                          "w-2 h-2 rounded-full",
                          s.name === "Convertido" && "bg-emerald-400",
                          s.name === "Pendente" && "bg-amber-400",
                          s.name === "Interessado" && "bg-blue-400",
                          s.name === "Não Interessado" && "bg-rose-400",
                          s.name === "Sem retorno" && "bg-slate-400",
                        )} />
                        {s.name}
                      </span>
                      <span className="text-slate-800 font-bold">
                        {s.count} <span className="text-slate-400 font-normal">({s.percentage}%)</span>
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          s.name === "Convertido" && "bg-emerald-400",
                          s.name === "Pendente" && "bg-amber-400",
                          s.name === "Interessado" && "bg-blue-400",
                          s.name === "Não Interessado" && "bg-rose-400",
                          s.name === "Sem retorno" && "bg-slate-400",
                        )}
                        style={{ width: `${s.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
                <GraduationCap size={18} className="text-blue-500" />
                Cursos de Interesse (Top 5)
              </h3>
              <div className="space-y-3">
                {stats.byCourse.map((p) => (
                  <div key={p.name} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-600 truncate max-w-[200px]">{p.name}</span>
                      <span className="text-slate-800 font-bold">
                        {p.count} <span className="text-slate-400 font-normal">({p.percentage}%)</span>
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all"
                        style={{ width: `${p.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {historicoSubTab === "lista" && (
        <>
          <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">
          Histórico de Leads
        </h2>
        <div className="flex space-x-2">
          {[ROLES.ADMIN_MASTER, ROLES.LIDER_FDV].includes(profile.role) && (
            <button
              onClick={handleVerificacao}
              className="bg-blue-50 text-blue-600 px-4 py-2 rounded-xl flex items-center space-x-2 hover:bg-blue-100 transition-all text-sm font-bold"
              title="Verificar se leads existem no GAP ou Base Líquida"
            >
              <Search size={18} />
              <span>Verificação</span>
            </button>
          )}
          <button
            onClick={() => setIsAddMsgModalOpen(true)}
            className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl flex items-center space-x-2 hover:bg-emerald-100 transition-all text-sm font-bold"
          >
            <Plus size={18} />
            <span>Inserir Mensagens</span>
          </button>
          <button
            onClick={handleInsertDefaultHistoricoMessages}
            className="bg-slate-50 text-slate-400 px-3 py-2 rounded-xl flex items-center space-x-2 hover:bg-slate-100 transition-all text-[10px] font-bold"
            title="Inserir Mensagens Padrões"
          >
            <MessageSquare size={14} />
          </button>
          <label className="bg-blue-50 text-blue-600 px-4 py-2 rounded-xl flex items-center space-x-2 hover:bg-blue-100 transition-all text-sm font-bold cursor-pointer">
            <Upload size={18} />
            <span>Importar</span>
            <input
              type="file"
              accept=".xlsx, .xls"
              onChange={handleImport}
              className="hidden"
            />
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

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <h3 className="text-xl font-bold text-slate-900 whitespace-nowrap font-sans tracking-tight">
            Lista de Leads
          </h3>
          <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto xl:justify-end">
            <div className="relative flex-1 min-w-[200px] xl:flex-none">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={16}
              />
              <input
                type="text"
                placeholder="Buscar por nome, telefone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-xs"
              />
            </div>
            <MultiSelect
              options={uniqueBases}
              selectedValues={baseFilter}
              onChange={setBaseFilter}
              placeholder="Todas as Origens / Ações"
              allLabel="Todas as Origens"
            />
            <select
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 max-w-[150px] lg:max-w-[200px] truncate"
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
            >
              <option value="">Todos os Cursos</option>
              {uniqueCursos.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <select
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">Todos os Status</option>
              {uniqueStatuses.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <select
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500"
              value={blockedFilter}
              onChange={(e) => setBlockedFilter(e.target.value as any)}
            >
              <option value="all">Verificação: Todos</option>
              <option value="blocked">Verificação: Bloqueados</option>
              <option value="unblocked">Verificação: Ativos</option>
            </select>
            {isAdmin && (
              <select
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 max-w-[150px] lg:max-w-[200px] truncate"
                value={promotorFilter}
                onChange={(e) => setPromotorFilter(e.target.value)}
              >
                <option value="">Todos os Promotores</option>
                {uniquePromotores.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                <th className="px-6 py-4 w-12">
                  <input
                    type="checkbox"
                    checked={
                      filteredLeads.filter((l) => !invalidLeadIds.has(l.id))
                        .length > 0 &&
                      selectedEntries.length ===
                        filteredLeads.filter((l) => !invalidLeadIds.has(l.id))
                          .length
                    }
                    onChange={(e) => toggleSelectAll(e.target.checked)}
                  />
                </th>
                <th className="px-3 py-4 w-12 text-slate-400">#</th>
                <th className="px-6 py-4">Candidato</th>
                <th className="px-6 py-4">Ação / Origem</th>
                <th className="px-6 py-4">Promotor</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 flex flex-col gap-2">
                  {selectedEntries.length > 0 && botConfig.url && (
                    <button
                      onClick={() => setMassSelectorOpen(true)}
                      className="text-blue-600 font-bold hover:underline py-1 px-2 bg-blue-50 rounded-lg flex items-center gap-1"
                    >
                      <Bot size={14} /> Em Massa
                    </button>
                  )}
                  {selectedEntries.length > 0 && (
                    <button
                      onClick={handleBulkDelete}
                      className="text-rose-600 font-bold hover:underline py-1 px-2 bg-rose-50 rounded-lg flex items-center gap-1"
                    >
                      <Trash2 size={14} /> Excluir ({selectedEntries.length})
                    </button>
                  )}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLeads.map((lead, index) => (
                <tr
                  key={lead.id}
                  className={cn(
                    "hover:bg-slate-50/50 transition-all",
                    invalidLeadIds.has(lead.id) && "bg-rose-50/50",
                  )}
                >
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      disabled={invalidLeadIds.has(lead.id)}
                      checked={selectedEntries.includes(lead.id)}
                      onChange={(e) =>
                        !invalidLeadIds.has(lead.id) &&
                        toggleSelect(lead.id, e.target.checked)
                      }
                    />
                  </td>
                  <td className="px-3 py-4 text-xs font-bold text-slate-400 font-mono">
                    {index + 1}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-900">
                        {lead.nome}
                      </span>
                      <span className="text-xs text-slate-500">
                        {formatPhone(lead.telefone)}
                      </span>
                      {lead.cursoInteresse && (
                        <span className="text-xs text-slate-600 font-medium">
                          Curso: {lead.cursoInteresse}
                        </span>
                      )}
                      {lead.empresa && (
                        <span className="text-[11px] text-indigo-600 font-bold mt-0.5 bg-indigo-50/60 border border-indigo-100/40 px-2 py-0.5 rounded-md self-start">
                          Empresa: {lead.empresa}
                        </span>
                      )}
                      {lead.cpf && (
                        <span className="text-xs text-slate-400">
                          CPF: {formatCPF(lead.cpf)}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {lead.acao}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 font-medium">
                    {lead.promotorName}
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={lead.status || "Pendente"}
                      onChange={(e) =>
                        handleStatusChange(lead.id, e.target.value)
                      }
                      className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-bold uppercase transition-all border-none focus:ring-0",
                        lead.status === "Convertido"
                          ? "bg-emerald-100 text-emerald-600"
                          : lead.status === "Interessado"
                            ? "bg-blue-100 text-blue-600"
                            : lead.status === "Não Interessado"
                              ? "bg-rose-100 text-rose-600"
                              : lead.status === "Sem retorno"
                                ? "bg-slate-100 text-slate-600"
                                : "bg-amber-100 text-amber-600",
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
                      {!invalidLeadIds.has(lead.id) && (
                        <button
                          onClick={() => {
                            setSelectedLead(lead);
                            setSelectorOpen(true);
                          }}
                          className="inline-flex items-center space-x-1 text-emerald-600 font-bold text-sm hover:text-emerald-700"
                        >
                          <MessageSquare size={14} />
                          <span>WhatsApp</span>
                        </button>
                      )}
                      {lead.status === "Convertido" && (
                        <button
                          onClick={() => handleMoveToGap(lead)}
                          className="text-purple-600 hover:text-purple-700 font-bold text-sm flex items-center space-x-1"
                          title="Mover para GAP Acadêmico"
                        >
                          <GraduationCap size={14} />
                        </button>
                      )}
                      <button
                        onClick={() => handleEditClick(lead)}
                        className="text-slate-400 hover:text-blue-600 transition-colors"
                        title="Editar Lead"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteLead(lead.id)}
                        className="text-slate-400 hover:text-rose-600 transition-colors"
                        title="Excluir Lead"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredLeads.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-12 text-center text-slate-400 italic"
                  >
                    Nenhum lead encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )}

      <WhatsAppMessageSelector
        isOpen={selectorOpen}
        onClose={() => setSelectorOpen(false)}
        leadName={selectedLead?.nome || ""}
        leadCurso={selectedLead?.cursoInteresse || ""}
        messages={whatsappMessages.filter((m) => m.tipo === "historico")}
        onSelect={(msg) => {
          if (selectedLead) {
            window.open(getWhatsAppUrl(selectedLead.telefone, msg), "_blank");
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
        messages={whatsappMessages.filter((m) => m.tipo === "historico")}
        onSelect={(msg) => {
          // not used for mass send
        }}
        botConfig={botConfig}
        onSendBot={(msgTemplate) => {
          const selectedLeadObjs = leads.filter(
            (l) => selectedEntries.includes(l.id) && !invalidLeadIds.has(l.id),
          );
          const messagesPayload = selectedLeadObjs.map((l) => ({
            telefone: l.telefone,
            message: replaceMessageVariables(msgTemplate, l),
          }));
          onMassSendBot(messagesPayload);
          setMassSelectorOpen(false);
          setSelectedEntries([]);
        }}
        forceBotOnly={true}
      />

      <MessageTemplateModal
        isOpen={isAddMsgModalOpen}
        onClose={() => setIsAddMsgModalOpen(false)}
        tipo="historico"
        onToast={onToast}
        availableVariables={[
          { key: "[nome]", label: "Nome do Lead", previewValue: "João Silva" },
          {
            key: "[curso]",
            label: "Curso",
            previewValue: "Engenharia de Software",
          },
          {
            key: "[unidade]",
            label: "Unidade",
            previewValue: "Unidade Central",
          },
          {
            key: "[data_contato]",
            label: "Data",
            previewValue: new Date().toLocaleDateString("pt-BR"),
          },
          { key: "[saudacao]", label: "Saudação", previewValue: "Bom dia" },
        ]}
      />

      {editModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
          >
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-xl font-bold text-slate-900">Editar Lead</h3>
              <button
                onClick={() => {
                  setEditModalOpen(false);
                  setEditingLead(null);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    Nome
                  </label>
                  <input
                    required
                    value={editFormData.nome}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, nome: e.target.value })
                    }
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    Telefone
                  </label>
                  <input
                    required
                    value={editFormData.telefone}
                    onChange={(e) => {
                      e.target.value = formatPhone(e.target.value);
                      setEditFormData({
                        ...editFormData,
                        telefone: e.target.value,
                      });
                    }}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    CPF
                  </label>
                  <input
                    value={editFormData.cpf}
                    onChange={(e) => {
                      e.target.value = formatCPF(e.target.value);
                      setEditFormData({ ...editFormData, cpf: e.target.value });
                    }}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    Curso
                  </label>
                  <input
                    value={editFormData.cursoInteresse}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        cursoInteresse: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <label className="block text-xs font-bold text-slate-500">
                    Origem / Ação
                  </label>
                  {calendarioAcoes && calendarioAcoes.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="block text-[10px] font-semibold text-slate-400 mb-1">
                          Selecionar do Calendário
                        </span>
                        <select
                          value={editFormData.acaoId || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === "manual") {
                              setEditFormData({ ...editFormData, acaoId: "manual", acao: "" });
                            } else {
                              const matched = calendarioAcoes.find((a) => a.id === val);
                              setEditFormData({
                                ...editFormData,
                                acaoId: val,
                                acao: matched ? matched.nome : "",
                              });
                            }
                          }}
                          className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white"
                        >
                          <option value="">Selecione...</option>
                          {calendarioAcoes.map((act) => (
                            <option key={act.id} value={act.id}>
                              {act.nome} ({act.dataInicio})
                            </option>
                          ))}
                          <option value="manual">Outro (Digitar manualmente)</option>
                        </select>
                      </div>
                      {(editFormData.acaoId === "manual" || !editFormData.acaoId) && (
                        <div>
                          <span className="block text-[10px] font-semibold text-slate-400 mb-1">
                            Digitar Nome da Ação/Origem
                          </span>
                          <input
                            type="text"
                            required={!editFormData.acaoId || editFormData.acaoId === "manual"}
                            value={editFormData.acao}
                            onChange={(e) =>
                              setEditFormData({ ...editFormData, acao: e.target.value })
                            }
                            className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                            placeholder="Ex: Facebook, Panfletagem, etc."
                          />
                        </div>
                      )}
                    </div>
                  ) : (
                    <input
                      value={editFormData.acao}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, acao: e.target.value })
                      }
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  )}
                </div>
              </div>
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold transition flex items-center justify-center space-x-2"
              >
                <span>Salvar Alterações</span>
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function BasesView({
  bases,
  onToast,
  whatsappMessages,
  botConfig,
  onSendBot,
  onMassSendBot,
  gap,
  basesRenovacao,
  profile,
}: {
  bases: BaseEntry[];
  onToast: (m: string, t?: "success" | "error") => void;
  whatsappMessages: WhatsAppMessage[];
  botConfig: BotConfig;
  onSendBot: (tel: string, msg: string) => void;
  onMassSendBot: (messages: { telefone: string; message: string }[]) => void;
  gap: GapEntry[];
  basesRenovacao: BaseEntry[];
  profile: UserProfile;
}) {
  const [formData, setFormData] = useState({
    nomeBase: "",
    nome: "",
    telefone: "",
    cpf: "",
    curso: "",
    produto: "Graduação" as "Graduação" | "Técnico" | "Pós-graduação",
    numeroOportunidade: "",
    semestre: "",
    periodo: "",
    metodologia: "",
    formaIngresso: "",
    numeroMatricula: "",
  });
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [baseFilter, setBaseFilter] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [produtoFilter, setProdutoFilter] = useState("");
  const [cursoFilter, setCursoFilter] = useState("");
  const [semestreFilter, setSemestreFilter] = useState("");
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<BaseEntry | null>(null);
  const [massSelectorOpen, setMassSelectorOpen] = useState(false);
  const [isAddMsgModalOpen, setIsAddMsgModalOpen] = useState(false);
  const [newMsgData, setNewMsgData] = useState({ modelName: "", texto: "" });
  const [invalidBaseIds, setInvalidBaseIds] = useState<Set<string>>(new Set());
  const [blockedFilter, setBlockedFilter] = useState<
    "all" | "blocked" | "unblocked"
  >("all");

  // New States for Sub-tabs and Candidates Editing
  const [basesSubTab, setBasesSubTab] = useState<"dashboard" | "lista" | "novo">("dashboard");
  const [editingCandidate, setEditingCandidate] = useState<BaseEntry | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    nomeBase: "",
    nome: "",
    telefone: "",
    cpf: "",
    curso: "",
    produto: "Graduação" as "Graduação" | "Técnico" | "Pós-graduação",
    numeroOportunidade: "",
    semestre: "",
    periodo: "",
    metodologia: "",
    formaIngresso: "",
    numeroMatricula: "",
    status: "Pendente" as 'Pendente' | 'Interessado' | 'Convertido' | 'Não tem interesse' | 'Sem retorno',
  });

  // Memoized aggregations for Dashboard basic metrics
  const statsByBase = useMemo(() => {
    const groups: { [key: string]: { total: number; converted: number; interested: number; pending: number } } = {};
    bases.forEach((b) => {
      const baseName = b.nomeBase || "Sem Nome";
      if (!groups[baseName]) {
        groups[baseName] = { total: 0, converted: 0, interested: 0, pending: 0 };
      }
      groups[baseName].total += 1;
      if (b.status === "Convertido") groups[baseName].converted += 1;
      if (b.status === "Interessado") groups[baseName].interested += 1;
      if (b.status === "Pendente") groups[baseName].pending += 1;
    });

    return Object.entries(groups).map(([name, data]) => ({
      name,
      total: data.total,
      converted: data.converted,
      interested: data.interested,
      pending: data.pending,
      conversionRate: data.total > 0 ? ((data.converted / data.total) * 100).toFixed(1) : "0",
    })).sort((a, b) => b.total - a.total);
  }, [bases]);

  const statsByProduct = useMemo(() => {
    const groups: { [key: string]: number } = { "Graduação": 0, "Técnico": 0, "Pós-graduação": 0 };
    bases.forEach((b) => {
      const p = b.produto || "Graduação";
      if (groups[p] !== undefined) {
        groups[p] += 1;
      } else {
        groups[p] = 1;
      }
    });
    return Object.entries(groups).map(([name, count]) => ({
      name,
      count,
      percentage: bases.length > 0 ? ((count / bases.length) * 100).toFixed(1) : "0",
    }));
  }, [bases]);

  const statsByStatus = useMemo(() => {
    const groups: { [key: string]: number } = {
      "Pendente": 0,
      "Interessado": 0,
      "Convertido": 0,
      "Não tem interesse": 0,
      "Sem retorno": 0,
    };
    bases.forEach((b) => {
      const s = b.status || "Pendente";
      if (groups[s] !== undefined) {
        groups[s] += 1;
      }
    });
    return Object.entries(groups).map(([name, count]) => ({
      name,
      count,
      percentage: bases.length > 0 ? ((count / bases.length) * 100).toFixed(1) : "0",
    }));
  }, [bases]);

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCandidate) return;

    setLoading(true);
    try {
      const cleanCpf = editFormData.cpf ? editFormData.cpf.replace(/\D/g, "") : "";
      const cleanTelefone = editFormData.telefone.replace(/\D/g, "");

      const updatedData = {
        ...editFormData,
        cpf: cleanCpf,
        telefone: cleanTelefone,
        updatedAt: serverTimestamp(),
      };

      await updateDoc(doc(db, COLLECTIONS.BASES, editingCandidate.id), updatedData);
      
      // If conversion status toggled to Convertido, check and sync with GAP
      if (editFormData.status === "Convertido" && editingCandidate.status !== "Convertido") {
        const q = query(
          collection(db, COLLECTIONS.GAP),
          where("cpf", "==", cleanCpf || ""),
        );
        const snap = await getDocs(q);
        if (snap.empty && cleanCpf) {
          await addDoc(collection(db, COLLECTIONS.GAP), {
            nome: editFormData.nome,
            telefone: cleanTelefone,
            cpf: cleanCpf,
            produto: editFormData.produto,
            numeroOportunidade: editFormData.numeroOportunidade,
            curso: editFormData.curso,
            metodologia: editFormData.metodologia,
            formaIngresso: editFormData.formaIngresso,
            semestre: editFormData.semestre,
            matAcad: false,
            documentos: {},
            createdAt: serverTimestamp(),
          });
          onToast("Candidato atualizado e enviado para o GAP (Convertido)!", "success");
        } else {
          onToast("Status atualizado com sucesso!", "success");
        }
      } else {
        onToast("Informações do candidato atualizadas com sucesso!", "success");
      }

      setIsEditModalOpen(false);
      setEditingCandidate(null);
    } catch (err: any) {
      onToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleVerificacao = () => {
    const invalidIds = new Set<string>();
    bases.forEach((base) => {
      let match = false;

      if (
        gap.some(
          (g) =>
            (g.cpf &&
              base.cpf &&
              g.cpf.replace(/\D/g, "") === base.cpf.replace(/\D/g, "")) ||
            (g.telefone &&
              base.telefone &&
              g.telefone.replace(/\D/g, "") ===
                base.telefone.replace(/\D/g, "")) ||
            g.nome.toLowerCase().trim() === base.nome.toLowerCase().trim(),
        )
      ) {
        match = true;
      }

      if (
        !match &&
        basesRenovacao.some(
          (b) =>
            (b.cpf &&
              base.cpf &&
              b.cpf.replace(/\D/g, "") === base.cpf.replace(/\D/g, "")) ||
            (b.telefone &&
              base.telefone &&
              b.telefone.replace(/\D/g, "") ===
                base.telefone.replace(/\D/g, "")) ||
            b.nome.toLowerCase().trim() === base.nome.toLowerCase().trim(),
        )
      ) {
        match = true;
      }

      if (match) {
        invalidIds.add(base.id);
      }
    });
    setInvalidBaseIds(invalidIds);
    onToast(
      `Verificação concluída: ${invalidIds.size} contatos já estão cadastrados em GAP/Base Líquida.`,
      "success",
    );
  };

  const filteredBases = bases.filter((b) => {
    // Gestor Unidade filtering
    if (profile.role === "Gestor Unidade") {
      if (!profile.unidade || b.unidade !== profile.unidade) {
        return false;
      }
    }

    const matchesSearch = b.nome
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesBase = baseFilter.length === 0 || baseFilter.includes(b.nomeBase);
    const matchesStatus = !statusFilter || b.status === statusFilter;
    const matchesProduto = !produtoFilter || b.produto === produtoFilter;
    const matchesCurso =
      !cursoFilter || b.curso.toLowerCase().includes(cursoFilter.toLowerCase());
    const matchesSemestre =
      !semestreFilter ||
      (b.semestre &&
        b.semestre.toLowerCase().includes(semestreFilter.toLowerCase()));

    const isBlocked = invalidBaseIds.has(b.id);
    const matchesBlocked =
      blockedFilter === "all" ||
      (blockedFilter === "blocked" && isBlocked) ||
      (blockedFilter === "unblocked" && !isBlocked);

    return (
      matchesSearch &&
      matchesBase &&
      matchesStatus &&
      matchesProduto &&
      matchesCurso &&
      matchesSemestre &&
      matchesBlocked
    );
  });
  const uniqueBases = Array.from(new Set(bases.map((b) => b.nomeBase))).sort();
  const uniqueProdutos = ["Graduação", "Técnico", "Pós-graduação"];
  const uniqueCursos = Array.from(new Set(bases.map((b) => b.curso))).sort();
  const uniqueSemestres = Array.from(
    new Set(bases.map((b) => b.semestre).filter(Boolean)),
  ).sort();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanCpf = formData.cpf ? formData.cpf.replace(/\D/g, "") : "";
    const cleanTelefone = formData.telefone.replace(/\D/g, "");

    const isDuplicate = bases.some(
      (b) =>
        (cleanCpf && b.cpf === cleanCpf) ||
        (!cleanCpf && cleanTelefone && b.telefone === cleanTelefone),
    );

    if (isDuplicate) {
      onToast("Registro já existe na base (verificado CPF/Telefone).", "error");
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, COLLECTIONS.BASES), {
        ...formData,
        status: "Pendente",
        unidade: profile.unidade || "",
        createdAt: serverTimestamp(),
      });
      onToast("Registro salvo na base!");
      setFormData({
        nomeBase: "",
        nome: "",
        telefone: "",
        cpf: "",
        curso: "",
        produto: "Graduação",
        numeroOportunidade: "",
        semestre: "",
        periodo: "",
        metodologia: "",
        formaIngresso: "",
        numeroMatricula: "",
      });
    } catch (err: any) {
      onToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleAddCustomMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMsgData.texto.trim()) return;
    setLoading(true);
    try {
      await addDoc(collection(db, COLLECTIONS.WHATSAPP_MESSAGES), {
        tipo: "bases",
        texto: newMsgData.texto,
        nome: newMsgData.modelName || undefined,
        createdAt: serverTimestamp(),
      });
      onToast("Mensagem de base salva!");
      setNewMsgData({ modelName: "", texto: "" });
      setIsAddMsgModalOpen(false);
    } catch (err: any) {
      console.error("Erro ao salvar mensagem:", err);
      onToast(`Erro ao salvar mensagem: ${err.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleInsertDefaultBasesMessages = async () => {
    try {
      const existing = whatsappMessages.filter((m) => m.tipo === "bases");
      if (existing.length > 0) {
        if (
          !window.confirm(
            "Já existem mensagens para Bases. Deseja adicionar as mensagens padrões mesmo assim?",
          )
        ) {
          return;
        }
      }

      const defaults = [
        "Olá [nome], vi que você tem interesse no curso de [curso]. Vamos tirar suas dúvidas?",
        "Oi [nome], aqui é da faculdade! Recebemos sua solicitação sobre o curso de [curso]. Qual o melhor horário para conversarmos?",
        "Tudo bem, [nome]? Preparamos uma oferta especial para você começar o curso de [curso] ainda este semestre! Vamos lá?",
      ];

      for (const texto of defaults) {
        await addDoc(collection(db, COLLECTIONS.WHATSAPP_MESSAGES), {
          tipo: "bases",
          texto,
          createdAt: serverTimestamp(),
        });
      }
      onToast("Mensagens padrões de base inseridas!");
    } catch (err: any) {
      onToast("Erro ao inserir mensagens padrões.", "error");
    }
  };

  const [selectedEntries, setSelectedEntries] = useState<string[]>([]);

  const handleBulkDelete = async () => {
    if (selectedEntries.length === 0) return;
    if (
      window.confirm(
        `Deseja excluir ${selectedEntries.length} registros selecionados?`,
      )
    ) {
      try {
        for (const id of selectedEntries) {
          await deleteDoc(doc(db, COLLECTIONS.BASES, id));
        }
        onToast(`${selectedEntries.length} registros removidos.`);
        setSelectedEntries([]);
      } catch (err: any) {
        onToast("Erro ao excluir registros.", "error");
      }
    }
  };

  const toggleSelect = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedEntries([...selectedEntries, id]);
    } else {
      setSelectedEntries(selectedEntries.filter((s) => s !== id));
    }
  };

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedEntries(
        filteredBases.filter((b) => !invalidBaseIds.has(b.id)).map((b) => b.id),
      );
    } else {
      setSelectedEntries([]);
    }
  };

  const handleStatusChange = async (entry: BaseEntry, status: string) => {
    try {
      await updateDoc(doc(db, COLLECTIONS.BASES, entry.id), { status });

      if (status === "Convertido") {
        // Logic for transferring to GAP
        const q = query(
          collection(db, COLLECTIONS.GAP),
          where("cpf", "==", entry.cpf || ""),
        );
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
            createdAt: serverTimestamp(),
          });
          onToast("Candidato convertido e enviado para GAP!");
        } else {
          onToast("Status atualizado!");
        }
      } else {
        onToast("Status da base atualizado!");
      }
    } catch (err: any) {
      onToast(err.message, "error");
    }
  };

  const handleDeleteBase = async (id: string) => {
    if (window.confirm("Deseja excluir este registro da base?")) {
      try {
        await deleteDoc(doc(db, COLLECTIONS.BASES, id));
        onToast("Registro removido.");
      } catch (err: any) {
        onToast("Erro ao excluir registro.", "error");
      }
    }
  };

  const handleExport = () => {
    const data = filteredBases.map((b) => ({
      Nome: b.nome,
      Telefone: b.telefone,
      CPF: b.cpf || "",
      Curso: b.curso,
      Produto: b.produto || "Graduação",
      "Nº Oportunidade": b.numeroOportunidade || "",
      Semestre: b.semestre || "",
      Periodo: b.periodo || "",
      Metodologia: b.metodologia || "",
      "Forma de Ingresso": b.formaIngresso || "",
      "Nº Matrícula": b.numeroMatricula || "",
      Base: b.nomeBase,
      Status: b.status,
    }));
    exportToExcel(data, "Bases_Trabalho");
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    importFromExcel(file, async (data) => {
      try {
        const getVal = (row: any, ...keys: string[]) => {
          const rowKeys = Object.keys(row);
          for (const key of keys) {
            const foundKey = rowKeys.find(k => k.toLowerCase() === key.toLowerCase());
            if (foundKey && row[foundKey] !== undefined) return row[foundKey];
          }
          return undefined;
        };

        const normalizeProduto = (val: string) => {
          if (!val) return "Graduação";
          const lower = val.trim().toLowerCase();
          if (lower.includes("gradua")) return "Graduação";
          if (lower.includes("tecnic") || lower.includes("técnic")) return "Técnico";
          if (lower.includes("pos") || lower.includes("pós")) return "Pós-graduação";
          return val;
        };

        const normalizeMetodologia = (val: string) => {
          if (!val) return "";
          const lower = val.trim().toLowerCase();
          if (lower === "ead") return "EAD";
          if (lower === "presencial") return "Presencial";
          if (lower === "semipresencial") return "Semipresencial";
          if (lower === "flex") return "Flex";
          if (lower === "hibrido" || lower === "híbrido") return "Híbrido";
          if (lower === "digital") return "Digital";
          return val;
        };

        const normalizeStatusBase = (val: string) => {
          if (!val) return "Pendente";
          const lower = val.trim().toLowerCase();
          if (lower === "pendente") return "Pendente";
          if (lower === "matriculado") return "Matriculado";
          if (lower === "ligacao efetuada" || lower === "ligação efetuada" || lower.includes("liga")) return "Ligação Efetuada";
          if (lower === "sem interesse" || lower.includes("sem inter")) return "Sem Interesse";
          return val.charAt(0).toUpperCase() + val.slice(1);
        };

        const batch = data.map((item) => ({
          nome: String(getVal(item, "Nome", "nome") || "").trim(),
          telefone: String(getVal(item, "Telefone", "telefone") || "").replace(/\D/g, ""),
          cpf: String(getVal(item, "CPF", "cpf") || "").replace(/\D/g, ""),
          curso: String(getVal(item, "Curso", "curso") || "").trim(),
          produto: normalizeProduto(String(getVal(item, "Produto", "produto") || "")),
          numeroOportunidade: String(getVal(item, "Nº Oportunidade", "numeroOportunidade", "oportunidade") || "").trim(),
          semestre: String(getVal(item, "Semestre", "semestre") || "").trim(),
          periodo: String(getVal(item, "Periodo", "periodo", "período") || "").trim(),
          metodologia: normalizeMetodologia(String(getVal(item, "Metodologia", "metodologia") || "")),
          formaIngresso: String(getVal(item, "Forma de Ingresso", "formaIngresso", "ingresso") || "").trim(),
          numeroMatricula: String(getVal(item, "Nº Matrícula", "numeroMatricula", "matricula", "matrícula") || "").trim(),
          nomeBase: String(getVal(item, "Base", "nomeBase") || "Importado").trim(),
          status: normalizeStatusBase(String(getVal(item, "Status", "status") || "")),
          createdAt: serverTimestamp(),
        }));

        let imported = 0;
        let skipped = 0;
        const insertedCpfs = new Set();
        const insertedTels = new Set();

        for (const entry of batch) {
          const isDupCpf =
            entry.cpf &&
            (bases.some((b) => b.cpf === entry.cpf) ||
              insertedCpfs.has(entry.cpf));
          const isDupTel =
            entry.telefone &&
            (bases.some((b) => b.telefone === entry.telefone) ||
              insertedTels.has(entry.telefone));

          if (!isDupCpf && !isDupTel) {
            await addDoc(collection(db, COLLECTIONS.BASES), entry);
            if (entry.cpf) insertedCpfs.add(entry.cpf);
            if (entry.telefone) insertedTels.add(entry.telefone);
            imported++;
          } else {
            skipped++;
          }
        }
        onToast(
          `${imported} registros importados com sucesso! ${skipped > 0 ? `${skipped} ignorados por duplicidade.` : ""}`,
        );
      } catch (err: any) {
        onToast("Erro ao importar dados.", "error");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header and Actions */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Database className="text-blue-600" size={28} />
            Acompanhamento de Bases
          </h2>
          <p className="text-sm text-slate-500">
            Gerencie e analise as bases de captação de candidatos da sua unidade.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {[ROLES.ADMIN_MASTER, ROLES.LIDER_FDV].includes(profile.role) && (
            <button
              onClick={handleVerificacao}
              className="bg-blue-50 text-blue-600 px-4 py-2 rounded-xl flex items-center space-x-2 hover:bg-blue-100 transition-all text-sm font-bold shadow-sm"
              title="Verificar se contatos existem no GAP ou Base Líquida"
            >
              <Search size={18} />
              <span>Verificação</span>
            </button>
          )}
          <button
            onClick={() => setIsAddMsgModalOpen(true)}
            className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl flex items-center space-x-2 hover:bg-emerald-100 transition-all text-sm font-bold shadow-sm"
          >
            <Plus size={18} />
            <span>Inserir Mensagens</span>
          </button>
          <button
            onClick={handleInsertDefaultBasesMessages}
            className="bg-slate-50 text-slate-400 px-3 py-2 rounded-xl flex items-center space-x-2 hover:bg-slate-100 transition-all text-[10px] font-bold shadow-sm"
            title="Inserir Mensagens Padrões"
          >
            <MessageSquare size={14} />
          </button>
          <label className="bg-blue-50 text-blue-600 px-4 py-2 rounded-xl flex items-center space-x-2 hover:bg-blue-100 transition-all text-sm font-bold cursor-pointer shadow-sm">
            <Upload size={18} />
            <span>Importar</span>
            <input
              type="file"
              accept=".xlsx, .xls"
              onChange={handleImport}
              className="hidden"
            />
          </label>
          <button
            onClick={handleExport}
            className="bg-slate-100 text-slate-600 px-4 py-2 rounded-xl flex items-center space-x-2 hover:bg-slate-200 transition-all text-sm font-bold shadow-sm"
          >
            <Download size={18} />
            <span>Exportar</span>
          </button>
        </div>
      </div>

      {/* Elegant Sub-tabs */}
      <div className="flex border-b border-slate-100 gap-2 overflow-x-auto">
        <button
          onClick={() => setBasesSubTab("dashboard")}
          className={cn(
            "px-5 py-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap",
            basesSubTab === "dashboard"
              ? "border-b-2 border-blue-600 text-blue-600 font-bold"
              : "border-b-2 border-transparent text-slate-500 hover:text-slate-800"
          )}
        >
          <LayoutDashboard size={16} />
          <span>Painel Geral (Dashboard)</span>
        </button>
        <button
          onClick={() => setBasesSubTab("lista")}
          className={cn(
            "px-5 py-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap",
            basesSubTab === "lista"
              ? "border-b-2 border-blue-600 text-blue-600 font-bold"
              : "border-b-2 border-transparent text-slate-500 hover:text-slate-800"
          )}
        >
          <Database size={16} />
          <span>Lista de Candidatos</span>
        </button>
        <button
          onClick={() => setBasesSubTab("novo")}
          className={cn(
            "px-5 py-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap",
            basesSubTab === "novo"
              ? "border-b-2 border-blue-600 text-blue-600 font-bold"
              : "border-b-2 border-transparent text-slate-500 hover:text-slate-800"
          )}
        >
          <UserPlus size={16} />
          <span>Novo Registro</span>
        </button>
      </div>

      {/* Dashboard Sub-tab */}
      {basesSubTab === "dashboard" && (
        <div className="space-y-6" id="bases-dashboard-view">
          {/* Main Hero KPI Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="p-3.5 bg-blue-50 text-blue-600 rounded-xl">
                <Users size={24} />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Total de Cadastros</span>
                <span className="text-2xl font-black text-slate-800">{bases.length}</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-xl">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <span className="text-xs font-bold text-emerald-500 uppercase tracking-wider block">Convertidos</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-slate-800">
                    {bases.filter((b) => b.status === "Convertido").length}
                  </span>
                  <span className="text-xs font-bold text-emerald-600">
                    ({bases.length > 0 ? ((bases.filter((b) => b.status === "Convertido").length / bases.length) * 100).toFixed(1) : "0"}%)
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="p-3.5 bg-blue-50 text-blue-500 rounded-xl">
                <TrendingUp size={24} />
              </div>
              <div>
                <span className="text-xs font-bold text-blue-500 uppercase tracking-wider block">Interessados</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-slate-800">
                    {bases.filter((b) => b.status === "Interessado").length}
                  </span>
                  <span className="text-xs font-bold text-blue-600">
                    ({bases.length > 0 ? ((bases.filter((b) => b.status === "Interessado").length / bases.length) * 100).toFixed(1) : "0"}%)
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="p-3.5 bg-amber-50 text-amber-600 rounded-xl">
                <Clock size={24} />
              </div>
              <div>
                <span className="text-xs font-bold text-amber-500 uppercase tracking-wider block">Pendentes</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-slate-800">
                    {bases.filter((b) => b.status === "Pendente").length}
                  </span>
                  <span className="text-xs font-bold text-amber-600">
                    ({bases.length > 0 ? ((bases.filter((b) => b.status === "Pendente").length / bases.length) * 100).toFixed(1) : "0"}%)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 2-Column Bento Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Column 1: Performance por Base */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Database size={18} className="text-blue-500" />
                Desempenho por Base de Origem
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase pb-2">
                      <th className="pb-2">Nome da Base</th>
                      <th className="pb-2 text-center">Registros</th>
                      <th className="pb-2 text-center">Conversões</th>
                      <th className="pb-2 text-right">Conversão (%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {statsByBase.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-4 text-center text-slate-400 italic">
                          Nenhuma base registrada ainda.
                        </td>
                      </tr>
                    ) : (
                      statsByBase.slice(0, 10).map((b) => (
                        <tr key={b.name} className="hover:bg-slate-50/50">
                          <td className="py-3 font-semibold text-slate-700">{b.name}</td>
                          <td className="py-3 text-center font-bold text-slate-600">{b.total}</td>
                          <td className="py-3 text-center text-emerald-600 font-bold">{b.converted}</td>
                          <td className="py-3 text-right">
                            <span className="inline-block px-2 py-0.5 rounded-full font-black bg-emerald-50 text-emerald-700 text-[10px]">
                              {b.conversionRate}%
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Column 2: Status & Product distributions */}
            <div className="space-y-6">
              {/* Distribution of Statuses */}
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Target size={18} className="text-blue-500" />
                  Distribuição de Status dos Candidatos
                </h3>
                <div className="space-y-3">
                  {statsByStatus.map((s) => (
                    <div key={s.name} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-600 flex items-center gap-1.5">
                          <span className={cn(
                            "w-2 h-2 rounded-full",
                            s.name === "Pendente" && "bg-slate-400",
                            s.name === "Interessado" && "bg-blue-400",
                            s.name === "Convertido" && "bg-emerald-400",
                            s.name === "Não tem interesse" && "bg-rose-400",
                            s.name === "Sem retorno" && "bg-orange-400",
                          )} />
                          {s.name}
                        </span>
                        <span className="text-slate-800 font-bold">
                          {s.count} <span className="text-slate-400 font-normal">({s.percentage}%)</span>
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
                            s.name === "Pendente" && "bg-slate-400",
                            s.name === "Interessado" && "bg-blue-400",
                            s.name === "Convertido" && "bg-emerald-400",
                            s.name === "Não tem interesse" && "bg-rose-400",
                            s.name === "Sem retorno" && "bg-orange-400",
                          )}
                          style={{ width: `${s.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Distribution of Products */}
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <GraduationCap size={18} className="text-blue-500" />
                  Distribuição por Produto Acadêmico
                </h3>
                <div className="space-y-3">
                  {statsByProduct.map((p) => (
                    <div key={p.name} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-600">{p.name}</span>
                        <span className="text-slate-800 font-bold">
                          {p.count} <span className="text-slate-400 font-normal">({p.percentage}%)</span>
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full transition-all"
                          style={{ width: `${p.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Cadastro Sub-tab */}
      {basesSubTab === "novo" && (
        <div className="max-w-xl mx-auto">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <h3 className="text-xl font-bold text-slate-900 mb-4">
              Novo Registro em Base
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                placeholder="Nome da Base (Ex: Junho 2024)"
                required
                value={formData.nomeBase}
                onChange={(e) =>
                  setFormData({ ...formData, nomeBase: e.target.value })
                }
                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <div className="grid grid-cols-2 gap-4">
                <input
                  placeholder="Nome"
                  required
                  value={formData.nome}
                  onChange={(e) =>
                    setFormData({ ...formData, nome: e.target.value })
                  }
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <input
                  placeholder="Telefone"
                  required
                  value={formData.telefone}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      telefone: formatPhone(e.target.value),
                    })
                  }
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input
                  placeholder="CPF"
                  value={formData.cpf}
                  onChange={(e) =>
                    setFormData({ ...formData, cpf: formatCPF(e.target.value) })
                  }
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <input
                  placeholder="N° Oportunidade"
                  required
                  value={formData.numeroOportunidade}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      numeroOportunidade: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input
                  placeholder="Semestre"
                  required
                  value={formData.semestre}
                  onChange={(e) =>
                    setFormData({ ...formData, semestre: e.target.value })
                  }
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <select
                  value={formData.produto}
                  onChange={(e) =>
                    setFormData({ ...formData, produto: e.target.value as any })
                  }
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  {uniqueProdutos.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input
                  placeholder="Metodologia"
                  required
                  value={formData.metodologia}
                  onChange={(e) =>
                    setFormData({ ...formData, metodologia: e.target.value })
                  }
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <input
                  placeholder="Forma de Ingresso"
                  required
                  value={formData.formaIngresso}
                  onChange={(e) =>
                    setFormData({ ...formData, formaIngresso: e.target.value })
                  }
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input
                  placeholder="Período"
                  value={formData.periodo}
                  onChange={(e) =>
                    setFormData({ ...formData, periodo: e.target.value })
                  }
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <input
                  placeholder="Nº Matrícula"
                  value={formData.numeroMatricula}
                  onChange={(e) =>
                    setFormData({ ...formData, numeroMatricula: e.target.value })
                  }
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <input
                placeholder="Curso"
                required
                value={formData.curso}
                onChange={(e) =>
                  setFormData({ ...formData, curso: e.target.value })
                }
                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50"
              >
                {loading ? "Salvando..." : "Adicionar à Base"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Candidates List Sub-tab */}
      {basesSubTab === "lista" && (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h3 className="text-xl font-bold text-slate-900">
              Bases a Trabalhar
            </h3>
            <div className="flex flex-wrap gap-2">
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  size={16}
                />
                <input
                  type="text"
                  placeholder="Buscar por nome..."
                  className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 w-48"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <MultiSelect
                options={uniqueBases}
                selectedValues={baseFilter}
                onChange={setBaseFilter}
                placeholder="Todas as Bases"
                allLabel="Todas as Bases"
              />
              <select
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500"
                value={produtoFilter}
                onChange={(e) => setProdutoFilter(e.target.value)}
              >
                <option value="">Todos os Produtos</option>
                {uniqueProdutos.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
              <select
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500"
                value={cursoFilter}
                onChange={(e) => setCursoFilter(e.target.value)}
              >
                <option value="">Todos os Cursos</option>
                {uniqueCursos.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <select
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500"
                value={semestreFilter}
                onChange={(e) => setSemestreFilter(e.target.value)}
              >
                <option value="">Todos os Semestres</option>
                {uniqueSemestres.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <select
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">Todos Status</option>
                <option value="Pendente">Pendente</option>
                <option value="Interessado">Interessado</option>
                <option value="Convertido">Convertido</option>
                <option value="Não tem interesse">Não tem interesse</option>
                <option value="Sem retorno">Sem retorno</option>
              </select>
              <select
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500"
                value={blockedFilter}
                onChange={(e) => setBlockedFilter(e.target.value as any)}
              >
                <option value="all">Verificação: Todos</option>
                <option value="blocked">Verificação: Bloqueados</option>
                <option value="unblocked">Verificação: Ativos</option>
              </select>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                  <th className="px-6 py-4 w-12 text-center">#</th>
                  <th className="px-6 py-4 w-12">
                    <input
                      type="checkbox"
                      checked={
                        filteredBases.filter((b) => !invalidBaseIds.has(b.id))
                          .length > 0 &&
                        selectedEntries.length ===
                          filteredBases.filter((b) => !invalidBaseIds.has(b.id))
                            .length
                      }
                      onChange={(e) => toggleSelectAll(e.target.checked)}
                    />
                  </th>
                  <th className="px-6 py-4">Nome</th>
                  <th className="px-6 py-4">Base</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 flex items-center gap-4">
                    {selectedEntries.length > 0 && (
                      <button
                        onClick={handleBulkDelete}
                        className="text-rose-600 font-bold hover:underline"
                      >
                        excluir selecionados
                      </button>
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
                  <tr
                    key={entry.id}
                    className={cn(
                      "hover:bg-slate-50/50 transition-all",
                      invalidBaseIds.has(entry.id) && "bg-rose-50/50",
                    )}
                  >
                    <td className="px-6 py-4 text-center font-bold text-slate-400 text-xs">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        disabled={invalidBaseIds.has(entry.id)}
                        checked={selectedEntries.includes(entry.id)}
                        onChange={(e) =>
                          !invalidBaseIds.has(entry.id) &&
                          toggleSelect(entry.id, e.target.checked)
                        }
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900">
                          {entry.nome}
                        </span>
                        <span className="text-xs text-slate-500">
                          {entry.curso}
                        </span>
                        <div className="flex items-center space-x-2 mt-1 flex-wrap gap-y-1">
                          {entry.telefone && (
                            <span className="text-[10px] text-slate-400 font-bold">
                              {entry.telefone}
                            </span>
                          )}
                          {entry.cpf && (
                            <span className="text-[10px] text-slate-500 font-bold px-2 py-0.5 bg-slate-100 rounded-full">
                              CPF: {formatCPF(entry.cpf)}
                            </span>
                          )}
                          {entry.semestre && (
                            <span className="text-[10px] text-blue-500 font-bold px-2 py-0.5 bg-blue-50 rounded-full">
                              {entry.semestre}
                            </span>
                          )}
                          {entry.periodo && (
                            <span className="text-[10px] text-purple-500 font-bold px-2 py-0.5 bg-purple-50 rounded-full">
                              {entry.periodo}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {entry.nomeBase}
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={entry.status}
                        onChange={(e) =>
                          handleStatusChange(entry, e.target.value)
                        }
                        className={cn(
                          "px-2 py-1 rounded-lg text-xs font-bold outline-none border-none",
                          entry.status === "Pendente" &&
                            "bg-slate-100 text-slate-600",
                          entry.status === "Interessado" &&
                            "bg-blue-100 text-blue-600",
                          entry.status === "Convertido" &&
                            "bg-emerald-100 text-emerald-600",
                          entry.status === "Não tem interesse" &&
                            "bg-rose-100 text-rose-600",
                          entry.status === "Sem retorno" &&
                            "bg-orange-100 text-orange-600",
                        )}
                      >
                        <option value="Pendente">Pendente</option>
                        <option value="Interessado">Interessado</option>
                        <option value="Convertido">Convertido</option>
                        <option value="Não tem interesse">
                          Não tem interesse
                        </option>
                        <option value="Sem retorno">Sem retorno</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 flex items-center space-x-2">
                      {!invalidBaseIds.has(entry.id) && (
                        <button
                          onClick={() => {
                            setSelectedEntry(entry);
                            setSelectorOpen(true);
                          }}
                          className="text-emerald-600 font-bold text-sm flex items-center space-x-1 hover:text-emerald-700"
                        >
                          <MessageSquare size={14} />
                          <span>WhatsApp</span>
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setEditingCandidate(entry);
                          setEditFormData({
                            nomeBase: entry.nomeBase || "",
                            nome: entry.nome || "",
                            telefone: entry.telefone || "",
                            cpf: entry.cpf || "",
                            curso: entry.curso || "",
                            produto: entry.produto || "Graduação",
                            numeroOportunidade: entry.numeroOportunidade || "",
                            semestre: entry.semestre || "",
                            periodo: entry.periodo || "",
                            metodologia: entry.metodologia || "",
                            formaIngresso: entry.formaIngresso || "",
                            numeroMatricula: entry.numeroMatricula || "",
                            status: entry.status || "Pendente",
                          });
                          setIsEditModalOpen(true);
                        }}
                        className="text-blue-500 hover:text-blue-700 p-2 hover:bg-blue-50 rounded-lg transition-all"
                        title="Editar Candidato"
                      >
                        <Edit2 size={16} />
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
                    <td
                      colSpan={6}
                      className="px-6 py-12 text-center text-slate-400 italic"
                    >
                      Nenhum registro encontrado com os filtros aplicados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Editing Candidate Modal */}
      {isEditModalOpen && editingCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden my-8 animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Edit2 size={20} className="text-blue-600" />
                Editar Candidato
              </h3>
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingCandidate(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    Nome da Base *
                  </label>
                  <input
                    type="text"
                    required
                    value={editFormData.nomeBase}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, nomeBase: e.target.value })
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-500"
                    placeholder="Ex: Junho 2024"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    Nome do Candidato *
                  </label>
                  <input
                    type="text"
                    required
                    value={editFormData.nome}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, nome: e.target.value })
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    Telefone *
                  </label>
                  <input
                    type="text"
                    required
                    value={editFormData.telefone}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        telefone: formatPhone(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    CPF
                  </label>
                  <input
                    type="text"
                    value={editFormData.cpf}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, cpf: formatCPF(e.target.value) })
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    Nº Oportunidade
                  </label>
                  <input
                    type="text"
                    value={editFormData.numeroOportunidade}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        numeroOportunidade: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    Curso *
                  </label>
                  <input
                    type="text"
                    required
                    value={editFormData.curso}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, curso: e.target.value })
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    Produto *
                  </label>
                  <select
                    value={editFormData.produto}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, produto: e.target.value as any })
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-500 bg-white"
                  >
                    {uniqueProdutos.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    Semestre *
                  </label>
                  <input
                    type="text"
                    required
                    value={editFormData.semestre}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, semestre: e.target.value })
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    Período
                  </label>
                  <input
                    type="text"
                    value={editFormData.periodo}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, periodo: e.target.value })
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    Metodologia
                  </label>
                  <input
                    type="text"
                    value={editFormData.metodologia}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, metodologia: e.target.value })
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    Forma de Ingresso
                  </label>
                  <input
                    type="text"
                    value={editFormData.formaIngresso}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, formaIngresso: e.target.value })
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    Nº Matrícula
                  </label>
                  <input
                    type="text"
                    value={editFormData.numeroMatricula}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, numeroMatricula: e.target.value })
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    Status do Candidato *
                  </label>
                  <select
                    value={editFormData.status}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, status: e.target.value as any })
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-500 bg-white"
                  >
                    <option value="Pendente">Pendente</option>
                    <option value="Interessado">Interessado</option>
                    <option value="Convertido">Convertido</option>
                    <option value="Não tem interesse">Não tem interesse</option>
                    <option value="Sem retorno">Sem retorno</option>
                  </select>
                </div>
              </div>

              {/* Form buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditingCandidate(null);
                  }}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  {loading ? "Salvando..." : "Salvar Alterações"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <WhatsAppMessageSelector
        isOpen={selectorOpen}
        onClose={() => setSelectorOpen(false)}
        leadName={selectedEntry?.nome || ""}
        leadCurso={selectedEntry?.curso || ""}
        leadMatricula={selectedEntry?.numeroMatricula || ""}
        messages={whatsappMessages.filter((m) => m.tipo === "bases")}
        onSelect={(msg) => {
          if (selectedEntry) {
            window.open(getWhatsAppUrl(selectedEntry.telefone, msg), "_blank");
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
        messages={whatsappMessages.filter((m) => m.tipo === "bases")}
        onSelect={(msg) => {}}
        botConfig={botConfig}
        onSendBot={(msgTemplate) => {
          const selectedLeadObjs = bases.filter(
            (b) => selectedEntries.includes(b.id) && !invalidBaseIds.has(b.id),
          );
          const messagesPayload = selectedLeadObjs.map((l) => ({
            telefone: l.telefone,
            message: replaceMessageVariables(msgTemplate, l),
          }));
          onMassSendBot(messagesPayload);
          setMassSelectorOpen(false);
          setSelectedEntries([]);
        }}
        forceBotOnly={true}
      />

      <AnimatePresence>
        <MessageTemplateModal
          isOpen={isAddMsgModalOpen}
          onClose={() => setIsAddMsgModalOpen(false)}
          tipo="bases"
          onToast={onToast}
          availableVariables={[
            {
              key: "[nome]",
              label: "Nome do Lead",
              previewValue: "Maria Souza",
            },
            { key: "[curso]", label: "Curso", previewValue: "Administração" },
            {
              key: "[unidade]",
              label: "Unidade",
              previewValue: "Unidade Central",
            },
            {
              key: "[data_contato]",
              label: "Data",
              previewValue: new Date().toLocaleDateString("pt-BR"),
            },
            { key: "[saudacao]", label: "Saudação", previewValue: "Olá" },
          ]}
        />
      </AnimatePresence>
    </div>
  );
}

function BasesRenovacaoView({
  bases,
  onToast,
  profile,
  whatsappMessages,
  botConfig,
  onSendBot,
  onMassSendBot,
}: {
  bases: BaseEntry[];
  onToast: (m: string, t?: "success" | "error") => void;
  profile: UserProfile;
  whatsappMessages: WhatsAppMessage[];
  botConfig: BotConfig;
  onSendBot: (tel: string, msg: string) => void;
  onMassSendBot: (messages: { telefone: string; message: string }[]) => void;
}) {
  const [formData, setFormData] = useState({
    nomeBase: "",
    nome: "",
    telefone: "",
    cpf: "",
    curso: "",
    produto: "Graduação" as "Graduação" | "Técnico" | "Pós-graduação",
    numeroOportunidade: "",
    semestre: "",
    periodo: "",
    metodologia: "",
    formaIngresso: "",
    numeroMatricula: "",
  });
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [baseFilter, setBaseFilter] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [produtoFilter, setProdutoFilter] = useState("");
  const [cursoFilter, setCursoFilter] = useState("");
  const [semestreFilter, setSemestreFilter] = useState("");
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<BaseEntry | null>(null);
  const [massSelectorOpen, setMassSelectorOpen] = useState(false);
  const [isAddMsgModalOpen, setIsAddMsgModalOpen] = useState(false);
  const [newMsgData, setNewMsgData] = useState({ modelName: "", texto: "" });

  const filteredBases = bases.filter((b) => {
    // Gestor Unidade filtering
    if (profile.role === "Gestor Unidade") {
      if (!profile.unidade || b.unidade !== profile.unidade) {
        return false;
      }
    }

    const matchesSearch = b.nome
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesBase = baseFilter.length === 0 || baseFilter.includes(b.nomeBase);
    const matchesStatus = !statusFilter || b.status === statusFilter;
    const matchesProduto = !produtoFilter || b.produto === produtoFilter;
    const matchesCurso =
      !cursoFilter || b.curso.toLowerCase().includes(cursoFilter.toLowerCase());
    const matchesSemestre =
      !semestreFilter ||
      (b.semestre &&
        b.semestre.toLowerCase().includes(semestreFilter.toLowerCase()));
    return (
      matchesSearch &&
      matchesBase &&
      matchesStatus &&
      matchesProduto &&
      matchesCurso &&
      matchesSemestre
    );
  });

  const uniqueBases = Array.from(new Set(bases.map((b) => b.nomeBase))).sort();
  const uniqueProdutos = ["Graduação", "Técnico", "Pós-graduação"];
  const uniqueCursos = Array.from(new Set(bases.map((b) => b.curso))).sort();
  const uniqueSemestres = Array.from(
    new Set(bases.map((b) => b.semestre).filter(Boolean)),
  ).sort();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanCpf = formData.cpf ? formData.cpf.replace(/\D/g, "") : "";
    const cleanTelefone = formData.telefone.replace(/\D/g, "");

    const isDuplicate = bases.some(
      (b) =>
        (cleanCpf && b.cpf === cleanCpf) ||
        (!cleanCpf && cleanTelefone && b.telefone === cleanTelefone),
    );

    if (isDuplicate) {
      onToast("Registro já existe na base (verificado CPF/Telefone).", "error");
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, COLLECTIONS.BASES_RENOVACAO), {
        ...formData,
        status: "Pendente",
        createdAt: serverTimestamp(),
      });
      onToast("Registro salvo na base de renovação!");
      setFormData({
        nomeBase: "",
        nome: "",
        telefone: "",
        cpf: "",
        curso: "",
        produto: "Graduação",
        numeroOportunidade: "",
        semestre: "",
        periodo: "",
        metodologia: "",
        formaIngresso: "",
        numeroMatricula: "",
      });
    } catch (err: any) {
      onToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const [selectedEntries, setSelectedEntries] = useState<string[]>([]);

  const handleBulkDelete = async () => {
    if (selectedEntries.length === 0) return;
    if (
      window.confirm(
        `Deseja excluir ${selectedEntries.length} registros selecionados?`,
      )
    ) {
      try {
        for (const id of selectedEntries) {
          await deleteDoc(doc(db, COLLECTIONS.BASES_RENOVACAO, id));
        }
        onToast(`${selectedEntries.length} registros removidos.`);
        setSelectedEntries([]);
      } catch (err: any) {
        onToast("Erro ao excluir registros.", "error");
      }
    }
  };

  const toggleSelect = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedEntries([...selectedEntries, id]);
    } else {
      setSelectedEntries(selectedEntries.filter((s) => s !== id));
    }
  };

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedEntries(filteredBases.map((b) => b.id));
    } else {
      setSelectedEntries([]);
    }
  };

  const handleStatusChange = async (entry: BaseEntry, status: string) => {
    try {
      await updateDoc(doc(db, COLLECTIONS.BASES_RENOVACAO, entry.id), {
        status,
      });
      onToast("Status atualizado!");
    } catch (err: any) {
      onToast(err.message, "error");
    }
  };

  const handleDeleteBase = async (id: string) => {
    if (window.confirm("Deseja excluir este registro da base?")) {
      try {
        await deleteDoc(doc(db, COLLECTIONS.BASES_RENOVACAO, id));
        onToast("Registro removido.");
      } catch (err: any) {
        onToast("Erro ao excluir registro.", "error");
      }
    }
  };

  const handleExport = () => {
    const data = filteredBases.map((b) => ({
      Nome: b.nome,
      Telefone: b.telefone,
      CPF: b.cpf || "",
      Curso: b.curso,
      Produto: b.produto || "Graduação",
      "Nº Oportunidade": b.numeroOportunidade || "",
      Semestre: b.semestre || "",
      Periodo: b.periodo || "",
      Metodologia: b.metodologia || "",
      "Forma de Ingresso": b.formaIngresso || "",
      "Nº Matrícula": b.numeroMatricula || "",
      Base: b.nomeBase,
      Status: b.status,
    }));
    exportToExcel(data, "Bases_Renovacao");
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    importFromExcel(file, async (data) => {
      try {
        const getVal = (row: any, ...keys: string[]) => {
          const rowKeys = Object.keys(row);
          for (const key of keys) {
            const foundKey = rowKeys.find(k => k.toLowerCase() === key.toLowerCase());
            if (foundKey && row[foundKey] !== undefined) return row[foundKey];
          }
          return undefined;
        };

        const normalizeProduto = (val: string) => {
          if (!val) return "Graduação";
          const lower = val.trim().toLowerCase();
          if (lower.includes("gradua")) return "Graduação";
          if (lower.includes("tecnic") || lower.includes("técnic")) return "Técnico";
          if (lower.includes("pos") || lower.includes("pós")) return "Pós-graduação";
          return val;
        };

        const normalizeMetodologia = (val: string) => {
          if (!val) return "";
          const lower = val.trim().toLowerCase();
          if (lower === "ead") return "EAD";
          if (lower === "presencial") return "Presencial";
          if (lower === "semipresencial") return "Semipresencial";
          if (lower === "flex") return "Flex";
          if (lower === "hibrido" || lower === "híbrido") return "Híbrido";
          if (lower === "digital") return "Digital";
          return val;
        };

        const normalizeStatusBase = (val: string) => {
          if (!val) return "Pendente";
          const lower = val.trim().toLowerCase();
          if (lower === "pendente") return "Pendente";
          if (lower === "matriculado") return "Matriculado";
          if (lower === "ligacao efetuada" || lower === "ligação efetuada" || lower.includes("liga")) return "Ligação Efetuada";
          if (lower === "sem interesse" || lower.includes("sem inter")) return "Sem Interesse";
          return val.charAt(0).toUpperCase() + val.slice(1);
        };

        const batch = data.map((item) => ({
          nome: String(getVal(item, "Nome", "nome") || "").trim(),
          telefone: String(getVal(item, "Telefone", "telefone") || "").replace(/\D/g, ""),
          cpf: String(getVal(item, "CPF", "cpf") || "").replace(/\D/g, ""),
          curso: String(getVal(item, "Curso", "curso") || "").trim(),
          produto: normalizeProduto(String(getVal(item, "Produto", "produto") || "")),
          numeroOportunidade: String(getVal(item, "Nº Oportunidade", "numeroOportunidade", "oportunidade") || "").trim(),
          semestre: String(getVal(item, "Semestre", "semestre") || "").trim(),
          periodo: String(getVal(item, "Periodo", "periodo", "período") || "").trim(),
          metodologia: normalizeMetodologia(String(getVal(item, "Metodologia", "metodologia") || "")),
          formaIngresso: String(getVal(item, "Forma de Ingresso", "formaIngresso", "ingresso") || "").trim(),
          numeroMatricula: String(getVal(item, "Nº Matrícula", "numeroMatricula", "matricula", "matrícula") || "").trim(),
          nomeBase: String(getVal(item, "Base", "nomeBase") || "Importado Renovação").trim(),
          status: normalizeStatusBase(String(getVal(item, "Status", "status") || "")),
          createdAt: serverTimestamp(),
        }));

        let imported = 0;
        let skipped = 0;
        const insertedCpfs = new Set();
        const insertedTels = new Set();

        for (const entry of batch) {
          const isDupCpf =
            entry.cpf &&
            (bases.some((b) => b.cpf === entry.cpf) ||
              insertedCpfs.has(entry.cpf));
          const isDupTel =
            entry.telefone &&
            (bases.some((b) => b.telefone === entry.telefone) ||
              insertedTels.has(entry.telefone));

          if (!isDupCpf && !isDupTel) {
            await addDoc(collection(db, COLLECTIONS.BASES_RENOVACAO), entry);
            if (entry.cpf) insertedCpfs.add(entry.cpf);
            if (entry.telefone) insertedTels.add(entry.telefone);
            imported++;
          } else {
            skipped++;
          }
        }
        onToast(
          `${imported} registros importados com sucesso! ${skipped > 0 ? `${skipped} ignorados por duplicidade.` : ""}`,
        );
      } catch (err: any) {
        onToast("Erro ao importar dados.", "error");
      }
    });
  };

  const handleAddCustomMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMsgData.texto.trim()) return;
    setLoading(true);
    try {
      await addDoc(collection(db, COLLECTIONS.WHATSAPP_MESSAGES), {
        tipo: "bases_renovacao",
        texto: newMsgData.texto,
        nome: newMsgData.modelName || undefined,
        createdAt: serverTimestamp(),
      });
      onToast("Mensagem de renovação salva!");
      setNewMsgData({ modelName: "", texto: "" });
      setIsAddMsgModalOpen(false);
    } catch (err: any) {
      console.error("Erro ao salvar mensagem renovação:", err);
      onToast(`Erro ao salvar mensagem: ${err.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleInsertDefaultRenovacaoMessages = async () => {
    try {
      const existing = whatsappMessages.filter(
        (m) => m.tipo === "bases_renovacao",
      );
      if (existing.length > 0) {
        if (
          !window.confirm(
            "Já existem mensagens de renovação. Deseja adicionar as mensagens padrões mesmo assim?",
          )
        ) {
          return;
        }
      }

      const defaults = [
        "Olá [nome], notamos que sua matrícula ainda não foi renovada. Vamos garantir sua vaga para o próximo semestre?",
        "Oi [nome], preparamos condições exclusivas para sua renovação hoje! Vamos conferir?",
        "Atenção [nome]! O prazo para renovação está terminando. Não perca sua vaga!",
      ];

      for (const texto of defaults) {
        await addDoc(collection(db, COLLECTIONS.WHATSAPP_MESSAGES), {
          tipo: "bases_renovacao",
          texto,
          createdAt: serverTimestamp(),
        });
      }
      onToast("Mensagens padrões inseridas com sucesso!");
    } catch (err: any) {
      onToast("Erro ao inserir mensagens padrões.", "error");
    }
  };

  const totalAlunos = filteredBases.length;
  const renovados = filteredBases.filter(
    (b) => b.status === "Convertido",
  ).length;
  const naoRenovados = totalAlunos - renovados;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-center max-w-xl mx-auto gap-4">
        <h3 className="text-xl font-bold text-slate-900 whitespace-nowrap">
          Base Líquida
        </h3>
        <div className="flex flex-wrap justify-center gap-2">
          <button
            onClick={() => setIsAddMsgModalOpen(true)}
            className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl flex items-center space-x-2 hover:bg-emerald-100 transition-all text-sm font-bold"
          >
            <Plus size={18} />
            <span>Inserir Mensagens</span>
          </button>
          <button
            onClick={handleInsertDefaultRenovacaoMessages}
            className="bg-slate-50 text-slate-400 px-3 py-2 rounded-xl flex items-center space-x-2 hover:bg-slate-100 transition-all text-[10px] font-bold"
            title="Inserir Mensagens Padrões"
          >
            <MessageSquare size={14} />
          </button>
          <label className="bg-blue-50 text-blue-600 px-4 py-2 rounded-xl flex items-center space-x-2 hover:bg-blue-100 transition-all text-sm font-bold cursor-pointer">
            <Upload size={18} />
            <span>Importar</span>
            <input
              type="file"
              accept=".xlsx, .xls"
              onChange={handleImport}
              className="hidden"
            />
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

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-center items-center text-center">
          <div className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">
            Total na Base
          </div>
          <div className="text-3xl font-black text-slate-800">
            {totalAlunos}
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-emerald-100 flex flex-col justify-center items-center text-center">
          <div className="text-sm font-bold text-emerald-600 uppercase tracking-wider mb-2">
            Renovados
          </div>
          <div className="text-3xl font-black text-emerald-700">
            {renovados}
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-orange-100 flex flex-col justify-center items-center text-center">
          <div className="text-sm font-bold text-orange-600 uppercase tracking-wider mb-2">
            Não Renovados
          </div>
          <div className="text-3xl font-black text-orange-700">
            {naoRenovados}
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-rose-100 flex flex-col justify-center items-center text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-rose-50 opacity-50"></div>
          <div className="relative z-10 w-full">
            <div className="text-sm font-bold text-rose-600 uppercase tracking-wider mb-2">
              Gap
            </div>
            <div className="text-3xl font-black text-rose-700">
              {totalAlunos > 0 ? naoRenovados : 0}
            </div>
            <div className="text-xs text-rose-500 font-bold mt-1">
              Faltam{" "}
              {totalAlunos > 0
                ? ((naoRenovados / totalAlunos) * 100).toFixed(1)
                : 0}
              % para a meta
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-xl mx-auto">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <h3 className="text-xl font-bold text-slate-900 mb-4">
            Novo Registro em Renovação
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              placeholder="Nome da Base (Ex: Renovação 2024.2)"
              required
              value={formData.nomeBase}
              onChange={(e) =>
                setFormData({ ...formData, nomeBase: e.target.value })
              }
              className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <div className="grid grid-cols-2 gap-4">
              <input
                placeholder="Nome"
                required
                value={formData.nome}
                onChange={(e) =>
                  setFormData({ ...formData, nome: e.target.value })
                }
                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <input
                placeholder="Telefone"
                required
                value={formData.telefone}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    telefone: formatPhone(e.target.value),
                  })
                }
                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <input
                placeholder="CPF"
                value={formData.cpf}
                onChange={(e) =>
                  setFormData({ ...formData, cpf: formatCPF(e.target.value) })
                }
                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <input
                placeholder="N° de Matrícula"
                required
                value={formData.numeroMatricula}
                onChange={(e) =>
                  setFormData({ ...formData, numeroMatricula: e.target.value })
                }
                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <input
                placeholder="Semestre"
                required
                value={formData.semestre}
                onChange={(e) =>
                  setFormData({ ...formData, semestre: e.target.value })
                }
                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <select
                value={formData.produto}
                onChange={(e) =>
                  setFormData({ ...formData, produto: e.target.value as any })
                }
                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
              >
                {uniqueProdutos.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-1">
              <input
                placeholder="Metodologia"
                required
                value={formData.metodologia}
                onChange={(e) =>
                  setFormData({ ...formData, metodologia: e.target.value })
                }
                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <input
              placeholder="Curso"
              required
              value={formData.curso}
              onChange={(e) =>
                setFormData({ ...formData, curso: e.target.value })
              }
              className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50"
            >
              {loading ? "Salvando..." : "Adicionar à Renovação"}
            </button>
          </form>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h3 className="text-xl font-bold text-slate-900">
            Bases a Trabalhar (Líquida)
          </h3>
          <div className="flex flex-wrap gap-2">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={16}
              />
              <input
                type="text"
                placeholder="Buscar por nome..."
                className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 w-48"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <MultiSelect
              options={uniqueBases}
              selectedValues={baseFilter}
              onChange={setBaseFilter}
              placeholder="Todas as Bases"
              allLabel="Todas as Bases"
            />
            <select
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500"
              value={produtoFilter}
              onChange={(e) => setProdutoFilter(e.target.value)}
            >
              <option value="">Todos os Produtos</option>
              {uniqueProdutos.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            <select
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500"
              value={cursoFilter}
              onChange={(e) => setCursoFilter(e.target.value)}
            >
              <option value="">Todos os Cursos</option>
              {uniqueCursos.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <select
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500"
              value={semestreFilter}
              onChange={(e) => setSemestreFilter(e.target.value)}
            >
              <option value="">Todos os Semestres</option>
              {uniqueSemestres.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <select
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
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
                <th className="px-6 py-4 w-12 text-center">#</th>
                <th className="px-6 py-4 w-12">
                  <input
                    type="checkbox"
                    checked={
                      selectedEntries.length === filteredBases.length &&
                      filteredBases.length > 0
                    }
                    onChange={(e) => toggleSelectAll(e.target.checked)}
                  />
                </th>
                <th className="px-6 py-4">Nome</th>
                <th className="px-6 py-4">Base</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 flex items-center gap-4">
                  {selectedEntries.length > 0 && (
                    <button
                      onClick={handleBulkDelete}
                      className="text-rose-600 font-bold hover:underline"
                    >
                      excluir selecionados
                    </button>
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
                <tr
                  key={entry.id}
                  className="hover:bg-slate-50/50 transition-all"
                >
                  <td className="px-6 py-4 text-center font-bold text-slate-400 text-xs">
                    {index + 1}
                  </td>
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedEntries.includes(entry.id)}
                      onChange={(e) => toggleSelect(entry.id, e.target.checked)}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-900">
                        {entry.nome}
                      </span>
                      <span className="text-xs text-slate-500">
                        {entry.curso}
                      </span>
                      <div className="flex items-center space-x-2 mt-1">
                        {entry.telefone && (
                          <span className="text-[10px] text-slate-400 font-bold">
                            {entry.telefone}
                          </span>
                        )}
                        {entry.semestre && (
                          <span className="text-[10px] text-blue-500 font-bold px-2 py-0.5 bg-blue-50 rounded-full">
                            {entry.semestre}
                          </span>
                        )}
                        {entry.periodo && (
                          <span className="text-[10px] text-purple-500 font-bold px-2 py-0.5 bg-purple-50 rounded-full">
                            {entry.periodo}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {entry.nomeBase}
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={entry.status}
                      onChange={(e) =>
                        handleStatusChange(entry, e.target.value)
                      }
                      className={cn(
                        "px-2 py-1 rounded-lg text-xs font-bold outline-none border-none",
                        entry.status === "Pendente" &&
                          "bg-slate-100 text-slate-600",
                        entry.status === "Interessado" &&
                          "bg-blue-100 text-blue-600",
                        entry.status === "Convertido" &&
                          "bg-emerald-100 text-emerald-600",
                        entry.status === "Não tem interesse" &&
                          "bg-rose-100 text-rose-600",
                        entry.status === "Sem retorno" &&
                          "bg-orange-100 text-orange-600",
                      )}
                    >
                      <option value="Pendente">Pendente</option>
                      <option value="Interessado">Interessado</option>
                      <option value="Convertido">Convertido</option>
                      <option value="Não tem interesse">
                        Não tem interesse
                      </option>
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
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-slate-400 italic"
                  >
                    Nenhum registro encontrado com os filtros aplicados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <WhatsAppMessageSelector
        isOpen={selectorOpen}
        onClose={() => setSelectorOpen(false)}
        leadName={selectedEntry?.nome || ""}
        leadCurso={selectedEntry?.curso || ""}
        leadMatricula={selectedEntry?.numeroMatricula || ""}
        messages={whatsappMessages.filter((m) => m.tipo === "bases_renovacao")}
        onSelect={(msg) => {
          if (selectedEntry) {
            window.open(getWhatsAppUrl(selectedEntry.telefone, msg), "_blank");
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
        messages={whatsappMessages.filter((m) => m.tipo === "bases_renovacao")}
        onSelect={(msg) => {}}
        botConfig={botConfig}
        onSendBot={(msgTemplate) => {
          const selectedLeadObjs = bases.filter((b) =>
            selectedEntries.includes(b.id),
          );
          const messagesPayload = selectedLeadObjs.map((l) => ({
            telefone: l.telefone,
            message: replaceMessageVariables(msgTemplate, l),
          }));
          onMassSendBot(messagesPayload);
          setMassSelectorOpen(false);
          setSelectedEntries([]);
        }}
        forceBotOnly={true}
      />

      <AnimatePresence>
        <MessageTemplateModal
          isOpen={isAddMsgModalOpen}
          onClose={() => setIsAddMsgModalOpen(false)}
          tipo="bases_renovacao"
          onToast={onToast}
          availableVariables={[
            {
              key: "[nome]",
              label: "Nome do Aluno",
              previewValue: "Maria Souza",
            },
            { key: "[curso]", label: "Curso", previewValue: "Administração" },
            {
              key: "[unidade]",
              label: "Unidade",
              previewValue: "Unidade Central",
            },
            {
              key: "[data_contato]",
              label: "Data",
              previewValue: new Date().toLocaleDateString("pt-BR"),
            },
            { key: "[saudacao]", label: "Saudação", previewValue: "Olá" },
          ]}
        />
      </AnimatePresence>
    </div>
  );
}

function GapView({
  gap,
  onToast,
  profile,
  whatsappMessages,
  botConfig,
  onSendBot,
  onMassSendBot,
  calendarioAcoes = [],
}: {
  gap: GapEntry[];
  onToast: (m: string, t?: "success" | "error") => void;
  profile: UserProfile;
  whatsappMessages: WhatsAppMessage[];
  botConfig: BotConfig;
  onSendBot: (tel: string, msg: string) => void;
  onMassSendBot: (messages: { telefone: string; message: string }[]) => void;
  calendarioAcoes?: CalendarioAcao[];
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [cpfFilter, setCpfFilter] = useState("");
  const [produtoFilter, setProdutoFilter] = useState("");
  const [cursoFilter, setCursoFilter] = useState("");
  const [periodoFilter, setPeriodoFilter] = useState("");
  const [matAcadFilter, setMatAcadFilter] = useState("");
  const [gapFilter, setGapFilter] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<GapEntry | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedEntries, setSelectedEntries] = useState<string[]>([]);
  const [gapSubTab, setGapSubTab] = useState<"dashboard" | "lista">("dashboard");

  const handleBulkDelete = async () => {
    if (selectedEntries.length === 0) return;
    if (
      window.confirm(
        `Deseja excluir ${selectedEntries.length} registros selecionados do GAP?`,
      )
    ) {
      try {
        for (const id of selectedEntries) {
          await deleteDoc(doc(db, COLLECTIONS.GAP, id));
        }
        onToast(`${selectedEntries.length} registros no GAP removidos.`);
        setSelectedEntries([]);
      } catch (err: any) {
        onToast("Erro ao excluir registros do GAP.", "error");
      }
    }
  };

  const toggleSelect = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedEntries([...selectedEntries, id]);
    } else {
      setSelectedEntries(selectedEntries.filter((s) => s !== id));
    }
  };

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedEntries(filteredGap.map((g) => g.id));
    } else {
      setSelectedEntries([]);
    }
  };
  const [formData, setFormData] = useState({
    nome: "",
    telefone: "",
    cpf: "",
    produto: "Graduação" as any,
    numeroOportunidade: "",
    curso: "",
    semestre: "",
    metodologia: "",
    formaIngresso: "",
    numeroMatricula: "",
    periodo: "",
    acao: "",
    acaoId: "",
  });

  const docLabels: Record<string, string> = {
    rg: "RG",
    cpf: "CPF",
    diploma: "Diploma",
    enem: "ENEM",
    historico: "Hist.",
    planoEnsino: "Plano",
    contrato: "Contr.",
    carta: "Carta",
  };

  const stats = useMemo(() => {
    const total = gap.length;
    const matFin = total;
    const matAcadOk = gap.filter(
      (g) =>
        g.matAcad === true ||
        g.matAcad === "Matrícula Gerada" ||
        g.matAcad === "OK",
    ).length;
    const pendingDocs = matFin - matAcadOk;
    const conversionRate =
      total > 0 ? ((matAcadOk / total) * 100).toFixed(1) : "0";
    return { matFin, matAcadOk, pendingDocs, conversionRate };
  }, [gap]);

  const statsByProduct = useMemo(() => {
    const groups: { [key: string]: number } = { "Graduação": 0, "Técnico": 0, "Pós-graduação": 0 };
    gap.forEach((g) => {
      const p = g.produto || "Graduação";
      if (groups[p] !== undefined) groups[p] += 1;
    });
    return Object.entries(groups).map(([name, count]) => ({
      name,
      count,
      percentage: gap.length > 0 ? ((count / gap.length) * 100).toFixed(1) : "0",
    }));
  }, [gap]);

  const statsByStatus = useMemo(() => {
    const groups: { [key: string]: number } = {
      "OK": 0,
      "Pendente": 0,
      "Aguardando": 0,
      "Desistente": 0,
    };
    gap.forEach((g) => {
      const s = g.matAcad === true || g.matAcad === "Matrícula Gerada" || g.matAcad === "OK" ? "OK" : 
                g.matAcad === "Aguardando N° de Matrícula" ? "Aguardando" :
                g.matAcad === "Desistente" ? "Desistente" : "Pendente";
      if (groups[s] !== undefined) groups[s] += 1;
    });
    return Object.entries(groups).map(([name, count]) => ({
      name,
      count,
      percentage: gap.length > 0 ? ((count / gap.length) * 100).toFixed(1) : "0",
    }));
  }, [gap]);

  const filteredGap = useMemo(() => {
    return gap.filter((g) => {
      // Gestor Unidade filtering
      if (profile.role === "Gestor Unidade") {
        if (!profile.unidade || g.unidade !== profile.unidade) {
          return false;
        }
      }

      const matchesSearch = g.nome
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesCpf = !cpfFilter || g.cpf?.includes(cpfFilter);
      const matchesProduto = !produtoFilter || g.produto === produtoFilter;
      const matchesCurso =
        !cursoFilter ||
        g.curso.toLowerCase().includes(cursoFilter.toLowerCase());
      const matchesPeriodo =
        !periodoFilter ||
        g.periodo?.toLowerCase().includes(periodoFilter.toLowerCase());

      const isOk =
        g.matAcad === true ||
        g.matAcad === "Matrícula Gerada" ||
        g.matAcad === "OK";
      let matchesMatAcad = true;
      if (matAcadFilter === "Matrícula Gerada") matchesMatAcad = isOk;
      else if (matAcadFilter === "Pendente")
        matchesMatAcad =
          !g.matAcad || g.matAcad === "false" || g.matAcad === "Pendente";
      else if (matAcadFilter === "Aguardando N° de Matrícula")
        matchesMatAcad = g.matAcad === "Aguardando N° de Matrícula";
      else if (matAcadFilter === "Desistente")
        matchesMatAcad = g.matAcad === "Desistente";

      const docs = g.documentos || {};
      const hasGap = Object.keys(docLabels).some((key) => !(docs as any)[key]);
      const matchesGap = !gapFilter || (gapFilter === "Sim" ? hasGap : !hasGap);
      const matchesAll =
        matchesSearch &&
        matchesCpf &&
        matchesProduto &&
        matchesCurso &&
        matchesPeriodo &&
        matchesMatAcad &&
        matchesGap;
      return matchesAll;
    });
  }, [
    gap,
    searchTerm,
    cpfFilter,
    produtoFilter,
    cursoFilter,
    periodoFilter,
    matAcadFilter,
    gapFilter,
  ]);

  const toggleDoc = async (id: string, docKey: string, current: boolean) => {
    try {
      const entry = gap.find((g) => g.id === id);
      if (!entry) return;
      const newDocs = { ...(entry.documentos || {}) };
      (newDocs as any)[docKey] = !current;
      await updateDoc(doc(db, COLLECTIONS.GAP, id), { documentos: newDocs });
      onToast("Documento atualizado!");
    } catch (err: any) {
      onToast("Erro ao atualizar documento.", "error");
    }
  };

  const updateMatAcadStatus = async (
    id: string,
    newStatus: string | boolean,
  ) => {
    try {
      await updateDoc(doc(db, COLLECTIONS.GAP, id), { matAcad: newStatus });
      onToast("Status de matrícula atualizado!");
    } catch (err: any) {
      onToast("Erro ao atualizar matrícula.", "error");
    }
  };

  const handleDeleteGap = async (id: string) => {
    if (window.confirm("Deseja excluir este registro do GAP?")) {
      try {
        await deleteDoc(doc(db, COLLECTIONS.GAP, id));
        onToast("Registro removido.");
      } catch (err: any) {
        onToast("Erro ao excluir registro.", "error");
      }
    }
  };

  const getGapWhatsAppMessage = (entry: GapEntry) => {
    const docs = entry.documentos || {};
    const missingDocs = Object.entries(docLabels)
      .filter(([key]) => !(docs as any)[key])
      .map(([_, label]) => label);

    const applyReplacements = (text: string) => {
      return replaceMessageVariables(text, { ...entry, missingDocs });
    };

    // se ok e tiver matricula
    const isOk =
      entry.matAcad === true ||
      entry.matAcad === "Matrícula Gerada" ||
      entry.matAcad === "OK";
    if (isOk && entry.numeroMatricula) {
      const msgOk = whatsappMessages.find((m) => m.tipo === "gap_1");
      if (msgOk) {
        return applyReplacements(msgOk.texto);
      }
      return applyReplacements(`PARABÉNS [nome] 🎊 Agora você é aluno Estácio 💎  
 
É com grande orgulho e muita determinação que esse novo ciclo em sua vida se inicia! 🤓   

📝 Anote sua matrícula será importante em toda a sua jornada na Estácio. [matricula] 
 
Acesse seu portal usando os dados abaixo:

Seu e-mail de estudante: [matricula]@alunos.estacio.br 

Senha de primeiro acesso para usar com o e-mail: os seis primeiros dígitos do seu CPF + @ + a primeira letra do seu nome maiúscula + a segunda letra do seu nome minúscula 

Aplicativo de celular: Minha Estácio 

Pela internet: https://sia.estacio.br/sianet/Logon`);
    } else if (isOk) {
      const msgOk = whatsappMessages.find((m) => m.tipo === "gap_1");
      if (msgOk) return applyReplacements(msgOk.texto);
      return `Olá ${entry.nome}, vimos que sua matrícula acadêmica está ok! Parabéns!`;
    }

    // Add logic to include registration number automatically if it exists
    let message = "";
    const customMsg = whatsappMessages.find(
      (m) => m.tipo === "gap" || m.tipo === "gap_0",
    );
    if (customMsg) {
      message = applyReplacements(customMsg.texto);
    } else if (missingDocs.length > 0) {
      message = `Olá ${entry.nome}, tudo bem? Sou da equipe de captação e meu contato é referente à sua matrícula no curso de ${entry.curso}. Identificamos que sua matrícula ainda não foi finalizada devido à pendência dos seguintes documentos: ${missingDocs.join(", ")}. É fundamental regularizar essa situação o quanto antes para garantir sua vaga e evitar o cancelamento do processo.`;
    }

    if (entry.numeroMatricula && !message.includes(entry.numeroMatricula)) {
      message += `\n\nNº Matrícula: ${entry.numeroMatricula}`;
    }

    if (!docs.contrato || !docs.carta) {
      message += `\n\nACEITE DO CONTRATO, para isso vou lhe enviar o passo a passo aqui a baixo: \n\n1º PASSO:ACESSAR O PORTAL DO CANDIDATO: https://candidatos.portal.estacio.br/acompanhe-sua-matricula \n\n2° COLOQUE SEU CPF E SENHA, CASO SEJA A 1° VEZ, COLOQUE ESQUECI MINHA SENHA. \n\n3° CLIQUE EM CONTRATO EDUCACIONAL E EM SEGUIDA EM ACEITAR E CONTINUAR`;
    }

    return message;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanCpf = formData.cpf ? formData.cpf.replace(/\D/g, "") : "";
    const cleanTelefone = formData.telefone.replace(/\D/g, "");

    const isDuplicate = gap.some(
      (g) =>
        g.id !== editingEntry?.id &&
        ((cleanCpf && g.cpf === cleanCpf) ||
          (!cleanCpf && cleanTelefone && g.telefone === cleanTelefone)),
    );

    if (isDuplicate) {
      onToast(
        "Candidato já cadastrado no GAP (verificado CPF/Telefone).",
        "error",
      );
      return;
    }

    setLoading(true);
    try {
      const prevAcaoId = editingEntry?.acaoId;
      const newAcaoId = formData.acaoId;

      if (editingEntry) {
        await updateDoc(doc(db, COLLECTIONS.GAP, editingEntry.id), {
          ...formData,
          updatedAt: serverTimestamp(),
        });
        onToast("Candidato atualizado com sucesso!");
      } else {
        await addDoc(collection(db, COLLECTIONS.GAP), {
          ...formData,
          matAcad: false,
          documentos: {},
          unidade: profile.unidade || "",
          createdAt: serverTimestamp(),
        });
        onToast("Candidato cadastrado no GAP!");
      }

      if (prevAcaoId && prevAcaoId !== "manual" && prevAcaoId !== newAcaoId) {
        try {
          const qGapOld = query(
            collection(db, COLLECTIONS.GAP),
            where("acaoId", "==", prevAcaoId),
          );
          const snapOld = await getDocs(qGapOld);
          await updateDoc(doc(db, COLLECTIONS.CALENDARIO_ACOES, prevAcaoId), {
            boletosFeitos: snapOld.size,
          });
        } catch (err) {
          console.error(err);
        }
      }

      if (newAcaoId && newAcaoId !== "manual") {
        try {
          const qGapNew = query(
            collection(db, COLLECTIONS.GAP),
            where("acaoId", "==", newAcaoId),
          );
          const snapNew = await getDocs(qGapNew);
          await updateDoc(doc(db, COLLECTIONS.CALENDARIO_ACOES, newAcaoId), {
            boletosFeitos: snapNew.size,
          });
        } catch (err) {
          console.error(err);
        }
      }

      setIsModalOpen(false);
      setEditingEntry(null);
      setFormData({
        nome: "",
        telefone: "",
        cpf: "",
        produto: "Graduação",
        numeroOportunidade: "",
        curso: "",
        metodologia: "",
        formaIngresso: "",
        numeroMatricula: "",
        periodo: "",
        acao: "",
        acaoId: "",
      } as any);
    } catch (err: any) {
      onToast("Erro ao salvar.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const data = filteredGap.map((g) => ({
      Nome: g.nome,
      Telefone: g.telefone,
      CPF: g.cpf,
      Produto: g.produto,
      "Nº Oportunidade": g.numeroOportunidade || "",
      Curso: g.curso,
      Semestre: g.semestre || "",
      Metodologia: g.metodologia || "",
      "Forma de Ingresso": g.formaIngresso || "",
      Periodo: g.periodo || "",
      Matricula: g.numeroMatricula || "",
      MatAcad:
        g.matAcad === true ||
        g.matAcad === "Matrícula Gerada" ||
        g.matAcad === "OK"
          ? "Sim"
          : "Não",
      Documentos: Object.entries(docLabels)
        .map(
          ([key, label]) =>
            `${label}: ${(g.documentos as any)?.[key] ? "OK" : "Pendente"}`,
        )
        .join(", "),
    }));
    exportToExcel(data, "Gap_Academico");
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    importFromExcel(file, async (data) => {
      try {
        const getVal = (row: any, ...keys: string[]) => {
          const rowKeys = Object.keys(row);
          for (const key of keys) {
            const foundKey = rowKeys.find(k => k.toLowerCase() === key.toLowerCase());
            if (foundKey && row[foundKey] !== undefined) return row[foundKey];
          }
          return undefined;
        };

        const batch = data.map((item) => {
          const matAcadRaw = String(getVal(item, "MatAcad", "matAcad", "Mat. Acad.", "mat_acad") || "").trim().toLowerCase();
          const isMatAcad = matAcadRaw === "sim" || matAcadRaw === "ok" || matAcadRaw === "yes" || matAcadRaw === "true" || getVal(item, "matAcad") === true;

          return {
            nome: String(getVal(item, "Nome", "nome") || "").trim(),
            cpf: String(getVal(item, "CPF", "cpf") || "").replace(/\D/g, ""),
            telefone: String(getVal(item, "Telefone", "telefone") || "").replace(/\D/g, ""),
            produto: String(getVal(item, "Produto", "produto") || "").trim(),
            curso: String(getVal(item, "Curso", "curso") || "").trim(),
            semestre: String(getVal(item, "Semestre", "semestre") || "").trim(),
            metodologia: String(getVal(item, "Metodologia", "metodologia") || "").trim(),
            formaIngresso: String(getVal(item, "Forma de Ingresso", "formaIngresso", "ingresso") || "").trim(),
            numeroOportunidade: String(getVal(item, "Nº Oportunidade", "numeroOportunidade", "oportunidade") || "").trim(),
            periodo: String(getVal(item, "Periodo", "periodo", "período") || "").trim(),
            numeroMatricula: String(
              getVal(item, "Matricula", "numeroMatricula", "Nº Matrícula", "Matrícula", "Nº Matricula", "matricula") || "",
            ).trim(),
            matAcad: isMatAcad,
            documentos: {},
            createdAt: serverTimestamp(),
          };
        });

        let imported = 0;
        let skipped = 0;
        const insertedCpfs = new Set();
        const insertedTels = new Set();

        for (const entry of batch) {
          const isDupCpf =
            entry.cpf &&
            (gap.some((g) => g.cpf === entry.cpf) ||
              insertedCpfs.has(entry.cpf));
          const isDupTel =
            entry.telefone &&
            (gap.some((g) => g.telefone === entry.telefone) ||
              insertedTels.has(entry.telefone));

          if (!isDupCpf && !isDupTel) {
            await addDoc(collection(db, COLLECTIONS.GAP), entry);
            if (entry.cpf) insertedCpfs.add(entry.cpf);
            if (entry.telefone) insertedTels.add(entry.telefone);
            imported++;
          } else {
            skipped++;
          }
        }
        onToast(
          `${imported} registros importados! ${skipped > 0 ? `${skipped} ignorados por duplicidade.` : ""}`,
        );
      } catch (err: any) {
        onToast("Erro ao importar dados.", "error");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex items-center gap-1 bg-white p-1 rounded-2xl shadow-sm border border-slate-100 w-fit">
        <button
          onClick={() => setGapSubTab("dashboard")}
          className={cn(
            "flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all",
            gapSubTab === "dashboard"
              ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
              : "text-slate-500 hover:bg-slate-50",
          )}
        >
          <BarChart3 size={18} />
          <span>Dashboard</span>
        </button>
        <button
          onClick={() => setGapSubTab("lista")}
          className={cn(
            "flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all",
            gapSubTab === "lista"
              ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
              : "text-slate-500 hover:bg-slate-50",
          )}
        >
          <List size={18} />
          <span>Lista de Alunos</span>
        </button>
      </div>

      {gapSubTab === "dashboard" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Mat. Financeira"
              value={stats.matFin}
              icon={Users}
              color="bg-blue-500"
            />
            <StatCard
              title="Mat. Acadêmica OK"
              value={stats.matAcadOk}
              icon={CheckCircle2}
              color="bg-emerald-500"
            />
            <StatCard
              title="Gap (Docs Pendentes)"
              value={stats.pendingDocs}
              icon={Clock}
              color="bg-amber-500"
            />
            <StatCard
              title="Taxa Conv. Acad"
              value={`${stats.conversionRate}%`}
              icon={TrendingUp}
              color="bg-purple-500"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Target size={18} className="text-blue-500" />
                Distribuição de Matrícula Acadêmica
              </h3>
              <div className="space-y-3">
                {statsByStatus.map((s) => (
                  <div key={s.name} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-600 flex items-center gap-1.5">
                        <span className={cn(
                          "w-2 h-2 rounded-full",
                          s.name === "OK" && "bg-emerald-400",
                          s.name === "Pendente" && "bg-amber-400",
                          s.name === "Aguardando" && "bg-blue-400",
                          s.name === "Desistente" && "bg-rose-400",
                        )} />
                        {s.name}
                      </span>
                      <span className="text-slate-800 font-bold">
                        {s.count} <span className="text-slate-400 font-normal">({s.percentage}%)</span>
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          s.name === "OK" && "bg-emerald-400",
                          s.name === "Pendente" && "bg-amber-400",
                          s.name === "Aguardando" && "bg-blue-400",
                          s.name === "Desistente" && "bg-rose-400",
                        )}
                        style={{ width: `${s.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
                <GraduationCap size={18} className="text-blue-500" />
                Distribuição por Produto
              </h3>
              <div className="space-y-3">
                {statsByProduct.map((p) => (
                  <div key={p.name} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-600">{p.name}</span>
                      <span className="text-slate-800 font-bold">
                        {p.count} <span className="text-slate-400 font-normal">({p.percentage}%)</span>
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all"
                        style={{ width: `${p.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {gapSubTab === "lista" && (
        <>
          <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">GAP Acadêmico</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => {
              setEditingEntry(null);
              setFormData({
                nome: "",
                telefone: "",
                cpf: "",
                produto: "Graduação",
                numeroOportunidade: "",
                curso: "",
                metodologia: "",
                formaIngresso: "",
                numeroMatricula: "",
                periodo: "",
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
            <input
              type="file"
              accept=".xlsx, .xls"
              onChange={handleImport}
              className="hidden"
            />
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
          onChange={(e) => setSearchTerm(e.target.value)}
          className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          placeholder="CPF..."
          value={cpfFilter}
          onChange={(e) => setCpfFilter(e.target.value)}
          className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={produtoFilter}
          onChange={(e) => setProdutoFilter(e.target.value)}
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
          onChange={(e) => setCursoFilter(e.target.value)}
          className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          placeholder="Período..."
          value={periodoFilter}
          onChange={(e) => setPeriodoFilter(e.target.value)}
          className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={matAcadFilter}
          onChange={(e) => setMatAcadFilter(e.target.value)}
          className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Mat. Acadêmica</option>
          <option value="Matrícula Gerada">Matrícula Gerada</option>
          <option value="Aguardando N° de Matrícula">
            Aguardando N° de Matrícula
          </option>
          <option value="Pendente">Pendente</option>
          <option value="Desistente">Desistente</option>
        </select>
        <select
          value={gapFilter}
          onChange={(e) => setGapFilter(e.target.value)}
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
                  <input
                    type="checkbox"
                    checked={
                      selectedEntries.length === filteredGap.length &&
                      filteredGap.length > 0
                    }
                    onChange={(e) => toggleSelectAll(e.target.checked)}
                  />
                </th>
                <th className="px-6 py-4">Candidato</th>
                <th className="px-6 py-4">Curso / Produto</th>
                <th className="px-6 py-4">Documentação</th>
                <th className="px-6 py-4">Mat. Acad.</th>
                <th className="px-6 py-4 flex items-center gap-4">
                  {selectedEntries.length > 0 && (
                    <button
                      onClick={handleBulkDelete}
                      className="text-rose-600 font-bold hover:underline"
                    >
                      excluir selecionados
                    </button>
                  )}
                  {selectedEntries.length > 0 && botConfig.url && (
                    <button
                      onClick={() => {
                        const selectedObjs = gap.filter((g) =>
                          selectedEntries.includes(g.id),
                        );
                        const payloads = selectedObjs.map((g) => ({
                          telefone: g.telefone,
                          message: getGapWhatsAppMessage(g),
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
              {filteredGap.map((entry) => (
                <tr
                  key={entry.id}
                  className="hover:bg-slate-50/50 transition-all"
                >
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedEntries.includes(entry.id)}
                      onChange={(e) => toggleSelect(entry.id, e.target.checked)}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-900">
                        {entry.nome}
                      </span>
                      <span className="text-xs text-slate-500">
                        {entry.cpf}
                      </span>
                      <span className="text-xs text-slate-500">
                        {formatPhone(entry.telefone)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-slate-700">
                        {entry.curso}
                      </span>
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] text-slate-400">
                          {entry.produto}
                        </span>
                        {entry.periodo && (
                          <span className="text-[10px] text-slate-400">
                            • {entry.periodo}
                          </span>
                        )}
                      </div>
                      {entry.numeroMatricula && (
                        <span className="text-[10px] font-bold text-blue-600">
                          Mat: {entry.numeroMatricula}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                      {Object.entries(docLabels).map(([key, label]) => (
                        <button
                          key={key}
                          onClick={() =>
                            toggleDoc(
                              entry.id,
                              key,
                              !!(entry.documentos as any)?.[key],
                            )
                          }
                          className={cn(
                            "px-2 py-0.5 rounded text-[9px] font-bold transition-all",
                            (entry.documentos as any)?.[key]
                              ? "bg-emerald-100 text-emerald-600"
                              : "bg-slate-100 text-slate-400",
                          )}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={String(entry.matAcad)}
                      onChange={(e) => {
                        let selectedValue: string | boolean = e.target.value;
                        if (selectedValue === "false") selectedValue = false;
                        if (selectedValue === "true") selectedValue = true;
                        updateMatAcadStatus(entry.id, selectedValue);
                      }}
                      className={cn(
                        "px-2 py-1 rounded-lg text-[10px] font-bold uppercase outline-none",
                        entry.matAcad === true ||
                          String(entry.matAcad) === "true" ||
                          entry.matAcad === "Matrícula Gerada" ||
                          entry.matAcad === "OK"
                          ? "bg-emerald-100 text-emerald-600"
                          : entry.matAcad === "Aguardando N° de Matrícula"
                            ? "bg-blue-100 text-blue-600"
                            : entry.matAcad === "Desistente"
                              ? "bg-rose-100 text-rose-600"
                              : "bg-amber-100 text-amber-600",
                      )}
                    >
                      <option value="false">Pendente</option>
                      <option value="Matrícula Gerada">Matrícula Gerada</option>
                      <option value="Aguardando N° de Matrícula">
                        Aguardando N° de Matrícula
                      </option>
                      <option value="Desistente">Desistente</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 flex items-center space-x-2">
                    {botConfig.url && (
                      <button
                        onClick={() =>
                          onSendBot(
                            entry.telefone,
                            getGapWhatsAppMessage(entry),
                          )
                        }
                        className="text-blue-600 hover:text-blue-700 font-bold text-sm bg-blue-50 p-2 rounded-lg"
                        title="Enviar pelo Bot ARGO'S"
                      >
                        <Bot size={16} />
                      </button>
                    )}
                    <a
                      href={getWhatsAppUrl(
                        entry.telefone,
                        getGapWhatsAppMessage(entry),
                      )}
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
                          nome: entry.nome || "",
                          telefone: entry.telefone || "",
                          cpf: entry.cpf || "",
                          produto: entry.produto || "Graduação",
                          numeroOportunidade: entry.numeroOportunidade || "",
                          curso: entry.curso || "",
                          semestre: entry.semestre || "",
                          metodologia: entry.metodologia || "",
                          formaIngresso: entry.formaIngresso || "",
                          numeroMatricula: entry.numeroMatricula || "",
                          periodo: entry.periodo || "",
                          acao: entry.acao || "",
                          acaoId: entry.acaoId || "",
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
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-slate-400 italic"
                  >
                    Nenhum registro no GAP.
                  </td>
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
                <h3 className="text-xl font-bold text-slate-900">
                  {editingEntry ? "Editar Candidato" : "Cadastrar no GAP"}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X size={24} />
                </button>
              </div>
              <form
                onSubmit={handleRegister}
                className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    Nome Completo
                  </label>
                  <input
                    required
                    value={formData.nome}
                    onChange={(e) =>
                      setFormData({ ...formData, nome: e.target.value })
                    }
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    CPF
                  </label>
                  <input
                    required
                    value={formData.cpf}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        cpf: formatCPF(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    Telefone
                  </label>
                  <input
                    required
                    value={formData.telefone}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        telefone: formatPhone(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    Produto
                  </label>
                  <select
                    value={formData.produto}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        produto: e.target.value as any,
                      })
                    }
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm"
                  >
                    <option value="Graduação">Graduação</option>
                    <option value="Técnico">Técnico</option>
                    <option value="Pós-graduação">Pós-graduação</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    N° Oportunidade
                  </label>
                  <input
                    value={formData.numeroOportunidade}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        numeroOportunidade: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    Curso
                  </label>
                  <input
                    required
                    value={formData.curso}
                    onChange={(e) =>
                      setFormData({ ...formData, curso: e.target.value })
                    }
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    Período
                  </label>
                  <input
                    value={formData.periodo}
                    onChange={(e) =>
                      setFormData({ ...formData, periodo: e.target.value })
                    }
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm"
                    placeholder="Ex: 2024.1"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    Semestre
                  </label>
                  <input
                    value={formData.semestre}
                    onChange={(e) =>
                      setFormData({ ...formData, semestre: e.target.value })
                    }
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    Metodologia
                  </label>
                  <input
                    value={formData.metodologia}
                    onChange={(e) =>
                      setFormData({ ...formData, metodologia: e.target.value })
                    }
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    Forma de Ingresso
                  </label>
                  <input
                    value={formData.formaIngresso}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        formaIngresso: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    Nº Matrícula
                  </label>
                  <input
                    value={formData.numeroMatricula}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        numeroMatricula: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    Ação Vinculada (Opcional)
                  </label>
                  {calendarioAcoes && calendarioAcoes.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="block text-[10px] font-semibold text-slate-400 mb-1">
                          Selecionar do Calendário
                        </span>
                        <select
                          value={formData.acaoId || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === "manual") {
                              setFormData({ ...formData, acaoId: "manual", acao: "" });
                            } else {
                              const matched = calendarioAcoes.find((a) => a.id === val);
                              setFormData({
                                ...formData,
                                acaoId: val,
                                acao: matched ? matched.nome : "",
                              });
                            }
                          }}
                          className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm bg-white"
                        >
                          <option value="">Nenhuma ação vinculada</option>
                          {calendarioAcoes.map((act) => (
                            <option key={act.id} value={act.id}>
                              {act.nome} ({act.dataInicio})
                            </option>
                          ))}
                          <option value="manual">Outro (Digitar manualmente)</option>
                        </select>
                      </div>
                      {(formData.acaoId === "manual" || !formData.acaoId) && (
                        <div>
                          <span className="block text-[10px] font-semibold text-slate-400 mb-1">
                            Digitar Nome da Ação/Origem
                          </span>
                          <input
                            type="text"
                            required={formData.acaoId === "manual"}
                            value={formData.acao}
                            onChange={(e) =>
                              setFormData({ ...formData, acao: e.target.value })
                            }
                            className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm"
                            placeholder="Ex: Facebook, Panfletagem, etc."
                          />
                        </div>
                      )}
                    </div>
                  ) : (
                    <input
                      value={formData.acao}
                      onChange={(e) =>
                        setFormData({ ...formData, acao: e.target.value })
                      }
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm"
                      placeholder="Ex: Evento Junino, Facebook, etc."
                    />
                  )}
                </div>
                <div className="md:col-span-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-all disabled:opacity-50"
                  >
                    {loading
                      ? "Salvando..."
                      : editingEntry
                        ? "Salvar Alterações"
                        : "Cadastrar Candidato"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
        </>
      )}
    </div>
  );
}

function CalendarioAcoesView({
  data,
  onToast,
  profile,
  initialData,
  onClearInitialData,
  users,
  empresasParceiras = [],
  callBotApi,
  leads = [],
  gap = [],
  onSendWhatsApp,
}: {
  data: CalendarioAcao[];
  onToast: (m: string, t?: "success" | "error") => void;
  profile: UserProfile;
  initialData?: Partial<CalendarioAcao> | null;
  onClearInitialData?: () => void;
  users: UserProfile[];
  empresasParceiras?: EmpresaParceira[];
  callBotApi?: (
    path: string,
    options?: { method?: "GET" | "POST"; body?: any },
  ) => Promise<any>;
  leads?: Lead[];
  gap?: GapEntry[];
  onSendWhatsApp?: (phone: string, message: string) => Promise<void>;
}) {
  const [searchTerm, setSearchTerm] = useState("");

  // Helper functions for automatic WhatsApp notifications
  const getLocalDateString = (d: Date = new Date()) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const addDays = (dateStr: string, days: number): string => {
    const parts = dateStr.split('-');
    if (parts.length !== 3) return '';
    const date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    date.setDate(date.getDate() + days);
    return getLocalDateString(date);
  };

  const formatBrazilianDate = (dateStr?: string): string => {
    if (!dateStr) return "";
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  };

  function formatToWhatsAppPhone(phone?: string): string {
    if (!phone) return "";
    let cleaned = phone.replace(/\D/g, "");
    if (cleaned.startsWith("0")) cleaned = cleaned.substring(1);
    if (cleaned.length === 10 || cleaned.length === 11) {
      cleaned = `55${cleaned}`;
    }
    return cleaned;
  }

  async function sendActionWhatsApp(recipientPhone: string, message: string) {
    if (onSendWhatsApp) {
      await onSendWhatsApp(recipientPhone, message);
    }
  }

  const triggerImmediateNotifications = async (action: {
    id: string;
    nome: string;
    local: string;
    dataInicio: string;
    horario: string;
    observacao?: string;
    colaboradorId?: string;
    promotoresSelecionados?: string[];
  }) => {
    const info = `\n\n*Ação:* ${action.nome}\n*Local:* ${action.local}\n*Data:* ${formatBrazilianDate(action.dataInicio)}\n*Horário:* ${action.horario || "Não informado"}\n*Objetivo:* ${action.observacao || "Não informado"}`;

    // 1. Send to FDV Comercial linked to action
    if (action.colaboradorId) {
      const fdvUser = (users || []).find((u) => u.uid === action.colaboradorId);
      if (fdvUser && fdvUser.phone) {
        const msg = `*Aviso de Nova Atividade Criada*\n\nOlá, *${fdvUser.name}*!\nUma nova ação foi criada no sistema e vinculada a você:${info}\n\nPor favor, acompanhe os detalhes no sistema.`;
        await sendActionWhatsApp(fdvUser.phone, msg);

        // 1.1 Send to Gestor Unidade linked to the FDV's unit
        if (fdvUser.unidade) {
          const unitManagers = (users || []).filter(
            (u) => u.role === ROLES.GESTOR_UNIDADE && u.unidade === fdvUser.unidade
          );
          for (const manager of unitManagers) {
            if (manager.phone) {
              const mMsg = `*Aviso de Nova Atividade Criada (Sua Unidade)*\n\nOlá, *${manager.name}*!\nUma nova ação foi criada pelo FDV *${fdvUser.name}* da sua unidade:${info}`;
              await sendActionWhatsApp(manager.phone, mMsg);
            }
          }
        }
      }
    }

    // 2. Send to Promotores (if any selected)
    if (action.promotoresSelecionados && action.promotoresSelecionados.length > 0) {
      for (const promoterId of action.promotoresSelecionados) {
        const promoterUser = (users || []).find((u) => u.uid === promoterId);
        if (promoterUser && promoterUser.phone) {
          const msg = `*Aviso de Nova Atividade Criada*\n\nOlá, *${promoterUser.name}*!\nUma nova ação foi criada com a sua participação:${info}\n\nPor favor, fique atento ao cronograma!`;
          await sendActionWhatsApp(promoterUser.phone, msg);
        }
      }
    }

    // 3. Send to Gerentes Comerciais and Gestores Comerciais
    const managers = (users || []).filter(
      (u) =>
        u.role === ROLES.GESTOR_COMERCIAL_COMERCIAL ||
        u.role === ROLES.GESTOR_COMERCIAL,
    );
    if (managers.length > 0) {
      const fdvUser = action.colaboradorId
        ? (users || []).find((u) => u.uid === action.colaboradorId)
        : null;
      const fdvInfo = fdvUser ? `\n*FDV Responsável:* ${fdvUser.name}` : "";

      for (const manager of managers) {
        if (manager.phone) {
          const msg = `*Aviso de Nova Atividade Criada (Gestão)*\n\nOlá, *${manager.name}*!\nUma nova ação foi criada no sistema:${fdvInfo}${info}\n\nPor favor, acompanhe no sistema.`;
          await sendActionWhatsApp(manager.phone, msg);
        }
      }
    }
  };

  // Background check for 1-day reminders and 1-day post-action requests
  useEffect(() => {
    if (!data || data.length === 0 || !users || users.length === 0) return;

    const checkRemindersAndRequests = async () => {
      const lastRun = sessionStorage.getItem("last_action_notification_check");
      const nowTime = Date.now();
      if (lastRun && nowTime - Number(lastRun) < 300000) {
        return;
      }
      sessionStorage.setItem("last_action_notification_check", String(nowTime));

      const todayStr = getLocalDateString();

      for (const action of data) {
        // --- 1. Reminder 1 day before action start date ---
        const oneDayBeforeStart = addDays(action.dataInicio, -1);
        if (oneDayBeforeStart && todayStr === oneDayBeforeStart && !action.concluida && !(action as any).whatsappLembreteSent) {
          try {
            await updateDoc(doc(db, COLLECTIONS.CALENDARIO_ACOES, action.id), {
              whatsappLembreteSent: true
            });

            const info = `\n\n*Ação:* ${action.nome}\n*Local:* ${action.local}\n*Data:* ${formatBrazilianDate(action.dataInicio)}\n*Horário:* ${action.horario || "Não informado"}\n*Objetivo:* ${action.observacao || "Não informado"}`;

            // Send to FDV
            if (action.colaboradorId) {
              const fdvUser = users.find((u) => u.uid === action.colaboradorId);
              if (fdvUser && fdvUser.phone) {
                const msg = `*Lembrete de Ação Amanhã*\n\nOlá, *${fdvUser.name}*!\nLembrando que amanhã temos a seguinte ação programada:${info}\n\nAté lá!`;
                await sendActionWhatsApp(fdvUser.phone, msg);

                // Send to Gestor Unidade of the FDV
                if (fdvUser.unidade) {
                  const unitManagers = users.filter(u => u.role === ROLES.GESTOR_UNIDADE && u.unidade === fdvUser.unidade);
                  for (const manager of unitManagers) {
                    if (manager.phone) {
                      const mMsg = `*Lembrete de Ação Amanhã (Sua Unidade)*\n\nOlá, *${manager.name}*!\nLembrando que amanhã o FDV *${fdvUser.name}* tem uma ação programada:${info}`;
                      await sendActionWhatsApp(manager.phone, mMsg);
                    }
                  }
                }
              }
            }

            // Send to selected promoters
            if (action.promotoresSelecionados && action.promotoresSelecionados.length > 0) {
              for (const promoterId of action.promotoresSelecionados) {
                const promoterUser = users.find((u) => u.uid === promoterId);
                if (promoterUser && promoterUser.phone) {
                  const msg = `*Lembrete de Ação Amanhã*\n\nOlá, *${promoterUser.name}*!\nLembrando que amanhã temos a seguinte ação programada:${info}\n\nAté lá!`;
                  await sendActionWhatsApp(promoterUser.phone, msg);
                }
              }
            }

            // Send to Managers/Gestores
            const managers = users.filter(u => u.role === ROLES.GESTOR_COMERCIAL_COMERCIAL || u.role === ROLES.GESTOR_COMERCIAL);
            for (const manager of managers) {
              if (manager.phone) {
                const msg = `*Lembrete de Ação Amanhã (Gestão)*\n\nOlá, *${manager.name}*!\nAmanhã haverá a seguinte ação:${info}`;
                await sendActionWhatsApp(manager.phone, msg);
              }
            }
          } catch (err) {
            console.error("Failed to send 1-day-before reminder", action.id, err);
          }
        }

        // --- 2. Closure Request 1 day after action end date ---
        const oneDayAfterEnd = addDays(action.dataFim, 1);
        if (oneDayAfterEnd && todayStr === oneDayAfterEnd && !action.concluida && !(action as any).whatsappFechamentoSent) {
          try {
            await updateDoc(doc(db, COLLECTIONS.CALENDARIO_ACOES, action.id), {
              whatsappFechamentoSent: true
            });

            const info = `\n\n*Ação:* ${action.nome}\n*Local:* ${action.local}\n*Data:* ${formatBrazilianDate(action.dataInicio)}\n*Horário:* ${action.horario || "Não informado"}\n*Objetivo:* ${action.observacao || "Não informado"}`;

            // Send to FDV
            if (action.colaboradorId) {
              const fdvUser = users.find((u) => u.uid === action.colaboradorId);
              if (fdvUser && fdvUser.phone) {
                const msg = `*Lembrete de Fechar Ação*\n\nOlá, *${fdvUser.name}*!\nA ação *${action.nome}* finalizou ontem (${formatBrazilianDate(action.dataFim)}).${info}\n\nPor favor, acesse o sistema para realizar o fechamento formal, registrar fotos e confirmar as presenças dos promotores.`;
                await sendActionWhatsApp(fdvUser.phone, msg);
              }
            }

            // Send to Managers/Gestores
            const managers = users.filter(u => u.role === ROLES.GESTOR_COMERCIAL_COMERCIAL || u.role === ROLES.GESTOR_COMERCIAL);
            for (const manager of managers) {
              if (manager.phone) {
                const msg = `*Lembrete de Fechar Ação (Gestão)*\n\nOlá, *${manager.name}*!\nA ação do colaborador abaixo finalizou ontem e ainda não foi fechada:${info}`;
                await sendActionWhatsApp(manager.phone, msg);
              }
            }
          } catch (err) {
            console.error("Failed to send closure request", action.id, err);
          }
        }
      }
    };

    const timer = setTimeout(checkRemindersAndRequests, 3000);
    return () => clearTimeout(timer);
  }, [data, users]);

  const [statusFilter, setStatusFilter] = useState<
    "all" | "concluida" | "pendente"
  >("all");
  const [startDateFilter, setStartDateFilter] = useState("");
  const [endDateFilter, setEndDateFilter] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [editingAction, setEditingAction] = useState<CalendarioAcao | null>(
    null,
  );
  const [acoesSubTab, setAcoesSubTab] = useState<"dashboard" | "lista">("dashboard");

  const autoLeadsCount = editingAction
    ? (leads || []).filter((l) => l.acaoId === editingAction.id).length
    : 0;
  const autoBoletosCount = editingAction
    ? (gap || []).filter((g) => g.acaoId === editingAction.id).length
    : 0;

  const [newAction, setNewAction] = useState({
    nome: "",
    dataInicio: "",
    dataFim: "",
    local: "",
    observacao: "",
    concluida: false,
    fotos: ["", "", ""],
    metaBoletos: "" as number | "",
    metaInscritos: "" as number | "",
    precisaPromotor: false,
    promotoresSelecionados: [] as string[],
    valorPromotor: "" as number | "",
    valorOrcado: "" as number | "",
    colaboradorId: "",
    colaboradorNome: "",
    tipoAtividade: "Ação" as "Ação" | "Visita",
    empresaParceiraId: "",
    empresaParceiraNome: "",
    leadsFeitos: "" as number | "",
    boletosFeitos: "" as number | "",
    horario: "",
  });

  const promotoresDisponiveis = (users || []).filter(
    (u) => u.role === ROLES.PROMOTOR || u.role === ROLES.PROMOTOR_RUA,
  );
  const colaboradoresDisponiveis = (users || []).filter(
    (u) =>
      u.role === ROLES.FDV_COMERCIAL ||
      u.role === ROLES.FDV ||
      u.role === ROLES.GESTOR_COMERCIAL_COMERCIAL ||
      u.role === ROLES.GESTOR_COMERCIAL,
  );

  useEffect(() => {
    if (initialData) {
      setNewAction({
        nome: initialData.nome || "",
        dataInicio: initialData.dataInicio || "",
        dataFim: initialData.dataFim || "",
        local: initialData.local || "",
        observacao: initialData.observacao || "",
        concluida: false,
        fotos: ["", "", ""],
        metaBoletos:
          (initialData as any).metaBoletos !== undefined
            ? (initialData as any).metaBoletos
            : "",
        metaInscritos:
          (initialData as any).metaInscritos !== undefined
            ? (initialData as any).metaInscritos
            : "",
        leadsFeitos: (initialData as any).leadsFeitos !== undefined ? (initialData as any).leadsFeitos : "",
        boletosFeitos: (initialData as any).boletosFeitos !== undefined ? (initialData as any).boletosFeitos : "",
        precisaPromotor: !!(initialData as any).precisaPromotor,
        promotoresSelecionados:
          (initialData as any).promotoresSelecionados || [],
        valorPromotor:
          (initialData as any).valorPromotor !== undefined
            ? (initialData as any).valorPromotor
            : "",
        valorOrcado:
          (initialData as any).valorOrcado !== undefined
            ? (initialData as any).valorOrcado
            : "",
        colaboradorId: (initialData as any).colaboradorId || "",
        colaboradorNome: (initialData as any).colaboradorNome || "",
        tipoAtividade: (initialData as any).tipoAtividade || "Ação",
        empresaParceiraId: (initialData as any).empresaParceiraId || "",
        empresaParceiraNome: (initialData as any).empresaParceiraNome || "",
        horario: (initialData as any).horario || "",
      });
      setIsAdding(true);
      if (onClearInitialData) onClearInitialData();
    }
  }, [initialData]);

  const filteredData = data.filter((item) => {
    // Gestor Unidade filtering: only see actions from the same unit
    if (profile.role === ROLES.GESTOR_UNIDADE) {
      if (!profile.unidade || item.unidade !== profile.unidade) {
        return false;
      }
    }

    const matchesSearch =
      item.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.local.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all"
        ? true
        : statusFilter === "concluida"
          ? item.concluida
          : !item.concluida;
    let matchesDate = true;
    if (startDateFilter && endDateFilter) {
      matchesDate =
        item.dataInicio <= endDateFilter && item.dataFim >= startDateFilter;
    } else if (startDateFilter) {
      matchesDate = item.dataFim >= startDateFilter;
    } else if (endDateFilter) {
      matchesDate = item.dataInicio <= endDateFilter;
    }
    return matchesSearch && matchesStatus && matchesDate;
  });

  const stats = useMemo(() => {
    const total = data.length;
    const completed = data.filter((a) => a.concluida).length;
    const pending = total - completed;
    const totalLeads = leads.length;
    const completionRate = total > 0 ? ((completed / total) * 100).toFixed(1) : "0";

    const byType: Record<string, number> = {};
    data.forEach((a) => {
      const t = a.tipoAtividade || "Ação";
      byType[t] = (byType[t] || 0) + 1;
    });

    const byStatus = [
      { name: "Concluídas", count: completed, color: "bg-emerald-400" },
      { name: "Pendentes", count: pending, color: "bg-amber-400" },
    ];

    return { 
      total, 
      completed, 
      pending, 
      totalLeads, 
      completionRate,
      byType: Object.entries(byType).map(([name, count]) => ({
        name,
        count,
        percentage: total > 0 ? ((count / total) * 100).toFixed(1) : "0"
      })).sort((a, b) => b.count - a.count),
      byStatus: byStatus.map(s => ({
        ...s,
        percentage: total > 0 ? ((s.count / total) * 100).toFixed(1) : "0"
      }))
    };
  }, [data, leads]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...newAction,
        metaBoletos:
          newAction.metaBoletos === "" ? 0 : Number(newAction.metaBoletos),
        metaInscritos:
          newAction.metaInscritos === "" ? 0 : Number(newAction.metaInscritos),
        valorPromotor:
          newAction.valorPromotor === "" ? 0 : Number(newAction.valorPromotor),
        valorOrcado:
          newAction.valorOrcado === "" ? 0 : Number(newAction.valorOrcado),
        leadsFeitos:
          newAction.leadsFeitos === "" ? "" : Number(newAction.leadsFeitos),
        boletosFeitos:
          newAction.boletosFeitos === "" ? "" : Number(newAction.boletosFeitos),
        fotos: newAction.fotos.filter((f) => f.trim() !== ""),
        horario: newAction.horario || "",
        updatedAt: serverTimestamp(),
      };

      const isDuplicate = data.some(
        (action) =>
          action.nome.toLowerCase() === payload.nome.toLowerCase() &&
          action.dataInicio === payload.dataInicio &&
          action.id !== editingAction?.id,
      );
      if (isDuplicate) {
        onToast("Já existe uma ação com este nome e data.", "error");
        return;
      }

      if (editingAction) {
        await updateDoc(
          doc(db, COLLECTIONS.CALENDARIO_ACOES, editingAction.id),
          payload,
        );
        onToast("Ação updated com sucesso!");
      } else {
        // Automatically set the unit based on the collaborator (FDV) or the creator
        let targetUnidade = "";
        if (payload.colaboradorId) {
          const collab = (users || []).find(u => u.uid === payload.colaboradorId);
          if (collab?.unidade) targetUnidade = collab.unidade;
        }
        if (!targetUnidade && profile.unidade) {
          targetUnidade = profile.unidade;
        }

        const docRef = await addDoc(collection(db, COLLECTIONS.CALENDARIO_ACOES), {
          ...payload,
          unidade: targetUnidade,
          creatorId: profile.uid,
          creatorRole: profile.role,
          createdAt: serverTimestamp(),
          whatsappMomentoSent: true,
        });
        onToast("Ação agendada com sucesso!");

        // Send automatic WhatsApp notifications at creation time
        triggerImmediateNotifications({
          id: docRef.id,
          nome: payload.nome,
          local: payload.local,
          dataInicio: payload.dataInicio,
          horario: payload.horario,
          observacao: payload.observacao,
          colaboradorId: payload.colaboradorId,
          promotoresSelecionados: payload.promotoresSelecionados,
        });
      }
      setIsAdding(false);
      setEditingAction(null);
      setNewAction({
        nome: "",
        dataInicio: "",
        dataFim: "",
        local: "",
        observacao: "",
        concluida: false,
        fotos: ["", "", ""],
        metaBoletos: "",
        metaInscritos: "",
        precisaPromotor: false,
        promotoresSelecionados: [],
        valorPromotor: "",
        valorOrcado: "",
        colaboradorId: "",
        colaboradorNome: "",
        tipoAtividade: "Ação",
        empresaParceiraId: "",
        empresaParceiraNome: "",
        leadsFeitos: "",
        boletosFeitos: "",
        horario: "",
      });
    } catch (err: any) {
      handleFirestoreError(
        err,
        OperationType.WRITE,
        COLLECTIONS.CALENDARIO_ACOES,
      );
      onToast("Erro ao salvar ação.", "error");
    }
  };

  const togglePromoterAttendance = async (
    action: CalendarioAcao,
    promoterUid: string,
  ) => {
    try {
      const currentAttendance = action.presencaPromotores || {};
      const nextVal = !currentAttendance[promoterUid];
      const updatedAttendance = {
        ...currentAttendance,
        [promoterUid]: nextVal,
      };

      const payload: any = {
        presencaPromotores: updatedAttendance,
      };

      if (nextVal) {
        const currentDetails = action.dadosPresencaPromotores || {};
        if (!currentDetails[promoterUid]) {
          payload.dadosPresencaPromotores = {
            ...currentDetails,
            [promoterUid]: {
              empresa: "GR15",
              horas: 4,
            },
          };
        }
      }

      await updateDoc(
        doc(db, COLLECTIONS.CALENDARIO_ACOES, action.id),
        payload,
      );
      onToast(
        nextVal
          ? "Formulário de presença aberto e registrado!"
          : "Presença do promotor removida!",
      );
    } catch (err: any) {
      onToast("Erro ao atualizar presença do promotor.", "error");
    }
  };

  const updatePromoterPresenceDetails = async (
    action: CalendarioAcao,
    promoterUid: string,
    empresa?: "GR15" | "RP7",
    horas?: number,
  ) => {
    try {
      const currentDetails = action.dadosPresencaPromotores || {};
      const promoterDetails = currentDetails[promoterUid] || {};
      const updatedDetails = {
        ...currentDetails,
        [promoterUid]: {
          ...promoterDetails,
          ...(empresa !== undefined ? { empresa } : {}),
          ...(horas !== undefined ? { horas } : {}),
        },
      };
      await updateDoc(doc(db, COLLECTIONS.CALENDARIO_ACOES, action.id), {
        dadosPresencaPromotores: updatedDetails,
      });
      onToast("Dados de pagamento atualizados!");
    } catch (err: any) {
      onToast("Erro ao atualizar dados de pagamento.", "error");
    }
  };

  const toggleStatus = async (action: CalendarioAcao) => {
    try {
      await updateDoc(doc(db, COLLECTIONS.CALENDARIO_ACOES, action.id), {
        concluida: !action.concluida,
      });
      onToast(
        action.concluida ? "Ação marcada como pendente" : "Ação concluída!",
      );
    } catch (err: any) {
      onToast("Erro ao atualizar status.", "error");
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Deseja excluir esta ação?")) {
      try {
        await deleteDoc(doc(db, COLLECTIONS.CALENDARIO_ACOES, id));
        onToast("Ação removida.");
      } catch (err: any) {
        onToast("Erro ao excluir ação.", "error");
      }
    }
  };

  const handleExport = () => {
    const exportData = filteredData.map((item) => ({
      Nome: item.nome,
      "Data Início": item.dataInicio,
      "Data Fim": item.dataFim,
      Local: item.local,
      Observação: item.observacao,
      Status: item.concluida ? "Concluída" : "Pendente",
    }));
    exportToExcel(exportData, "Calendario_Acoes");
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    importFromExcel(file, async (importData) => {
      try {
        const getVal = (row: any, ...keys: string[]) => {
          const rowKeys = Object.keys(row);
          for (const key of keys) {
            const foundKey = rowKeys.find(k => k.toLowerCase() === key.toLowerCase());
            if (foundKey && row[foundKey] !== undefined) return row[foundKey];
          }
          return undefined;
        };

        const batch = importData.map((item) => {
          const rawStatus = String(getVal(item, "Status", "status") || "").trim().toLowerCase();
          const isConcluida = ["concluída", "concluida", "sim", "true", "ok"].includes(rawStatus) || getVal(item, "concluida") === true;

          return {
            nome: String(getVal(item, "Nome", "nome") || "").trim(),
            dataInicio: String(getVal(item, "Data Início", "dataInicio", "data_inicio") || "").trim(),
            dataFim: String(getVal(item, "Data Fim", "dataFim", "data_fim") || "").trim(),
            local: String(getVal(item, "Local", "local") || "").trim(),
            observacao: String(getVal(item, "Observação", "observacao", "observação") || "").trim(),
            concluida: isConcluida,
            fotos: [],
            creatorId: profile.uid,
            creatorRole: profile.role,
            createdAt: serverTimestamp(),
          };
        });

        let imported = 0;
        let skipped = 0;
        const inserted = new Set();
        for (const entry of batch) {
          const isDup =
            data.some(
              (a) => a.nome === entry.nome && a.dataInicio === entry.dataInicio,
            ) || inserted.has(`${entry.nome}-${entry.dataInicio}`);
          if (!isDup) {
            await addDoc(collection(db, COLLECTIONS.CALENDARIO_ACOES), entry);
            inserted.add(`${entry.nome}-${entry.dataInicio}`);
            imported++;
          } else {
            skipped++;
          }
        }
        onToast(
          `${imported} ações importadas! ${skipped > 0 ? `${skipped} ignoradas.` : ""}`,
        );
      } catch (err: any) {
        onToast("Erro ao importar ações.", "error");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex items-center gap-1 bg-white p-1 rounded-2xl shadow-sm border border-slate-100 w-fit">
        <button
          onClick={() => setAcoesSubTab("dashboard")}
          className={cn(
            "flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all",
            acoesSubTab === "dashboard"
              ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
              : "text-slate-500 hover:bg-slate-50",
          )}
        >
          <BarChart3 size={18} />
          <span>Dashboard</span>
        </button>
        <button
          onClick={() => setAcoesSubTab("lista")}
          className={cn(
            "flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all",
            acoesSubTab === "lista"
              ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
              : "text-slate-500 hover:bg-slate-50",
          )}
        >
          <List size={18} />
          <span>Lista de Ações</span>
        </button>
      </div>

      {acoesSubTab === "dashboard" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total de Ações"
              value={stats.total}
              icon={Calendar}
              color="bg-blue-500"
            />
            <StatCard
              title="Concluídas"
              value={stats.completed}
              icon={CheckCircle2}
              color="bg-emerald-500"
            />
            <StatCard
              title="Pendentes"
              value={stats.pending}
              icon={Clock}
              color="bg-amber-500"
            />
            <StatCard
              title="Total Leads"
              value={stats.totalLeads}
              icon={Users}
              color="bg-purple-500"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Target size={18} className="text-blue-500" />
                Status das Ações
              </h3>
              <div className="space-y-3">
                {stats.byStatus.map((s) => (
                  <div key={s.name} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-600 flex items-center gap-1.5">
                        <span className={cn("w-2 h-2 rounded-full", s.color)} />
                        {s.name}
                      </span>
                      <span className="text-slate-800 font-bold">
                        {s.count} <span className="text-slate-400 font-normal">({s.percentage}%)</span>
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className={cn("h-full rounded-full transition-all", s.color)}
                        style={{ width: `${s.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
                <LayoutDashboard size={18} className="text-blue-500" />
                Tipos de Ação (Top 5)
              </h3>
              <div className="space-y-3">
                {stats.byType.slice(0, 5).map((t) => (
                  <div key={t.name} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-600">{t.name}</span>
                      <span className="text-slate-800 font-bold">
                        {t.count} <span className="text-slate-400 font-normal">({t.percentage}%)</span>
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all"
                        style={{ width: `${t.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {acoesSubTab === "lista" && (
        <>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-200">
            <Calendar size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Plano de Ação</h2>
            <p className="text-slate-500 text-sm">
              Gerencie as ações e eventos da equipe
            </p>
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
            <input
              type="file"
              accept=".xlsx, .xls"
              onChange={handleImport}
              className="hidden"
            />
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

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 ml-1">
            Pesquisar
          </label>
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Nome ou local..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 ml-1">
            Status
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500 transition-all"
          >
            <option value="all">Todos os Status</option>
            <option value="concluida">Concluídas</option>
            <option value="pendente">Pendentes</option>
          </select>
        </div>
        <div>
          <div className="flex justify-between items-center mb-1 ml-1">
            <label className="block text-[10px] font-bold text-slate-400 uppercase">
              Data Início
            </label>
            {(startDateFilter || endDateFilter) && (
              <button
                onClick={() => {
                  setStartDateFilter("");
                  setEndDateFilter("");
                }}
                className="text-[10px] text-red-500 font-bold hover:underline"
              >
                Limpar
              </button>
            )}
          </div>
          <input
            type="date"
            value={startDateFilter}
            onChange={(e) => setStartDateFilter(e.target.value)}
            className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500 transition-all"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 ml-1">
            Data Fim
          </label>
          <input
            type="date"
            value={endDateFilter}
            onChange={(e) => setEndDateFilter(e.target.value)}
            className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500 transition-all"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredData.map((action) => (
          <motion.div
            layout
            key={action.id}
            className={cn(
              "bg-white p-6 rounded-3xl shadow-sm border transition-all",
              action.concluida
                ? "border-emerald-100 bg-emerald-50/10"
                : "border-slate-100",
            )}
          >
            <div className="flex justify-between items-start mb-4">
              <div
                className={cn(
                  "p-2 rounded-xl",
                  action.concluida
                    ? "bg-emerald-100 text-emerald-600"
                    : "bg-blue-100 text-blue-600",
                )}
              >
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
                      fotos: [...(action.fotos || []), "", "", ""].slice(0, 3),
                      metaBoletos:
                        action.metaBoletos !== undefined
                          ? action.metaBoletos
                          : "",
                      metaInscritos:
                        action.metaInscritos !== undefined
                          ? action.metaInscritos
                          : "",
                      precisaPromotor: !!action.precisaPromotor,
                      promotoresSelecionados:
                        action.promotoresSelecionados || [],
                      valorPromotor:
                        action.valorPromotor !== undefined
                          ? action.valorPromotor
                          : "",
                      valorOrcado:
                        action.valorOrcado !== undefined
                          ? action.valorOrcado
                          : "",
                      colaboradorId: action.colaboradorId || "",
                      colaboradorNome: action.colaboradorNome || "",
                      tipoAtividade: action.tipoAtividade || "Ação",
                      empresaParceiraId: action.empresaParceiraId || "",
                      empresaParceiraNome: action.empresaParceiraNome || "",
                      leadsFeitos: action.leadsFeitos !== undefined ? action.leadsFeitos : "",
                      boletosFeitos: action.boletosFeitos !== undefined ? action.boletosFeitos : "",
                      horario: action.horario || "",
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

            <div className="flex flex-wrap gap-1.5 mb-2 shrink-0">
              <span
                className={cn(
                  "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border",
                  action.tipoAtividade === "Visita"
                    ? "bg-amber-50 text-amber-600 border-amber-200/60"
                    : "bg-indigo-50 text-indigo-600 border-indigo-200/60",
                )}
              >
                {action.tipoAtividade || "Ação"}
              </span>
              {action.empresaParceiraNome && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-rose-50 text-rose-600 border border-rose-200/60 flex items-center gap-1">
                  <Building2 size={10} />
                  {action.empresaParceiraNome}
                </span>
              )}
            </div>

            <h3 className="text-lg font-bold text-slate-900 mb-1">
              {action.nome}
            </h3>
            {action.colaboradorNome && (
              <div className="flex items-center space-x-1.5 text-slate-600 text-xs mb-2 bg-blue-50/55 p-1 px-2 rounded-lg inline-flex">
                <span className="font-bold text-blue-700">Colaborador:</span>
                <span>{action.colaboradorNome}</span>
              </div>
            )}
            <div className="flex items-center space-x-2 text-slate-500 text-xs mb-4">
              <MapPin size={14} />
              <span>{action.local}</span>
            </div>

            <div className="bg-slate-50 p-3 rounded-2xl mb-4">
              <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase mb-1">
                <span>Período</span>
              </div>
              <p className="text-xs font-bold text-slate-700">
                {formatLocalDateString(action.dataInicio)}{" "}
                {action.dataFim !== action.dataInicio &&
                  `- ${formatLocalDateString(action.dataFim)}`}
              </p>
            </div>

            {/* Metas da Ação */}
            {((action.metaBoletos !== undefined && action.metaBoletos > 0) ||
              (action.metaInscritos !== undefined &&
                action.metaInscritos > 0)) && (
              <div className="grid grid-cols-2 gap-2 mb-4 bg-slate-50 p-3 rounded-2xl">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">
                    Meta Boletos
                  </span>
                  <span className="text-xs font-bold text-slate-700">
                    {action.metaBoletos || 0}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">
                    Meta Inscritos
                  </span>
                  <span className="text-xs font-bold text-slate-700">
                    {action.metaInscritos || 0}
                  </span>
                </div>
              </div>
            )}

            {/* Resultados da Ação */}
            <div className="grid grid-cols-2 gap-2 mb-4 bg-emerald-50/50 p-3 rounded-2xl border border-emerald-100/50">
              <div>
                <span className="text-[10px] font-bold text-emerald-600 uppercase block">
                  Leads Feitos
                </span>
                <span className="text-xs font-bold text-emerald-800">
                  {typeof action.leadsFeitos === "number"
                    ? action.leadsFeitos
                    : (leads || []).filter((l) => l.acaoId === action.id).length}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-emerald-600 uppercase block">
                  Boletos Feitos
                </span>
                <span className="text-xs font-bold text-emerald-800">
                  {typeof action.boletosFeitos === "number"
                    ? action.boletosFeitos
                    : (gap || []).filter((g) => g.acaoId === action.id).length}
                </span>
              </div>
            </div>

            {/* Promotores e Presenças */}
            {action.precisaPromotor && (
              <div className="bg-slate-50 p-3 rounded-2xl mb-4 border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-2">
                  Promotores Escala
                </span>
                {!action.promotoresSelecionados ||
                action.promotoresSelecionados.length === 0 ? (
                  <span className="text-xs text-slate-400 italic">
                    Nenhum promotor escalado
                  </span>
                ) : (
                  <div className="space-y-2">
                    {action.promotoresSelecionados.map((pUid) => {
                      const promoterObj = (users || []).find(
                        (u) => u.uid === pUid,
                      );
                      const isPresent = !!action.presencaPromotores?.[pUid];
                      const details = action.dadosPresencaPromotores?.[
                        pUid
                      ] || { empresa: "GR15", horas: 4 };

                      return (
                        <div
                          key={pUid}
                          className="p-2.5 rounded-xl border border-slate-100 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.02)] space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2 overflow-hidden mr-1">
                              <div
                                className={cn(
                                  "w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0",
                                  isPresent
                                    ? "bg-emerald-100 text-emerald-800"
                                    : "bg-slate-100 text-slate-500",
                                )}
                              >
                                {promoterObj
                                  ? promoterObj.name.charAt(0).toUpperCase()
                                  : "?"}
                              </div>
                              <div className="flex flex-col overflow-hidden">
                                <span className="text-xs font-bold text-slate-700 truncate">
                                  {promoterObj
                                    ? promoterObj.name
                                    : "Promotor Removido"}
                                </span>
                                <span className="text-[9px] text-slate-400 font-medium truncate">
                                  {promoterObj ? promoterObj.role : ""}
                                </span>
                              </div>
                            </div>

                            <button
                              onClick={() =>
                                togglePromoterAttendance(action, pUid)
                              }
                              className={cn(
                                "text-[10px] px-2.5 py-1.5 rounded-lg font-bold flex items-center space-x-1.5 shrink-0 transition-colors cursor-pointer",
                                isPresent
                                  ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                                  : "bg-slate-100 text-slate-500 hover:bg-slate-200",
                              )}
                            >
                              {isPresent ? (
                                <CheckSquare size={13} />
                              ) : (
                                <Square size={13} />
                              )}
                              <span>
                                {isPresent ? "Participou" : "Ausente"}
                              </span>
                            </button>
                          </div>

                          {isPresent && (
                            <div className="mt-2 text-[11px] pt-2 border-t border-dashed border-slate-100 space-y-2">
                              {/* Empresa Selector */}
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-slate-500">
                                  Pagas por:
                                </span>
                                <div className="flex space-x-1">
                                  {(["GR15", "RP7"] as const).map((emp) => (
                                    <button
                                      type="button"
                                      key={emp}
                                      onClick={() =>
                                        updatePromoterPresenceDetails(
                                          action,
                                          pUid,
                                          emp,
                                          details.horas,
                                        )
                                      }
                                      className={cn(
                                        "px-2 py-0.5 rounded-md font-bold transition-all text-[10px] cursor-pointer",
                                        details.empresa === emp
                                          ? "bg-blue-600 text-white shadow-sm"
                                          : "bg-slate-100 text-slate-600 hover:bg-slate-200",
                                      )}
                                    >
                                      {emp}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              {/* Horas de Atuação Selector */}
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-slate-500">
                                  Horas de atuação:
                                </span>
                                <div className="flex items-center space-x-1">
                                  {([4, 6, 8, 10] as const).map((hr) => (
                                    <button
                                      type="button"
                                      key={hr}
                                      onClick={() =>
                                        updatePromoterPresenceDetails(
                                          action,
                                          pUid,
                                          details.empresa as "GR15" | "RP7",
                                          hr,
                                        )
                                      }
                                      className={cn(
                                        "px-1.5 py-0.5 rounded-md font-bold transition-all text-[10px] cursor-pointer",
                                        details.horas === hr
                                          ? "bg-indigo-600 text-white shadow-sm"
                                          : "bg-slate-100 text-slate-600 hover:bg-slate-200",
                                      )}
                                    >
                                      {hr}h
                                    </button>
                                  ))}

                                  <input
                                    type="number"
                                    min="1"
                                    max="100"
                                    value={details.horas || ""}
                                    onChange={(e) => {
                                      const val =
                                        e.target.value === ""
                                          ? 0
                                          : Number(e.target.value);
                                      updatePromoterPresenceDetails(
                                        action,
                                        pUid,
                                        details.empresa as "GR15" | "RP7",
                                        val,
                                      );
                                    }}
                                    className="w-10 px-1 py-0.5 border border-slate-200 rounded-md text-[10px] text-center font-bold text-slate-700 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    placeholder="Outro"
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {action.fotos && action.fotos.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mb-4">
                {action.fotos.map((foto, idx) => (
                  <div
                    key={idx}
                    className="aspect-square rounded-xl overflow-hidden bg-slate-100 border border-slate-200 relative group"
                  >
                    <img
                      src={foto}
                      alt={`Foto ${idx + 1}`}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <a
                      href={foto}
                      download={`foto_${idx + 1}.jpg`}
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
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">
                  Observações
                </p>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {action.observacao}
                </p>
              </div>
            )}

            <button
              onClick={() => toggleStatus(action)}
              className={cn(
                "w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center space-x-2",
                action.concluida
                  ? "bg-emerald-600 text-white hover:bg-emerald-700"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200",
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
            <p className="text-slate-400 italic">
              Nenhuma ação encontrada para os filtros aplicados.
            </p>
          </div>
        )}
      </div>

      {isAdding && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="p-6 border-b border-slate-100 flex justify-between items-center shrink-0">
              <h3 className="text-xl font-bold text-slate-900">
                {editingAction ? "Editar Ação" : "Nova Ação"}
              </h3>
              <button
                onClick={() => {
                  setIsAdding(false);
                  setEditingAction(null);
                }}
                className="text-slate-400 hover:bg-slate-50 p-2 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>
            <form
              onSubmit={handleSubmit}
              className="p-6 space-y-4 overflow-y-auto flex-1"
            >
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">
                  Nome da Ação / Visita *
                </label>
                <input
                  required
                  value={newAction.nome}
                  onChange={(e) =>
                    setNewAction({ ...newAction, nome: e.target.value })
                  }
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm"
                  placeholder="Ex: Blitz no Centro ou Visita Institucional"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    Tipo de Atividade *
                  </label>
                  <select
                    value={newAction.tipoAtividade}
                    onChange={(e) =>
                      setNewAction({
                        ...newAction,
                        tipoAtividade: e.target.value as "Ação" | "Visita",
                      })
                    }
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm bg-white font-semibold text-slate-700"
                  >
                    <option value="Ação">Ação</option>
                    <option value="Visita">Visita</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    Empresa Vinculada (Opcional)
                  </label>
                  <select
                    value={newAction.empresaParceiraId}
                    onChange={(e) => {
                      const selId = e.target.value;
                      const selEmp = empresasParceiras.find(
                        (emp) => emp.id === selId,
                      );
                      setNewAction({
                        ...newAction,
                        empresaParceiraId: selId,
                        empresaParceiraNome: selEmp ? selEmp.nome : "",
                        local: selEmp
                          ? selEmp.endereco || newAction.local
                          : newAction.local,
                      });
                    }}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm bg-white text-slate-700 font-medium"
                  >
                    <option value="">Nenhuma (Não vincular)</option>
                    {empresasParceiras.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.nome}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    Data Início *
                  </label>
                  <input
                    type="date"
                    required
                    value={newAction.dataInicio}
                    onChange={(e) =>
                      setNewAction({ ...newAction, dataInicio: e.target.value })
                    }
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    Data Fim *
                  </label>
                  <input
                    type="date"
                    required
                    value={newAction.dataFim}
                    onChange={(e) =>
                      setNewAction({ ...newAction, dataFim: e.target.value })
                    }
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    Horário
                  </label>
                  <input
                    type="time"
                    value={newAction.horario}
                    onChange={(e) =>
                      setNewAction({ ...newAction, horario: e.target.value })
                    }
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">
                  Local *
                </label>
                <input
                  required
                  value={newAction.local}
                  onChange={(e) =>
                    setNewAction({ ...newAction, local: e.target.value })
                  }
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm"
                  placeholder="Ex: Praça Central"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">
                  Observações
                </label>
                <textarea
                  value={newAction.observacao}
                  onChange={(e) =>
                    setNewAction({ ...newAction, observacao: e.target.value })
                  }
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm min-h-[100px]"
                  placeholder="O que será feito?"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">
                  Colaborador / FDV Responsável
                </label>
                <select
                  value={newAction.colaboradorId}
                  onChange={(e) => {
                    const selectedId = e.target.value;
                    const selectedUser = colaboradoresDisponiveis.find(
                      (u) => u.uid === selectedId,
                    );
                    setNewAction({
                      ...newAction,
                      colaboradorId: selectedId,
                      colaboradorNome: selectedUser ? selectedUser.name : "",
                    });
                  }}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm bg-white"
                >
                  <option value="">Nenhum (Sem colaborador designado)</option>
                  {colaboradoresDisponiveis.map((u) => (
                    <option key={u.uid} value={u.uid}>
                      {u.name} ({u.role})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    Meta de Boletos da Ação
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newAction.metaBoletos}
                    onChange={(e) =>
                      setNewAction({
                        ...newAction,
                        metaBoletos:
                          e.target.value === "" ? "" : Number(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm"
                    placeholder="Ex: 5"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    Meta de Inscritos da Ação
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newAction.metaInscritos}
                    onChange={(e) =>
                      setNewAction({
                        ...newAction,
                        metaInscritos:
                          e.target.value === "" ? "" : Number(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm"
                    placeholder="Ex: 20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Valor Diária Personalizado (R$) <span className="font-normal text-[9px] text-slate-400 block mt-0.5">(Será calculado auto p/ 4h, 6h, 8h ou 10h)</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={newAction.valorPromotor}
                    onChange={(e) =>
                      setNewAction({
                        ...newAction,
                        valorPromotor:
                          e.target.value === "" ? "" : Number(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm bg-white"
                    placeholder="Ex: 15.00"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Valor Orçado Total (R$)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={newAction.valorOrcado}
                    onChange={(e) =>
                      setNewAction({
                        ...newAction,
                        valorOrcado:
                          e.target.value === "" ? "" : Number(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm bg-white"
                    placeholder="Ex: R$ 500,00"
                  />
                </div>
              </div>

              {/* Se vai precisar de Promotor */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newAction.precisaPromotor}
                    onChange={(e) =>
                      setNewAction({
                        ...newAction,
                        precisaPromotor: e.target.checked,
                      })
                    }
                    className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                  />
                  <div>
                    <span className="text-sm font-bold text-slate-800">
                      Precisa de Promotores?
                    </span>
                    <span className="text-xs text-slate-400 block">
                      Ative para atribuir promotores na ação
                    </span>
                  </div>
                </label>

                {newAction.precisaPromotor && (
                  <div className="mt-4 border-t border-slate-200/60 pt-3 space-y-2">
                    <span className="text-xs font-bold text-slate-500 block uppercase tracking-wider mb-2">
                      Selecione os Promotores Escalados:
                    </span>
                    {promotoresDisponiveis.length === 0 ? (
                      <span className="text-xs text-slate-400 italic block">
                        Nenhum promotor cadastrado neste servidor comercial ou
                        principal.
                      </span>
                    ) : (
                      <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
                        {promotoresDisponiveis.map((promoter) => {
                          const isSelected =
                            newAction.promotoresSelecionados.includes(
                              promoter.uid,
                            );
                          return (
                            <button
                              type="button"
                              key={promoter.uid}
                              onClick={() => {
                                const isSel =
                                  newAction.promotoresSelecionados.includes(
                                    promoter.uid,
                                  );
                                const updated = isSel
                                  ? newAction.promotoresSelecionados.filter(
                                      (id) => id !== promoter.uid,
                                    )
                                  : [
                                      ...newAction.promotoresSelecionados,
                                      promoter.uid,
                                    ];
                                setNewAction({
                                  ...newAction,
                                  promotoresSelecionados: updated,
                                });
                              }}
                              className={cn(
                                "w-full flex items-center justify-between p-2 rounded-lg text-xs font-semibold text-left transition-colors border",
                                isSelected
                                  ? "bg-blue-50/80 border-blue-200 text-blue-700"
                                  : "bg-white border-slate-100 hover:bg-slate-50 text-slate-600",
                              )}
                            >
                              <div className="flex items-center space-x-2">
                                <div
                                  className={cn(
                                    "w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px]",
                                    isSelected
                                      ? "bg-blue-600 text-white"
                                      : "bg-slate-100 text-slate-500",
                                  )}
                                >
                                  {promoter.name.charAt(0).toUpperCase()}
                                </div>
                                <span>{promoter.name}</span>
                              </div>
                              <span className="text-[10px] text-slate-400 italic font-medium">
                                {promoter.role}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Optional outcome statistics after completed */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-4">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Resultados da Ação (Opcional)
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">
                      Leads Feitos
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={newAction.leadsFeitos}
                      onChange={(e) =>
                        setNewAction({
                          ...newAction,
                          leadsFeitos:
                            e.target.value === "" ? "" : Number(e.target.value),
                        })
                      }
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm bg-white"
                      placeholder={editingAction ? `Automático: ${autoLeadsCount}` : "Ex: 10"}
                    />
                    {editingAction && (
                      <span className="text-[10px] text-slate-400 block mt-1">
                        Total vinculados no sistema: {autoLeadsCount}
                      </span>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">
                      Boletos Feitos
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={newAction.boletosFeitos}
                      onChange={(e) =>
                        setNewAction({
                          ...newAction,
                          boletosFeitos:
                            e.target.value === "" ? "" : Number(e.target.value),
                        })
                      }
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm bg-white"
                      placeholder={editingAction ? `Automático: ${autoBoletosCount}` : "Ex: 5"}
                    />
                    {editingAction && (
                      <span className="text-[10px] text-slate-400 block mt-1">
                        Total vinculados no sistema: {autoBoletosCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2">
                  Fotos (até 3 URLs)
                </label>
                <div className="space-y-2">
                  {newAction.fotos.map((foto, idx) => (
                    <input
                      key={idx}
                      placeholder={`URL da Foto ${idx + 1}`}
                      value={foto}
                      onChange={(e) => {
                        const next = [...newAction.fotos];
                        next[idx] = e.target.value;
                        setNewAction({ ...newAction, fotos: next });
                      }}
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm"
                    />
                  ))}
                </div>
              </div>
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
              >
                {editingAction ? "Salvar Alterações" : "Agendar Ação"}
              </button>
            </form>
          </motion.div>
        </div>
      )}
        </>
      )}
    </div>
  );
}

function EmpresasParceirasView({
  data,
  leads = [],
  acoes = [],
  onToast,
  onGenerateAction,
  cursos = [],
  users = [],
  onSendWhatsApp,
}: {
  data: EmpresaParceira[];
  leads?: Lead[];
  acoes?: CalendarioAcao[];
  onToast: (m: string, t?: "success" | "error") => void;
  onGenerateAction: (empresa: EmpresaParceira) => void;
  cursos?: CursoDisponivel[];
  users?: UserProfile[];
  onSendWhatsApp?: (phone: string, message: string) => Promise<void>;
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("Todas");
  const [unidadeFilter, setUnidadeFilter] = useState<string>("Todas");
  const [seguimentoFilter, setSeguimentoFilter] = useState<string>("Todos");
  const [classificacaoFilter, setClassificacaoFilter] =
    useState<string>("Todas");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmpresa, setEditingEmpresa] = useState<EmpresaParceira | null>(
    null,
  );
  const [selectedUnidades, setSelectedUnidades] = useState<string[]>([]);
  const [selectedConsultorId, setSelectedConsultorId] = useState<string>("");

  // Mass deletion states
  const [selectedEmpresaIds, setSelectedEmpresaIds] = useState<string[]>([]);
  const [selectedMapEmpresaId, setSelectedMapEmpresaId] = useState<string | null>(null);

  // Active Tab: list vs tratativas report vs map
  const [activeTab, setActiveTab] = useState<"lista" | "tratativas" | "mapa">("lista");

  const uniqueUnidades = useMemo(() => {
    return Array.from(
      new Set((cursos || []).map((c) => c.nomeUnidade).filter(Boolean)),
    );
  }, [cursos]);

  const uniqueSeguimentos = useMemo(() => {
    return Array.from(
      new Set(data.map((d) => d.seguimento).filter(Boolean) as string[]),
    ).sort();
  }, [data]);

  // Filter commercial/FDV users
  const listForSelection = useMemo(() => {
    const consultores = (users || []).filter(u => {
      const roleLower = (u.role || "").toLowerCase();
      const isComercialServer = u.servidor === "comercial";
      return (
        roleLower.includes("fdv") ||
        roleLower.includes("comercial") ||
        roleLower.includes("promotor") ||
        isComercialServer
      );
    });
    return consultores.length > 0 ? consultores : (users || []);
  }, [users]);

  useEffect(() => {
    if (editingEmpresa) {
      setSelectedUnidades(editingEmpresa.unidadesVinculadas || []);
      setSelectedConsultorId(editingEmpresa.consultorId || "");
    } else {
      setSelectedUnidades([]);
      setSelectedConsultorId("");
    }
  }, [editingEmpresa, isModalOpen]);

  // Date and age helpers for reminders
  const getTratativaDays = (emp: EmpresaParceira) => {
    if (!emp.createdAt) return 0;
    const createdDate = emp.createdAt.seconds
      ? new Date(emp.createdAt.seconds * 1000)
      : new Date(emp.createdAt);
    const diffTime = new Date().getTime() - createdDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays < 0 ? 0 : diffDays;
  };

  const getTratativaAlert = (emp: EmpresaParceira) => {
    if (emp.statusEmpresa !== "Em tratativa") return null;
    const days = getTratativaDays(emp);
    if (days >= 10) {
      return {
        level: "Emergência",
        days,
        label: "Retorno de Emergência",
        color: "red",
        bg: "bg-rose-50 border-rose-200 text-rose-800",
        iconColor: "text-rose-600"
      };
    }
    if (days >= 7) {
      return {
        level: "Atenção",
        days,
        label: "Atenção",
        color: "orange",
        bg: "bg-orange-50 border-orange-200 text-orange-800",
        iconColor: "text-orange-600"
      };
    }
    if (days >= 3) {
      return {
        level: "Retorno",
        days,
        label: "Retorno",
        color: "yellow",
        bg: "bg-amber-50 border-amber-200 text-amber-800",
        iconColor: "text-amber-600"
      };
    }
    return {
      level: "Recente",
      days,
      label: "Recente",
      color: "blue",
      bg: "bg-blue-50 border-blue-100 text-blue-800",
      iconColor: "text-blue-500"
    };
  };

  // Helper for direct status update from the report
  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, COLLECTIONS.EMPRESAS_PARCEIRAS, id), {
        statusEmpresa: newStatus,
        updatedAt: serverTimestamp(),
      });
      onToast("Status atualizado!");
    } catch (err: any) {
      onToast("Erro ao atualizar status.", "error");
    }
  };

  const filteredData = data.filter((emp) => {
    const term = searchTerm.toLowerCase();
    const matchBusca =
      emp.nome.toLowerCase().includes(term) ||
      (emp.cnpj || "").toLowerCase().includes(term);
    const matchStatus =
      statusFilter === "Todas" || emp.statusEmpresa === statusFilter;
    const matchUnidade =
      unidadeFilter === "Todas" ||
      (emp.unidadesVinculadas || []).includes(unidadeFilter);
    const matchSeguimento =
      seguimentoFilter === "Todos" || emp.seguimento === seguimentoFilter;
    const matchClassificacao =
      classificacaoFilter === "Todas" ||
      emp.classificacao === classificacaoFilter;

    return (
      matchBusca &&
      matchStatus &&
      matchUnidade &&
      matchSeguimento &&
      matchClassificacao
    );
  });

  // Calculate Dashboard metrics based on filtered output
  const kpiTotais = filteredData.length;
  const statConveniada = filteredData.filter(
    (e) => e.statusEmpresa === "Conveniada",
  ).length;
  const statEmTratativa = filteredData.filter(
    (e) => e.statusEmpresa === "Em tratativa",
  ).length;
  const statCancelada = filteredData.filter(
    (e) => e.statusEmpresa === "Cancelada",
  ).length;
  const statNaoVisitada = filteredData.filter(
    (e) => e.statusEmpresa === "Não visitada",
  ).length;
  const classOuro = filteredData.filter(
    (e) => e.classificacao === "Ouro",
  ).length;
  const classPrata = filteredData.filter(
    (e) => e.classificacao === "Prata",
  ).length;
  const classBronze = filteredData.filter(
    (e) => e.classificacao === "Bronze",
  ).length;

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const matchedUser = (users || []).find(u => u.uid === selectedConsultorId);
    const consultorNome = matchedUser ? matchedUser.name : "";

    const payload = {
      nome: formData.get("nome") as string,
      responsavel: formData.get("responsavel") as string,
      telefone: formData.get("telefone") as string,
      telefoneResponsavel: formData.get("telefoneResponsavel") as string,
      email: formData.get("email") as string,
      endereco: formData.get("endereco") as string,
      bairro: formData.get("bairro") as string,
      linkMaps: formData.get("linkMaps") as string,
      classificacao: formData.get("classificacao") as string,
      seguimento: formData.get("seguimento") as string,
      cnpj: formData.get("cnpj") as string,
      statusEmpresa: formData.get("statusEmpresa") as string,
      linkSales: formData.get("linkSales") as string,
      unidadesVinculadas: selectedUnidades,
      consultorId: selectedConsultorId,
      consultorNome: consultorNome,
      updatedAt: serverTimestamp(),
    };

    const isDuplicate = data.some(
      (emp) =>
        emp.nome.toLowerCase() === payload.nome.toLowerCase() &&
        emp.id !== editingEmpresa?.id,
    );
    if (isDuplicate) {
      onToast("Já existe uma empresa cadastrada com este nome.", "error");
      return;
    }

    const isNowInTratativa = payload.statusEmpresa === "Em tratativa" && (!editingEmpresa || editingEmpresa.statusEmpresa !== "Em tratativa");

    try {
      if (editingEmpresa) {
        await updateDoc(
          doc(db, COLLECTIONS.EMPRESAS_PARCEIRAS, editingEmpresa.id),
          payload,
        );
        if (isNowInTratativa) {
          onToast(`O processo foi iniciado acompanhe a tratativa com a empresa ${payload.nome} para iniciar as campanhas de trade.`, "success");
          if (matchedUser && matchedUser.phone && onSendWhatsApp) {
            const msg = `O processo foi iniciado acompanhe a tratativa com a empresa ${payload.nome} para iniciar as campanhas de trade.`;
            await onSendWhatsApp(matchedUser.phone, msg);
          }

          // Notificar Gerente Comercial
          const managers = (users || []).filter(
            (u) =>
              u.role === ROLES.GESTOR_COMERCIAL_COMERCIAL ||
              u.role === ROLES.GESTOR_COMERCIAL,
          );
          for (const manager of managers) {
            if (manager.phone && onSendWhatsApp) {
              const fdvInfo = matchedUser
                ? `\n*FDV Responsável:* ${matchedUser.name}`
                : "";
              const msg = `*Aviso de Nova Tratativa (Gestão)*\n\nOlá, *${manager.name}*!\nUma nova tratativa foi iniciada com a empresa ${payload.nome}.${fdvInfo}\n\nPor favor, acompanhe no sistema.`;
              await onSendWhatsApp(manager.phone, msg);
            }
          }
        } else {
          onToast("Empresa atualizada!");
        }
      } else {
        await addDoc(collection(db, COLLECTIONS.EMPRESAS_PARCEIRAS), {
          ...payload,
          createdAt: serverTimestamp(),
        });
        if (isNowInTratativa) {
          onToast(`O processo foi iniciado acompanhe a tratativa com a empresa ${payload.nome} para iniciar as campanhas de trade.`, "success");
          if (matchedUser && matchedUser.phone && onSendWhatsApp) {
            const msg = `O processo foi iniciado acompanhe a tratativa com a empresa ${payload.nome} para iniciar as campanhas de trade.`;
            await onSendWhatsApp(matchedUser.phone, msg);
          }

          // Notificar Gerente Comercial
          const managers = (users || []).filter(
            (u) =>
              u.role === ROLES.GESTOR_COMERCIAL_COMERCIAL ||
              u.role === ROLES.GESTOR_COMERCIAL,
          );
          for (const manager of managers) {
            if (manager.phone && onSendWhatsApp) {
              const fdvInfo = matchedUser
                ? `\n*FDV Responsável:* ${matchedUser.name}`
                : "";
              const msg = `*Aviso de Nova Tratativa (Gestão)*\n\nOlá, *${manager.name}*!\nUma nova tratativa foi iniciada com a empresa ${payload.nome}.${fdvInfo}\n\nPor favor, acompanhe no sistema.`;
              await onSendWhatsApp(manager.phone, msg);
            }
          }
        } else {
          onToast("Empresa cadastrada!");
        }
      }
      setIsModalOpen(false);
      setEditingEmpresa(null);
    } catch (err: any) {
      handleFirestoreError(
        err,
        OperationType.WRITE,
        COLLECTIONS.EMPRESAS_PARCEIRAS,
      );
      onToast("Erro ao salvar empresa.", "error");
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Deseja excluir esta empresa?")) {
      try {
        await deleteDoc(doc(db, COLLECTIONS.EMPRESAS_PARCEIRAS, id));
        onToast("Empresa removida.");
        setSelectedEmpresaIds(prev => prev.filter(item => item !== id));
      } catch (err: any) {
        onToast("Erro ao excluir empresa.", "error");
      }
    }
  };

  // Mass deletion handler
  const handleBulkDelete = async () => {
    if (selectedEmpresaIds.length === 0) return;
    if (
      window.confirm(
        `Atenção! Deseja realmente excluir permanentemente as ${selectedEmpresaIds.length} empresas selecionadas?`
      )
    ) {
      try {
        let deletedCount = 0;
        for (const id of selectedEmpresaIds) {
          await deleteDoc(doc(db, COLLECTIONS.EMPRESAS_PARCEIRAS, id));
          deletedCount++;
        }
        onToast(`${deletedCount} empresas excluídas com sucesso!`);
        setSelectedEmpresaIds([]);
      } catch (err: any) {
        onToast("Erro na exclusão em massa das empresas.", "error");
      }
    }
  };

  const handleExport = () => {
    const exportData = filteredData.map((emp) => ({
      Nome: emp.nome,
      CNPJ: emp.cnpj || "",
      Responsável: emp.responsavel,
      Telefone: emp.telefone,
      "Telefone Responsável": emp.telefoneResponsavel || "",
      Email: emp.email,
      Endereço: emp.endereco,
      Bairro: emp.bairro || "",
      Seguimento: emp.seguimento || "",
      Classificação: emp.classificacao || "",
      Status: emp.statusEmpresa || "",
      "Link Maps": emp.linkMaps,
      "Link Sales": emp.linkSales || "",
      "Consultor Vinculado": emp.consultorNome || "Sem consultor",
      "Unidades Vinculadas": (emp.unidadesVinculadas || []).join(", "),
    }));
    exportToExcel(exportData, "Empresas_Parceiras");
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    importFromExcel(file, async (importData) => {
      try {
        const getVal = (row: any, ...keys: string[]) => {
          const rowKeys = Object.keys(row);
          for (const key of keys) {
            const foundKey = rowKeys.find(k => k.toLowerCase() === key.toLowerCase());
            if (foundKey && row[foundKey] !== undefined) return row[foundKey];
          }
          return undefined;
        };

        const normalizeStatusEmpresa = (val: string) => {
          if (!val) return "Não visitada";
          const lower = val.trim().toLowerCase();
          if (lower === "conveniada") return "Conveniada";
          if (lower === "em tratativa" || lower.includes("tratativa")) return "Em tratativa";
          if (lower === "cancelada") return "Cancelada";
          if (lower === "nao visitada" || lower === "não visitada" || lower.includes("visitada")) return "Não visitada";
          return val;
        };

        const batch = importData.map((item) => {
          const importedConsultorNome = String(getVal(item, "Consultor", "consultor", "consultorNome", "consultor_vinculado") || "").trim();
          const matchedImportedUser = (users || []).find(u => u.name.trim().toLowerCase() === importedConsultorNome.toLowerCase());
          const consultorId = matchedImportedUser ? matchedImportedUser.uid : "";

          const importedUnidadesRaw = String(getVal(item, "Unidades", "unidade", "unidadesVinculadas", "unidade_vinculada", "unidades_vinculadas") || "").trim();
          const unidadesVinculadas = importedUnidadesRaw ? importedUnidadesRaw.split(",").map(x => x.trim()).filter(Boolean) : [];

          return {
            nome: String(getVal(item, "Nome", "nome") || "").trim(),
            cnpj: String(getVal(item, "CNPJ", "cnpj") || "").trim(),
            responsavel: String(getVal(item, "Responsável", "responsavel", "responsável") || "").trim(),
            telefone: String(getVal(item, "Telefone", "telefone") || "").replace(/\D/g, ""),
            telefoneResponsavel: String(
              getVal(item, "Telefone Responsável", "telefoneResponsavel") || "",
            ).replace(/\D/g, ""),
            email: String(getVal(item, "Email", "email") || "").trim(),
            endereco: String(getVal(item, "Endereço", "endereco", "endereço") || "").trim(),
            bairro: String(getVal(item, "Bairro", "bairro") || "").trim(),
            seguimento: String(getVal(item, "Seguimento", "seguimento") || "").trim(),
            classificacao: String(getVal(item, "Classificação", "classificacao", "classificação") || "").trim(),
            statusEmpresa: normalizeStatusEmpresa(String(getVal(item, "Status", "statusEmpresa", "status") || "")),
            linkMaps: String(getVal(item, "Link Maps", "linkMaps") || "").trim(),
            linkSales: String(getVal(item, "Link Sales", "linkSales") || "").trim(),
            consultorId,
            consultorNome: importedConsultorNome || (matchedImportedUser ? matchedImportedUser.name : ""),
            unidadesVinculadas,
            createdAt: serverTimestamp(),
          };
        });

        let imported = 0;
        let skipped = 0;
        const inserted = new Set();
        for (const entry of batch) {
          const isDup =
            data.some((e) => e.nome === entry.nome) || inserted.has(entry.nome);
          if (!isDup) {
            await addDoc(collection(db, COLLECTIONS.EMPRESAS_PARCEIRAS), entry);
            inserted.add(entry.nome);
            imported++;
          } else {
            skipped++;
          }
        }
        onToast(
          `${imported} empresas importadas! ${skipped > 0 ? `${skipped} ignoradas.` : ""}`,
        );
      } catch (err: any) {
        onToast("Erro ao importar empresas.", "error");
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
            <h2 className="text-2xl font-bold text-slate-900">
              Empresas Parceiras
            </h2>
            <p className="text-slate-500 text-sm">
              Gestão de parcerias e convênios
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => {
              setEditingEmpresa(null);
              setIsModalOpen(true);
            }}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center space-x-2"
          >
            <Plus size={20} />
            <span>Nova Empresa</span>
          </button>
          <label className="bg-blue-50 text-blue-600 px-4 py-2 rounded-xl flex items-center space-x-2 hover:bg-blue-100 transition-all text-sm font-bold cursor-pointer">
            <Upload size={18} />
            <span>Importar</span>
            <input
              type="file"
              accept=".xlsx, .xls"
              onChange={handleImport}
              className="hidden"
            />
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

      {/* Tab Switcher */}
      <div className="flex border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab("lista")}
          className={cn(
            "pb-3 px-6 font-bold text-sm transition-all border-b-2",
            activeTab === "lista"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-700"
          )}
        >
          📋 Lista de Empresas
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("mapa")}
          className={cn(
            "pb-3 px-6 font-bold text-sm transition-all border-b-2 flex items-center space-x-2",
            activeTab === "mapa"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-700"
          )}
        >
          🗺️ Mapa das Empresas
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("tratativas")}
          className={cn(
            "pb-3 px-6 font-bold text-sm transition-all border-b-2 flex items-center space-x-2",
            activeTab === "tratativas"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-700"
          )}
        >
          <span>⏰ Acompanhamento de Tratativas (Alertas)</span>
          {statEmTratativa > 0 && (
            <span className="bg-amber-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
              {statEmTratativa}
            </span>
          )}
        </button>
      </div>

      {activeTab === "lista" && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-6">
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 col-span-2 flex items-center space-x-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <Building2 size={24} />
              </div>
              <div>
                <p className="text-sm text-slate-500 font-medium">Total Empresas</p>
                <p className="text-2xl font-black text-slate-900">{kpiTotais}</p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 col-span-2 lg:col-span-3 space-y-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Por Status
              </p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-emerald-600 font-medium text-xs">
                    Conveniada
                  </span>
                  <span className="font-bold text-slate-700">{statConveniada}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-amber-600 font-medium text-xs">
                    Em Tratativa
                  </span>
                  <span className="font-bold text-slate-700">
                    {statEmTratativa}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-rose-600 font-medium text-xs">
                    Cancelada
                  </span>
                  <span className="font-bold text-slate-700">{statCancelada}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium text-xs">
                    Não Visitada
                  </span>
                  <span className="font-bold text-slate-700">
                    {statNaoVisitada}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 col-span-2 lg:col-span-3 space-y-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Por Classificação
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                <div className="bg-amber-100/50 p-2 rounded-lg flex flex-col items-center">
                  <span className="text-amber-700 font-bold text-xs uppercase">
                    Ouro
                  </span>
                  <span className="text-lg font-black text-amber-900">
                    {classOuro}
                  </span>
                </div>
                <div className="bg-slate-100/80 p-2 rounded-lg flex flex-col items-center">
                  <span className="text-slate-600 font-bold text-xs uppercase">
                    Prata
                  </span>
                  <span className="text-lg font-black text-slate-800">
                    {classPrata}
                  </span>
                </div>
                <div className="bg-orange-100/50 p-2 rounded-lg flex flex-col items-center">
                  <span className="text-orange-800 font-bold text-xs uppercase">
                    Bronze
                  </span>
                  <span className="text-lg font-black text-orange-900">
                    {classBronze}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 space-y-4">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={18}
              />
              <input
                type="text"
                placeholder="Buscar por nome da empresa ou CNPJ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                >
                  <option value="Todas">Todos</option>
                  <option value="Conveniada">Conveniada</option>
                  <option value="Em tratativa">Em Tratativa</option>
                  <option value="Cancelada">Cancelada</option>
                  <option value="Não visitada">Não Visitada</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Classificação
                </label>
                <select
                  value={classificacaoFilter}
                  onChange={(e) => setClassificacaoFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                >
                  <option value="Todas">Todas</option>
                  <option value="Ouro">Ouro</option>
                  <option value="Prata">Prata</option>
                  <option value="Bronze">Bronze</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Unidade Vinculada
                </label>
                <select
                  value={unidadeFilter}
                  onChange={(e) => setUnidadeFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                >
                  <option value="Todas">Todas</option>
                  {uniqueUnidades.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Seguimento
                </label>
                <select
                  value={seguimentoFilter}
                  onChange={(e) => setSeguimentoFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                >
                  <option value="Todos">Todos</option>
                  {uniqueSeguimentos.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Bulk Action Panel */}
          {selectedEmpresaIds.length > 0 && (
            <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-3 animate-fadeIn">
              <span className="text-sm text-rose-800 font-medium">
                Selecionadas: <strong>{selectedEmpresaIds.length}</strong> empresa(s) para exclusão em massa.
              </span>
              <div className="flex space-x-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedEmpresaIds([])}
                  className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg transition-all"
                >
                  Desmarcar Todas
                </button>
                <button
                  type="button"
                  onClick={handleBulkDelete}
                  className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg shadow-sm transition-all flex items-center space-x-1.5"
                >
                  <Trash2 size={14} />
                  <span>Excluir Selecionadas</span>
                </button>
              </div>
            </div>
          )}

          {/* Quick select toggle */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium font-mono">
              Mostrando {filteredData.length} de {data.length} empresas
            </span>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => {
                  const allFilteredIds = filteredData.map(emp => emp.id);
                  const areAllSelected = allFilteredIds.every(id => selectedEmpresaIds.includes(id));
                  if (areAllSelected) {
                    setSelectedEmpresaIds(prev => prev.filter(id => !allFilteredIds.includes(id)));
                  } else {
                    setSelectedEmpresaIds(prev => Array.from(new Set([...prev, ...allFilteredIds])));
                  }
                }}
                className="text-xs text-blue-600 hover:text-blue-800 font-bold"
              >
                {filteredData.length > 0 && filteredData.every(emp => selectedEmpresaIds.includes(emp.id))
                  ? "Desmarcar Todas do Filtro"
                  : `Selecionar Todas do Filtro (${filteredData.length})`}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredData.map((emp) => {
              const isSelected = selectedEmpresaIds.includes(emp.id);
              const alertInfo = getTratativaAlert(emp);
              return (
                <div
                  key={emp.id}
                  className={cn(
                    "bg-white p-6 pl-12 rounded-3xl shadow-sm border flex flex-col justify-between hover:border-blue-200 transition-all group relative",
                    isSelected ? "border-blue-400 bg-blue-50/20" : "border-slate-100"
                  )}
                >
                  {/* Absolute checkbox for mass deletion */}
                  <div className="absolute top-5 left-4 z-10">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {
                        if (isSelected) {
                          setSelectedEmpresaIds(selectedEmpresaIds.filter(id => id !== emp.id));
                        } else {
                          setSelectedEmpresaIds([...selectedEmpresaIds, emp.id]);
                        }
                      }}
                      className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                    />
                  </div>

                  {emp.classificacao && (
                    <div
                      className={cn(
                        "absolute -top-3 -right-3 text-[10px] font-black uppercase tracking-wider py-1 px-3 rounded-full shadow-sm border",
                        emp.classificacao === "Ouro"
                          ? "bg-amber-100 text-amber-800 border-amber-200"
                          : emp.classificacao === "Prata"
                            ? "bg-slate-100 text-slate-700 border-slate-300"
                            : "bg-orange-100 text-orange-800 border-orange-200",
                      )}
                    >
                      {emp.classificacao}
                    </div>
                  )}

                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors pr-8">
                        {emp.nome}
                      </h3>
                      <div className="flex space-x-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingEmpresa(emp);
                            setIsModalOpen(true);
                          }}
                          className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-all"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(emp.id)}
                          className="p-2 text-rose-400 hover:bg-rose-50 rounded-lg transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5 mb-4">
                      <span
                        className={cn(
                          "text-[10px] font-bold px-2 py-0.5 rounded-full border",
                          emp.statusEmpresa === "Conveniada" &&
                            "bg-emerald-50 text-emerald-700 border-emerald-200",
                          emp.statusEmpresa === "Em tratativa" &&
                            "bg-amber-50 text-amber-700 border-amber-200",
                          emp.statusEmpresa === "Cancelada" &&
                            "bg-rose-50 text-rose-700 border-rose-200",
                          (emp.statusEmpresa === "Não visitada" ||
                            !emp.statusEmpresa) &&
                            "bg-slate-50 text-slate-600 border-slate-200",
                        )}
                      >
                        {emp.statusEmpresa || "Não visitada"}
                      </span>
                      {emp.seguimento && (
                        <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200">
                          {emp.seguimento}
                        </span>
                      )}
                      {alertInfo && (
                        <span className={cn("text-[9px] font-bold px-2 py-0.5 rounded-full border flex items-center space-x-1", alertInfo.bg)}>
                          <Clock size={10} className={alertInfo.iconColor} />
                          <span>{alertInfo.label} ({getTratativaDays(emp)}d)</span>
                        </span>
                      )}
                    </div>

                    {emp.statusEmpresa === "Em tratativa" && (
                      <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start space-x-2 shadow-sm">
                        <span className="text-amber-500 shrink-0 font-bold">⚠️</span>
                        <div className="leading-relaxed">
                          O processo foi iniciado acompanhe a tratativa com a empresa <span className="font-bold text-slate-900">{emp.nome}</span> para iniciar as campanhas de trade.
                        </div>
                      </div>
                    )}

                    <div className="space-y-3 mb-6 text-sm text-slate-600">
                      {emp.cnpj && (
                        <div className="flex items-center space-x-3">
                          <Briefcase size={16} className="text-slate-400" />
                          <span className="font-mono text-xs">{emp.cnpj}</span>
                        </div>
                      )}
                      <div className="flex flex-col space-y-1">
                        <div className="flex items-center justify-between pr-1">
                          <div className="flex items-center space-x-3">
                            <Phone size={16} className="text-slate-400" />
                            <span>{formatPhone(emp.telefone)}</span>
                          </div>
                          <span className="text-[9px] font-bold text-slate-400 uppercase">
                            Empresa
                          </span>
                        </div>
                        {emp.telefoneResponsavel && (
                          <div className="flex items-center justify-between pr-1">
                            <div className="flex items-center space-x-3">
                              <Phone
                                size={16}
                                className="text-slate-400 opacity-50"
                              />
                              <span>{formatPhone(emp.telefoneResponsavel)}</span>
                            </div>
                            <span className="text-[9px] font-bold text-slate-400 uppercase">
                              Resp.
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center space-x-3">
                        <Users size={16} className="text-slate-400" />
                        <span>{emp.responsavel}</span>
                      </div>

                      {emp.consultorNome && (
                        <div className="flex items-center space-x-3 text-blue-700 font-medium">
                          <UserIcon size={16} className="text-blue-500" />
                          <span>Comercial: {emp.consultorNome}</span>
                        </div>
                      )}

                      <div className="flex items-center space-x-3">
                        <Mail size={16} className="text-slate-400" />
                        <span className="truncate">{emp.email}</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <MapPin size={16} className="text-slate-400" />
                        <span className="truncate">{emp.endereco}</span>
                      </div>
                      {emp.bairro && (
                        <div className="flex items-center space-x-3">
                          <MapPin size={16} className="text-slate-400 opacity-50" />
                          <span className="truncate">Bairro: {emp.bairro}</span>
                        </div>
                      )}
                    </div>

                    {emp.unidadesVinculadas && emp.unidadesVinculadas.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-slate-100 mb-4">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5 font-mono">
                          Unidades Vinculadas
                        </span>
                        <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto pr-1">
                          {emp.unidadesVinculadas.map((uni) => (
                            <span
                              key={uni}
                              className="text-[9px] font-bold bg-indigo-50/60 text-indigo-600 border border-indigo-100/40 p-1 px-2 rounded-md truncate max-w-[150px]"
                              title={uni}
                            >
                              {uni}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col space-y-2 mt-auto pt-3 border-t border-slate-100/60">
                    <div className="grid grid-cols-2 gap-2">
                      {emp.linkMaps && (
                        <a
                          href={emp.linkMaps}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center space-x-2 w-full py-2 bg-slate-50 text-slate-600 rounded-xl font-bold text-xs hover:bg-slate-100 transition-all border border-slate-200"
                        >
                          <Globe size={14} />
                          <span>Maps</span>
                        </a>
                      )}
                      {emp.linkSales && (
                        <a
                          href={emp.linkSales}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center space-x-2 w-full py-2 bg-blue-50 text-blue-600 rounded-xl font-bold text-xs hover:bg-blue-100 transition-all border border-blue-200"
                        >
                          <ExternalLink size={14} />
                          <span>Sales</span>
                        </a>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => onGenerateAction(emp)}
                      className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center justify-center space-x-2"
                    >
                      <Calendar size={18} />
                      <span>Gerar Ação</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Mapa das Empresas View */}
      {activeTab === "mapa" && (
        <Mapa3D
          empresas={data}
          leads={leads}
          acoes={acoes}
          selectedId={selectedMapEmpresaId}
          onSelect={setSelectedMapEmpresaId}
          onGenerateAction={onGenerateAction}
          formatPhone={formatPhone}
        />
      )}

      {/* Tratativas (Alertas) Report View */}
      {activeTab === "tratativas" && (
        <div className="space-y-6">
          {/* Alerts Guide Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-start space-x-3">
              <div className="p-2 bg-amber-100 text-amber-700 rounded-xl shrink-0">
                <Clock size={20} />
              </div>
              <div>
                <h4 className="font-bold text-amber-900 text-sm">Lembrete de Retorno</h4>
                <p className="text-xs text-amber-700 mt-1">
                  Ativado após <strong>3 dias</strong> do cadastro. Requer contato inicial para retorno sobre o fechamento da ação.
                </p>
              </div>
            </div>
            
            <div className="bg-orange-50 border border-orange-200 p-4 rounded-2xl flex items-start space-x-3">
              <div className="p-2 bg-orange-100 text-orange-700 rounded-xl shrink-0">
                <AlertCircle size={20} />
              </div>
              <div>
                <h4 className="font-bold text-orange-900 text-sm">Alerta de Atenção</h4>
                <p className="text-xs text-orange-700 mt-1">
                  Ativado após <strong>7 dias</strong> do cadastro. Atenção necessária para a negociação em andamento.
                </p>
              </div>
            </div>

            <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl flex items-start space-x-3">
              <div className="p-2 bg-rose-100 text-rose-700 rounded-xl shrink-0">
                <AlertCircle size={20} />
              </div>
              <div>
                <h4 className="font-bold text-rose-900 text-sm">Retorno de Emergência</h4>
                <p className="text-xs text-rose-700 mt-1">
                  Ativado após <strong>10 dias</strong> ou mais. Tratativa crítica necessitando retorno imediato de emergência.
                </p>
              </div>
            </div>
          </div>

          {/* List of companies in tratativa */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-slate-800 text-base">
                Relatório de Acompanhamento de Tratativas
              </h3>
              <span className="text-xs text-slate-500 font-medium">
                Total de Tratativas Ativas: <strong>{data.filter(e => e.statusEmpresa === "Em tratativa").length}</strong>
              </span>
            </div>

            {data.filter(e => e.statusEmpresa === "Em tratativa").length === 0 ? (
              <div className="p-12 text-center text-slate-400 italic">
                Nenhuma empresa com status "Em tratativa" cadastrada.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/30">
                      <th className="p-4 pl-6">Empresa</th>
                      <th className="p-4">Consultor Vinculado (FDV)</th>
                      <th className="p-4">Unidade(s)</th>
                      <th className="p-4">Data Cadastro</th>
                      <th className="p-4">Dias Decorridos</th>
                      <th className="p-4">Lembrete / Status</th>
                      <th className="p-4 pr-6 text-right">Ações para Mudar Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {data
                      .filter((e) => e.statusEmpresa === "Em tratativa")
                      .map((emp) => {
                        const alertInfo = getTratativaAlert(emp);
                        const days = getTratativaDays(emp);
                        
                        const formatDate = (dateVal: any) => {
                          if (!dateVal) return "-";
                          let dateObj: Date;
                          if (dateVal.seconds) {
                            dateObj = new Date(dateVal.seconds * 1000);
                          } else {
                            dateObj = new Date(dateVal);
                          }
                          if (isNaN(dateObj.getTime())) return "-";
                          return dateObj.toLocaleDateString("pt-BR");
                        };

                        return (
                          <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="p-4 pl-6">
                              <div className="font-bold text-slate-800">{emp.nome}</div>
                              {emp.cnpj && <div className="text-[10px] text-slate-400 font-mono">CNPJ: {emp.cnpj}</div>}
                              <div className="mt-1.5 text-xs text-amber-700 max-w-sm leading-relaxed bg-amber-50/60 p-2 rounded-lg border border-amber-100/50">
                                O processo foi iniciado acompanhe a tratativa com a empresa <strong>{emp.nome}</strong> para iniciar as campanhas de trade.
                              </div>
                            </td>
                            <td className="p-4">
                              {emp.consultorNome ? (
                                <div className="flex items-center space-x-2 text-slate-700">
                                  <UserIcon size={14} className="text-blue-500 shrink-0" />
                                  <span className="font-medium">{emp.consultorNome}</span>
                                </div>
                              ) : (
                                <span className="text-slate-400 italic text-xs">Sem consultor vinculado</span>
                              )}
                            </td>
                            <td className="p-4">
                              {emp.unidadesVinculadas && emp.unidadesVinculadas.length > 0 ? (
                                <div className="flex flex-wrap gap-1 max-w-[200px]">
                                  {emp.unidadesVinculadas.map(un => (
                                    <span key={un} className="text-[9px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded font-bold border border-indigo-100/30">
                                      {un}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-slate-400 text-xs">-</span>
                              )}
                            </td>
                            <td className="p-4 text-slate-600 text-xs">
                              {formatDate(emp.createdAt)}
                            </td>
                            <td className="p-4">
                              <span className="font-bold text-slate-700 font-mono">{days}</span>
                              <span className="text-slate-400 text-xs ml-1">dia(s)</span>
                            </td>
                            <td className="p-4">
                              {alertInfo && (
                                <span className={cn("text-[10px] font-bold px-2.5 py-1 rounded-full border flex items-center space-x-1.5 w-fit", alertInfo.bg)}>
                                  <Clock size={10} className={alertInfo.iconColor} />
                                  <span>{alertInfo.label} ({days}d)</span>
                                </span>
                              )}
                            </td>
                            <td className="p-4 pr-6 text-right">
                              <div className="flex items-center justify-end space-x-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleUpdateStatus(emp.id, "Conveniada")}
                                  className="px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-xs font-bold transition-all animate-none"
                                  title="Mudar para Conveniada"
                                >
                                  🤝 Conveniar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateStatus(emp.id, "Cancelada")}
                                  className="px-2.5 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-lg text-xs font-bold transition-all animate-none"
                                  title="Mudar para Cancelada"
                                >
                                  ✕ Cancelar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateStatus(emp.id, "Não visitada")}
                                  className="px-2.5 py-1 bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 rounded-lg text-xs font-bold transition-all animate-none"
                                  title="Mudar para Não Visitada"
                                >
                                  Ignorar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingEmpresa(emp);
                                    setIsModalOpen(true);
                                  }}
                                  className="p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-lg transition-all"
                                  title="Editar Completo"
                                >
                                  <Edit2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center shrink-0">
                <h3 className="text-xl font-bold text-slate-900">
                  {editingEmpresa ? "Editar Empresa" : "Nova Empresa Parceira"}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="overflow-y-auto flex-1">
                <form
                  id="empresaForm"
                  onSubmit={handleSave}
                  className="p-6 space-y-5"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">
                        Nome da Empresa
                      </label>
                      <input
                        name="nome"
                        defaultValue={editingEmpresa?.nome}
                        required
                        className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">
                        CNPJ
                      </label>
                      <input
                        name="cnpj"
                        defaultValue={editingEmpresa?.cnpj}
                        placeholder="00.000.000/0000-00"
                        className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">
                        Status
                      </label>
                      <select
                        name="statusEmpresa"
                        defaultValue={editingEmpresa?.statusEmpresa || ""}
                        className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                      >
                        <option value="">Selecione...</option>
                        <option value="Conveniada">Conveniada</option>
                        <option value="Em tratativa">Em Tratativa</option>
                        <option value="Cancelada">Cancelada</option>
                        <option value="Não visitada">Não Visitada</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">
                        Classificação
                      </label>
                      <select
                        name="classificacao"
                        defaultValue={editingEmpresa?.classificacao || ""}
                        className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                      >
                        <option value="">Nenhuma</option>
                        <option value="Ouro">Ouro</option>
                        <option value="Prata">Prata</option>
                        <option value="Bronze">Bronze</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">
                        Seguimento
                      </label>
                      <input
                        name="seguimento"
                        defaultValue={editingEmpresa?.seguimento}
                        placeholder="Ex: Educação, Varejo"
                        className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">
                        Responsável pela Parceria
                      </label>
                      <input
                        name="responsavel"
                        defaultValue={editingEmpresa?.responsavel}
                        required
                        className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">
                        Email
                      </label>
                      <input
                        name="email"
                        type="email"
                        defaultValue={editingEmpresa?.email}
                        className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">
                        Telefone Principal (Empresa)
                      </label>
                      <input
                        name="telefone"
                        defaultValue={editingEmpresa?.telefone}
                        onChange={(e) => {
                          e.target.value = formatPhone(e.target.value);
                        }}
                        required
                        className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">
                        Telefone do Responsável
                      </label>
                      <input
                        name="telefoneResponsavel"
                        defaultValue={editingEmpresa?.telefoneResponsavel}
                        onChange={(e) => {
                          e.target.value = formatPhone(e.target.value);
                        }}
                        className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">
                        Endereço
                      </label>
                      <input
                        name="endereco"
                        defaultValue={editingEmpresa?.endereco}
                        className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">
                        Bairro
                      </label>
                      <input
                        name="bairro"
                        defaultValue={editingEmpresa?.bairro}
                        className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">
                        Link no Maps
                      </label>
                      <input
                        name="linkMaps"
                        defaultValue={editingEmpresa?.linkMaps}
                        placeholder="https://goo.gl/maps/..."
                        className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">
                        Link do Sales de Vínculo
                      </label>
                      <input
                        name="linkSales"
                        defaultValue={editingEmpresa?.linkSales}
                        placeholder="https://sales..."
                        className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">
                      Vincular a Consultor Comercial / FDV
                    </label>
                    <div className="relative">
                      <select
                        value={selectedConsultorId}
                        onChange={(e) => setSelectedConsultorId(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm cursor-pointer"
                      >
                        <option value="">Nenhum consultor selecionado (Sem vínculo)</option>
                        {listForSelection.map((u) => (
                          <option key={u.uid} value={u.uid}>
                            {u.name} ({(u.role || u.servidor || "Comercial").toUpperCase()})
                          </option>
                        ))}
                      </select>
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                        <UserIcon size={18} />
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Selecione um comercial/FDV cadastrado no sistema para vincular a esta empresa parceira.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      Unidades Vinculadas
                    </label>
                    {uniqueUnidades.length === 0 ? (
                      <span className="text-xs text-slate-400 italic block">
                        Nenhuma unidade cadastrada em Cursos Disponíveis.
                      </span>
                    ) : (
                      <div className="space-y-1.5 max-h-36 overflow-y-auto border border-slate-200 rounded-xl p-3 bg-slate-50">
                        <label className="flex items-center space-x-2 pb-1.5 mb-1.5 border-b border-slate-200 cursor-pointer text-xs font-bold text-blue-600">
                          <input
                            type="checkbox"
                            checked={
                              selectedUnidades.length === uniqueUnidades.length
                            }
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedUnidades(uniqueUnidades);
                              } else {
                                setSelectedUnidades([]);
                              }
                            }}
                            className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                          />
                          <span>
                            Selecionar Todas ({uniqueUnidades.length})
                          </span>
                        </label>
                        {uniqueUnidades.map((unidade) => {
                          const isChecked = selectedUnidades.includes(unidade);
                          return (
                            <label
                              key={unidade}
                              className="flex items-center space-x-2 text-xs font-medium text-slate-700 cursor-pointer py-0.5 hover:text-slate-900"
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {
                                  const next = isChecked
                                    ? selectedUnidades.filter(
                                        (u) => u !== unidade,
                                      )
                                    : [...selectedUnidades, unidade];
                                  setSelectedUnidades(next);
                                }}
                                className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                              />
                              <span>{unidade}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </form>
              </div>

              <div className="p-6 border-t border-slate-100 shrink-0 bg-slate-50">
                <button
                  type="submit"
                  form="empresaForm"
                  className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
                >
                  {editingEmpresa ? "Salvar Alterações" : "Cadastrar Empresa"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CalculoRemuneracaoView() {
  const [salario, setSalario] = useState<string>("");
  const [multiplo, setMultiplo] = useState<string>("");

  const resultado = useMemo(() => {
    const vSalario = parseFloat(salario.replace(",", ".")) || 0;
    const vMultiplo = parseFloat(multiplo.replace(",", ".")) || 0;

    // Formula: Salário Base * Múltiplo da RV
    return vSalario * vMultiplo;
  }, [salario, multiplo]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-slate-900">
          Cálculo de Remuneração
        </h2>
        <p className="text-slate-500">
          Preencha os campos abaixo para calcular a remuneração total
        </p>
      </div>

      <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        <div className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-700">
                Salário Base
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">
                  R$
                </span>
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
              <label className="block text-sm font-bold text-slate-700">
                Múltiplo da RV
              </label>
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
              <span className="text-blue-100 text-sm font-bold uppercase tracking-wider">
                Remuneração Total Estimada
              </span>
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
          Este cálculo é uma estimativa baseada nos valores informados. Consulte
          as regras vigentes de sua unidade para confirmação dos valores finais.
        </p>
      </div>
    </div>
  );
}

function AdminView({
  profile,
  users,
  links,
  onToast,
  leads,
  bases,
  gap,
  planner,
  campanhas,
  bomDia,
  forecast,
  periodos,
  whatsappMessages,
  empresasParceiras,
  botConfig,
  botStatuses,
  setBotStatuses,
  callBotApi,
  metaDia,
  qgLigacoes,
  cursos,
}: {
  profile: UserProfile | null;
  users: UserProfile[];
  links: LinkUtil[];
  onToast: (m: string, t?: "success" | "error") => void;
  leads: Lead[];
  bases: BaseEntry[];
  gap: GapEntry[];
  planner: PlannerTask[];
  campanhas: Campanha[];
  bomDia: BomDiaCaptacao[];
  forecast: ForecastCaptacao[];
  periodos: PeriodoCaptacao[];
  whatsappMessages: WhatsAppMessage[];
  empresasParceiras: EmpresaParceira[];
  botConfig: BotConfig;
  botStatuses: Record<
    string,
    {
      status: string;
      pairingCode?: string;
      qrCode?: string;
      qrUrl?: string;
      active?: boolean;
    }
  >;
  setBotStatuses: React.Dispatch<
    React.SetStateAction<
      Record<
        string,
        {
          status: string;
          pairingCode?: string;
          qrCode?: string;
          qrUrl?: string;
          active?: boolean;
        }
      >
    >
  >;
  callBotApi: (
    path: string,
    options?: { method?: "GET" | "POST"; body?: any },
  ) => Promise<any>;
  metaDia: MetaDia[];
  qgLigacoes: QgLigacao[];
  cursos: CursoDisponivel[];
}) {
  const [activeTab, setActiveTab] = useState<
    | "usuarios"
    | "bomDia"
    | "forecast"
    | "planner"
    | "periodo"
    | "links"
    | "whatsapp"
    | "backup"
    | "treinamento"
    | "metaDia"
    | "qgLigacoes"
    | "folgas"
    | "logo"
    | "funcionarios"
  >("usuarios");
  const [adminRequests, setAdminRequests] = useState<SolicitacaoFolga[]>([]);
  const [loadingAdminRequests, setLoadingAdminRequests] = useState(false);
  const [statusFilter, setStatusFilter] = useState<
    "Todos" | "Pendente" | "Aprovado" | "Recusado"
  >("Todos");

  // Subscribe to all folga requests in AdminView
  useEffect(() => {
    if (activeTab !== "folgas") return;

    setLoadingAdminRequests(true);
    const q = collection(db, COLLECTIONS.SOLICITACAO_FOLGA);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as SolicitacaoFolga[];

        // Sort descending by createdAt
        list.sort((a, b) => {
          const timeA = a.createdAt?.seconds || 0;
          const timeB = b.createdAt?.seconds || 0;
          return timeB - timeA;
        });

        setAdminRequests(list);
        setLoadingAdminRequests(false);
      },
      (error) => {
        console.error("Error loading admin folgas:", error);
        setLoadingAdminRequests(false);
      },
    );

    return () => unsubscribe();
  }, [activeTab]);

  const handleDecideRequest = async (
    request: SolicitacaoFolga,
    status: "Aprovado" | "Recusado",
  ) => {
    try {
      if (!auth.currentUser) return;
      const currentUserUid = auth.currentUser.uid;
      const decider = users.find((u) => u.uid === currentUserUid);
      const deciderName = decider
        ? decider.name
        : auth.currentUser.email || "Admin";

      const requestRef = doc(db, COLLECTIONS.SOLICITACAO_FOLGA, request.id);
      await updateDoc(requestRef, {
        status,
        aprovadoPorId: currentUserUid,
        aprovadoPorNome: deciderName,
        updatedAt: serverTimestamp(),
      });

      onToast(
        `Solicitação de ${request.solicitanteNome} foi ${status === "Aprovado" ? "aprovada" : "recusada"}.`,
        "success",
      );
    } catch (err: any) {
      console.error("Error deciding request:", err);
      onToast("Erro ao processar decisão.", "error");
    }
  };

  const [isProcessingPdf, setIsProcessingPdf] = useState(false);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      onToast("Por favor, selecione um arquivo PDF.", "error");
      return;
    }

    setIsProcessingPdf(true);
    try {
      const pdfjsLib = await import("pdfjs-dist");
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let text = "";

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items.map((item: any) => item.str).join(" ");
        text += `\n--- Página ${i} ---\n` + pageText + "\n";
      }

      const currentContext = botConfig.trainingContext || "";
      const newContext =
        currentContext +
        (currentContext ? "\n\n" : "") +
        `=== Conteúdo do Arquivo: ${file.name} ===\n` +
        text;

      await setDoc(
        doc(db, COLLECTIONS.BOT_CONFIG, "main"),
        {
          trainingContext: newContext,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );

      onToast("PDF processado e adicionado ao contexto com sucesso!");
    } catch (err: any) {
      console.error(err);
      onToast(`Erro ao processar PDF: ${err.message}`, "error");
    } finally {
      setIsProcessingPdf(false);
      e.target.value = "";
    }
  };

  const [logoPreview, setLogoPreview] = useState<string | null>(
    botConfig?.loginLogo || null,
  );
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  useEffect(() => {
    if (botConfig?.loginLogo) {
      setLogoPreview(botConfig.loginLogo);
    } else {
      setLogoPreview(null);
    }
  }, [botConfig?.loginLogo]);

  const handleLogoUploadProcess = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      onToast("Por favor, envie apenas arquivos de imagem.", "error");
      return;
    }

    setIsUploadingLogo(true);
    try {
      const compressImage = (f: File): Promise<string> => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(f);
          reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
              const canvas = document.createElement("canvas");
              const MAX_WIDTH = 400;
              const MAX_HEIGHT = 400;
              let width = img.width;
              let height = img.height;

              if (width > height) {
                if (width > MAX_WIDTH) {
                  height *= MAX_WIDTH / width;
                  width = MAX_WIDTH;
                }
              } else {
                if (height > MAX_HEIGHT) {
                  width *= MAX_HEIGHT / height;
                  height = MAX_HEIGHT;
                }
              }
              canvas.width = width;
              canvas.height = height;
              const ctx = canvas.getContext("2d");
              if (ctx) {
                ctx.drawImage(img, 0, 0, width, height);
                const dataUrl = canvas.toDataURL("image/png", 0.85);
                resolve(dataUrl);
              } else {
                resolve(event.target?.result as string);
              }
            };
            img.onerror = (err) => reject(err);
            img.src = event.target?.result as string;
          };
          reader.onerror = (err) => reject(err);
        });
      };

      const base64Image = await compressImage(file);
      setLogoPreview(base64Image);

      await setDoc(
        doc(db, COLLECTIONS.BOT_CONFIG, "main"),
        {
          loginLogo: base64Image,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );

      onToast("Logotipo atualizado com sucesso!");
    } catch (err: any) {
      console.error(err);
      onToast(`Erro ao enviar logotipo: ${err.message}`, "error");
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const [newLink, setNewLink] = useState({ nome: "", url: "" });
  const [newPlanner, setNewPlanner] = useState({
    atendenteName: "",
    baseName: "",
    dayOfWeek: "Segunda-feira",
  });
  const [newPeriodo, setNewPeriodo] = useState({
    nome: "",
    inicioInscricao: "",
    fimInscricao: "",
    inicioMatFin: "",
    fimMatFin: "",
    inicioMatAcad: "",
    fimMatAcad: "",
  });
  const [newBomDia, setNewBomDia] = useState({
    titulo: "",
    metaFinal: { insc: 0, matFin: 0, matAcad: 0 },
    metaDia: { insc: 0, matFin: 0, matAcad: 0 },
    anoAnterior: { insc: 0, matFin: 0, matAcad: 0 },
    real: { insc: 0, matFin: 0, matAcad: 0 },
  });
  const [newForecast, setNewForecast] = useState({
    nome: "",
    dataInicio: new Date().toISOString().split("T")[0],
    dataFim: new Date().toISOString().split("T")[0],
    metaDiaYTD: 0,
    realizado: 0,
    metaFechamento: 0,
  });

  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [changingPasswordUser, setChangingPasswordUser] = useState<UserProfile | null>(null);
  const [newPasswordValue, setNewPasswordValue] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [editingBomDia, setEditingBomDia] = useState<BomDiaCaptacao | null>(
    null,
  );
  const [editingForecast, setEditingForecast] =
    useState<ForecastCaptacao | null>(null);
  const [editingMetaDia, setEditingMetaDia] = useState<MetaDia | null>(null);
  const [newMetaDia, setNewMetaDia] = useState({
    data: new Date().toISOString().split("T")[0],
    aaPresencial: 0,
    ytdPresencial: 0,
    realizadoPresencial: 0,
    aaSemipresencial: 0,
    ytdSemipresencial: 0,
    realizadoSemipresencial: 0,
    aaDigital: 0,
    ytdDigital: 0,
    realizadoDigital: 0,
    aaTecnico: 0,
    ytdTecnico: 0,
    realizadoTecnico: 0,
  });

  const [editingQgLigacao, setEditingQgLigacao] = useState<QgLigacao | null>(null);
  const [newQgLigacao, setNewQgLigacao] = useState<{nome: string, diaSemana: string[], horario: string}>({
    nome: "",
    diaSemana: [],
    horario: "",
  });

  const [isAddingUser, setIsAddingUser] = useState(false);

  const handleAddMetaDia = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        data: newMetaDia.data,
        aaPresencial: Number(newMetaDia.aaPresencial),
        ytdPresencial: Number(newMetaDia.ytdPresencial),
        realizadoPresencial: Number(newMetaDia.realizadoPresencial),
        aaSemipresencial: Number(newMetaDia.aaSemipresencial),
        ytdSemipresencial: Number(newMetaDia.ytdSemipresencial),
        realizadoSemipresencial: Number(newMetaDia.realizadoSemipresencial),
        aaDigital: Number(newMetaDia.aaDigital),
        ytdDigital: Number(newMetaDia.ytdDigital),
        realizadoDigital: Number(newMetaDia.realizadoDigital),
        aaTecnico: Number(newMetaDia.aaTecnico || 0),
        ytdTecnico: Number(newMetaDia.ytdTecnico || 0),
        realizadoTecnico: Number(newMetaDia.realizadoTecnico || 0),
      };

      if (editingMetaDia) {
        await updateDoc(
          doc(db, COLLECTIONS.META_DIA, editingMetaDia.id),
          payload,
        );
        onToast("Meta Diária atualizada com sucesso!");
        setEditingMetaDia(null);
      } else {
        await addDoc(collection(db, COLLECTIONS.META_DIA), {
          ...payload,
          createdAt: serverTimestamp(),
        });
        onToast("Meta Diária cadastrada com sucesso!");
      }

      setNewMetaDia({
        data: new Date().toISOString().split("T")[0],
        aaPresencial: 0,
        ytdPresencial: 0,
        realizadoPresencial: 0,
        aaSemipresencial: 0,
        ytdSemipresencial: 0,
        realizadoSemipresencial: 0,
        aaDigital: 0,
        ytdDigital: 0,
        realizadoDigital: 0,
        aaTecnico: 0,
        ytdTecnico: 0,
        realizadoTecnico: 0,
      });
    } catch (err: any) {
      onToast(`Erro ao salvar Meta Diária: ${err.message}`, "error");
    }
  };

  const handleAddQgLigacao = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        nome: newQgLigacao.nome,
        diaSemana: newQgLigacao.diaSemana,
        horario: newQgLigacao.horario,
      };

      if (editingQgLigacao) {
        await updateDoc(
          doc(db, COLLECTIONS.QG_LIGACOES, editingQgLigacao.id),
          payload,
        );
        onToast("QG Ligações atualizado com sucesso!");
        setEditingQgLigacao(null);
      } else {
        await addDoc(collection(db, COLLECTIONS.QG_LIGACOES), {
          ...payload,
          createdAt: serverTimestamp(),
        });
        onToast("QG Ligações cadastrado com sucesso!");
      }

      setNewQgLigacao({
        nome: "",
        diaSemana: [],
        horario: "",
      });
    } catch (err: any) {
      onToast(`Erro ao salvar QG Ligações: ${err.message}`, "error");
    }
  };

  const handleDeleteQgLigacao = async (id: string) => {
    if (!window.confirm("Deseja apagar este registro do QG Ligações?")) return;
    try {
      await deleteDoc(doc(db, COLLECTIONS.QG_LIGACOES, id));
      onToast("Registro apagado com sucesso!");
    } catch (err: any) {
      onToast(`Erro ao apagar QG Ligações: ${err.message}`, "error");
    }
  };

  const handleUpdateUser = async (uid: string, data: Partial<UserProfile>) => {
    try {
      await updateDoc(doc(db, COLLECTIONS.USERS, uid), {
        ...data,
        updatedAt: serverTimestamp(),
      });
      onToast("Usuário atualizado!");
      setEditingUser(null);
    } catch (err: any) {
      onToast(err.message, "error");
    }
  };

  const handleDeleteUser = async (uid: string) => {
    if (
      window.confirm(
        "Deseja excluir permanentemente este usuário? Esta ação não pode ser desfeita.",
      )
    ) {
      try {
        await deleteDoc(doc(db, COLLECTIONS.USERS, uid));
        onToast("Usuário excluído com sucesso.");
      } catch (err: any) {
        handleFirestoreError(
          err,
          OperationType.DELETE,
          `${COLLECTIONS.USERS}/${uid}`,
        );
        onToast("Erro ao excluir usuário.", "error");
      }
    }
  };

  const handleAddLink = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, COLLECTIONS.LINKS), newLink);
      onToast("Link adicionado!");
      setNewLink({ nome: "", url: "" });
    } catch (err: any) {
      onToast(err.message, "error");
    }
  };

  const handleAddBomDia = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingBomDia) {
        await updateDoc(doc(db, COLLECTIONS.BOM_DIA, editingBomDia.id), {
          ...newBomDia,
          updatedAt: serverTimestamp(),
        });
        onToast("Bom Dia atualizado!");
        setEditingBomDia(null);
      } else {
        await addDoc(collection(db, COLLECTIONS.BOM_DIA), {
          ...newBomDia,
          data: new Date().toISOString().split("T")[0],
          createdAt: serverTimestamp(),
        });
        onToast("Bom Dia adicionado!");
      }
      setNewBomDia({
        titulo: "",
        metaFinal: { insc: 0, matFin: 0, matAcad: 0 },
        metaDia: { insc: 0, matFin: 0, matAcad: 0 },
        anoAnterior: { insc: 0, matFin: 0, matAcad: 0 },
        real: { insc: 0, matFin: 0, matAcad: 0 },
      });
    } catch (err: any) {
      onToast("Erro ao salvar Bom Dia.", "error");
    }
  };

  const handleAddForecast = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingForecast) {
        await updateDoc(doc(db, COLLECTIONS.FORECAST, editingForecast.id), {
          ...newForecast,
          updatedAt: serverTimestamp(),
        });
        onToast("Forecast atualizado!");
        setEditingForecast(null);
      } else {
        await addDoc(collection(db, COLLECTIONS.FORECAST), {
          ...newForecast,
          createdAt: serverTimestamp(),
        });
        onToast("Forecast criado!");
      }
      setNewForecast({
        nome: "",
        dataInicio: new Date().toISOString().split("T")[0],
        dataFim: new Date().toISOString().split("T")[0],
        metaDiaYTD: 0,
        realizado: 0,
        metaFechamento: 0,
      });
    } catch (err: any) {
      onToast("Erro ao salvar Forecast.", "error");
    }
  };

  const handleAddPlanner = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, COLLECTIONS.PLANNER), {
        ...newPlanner,
        createdAt: serverTimestamp(),
      });
      onToast("Planner adicionado!");
      setNewPlanner({
        atendenteName: "",
        baseName: "",
        dayOfWeek: "Segunda-feira",
      });
    } catch (err: any) {
      onToast("Erro ao salvar Planner.", "error");
    }
  };

  const handleAddPeriodo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, COLLECTIONS.PERIODO_CAPTACAO), {
        ...newPeriodo,
        createdAt: serverTimestamp(),
      });
      onToast("Período adicionado!");
      setNewPeriodo({
        nome: "",
        inicioInscricao: "",
        fimInscricao: "",
        inicioMatFin: "",
        fimMatFin: "",
        inicioMatAcad: "",
        fimMatAcad: "",
      });
    } catch (err: any) {
      onToast("Erro ao salvar Período.", "error");
    }
  };

  const handleBackup = () => {
    const data = {
      leads,
      bases,
      gap,
      planner,
      links,
      users,
      campanhas,
      bomDia,
      forecast,
      periodos,
      whatsappMessages,
      empresasParceiras,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `backup_angra_leads_${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    onToast("Backup gerado com sucesso!");
  };

  const uniqueUnidades = useMemo(() => {
    return Array.from(
      new Set((cursos || []).map((c) => c.nomeUnidade).filter(Boolean)),
    ).sort();
  }, [cursos]);

  return (
    <div className="space-y-8 pb-12">
      <div className="flex overflow-x-auto space-x-2 border-b border-slate-200 pb-4 mb-6 scrollbar-hide">
        {[
          { id: "usuarios", label: "Usuários" },
          { id: "funcionarios", label: "Funcionários (Insumos)" },
          { id: "folgas", label: "Folgas e Férias" },
          { id: "bomDia", label: "Bom Dia Captação" },
          { id: "forecast", label: "Forecast" },
          { id: "metaDia", label: "Meta Dia" },
          { id: "qgLigacoes", label: "QG Ligações" },
          { id: "planner", label: "Planner da Semana" },
          { id: "periodo", label: "Período da Captação" },
          { id: "whatsapp", label: "Gestão WhatsApp" },
          { id: "treinamento", label: "Treinamento Bot" },
          { id: "links", label: "Links Úteis" },
          { id: "logo", label: "Logotipo do Login" },
          { id: "backup", label: "Backup e Segurança" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "usuarios" && (
        <section className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h3 className="text-xl font-bold text-slate-900">
              Gerenciar Usuários
            </h3>
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
                  <th className="px-6 py-4">CPF</th>
                  <th className="px-6 py-4">Telefone</th>
                  <th className="px-6 py-4">Cargo</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr
                    key={u.uid}
                    className={cn(
                      "hover:bg-slate-50 transition-colors",
                      u.blocked && "bg-rose-50/50",
                    )}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-xs">
                          {u.name.charAt(0)}
                        </div>
                        <span className="font-bold text-slate-900">
                          {u.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {u.email}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {u.cpf || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {u.phone || "-"}
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={u.role}
                        onChange={(e) =>
                          handleUpdateUser(u.uid, {
                            role: e.target.value as UserRole,
                          })
                        }
                        className="text-xs font-bold border-none bg-transparent focus:ring-0 text-slate-700"
                      >
                        {Object.values(ROLES).map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={cn(
                          "px-2 py-1 rounded-full text-[10px] font-bold uppercase",
                          u.blocked
                            ? "bg-rose-100 text-rose-600"
                            : "bg-emerald-100 text-emerald-600",
                        )}
                      >
                        {u.blocked ? "Bloqueado" : "Ativo"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setChangingPasswordUser(u);
                            setNewPasswordValue("");
                            setPasswordError(null);
                          }}
                          className="p-2 text-sky-500 hover:bg-sky-50 rounded-lg transition-all"
                          title="Alterar Senha"
                        >
                          <KeyRound size={16} />
                        </button>
                        <button
                          onClick={() => setEditingUser(u)}
                          className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-all"
                          title="Editar Perfil"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() =>
                            handleUpdateUser(u.uid, { blocked: !u.blocked })
                          }
                          className={cn(
                            "p-2 rounded-lg transition-all",
                            u.blocked
                              ? "text-emerald-500 hover:bg-emerald-50"
                              : "text-amber-500 hover:bg-amber-50",
                          )}
                          title={u.blocked ? "Desbloquear" : "Bloquear"}
                        >
                          {u.blocked ? (
                            <Unlock size={16} />
                          ) : (
                            <Lock size={16} />
                          )}
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
                  <h3 className="text-xl font-bold text-slate-900">
                    Editar Perfil
                  </h3>
                  <button
                    onClick={() => setEditingUser(null)}
                    className="text-slate-400 hover:bg-slate-50 p-2 rounded-lg"
                  >
                    <X size={20} />
                  </button>
                </div>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    const updateData: any = {
                      name: formData.get("name") as string,
                      phone: formData.get("phone") as string,
                      email: formData.get("email") as string,
                      cpf: formData.get("cpf") as string,
                      dataNascimento: formData.get("dataNascimento") as string,
                      chavePix: formData.get("chavePix") as string,
                      botNumber: formData.get("botNumber") as string,
                      unidade: formData.get("unidade") as string,
                      role: formData.get("role") as string,
                    };
                    if (updateData.role === ROLES.PROMOTOR_RUA) {
                      updateData.linkadoA = formData.get("linkadoA") as string;
                    }
                    handleUpdateUser(editingUser.uid, updateData);
                  }}
                  className="p-6 space-y-4"
                >
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">
                      Nome Completo
                    </label>
                    <input
                      name="name"
                      required
                      defaultValue={editingUser.name}
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">
                      Email
                    </label>
                    <input
                      name="email"
                      type="email"
                      required
                      defaultValue={editingUser.email}
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">
                      CPF (Opcional)
                    </label>
                    <input
                      name="cpf"
                      defaultValue={editingUser.cpf || ""}
                      onChange={(e) =>
                        (e.target.value = formatCPF(e.target.value))
                      }
                      placeholder="000.000.000-00"
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">
                      Data de Nascimento (Opcional)
                    </label>
                    <input
                      name="dataNascimento"
                      type="date"
                      defaultValue={editingUser.dataNascimento || ""}
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">
                      Telefone (Contato)
                    </label>
                    <input
                      name="phone"
                      defaultValue={editingUser.phone}
                      onChange={(e) =>
                        (e.target.value = formatPhone(e.target.value))
                      }
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm"
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">
                      Telefone da IA (Multi-Device)
                    </label>
                    <input
                      name="botNumber"
                      defaultValue={editingUser.botNumber || ""}
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm"
                      placeholder="Ex: 5511999999999 (Somente números)"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      Este será o número de WhatsApp usado pelo sistema para
                      enviar mensagens desta conta.
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">
                      Unidade (Para Gestor Unidade / FDV Comercial)
                    </label>
                    <select
                      name="unidade"
                      defaultValue={editingUser.unidade || ""}
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm bg-white"
                    >
                      <option value="">Selecione uma unidade</option>
                      {uniqueUnidades.map((unidade) => (
                        <option key={unidade} value={unidade}>
                          {unidade}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">
                      Cargo
                    </label>
                    <select
                      name="role"
                      defaultValue={editingUser.role}
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm"
                    >
                      {Object.values(ROLES)
                        .filter((r) => {
                          const isComercial =
                            localStorage.getItem("servidor_selected") ===
                            "comercial";
                          if (isComercial) {
                            return [
                              "Admin Master",
                              "Gerente Comercial (Comercial)",
                              "FDV (Comercial)",
                              "Promotor/rua",
                              "Financeiro",
                            ].includes(r);
                          } else {
                            return ![
                              "Gerente Comercial (Comercial)",
                              "FDV (Comercial)",
                              "Promotor/rua",
                            ].includes(r);
                          }
                        })
                        .map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">
                      Linkado a (FDV - Apenas para Promotor/rua)
                    </label>
                    <select
                      name="linkadoA"
                      defaultValue={editingUser.linkadoA || ""}
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm"
                    >
                      <option value="">Nenhum/Não se aplica</option>
                      {users
                        .filter(
                          (u) =>
                            u.role === ROLES.FDV_COMERCIAL ||
                            u.role === ROLES.FDV,
                        )
                        .map((fdv) => (
                          <option key={fdv.uid} value={fdv.uid}>
                            {fdv.name} ({fdv.email})
                          </option>
                        ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">
                      Chave PIX (Opcional)
                    </label>
                    <input
                      name="chavePix"
                      defaultValue={editingUser.chavePix}
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm"
                      placeholder="CPF, Email, Telefone ou Chave Aleatória"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
                  >
                    Salvar Alterações
                  </button>
                </form>
              </motion.div>
            </div>
          )}

          {changingPasswordUser && (() => {
            const isMarcosTeixeira = profile?.email === "marcos.teixeira@estacio.br";
            return (
              <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
                >
                  <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">
                        {isMarcosTeixeira ? "Alterar Senha do Usuário" : "Redefinir Senha do Usuário"}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">
                        {isMarcosTeixeira 
                          ? `Defina uma nova senha para ${changingPasswordUser.name}`
                          : `Envie um e-mail de redefinição para ${changingPasswordUser.name}`
                        }
                      </p>
                    </div>
                    <button
                      onClick={() => setChangingPasswordUser(null)}
                      className="text-slate-400 hover:bg-slate-200 p-2 rounded-lg transition-colors"
                    >
                      <X size={20} />
                    </button>
                  </div>
                  
                  <div className="p-6 space-y-6">
                    {isMarcosTeixeira ? (
                      <>
                        {/* Option 1: Direct Password Change */}
                        <form
                          onSubmit={async (e) => {
                            e.preventDefault();
                            setPasswordError(null);
                            if (!newPasswordValue || newPasswordValue.length < 6) {
                              onToast("A senha deve ter pelo menos 6 caracteres.", "error");
                              return;
                            }
                            
                            setIsUpdatingPassword(true);
                            try {
                              const response = await fetch("/api/direct-pw-update", {
                                method: "POST",
                                headers: {
                                  "Content-Type": "application/json"
                                },
                                body: JSON.stringify({
                                  uid: changingPasswordUser.uid,
                                  newPassword: newPasswordValue,
                                  servidor: localStorage.getItem("servidor_selected") || "principal",
                                  adminEmail: profile?.email
                                })
                              });
                              
                              const responseText = await response.text();
                              let result;
                              try {
                                result = JSON.parse(responseText);
                              } catch (parseErr) {
                                console.error("Non-JSON response received:", responseText);
                                const prefix = responseText ? responseText.substring(0, 120).trim() : "Vazio";
                                throw new Error(
                                  `O servidor retornou uma resposta inválida (HTML: "${prefix}..."). Isso geralmente ocorre se as credenciais administrativas para alteração direta não estiverem totalmente configuradas ou se o servidor de desenvolvimento estiver em processo de atualização. Por favor, utilize a opção "Enviar E-mail de Redefinição" abaixo, que é 100% nativa e funciona perfeitamente para ambos os servidores!`
                                );
                              }
                              
                              if (result.success) {
                                onToast(`Senha de ${changingPasswordUser.name} alterada com sucesso!`, "success");
                                setChangingPasswordUser(null);
                              } else {
                                setPasswordError(result.error);
                                onToast(`Erro: ${result.error}`, "error");
                              }
                            } catch (err: any) {
                              setPasswordError(err.message);
                              onToast(`Erro ao alterar senha: ${err.message}`, "error");
                            } finally {
                              setIsUpdatingPassword(false);
                            }
                          }}
                          className="space-y-4"
                        >
                          {passwordError && (
                            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl space-y-1.5 leading-relaxed">
                              <p className="font-semibold text-red-800">Erro ao alterar senha:</p>
                              <p className="break-all">{passwordError}</p>
                              {passwordError.includes("identitytoolkit") && (
                                <div className="mt-2 pt-2 border-t border-red-100">
                                  <p className="font-bold text-red-950">Ação Necessária:</p>
                                  <p className="mt-1 text-red-800">
                                    A API <strong>Google Identity Toolkit</strong> precisa ser ativada no seu projeto Google Cloud para permitir a alteração administrativa de senhas.
                                  </p>
                                  <div className="flex flex-col sm:flex-row sm:space-x-2 space-y-2 sm:space-y-0 mt-2.5">
                                    <a
                                      href="https://console.developers.google.com/apis/api/identitytoolkit.googleapis.com/overview?project=gestaopro-761e1"
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center justify-center space-x-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors text-[11px]"
                                    >
                                      <span>Ativar no Principal (gestaopro-761e1)</span>
                                    </a>
                                    <a
                                      href="https://console.developers.google.com/apis/api/identitytoolkit.googleapis.com/overview?project=gestaodeleadspro-d4230"
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center justify-center space-x-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors text-[11px]"
                                    >
                                      <span>Ativar no Comercial (gestaodeleadspro-d4230)</span>
                                    </a>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1.5">
                              Nova Senha
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="Digite a nova senha (mínimo 6 caracteres)"
                              value={newPasswordValue}
                              onChange={(e) => setNewPasswordValue(e.target.value)}
                              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                          </div>
                          
                          <button
                            type="submit"
                            disabled={isUpdatingPassword}
                            className="w-full bg-blue-600 text-white py-2.5 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 disabled:bg-blue-300 disabled:cursor-not-allowed flex items-center justify-center space-x-2 cursor-pointer"
                          >
                            {isUpdatingPassword ? (
                              <span>Alterando...</span>
                            ) : (
                              <>
                                <KeyRound size={16} />
                                <span>Definir Nova Senha Diretamente</span>
                              </>
                            )}
                          </button>
                        </form>
                        
                        <div className="relative flex py-2 items-center">
                          <div className="flex-grow border-t border-slate-100"></div>
                          <span className="flex-shrink mx-4 text-[10px] text-slate-400 font-bold uppercase tracking-wider">ou</span>
                          <div className="flex-grow border-t border-slate-100"></div>
                        </div>
                      </>
                    ) : (
                      <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-2xl space-y-2 leading-relaxed">
                        <p className="font-bold text-amber-900 flex items-center">
                          <svg className="w-4.5 h-4.5 mr-2 text-amber-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          Recurso Restrito ao Admin Master
                        </p>
                        <p>
                          Por motivos de segurança e integridade das contas, a <strong>alteração direta de senha administrativa</strong> é de uso exclusivo do Admin Master (<strong>marcos.teixeira@estacio.br</strong>).
                        </p>
                        <p>
                          Como administrador, você pode disparar o fluxo de redefinição enviando um e-mail com link seguro para o endereço cadastrado do usuário no botão abaixo.
                        </p>
                      </div>
                    )}
                    
                    {/* Option 2: Email Password Reset */}
                    <div className="space-y-3">
                      <p className="text-xs text-slate-500 text-center">
                        {isMarcosTeixeira 
                          ? "Você também pode enviar um e-mail de redefinição para o endereço cadastrado do usuário."
                          : "Envie um link seguro de redefinição para o endereço cadastrado do usuário."
                        }
                      </p>
                      <button
                        type="button"
                        onClick={async () => {
                          if (window.confirm(`Deseja enviar um e-mail de redefinição de senha para ${changingPasswordUser.name} (${changingPasswordUser.email})?`)) {
                            try {
                              await sendPasswordResetEmail(auth, changingPasswordUser.email);
                              onToast("E-mail de redefinição enviado com sucesso!", "success");
                              setChangingPasswordUser(null);
                            } catch (err: any) {
                              onToast(`Erro ao enviar e-mail: ${err.message}`, "error");
                            }
                          }
                        }}
                        className="w-full bg-blue-50 text-blue-700 hover:bg-blue-100 py-2.5 rounded-xl font-bold transition-all text-xs text-center cursor-pointer"
                      >
                        Enviar E-mail de Redefinição de Senha
                      </button>
                    </div>
                  </div>
                </motion.div>
              </div>
            );
          })()}

          {isAddingUser && (
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
              >
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                  <h3 className="text-xl font-bold text-slate-900">
                    Novo Usuário
                  </h3>
                  <button
                    onClick={() => setIsAddingUser(false)}
                    className="text-slate-400 hover:bg-slate-50 p-2 rounded-lg"
                  >
                    <X size={20} />
                  </button>
                </div>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    const email = formData.get("email") as string;
                    const name = formData.get("name") as string;
                    const role = formData.get("role") as UserRole;
                    const linkadoA = formData.get("linkadoA")?.toString() || "";

                    try {
                      // Create user in Auth using secondary app to avoid signing out admin
                      const userCredential =
                        await createUserWithEmailAndPassword(
                          secondaryAuth,
                          email,
                          "123456",
                        );
                      await updateProfile(userCredential.user, {
                        displayName: name,
                      });
                      const newUid = userCredential.user.uid;

                      const profileData: any = {
                        uid: newUid,
                        name,
                        email,
                        cpf: (formData.get("cpf") as string) || "",
                        dataNascimento:
                          (formData.get("dataNascimento") as string) || "",
                        role,
                        servidor:
                          localStorage.getItem("servidor_selected") ||
                          "principal",
                        phone: formData.get("phone") as string,
                        chavePix: formData.get("chavePix") as string,
                        unidade: (formData.get("unidade") as string) || "",
                        blocked: false,
                        mustChangePassword: true,
                        createdAt: serverTimestamp(),
                        updatedAt: serverTimestamp(),
                      };
                      if (role === ROLES.PROMOTOR_RUA && linkadoA) {
                        profileData.linkadoA = linkadoA;
                      }

                      // Create profile in Firestore
                      await setDoc(
                        doc(db, COLLECTIONS.USERS, newUid),
                        profileData,
                      );

                      onToast(
                        "Usuário criado com sucesso! Senha padrão: 123456",
                      );
                      setIsAddingUser(false);
                      // Sign out from secondary auth to clean up
                      await signOut(secondaryAuth);
                    } catch (err: any) {
                      console.error("Auth error details (UsersView):", {
                        code: err.code,
                        message: err.message,
                        stack: err.stack,
                      });
                      onToast(
                        err.message ===
                          "Firebase: Error (auth/email-already-in-use)."
                          ? "Este email já está em uso."
                          : `Erro ao criar usuário: ${err.message}`,
                        "error",
                      );
                    }
                  }}
                  className="p-6 space-y-4"
                >
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">
                      Nome Completo
                    </label>
                    <input
                      name="name"
                      required
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">
                      Email (Google)
                    </label>
                    <input
                      name="email"
                      type="email"
                      required
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">
                      CPF (Opcional)
                    </label>
                    <input
                      name="cpf"
                      onChange={(e) =>
                        (e.target.value = formatCPF(e.target.value))
                      }
                      placeholder="000.000.000-00"
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">
                      Data de Nascimento (Opcional)
                    </label>
                    <input
                      name="dataNascimento"
                      type="date"
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">
                      Cargo
                    </label>
                    <select
                      name="role"
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm"
                    >
                      {Object.values(ROLES)
                        .filter((r) => {
                          const isComercial =
                            localStorage.getItem("servidor_selected") ===
                            "comercial";
                          if (isComercial) {
                            return [
                              "Admin Master",
                              "Gerente Comercial (Comercial)",
                              "FDV (Comercial)",
                              "Promotor/rua",
                              "Financeiro",
                            ].includes(r);
                          } else {
                            return ![
                              "Gerente Comercial (Comercial)",
                              "FDV (Comercial)",
                              "Promotor/rua",
                            ].includes(r);
                          }
                        })
                        .map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">
                      Linkado a (FDV - Apenas para Promotor/rua)
                    </label>
                    <select
                      name="linkadoA"
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm"
                    >
                      <option value="">Nenhum</option>
                      {users
                        .filter(
                          (u) =>
                            u.role === ROLES.FDV_COMERCIAL ||
                            u.role === ROLES.FDV,
                        )
                        .map((fdv) => (
                          <option key={fdv.uid} value={fdv.uid}>
                            {fdv.name} ({fdv.email})
                          </option>
                        ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">
                        Unidade (Para Gestor Unidade / FDV Comercial)
                      </label>
                      <select
                        name="unidade"
                        className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm bg-white"
                      >
                        <option value="">Selecione uma unidade</option>
                        {uniqueUnidades.map((unidade) => (
                          <option key={unidade} value={unidade}>
                            {unidade}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">
                        Telefone
                      </label>
                      <input
                        name="phone"
                        onChange={(e) =>
                          (e.target.value = formatPhone(e.target.value))
                        }
                        className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm"
                        placeholder="(00) 00000-0000"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">
                        Chave PIX
                      </label>
                      <input
                        name="chavePix"
                        className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
                  >
                    Criar Usuário
                  </button>
                </form>
              </motion.div>
            </div>
          )}
        </section>
      )}

      {activeTab === "metaDia" && (
        <div className="space-y-8">
          <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-900">
                {editingMetaDia
                  ? "Editar Registro de Meta Dia"
                  : "Adicionar Novo Registro de Meta Dia"}
              </h3>
              {editingMetaDia && (
                <button
                  onClick={() => {
                    setEditingMetaDia(null);
                    setNewMetaDia({
                      data: new Date().toISOString().split("T")[0],
                      aaPresencial: 0,
                      ytdPresencial: 0,
                      realizadoPresencial: 0,
                      aaSemipresencial: 0,
                      ytdSemipresencial: 0,
                      realizadoSemipresencial: 0,
                      aaDigital: 0,
                      ytdDigital: 0,
                      realizadoDigital: 0,
                      aaTecnico: 0,
                      ytdTecnico: 0,
                      realizadoTecnico: 0,
                    });
                  }}
                  className="text-slate-400 hover:text-slate-600 text-sm font-bold"
                >
                  Cancelar Edição
                </button>
              )}
            </div>

            <form onSubmit={handleAddMetaDia} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center space-x-2 text-xs font-bold text-slate-500 mb-2">
                    <Calendar size={14} className="text-blue-600" />
                    <span>Data *</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={newMetaDia.data}
                    onChange={(e) =>
                      setNewMetaDia({ ...newMetaDia, data: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  />
                </div>
                <div className="flex bg-slate-50 items-center justify-around rounded-xl p-3 border border-slate-100/80">
                  <div className="text-center">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase">
                      Total A.A
                    </span>
                    <span className="text-sm font-extrabold text-slate-700">
                      {Number(newMetaDia.aaPresencial) +
                        Number(newMetaDia.aaSemipresencial) +
                        Number(newMetaDia.aaDigital) +
                        Number(newMetaDia.aaTecnico || 0)}
                    </span>
                  </div>
                  <div className="text-center border-x border-slate-200 px-6">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase">
                      Total YTD
                    </span>
                    <span className="text-sm font-extrabold text-blue-600">
                      {Number(newMetaDia.ytdPresencial) +
                        Number(newMetaDia.ytdSemipresencial) +
                        Number(newMetaDia.ytdDigital) +
                        Number(newMetaDia.ytdTecnico || 0)}
                    </span>
                  </div>
                  <div className="text-center">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase">
                      Total Realizado
                    </span>
                    <span className="text-sm font-extrabold text-emerald-600">
                      {Number(newMetaDia.realizadoPresencial) +
                        Number(newMetaDia.realizadoSemipresencial) +
                        Number(newMetaDia.realizadoDigital) +
                        Number(newMetaDia.realizadoTecnico || 0)}
                    </span>
                  </div>
                </div>
              </div>

              {[
                {
                  key: "Presencial",
                  label: "Modalidade Presencial",
                  color: "border-blue-100 bg-blue-50/10",
                  aa: "aaPresencial",
                  ytd: "ytdPresencial",
                  realizado: "realizadoPresencial",
                },
                {
                  key: "Semipresencial",
                  label: "Modalidade Semipresencial",
                  color: "border-orange-100 bg-orange-50/10",
                  aa: "aaSemipresencial",
                  ytd: "ytdSemipresencial",
                  realizado: "realizadoSemipresencial",
                },
                {
                  key: "Digital",
                  label: "Modalidade Digital",
                  color: "border-indigo-100 bg-indigo-50/10",
                  aa: "aaDigital",
                  ytd: "ytdDigital",
                  realizado: "realizadoDigital",
                },
                {
                  key: "Tecnico",
                  label: "Curso Técnico",
                  color: "border-emerald-100 bg-emerald-50/10",
                  aa: "aaTecnico",
                  ytd: "ytdTecnico",
                  realizado: "realizadoTecnico",
                },
              ].map((modal) => (
                <div
                  key={modal.key}
                  className="p-4 rounded-2xl border border-slate-100 bg-slate-50/30"
                >
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-4">
                    {modal.label}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                        A.A (Ano Anterior) *
                      </label>
                      <input
                        type="number"
                        required
                        value={newMetaDia[modal.aa as keyof typeof newMetaDia]}
                        onChange={(e) =>
                          setNewMetaDia({
                            ...newMetaDia,
                            [modal.aa]: Number(e.target.value),
                          })
                        }
                        className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                        YTD (Meta Dia) *
                      </label>
                      <input
                        type="number"
                        required
                        value={newMetaDia[modal.ytd as keyof typeof newMetaDia]}
                        onChange={(e) =>
                          setNewMetaDia({
                            ...newMetaDia,
                            [modal.ytd]: Number(e.target.value),
                          })
                        }
                        className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                        Realizado no Dia *
                      </label>
                      <input
                        type="number"
                        required
                        value={
                          newMetaDia[modal.realizado as keyof typeof newMetaDia]
                        }
                        onChange={(e) =>
                          setNewMetaDia({
                            ...newMetaDia,
                            [modal.realizado]: Number(e.target.value),
                          })
                        }
                        className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                  </div>
                </div>
              ))}

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-lg shadow-blue-100 flex items-center justify-center space-x-2 text-sm"
              >
                <span>
                  {editingMetaDia
                    ? "Salvar Alterações"
                    : "Salvar Registro de Meta Dia"}
                </span>
              </button>
            </form>
          </section>

          {/* Table display */}
          <section className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900">
                Histórico de Metas Diárias
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                Registrados: {metaDia.length}
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                    <th className="p-4">Data</th>
                    <th className="p-4 text-center text-blue-600">
                      Presencial (A.A / YTD / Real)
                    </th>
                    <th className="p-4 text-center text-orange-600">
                      Semipresencial (A.A / YTD / Real)
                    </th>
                    <th className="p-4 text-center text-indigo-600">
                      Digital (A.A / YTD / Real)
                    </th>
                    <th className="p-4 text-center text-emerald-600">
                      Curso Técnico (A.A / YTD / Real)
                    </th>
                    <th className="p-4 text-center bg-slate-50/50">
                      Total (A.A / YTD / Real)
                    </th>
                    <th className="p-4 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-600">
                  {metaDia.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="p-8 text-center text-slate-400 italic"
                      >
                        Nenhum registro de Meta Diária encontrado.
                      </td>
                    </tr>
                  ) : (
                    [...metaDia]
                      .sort((a, b) => b.data.localeCompare(a.data))
                      .map((item) => {
                        const totAA =
                          item.aaPresencial +
                          item.aaSemipresencial +
                          item.aaDigital +
                          (item.aaTecnico || 0);
                        const totYTD =
                          item.ytdPresencial +
                          item.ytdSemipresencial +
                          item.ytdDigital +
                          (item.ytdTecnico || 0);
                        const totReal =
                          item.realizadoPresencial +
                          item.realizadoSemipresencial +
                          item.realizadoDigital +
                          (item.realizadoTecnico || 0);

                        // Function to get color class comparison Realizado vs YTD
                        const getColorClass = (real: number, ytd: number) => {
                          if (real > ytd)
                            return "text-emerald-600 font-extrabold";
                          if (real < ytd) return "text-rose-600 font-extrabold";
                          return "text-blue-600 font-extrabold";
                        };

                        return (
                          <tr
                            key={item.id}
                            className="hover:bg-slate-50/30 transition-colors"
                          >
                            <td className="p-4 font-bold text-slate-800 whitespace-nowrap">
                              {new Date(
                                item.data + "T00:00:00",
                              ).toLocaleDateString("pt-BR")}
                            </td>
                            <td className="p-4 text-center">
                              <span className="text-slate-400">
                                {item.aaPresencial}
                              </span>
                              <span className="mx-1 text-slate-300">/</span>
                              <span className="text-slate-600 font-semibold">
                                {item.ytdPresencial}
                              </span>
                              <span className="mx-1 text-slate-300">/</span>
                              <span
                                className={cn(
                                  getColorClass(
                                    item.realizadoPresencial,
                                    item.ytdPresencial,
                                  ),
                                )}
                              >
                                {item.realizadoPresencial}
                              </span>
                            </td>
                            <td className="p-4 text-center">
                              <span className="text-slate-400">
                                {item.aaSemipresencial}
                              </span>
                              <span className="mx-1 text-slate-300">/</span>
                              <span className="text-slate-600 font-semibold">
                                {item.ytdSemipresencial}
                              </span>
                              <span className="mx-1 text-slate-300">/</span>
                              <span
                                className={cn(
                                  getColorClass(
                                    item.realizadoSemipresencial,
                                    item.ytdSemipresencial,
                                  ),
                                )}
                              >
                                {item.realizadoSemipresencial}
                              </span>
                            </td>
                            <td className="p-4 text-center">
                              <span className="text-slate-400">
                                {item.aaDigital}
                              </span>
                              <span className="mx-1 text-slate-300">/</span>
                              <span className="text-slate-600 font-semibold">
                                {item.ytdDigital}
                              </span>
                              <span className="mx-1 text-slate-300">/</span>
                              <span
                                className={cn(
                                  getColorClass(
                                    item.realizadoDigital,
                                    item.ytdDigital,
                                  ),
                                )}
                              >
                                {item.realizadoDigital}
                              </span>
                            </td>
                            <td className="p-4 text-center">
                              <span className="text-slate-400">
                                {item.aaTecnico || 0}
                              </span>
                              <span className="mx-1 text-slate-300">/</span>
                              <span className="text-slate-600 font-semibold">
                                {item.ytdTecnico || 0}
                              </span>
                              <span className="mx-1 text-slate-300">/</span>
                              <span
                                className={cn(
                                  getColorClass(
                                    item.realizadoTecnico || 0,
                                    item.ytdTecnico || 0,
                                  ),
                                )}
                              >
                                {item.realizadoTecnico || 0}
                              </span>
                            </td>
                            <td className="p-4 text-center bg-slate-50/20 font-bold">
                              <span className="text-slate-400">{totAA}</span>
                              <span className="mx-1 text-slate-300">/</span>
                              <span className="text-slate-600 font-semibold">
                                {totYTD}
                              </span>
                              <span className="mx-1 text-slate-300">/</span>
                              <span
                                className={cn(getColorClass(totReal, totYTD))}
                              >
                                {totReal}
                              </span>
                            </td>
                            <td className="p-4 text-center whitespace-nowrap">
                              <div className="flex items-center justify-center space-x-2">
                                <button
                                  onClick={() => {
                                    setEditingMetaDia(item);
                                    setNewMetaDia({
                                      data: item.data,
                                      aaPresencial: item.aaPresencial,
                                      ytdPresencial: item.ytdPresencial,
                                      realizadoPresencial:
                                        item.realizadoPresencial,
                                      aaSemipresencial: item.aaSemipresencial,
                                      ytdSemipresencial: item.ytdSemipresencial,
                                      realizadoSemipresencial:
                                        item.realizadoSemipresencial,
                                      aaDigital: item.aaDigital,
                                      ytdDigital: item.ytdDigital,
                                      realizadoDigital: item.realizadoDigital,
                                      aaTecnico: item.aaTecnico || 0,
                                      ytdTecnico: item.ytdTecnico || 0,
                                      realizadoTecnico: item.realizadoTecnico || 0,
                                    });
                                    // Scroll to form smoothly
                                    window.scrollTo({
                                      top: 0,
                                      behavior: "smooth",
                                    });
                                  }}
                                  className="p-1 px-2.5 text-blue-600 hover:bg-blue-50 rounded-lg font-bold hover:scale-105 transition-all text-xs"
                                >
                                  Editar
                                </button>
                                <button
                                  onClick={async () => {
                                    if (
                                      window.confirm(
                                        "Deseja excluir permanentemente este registro de Meta Diária?",
                                      )
                                    ) {
                                      try {
                                        await deleteDoc(
                                          doc(
                                            db,
                                            COLLECTIONS.META_DIA,
                                            item.id,
                                          ),
                                        );
                                        onToast(
                                          "Registro de Meta Diária excluído.",
                                        );
                                      } catch (err: any) {
                                        onToast(
                                          "Erro ao excluir registro.",
                                          "error",
                                        );
                                      }
                                    }
                                  }}
                                  className="p-1 px-2.5 text-rose-600 hover:bg-rose-50 rounded-lg font-bold hover:scale-105 transition-all text-xs"
                                >
                                  Excluir
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      {activeTab === "qgLigacoes" && (
        <div className="space-y-6">
          <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-900 flex items-center">
                <span className="bg-emerald-100 text-emerald-600 p-2 rounded-xl mr-3">
                  <Phone size={20} />
                </span>
                {editingQgLigacao
                  ? "Editar Registro QG Ligações"
                  : "Adicionar Novo Registro QG Ligações"}
              </h3>
              {editingQgLigacao && (
                <button
                  onClick={() => {
                    setEditingQgLigacao(null);
                    setNewQgLigacao({
        nome: "",
        diaSemana: [],
        horario: "",
      });
                  }}
                  className="text-sm font-bold text-slate-400 hover:text-slate-600 px-3 py-1 bg-slate-100 rounded-lg"
                >
                  Cancelar Edição
                </button>
              )}
            </div>

            <form onSubmit={handleAddQgLigacao} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Nome
                  </label>
                  <input
                    type="text"
                    required
                    value={newQgLigacao.nome}
                    onChange={(e) =>
                      setNewQgLigacao({ ...newQgLigacao, nome: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                    placeholder="Nome da pessoa"
                  />
                </div>
                <div>
                  
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Dias da Semana
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {["Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado", "Domingo"].map((dia) => (
                      <label key={dia} className="flex items-center space-x-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors">
                        <input
                          type="checkbox"
                          checked={newQgLigacao.diaSemana.includes(dia)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewQgLigacao({ ...newQgLigacao, diaSemana: [...newQgLigacao.diaSemana, dia] });
                            } else {
                              setNewQgLigacao({ ...newQgLigacao, diaSemana: newQgLigacao.diaSemana.filter(d => d !== dia) });
                            }
                          }}
                          className="rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                        />
                        <span className="text-xs font-semibold text-slate-700">{dia}</span>
                      </label>
                    ))}
                  </div>

                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Horário
                  </label>
                  <input
                    type="time"
                    required
                    value={newQgLigacao.horario}
                    onChange={(e) =>
                      setNewQgLigacao({ ...newQgLigacao, horario: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-lg shadow-emerald-100 flex items-center justify-center space-x-2 text-sm"
              >
                <span>
                  {editingQgLigacao ? "Salvar Alterações" : "Adicionar ao QG"}
                </span>
              </button>
            </form>
          </section>

          <section className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900">
                Lista de Registros - QG Ligações
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                Total: {qgLigacoes.length}
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                    <th className="p-4">Nome</th>
                    <th className="p-4">Dia da Semana</th>
                    <th className="p-4">Horário</th>
                    <th className="p-4 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-600">
                  {qgLigacoes.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-slate-400 italic">
                        Nenhum registro cadastrado no QG Ligações.
                      </td>
                    </tr>
                  ) : (
                    [...qgLigacoes].map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/30 transition-colors">
                        <td className="p-4 font-bold text-slate-800">{item.nome}</td>
                        <td className="p-4">{Array.isArray(item.diaSemana) ? item.diaSemana.join(", ") : item.diaSemana}</td>
                        <td className="p-4 font-medium text-emerald-600">{item.horario}</td>
                        <td className="p-4 text-center whitespace-nowrap">
                          <button
                            onClick={() => {
                              setEditingQgLigacao(item);
                              setNewQgLigacao({
                                nome: item.nome,
                                diaSemana: Array.isArray(item.diaSemana) ? item.diaSemana : (item.diaSemana ? [item.diaSemana] : []),
                                horario: item.horario,
                              });
                              window.scrollTo({ top: 0, behavior: "smooth" });
                            }}
                            className="p-1 px-2.5 text-blue-600 hover:bg-blue-50 rounded-lg font-bold hover:scale-105 transition-all text-xs mr-2"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleDeleteQgLigacao(item.id)}
                            className="p-1 px-2.5 text-rose-600 hover:bg-rose-50 rounded-lg font-bold hover:scale-105 transition-all text-xs"
                          >
                            Excluir
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      {activeTab === "folgas" &&
        (() => {
          const currentUserUid = auth.currentUser?.uid;
          const userProfile = users.find((u) => u.uid === currentUserUid);

          const filteredRequests = adminRequests.filter((req) => {
            if (!userProfile) return false;
            if (userProfile.role === "Admin Master") return true;
            if (userProfile.role === "Líder/FDV") {
              return (
                req.solicitanteRole === "Sala de Matrícula" ||
                (req.solicitanteRole === "Líder/FDV" &&
                  req.solicitanteId !== userProfile.uid)
              );
            }
            if (
              userProfile.role === "Gestor Comercial" ||
              userProfile.role === "Gerente Comercial (Comercial)"
            ) {
              return (
                req.solicitanteRole === "FDV" ||
                req.solicitanteRole === "FDV (Comercial)"
              );
            }
            return false;
          });

          const pendingCount = filteredRequests.filter(
            (r) => r.status === "Pendente",
          ).length;
          const approvedCount = filteredRequests.filter(
            (r) => r.status === "Aprovado",
          ).length;
          const rejectedCount = filteredRequests.filter(
            (r) => r.status === "Recusado",
          ).length;

          return (
            <div id="admin-folgas-section" className="space-y-6">
              {/* Header Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center space-x-4">
                  <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
                    <Clock size={24} />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider">
                      Pendentes
                    </span>
                    <span className="text-2xl font-black text-slate-800">
                      {pendingCount}
                    </span>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center space-x-4">
                  <div className="p-3 bg-green-50 text-green-600 rounded-2xl">
                    <CheckCircle2 size={24} />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider">
                      Aprovados
                    </span>
                    <span className="text-2xl font-black text-slate-800">
                      {approvedCount}
                    </span>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center space-x-4">
                  <div className="p-3 bg-red-50 text-red-600 rounded-2xl">
                    <XCircle size={24} />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider">
                      Recusados
                    </span>
                    <span className="text-2xl font-black text-slate-800">
                      {rejectedCount}
                    </span>
                  </div>
                </div>
              </div>

              <section className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">
                      Solicitações de Folgas e Férias
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Líder/FDV aprova para Sala de Matrícula e outros
                      Líderes/FDV | Gestores aprovam para FDV / FDV Comercial
                    </p>
                  </div>

                  {/* Filter controls */}
                  <div className="flex bg-slate-50 border border-slate-100 p-1 rounded-xl font-bold text-xs">
                    {(
                      ["Todos", "Pendente", "Aprovado", "Recusado"] as const
                    ).map((f) => (
                      <button
                        key={f}
                        onClick={() => setStatusFilter(f)}
                        className={`px-3 py-1.5 rounded-lg transition-all ${
                          statusFilter === f
                            ? "bg-blue-600 text-white shadow-sm font-semibold"
                            : "text-slate-500 hover:text-slate-800 font-semibold"
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>

                {loadingAdminRequests ? (
                  <div className="flex justify-center items-center py-12 text-slate-400">
                    <RefreshCw
                      size={28}
                      className="animate-spin text-blue-600 mr-2"
                    />
                    <span className="font-semibold text-sm">
                      Carregando solicitações...
                    </span>
                  </div>
                ) : filteredRequests.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 text-sm">
                    Nenhuma solicitação de folga ou férias para exibir sob sua
                    responsabilidade de aprovação.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-100">
                          <th className="px-6 py-4">Funcionário / Cargo</th>
                          <th className="px-6 py-4">Tipo</th>
                          <th className="px-6 py-4">Período</th>
                          <th className="px-6 py-4">Justificativa</th>
                          <th className="px-6 py-4">Status</th>
                          <th className="px-6 py-4">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                        {filteredRequests
                          .filter(
                            (r) =>
                              statusFilter === "Todos" ||
                              r.status === statusFilter,
                          )
                          .map((request) => {
                            const isApproved = request.status === "Aprovado";
                            const isRejected = request.status === "Recusado";
                            const isPending = request.status === "Pendente";

                            // Helper to format date with DD/MM/YYYY
                            const formatBrDate = (d: string) => {
                              if (!d) return "";
                              const parts = d.split("-");
                              return parts.length === 3
                                ? `${parts[2]}/${parts[1]}/${parts[0]}`
                                : d;
                            };

                            return (
                              <tr
                                key={request.id}
                                className="hover:bg-slate-50/50 transition-colors"
                              >
                                <td className="px-6 py-4">
                                  <div className="flex items-center space-x-3">
                                    <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center font-bold text-xs mt-0.5">
                                      {request.solicitanteNome?.charAt(0) ||
                                        "U"}
                                    </div>
                                    <div>
                                      <span className="font-bold text-slate-900 block">
                                        {request.solicitanteNome}
                                      </span>
                                      <span className="text-[10px] text-slate-400 font-medium block">
                                        {request.solicitanteRole}
                                      </span>
                                    </div>
                                  </div>
                                </td>

                                <td className="px-6 py-4">
                                  <span
                                    className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                      request.tipo === "Férias"
                                        ? "bg-purple-100 text-purple-700"
                                        : "bg-blue-100 text-blue-700"
                                    }`}
                                  >
                                    {request.tipo}
                                  </span>
                                </td>

                                <td className="px-6 py-4 font-semibold text-slate-800">
                                  <span className="text-blue-600 font-bold">
                                    {formatBrDate(request.dataInicio)}
                                  </span>
                                  <span className="mx-1 text-slate-400">
                                    até
                                  </span>
                                  <span className="text-blue-600 font-bold">
                                    {formatBrDate(request.dataFim)}
                                  </span>
                                </td>

                                <td className="px-6 py-4 max-w-xs truncate text-[11px] text-slate-500 italic">
                                  {request.justificativa
                                    ? `"${request.justificativa}"`
                                    : "-"}
                                </td>

                                <td className="px-6 py-4">
                                  <span
                                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                      isApproved
                                        ? "bg-green-100 text-green-700"
                                        : isRejected
                                          ? "bg-red-100 text-red-700"
                                          : "bg-amber-100 text-amber-700"
                                    }`}
                                  >
                                    {isApproved && <Check size={10} />}
                                    {isRejected && <X size={10} />}
                                    {isPending && <Clock size={10} />}
                                    {request.status}
                                  </span>
                                  {request.aprovadoPorNome && (
                                    <span className="block text-[9px] text-slate-400 mt-0.5 font-medium">
                                      Por {request.aprovadoPorNome}
                                    </span>
                                  )}
                                </td>

                                <td className="px-6 py-4">
                                  {isPending ? (
                                    <div className="flex items-center space-x-2">
                                      <button
                                        onClick={() =>
                                          handleDecideRequest(
                                            request,
                                            "Aprovado",
                                          )
                                        }
                                        className="px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold text-[10px] flex items-center gap-1 transition-all"
                                      >
                                        <Check size={10} />
                                        <span>Aprovar</span>
                                      </button>
                                      <button
                                        onClick={() =>
                                          handleDecideRequest(
                                            request,
                                            "Recusado",
                                          )
                                        }
                                        className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-[10px] flex items-center gap-1 transition-all"
                                      >
                                        <X size={10} />
                                        <span>Recusar</span>
                                      </button>
                                    </div>
                                  ) : (
                                    <span className="text-[10px] text-slate-400 font-medium">
                                      Decidido
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </div>
          );
        })()}

      {activeTab === "bomDia" && (
        <div className="space-y-8">
          <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-900">
                {editingBomDia ? "Editar Card" : "Adicionar Novo Card"}
              </h3>
              {editingBomDia && (
                <button
                  onClick={() => {
                    setEditingBomDia(null);
                    setNewBomDia({
                      titulo: "",
                      metaFinal: { insc: 0, matFin: 0, matAcad: 0 },
                      metaDia: { insc: 0, matFin: 0, matAcad: 0 },
                      anoAnterior: { insc: 0, matFin: 0, matAcad: 0 },
                      real: { insc: 0, matFin: 0, matAcad: 0 },
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
                  onChange={(e) =>
                    setNewBomDia({ ...newBomDia, titulo: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                />
              </div>

              {[
                {
                  key: "metaFinal",
                  label: "Meta Final",
                  color: "border-orange-200 bg-orange-50/30",
                },
                {
                  key: "metaDia",
                  label: "Meta Dia",
                  color: "border-slate-200 bg-slate-50/30",
                },
                {
                  key: "anoAnterior",
                  label: "Ano Anterior",
                  color: "border-slate-200 bg-slate-50/30",
                },
                {
                  key: "real",
                  label: "Real",
                  color: "border-blue-200 bg-blue-50/30",
                },
              ].map((section) => (
                <div
                  key={section.key}
                  className={cn("p-4 rounded-2xl border", section.color)}
                >
                  <h4 className="text-sm font-bold text-slate-700 mb-4">
                    {section.label}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                        INSC *
                      </label>
                      <input
                        type="number"
                        required
                        value={
                          (newBomDia[section.key as keyof typeof newBomDia] as any).insc
                        }
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setNewBomDia({
                            ...newBomDia,
                            [section.key]: {
                              ...(newBomDia[
                                section.key as keyof typeof newBomDia
                              ] as BomDiaMetrics),
                              insc: val,
                            },
                          });
                        }}
                        className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                        MAT FIN *
                      </label>
                      <input
                        type="number"
                        required
                        value={
                          (newBomDia[section.key as keyof typeof newBomDia] as any)
                            .matFin
                        }
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setNewBomDia({
                            ...newBomDia,
                            [section.key]: {
                              ...(newBomDia[
                                section.key as keyof typeof newBomDia
                              ] as BomDiaMetrics),
                              matFin: val,
                            },
                          });
                        }}
                        className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                        MAT ACAD *
                      </label>
                      <input
                        type="number"
                        required
                        value={
                          (newBomDia[section.key as keyof typeof newBomDia] as any)
                            .matAcad
                        }
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setNewBomDia({
                            ...newBomDia,
                            [section.key]: {
                              ...(newBomDia[
                                section.key as keyof typeof newBomDia
                              ] as BomDiaMetrics),
                              matAcad: val,
                            },
                          });
                        }}
                        className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm"
                      />
                    </div>
                  </div>
                </div>
              ))}

              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
              >
                Salvar Card Bom Dia
              </button>
            </form>
          </section>

          <section className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-xl font-bold text-slate-900">
                Cards Cadastrados
              </h3>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {bomDia.map((card) => (
                <div
                  key={card.id}
                  className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center"
                >
                  <div>
                    <p className="font-bold text-slate-900">{card.titulo}</p>
                    <p className="text-[10px] text-slate-500">
                      {formatLocalDateString(card.data)}
                    </p>
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
                          real: card.real,
                        });
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={async () => {
                        if (window.confirm("Deseja excluir este card?")) {
                          try {
                            await deleteDoc(
                              doc(db, COLLECTIONS.BOM_DIA, card.id),
                            );
                            onToast("Card removido.");
                          } catch (err: any) {
                            onToast("Erro ao excluir card.", "error");
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
              {bomDia.length === 0 && (
                <p className="col-span-full text-center text-slate-400 italic py-8">
                  Nenhum card cadastrado.
                </p>
              )}
            </div>
          </section>
        </div>
      )}

      {activeTab === "forecast" && (
        <div className="space-y-8">
          <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-slate-900">
                {editingForecast ? "Editar Forecast" : "Novo Forecast"}
              </h3>
              {editingForecast && (
                <button
                  onClick={() => {
                    setEditingForecast(null);
                    setNewForecast({
                      nome: "",
                      dataInicio: new Date().toISOString().split("T")[0],
                      dataFim: new Date().toISOString().split("T")[0],
                      metaDiaYTD: 0,
                      realizado: 0,
                      metaFechamento: 0,
                    });
                  }}
                  className="text-slate-400 hover:text-slate-600 text-sm font-bold"
                >
                  Cancelar Edição
                </button>
              )}
            </div>
            <form
              onSubmit={handleAddForecast}
              className="grid grid-cols-1 md:grid-cols-3 gap-4"
            >
              <div className="md:col-span-3">
                <label className="block text-xs font-bold text-slate-500 mb-1">
                  Nome do Forecast
                </label>
                <input
                  required
                  value={newForecast.nome}
                  onChange={(e) =>
                    setNewForecast({ ...newForecast, nome: e.target.value })
                  }
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm"
                  placeholder="Ex: Captação 2024.2"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">
                  Data Início
                </label>
                <input
                  type="date"
                  required
                  value={newForecast.dataInicio}
                  onChange={(e) =>
                    setNewForecast({
                      ...newForecast,
                      dataInicio: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">
                  Data Final
                </label>
                <input
                  type="date"
                  required
                  value={newForecast.dataFim}
                  onChange={(e) =>
                    setNewForecast({ ...newForecast, dataFim: e.target.value })
                  }
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">
                  Meta Dia (YTD)
                </label>
                <input
                  type="number"
                  required
                  value={newForecast.metaDiaYTD}
                  onChange={(e) =>
                    setNewForecast({
                      ...newForecast,
                      metaDiaYTD: Number(e.target.value),
                    })
                  }
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">
                  Realizado
                </label>
                <input
                  type="number"
                  required
                  value={newForecast.realizado}
                  onChange={(e) =>
                    setNewForecast({
                      ...newForecast,
                      realizado: Number(e.target.value),
                    })
                  }
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">
                  Meta Fechamento
                </label>
                <input
                  type="number"
                  required
                  value={newForecast.metaFechamento}
                  onChange={(e) =>
                    setNewForecast({
                      ...newForecast,
                      metaFechamento: Number(e.target.value),
                    })
                  }
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm"
                />
              </div>
              <button
                type="submit"
                className="md:col-span-3 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-all"
              >
                Criar Forecast
              </button>
            </form>
          </section>

          <section className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-xl font-bold text-slate-900">
                Forecasts Ativos
              </h3>
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
                  {[...forecast]
                    .sort((a, b) => a.nome.localeCompare(b.nome))
                    .map((f) => {
                    const percYTD =
                      f.metaDiaYTD > 0
                        ? ((f.realizado / f.metaDiaYTD) * 100).toFixed(1)
                        : "0";
                    const percFech =
                      f.metaFechamento > 0
                        ? ((f.realizado / f.metaFechamento) * 100).toFixed(1)
                        : "0";
                    const gapFech = f.realizado - f.metaFechamento;

                    const diasRestantes = getWorkingDaysRemaining(f.dataFim);
                    const pacing =
                      f.realizado >= f.metaFechamento
                        ? "0"
                        : (
                            Math.abs(gapFech) / Math.max(1, diasRestantes)
                          ).toFixed(1);

                    return (
                      <tr
                        key={f.id}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        <td className="px-4 py-4 font-bold text-slate-900">
                          {f.nome}
                        </td>
                        <td className="px-4 py-4 text-slate-500">
                          {f.dataInicio
                            .split("T")[0]
                            .split("-")
                            .reverse()
                            .join("/")}{" "}
                          -{" "}
                          {f.dataFim
                            .split("T")[0]
                            .split("-")
                            .reverse()
                            .join("/")}
                        </td>
                        <td className="px-4 py-4 font-bold text-blue-600">
                          {f.metaDiaYTD}
                        </td>
                        <td className="px-4 py-4 font-bold text-emerald-600">
                          {f.realizado}
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`px-2 py-1 rounded-full font-bold ${Number(percYTD) >= 100 ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"}`}
                          >
                            {percYTD}%
                          </span>
                        </td>
                        <td className="px-4 py-4 font-bold text-slate-700">
                          {f.metaFechamento}
                        </td>
                        <td className="px-4 py-4 font-bold text-blue-600">
                          {percFech}%
                        </td>
                        <td
                          className={`px-4 py-4 font-bold ${gapFech >= 0 ? "text-emerald-600" : "text-rose-600"}`}
                        >
                          {gapFech}
                        </td>
                        <td className="px-4 py-4 font-bold text-slate-900">
                          {pacing}/dia
                        </td>
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
                                  metaFechamento: f.metaFechamento,
                                });
                                window.scrollTo({ top: 0, behavior: "smooth" });
                              }}
                              className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={async () => {
                                if (
                                  window.confirm(
                                    "Deseja excluir este forecast?",
                                  )
                                ) {
                                  try {
                                    await deleteDoc(
                                      doc(db, COLLECTIONS.FORECAST, f.id),
                                    );
                                    onToast("Forecast removido.");
                                  } catch (err: any) {
                                    onToast(
                                      "Erro ao excluir forecast.",
                                      "error",
                                    );
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

      {activeTab === "planner" && (
        <div className="space-y-8">
          <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 max-w-4xl mx-auto">
            <h3 className="text-xl font-bold text-slate-900 mb-4">
              Novo Planner
            </h3>
            <form
              onSubmit={handleAddPlanner}
              className="grid grid-cols-1 md:grid-cols-3 gap-4"
            >
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">
                  Nome do Atendente
                </label>
                <input
                  required
                  value={newPlanner.atendenteName}
                  onChange={(e) =>
                    setNewPlanner({
                      ...newPlanner,
                      atendenteName: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">
                  Base a ser Trabalhada
                </label>
                <input
                  required
                  value={newPlanner.baseName}
                  onChange={(e) =>
                    setNewPlanner({ ...newPlanner, baseName: e.target.value })
                  }
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">
                  Dia da Semana
                </label>
                <select
                  value={newPlanner.dayOfWeek}
                  onChange={(e) =>
                    setNewPlanner({ ...newPlanner, dayOfWeek: e.target.value })
                  }
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm"
                >
                  {[
                    "Segunda-feira",
                    "Terça-feira",
                    "Quarta-feira",
                    "Quinta-feira",
                    "Sexta-feira",
                    "Sábado",
                  ].map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                className="md:col-span-3 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-all"
              >
                Adicionar ao Planner
              </button>
            </form>
          </section>

          <section className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-xl font-bold text-slate-900">
                Planner Configurado
              </h3>
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
                  {planner
                    .sort((a, b) => {
                      const days = [
                        "Segunda-feira",
                        "Terça-feira",
                        "Quarta-feira",
                        "Quinta-feira",
                        "Sexta-feira",
                        "Sábado",
                        "Domingo",
                      ];
                      return (
                        days.indexOf(a.dayOfWeek) - days.indexOf(b.dayOfWeek)
                      );
                    })
                    .map((p) => (
                      <tr
                        key={p.id}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        <td className="px-4 py-4 font-bold text-slate-900">
                          {p.dayOfWeek}
                        </td>
                        <td className="px-4 py-4 text-slate-700">
                          {p.atendenteName}
                        </td>
                        <td className="px-4 py-4 text-slate-500">
                          {p.baseName}
                        </td>
                        <td className="px-4 py-4">
                          <button
                            onClick={async () => {
                              if (window.confirm("Deseja excluir este item?")) {
                                await deleteDoc(
                                  doc(db, COLLECTIONS.PLANNER, p.id),
                                );
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

      {activeTab === "periodo" && (
        <div className="space-y-8">
          <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 max-w-4xl mx-auto">
            <h3 className="text-xl font-bold text-slate-900 mb-4">
              Novo Período de Captação
            </h3>
            <form
              onSubmit={handleAddPeriodo}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-500 mb-1">
                  Nome do Período
                </label>
                <input
                  required
                  value={newPeriodo.nome}
                  onChange={(e) =>
                    setNewPeriodo({ ...newPeriodo, nome: e.target.value })
                  }
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm"
                  placeholder="Ex: 2024.2"
                />
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                <h4 className="text-sm font-bold text-slate-700">Inscrição</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                      Início
                    </label>
                    <input
                      type="date"
                      required
                      value={newPeriodo.inicioInscricao}
                      onChange={(e) =>
                        setNewPeriodo({
                          ...newPeriodo,
                          inicioInscricao: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                      Fim
                    </label>
                    <input
                      type="date"
                      required
                      value={newPeriodo.fimInscricao}
                      onChange={(e) =>
                        setNewPeriodo({
                          ...newPeriodo,
                          fimInscricao: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs"
                    />
                  </div>
                </div>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                <h4 className="text-sm font-bold text-slate-700">Mat Fin</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                      Início
                    </label>
                    <input
                      type="date"
                      required
                      value={newPeriodo.inicioMatFin}
                      onChange={(e) =>
                        setNewPeriodo({
                          ...newPeriodo,
                          inicioMatFin: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                      Fim
                    </label>
                    <input
                      type="date"
                      required
                      value={newPeriodo.fimMatFin}
                      onChange={(e) =>
                        setNewPeriodo({
                          ...newPeriodo,
                          fimMatFin: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs"
                    />
                  </div>
                </div>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                <h4 className="text-sm font-bold text-slate-700">Mat Acad</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                      Início
                    </label>
                    <input
                      type="date"
                      required
                      value={newPeriodo.inicioMatAcad}
                      onChange={(e) =>
                        setNewPeriodo({
                          ...newPeriodo,
                          inicioMatAcad: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                      Fim
                    </label>
                    <input
                      type="date"
                      required
                      value={newPeriodo.fimMatAcad}
                      onChange={(e) =>
                        setNewPeriodo({
                          ...newPeriodo,
                          fimMatAcad: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs"
                    />
                  </div>
                </div>
              </div>
              <button
                type="submit"
                className="md:col-span-2 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-all"
              >
                Salvar Período
              </button>
            </form>
          </section>

          <section className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-xl font-bold text-slate-900">
                Períodos Cadastrados
              </h3>
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
                  {periodos.map((p) => (
                    <tr
                      key={p.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-4 py-4 font-bold text-slate-900">
                        {p.nome}
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-slate-700">
                          {formatLocalDateString(p.inicioInscricao)} -{" "}
                          {formatLocalDateString(p.fimInscricao)}
                        </p>
                        <p className="text-blue-600 font-bold">
                          {getWorkingDaysBetween(
                            p.inicioInscricao,
                            p.fimInscricao,
                          )}{" "}
                          dias úteis
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-slate-700">
                          {formatLocalDateString(p.inicioMatFin)} -{" "}
                          {formatLocalDateString(p.fimMatFin)}
                        </p>
                        <p className="text-blue-600 font-bold">
                          {getWorkingDaysBetween(p.inicioMatFin, p.fimMatFin)}{" "}
                          dias úteis
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-slate-700">
                          {formatLocalDateString(p.inicioMatAcad)} -{" "}
                          {formatLocalDateString(p.fimMatAcad)}
                        </p>
                        <p className="text-blue-600 font-bold">
                          {getWorkingDaysBetween(p.inicioMatAcad, p.fimMatAcad)}{" "}
                          dias úteis
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <button
                          onClick={async () => {
                            if (
                              window.confirm("Deseja excluir este período?")
                            ) {
                              await deleteDoc(
                                doc(db, COLLECTIONS.PERIODO_CAPTACAO, p.id),
                              );
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

      {activeTab === "whatsapp" && (
        <div className="space-y-6">
          <section className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-xl font-bold text-slate-900">
                Integração Bot ARGO'S
              </h3>
              <p className="text-slate-500 text-sm">
                Configure a conexão com a inteligência artificial
              </p>
            </div>
            <div className="p-6">
              <div className="flex flex-col gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    URL do App Railway (API do Bot)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="https://seu-app-no-railway.app"
                      defaultValue={botConfig.url}
                      onBlur={async (e) => {
                        let newUrl = e.target.value.trim();
                        if (
                          newUrl &&
                          !newUrl.startsWith("http://") &&
                          !newUrl.startsWith("https://")
                        ) {
                          newUrl = `https://${newUrl}`;
                          e.target.value = newUrl;
                        }
                        if (newUrl === botConfig.url) return;
                        try {
                          await setDoc(
                            doc(db, COLLECTIONS.BOT_CONFIG, "main"),
                            {
                              url: newUrl,
                              active: botConfig.active || false,
                              updatedAt: serverTimestamp(),
                            },
                            { merge: true },
                          );
                          onToast("URL do Bot atualizada!");
                        } catch (err: any) {
                          onToast(
                            `Erro ao salvar URL: ${err.message}`,
                            "error",
                          );
                        }
                      }}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    />
                    <button
                      onClick={async () => {
                        if (!botConfig.url) {
                          onToast("Insira uma URL primeiro.", "error");
                          return;
                        }
                        try {
                          const data = await callBotApi("/api/status");
                          onToast(
                            `Servidor online! Status: ${data.name || "OK"}`,
                            "success",
                          );
                        } catch (e: any) {
                          onToast(
                            `Falha de rede (CORS/Offline): O Railway pode estar reiniciando o bot ou o bot está quebrado. Erro: ${e.message}`,
                            "error",
                          );
                        }
                      }}
                      className="bg-blue-100 text-blue-700 px-4 py-3 rounded-xl hover:bg-blue-200 transition-colors whitespace-nowrap text-sm font-bold"
                    >
                      Testar Conexão
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Insira a URL base do servidor onde seu bot está rodando (ex:
                    https://meubot.up.railway.app).
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    Chave de API do Groq (GROQ_API_KEY)
                  </label>
                  <input
                    type="password"
                    placeholder="gsk_..."
                    defaultValue={botConfig.groqApiKey || ""}
                    onBlur={async (e) => {
                      const newKey = e.target.value.trim();
                      if (newKey === (botConfig.groqApiKey || "")) return;
                      try {
                        await setDoc(
                          doc(db, COLLECTIONS.BOT_CONFIG, "main"),
                          {
                            groqApiKey: newKey,
                            updatedAt: serverTimestamp(),
                          },
                          { merge: true },
                        );
                        onToast("Chave da API do Groq atualizada com sucesso!");
                      } catch (err: any) {
                        onToast(
                          `Erro ao salvar chave da API do Groq: ${err.message}`,
                          "error",
                        );
                      }
                    }}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Esta chave é utilizada diretamente pelo servidor do Goorq para processar relatórios de IA e realizar a correspondência inteligente de insumos via modelos Llama da Groq.
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-slate-800">
                      Gestão de Sessões WhatsApp (Multi-Device)
                    </h3>
                    <div className="flex gap-2">
                      <button
                        onClick={async () => {
                          if (!botConfig.url) return;
                          if (
                            window.confirm(
                              "Tem certeza que deseja resetar TODAS as sessões criptografadas? (Esta ação apagará a pasta corrompida e solicitará nova conexão em todos os números)",
                            )
                          ) {
                            try {
                              await callBotApi("/api/reset", {
                                method: "POST",
                              });
                              onToast(
                                "A Rota Mágica de Reset foi ativada. Todas as sessões foram apagadas e o bot será reiniciado.",
                                "success",
                              );
                              setBotStatuses({});
                            } catch (err: any) {
                              onToast(
                                `Erro ao resetar: ${err.message}`,
                                "error",
                              );
                            }
                          }
                        }}
                        className="bg-red-600 text-white text-xs px-3 py-2 rounded-lg font-bold hover:bg-red-700 transition"
                      >
                        Resetar Sessões (Pasta Corrompida)
                      </button>
                      <button
                        onClick={async () => {
                          const num = prompt(
                            "Digite o número no formato 5511999999999:",
                          );
                          if (num) {
                            const botNumber = num.replace(/\D/g, "");
                            if (!botNumber) return;
                            if (!botConfig || !botConfig.url) {
                              onToast(
                                "Configura a URL do bot primeiro.",
                                "error",
                              );
                              return;
                            }
                            try {
                              await callBotApi("/api/connect", {
                                method: "POST",
                                body: { botNumber },
                              });
                              onToast(
                                "Solicitação enviada! Aguarde alguns segundos o QR Code.",
                              );
                              // Force a status check after 3 seconds
                              setTimeout(async () => {
                                try {
                                  const data = await callBotApi("/api/status");
                                  if (data && data.bots)
                                    setBotStatuses(data.bots);
                                } catch (e) {}
                              }, 3000);
                            } catch (err: any) {
                              onToast(
                                `Servidor offline ou reiniciando... ${err.message}`,
                                "error",
                              );
                            }
                          }
                        }}
                        className="bg-green-600 text-white text-xs px-3 py-2 rounded-lg font-bold hover:bg-green-700 transition"
                      >
                        + Novo Número
                      </button>
                    </div>
                  </div>

                  {Object.keys(botStatuses || {}).length === 0 ? (
                    <p className="text-sm text-slate-500 italic">
                      Nenhum número conectado ou conectando. Adicione um
                      clicando no botão acima.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(botStatuses || {}).map(
                        ([botNumber, info]) => {
                          const userForBot = users.find(
                            (u) =>
                              u.botNumber &&
                              u.botNumber.replace(/\D/g, "") ===
                                botNumber.replace(/\D/g, ""),
                          );
                          const nameForBot = userForBot
                            ? userForBot.name
                            : botConfig.botNames?.[botNumber] || "";

                          return (
                            <div
                              key={botNumber}
                              className="border border-slate-200 rounded-xl p-4 flex flex-col gap-2"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex flex-col">
                                  <div className="font-bold text-slate-700 text-lg">
                                    {botNumber}
                                  </div>
                                  <div className="flex items-center mt-1">
                                    <span className="text-[10px] text-slate-500 mr-1 uppercase font-bold tracking-wider">
                                      Resp:
                                    </span>
                                    {userForBot ? (
                                      <span className="text-xs font-bold text-blue-600 truncate max-w-[150px]">
                                        {userForBot.name} (Auto)
                                      </span>
                                    ) : (
                                      <input
                                        type="text"
                                        className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs w-32 focus:ring-1 focus:ring-blue-500 focus:outline-none text-slate-600"
                                        placeholder="Nome"
                                        defaultValue={nameForBot}
                                        onBlur={async (e) => {
                                          const newName = e.target.value;
                                          try {
                                            await updateDoc(
                                              doc(
                                                db,
                                                COLLECTIONS.BOT_CONFIG,
                                                "main",
                                              ),
                                              {
                                                [`botNames.${botNumber}`]:
                                                  newName,
                                              },
                                            );
                                          } catch (err) {}
                                        }}
                                      />
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <span
                                    className={`px-2 py-1 rounded-full text-xs font-bold ${info?.status === "online" ? "bg-green-100 text-green-700" : info?.status === "pairing" ? "bg-orange-100 text-orange-700" : "bg-red-100 text-red-700"}`}
                                  >
                                    {info?.status?.toUpperCase() ||
                                      "DESCONHECIDO"}
                                  </span>
                                  <button
                                    onClick={async () => {
                                      if (
                                        window.confirm(
                                          `Tem certeza que deseja apagar a sessão do bot ${botNumber}?`,
                                        )
                                      ) {
                                        try {
                                          await callBotApi("/api/reset", {
                                            method: "POST",
                                            body: { botNumber },
                                          });
                                          onToast(
                                            `Sessão ${botNumber} apagada.`,
                                          );
                                          setTimeout(async () => {
                                            try {
                                              const data =
                                                await callBotApi("/api/status");
                                              setBotStatuses(data.bots || {});
                                            } catch (e) {}
                                          }, 1000);
                                        } catch (e: any) {
                                          onToast(
                                            `Erro ao apagar sessão: ${e.message}`,
                                            "error",
                                          );
                                        }
                                      }
                                    }}
                                    className="text-red-500 hover:text-red-700 px-2 py-1 bg-red-50 rounded-lg transition"
                                    title="Apagar sessão do Railway"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </div>

                              {info?.status === "pairing" &&
                                (info?.pairingCode || info?.qrUrl) && (
                                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 mt-2 text-center flex flex-col gap-4 items-center">
                                    {info?.qrUrl && (
                                      <div>
                                        <p className="text-xs text-slate-500 mb-2">
                                          Escaneie o QR Code:
                                        </p>
                                        <img
                                          src={info.qrUrl}
                                          alt="QR Code WhatsApp"
                                          className="mx-auto rounded"
                                        />
                                      </div>
                                    )}

                                    {info?.pairingCode && (
                                      <div>
                                        <p className="text-xs text-slate-500 mb-1">
                                          {info?.qrUrl ? "Ou use" : "Use"} o
                                          Pairing Code:
                                        </p>
                                        <p className="text-2xl tracking-widest font-mono font-bold text-slate-800">
                                          {info.pairingCode}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                )}

                              {info?.status === "online" && (
                                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
                                  <span className="text-xs font-bold text-slate-600">
                                    Auto-Reply (IA)
                                  </span>
                                  <div className="flex items-center space-x-2">
                                    <button
                                      onClick={async () => {
                                        const currentActive =
                                          (info as any)?.isAutoReplyActive ??
                                          (info as any)?.active ??
                                          false;
                                        const newActive = !currentActive;

                                        // Optimistic update
                                        setBotStatuses((prev) => ({
                                          ...prev,
                                          [botNumber]: {
                                            ...prev[botNumber],
                                            active: newActive,
                                            isAutoReplyActive: newActive,
                                          },
                                        }));

                                        try {
                                          await callBotApi("/api/toggle", {
                                            method: "POST",
                                            body: {
                                              botNumber,
                                              active: newActive,
                                              isAutoReplyActive: newActive,
                                            },
                                          });
                                          onToast(
                                            `IA para ${botNumber} alterada para ${newActive ? "ON" : "OFF"}`,
                                          );
                                        } catch (e: any) {
                                          onToast(
                                            `Erro ao alterar IA para ${botNumber}: ${e.message}`,
                                            "error",
                                          );
                                          // Revert back
                                          setBotStatuses((prev) => ({
                                            ...prev,
                                            [botNumber]: {
                                              ...prev[botNumber],
                                              active: !newActive,
                                              isAutoReplyActive: !newActive,
                                            },
                                          }));
                                        }
                                      }}
                                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${((info as any)?.isAutoReplyActive ?? (info as any)?.active ?? false) ? "bg-blue-600" : "bg-slate-200"}`}
                                    >
                                      <span
                                        className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${((info as any)?.isAutoReplyActive ?? (info as any)?.active ?? false) ? "translate-x-5" : "translate-x-1"}`}
                                      />
                                    </button>
                                    <span className="text-[10px] text-slate-500">
                                      {((info as any)?.isAutoReplyActive ??
                                      (info as any)?.active ??
                                      false)
                                        ? "ON"
                                        : "OFF"}
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        },
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-xl font-bold text-slate-900">
                Mensagens Padrão do WhatsApp
              </h3>
              <p className="text-slate-500 text-sm">
                Gerencie múltiplos modelos de mensagens para cada categoria
              </p>
            </div>
            <div className="p-6 space-y-12">
              {[
                { id: "historico", label: "Histórico", multi: true },
                { id: "bases", label: "Bases", multi: true },
                {
                  id: "gap",
                  label: "GAP Acadêmico",
                  multi: false,
                  subLabels: ["Padrão", "Matrícula Acadêmica OK"],
                },
                {
                  id: "fiesProuni",
                  label: "Fies/Prouni",
                  multi: false,
                  subLabels: ["Padrão", "Matrícula Acadêmica OK"],
                },
                { id: "bases_renovacao", label: "Base Líquida", multi: true },
              ].map((tipo) => {
                const messages = whatsappMessages.filter(
                  (m) => m.tipo === tipo.id,
                );

                if (tipo.multi) {
                  return (
                    <div
                      key={tipo.id}
                      className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden mb-8"
                    >
                      <div className="flex justify-between items-center bg-slate-50 p-5 border-b border-slate-200">
                        <div>
                          <h4 className="text-base font-bold text-slate-800 uppercase tracking-wider">
                            {tipo.label}
                          </h4>
                          <p className="text-xs text-slate-500 mt-1">
                            Modelos de mensagens para {tipo.label.toLowerCase()}
                          </p>
                        </div>
                        <button
                          onClick={async () => {
                            try {
                              await addDoc(
                                collection(db, COLLECTIONS.WHATSAPP_MESSAGES),
                                {
                                  tipo: tipo.id,
                                  texto: "",
                                  createdAt: serverTimestamp(),
                                },
                              );
                              onToast("Novo modelo adicionado!");
                            } catch (err: any) {
                              onToast("Erro ao adicionar modelo.", "error");
                            }
                          }}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold flex items-center space-x-2 shadow-sm transition-all"
                        >
                          <Plus size={16} />
                          <span>Novo Modelo</span>
                        </button>
                      </div>
                      <div className="p-6 grid grid-cols-1 gap-6 bg-slate-50/50">
                        {messages.map((msg, idx) => (
                          <WhatsAppMessageEditor
                            key={msg.id}
                            msgId={msg.id}
                            initialText={msg.texto}
                            label={`MODELO ${idx + 1} - ${tipo.label}`}
                            onUpdate={async (novoTexto) => {
                              if (novoTexto === msg.texto) return;
                              try {
                                await updateDoc(
                                  doc(
                                    db,
                                    COLLECTIONS.WHATSAPP_MESSAGES,
                                    msg.id,
                                  ),
                                  {
                                    texto: novoTexto,
                                    updatedAt: serverTimestamp(),
                                  },
                                );
                                onToast("Modelo atualizado!");
                              } catch (err: any) {
                                onToast("Erro ao salvar.", "error");
                              }
                            }}
                            onDelete={async () => {
                              if (window.confirm("Excluir este modelo?")) {
                                await deleteDoc(
                                  doc(
                                    db,
                                    COLLECTIONS.WHATSAPP_MESSAGES,
                                    msg.id,
                                  ),
                                );
                                onToast("Modelo removido.");
                              }
                            }}
                          />
                        ))}
                        {messages.length === 0 && (
                          <div className="text-center py-8 text-slate-400 text-sm border-2 border-dashed border-slate-200 rounded-xl">
                            Nenhum modelo cadastrado. Clique em "Novo Modelo"
                            para adicionar.
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={tipo.id}
                    className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden mb-8"
                  >
                    <div className="bg-slate-50 p-5 border-b border-slate-200 flex justify-between items-center">
                      <div>
                        <h4 className="text-base font-bold text-slate-800 uppercase tracking-wider">
                          {tipo.label}
                        </h4>
                        <p className="text-xs text-slate-500 mt-1">
                          Modelos de mensagens para {tipo.label.toLowerCase()}
                        </p>
                      </div>
                    </div>
                    <div className="p-6 grid grid-cols-1 gap-6 bg-slate-50/50">
                      {tipo.subLabels?.map((label, idx) => {
                        const subtypeId = `${tipo.id}_${idx}`;
                        const msg = whatsappMessages.find(
                          (m) => m.tipo === subtypeId,
                        );
                        return (
                          <WhatsAppMessageEditor
                            key={subtypeId}
                            msgId={msg?.id || subtypeId}
                            initialText={msg?.texto || ""}
                            label={`${tipo.label} - ${label}`}
                            onUpdate={async (novoTexto) => {
                              if (novoTexto === (msg?.texto || "")) return;
                              try {
                                if (msg) {
                                  await updateDoc(
                                    doc(
                                      db,
                                      COLLECTIONS.WHATSAPP_MESSAGES,
                                      msg.id,
                                    ),
                                    {
                                      texto: novoTexto,
                                      updatedAt: serverTimestamp(),
                                    },
                                  );
                                } else {
                                  await addDoc(
                                    collection(
                                      db,
                                      COLLECTIONS.WHATSAPP_MESSAGES,
                                    ),
                                    {
                                      tipo: subtypeId,
                                      texto: novoTexto,
                                      createdAt: serverTimestamp(),
                                    },
                                  );
                                }
                                onToast("Mensagem atualizada!");
                              } catch (err: any) {
                                onToast("Erro ao salvar.", "error");
                              }
                            }}
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      )}

      {activeTab === "treinamento" && (
        <section className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden max-w-4xl mx-auto">
          <div className="p-6 border-b border-slate-100">
            <h3 className="text-xl font-bold text-slate-900">
              Treinamento do Bot
            </h3>
            <p className="text-slate-500 text-sm">
              Insira o texto sobre a sua empresa para refinar as respostas da
              IA.
            </p>
          </div>
          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Contexto da Empresa
              </label>
              <textarea
                placeholder="Insira aqui informações sobre preços, cursos, política da empresa..."
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm min-h-[300px]"
                defaultValue={botConfig.trainingContext || ""}
                onBlur={async (e) => {
                  const newContext = e.target.value.trim();
                  if (newContext === botConfig.trainingContext) return;
                  try {
                    await setDoc(
                      doc(db, COLLECTIONS.BOT_CONFIG, "main"),
                      {
                        trainingContext: newContext,
                        updatedAt: serverTimestamp(),
                      },
                      { merge: true },
                    );
                    onToast("Treinamento do Bot atualizado!");
                  } catch (err: any) {
                    onToast(
                      `Erro ao salvar treinamento: ${err.message}`,
                      "error",
                    );
                  }
                }}
              />
              <p className="text-xs text-slate-400 mt-2">
                Dica: Quanto mais claro e objetivo for o texto, melhores serão
                as respostas da IA.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
                {isProcessingPdf ? (
                  <span className="animate-spin text-xl font-bold">...</span>
                ) : (
                  <span className="font-bold text-xl">PDF</span>
                )}
              </div>
              <h4 className="font-bold text-slate-800 mb-2">
                Treinamento via PDF
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mb-4">
                Faça o upload de um arquivo PDF para extrair o texto
                automaticamente e anexá-lo ao contexto da empresa.
              </p>
              <label className="cursor-pointer bg-blue-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-blue-700 transition-colors">
                {isProcessingPdf ? "Processando..." : "Selecionar PDF"}
                <input
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={handlePdfUpload}
                  disabled={isProcessingPdf}
                />
              </label>
            </div>
          </div>
        </section>
      )}

      {activeTab === "logo" && (
        <section className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden max-w-4xl mx-auto">
          <div className="p-6 border-b border-slate-100">
            <h3 className="text-xl font-bold text-slate-900">
              Customizar Logotipo de Login
            </h3>
            <p className="text-slate-500 text-sm">
              Faça o upload da imagem ou marca que aparecerá na tela de login de
              todos os usuários.
            </p>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Upload do Novo Logotipo
                </label>

                <div
                  className={`border-2 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                    isUploadingLogo
                      ? "border-blue-300 bg-blue-50/50"
                      : "border-slate-200 hover:border-blue-400 hover:bg-slate-50"
                  }`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onDrop={async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const file = e.dataTransfer.files?.[0];
                    if (file) {
                      await handleLogoUploadProcess(file);
                    }
                  }}
                  onClick={() => {
                    document.getElementById("logo-file-input")?.click();
                  }}
                >
                  <input
                    type="file"
                    id="logo-file-input"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        await handleLogoUploadProcess(file);
                      }
                    }}
                  />
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4">
                    {isUploadingLogo ? (
                      <span className="animate-spin text-sm">...</span>
                    ) : (
                      <Upload size={24} />
                    )}
                  </div>
                  <h4 className="font-bold text-slate-800 text-sm mb-1">
                    {isUploadingLogo
                      ? "Processando imagem..."
                      : "Arraste e solte o arquivo aqui"}
                  </h4>
                  <p className="text-xs text-slate-400">
                    ou clique para navegar no seu computador
                  </p>
                  <p className="text-[10px] text-slate-400 mt-2 font-mono">
                    Arquivos recomendados: PNG, JPG ou SVG (Max. 5MB)
                  </p>
                </div>
              </div>

              {logoPreview && (
                <div className="pt-2">
                  <button
                    onClick={async () => {
                      if (
                        window.confirm(
                          "Deseja realmente remover o logotipo personalizado e voltar ao ícone padrão?",
                        )
                      ) {
                        setIsUploadingLogo(true);
                        try {
                          await setDoc(
                            doc(db, COLLECTIONS.BOT_CONFIG, "main"),
                            {
                              loginLogo: "",
                            },
                            { merge: true },
                          );
                          setLogoPreview(null);
                          onToast("Logotipo removido com sucesso!");
                        } catch (err: any) {
                          onToast(
                            `Erro ao remover logotipo: ${err.message}`,
                            "error",
                          );
                        } finally {
                          setIsUploadingLogo(false);
                        }
                      }
                    }}
                    className="w-full text-center text-sm font-bold text-rose-500 hover:text-rose-600 hover:bg-rose-50 border border-rose-100 py-3 rounded-2xl transition-all cursor-pointer"
                  >
                    Remover Marca Customizada
                  </button>
                </div>
              )}
            </div>

            <div className="bg-[#011430] rounded-3xl p-8 flex flex-col justify-between border border-slate-800 min-h-[300px] text-white relative overflow-hidden select-none">
              <div className="absolute top-2 right-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[9px] font-mono tracking-widest rounded-full">
                SIMULAÇÃO DE LOGIN
              </div>
              <div className="absolute inset-0 bg-[radial-gradient(#1e3a8a_1px,transparent_1px)] [background-size:16px_16px] opacity-10 pointer-events-none" />

              <div className="my-auto space-y-4">
                <div>
                  {logoPreview ? (
                    <div className="mb-4 flex">
                      <img
                        src={logoPreview}
                        alt="Preview Logo"
                        className="max-h-16 max-w-full rounded-xl object-contain drop-shadow-md border border-slate-700/50 p-1 bg-[#011a3c]"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  ) : (
                    <div className="w-12 h-12 bg-gradient-to-tr from-sky-500 to-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg mb-4">
                      <TrendingUp size={24} />
                    </div>
                  )}
                  <h3 className="text-xl font-extrabold text-white tracking-tight">
                    Gestão Oeste pro
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Bem-vindo de volta! Insira suas credenciais:
                  </p>
                </div>

                <div className="space-y-2 pointer-events-none opacity-20">
                  <div className="w-full h-8 bg-slate-800 rounded-lg border border-slate-700" />
                  <div className="w-full h-8 bg-slate-800 rounded-lg border border-slate-700" />
                </div>

                <div className="w-full h-9 bg-slate-700 rounded-lg pointer-events-none opacity-25 mt-4" />
              </div>

              <div className="text-center text-[8px] text-slate-500 font-mono tracking-wider mt-4">
                OESTE HUNTER © 2026
              </div>
            </div>
          </div>
        </section>
      )}

      {activeTab === "links" && (
        <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 max-w-2xl mx-auto">
          <h3 className="text-xl font-bold text-slate-900 mb-4">Links Úteis</h3>
          <form onSubmit={handleAddLink} className="flex gap-2 mb-6">
            <input
              placeholder="Nome"
              required
              value={newLink.nome}
              onChange={(e) => setNewLink({ ...newLink, nome: e.target.value })}
              className="flex-1 px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            />
            <input
              placeholder="URL"
              required
              value={newLink.url}
              onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
              className="flex-1 px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            />
            <button
              type="submit"
              className="bg-blue-600 text-white p-2 rounded-xl hover:bg-blue-700 transition-all"
            >
              <Plus size={20} />
            </button>
          </form>
          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
            {links.map((l) => (
              <div
                key={l.id}
                className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100"
              >
                <span className="text-sm font-bold text-slate-700">
                  {l.nome}
                </span>
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

      {activeTab === "funcionarios" && (
        <AdminFuncionariosView onToast={onToast} />
      )}

      {activeTab === "backup" && (
        <section className="bg-rose-50 p-6 rounded-3xl border border-rose-100 max-w-2xl mx-auto">
          <h3 className="text-xl font-bold text-rose-900 mb-4">
            Backup e Segurança
          </h3>
          <p className="text-sm text-rose-600 mb-6">
            Gere um arquivo JSON contendo todos os dados do sistema para
            segurança ou migração.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleBackup}
              className="flex-1 bg-white text-rose-600 border border-rose-200 font-bold py-3 rounded-2xl hover:bg-rose-100 transition-all flex items-center justify-center space-x-2"
            >
              <Download size={20} />
              <span>Gerar Backup</span>
            </button>
            <button className="flex-1 bg-rose-600 text-white font-bold py-3 rounded-2xl hover:bg-rose-700 transition-all flex items-center justify-center space-x-2">
              <Upload size={20} />
              <span>Restaurar Dados</span>
            </button>
          </div>
        </section>
      )}
    </div>
  );
}

// --- Controle de Pagamentos View ---
interface ControlePagamentosViewProps {
  calendarioAcoes: CalendarioAcao[];
  users: UserProfile[];
  onToast: (m: string, t?: "success" | "error") => void;
  profile?: UserProfile | null;
}

export function ControlePagamentosView({
  calendarioAcoes = [],
  users = [],
  onToast,
  profile,
}: ControlePagamentosViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [empresaFilter, setEmpresaFilter] = useState<"all" | "GR15" | "RP7">(
    "all",
  );
  const [statusFilter, setStatusFilter] = useState<
    "all" | "Pendente" | "Recusada" | "Realizada"
  >("all");
  const [regionFilter, setRegionFilter] = useState("all");

  const getDiarias = (startStr: string, endStr: string) => {
    if (!startStr || !endStr) return 1;
    const s = new Date(startStr + "T00:00:00");
    const e = new Date(endStr + "T00:00:00");
    const diffTime = Math.abs(e.getTime() - s.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return isNaN(diffDays) ? 1 : diffDays;
  };

  const paymentRows = useMemo(() => {
    const result: any[] = [];
    calendarioAcoes.forEach((action) => {
      if (!action.precisaPromotor || !action.promotoresSelecionados) return;
      action.promotoresSelecionados.forEach((pUid) => {
        // Apenas promotores que compareceram (presenca === true)
        if (!action.presencaPromotores?.[pUid]) return;

        const promoterObj = users.find((u) => u.uid === pUid);
        const creatorObj = users.find((u) => u.uid === action.creatorId);

        const details = action.dadosPresencaPromotores?.[pUid] || {
          empresa: "GR15",
          horas: 4,
        };
        let statusPgt = (action.statusPagamentoPromotores?.[pUid] as string) || "Pendente";
        if (statusPgt === "Agendada") statusPgt = "Pendente";

        const diarias = getDiarias(action.dataInicio, action.dataFim);
        const valorPromotor = action.valorPromotor || 0;
        const horasAtuadas = details.horas || 4;
        let valorDia = action.valorPromotor || 0;
        if (horasAtuadas === 4) valorDia = 60;
        else if (horasAtuadas === 6) valorDia = 90;
        else if (horasAtuadas === 8) valorDia = 100;
        else if (horasAtuadas === 10) valorDia = 150;
        
        const custoTotal = diarias * valorDia;

        result.push({
          actionId: action.id,
          promoterUid: pUid,
          empresa: details.empresa || "GR15",
          promoterName: promoterObj?.name || "Não cadastrado",
          promoterPhone: promoterObj?.phone || "Sem celular",
          promoterPix: promoterObj?.chavePix || "Sem Pix cadastrado",
          promoterUnit: promoterObj?.servidor
            ? promoterObj.servidor.charAt(0).toUpperCase() +
              promoterObj.servidor.slice(1)
            : "Principal",
          diarias,
          horas: horasAtuadas,
          solicitante:
            action.colaboradorNome ||
            (action.colaboradorId
              ? users.find((u) => u.uid === action.colaboradorId)?.name
              : null) ||
            creatorObj?.name ||
            "Gestor Comercial",
          tipoAcao: action.nome,
          dataInicio: action.dataInicio,
          dataFim: action.dataFim,
          valorDia,
          custoTotal,
          valorOrcado: action.valorOrcado || 0,
          statusPagamento: statusPgt,
        });
      });
    });
    return result;
  }, [calendarioAcoes, users]);

  // Regiões disponíveis de atuação para o filtro
  const uniqueRegions = useMemo(() => {
    const set = new Set<string>();
    paymentRows.forEach((r) => {
      if (r.promoterUnit) set.add(r.promoterUnit);
    });
    return Array.from(set);
  }, [paymentRows]);

  // Dados filtrados
  const filteredRows = useMemo(() => {
    return paymentRows.filter((row) => {
      const matchSearch =
        row.promoterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.tipoAcao.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.solicitante.toLowerCase().includes(searchTerm.toLowerCase());

      const matchEmpresa =
        empresaFilter === "all" ? true : row.empresa === empresaFilter;
      const matchStatus =
        statusFilter === "all" ? true : row.statusPagamento === statusFilter;
      const matchRegion =
        regionFilter === "all" ? true : row.promoterUnit === regionFilter;

      return matchSearch && matchEmpresa && matchStatus && matchRegion;
    });
  }, [paymentRows, searchTerm, empresaFilter, statusFilter, regionFilter]);

  const isReadOnly =
    profile?.role === ROLES.FDV_COMERCIAL ||
    profile?.role === ROLES.SALA_MATRICULA;

  // Métricas acumuladas
  const metrics = useMemo(() => {
    let totalCusto = 0;
    let totalRealizado = 0;
    let totalAgendado = 0;
    let totalRecusado = 0;

    filteredRows.forEach((row) => {
      totalCusto += row.custoTotal;
      if (row.statusPagamento === "Realizada") {
        totalRealizado += row.custoTotal;
      } else if (row.statusPagamento === "Pendente") {
        totalAgendado += row.custoTotal;
      } else {
        totalRecusado += row.custoTotal;
      }
    });

    return {
      totalCusto,
      totalRealizado,
      totalAgendado,
      totalRecusado,
      count: filteredRows.length,
    };
  }, [filteredRows]);

  const updatePaymentStatus = async (
    actionId: string,
    promoterUid: string,
    status: "Pendente" | "Recusada" | "Realizada",
  ) => {
    try {
      const action = calendarioAcoes.find((a) => a.id === actionId);
      if (!action) return;
      const currentStatus = action.statusPagamentoPromotores || {};
      const updatedStatus = {
        ...currentStatus,
        [promoterUid]: status,
      };
      await updateDoc(doc(db, COLLECTIONS.CALENDARIO_ACOES, actionId), {
        statusPagamentoPromotores: updatedStatus,
      });
      onToast("Status de pagamento atualizado com sucesso!", "success");
    } catch (err) {
      onToast("Erro ao atualizar status de pagamento.", "error");
    }
  };

  const handleExportExcel = () => {
    try {
      const dataToExport = filteredRows.map((r) => ({
        Empresa: r.empresa,
        "Nome do Promotor": r.promoterName,
        Telefone: r.promoterPhone,
        PIX: r.promoterPix,
        Diárias: r.diarias,
        "Horas de Atuação": `${r.horas} Horas`,
        Solicitante: r.solicitante,
        "Região de Atuação": r.promoterUnit,
        "Tipo de Ação": r.tipoAcao,
        "Data de Início": r.dataInicio,
        "Data Final": r.dataFim,
        "Valor Dia (R$)": r.valorDia,
        "Custo Total (R$)": r.custoTotal,
        "Valor Orçado (R$)": r.valorOrcado,
        "Status de Pagamento": r.statusPagamento,
      }));

      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(
        workbook,
        worksheet,
        "Controle de Pagamentos",
      );
      XLSX.writeFile(
        workbook,
        `Controle_Pagamentos_${new Date().toISOString().split("T")[0]}.xlsx`,
      );
      onToast("Relatório exportado para Excel com sucesso!", "success");
    } catch (err) {
      onToast("Erro ao exportar relatório.", "error");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Controle de Pagamentos
          </h2>
          <p className="text-sm text-slate-500">
            Gestão e liquidação financeira diária de promotores de ações
          </p>
        </div>
        <button
          onClick={handleExportExcel}
          className="flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-3 rounded-2xl shadow-sm transition-all text-sm self-start md:self-auto"
        >
          <Download size={18} />
          <span>Exportar Relatório Excel</span>
        </button>
      </div>

      {/* Métricas / KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white border border-slate-100 rounded-3xl shadow-sm space-y-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Registros Elegíveis
          </span>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-slate-800">
              {metrics.count}
            </span>
            <span className="text-xs text-slate-400">atuações</span>
          </div>
        </div>

        <div className="p-5 bg-white border border-slate-100 rounded-3xl shadow-sm space-y-2">
          <span className="text-xs font-bold text-amber-500 uppercase tracking-wider block">
            Total Pendente / Agendado
          </span>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-amber-600">
              R$ {metrics.totalAgendado.toFixed(2).replace(".", ",")}
            </span>
          </div>
        </div>

        <div className="p-5 bg-white border border-slate-100 rounded-3xl shadow-sm space-y-2">
          <span className="text-xs font-bold text-emerald-500 uppercase tracking-wider block">
            Total Realizado / Pago
          </span>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-emerald-600">
              R$ {metrics.totalRealizado.toFixed(2).replace(".", ",")}
            </span>
          </div>
        </div>

        <div className="p-5 bg-white border border-slate-100 rounded-3xl shadow-sm space-y-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block font-bold">
            Custo de Diárias Total
          </span>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-slate-700">
              R$ {metrics.totalCusto.toFixed(2).replace(".", ",")}
            </span>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm space-y-4">
        <span className="text-sm font-bold text-slate-700 block uppercase tracking-wider">
          Filtros de Pesquisa
        </span>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Buscar por Promotor, Ação ou Solicitante..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-slate-300 transition-all border-none outline-none"
            />
          </div>

          <div>
            <select
              value={empresaFilter}
              onChange={(e) => setEmpresaFilter(e.target.value as any)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 appearance-none focus:bg-white focus:ring-2 focus:ring-slate-300 transition-all border-none outline-none cursor-pointer"
            >
              <option value="all">Todas as Empresas (GR15 / RP7)</option>
              <option value="GR15">Empresa: GR15</option>
              <option value="RP7">Empresa: RP7</option>
            </select>
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 appearance-none focus:bg-white focus:ring-2 focus:ring-slate-300 transition-all border-none outline-none cursor-pointer"
            >
              <option value="all">Todos os Status de Pagamento</option>
              <option value="Pendente">Status: Pendente</option>
              <option value="Recusada">Status: Recusada</option>
              <option value="Realizada">Status: Realizada</option>
            </select>
          </div>

          <div>
            <select
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 appearance-none focus:bg-white focus:ring-2 focus:ring-slate-300 transition-all border-none outline-none cursor-pointer"
            >
              <option value="all">Todas as Regiões de Atuação</option>
              {uniqueRegions.map((region) => (
                <option key={region} value={region}>
                  {region}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tabela de Pagamentos */}
      <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden whitespace-normal">
        {filteredRows.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <span className="text-slate-400 text-lg block">
              Nenhum registro de pagamento qualificado.
            </span>
            <span className="text-slate-400 text-xs block max-w-md mx-auto">
              Certifique-se de que os promotores estão escalados nas ações do
              Plano de Ação e marque o comparecimento deles como confirmado
              ("Compareceu").
            </span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead className="bg-slate-50/70 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-4">Empresa</th>
                  <th className="px-5 py-4">Promotor</th>
                  <th className="px-5 py-4">Telefone</th>
                  <th className="px-5 py-4">Chave Pix</th>
                  <th className="px-5 py-4 text-center">Diárias</th>
                  <th className="px-5 py-4 text-center">Horas</th>
                  <th className="px-5 py-4">Solicitante</th>
                  <th className="px-5 py-4">Região</th>
                  <th className="px-5 py-4">Ação</th>
                  <th className="px-5 py-4">Datas</th>
                  <th className="px-5 py-4 text-right">Valor Dia</th>
                  <th className="px-5 py-4 text-right bg-slate-50 font-bold text-slate-600">
                    Custo Total
                  </th>
                  <th className="px-5 py-4 text-right">Valor Orçado</th>
                  <th className="px-5 py-4 text-center min-w-[200px]">
                    Status Pagamento
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
                {filteredRows.map((row, idx) => {
                  const d = new Date();
                  const year = d.getFullYear();
                  const month = String(d.getMonth() + 1).padStart(2, "0");
                  const day = String(d.getDate()).padStart(2, "0");
                  const todayStr = `${year}-${month}-${day}`;
                  const isOverdue =
                    row.dataFim < todayStr &&
                    row.statusPagamento === "Pendente";

                  return (
                    <tr
                      key={`${row.actionId}-${row.promoterUid}-${idx}`}
                      className={cn(
                        "hover:bg-slate-50/50 transition-colors",
                        isOverdue && "bg-rose-50/25",
                      )}
                    >
                      {/* Empresa */}
                      <td className="px-5 py-4 font-bold">
                        <span
                          className={cn(
                            "px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wide",
                            row.empresa === "GR15"
                              ? "bg-purple-100 text-purple-700"
                              : "bg-amber-100 text-amber-700",
                          )}
                        >
                          {row.empresa}
                        </span>
                      </td>

                      {/* Promotor */}
                      <td className="px-5 py-4 font-semibold text-slate-800">
                        {row.promoterName}
                      </td>

                      {/* Telefone */}
                      <td className="px-5 py-4 font-mono">
                        {row.promoterPhone}
                      </td>

                      {/* Chave Pix */}
                      <td
                        className="px-5 py-4 font-mono select-all truncate max-w-[120px]"
                        title={row.promoterPix}
                      >
                        {row.promoterPix}
                      </td>

                      {/* Diárias */}
                      <td className="px-5 py-4 text-center font-bold">
                        {row.diarias}
                      </td>

                      {/* Horas */}
                      <td className="px-5 py-4 text-center">{row.horas}h</td>

                      {/* Solicitante */}
                      <td className="px-5 py-4">{row.solicitante}</td>

                      {/* Região */}
                      <td className="px-5 py-4">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md font-semibold">
                          {row.promoterUnit}
                        </span>
                      </td>

                      {/* Ação */}
                      <td
                        className="px-5 py-4 font-semibold text-slate-700 truncate max-w-[150px]"
                        title={row.tipoAcao}
                      >
                        {row.tipoAcao}
                      </td>

                      {/* Datas */}
                      <td className="px-5 py-4 font-mono text-[10px]">
                        <div className="flex items-center space-x-1.5">
                          <div className="flex-1">
                            <div>
                              {row.dataInicio.split("-").reverse().join("/")}
                            </div>
                            <div
                              className={cn(
                                "text-[9px]",
                                isOverdue
                                  ? "text-rose-500 font-bold"
                                  : "text-slate-400",
                              )}
                            >
                              até {row.dataFim.split("-").reverse().join("/")}
                            </div>
                          </div>
                          {isOverdue && (
                            <span
                              className="text-rose-500 animate-pulse shrink-0"
                              title="Período da ação finalizado"
                            >
                              <AlertCircle size={15} />
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Valor Dia */}
                      <td className="px-5 py-4 text-right font-mono font-bold">
                        R$ {row.valorDia.toFixed(2).replace(".", ",")}
                      </td>

                      {/* Custo Total */}
                      <td className="px-5 py-4 text-right font-mono font-extrabold bg-slate-50 text-slate-800 text-sm">
                        R$ {row.custoTotal.toFixed(2).replace(".", ",")}
                      </td>

                      {/* Valor Orçado */}
                      <td className="px-5 py-4 text-right font-mono">
                        R$ {row.valorOrcado.toFixed(2).replace(".", ",")}
                      </td>

                      {/* Status de Pagamento */}
                      <td className="px-5 py-4 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <div className="flex items-center justify-center space-x-1.5 bg-slate-50/80 p-1.5 rounded-full border border-slate-100 w-fit">
                            {(
                              ["Pendente", "Recusada", "Realizada"] as const
                            ).map((st) => {
                              const isSelected = row.statusPagamento === st;
                              let btnClass =
                                "px-2 py-1 rounded-full text-[9px] font-bold uppercase transition-all ";

                              if (isSelected) {
                                if (st === "Realizada")
                                  btnClass +=
                                    "bg-emerald-600 text-white shadow-sm";
                                else if (st === "Pendente")
                                  btnClass +=
                                    "bg-amber-500 text-white shadow-sm";
                                else
                                  btnClass +=
                                    "bg-rose-500 text-white shadow-sm";
                              } else {
                                btnClass +=
                                  "text-slate-400 hover:text-slate-600 hover:bg-slate-200/50";
                              }

                              if (isReadOnly && !isSelected) {
                                btnClass += " opacity-50 cursor-not-allowed";
                              }

                              return (
                                <button
                                  key={st}
                                  onClick={() =>
                                    !isReadOnly &&
                                    updatePaymentStatus(
                                      row.actionId,
                                      row.promoterUid,
                                      st,
                                    )
                                  }
                                  disabled={isReadOnly}
                                  className={btnClass}
                                >
                                  {st === "Realizada"
                                    ? "Paga"
                                    : st === "Pendente"
                                      ? "Pendente"
                                      : "Recusada"}
                                </button>
                              );
                            })}
                          </div>
                          {isOverdue && (
                            <div
                              className="flex items-center space-x-1 bg-rose-50 text-rose-700 px-2.5 py-1 rounded-full text-[9px] font-extrabold uppercase border border-rose-200 animate-pulse shrink-0"
                              title="Alerta: Ação concluída, pagamento ainda pendente!"
                            >
                              <AlertCircle size={12} className="shrink-0" />
                              <span>Atrasado</span>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
