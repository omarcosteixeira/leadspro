import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { X, MessageSquare, Bot, Send } from "lucide-react";
import { BotConfig, WhatsAppMessage } from "../types";

interface WhatsAppMessageSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  messages: WhatsAppMessage[];
  onSelect: (msg: string) => void;
  leadName: string;
  leadCurso?: string;
  botConfig?: BotConfig;
  onSendBot?: (msg: string) => void;
  forceBotOnly?: boolean;
  leadMatricula?: string;
}

export function WhatsAppMessageSelector({
  isOpen,
  onClose,
  messages,
  onSelect,
  leadName,
  leadCurso,
  botConfig,
  onSendBot,
  forceBotOnly,
  leadMatricula,
}: WhatsAppMessageSelectorProps) {
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  const selectedMsg = messages[selectedIndex];

  const previewText = useMemo(() => {
    if (!selectedMsg) return "";
    let preview = selectedMsg.texto;
    if (!forceBotOnly) {
      preview = preview.replace(/\[nome\]/gi, leadName || "");
      if (leadCurso) preview = preview.replace(/\[curso\]/gi, leadCurso);
      if (leadMatricula)
        preview = preview.replace(/\[matr[ií]cula\]/gi, leadMatricula);
    }
    return preview;
  }, [selectedMsg, forceBotOnly, leadName, leadCurso, leadMatricula]);

  const canUseBot = botConfig?.url && onSendBot;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[85vh]"
      >
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div>
            <h3 className="text-xl font-bold text-slate-900">
              {forceBotOnly ? "Disparo em Massa" : "Selecionar Mensagem"}
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-1">
              {forceBotOnly
                ? "Escolha o modelo para enviar a todos."
                : `Escolha como enviar para ${leadName}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-full transition-all"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {messages.length > 0 ? (
            <div className="flex flex-col md:flex-row gap-6">
              {/* Dropdown Selection */}
              <div className="flex-1 space-y-1.5 md:border-r border-slate-100 md:pr-6">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">
                  Modelo de Mensagem
                </label>
                <select
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 appearance-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                  value={selectedIndex}
                  onChange={(e) => setSelectedIndex(Number(e.target.value))}
                >
                  {messages.map((msg, idx) => (
                    <option key={msg.id} value={idx}>
                      {msg.nome ? msg.nome : `Modelo ${idx + 1}`}
                    </option>
                  ))}
                </select>

                <div className="text-xs text-slate-400 font-medium mt-4 pt-4 border-t border-slate-100">
                  <p>
                    Selecione um modelo no menu acima para visualizar as
                    informações antes de enviar a mensagem.
                  </p>
                </div>
              </div>

              {/* Preview Area */}
              <div className="flex-[2] rounded-2xl border border-blue-100 bg-blue-50/20 p-5 flex flex-col space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                    <MessageSquare size={12} />
                  </div>
                  <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                    Pré-visualização da Mensagem
                  </span>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex-1">
                  <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed max-h-56 overflow-y-auto">
                    {previewText || (
                      <span className="italic opacity-50 text-slate-400">
                        Mensagem vazia
                      </span>
                    )}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-100 mt-4">
                  {canUseBot && (
                    <button
                      onClick={() => {
                        onSendBot(
                          forceBotOnly ? selectedMsg.texto : previewText,
                        );
                        onClose();
                      }}
                      className="flex-1 bg-blue-600 text-white py-3 rounded-xl text-sm font-bold hover:bg-blue-700 shadow-sm hover:shadow transition flex items-center justify-center gap-2"
                    >
                      <Bot size={18} />
                      <span>{forceBotOnly ? "Bot (Massa)" : "Bot ARGO'S"}</span>
                    </button>
                  )}
                  {!forceBotOnly && (
                    <button
                      onClick={() => {
                        onSelect(previewText);
                        onClose();
                      }}
                      className={`flex-1 ${canUseBot ? "bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-100" : "bg-emerald-500 text-white hover:bg-emerald-600"} py-3 rounded-xl text-sm font-bold shadow-sm hover:shadow transition flex items-center justify-center gap-2`}
                    >
                      <Send size={18} />
                      <span>
                        {canUseBot ? "WhatsApp Web" : "Sua Conta do WhatsApp"}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-slate-400 italic">Nenhum modelo cadastrado.</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
