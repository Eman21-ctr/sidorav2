import { useState, useCallback, useMemo } from 'react';
import {
  Send,
  CheckCircle2,
  Clock,
  Pill,
  Calendar,
  RefreshCw,
  MessageSquare,
  ExternalLink,
  SkipForward,
  Users,
  ChevronDown,
  ChevronUp,
  Phone,
  Filter,
  Search,
  Info,
  Sparkles,
  CheckCheck,
} from 'lucide-react';
import { Patient, MessageTemplate, ManualSendItem, ReminderCategory } from '../types';
import { generatePersonalizedMessage } from '../utils/messageGenerator';

interface KirimPesanProps {
  patients: Patient[];
  templates: MessageTemplate[];
  onMarkSent?: (item: ManualSendItem) => void;
}

// ============================================================
// Helper: Hitung selisih hari antara dua string tanggal
// ============================================================
function diffDays(targetDateStr: string, baseDateStr: string): number {
  const target = new Date(targetDateStr + 'T00:00:00');
  const base = new Date(baseDateStr + 'T00:00:00');
  return Math.round((target.getTime() - base.getTime()) / (1000 * 3600 * 24));
}

function getTodayStr(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function formatIndonesian(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr + 'T00:00:00');
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  } catch {
    return dateStr;
  }
}

function buildWaLink(phone: string, message: string): string {
  const cleaned = phone.replace(/\D/g, '');
  const normalized = cleaned.startsWith('0') ? '62' + cleaned.slice(1) : cleaned;
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${normalized}?text=${encoded}`;
}

// ============================================================
// Build daily queue dari data pasien
// ============================================================
function buildDailyQueue(
  patients: Patient[],
  templates: MessageTemplate[],
  todayStr: string
): ManualSendItem[] {
  const items: ManualSendItem[] = [];

  // Template lookups
  const tmplObatPagi = templates.find(t => t.id === 'tmpl-obat-pagi') || templates.find(t => t.category === 'minum_obat') || templates[0];
  const tmplObatSiang = templates.find(t => t.id === 'tmpl-obat-siang') || templates.find(t => t.category === 'minum_obat') || templates[0];
  const tmplObatMalam = templates.find(t => t.id === 'tmpl-obat-malam') || templates.find(t => t.category === 'minum_obat') || templates[0];
  const tmplKontrol = templates.find(t => t.id === 'tmpl-kontrol-dokter' || t.category === 'kontrol_dokter') || templates[0];
  const tmplIter = templates.find(t => t.id === 'tmpl-iter-resep' || t.category === 'iter_resep') || templates[0];

  if (!tmplObatPagi || !tmplObatSiang || !tmplObatMalam || !tmplKontrol || !tmplIter) return [];

  patients.forEach((patient) => {
    // Lewati pasien di luar pengawasan
    const isSupervised =
      patient.notifikasiOtomatisAktif !== false &&
      patient.statusPengawasan !== 'luar_pengawasan' &&
      patient.statusPengawasan !== 'selesai_pengobatan' &&
      patient.statusPengawasan !== 'rujuk_keluar';
    if (!isSupervised) return;

    // ────────────────────────────────────────
    // 1. MINUM OBAT HARIAN
    // ────────────────────────────────────────
    const sesi: Array<{
      key: 'pagi' | 'siang' | 'malam';
      label: string;
      tmpl: MessageTemplate;
      jam: string;
    }> = [
      { key: 'pagi', label: 'Obat Pagi', tmpl: tmplObatPagi, jam: patient.jamMinumObat.pagi || '07:00' },
      { key: 'siang', label: 'Obat Siang', tmpl: tmplObatSiang, jam: patient.jamMinumObat.siang || '12:30' },
      { key: 'malam', label: 'Obat Malam', tmpl: tmplObatMalam, jam: patient.jamMinumObat.malam || '20:00' },
    ];

    sesi.forEach(({ key, label, tmpl, jam }) => {
      const hasMeds = patient.obatRutin.some(m => m.waktuMinum.includes(key));
      if (!hasMeds) return;

      const targetRecipients: Array<'pasien' | 'caregiver'> =
        patient.caregiver.targetPenerima === 'keduanya'
          ? ['caregiver', 'pasien']
          : [patient.caregiver.targetPenerima];

      targetRecipients.forEach((recipType) => {
        const msg = generatePersonalizedMessage(tmpl, patient, recipType, { timeOfDay: key });
        if (!msg.recipientPhone) return;
        items.push({
          id: `send-${todayStr}-${patient.id}-obat-${key}-${recipType}`,
          date: todayStr,
          patientId: patient.id,
          patientName: patient.nama,
          noRM: patient.noRM,
          recipientName: msg.recipientName,
          recipientPhone: msg.recipientPhone,
          recipientType: recipType === 'caregiver' ? 'Caregiver' : 'Pasien',
          category: 'minum_obat',
          sessionLabel: `${label} (${jam} WITA)`,
          messageBody: msg.body,
          status: 'pending',
        });
      });
    });

    // ────────────────────────────────────────
    // 2. JADWAL KONTROL DOKTER (multi-tanggal)
    // ────────────────────────────────────────
    const kontrolList =
      patient.jadwalKontrolList && patient.jadwalKontrolList.length > 0
        ? patient.jadwalKontrolList
        : [
            {
              id: 'ktrl-1',
              tanggal: patient.jadwalKontrol.tanggal,
              jam: patient.jadwalKontrol.jam,
              label: 'Kontrol Sp.KJ',
            },
          ];

    kontrolList.forEach((jadwal, idx) => {
      if (!jadwal.tanggal) return;
      const diff = diffDays(jadwal.tanggal, todayStr);

      let tag = '';
      if (diff === 3) tag = 'H-3 (3 Hari Lagi)';
      else if (diff === 1) tag = 'H-1 (Besok)';
      else if (diff === 0) tag = 'Hari H (Hari Ini!)';
      else return;

      const msgKontrol = generatePersonalizedMessage(tmplKontrol, patient, 'caregiver', {
        customJadwal: {
          tanggal: jadwal.tanggal,
          jam: jadwal.jam || patient.jadwalKontrol?.jam || '09:00',
          dokter: jadwal.dokter || patient.jadwalKontrol?.dokter || patient.dokterDPJP,
          poli: jadwal.poli || patient.jadwalKontrol?.poli || patient.poliklinik,
        },
      });
      if (!msgKontrol.recipientPhone) return;

      const labelPrefix = jadwal.label || `Kontrol ${idx + 1}`;
      const dokterInfo = jadwal.dokter ? ` (${jadwal.dokter})` : '';
      items.push({
        id: `send-${todayStr}-${patient.id}-kontrol-${idx}-${diff}`,
        date: todayStr,
        patientId: patient.id,
        patientName: patient.nama,
        noRM: patient.noRM,
        recipientName: msgKontrol.recipientName,
        recipientPhone: msgKontrol.recipientPhone,
        recipientType: 'Caregiver',
        category: 'kontrol_dokter',
        sessionLabel: `${labelPrefix}${dokterInfo}: ${tag}`,
        messageBody: msgKontrol.body,
        status: 'pending',
        jadwalRef: jadwal.tanggal,
      });
    });

    // ────────────────────────────────────────
    // 3. JADWAL ITER RESEP (multi-tanggal)
    // ────────────────────────────────────────
    if (patient.jadwalIter.adaIter) {
      const iterList =
        patient.jadwalIterList && patient.jadwalIterList.length > 0
          ? patient.jadwalIterList
          : [
              {
                id: 'iter-1',
                nomorIter: 1,
                tanggal: patient.jadwalIter.tanggalIter,
                nomorResep: patient.jadwalIter.nomorResep,
                statusPengambilan: patient.jadwalIter.statusPengambilan || 'belum_diambil',
                label: 'Iter 1',
              } as const,
            ];

      iterList.forEach((iter) => {
        if (!iter.tanggal) return;
        if (iter.statusPengambilan === 'sudah_diambil') return;

        const diff = diffDays(iter.tanggal, todayStr);
        let tag = '';
        if (diff === 3) tag = 'H-3 (3 Hari Lagi)';
        else if (diff === 1) tag = 'H-1 (Besok)';
        else if (diff === 0) tag = 'Hari H (Hari Ini!)';
        else return;

        const msgIter = generatePersonalizedMessage(tmplIter, patient, 'caregiver', {
          customJadwal: {
            tanggal: iter.tanggal,
            jam: iter.jam || '08:30',
            nomorResep: iter.nomorResep || patient.jadwalIter?.nomorResep,
            iterKe: iter.nomorIter,
            totalIterasi: iterList.length,
            sisaIterasi: iterList.filter((it) => it.statusPengambilan !== 'sudah_diambil').length,
          },
        });
        if (!msgIter.recipientPhone) return;

        const isIter3 = iter.nomorIter >= 3;
        const labelPrefix = iter.label || `Iter ${iter.nomorIter}`;
        items.push({
          id: `send-${todayStr}-${patient.id}-iter-${iter.id}-${diff}`,
          date: todayStr,
          patientId: patient.id,
          patientName: patient.nama,
          noRM: patient.noRM,
          recipientName: msgIter.recipientName,
          recipientPhone: msgIter.recipientPhone,
          recipientType: 'Caregiver',
          category: 'iter_resep',
          sessionLabel: `${labelPrefix}: ${tag}${isIter3 ? ' ⚠️ Wajib Hadir Pasien' : ''}`,
          messageBody: msgIter.body,
          status: 'pending',
          jadwalRef: iter.tanggal,
          iterNomor: iter.nomorIter,
        });
      });
    }
  });

  return items;
}

// ============================================================
// Badge Components
// ============================================================
const StatusBadge = ({ status }: { status: ManualSendItem['status'] }) => {
  if (status === 'sent')
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
        <CheckCircle2 className="w-3 h-3" /> Terkirim
      </span>
    );
  if (status === 'skipped')
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
        <SkipForward className="w-3 h-3" /> Dilewati
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
      <Clock className="w-3 h-3" /> Belum Dikirim
    </span>
  );
};

const CategoryBadge = ({ category }: { category: ReminderCategory }) => {
  if (category === 'minum_obat')
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-800 border border-blue-200">
        <Pill className="w-3 h-3" /> Minum Obat
      </span>
    );
  if (category === 'kontrol_dokter')
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-purple-50 text-purple-800 border border-purple-200">
        <Calendar className="w-3 h-3" /> Kontrol Dokter
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-teal-50 text-teal-800 border border-teal-200">
      <RefreshCw className="w-3 h-3" /> Iter Resep
    </span>
  );
};

// ============================================================
// Main Component
// ============================================================
export const KirimPesan = ({ patients, templates, onMarkSent }: KirimPesanProps) => {
  const todayStr = getTodayStr();

  const [sentStatuses, setSentStatuses] = useState<Record<string, ManualSendItem['status']>>({});
  const [sentTimes, setSentTimes] = useState<Record<string, string>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<'all' | ReminderCategory>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'sent' | 'skipped'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const allItems = useMemo(
    () => buildDailyQueue(patients, templates, todayStr),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [patients.length, templates.length, todayStr]
  );

  const queueWithStatus: ManualSendItem[] = allItems.map(item => ({
    ...item,
    status: sentStatuses[item.id] ?? item.status,
    sentAt: sentTimes[item.id],
  }));

  const pendingItems = queueWithStatus.filter(i => i.status === 'pending');
  const sentItems = queueWithStatus.filter(i => i.status === 'sent');
  const skippedItems = queueWithStatus.filter(i => i.status === 'skipped');

  const filteredItems = queueWithStatus.filter(item => {
    const matchCat = filterCategory === 'all' || item.category === filterCategory;
    const matchSt = filterStatus === 'all' || item.status === filterStatus;
    const matchQ =
      !searchQuery ||
      item.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.noRM.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.recipientName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSt && matchQ;
  });

  const handleOpenWA = useCallback(
    (item: ManualSendItem) => {
      const waLink = buildWaLink(item.recipientPhone, item.messageBody);
      window.open(waLink, '_blank', 'noopener,noreferrer');
      setTimeout(() => {
        const now = new Date().toISOString();
        setSentStatuses(prev => ({ ...prev, [item.id]: 'sent' }));
        setSentTimes(prev => ({ ...prev, [item.id]: now }));
        onMarkSent?.({ ...item, status: 'sent', sentAt: now });
      }, 1500);
    },
    [onMarkSent]
  );

  const handleMarkSent = useCallback(
    (item: ManualSendItem) => {
      const now = new Date().toISOString();
      setSentStatuses(prev => ({ ...prev, [item.id]: 'sent' }));
      setSentTimes(prev => ({ ...prev, [item.id]: now }));
      onMarkSent?.({ ...item, status: 'sent', sentAt: now });
    },
    [onMarkSent]
  );

  const handleSkip = useCallback((item: ManualSendItem) => {
    setSentStatuses(prev => ({ ...prev, [item.id]: 'skipped' }));
  }, []);

  const handleReset = useCallback((item: ManualSendItem) => {
    setSentStatuses(prev => {
      const updated = { ...prev };
      delete updated[item.id];
      return updated;
    });
    setSentTimes(prev => {
      const updated = { ...prev };
      delete updated[item.id];
      return updated;
    });
  }, []);

  const handleMarkAllSent = () => {
    const now = new Date().toISOString();
    const statusUpdates: Record<string, ManualSendItem['status']> = {};
    const timeUpdates: Record<string, string> = {};
    pendingItems.forEach(item => {
      statusUpdates[item.id] = 'sent';
      timeUpdates[item.id] = now;
    });
    setSentStatuses(prev => ({ ...prev, ...statusUpdates }));
    setSentTimes(prev => ({ ...prev, ...timeUpdates }));
  };

  const progressPct =
    allItems.length > 0 ? Math.round((sentItems.length / allItems.length) * 100) : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Send className="w-5 h-5 text-emerald-600 shrink-0" />
            Kirim Pesan WhatsApp Hari Ini
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Daftar antrean pesan pengingat harian yang siap dikirimkan secara manual via WhatsApp.
          </p>
        </div>
        {pendingItems.length > 0 && (
          <button
            onClick={handleMarkAllSent}
            className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all flex items-center gap-1.5 shrink-0"
          >
            <CheckCheck className="w-4 h-4" />
            Tandai Semua Terkirim ({pendingItems.length})
          </button>
        )}
      </div>

      {/* ── PROGRESS CARD ──────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-5">
            <div className="text-center">
              <div className="text-2xl font-black text-slate-900">{allItems.length}</div>
              <div className="text-[11px] text-slate-500 font-medium">Total Pesan</div>
            </div>
            <div className="w-px h-10 bg-slate-200" />
            <div className="text-center">
              <div className="text-2xl font-black text-amber-600">{pendingItems.length}</div>
              <div className="text-[11px] text-slate-500 font-medium">Belum Dikirim</div>
            </div>
            <div className="w-px h-10 bg-slate-200" />
            <div className="text-center">
              <div className="text-2xl font-black text-emerald-600">{sentItems.length}</div>
              <div className="text-[11px] text-slate-500 font-medium">Terkirim</div>
            </div>
            <div className="w-px h-10 bg-slate-200" />
            <div className="text-center">
              <div className="text-2xl font-black text-slate-400">{skippedItems.length}</div>
              <div className="text-[11px] text-slate-500 font-medium">Dilewati</div>
            </div>
          </div>
          <div className="text-right">
            <div
              className={`text-4xl font-black tabular-nums ${
                progressPct === 100 ? 'text-emerald-600' : 'text-slate-800'
              }`}
            >
              {progressPct}%
            </div>
            <div className="text-[11px] text-slate-500">Progres Hari Ini</div>
          </div>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-3.5 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ease-out ${
              progressPct === 100
                ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                : 'bg-gradient-to-r from-amber-400 via-emerald-400 to-emerald-500'
            }`}
            style={{ width: `${progressPct}%` }}
          />
        </div>
        {progressPct === 100 && allItems.length > 0 && (
          <div className="mt-3 flex items-center gap-2 text-emerald-700 text-xs font-semibold">
            <Sparkles className="w-4 h-4 text-emerald-500" />
            Semua pesan hari ini sudah terkirim! Kerja bagus 🎉
          </div>
        )}
      </div>

      {/* ── INFO BANNER ────────────────────────────────────── */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-start gap-2.5 text-xs text-blue-900">
        <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-bold">Cara Pakai:</span> Klik{' '}
          <span className="font-bold bg-green-600 text-white px-1.5 py-0.5 rounded text-[10px]">
            Buka WA
          </span>{' '}
          untuk membuka WhatsApp ke kontak tujuan — isi pesan sudah terisi otomatis. Setelah WA terbuka,
          sistem otomatis menandai pesan sebagai <strong>Terkirim</strong> dalam ±1–2 detik.
          Atau klik <strong>Tandai</strong> untuk menandai secara manual.
        </div>
      </div>

      {/* ── FILTER & SEARCH ────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama pasien, No. RM, atau penerima..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value as any)}
            className="text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            <option value="all">Semua Kategori</option>
            <option value="minum_obat">💊 Minum Obat</option>
            <option value="kontrol_dokter">🗓 Kontrol Dokter</option>
            <option value="iter_resep">🔄 Iter Resep</option>
          </select>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value as any)}
            className="text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            <option value="all">Semua Status</option>
            <option value="pending">⏳ Belum Dikirim</option>
            <option value="sent">✅ Sudah Terkirim</option>
            <option value="skipped">⏭ Dilewati</option>
          </select>
        </div>
      </div>

      {/* ── EMPTY STATE ────────────────────────────────────── */}
      {allItems.length === 0 && (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <Users className="w-7 h-7 text-slate-400" />
          </div>
          <h3 className="font-bold text-slate-800 mb-1 text-sm">Tidak ada pesan untuk hari ini</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
            Belum ada pasien aktif dengan jadwal kontrol atau iter yang jatuh hari ini atau dalam 3 hari
            ke depan. Pengingat minum obat akan muncul jika ada pasien terdaftar dan aktif.
          </p>
        </div>
      )}

      {/* ── QUEUE TABLE ────────────────────────────────────── */}
      {filteredItems.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px] font-semibold">
                <tr>
                  <th className="py-3 px-4 w-8">#</th>
                  <th className="py-3 px-4">Pasien</th>
                  <th className="py-3 px-4">Penerima WA</th>
                  <th className="py-3 px-4">Kategori</th>
                  <th className="py-3 px-4">Sesi / Jadwal</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.map((item, idx) => {
                  const isExpanded = expandedId === item.id;
                  const isSent = item.status === 'sent';
                  const isSkipped = item.status === 'skipped';

                  return (
                    <>
                      <tr
                        key={item.id}
                        className={`transition-colors ${
                          isSent
                            ? 'bg-emerald-50/40'
                            : isSkipped
                            ? 'bg-slate-50/60 opacity-60'
                            : 'hover:bg-slate-50/70'
                        }`}
                      >
                        {/* # */}
                        <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">{idx + 1}</td>

                        {/* Pasien */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="font-bold text-slate-900">{item.patientName}</div>
                          <div className="text-[11px] text-slate-500 font-mono">{item.noRM}</div>
                        </td>

                        {/* Penerima */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 font-medium text-slate-800">
                            <Phone className="w-3 h-3 text-emerald-600" />
                            {item.recipientName}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono">{item.recipientPhone}</div>
                          <div className="text-[10px] text-slate-400">({item.recipientType})</div>
                        </td>

                        {/* Kategori */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <CategoryBadge category={item.category} />
                        </td>

                        {/* Sesi */}
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-800 text-xs">
                            {item.sessionLabel}
                          </div>
                          {item.jadwalRef && (
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              Jadwal: {formatIndonesian(item.jadwalRef)}
                            </div>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <StatusBadge status={item.status} />
                          {item.sentAt && (
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              {new Date(item.sentAt).toLocaleTimeString('id-ID', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}{' '}
                              WITA
                            </div>
                          )}
                        </td>

                        {/* Aksi */}
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Preview toggle */}
                            <button
                              onClick={() => setExpandedId(isExpanded ? null : item.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                              title="Lihat isi pesan"
                            >
                              {isExpanded ? (
                                <ChevronUp className="w-3.5 h-3.5" />
                              ) : (
                                <ChevronDown className="w-3.5 h-3.5" />
                              )}
                            </button>

                            {!isSent && !isSkipped && (
                              <>
                                {/* Buka WA — main CTA */}
                                <button
                                  onClick={() => handleOpenWA(item)}
                                  className="px-2.5 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white font-bold text-[11px] transition-all flex items-center gap-1 shadow-sm"
                                  title="Buka WhatsApp dengan pesan terisi otomatis"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  Buka WA
                                </button>

                                {/* Tandai Manual */}
                                <button
                                  onClick={() => handleMarkSent(item)}
                                  className="px-2 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold text-[11px] transition-colors flex items-center gap-1 border border-emerald-200"
                                  title="Tandai sudah dikirim (tanpa buka WA)"
                                >
                                  <CheckCircle2 className="w-3 h-3" />
                                  Tandai
                                </button>

                                {/* Lewati */}
                                <button
                                  onClick={() => handleSkip(item)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-amber-700 hover:bg-amber-50 transition-colors"
                                  title="Lewati pesan ini hari ini"
                                >
                                  <SkipForward className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}

                            {(isSent || isSkipped) && (
                              <button
                                onClick={() => handleReset(item)}
                                className="px-2 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-[11px] transition-colors"
                                title="Kembalikan ke status belum dikirim"
                              >
                                Reset
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Expanded: Preview Isi Pesan */}
                      {isExpanded && (
                        <tr key={`${item.id}-expand`} className="bg-slate-50/80">
                          <td colSpan={7} className="px-6 py-4">
                            <div className="bg-white rounded-xl border border-slate-200 p-4 max-w-2xl shadow-xs">
                              <div className="flex items-center gap-2 mb-3 text-xs font-bold text-slate-700">
                                <MessageSquare className="w-3.5 h-3.5 text-green-600" />
                                Preview Isi Pesan WhatsApp
                                <span className="ml-auto text-[11px] font-normal text-slate-400 font-mono">
                                  → {item.recipientPhone}
                                </span>
                              </div>
                              <pre className="text-xs text-slate-700 whitespace-pre-wrap font-sans leading-relaxed bg-green-50 rounded-lg p-3 border border-green-100 max-h-64 overflow-y-auto">
                                {item.messageBody}
                              </pre>
                              <div className="mt-3 flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleOpenWA(item)}
                                  disabled={isSent || isSkipped}
                                  className="px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white font-bold text-xs transition-all flex items-center gap-1.5 shadow-sm"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  Buka WhatsApp Sekarang
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {filteredItems.length === 0 && allItems.length > 0 && (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-500">
          Tidak ada pesan yang cocok dengan filter yang dipilih.{' '}
          <button
            onClick={() => {
              setFilterCategory('all');
              setFilterStatus('all');
              setSearchQuery('');
            }}
            className="ml-1 text-emerald-600 font-semibold hover:underline"
          >
            Reset Filter
          </button>
        </div>
      )}

      {/* ── LEGEND CARDS ───────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-blue-100 space-y-1.5">
          <div className="flex items-center gap-2 text-blue-700 font-bold text-xs">
            <Pill className="w-3.5 h-3.5" /> Minum Obat Harian
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            Muncul setiap hari untuk setiap sesi (pagi/siang/malam) sesuai jadwal minum obat yang
            tersimpan di profil pasien.
          </p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-purple-100 space-y-1.5">
          <div className="flex items-center gap-2 text-purple-700 font-bold text-xs">
            <Calendar className="w-3.5 h-3.5" /> Kontrol Dokter
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            Notifikasi muncul pada <strong>H-3</strong>, <strong>H-1</strong>, dan{' '}
            <strong>Hari H</strong> dari masing-masing tanggal kontrol yang diatur di profil pasien
            (max 3 tanggal per periode).
          </p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-teal-100 space-y-1.5">
          <div className="flex items-center gap-2 text-teal-700 font-bold text-xs">
            <RefreshCw className="w-3.5 h-3.5" /> Jadwal Iter
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            Notifikasi pada <strong>H-3</strong>, <strong>H-1</strong>, dan <strong>Hari H</strong>{' '}
            iter. Iter 1 & 2 boleh diwakili caregiver. <strong>Iter 3 wajib hadir bersama pasien.</strong>
          </p>
        </div>
      </div>
    </div>
  );
};
