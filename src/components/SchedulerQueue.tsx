import { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  Send, 
  Pill, 
  RefreshCw, 
  CheckCircle2, 
  Sparkles, 
  Play, 
  UserCheck,
  HelpCircle
} from 'lucide-react';
import { Patient, MessageTemplate, WhatsAppMessage, ReminderCategory } from '../types';
import { generatePersonalizedMessage, formatIndonesianDate } from '../utils/messageGenerator';

interface SchedulerQueueProps {
  patients: Patient[];
  templates: MessageTemplate[];
  onDispatchQueue: (newMessages: WhatsAppMessage[]) => void;
  onOpenIterModal: () => void;
}

export interface QueueItem {
  id: string;
  patient: Patient;
  category: ReminderCategory;
  timingLabel: string; // misal: "Obat Pagi", "Kontrol H-3", "Iter Resep Farmasi"
  scheduledTime: string;
  template: MessageTemplate;
  recipientName: string;
  recipientPhone: string;
  recipientType: 'Pasien' | 'Caregiver';
  messageBody: string;
  status: 'ready' | 'sent';
}

export const SchedulerQueue = ({
  patients,
  templates,
  onDispatchQueue,
  onOpenIterModal,
}: SchedulerQueueProps) => {
  const [selectedFilter, setSelectedFilter] = useState<'all' | ReminderCategory>('all');
  const [isProcessing, setIsProcessing] = useState(false);
  const [dispatchedCount, setDispatchedCount] = useState<number | null>(null);

  // Auto-build the queue for today based on patient profiles
  // Today is treated as 2026-09-22
  const buildQueue = (): QueueItem[] => {
    const items: QueueItem[] = [];

    patients.forEach((patient) => {
      // 1. Check Minum Obat Pagi
      const tmplObatPagi = templates.find(t => t.kode === 'OBAT_PAGI') || templates[0];
      const hasMorningMeds = patient.obatRutin.some(m => m.waktuMinum.includes('pagi'));
      if (hasMorningMeds) {
        const isCaregiver = patient.caregiver.targetPenerima !== 'pasien';
        const msg = generatePersonalizedMessage(tmplObatPagi, patient, isCaregiver ? 'caregiver' : 'pasien', { timeOfDay: 'pagi' });
        items.push({
          id: `queue-obat-pagi-${patient.id}`,
          patient,
          category: 'minum_obat',
          timingLabel: 'Pengingat Minum Obat Pagi',
          scheduledTime: `2026-09-22 ${patient.jamMinumObat.pagi}`,
          template: tmplObatPagi,
          recipientName: msg.recipientName,
          recipientPhone: msg.recipientPhone,
          recipientType: isCaregiver ? 'Caregiver' : 'Pasien',
          messageBody: msg.body,
          status: 'ready',
        });
      }

      // 2. Check Minum Obat Malam
      const tmplObatMalam = templates.find(t => t.kode === 'OBAT_MALAM') || templates[1];
      const hasNightMeds = patient.obatRutin.some(m => m.waktuMinum.includes('malam'));
      if (hasNightMeds) {
        const isCaregiver = patient.caregiver.targetPenerima !== 'pasien';
        const msg = generatePersonalizedMessage(tmplObatMalam, patient, isCaregiver ? 'caregiver' : 'pasien', { timeOfDay: 'malam' });
        items.push({
          id: `queue-obat-malam-${patient.id}`,
          patient,
          category: 'minum_obat',
          timingLabel: 'Pengingat Minum Obat Malam',
          scheduledTime: `2026-09-22 ${patient.jamMinumObat.malam}`,
          template: tmplObatMalam,
          recipientName: msg.recipientName,
          recipientPhone: msg.recipientPhone,
          recipientType: isCaregiver ? 'Caregiver' : 'Pasien',
          messageBody: msg.body,
          status: 'ready',
        });
      }

      // 3. Check Kontrol Dokter Rules
      // Check if Kontrol is 2026-09-22 (Hari H), 2026-09-23 (H-1), or 2026-09-25 (H-3)
      const kontrolDate = patient.jadwalKontrol.tanggal;
      if (kontrolDate === '2026-09-22') {
        // HARI H
        const tmplH1 = templates.find(t => t.kode === 'KONTROL_H1') || templates[2];
        const msg = generatePersonalizedMessage(tmplH1, patient, 'caregiver');
        items.push({
          id: `queue-kontrol-h0-${patient.id}`,
          patient,
          category: 'kontrol_dokter',
          timingLabel: 'Kontrol Sp.KJ: Hari H (Hari Ini)',
          scheduledTime: '2026-09-22 06:45',
          template: tmplH1,
          recipientName: msg.recipientName,
          recipientPhone: msg.recipientPhone,
          recipientType: 'Caregiver',
          messageBody: msg.body,
          status: 'ready',
        });
      } else if (kontrolDate === '2026-09-23') {
        // H-1
        const tmplH1 = templates.find(t => t.kode === 'KONTROL_H1') || templates[2];
        const msg = generatePersonalizedMessage(tmplH1, patient, 'caregiver');
        items.push({
          id: `queue-kontrol-h1-${patient.id}`,
          patient,
          category: 'kontrol_dokter',
          timingLabel: 'Kontrol Sp.KJ: Besok (H-1)',
          scheduledTime: '2026-09-22 10:00',
          template: tmplH1,
          recipientName: msg.recipientName,
          recipientPhone: msg.recipientPhone,
          recipientType: 'Caregiver',
          messageBody: msg.body,
          status: 'ready',
        });
      } else if (kontrolDate === '2026-09-25') {
        // H-3
        const tmplH3 = templates.find(t => t.kode === 'KONTROL_H3') || templates[2];
        const msg = generatePersonalizedMessage(tmplH3, patient, 'caregiver');
        items.push({
          id: `queue-kontrol-h3-${patient.id}`,
          patient,
          category: 'kontrol_dokter',
          timingLabel: 'Kontrol Sp.KJ: Pemberitahuan H-3',
          scheduledTime: '2026-09-22 09:00',
          template: tmplH3,
          recipientName: msg.recipientName,
          recipientPhone: msg.recipientPhone,
          recipientType: 'Caregiver',
          messageBody: msg.body,
          status: 'ready',
        });
      }

      // 4. Check Jadwal Iter Rules
      if (patient.jadwalIter.adaIter && patient.jadwalIter.sisaIterasi > 0) {
        const iterDate = patient.jadwalIter.tanggalIter;
        if (iterDate === '2026-09-22' || iterDate === '2026-09-23' || iterDate === '2026-09-24') {
          const tmplIter = templates.find(t => t.id === 'tmpl-iter-resep' || t.kode === 'ITER_RESEP') || templates[3];
          const msg = generatePersonalizedMessage(tmplIter, patient, 'caregiver');
          items.push({
            id: `queue-iter-${patient.id}`,
            patient,
            category: 'iter_resep',
            timingLabel: `Jadwal Iter (${iterDate === '2026-09-22' ? 'Hari Ini' : 'Mulai ' + iterDate})`,
            scheduledTime: '2026-09-22 08:30',
            template: tmplIter,
            recipientName: msg.recipientName,
            recipientPhone: msg.recipientPhone,
            recipientType: 'Caregiver',
            messageBody: msg.body,
            status: 'ready',
          });
        }
      }
    });

    return items;
  };

  const queueItems = buildQueue();
  const filteredQueue = queueItems.filter(item => {
    return selectedFilter === 'all' || item.category === selectedFilter;
  });

  const handleDispatchAll = () => {
    setIsProcessing(true);
    setTimeout(() => {
      const newMessages: WhatsAppMessage[] = filteredQueue.map(item => ({
        id: `msg-auto-${Date.now()}-${Math.floor(Math.random() * 9000)}`,
        patientId: item.patient.id,
        patientName: item.patient.nama,
        noRM: item.patient.noRM,
        recipientPhone: item.recipientPhone,
        recipientName: item.recipientName,
        recipientType: item.recipientType,
        category: item.category,
        title: item.timingLabel,
        body: item.messageBody,
        status: 'delivered', // simulated immediate delivery
        scheduledAt: item.scheduledTime,
        sentAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
        deliveredAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
        bspProvider: 'Fonnte Indonesia (WABA Gateway)',
      }));

      onDispatchQueue(newMessages);
      setIsProcessing(false);
      setDispatchedCount(newMessages.length);
      setTimeout(() => setDispatchedCount(null), 4000);
    }, 900);
  };

  const handleDispatchSingle = (item: QueueItem) => {
    const newMsg: WhatsAppMessage = {
      id: `msg-single-${Date.now()}`,
      patientId: item.patient.id,
      patientName: item.patient.nama,
      noRM: item.patient.noRM,
      recipientPhone: item.recipientPhone,
      recipientName: item.recipientName,
      recipientType: item.recipientType,
      category: item.category,
      title: item.timingLabel,
      body: item.messageBody,
      status: 'delivered',
      scheduledAt: item.scheduledTime,
      sentAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
      deliveredAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
      bspProvider: 'Fonnte Indonesia (WABA Gateway)',
    };
    onDispatchQueue([newMsg]);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header & Cron Trigger */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Antrean Notifikasi Otomatis &amp; Cron Scheduler
          </h2>
          <p className="text-xs text-slate-500">
            Sistem otomatis memindai profil pasien untuk jadwal minum obat harian, jadwal kontrol psikiater (H-3/H-1/H-0), dan Jadwal Iter.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenIterModal}
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-teal-50 text-teal-800 hover:bg-teal-100 border border-teal-200 transition-colors flex items-center gap-1.5"
          >
            <HelpCircle className="w-3.5 h-3.5 text-teal-600" />
            Penjelasan Jadwal Iter
          </button>

          <button
            onClick={handleDispatchAll}
            disabled={isProcessing || filteredQueue.length === 0}
            className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 text-white shadow-xs transition-all flex items-center gap-2"
          >
            {isProcessing ? (
              <>
                <Clock className="w-4 h-4 animate-spin" />
                <span>Memproses Kirim...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>Kirim Semua Antrean ({filteredQueue.length})</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Success Banner */}
      {dispatchedCount !== null && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-4 flex items-center gap-3 animate-in fade-in duration-200 text-xs sm:text-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <span className="font-bold">Berhasil Mengirim {dispatchedCount} Pesan WhatsApp!</span> Pesan telah dialirkan ke antrean BSP Gateway dan status telah diperbarui ke dasbor.
          </div>
        </div>
      )}

      {/* Scheduler Logic Explainer Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Obat Harian */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center gap-2 text-blue-700 font-bold text-xs sm:text-sm">
            <Pill className="w-4 h-4" />
            Alur 1: Jadwal Minum Obat Harian
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Dipicu otomatis setiap hari pada jam minum obat pasien: <strong>Pagi (07:00)</strong>, <strong>Siang (12:30)</strong>, dan <strong>Malam (19:30/20:00)</strong>. Pasien/Caregiver diminta membalas &apos;1&apos; untuk konfirmasi.
          </p>
          <div className="text-[11px] text-blue-800 font-mono bg-blue-50/70 p-2 rounded-lg">
            ✓ Pasien Aktif: {patients.length} | Terjadwal: Setiap Hari
          </div>
        </div>

        {/* Card 2: Kontrol Dokter Bulanan */}
        <div className="bg-white p-4 rounded-2xl border border-purple-200 bg-purple-50/20 shadow-2xs space-y-2">
          <div className="flex items-center gap-2 text-purple-700 font-bold text-xs sm:text-sm">
            <Calendar className="w-4 h-4" />
            Alur 2: Jadwal Kontrol Dokter Spesialis Jiwa
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Notifikasi bertahap: <strong>H-3</strong> (Persiapan rujukan &amp; BPJS), <strong>H-1</strong> (Konfirmasi kehadiran), dan <strong>Hari H</strong> (Waktu registrasi loket rawat jalan).
          </p>
          <div className="text-[11px] text-purple-800 font-mono bg-purple-50 p-2 rounded-lg">
            ✓ Trigger otomatis: Tanggal Kontrol minus 3, 1, 0 hari
          </div>
        </div>

        {/* Card 3: Jadwal Iter */}
        <div className="bg-white p-4 rounded-2xl border border-teal-200 bg-teal-50/20 shadow-2xs space-y-2">
          <div className="flex items-center gap-2 text-teal-700 font-bold text-xs sm:text-sm">
            <RefreshCw className="w-4 h-4" />
            Alur 3: Jadwal Iter (Pengambilan Obat)
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Mengingatkan jadwal pengambilan obat lanjutan (wajib tepat tanggal). Iter 1 &amp; 2 boleh diwakili, sedangkan <strong>Iter 3 wajib bersama pasien</strong>.
          </p>
          <div className="text-[11px] text-teal-800 font-mono bg-teal-50 p-2 rounded-lg">
            ✓ Wajib Tepat Tanggal • Iter 3 Wajib Hadir Pasien
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setSelectedFilter('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            selectedFilter === 'all'
              ? 'bg-slate-900 text-white'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          Semua Antrean ({queueItems.length})
        </button>
        <button
          onClick={() => setSelectedFilter('minum_obat')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
            selectedFilter === 'minum_obat'
              ? 'bg-blue-600 text-white'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Pill className="w-3.5 h-3.5" />
          Minum Obat Harian
        </button>
        <button
          onClick={() => setSelectedFilter('kontrol_dokter')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
            selectedFilter === 'kontrol_dokter'
              ? 'bg-purple-600 text-white'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          Kontrol Dokter (H-3/H-1/H-0)
        </button>
        <button
          onClick={() => setSelectedFilter('iter_resep')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
            selectedFilter === 'iter_resep'
              ? 'bg-teal-600 text-white'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Jadwal Iter
        </button>
      </div>

      {/* Queue List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Waktu Jadwal</th>
                <th className="py-3 px-4">Pasien &amp; Rekam Medis</th>
                <th className="py-3 px-4">Penerima WhatsApp</th>
                <th className="py-3 px-4">Jenis Pengingat</th>
                <th className="py-3 px-4">Ringkasan Pesan Terpersonalisasi</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredQueue.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Tidak ada antrean pengiriman untuk kategori ini hari ini.
                  </td>
                </tr>
              ) : (
                filteredQueue.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Waktu */}
                    <td className="py-3 px-4 whitespace-nowrap font-mono text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{item.scheduledTime.slice(11, 16)} WIB</span>
                      </div>
                    </td>

                    {/* Pasien */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-bold text-slate-900">{item.patient.nama}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{item.patient.noRM}</div>
                    </td>

                    {/* Penerima */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 font-medium text-slate-800">
                        <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{item.recipientName}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">{item.recipientPhone}</div>
                    </td>

                    {/* Jenis */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                        item.category === 'minum_obat'
                          ? 'bg-blue-50 text-blue-800 border border-blue-200'
                          : item.category === 'kontrol_dokter'
                          ? 'bg-purple-50 text-purple-800 border border-purple-200'
                          : 'bg-teal-50 text-teal-800 border border-teal-200'
                      }`}>
                        {item.timingLabel}
                      </span>
                    </td>

                    {/* Ringkasan Pesan */}
                    <td className="py-3 px-4 max-w-xs truncate text-slate-600 font-mono text-[11px]">
                      {item.messageBody.slice(0, 75)}...
                    </td>

                    {/* Aksi */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => handleDispatchSingle(item)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold transition-colors inline-flex items-center gap-1"
                      >
                        <Send className="w-3 h-3" />
                        Kirim Sekarang
                      </button>
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
