import { useState, useMemo } from 'react';
import { 
  Send, 
  CheckCheck, 
  Smartphone, 
  User, 
  ExternalLink, 
  Sparkles,
  Bot,
  CheckCircle2,
  Info,
  Zap,
  Radio,
  Users,
  Layers,
  Terminal,
  Play,
  RotateCcw,
  BarChart3,
  MessageSquare,
  Clock,
  ShieldCheck,
  CheckCircle,
  ArrowRight,
  AlertCircle,
  FileBarChart2
} from 'lucide-react';
import { Patient, WhatsAppMessage, MessageTemplate, BSPConfig, ReminderCategory } from '../types';
import { generatePersonalizedMessage } from '../utils/messageGenerator';

interface WhatsAppSimulatorProps {
  patients: Patient[];
  templates: MessageTemplate[];
  messages: WhatsAppMessage[];
  bspConfig: BSPConfig;
  onSendMessage: (msg: WhatsAppMessage) => void;
  onReceiveReply: (messageId: string, replyText: string) => void;
  initialPatientId?: string;
  onBatchSend?: (messages: WhatsAppMessage[]) => void;
  onNavigateToDashboard?: () => void;
  onNavigateToReports?: () => void;
}

export const WhatsAppSimulator = ({
  patients,
  templates,
  messages,
  bspConfig,
  onSendMessage,
  onReceiveReply,
  initialPatientId,
  onBatchSend,
  onNavigateToDashboard,
  onNavigateToReports,
}: WhatsAppSimulatorProps) => {
  // Sub-menu navigation state
  const [activeSubTab, setActiveSubTab] = useState<'individual' | 'mass_blast'>('individual');

  // ============================================================
  // TAB 1: INDIVIDUAL CHAT SIMULATOR STATE
  // ============================================================
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

  // ============================================================
  // TAB 2: MASS BROADCAST SIMULATOR STATE & LOGIC
  // ============================================================
  const [blastCategory, setBlastCategory] = useState<'minum_obat' | 'kontrol_dokter' | 'iter_resep' | 'edukasi_rsj' | 'all_scheduled'>('all_scheduled');
  const [blastTarget, setBlastTarget] = useState<'default' | 'caregiver' | 'pasien'>('default');
  const [simulateReadStatus, setSimulateReadStatus] = useState<boolean>(true);
  const [isBroadcasting, setIsBroadcasting] = useState<boolean>(false);
  const [broadcastProgress, setBroadcastProgress] = useState<number>(0);
  const [broadcastLogs, setBroadcastLogs] = useState<string[]>([]);
  const [lastDispatchedBatch, setLastDispatchedBatch] = useState<WhatsAppMessage[] | null>(null);
  const [justRepliedInfo, setJustRepliedInfo] = useState<{ patientName: string; text: string } | null>(null);

  // Filter patients actively under supervision (not completed/referred/inactive)
  const supervisedPatients = useMemo(() => {
    return patients.filter(p => 
      p.notifikasiOtomatisAktif !== false && 
      p.statusPengawasan !== 'luar_pengawasan' &&
      p.statusPengawasan !== 'selesai_pengobatan' &&
      p.statusPengawasan !== 'rujuk_keluar'
    );
  }, [patients]);

  // Generate the preview queue of messages to be broadcasted
  const broadcastQueue = useMemo(() => {
    const queue: WhatsAppMessage[] = [];
    const nowIso = new Date().toISOString();
    const todayDateStr = nowIso.slice(0, 10);
    const timeNow = nowIso.replace('T', ' ').slice(0, 19);

    const obatTmpl = templates.find(t => t.category === 'minum_obat') || templates[0];
    const kontrolTmpl = templates.find(t => t.category === 'kontrol_dokter') || templates[1] || templates[0];
    const iterTmpl = templates.find(t => t.category === 'iter_resep') || templates[2] || templates[0];
    const edukasiTmpl = templates.find(t => t.category === 'edukasi_rsj') || templates[3] || templates[0];

    supervisedPatients.forEach((patient) => {
      // Determine recipient target
      let targetType: 'caregiver' | 'pasien' = 'caregiver';
      if (blastTarget === 'pasien') {
        targetType = 'pasien';
      } else if (blastTarget === 'caregiver') {
        targetType = 'caregiver';
      } else {
        // default from patient preference
        targetType = patient.caregiver.targetPenerima === 'pasien' ? 'pasien' : 'caregiver';
      }

      // 1. Minum Obat
      if (blastCategory === 'minum_obat' || blastCategory === 'all_scheduled') {
        if (obatTmpl) {
          const { body, recipientName, recipientPhone } = generatePersonalizedMessage(obatTmpl, patient, targetType);
          queue.push({
            id: `blast-med-${patient.id}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            patientId: patient.id,
            patientName: patient.nama,
            noRM: patient.noRM,
            recipientName,
            recipientPhone,
            recipientType: targetType === 'pasien' ? 'Pasien' : 'Caregiver',
            category: 'minum_obat',
            title: 'Pengingat Minum Obat Pagi (06:00 WIB)',
            body,
            status: simulateReadStatus ? 'read' : 'delivered',
            scheduledAt: `${todayDateStr} 06:00`,
            sentAt: timeNow,
            deliveredAt: timeNow,
            readAt: simulateReadStatus ? timeNow : undefined,
            bspProvider: `${bspConfig.providerName.toUpperCase()} (WABA Cloud API)`,
          });
        }
      }

      // 2. Kontrol Dokter
      if (blastCategory === 'kontrol_dokter' || (blastCategory === 'all_scheduled' && patient.jadwalKontrol?.tanggal)) {
        if (kontrolTmpl && patient.jadwalKontrol) {
          const { body, recipientName, recipientPhone } = generatePersonalizedMessage(kontrolTmpl, patient, targetType);
          queue.push({
            id: `blast-ctrl-${patient.id}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            patientId: patient.id,
            patientName: patient.nama,
            noRM: patient.noRM,
            recipientName,
            recipientPhone,
            recipientType: targetType === 'pasien' ? 'Pasien' : 'Caregiver',
            category: 'kontrol_dokter',
            title: `Pengingat Jadwal Kontrol Dokter (${patient.jadwalKontrol.tanggal})`,
            body,
            status: simulateReadStatus ? 'read' : 'delivered',
            scheduledAt: `${todayDateStr} 06:00`,
            sentAt: timeNow,
            deliveredAt: timeNow,
            readAt: simulateReadStatus ? timeNow : undefined,
            bspProvider: `${bspConfig.providerName.toUpperCase()} (WABA Cloud API)`,
          });
        }
      }

      // 3. Iterasi Resep
      if (blastCategory === 'iter_resep' || (blastCategory === 'all_scheduled' && patient.jadwalIter?.adaIter && patient.jadwalIter?.tanggalIter)) {
        if (iterTmpl && patient.jadwalIter?.adaIter) {
          const { body, recipientName, recipientPhone } = generatePersonalizedMessage(iterTmpl, patient, targetType);
          queue.push({
            id: `blast-iter-${patient.id}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            patientId: patient.id,
            patientName: patient.nama,
            noRM: patient.noRM,
            recipientName,
            recipientPhone,
            recipientType: targetType === 'pasien' ? 'Pasien' : 'Caregiver',
            category: 'iter_resep',
            title: 'Pengingat Jadwal Iter',
            body,
            status: simulateReadStatus ? 'read' : 'delivered',
            scheduledAt: `${todayDateStr} 06:00`,
            sentAt: timeNow,
            deliveredAt: timeNow,
            readAt: simulateReadStatus ? timeNow : undefined,
            bspProvider: `${bspConfig.providerName.toUpperCase()} (WABA Cloud API)`,
          });
        }
      }

      // 4. Edukasi Jiwa
      if (blastCategory === 'edukasi_rsj') {
        if (edukasiTmpl) {
          const { body, recipientName, recipientPhone } = generatePersonalizedMessage(edukasiTmpl, patient, targetType);
          queue.push({
            id: `blast-edu-${patient.id}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            patientId: patient.id,
            patientName: patient.nama,
            noRM: patient.noRM,
            recipientName,
            recipientPhone,
            recipientType: targetType === 'pasien' ? 'Pasien' : 'Caregiver',
            category: 'edukasi_rsj',
            title: 'Pesan Dukungan Semangat Keluarga',
            body,
            status: simulateReadStatus ? 'read' : 'delivered',
            scheduledAt: `${todayDateStr} 06:00`,
            sentAt: timeNow,
            deliveredAt: timeNow,
            readAt: simulateReadStatus ? timeNow : undefined,
            bspProvider: `${bspConfig.providerName.toUpperCase()} (WABA Cloud API)`,
          });
        }
      }
    });

    return queue;
  }, [supervisedPatients, blastCategory, blastTarget, simulateReadStatus, templates, bspConfig]);

  // Execute Mass Broadcast with Step-by-Step Simulated Progress
  const handleExecuteBroadcast = () => {
    if (broadcastQueue.length === 0) {
      alert('Tidak ada pesan dalam antrean pengiriman massal.');
      return;
    }

    setIsBroadcasting(true);
    setBroadcastProgress(5);
    setBroadcastLogs([]);
    setJustRepliedInfo(null);

    const timeStr = () => new Date().toLocaleTimeString('id-ID', { hour12: false });
    const initialLogs: string[] = [
      `[${timeStr()}] 📡 Menginisialisasi koneksi endpoint WhatsApp Business API Gateway...`,
      `[${timeStr()}] 🔐 Otentikasi Bearer API Token (Provider: ${bspConfig.providerName.toUpperCase()})... Berhasil (200 OK)`,
      `[${timeStr()}] 📋 Memuat antrean ${broadcastQueue.length} pesan pengingat pasien rawat jalan...`
    ];
    setBroadcastLogs(initialLogs);

    const total = broadcastQueue.length;
    let currentIdx = 0;

    const interval = setInterval(() => {
      if (currentIdx < total) {
        const msg = broadcastQueue[currentIdx];
        const pct = Math.round(((currentIdx + 1) / total) * 90) + 5;
        setBroadcastProgress(pct);

        const categoryLabel = 
          msg.category === 'minum_obat' ? 'Minum Obat' :
          msg.category === 'kontrol_dokter' ? 'Kontrol Dokter' :
          msg.category === 'iter_resep' ? 'Iterasi Resep' : 'Edukasi';

        setBroadcastLogs(prev => [
          ...prev,
          `[${timeStr()}] 📤 [POST] /v1/messages -> ${msg.recipientPhone || 'No WA'} (${msg.recipientName} - ${msg.patientName}) [${categoryLabel}] | Status: ${msg.status.toUpperCase()} (wamid.${msg.id.slice(-6)})`
        ]);

        currentIdx++;
      } else {
        clearInterval(interval);
        setBroadcastProgress(100);
        setBroadcastLogs(prev => [
          ...prev,
          `[${timeStr()}] ✨ SUKSES! Seluruh ${total} pesan berhasil didistribusikan secara serentak ke WhatsApp Gateway.`,
          `[${timeStr()}] 📊 Metrik keterbacaan & analitik Dasbor Utama telah disinkronkan secara real-time.`
        ]);
        setIsBroadcasting(false);
        setLastDispatchedBatch(broadcastQueue);

        // Dispatch messages to global app state and Supabase!
        if (onBatchSend) {
          onBatchSend(broadcastQueue);
        } else {
          broadcastQueue.forEach(m => onSendMessage(m));
        }
      }
    }, 350);
  };

  // Quick Action: Simulate 1 Patient Replying Positive Confirmation
  const handleSimulateOneReply = () => {
    if (!lastDispatchedBatch || lastDispatchedBatch.length === 0) {
      alert('Silakan jalankan pengiriman massal terlebih dahulu.');
      return;
    }

    // Prioritize medication reminder message
    const targetMsg = lastDispatchedBatch.find(m => m.category === 'minum_obat') || lastDispatchedBatch[0];
    const replyText = '1 - Sudah diminum obatnya ya sust';
    
    onReceiveReply(targetMsg.id, replyText);
    setJustRepliedInfo({
      patientName: targetMsg.patientName,
      text: replyText,
    });
  };

  // Navigate to individual chat tab for a specific patient
  const handleOpenIndividualChat = (patientId: string) => {
    setSelectedPatientId(patientId);
    setActiveSubTab('individual');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Smartphone className="w-5 h-5 text-emerald-600 shrink-0" />
            Simulator Interaksi Pesan WhatsApp
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Uji coba simulasi pengiriman pesan individual (1-on-1) maupun simulasi broadcast massal.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-2xs">
          <Info className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="text-slate-600">
            Sumber Pengirim: <strong className="font-mono text-slate-900">{bspConfig.senderNumber || '0811-9876-0099'}</strong> ({bspConfig.providerName.toUpperCase()})
          </span>
        </div>
      </div>

      {/* Sub-menu Tabs: Individual Chat vs Mass Broadcast */}
      <div className="flex border-b border-slate-200 bg-white rounded-2xl p-1.5 shadow-2xs gap-1.5">
        <button
          onClick={() => setActiveSubTab('individual')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
            activeSubTab === 'individual'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Smartphone className="w-4 h-4" />
          <span>Simulasi Chat Per Pasien (1-on-1)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('mass_blast')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all relative ${
            activeSubTab === 'mass_blast'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Zap className="w-4 h-4 text-amber-300" />
          <span>Simulasi Pengiriman Massal (Broadcast Demo)</span>
          <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-900">
            Fitur Demo
          </span>
        </button>
      </div>

      {/* ============================================================ */}
      {/* VIEW 1: INDIVIDUAL CHAT SIMULATOR (1-on-1) */}
      {/* ============================================================ */}
      {activeSubTab === 'individual' && (
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
                  Untuk menguji langsung ke nomor HP Anda atau pimpinan, cukup buka menu <strong>Data Pasien</strong> dan ganti nomor HP salah satu pasien/caregiver dengan nomor tersebut.
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
                  <button
                    type="button"
                    onClick={() => handleSendToSimulator()}
                    className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    Kirim ke Simulator
                  </button>

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
      )}

      {/* ============================================================ */}
      {/* VIEW 2: MASS BROADCAST SIMULATOR (BROADCAST DEMO KE SEMUA PASIEN) */}
      {/* ============================================================ */}
      {activeSubTab === 'mass_blast' && (
        <div className="space-y-6">
          {/* Hero Banner for Broadcast Demo */}
          <div className="bg-gradient-to-br from-slate-900 via-emerald-950 to-teal-900 text-white p-6 rounded-3xl shadow-md border border-emerald-800/40 relative overflow-hidden">
            <div className="absolute right-0 top-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  <Zap className="w-3.5 h-3.5 text-amber-300" />
                  Mode Demonstrasi: Broadcast Massal WhatsApp Cloud API
                </div>
                <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  Simulasi Pengiriman Pesan Sekaligus ke Semua Pasien &amp; Caregiver
                </h3>
                <p className="text-xs sm:text-sm text-emerald-100/80 leading-relaxed">
                  Fitur ini dirancang khusus untuk demo kepada <strong>Pimpinan / Audiens</strong>. Sekali klik, sistem akan menyalurkan pesan pengingat ke seluruh nomor WhatsApp pasien rawat jalan yang terdaftar. Data langsung tersimpan ke Supabase dan seluruh metrik di <strong>Dasbor Utama (Otomatis)</strong> akan langsung bergerak naik secara real-time.
                </p>
              </div>

              {/* Quick Counter Box */}
              <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15 min-w-[240px] space-y-2">
                <div className="text-[11px] font-semibold text-emerald-200 uppercase tracking-wider">
                  Target Sasaran Siap Kirim
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-white">{supervisedPatients.length}</span>
                  <span className="text-xs text-emerald-200">Pasien Aktif</span>
                  <span className="text-xs text-emerald-300/80">({broadcastQueue.length} Pesan)</span>
                </div>
                <div className="text-[11px] text-emerald-100/70 pt-2 border-t border-white/10 flex items-center justify-between">
                  <span>Gateway:</span>
                  <span className="font-mono text-white font-bold">{bspConfig.providerName.toUpperCase()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Configuration & Trigger Controls */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Radio className="w-4 h-4 text-emerald-600" />
                  Konfigurasi Parameter Pengiriman Massal
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tentukan kategori reminder dan sasaran penerima sebelum menjalankan demonstrasi broadcast.
                </p>
              </div>

              {/* Ready Badge */}
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                {supervisedPatients.length} Pasien dalam Pengawasan Siap
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* 1. Kategori Pengingat */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  1. Kategori Pesan Pengingat:
                </label>
                <select
                  value={blastCategory}
                  onChange={(e) => setBlastCategory(e.target.value as any)}
                  disabled={isBroadcasting}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-white focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="all_scheduled">🌟 Jadwal Terpadu Lengkap (Obat + Kontrol + Iterasi)</option>
                  <option value="minum_obat">💊 Pengingat Minum Obat Pagi (Seragam ke Semua Pasien)</option>
                  <option value="kontrol_dokter">🩺 Pengingat Jadwal Kontrol Dokter (Pasien Berjadwal)</option>
                  <option value="iter_resep">📋 Pengingat Iterasi Farmasi (Pasien dengan Iter)</option>
                  <option value="edukasi_rsj">🌱 Pesan Edukasi &amp; Dukungan Semangat Keluarga</option>
                </select>
              </div>

              {/* 2. Target Sasaran Penerima */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  2. Sasaran Penerima:
                </label>
                <select
                  value={blastTarget}
                  onChange={(e) => setBlastTarget(e.target.value as any)}
                  disabled={isBroadcasting}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-white focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="default">Sesuai Profil Pasien (Utamakan Caregiver)</option>
                  <option value="caregiver">Keluarga / Caregiver Saja</option>
                  <option value="pasien">Pasien Saja</option>
                </select>
              </div>

              {/* 3. Status Simulasi */}
              <div className="flex flex-col justify-end">
                <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors">
                  <input
                    type="checkbox"
                    checked={simulateReadStatus}
                    onChange={(e) => setSimulateReadStatus(e.target.checked)}
                    disabled={isBroadcasting}
                    className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                  />
                  <span className="text-xs text-slate-700 font-semibold">
                    Simulasikan langsung <strong>Dibaca (Read)</strong> oleh pasien
                  </span>
                </label>
              </div>
            </div>

            {/* ACTION BUTTON */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-slate-500 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Antrean siap dieksekusi: <strong className="text-slate-800">{broadcastQueue.length} pesan terpersonalisasi</strong>
              </div>

              <button
                type="button"
                onClick={handleExecuteBroadcast}
                disabled={isBroadcasting || broadcastQueue.length === 0}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black text-sm shadow-md flex items-center justify-center gap-2 transition-all transform active:scale-98"
              >
                {isBroadcasting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Sedang Mengirimkan ({broadcastProgress}%)...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 text-amber-300" />
                    <span>🚀 Mulai Simulasi Pengiriman Massal ({broadcastQueue.length} Pesan)</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Live API Dispatch Progress Monitor */}
          {(isBroadcasting || broadcastLogs.length > 0) && (
            <div className="bg-slate-900 text-slate-200 p-5 rounded-2xl border border-slate-800 shadow-md space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold flex items-center gap-2 text-emerald-400">
                  <Terminal className="w-4 h-4" />
                  Live API Dispatcher Terminal (Simulasi WhatsApp Business API)
                </span>
                <span className="font-mono text-emerald-300 font-bold">
                  Progress: {broadcastProgress}%
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-300 h-2.5 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${broadcastProgress}%` }}
                />
              </div>

              {/* Console Logs Box */}
              <div className="bg-black/60 p-3.5 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 space-y-1.5 max-h-52 overflow-y-auto scrollbar-thin">
                {broadcastLogs.map((log, idx) => (
                  <div 
                    key={idx} 
                    className={`${log.includes('SUKSES') ? 'text-emerald-400 font-bold' : log.includes('[POST]') ? 'text-teal-300' : 'text-slate-400'}`}
                  >
                    {log}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* POST-BROADCAST DEMO ACTIONS (AUDIENCE WOW FACTOR) */}
          {lastDispatchedBatch && lastDispatchedBatch.length > 0 && !isBroadcasting && (
            <div className="bg-emerald-50 border-2 border-emerald-300 p-5 rounded-2xl shadow-xs space-y-4 animate-in fade-in duration-300">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-black text-emerald-950 text-sm sm:text-base">
                    🎉 Pengiriman Massal Sukses! {lastDispatchedBatch.length} Pesan Telah Disalurkan
                  </h4>
                  <p className="text-xs text-emerald-800 mt-0.5">
                    Seluruh pesan telah disimpan ke basis data Supabase. Sekarang Anda dapat memperagakan kepada pimpinan bagaimana pesan dibalas dan bagaimana dasbor otomatis langsung bereaksi!
                  </p>
                </div>
              </div>

              {/* Interactive Demo Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                {/* 1. Simulate Patient Reply */}
                <button
                  type="button"
                  onClick={handleSimulateOneReply}
                  className="p-3 rounded-xl bg-white hover:bg-emerald-100/70 border border-emerald-300 text-left transition-all shadow-2xs group"
                >
                  <div className="flex items-center justify-between text-xs font-bold text-emerald-900 mb-1">
                    <span className="flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                      1. Pasien Membalas
                    </span>
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  </div>
                  <p className="text-[11px] text-slate-600">
                    Simulasikan pasien mengetik <strong>&quot;1 - Sudah Minum Obat&quot;</strong>. Kepatuhan pasien langsung 100%!
                  </p>
                </button>

                {/* 2. Open Real-Time Dashboard */}
                <button
                  type="button"
                  onClick={() => onNavigateToDashboard?.()}
                  className="p-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-left transition-all shadow-2xs group"
                >
                  <div className="flex items-center justify-between text-xs font-bold text-emerald-100 mb-1">
                    <span className="flex items-center gap-1.5">
                      <BarChart3 className="w-3.5 h-3.5 text-white" />
                      2. Lihat Dasbor Utama
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                  <p className="text-[11px] text-emerald-100/90">
                    Buka Dasbor Otomatis sekarang untuk membuktikan grafik &amp; angka KPI naik secara real-time!
                  </p>
                </button>

                {/* 3. Open Individual Chat Simulator */}
                <button
                  type="button"
                  onClick={() => {
                    const firstMsg = lastDispatchedBatch[0];
                    if (firstMsg) {
                      handleOpenIndividualChat(firstMsg.patientId);
                    } else {
                      setActiveSubTab('individual');
                    }
                  }}
                  className="p-3 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-left transition-all shadow-2xs"
                >
                  <div className="flex items-center justify-between text-xs font-bold text-slate-900 mb-1">
                    <span className="flex items-center gap-1.5">
                      <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                      3. Buka Chat 1-on-1
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    Periksa tampilan gelembung chat hijau di layar smartphone simulasi untuk pasien ini.
                  </p>
                </button>
              </div>

              {/* Just Replied Banner */}
              {justRepliedInfo && (
                <div className="p-3 bg-emerald-100 border border-emerald-300 rounded-xl text-xs text-emerald-900 flex items-center justify-between gap-2 animate-in fade-in duration-200">
                  <div className="flex items-center gap-2">
                    <CheckCheck className="w-4 h-4 text-emerald-700" />
                    <span>
                      Balasan konfirmasi dari <strong>{justRepliedInfo.patientName}</strong> diterima: <em>&quot;{justRepliedInfo.text}&quot;</em>. Kepatuhan pasien kini <strong>100%</strong> dan Kepatuhan Obat di Dasbor Utama otomatis bertambah!
                    </span>
                  </div>
                  <button
                    onClick={() => onNavigateToDashboard?.()}
                    className="px-2.5 py-1 rounded-lg bg-emerald-800 text-white font-bold text-[11px] hover:bg-emerald-900 shrink-0"
                  >
                    Buka Dasbor ➔
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Table Preview of Target Queue / Dispatched List */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-600" />
                  Daftar Pasien &amp; Pratinjau Pesan yang Dikirimkan ({broadcastQueue.length})
                </h4>
                <p className="text-xs text-slate-500">
                  Rincian pesan perorangan yang dipersonalisasi sesuai profil resep dan jadwal masing-masing.
                </p>
              </div>

              <div className="text-xs text-slate-500">
                Penyedia: <strong className="text-slate-800 font-mono">{bspConfig.providerName}</strong>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">No</th>
                    <th className="py-3 px-4">Pasien &amp; No. RM</th>
                    <th className="py-3 px-4">Tujuan (Penerima)</th>
                    <th className="py-3 px-4">Kategori Pesan</th>
                    <th className="py-3 px-4">Status Pengiriman</th>
                    <th className="py-3 px-4">Pratinjau Pesan</th>
                    <th className="py-3 px-4 text-center">Aksi Demo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {broadcastQueue.map((item, idx) => (
                    <tr key={item.id || idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 text-slate-400 font-mono">{idx + 1}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        <div>{item.patientName}</div>
                        <div className="text-[10px] text-slate-400 font-mono font-normal">{item.noRM}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">{item.recipientName}</div>
                        <div className="text-[10px] font-mono text-emerald-700">{item.recipientPhone || 'Tanpa no WA'}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          item.category === 'minum_obat' ? 'bg-emerald-100 text-emerald-800' :
                          item.category === 'kontrol_dokter' ? 'bg-purple-100 text-purple-800' :
                          item.category === 'iter_resep' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {item.category === 'minum_obat' ? 'Minum Obat' :
                           item.category === 'kontrol_dokter' ? 'Kontrol Dokter' :
                           item.category === 'iter_resep' ? 'Iterasi Resep' : 'Edukasi'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
                          <CheckCheck className={`w-3.5 h-3.5 ${item.status === 'read' ? 'text-sky-600' : 'text-slate-400'}`} />
                          <span className="capitalize">{item.status === 'read' ? 'Terbaca' : 'Terkirim'}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        <p className="truncate text-slate-600 text-[11px]" title={item.body}>
                          {item.body.replace(/\n+/g, ' ')}
                        </p>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleOpenIndividualChat(item.patientId)}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 hover:bg-emerald-100 hover:text-emerald-900 text-slate-700 transition-colors"
                          title="Buka chat pasien ini di smartphone simulator"
                        >
                          Lihat Chat ➔
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
