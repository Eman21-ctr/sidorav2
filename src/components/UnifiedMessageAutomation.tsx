import { useState } from 'react';
import { 
  BellRing, 
  Power, 
  Clock, 
  Calendar, 
  Pill, 
  RefreshCw, 
  Save, 
  CheckCircle2, 
  HelpCircle, 
  Sparkles, 
  MessageSquare, 
  Settings2, 
  FlaskConical, 
  Smartphone, 
  Send, 
  Users,
  ShieldCheck,
  AlertCircle,
  UserCheck,
  UserX,
  ShieldAlert,
  RotateCcw
} from 'lucide-react';
import { AutomationSettings, MessageTemplate, Patient, BSPConfig, WhatsAppMessage } from '../types';
import { INITIAL_TEMPLATES } from '../data/initialData';

interface UnifiedMessageAutomationProps {
  settings: AutomationSettings;
  templates: MessageTemplate[];
  patients: Patient[];
  bspConfig: BSPConfig;
  onSaveSettings: (settings: AutomationSettings) => void;
  onSaveTemplate: (template: MessageTemplate) => void;
  onSaveBSPConfig: (bsp: BSPConfig) => void;
  onTogglePatientSupervision?: (patientId: string) => void;
  onTriggerManualRun: () => void;
  onNavigateToSimulator: () => void;
}

export const UnifiedMessageAutomation = ({
  settings,
  templates,
  patients,
  bspConfig,
  onSaveSettings,
  onSaveTemplate,
  onSaveBSPConfig,
  onTogglePatientSupervision,
  onTriggerManualRun,
  onNavigateToSimulator,
}: UnifiedMessageAutomationProps) => {
  // Local state for settings form
  const [currentSettings, setCurrentSettings] = useState<AutomationSettings>(settings);
  const [activeSubTab, setActiveSubTab] = useState<'jadwal' | 'template' | 'gateway'>('jadwal');
  const [selectedTemplateCategory, setSelectedTemplateCategory] = useState<'minum_obat' | 'kontrol_dokter' | 'iter_resep'>('minum_obat');
  const [obatSubSesi, setObatSubSesi] = useState<'pagi' | 'siang' | 'malam'>('pagi');
  const [savedAlert, setSavedAlert] = useState(false);

  // Tentukan template ID yang sedang aktif diedit
  const getActiveTemplateId = (): string => {
    if (selectedTemplateCategory === 'minum_obat') {
      return obatSubSesi === 'pagi' ? 'tmpl-obat-pagi' : obatSubSesi === 'siang' ? 'tmpl-obat-siang' : 'tmpl-obat-malam';
    }
    if (selectedTemplateCategory === 'kontrol_dokter') return 'tmpl-kontrol-dokter';
    if (selectedTemplateCategory === 'iter_resep') return 'tmpl-iter-resep';
    return 'tmpl-obat-pagi';
  };

  // Handle master toggle
  const handleToggleActive = () => {
    const updated = {
      ...currentSettings,
      isActive: !currentSettings.isActive,
    };
    setCurrentSettings(updated);
    onSaveSettings(updated);
    triggerSaved();
  };

  const handleSave = () => {
    onSaveSettings(currentSettings);
    triggerSaved();
  };

  const triggerSaved = () => {
    setSavedAlert(true);
    setTimeout(() => setSavedAlert(false), 3000);
  };

  // Find active template for editing based on id
  const currentEditingTemplate = templates.find(t => t.id === getActiveTemplateId())
    || templates.find(t => t.category === selectedTemplateCategory)
    || templates[0];
  const [editingTemplateText, setEditingTemplateText] = useState(currentEditingTemplate?.templateText || '');

  // When switching category or sesi, update editing text
  const handleSelectTemplateCategory = (cat: 'minum_obat' | 'kontrol_dokter' | 'iter_resep') => {
    setSelectedTemplateCategory(cat);
    // When switching to minum_obat, keep current sesi; otherwise find by category
    if (cat !== 'minum_obat') {
      const tmpl = templates.find(t => t.category === cat) || templates[0];
      if (tmpl) setEditingTemplateText(tmpl.templateText);
    } else {
      const tmplId = obatSubSesi === 'pagi' ? 'tmpl-obat-pagi' : obatSubSesi === 'siang' ? 'tmpl-obat-siang' : 'tmpl-obat-malam';
      const tmpl = templates.find(t => t.id === tmplId) || templates.find(t => t.category === 'minum_obat');
      if (tmpl) setEditingTemplateText(tmpl.templateText);
    }
  };

  const handleSelectObatSesi = (sesi: 'pagi' | 'siang' | 'malam') => {
    setObatSubSesi(sesi);
    const tmplId = sesi === 'pagi' ? 'tmpl-obat-pagi' : sesi === 'siang' ? 'tmpl-obat-siang' : 'tmpl-obat-malam';
    const tmpl = templates.find(t => t.id === tmplId) || templates.find(t => t.category === 'minum_obat');
    if (tmpl) setEditingTemplateText(tmpl.templateText);
  };

  const handleSaveCurrentTemplate = () => {
    if (!currentEditingTemplate) return;
    const updated: MessageTemplate = {
      ...currentEditingTemplate,
      templateText: editingTemplateText,
    };
    onSaveTemplate(updated);
    triggerSaved();
  };

  const handleInsertVariable = (variableTag: string) => {
    setEditingTemplateText(prev => prev ? `${prev} ${variableTag}` : variableTag);
  };

  const handleResetCurrentTemplate = () => {
    if (!currentEditingTemplate) return;
    const defaultTmpl = INITIAL_TEMPLATES.find(t => t.id === currentEditingTemplate.id);
    if (defaultTmpl) {
      setEditingTemplateText(defaultTmpl.templateText);
      onSaveTemplate({
        ...currentEditingTemplate,
        templateText: defaultTmpl.templateText,
      });
      triggerSaved();
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      
      {/* Top Hero Banner with Master Switch */}
      <div className={`rounded-2xl p-5 sm:p-6 text-white shadow-xs transition-all duration-300 relative overflow-hidden ${
        currentSettings.isActive 
          ? 'bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 border border-emerald-500/30' 
          : 'bg-gradient-to-r from-slate-800 via-slate-800 to-slate-900 border border-slate-700'
      }`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          
          <div className="space-y-1 max-w-2xl">
            <h2 className="text-lg sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <BellRing className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400 shrink-0" />
              Pengaturan Otomasi Pesan WhatsApp
            </h2>

            <p className="text-xs sm:text-sm text-slate-300">
              Tentukan jadwal jam kirim harian (default pukul 06:00) dan template pesan pengingat minum obat, kontrol dokter, serta iterasi resep.
            </p>
          </div>

          {/* Master Toggle Button */}
          <button
            onClick={handleToggleActive}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer shrink-0 ${
              currentSettings.isActive
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
                : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
            }`}
          >
            <Power className="w-4 h-4" />
            {currentSettings.isActive ? 'Hentikan Otomasi Sementara' : 'Aktifkan Pengiriman Otomatis'}
          </button>

        </div>

        {/* Saved Alert Toast */}
        {savedAlert && (
          <div className="mt-3 p-2 bg-emerald-500/20 border border-emerald-400/40 rounded-xl text-emerald-200 text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-300" />
            Pengaturan berhasil diperbarui dan tersimpan aman!
          </div>
        )}
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('jadwal')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 ${
            activeSubTab === 'jadwal'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Clock className="w-4 h-4" />
          1. Jadwal &amp; Waktu Otomatis
        </button>

        <button
          onClick={() => setActiveSubTab('template')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 ${
            activeSubTab === 'template'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          2. Edit Teks / Redaksi Pesan
        </button>

        <button
          onClick={() => setActiveSubTab('gateway')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 ${
            activeSubTab === 'gateway'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Settings2 className="w-4 h-4" />
          3. Koneksi WhatsApp Gateway (BSP) &amp; Pengirim
        </button>
      </div>

      {/* TAB 1: JADWAL & WAKTU OTOMATIS */}
      {activeSubTab === 'jadwal' && (
        <div className="space-y-6">
          
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-emerald-950 text-xs sm:text-sm flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold text-emerald-900 block text-sm">Prinsip Pengiriman Otomatis:</strong>
              Cukup simpan konfigurasi ini 1 kali. Setiap hari pada jam <strong>{currentSettings.obat.jamKirimPagi}</strong>, <strong>{currentSettings.obat.jamKirimSiang}</strong>, dan <strong>{currentSettings.obat.jamKirimMalam}</strong>, 
              sistem membaca seluruh data pasien rawat jalan aktif dan langsung menyalurkan pesan pengingat ke nomor WhatsApp tujuan. 
              Anda tidak perlu menekan tombol kirim setiap hari.
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* 1. Pengingat Minum Obat Harian */}
            <div className={`bg-white rounded-2xl border p-5 shadow-xs transition-all space-y-4 ${
              currentSettings.obat.enabled ? 'border-emerald-200 ring-1 ring-emerald-500/10' : 'border-slate-200 opacity-60'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                    <Pill className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Pengingat Minum Obat</h3>
                    <p className="text-[11px] text-slate-500">3x sehari (Pagi, Siang, Malam)</p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={currentSettings.obat.enabled}
                    onChange={(e) => setCurrentSettings({
                      ...currentSettings,
                      obat: { ...currentSettings.obat, enabled: e.target.checked }
                    })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              <div className="space-y-3 pt-2 text-xs border-t border-slate-100">

                {/* Jadwal Pagi */}
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    🌅 Jadwal Pagi:
                  </label>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="time"
                      value={currentSettings.obat.jamKirimPagi}
                      onChange={(e) => setCurrentSettings({
                        ...currentSettings,
                        obat: { ...currentSettings.obat, jamKirimPagi: e.target.value }
                      })}
                      className="px-3 py-1.5 rounded-lg border border-slate-300 font-mono text-xs font-bold text-slate-900 focus:ring-1 focus:ring-emerald-500"
                    />
                    <span className="text-[11px] text-slate-500 font-medium">WIB</span>
                  </div>
                </div>

                {/* Jadwal Siang */}
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    ☀️ Jadwal Siang:
                  </label>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="time"
                      value={currentSettings.obat.jamKirimSiang}
                      onChange={(e) => setCurrentSettings({
                        ...currentSettings,
                        obat: { ...currentSettings.obat, jamKirimSiang: e.target.value }
                      })}
                      className="px-3 py-1.5 rounded-lg border border-slate-300 font-mono text-xs font-bold text-slate-900 focus:ring-1 focus:ring-emerald-500"
                    />
                    <span className="text-[11px] text-slate-500 font-medium">WIB</span>
                  </div>
                </div>

                {/* Jadwal Malam */}
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    🌙 Jadwal Malam:
                  </label>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="time"
                      value={currentSettings.obat.jamKirimMalam}
                      onChange={(e) => setCurrentSettings({
                        ...currentSettings,
                        obat: { ...currentSettings.obat, jamKirimMalam: e.target.value }
                      })}
                      className="px-3 py-1.5 rounded-lg border border-slate-300 font-mono text-xs font-bold text-slate-900 focus:ring-1 focus:ring-emerald-500"
                    />
                    <span className="text-[11px] text-slate-500 font-medium">WIB</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200/80 text-[11px] text-emerald-800 space-y-1">
                  <div className="font-semibold text-emerald-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    Pengingat Rutin 3x Sehari
                  </div>
                  <p className="text-emerald-700 leading-relaxed">
                    Pesan dikirim pagi, siang, dan malam sesuai jadwal minum obat pasien agar kepatuhan konsumsi obat meningkat.
                  </p>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Tujuan Kirim Utama:
                  </label>
                  <select
                    value={currentSettings.obat.targetPenerima}
                    onChange={(e) => setCurrentSettings({
                      ...currentSettings,
                      obat: { ...currentSettings.obat, targetPenerima: e.target.value as any }
                    })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-900 focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="caregiver">Nomor Keluarga / Caregiver (Rekomendasi RSJ)</option>
                    <option value="pasien">Nomor Pasien Langsung</option>
                    <option value="keduanya">Kirim ke Keduanya (Pasien &amp; Caregiver)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 2. Pengingat Jadwal Kontrol Dokter */}
            <div className={`bg-white rounded-2xl border p-5 shadow-xs transition-all space-y-4 ${
              currentSettings.kontrol.enabled ? 'border-teal-200 ring-1 ring-teal-500/10' : 'border-slate-200 opacity-60'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Pengingat Kontrol Dokter</h3>
                    <p className="text-[11px] text-slate-500">Poliklinik Spesialis Jiwa</p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={currentSettings.kontrol.enabled}
                    onChange={(e) => setCurrentSettings({
                      ...currentSettings,
                      kontrol: { ...currentSettings.kontrol, enabled: e.target.checked }
                    })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-600"></div>
                </label>
              </div>

              <div className="space-y-3 pt-2 text-xs border-t border-slate-100">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Jam Kirim Notifikasi:
                  </label>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="time"
                      value={currentSettings.kontrol.jamKirim}
                      onChange={(e) => setCurrentSettings({
                        ...currentSettings,
                        kontrol: { ...currentSettings.kontrol, jamKirim: e.target.value }
                      })}
                      className="px-3 py-1.5 rounded-lg border border-slate-300 font-mono text-xs font-bold text-slate-900 focus:ring-1 focus:ring-teal-500"
                    />
                    <span className="text-[11px] text-slate-500">WIB</span>
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1.5">
                    Kirim Otomatis Pada Rentang Hari:
                  </label>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <label className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={currentSettings.kontrol.h3}
                        onChange={(e) => setCurrentSettings({
                          ...currentSettings,
                          kontrol: { ...currentSettings.kontrol, h3: e.target.checked }
                        })}
                        className="rounded text-teal-600 focus:ring-teal-500"
                      />
                      <span className="font-semibold">H-3 Kontrol</span>
                    </label>

                    <label className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={currentSettings.kontrol.h2}
                        onChange={(e) => setCurrentSettings({
                          ...currentSettings,
                          kontrol: { ...currentSettings.kontrol, h2: e.target.checked }
                        })}
                        className="rounded text-teal-600 focus:ring-teal-500"
                      />
                      <span className="font-semibold">H-2 Kontrol</span>
                    </label>

                    <label className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={currentSettings.kontrol.h1}
                        onChange={(e) => setCurrentSettings({
                          ...currentSettings,
                          kontrol: { ...currentSettings.kontrol, h1: e.target.checked }
                        })}
                        className="rounded text-teal-600 focus:ring-teal-500"
                      />
                      <span className="font-semibold">H-1 Kontrol</span>
                    </label>

                    <label className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={currentSettings.kontrol.h0}
                        onChange={(e) => setCurrentSettings({
                          ...currentSettings,
                          kontrol: { ...currentSettings.kontrol, h0: e.target.checked }
                        })}
                        className="rounded text-teal-600 focus:ring-teal-500"
                      />
                      <span className="font-semibold">Hari H (Pagi)</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Tujuan Kirim:
                  </label>
                  <select
                    value={currentSettings.kontrol.targetPenerima}
                    onChange={(e) => setCurrentSettings({
                      ...currentSettings,
                      kontrol: { ...currentSettings.kontrol, targetPenerima: e.target.value as any }
                    })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-900 focus:ring-1 focus:ring-teal-500"
                  >
                    <option value="caregiver">Nomor Caregiver / Keluarga Pendamping</option>
                    <option value="pasien">Nomor Pasien</option>
                    <option value="keduanya">Keduanya</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 3. Pengingat Jadwal Iterasi Resep (Farmasi) */}
            <div className={`bg-white rounded-2xl border p-5 shadow-xs transition-all space-y-4 ${
              currentSettings.iter.enabled ? 'border-sky-200 ring-1 ring-sky-500/10' : 'border-slate-200 opacity-60'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-800 flex items-center justify-center">
                    <RefreshCw className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Pengingat Jadwal Iter</h3>
                    <p className="text-[11px] text-slate-500">Ambil Obat Farmasi RSJ</p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={currentSettings.iter.enabled}
                    onChange={(e) => setCurrentSettings({
                      ...currentSettings,
                      iter: { ...currentSettings.iter, enabled: e.target.checked }
                    })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-sky-600"></div>
                </label>
              </div>

              <div className="space-y-3 pt-2 text-xs border-t border-slate-100">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Jam Kirim Notifikasi:
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="time"
                    value={currentSettings.iter.jamKirim}
                    onChange={(e) => setCurrentSettings({
                      ...currentSettings,
                      iter: { ...currentSettings.iter, jamKirim: e.target.value }
                    })}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 font-mono text-xs font-bold text-slate-900 focus:ring-1 focus:ring-sky-500"
                  />
                  <span className="text-[11px] text-slate-500">WIB</span>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1.5">
                    Kirim Otomatis Pada Rentang Hari:
                  </label>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <label className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={currentSettings.iter.h3}
                        onChange={(e) => setCurrentSettings({
                          ...currentSettings,
                          iter: { ...currentSettings.iter, h3: e.target.checked }
                        })}
                        className="rounded text-sky-600 focus:ring-sky-500"
                      />
                      <span className="font-semibold">H-3 Iter</span>
                    </label>

                    <label className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={currentSettings.iter.h2}
                        onChange={(e) => setCurrentSettings({
                          ...currentSettings,
                          iter: { ...currentSettings.iter, h2: e.target.checked }
                        })}
                        className="rounded text-sky-600 focus:ring-sky-500"
                      />
                      <span className="font-semibold">H-2 Iter</span>
                    </label>

                    <label className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={currentSettings.iter.h1}
                        onChange={(e) => setCurrentSettings({
                          ...currentSettings,
                          iter: { ...currentSettings.iter, h1: e.target.checked }
                        })}
                        className="rounded text-sky-600 focus:ring-sky-500"
                      />
                      <span className="font-semibold">H-1 Iter</span>
                    </label>

                    <label className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={currentSettings.iter.h0}
                        onChange={(e) => setCurrentSettings({
                          ...currentSettings,
                          iter: { ...currentSettings.iter, h0: e.target.checked }
                        })}
                        className="rounded text-sky-600 focus:ring-sky-500"
                      />
                      <span className="font-semibold">Hari H (Farmasi)</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Tujuan Kirim:
                  </label>
                  <select
                    value={currentSettings.iter.targetPenerima}
                    onChange={(e) => setCurrentSettings({
                      ...currentSettings,
                      iter: { ...currentSettings.iter, targetPenerima: e.target.value as any }
                    })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-900 focus:ring-1 focus:ring-sky-500"
                  >
                    <option value="caregiver">Nomor Caregiver (Pengambil Obat)</option>
                    <option value="pasien">Nomor Pasien</option>
                    <option value="keduanya">Keduanya</option>
                  </select>
                </div>
              </div>
            </div>

          </div>

          {/* Section: Kontrol Pasien di Luar Pengawasan (Pengecualian Otomasi) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                    Status Pengawasan Pasien &amp; Pengecualian Otomasi
                  </h3>
                  <p className="text-xs text-slate-500">
                    Kendalikan pasien mana yang aktif menerima pesan otomatis vs yang dikecualikan (di luar pengawasan).
                  </p>
                </div>
              </div>

              {/* Counter Badges */}
              <div className="flex items-center gap-2 text-xs">
                <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  {patients.filter(p => p.notifikasiOtomatisAktif !== false && p.statusPengawasan !== 'luar_pengawasan').length} Dalam Pengawasan (WA Aktif)
                </span>
                <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-800 font-semibold border border-amber-200 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  {patients.filter(p => p.notifikasiOtomatisAktif === false || p.statusPengawasan === 'luar_pengawasan').length} Di Luar Pengawasan
                </span>
              </div>
            </div>

            {/* Skenario Explanation Box */}
            <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-900 space-y-2">
              <div className="font-bold flex items-center gap-1.5 text-amber-950">
                <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                Skenario Pasien Di Luar Pengawasan RSJ Naimata:
              </div>
              <p className="text-amber-900 leading-relaxed">
                Apabila ada pasien yang telah selesai masa perawatan, pindah domisili, atau sudah tidak lagi berada dalam pengawasan aktif RSJ Naimata, cukup matikan tombol saklar di bawah menjadi <strong>&quot;Di Luar Pengawasan&quot;</strong>. Sistem otomatisasi harian (jam 06:00 pagi, pengingat kontrol dokter, &amp; iterasi farmasi) <strong>tidak akan mengirimkan pesan apa pun</strong> ke nomor pasien maupun keluarganya.
              </p>
            </div>

            {/* Patient Table / List */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 bg-slate-50/80">
                    <th className="py-2.5 px-3 font-semibold rounded-l-lg">Pasien &amp; No. RM</th>
                    <th className="py-2.5 px-3 font-semibold">Diagnosa &amp; DPJP</th>
                    <th className="py-2.5 px-3 font-semibold">Penerima Pesan (Caregiver)</th>
                    <th className="py-2.5 px-3 font-semibold">Status Pengawasan</th>
                    <th className="py-2.5 px-3 font-semibold text-right rounded-r-lg">Aksi Pengiriman Otomatis</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {patients.map((patient) => {
                    const isSupervised = patient.notifikasiOtomatisAktif !== false && patient.statusPengawasan !== 'luar_pengawasan';
                    return (
                      <tr key={patient.id} className={`hover:bg-slate-50/60 transition-colors ${!isSupervised ? 'bg-slate-50/50' : ''}`}>
                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-900">{patient.nama}</div>
                          <div className="text-[11px] font-mono text-slate-500">{patient.noRM} • {patient.usia} th ({patient.jenisKelamin})</div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="text-slate-800 font-medium truncate max-w-[200px]">{patient.diagnosaMedis}</div>
                          <div className="text-[11px] text-slate-500">{patient.dokterDPJP}</div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="text-slate-800">{patient.caregiver.nama} ({patient.caregiver.hubungan})</div>
                          <div className="text-[11px] text-slate-500 font-mono">{patient.caregiver.noTelepon}</div>
                        </td>
                        <td className="py-3 px-3">
                          {isSupervised ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-semibold text-[11px]">
                              <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                              Dalam Pengawasan RSJ
                            </span>
                          ) : (
                            <div className="space-y-0.5">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-200 text-slate-700 font-semibold text-[11px]">
                                <UserX className="w-3.5 h-3.5 text-slate-500" />
                                Di Luar Pengawasan
                              </span>
                              {patient.alasanLuarPengawasan && (
                                <p className="text-[10px] text-slate-500 italic max-w-[180px] truncate">
                                  {patient.alasanLuarPengawasan}
                                </p>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <span className={`text-[11px] font-medium hidden sm:inline ${isSupervised ? 'text-emerald-700' : 'text-slate-400'}`}>
                              {isSupervised ? 'Kirim Otomatis' : 'Jangan Kirim'}
                            </span>
                            <button
                              type="button"
                              onClick={() => onTogglePatientSupervision?.(patient.id)}
                              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
                                isSupervised ? 'bg-emerald-600' : 'bg-slate-300'
                              }`}
                              title={isSupervised ? 'Klik untuk hentikan pesan otomatis (pasien di luar pengawasan)' : 'Klik untuk aktifkan kembali pengawasan & pesan otomatis'}
                            >
                              <span
                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                                  isSupervised ? 'translate-x-5' : 'translate-x-0'
                                }`}
                              />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Action Save Button */}
          <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
            <div className="text-xs text-slate-500">
              💡 Perubahan waktu jadwal langsung berlaku untuk siklus otomatis berikutnya.
            </div>
            <button
              onClick={handleSave}
              className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm rounded-xl transition-colors flex items-center gap-2"
            >
              <Save className="w-4 h-4 text-emerald-400" />
              Simpan Jadwal Otomasi
            </button>
          </div>

        </div>
      )}

      {/* TAB 2: EDIT TEKS / REDAKSI PESAN */}
      {activeSubTab === 'template' && (
        <div className="space-y-5">
          {/* Card header: Kategori */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Format Pesan Resmi WhatsApp RSJ</h3>
                <p className="text-xs text-slate-500">
                  Teks ini dikirimkan otomatis sesuai data obat pasien di database. Variabel <code className="bg-slate-100 px-1 rounded">{'{nama_pasien}'}</code> dll diisi otomatis.
                </p>
              </div>

              {/* Template Category Selector */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl shrink-0">
                <button
                  onClick={() => handleSelectTemplateCategory('minum_obat')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    selectedTemplateCategory === 'minum_obat'
                      ? 'bg-white text-emerald-800 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  💊 Pengingat Obat
                </button>
                <button
                  onClick={() => handleSelectTemplateCategory('kontrol_dokter')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    selectedTemplateCategory === 'kontrol_dokter'
                      ? 'bg-white text-teal-800 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  🗓 Kontrol Dokter
                </button>
                <button
                  onClick={() => handleSelectTemplateCategory('iter_resep')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    selectedTemplateCategory === 'iter_resep'
                      ? 'bg-white text-sky-800 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  🔄 Jadwal Iter
                </button>
              </div>
            </div>

            {/* ======= SUB-SESI OBAT (hanya tampil jika kategori minum_obat) ======= */}
            {selectedTemplateCategory === 'minum_obat' && (
              <div className="space-y-5">
                {/* Sub-tab sesi */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-600 shrink-0">Sesi Kirim:</span>
                  <div className="flex items-center gap-1.5 p-1 bg-emerald-50 border border-emerald-200 rounded-xl">
                    {(['pagi', 'siang', 'malam'] as const).map((sesi) => (
                      <button
                        key={sesi}
                        onClick={() => handleSelectObatSesi(sesi)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          obatSubSesi === sesi
                            ? 'bg-emerald-700 text-white shadow-xs'
                            : 'text-emerald-700 hover:bg-emerald-100'
                        }`}
                      >
                        {sesi === 'pagi' ? '🌅 Pagi' : sesi === 'siang' ? '☀️ Siang' : '🌙 Malam'}
                      </button>
                    ))}
                  </div>
                  <span className="text-[11px] text-slate-400">({currentSettings.obat[obatSubSesi === 'pagi' ? 'jamKirimPagi' : obatSubSesi === 'siang' ? 'jamKirimSiang' : 'jamKirimMalam']} WIB)</span>
                </div>

                {/* Info variabel khusus obat */}
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs">
                  <span className="font-bold text-emerald-800 block mb-1.5">💊 Variabel Khusus Obat {obatSubSesi === 'pagi' ? 'Pagi' : obatSubSesi === 'siang' ? 'Siang' : 'Malam'} (Klik untuk sisipkan):</span>
                  <div className="flex flex-wrap gap-1.5 font-mono text-[11px]">
                    {[
                      obatSubSesi === 'pagi' ? '{daftar_obat_pagi}' : obatSubSesi === 'siang' ? '{daftar_obat_siang}' : '{daftar_obat_malam}',
                      '{jam_minum}',
                      '{nama_pasien}',
                      '{nomor_rm}',
                      '{dokter_dpjp}',
                      '{nama_panggilan}',
                      '{nama_caregiver}',
                      '{hubungan_caregiver}',
                      '{diagnosa}',
                      '{hotline_rsj}',
                      '{nama_rsj}'
                    ].map(v => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => handleInsertVariable(v)}
                        title={`Klik untuk menyisipkan ${v}`}
                        className="px-2 py-0.5 bg-white hover:bg-emerald-100 border border-emerald-300 rounded text-emerald-900 transition-colors cursor-pointer text-left"
                      >
                        + {v}
                      </button>
                    ))}
                  </div>
                  <p className="text-emerald-700 mt-2 leading-relaxed">
                    Variabel <strong>{obatSubSesi === 'pagi' ? '{daftar_obat_pagi}' : obatSubSesi === 'siang' ? '{daftar_obat_siang}' : '{daftar_obat_malam}'}</strong> akan diisi otomatis daftar obat {obatSubSesi} tiap pasien dari database, beserta dosis dan aturan pakainya.
                  </p>
                </div>

                {/* Textarea */}
                <div className="space-y-2">
                  <label className="font-bold text-slate-800 text-xs block">
                    Isi Pesan WhatsApp — Obat {obatSubSesi === 'pagi' ? '🌅 Pagi' : obatSubSesi === 'siang' ? '☀️ Siang' : '🌙 Malam'} ({currentEditingTemplate?.defaultTime} WIB):
                  </label>
                  <textarea
                    rows={12}
                    value={editingTemplateText}
                    onChange={(e) => setEditingTemplateText(e.target.value)}
                    className="w-full p-3.5 rounded-xl border border-slate-300 font-mono text-xs sm:text-sm text-slate-800 leading-relaxed focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Ketik format template pesan obat..."
                  />
                  <p className="text-[11px] text-slate-500">
                    Gunakan <strong>*teks*</strong> untuk tebal, <strong>_teks_</strong> untuk miring di WhatsApp. Variabel akan digantikan dengan data riil pasien dari database.
                  </p>
                </div>

                {/* Save & Reset */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1">
                  <span className="text-xs text-slate-500">
                    Template ini dipakai otomatis setiap sesi {obatSubSesi === 'pagi' ? 'pagi' : obatSubSesi === 'siang' ? 'siang' : 'malam'} untuk semua pasien.
                  </span>
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                      type="button"
                      onClick={handleResetCurrentTemplate}
                      title="Kembalikan ke format baku/standar RSJ yang lengkap"
                      className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Reset Format Standar
                    </button>
                    <button
                      onClick={handleSaveCurrentTemplate}
                      className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs sm:text-sm rounded-xl transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
                    >
                      <Save className="w-4 h-4" />
                      Simpan Template {obatSubSesi === 'pagi' ? 'Pagi' : obatSubSesi === 'siang' ? 'Siang' : 'Malam'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ======= KONTROL DOKTER ======= */}
            {selectedTemplateCategory === 'kontrol_dokter' && (
              <div className="space-y-5">
                <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-xs">
                  <span className="font-bold text-teal-800 block mb-1.5">📅 Variabel Template Kontrol Dokter (Klik untuk sisipkan):</span>
                  <div className="flex flex-wrap gap-1.5 font-mono text-[11px]">
                    {[
                      '{nama_panggilan}',
                      '{nama_pasien}',
                      '{nomor_rm}',
                      '{tanggal_kontrol}',
                      '{jam_kontrol}',
                      '{dokter_dpjp}',
                      '{poliklinik}',
                      '{diagnosa}',
                      '{hotline_rsj}',
                      '{nama_rsj}'
                    ].map(v => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => handleInsertVariable(v)}
                        title={`Klik untuk menyisipkan ${v}`}
                        className="px-2 py-0.5 bg-white hover:bg-teal-100 border border-teal-300 rounded text-teal-900 transition-colors cursor-pointer text-left"
                      >
                        + {v}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="font-bold text-slate-800 text-xs block">
                    Isi Pesan WhatsApp — 🗓 Kontrol Dokter:
                  </label>
                  <textarea
                    rows={12}
                    value={editingTemplateText}
                    onChange={(e) => setEditingTemplateText(e.target.value)}
                    className="w-full p-3.5 rounded-xl border border-teal-300 font-mono text-xs sm:text-sm text-slate-800 leading-relaxed focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    placeholder="Ketik format template kontrol dokter..."
                  />
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1">
                  <span className="text-xs text-slate-500">Dikirim otomatis H-3, H-2, H-1 sebelum jadwal kontrol dokter.</span>
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                      type="button"
                      onClick={handleResetCurrentTemplate}
                      title="Kembalikan ke format baku/standar RSJ yang lengkap"
                      className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Reset Format Standar
                    </button>
                    <button
                      onClick={handleSaveCurrentTemplate}
                      className="px-5 py-2.5 bg-teal-700 hover:bg-teal-600 text-white font-bold text-xs sm:text-sm rounded-xl transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
                    >
                      <Save className="w-4 h-4" />
                      Simpan Template Kontrol
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ======= JADWAL ITER ======= */}
            {selectedTemplateCategory === 'iter_resep' && (
              <div className="space-y-5">
                {/* Panduan Ketentuan Jadwal Iter RSJ */}
                <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-xl text-xs space-y-1.5 text-amber-900">
                  <div className="font-bold flex items-center gap-1.5 text-amber-950">
                    <span>📌</span> Ketentuan Resmi Jadwal Iter RSJ Naimata:
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-[11px] leading-relaxed pl-1">
                    <li><strong>Wajib Tepat Tanggal:</strong> Pengambilan obat harus sesuai tanggal yang ditentukan (tidak boleh lebih awal atau terlambat).</li>
                    <li><strong>Iter ke-1 dan ke-2:</strong> Boleh diwakili oleh keluarga/caregiver (membawa kartu berobat & copy resep).</li>
                    <li><strong>Iter ke-3:</strong> <strong>Wajib bersama pasien</strong> (pasien hadir langsung untuk evaluasi dokter dan pembaharuan resep).</li>
                  </ul>
                </div>

                <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl text-xs">
                  <span className="font-bold text-sky-800 block mb-1.5">🔄 Variabel Template Jadwal Iter (Klik untuk sisipkan):</span>
                  <div className="flex flex-wrap gap-1.5 font-mono text-[11px]">
                    {[
                      '{nama_panggilan}',
                      '{nama_pasien}',
                      '{nomor_rm}',
                      '{tanggal_iter}',
                      '{iter_ke}',
                      '{sisa_iter}',
                      '{nomor_resep}',
                      '{ketentuan_kehadiran_iter}',
                      '{ketentuan_tanggal_iter}',
                      '{aturan_jadwal_iter}',
                      '{hotline_rsj}',
                      '{nama_rsj}'
                    ].map(v => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => handleInsertVariable(v)}
                        title={`Klik untuk menyisipkan ${v}`}
                        className="px-2 py-0.5 bg-white hover:bg-sky-100 border border-sky-300 rounded text-sky-900 transition-colors cursor-pointer text-left"
                      >
                        + {v}
                      </button>
                    ))}
                  </div>
                  <p className="text-sky-700 mt-2 text-[11px] leading-relaxed">
                    Variabel <strong>{'{ketentuan_kehadiran_iter}'}</strong> akan secara otomatis membedakan pesan: menyatakan <em>"Boleh diwakili"</em> pada iter 1 & 2, atau <em>"Wajib bersama pasien"</em> saat iter ke-3.
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="font-bold text-slate-800 text-xs block">
                    Isi Pesan WhatsApp — 🔄 Jadwal Iter:
                  </label>
                  <textarea
                    rows={13}
                    value={editingTemplateText}
                    onChange={(e) => setEditingTemplateText(e.target.value)}
                    className="w-full p-3.5 rounded-xl border border-sky-300 font-mono text-xs sm:text-sm text-slate-800 leading-relaxed focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                    placeholder="Ketik format template Jadwal Iter..."
                  />
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1">
                  <span className="text-xs text-slate-500">Dikirim otomatis H-3, H-2, H-1 sebelum tanggal Jadwal Iter farmasi.</span>
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                      type="button"
                      onClick={handleResetCurrentTemplate}
                      title="Kembalikan ke format baku/standar RSJ yang lengkap"
                      className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Reset Format Standar
                    </button>
                    <button
                      onClick={handleSaveCurrentTemplate}
                      className="px-5 py-2.5 bg-sky-700 hover:bg-sky-600 text-white font-bold text-xs sm:text-sm rounded-xl transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
                    >
                      <Save className="w-4 h-4" />
                      Simpan Template Jadwal Iter
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* TAB 4: KONEKSI WHATSAPP GATEWAY (BSP) */}
      {activeSubTab === 'gateway' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
            <div className="border-b border-slate-200 pb-4">
              <h3 className="font-bold text-slate-900 text-base">Penyedia Layanan WhatsApp API (BSP)</h3>
              <p className="text-xs text-slate-500">
                Pilih provider API pihak ketiga untuk penyewaan 1 bulan uji coba atau gunakan mode simulasi aman.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => onSaveBSPConfig({ ...bspConfig, providerName: 'fonnte', isSimulationMode: false })}
                className={`p-4 rounded-xl border text-left space-y-1.5 transition-all ${
                  bspConfig.providerName === 'fonnte' && !bspConfig.isSimulationMode
                    ? 'border-emerald-500 bg-emerald-50/70 ring-1 ring-emerald-500'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900">Fonnte Indonesia</span>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">Rekomendasi</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Paling mudah &amp; murah untuk sewa 1 bulan. Cukup scan QR WhatsApp Web, tanpa verifikasi Meta.
                </p>
              </button>

              <button
                type="button"
                onClick={() => onSaveBSPConfig({ ...bspConfig, providerName: 'qiscus', isSimulationMode: false })}
                className={`p-4 rounded-xl border text-left space-y-1.5 transition-all ${
                  bspConfig.providerName === 'qiscus' && !bspConfig.isSimulationMode
                    ? 'border-emerald-500 bg-emerald-50/70 ring-1 ring-emerald-500'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900">Qiscus / Mekari</span>
                  <span className="text-[10px] text-slate-500">Enterprise</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  BSP Resmi Meta dengan centang hijau untuk rumah sakit skala besar.
                </p>
              </button>

              <button
                type="button"
                onClick={() => onSaveBSPConfig({ ...bspConfig, isSimulationMode: true })}
                className={`p-4 rounded-xl border text-left space-y-1.5 transition-all ${
                  bspConfig.isSimulationMode
                    ? 'border-teal-500 bg-teal-50/70 ring-1 ring-teal-500'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900">Mode Simulasi Aman</span>
                  <span className="text-[10px] font-bold text-teal-800 bg-teal-100 px-2 py-0.5 rounded">Gratis / Demo</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Pesan disimulasikan di layar tanpa menggunakan kuota API berbayar.
                </p>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  API Key / Token Otorisasi:
                </label>
                <input
                  type="password"
                  value={bspConfig.apiKey}
                  onChange={(e) => onSaveBSPConfig({ ...bspConfig, apiKey: e.target.value })}
                  placeholder="Masukkan token dari penyedia BSP..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-mono text-xs focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-emerald-950 block text-xs">
                    Nomor WhatsApp Admin / Pengirim Resmi RSJ:
                  </label>
                  <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
                    Sumber Pengirim
                  </span>
                </div>
                <input
                  type="text"
                  value={bspConfig.senderNumber}
                  onChange={(e) => onSaveBSPConfig({ ...bspConfig, senderNumber: e.target.value })}
                  placeholder="Contoh: 0811-9988-7700"
                  className="w-full px-3.5 py-2 rounded-xl border border-emerald-300 bg-white font-mono text-xs text-slate-900 focus:ring-1 focus:ring-emerald-500"
                />
                <p className="text-[10px] text-emerald-900 leading-relaxed">
                  💡 Nomor ini adalah identitas WhatsApp resmi RSJ pengirim seluruh pesan otomatis.
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
              <div>
                Status Gateway saat ini: <strong className="text-slate-900 uppercase font-mono">{bspConfig.isSimulationMode ? 'Simulasi Aktif (Aman)' : 'Live Gateway (' + bspConfig.providerName + ')'}</strong>
              </div>
              <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Siap Melayani Pengiriman
              </span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
