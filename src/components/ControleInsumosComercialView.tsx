import React, { useState, useMemo } from "react";
import {
  InsumoPedidoComercial,
  InsumoEstoqueComercial,
  InsumoItemComercial,
  UserProfile,
} from "../types";
import {
  db,
  COLLECTIONS,
  handleFirestoreError,
  OperationType,
} from "../firebase";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
} from "firebase/firestore";
import {
  Plus,
  Trash2,
  Check,
  X,
  ClipboardList,
  Layers,
  AlertTriangle,
  CheckCircle2,
  User,
  Boxes,
  RotateCcw,
  Gauge,
  ShoppingCart,
  Clock,
  Upload,
  Download,
} from "lucide-react";
import { cn } from "../lib/utils";
import { ROLES } from "../App";
import * as XLSX from "xlsx";

interface ControleInsumosComercialViewProps {
  pedidos: InsumoPedidoComercial[];
  estoque: InsumoEstoqueComercial[];
  profile: UserProfile;
  onToast: (m: string, t?: "success" | "error") => void;
}

export function ControleInsumosComercialView({
  pedidos,
  estoque,
  profile,
  onToast,
}: ControleInsumosComercialViewProps) {
  const [activeTab, setActiveTab] = useState<"pedidos" | "estoque">("pedidos");
  const [isAddingPedido, setIsAddingPedido] = useState(false);
  const [isAddingEstoque, setIsAddingEstoque] = useState(false);
  const [editingEstoque, setEditingEstoque] =
    useState<InsumoEstoqueComercial | null>(null);

  // New Request Form State
  const [motivoUso, setMotivoUso] = useState("");
  const [pedidoItens, setPedidoItens] = useState<InsumoItemComercial[]>([
    { material: "", quantidade: 1 },
  ]);

  // New Stock Form State
  const [stockMaterial, setStockMaterial] = useState("");
  const [stockQuantidade, setStockQuantidade] = useState<number>(0);
  const [stockUnidade, setStockUnidade] = useState("UN");
  const [stockMinimo, setStockMinimo] = useState<number>(5);
  const [stockDescricao, setStockDescricao] = useState("");

  // Search & Filters
  const [pedidoStatusFilter, setPedidoStatusFilter] = useState<string>("Todos");
  const [pedidoSearch, setPedidoSearch] = useState("");
  const [stockSearch, setStockSearch] = useState("");

  // Email notifications
  const [emailAlertas, setEmailAlertas] = useState<string>(
    localStorage.getItem('insumos_comercial_email_alertas') || ''
  );

  const handleEmailAlertasChange = (val: string) => {
    setEmailAlertas(val);
    localStorage.setItem('insumos_comercial_email_alertas', val);
  };

  // "apenas o gerente comercial vai validar se foi aceito ou não o pedido e vai mudar os status"
  const isGerenteOrAdmin = useMemo(() => {
    return (
      profile.role === ROLES.ADMIN_MASTER ||
      profile.role === "Admin Master" ||
      profile.role === "Gerente Comercial (Comercial)" ||
      profile.role === "Gestor Comercial"
    );
  }, [profile.role]);

  // Handle adding list row in requisition
  const handleAddRequestItem = () => {
    setPedidoItens([...pedidoItens, { material: "", quantidade: 1 }]);
  };

  const handleRemoveRequestItem = (index: number) => {
    if (pedidoItens.length === 1) return;
    setPedidoItens(pedidoItens.filter((_, i) => i !== index));
  };

  const handleRequestItemChange = (
    index: number,
    field: keyof InsumoItemComercial,
    value: any,
  ) => {
    const updated = [...pedidoItens];
    if (field === "quantidade") {
      updated[index].quantidade = Math.max(1, parseInt(value) || 1);
    } else {
      updated[index].material = value;
    }
    setPedidoItens(updated);
  };

  // Submit supply request (Pedido de Insumos)
  const handleSubmitPedido = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!motivoUso) {
      onToast("Por favor, preencha o motivo de uso.", "error");
      return;
    }

    const filteredItens = pedidoItens.filter((it) => it.material.trim() !== "");
    if (filteredItens.length === 0) {
      onToast(
        "Por favor, adicione ao menos um material para requisitar.",
        "error",
      );
      return;
    }

    try {
      const newPedido: Omit<InsumoPedidoComercial, "id"> = {
        motivoUso: motivoUso,
        itens: filteredItens,
        status: "Pendente",
        solicitanteId: profile.uid,
        solicitanteNome: profile.name,
        createdAt: new Date().toISOString(),
      };

      await addDoc(
        collection(db, COLLECTIONS.INSUMOS_PEDIDOS_COMERCIAL),
        newPedido,
      );
      onToast("Solicitação de insumos enviada com sucesso!", "success");

      // Reset form
      setMotivoUso("");
      setPedidoItens([{ material: "", quantidade: 1 }]);
      setIsAddingPedido(false);
    } catch (err) {
      handleFirestoreError(
        err,
        OperationType.CREATE,
        COLLECTIONS.INSUMOS_PEDIDOS_COMERCIAL,
      );
      onToast(
        "Erro ao salvar solicitação. Verifique suas permissões.",
        "error",
      );
    }
  };

  // Submit or Edit Stock item (Controle de Estoque)
  const handleSubmitEstoque = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockMaterial) {
      onToast("O nome do material é obrigatório.", "error");
      return;
    }

    try {
      if (editingEstoque) {
        const itemRef = doc(
          db,
          COLLECTIONS.INSUMOS_ESTOQUE_COMERCIAL,
          editingEstoque.id,
        );
        await updateDoc(itemRef, {
          material: stockMaterial,
          quantidade: stockQuantidade,
          unidadeMedida: stockUnidade,
          estoqueMinimo: stockMinimo,
          descricao: stockDescricao,
          updatedAt: new Date().toISOString(),
        });
        onToast("Item de estoque atualizado com sucesso!", "success");

        if (stockQuantidade < stockMinimo) {
          onToast(`⚠️ Nível crítico atingido para: ${stockMaterial}`, "error");
          if (emailAlertas) {
            onToast(`✉️ Alerta enviado para o e-mail: ${emailAlertas}`, "success");
          }
        }
      } else {
        const newEstoque: Omit<InsumoEstoqueComercial, "id"> = {
          material: stockMaterial,
          quantidade: stockQuantidade,
          unidadeMedida: stockUnidade,
          estoqueMinimo: stockMinimo,
          descricao: stockDescricao,
          ownerId: profile.uid,
          ownerName: profile.name,
          updatedAt: new Date().toISOString(),
        };
        await addDoc(
          collection(db, COLLECTIONS.INSUMOS_ESTOQUE_COMERCIAL),
          newEstoque,
        );
        onToast("Novo item adicionado ao seu estoque!", "success");
      }

      // Reset
      setStockMaterial("");
      setStockQuantidade(0);
      setStockUnidade("UN");
      setStockMinimo(5);
      setStockDescricao("");
      setIsAddingEstoque(false);
      setEditingEstoque(null);
    } catch (err) {
      handleFirestoreError(
        err,
        OperationType.WRITE,
        COLLECTIONS.INSUMOS_ESTOQUE_COMERCIAL,
      );
      onToast("Erro ao salvar no estoque. Verifique suas permissões.", "error");
    }
  };

  // Delete Stock Item
  const handleDeleteEstoque = async (id: string) => {
    if (!window.confirm("Deseja realmente remover este item do estoque?"))
      return;
    try {
      await deleteDoc(doc(db, COLLECTIONS.INSUMOS_ESTOQUE_COMERCIAL, id));
      onToast("Item removido do estoque com sucesso.", "success");
    } catch (err) {
      handleFirestoreError(
        err,
        OperationType.DELETE,
        COLLECTIONS.INSUMOS_ESTOQUE_COMERCIAL,
      );
      onToast("Erro ao remover item.", "error");
    }
  };

  // Delete Pedido Request
  const handleDeletePedido = async (id: string) => {
    if (!window.confirm("Deseja realmente excluir esta solicitação?")) return;
    try {
      await deleteDoc(doc(db, COLLECTIONS.INSUMOS_PEDIDOS_COMERCIAL, id));
      onToast("Solicitação excluída com sucesso.", "success");
    } catch (err) {
      handleFirestoreError(
        err,
        OperationType.DELETE,
        COLLECTIONS.INSUMOS_PEDIDOS_COMERCIAL,
      );
      onToast("Erro ao excluir solicitação.", "error");
    }
  };

  // Update Pedido Status
  const handleUpdateStatus = async (
    pedido: InsumoPedidoComercial,
    newStatus:
      | "Pendente"
      | "Aprovado"
      | "Rejeitado"
      | "Em Andamento"
      | "Entregue",
  ) => {
    try {
      const pedidoRef = doc(
        db,
        COLLECTIONS.INSUMOS_PEDIDOS_COMERCIAL,
        pedido.id,
      );

      // Auto-deduct stock for internal management is disabled for commercial as they manage their own stocks

      await updateDoc(pedidoRef, {
        status: newStatus,
        updatedAt: new Date().toISOString(),
      });

      onToast(`Pedido atualizado para "${newStatus}" com sucesso!`, "success");
    } catch (err) {
      handleFirestoreError(
        err,
        OperationType.UPDATE,
        COLLECTIONS.INSUMOS_PEDIDOS_COMERCIAL,
      );
      onToast("Erro ao atualizar status do pedido.", "error");
    }
  };

  // Filter lists based on roles
  const filteredPedidos = useMemo(() => {
    return pedidos
      .filter((p) => {
        // Rule: "cada FDV/comercial só vai poder ver no historico o que solicitou e seu proprio estoque, já o gerente comercial e o admim ve de todos"
        if (!isGerenteOrAdmin && p.solicitanteId !== profile.uid) return false;

        const matchesStatus =
          pedidoStatusFilter === "Todos" || p.status === pedidoStatusFilter;
        const term = pedidoSearch.toLowerCase();
        const matchesSearch =
          p.solicitanteNome.toLowerCase().includes(term) ||
          p.itens.some((it) => it.material.toLowerCase().includes(term));
        return matchesStatus && matchesSearch;
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt || "").getTime() -
          new Date(a.createdAt || "").getTime(),
      );
  }, [
    pedidos,
    pedidoStatusFilter,
    pedidoSearch,
    isGerenteOrAdmin,
    profile.uid,
  ]);

  const filteredEstoque = useMemo(() => {
    return estoque
      .filter((e) => {
        // Rule: "cada FDV/comercial só vai poder ver no historico o que solicitou e seu proprio estoque"
        if (!isGerenteOrAdmin && e.ownerId !== profile.uid) return false;

        const term = stockSearch.toLowerCase();
        return (
          e.material.toLowerCase().includes(term) ||
          (e.descricao || "").toLowerCase().includes(term) ||
          (e.ownerName || "").toLowerCase().includes(term)
        );
      })
      .sort((a, b) => a.material.localeCompare(b.material));
  }, [estoque, stockSearch, isGerenteOrAdmin, profile.uid]);

  const handleExportExcel = () => {
    let dataToExport: any[] = [];
    let fileName = `Controle_Comercial_${activeTab}_${new Date().toISOString().split("T")[0]}`;

    if (activeTab === "pedidos") {
      dataToExport = filteredPedidos.map((p) => ({
        Status: p.status,
        Solicitante: p.solicitanteNome,
        Motivo: p.motivoUso,
        Itens: p.itens.map((i) => `${i.quantidade}x ${i.material}`).join(", "),
        Data: new Date(p.createdAt || "").toLocaleDateString(),
      }));
    } else if (activeTab === "estoque") {
      dataToExport = filteredEstoque.map((e) => ({
        "Dono / Responsável": e.ownerName,
        Material: e.material,
        Quantidade: e.quantidade,
        Unidade: e.unidadeMedida || "UN",
        Mínimo: e.estoqueMinimo || 5,
        Descrição: e.descricao,
        "Última Atualização": e.updatedAt
          ? new Date(e.updatedAt).toLocaleDateString()
          : "",
      }));
    }

    if (dataToExport.length === 0) {
      onToast("Não há dados para exportar", "error");
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, activeTab.toUpperCase());
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
    onToast(`Exportação concluída com sucesso.`, "success");
  };

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (activeTab !== "estoque") {
      onToast("Importação de dados disponível apenas para o Estoque.", "error");
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const workbook = XLSX.read(bstr, { type: "binary" });
        const worksheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[worksheetName];
        const rawData: any[] = XLSX.utils.sheet_to_json(worksheet);

        let importsCount = 0;
        for (const row of rawData) {
          if (!row.Material) continue;

          // If standard user, find their own material. If manager, they can't magically import for others unless row has exact owner,
          // let's simplify and make the importer the owner.
          const materialName = row.Material?.toString().trim();

          const existing = estoque.find(
            (es) =>
              es.material.trim().toLowerCase() === materialName.toLowerCase() &&
              es.ownerId === profile.uid,
          );

          const qty = parseInt(row.Quantidade || row.quantidade || "0", 10);
          const min = parseInt(row.Mínimo || row.minimo || "5", 10);
          const un = row.Unidade || row.unidade || "UN";
          const desc = row.Descrição || row.descricao || "";

          if (existing) {
            await updateDoc(
              doc(db, COLLECTIONS.INSUMOS_ESTOQUE_COMERCIAL, existing.id),
              {
                quantidade: isNaN(qty) ? existing.quantidade : qty,
                unidadeMedida: un,
                estoqueMinimo: isNaN(min) ? existing.estoqueMinimo : min,
                descricao: desc,
                updatedAt: new Date().toISOString(),
              },
            );
          } else {
            await addDoc(
              collection(db, COLLECTIONS.INSUMOS_ESTOQUE_COMERCIAL),
              {
                material: materialName,
                quantidade: isNaN(qty) ? 0 : qty,
                unidadeMedida: un,
                estoqueMinimo: isNaN(min) ? 5 : min,
                descricao: desc,
                ownerId: profile.uid,
                ownerName: profile.name,
                updatedAt: new Date().toISOString(),
              },
            );
          }
          importsCount++;
        }

        onToast(
          `${importsCount} itens importados/atualizados com sucesso.`,
          "success",
        );
      } catch (err) {
        console.error("Erro importando excel:", err);
        onToast(
          "Erro ao ler o arquivo. Certifique-se que o formato está correto.",
          "error",
        );
      }
      e.target.value = ""; // reset
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="space-y-6">
      {/* Header card */}
      <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-emerald-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-48 h-48 bg-white/5 rounded-full blur-2xl pointer-events-none" />
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
          <div>
            <div className="flex items-center space-x-2 text-emerald-200 text-xs font-bold uppercase tracking-widest bg-white/10 px-3 py-1 rounded-full w-fit border border-white/5">
              <Boxes size={14} className="text-emerald-300" />
              <span>Gestão Comercial</span>
            </div>
            <h2 className="text-2xl font-black tracking-tight mt-2">
              Controle de Insumos
            </h2>
            <p className="text-emerald-100 text-sm mt-1 max-w-xl">
              Pedidos de materiais para campanhas comerciais e acompanhamento de
              estoque das equipes.
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/15 shadow-sm">
            <span className="text-[10px] text-emerald-200 block font-bold uppercase tracking-wider">
              Acesso Logado
            </span>
            <span className="text-sm font-black block text-white">
              {profile.role}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1.5 p-1 bg-slate-150 rounded-2xl w-full sm:w-fit">
        <button
          onClick={() => setActiveTab("pedidos")}
          className={cn(
            "flex items-center space-x-2 px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all w-full sm:w-auto justify-center cursor-pointer",
            activeTab === "pedidos"
              ? "bg-white text-emerald-800 shadow-sm border border-slate-200/50"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-200",
          )}
        >
          <ClipboardList size={16} />
          <span>Solicitações ({filteredPedidos.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("estoque")}
          className={cn(
            "flex items-center space-x-2 px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all w-full sm:w-auto justify-center cursor-pointer",
            activeTab === "estoque"
              ? "bg-white text-emerald-800 shadow-sm border border-slate-200/50"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-200",
          )}
        >
          <Layers size={16} />
          <span>Físico / Estoque ({filteredEstoque.length})</span>
        </button>
      </div>

      {/* Tab: PEDIDOS */}
      {activeTab === "pedidos" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <div className="flex flex-wrap gap-2 w-full md:w-auto">
                {[
                  "Todos",
                  "Pendente",
                  "Aprovado",
                  "Em Andamento",
                  "Rejeitado",
                  "Entregue",
                ].map((status) => (
                  <button
                    key={status}
                    onClick={() => setPedidoStatusFilter(status)}
                    className={cn(
                      "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
                      pedidoStatusFilter === status
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-50 text-slate-600 hover:bg-slate-100",
                    )}
                  >
                    {status}
                  </button>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                <input
                  type="text"
                  placeholder="Buscar pedidos, solicitante..."
                  value={pedidoSearch}
                  onChange={(e) => setPedidoSearch(e.target.value)}
                  className="px-4 py-2 text-xs border border-slate-200 rounded-xl max-w-xs focus:ring-2 focus:ring-emerald-500 outline-none w-full sm:w-64 bg-slate-50/50"
                />

                <button
                  onClick={handleExportExcel}
                  className="flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all shadow-md w-full sm:w-auto cursor-pointer"
                >
                  <Download size={16} />
                  <span>Exportar</span>
                </button>

                <button
                  onClick={() => setIsAddingPedido(true)}
                  className="flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer"
                >
                  <Plus size={16} />
                  <span>Novo Pedido</span>
                </button>
              </div>
            </div>

            {/* List */}
            {filteredPedidos.length === 0 ? (
              <div className="text-center py-16 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                <ClipboardList
                  size={40}
                  className="mx-auto mb-2.5 text-slate-350"
                />
                <p className="font-bold text-slate-750 text-sm">
                  Nenhum pedido de insumos cadastrado
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {filteredPedidos.map((pedido) => {
                  return (
                    <div
                      key={pedido.id}
                      className="border border-slate-150 hover:border-slate-200 rounded-2xl p-5 bg-white shadow-sm hover:shadow-md transition-all duration-200"
                    >
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
                        <div>
                          <div className="flex flex-wrap items-center gap-2 mb-1.5">
                            <span className="text-sm font-bold text-slate-800 block">
                              Solicitante: {pedido.solicitanteNome}
                            </span>
                            <span
                              className={cn(
                                "px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border",
                                pedido.status === "Pendente" &&
                                  "bg-amber-50 text-amber-700 border-amber-250",
                                pedido.status === "Aprovado" &&
                                  "bg-emerald-50 text-emerald-700 border-emerald-250",
                                pedido.status === "Em Andamento" &&
                                  "bg-indigo-50 text-indigo-700 border-indigo-250",
                                pedido.status === "Rejeitado" &&
                                  "bg-rose-50 text-rose-700 border-rose-250",
                                pedido.status === "Entregue" &&
                                  "bg-teal-50 text-teal-700 border-teal-250",
                              )}
                            >
                              {pedido.status === "Em Andamento"
                                ? "Em Compra / Andamento"
                                : pedido.status}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500">
                            Motivo: {pedido.motivoUso}
                          </div>
                        </div>

                        <div className="text-slate-400 text-[10px] font-medium font-mono self-start sm:self-center">
                          {new Date(pedido.createdAt).toLocaleDateString(
                            "pt-BR",
                            {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )}
                        </div>
                      </div>

                      {/* Content details */}
                      <div className="bg-slate-50/50 rounded-xl p-4 mb-4 border border-slate-100">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                          Materiais Requisitados
                        </p>
                        <div className="divide-y divide-slate-100 bg-white rounded-lg border border-slate-150 p-2 space-y-1">
                          {pedido.itens.map((it, idx) => (
                            <div
                              key={idx}
                              className="flex justify-between items-center py-2 text-xs"
                            >
                              <span className="font-bold text-slate-750">
                                {it.material}
                              </span>
                              <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-md font-bold font-mono text-center">
                                Qtd: {it.quantidade}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Footer actions based on strict role restrictions */}
                      <div className="flex justify-between items-center flex-wrap gap-2 pt-3 border-t border-slate-100">
                        <div>
                          {(profile.uid === pedido.solicitanteId ||
                            isGerenteOrAdmin) && (
                            <button
                              onClick={() => handleDeletePedido(pedido.id)}
                              className="flex items-center space-x-1.5 text-rose-600 hover:text-rose-700 p-2 text-xs font-bold transition-all rounded-lg hover:bg-rose-50 cursor-pointer"
                            >
                              <Trash2 size={13} />
                              <span>Excluir Solicitação</span>
                            </button>
                          )}
                        </div>

                        <div className="flex items-center space-x-2">
                          {/* Manager controls status completely */}
                          {isGerenteOrAdmin && (
                            <>
                              {pedido.status === "Pendente" && (
                                <>
                                  <button
                                    onClick={() =>
                                      handleUpdateStatus(pedido, "Rejeitado")
                                    }
                                    className="flex items-center space-x-1 bg-slate-100 hover:bg-rose-100 text-slate-700 hover:text-rose-700 font-bold px-3 py-2 rounded-xl text-xs transition-all cursor-pointer"
                                  >
                                    <X size={14} />
                                    <span>Rejeitar</span>
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleUpdateStatus(pedido, "Aprovado")
                                    }
                                    className="flex items-center space-x-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition-all shadow-sm cursor-pointer"
                                  >
                                    <Check size={14} />
                                    <span>Aprovar Pedido</span>
                                  </button>
                                </>
                              )}

                              {pedido.status === "Aprovado" && (
                                <>
                                  <button
                                    onClick={() =>
                                      handleUpdateStatus(pedido, "Em Andamento")
                                    }
                                    className="flex items-center space-x-1 bg-indigo-100 hover:bg-indigo-150 text-indigo-700 font-bold px-3 py-2 rounded-xl text-xs transition-all cursor-pointer"
                                  >
                                    <Clock size={14} />
                                    <span>Em Andamento</span>
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleUpdateStatus(pedido, "Entregue")
                                    }
                                    className="flex items-center space-x-1 bg-teal-600 hover:bg-teal-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition-all shadow-sm cursor-pointer"
                                  >
                                    <CheckCircle2 size={14} />
                                    <span>Concluir Entrega</span>
                                  </button>
                                </>
                              )}

                              {pedido.status === "Em Andamento" && (
                                <button
                                  onClick={() =>
                                    handleUpdateStatus(pedido, "Entregue")
                                  }
                                  className="flex items-center space-x-1 bg-teal-600 hover:bg-teal-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition-all shadow-sm cursor-pointer"
                                >
                                  <CheckCircle2 size={14} />
                                  <span>Marcar como Entregue</span>
                                </button>
                              )}

                              {pedido.status === "Rejeitado" && (
                                <button
                                  onClick={() =>
                                    handleUpdateStatus(pedido, "Pendente")
                                  }
                                  className="flex items-center space-x-1 bg-slate-50 hover:bg-slate-100 text-slate-650 font-bold px-3.5 py-1.5 rounded-xl text-xs transition-all border border-slate-200 cursor-pointer"
                                >
                                  <RotateCcw size={14} />
                                  <span>Tornar Pendente</span>
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: ESTOQUE */}
      {activeTab === "estoque" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <h3 className="text-lg font-black text-slate-800 flex items-center space-x-2">
                <Boxes className="text-emerald-600" size={20} />
                <span>Estoque Comercial</span>
              </h3>

              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <input
                  type="text"
                  placeholder="Buscar material no estoque..."
                  value={stockSearch}
                  onChange={(e) => setStockSearch(e.target.value)}
                  className="px-4 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none w-full sm:w-64 bg-slate-50"
                />

                <button
                  onClick={handleExportExcel}
                  className="flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all shadow-md w-full sm:w-auto cursor-pointer"
                >
                  <Download size={16} />
                  <span>Exportar</span>
                </button>

                <label className="flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all shadow-md w-full sm:w-auto cursor-pointer">
                  <Upload size={16} />
                  <span>Importar</span>
                  <input
                    type="file"
                    accept=".xlsx, .xls"
                    onChange={handleImportExcel}
                    className="hidden"
                  />
                </label>

                <button
                  onClick={() => {
                    setEditingEstoque(null);
                    setStockMaterial("");
                    setStockQuantidade(0);
                    setStockUnidade("UN");
                    setStockMinimo(5);
                    setStockDescricao("");
                    setIsAddingEstoque(true);
                  }}
                  className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all shadow-md w-full sm:w-auto cursor-pointer"
                >
                  <Plus size={16} />
                  <span>Adicionar</span>
                </button>
              </div>
            </div>

            {/* Notification settings panel */}
            <div className="mb-6 bg-amber-50/50 p-5 rounded-2xl border border-amber-200/60 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <AlertTriangle size={64} className="text-amber-600" />
              </div>
              <div className="relative z-10">
                <h4 className="text-sm font-black text-slate-800 mb-1 flex items-center space-x-2">
                  <AlertTriangle size={16} className="text-amber-600" />
                  <span>Notificações de Nível Crítico</span>
                </h4>
                <p className="text-xs text-slate-600 mb-4 max-w-2xl">
                  Sempre que o seu estoque atingir o nível mínimo definido, um alerta interno será gerado no sistema. 
                  Insira um e-mail abaixo se desejar enviar notificações também por e-mail.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 items-center">
                  <input
                    type="email"
                    placeholder="Ex: gestao@instituicao.com.br"
                    value={emailAlertas}
                    onChange={(e) => handleEmailAlertasChange(e.target.value)}
                    className="px-4 py-2.5 text-xs font-medium border border-slate-200 rounded-xl w-full sm:w-80 focus:ring-2 focus:ring-amber-500 outline-none bg-white shadow-sm"
                  />
                  <button
                    onClick={() => onToast('Preferências de notificação de estoque salvas.', 'success')}
                    className="bg-amber-600 hover:bg-amber-700 transition-colors text-white font-bold px-5 py-2.5 rounded-xl text-xs whitespace-nowrap shadow-sm cursor-pointer w-full sm:w-auto"
                  >
                    Salvar E-mail
                  </button>
                </div>
              </div>
            </div>

            {/* Grid display */}
            {filteredEstoque.length === 0 ? (
              <div className="text-center py-16 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                <Boxes size={40} className="mx-auto mb-2.5 text-slate-350" />
                <p className="font-bold text-sm text-slate-755">
                  Nenhum item adicionado
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-150">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-150">
                      {isGerenteOrAdmin && (
                        <th className="p-4 text-[10px] font-bold text-slate-500 uppercase">
                          Responsável
                        </th>
                      )}
                      <th className="p-4 text-[10px] font-bold text-slate-500 uppercase">
                        Item
                      </th>
                      <th className="p-4 text-[10px] font-bold text-slate-500 uppercase text-center">
                        Quantidade
                      </th>
                      <th className="p-4 text-[10px] font-bold text-slate-500 uppercase">
                        Observações
                      </th>
                      <th className="p-4 text-[10px] font-bold text-slate-500 uppercase text-right">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150">
                    {filteredEstoque.map((item) => {
                      const isLow = item.quantidade < (item.estoqueMinimo ?? 5);

                      return (
                        <tr
                          key={item.id}
                          className="hover:bg-slate-50/50 transition-colors"
                        >
                          {isGerenteOrAdmin && (
                            <td className="p-4">
                              <span className="font-bold text-slate-700 text-xs">
                                {item.ownerName}
                              </span>
                            </td>
                          )}
                          <td className="p-4">
                            <span className="font-bold text-slate-800 text-sm block">
                              {item.material}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            <span
                              className={cn(
                                "px-3 py-1 rounded-full text-xs font-black font-mono inline-block min-w-16",
                                isLow
                                  ? "bg-amber-150 text-amber-800 border border-amber-200"
                                  : "bg-emerald-150 text-emerald-800 border border-emerald-200",
                              )}
                            >
                              {item.quantidade} {item.unidadeMedida || "UN"}
                            </span>
                          </td>
                          <td className="p-4 text-slate-600 text-xs max-w-xs truncate">
                            {item.descricao || "-"}
                          </td>
                          <td className="p-4 text-right">
                            {(item.ownerId === profile.uid ||
                              isGerenteOrAdmin) && (
                              <div className="flex items-center justify-end space-x-2">
                                <button
                                  onClick={() => {
                                    setEditingEstoque(item);
                                    setStockMaterial(item.material);
                                    setStockQuantidade(item.quantidade);
                                    setStockUnidade(item.unidadeMedida || "UN");
                                    setStockMinimo(item.estoqueMinimo ?? 5);
                                    setStockDescricao(item.descricao || "");
                                    setIsAddingEstoque(true);
                                  }}
                                  className="text-blue-600 hover:text-blue-800 font-bold text-xs uppercase px-2 py-1"
                                >
                                  Editar
                                </button>
                                <button
                                  onClick={() => handleDeleteEstoque(item.id)}
                                  className="text-rose-600 hover:text-rose-800 font-bold text-xs uppercase px-2 py-1"
                                >
                                  Excluir
                                </button>
                              </div>
                            )}
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

      {/* Modals for Adding */}
      {isAddingPedido && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden scale-in">
            <div className="bg-emerald-600 p-6 text-white flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black">Adicionar Pedido</h3>
                <p className="text-emerald-100 text-sm mt-1">
                  Preencha os dados da requisição.
                </p>
              </div>
              <button
                onClick={() => setIsAddingPedido(false)}
                className="text-white hover:bg-emerald-500 p-2 rounded-full transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitPedido} className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Motivo do Uso *
                </label>
                <input
                  type="text"
                  required
                  value={motivoUso}
                  onChange={(e) => setMotivoUso(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 px-4 py-3 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  placeholder="Ex: Campanha externa, material de escritório..."
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Materiais Requisitados *
                  </label>
                  <button
                    type="button"
                    onClick={handleAddRequestItem}
                    className="text-[10px] bg-slate-100 hover:bg-slate-200 text-emerald-700 font-black px-2 py-1 rounded-md uppercase cursor-pointer flex items-center space-x-1"
                  >
                    <Plus size={12} /> <span>Novo Item</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {pedidoItens.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center space-x-3 bg-slate-50 p-2 border border-slate-200 rounded-xl"
                    >
                      <input
                        type="text"
                        value={item.material}
                        onChange={(e) =>
                          handleRequestItemChange(
                            index,
                            "material",
                            e.target.value,
                          )
                        }
                        placeholder={`Nome do material ${index + 1}`}
                        className="flex-1 bg-white border border-slate-200 text-slate-800 px-3 py-2 text-sm rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                      <input
                        type="number"
                        min="1"
                        value={item.quantidade}
                        onChange={(e) =>
                          handleRequestItemChange(
                            index,
                            "quantidade",
                            e.target.value,
                          )
                        }
                        className="w-20 bg-white border border-slate-200 text-slate-800 px-3 py-2 text-sm rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none font-mono text-center"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveRequestItem(index)}
                        disabled={pedidoItens.length === 1}
                        className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-100 space-x-3">
                <button
                  type="button"
                  onClick={() => setIsAddingPedido(false)}
                  className="px-6 py-2.5 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md transition-colors flex items-center space-x-2 cursor-pointer"
                >
                  <Check size={18} />
                  <span>Salvar Solicitação</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isAddingEstoque && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden scale-in">
            <div className="bg-blue-600 p-6 text-white flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black">
                  {editingEstoque
                    ? "Editar Item de Estoque"
                    : "Adicionar ao Estoque"}
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsAddingEstoque(false);
                  setEditingEstoque(null);
                }}
                className="text-white hover:bg-blue-500 p-2 rounded-full transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitEstoque} className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Nome do Material *
                </label>
                <input
                  type="text"
                  required
                  value={stockMaterial}
                  onChange={(e) => setStockMaterial(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 px-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  placeholder="Ex: Caneta Azul, Resma de Papel..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Quantidade Física *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={stockQuantidade}
                    onChange={(e) =>
                      setStockQuantidade(parseInt(e.target.value) || 0)
                    }
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 px-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Nível de Alerta (Mínimo)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={stockMinimo}
                    onChange={(e) =>
                      setStockMinimo(parseInt(e.target.value) || 0)
                    }
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 px-4 py-3 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none transition-all font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Observações
                </label>
                <input
                  type="text"
                  value={stockDescricao}
                  onChange={(e) => setStockDescricao(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 px-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  placeholder="Marca, localização, detalhes..."
                />
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-100 space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingEstoque(false);
                    setEditingEstoque(null);
                  }}
                  className="px-6 py-2.5 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md transition-colors flex items-center space-x-2 cursor-pointer"
                >
                  <Check size={18} />
                  <span>
                    {editingEstoque ? "Salvar Alterações" : "Salvar no Estoque"}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
