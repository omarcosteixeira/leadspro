import React, { useState, useEffect } from 'react';
import { 
  User, 
  Phone, 
  Mail, 
  ShieldCheck, 
  X, 
  QrCode as QrIcon, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  Smartphone,
  Wallet
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, COLLECTIONS, handleFirestoreError, OperationType } from '../firebase';
import { UserProfile, BotConfig } from '../types';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  setProfile: React.Dispatch<React.SetStateAction<UserProfile | null>>;
  botConfig: BotConfig;
  botStatuses: Record<string, { status: string, pairingCode?: string, qrCode?: string, qrUrl?: string, active?: boolean }>;
  onToast: (msg: string, type?: 'success' | 'error') => void;
}

export function ProfileModal({
  isOpen,
  onClose,
  profile,
  setProfile,
  botConfig,
  botStatuses,
  onToast
}: ProfileModalProps) {
  const [botNumberInput, setBotNumberInput] = useState(profile?.botNumber || '');
  const [saving, setSaving] = useState(false);
  const [connecting, setConnecting] = useState(false);

  // Synchronize input with external profile state changes
  useEffect(() => {
    if (profile?.botNumber) {
      setBotNumberInput(profile.botNumber);
    }
  }, [profile?.botNumber]);

  if (!isOpen) return null;

  const allowedRoles = ['Sala de Matrícula', 'SSA', 'Líder/FDV', 'Admin Master', 'FDV (Comercial)', 'Gerente Comercial (Comercial)', 'FDV'];
  const canEditBotNumber = profile && allowedRoles.includes(profile.role);

  const cleanInputNumber = botNumberInput.replace(/\D/g, '');
  const cleanSavedNumber = (profile?.botNumber || '').replace(/\D/g, '');

  // Get current status of the saved bot number
  const botInfo = cleanSavedNumber ? botStatuses[cleanSavedNumber] : null;
  const botStatus = botInfo?.status || 'offline';

  const handleSaveBotNumber = async () => {
    if (!profile?.uid) return;
    setSaving(true);
    try {
      const updatedData = {
        botNumber: cleanInputNumber,
        updatedAt: serverTimestamp()
      };
      await updateDoc(doc(db, COLLECTIONS.USERS, profile.uid), updatedData);
      
      setProfile(prev => prev ? { ...prev, botNumber: cleanInputNumber } : null);
      onToast('Número do bot atualizado com sucesso!', 'success');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `${COLLECTIONS.USERS}/${profile.uid}`);
      onToast('Erro ao atualizar número do bot.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleConnect = async () => {
    const numberToConnect = cleanSavedNumber || cleanInputNumber;
    if (!numberToConnect) {
      onToast('Informe um número de WhatsApp primeiro.', 'error');
      return;
    }
    if (!botConfig?.url) {
      onToast('URL de conexão do bot não configurada no administrador.', 'error');
      return;
    }

    setConnecting(true);
    const cleanUrl = botConfig.url.endsWith('/') ? botConfig.url.slice(0, -1) : botConfig.url;

    try {
      const res = await fetch(`${cleanUrl}/api/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ botNumber: numberToConnect })
      });

      if (!res.ok) {
        onToast(`Erro da API do bot: ${res.status} ${res.statusText}`, 'error');
        return;
      }

      onToast('Solicitação de conexão enviada! Aguardando QR Code/Pairing Code...', 'success');
    } catch (err: any) {
      onToast(`Erro ao conectar com o servidor do bot: ${err.message}`, 'error');
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div id="profile-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        id="profile-modal-content"
        className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden my-8"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <User size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Seu Perfil</h2>
              <p className="text-xs text-slate-500">Consulte seus dados e controle seu bot do WhatsApp</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 px-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal body */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[75vh]">
          {/* Section 1: Personal Data */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Informações de Perfil</h3>
            <div className="grid grid-cols-1 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div className="flex items-start space-x-3">
                <div className="mt-0.5 text-slate-400">
                  <User size={16} />
                </div>
                <div className="flex-1">
                  <span className="text-xs text-slate-400 block font-medium">Nome</span>
                  <span className="text-sm font-bold text-slate-800">{profile?.name}</span>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="mt-0.5 text-slate-400">
                  <Mail size={16} />
                </div>
                <div className="flex-1">
                  <span className="text-xs text-slate-400 block font-medium">E-mail</span>
                  <span className="text-sm font-bold text-slate-800">{profile?.email}</span>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="mt-0.5 text-slate-400">
                  <ShieldCheck size={16} />
                </div>
                <div className="flex-1">
                  <span className="text-xs text-slate-400 block font-medium">Cargo / Nível de Acesso</span>
                  <span className="inline-block px-2 py-0.5 bg-blue-100 text-blue-700 text-[11px] font-bold rounded-full mt-1">
                    {profile?.role}
                  </span>
                </div>
              </div>

              {profile?.phone && (
                <div className="flex items-start space-x-3">
                  <div className="mt-0.5 text-slate-400">
                    <Phone size={16} />
                  </div>
                  <div className="flex-1">
                    <span className="text-xs text-slate-400 block font-medium">Fone</span>
                    <span className="text-sm font-bold text-slate-800">{profile.phone}</span>
                  </div>
                </div>
              )}

              {profile?.chavePix && (
                <div className="flex items-start space-x-3">
                  <div className="mt-0.5 text-slate-400">
                    <Wallet size={16} />
                  </div>
                  <div className="flex-1">
                    <span className="text-xs text-slate-400 block font-medium">Chave Pix</span>
                    <span className="text-sm font-bold text-slate-800">{profile.chavePix}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Whatsapp bot connection */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Bot do WhatsApp</h3>
              <div className="flex items-center space-x-1.5">
                <div className={`w-2 h-2 rounded-full ${botStatus === 'online' ? 'bg-green-500 animate-pulse' : botStatus === 'pairing' ? 'bg-orange-500 animate-pulse' : 'bg-red-400'}`} />
                <span className={`text-[11px] font-bold uppercase tracking-wider ${botStatus === 'online' ? 'text-green-600' : botStatus === 'pairing' ? 'text-orange-600' : 'text-slate-500'}`}>
                  {botStatus === 'online' ? 'Online' : botStatus === 'pairing' ? 'Apareando' : 'Offline'}
                </span>
              </div>
            </div>

            <div className="space-y-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
              {/* Informative description */}
              <p className="text-xs text-slate-500 leading-relaxed">
                Este número é utilizado pelo sistema automatizado de respostas e disparos inteligentes associado ao seu usuário.
              </p>

              {/* Input for the phone number */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Número do WhatsApp do Bot {canEditBotNumber && <span className="text-red-500">*</span>}
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    disabled={!canEditBotNumber || saving}
                    placeholder="Ex: 5511999999999"
                    value={botNumberInput}
                    onChange={(e) => setBotNumberInput(e.target.value)}
                    className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-slate-800 disabled:bg-slate-100 disabled:text-slate-400 transition-all font-mono"
                  />
                  {canEditBotNumber && (
                    <button
                      onClick={handleSaveBotNumber}
                      disabled={saving || !botNumberInput}
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-md shadow-blue-100 flex items-center justify-center gap-1 min-w-[90px]"
                    >
                      {saving ? (
                        <RefreshCw size={14} className="animate-spin" />
                      ) : (
                        'Salvar'
                      )}
                    </button>
                  )}
                </div>
                {!canEditBotNumber ? (
                  <p className="text-[10px] text-slate-400 mt-1.5 leading-snug">
                    Apenas os Perfis <strong>Sala de Matrícula</strong>, <strong>SSA</strong>, <strong>Líder/FDV</strong>, <strong>FDV</strong>, <strong>FDV (Comercial)</strong> e <strong>Gerente Comercial</strong> têm permissão para inserir ou alterar este número.
                  </p>
                ) : (
                  <p className="text-[10px] text-slate-400 mt-1.5">
                    Digite o DDI + DDD + número (ex: 55 para Brasil). Use apenas números.
                  </p>
                )}
              </div>

              {/* Bot status-based connection actions */}
              {cleanSavedNumber ? (
                <div className="pt-2 border-t border-slate-200/60">
                  {botStatus === 'online' ? (
                    <div className="bg-green-50 rounded-xl p-3 border border-green-100 flex items-center space-x-3 text-green-800">
                      <CheckCircle2 className="text-green-500 shrink-0" size={18} />
                      <div className="text-xs">
                        <p className="font-bold">WhatsApp Conectado!</p>
                        <p className="text-[11px] text-green-600 mt-0.5">O bot está atendendo e enviando mensagens ativamente no número {profile.botNumber}.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="bg-red-50 rounded-xl p-3 border border-red-100 flex items-center space-x-3 text-red-800">
                        <XCircle className="text-red-500 shrink-0" size={18} />
                        <div className="text-xs">
                          <p className="font-bold">WhatsApp Desconectado</p>
                          <p className="text-[11px] text-red-600 mt-0.5">Seu bot está offline. Inicie uma solicitação de conexão para gerar o código.</p>
                        </div>
                      </div>

                      {/* Connection Trigger Button */}
                      <button
                        onClick={handleConnect}
                        disabled={connecting}
                        className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-600 text-white py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-200"
                      >
                        {connecting ? (
                          <>
                            <RefreshCw size={16} className="animate-spin" />
                            <span>Solicitando Conexão...</span>
                          </>
                        ) : (
                          <>
                            <Smartphone size={16} />
                            <span>Conectar e Gerar QR / Código</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-slate-100/70 p-3 rounded-xl text-center text-xs text-slate-500">
                  Cadastre um número de WhatsApp acima para ativar as opções de conexão do bot.
                </div>
              )}

              {/* Real-time QR and pairing code container pulled from server status */}
              {botInfo && botStatus === 'pairing' && (botInfo.pairingCode || botInfo.qrUrl) && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-3 bg-white p-4 rounded-xl border-2 border-dashed border-slate-200 text-center flex flex-col gap-4 items-center shadow-inner"
                >
                  <div className="flex items-center space-x-1.5 text-orange-600">
                    <QrIcon size={16} />
                    <span className="text-xs font-bold uppercase tracking-wider">Código Prontidão</span>
                  </div>

                  {botInfo.qrUrl && (
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <p className="text-[10px] text-slate-500 mb-2">Aponte a câmera do WhatsApp para escancear o QR Code:</p>
                      <img src={botInfo.qrUrl} alt="QR Code WhatsApp" className="mx-auto rounded w-48 h-48 object-contain" referrerPolicy="no-referrer" />
                    </div>
                  )}

                  {botInfo.pairingCode && (
                    <div className="w-full">
                      <p className="text-[10px] text-slate-500 mb-1">{botInfo.qrUrl ? 'Ou utilize' : 'Utilize'} o Pairing Code no aparelho:</p>
                      <div className="bg-slate-950 text-white rounded-lg p-3 font-mono text-2xl tracking-widest font-bold max-w-[200px] mx-auto select-all shadow-md">
                        {botInfo.pairingCode}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl font-semibold text-sm text-slate-700 transition"
          >
            Fechar
          </button>
        </div>
      </motion.div>
    </div>
  );
}
