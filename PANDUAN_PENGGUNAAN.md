# PANDUAN PENGGUNAAN APLIKASI "SIDORA"
### Sistem Informasi Digital Pengobatan Rawat Jalan
**Versi:** Prototype V2.0 (Edisi Presentasi & Sistem Otomatis Terjadwal)  
**Target Pengguna:** Administrator RSJ, Perawat Poliklinik Jiwa, Staf Instalasi Farmasi, Dokter Penanggung Jawab Pelayanan (DPJP), dan Tim Penguji Prototype.

---

## DAFTAR ISI
1. [Tentang Sidora & Keunggulan Sistem Otomatis](#1-tentang-sidora--keunggulan-sistem-otomatis)
2. [Struktur 3 Menu Utama (Sederhana untuk Presentasi)](#2-struktur-3-menu-utama-sederhana-untuk-presentasi)
   - [Menu 1: Dasbor Utama (Monitoring & Grafik Performa)](#menu-1-dasbor-utama-monitoring--grafik-performa)
   - [Menu 2: Data Pasien & Caregiver (Manajemen Profil Pasien)](#menu-2-data-pasien--caregiver-manajemen-profil-pasien)
   - [Menu 3: Setting Pesan Otomatis (Set Sekali, Otomatis Selamanya)](#menu-3-setting-pesan-otomatis-set-sekali-otomatis-selamanya)
3. [Alat Tambahan Pendukung Presentasi](#3-alat-tambahan-pendukung-presentasi)
   - [Simulator Chat WhatsApp (Interaktif & Balasan Pasien)](#simulator-chat-whatsapp-interaktif--balasan-pasien)
   - [Laporan & Log Riwayat Pesan Terkirim](#laporan--log-riwayat-pesan-terkirim)
4. [Panduan Uji Coba ke Nomor WhatsApp Pribadi / HP Sendiri](#4-panduan-uji-coba-ke-nomor-whatsapp-pribadi--hp-sendiri)
5. [Tanya Jawab & Tips Presentasi (FAQ)](#5-tanya-jawab--tips-presentasi-faq)

---

## 1. Tentang Sidora & Keunggulan Sistem Otomatis

**Sidora** dirancang khusus agar petugas RSJ **tidak perlu repot mengirim pesan WhatsApp satu per satu secara manual setiap hari**.

### Konsep "Set Sekali & Berjalan Otomatis":
1. **Setting di Awal Satu Kali**: Administrator menentukan jam pengiriman harian (misalnya pukul **06:00 WIB** pagi) dan memilih hari pengingat untuk jadwal kontrol & iterasi farmasi (misal **H-3**, **H-2**, **H-1**, dan **Hari H**).
2. **Sistem Mengirim Otomatis**: Setiap hari pada jam yang telah ditentukan, sistem background Sidora akan mengecek data pasien yang perlu diingatkan lalu mengirimkan pesan WhatsApp ke nomor pasien atau nomor keluarga/caregiver secara otomatis.
3. **Bisa Diedit / Dijeda Kapan Saja**: Tombol switch Master Otomasi dapat diaktifkan atau dinonaktifkan dengan satu kali klik.

---

## 2. Struktur 3 Menu Utama (Sederhana untuk Presentasi)

Untuk memudahkan presentasi ke pihak direksi, rekan kerja, maupun calon pengguna tanpa membingungkan, Sidora difokuskan pada **3 Menu Utama**:

### Menu 1: Dasbor Utama (Monitoring & Grafik Performa)
Berfungsi sebagai pusat monitoring grafis untuk melihat performa pesan secara real-time:
* **Statistik Utama**:
  - **Pesan Terkirim**: Total pesan yang dikirim oleh sistem ke gateway WhatsApp.
  - **Diterima (Delivered)**: Centang dua abu-abu pada WhatsApp penerima.
  - **Terbaca (Read)**: Centang dua biru ketika pasien/keluarga membuka pesan.
  - **Terbalas (Replied)**: Pasien yang membalas pesan (misal ketik `1` untuk konfirmasi minum obat atau konfirmasi hadir kontrol).
  - **Tingkat Kepatuhan Obat**: Persentase kepatuhan pasien minum obat yang terakumulasi.
* **Grafik Visual Harian**: Tren pengiriman 7 hari terakhir (Terkirim, Diterima, Terbaca, Terbalas).
* **Pasien Perhatian Hari Ini**: Daftar pasien yang jadwal kontrolnya atau pengambilan obat iternya jatuh pada hari ini.
* **Tombol Demo Cepat**: Tombol **"Demo: Kirim Jam 06:00 Sekarang"** untuk memperagakan proses pengiriman otomatis saat presentasi tanpa harus menunggu jam 6 pagi tiba.

---

### Menu 2: Data Pasien & Caregiver (Manajemen Profil Pasien)
Digunakan untuk mencatat dan memperbarui informasi klinis pasien rawat jalan:
* **Pencarian & Filter**: Berdasarkan nama pasien, nomor rekam medis (No. RM), atau dokter penanggung jawab (DPJP).
* **Profil Pasien**:
  - Nama, No. RM, Nomor WhatsApp Pasien, Diagnosa Kejiwaan (contoh: *F20.0 Skizofrenia Paranoik*, *F31 Bipolar*).
* **Caregiver / Pendamping**:
  - Nama keluarga pendamping, hubungan (Istri, Suami, Orang Tua, Anak), dan nomor WhatsApp aktif caregiver. Notifikasi otomatis dapat diarahkan ke nomor caregiver untuk pasien yang belum mandiri.
* **Daftar Obat Rutin**:
  - Nama obat psikiatri (Risperidone, Clozapine, Haloperidol, THP, dll.), dosis, dan aturan pakai.
* **Jadwal Kontrol & Jadwal Iterasi Resep (Iter)**:
  - Tanggal kontrol dokter berikutnya dan tanggal batas pengambilan iterasi obat di farmasi.

---

### Menu 3: Setting Pesan Otomatis (Set Sekali, Otomatis Selamanya)
Menu satu pintu untuk mengelola seluruh logika pengiriman otomatis:
1. **Master Switch Otomasi**: Mengaktifkan atau menonaktifkan pengiriman terjadwal.
2. **Otomasi Pengingat Minum Obat Harian**:
   - Pilihan jam pengiriman (default: **06:00 WIB** setiap pagi).
   - Target penerima: Pasien langsung atau Caregiver / Keluarga.
3. **Otomasi Pengingat Kontrol Dokter**:
   - Pilihan hari pengiriman: Centang opsi **H-3**, **H-2**, **H-1**, dan **Hari H**.
   - Jam pengiriman pengingat kontrol (misal 08:00 WIB).
4. **Otomasi Pengingat Jadwal Iterasi Resep Farmasi (Iter)**:
   - Pilihan hari pengiriman: Centang opsi **H-3**, **H-2**, **H-1**, dan **Hari H**.
   - Jam pengiriman pengingat farmasi (misal 09:00 WIB).
5. **Editor Template Pesan**:
   - Sesuaikan redaksi kalimat pesan dengan variabel otomatis seperti `{nama_pasien}`, `{daftar_obat_pagi}`, `{tanggal_kontrol}`, `{nomor_resep}`, dan `{hotline_rsj}`.
6. **Uji Coba Pengiriman ke Nomor Tester Pribadi**:
   - Kirimkan contoh pesan ke nomor WhatsApp Anda sendiri atau rekan sebelum sistem berjalan penuh.
7. **Simulasi Demo Seketika**:
   - Tombol **"Jalankan Otomasi Sekarang (Demo Presentasi)"** untuk mendemonstrasikan hasil pengiriman secara langsung.

---

## 3. Alat Tambahan Pendukung Presentasi

Di bagian kanan bar navigasi atau footer, tersedia 2 alat presentasi:
* **Simulator Chat WhatsApp**:
  - Menampilkan layar smartphone virtual di mana Anda bisa melihat tampilan pesan persis seperti di aplikasi WhatsApp asli pasien, serta mencoba membalas pesan (misal ketik `1`).
* **Laporan & Log Riwayat**:
  - Menampilkan audit trail lengkap pesan yang telah dikirim, waktu terkirim, status penerimaan, dan balasan pasien.

---

## 4. Panduan Uji Coba ke Nomor WhatsApp Pribadi / HP Sendiri

1. Buka menu **"Setting Pesan Otomatis"**.
2. Gulir ke bagian **"Uji Coba Kirim Pesan (Sandbox Tester)"**.
3. Masukkan nama dan nomor WhatsApp Anda atau keluarga terdekat (format `08xxxxxxxxxx`).
4. Pilih jenis pesan yang ingin diuji:
   - **Minum Obat Pagi**
   - **Jadwal Kontrol Dokter (H-3)**
   - **Jadwal Iterasi Resep Farmasi (Iter)**
5. Klik **"Kirim Pesan Uji Coba"**.
6. Pesan akan terkirim ke antrean simulator dan Anda juga dapat membuka langsung di WhatsApp asli melalui tombol yang tersedia.

---

## 5. Tanya Jawab & Tips Presentasi (FAQ)

**Q: Apakah petugas harus mengklik tombol kirim setiap hari?**  
*A: Tidak. Cukup atur jadwal di menu "Setting Pesan Otomatis" sekali saja. Sistem akan berjalan otomatis di latar belakang setiap hari pada jam yang ditentukan (misal jam 06:00 pagi).*

**Q: Bagaimana cara memperagakan sistem otomatis ini saat presentasi tanpa menunggu jam 6 pagi?**  
*A: Gunakan tombol hijau **"Demo: Kirim Jam 06:00 Sekarang"** di Dasbor Utama atau menu Setting Pesan Otomatis. Sistem akan langsung mengeksekusi logika otomatisasi dan menampilkan notifikasi sukses.*

**Q: Jika pasien membalas pesan, apa yang terjadi?**  
*A: Sistem mencatat balasan tersebut di log laporan. Jika pasien membalas angka `1` atau kata `sudah`, sistem secara cerdas menaikkan persentase kepatuhan minum obat pasien.*
