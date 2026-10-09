/**
 * Script: reset_templates.cjs
 * Paksa update semua template di Supabase dengan redaksi terbaru dari initialData.ts
 */
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Baca .env.local
const envPath = path.resolve(__dirname, '..', '.env.local');
const env = fs.readFileSync(envPath, 'utf8');
const url = env.match(/VITE_SUPABASE_URL=(.+)/)?.[1]?.trim();
const key = env.match(/VITE_SUPABASE_ANON_KEY=(.+)/)?.[1]?.trim();

if (!url || !key) {
  console.error('❌ VITE_SUPABASE_URL atau VITE_SUPABASE_ANON_KEY tidak ditemukan di .env.local');
  process.exit(1);
}

const supabase = createClient(url, key);

// Template terbaru dengan sapaan spesifik gender ({sapaan}) dan konfirmasi balasan
const TEMPLATES = [
  {
    id: 'tmpl-obat-pagi',
    category: 'minum_obat',
    kode: 'OBAT_PAGI',
    nama: 'Pengingat Minum Obat Pagi 🌅',
    deskripsi: 'Pesan simpel pengingat minum obat pagi sesuai data pasien.',
    defaultTime: '06:00',
    active: true,
    templateText: `Hallo, selamat pagi {sapaan} {nama_pasien}.

Perkenalkan saya Ners Nofy dari Poliklinik Rumah Sakit Jiwa Naimata.

Ijin mengingatkan kepada {sapaan} untuk minum obat.
Ini jenis obat beserta dosisnya yang {sapaan} minum pagi ini:
{daftar_obat_pagi}

Tetap semangat yaaaa minum obatnya. Salam sehat selalu. Tuhan memberkati....

Mohon informasi baliknya ya jika pesan ini sudah {sapaan} terima...`,
  },
  {
    id: 'tmpl-obat-siang',
    category: 'minum_obat',
    kode: 'OBAT_SIANG',
    nama: 'Pengingat Minum Obat Siang ☀️',
    deskripsi: 'Pesan simpel pengingat minum obat siang sesuai data pasien.',
    defaultTime: '12:00',
    active: true,
    templateText: `Hallo, selamat siang {sapaan} {nama_pasien}.

Perkenalkan saya Ners Nofy dari Poliklinik Rumah Sakit Jiwa Naimata.

Ijin mengingatkan kepada {sapaan} untuk minum obat.
Ini jenis obat beserta dosisnya yang {sapaan} minum siang ini:
{daftar_obat_siang}

Tetap semangat yaaaa minum obatnya. Salam sehat selalu. Tuhan memberkati....

Mohon informasi baliknya ya jika pesan ini sudah {sapaan} terima...`,
  },
  {
    id: 'tmpl-obat-malam',
    category: 'minum_obat',
    kode: 'OBAT_MALAM',
    nama: 'Pengingat Minum Obat Malam 🌙',
    deskripsi: 'Pesan simpel pengingat minum obat malam sesuai data pasien.',
    defaultTime: '18:00',
    active: true,
    templateText: `Hallo, selamat malam {sapaan} {nama_pasien}.

Perkenalkan saya Ners Nofy dari Poliklinik Rumah Sakit Jiwa Naimata.

Ijin mengingatkan kepada {sapaan} untuk minum obat.
Ini jenis obat beserta dosisnya yang {sapaan} minum malam ini:
{daftar_obat_malam}

Tetap semangat yaaaa minum obatnya. Salam sehat selalu. Tuhan memberkati....

Mohon informasi baliknya ya jika pesan ini sudah {sapaan} terima...`,
  },
  {
    id: 'tmpl-kontrol-dokter',
    category: 'kontrol_dokter',
    kode: 'KONTROL_DOKTER',
    nama: 'Pengingat Jadwal Kontrol',
    deskripsi: 'Pesan simpel pengingat jadwal kontrol pasien.',
    defaultTime: '06:00',
    active: true,
    templateText: `Hallo, selamat pagi {sapaan} {nama_pasien}.

Perkenalkan saya Ners Nofy dari Poliklinik Rumah Sakit Jiwa Naimata.

Ijin mengingatkan kepada {sapaan} untuk datang kontrol di Poliklinik Jiwa pada hari {tanggal_kontrol} pukul {jam_kontrol} WITA.

Mohon informasi baliknya ya jika pesan ini sudah {sapaan} terima...`,
  },
  {
    id: 'tmpl-iter-resep',
    category: 'iter_resep',
    kode: 'ITER_RESEP',
    nama: 'Pengingat Jadwal Iter',
    deskripsi: 'Pesan simpel pengingat jadwal iterasi pengambilan obat farmasi.',
    defaultTime: '06:00',
    active: true,
    templateText: `Hallo, selamat pagi {sapaan} {nama_pasien}.

Perkenalkan saya Ners Nofy dari Poliklinik Rumah Sakit Jiwa Naimata.

Ijin mengingatkan kepada {sapaan} untuk datang kontrol iter {iter_ke_teks} di Poliklinik Jiwa pada hari {tanggal_iter} pukul {jam_iter} WITA.

Mohon informasi baliknya ya jika pesan ini sudah {sapaan} terima...{ketentuan_iter3_tambahan}`,
  },
  {
    id: 'tmpl-edukasi',
    category: 'edukasi_rsj',
    kode: 'EDUKASI_KELUARGA',
    nama: 'Pesan Dukungan Semangat Keluarga',
    deskripsi: 'Pesan singkat penyemangat dan apresiasi bagi keluarga/pendamping dari RSJ Naimata.',
    defaultTime: '06:00',
    active: true,
    templateText: `Hallo, selamat pagi {sapaan} {nama_pasien}.

Perkenalkan saya Ners Nofy dari Poliklinik Rumah Sakit Jiwa Naimata.

Terima kasih atas perhatian dan ketelatenan dalam mendampingi pengobatan. Semangat dan kebersamaan keluarga adalah kunci utama proses pemulihan.

Salam sehat selalu. Tuhan memberkati....`,
  },
];

async function main() {
  console.log(`\n🔄 Memulai reset template ke Supabase (${url})...\n`);

  const rows = TEMPLATES.map(t => ({ id: t.id, data: t }));

  const { error } = await supabase
    .from('message_templates')
    .upsert(rows, { onConflict: 'id' });

  if (error) {
    console.error('❌ Gagal upsert template:', error.message);
    process.exit(1);
  }

  console.log(`✅ Berhasil update ${TEMPLATES.length} template:\n`);
  TEMPLATES.forEach(t => console.log(`   • [${t.id}] ${t.nama}`));
  console.log('\n🎉 Selesai! Refresh aplikasi untuk melihat perubahan.\n');
}

main();
