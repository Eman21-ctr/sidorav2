import { useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Pill, 
  Calendar, 
  RefreshCw, 
  Phone, 
  UserCheck, 
  AlertCircle, 
  Edit3, 
  Trash2, 
  X, 
  Save, 
  MessageSquare,
  Clock,
  HelpCircle,
  UserX,
  ShieldAlert,
  Sparkles,
  Download
} from 'lucide-react';
import { Patient, RiskLevel, MedicationItem, SupervisionStatus } from '../types';
import * as XLSX from 'xlsx';

interface PatientManagementProps {
  patients: Patient[];
  onSavePatient: (patient: Patient) => void;
  onDeletePatient: (patientId: string) => void;
  onDeleteAllPatients?: () => void;
  onLoadSamplePatients?: () => void;
  onTogglePatientSupervision?: (patientId: string) => void;
  onOpenSimulatorForPatient: (patientId: string) => void;
}

export const PatientManagement = ({
  patients,
  onSavePatient,
  onDeletePatient,
  onDeleteAllPatients,
  onLoadSamplePatients,
  onTogglePatientSupervision,
  onOpenSimulatorForPatient,
}: PatientManagementProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRisk, setFilterRisk] = useState<'all' | RiskLevel>('all');
  const [filterSupervision, setFilterSupervision] = useState<'all' | 'dalam_pengawasan' | 'luar_pengawasan'>('all');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Form State for Create / Edit
  const [formData, setFormData] = useState<Partial<Patient>>({});

  // Filtered patients
  const filteredPatients = patients.filter((p) => {
    const matchSearch = 
      p.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.noRM.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.diagnosaMedis.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.caregiver.nama.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchRisk = filterRisk === 'all' || p.riskLevel === filterRisk;

    const isSupervised = p.notifikasiOtomatisAktif !== false && p.statusPengawasan !== 'luar_pengawasan';
    const matchSupervision = 
      filterSupervision === 'all' ||
      (filterSupervision === 'dalam_pengawasan' && isSupervised) ||
      (filterSupervision === 'luar_pengawasan' && !isSupervised);

    return matchSearch && matchRisk && matchSupervision;
  });

  const handleOpenAddModal = () => {
    setIsEditing(false);
    setFormData({
      id: `pasien-${Date.now()}`,
      noRM: `RM-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 900) + 100)}`,
      nama: '',
      nik: '',
      noTelepon: '',
      usia: 30,
      jenisKelamin: 'L',
      alamat: '',
      diagnosaMedis: 'F20.0 Skizofrenia Paranoid',
      dokterDPJP: 'dr. Hendra Wicaksono, Sp.KJ',
      poliklinik: 'Poli Jiwa Dewasa Subspesialis',
      riskLevel: 'stabil',
      caregiver: {
        nama: '',
        hubungan: 'Ibu Kandung',
        noTelepon: '',
        targetPenerima: 'keduanya',
      },
      obatRutin: [
        {
          id: `med-${Date.now()}`,
          namaObat: 'Risperidone',
          dosis: '2 mg',
          waktuMinum: ['pagi', 'malam'],
          aturanPakai: 'Sesudah makan',
        }
      ],
      jamMinumObat: {
        pagi: '07:00',
        siang: '12:30',
        malam: '20:00',
      },
      kepatuhanMinumObatPersen: 0,
      jadwalKontrol: {
        tanggal: '2026-10-15',
        jam: '09:00',
        dokter: 'dr. Hendra Wicaksono, Sp.KJ',
        poli: 'Poli Jiwa Dewasa',
        statusReminder: { h3Sent: false, h1Sent: false, h0Sent: false },
        konfirmasiKehadiran: 'belum_konfirmasi',
      },
      jadwalIter: {
        adaIter: true,
        nomorResep: `RSP-X-${Math.floor(Math.random() * 8999 + 1000)}`,
        tanggalIter: '2026-10-01',
        totalIterasi: 2,
        sisaIterasi: 2,
        statusReminder: { h2Sent: false, h0Sent: false },
        statusPengambilan: 'belum_diambil',
      },
      catatanKhusus: '',
      statusPengawasan: 'dalam_pengawasan',
      notifikasiOtomatisAktif: true,
      alasanLuarPengawasan: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (patient: Patient) => {
    setIsEditing(true);
    setFormData({
      ...JSON.parse(JSON.stringify(patient)),
      statusPengawasan: patient.statusPengawasan || 'dalam_pengawasan',
      notifikasiOtomatisAktif: patient.notifikasiOtomatisAktif !== false,
      alasanLuarPengawasan: patient.alasanLuarPengawasan || '',
    });
    setIsModalOpen(true);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama || !formData.noRM) return;
    
    const isSupervised = formData.statusPengawasan === 'dalam_pengawasan';
    const finalPatientData: Patient = {
      ...(formData as Patient),
      statusPengawasan: formData.statusPengawasan || 'dalam_pengawasan',
      notifikasiOtomatisAktif: isSupervised,
    };

    onSavePatient(finalPatientData);
    setIsModalOpen(false);
    if (selectedPatient?.id === formData.id) {
      setSelectedPatient(finalPatientData);
    }
  };

  const handleAddMedication = () => {
    const currentMeds = formData.obatRutin || [];
    const newMed: MedicationItem = {
      id: `med-${Date.now()}`,
      namaObat: '',
      dosis: '2 mg',
      waktuMinum: ['pagi'],
      aturanPakai: 'Sesudah makan',
    };
    setFormData({ ...formData, obatRutin: [...currentMeds, newMed] });
  };

  const handleRemoveMedication = (id: string) => {
    const currentMeds = formData.obatRutin || [];
    setFormData({ ...formData, obatRutin: currentMeds.filter(m => m.id !== id) });
  };

  const handleExportPatientsExcel = () => {
    if (filteredPatients.length === 0) {
      alert('Tidak ada data pasien untuk diekspor.');
      return;
    }

    const headers = [
      'No. RM',
      'Nama Pasien',
      'NIK',
      'Jenis Kelamin',
      'Usia (Th)',
      'No. WhatsApp Pasien',
      'Alamat',
      'Diagnosa Medis',
      'Dokter DPJP',
      'Poliklinik',
      'Status Pengawasan',
      'Tingkat Risiko',
      'Kepatuhan Obat (%)',
      'Nama Caregiver',
      'Hubungan Caregiver',
      'No. WhatsApp Caregiver',
      'Sasaran Pesan',
      'Daftar Obat Rutin',
      'Jadwal Kontrol Berikutnya',
      'Dokter Kontrol',
      'Poli Kontrol',
      'Ada Iter Resep',
      'No. Resep Iter',
      'Tanggal Iter',
      'Sisa Iterasi',
      'Catatan Khusus',
    ];

    const rows = filteredPatients.map(p => [
      p.noRM,
      p.nama,
      p.nik || '-',
      p.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan',
      p.usia,
      p.noTelepon,
      p.alamat || '-',
      p.diagnosaMedis,
      p.dokterDPJP,
      p.poliklinik,
      p.statusPengawasan === 'dalam_pengawasan' ? 'Dalam Pengawasan' : 'Luar Pengawasan',
      p.riskLevel === 'stabil' ? 'Stabil (Rutin)' : p.riskLevel === 'pengawasan' ? 'Perlu Pengawasan' : 'Rawan Putus Obat',
      p.kepatuhanMinumObatPersen,
      p.caregiver?.nama || '-',
      p.caregiver?.hubungan || '-',
      p.caregiver?.noTelepon || '-',
      p.caregiver?.targetPenerima === 'pasien' ? 'Pasien Saja' : p.caregiver?.targetPenerima === 'caregiver' ? 'Caregiver Saja' : 'Keduanya',
      p.obatRutin?.map(m => `${m.namaObat} ${m.dosis} (${m.aturanPakai})`).join('; ') || '-',
      p.jadwalKontrol?.tanggal ? `${p.jadwalKontrol.tanggal} ${p.jadwalKontrol.jam}` : '-',
      p.jadwalKontrol?.dokter || '-',
      p.jadwalKontrol?.poli || '-',
      p.jadwalIter?.adaIter ? 'Ya' : 'Tidak',
      p.jadwalIter?.nomorResep || '-',
      p.jadwalIter?.tanggalIter || '-',
      p.jadwalIter?.sisaIterasi != null ? `${p.jadwalIter.sisaIterasi}x dari ${p.jadwalIter.totalIterasi}x` : '-',
      p.catatanKhusus || '-',
    ]);

    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);

    const colWidths = headers.map((h, i) => {
      const maxLen = Math.max(
        h.length,
        ...rows.map(r => (r[i] != null ? String(r[i]).length : 0))
      );
      return { wch: Math.min(Math.max(maxLen + 3, 12), 45) };
    });
    worksheet['!cols'] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Pasien RSJ');

    const fileName = `Data_Pasien_RSJ_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Manajemen Profil Pasien RSJ &amp; Caregiver
          </h2>
          <p className="text-xs text-slate-500">
            Kelola data rekam medis, kontak keluarga, jadwal obat harian, kontrol dokter, dan Jadwal Iter farmasi.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onDeleteAllPatients && patients.length > 0 && (
            <button
              onClick={onDeleteAllPatients}
              className="px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-all flex items-center gap-1.5"
              title="Hapus semua data pasien (misal untuk membersihkan data contoh demo)"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-500" />
              Kosongkan Data Pasien
            </button>
          )}
          <button
            onClick={handleExportPatientsExcel}
            disabled={filteredPatients.length === 0}
            className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 transition-all flex items-center gap-1.5 shadow-2xs disabled:opacity-50"
            title="Unduh daftar data pasien dalam format Excel (.xlsx)"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            Ekspor Excel (.xlsx)
          </button>
          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Tambah Pasien Baru
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama pasien, No. RM, diagnosa, atau caregiver..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
          />
        </div>

        {/* Filter Supervision & Risk */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={filterSupervision}
            onChange={(e) => setFilterSupervision(e.target.value as any)}
            className="text-xs sm:text-sm py-2 px-3 rounded-xl border border-slate-200 bg-white font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            <option value="all">Semua Status Pengawasan</option>
            <option value="dalam_pengawasan">🟢 Dalam Pengawasan (WA Aktif)</option>
            <option value="luar_pengawasan">⛔ Di Luar Pengawasan (Otomasi Off)</option>
          </select>

          <div className="flex items-center gap-1.5">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={filterRisk}
              onChange={(e) => setFilterRisk(e.target.value as any)}
              className="text-xs sm:text-sm py-2 px-3 rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="all">Semua Kondisi Kepatuhan</option>
              <option value="stabil">Kondisi Stabil</option>
              <option value="pengawasan">Perlu Pengawasan</option>
              <option value="rawan_putus_obat">Rawan Putus Obat</option>
            </select>
          </div>
        </div>
      </div>

      {/* Patient Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPatients.map((patient) => {
          const isRiskHigh = patient.riskLevel === 'rawan_putus_obat';
          const isRiskMedium = patient.riskLevel === 'pengawasan';
          const isSupervised = patient.notifikasiOtomatisAktif !== false && patient.statusPengawasan !== 'luar_pengawasan';

          return (
            <div
              key={patient.id}
              className={`bg-white rounded-2xl border transition-all p-5 flex flex-col justify-between ${
                isSupervised 
                  ? 'border-slate-200/90 hover:border-emerald-300 hover:shadow-md' 
                  : 'border-slate-200 bg-slate-50/40 opacity-90'
              }`}
            >
              <div className="space-y-3">
                {/* Header Card */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold">
                        {patient.noRM}
                      </span>
                      {isSupervised ? (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Aktif RSJ
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 border border-slate-300">
                          Di Luar Pengawasan
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-slate-900 text-base mt-1 leading-snug">
                      {patient.nama}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {patient.usia} th • {patient.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan'}
                    </p>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider ${
                      isRiskHigh
                        ? 'bg-red-100 text-red-700 border border-red-200'
                        : isRiskMedium
                        ? 'bg-amber-100 text-amber-700 border border-amber-200'
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    }`}
                  >
                    {patient.riskLevel.replace('_', ' ')}
                  </span>
                </div>

                {/* Diagnosa */}
                <div className="text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-slate-700">
                  <span className="font-semibold text-slate-900 block mb-0.5">Diagnosa Psikiatri:</span>
                  {patient.diagnosaMedis}
                </div>

                {/* Caregiver Info */}
                <div className="text-xs space-y-1 text-slate-600">
                  <div className="flex items-center gap-1.5 font-medium text-slate-800">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                    Caregiver: {patient.caregiver.nama} ({patient.caregiver.hubungan})
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-500 pl-5">
                    <Phone className="w-3 h-3" />
                    WA: {patient.caregiver.noTelepon || '-'} (Kirim ke: {patient.caregiver.targetPenerima})
                  </div>
                </div>

                {/* Status Badges: Obat, Kontrol, Iterasi */}
                <div className="pt-2 border-t border-slate-100 space-y-1.5 text-xs">
                  {/* Obat Rutin */}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 flex items-center gap-1">
                      <Pill className="w-3.5 h-3.5 text-blue-500" />
                      Obat Rutin:
                    </span>
                    <span className="font-medium text-slate-800">
                      {patient.obatRutin.length} jenis ({patient.kepatuhanMinumObatPersen}% patuh)
                    </span>
                  </div>

                  {/* Kontrol Dokter */}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-purple-500" />
                      Kontrol Sp.KJ:
                    </span>
                    <span className="font-medium text-purple-800">
                      {patient.jadwalKontrol.tanggal}
                    </span>
                  </div>

                  {/* Iter Resep Farmasi */}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 flex items-center gap-1">
                      <RefreshCw className="w-3.5 h-3.5 text-teal-500" />
                      Jadwal Iter:
                    </span>
                    <span className="font-medium text-teal-800">
                      {patient.jadwalIter.adaIter 
                        ? `${patient.jadwalIter.tanggalIter} (Sisa ${patient.jadwalIter.sisaIterasi}x)` 
                        : 'Tidak ada iter'}
                    </span>
                  </div>
                </div>

                {/* Status Pengawasan RSJ & Otomasi WA Toggle */}
                <div className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 text-xs transition-colors ${
                  isSupervised
                    ? 'bg-emerald-50/60 border-emerald-200/80 text-emerald-950'
                    : 'bg-amber-50/80 border-amber-200 text-amber-950'
                }`}>
                  <div className="min-w-0">
                    <div className="font-bold flex items-center gap-1.5 text-[11px]">
                      {isSupervised ? (
                        <>
                          <UserCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>Pengawasan RSJ: Aktif</span>
                        </>
                      ) : (
                        <>
                          <UserX className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                          <span>Di Luar Pengawasan</span>
                        </>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5 truncate">
                      {isSupervised ? 'Pesan otomatis 06:00 dikirim' : (patient.alasanLuarPengawasan || 'Pesan otomatis dihentikan')}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onTogglePatientSupervision?.(patient.id)}
                    className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      isSupervised ? 'bg-emerald-600' : 'bg-slate-300'
                    }`}
                    title={isSupervised ? 'Klik untuk set ke Luar Pengawasan (Hentikan pesan otomatis)' : 'Klik untuk aktifkan kembali pengawasan RSJ'}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                        isSupervised ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => onOpenSimulatorForPatient(patient.id)}
                  className="flex-1 py-1.5 px-3 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
                  title="Kirim pesan WhatsApp langsung"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                  Kirim WA
                </button>

                <button
                  onClick={() => handleOpenEditModal(patient)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                  title="Edit Profil Pasien"
                >
                  <Edit3 className="w-4 h-4" />
                </button>

                <button
                  onClick={() => onDeletePatient(patient.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  title="Hapus Pasien"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredPatients.length === 0 && (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
            <UserCheck className="w-8 h-8" />
          </div>
          <div className="space-y-1 max-w-md">
            <h3 className="font-bold text-slate-900 text-base">
              {patients.length === 0 ? 'Belum Ada Data Pasien di Supabase' : 'Tidak Ditemukan Pasien'}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {patients.length === 0 
                ? 'Database tabel pasien di Supabase saat ini kosong. Anda dapat mulai menambahkan data pasien baru yang sebenarnya melalui tombol di bawah.' 
                : 'Tidak ada data pasien yang sesuai dengan kata kunci pencarian atau filter yang dipilih.'}
            </p>
          </div>
          {patients.length === 0 ? (
            <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
              <button
                onClick={handleOpenAddModal}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Tambah Pasien Baru Pertama
              </button>
              {onLoadSamplePatients && (
                <button
                  onClick={onLoadSamplePatients}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 shadow-2xs transition-all flex items-center gap-1.5"
                  title="Muat 5 data contoh pasien psikiatri untuk uji coba cepat"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  Muat 5 Data Pasien Contoh (Demo)
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={() => { setSearchQuery(''); setFilterRisk('all'); setFilterSupervision('all'); }}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            >
              Reset Filter
            </button>
          )}
        </div>
      )}

      {/* Modal Add / Edit Patient */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">
                    {isEditing ? 'Edit Profil Pasien & Pengaturan Notifikasi' : 'Tambah Pasien Baru RSJ'}
                  </h3>
                  <p className="text-xs text-slate-300">
                    Konfigurasi kontak, jadwal minum obat, tanggal kontrol Sp.KJ, dan Jadwal Iter.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto text-xs sm:text-sm">
              {/* Section 1: Data Identitas Pasien */}
              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-3 pb-1 border-b border-slate-100 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-xs flex items-center justify-center font-bold">1</span>
                  Identitas Pasien &amp; Rekam Medis
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">No. Rekam Medis (RM) *</label>
                    <input
                      type="text"
                      required
                      value={formData.noRM || ''}
                      onChange={(e) => setFormData({ ...formData, noRM: e.target.value })}
                      placeholder="RM-2024-0101"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 font-mono text-xs"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Lengkap Pasien *</label>
                    <input
                      type="text"
                      required
                      value={formData.nama || ''}
                      onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                      placeholder="Nama pasien..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">No. WhatsApp Pasien</label>
                    <input
                      type="text"
                      value={formData.noTelepon || ''}
                      onChange={(e) => setFormData({ ...formData, noTelepon: e.target.value })}
                      placeholder="0812xxxxxxxx"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Usia &amp; Gender</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={formData.usia || 30}
                        onChange={(e) => setFormData({ ...formData, usia: parseInt(e.target.value) || 0 })}
                        className="w-20 px-3 py-2 rounded-xl border border-slate-200 text-xs"
                      />
                      <select
                        value={formData.jenisKelamin || 'L'}
                        onChange={(e) => setFormData({ ...formData, jenisKelamin: e.target.value as any })}
                        className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                      >
                        <option value="L">Laki-laki</option>
                        <option value="P">Perempuan</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Status Kepatuhan/Risiko</label>
                    <select
                      value={formData.riskLevel || 'stabil'}
                      onChange={(e) => setFormData({ ...formData, riskLevel: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white font-medium"
                    >
                      <option value="stabil">Stabil (Rutin)</option>
                      <option value="pengawasan">Perlu Pengawasan</option>
                      <option value="rawan_putus_obat">Rawan Putus Obat</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Diagnosa Psikiatri</label>
                    <input
                      type="text"
                      value={formData.diagnosaMedis || ''}
                      onChange={(e) => setFormData({ ...formData, diagnosaMedis: e.target.value })}
                      placeholder="Contoh: F20.0 Skizofrenia Paranoid"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Dokter DPJP (Sp.KJ)</label>
                    <input
                      type="text"
                      value={formData.dokterDPJP || ''}
                      onChange={(e) => setFormData({ ...formData, dokterDPJP: e.target.value })}
                      placeholder="dr. Hendra Wicaksono, Sp.KJ"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Caregiver / Penanggung Jawab */}
              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-3 pb-1 border-b border-slate-100 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-xs flex items-center justify-center font-bold">2</span>
                  Data Caregiver / Penanggung Jawab Pasien
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Caregiver *</label>
                    <input
                      type="text"
                      required
                      value={formData.caregiver?.nama || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        caregiver: { ...formData.caregiver!, nama: e.target.value }
                      })}
                      placeholder="Nama keluarga penanggung jawab..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Hubungan</label>
                    <input
                      type="text"
                      value={formData.caregiver?.hubungan || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        caregiver: { ...formData.caregiver!, hubungan: e.target.value }
                      })}
                      placeholder="Ibu Kandung / Suami / Anak"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">No. WA Caregiver *</label>
                    <input
                      type="text"
                      required
                      value={formData.caregiver?.noTelepon || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        caregiver: { ...formData.caregiver!, noTelepon: e.target.value }
                      })}
                      placeholder="0813xxxxxxxx"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-xs"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Penerima Pesan WhatsApp Otomatis</label>
                    <div className="flex flex-wrap gap-4 text-xs">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="targetPenerima"
                          value="caregiver"
                          checked={formData.caregiver?.targetPenerima === 'caregiver'}
                          onChange={() => setFormData({
                            ...formData,
                            caregiver: { ...formData.caregiver!, targetPenerima: 'caregiver' }
                          })}
                        />
                        <span>Hanya ke Caregiver (Direkomendasikan untuk pasien fase akut/pengawasan)</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="targetPenerima"
                          value="keduanya"
                          checked={formData.caregiver?.targetPenerima === 'keduanya'}
                          onChange={() => setFormData({
                            ...formData,
                            caregiver: { ...formData.caregiver!, targetPenerima: 'keduanya' }
                          })}
                        />
                        <span>Kirim ke Keduanya (Pasien &amp; Caregiver)</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="targetPenerima"
                          value="pasien"
                          checked={formData.caregiver?.targetPenerima === 'pasien'}
                          onChange={() => setFormData({
                            ...formData,
                            caregiver: { ...formData.caregiver!, targetPenerima: 'pasien' }
                          })}
                        />
                        <span>Hanya ke Pasien (Untuk pasien mandiri)</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 3: Obat Rutin Harian */}
              <div>
                <div className="flex items-center justify-between mb-3 pb-1 border-b border-slate-100">
                  <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-xs flex items-center justify-center font-bold">3</span>
                    Jadwal &amp; Resep Obat Rutin Harian
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddMedication}
                    className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Tambah Obat
                  </button>
                </div>

                <div className="space-y-2.5">
                  {(formData.obatRutin || []).map((med, idx) => (
                    <div key={med.id} className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center gap-2">
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 flex-1">
                        <input
                          type="text"
                          placeholder="Nama obat (misal: Risperidone)"
                          value={med.namaObat}
                          onChange={(e) => {
                            const newMeds = [...(formData.obatRutin || [])];
                            newMeds[idx].namaObat = e.target.value;
                            setFormData({ ...formData, obatRutin: newMeds });
                          }}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs"
                        />
                        <input
                          type="text"
                          placeholder="Dosis (misal: 2 mg)"
                          value={med.dosis}
                          onChange={(e) => {
                            const newMeds = [...(formData.obatRutin || [])];
                            newMeds[idx].dosis = e.target.value;
                            setFormData({ ...formData, obatRutin: newMeds });
                          }}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs"
                        />
                        <input
                          type="text"
                          placeholder="Aturan pakai (misal: Sesudah makan)"
                          value={med.aturanPakai}
                          onChange={(e) => {
                            const newMeds = [...(formData.obatRutin || [])];
                            newMeds[idx].aturanPakai = e.target.value;
                            setFormData({ ...formData, obatRutin: newMeds });
                          }}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs"
                        />
                        <div className="flex items-center gap-2 text-xs">
                          {['pagi', 'siang', 'malam'].map((w) => (
                            <label key={w} className="flex items-center gap-1 text-[11px] capitalize">
                              <input
                                type="checkbox"
                                checked={med.waktuMinum.includes(w as any)}
                                onChange={(e) => {
                                  const newMeds = [...(formData.obatRutin || [])];
                                  const currentTimes = newMeds[idx].waktuMinum;
                                  if (e.target.checked) {
                                    newMeds[idx].waktuMinum = [...currentTimes, w as any];
                                  } else {
                                    newMeds[idx].waktuMinum = currentTimes.filter(t => t !== w);
                                  }
                                  setFormData({ ...formData, obatRutin: newMeds });
                                }}
                              />
                              {w}
                            </label>
                          ))}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveMedication(med.id)}
                        className="text-slate-400 hover:text-red-600 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 4: Jadwal Kontrol Dokter & Jadwal Iter Resep */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Kontrol Sp.KJ */}
                <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/40 space-y-3">
                  <h5 className="font-bold text-purple-900 text-xs flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-purple-600" />
                    Jadwal Kontrol Dokter Spesialis Jiwa
                  </h5>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Tanggal Kontrol</label>
                    <input
                      type="date"
                      value={formData.jadwalKontrol?.tanggal || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        jadwalKontrol: { ...formData.jadwalKontrol!, tanggal: e.target.value }
                      })}
                      className="w-full px-3 py-1.5 rounded-lg border border-purple-200 bg-white text-xs"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">Jam Praktek</label>
                      <input
                        type="text"
                        value={formData.jadwalKontrol?.jam || '09:00'}
                        onChange={(e) => setFormData({
                          ...formData,
                          jadwalKontrol: { ...formData.jadwalKontrol!, jam: e.target.value }
                        })}
                        placeholder="09:00"
                        className="w-full px-3 py-1.5 rounded-lg border border-purple-200 bg-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">Poli</label>
                      <input
                        type="text"
                        value={formData.jadwalKontrol?.poli || 'Poli Jiwa Dewasa'}
                        onChange={(e) => setFormData({
                          ...formData,
                          jadwalKontrol: { ...formData.jadwalKontrol!, poli: e.target.value }
                        })}
                        className="w-full px-3 py-1.5 rounded-lg border border-purple-200 bg-white text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Jadwal Iter */}
                <div className="p-4 rounded-xl border border-teal-200 bg-teal-50/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <h5 className="font-bold text-teal-900 text-xs flex items-center gap-1.5">
                      <RefreshCw className="w-4 h-4 text-teal-600" />
                      Jadwal Iter
                    </h5>
                    <label className="flex items-center gap-1 text-[11px] text-teal-900 font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.jadwalIter?.adaIter || false}
                        onChange={(e) => setFormData({
                          ...formData,
                          jadwalIter: { ...formData.jadwalIter!, adaIter: e.target.checked }
                        })}
                      />
                      Ada Jadwal Iter
                    </label>
                  </div>

                  {formData.jadwalIter?.adaIter && (
                    <>
                      {/* Aturan RSJ untuk Jadwal Iter */}
                      <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-900 space-y-1">
                        <span className="font-bold block text-amber-950">📌 Ketentuan Pengambilan Jadwal Iter:</span>
                        <p className="leading-snug">• <strong>Wajib tepat tanggal:</strong> Tidak boleh lebih awal atau terlambat.</p>
                        <p className="leading-snug">• <strong>Iter 1 & 2:</strong> Boleh diwakili keluarga/caregiver.</p>
                        <p className="leading-snug">• <strong>Iter 3:</strong> <strong className="text-amber-950">Wajib bersama pasien</strong> (evaluasi dokter & pembaharuan resep).</p>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1">No. Salinan Resep</label>
                          <input
                            type="text"
                            value={formData.jadwalIter?.nomorResep || ''}
                            onChange={(e) => setFormData({
                              ...formData,
                              jadwalIter: { ...formData.jadwalIter!, nomorResep: e.target.value }
                            })}
                            placeholder="RSP-IX-XXXX"
                            className="w-full px-3 py-1.5 rounded-lg border border-teal-200 bg-white text-xs font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1">Tgl Ambil Obat (Wajib Tepat)</label>
                          <input
                            type="date"
                            value={formData.jadwalIter?.tanggalIter || ''}
                            onChange={(e) => setFormData({
                              ...formData,
                              jadwalIter: { ...formData.jadwalIter!, tanggalIter: e.target.value }
                            })}
                            className="w-full px-3 py-1.5 rounded-lg border border-teal-200 bg-white text-xs font-bold text-slate-800"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1">Total Otorisasi Iter</label>
                          <input
                            type="number"
                            value={formData.jadwalIter?.totalIterasi || 2}
                            onChange={(e) => setFormData({
                              ...formData,
                              jadwalIter: { ...formData.jadwalIter!, totalIterasi: parseInt(e.target.value) || 1 }
                            })}
                            className="w-full px-3 py-1.5 rounded-lg border border-teal-200 bg-white text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1">Sisa Jatah Iterasi</label>
                          <input
                            type="number"
                            value={formData.jadwalIter?.sisaIterasi || 1}
                            onChange={(e) => setFormData({
                              ...formData,
                              jadwalIter: { ...formData.jadwalIter!, sisaIterasi: parseInt(e.target.value) || 0 }
                            })}
                            className="w-full px-3 py-1.5 rounded-lg border border-teal-200 bg-white text-xs"
                          />
                        </div>
                      </div>

                      {/* Status iter saat ini */}
                      {(() => {
                        const total = formData.jadwalIter?.totalIterasi || 3;
                        const sisa = formData.jadwalIter?.sisaIterasi ?? 1;
                        const currentIter = Math.max(1, total - sisa + 1);
                        const isIter3 = currentIter >= 3;
                        return (
                          <div className={`p-2 rounded-lg text-[11px] font-semibold flex items-center justify-between border ${
                            isIter3 
                              ? 'bg-rose-50 text-rose-800 border-rose-200' 
                              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          }`}>
                            <span>Status: Pengambilan Iter ke-{currentIter}</span>
                            <span>{isIter3 ? '⚠️ Wajib Hadir Bersama Pasien' : '✅ Boleh Diwakili Caregiver'}</span>
                          </div>
                        );
                      })()}
                    </>
                  )}
                </div>
              </div>

              {/* Section 4b: Jadwal Kontrol & Iter Multiple (RSJ Naimata: hingga 3x per periode) */}
              <div className="space-y-4">
                <h4 className="font-bold text-slate-900 text-sm pb-1 border-b border-slate-100 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-xs flex items-center justify-center font-bold">4b</span>
                  Jadwal Kontrol & Iter Multiple (RSJ Naimata)
                  <span className="text-[11px] font-normal text-slate-500 ml-1">— Atur hingga 3 jadwal kontrol & 3 iter per periode resep</span>
                </h4>

                {/* ─── Jadwal Kontrol List ─── */}
                <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <h5 className="font-bold text-purple-900 text-xs flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-purple-600" />
                      Daftar Jadwal Kontrol Dokter (Maks 3)
                    </h5>
                    <button
                      type="button"
                      onClick={() => {
                        const list = formData.jadwalKontrolList || [];
                        if (list.length >= 3) return;
                        setFormData({
                          ...formData,
                          jadwalKontrolList: [
                            ...list,
                            {
                              id: `ktrl-${Date.now()}`,
                              tanggal: '',
                              jam: '09:00',
                              label: `Kontrol ${list.length + 1}`,
                            },
                          ],
                        });
                      }}
                      disabled={(formData.jadwalKontrolList || []).length >= 3}
                      className="text-xs font-semibold text-purple-700 hover:text-purple-900 flex items-center gap-1 disabled:opacity-40"
                    >
                      <Plus className="w-3.5 h-3.5" /> Tambah Jadwal Kontrol
                    </button>
                  </div>

                  <div className="text-[11px] text-purple-800 bg-purple-50 p-2 rounded-lg border border-purple-100">
                    💡 RSJ Naimata: Biasanya ada 3 jadwal kontrol per periode resep (sebulan sekali).
                    Sistem akan mengirim pengingat pada <strong>H-3</strong>, <strong>H-1</strong>, dan <strong>Hari H</strong> untuk setiap jadwal.
                  </div>

                  {(formData.jadwalKontrolList || []).length === 0 && (
                    <div className="text-[11px] text-slate-500 italic py-2 text-center">
                      Belum ada jadwal kontrol tambahan. Klik "Tambah Jadwal Kontrol" untuk menambahkan.
                      (Jika tidak diisi, sistem akan pakai tanggal kontrol dari Section 4.)
                    </div>
                  )}

                  <div className="space-y-2">
                    {(formData.jadwalKontrolList || []).map((jadwal, idx) => (
                      <div key={jadwal.id} className="flex items-center gap-2 bg-white p-2.5 rounded-lg border border-purple-200">
                        <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-800 text-[11px] font-bold flex items-center justify-center shrink-0">
                          {idx + 1}
                        </div>
                        <div className="flex-1 grid grid-cols-3 gap-2">
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Label</label>
                            <input
                              type="text"
                              placeholder={`Kontrol ${idx + 1}`}
                              value={jadwal.label || ''}
                              onChange={(e) => {
                                const updated = [...(formData.jadwalKontrolList || [])];
                                updated[idx] = { ...updated[idx], label: e.target.value };
                                setFormData({ ...formData, jadwalKontrolList: updated });
                              }}
                              className="w-full px-2 py-1 rounded-lg border border-purple-200 bg-white text-xs"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Tanggal Kontrol *</label>
                            <input
                              type="date"
                              value={jadwal.tanggal}
                              onChange={(e) => {
                                const updated = [...(formData.jadwalKontrolList || [])];
                                updated[idx] = { ...updated[idx], tanggal: e.target.value };
                                setFormData({ ...formData, jadwalKontrolList: updated });
                              }}
                              className="w-full px-2 py-1 rounded-lg border border-purple-200 bg-white text-xs font-bold text-slate-800"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Jam Praktek</label>
                            <input
                              type="text"
                              placeholder="09:00"
                              value={jadwal.jam}
                              onChange={(e) => {
                                const updated = [...(formData.jadwalKontrolList || [])];
                                updated[idx] = { ...updated[idx], jam: e.target.value };
                                setFormData({ ...formData, jadwalKontrolList: updated });
                              }}
                              className="w-full px-2 py-1 rounded-lg border border-purple-200 bg-white text-xs"
                            />
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = (formData.jadwalKontrolList || []).filter((_, i) => i !== idx);
                            setFormData({ ...formData, jadwalKontrolList: updated });
                          }}
                          className="text-slate-400 hover:text-red-600 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ─── Jadwal Iter List ─── */}
                {formData.jadwalIter?.adaIter && (
                  <div className="p-4 rounded-xl border border-teal-200 bg-teal-50/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <h5 className="font-bold text-teal-900 text-xs flex items-center gap-1.5">
                        <RefreshCw className="w-4 h-4 text-teal-600" />
                        Daftar Jadwal Iter (Maks 3: Iter 1, 2, 3)
                      </h5>
                      <button
                        type="button"
                        onClick={() => {
                          const list = formData.jadwalIterList || [];
                          if (list.length >= 3) return;
                          const nextNomor = list.length + 1;
                          setFormData({
                            ...formData,
                            jadwalIterList: [
                              ...list,
                              {
                                id: `iter-${nextNomor}`,
                                nomorIter: nextNomor,
                                tanggal: '',
                                nomorResep: formData.jadwalIter?.nomorResep || '',
                                statusPengambilan: 'belum_diambil' as const,
                                label: `Iter ${nextNomor}`,
                              },
                            ],
                          });
                        }}
                        disabled={(formData.jadwalIterList || []).length >= 3}
                        className="text-xs font-semibold text-teal-700 hover:text-teal-900 flex items-center gap-1 disabled:opacity-40"
                      >
                        <Plus className="w-3.5 h-3.5" /> Tambah Jadwal Iter
                      </button>
                    </div>

                    <div className="text-[11px] text-teal-800 bg-teal-50 p-2 rounded-lg border border-teal-100 space-y-0.5">
                      <p>• <strong>Iter 1 & 2:</strong> Boleh diwakili keluarga/caregiver</p>
                      <p>• <strong>Iter 3:</strong> ⚠️ Wajib bersama pasien (evaluasi dokter & pembaharuan resep)</p>
                      <p>• Sistem mengirim pengingat pada <strong>H-3, H-1, dan Hari H</strong> setiap iter</p>
                    </div>

                    {(formData.jadwalIterList || []).length === 0 && (
                      <div className="text-[11px] text-slate-500 italic py-2 text-center">
                        Belum ada jadwal iter tambahan. (Jika tidak diisi, sistem pakai tanggal iter dari Section 4.)
                      </div>
                    )}

                    <div className="space-y-2">
                      {(formData.jadwalIterList || []).map((iter, idx) => {
                        const isIter3 = iter.nomorIter >= 3;
                        return (
                          <div
                            key={iter.id}
                            className={`flex items-center gap-2 p-2.5 rounded-lg border ${
                              isIter3
                                ? 'bg-rose-50 border-rose-200'
                                : 'bg-white border-teal-200'
                            }`}
                          >
                            <div
                              className={`w-6 h-6 rounded-full text-[11px] font-bold flex items-center justify-center shrink-0 ${
                                isIter3 ? 'bg-rose-100 text-rose-800' : 'bg-teal-100 text-teal-800'
                              }`}
                            >
                              {iter.nomorIter}
                            </div>
                            <div className="flex-1 grid grid-cols-3 gap-2">
                              <div>
                                <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Label</label>
                                <input
                                  type="text"
                                  value={iter.label || ''}
                                  onChange={(e) => {
                                    const updated = [...(formData.jadwalIterList || [])];
                                    updated[idx] = { ...updated[idx], label: e.target.value };
                                    setFormData({ ...formData, jadwalIterList: updated });
                                  }}
                                  placeholder={`Iter ${iter.nomorIter}`}
                                  className="w-full px-2 py-1 rounded-lg border border-teal-200 bg-white text-xs"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                                  Tanggal Iter *
                                  {isIter3 && <span className="text-rose-600 ml-1">⚠️ Wajib Hadir Pasien</span>}
                                </label>
                                <input
                                  type="date"
                                  value={iter.tanggal}
                                  onChange={(e) => {
                                    const updated = [...(formData.jadwalIterList || [])];
                                    updated[idx] = { ...updated[idx], tanggal: e.target.value };
                                    setFormData({ ...formData, jadwalIterList: updated });
                                  }}
                                  className={`w-full px-2 py-1 rounded-lg border bg-white text-xs font-bold text-slate-800 ${
                                    isIter3 ? 'border-rose-300' : 'border-teal-200'
                                  }`}
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Status Pengambilan</label>
                                <select
                                  value={iter.statusPengambilan}
                                  onChange={(e) => {
                                    const updated = [...(formData.jadwalIterList || [])];
                                    updated[idx] = {
                                      ...updated[idx],
                                      statusPengambilan: e.target.value as any,
                                    };
                                    setFormData({ ...formData, jadwalIterList: updated });
                                  }}
                                  className="w-full px-2 py-1 rounded-lg border border-teal-200 bg-white text-xs"
                                >
                                  <option value="belum_diambil">⏳ Belum Diambil</option>
                                  <option value="sudah_diambil">✅ Sudah Diambil</option>
                                </select>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const updated = (formData.jadwalIterList || []).filter((_, i) => i !== idx);
                                setFormData({ ...formData, jadwalIterList: updated });
                              }}
                              className="text-slate-400 hover:text-red-600 p-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
                <h4 className="font-bold text-slate-900 text-sm pb-1 border-b border-slate-200 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-xs flex items-center justify-center font-bold">5</span>
                  Status Pengawasan &amp; Otomasi WhatsApp RSJ Naimata
                </h4>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Status Pengawasan Pasien Saat Ini:
                    </label>
                    <select
                      value={formData.statusPengawasan || 'dalam_pengawasan'}
                      onChange={(e) => {
                        const val = e.target.value as SupervisionStatus;
                        setFormData({
                          ...formData,
                          statusPengawasan: val,
                          notifikasiOtomatisAktif: val === 'dalam_pengawasan',
                        });
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500/20"
                    >
                      <option value="dalam_pengawasan">🟢 Aktif Dalam Pengawasan RSJ (Pesan Otomatis Dikirim)</option>
                      <option value="luar_pengawasan">⛔ Di Luar Pengawasan RSJ (Hentikan Pengiriman Pesan Otomatis)</option>
                      <option value="selesai_pengobatan">✅ Selesai Pengobatan / Remisi (Hentikan Pengiriman Pesan Otomatis)</option>
                      <option value="rujuk_keluar">🏥 Rujuk Keluar / Pindah Kota (Hentikan Pengiriman Pesan Otomatis)</option>
                    </select>
                  </div>

                  {formData.statusPengawasan !== 'dalam_pengawasan' && (
                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 space-y-2 animate-in fade-in duration-150">
                      <div className="text-[11px] font-semibold text-amber-900 flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-700" />
                        Pesan Otomatis Dinonaktifkan:
                      </div>
                      <p className="text-[11px] text-amber-800">
                        Pasien ini <strong>tidak akan menerima pesan otomatis</strong> (jadwal minum obat jam 06:00, pengingat kontrol, maupun iterasi farmasi).
                      </p>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Alasan / Keterangan Penonaktifan:
                        </label>
                        <input
                          type="text"
                          value={formData.alasanLuarPengawasan || ''}
                          onChange={(e) => setFormData({ ...formData, alasanLuarPengawasan: e.target.value })}
                          placeholder="Misal: Pasien pindah ke luar kota / keluarga meminta penghentian pesan"
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Catatan Khusus */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Catatan Tambahan untuk Petugas RSJ</label>
                <textarea
                  rows={2}
                  value={formData.catatanKhusus || ''}
                  onChange={(e) => setFormData({ ...formData, catatanKhusus: e.target.value })}
                  placeholder="Instruksi khusus, alergi, atau kebiasaan komunikasi keluarga..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              {/* Actions Footer */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  Simpan Data Pasien
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
