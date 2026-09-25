import { useState, useMemo } from 'react';
import { 
  Send, 
  CheckCheck, 
  MessageSquare, 
  AlertTriangle, 
  Pill, 
  Calendar, 
  RefreshCw, 
  ChevronRight, 
  TrendingUp, 
  Sparkles,
  HeartPulse,
  Clock,
  UserCheck,
  Activity,
  BarChart3
} from 'lucide-react';
import { WhatsAppMessage, Patient, DailyAnalytics } from '../types';
import { NavTab } from './Navbar';
import { computeRealDailyAnalytics, getTodayDateStr, formatIndoDate } from '../utils/analyticsHelper';

interface DashboardOverviewProps {
  messages: WhatsAppMessage[];
  patients: Patient[];
  analytics?: DailyAnalytics[];
  onNavigate: (tab: NavTab) => void;
  onOpenSimulatorForPatient?: (patientId: string) => void;
  onTriggerAutoSend: () => void;
}

export const DashboardOverview = ({
  messages,
  patients,
  onNavigate,
  onOpenSimulatorForPatient,
  onTriggerAutoSend,
}: DashboardOverviewProps) => {
  const [selectedChartMetric, setSelectedChartMetric] = useState<'all' | 'delivered' | 'read' | 'replied'>('all');

  const todayStr = getTodayDateStr();

  // 1. KPI Calculations from Live Messages
  const totalSent = messages.filter(m => m.status !== 'queued').length;
  const totalDelivered = messages.filter(m => ['delivered', 'read', 'replied'].includes(m.status)).length;
  const totalRead = messages.filter(m => ['read', 'replied'].includes(m.status)).length;
  const totalReplied = messages.filter(m => m.status === 'replied').length;
  const totalFailed = messages.filter(m => m.status === 'failed').length;

  const readRate = totalSent > 0 ? Math.round((totalRead / totalSent) * 100) : 0;
  const replyRate = totalSent > 0 ? Math.round((totalReplied / totalSent) * 100) : 0;

  // 2. Average medication compliance across real patients
  const avgCompliance = patients.length > 0
    ? Math.round(patients.reduce((acc, p) => acc + (p.kepatuhanMinumObatPersen || 0), 0) / patients.length)
    : 0;

  // 3. Category distribution counts from Live Messages
  const countObat = messages.filter(m => m.category === 'minum_obat').length;
  const countKontrol = messages.filter(m => m.category === 'kontrol_dokter').length;
  const countIter = messages.filter(m => m.category === 'iter_resep').length;
  const countEdukasi = messages.filter(m => m.category === 'edukasi_rsj').length;
  const totalCategory = countObat + countKontrol + countIter + countEdukasi || 1;

  // 4. Real-time dynamic 7-day analytics computed strictly from live messages
  const chartAnalytics = useMemo(() => {
    return computeRealDailyAnalytics(messages, todayStr);
  }, [messages, todayStr]);

  // 5. Patients due today
  const patientsDueToday = useMemo(() => {
    return patients.filter(p => {
      const isKontrolToday = p.jadwalKontrol?.tanggal === todayStr;
      const isIterToday = Boolean(p.jadwalIter?.adaIter && p.jadwalIter?.tanggalIter === todayStr);
      return isKontrolToday || isIterToday;
    });
  }, [patients, todayStr]);

  // 6. Upcoming patients (next closest schedules in the coming days)
  const upcomingPatients = useMemo(() => {
    return patients.filter(p => {
      const kDate = p.jadwalKontrol?.tanggal || '';
      const iDate = (p.jadwalIter?.adaIter && p.jadwalIter?.tanggalIter) || '';
      return (kDate > todayStr) || (iDate > todayStr);
    }).sort((a, b) => {
      const dateA = a.jadwalKontrol?.tanggal || a.jadwalIter?.tanggalIter || '';
      const dateB = b.jadwalKontrol?.tanggal || b.jadwalIter?.tanggalIter || '';
      return dateA.localeCompare(dateB);
    }).slice(0, 5);
  }, [patients, todayStr]);

  // 7. Recent patient/caregiver replies
  const recentReplies = messages
    .filter(m => m.status === 'replied' && m.replyText)
    .slice(0, 5);

  // 8. Dynamic scaling for SVG bar chart
  const maxSent = Math.max(...chartAnalytics.map(a => a.totalSent), 0);
  const maxVolume = maxSent > 0 ? Math.max(Math.ceil(maxSent * 1.25), 5) : 10;

  const gridValues = useMemo(() => {
    if (maxVolume <= 5) return [0, 2, 4, 5];
    if (maxVolume <= 10) return [0, 3, 6, 10];
    if (maxVolume <= 25) return [0, 5, 10, 15, 20, 25];
    if (maxVolume <= 50) return [0, 10, 20, 30, 40, 50];
    const step = Math.ceil(maxVolume / 4);
    return [0, step, step * 2, step * 3, maxVolume];
  }, [maxVolume]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Banner Alert / Header Card */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 text-white rounded-2xl p-5 sm:p-6 shadow-xs relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white to-transparent pointer-events-none" />
        <div className="relative z-10 space-y-1">
          <h2 className="text-lg sm:text-2xl font-bold tracking-tight text-white">
            Dasbor Komunikasi &amp; Kepatuhan Pasien Rawat Jalan
          </h2>
          <p className="text-xs sm:text-sm text-slate-300">
            Pemantauan kepatuhan minum obat harian dan jadwal kontrol dokter.
          </p>
        </div>
      </div>

      {/* KPI Metric Cards */}
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
            <div className="text-2xl sm:text-3xl font-bold text-slate-900">{totalSent}</div>
            <div className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              {totalSent > 0 ? '100% via Gateway' : 'Siap Kirim via Gateway'}
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
            <div className="text-2xl sm:text-3xl font-bold text-slate-900">{readRate}%</div>
            <div className="text-xs text-slate-500 mt-1">
              {totalSent > 0 ? `${totalRead} dari ${totalSent} pesan dibaca` : '0 pesan dibaca'}
            </div>
          </div>
        </div>

        {/* Tingkat Respon (Replied) */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Tingkat Balasan</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-bold text-slate-900">{replyRate}%</div>
            <div className="text-xs text-emerald-600 font-medium mt-1">
              {totalReplied} konfirmasi masuk
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
            <div className="text-2xl sm:text-3xl font-bold text-teal-700">{avgCompliance}%</div>
            <div className="text-xs text-slate-500 mt-1">
              {patients.length > 0 ? `Rata-rata ${patients.length} pasien aktif` : 'Belum ada data pasien'}
            </div>
          </div>
        </div>

        {/* Gagal / Perlu Tindak Lanjut */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Gagal / Dialihkan</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-bold text-amber-700">{totalFailed}</div>
            <div className="text-xs text-slate-500 mt-1">
              {totalFailed > 0 ? 'Dialihkan ke Caregiver' : 'Semua pesan sukses'}
            </div>
          </div>
        </div>
      </div>

      {/* Visual Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart: 7-Day Messaging Trends */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-base">Tren Pengiriman &amp; Respon Pasien (7 Hari)</h3>
              </div>
              <p className="text-xs text-slate-500">
                Data real-time dihitung dari seluruh log pesan terkirim, centang biru (terbaca), dan konfirmasi balasan pasien
              </p>
            </div>
            
            {/* Filter buttons */}
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
            </div>
          </div>

          {/* SVG Bar & Curve Chart */}
          <div className="h-64 w-full relative">
            <svg viewBox="0 0 700 220" className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="barSentGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#60a5fa" stopOpacity="0.4" />
                </linearGradient>
                <linearGradient id="barRepliedGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="1" />
                  <stop offset="100%" stopColor="#34d399" stopOpacity="0.7" />
                </linearGradient>
              </defs>

              {/* Dynamic Grid Lines based on live volume */}
              {gridValues.map((val) => {
                const y = 200 - (val / maxVolume) * 170;
                return (
                  <g key={val}>
                    <line x1="40" y1={y} x2="680" y2={y} stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
                    <text x="32" y={y + 3} textAnchor="end" className="text-[10px] fill-slate-400 font-sans">{val}</text>
                  </g>
                );
              })}

              {/* Bars for each day (strictly computed from real messages) */}
              {chartAnalytics.map((item, idx) => {
                const x = 70 + idx * 88;
                const barWidth = 24;
                const sentH = (item.totalSent / maxVolume) * 170;
                const readH = (item.read / maxVolume) * 170;
                const repliedH = (item.replied / maxVolume) * 170;

                return (
                  <g key={item.date} className="cursor-pointer group">
                    {/* Background hover guide */}
                    <rect x={x - 20} y="20" width="64" height="180" fill="transparent" className="group-hover:fill-slate-50 transition-colors" rx="8" />

                    {/* Total Sent Bar */}
                    {sentH > 0 ? (
                      <rect
                        x={x - 12}
                        y={200 - sentH}
                        width={barWidth}
                        height={sentH}
                        rx="4"
                        fill="url(#barSentGrad)"
                        className="transition-all duration-300 group-hover:opacity-90"
                      />
                    ) : (
                      /* Zero baseline dot */
                      <circle cx={x} cy={198} r="2" fill="#cbd5e1" opacity="0.6" />
                    )}

                    {/* Read Bar */}
                    {selectedChartMetric !== 'replied' && readH > 0 && (
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
                    {(selectedChartMetric === 'all' || selectedChartMetric === 'replied') && repliedH > 0 && (
                      <rect
                        x={x + 2}
                        y={200 - repliedH}
                        width="10"
                        height={repliedH}
                        rx="3"
                        fill="url(#barRepliedGrad)"
                      />
                    )}

                    {/* Tooltip value on hover */}
                    <text
                      x={x}
                      y={sentH > 0 ? 200 - sentH - 8 : 190}
                      textAnchor="middle"
                      className="text-[11px] font-bold fill-slate-700 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      {item.totalSent}
                    </text>

                    {/* Day label */}
                    <text
                      x={x}
                      y="218"
                      textAnchor="middle"
                      className="text-[11px] fill-slate-500 font-medium"
                    >
                      {item.date}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Real-time Indicator banner when totalSent is 0 */}
          {totalSent === 0 && (
            <div className="mt-3 py-2.5 px-3 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-slate-500">
              <span className="flex items-center gap-1.5 font-medium text-slate-700">
                <Activity className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                Grafik Real-Time Aktif (Belum Ada Log Pesan)
              </span>
              <span className="text-[11px] text-slate-500">
                Kirim pesan uji coba via Simulator atau klik tombol hijau <strong>"Demo: Kirim Jam 06:00 Sekarang"</strong> di atas.
              </span>
            </div>
          )}

          {/* Legend */}
          <div className="flex flex-wrap items-center justify-center gap-6 mt-4 pt-3 border-t border-slate-100 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-sm bg-blue-500" />
              <span>Total Terkirim</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-sm bg-sky-600" />
              <span>Pesan Terbaca (Centang Biru)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-sm bg-emerald-500" />
              <span>Balasan / Konfirmasi Pasien</span>
            </div>
          </div>
        </div>

        {/* Kategori Pengingat & Corong Status WA */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 text-base">Distribusi Kategori Pesan</h3>
              <span className="text-xs text-slate-400 font-mono">Real-Time</span>
            </div>

            {/* Category Breakdown Bars */}
            <div className="space-y-3.5">
              {/* Minum Obat */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                    <Pill className="w-3.5 h-3.5 text-blue-600" />
                    Jadwal Minum Obat Harian
                  </span>
                  <span className="font-bold text-slate-900">
                    {countObat} <span className="text-slate-400 font-normal">({totalSent > 0 ? Math.round((countObat/totalCategory)*100) : 0}%)</span>
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${totalSent > 0 ? (countObat/totalCategory)*100 : 0}%` }} />
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
                    {countKontrol} <span className="text-slate-400 font-normal">({totalSent > 0 ? Math.round((countKontrol/totalCategory)*100) : 0}%)</span>
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500 rounded-full transition-all" style={{ width: `${totalSent > 0 ? (countKontrol/totalCategory)*100 : 0}%` }} />
                </div>
              </div>

              {/* Iterasi Resep */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                    <RefreshCw className="w-3.5 h-3.5 text-teal-600" />
                    Iterasi Resep Farmasi
                  </span>
                  <span className="font-bold text-slate-900">
                    {countIter} <span className="text-slate-400 font-normal">({totalSent > 0 ? Math.round((countIter/totalCategory)*100) : 0}%)</span>
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-teal-500 rounded-full transition-all" style={{ width: `${totalSent > 0 ? (countIter/totalCategory)*100 : 0}%` }} />
                </div>
              </div>

              {/* Edukasi & Dukungan */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    Edukasi &amp; Psikoedukasi
                  </span>
                  <span className="font-bold text-slate-900">
                    {countEdukasi} <span className="text-slate-400 font-normal">({totalSent > 0 ? Math.round((countEdukasi/totalCategory)*100) : 0}%)</span>
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full transition-all" style={{ width: `${totalSent > 0 ? (countEdukasi/totalCategory)*100 : 0}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* WA Delivery Pipeline */}
          <div className="mt-6 pt-4 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5">
              Corong Status Pesan WhatsApp
            </h4>
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                <div className="text-xs text-slate-400 font-semibold">Terkirim</div>
                <div className="text-sm font-bold text-slate-800">{totalSent}</div>
              </div>
              <div className="bg-blue-50/60 p-2 rounded-xl border border-blue-100">
                <div className="text-xs text-blue-600 font-semibold">Diterima</div>
                <div className="text-sm font-bold text-blue-900">{totalDelivered}</div>
              </div>
              <div className="bg-sky-50/60 p-2 rounded-xl border border-sky-100">
                <div className="text-xs text-sky-600 font-semibold">Dibaca</div>
                <div className="text-sm font-bold text-sky-900">{totalRead}</div>
              </div>
              <div className="bg-emerald-50/60 p-2 rounded-xl border border-emerald-100">
                <div className="text-xs text-emerald-600 font-semibold">Terbalas</div>
                <div className="text-sm font-bold text-emerald-900">{totalReplied}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row: Jadwal Perhatian Hari Ini & Balasan Pasien Terkini */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Jadwal Perhatian Hari Ini */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-600" />
                Jadwal Perhatian Hari Ini ({formatIndoDate(todayStr)})
              </h3>
              <p className="text-xs text-slate-500">
                {patientsDueToday.length > 0 
                  ? 'Pasien yang terjadwal kontrol hari ini atau pengambilan obat iterasi farmasi'
                  : 'Monitoring jadwal kontrol rawat jalan dan iterasi resep farmasi'}
              </p>
            </div>
            <button
              onClick={() => onNavigate('otomasi')}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
            >
              Setting &amp; Jadwal Otomatis <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {patients.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs space-y-3 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                <Calendar className="w-8 h-8 text-slate-300 mx-auto" />
                <div className="space-y-1">
                  <p className="font-bold text-slate-700 text-sm">Belum Ada Pasien Terdaftar di Database</p>
                  <p className="text-slate-500 max-w-sm mx-auto text-[11px]">
                    Tambahkan profil pasien rawat jalan baru untuk mulai menjadwalkan notifikasi kontrol dan obat otomatis.
                  </p>
                </div>
                <button
                  onClick={() => onNavigate('pasien')}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white inline-flex items-center gap-1.5 shadow-sm transition-all"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  Buka Menu Data Pasien
                </button>
              </div>
            ) : patientsDueToday.length === 0 ? (
              <div className="space-y-3">
                <div className="p-4 text-center text-slate-600 text-xs bg-emerald-50/50 rounded-xl border border-emerald-100 flex items-center justify-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  <span>Tidak ada jadwal kontrol atau iterasi obat yang jatuh tepat hari ini (<strong>{formatIndoDate(todayStr)}</strong>).</span>
                </div>

                {upcomingPatients.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-slate-400" />
                      Jadwal Pasien Mendatang Terdekat:
                    </div>
                    {upcomingPatients.map((patient) => {
                      const isKontrolUpcoming = patient.jadwalKontrol?.tanggal > todayStr;
                      const isIterUpcoming = Boolean(patient.jadwalIter?.adaIter && patient.jadwalIter?.tanggalIter > todayStr);

                      return (
                        <div
                          key={patient.id}
                          className="p-3.5 rounded-xl border border-slate-200 hover:border-emerald-300 bg-slate-50/50 hover:bg-emerald-50/30 transition-all flex items-center justify-between gap-3"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 text-sm">{patient.nama}</span>
                              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-200/80 text-slate-700">
                                {patient.noRM}
                              </span>
                              {patient.riskLevel === 'rawan_putus_obat' && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-100 text-red-800 border border-red-200">
                                  Rawan Putus Obat
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-600 flex flex-wrap items-center gap-x-3 gap-y-1">
                              {isKontrolUpcoming && (
                                <span className="text-purple-700 font-medium flex items-center gap-1">
                                  <Calendar className="w-3 h-3 text-purple-500" />
                                  Kontrol: {formatIndoDate(patient.jadwalKontrol.tanggal)} ({patient.jadwalKontrol.jam} WIB)
                                </span>
                              )}
                              {isIterUpcoming && (
                                <span className="text-teal-700 font-medium flex items-center gap-1">
                                  <RefreshCw className="w-3 h-3 text-teal-500" />
                                  Iter: {formatIndoDate(patient.jadwalIter.tanggalIter)} (Sisa {patient.jadwalIter.sisaIterasi}x)
                                </span>
                              )}
                            </div>
                          </div>

                          <button
                            onClick={() => onOpenSimulatorForPatient && onOpenSimulatorForPatient(patient.id)}
                            className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs flex items-center gap-1"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            Kirim WA
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              patientsDueToday.map((patient) => (
                <div
                  key={patient.id}
                  className="p-3.5 rounded-xl border border-slate-200 hover:border-emerald-300 bg-slate-50/50 hover:bg-emerald-50/30 transition-all flex items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{patient.nama}</span>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-200/80 text-slate-700">
                        {patient.noRM}
                      </span>
                      {patient.riskLevel === 'rawan_putus_obat' && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-100 text-red-800 border border-red-200">
                          Rawan Putus Obat
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-600 flex flex-wrap items-center gap-x-3 gap-y-1">
                      {patient.jadwalKontrol.tanggal === todayStr && (
                        <span className="text-purple-700 font-semibold flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Kontrol Hari H ({patient.jadwalKontrol.jam} WIB) - {patient.dokterDPJP}
                        </span>
                      )}
                      {patient.jadwalIter.adaIter && patient.jadwalIter.tanggalIter === todayStr && (
                        <span className="text-teal-700 font-semibold flex items-center gap-1">
                          <RefreshCw className="w-3 h-3" />
                          Iter Resep Hari Ini (Sisa {patient.jadwalIter.sisaIterasi}x)
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => onOpenSimulatorForPatient && onOpenSimulatorForPatient(patient.id)}
                    className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs flex items-center gap-1"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    Kirim WA
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Respon & Konfirmasi Masuk Terkini */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-emerald-600" />
                Respon Balasan Pasien / Caregiver
              </h3>
              <p className="text-xs text-slate-500">Konfirmasi minum obat, kehadiran kontrol, atau konsultasi cepat</p>
            </div>
            <button
              onClick={() => onNavigate('simulator')}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
            >
              Buka WA Simulator <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {recentReplies.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs flex flex-col items-center justify-center space-y-2 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                <MessageSquare className="w-7 h-7 text-slate-300" />
                <p className="font-semibold text-slate-600">Belum Ada Respon / Balasan Masuk</p>
                <p className="text-[11px] text-slate-400 max-w-xs">
                  Riwayat konfirmasi minum obat dan balasan dari WhatsApp pasien/caregiver akan muncul di sini secara real-time.
                </p>
              </div>
            ) : (
              recentReplies.map((msg) => (
                <div
                  key={msg.id}
                  className="p-3.5 rounded-xl border border-emerald-100 bg-emerald-50/40 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-xs">{msg.patientName}</span>
                      <span className="text-[10px] text-slate-500">
                        via {msg.recipientName} ({msg.recipientType})
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {msg.repliedAt?.slice(11, 16)} WIB
                    </span>
                  </div>
                  
                  <div className="text-xs bg-white p-2.5 rounded-lg border border-emerald-200 text-slate-800 font-medium">
                    💬 &quot;{msg.replyText}&quot;
                  </div>
                  
                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5">
                    <span className="capitalize text-emerald-700 font-semibold">
                      Re: {msg.title}
                    </span>
                    <span>{msg.bspProvider}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
