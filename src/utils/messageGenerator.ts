import { Patient, MessageTemplate, WhatsAppMessage } from '../types';
import { RSJ_INFO } from '../data/initialData';
import * as XLSX from 'xlsx';

export function formatIndonesianDate(dateStr: string): string {
  if (!dateStr || dateStr === '-') return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    const day = d.getDate();
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const dayName = days[d.getDay()];
    return `${dayName}, ${day} ${month} ${year}`;
  } catch {
    return dateStr;
  }
}

export function generatePersonalizedMessage(
  template: MessageTemplate,
  patient: Patient,
  recipientType: 'pasien' | 'caregiver' = 'caregiver',
  options?: { 
    timeOfDay?: 'pagi' | 'siang' | 'malam';
    customRecipientName?: string;
    customRecipientPhone?: string;
    customPanggilan?: string;
  }
): { body: string; recipientName: string; recipientPhone: string } {
  const isCaregiver = recipientType === 'caregiver' && patient.caregiver.noTelepon;
  const recipientName = options?.customRecipientName 
    || (isCaregiver ? `${patient.caregiver.nama} (${patient.caregiver.hubungan})` : patient.nama);
  const recipientPhone = options?.customRecipientPhone
    || (isCaregiver ? patient.caregiver.noTelepon : patient.noTelepon);
  const panggilan = options?.customPanggilan 
    || (options?.customRecipientName 
      ? `Bapak/Ibu ${options.customRecipientName}` 
      : (isCaregiver
        ? `Bapak/Ibu ${patient.caregiver.nama}`
        : (patient.jenisKelamin === 'L' ? `Bapak ${patient.nama}` : `Ibu ${patient.nama}`)));

  // Medications list by time
  const inferredTime: 'pagi' | 'siang' | 'malam' =
    template.id === 'tmpl-obat-siang' || template.kode === 'OBAT_SIANG' ? 'siang' :
    template.id === 'tmpl-obat-malam' || template.kode === 'OBAT_MALAM' ? 'malam' : 'pagi';
  const time = options?.timeOfDay || inferredTime;
  const medsForTime = patient.obatRutin.filter(m => m.waktuMinum.includes(time));
  const medsListStr = medsForTime.length > 0 
    ? medsForTime.map(m => `${m.namaObat} ${m.dosis} (${m.aturanPakai})`).join(', ')
    : patient.obatRutin.map(m => `${m.namaObat} ${m.dosis}`).join(', ');

  const jamMinum = patient.jamMinumObat[time] || (time === 'pagi' ? '07:00' : time === 'siang' ? '12:30' : '20:00');

  let text = template.templateText;

  const replacements: Record<string, string> = {
    '{nama_pasien}': patient.nama,
    '{nama_caregiver}': patient.caregiver.nama,
    '{hubungan_caregiver}': patient.caregiver.hubungan,
    '{nama_panggilan}': panggilan,
    '{nomor_rm}': patient.noRM,
    '{daftar_obat_pagi}': (() => {
      const meds = patient.obatRutin.filter(m => m.waktuMinum.includes('pagi'));
      if (meds.length === 0) return 'Tidak ada obat pagi (sesuai petunjuk dokter)';
      return meds.map(m => `• ${m.namaObat} ${m.dosis} – ${m.aturanPakai}`).join('\n');
    })(),
    '{daftar_obat_siang}': (() => {
      const meds = patient.obatRutin.filter(m => m.waktuMinum.includes('siang'));
      if (meds.length === 0) return 'Tidak ada obat siang (sesuai petunjuk dokter)';
      return meds.map(m => `• ${m.namaObat} ${m.dosis} – ${m.aturanPakai}`).join('\n');
    })(),
    '{daftar_obat_malam}': (() => {
      const meds = patient.obatRutin.filter(m => m.waktuMinum.includes('malam'));
      if (meds.length === 0) return 'Tidak ada obat malam (sesuai petunjuk dokter)';
      return meds.map(m => `• ${m.namaObat} ${m.dosis} – ${m.aturanPakai}`).join('\n');
    })(),
    '{jam_minum}': `${jamMinum} WIB`,
    '{tanggal_kontrol}': formatIndonesianDate(patient.jadwalKontrol.tanggal),
    '{jam_kontrol}': patient.jadwalKontrol.jam,
    '{dokter_dpjp}': patient.dokterDPJP,
    '{poliklinik}': patient.poliklinik,
    '{nomor_resep}': patient.jadwalIter.nomorResep,
    '{tanggal_iter}': formatIndonesianDate(patient.jadwalIter.tanggalIter),
    '{sisa_iter}': `${patient.jadwalIter.sisaIterasi}x dari total ${patient.jadwalIter.totalIterasi}x pengulangan`,
    '{iter_ke}': (() => {
      const totalIter = patient.jadwalIter.totalIterasi || 3;
      const sisaIter = patient.jadwalIter.sisaIterasi || 1;
      const iterKe = Math.max(1, totalIter - sisaIter + 1);
      return `Iter ke-${iterKe}`;
    })(),
    '{ketentuan_kehadiran_iter}': (() => {
      const totalIter = patient.jadwalIter.totalIterasi || 3;
      const sisaIter = patient.jadwalIter.sisaIterasi || 1;
      const iterKe = Math.max(1, totalIter - sisaIter + 1);
      const isIter3OrMore = iterKe >= 3;
      if (isIter3OrMore) {
        return `⚠️ *WAJIB BERSAMA PASIEN:* Pada jadwal iter ke-${iterKe} ini, pasien Sdr/i *${patient.nama} WAJIB hadir langsung* ke RSJ untuk pemeriksaan/evaluasi dokter dan pembaharuan resep (TIDAK BOLEH diwakilkan).`;
      }
      const catatanIter3 = ` _(Catatan: Iter ke-3 berikutnya wajib bersama pasien langsung.)_`;
      return `✅ *BOLEH DIWAKILI:* Jadwal iter ke-${iterKe} ini *boleh diwakili* oleh keluarga/caregiver dengan membawa kartu berobat dan copy resep asli.${catatanIter3}`;
    })(),
    '{ketentuan_tanggal_iter}': `🗓 *WAJIB TEPAT TANGGAL:* Pengambilan obat *HARUS tepat pada tanggal yang ditentukan (${formatIndonesianDate(patient.jadwalIter.tanggalIter)})*. Tidak boleh diambil lebih awal atau terlambat.`,
    '{aturan_jadwal_iter}': (() => {
      const totalIter = patient.jadwalIter.totalIterasi || 3;
      const sisaIter = patient.jadwalIter.sisaIterasi || 1;
      const iterKe = Math.max(1, totalIter - sisaIter + 1);
      const isIter3OrMore = iterKe >= 3;
      const kehadiran = isIter3OrMore
        ? `⚠️ *WAJIB BERSAMA PASIEN:* Pasien *${patient.nama} WAJIB hadir langsung* ke RSJ untuk evaluasi dokter (tidak boleh diwakilkan).`
        : `✅ *BOLEH DIWAKILI:* Jadwal iter ke-${iterKe} ini boleh diwakili oleh keluarga/caregiver.`;
      return `1. 🗓 *Wajib Tepat Tanggal:* Obat HARUS diambil tepat pada tanggal *${formatIndonesianDate(patient.jadwalIter.tanggalIter)}* (tidak boleh lebih awal atau terlambat).\n2. 👥 *Ketentuan Kehadiran (Iter ke-${iterKe}):* ${kehadiran}`;
    })(),
    '{daftar_obat}': medsListStr,
    '{diagnosa}': patient.diagnosaMedis || '-',
    '{diagnosa_medis}': patient.diagnosaMedis || '-',
    '{alamat}': patient.alamat || '-',
    '{usia}': `${patient.usia} tahun`,
    '{jam_minum_pagi}': `${patient.jamMinumObat.pagi || '07:00'} WIB`,
    '{jam_minum_siang}': `${patient.jamMinumObat.siang || '12:30'} WIB`,
    '{jam_minum_malam}': `${patient.jamMinumObat.malam || '20:00'} WIB`,
    '{dokter_kontrol}': patient.jadwalKontrol.dokter || patient.dokterDPJP,
    '{poli_kontrol}': patient.jadwalKontrol.poli || patient.poliklinik,
    '{hotline_rsj}': RSJ_INFO.hotlineWA,
    '{nama_rsj}': RSJ_INFO.nama,
  };

  for (const [key, value] of Object.entries(replacements)) {
    text = text.replaceAll(key, value);
  }

  return {
    body: text,
    recipientName,
    recipientPhone,
  };
}

export function exportMessagesToExcel(messages: WhatsAppMessage[]): void {
  const headers = [
    'ID Pesan',
    'No. Rekam Medis',
    'Nama Pasien',
    'Penerima',
    'Tipe Penerima',
    'No. WhatsApp',
    'Kategori Pengingat',
    'Judul Pesan',
    'Status Pesan',
    'Jadwal Kirim',
    'Waktu Terkirim',
    'Waktu Terbaca',
    'Waktu Terbalas',
    'Isi Balasan Pasien',
    'Provider BSP'
  ];

  const rows = messages.map(m => [
    m.id,
    m.noRM,
    m.patientName,
    m.recipientName,
    m.recipientType,
    m.recipientPhone,
    m.category === 'minum_obat' ? 'Minum Obat' :
    m.category === 'kontrol_dokter' ? 'Kontrol Dokter' :
    m.category === 'iter_resep' ? 'Jadwal Iter' :
    m.category === 'edukasi_rsj' ? 'Edukasi / Afirmasi' : m.category,
    m.title,
    m.status === 'delivered' ? 'Terkirim' :
    m.status === 'read' ? 'Terbaca' :
    m.status === 'replied' ? 'Dibalas' :
    m.status === 'failed' ? 'Gagal' : 'Menunggu',
    m.scheduledAt || '-',
    m.sentAt || '-',
    m.readAt || '-',
    m.repliedAt || '-',
    m.replyText || '-',
    m.bspProvider || '-'
  ]);

  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);

  // Dynamic column widths for clean readability in Excel
  const colWidths = headers.map((h, i) => {
    const maxLen = Math.max(
      h.length,
      ...rows.map(r => (r[i] != null ? String(r[i]).length : 0))
    );
    return { wch: Math.min(Math.max(maxLen + 3, 12), 45) };
  });
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Laporan Pesan WhatsApp');

  const fileName = `Laporan_Pesan_RSJ_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}

// Backwards compatibility alias for existing callers
export const exportMessagesToCSV = exportMessagesToExcel;

