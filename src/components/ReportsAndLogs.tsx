import { useState } from 'react';
import { 
  Download, 
  Search, 
  Filter, 
  CheckCheck, 
  AlertCircle, 
  MessageSquare, 
  Eye, 
  Pill, 
  Calendar, 
  RefreshCw, 
  Sparkles,
  HelpCircle,
  X,
  Trash2
} from 'lucide-react';
import { WhatsAppMessage, ReminderCategory, MessageStatus } from '../types';
import { exportMessagesToExcel } from '../utils/messageGenerator';

interface ReportsAndLogsProps {
  messages: WhatsAppMessage[];
  onDeleteAllMessages?: () => void;
}

export const ReportsAndLogs = ({ messages, onDeleteAllMessages }: ReportsAndLogsProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'all' | MessageStatus>('all');
  const [selectedCategory, setSelectedCategory] = useState<'all' | ReminderCategory>('all');
  const [inspectMessage, setInspectMessage] = useState<WhatsAppMessage | null>(null);

  // Filter messages
  const filteredMessages = messages.filter((m) => {
    const matchSearch =
      m.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.noRM.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.recipientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.recipientPhone.includes(searchQuery);

    const matchStatus = selectedStatus === 'all' || m.status === selectedStatus;
    const matchCategory = selectedCategory === 'all' || m.category === selectedCategory;

    return matchSearch && matchStatus && matchCategory;
  });

  const getStatusBadge = (status: MessageStatus) => {
    switch (status) {
      case 'queued':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">Antre</span>;
      case 'sent':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">Terkirim</span>;
      case 'delivered':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800">Diterima</span>;
      case 'read':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800 flex items-center gap-1">
            <CheckCheck className="w-3 h-3 text-teal-600" /> Terbaca
          </span>
        );
      case 'replied':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
            <MessageSquare className="w-3 h-3 text-emerald-600" /> Terbalas
          </span>
        );
      case 'failed':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 flex items-center gap-1">
            <AlertCircle className="w-3 h-3 text-red-600" /> Gagal
          </span>
        );
    }
  };

  const getCategoryIcon = (cat: ReminderCategory) => {
    switch (cat) {
      case 'minum_obat': return <Pill className="w-3.5 h-3.5 text-blue-500" />;
      case 'kontrol_dokter': return <Calendar className="w-3.5 h-3.5 text-purple-500" />;
      case 'iter_resep': return <RefreshCw className="w-3.5 h-3.5 text-teal-500" />;
      case 'edukasi_rsj': return <Sparkles className="w-3.5 h-3.5 text-amber-500" />;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Laporan &amp; Audit Log Komunikasi WhatsApp Pasien
          </h2>
          <p className="text-xs text-slate-500">
            Riwayat komprehensif seluruh pesan terkirim, status terbaca, balasan konfirmasi pasien, dan kendala pengiriman.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onDeleteAllMessages && messages.length > 0 && (
            <button
              onClick={onDeleteAllMessages}
              className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5"
              title="Kosongkan seluruh riwayat log pesan contoh"
            >
              <Trash2 className="w-4 h-4 text-rose-500" />
              Kosongkan Riwayat Pesan
            </button>
          )}
          <button
            onClick={() => exportMessagesToExcel(filteredMessages)}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold shadow-xs transition-all flex items-center gap-1.5"
            title="Unduh seluruh log pesan yang terfilter dalam format Excel (.xlsx)"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            Ekspor Excel (.xlsx)
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama pasien, No. RM, nomor WA..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>

        {/* Filter Status */}
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as any)}
            className="py-2 px-3 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs"
          >
            <option value="all">Semua Status Pesan</option>
            <option value="delivered">Diterima (Delivered)</option>
            <option value="read">Terbaca (Read - Centang Biru)</option>
            <option value="replied">Terbalas (Pasien Konfirmasi)</option>
            <option value="failed">Gagal / Dialihkan</option>
          </select>
        </div>

        {/* Filter Category */}
        <div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as any)}
            className="py-2 px-3 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs"
          >
            <option value="all">Semua Kategori Reminder</option>
            <option value="minum_obat">Minum Obat Harian</option>
            <option value="kontrol_dokter">Kontrol Dokter Sp.KJ</option>
            <option value="iter_resep">Iterasi Resep Farmasi</option>
            <option value="edukasi_rsj">Edukasi &amp; Dukungan RSJ</option>
          </select>
        </div>
      </div>

      {/* Messages Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Waktu Kirim</th>
                <th className="py-3 px-4">Pasien &amp; No. RM</th>
                <th className="py-3 px-4">Penerima WhatsApp</th>
                <th className="py-3 px-4">Kategori &amp; Judul</th>
                <th className="py-3 px-4">Status Pengiriman</th>
                <th className="py-3 px-4">Balasan Pasien / Caregiver</th>
                <th className="py-3 px-4 text-right">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredMessages.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Tidak ada log pesan yang sesuai dengan filter.
                  </td>
                </tr>
              ) : (
                filteredMessages.map((msg) => (
                  <tr key={msg.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Waktu */}
                    <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px] text-slate-500">
                      <div>{msg.sentAt?.slice(0, 10) || msg.scheduledAt.slice(0, 10)}</div>
                      <div className="font-bold text-slate-700">{msg.sentAt?.slice(11, 16) || msg.scheduledAt.slice(11, 16)} WIB</div>
                    </td>

                    {/* Pasien */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-bold text-slate-900">{msg.patientName}</div>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                        {msg.noRM}
                      </span>
                    </td>

                    {/* Penerima */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-semibold text-slate-800">{msg.recipientName}</div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {msg.recipientPhone} ({msg.recipientType})
                      </div>
                    </td>

                    {/* Kategori */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 font-medium text-slate-800">
                        {getCategoryIcon(msg.category)}
                        <span>{msg.title}</span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      {getStatusBadge(msg.status)}
                    </td>

                    {/* Balasan Pasien */}
                    <td className="py-3 px-4 max-w-xs truncate text-xs">
                      {msg.replyText ? (
                        <span className="font-medium text-emerald-800 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200 block truncate" title={msg.replyText}>
                          💬 &quot;{msg.replyText}&quot;
                        </span>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">Belum ada balasan</span>
                      )}
                    </td>

                    {/* Aksi */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => setInspectMessage(msg)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                        title="Lihat Detail Pesan & Audit Log"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspect Modal Drawer */}
      {inspectMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider block">
                  Log Audit Pesan WhatsApp #{inspectMessage.id}
                </span>
                <h3 className="font-bold text-base text-white">
                  {inspectMessage.title}
                </h3>
              </div>
              <button
                onClick={() => setInspectMessage(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                <div>
                  <span className="text-slate-400 block text-[10px]">Pasien:</span>
                  <span className="font-bold text-slate-800">{inspectMessage.patientName} ({inspectMessage.noRM})</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Penerima:</span>
                  <span className="font-bold text-slate-800">{inspectMessage.recipientName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">No. WhatsApp:</span>
                  <span className="font-mono text-slate-800">{inspectMessage.recipientPhone}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Status:</span>
                  <div className="mt-0.5">{getStatusBadge(inspectMessage.status)}</div>
                </div>
              </div>

              {/* Message Body */}
              <div>
                <span className="font-bold text-slate-700 block mb-1">Isi Pesan Terkirim:</span>
                <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl whitespace-pre-line text-slate-800 font-sans leading-relaxed">
                  {inspectMessage.body}
                </div>
              </div>

              {/* Reply Text */}
              {inspectMessage.replyText && (
                <div>
                  <span className="font-bold text-slate-700 block mb-1">Respon / Balasan Masuk:</span>
                  <div className="p-3 bg-white border border-emerald-300 rounded-xl text-slate-900 font-medium shadow-2xs">
                    💬 &quot;{inspectMessage.replyText}&quot;
                    <div className="text-[10px] text-slate-400 mt-1">
                      Waktu terima balasan: {inspectMessage.repliedAt} WIB
                    </div>
                  </div>
                </div>
              )}

              {/* Error Message if any */}
              {inspectMessage.errorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl">
                  <span className="font-bold block mb-0.5">Catatan Kesalahan / Pengalihan:</span>
                  {inspectMessage.errorMessage}
                </div>
              )}

              <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-100 flex justify-between">
                <span>Gateway BSP: {inspectMessage.bspProvider}</span>
                <span>Terkirim: {inspectMessage.sentAt || '-'}</span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setInspectMessage(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white font-semibold text-xs"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
