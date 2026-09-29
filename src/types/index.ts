export type ReminderCategory = 'minum_obat' | 'kontrol_dokter' | 'iter_resep' | 'edukasi_rsj';

export type MessageStatus = 'queued' | 'sent' | 'delivered' | 'read' | 'replied' | 'failed';

export type RiskLevel = 'stabil' | 'pengawasan' | 'rawan_putus_obat';

export type SupervisionStatus = 'dalam_pengawasan' | 'luar_pengawasan' | 'selesai_pengobatan' | 'rujuk_keluar';

export type TargetRecipient = 'pasien' | 'caregiver' | 'keduanya';



export interface MedicationItem {
  id: string;
  namaObat: string;
  dosis: string;
  waktuMinum: ('pagi' | 'siang' | 'malam')[];
  aturanPakai: string; // misal: "Sesudah makan"
  keterangan?: string;
}

export interface Patient {
  id: string;
  noRM: string; // No. Rekam Medis (misal: "RM-2024-0482")
  nama: string;
  nik: string;
  noTelepon: string;
  usia: number;
  jenisKelamin: 'L' | 'P';
  alamat: string;
  diagnosaMedis: string; // contoh: "F20.0 Skizofrenia Paranoid", "F31.2 Gangguan Bipolar Manik"
  dokterDPJP: string; // contoh: "dr. Hendra Wicaksono, Sp.KJ"
  poliklinik: string; // contoh: "Poli Jiwa Dewasa Subspesialis"
  riskLevel: RiskLevel;
  
  // Data Caregiver / Penanggung Jawab
  caregiver: {
    nama: string;
    hubungan: string; // "Ibu Kandung", "Suami", "Anak", "Wali"
    noTelepon: string;
    targetPenerima: TargetRecipient;
  };

  // Jadwal Minum Obat Harian
  obatRutin: MedicationItem[];
  jamMinumObat: {
    pagi: string;  // "07:00"
    siang: string; // "12:30"
    malam: string; // "19:30"
  };
  kepatuhanMinumObatPersen: number;

  // Jadwal Kontrol Dokter Berikutnya (Bulanan)
  jadwalKontrol: {
    tanggal: string; // "YYYY-MM-DD"
    jam: string;     // "09:00"
    dokter: string;
    poli: string;
    statusReminder: {
      h3Sent: boolean;
      h1Sent: boolean;
      h0Sent: boolean;
    };
    konfirmasiKehadiran?: 'belum_konfirmasi' | 'akan_hadir' | 'minta_reschedule';
  };

  // Jadwal Iterasi Resep (Ambil Obat di Farmasi tanpa antre dokter)
  jadwalIter: {
    adaIter: boolean;
    nomorResep: string;
    tanggalIter: string; // "YYYY-MM-DD"
    totalIterasi: number; // misal "Iter 2x" (bisa tebus 2 kali lagi)
    sisaIterasi: number;  // misal sisa 1x
    statusReminder: {
      h2Sent: boolean;
      h0Sent: boolean;
    };
    statusPengambilan?: 'belum_diambil' | 'sudah_diambil';
  };

  terakhirDihubungi?: string;
  catatanKhusus?: string;

  // Status Pengawasan & Kontrol Otomasi Notifikasi RSJ
  statusPengawasan?: SupervisionStatus; // default 'dalam_pengawasan'
  notifikasiOtomatisAktif?: boolean;    // default true (jika false / luar pengawasan, sistem melewati pasien ini saat kirim pesan otomatis)
  alasanLuarPengawasan?: string;        // opsional: alasan jika di luar pengawasan (misal: "Pindah domisili", "Selesai rawat jalan")
}

export interface WhatsAppMessage {
  id: string;
  patientId: string;
  patientName: string;
  noRM: string;
  recipientPhone: string;
  recipientName: string;
  recipientType: 'Pasien' | 'Caregiver';
  category: ReminderCategory;
  title: string;
  body: string;
  status: MessageStatus;
  scheduledAt: string;
  sentAt?: string;
  deliveredAt?: string;
  readAt?: string;
  repliedAt?: string;
  replyText?: string;
  bspProvider: string;
  errorMessage?: string;
}

export interface MessageTemplate {
  id: string;
  category: ReminderCategory;
  kode: string;
  nama: string;
  deskripsi: string;
  templateText: string;
  defaultTime?: string;
  active: boolean;
}

export interface BSPConfig {
  providerName: 'qiscus' | 'mekari' | 'fonnte' | 'watzaap' | 'meta_direct';
  customProviderLabel?: string;
  senderNumber: string;
  apiKey: string;
  apiEndpoint: string;
  webhookSecret: string;
  webhookUrl: string;
  statusKoneksi: 'terhubung' | 'terputus' | 'simulasi';
  kuotaBulanan: number;
  pesanTerpakaiBulanIni: number;
  masaAktifSewa: string; // "2026-10-22"
  isSimulationMode: boolean;
}

export interface DailyAnalytics {
  date: string;
  totalSent: number;
  delivered: number;
  read: number;
  replied: number;
  failed: number;
  kategoriObat: number;
  kategoriKontrol: number;
  kategoriIter: number;
}

export interface AutomationSettings {
  isActive: boolean; // Master Switch: Aktif / Dijeda
  
  // 1. Pengingat Minum Obat Harian
  obat: {
    enabled: boolean;
    jamKirimPagi: string; // default "06:00"
    jamKirimMalam: string; // default "19:30"
    targetPenerima: 'caregiver' | 'pasien' | 'keduanya';
  };

  // 2. Pengingat Jadwal Kontrol Dokter
  kontrol: {
    enabled: boolean;
    jamKirim: string; // default "07:00"
    h3: boolean; // Kirim H-3
    h2: boolean; // Kirim H-2
    h1: boolean; // Kirim H-1
    h0: boolean; // Kirim Hari H
    targetPenerima: 'caregiver' | 'pasien' | 'keduanya';
  };

  // 3. Pengingat Jadwal Iterasi Resep (Farmasi)
  iter: {
    enabled: boolean;
    jamKirim: string; // default "07:30"
    h3: boolean; // Kirim H-3
    h2: boolean; // Kirim H-2
    h1: boolean; // Kirim H-1
    h0: boolean; // Kirim Hari H
    targetPenerima: 'caregiver' | 'pasien' | 'keduanya';
  };

  // Informasi Riwayat Eksekusi
  terakhirDieksekusi?: string;
  totalPesanTerkirimOtomatis: number;
}

export interface ManualStats {
  id: string;           // 'default' or date-based
  tanggalInput: string; // Tanggal input manual (YYYY-MM-DD)
  periode: string;      // Label periode (misal: "September 2026", "Minggu ke-3 September 2026")

  // Statistik Pengiriman Pesan
  pesanTerkirim: number;
  pesanDiterima: number;
  pesanTerbaca: number;
  pesanTerbalas: number;
  pesanGagal: number;

  // Tingkat Persentase
  tingkatTerbaca: number;    // Persentase
  tingkatBalasan: number;    // Persentase

  // Kepatuhan
  kepatuhanObatRataRata: number; // Persentase rata-rata kepatuhan minum obat
  jumlahPasienAktif: number;

  // Distribusi Kategori Pesan
  kategoriMinumObat: number;
  kategoriKontrolDokter: number;
  kategoriIterResep: number;
  kategoriEdukasi: number;

  // Catatan / Keterangan
  catatan?: string;
  
  // Metadata
  diinputOleh?: string;       // Nama petugas yang input
  terakhirDiupdate?: string;  // Timestamp terakhir diupdate
}

export interface ManualDailyRecord {
  date: string; // "YYYY-MM-DD" (Primary Key)
  totalSent: number;
  delivered: number;
  read: number;
  replied: number;
  failed: number;
  readRate: number; // %
  replyRate: number; // %
  complianceRate: number; // % Kepatuhan Minum Obat
  kategoriObat: number;
  kategoriKontrol: number;
  kategoriIter: number;
  kategoriEdukasi: number;
  petugas?: string;
  catatan?: string;
  updatedAt?: string;
}

