import { useState, useMemo, useEffect } from 'react';
import { 
  Send, 
  CheckCheck, 
  MessageSquare, 
  AlertTriangle, 
  HeartPulse, 
  Calendar, 
  RefreshCw, 
  Sparkles, 
  BarChart3, 
  Pill, 
  PlusCircle, 
  Edit3, 
  Trash2, 
  Save, 
  CheckCircle2, 
  Download,
  CalendarRange,
  Info,
  Layers,
  Eraser,
  Database,
  ArrowRight
} from 'lucide-react';
import { ManualDailyRecord } from '../types';
import { 
  fetchManualDailyRecords, 
  upsertManualDailyRecord, 
  deleteManualDailyRecord, 
  clearAllManualDailyRecords 
} from '../services/manualStatsService';
import { getTodayDateStr, formatIndoDate } from '../utils/analyticsHelper';
import * as XLSX from 'xlsx';

export const ManualDashboard = () => {
  const [records, setRecords] = useState<ManualDailyRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [saveToast, setSaveToast] = useState<{ message: string; type: 'success' | 'danger' } | null>(null);

  const todayStr = getTodayDateStr();

  // Rentang Tanggal untuk Filter Tampilan
  const [startDate, setStartDate] = useState<string>(() => {
    // Default 7 hari ke belakang
    const d = new Date();
    d.setDate(d.getDate() - 6);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState<string>(todayStr);

  const [selectedChartMetric, setSelectedChartMetric] = useState<'all' | 'read' | 'replied' | 'compliance'>('all');

  // Form State (Default nilai 0 / bersih)
  const [formDate, setFormDate] = useState<string>(todayStr);
  const [totalSent, setTotalSent] = useState<number>(0);
  const [delivered, setDelivered] = useState<number>(0);
  const [read, setRead] = useState<number>(0);
  const [replied, setReplied] = useState<number>(0);
  const [failed, setFailed] = useState<number>(0);
  const [complianceRate, setComplianceRate] = useState<number>(0);
  const [kategoriObat, setKategoriObat] = useState<number>(0);
  const [kategoriKontrol, setKategoriKontrol] = useState<number>(0);
  const [kategoriIter, setKategoriIter] = useState<number>(0);
  const [kategoriEdukasi, setKategoriEdukasi] = useState<number>(0);
  const [petugas, setPetugas] = useState<string>('');
  const [catatan, setCatatan] = useState<string>('');

  const [isFormOpen, setIsFormOpen] = useState<boolean>(true);

  // Load records on mount dari Supabase
  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setIsLoading(true);
    try {
      const data = await fetchManualDailyRecords();
      setRecords(data);

      // Jika ada data untuk hari ini, auto-populate ke form
      const existingToday = data.find(r => r.date === todayStr);
      if (existingToday) {
        populateForm(existingToday);
      } else if (data.length > 0) {
        // Atur rentang awal ke tanggal paling awal & akhir jika ada data
        setStartDate(data[0].date);
        setEndDate(data[data.length - 1].date);
      }
    } catch (err) {
      console.error('Error loading manual records:', err);
    } finally {
      setIsLoading(false);
    }
  }

  // Isi data ke form saat tanggal dipilih atau klik edit
  const populateForm = (record: ManualDailyRecord) => {
    setFormDate(record.date);
    setTotalSent(record.totalSent || 0);
    setDelivered(record.delivered ?? (record.totalSent - record.failed));
    setRead(record.read || 0);
    setReplied(record.replied || 0);
    setFailed(record.failed || 0);
    setComplianceRate(record.complianceRate || 0);
    setKategoriObat(record.kategoriObat || 0);
    setKategoriKontrol(record.kategoriKontrol || 0);
    setKategoriIter(record.kategoriIter || 0);
    setKategoriEdukasi(record.kategoriEdukasi || 0);
    setPetugas(record.petugas || '');
    setCatatan(record.catatan || '');
  };

  // Reset form ke nilai 0 bersih
  const resetFormClean = (targetDate = todayStr) => {
    setFormDate(targetDate);
    setTotalSent(0);
    setDelivered(0);
    setRead(0);
    setReplied(0);
    setFailed(0);
    setComplianceRate(0);
    setKategoriObat(0);
    setKategoriKontrol(0);
    setKategoriIter(0);
    setKategoriEdukasi(0);
    setPetugas('');
    setCatatan('');
  };

  // Saat tanggal di form diganti
  const handleFormDateChange = (newDate: string) => {
    setFormDate(newDate);
    const existing = records.find(r => r.date === newDate);
    if (existing) {
      populateForm(existing);
    } else {
      resetFormClean(newDate);
    }
  };

  // Kalkulasi persentase form realtime
  const calcReadRate = totalSent > 0 ? Math.min(100, Math.round((read / totalSent) * 100)) : 0;
  const calcReplyRate = totalSent > 0 ? Math.min(100, Math.round((replied / totalSent) * 100)) : 0;

  // Preset Cepat Rentang Tanggal
  const handlePresetRange = (preset: 'today' | '7days' | 'month' | 'all') => {
    if (preset === 'today') {
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === '7days') {
      const d = new Date();
      d.setDate(d.getDate() - 6);
      setStartDate(d.toISOString().split('T')[0]);
      setEndDate(todayStr);
    } else if (preset === 'month') {
      const d = new Date();
      const firstDay = new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
      setStartDate(firstDay);
      setEndDate(todayStr);
    } else if (preset === 'all') {
      if (records.length > 0) {
        setStartDate(records[0].date);
        setEndDate(records[records.length - 1].date);
      } else {
        setStartDate('2026-01-01');
        setEndDate(todayStr);
      }
    }
  };

  // Filter records berdasarkan rentang tanggal terpilih [startDate, endDate]
  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      const dateOk = (!startDate || r.date >= startDate) && (!endDate || r.date <= endDate);
      return dateOk;
    });
  }, [records, startDate, endDate]);

  // Perhitungan Data yang Ditampilkan di Kartu & Grafik dari filteredRecords
  const displayedMetrics = useMemo(() => {
    const isSingleDay = startDate && endDate && startDate === endDate;

    if (filteredRecords.length === 0) {
      return {
        totalSent: 0,
        read: 0,
        replied: 0,
        failed: 0,
        readRate: 0,
        replyRate: 0,
        complianceRate: 0,
        kategoriObat: 0,
        kategoriKontrol: 0,
        kategoriIter: 0,
        kategoriEdukasi: 0,
        totalKategori: 1,
        title: isSingleDay 
          ? `Data Tanggal ${formatIndoDate(startDate)}`
          : `Periode: ${formatIndoDate(startDate)} s/d ${formatIndoDate(endDate)}`,
        periodLabel: 'Belum ada data rekapan manual tersimpan pada rentang tanggal ini.',
        isEmpty: true,
      };
    }

    if (filteredRecords.length === 1 && isSingleDay) {
      const single = filteredRecords[0];
      const totalCat = single.kategoriObat + single.kategoriKontrol + single.kategoriIter + single.kategoriEdukasi || 1;
      return {
        totalSent: single.totalSent,
        read: single.read,
        replied: single.replied,
        failed: single.failed,
        readRate: single.readRate,
        replyRate: single.replyRate,
        complianceRate: single.complianceRate,
        kategoriObat: single.kategoriObat,
        kategoriKontrol: single.kategoriKontrol,
        kategoriIter: single.kategoriIter,
        kategoriEdukasi: single.kategoriEdukasi,
        totalKategori: totalCat,
        title: `Rekapitulasi Harian: ${formatIndoDate(single.date)}`,
        periodLabel: single.petugas ? `Petugas: ${single.petugas} ${single.catatan ? `• "${single.catatan}"` : ''}` : 'Data harian tunggal',
        isEmpty: false,
      };
    }

    // Akumulasi / Rata-rata dari filteredRecords
    const sumSent = filteredRecords.reduce((acc, r) => acc + r.totalSent, 0);
    const sumRead = filteredRecords.reduce((acc, r) => acc + r.read, 0);
    const sumReplied = filteredRecords.reduce((acc, r) => acc + r.replied, 0);
    const sumFailed = filteredRecords.reduce((acc, r) => acc + r.failed, 0);
    const avgCompliance = Math.round(filteredRecords.reduce((acc, r) => acc + r.complianceRate, 0) / filteredRecords.length);
    const sumObat = filteredRecords.reduce((acc, r) => acc + r.kategoriObat, 0);
    const sumKontrol = filteredRecords.reduce((acc, r) => acc + r.kategoriKontrol, 0);
    const sumIter = filteredRecords.reduce((acc, r) => acc + r.kategoriIter, 0);
    const sumEdukasi = filteredRecords.reduce((acc, r) => acc + r.kategoriEdukasi, 0);
    const totalCat = sumObat + sumKontrol + sumIter + sumEdukasi || 1;

    const readPct = sumSent > 0 ? Math.round((sumRead / sumSent) * 100) : 0;
    const replyPct = sumSent > 0 ? Math.round((sumReplied / sumSent) * 100) : 0;

    return {
      totalSent: sumSent,
      read: sumRead,
      replied: sumReplied,
      failed: sumFailed,
      readRate: readPct,
      replyRate: replyPct,
      complianceRate: avgCompliance,
      kategoriObat: sumObat,
      kategoriKontrol: sumKontrol,
      kategoriIter: sumIter,
      kategoriEdukasi: sumEdukasi,
      totalKategori: totalCat,
      title: `Akumulasi: ${formatIndoDate(startDate)} s/d ${formatIndoDate(endDate)} (${filteredRecords.length} Hari)`,
      periodLabel: `Total ${filteredRecords.length} hari data pengiriman manual tercatat pada rentang ini`,
      isEmpty: false,
    };
  }, [filteredRecords, startDate, endDate]);

  // Handler Simpan ke Supabase
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formDate) {
      alert('Pilih tanggal terlebih dahulu!');
      return;
    }

    setIsSaving(true);
    const newRecord: ManualDailyRecord = {
      date: formDate,
      totalSent: Number(totalSent) || 0,
      delivered: Number(delivered) || 0,
      read: Number(read) || 0,
      replied: Number(replied) || 0,
      failed: Number(failed) || 0,
      readRate: calcReadRate,
      replyRate: calcReplyRate,
      complianceRate: Number(complianceRate) || 0,
      kategoriObat: Number(kategoriObat) || 0,
      kategoriKontrol: Number(kategoriKontrol) || 0,
      kategoriIter: Number(kategoriIter) || 0,
      kategoriEdukasi: Number(kategoriEdukasi) || 0,
      petugas: petugas.trim(),
      catatan: catatan.trim(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await upsertManualDailyRecord(newRecord);
      
      // Update local state
      setRecords(prev => {
        const idx = prev.findIndex(r => r.date === formDate);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = newRecord;
          return updated;
        }
        return [...prev, newRecord].sort((a, b) => a.date.localeCompare(b.date));
      });

      // Sesuaikan rentang agar tanggal yang baru diinput terlihat jika di luar rentang
      if (startDate > formDate) setStartDate(formDate);
      if (endDate < formDate) setEndDate(formDate);

      setSaveToast({
        message: `✅ Data pengiriman manual tanggal ${formatIndoDate(formDate)} berhasil disimpan ke Supabase!`,
        type: 'success',
      });
      setTimeout(() => setSaveToast(null), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Kesalahan jaringan/database';
      console.error('Error saving manual record:', err);
      alert(`Gagal menyimpan ke Supabase: ${msg}\nPastikan tabel manual_daily_records sudah dibuat.`);
    } finally {
      setIsSaving(false);
    }
  };

  // Handler Hapus 1 Tanggal
  const handleDelete = async (date: string) => {
    if (!window.confirm(`Hapus catatan data manual tanggal ${formatIndoDate(date)} dari Supabase?`)) return;
    try {
      await deleteManualDailyRecord(date);
      setRecords(prev => prev.filter(r => r.date !== date));
      if (formDate === date) {
        resetFormClean(todayStr);
      }
      setSaveToast({
        message: `Data tanggal ${formatIndoDate(date)} berhasil dihapus.`,
        type: 'success',
      });
      setTimeout(() => setSaveToast(null), 3000);
    } catch (err) {
      console.error('Error deleting record:', err);
      alert('Gagal menghapus data dari database.');
    }
  };

  // Handler Kosongkan SEMUA Data (Fitur Uji Coba Pengguna)
  const handleClearAll = async () => {
    const confirmation = window.confirm(
      '⚠️ PERHATIAN: APAKAH ANDA YAKIN INGIN MENGOSONGKAN SELURUH DATA DASBOR MANUAL?\n\n' +
      '• Seluruh riwayat pengiriman manual di Supabase akan dihapus bersih ke 0.\n' +
      '• Anda bisa melakukan uji coba input data baru dari awal dan melihat hasilnya langsung.\n\n' +
      'Klik OK untuk mengosongkan sekarang.'
    );

    if (!confirmation) return;

    setIsClearing(true);
    try {
      await clearAllManualDailyRecords();
      setRecords([]);
      resetFormClean(todayStr);
      setSaveToast({
        message: '🗑️ Seluruh data rekapan manual berhasil dikosongkan bersih ke 0.',
        type: 'danger',
      });
      setTimeout(() => setSaveToast(null), 4000);
    } catch (err) {
      console.error('Error clearing manual records:', err);
      alert('Gagal mengosongkan data dari database Supabase.');
    } finally {
      setIsClearing(false);
    }
  };

  // Ekspor Data ke Excel (.xlsx)
  const handleExportExcel = () => {
    if (filteredRecords.length === 0) {
      alert('Tidak ada data dalam rentang tanggal ini untuk diekspor.');
      return;
    }

    const headers = [
      'Tanggal',
      'Total Pesan Terkirim',
      'Pesan Terbaca',
      'Pesan Terbalas',
      'Pesan Gagal',
      'Tingkat Terbaca (%)',
      'Tingkat Balasan (%)',
      'Kepatuhan Obat (%)',
      'Kategori Minum Obat',
      'Kategori Kontrol Dokter',
      'Kategori Iter Resep',
      'Kategori Edukasi',
      'Petugas',
      'Catatan',
    ];

    const rows = filteredRecords.map(r => [
      r.date,
      r.totalSent,
      r.read,
      r.replied,
      r.failed,
      r.readRate,
      r.replyRate,
      r.complianceRate,
      r.kategoriObat,
      r.kategoriKontrol,
      r.kategoriIter,
      r.kategoriEdukasi,
      r.petugas || '-',
      r.catatan || '-',
    ]);

    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);

    // Dynamic column widths for clean readability in Excel
    const colWidths = headers.map((h, i) => {
      const maxLen = Math.max(
        h.length,
        ...rows.map(r => (r[i] != null ? String(r[i]).length : 0))
      );
      return { wch: Math.min(Math.max(maxLen + 3, 12), 40) };
    });
    worksheet['!cols'] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Rekapan Manual SiDora');

    const fileName = `sidora_manual_${startDate}_sd_${endDate}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  // Scaling untuk SVG Bar Chart
  const maxSent = Math.max(...filteredRecords.map(r => r.totalSent), 0);
  const maxVolume = maxSent > 0 ? Math.max(Math.ceil(maxSent * 1.25), 5) : 10;

  const gridValues = useMemo(() => {
    if (maxVolume <= 10) return [0, 2, 5, 8, 10];
    if (maxVolume <= 25) return [0, 5, 10, 15, 20, 25];
    if (maxVolume <= 50) return [0, 10, 20, 30, 40, 50];
    const step = Math.ceil(maxVolume / 4);
    return [0, step, step * 2, step * 3, maxVolume];
  }, [maxVolume]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Toast Notification */}
      {saveToast && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 text-white ${
          saveToast.type === 'danger' ? 'bg-red-800 border border-red-600' : 'bg-emerald-800 border border-emerald-600'
        }`}>
          {saveToast.type === 'danger' ? (
            <Eraser className="w-5 h-5 text-red-300 shrink-0" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0" />
          )}
          <span className="text-sm font-semibold">{saveToast.message}</span>
        </div>
      )}

      {/* Top Banner Alert / Header Card */}
      <div className="bg-gradient-to-r from-teal-800 via-emerald-900 to-slate-900 text-white rounded-2xl p-5 sm:p-6 shadow-xs relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Dasbor Komunikasi &amp; Kepatuhan Pasien (Entri Manual)
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
              Pencatatan fleksibel untuk pesan WhatsApp yang dikirimkan secara manual. Anda dapat menentukan rentang tanggal tampilan serta mengosongkan data kapan saja untuk keperluan simulasi &amp; uji coba.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
            <button
              onClick={() => setIsFormOpen(!isFormOpen)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-white text-emerald-900 hover:bg-slate-100 shadow-xs transition-all"
            >
              <PlusCircle className="w-4 h-4 text-emerald-600" />
              {isFormOpen ? 'Tutup Form Isian' : '➕ Buka Form Isian'}
            </button>
            <button
              onClick={handleExportExcel}
              disabled={filteredRecords.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-700/60 hover:bg-emerald-700 text-emerald-100 border border-emerald-500/40 transition-all disabled:opacity-40"
              title="Ekspor data rekapan harian ke format Excel (.xlsx)"
            >
              <Download className="w-3.5 h-3.5" />
              Ekspor Excel (.xlsx)
            </button>
            <button
              onClick={handleClearAll}
              disabled={isClearing || records.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-red-950/70 hover:bg-red-800 text-red-200 border border-red-500/50 transition-all disabled:opacity-40"
              title="Kosongkan seluruh data rekapan di Supabase untuk mulai uji coba baru"
            >
              <Eraser className="w-3.5 h-3.5 text-red-300" />
              {isClearing ? 'Mengosongkan...' : 'Kosongkan Semua Data'}
            </button>
          </div>
        </div>
      </div>

      {/* FILTER RENTANG TANGGAL FLEKSIBEL (DARI TANGGAL S/D TANGGAL) */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Date Range Inputs */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
              <CalendarRange className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Fokus Rentang Tanggal:</span>
            </div>

            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 p-1.5 rounded-xl">
              <span className="text-[11px] font-semibold text-slate-500 pl-1">Dari:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="text-xs font-bold text-slate-800 bg-white border border-slate-300 rounded-lg px-2.5 py-1 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[11px] font-semibold text-slate-500">Sampai:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="text-xs font-bold text-slate-800 bg-white border border-slate-300 rounded-lg px-2.5 py-1 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Quick Preset Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-semibold text-slate-400 mr-1">Preset Cepat:</span>
            <button
              onClick={() => handlePresetRange('today')}
              className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition-all ${
                startDate === todayStr && endDate === todayStr
                  ? 'bg-emerald-600 text-white shadow-2xs font-bold'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              Hari Ini Saja
            </button>
            <button
              onClick={() => handlePresetRange('7days')}
              className="px-2.5 py-1 text-xs rounded-lg font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all"
            >
              7 Hari Terakhir
            </button>
            <button
              onClick={() => handlePresetRange('month')}
              className="px-2.5 py-1 text-xs rounded-lg font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all"
            >
              Bulan Ini
            </button>
            <button
              onClick={() => handlePresetRange('all')}
              className="px-2.5 py-1 text-xs rounded-lg font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all"
            >
              Semua Data ({records.length})
            </button>
          </div>
        </div>

        <div className="text-xs text-slate-500 flex items-center justify-between pt-2 border-t border-slate-100">
          <span className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${displayedMetrics.isEmpty ? 'bg-amber-500' : 'bg-emerald-500'}`} />
            <strong className="text-slate-700">{displayedMetrics.title}</strong>
          </span>
          <span className="text-[11px] text-slate-400">
            {displayedMetrics.periodLabel}
          </span>
        </div>
      </div>

      {/* KPI METRIC CARDS (INFO UTAMA) */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Total Terkirim */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Pesan Terkirim</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Send className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-bold text-slate-900">{displayedMetrics.totalSent}</div>
            <div className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              {displayedMetrics.totalSent > 0 ? 'Pesan Terkirim Riil' : 'Belum Ada Input'}
            </div>
          </div>
        </div>

        {/* Tingkat Terbaca (Read Rate) */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Tingkat Terbaca</span>
            <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <CheckCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-bold text-slate-900">{displayedMetrics.readRate}%</div>
            <div className="text-xs text-slate-500 mt-1">
              {displayedMetrics.read} dari {displayedMetrics.totalSent} pesan dibaca
            </div>
          </div>
        </div>

        {/* Tingkat Balasan (Reply Rate) */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Tingkat Balasan</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-bold text-slate-900">{displayedMetrics.replyRate}%</div>
            <div className="text-xs text-emerald-600 font-medium mt-1">
              {displayedMetrics.replied} respon pasien/keluarga
            </div>
          </div>
        </div>

        {/* Kepatuhan Minum Obat */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Kepatuhan Obat</span>
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <HeartPulse className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-bold text-teal-700">{displayedMetrics.complianceRate}%</div>
            <div className="text-xs text-slate-500 mt-1">
              Rata-rata kepatuhan terapi
            </div>
          </div>
        </div>

        {/* Gagal / Dialihkan */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Gagal / Dialihkan</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-bold text-amber-700">{displayedMetrics.failed}</div>
            <div className="text-xs text-slate-500 mt-1">
              {displayedMetrics.failed > 0 ? 'Dialihkan ke Caregiver / Telepon' : 'Nol kegagalan pesan'}
            </div>
          </div>
        </div>
      </div>

      {/* FORM ISIAN DATA MANUAL (COLLAPSIBLE / ACCORDION) */}
      {isFormOpen && (
        <div className="bg-white rounded-2xl border-2 border-emerald-600/30 p-5 sm:p-6 shadow-sm animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-5 border-b border-slate-200 gap-2">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                  ✍️
                </div>
                <h3 className="font-bold text-slate-900 text-base">
                  Formulir Entri Indikator Pengiriman Pesan Manual
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Pilih tanggal yang ingin diinput atau diedit, lalu isi data riil pengiriman pesan WhatsApp.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700">Tanggal Entri:</span>
              <input
                type="date"
                value={formDate}
                onChange={(e) => handleFormDateChange(e.target.value)}
                className="text-xs font-bold text-emerald-950 bg-emerald-50 border border-emerald-300 rounded-xl px-3 py-1.5 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
              {records.some(r => r.date === formDate) && (
                <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-800 rounded-full border border-amber-300">
                  Mode Edit
                </span>
              )}
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            {/* Bagian 1: Indikator Volume Pesan */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5 text-blue-600" />
                1. Indikator Volume &amp; Status Pesan WhatsApp
              </h4>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
                {/* Total Terkirim */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Total Terkirim
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={totalSent || ''}
                    placeholder="0"
                    onChange={(e) => setTotalSent(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full text-base font-bold bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Jumlah pesan keluar</span>
                </div>

                {/* Terbaca */}
                <div className="bg-sky-50/60 p-3 rounded-xl border border-sky-200">
                  <label className="block text-xs font-bold text-sky-900 mb-1">
                    Pesan Terbaca (Centang Biru)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={totalSent || undefined}
                    value={read || ''}
                    placeholder="0"
                    onChange={(e) => setRead(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full text-base font-bold bg-white border border-sky-300 rounded-lg px-2.5 py-1.5 text-sky-900 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                  />
                  <span className="text-[10px] text-sky-600 font-semibold mt-1 block">
                    Tingkat: {calcReadRate}%
                  </span>
                </div>

                {/* Terbalas */}
                <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-200">
                  <label className="block text-xs font-bold text-emerald-900 mb-1">
                    Pesan Dibalas / Respon
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={totalSent || undefined}
                    value={replied || ''}
                    placeholder="0"
                    onChange={(e) => setReplied(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full text-base font-bold bg-white border border-emerald-300 rounded-lg px-2.5 py-1.5 text-emerald-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="text-[10px] text-emerald-600 font-semibold mt-1 block">
                    Tingkat: {calcReplyRate}%
                  </span>
                </div>

                {/* Gagal / Dialihkan */}
                <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-200">
                  <label className="block text-xs font-bold text-amber-900 mb-1">
                    Pesan Gagal / Dialihkan
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={failed || ''}
                    placeholder="0"
                    onChange={(e) => setFailed(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full text-base font-bold bg-white border border-amber-300 rounded-lg px-2.5 py-1.5 text-amber-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                  <span className="text-[10px] text-amber-600 mt-1 block">Nomor salah / nonaktif</span>
                </div>

                {/* Kepatuhan Minum Obat */}
                <div className="bg-teal-50/60 p-3 rounded-xl border border-teal-200 col-span-2 sm:col-span-1">
                  <label className="block text-xs font-bold text-teal-900 mb-1">
                    Kepatuhan Obat (%)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={complianceRate || ''}
                      placeholder="0"
                      onChange={(e) => setComplianceRate(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                      className="w-full text-base font-bold bg-white border border-teal-300 rounded-lg px-2.5 py-1.5 text-teal-900 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                    />
                    <span className="text-xs font-bold text-teal-700">%</span>
                  </div>
                  <span className="text-[10px] text-teal-600 mt-1 block">Rata-rata kepatuhan</span>
                </div>
              </div>
            </div>

            {/* Bagian 2: Distribusi Kategori Pesan */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-purple-600" />
                  2. Rincian Kategori Pengingat yang Dikirimkan
                </h4>
                <span className="text-[11px] text-slate-400">
                  Total Rincian: {kategoriObat + kategoriKontrol + kategoriIter + kategoriEdukasi} pesan
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                {/* Minum Obat */}
                <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/60">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-blue-700 mb-1">
                    <Pill className="w-3.5 h-3.5" />
                    Jadwal Minum Obat
                  </div>
                  <input
                    type="number"
                    min="0"
                    value={kategoriObat || ''}
                    placeholder="0"
                    onChange={(e) => setKategoriObat(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full text-sm font-semibold bg-white border border-slate-300 rounded-lg px-2 py-1 text-slate-900"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Pagi / Siang / Malam</span>
                </div>

                {/* Kontrol Dokter */}
                <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/60">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-purple-700 mb-1">
                    <Calendar className="w-3.5 h-3.5" />
                    Kontrol Dokter
                  </div>
                  <input
                    type="number"
                    min="0"
                    value={kategoriKontrol || ''}
                    placeholder="0"
                    onChange={(e) => setKategoriKontrol(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full text-sm font-semibold bg-white border border-slate-300 rounded-lg px-2 py-1 text-slate-900"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">H-3 / H-1 / Hari H</span>
                </div>

                {/* Iter Resep */}
                <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/60">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-teal-700 mb-1">
                    <RefreshCw className="w-3.5 h-3.5" />
                    Iterasi Resep
                  </div>
                  <input
                    type="number"
                    min="0"
                    value={kategoriIter || ''}
                    placeholder="0"
                    onChange={(e) => setKategoriIter(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full text-sm font-semibold bg-white border border-slate-300 rounded-lg px-2 py-1 text-slate-900"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Tebus obat farmasi</span>
                </div>

                {/* Edukasi Psikiatri */}
                <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/60">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 mb-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    Psikoedukasi
                  </div>
                  <input
                    type="number"
                    min="0"
                    value={kategoriEdukasi || ''}
                    placeholder="0"
                    onChange={(e) => setKategoriEdukasi(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full text-sm font-semibold bg-white border border-slate-300 rounded-lg px-2 py-1 text-slate-900"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Dukungan keluarga</span>
                </div>
              </div>
            </div>

            {/* Bagian 3: Identitas Petugas & Catatan Tambahan */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Petugas Input / Penanggung Jawab
                </label>
                <input
                  type="text"
                  value={petugas}
                  onChange={(e) => setPetugas(e.target.value)}
                  placeholder="Misal: Ns. Nofy / Petugas Farmasi"
                  className="w-full text-xs font-medium bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Catatan / Keterangan Pelaksanaan
                </label>
                <input
                  type="text"
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  placeholder="Misal: Pengiriman sesi pagi via WhatsApp manual lancar"
                  className="w-full text-xs font-medium bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Tombol Simpan & Bersihkan Form */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => resetFormClean(formDate)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              >
                Reset Nilai Form ke 0
              </button>

              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-xs transition-all disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'Menyimpan ke Cloud Supabase...' : `Simpan Data Tanggal ${formatIndoDate(formDate)}`}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* VISUAL CHARTS & CATEGORY DISTRIBUTION ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart: Tren Pengiriman Manual */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-base">
                  Tren Pengiriman &amp; Respon Manual ({filteredRecords.length} Hari dalam Rentang)
                </h3>
              </div>
              <p className="text-xs text-slate-500">
                Grafik visual entri data yang tersimpan di Supabase sesuai rentang tanggal yang dipilih
              </p>
            </div>

            {/* Filter Metrik Chart */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
              <button
                onClick={() => setSelectedChartMetric('all')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  selectedChartMetric === 'all' ? 'bg-white shadow-xs text-slate-900 font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Semua
              </button>
              <button
                onClick={() => setSelectedChartMetric('read')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  selectedChartMetric === 'read' ? 'bg-sky-600 text-white font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Terbaca
              </button>
              <button
                onClick={() => setSelectedChartMetric('replied')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  selectedChartMetric === 'replied' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Terbalas
              </button>
              <button
                onClick={() => setSelectedChartMetric('compliance')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  selectedChartMetric === 'compliance' ? 'bg-teal-600 text-white font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Kepatuhan %
              </button>
            </div>
          </div>

          {/* SVG Bar Chart Responsif */}
          {filteredRecords.length === 0 ? (
            <div className="h-64 w-full flex flex-col items-center justify-center text-center p-6 bg-slate-50/70 border border-dashed border-slate-200 rounded-xl">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-700">Belum Ada Data untuk Ditampilkan</h4>
              <p className="text-xs text-slate-500 max-w-md mt-1">
                Tidak ada data pengiriman manual pada rentang tanggal {formatIndoDate(startDate)} s/d {formatIndoDate(endDate)}. Silakan gunakan formulir isian di atas untuk memasukkan data baru.
              </p>
            </div>
          ) : (
            <div className="h-64 w-full relative">
              <svg viewBox="0 0 700 220" className="w-full h-full overflow-visible">
                <defs>
                  <linearGradient id="manualBarSentGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#60a5fa" stopOpacity="0.4" />
                  </linearGradient>
                  <linearGradient id="manualBarRepliedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="1" />
                    <stop offset="100%" stopColor="#34d399" stopOpacity="0.7" />
                  </linearGradient>
                </defs>

                {/* Grid Lines */}
                {gridValues.map((val) => {
                  const y = 200 - (val / maxVolume) * 170;
                  return (
                    <g key={val}>
                      <line x1="40" y1={y} x2="680" y2={y} stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
                      <text x="32" y={y + 3} textAnchor="end" className="text-[10px] fill-slate-400 font-sans">
                        {val}
                      </text>
                    </g>
                  );
                })}

                {/* Bars per Date */}
                {filteredRecords.map((item, idx) => {
                  const barSpacing = Math.min(88, 600 / Math.max(filteredRecords.length, 1));
                  const x = 70 + idx * barSpacing;
                  const barWidth = 24;
                  const sentH = (item.totalSent / maxVolume) * 170;
                  const readH = (item.read / maxVolume) * 170;
                  const repliedH = (item.replied / maxVolume) * 170;
                  const complianceH = (item.complianceRate / 100) * 170;

                  return (
                    <g 
                      key={item.date} 
                      className="cursor-pointer group"
                      onClick={() => {
                        populateForm(item);
                        setIsFormOpen(true);
                      }}
                    >
                      {/* Hover Guide */}
                      <rect 
                        x={x - 20} 
                        y="20" 
                        width="64" 
                        height="180" 
                        fill="transparent"
                        className="group-hover:fill-slate-50 transition-colors" 
                        rx="8" 
                      />

                      {/* Total Sent Bar */}
                      {selectedChartMetric !== 'compliance' && sentH > 0 && (
                        <rect
                          x={x - 12}
                          y={200 - sentH}
                          width={barWidth}
                          height={sentH}
                          rx="4"
                          fill="url(#manualBarSentGrad)"
                          className="transition-all duration-300 group-hover:opacity-90"
                        />
                      )}

                      {/* Read Bar */}
                      {selectedChartMetric !== 'compliance' && selectedChartMetric !== 'replied' && readH > 0 && (
                        <rect
                          x={x - 6}
                          y={200 - readH}
                          width="12"
                          height={readH}
                          rx="3"
                          fill="#0284c7"
                          opacity="0.85"
                        />
                      )}

                      {/* Replied Bar */}
                      {selectedChartMetric !== 'compliance' && (selectedChartMetric === 'all' || selectedChartMetric === 'replied') && repliedH > 0 && (
                        <rect
                          x={x + 2}
                          y={200 - repliedH}
                          width="10"
                          height={repliedH}
                          rx="3"
                          fill="url(#manualBarRepliedGrad)"
                        />
                      )}

                      {/* Compliance Metric Bar */}
                      {selectedChartMetric === 'compliance' && (
                        <rect
                          x={x - 10}
                          y={200 - complianceH}
                          width="20"
                          height={complianceH}
                          rx="4"
                          fill="#0d9488"
                          opacity="0.9"
                        />
                      )}

                      {/* Value Badge on Hover */}
                      <text
                        x={x}
                        y={sentH > 0 ? 200 - sentH - 8 : 190}
                        textAnchor="middle"
                        className="text-[11px] font-bold fill-slate-700 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        {selectedChartMetric === 'compliance' ? `${item.complianceRate}%` : item.totalSent}
                      </text>

                      {/* Date Label (Short DD/MM) */}
                      <text
                        x={x}
                        y="218"
                        textAnchor="middle"
                        className="text-[10px] font-medium fill-slate-500"
                      >
                        {item.date.slice(5)}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          )}

          {/* Legend */}
          <div className="flex flex-wrap items-center justify-center gap-6 mt-4 pt-3 border-t border-slate-100 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-sm bg-blue-500" />
              <span>Total Pesan Terkirim</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-sm bg-sky-600" />
              <span>Terbaca (Centang Biru)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-sm bg-emerald-500" />
              <span>Balasan / Respon Pasien</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-sm bg-teal-600" />
              <span>Kepatuhan Obat (%)</span>
            </div>
          </div>
        </div>

        {/* Distribusi Kategori Pesan */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 text-base">Distribusi Kategori Pesan</h3>
              <span className="text-xs text-slate-400 font-mono">Entri Manual</span>
            </div>

            <div className="space-y-4">
              {/* Minum Obat */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                    <Pill className="w-3.5 h-3.5 text-blue-600" />
                    Jadwal Minum Obat Harian
                  </span>
                  <span className="font-bold text-slate-900">
                    {displayedMetrics.kategoriObat}{' '}
                    <span className="text-slate-400 font-normal">
                      ({Math.round((displayedMetrics.kategoriObat / displayedMetrics.totalKategori) * 100)}%)
                    </span>
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 rounded-full transition-all" 
                    style={{ width: `${(displayedMetrics.kategoriObat / displayedMetrics.totalKategori) * 100}%` }} 
                  />
                </div>
              </div>

              {/* Kontrol Dokter */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                    <Calendar className="w-3.5 h-3.5 text-purple-600" />
                    Kontrol Dokter (H-3/H-1/H-0)
                  </span>
                  <span className="font-bold text-slate-900">
                    {displayedMetrics.kategoriKontrol}{' '}
                    <span className="text-slate-400 font-normal">
                      ({Math.round((displayedMetrics.kategoriKontrol / displayedMetrics.totalKategori) * 100)}%)
                    </span>
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-purple-500 rounded-full transition-all" 
                    style={{ width: `${(displayedMetrics.kategoriKontrol / displayedMetrics.totalKategori) * 100}%` }} 
                  />
                </div>
              </div>

              {/* Iterasi Resep */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                    <RefreshCw className="w-3.5 h-3.5 text-teal-600" />
                    Jadwal Iter
                  </span>
                  <span className="font-bold text-slate-900">
                    {displayedMetrics.kategoriIter}{' '}
                    <span className="text-slate-400 font-normal">
                      ({Math.round((displayedMetrics.kategoriIter / displayedMetrics.totalKategori) * 100)}%)
                    </span>
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-teal-500 rounded-full transition-all" 
                    style={{ width: `${(displayedMetrics.kategoriIter / displayedMetrics.totalKategori) * 100}%` }} 
                  />
                </div>
              </div>

              {/* Edukasi */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    Psikoedukasi &amp; Dukungan
                  </span>
                  <span className="font-bold text-slate-900">
                    {displayedMetrics.kategoriEdukasi}{' '}
                    <span className="text-slate-400 font-normal">
                      ({Math.round((displayedMetrics.kategoriEdukasi / displayedMetrics.totalKategori) * 100)}%)
                    </span>
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-amber-500 rounded-full transition-all" 
                    style={{ width: `${(displayedMetrics.kategoriEdukasi / displayedMetrics.totalKategori) * 100}%` }} 
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Info Box */}
          <div className="mt-6 pt-4 border-t border-slate-100 bg-slate-50/80 rounded-xl p-3 text-xs text-slate-600 space-y-1">
            <div className="font-semibold text-slate-800 flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-emerald-600" />
              Status Sinkronisasi Supabase:
            </div>
            <p className="text-[11px] text-slate-500">
              {displayedMetrics.isEmpty 
                ? 'Belum ada data rekapan manual di database untuk rentang tanggal ini.'
                : `${filteredRecords.length} hari rekapan aktif dimuat langsung dari cloud Supabase.`}
            </p>
          </div>
        </div>
      </div>

      {/* TABEL LOG RIWAYAT ENTRI MANUAL */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-bold text-slate-900 text-base">
              Riwayat Data Entri Pengiriman Manual Harian
            </h3>
            <p className="text-xs text-slate-500">
              Daftar rekapitulasi data yang tersimpan di Supabase dalam rentang {formatIndoDate(startDate)} s/d {formatIndoDate(endDate)}.
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
            {filteredRecords.length} Hari Tercatat
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
              <tr>
                <th className="py-3 px-4">Tanggal</th>
                <th className="py-3 px-3 text-center">Terkirim</th>
                <th className="py-3 px-3 text-center">Terbaca (%)</th>
                <th className="py-3 px-3 text-center">Balasan (%)</th>
                <th className="py-3 px-3 text-center">Kepatuhan</th>
                <th className="py-3 px-3 text-center">Gagal</th>
                <th className="py-3 px-4">Petugas &amp; Catatan</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400">
                    <p className="font-semibold text-slate-600">Tidak ada data rekapan manual pada rentang tanggal ini.</p>
                    <p className="text-[11px] text-slate-400 mt-1">Silakan gunakan formulir isian di atas untuk menambahkan data baru.</p>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r) => (
                  <tr 
                    key={r.date} 
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap">
                      {formatIndoDate(r.date)}
                      {r.date === todayStr && (
                        <span className="ml-2 px-1.5 py-0.5 text-[9px] font-bold bg-emerald-100 text-emerald-800 rounded">
                          Hari Ini
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-blue-700">
                      {r.totalSent}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="font-semibold text-sky-700">{r.read}</span>
                      <span className="text-slate-400 text-[10px] ml-1">({r.readRate}%)</span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="font-semibold text-emerald-700">{r.replied}</span>
                      <span className="text-slate-400 text-[10px] ml-1">({r.replyRate}%)</span>
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-teal-700">
                      {r.complianceRate}%
                    </td>
                    <td className="py-3 px-3 text-center">
                      {r.failed > 0 ? (
                        <span className="px-1.5 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-800 rounded">
                          {r.failed}
                        </span>
                      ) : (
                        <span className="text-slate-300">0</span>
                      )}
                    </td>
                    <td className="py-3 px-4 max-w-xs truncate">
                      <div className="font-medium text-slate-800 truncate">{r.petugas || '-'}</div>
                      <div className="text-[11px] text-slate-400 truncate">{r.catatan || '-'}</div>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            populateForm(r);
                            setIsFormOpen(true);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                          title="Edit data ini di form"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(r.date)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Hapus data tanggal ini dari Supabase"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
