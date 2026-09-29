import { useState } from 'react';
import { 
  Send, 
  CheckCheck, 
  Smartphone, 
  User, 
  ExternalLink, 
  Sparkles,
  Bot,
  CheckCircle2,
  Info
} from 'lucide-react';
import { Patient, WhatsAppMessage, MessageTemplate, BSPConfig } from '../types';
import { generatePersonalizedMessage } from '../utils/messageGenerator';

interface WhatsAppSimulatorProps {
  patients: Patient[];
  templates: MessageTemplate[];
  messages: WhatsAppMessage[];
  bspConfig: BSPConfig;
  onSendMessage: (msg: WhatsAppMessage) => void;
  onReceiveReply: (messageId: string, replyText: string) => void;
  initialPatientId?: string;
}

export const WhatsAppSimulator = ({
  patients,
  templates,
  messages,
  bspConfig,
  onSendMessage,
  onReceiveReply,
  initialPatientId,
}: WhatsAppSimulatorProps) => {
  // Patient selection state
  const [selectedPatientId, setSelectedPatientId] = useState<string>(
    initialPatientId || patients[0]?.id || ''
  );
  const [recipientType, setRecipientType] = useState<'caregiver' | 'pasien'>('caregiver');

  // Composer state
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(templates[0]?.id || 'custom');
  const [isCustomTemplate, setIsCustomTemplate] = useState(false);
  const [customMessageBody, setCustomMessageBody] = useState('');
  const [simulatedReplyText, setSimulatedReplyText] = useState('');

  const activePatient = patients.find(p => p.id === selectedPatientId) || patients[0];
  const activeTemplate = templates.find(t => t.id === selectedTemplateId) || templates[0];

  // Derive target recipient info from patient
  const currentRecipientName = recipientType === 'caregiver'
    ? (activePatient?.caregiver?.nama || 'Caregiver')
    : (activePatient?.nama || 'Pasien');

  const currentRecipientPhone = recipientType === 'caregiver'
    ? (activePatient?.caregiver?.noTelepon || '')
    : (activePatient?.noTelepon || '');

  const currentRecipientRole = recipientType === 'caregiver'
    ? `Caregiver (${activePatient?.caregiver?.hubungan || 'Keluarga'})`
    : 'Pasien Langsung';

  // Active chat messages for this target
  const chatMessages = messages.filter(m => m.patientId === activePatient?.id);

  // Generate personalized text for preview
  const preview = activePatient && activeTemplate && !isCustomTemplate
    ? generatePersonalizedMessage(activeTemplate, activePatient, recipientType)
    : {
        body: customMessageBody || 'Selamat pagi. Ini adalah pesan pengingat dari Sidora RSJ Naimata.',
        recipientName: currentRecipientName || 'Penerima',
        recipientPhone: currentRecipientPhone || '',
      };

  const messageToSend = isCustomTemplate ? customMessageBody : preview.body;

  // Send to virtual chat simulator
  const handleSendToSimulator = (textOverride?: string) => {
    if (!activePatient) return;
    const text = textOverride || messageToSend;
    if (!text.trim()) return;

    const newMsg: WhatsAppMessage = {
      id: `msg-${Date.now()}`,
      patientId: activePatient.id,
      patientName: activePatient.nama,
      noRM: activePatient.noRM,
      recipientPhone: currentRecipientPhone,
      recipientName: currentRecipientName,
      recipientType: recipientType === 'caregiver' ? 'Caregiver' : 'Pasien',
      category: isCustomTemplate ? 'edukasi_rsj' : activeTemplate.category,
      title: isCustomTemplate ? 'Uji Coba Pesan Kustom' : activeTemplate.nama,
      body: text,
      status: 'read', // virtual double blue tick
      scheduledAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      sentAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
      deliveredAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
      readAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
      bspProvider: `${bspConfig.providerName.toUpperCase()} (${bspConfig.isSimulationMode ? 'Simulasi' : 'Live Gateway'})`,
    };

    onSendMessage(newMsg);
  };

  // Open in real WhatsApp via wa.me link
  const handleOpenRealWA = () => {
    const rawPhone = currentRecipientPhone.replace(/[^0-9]/g, '');
    if (!rawPhone) {
      alert('Nomor telepon pasien/caregiver belum terisi.');
      return;
    }
    const phoneWithCountry = rawPhone.startsWith('0') ? '62' + rawPhone.slice(1) : rawPhone;
    const textEncoded = encodeURIComponent(messageToSend);
    window.open(`https://wa.me/${phoneWithCountry}?text=${textEncoded}`, '_blank');
  };

  // Handle simulated patient / caregiver reply
  const handlePatientReply = (reply: string) => {
    if (!reply.trim() || chatMessages.length === 0) return;
    const latestMsg = [...chatMessages].reverse().find(m => m.status !== 'replied') || chatMessages[chatMessages.length - 1];
    if (latestMsg) {
      onReceiveReply(latestMsg.id, reply);
    }
    setSimulatedReplyText('');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
              WhatsApp Chat Simulator
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              Simulator Interaksi &amp; Uji Coba Pesan Pasien
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Uji coba pengiriman pesan otomatis dan simulasi respons dua arah langsung ke profil data pasien / caregiver.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
          <Info className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="text-slate-600">
            Sumber Pengirim: <strong className="font-mono text-slate-900">{bspConfig.senderNumber || '0811-9876-0099'}</strong> ({bspConfig.providerName.toUpperCase()})
          </span>
        </div>
      </div>

      {/* Main Grid: Left (Patient & Composer) | Right (Smartphone Simulator) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Target & Message Composer (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* A. TARGET PATIENT SELECTION CARD */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-emerald-600" />
                Pilih Pasien Target
              </h3>
              <span className="text-[10px] text-slate-400 font-mono">
                Total: {patients.length} Pasien
              </span>
            </div>

            <select
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-800 bg-white focus:ring-2 focus:ring-emerald-500/20"
            >
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nama} ({p.noRM}) - {p.diagnosaMedis.split(' ')[0]}
                </option>
              ))}
            </select>

            {activePatient && (
              <div className="text-xs bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5 text-slate-600">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-900">Pasien:</span>
                  <span className="font-mono text-slate-700">{activePatient.nama} ({activePatient.noTelepon || 'Tanpa WA'})</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-900">Caregiver:</span>
                  <span className="font-mono text-slate-700">{activePatient.caregiver.nama} ({activePatient.caregiver.hubungan}) - {activePatient.caregiver.noTelepon}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-900">DPJP:</span>
                  <span className="text-slate-700">{activePatient.dokterDPJP}</span>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-slate-200">
                  <span className="font-semibold text-slate-900">Kepatuhan Obat:</span>
                  <span className="font-bold text-emerald-700">{activePatient.kepatuhanMinumObatPersen}%</span>
                </div>
              </div>
            )}

            {/* Recipient Target Radio */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Tujuan Pengiriman:</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setRecipientType('caregiver')}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
                    recipientType === 'caregiver'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Caregiver ({activePatient?.caregiver?.nama || 'Keluarga'})
                </button>
                <button
                  type="button"
                  onClick={() => setRecipientType('pasien')}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
                    recipientType === 'pasien'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Pasien Langsung
                </button>
              </div>
            </div>

            {/* Quick Helper Tip */}
            <div className="p-2.5 bg-emerald-50/70 border border-emerald-200/80 rounded-xl text-[11px] text-emerald-900 flex items-start gap-2">
              <span className="text-emerald-700 font-bold shrink-0">💡 Tip Uji Coba:</span>
              <span>
                Untuk menguji langsung ke nomor HP Anda atau orang terdekat, cukup buka menu <strong>Data Pasien</strong> dan ganti nomor HP salah satu pasien/caregiver dengan nomor tersebut.
              </span>
            </div>
          </div>

          {/* B. TEMPLATE COMPOSER & ACTIONS */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Bot className="w-3.5 h-3.5 text-emerald-600" />
                Pilih Template / Format Pesan
              </h3>
              <div className="flex items-center gap-1 text-[11px] font-semibold">
                <input
                  type="checkbox"
                  id="custom-toggle"
                  checked={isCustomTemplate}
                  onChange={(e) => {
                    setIsCustomTemplate(e.target.checked);
                    if (e.target.checked && !customMessageBody) {
                      setCustomMessageBody(preview.body);
                    }
                  }}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="custom-toggle" className="cursor-pointer text-slate-600">
                  Edit Bebas
                </label>
              </div>
            </div>

            {!isCustomTemplate ? (
              <select
                value={selectedTemplateId}
                onChange={(e) => setSelectedTemplateId(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium text-slate-800 bg-white"
              >
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    [{t.kode}] {t.nama}
                  </option>
                ))}
              </select>
            ) : null}

            {/* Editable or Preview Textarea */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label className="font-semibold text-slate-700">
                  {isCustomTemplate ? 'Isi Teks Pesan Kustom:' : 'Pratinjau Pesan yang Dihasilkan:'}
                </label>
                <span className="text-[10px] text-slate-500 font-mono">
                  Penerima: {currentRecipientName} ({currentRecipientPhone || 'Tanpa no WA'})
                </span>
              </div>

              {isCustomTemplate ? (
                <textarea
                  rows={6}
                  value={customMessageBody}
                  onChange={(e) => setCustomMessageBody(e.target.value)}
                  className="w-full p-3 rounded-xl bg-white border border-emerald-300 text-xs font-mono text-slate-800 focus:ring-2 focus:ring-emerald-500/20 leading-relaxed"
                  placeholder="Ketik pesan WhatsApp uji coba Anda di sini..."
                />
              ) : (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-700 whitespace-pre-line max-h-48 overflow-y-auto leading-relaxed select-text">
                  {preview.body}
                </div>
              )}
            </div>

            {/* ACTION BUTTONS */}
            <div className="pt-1">
              <div className="grid grid-cols-2 gap-2">
                {/* 1. Kirim ke Simulator */}
                <button
                  type="button"
                  onClick={() => handleSendToSimulator()}
                  className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  Kirim ke Simulator
                </button>

                {/* 2. Buka di WhatsApp Asli */}
                <button
                  type="button"
                  onClick={handleOpenRealWA}
                  className="py-2.5 px-3 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-semibold border border-teal-200 flex items-center justify-center gap-1.5 transition-colors"
                  title="Buka pesan di WhatsApp Web/App ke nomor tujuan"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-teal-600" />
                  Buka di WA Asli (wa.me)
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live WhatsApp Chat Window & Simulated Reply (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          {/* Smartphone Chat Simulator Window */}
          <div className="bg-[#efeae2] rounded-2xl border border-slate-300 shadow-md overflow-hidden flex flex-col h-[580px]">
            
            {/* WhatsApp Chat Header */}
            <div className="bg-[#075e54] text-white px-4 py-3 flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-700 flex items-center justify-center text-white font-bold text-sm border-2 border-emerald-400 shadow-xs">
                  {currentRecipientName.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="font-bold text-sm leading-tight flex items-center gap-1.5">
                    {currentRecipientName}
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-800 text-emerald-200">
                      {activePatient?.noRM}
                    </span>
                  </div>
                  <div className="text-[11px] text-emerald-200 flex items-center gap-1">
                    <span>{currentRecipientRole}</span>
                    <span>•</span>
                    <span className="font-mono">{currentRecipientPhone || 'Tanpa no WA'}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-800/80 text-emerald-200">
                  Pengirim: {bspConfig.senderNumber || 'Admin RSJ'}
                </span>
              </div>
            </div>

            {/* Chat Bubble List */}
            <div 
              className="flex-1 p-4 overflow-y-auto space-y-3"
              style={{
                backgroundImage: `radial-gradient(#d1c7b7 1px, transparent 1px)`,
                backgroundSize: '16px 16px',
              }}
            >
              {chatMessages.length === 0 ? (
                <div className="text-center py-16 text-slate-500 text-xs space-y-2">
                  <div className="w-12 h-12 rounded-full bg-white/70 mx-auto flex items-center justify-center text-slate-400 shadow-2xs">
                    <Smartphone className="w-6 h-6" />
                  </div>
                  <p className="font-semibold text-slate-700">
                    Belum ada riwayat pesan untuk {currentRecipientName} ({currentRecipientPhone || 'Tanpa no WA'}).
                  </p>
                  <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                    Klik tombol <strong>&quot;Kirim ke Simulator&quot;</strong> atau <strong>&quot;Buka di WA Asli&quot;</strong> di panel kiri untuk mulai menguji pesan.
                  </p>
                </div>
              ) : (
                chatMessages.map((msg) => (
                  <div key={msg.id} className="space-y-2">
                    {/* Outgoing Bubble (from Sidora RSJ) */}
                    <div className="flex justify-end">
                      <div className="bg-[#d9fdd3] text-slate-900 rounded-2xl rounded-tr-xs p-3.5 max-w-[85%] shadow-xs border border-emerald-100">
                        <div className="text-[10px] font-semibold text-emerald-800 mb-1 flex items-center justify-between gap-2">
                          <span>{msg.title}</span>
                          <span className="text-slate-400 font-normal">{msg.recipientType}</span>
                        </div>
                        <p className="whitespace-pre-line text-xs leading-relaxed select-text">
                          {msg.body}
                        </p>
                        <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-slate-500">
                          <span>{msg.sentAt?.slice(11, 16) || 'Barusan'}</span>
                          <CheckCheck className={`w-3.5 h-3.5 ${['read', 'replied'].includes(msg.status) ? 'text-sky-600' : 'text-slate-400'}`} />
                        </div>
                      </div>
                    </div>

                    {/* Incoming Bubble (Patient / Caregiver Reply) */}
                    {msg.replyText && (
                      <div className="flex justify-start">
                        <div className="bg-white text-slate-900 rounded-2xl rounded-tl-xs p-3.5 max-w-[85%] shadow-xs border border-slate-200">
                          <div className="text-[10px] font-bold text-slate-600 mb-0.5">
                            {msg.recipientName} ({msg.recipientType})
                          </div>
                          <p className="text-xs leading-relaxed text-slate-800 font-medium select-text">
                            {msg.replyText}
                          </p>
                          <div className="text-right text-[10px] text-slate-400 mt-1">
                            {msg.repliedAt?.slice(11, 16) || 'Barusan'}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Patient Simulated Reply Bar (Quick Buttons & Input) */}
            <div className="bg-[#f0f2f5] p-3 border-t border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-emerald-600" />
                  Simulasikan Balasan Pasien / Caregiver:
                </span>
                <span className="text-[10px] text-slate-500">Klik tombol cepat atau ketik sendiri</span>
              </div>

              {/* Quick Reply Chips */}
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => handlePatientReply('1 - Sudah diminum obatnya ya sust')}
                  className="px-2.5 py-1 rounded-lg bg-white hover:bg-emerald-100 hover:text-emerald-900 text-slate-700 text-xs border border-slate-300 font-medium transition-colors"
                >
                  💬 1 - Sudah Minum Obat
                </button>
                <button
                  type="button"
                  onClick={() => handlePatientReply('HADIR - Siap datang kontrol besok pagi')}
                  className="px-2.5 py-1 rounded-lg bg-white hover:bg-purple-100 hover:text-purple-900 text-slate-700 text-xs border border-slate-300 font-medium transition-colors"
                >
                  🗓 HADIR Kontrol
                </button>
                <button
                  type="button"
                  onClick={() => handlePatientReply('RESCHEDULE - Mohon izin jadwal ulang karena ada keperluan mendadak')}
                  className="px-2.5 py-1 rounded-lg bg-white hover:bg-amber-100 hover:text-amber-900 text-slate-700 text-xs border border-slate-300 font-medium transition-colors"
                >
                  ⚠️ Minta Reschedule
                </button>
                <button
                  type="button"
                  onClick={() => handlePatientReply('OK - Resep Iterasi sudah kami terima, besok kami ambil ke farmasi')}
                  className="px-2.5 py-1 rounded-lg bg-white hover:bg-teal-100 hover:text-teal-900 text-slate-700 text-xs border border-slate-300 font-medium transition-colors"
                >
                  🔄 OK Resep Iterasi
                </button>
              </div>

              {/* Custom Reply Input Form */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  placeholder={`Ketik balasan simulasi dari ${currentRecipientName}...`}
                  value={simulatedReplyText}
                  onChange={(e) => setSimulatedReplyText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handlePatientReply(simulatedReplyText);
                    }
                  }}
                  className="flex-1 px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => handlePatientReply(simulatedReplyText)}
                  className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5"
                >
                  Balas
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
