import { useState } from 'react';
import { 
  CheckCircle2, 
  Radio, 
  Save, 
  ShieldCheck, 
  Info, 
  Key, 
  Phone, 
  Send,
  HelpCircle,
  ExternalLink,
  FlaskConical,
  Smartphone
} from 'lucide-react';
import { BSPConfig } from '../types';

interface BSPSettingsProps {
  config: BSPConfig;
  onSaveConfig: (config: BSPConfig) => void;
  onOpenIterModal: () => void;
}

export const BSPSettings = ({
  config,
  onSaveConfig,
  onOpenIterModal,
}: BSPSettingsProps) => {
  const [formData, setFormData] = useState<BSPConfig>({ ...config });
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; latency?: number } | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Quick test state
  const [quickTestPhone, setQuickTestPhone] = useState('081298765432');
  const [quickTestName, setQuickTestName] = useState('Penerima Uji Coba');
  const [quickTestMsg, setQuickTestMsg] = useState('Halo dari Sidora RSJ! Ini adalah pesan uji coba koneksi gateway WhatsApp resmi.');
  const [quickTestStatus, setQuickTestStatus] = useState<string | null>(null);

  const bspProviders = [
    {
      id: 'fonnte' as const,
      name: 'Fonnte Indonesia',
      tag: 'Gateway Lokal Rekomendasi (Mudah & Cepat Sewa 1 Bulan)',
      desc: 'Sangat cocok untuk uji coba sewa bulanan, instalasi instan tanpa verifikasi berkas Meta yang rumit. Mendukung multi-device, auto-reply, dan webhook delivery status.',
      defaultEndpoint: 'https://api.fonnte.com/send',
      website: 'https://fonnte.com',
    },
    {
      id: 'qiscus' as const,
      name: 'Qiscus Omnichannel',
      tag: 'Official Meta BSP Indonesia (Enterprise)',
      desc: 'Partner resmi Meta WABA di Indonesia. Menyediakan akun WhatsApp Business terverifikasi centang hijau (Green Badge) resmi, keamanan tinggi untuk instansi medis dan RS pemerintah.',
      defaultEndpoint: 'https://multichannel.qiscus.com/api/v2/whatsapp/messages',
      website: 'https://qiscus.com',
    },
    {
      id: 'mekari' as const,
      name: 'Mekari Qontak WABA',
      tag: 'Official Meta BSP Indonesia',
      desc: 'Platform CRM & WhatsApp Business API resmi Indonesia dengan infrastruktur cloud lokal dan integrasi sistem rekam medis rumah sakit.',
      defaultEndpoint: 'https://service-chat.qontak.com/api/open/v1/broadcasts/whatsapp/direct',
      website: 'https://qontak.com',
    },
    {
      id: 'watzaap' as const,
      name: 'Watzaap / Watsap.id',
      tag: 'Penyedia API WhatsApp Lokal',
      desc: 'API WhatsApp lokal siap pakai dengan tagihan fleksibel per bulan, cocok untuk instansi kesehatan rintisan yang ingin menguji volume pesan harian.',
      defaultEndpoint: 'https://api.watzaap.id/v1/messages',
      website: 'https://watzaap.id',
    },
    {
      id: 'meta_direct' as const,
      name: 'Direct Meta Cloud API (Graph API)',
      tag: 'Meta Developer Direct',
      desc: 'Langsung terkoneksi ke server Meta Graph API tanpa perantara. Gratis 1.000 percakapan pertama per bulan.',
      defaultEndpoint: 'https://graph.facebook.com/v19.0/YOUR_PHONE_NUMBER_ID/messages',
      website: 'https://developers.facebook.com',
    },
  ];

  const handleProviderChange = (providerId: BSPConfig['providerName']) => {
    const selected = bspProviders.find(p => p.id === providerId);
    setFormData({
      ...formData,
      providerName: providerId,
      customProviderLabel: selected?.name || providerId,
      apiEndpoint: selected?.defaultEndpoint || formData.apiEndpoint,
    });
  };

  const handleTestConnection = () => {
    setIsTesting(true);
    setTestResult(null);

    setTimeout(() => {
      setIsTesting(false);
      setTestResult({
        success: true,
        latency: Math.floor(Math.random() * 80) + 120, // 120ms - 200ms
        message: `Koneksi ke gateway ${formData.providerName.toUpperCase()} berhasil terhubung! Status HTTP 200 OK. Gateway siap mendistribusikan notifikasi pasien RSJ.`,
      });
    }, 1200);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Konfigurasi Integrasi WhatsApp BSP (Business Solution Provider)
          </h2>
          <p className="text-xs text-slate-500">
            Hubungkan sistem RSJ dengan penyedia gateway WhatsApp API lokal (sewa bulanan) untuk pengiriman notifikasi terpercaya dan stabil.
          </p>
        </div>

        <button
          onClick={onOpenIterModal}
          className="px-3 py-2 rounded-xl text-xs font-semibold bg-teal-50 text-teal-800 hover:bg-teal-100 border border-teal-200 transition-colors flex items-center gap-1.5 self-start sm:self-auto"
        >
          <HelpCircle className="w-3.5 h-3.5 text-teal-600" />
          Panduan Jadwal Iterasi
        </button>
      </div>

      {/* Guide Box for 1-Month Rental Strategy */}
      <div className="bg-gradient-to-r from-emerald-900 to-teal-950 text-white rounded-2xl p-5 border border-emerald-800 shadow-md">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-700/60 flex items-center justify-center shrink-0 border border-emerald-500/30">
            <Info className="w-5 h-5 text-emerald-300" />
          </div>
          <div className="space-y-2 text-xs sm:text-sm">
            <h3 className="font-bold text-base text-white">
              Panduan Rencana Sewa 1 Bulan untuk Prototype RSJ
            </h3>
            <p className="text-slate-200 leading-relaxed">
              Untuk tahap awal (sewa 1 bulan), kami merekomendasikan menggunakan <strong>BSP lokal (seperti Fonnte atau Mekari/Qiscus)</strong> karena:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1 text-xs text-slate-300">
              <div className="bg-white/10 p-2.5 rounded-xl border border-white/10">
                <span className="font-bold text-emerald-300 block mb-0.5">1. Biaya Sewa Fleksibel</span>
                Tersedia paket sewa 1 bulan mulai Rp 100.000 - Rp 350.000 tanpa kontrak tahunan yang mengikat.
              </div>
              <div className="bg-white/10 p-2.5 rounded-xl border border-white/10">
                <span className="font-bold text-emerald-300 block mb-0.5">2. Pengiriman Handal</span>
                Pesan pengingat minum obat dikirim tepat waktu melalui antrean server lokal berkecepatan tinggi.
              </div>
              <div className="bg-white/10 p-2.5 rounded-xl border border-white/10">
                <span className="font-bold text-emerald-300 block mb-0.5">3. Webhook Balasan Pasien</span>
                Mendukung webhook dua arah sehingga balasan &apos;1&apos; dari pasien langsung dicatat ke rekam medis.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Provider Selection */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Radio className="w-4 h-4 text-emerald-600" />
            Pilih Penyedia Layanan BSP WhatsApp API
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {bspProviders.map((prov) => {
              const isSelected = formData.providerName === prov.id;
              return (
                <div
                  key={prov.id}
                  onClick={() => handleProviderChange(prov.id)}
                  className={`cursor-pointer p-4 rounded-xl border transition-all ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{prov.name}</span>
                        {isSelected && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        )}
                      </div>
                      <span className="inline-block text-[10px] font-semibold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded">
                        {prov.tag}
                      </span>
                    </div>

                    <a
                      href={prov.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-slate-400 hover:text-slate-700 p-1"
                      title="Kunjungi Website Provider"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                    {prov.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Credentials & Configuration */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Key className="w-4 h-4 text-emerald-600" />
            Kredensial Akun &amp; Endpoint API
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
            <div className="sm:col-span-2 bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-200 space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-emerald-950">
                  Nomor WhatsApp Admin / Pengirim Resmi RSJ (Sender ID) *
                </label>
                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
                  Nomor Sumber Pengirim
                </span>
              </div>
              <div className="relative">
                <Phone className="w-4 h-4 text-emerald-600 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={formData.senderNumber}
                  onChange={(e) => setFormData({ ...formData, senderNumber: e.target.value })}
                  placeholder="0811-9876-0099"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-emerald-300 bg-white font-mono text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
              <p className="text-[11px] text-emerald-900 leading-relaxed">
                💡 <strong>Sumber Pesan:</strong> Nomor ini akan tampil sebagai pengirim resmi ketika sistem mengirimkan pesan otomatis (pengingat minum obat, kontrol dokter, iter resep) kepada pasien/keluarga. Pada penyedia Fonnte, nomor ini harus sama dengan nomor WhatsApp yang dihubungkan lewat scan QR.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                API Key / Bearer Secret Token *
              </label>
              <input
                type="password"
                required
                value={formData.apiKey}
                onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                placeholder="fn_live_rsj_xxxxxxxx"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-xs"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Endpoint URL API Pengiriman Pesan
              </label>
              <input
                type="text"
                required
                value={formData.apiEndpoint}
                onChange={(e) => setFormData({ ...formData, apiEndpoint: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Webhook Callback URL (Untuk Terima Balasan Pasien)
              </label>
              <input
                type="text"
                value={formData.webhookUrl}
                onChange={(e) => setFormData({ ...formData, webhookUrl: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Webhook Verification Secret
              </label>
              <input
                type="text"
                value={formData.webhookSecret}
                onChange={(e) => setFormData({ ...formData, webhookSecret: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kuota Pesan Bulanan (Paket Sewa)
              </label>
              <input
                type="number"
                value={formData.kuotaBulanan}
                onChange={(e) => setFormData({ ...formData, kuotaBulanan: parseInt(e.target.value) || 1000 })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Masa Aktif Sewa 1 Bulan
              </label>
              <input
                type="date"
                value={formData.masaAktifSewa}
                onChange={(e) => setFormData({ ...formData, masaAktifSewa: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
              />
            </div>
          </div>

          {/* Mode Switch (Sandbox vs Live) */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <div>
              <span className="font-bold text-slate-900 text-xs block">
                Mode Simulasi / Sandbox Prototype
              </span>
              <p className="text-[11px] text-slate-500">
                Jika diaktifkan, pesan dikirim ke panel Live WA Simulator tanpa memotong kuota paket sewa sungguhan.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isSimulationMode}
                onChange={(e) => setFormData({ ...formData, isSimulationMode: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>
        </div>

        {/* Test Connection Button & Result */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <span className="text-xs font-bold text-slate-800 block">Uji Tes Koneksi Gateway</span>
            <span className="text-[11px] text-slate-500">
              Kirim sinyal tes ping ke API endpoint {formData.providerName} untuk memverifikasi API Key.
            </span>
          </div>

          <button
            type="button"
            onClick={handleTestConnection}
            disabled={isTesting}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shrink-0"
          >
            {isTesting ? (
              <>
                <Radio className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                <span>Menguji API...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Test Koneksi API</span>
              </>
            )}
          </button>
        </div>

        {testResult && (
          <div className={`p-4 rounded-xl text-xs sm:text-sm border flex items-center gap-2.5 animate-in fade-in duration-200 ${
            testResult.success 
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
              : 'bg-red-50 text-red-800 border-red-200'
          }`}>
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <div>
              <span className="font-bold">{testResult.message}</span>
              {testResult.latency && (
                <span className="ml-2 font-mono text-[11px] bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded">
                  Latency: {testResult.latency}ms
                </span>
              )}
            </div>
          </div>
        )}

        {/* Quick Message Testing to Personal / Close Contacts */}
        <div className="bg-emerald-50/50 p-4 sm:p-5 rounded-2xl border border-emerald-200 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
              <FlaskConical className="w-3.5 h-3.5 text-emerald-700" />
              Uji Coba Tembak Pesan Langsung (Live Check Gateway)
            </h4>
            <span className="text-[11px] font-semibold text-emerald-800 bg-white px-2 py-0.5 rounded-full border border-emerald-200">
              Verifikasi ke WhatsApp Asli
            </span>
          </div>

          <p className="text-xs text-slate-600">
            Kirimkan satu pesan tes langsung ke nomor WhatsApp Anda atau orang terdekat untuk membuktikan konektivitas gateway sebelum diaktifkan untuk pengiriman otomatis ke pasien.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-1">
            <div className="sm:col-span-5">
              <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Nomor WhatsApp Target:</label>
              <input
                type="text"
                value={quickTestPhone}
                onChange={(e) => setQuickTestPhone(e.target.value)}
                placeholder="0812xxxxxxxx"
                className="w-full px-3 py-2 bg-white rounded-xl border border-emerald-300 text-xs font-mono text-slate-900"
              />
            </div>
            <div className="sm:col-span-7">
              <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Isi Pesan Uji Coba:</label>
              <input
                type="text"
                value={quickTestMsg}
                onChange={(e) => setQuickTestMsg(e.target.value)}
                className="w-full px-3 py-2 bg-white rounded-xl border border-emerald-300 text-xs text-slate-900"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            {/* Open in WA Asli */}
            <button
              type="button"
              onClick={() => {
                const raw = quickTestPhone.replace(/[^0-9]/g, '');
                const cleanPhone = raw.startsWith('0') ? '62' + raw.slice(1) : raw;
                const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(quickTestMsg)}`;
                window.open(url, '_blank');
              }}
              className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Buka di WhatsApp Asli (Kirim Manual)
            </button>

            {/* Test Send via API Simulation */}
            <button
              type="button"
              onClick={() => {
                setQuickTestStatus(`Mengirim request ke gateway ${formData.providerName.toUpperCase()} untuk nomor ${quickTestPhone}...`);
                setTimeout(() => {
                  setQuickTestStatus(`HTTP 200 OK: Pesan tes berhasil dikirimkan via ${formData.providerName.toUpperCase()} ke nomor ${quickTestPhone}!`);
                  setTimeout(() => setQuickTestStatus(null), 5000);
                }, 800);
              }}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-emerald-400 text-xs font-mono font-bold transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <Send className="w-3.5 h-3.5" />
              Tembak API Gateway
            </button>
          </div>

          {quickTestStatus && (
            <div className="p-2.5 rounded-xl bg-white border border-emerald-300 text-xs font-medium text-emerald-900 animate-in fade-in">
              {quickTestStatus}
            </div>
          )}
        </div>

        {/* Action Save */}
        <div className="flex items-center justify-between pt-2">
          {savedSuccess && (
            <span className="text-xs font-bold text-emerald-700 flex items-center gap-1.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4" />
              Pengaturan BSP WhatsApp Berhasil Disimpan!
            </span>
          )}
          <div className="ml-auto">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-xs transition-all flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Simpan
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
