import { useState } from 'react';
import { 
  MessageSquare, 
  Smartphone, 
  Check, 
  Copy, 
  Pill, 
  Calendar, 
  RefreshCw, 
  Sparkles, 
  CheckCheck, 
  User,
  HelpCircle
} from 'lucide-react';
import { MessageTemplate, Patient, ReminderCategory } from '../types';
import { generatePersonalizedMessage } from '../utils/messageGenerator';
import { RSJ_INFO } from '../data/initialData';

interface NotificationTemplatesProps {
  templates: MessageTemplate[];
  patients: Patient[];
  onSaveTemplate: (template: MessageTemplate) => void;
  onOpenIterModal: () => void;
}

export const NotificationTemplates = ({
  templates,
  patients,
  onSaveTemplate,
  onOpenIterModal,
}: NotificationTemplatesProps) => {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(templates[0]?.id || '');
  const [previewPatientId, setPreviewPatientId] = useState<string>(patients[0]?.id || '');
  const [previewRecipient, setPreviewRecipient] = useState<'pasien' | 'caregiver'>('caregiver');
  const [copied, setCopied] = useState(false);

  const currentTemplate = templates.find(t => t.id === selectedTemplateId) || templates[0];
  const currentPatient = patients.find(p => p.id === previewPatientId) || patients[0];

  // Personalized preview text
  const personalized = currentPatient && currentTemplate
    ? generatePersonalizedMessage(currentTemplate, currentPatient, previewRecipient)
    : { body: currentTemplate?.templateText || '', recipientName: 'Pasien/Caregiver', recipientPhone: '0812xxxx' };

  const availableVariables = [
    { tag: '{nama_pasien}', label: 'Nama Pasien', example: 'Bambang Triyono' },
    { tag: '{nama_caregiver}', label: 'Nama Caregiver', example: 'Siti Aminah' },
    { tag: '{hubungan_caregiver}', label: 'Hubungan', example: 'Ibu Kandung' },
    { tag: '{nama_panggilan}', label: 'Panggilan Pasien/Caregiver', example: 'Bapak Bambang / Ibu Siti' },
    { tag: '{daftar_obat_pagi}', label: 'Daftar Obat Pagi', example: 'Risperidone 2mg' },
    { tag: '{daftar_obat_siang}', label: 'Daftar Obat Siang', example: 'Risperidone 2mg' },
    { tag: '{daftar_obat_malam}', label: 'Daftar Obat Malam', example: 'Clozapine 25mg' },
    { tag: '{jam_minum}', label: 'Jam Minum Obat', example: '06:00 WITA' },
    { tag: '{tanggal_kontrol}', label: 'Tgl Kontrol', example: 'Jumat, 25 Sep 2026' },
    { tag: '{jam_kontrol}', label: 'Jam Kontrol', example: '09:00' },
    { tag: '{tanggal_iter}', label: 'Tgl Ambil Obat Iter', example: 'Kamis, 24 Sep 2026' },
    { tag: '{iter_ke}', label: 'Iterasi Ke', example: 'Iter ke-2' },
    { tag: '{ketentuan_kehadiran_iter}', label: 'Keterangan Hadir Iter (Iter 3 Wajib)', example: 'Catatan iter ke-3 wajib bersama pasien' },
    { tag: '{sisa_iter}', label: 'Sisa Jatah Iterasi', example: '1x dari total 2x' },
    { tag: '{nomor_rm}', label: 'No. Rekam Medis (Opsional)', example: 'RM-2024-0102' },
    { tag: '{dokter_dpjp}', label: 'Dokter DPJP (Opsional)', example: 'dr. Qurrota Aini, Sp.KJ' },
    { tag: '{hotline_rsj}', label: 'Hotline WA RSJ', example: RSJ_INFO.hotlineWA },
    { tag: '{nama_rsj}', label: 'Nama RSJ', example: RSJ_INFO.nama },
  ];

  const handleInsertVariable = (tag: string) => {
    if (!currentTemplate) return;
    const updated = {
      ...currentTemplate,
      templateText: currentTemplate.templateText + ' ' + tag,
    };
    onSaveTemplate(updated);
  };

  const handleTextChange = (text: string) => {
    if (!currentTemplate) return;
    onSaveTemplate({
      ...currentTemplate,
      templateText: text,
    });
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(personalized.body);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getCategoryIcon = (cat: ReminderCategory) => {
    switch (cat) {
      case 'minum_obat': return <Pill className="w-4 h-4 text-blue-600" />;
      case 'kontrol_dokter': return <Calendar className="w-4 h-4 text-purple-600" />;
      case 'iter_resep': return <RefreshCw className="w-4 h-4 text-teal-600" />;
      case 'edukasi_rsj': return <Sparkles className="w-4 h-4 text-amber-600" />;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Template Notifikasi WhatsApp Terpersonalisasi
          </h2>
          <p className="text-xs text-slate-500">
            Sesuaikan teks pesan otomatis dengan placeholder dinamis untuk obat harian, kontrol Sp.KJ, dan Jadwal Iter.
          </p>
        </div>

        <button
          onClick={onOpenIterModal}
          className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-teal-50 text-teal-800 hover:bg-teal-100 border border-teal-200 transition-colors self-start sm:self-auto flex items-center gap-1.5"
        >
          <HelpCircle className="w-3.5 h-3.5 text-teal-600" />
          Memahami &quot;Iterasi Resep&quot;
        </button>
      </div>

      {/* Main 2-Column Editor + Live WhatsApp Simulator Screen */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Template List & Editor (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Template Selector Pills */}
          <div className="flex flex-wrap gap-2">
            {templates.map((tmpl) => {
              const isSelected = tmpl.id === selectedTemplateId;
              return (
                <button
                  key={tmpl.id}
                  onClick={() => setSelectedTemplateId(tmpl.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isSelected
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {getCategoryIcon(tmpl.category)}
                  <span>{tmpl.nama}</span>
                </button>
              );
            })}
          </div>

          {/* Template Editor Box */}
          {currentTemplate && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-bold">
                    Kode: {currentTemplate.kode}
                  </span>
                  <h3 className="font-bold text-slate-900 text-base mt-1">
                    {currentTemplate.nama}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {currentTemplate.deskripsi}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-semibold text-slate-500 block">Jadwal Kirim Standar:</span>
                  <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                    {currentTemplate.defaultTime || '08:00'} WIB
                  </span>
                </div>
              </div>

              {/* Text Area */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Isi Template Pesan (Dapat Diedit Langsung)
                </label>
                <textarea
                  rows={8}
                  value={currentTemplate.templateText}
                  onChange={(e) => handleTextChange(e.target.value)}
                  className="w-full p-3.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-sans focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 leading-relaxed"
                />
              </div>

              {/* Dynamic Variable Chips */}
              <div>
                <span className="text-xs font-bold text-slate-700 block mb-2">
                  Sisipkan Variabel Otomatis (Klik untuk Menambahkan):
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto pr-1">
                  {availableVariables.map((v) => (
                    <button
                      key={v.tag}
                      type="button"
                      onClick={() => handleInsertVariable(v.tag)}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-emerald-100 hover:text-emerald-900 text-slate-700 text-[11px] font-mono border border-slate-200 transition-colors flex items-center gap-1"
                      title={`Contoh isi: ${v.example}`}
                    >
                      <span className="font-semibold text-emerald-700">+</span> {v.tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Live WhatsApp Smartphone Device Preview (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          {/* Patient Selector for Preview */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-emerald-600" />
              Pratinjau dengan Data Pasien:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <select
                value={previewPatientId}
                onChange={(e) => setPreviewPatientId(e.target.value)}
                className="w-full p-2 rounded-xl border border-slate-200 text-xs bg-white text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500/20"
              >
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nama} ({p.noRM})
                  </option>
                ))}
              </select>

              <select
                value={previewRecipient}
                onChange={(e) => setPreviewRecipient(e.target.value as any)}
                className="w-full p-2 rounded-xl border border-slate-200 text-xs bg-white text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="caregiver">Kirim ke: Caregiver</option>
                <option value="pasien">Kirim ke: Pasien Langsung</option>
              </select>
            </div>
          </div>

          {/* Smartphone Frame */}
          <div className="bg-slate-900 rounded-[36px] p-3 shadow-xl border-4 border-slate-800 max-w-sm mx-auto">
            {/* Top Speaker & Camera Notch */}
            <div className="w-28 h-4 bg-slate-800 rounded-full mx-auto mb-2 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-slate-900 mr-2" />
              <div className="w-10 h-1 bg-slate-700 rounded-full" />
            </div>

            {/* Phone Screen Screen */}
            <div className="bg-[#efeae2] rounded-[24px] overflow-hidden flex flex-col h-[520px] text-slate-900">
              {/* WhatsApp Header */}
              <div className="bg-[#075e54] text-white px-3.5 py-2.5 flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center font-bold text-xs text-white border border-white/20">
                    RSJ
                  </div>
                  <div className="leading-tight">
                    <div className="font-bold text-xs flex items-center gap-1">
                      RSJ Naimata
                      {/* Verified Badge */}
                      <span className="w-3 h-3 rounded-full bg-emerald-400 text-[#075e54] flex items-center justify-center text-[8px] font-bold">
                        ✓
                      </span>
                    </div>
                    <div className="text-[10px] text-emerald-100">
                      Akun Resmi Rumah Sakit Jiwa
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleCopyText}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs transition-colors"
                  title="Salin isi pesan"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Chat Canvas with Wallpaper */}
              <div 
                className="flex-1 p-3 overflow-y-auto space-y-3 text-xs"
                style={{
                  backgroundImage: `radial-gradient(#d1c7b7 1px, transparent 1px)`,
                  backgroundSize: '16px 16px',
                }}
              >
                {/* Security Encryption Notice */}
                <div className="bg-[#ffeecd] text-[#554a32] p-1.5 rounded-lg text-[10px] text-center shadow-2xs max-w-[280px] mx-auto border border-[#e8dac0]">
                  🔒 Pesan ini dienkripsi end-to-end melalui WhatsApp Business API resmi.
                </div>

                {/* Recipient Target Info */}
                <div className="text-center text-[10px] text-slate-500 font-medium">
                  Dikirim ke: {personalized.recipientName} ({personalized.recipientPhone})
                </div>

                {/* WhatsApp Outgoing Bubble */}
                <div className="flex justify-end">
                  <div className="bg-[#d9fdd3] text-slate-900 rounded-2xl rounded-tr-xs p-3 max-w-[90%] shadow-xs border border-emerald-100 relative group">
                    <p className="whitespace-pre-line text-[11px] leading-relaxed select-text">
                      {personalized.body}
                    </p>
                    
                    {/* Timestamp & double ticks */}
                    <div className="flex items-center justify-end gap-1 mt-1.5 text-[9px] text-slate-500">
                      <span>{currentTemplate?.defaultTime || '07:00'}</span>
                      <CheckCheck className="w-3.5 h-3.5 text-sky-600" />
                    </div>
                  </div>
                </div>

                {/* Simulated Quick Reply Button */}
                <div className="flex flex-col gap-1 max-w-[85%] ml-auto">
                  <div className="bg-white/90 border border-slate-300/80 rounded-xl py-1.5 px-3 text-center text-[11px] font-semibold text-emerald-800 shadow-2xs hover:bg-white cursor-pointer transition-colors">
                    Balas: 1 (Sudah Diminum)
                  </div>
                  <div className="bg-white/90 border border-slate-300/80 rounded-xl py-1.5 px-3 text-center text-[11px] font-semibold text-slate-700 shadow-2xs hover:bg-white cursor-pointer transition-colors">
                    Balas: HADIR (Konfirmasi Kontrol)
                  </div>
                </div>
              </div>

              {/* Fake WhatsApp Bottom Bar */}
              <div className="bg-[#f0f2f5] p-2 flex items-center gap-2 border-t border-slate-200 text-xs text-slate-400">
                <div className="flex-1 bg-white rounded-full px-3 py-1.5 text-[11px] text-slate-500 border border-slate-200">
                  Ketik balasan pesan...
                </div>
                <div className="w-7 h-7 rounded-full bg-[#00a884] text-white flex items-center justify-center">
                  <Smartphone className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
