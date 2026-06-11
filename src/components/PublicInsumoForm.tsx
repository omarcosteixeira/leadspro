import React, { useState } from 'react';
import { 
  User, 
  Book, 
  FileText, 
  Plus, 
  Trash2, 
  Send, 
  CheckCircle2, 
  Boxes,
  School,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, COLLECTIONS, handleFirestoreError, OperationType } from '../firebase';
import { addDoc, collection } from 'firebase/firestore';
import { InsumoItem, InsumoPedido } from '../types';

interface PublicInsumoFormProps {
  onToast: (msg: string, type?: 'success' | 'error') => void;
}

export function PublicInsumoForm({ onToast }: PublicInsumoFormProps) {
  const [professorName, setProfessorName] = useState('');
  const [courseName, setCourseName] = useState('');
  const [subjectName, setSubjectName] = useState('');
  const [motivoUso, setMotivoUso] = useState('');
  const [pedidoItens, setPedidoItens] = useState<InsumoItem[]>([{ material: '', quantidade: 1 }]);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleAddRow = () => {
    setPedidoItens([...pedidoItens, { material: '', quantidade: 1 }]);
  };

  const handleRemoveRow = (index: number) => {
    if (pedidoItens.length === 1) return;
    setPedidoItens(pedidoItens.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof InsumoItem, value: any) => {
    const updated = [...pedidoItens];
    if (field === 'quantidade') {
      updated[index].quantidade = Math.max(1, parseInt(value) || 1);
    } else {
      updated[index].material = value;
    }
    setPedidoItens(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!professorName || !courseName || !subjectName || !motivoUso) {
      onToast("Por favor, preencha todos os campos obrigatórios.", "error");
      return;
    }

    const filteredItens = pedidoItens.filter(it => it.material.trim() !== '');
    if (filteredItens.length === 0) {
      onToast("Por favor, adicione pelo menos um material.", "error");
      return;
    }

    setLoading(true);
    try {
      const newPedido: Omit<InsumoPedido, 'id'> = {
        professorNome: professorName,
        cursoNome: courseName,
        disciplinaNome: subjectName,
        motivoUso: motivoUso,
        itens: filteredItens,
        status: 'Pendente',
        solicitanteId: 'public',
        solicitanteNome: 'Solicitante Público',
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, COLLECTIONS.INSUMOS_PEDIDOS), newPedido);
      setSubmitted(true);
      onToast("Solicitação de insumos enviada para avaliação!", "success");
    } catch (err) {
      console.error(err);
      onToast("Erro ao enviar solicitação.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-2xl bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-100/80">
        
        {/* Header decoration */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-800 to-indigo-900 p-8 text-white relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-15 flex items-center space-x-3 mb-3">
            <div className="p-2 bg-white/10 rounded-xl border border-white/10">
              <Boxes size={24} className="text-blue-200" />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-blue-200 bg-white/5 px-2.5 py-1 rounded-md">
              Portal do Docente
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-black tracking-tight relative z-15">
            Solicitação Pública de Insumos
          </h2>
          <p className="text-blue-100 text-sm mt-2 font-medium max-w-md relative z-15">
            Insira os dados do curso e a lista de materiais necessários para a realização de suas aulas ou ações práticas.
          </p>
        </div>

        <AnimatePresence mode="wait">
          {submitted ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="p-8 text-center"
            >
              <div className="w-16 h-16 bg-teal-50 border border-teal-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 size={36} className="text-teal-600 animate-bounce" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Solicitação Enviada!</h3>
              <p className="text-sm text-slate-500 max-w-sm mx-auto mb-6">
                Sua requisição de materiais foi enviada com sucesso para a equipe operacional (Técnicos e Acadêmicos) para análise e controle de estoque.
              </p>
              <button
                onClick={() => {
                  setProfessorName('');
                  setCourseName('');
                  setSubjectName('');
                  setMotivoUso('');
                  setPedidoItens([{ material: '', quantidade: 1 }]);
                  setSubmitted(false);
                }}
                className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl text-sm transition-all shadow-md shadow-blue-500/10 cursor-pointer"
              >
                <span>Fazer Nova Solicitação</span>
                <ArrowRight size={16} />
              </button>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
              
              {/* Professor info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Nome do Professor *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
                    <input
                      type="text"
                      required
                      placeholder="Ex: Dr. Robson Mendes"
                      value={professorName}
                      onChange={(e) => setProfessorName(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Nome do Curso *
                  </label>
                  <div className="relative">
                    <School className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
                    <input
                      type="text"
                      required
                      placeholder="Ex: Farmácia, Logística"
                      value={courseName}
                      onChange={(e) => setCourseName(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Subject Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Nome da Disciplina *
                  </label>
                  <div className="relative">
                    <Book className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
                    <input
                      type="text"
                      required
                      placeholder="Ex: Química Orgânica Prática"
                      value={subjectName}
                      onChange={(e) => setSubjectName(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Motivo do Uso / Justificativa *
                  </label>
                  <div className="relative">
                    <FileText className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
                    <input
                      type="text"
                      required
                      placeholder="Ex: Aula prática em laboratório de análises"
                      value={motivoUso}
                      onChange={(e) => setMotivoUso(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Items Requisition */}
              <div className="border-t border-slate-100 pt-6">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-xs font-bold text-slate-600 uppercase tracking-widest flex items-center space-x-1.5">
                    <Boxes size={14} className="text-blue-600 animate-pulse" />
                    <span>Insumos Necesitados</span>
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddRow}
                    className="flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-750 font-bold hover:bg-blue-50 px-2.5 py-1.5 rounded-lg transition-all cursor-pointer"
                  >
                    <Plus size={14} />
                    <span>Adicionar Linha</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {pedidoItens.map((it, index) => (
                    <div key={index} className="flex items-center space-x-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <div className="flex-1">
                        <input
                          type="text"
                          placeholder="Descrição do material (Ex: Giz Azul, Tubo de ensaio)"
                          value={it.material}
                          onChange={(e) => handleItemChange(index, 'material', e.target.value)}
                          className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-xs bg-white"
                          required
                        />
                      </div>
                      <div className="w-24">
                        <input
                          type="number"
                          min="1"
                          placeholder="Qtd"
                          value={it.quantidade}
                          onChange={(e) => handleItemChange(index, 'quantidade', e.target.value)}
                          className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-xs text-center font-mono bg-white font-bold"
                          required
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveRow(index)}
                        disabled={pedidoItens.length === 1}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-white rounded-lg transition-all cursor-pointer"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end pt-4 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-3.5 rounded-xl text-sm transition-all shadow-md shadow-blue-500/10 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send size={16} />
                      <span>Enviar Requisição</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
