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
  const time = options?.timeOfDay || 'pagi';
  const medsForTime = patient.obatRutin.filter(m => m.waktuMinum.includes(time));
  const medsListStr = medsForTime.length > 0 
    ? medsForTime.map(m => `${m.namaObat} ${m.dosis} (${m.aturanPakai})`).join(', ')
    : patient.obatRutin.map(m => `${m.namaObat} ${m.dosis}`).join(', ');

  const jamMinum = patient.jamMinumObat[time] || '07:00';

  let text = template.templateText;

  const replacements: Record<string, string> = {
    '{nama_pasien}': patient.nama,
    '{nama_caregiver}': patient.caregiver.nama,
    '{hubungan_caregiver}': patient.caregiver.hubungan,
    '{nama_panggilan}': panggilan,
    '{nomor_rm}': patient.noRM,
    '{daftar_obat_pagi}': patient.obatRutin.filter(m => m.waktuMinum.includes('pagi')).map(m => `${m.namaObat} ${m.dosis}`).join(', ') || 'Sesuai petunjuk etiket obat',
    '{daftar_obat_siang}': patient.obatRutin.filter(m => m.waktuMinum.includes('siang')).map(m => `${m.namaObat} ${m.dosis}`).join(', ') || 'Sesuai petunjuk etiket obat',
    '{daftar_obat_malam}': patient.obatRutin.filter(m => m.waktuMinum.includes('malam')).map(m => `${m.namaObat} ${m.dosis}`).join(', ') || 'Sesuai petunjuk etiket obat',
    '{jam_minum}': `${jamMinum} WIB`,
    '{tanggal_kontrol}': formatIndonesianDate(patient.jadwalKontrol.tanggal),
    '{jam_kontrol}': patient.jadwalKontrol.jam,
    '{dokter_dpjp}': patient.dokterDPJP,
    '{poliklinik}': patient.poliklinik,
    '{nomor_resep}': patient.jadwalIter.nomorResep,
    '{tanggal_iter}': formatIndonesianDate(patient.jadwalIter.tanggalIter),
    '{sisa_iter}': `${patient.jadwalIter.sisaIterasi}x dari total ${patient.jadwalIter.totalIterasi}x pengulangan`,
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
    m.category === 'iter_resep' ? 'Iterasi Resep' :
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

