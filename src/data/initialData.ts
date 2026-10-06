import { Patient, MessageTemplate, WhatsAppMessage, BSPConfig, DailyAnalytics, AutomationSettings } from '../types';

export const INITIAL_TEMPLATES: MessageTemplate[] = [
  {
    id: 'tmpl-obat-pagi',
    category: 'minum_obat',
    kode: 'OBAT_PAGI',
    nama: 'Pengingat Minum Obat Pagi 🌅',
    deskripsi: 'Pesan simpel pengingat minum obat pagi sesuai data pasien.',
    defaultTime: '06:00',
    active: true,
    templateText: `Halo *{nama_panggilan}*, kami dari *{nama_rsj}*.

Mengingatkan jadwal minum obat pagi untuk *{nama_pasien}*:
{daftar_obat_pagi}
⏰ Waktu minum: {jam_minum}

Mohon pastikan obatnya diminum ya. Terima kasih dan salam sehat selalu. 🙏`,
  },
  {
    id: 'tmpl-obat-siang',
    category: 'minum_obat',
    kode: 'OBAT_SIANG',
    nama: 'Pengingat Minum Obat Siang ☀️',
    deskripsi: 'Pesan simpel pengingat minum obat siang sesuai data pasien.',
    defaultTime: '12:00',
    active: true,
    templateText: `Halo *{nama_panggilan}*, kami dari *{nama_rsj}*.

Mengingatkan jadwal minum obat siang untuk *{nama_pasien}*:
{daftar_obat_siang}
⏰ Waktu minum: {jam_minum}

Mohon pastikan obatnya diminum ya. Terima kasih dan salam sehat selalu. 🙏`,
  },
  {
    id: 'tmpl-obat-malam',
    category: 'minum_obat',
    kode: 'OBAT_MALAM',
    nama: 'Pengingat Minum Obat Malam 🌙',
    deskripsi: 'Pesan simpel pengingat minum obat malam sesuai data pasien.',
    defaultTime: '18:00',
    active: true,
    templateText: `Halo *{nama_panggilan}*, kami dari *{nama_rsj}*.

Mengingatkan jadwal minum obat malam untuk *{nama_pasien}*:
{daftar_obat_malam}
⏰ Waktu minum: {jam_minum}

Mohon pastikan obatnya diminum sebelum beristirahat ya. Terima kasih dan selamat beristirahat. 🙏`,
  },
  {
    id: 'tmpl-kontrol-dokter',
    category: 'kontrol_dokter',
    kode: 'KONTROL_DOKTER',
    nama: 'Pengingat Jadwal Kontrol',
    deskripsi: 'Pesan simpel pengingat jadwal kontrol pasien.',
    defaultTime: '06:00',
    active: true,
    templateText: `Halo *{nama_panggilan}*, kami dari *{nama_rsj}*.

Mengingatkan jadwal kontrol untuk *{nama_pasien}*:
📅 Tanggal: {tanggal_kontrol}
⏰ Jam: {jam_kontrol} WITA

Mohon hadir tepat waktu ya. Terima kasih dan salam sehat selalu. 🙏`,
  },
  {
    id: 'tmpl-iter-resep',
    category: 'iter_resep',
    kode: 'ITER_RESEP',
    nama: 'Pengingat Jadwal Iter',
    deskripsi: 'Pesan simpel pengingat jadwal iterasi pengambilan obat farmasi.',
    defaultTime: '06:00',
    active: true,
    templateText: `Halo *{nama_panggilan}*, kami dari *{nama_rsj}*.

Mengingatkan jadwal pengambilan obat (*{iter_ke}*) untuk *{nama_pasien}*:
📅 Tanggal: {tanggal_iter}

{ketentuan_kehadiran_iter}

Mohon mengambil obat tepat pada tanggal yang ditentukan ya. Terima kasih dan salam sehat selalu. 🙏`,
  },
  {
    id: 'tmpl-edukasi',
    category: 'edukasi_rsj',
    kode: 'EDUKASI_KELUARGA',
    nama: 'Pesan Dukungan Semangat Keluarga',
    deskripsi: 'Pesan singkat penyemangat dan apresiasi bagi keluarga/pendamping dari RSJ Naimata.',
    defaultTime: '06:00',
    active: true,
    templateText: `Halo *{nama_panggilan}*, kami dari *{nama_rsj}*.

Terima kasih atas perhatian dan ketelatenan Anda dalam mendampingi pengobatan *{nama_pasien}*. Semangat dan kebersamaan keluarga adalah kunci utama proses pemulihan.

Salam sehat selalu. 🙏`,
  },
];

export const INITIAL_PATIENTS: Patient[] = [
  // ============================================================
  // DATA PASIEN ASLI - Ujicoba 30 Pasien (Batch 1: 5 Pasien)
  // Dokter DPJP: dr. Raymond J.M Natanael, Sp.KJ
  // Tgl Kontrol Berikutnya: 22 Oktober 2026
  // ============================================================
  {
    id: 'pasien-1',
    noRM: '005001',
    nama: 'Risal Timuneno',
    nik: '',
    noTelepon: '081338499006',
    usia: 32,
    jenisKelamin: 'L',
    alamat: '',
    diagnosaMedis: 'F20.0 Skizofrenia Paranoid',
    dokterDPJP: 'dr. Raymond J.M Natanael, Sp.KJ',
    poliklinik: 'Poli Jiwa',
    riskLevel: 'pengawasan',
    caregiver: {
      nama: '',
      hubungan: 'Keluarga',
      noTelepon: '081338499006',
      targetPenerima: 'pasien',
    },
    obatRutin: [
      {
        id: 'med-1-1',
        namaObat: 'Haloperidol (Hlp)',
        dosis: '1,5 mg',
        waktuMinum: ['pagi', 'malam'],
        aturanPakai: 'Sesudah makan — 2 kali sehari',
      },
      {
        id: 'med-1-2',
        namaObat: 'Risperidone',
        dosis: '1 mg',
        waktuMinum: ['malam'],
        aturanPakai: 'Sesudah makan — 1 kali sehari malam',
      },
      {
        id: 'med-1-3',
        namaObat: 'Diazepam',
        dosis: '2,5 mg',
        waktuMinum: ['malam'],
        aturanPakai: 'Sesudah makan — 1 kali sehari malam',
      },
    ],
    jamMinumObat: {
      pagi: '07:00',
      siang: '12:00',
      malam: '20:00',
    },
    kepatuhanMinumObatPersen: 0,
    jadwalKontrol: {
      tanggal: '2026-10-22',
      jam: '09:00',
      dokter: 'dr. Raymond J.M Natanael, Sp.KJ',
      poli: 'Poli Jiwa',
      statusReminder: {
        h3Sent: false,
        h1Sent: false,
        h0Sent: false,
      },
      konfirmasiKehadiran: 'belum_konfirmasi',
    },
    jadwalIter: {
      adaIter: false,
      nomorResep: '-',
      tanggalIter: '-',
      totalIterasi: 0,
      sisaIterasi: 0,
      statusReminder: { h2Sent: false, h0Sent: false },
      statusPengambilan: 'belum_diambil',
    },
    catatanKhusus: 'Tidak bekerja. Diagnosa F20.0. Terapi: Hlp 2x1,5 + Risperidone 1x1 (m) + Diazepam 2,5 (m).',
    statusPengawasan: 'dalam_pengawasan',
    notifikasiOtomatisAktif: true,
  },
  {
    id: 'pasien-2',
    noRM: '001473',
    nama: 'Yohanes Hadjaweo',
    nik: '',
    noTelepon: '081338749644',
    usia: 42,
    jenisKelamin: 'L',
    alamat: '',
    diagnosaMedis: 'F20.0 Skizofrenia Paranoid',
    dokterDPJP: 'dr. Raymond J.M Natanael, Sp.KJ',
    poliklinik: 'Poli Jiwa',
    riskLevel: 'pengawasan',
    caregiver: {
      nama: '',
      hubungan: 'Keluarga',
      noTelepon: '081338749644',
      targetPenerima: 'pasien',
    },
    obatRutin: [
      {
        id: 'med-2-1',
        namaObat: 'Diracid',
        dosis: '1 Kapsul',
        waktuMinum: ['malam'],
        aturanPakai: 'Sesudah makan — 1 kali sehari malam',
      },
    ],
    jamMinumObat: {
      pagi: '07:00',
      siang: '12:00',
      malam: '20:00',
    },
    kepatuhanMinumObatPersen: 0,
    jadwalKontrol: {
      tanggal: '2026-10-22',
      jam: '09:00',
      dokter: 'dr. Raymond J.M Natanael, Sp.KJ',
      poli: 'Poli Jiwa',
      statusReminder: {
        h3Sent: false,
        h1Sent: false,
        h0Sent: false,
      },
      konfirmasiKehadiran: 'belum_konfirmasi',
    },
    jadwalIter: {
      adaIter: false,
      nomorResep: '-',
      tanggalIter: '-',
      totalIterasi: 0,
      sisaIterasi: 0,
      statusReminder: { h2Sent: false, h0Sent: false },
      statusPengambilan: 'belum_diambil',
    },
    catatanKhusus: 'Tidak bekerja. Diagnosa F20.0. Terapi: Diracid 1x1 Cap (m).',
    statusPengawasan: 'dalam_pengawasan',
    notifikasiOtomatisAktif: true,
  },
  {
    id: 'pasien-3',
    noRM: '028332',
    nama: 'Fanny Dethan',
    nik: '',
    noTelepon: '082237470265',
    usia: 37,
    jenisKelamin: 'P',
    alamat: '',
    diagnosaMedis: 'F41.0 Gangguan Panik',
    dokterDPJP: 'dr. Raymond J.M Natanael, Sp.KJ',
    poliklinik: 'Poli Jiwa',
    riskLevel: 'stabil',
    caregiver: {
      nama: '',
      hubungan: 'Keluarga',
      noTelepon: '082237470265',
      targetPenerima: 'pasien',
    },
    obatRutin: [
      {
        id: 'med-3-1',
        namaObat: 'Diracid',
        dosis: '1 Kapsul',
        waktuMinum: ['malam'],
        aturanPakai: 'Sesudah makan — 1 kali sehari malam',
      },
    ],
    jamMinumObat: {
      pagi: '07:00',
      siang: '12:00',
      malam: '20:00',
    },
    kepatuhanMinumObatPersen: 0,
    jadwalKontrol: {
      tanggal: '2026-10-22',
      jam: '09:00',
      dokter: 'dr. Raymond J.M Natanael, Sp.KJ',
      poli: 'Poli Jiwa',
      statusReminder: {
        h3Sent: false,
        h1Sent: false,
        h0Sent: false,
      },
      konfirmasiKehadiran: 'belum_konfirmasi',
    },
    jadwalIter: {
      adaIter: false,
      nomorResep: '-',
      tanggalIter: '-',
      totalIterasi: 0,
      sisaIterasi: 0,
      statusReminder: { h2Sent: false, h0Sent: false },
      statusPengambilan: 'belum_diambil',
    },
    catatanKhusus: 'Wiraswasta. Diagnosa F41.0. Terapi: Diracid 1x1 Cap (m).',
    statusPengawasan: 'dalam_pengawasan',
    notifikasiOtomatisAktif: true,
  },
  {
    id: 'pasien-4',
    noRM: '024071',
    nama: 'Fernando Niti',
    nik: '',
    noTelepon: '081283529955',
    usia: 39,
    jenisKelamin: 'L',
    alamat: '',
    diagnosaMedis: 'F20.0 Skizofrenia Paranoid',
    dokterDPJP: 'dr. Raymond J.M Natanael, Sp.KJ',
    poliklinik: 'Poli Jiwa',
    riskLevel: 'pengawasan',
    caregiver: {
      nama: '',
      hubungan: 'Keluarga',
      noTelepon: '081283529955',
      targetPenerima: 'pasien',
    },
    obatRutin: [
      {
        id: 'med-4-1',
        namaObat: 'Haloperidol (Hlp)',
        dosis: '2,5 mg',
        waktuMinum: ['pagi', 'malam'],
        aturanPakai: 'Sesudah makan — 2 kali sehari',
      },
      {
        id: 'med-4-2',
        namaObat: 'Clozapine',
        dosis: '50 mg',
        waktuMinum: ['pagi', 'malam'],
        aturanPakai: 'Sesudah makan — 2 kali sehari',
      },
      {
        id: 'med-4-3',
        namaObat: 'Trihexyphenidyl (Thp)',
        dosis: '2 mg',
        waktuMinum: ['pagi', 'malam'],
        aturanPakai: 'Sesudah makan — 2 kali sehari',
      },
    ],
    jamMinumObat: {
      pagi: '07:00',
      siang: '12:00',
      malam: '20:00',
    },
    kepatuhanMinumObatPersen: 0,
    jadwalKontrol: {
      tanggal: '2026-10-22',
      jam: '09:00',
      dokter: 'dr. Raymond J.M Natanael, Sp.KJ',
      poli: 'Poli Jiwa',
      statusReminder: {
        h3Sent: false,
        h1Sent: false,
        h0Sent: false,
      },
      konfirmasiKehadiran: 'belum_konfirmasi',
    },
    jadwalIter: {
      adaIter: false,
      nomorResep: '-',
      tanggalIter: '-',
      totalIterasi: 0,
      sisaIterasi: 0,
      statusReminder: { h2Sent: false, h0Sent: false },
      statusPengambilan: 'belum_diambil',
    },
    catatanKhusus: 'Tidak bekerja. Diagnosa F20.0. Terapi: Hlp 2x2,5 + Clozapine 2x50 + Thp 2x2.',
    statusPengawasan: 'dalam_pengawasan',
    notifikasiOtomatisAktif: true,
  },
  {
    id: 'pasien-5',
    noRM: '021148',
    nama: 'Velicya Daka',
    nik: '',
    noTelepon: '085337956080',
    usia: 22,
    jenisKelamin: 'P',
    alamat: '',
    diagnosaMedis: 'F32.3 Episode Depresif Berat dengan Gejala Psikotik',
    dokterDPJP: 'dr. Raymond J.M Natanael, Sp.KJ',
    poliklinik: 'Poli Jiwa',
    riskLevel: 'pengawasan',
    caregiver: {
      nama: '',
      hubungan: 'Keluarga',
      noTelepon: '085337956080',
      targetPenerima: 'pasien',
    },
    obatRutin: [
      {
        id: 'med-5-1',
        namaObat: 'Fluoxetine',
        dosis: '20 mg',
        waktuMinum: ['pagi'],
        aturanPakai: 'Sesudah makan — 1 kali sehari pagi',
      },
      {
        id: 'med-5-2',
        namaObat: 'Valizambe (Diazepam)',
        dosis: '2,5 mg',
        waktuMinum: ['malam'],
        aturanPakai: 'Sesudah makan — 1 kali sehari malam',
      },
      {
        id: 'med-5-3',
        namaObat: 'Quetiapine',
        dosis: '100 mg',
        waktuMinum: ['malam'],
        aturanPakai: 'Sesudah makan — 1 kali sehari malam',
      },
    ],
    jamMinumObat: {
      pagi: '07:00',
      siang: '12:00',
      malam: '20:00',
    },
    kepatuhanMinumObatPersen: 0,
    jadwalKontrol: {
      tanggal: '2026-10-22',
      jam: '09:00',
      dokter: 'dr. Raymond J.M Natanael, Sp.KJ',
      poli: 'Poli Jiwa',
      statusReminder: {
        h3Sent: false,
        h1Sent: false,
        h0Sent: false,
      },
      konfirmasiKehadiran: 'belum_konfirmasi',
    },
    jadwalIter: {
      adaIter: false,
      nomorResep: '-',
      tanggalIter: '-',
      totalIterasi: 0,
      sisaIterasi: 0,
      statusReminder: { h2Sent: false, h0Sent: false },
      statusPengambilan: 'belum_diambil',
    },
    catatanKhusus: 'Mahasiswi. Diagnosa F32.3. Terapi: Fluoxetine 1x20 (p) + Valizambe 1x2,5 (m) + Quetiapine 1x100 (m).',
    statusPengawasan: 'dalam_pengawasan',
    notifikasiOtomatisAktif: true,
  },
];

export const INITIAL_MESSAGES: WhatsAppMessage[] = [
  // Riwayat pesan dikosongkan — ujicoba 30 pasien dengan data asli.
  // Pesan akan terisi setelah sistem mulai mengirim reminder ke pasien nyata.
];


export const INITIAL_BSP_CONFIG: BSPConfig = {
  providerName: 'fonnte',
  customProviderLabel: 'Fonnte Indonesia (Gateway API Lokal)',
  senderNumber: '0811-9876-0099',
  apiKey: 'fn_live_rsj_98f4a8b72c4e112d',
  apiEndpoint: 'https://api.fonnte.com/send',
  webhookSecret: 'whsec_rsj_sejiwa_2026_xyz',
  webhookUrl: 'https://rsj-sejiwa.kemkes.go.id/api/wa/webhook',
  statusKoneksi: 'terhubung',
  kuotaBulanan: 5000,
  pesanTerpakaiBulanIni: 1428,
  masaAktifSewa: '2026-10-22',
  isSimulationMode: true,
};

export const INITIAL_ANALYTICS: DailyAnalytics[] = [
  {
    date: '16 Sep',
    totalSent: 184,
    delivered: 180,
    read: 168,
    replied: 142,
    failed: 4,
    kategoriObat: 140,
    kategoriKontrol: 28,
    kategoriIter: 16,
  },
  {
    date: '17 Sep',
    totalSent: 196,
    delivered: 192,
    read: 178,
    replied: 155,
    failed: 4,
    kategoriObat: 148,
    kategoriKontrol: 32,
    kategoriIter: 16,
  },
  {
    date: '18 Sep',
    totalSent: 210,
    delivered: 206,
    read: 194,
    replied: 168,
    failed: 4,
    kategoriObat: 160,
    kategoriKontrol: 34,
    kategoriIter: 16,
  },
  {
    date: '19 Sep',
    totalSent: 204,
    delivered: 201,
    read: 189,
    replied: 162,
    failed: 3,
    kategoriObat: 154,
    kategoriKontrol: 30,
    kategoriIter: 20,
  },
  {
    date: '20 Sep',
    totalSent: 188,
    delivered: 185,
    read: 172,
    replied: 149,
    failed: 3,
    kategoriObat: 145,
    kategoriKontrol: 25,
    kategoriIter: 18,
  },
  {
    date: '21 Sep',
    totalSent: 224,
    delivered: 220,
    read: 205,
    replied: 182,
    failed: 4,
    kategoriObat: 170,
    kategoriKontrol: 36,
    kategoriIter: 18,
  },
  {
    date: '22 Sep (Hari Ini)',
    totalSent: 82,
    delivered: 80,
    read: 74,
    replied: 65,
    failed: 2,
    kategoriObat: 64,
    kategoriKontrol: 12,
    kategoriIter: 6,
  }
];

export const RSJ_INFO = {
  nama: 'RSJ Naimata',
  alamat: 'Jl. Taebenu KM 7, Kel. Naimata, Kec. Maulafa, Kota Kupang, Nusa Tenggara Timur',
  callCenter: '0380-881234',
  hotlineWA: '0811-3829-0011',
  igd24Jam: '0380-881235',
  unitFarmasi: 'Instalasi Farmasi RSJ Naimata'
};



export const INITIAL_AUTOMATION_SETTINGS: AutomationSettings = {
  isActive: true, // Otomasi aktif secara default
  obat: {
    enabled: true,
    jamKirimPagi: '06:00',   // Jam 6 pagi setiap hari
    jamKirimSiang: '12:00',  // Jam 12 siang
    jamKirimMalam: '18:00',  // Jam 6 sore / malam
    targetPenerima: 'caregiver',
  },
  kontrol: {
    enabled: true,
    jamKirim: '06:00', // Jam 6 pagi
    h3: true,  // H-3
    h2: true,  // H-2
    h1: true,  // H-1
    h0: true,  // Hari H
    targetPenerima: 'caregiver',
  },
  iter: {
    enabled: true,
    jamKirim: '06:00', // Jam 6 pagi
    h3: true,  // H-3
    h2: true,  // H-2
    h1: true,  // H-1
    h0: true,  // Hari H
    targetPenerima: 'caregiver',
  },
  terakhirDieksekusi: 'Hari ini, 06:00 WITA (Otomatis Berjalan)',
  totalPesanTerkirimOtomatis: 28,
};
