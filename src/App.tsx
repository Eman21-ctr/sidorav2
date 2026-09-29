import { useState, useEffect, useCallback } from 'react';
import { 
  Navbar, 
  NavTab 
} from './components/Navbar';
import { DashboardOverview } from './components/DashboardOverview';
import { ManualDashboard } from './components/ManualDashboard';
import { PatientManagement } from './components/PatientManagement';
import { UnifiedMessageAutomation } from './components/UnifiedMessageAutomation';
import { WhatsAppSimulator } from './components/WhatsAppSimulator';
import { ReportsAndLogs } from './components/ReportsAndLogs';

import { CheckCircle2, X, Sparkles, Loader2, WifiOff, CloudOff, Database } from 'lucide-react';

import { generatePersonalizedMessage } from './utils/messageGenerator';
import { Patient, WhatsAppMessage } from './types';
import { RSJ_INFO, INITIAL_PATIENTS } from './data/initialData';
import { useSupabaseData } from './hooks/useSupabaseData';
import { getTodayDateStr, computeRealDailyAnalytics } from './utils/analyticsHelper';
import { SidoraLogo } from './components/SidoraLogo';
import { PWAInstallBanner } from './components/PWAInstallBanner';


export default function App() {
  // Navigation
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');

  const [targetPatientForSimulator, setTargetPatientForSimulator] = useState<string | undefined>(undefined);

  // Auto Notification Toast
  const [autoToast, setAutoToast] = useState<{
    visible: boolean;
    title: string;
    message: string;
    count: number;
  }>({ visible: false, title: '', message: '', count: 0 });

  // ============================================================
  // SUPABASE DATA HOOK — replaces all localStorage state management
  // ============================================================
  const {
    patients, setPatients,
    templates, setTemplates,
    messages, setMessages,
    bspConfig, setBspConfig,
    analytics, setAnalytics,
    automationSettings, setAutomationSettings,

    isLoading,
    isConnected,
    connectionError,

    // Sync helpers
    syncPatient,
    syncDeletePatient,
    syncDeleteAllPatients,
    syncPatients,
    syncTemplate,
    syncMessage,
    syncMessages,
    syncUpdateMessage,
    syncDeleteAllMessages,
    syncAutomationSettings,
    syncBSPConfig,
    syncAnalytics,
    syncSingleAnalytics,
  } = useSupabaseData();



  // Handlers for Patient CRUD
  const handleSavePatient = (savedPatient: Patient) => {
    setPatients((prev) => {
      const idx = prev.findIndex(p => p.id === savedPatient.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = savedPatient;
        return updated;
      }
      return [savedPatient, ...prev];
    });
    syncPatient(savedPatient);
  };

  const handleDeletePatient = (patientId: string) => {
    if (window.confirm('Yakin ingin menghapus data pasien ini dari sistem?')) {
      setPatients(prev => prev.filter(p => p.id !== patientId));
      syncDeletePatient(patientId);
    }
  };

  const handleDeleteAllPatients = async () => {
    if (window.confirm('PERHATIAN: Apakah Anda yakin ingin mengosongkan / menghapus SEMUA data pasien di Supabase?\n\nSemua data pasien contoh akan terhapus bersih dan Anda bisa mulai memasukkan data pasien baru.')) {
      const alsoClearMessages = window.confirm('Apakah Anda juga ingin membersihkan seluruh Log Riwayat Pesan WhatsApp contoh di Dashboard & Laporan agar bersih ke angka 0?');
      setPatients([]);
      await syncDeleteAllPatients();
      if (alsoClearMessages) {
        setMessages([]);
        await syncDeleteAllMessages();
      }
    }
  };

  const handleDeleteAllMessages = async () => {
    if (window.confirm('PERHATIAN: Apakah Anda yakin ingin mengosongkan SELURUH riwayat log pesan WhatsApp di Supabase?\n\nSemua riwayat log pesan di Dashboard dan Laporan akan bersih kembali ke 0.')) {
      setMessages([]);
      const emptyAnalytics = computeRealDailyAnalytics([]);
      setAnalytics(emptyAnalytics);
      syncAnalytics(emptyAnalytics);
      await syncDeleteAllMessages();

      // Reset juga tingkat kepatuhan seluruh pasien ke 0% agar konsisten dengan log pesan yang kosong
      setPatients(prev => {
        const resetPatients = prev.map(p => ({
          ...p,
          kepatuhanMinumObatPersen: 0,
        }));
        syncPatients(resetPatients);
        return resetPatients;
      });
    }
  };

  const handleLoadSamplePatients = async () => {
    setPatients(INITIAL_PATIENTS);
    await syncPatients(INITIAL_PATIENTS);
    setAutoToast({
      visible: true,
      title: 'Data Pasien Contoh Berhasil Dimuat',
      message: '5 profil pasien psikiatri telah berhasil disimpan ke database Supabase.',
      count: INITIAL_PATIENTS.length,
    });
    setTimeout(() => {
      setAutoToast(prev => ({ ...prev, visible: false }));
    }, 5000);
  };

  // Toggle status pengawasan pasien (aktif / luar pengawasan untuk otomasi pesan)
  const handleTogglePatientSupervision = (patientId: string) => {
    setPatients((prev) => {
      return prev.map((p) => {
        if (p.id === patientId) {
          const currentlyActive = p.notifikasiOtomatisAktif !== false && p.statusPengawasan !== 'luar_pengawasan';
          const nextActive = !currentlyActive;
          const updatedPatient = {
            ...p,
            statusPengawasan: nextActive ? 'dalam_pengawasan' as const : 'luar_pengawasan' as const,
            notifikasiOtomatisAktif: nextActive,
            alasanLuarPengawasan: nextActive ? undefined : (p.alasanLuarPengawasan || 'Pasien di luar pengawasan faskes / dinonaktifkan oleh petugas')
          };
          // Sync the updated patient to Supabase
          syncPatient(updatedPatient);
          return updatedPatient;
        }
        return p;
      });
    });
  };

  // Handlers for Templates
  const handleSaveTemplate = (savedTemplate: import('./types').MessageTemplate) => {
    setTemplates((prev) => {
      const idx = prev.findIndex(t => t.id === savedTemplate.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = savedTemplate;
        return updated;
      }
      return [savedTemplate, ...prev];
    });
    syncTemplate(savedTemplate);
  };


  // Handlers for Messages
  const handleSendMessage = (newMsg: WhatsAppMessage) => {
    setMessages(prev => [newMsg, ...prev]);

    // Update patient's last contacted timestamp
    setPatients(prev => prev.map(p => {
      if (p.id === newMsg.patientId) {
        const updatedPatient = {
          ...p,
          terakhirDihubungi: newMsg.sentAt || new Date().toISOString().replace('T', ' ').slice(0, 16),
        };
        syncPatient(updatedPatient);
        return updatedPatient;
      }
      return p;
    }));

    // Update live daily analytics
    const updatedMessages = [newMsg, ...messages];
    const updatedAnalytics = computeRealDailyAnalytics(updatedMessages);
    setAnalytics(updatedAnalytics);
    syncAnalytics(updatedAnalytics);

    // Increment used quota in BSP config
    setBspConfig(prev => {
      const updated = {
        ...prev,
        pesanTerpakaiBulanIni: prev.pesanTerpakaiBulanIni + 1,
      };
      syncBSPConfig(updated);
      return updated;
    });

    // Persist message to Supabase
    syncMessage(newMsg);
  };

  const handleReceiveReply = (messageId: string, replyText: string) => {
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    
    let targetPatientId: string | null = null;

    const updatedMessages = messages.map(m => {
      if (m.id === messageId) {
        targetPatientId = m.patientId;
        const updatedMsg = {
          ...m,
          status: 'replied' as const,
          repliedAt: now,
          replyText: replyText,
        };
        syncUpdateMessage(updatedMsg);
        return updatedMsg;
      }
      return m;
    });

    setMessages(updatedMessages);

    // If it's a positive confirmation for medication (reply contains '1' or 'sudah'), update patient compliance!
    if (targetPatientId) {
      setPatients(prev => prev.map(p => {
        if (p.id === targetPatientId) {
          const isAffirmative = replyText.includes('1') || replyText.toLowerCase().includes('sudah');
          
          // Hitung kepatuhan pasien murni berdasarkan riwayat pesan minum obat yang dikirim & dibalas
          const patientMedMsgs = updatedMessages.filter(
            m => m.patientId === targetPatientId && m.category === 'minum_obat' && m.status !== 'queued' && m.status !== 'failed'
          );

          let newCompliance = p.kepatuhanMinumObatPersen;
          if (patientMedMsgs.length > 0) {
            const confirmedCount = patientMedMsgs.filter(
              m => m.status === 'replied' && (m.replyText?.includes('1') || m.replyText?.toLowerCase().includes('sudah'))
            ).length;
            newCompliance = Math.round((confirmedCount / patientMedMsgs.length) * 100);
          } else if (isAffirmative) {
            newCompliance = 100;
          }
          
          // If reply is for control confirmation
          let konfirmasi = p.jadwalKontrol.konfirmasiKehadiran;
          if (replyText.toLowerCase().includes('hadir')) {
            konfirmasi = 'akan_hadir';
          } else if (replyText.toLowerCase().includes('reschedule') || replyText.toLowerCase().includes('izin')) {
            konfirmasi = 'minta_reschedule';
          }

          const updatedPatient = {
            ...p,
            kepatuhanMinumObatPersen: newCompliance,
            jadwalKontrol: {
              ...p.jadwalKontrol,
              konfirmasiKehadiran: konfirmasi,
            }
          };
          syncPatient(updatedPatient);
          return updatedPatient;
        }
        return p;
      }));
    }

    // Update live daily analytics
    const updatedAnalytics = computeRealDailyAnalytics(updatedMessages);
    setAnalytics(updatedAnalytics);
    syncAnalytics(updatedAnalytics);
  };

  // Automatic Message Execution Engine (Runs scheduled at 06:00, or triggered for Demo)
  const executeAutomatedBatch = useCallback((source: 'auto' | 'demo' = 'demo') => {
    if (!automationSettings.isActive && source === 'auto') return;

    if (patients.length === 0) {
      if (source === 'demo') {
        setAutoToast({
          visible: true,
          title: 'Belum Ada Data Pasien di Sistem',
          message: 'Silakan buka menu "Data Pasien & Caregiver" untuk menambahkan pasien riil atau memuat data contoh sebelum menjalankan otomasi pengiriman.',
          count: 0,
        });
        setTimeout(() => {
          setAutoToast(prev => ({ ...prev, visible: false }));
        }, 6000);
      }
      return;
    }

    const newMessages: WhatsAppMessage[] = [];
    const nowIso = new Date().toISOString();
    const todayDateStr = getTodayDateStr();

    patients.forEach((patient) => {
      // Pengecualian Otomasi: Lewati pasien yang berada di luar pengawasan atau notifikasi nonaktif
      const isSupervised = 
        patient.notifikasiOtomatisAktif !== false && 
        patient.statusPengawasan !== 'luar_pengawasan' &&
        patient.statusPengawasan !== 'selesai_pengobatan' &&
        patient.statusPengawasan !== 'rujuk_keluar';

      if (!isSupervised) {
        return; // Pasien ini di luar pengawasan RSJ Naimata - lewati pengiriman otomatis
      }

      // 1. Minum Obat Harian (Pesan seragam jam 06:00 pagi setiap hari)
      if (automationSettings.obat.enabled) {
        const obatTmpl = templates.find(t => t.category === 'minum_obat') || templates[0];
        const { body, recipientName, recipientPhone } = generatePersonalizedMessage(
          obatTmpl, 
          patient, 
          automationSettings.obat.targetPenerima === 'pasien' ? 'pasien' : 'caregiver'
        );

        newMessages.push({
          id: `auto-med-${patient.id}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          patientId: patient.id,
          patientName: patient.nama,
          noRM: patient.noRM,
          recipientName,
          recipientPhone,
          recipientType: automationSettings.obat.targetPenerima === 'pasien' ? 'Pasien' : 'Caregiver',
          category: 'minum_obat',
          title: `Pengingat Minum Obat Pagi (${automationSettings.obat.jamKirimPagi} WIB)`,
          body,
          scheduledAt: `${todayDateStr} ${automationSettings.obat.jamKirimPagi}`,
          sentAt: nowIso,
          deliveredAt: nowIso,
          status: 'delivered',
          bspProvider: bspConfig.providerName,
        });
      }

      // 2. Jadwal Kontrol Dokter (H-3 s/d Hari H)
      if (automationSettings.kontrol.enabled && patient.jadwalKontrol) {
        const kontrolTmpl = templates.find(t => t.category === 'kontrol_dokter') || templates[1] || templates[0];
        const kontrolDate = new Date(patient.jadwalKontrol.tanggal);
        const refDate = new Date(todayDateStr);
        const diffDays = Math.round((kontrolDate.getTime() - refDate.getTime()) / (1000 * 3600 * 24));

        let send = false;
        let tag = '';
        if (diffDays === 3 && automationSettings.kontrol.h3) { send = true; tag = 'H-3'; }
        else if (diffDays === 2 && automationSettings.kontrol.h2) { send = true; tag = 'H-2'; }
        else if (diffDays === 1 && automationSettings.kontrol.h1) { send = true; tag = 'H-1'; }
        else if (diffDays === 0 && automationSettings.kontrol.h0) { send = true; tag = 'Hari H'; }

        if (send) {
          const { body, recipientName, recipientPhone } = generatePersonalizedMessage(
            kontrolTmpl,
            patient,
            'caregiver'
          );

          newMessages.push({
            id: `auto-ctrl-${patient.id}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            patientId: patient.id,
            patientName: patient.nama,
            noRM: patient.noRM,
            recipientName,
            recipientPhone,
            recipientType: 'Caregiver',
            category: 'kontrol_dokter',
            title: `Pengingat Jadwal Kontrol Dokter (${tag})`,
            body,
            scheduledAt: `${todayDateStr} ${automationSettings.kontrol.jamKirim}`,
            sentAt: nowIso,
            deliveredAt: nowIso,
            status: 'delivered',
            bspProvider: bspConfig.providerName,
          });
        }
      }

      // 3. Jadwal Iterasi Resep (Farmasi) (H-3 s/d Hari H)
      if (automationSettings.iter.enabled && patient.jadwalIter && patient.jadwalIter.adaIter && patient.jadwalIter.tanggalIter) {
        const iterTmpl = templates.find(t => t.category === 'iter_resep') || templates[2] || templates[0];
        const iterDate = new Date(patient.jadwalIter.tanggalIter);
        const refDate = new Date(todayDateStr);
        const diffDays = Math.round((iterDate.getTime() - refDate.getTime()) / (1000 * 3600 * 24));

        let send = false;
        let tag = '';
        if (diffDays === 3 && automationSettings.iter.h3) { send = true; tag = 'H-3'; }
        else if (diffDays === 2 && automationSettings.iter.h2) { send = true; tag = 'H-2'; }
        else if (diffDays === 1 && automationSettings.iter.h1) { send = true; tag = 'H-1'; }
        else if (diffDays === 0 && automationSettings.iter.h0) { send = true; tag = 'Hari H'; }

        if (send) {
          const { body, recipientName, recipientPhone } = generatePersonalizedMessage(
            iterTmpl,
            patient,
            'caregiver'
          );

          newMessages.push({
            id: `auto-iter-${patient.id}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            patientId: patient.id,
            patientName: patient.nama,
            noRM: patient.noRM,
            recipientName,
            recipientPhone,
            recipientType: 'Caregiver',
            category: 'iter_resep',
            title: `Pengingat Jadwal Iterasi Resep Farmasi (${tag})`,
            body,
            scheduledAt: `${todayDateStr} ${automationSettings.iter.jamKirim}`,
            sentAt: nowIso,
            deliveredAt: nowIso,
            status: 'delivered',
            bspProvider: bspConfig.providerName,
          });
        }
      }
    });

    if (newMessages.length > 0) {
      const allMessages = [...newMessages, ...messages];
      setMessages(allMessages);

      const timeLabel = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
      const updatedSettings = {
        ...automationSettings,
        terakhirDieksekusi: `Hari ini, ${timeLabel} (${source === 'auto' ? 'Otomatis' : 'Demo Otomasi'})`,
        totalPesanTerkirimOtomatis: automationSettings.totalPesanTerkirimOtomatis + newMessages.length,
      };
      setAutomationSettings(updatedSettings);

      // Update analytics with live message counts
      const updatedAnalytics = computeRealDailyAnalytics(allMessages, todayDateStr);
      setAnalytics(updatedAnalytics);
      syncAnalytics(updatedAnalytics);

      // Update BSP quota count
      const updatedBsp = {
        ...bspConfig,
        pesanTerpakaiBulanIni: bspConfig.pesanTerpakaiBulanIni + newMessages.length,
      };
      setBspConfig(updatedBsp);

      // Persist batch to Supabase
      syncMessages(newMessages);
      syncAutomationSettings(updatedSettings);
      syncBSPConfig(updatedBsp);

      setAutoToast({
        visible: true,
        title: 'Sistem Otomasi Berhasil Mengirimkan Pesan!',
        message: `${newMessages.length} pesan pengingat (Minum Obat jam 06:00, Kontrol Dokter H-3 s/d H-1, & Iter Farmasi) telah otomatis dikirimkan ke WhatsApp pasien & caregiver tanpa perlu klik manual harian.`,
        count: newMessages.length,
      });

      setTimeout(() => {
        setAutoToast(prev => ({ ...prev, visible: false }));
      }, 7000);
    }
  }, [automationSettings, patients, templates, bspConfig, syncMessages, syncAutomationSettings, syncBSPConfig, syncSingleAnalytics]);

  // Background Clock/Interval for Automated Delivery
  useEffect(() => {
    const timer = setInterval(() => {
      if (!automationSettings.isActive) return;
      const now = new Date();
      const currentHoursMinutes = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      
      if (currentHoursMinutes === automationSettings.obat.jamKirimPagi) {
        executeAutomatedBatch('auto');
      }
    }, 45000);

    return () => clearInterval(timer);
  }, [automationSettings, executeAutomatedBatch]);



  const handleOpenSimulatorForPatient = (patientId: string) => {
    setTargetPatientForSimulator(patientId);
    setCurrentTab('simulator');
  };

  const handleTriggerQuickSend = () => {
    executeAutomatedBatch('demo');
  };

  const unreadRepliesCount = messages.filter(m => m.status === 'replied').length;

  // ============================================================
  // LOADING STATE — Full screen loader saat pertama kali load
  // ============================================================
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center gap-6 p-4">
        <div className="relative">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-emerald-500 flex items-center justify-center p-4 text-white shadow-2xl shadow-emerald-500/30 border border-emerald-400/30 animate-pulse">
            <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-md">
              <rect x="17" y="6" width="6" height="28" rx="3" fill="white" />
              <rect x="6" y="17" width="28" height="6" rx="3" fill="white" />
              <circle cx="20" cy="20" r="4.5" fill="#34d399" />
              <circle cx="20" cy="20" r="2" fill="white" />
              <circle cx="20" cy="6" r="1.8" fill="#a7f3d0" />
              <circle cx="20" cy="34" r="1.8" fill="#a7f3d0" />
              <circle cx="6" cy="20" r="1.8" fill="#a7f3d0" />
              <circle cx="34" cy="20" r="1.8" fill="#a7f3d0" />
            </svg>
          </div>
          <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-slate-900 border-2 border-emerald-400 flex items-center justify-center shadow-lg">
            <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
          </div>
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-extrabold text-white tracking-tight">
            SIDO<span className="text-emerald-400">RA</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">Menghubungkan ke Supabase Cloud Database...</p>
        </div>
        <div className="w-52 h-1.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700/50">
          <div className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 rounded-full animate-pulse" style={{ width: '75%' }} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-emerald-100 selection:text-emerald-900 relative">
      {/* Supabase Connection Status Badge */}
      <div className="fixed bottom-4 left-4 z-40">
        {isConnected ? (
          <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold px-2.5 py-1.5 rounded-full shadow-sm">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            Supabase Connected
          </div>
        ) : connectionError ? (
          <div className="flex items-center gap-1.5 bg-red-50 text-red-700 border border-red-200 text-[10px] font-semibold px-2.5 py-1.5 rounded-full shadow-sm">
            <CloudOff className="w-3 h-3" />
            Offline Mode
          </div>
        ) : (
          <div className="flex items-center gap-1.5 bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-semibold px-2.5 py-1.5 rounded-full shadow-sm">
            <WifiOff className="w-3 h-3" />
            Local Only
          </div>
        )}
      </div>

      {/* Floating Automation Notification Toast */}
      {autoToast.visible && (
        <div className="fixed top-20 right-4 sm:right-6 z-50 max-w-md bg-slate-900 text-white rounded-2xl shadow-2xl border border-emerald-500/40 p-4 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-400/30">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-xs text-white flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  {autoToast.title}
                </h4>
                <button 
                  onClick={() => setAutoToast(prev => ({ ...prev, visible: false }))}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                {autoToast.message}
              </p>
              <div className="pt-1 flex items-center justify-between text-[10px] text-slate-400">
                <span className="text-emerald-400 font-semibold font-mono">
                  {autoToast.count} Pesan Terkirim Otomatis
                </span>
                <button
                  onClick={() => {
                    setAutoToast(prev => ({ ...prev, visible: false }));
                    setCurrentTab('laporan');
                  }}
                  className="text-teal-300 hover:underline font-semibold"
                >
                  Lihat Riwayat &rarr;
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top Navigation */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setCurrentTab(tab);
          if (tab !== 'simulator') {
            setTargetPatientForSimulator(undefined);
          }
        }}
        bspConfig={bspConfig}
        isAutomationActive={automationSettings.isActive}

        onTriggerQuickSend={handleTriggerQuickSend}
        unreadRepliesCount={unreadRepliesCount}
        pendingQueueCount={patients.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        {/* 1. Dasbor Utama */}
        {currentTab === 'dashboard' && (
          <DashboardOverview
            messages={messages}
            patients={patients}
            analytics={analytics}
            onNavigate={(tab) => setCurrentTab(tab)}
            onOpenSimulatorForPatient={handleOpenSimulatorForPatient}
            onTriggerAutoSend={handleTriggerQuickSend}
          />
        )}

        {/* 1.5. Dasbor Entri Pengiriman Manual */}
        {currentTab === 'manual_dashboard' && (
          <ManualDashboard />
        )}

        {/* 2. Data Pasien & Caregiver */}
        {currentTab === 'pasien' && (
          <PatientManagement
            patients={patients}
            onSavePatient={handleSavePatient}
            onDeletePatient={handleDeletePatient}
            onDeleteAllPatients={handleDeleteAllPatients}
            onLoadSamplePatients={handleLoadSamplePatients}
            onTogglePatientSupervision={handleTogglePatientSupervision}
            onOpenSimulatorForPatient={handleOpenSimulatorForPatient}
          />
        )}

        {/* 3. Setting Pesan Otomatis (Menu Utama Sederhana Sesuai Permintaan) */}
        {currentTab === 'otomasi' && (
          <UnifiedMessageAutomation
            settings={automationSettings}
            templates={templates}
            patients={patients}
            bspConfig={bspConfig}
            onSaveSettings={(newSettings) => {
              setAutomationSettings(newSettings);
              syncAutomationSettings(newSettings);
            }}
            onSaveTemplate={handleSaveTemplate}
            onSaveBSPConfig={(newBsp) => {
              setBspConfig(newBsp);
              syncBSPConfig(newBsp);
            }}
            onTogglePatientSupervision={handleTogglePatientSupervision}
            onTriggerManualRun={() => executeAutomatedBatch('demo')}
            onNavigateToSimulator={() => setCurrentTab('simulator')}
          />
        )}

        {/* Alat Tambahan Presentasi (Simulator Chat WA) */}
        {currentTab === 'simulator' && (
          <WhatsAppSimulator
            patients={patients}
            templates={templates}
            messages={messages}
            bspConfig={bspConfig}
            onSendMessage={handleSendMessage}
            onReceiveReply={handleReceiveReply}
            initialPatientId={targetPatientForSimulator}
          />
        )}

        {/* Alat Tambahan Audit (Laporan & Riwayat Pesan) */}
        {currentTab === 'laporan' && (
          <ReportsAndLogs
            messages={messages}
            onDeleteAllMessages={handleDeleteAllMessages}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 px-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-slate-700">Sidora • {RSJ_INFO.nama}</span>
            <span>•</span>
            <span>Hotline WA: {RSJ_INFO.hotlineWA}</span>

          </div>
          <div className="text-slate-400 text-center sm:text-right">
            Sidora: Sistem Otomasi &amp; Sandbox Notifikasi WhatsApp Pasien Psikiatri • Prototype V2.0 — Supabase Cloud
          </div>
        </div>
      </footer>

      {/* Floating PWA Install Banner */}
      <PWAInstallBanner />

    </div>
  );
}
