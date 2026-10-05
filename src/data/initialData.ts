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
  {
    id: 'pasien-1',
    noRM: 'RM-2024-0102',
    nama: 'Bambang Triyono',
    nik: '3201121508890003',
    noTelepon: '081288991234',
    usia: 35,
    jenisKelamin: 'L',
    alamat: 'Jl. Merpati No. 14, RT 02/RW 04, Bogor',
    diagnosaMedis: 'F20.0 Skizofrenia Paranoid (Fase Remisi Simptomatik)',
    dokterDPJP: 'dr. Hendra Wicaksono, Sp.KJ',
    poliklinik: 'Poli Jiwa Dewasa Subspesialis',
    riskLevel: 'pengawasan',
    caregiver: {
      nama: 'Siti Aminah',
      hubungan: 'Ibu Kandung',
      noTelepon: '081399887766',
      targetPenerima: 'keduanya',
    },
    obatRutin: [
      {
        id: 'med-1',
        namaObat: 'Risperidone',
        dosis: '2 mg',
        waktuMinum: ['pagi', 'malam'],
        aturanPakai: 'Sesudah makan',
      },
      {
        id: 'med-2',
        namaObat: 'Trihexyphenidyl (THP)',
        dosis: '2 mg',
        waktuMinum: ['pagi'],
        aturanPakai: 'Pencegah kaku otot, sesudah makan',
      },
      {
        id: 'med-3',
        namaObat: 'Clozapine',
        dosis: '25 mg',
        waktuMinum: ['malam'],
        aturanPakai: 'Sebelum tidur',
      }
    ],
    jamMinumObat: {
      pagi: '07:00',
      siang: '12:30',
      malam: '20:00',
    },
    kepatuhanMinumObatPersen: 0,
    jadwalKontrol: {
      tanggal: '2026-09-25', // H-3 dari hari ini (2026-09-22)
      jam: '09:00',
      dokter: 'dr. Hendra Wicaksono, Sp.KJ',
      poli: 'Poli Jiwa Dewasa',
      statusReminder: {
        h3Sent: false,
        h1Sent: false,
        h0Sent: false,
      },
      konfirmasiKehadiran: 'belum_konfirmasi',
    },
    jadwalIter: {
      adaIter: true,
      nomorResep: 'RSP-IX-4412',
      tanggalIter: '2026-09-24', // H-2 pengambilan obat
      totalIterasi: 2,
      sisaIterasi: 1, // "Iter 2x sisa 1x"
      statusReminder: {
        h2Sent: false,
        h0Sent: false,
      },
      statusPengambilan: 'belum_diambil',
    },
    terakhirDihubungi: '2026-09-22 07:02',
    catatanKhusus: 'Pasien sangat kooperatif jika didampingi ibunya. Membutuhkan pengingat malam teratur.',
    statusPengawasan: 'dalam_pengawasan',
    notifikasiOtomatisAktif: true,
  },
  {
    id: 'pasien-2',
    noRM: 'RM-2023-0891',
    nama: 'Dewi Lestari',
    nik: '3201145609920001',
    noTelepon: '085712349876',
    usia: 32,
    jenisKelamin: 'P',
    alamat: 'Perum Gading Asri Blok C2 No. 8, Cibinong',
    diagnosaMedis: 'F31.2 Gangguan Bipolar Manik dengan Gejala Psikotik (Terkontrol)',
    dokterDPJP: 'dr. Ratna Anindita, Sp.KJ, M.Kes',
    poliklinik: 'Poli Mood Disorder & Afektif',
    riskLevel: 'stabil',
    caregiver: {
      nama: 'Raditya Pratama',
      hubungan: 'Suami',
      noTelepon: '081211223344',
      targetPenerima: 'caregiver',
    },
    obatRutin: [
      {
        id: 'med-4',
        namaObat: 'Asam Valproat (Depakote)',
        dosis: '250 mg',
        waktuMinum: ['pagi', 'malam'],
        aturanPakai: 'Sesudah makan',
      },
      {
        id: 'med-5',
        namaObat: 'Olanzapine',
        dosis: '5 mg',
        waktuMinum: ['malam'],
        aturanPakai: 'Malam hari sebelum istirahat',
      }
    ],
    jamMinumObat: {
      pagi: '07:30',
      siang: '13:00',
      malam: '20:30',
    },
    kepatuhanMinumObatPersen: 0,
    jadwalKontrol: {
      tanggal: '2026-09-23', // H-1 dari hari ini!
      jam: '10:30',
      dokter: 'dr. Ratna Anindita, Sp.KJ, M.Kes',
      poli: 'Poli Mood Disorder',
      statusReminder: {
        h3Sent: true,
        h1Sent: false,
        h0Sent: false,
      },
      konfirmasiKehadiran: 'akan_hadir',
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
    terakhirDihubungi: '2026-09-21 10:15',
    catatanKhusus: 'Suami aktif mengonfirmasi kepatuhan obat via WA.',
    statusPengawasan: 'dalam_pengawasan',
    notifikasiOtomatisAktif: true,
  },
  {
    id: 'pasien-3',
    noRM: 'RM-2022-1140',
    nama: 'Rahmat Hidayat',
    nik: '3201198701800005',
    noTelepon: '087855443322',
    usia: 44,
    jenisKelamin: 'L',
    alamat: 'Kampung Sawah Baru No. 88, Citeureup',
    diagnosaMedis: 'F20.3 Skizofrenia Tak Terinci (Riwayat Putus Obat)',
    dokterDPJP: 'dr. Hendra Wicaksono, Sp.KJ',
    poliklinik: 'Poli Jiwa Dewasa Subspesialis',
    riskLevel: 'rawan_putus_obat',
    caregiver: {
      nama: 'Wahyudi',
      hubungan: 'Adik Kandung',
      noTelepon: '081377889900',
      targetPenerima: 'caregiver',
    },
    obatRutin: [
      {
        id: 'med-6',
        namaObat: 'Haloperidol',
        dosis: '5 mg',
        waktuMinum: ['pagi', 'malam'],
        aturanPakai: 'Sesudah makan',
      },
      {
        id: 'med-7',
        namaObat: 'Chlorpromazine (CPZ)',
        dosis: '100 mg',
        waktuMinum: ['malam'],
        aturanPakai: 'Malam hari',
      }
    ],
    jamMinumObat: {
      pagi: '06:30',
      siang: '12:00',
      malam: '19:00',
    },
    kepatuhanMinumObatPersen: 0,
    jadwalKontrol: {
      tanggal: '2026-09-22', // HARI INI!
      jam: '08:30',
      dokter: 'dr. Hendra Wicaksono, Sp.KJ',
      poli: 'Poli Jiwa Dewasa',
      statusReminder: {
        h3Sent: true,
        h1Sent: true,
        h0Sent: false,
      },
      konfirmasiKehadiran: 'belum_konfirmasi',
    },
    jadwalIter: {
      adaIter: true,
      nomorResep: 'RSP-VIII-9102',
      tanggalIter: '2026-09-22', // HARI INI
      totalIterasi: 1,
      sisaIterasi: 1,
      statusReminder: { h2Sent: true, h0Sent: false },
      statusPengambilan: 'belum_diambil',
    },
    terakhirDihubungi: '2026-09-21 14:20',
    catatanKhusus: 'Perlu follow up berkala karena pasien pernah menghentikan konsumsi obat secara mandiri.',
    statusPengawasan: 'dalam_pengawasan',
    notifikasiOtomatisAktif: true,
  },
  {
    id: 'pasien-4',
    noRM: 'RM-2024-0551',
    nama: 'Nurul Aini',
    nik: '3201089203950002',
    noTelepon: '081900112233',
    usia: 29,
    jenisKelamin: 'P',
    alamat: 'Jl. Melati Indah No. 4, Sukaraja',
    diagnosaMedis: 'F32.2 Gangguan Depresif Berat tanpa Gejala Psikotik',
    dokterDPJP: 'dr. Farida Kusuma, Sp.KJ',
    poliklinik: 'Poli Psikoterapi & Konseling',
    riskLevel: 'stabil',
    caregiver: {
      nama: 'Hj. Mardiah',
      hubungan: 'Ibu Kandung',
      noTelepon: '082199881122',
      targetPenerima: 'keduanya',
    },
    obatRutin: [
      {
        id: 'med-8',
        namaObat: 'Sertraline',
        dosis: '50 mg',
        waktuMinum: ['pagi'],
        aturanPakai: 'Sesudah sarapan',
      },
      {
        id: 'med-9',
        namaObat: 'Alprazolam',
        dosis: '0.5 mg',
        waktuMinum: ['malam'],
        aturanPakai: 'Jika sangat gelisah/insomnia (p.r.n)',
      }
    ],
    jamMinumObat: {
      pagi: '07:00',
      siang: '12:00',
      malam: '21:00',
    },
    kepatuhanMinumObatPersen: 0,
    jadwalKontrol: {
      tanggal: '2026-10-02',
      jam: '11:00',
      dokter: 'dr. Farida Kusuma, Sp.KJ',
      poli: 'Poli Psikoterapi',
      statusReminder: {
        h3Sent: false,
        h1Sent: false,
        h0Sent: false,
      },
      konfirmasiKehadiran: 'belum_konfirmasi',
    },
    jadwalIter: {
      adaIter: true,
      nomorResep: 'RSP-IX-5589',
      tanggalIter: '2026-09-23', // Besok ambil obat iterasi
      totalIterasi: 3,
      sisaIterasi: 2, // Sisa 2x tebus obat farmasi
      statusReminder: { h2Sent: true, h0Sent: false },
      statusPengambilan: 'belum_diambil',
    },
    terakhirDihubungi: '2026-09-22 07:00',
    catatanKhusus: 'Memberikan respon positif terhadap pesan afirmasi psikologis mingguan.',
    statusPengawasan: 'dalam_pengawasan',
    notifikasiOtomatisAktif: true,
  },
  {
    id: 'pasien-5',
    noRM: 'RM-2023-0418',
    nama: 'Agus Setiawan',
    nik: '3201178406830004',
    noTelepon: '081299334455',
    usia: 41,
    jenisKelamin: 'L',
    alamat: 'Jl. Rinjani 2 No. 19, Babakan Madang',
    diagnosaMedis: 'F25.0 Gangguan Skizoafektif Tipe Manik',
    dokterDPJP: 'dr. Hendra Wicaksono, Sp.KJ',
    poliklinik: 'Poli Jiwa Dewasa Subspesialis',
    riskLevel: 'pengawasan',
    caregiver: {
      nama: 'Endang Sulastri',
      hubungan: 'Istri',
      noTelepon: '081388112299',
      targetPenerima: 'caregiver',
    },
    obatRutin: [
      {
        id: 'med-10',
        namaObat: 'Aripiprazole',
        dosis: '10 mg',
        waktuMinum: ['pagi'],
        aturanPakai: 'Sesudah sarapan',
      },
      {
        id: 'med-11',
        namaObat: 'Lithium Carbonate',
        dosis: '300 mg',
        waktuMinum: ['pagi', 'malam'],
        aturanPakai: 'Sesudah makan, minum air putih cukup',
      }
    ],
    jamMinumObat: {
      pagi: '07:00',
      siang: '12:30',
      malam: '20:00',
    },
    kepatuhanMinumObatPersen: 0,
    jadwalKontrol: {
      tanggal: '2026-09-25', // H-3
      jam: '09:30',
      dokter: 'dr. Hendra Wicaksono, Sp.KJ',
      poli: 'Poli Jiwa Dewasa',
      statusReminder: {
        h3Sent: false,
        h1Sent: false,
        h0Sent: false,
      },
      konfirmasiKehadiran: 'belum_konfirmasi',
    },
    jadwalIter: {
      adaIter: true,
      nomorResep: 'RSP-IX-3301',
      tanggalIter: '2026-09-24',
      totalIterasi: 2,
      sisaIterasi: 1,
      statusReminder: { h2Sent: false, h0Sent: false },
      statusPengambilan: 'belum_diambil',
    },
    terakhirDihubungi: '2026-09-20 19:35',
    catatanKhusus: 'Pasien telah pindah domisili ke luar kota dan saat ini di luar pengawasan rutin RSJ Naimata.',
    statusPengawasan: 'luar_pengawasan',
    notifikasiOtomatisAktif: false,
    alasanLuarPengawasan: 'Pindah domisili ke luar kota / di luar pengawasan faskes',
  }
];

export const INITIAL_MESSAGES: WhatsAppMessage[] = [
  {
    id: 'msg-001',
    patientId: 'pasien-1',
    patientName: 'Bambang Triyono',
    noRM: 'RM-2024-0102',
    recipientPhone: '081399887766',
    recipientName: 'Siti Aminah (Ibu)',
    recipientType: 'Caregiver',
    category: 'minum_obat',
    title: 'Pengingat Minum Obat Pagi',
    body: `🌅 *PENGINGAT MINUM OBAT PAGI*
*RSJ Prof. Dr. V. L. Ratumbuysang (RSJ Naimata)*

Selamat pagi, *Bapak/Ibu Siti Aminah*.

Mengingatkan jadwal minum obat pagi untuk pasien:
👤 *Nama Pasien:* Bambang Triyono
📋 *No. RM:* RM-2024-0102
👨‍⚕️ *Dokter DPJP:* dr. Hendra Wicaksono, Sp.KJ
⏰ *Waktu Minum:* 07:00 WIB

💊 *Daftar Obat Pagi & Aturan Pakai:*
• Risperidone 2 mg – Sesudah makan
• Trihexyphenidyl (THP) 2 mg – Pencegah kaku otot, sesudah makan

Mohon pastikan obat diminum teratur sesudah makan sesuai anjuran dokter demi kestabilan dan pemulihan kesehatan Bambang Triyono.

Jika ada keluhan efek samping atau pertanyaan, hubungi kami:
📞 *Hotline RSJ:* 0811-3811-9922

Terima kasih atas ketelatenan Bapak/Ibu Siti Aminah mendampingi pasien. Semoga lekas pulih dan sehat selalu. 🙏`,
    status: 'replied',
    scheduledAt: '2026-09-22 06:00',
    sentAt: '2026-09-22 06:00:12',
    deliveredAt: '2026-09-22 06:00:15',
    readAt: '2026-09-22 06:01:04',
    repliedAt: '2026-09-22 06:02:18',
    replyText: 'Terima kasih atas pengingatnya, obat sudah diminum.',
    bspProvider: 'Fonnte Indonesia (WABA Gateway)',
  },
  {
    id: 'msg-002',
    patientId: 'pasien-4',
    patientName: 'Nurul Aini',
    noRM: 'RM-2024-0551',
    recipientPhone: '081900112233',
    recipientName: 'Nurul Aini',
    recipientType: 'Pasien',
    category: 'minum_obat',
    title: 'Pengingat Minum Obat Pagi',
    body: `🌅 *PENGINGAT MINUM OBAT PAGI*
*RSJ Prof. Dr. V. L. Ratumbuysang (RSJ Naimata)*

Selamat pagi, *Ibu Nurul Aini*.

Mengingatkan jadwal minum obat pagi untuk Anda:
👤 *Nama Pasien:* Nurul Aini
📋 *No. RM:* RM-2024-0551
👨‍⚕️ *Dokter DPJP:* dr. Farida Kusuma, Sp.KJ
⏰ *Waktu Minum:* 07:00 WIB

💊 *Daftar Obat Pagi & Aturan Pakai:*
• Sertraline 50 mg – Sesudah sarapan

Mohon pastikan obat diminum teratur sesudah sarapan sesuai anjuran dr. Farida Kusuma, Sp.KJ demi kestabilan proses pemulihan.

Jika ada keluhan atau pertanyaan, hubungi kami:
📞 *Hotline RSJ:* 0811-3811-9922

Semoga lekas pulih dan senantiasa sehat selalu. 🙏`,
    status: 'replied',
    scheduledAt: '2026-09-22 06:00',
    sentAt: '2026-09-22 06:00:14',
    deliveredAt: '2026-09-22 06:00:18',
    readAt: '2026-09-22 06:03:10',
    repliedAt: '2026-09-22 06:05:40',
    replyText: 'Terima kasih, sudah diminum tepat waktu.',
    bspProvider: 'Fonnte Indonesia (WABA Gateway)',
  },
  {
    id: 'msg-003',
    patientId: 'pasien-3',
    patientName: 'Rahmat Hidayat',
    noRM: 'RM-2022-1140',
    recipientPhone: '081377889900',
    recipientName: 'Wahyudi (Adik)',
    recipientType: 'Caregiver',
    category: 'kontrol_dokter',
    title: 'Pengingat Kontrol Dokter',
    body: `🗓 *PENGINGAT JADWAL KONTROL DOKTER*
*RSJ Prof. Dr. V. L. Ratumbuysang (RSJ Naimata)*

Selamat pagi, *Bapak/Ibu Wahyudi*.

Kami menginformasikan jadwal konsultasi dan evaluasi rutin untuk pasien:
👤 *Nama Pasien:* Rahmat Hidayat
📋 *No. RM:* RM-2022-1140
📅 *Tanggal Kontrol:* Selasa, 22 September 2026
⏰ *Jam Layanan:* 08:30 WIB
🏥 *Poliklinik:* Poli Jiwa Dewasa Subspesialis
👨‍⚕️ *Dokter Pemeriksa:* dr. Hendra Wicaksono, Sp.KJ

Mohon hadir 15 menit sebelum jam pelayanan dengan membawa kartu identitas/BPJS dan sisa obat (jika ada).

Jika berhalangan hadir atau ingin konfirmasi jadwal, hubungi kami:
📞 *Hotline RSJ:* 0811-3811-9922

Terima kasih atas kerjasamanya. Salam sehat. 🙏`,
    status: 'read',
    scheduledAt: '2026-09-21 06:00',
    sentAt: '2026-09-21 06:00:08',
    deliveredAt: '2026-09-21 06:00:11',
    readAt: '2026-09-21 06:45:22',
    bspProvider: 'Fonnte Indonesia (WABA Gateway)',
  },
  {
    id: 'msg-004',
    patientId: 'pasien-2',
    patientName: 'Dewi Lestari',
    noRM: 'RM-2023-0891',
    recipientPhone: '081211223344',
    recipientName: 'Raditya Pratama (Suami)',
    recipientType: 'Caregiver',
    category: 'kontrol_dokter',
    title: 'Pengingat Kontrol Dokter',
    body: `🗓 *PENGINGAT JADWAL KONTROL DOKTER*
*RSJ Prof. Dr. V. L. Ratumbuysang (RSJ Naimata)*

Selamat pagi, *Bapak/Ibu Raditya Pratama*.

Kami menginformasikan jadwal konsultasi dan evaluasi rutin untuk pasien:
👤 *Nama Pasien:* Dewi Lestari
📋 *No. RM:* RM-2023-0891
📅 *Tanggal Kontrol:* Rabu, 23 September 2026
⏰ *Jam Layanan:* 10:30 WIB
🏥 *Poliklinik:* Poli Mood Disorder & Afektif
👨‍⚕️ *Dokter Pemeriksa:* dr. Ratna Anindita, Sp.KJ, M.Kes

Mohon hadir 15 menit sebelum jam pelayanan dengan membawa kartu identitas/BPJS dan sisa obat (jika ada).

Jika berhalangan hadir atau ingin konfirmasi jadwal, hubungi kami:
📞 *Hotline RSJ:* 0811-3811-9922

Terima kasih atas kerjasamanya. Salam sehat. 🙏`,
    status: 'replied',
    scheduledAt: '2026-09-20 06:00',
    sentAt: '2026-09-20 06:00:05',
    deliveredAt: '2026-09-20 06:00:09',
    readAt: '2026-09-20 06:12:33',
    repliedAt: '2026-09-20 06:15:02',
    replyText: 'Baik, kami siap hadir sesuai jadwal. Terima kasih.',
    bspProvider: 'Fonnte Indonesia (WABA Gateway)',
  },
  {
    id: 'msg-005',
    patientId: 'pasien-4',
    patientName: 'Nurul Aini',
    noRM: 'RM-2024-0551',
    recipientPhone: '082199881122',
    recipientName: 'Hj. Mardiah (Ibu)',
    recipientType: 'Caregiver',
    category: 'iter_resep',
    title: 'Pengingat Jadwal Iter',
    body: `🔄 *PENGINGAT JADWAL ITER*
Farmasi *RSJ Prof. Dr. V. L. Ratumbuysang (RSJ Naimata)*

Selamat pagi, *Bapak/Ibu Hj. Mardiah*.

Mengingatkan jadwal pengambilan obat lanjutan (*Jadwal Iter*) untuk pasien:
👤 *Nama Pasien:* Nurul Aini
📋 *No. RM:* RM-2024-0551
📑 *No. Resep:* RSP-IX-5589
📅 *Tanggal Pengambilan:* Rabu, 23 September 2026
🔢 *Status Iterasi:* Iter ke-2 (Sisa: 2x dari total 3x pengulangan)
🏥 *Lokasi:* Farmasi Rawat Jalan RSJ Naimata

⚠️ *KETENTUAN PENTING PENGAMBILAN JADWAL ITER:*
1. 🗓 *Wajib Tepat Tanggal:*
Pengambilan obat *HARUS tepat pada tanggal yang ditentukan (Rabu, 23 September 2026)*. Tidak diperkenankan mengambil lebih awal ataupun terlambat demi kepatuhan terapi dan ketersediaan stok obat.

2. 👥 *Ketentuan Kehadiran Pasien:*
✅ *BOLEH DIWAKILI:* Jadwal iter ke-2 ini *boleh diwakili* oleh keluarga/caregiver dengan membawa kartu berobat dan copy resep asli. (Catatan: Pengambilan iter ke-3 berikutnya wajib bersama pasien langsung).

📄 *Berkas yang Wajib Dibawa ke Farmasi:*
• Kartu Identitas Pasien (KTP / Kartu BPJS Asli)
• Kartu Berobat Pasien RSJ Naimata
• Salinan / Copy Resep Iter asli yang masih berlaku

Jika ada kendala mendesak terkait jadwal pengambilan obat, silakan hubungi:
📞 *Hotline Farmasi/RSJ:* 0811-3811-9922

Terima kasih atas ketertiban dan kerjasamanya demi pemulihan optimal Nurul Aini. Salam sehat. 🙏`,
    status: 'delivered',
    scheduledAt: '2026-09-21 06:00',
    sentAt: '2026-09-21 06:00:19',
    deliveredAt: '2026-09-21 06:00:23',
    bspProvider: 'Fonnte Indonesia (WABA Gateway)',
  },
  {
    id: 'msg-006',
    patientId: 'pasien-5',
    patientName: 'Agus Setiawan',
    noRM: 'RM-2023-0418',
    recipientPhone: '081388112299',
    recipientName: 'Endang Sulastri (Istri)',
    recipientType: 'Caregiver',
    category: 'minum_obat',
    title: 'Pengingat Minum Obat Pagi',
    body: `🌅 *PENGINGAT MINUM OBAT PAGI*
*RSJ Prof. Dr. V. L. Ratumbuysang (RSJ Naimata)*

Selamat pagi, *Bapak/Ibu Endang Sulastri*.

Mengingatkan jadwal minum obat pagi untuk pasien:
👤 *Nama Pasien:* Agus Setiawan
📋 *No. RM:* RM-2023-0418
👨‍⚕️ *Dokter DPJP:* dr. Hendra Wicaksono, Sp.KJ
⏰ *Waktu Minum:* 07:00 WIB

💊 *Daftar Obat Pagi & Aturan Pakai:*
• Aripiprazole 10 mg – Sesudah sarapan
• Lithium Carbonate 300 mg – Sesudah makan, minum air putih cukup

Mohon pastikan obat diminum teratur sesudah makan sesuai anjuran dokter demi kestabilan dan pemulihan kesehatan Agus Setiawan.

Jika ada keluhan efek samping atau pertanyaan, hubungi kami:
📞 *Hotline RSJ:* 0811-3811-9922

Terima kasih atas ketelatenan Bapak/Ibu Endang Sulastri mendampingi pasien. Semoga lekas pulih dan sehat selalu. 🙏`,
    status: 'replied',
    scheduledAt: '2026-09-21 06:00',
    sentAt: '2026-09-21 06:00:10',
    deliveredAt: '2026-09-21 06:00:14',
    readAt: '2026-09-21 06:10:45',
    repliedAt: '2026-09-21 06:12:19',
    replyText: 'Terima kasih, obat sudah diminum setelah sarapan.',
    bspProvider: 'Fonnte Indonesia (WABA Gateway)',
  },
  {
    id: 'msg-007',
    patientId: 'pasien-3',
    patientName: 'Rahmat Hidayat',
    noRM: 'RM-2022-1140',
    recipientPhone: '087855443322',
    recipientName: 'Rahmat Hidayat',
    recipientType: 'Pasien',
    category: 'minum_obat',
    title: 'Pengingat Minum Obat Pagi',
    body: `🌅 *PENGINGAT MINUM OBAT PAGI*
*RSJ Prof. Dr. V. L. Ratumbuysang (RSJ Naimata)*

Selamat pagi, *Bapak Rahmat Hidayat*.

Mengingatkan jadwal minum obat pagi untuk Anda:
👤 *Nama Pasien:* Rahmat Hidayat
📋 *No. RM:* RM-2022-1140
👨‍⚕️ *Dokter DPJP:* dr. Hendra Wicaksono, Sp.KJ
⏰ *Waktu Minum:* 06:30 WIB

💊 *Daftar Obat Pagi & Aturan Pakai:*
• Haloperidol 5 mg – Sesudah makan

Mohon pastikan obat diminum teratur sesudah makan sesuai anjuran dr. Hendra Wicaksono, Sp.KJ demi kestabilan proses pemulihan.

Jika ada keluhan efek samping atau pertanyaan, hubungi kami:
📞 *Hotline RSJ:* 0811-3811-9922

Semoga lekas pulih dan senantiasa sehat selalu. 🙏`,
    status: 'delivered',
    scheduledAt: '2026-09-21 06:00',
    sentAt: '2026-09-21 06:00:03',
    deliveredAt: '2026-09-21 06:00:07',
    bspProvider: 'Fonnte Indonesia (WABA Gateway)',
  }
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
