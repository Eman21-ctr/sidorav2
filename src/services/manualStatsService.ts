import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { ManualDailyRecord } from '../types';

const STORAGE_KEY = 'sidora_manual_daily_records_live_v2';

// Helper Local Storage (hanya digunakan untuk cache/offline sementara)
function getLocalRecords(): ManualDailyRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveLocalRecords(records: ManualDailyRecord[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch (err) {
    console.warn('[ManualStatsService] Gagal simpan cache lokal:', err);
  }
}

// Fetch seluruh data manual harian langsung dari Supabase
export async function fetchManualDailyRecords(): Promise<ManualDailyRecord[]> {
  if (!isSupabaseConfigured) {
    return getLocalRecords();
  }

  try {
    const { data, error } = await supabase
      .from('manual_daily_records')
      .select('date, data')
      .order('date', { ascending: true });

    if (error) {
      console.warn('[ManualStatsService] Supabase error:', error.message);
      return getLocalRecords();
    }

    if (!data || data.length === 0) {
      // Benar-benar kosong jika belum pernah diinput di Supabase
      saveLocalRecords([]);
      return [];
    }

    const records: ManualDailyRecord[] = data.map(row => ({
      date: row.date,
      ...(row.data as ManualDailyRecord),
    }));

    saveLocalRecords(records);
    return records;
  } catch (err) {
    console.error('[ManualStatsService] Error fetching manual daily records:', err);
    return getLocalRecords();
  }
}

// Simpan atau update record untuk tanggal tertentu
export async function upsertManualDailyRecord(record: ManualDailyRecord): Promise<void> {
  // Update cache lokal
  const current = getLocalRecords();
  const index = current.findIndex(r => r.date === record.date);
  let updatedList: ManualDailyRecord[];
  if (index >= 0) {
    updatedList = [...current];
    updatedList[index] = record;
  } else {
    updatedList = [...current, record].sort((a, b) => a.date.localeCompare(b.date));
  }
  saveLocalRecords(updatedList);

  if (!isSupabaseConfigured) return;

  const { error } = await supabase
    .from('manual_daily_records')
    .upsert({
      date: record.date,
      data: record,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'date' });

  if (error) {
    console.error('[ManualStatsService] Supabase upsert error:', error.message);
    throw error;
  }
}

// Hapus record tanggal tertentu
export async function deleteManualDailyRecord(date: string): Promise<void> {
  const current = getLocalRecords();
  const filtered = current.filter(r => r.date !== date);
  saveLocalRecords(filtered);

  if (!isSupabaseConfigured) return;

  const { error } = await supabase
    .from('manual_daily_records')
    .delete()
    .eq('date', date);

  if (error) {
    console.error('[ManualStatsService] Error deleting from Supabase:', error.message);
    throw error;
  }
}

// Kosongkan SELURUH data manual (Supabase & LocalStorage) untuk ujicoba bersih
export async function clearAllManualDailyRecords(): Promise<void> {
  try {
    localStorage.removeItem(STORAGE_KEY);
    // Hapus juga legacy key jika ada
    localStorage.removeItem('sidora_manual_daily_records_v1');
  } catch (err) {
    console.warn('[ManualStatsService] Error clearing local storage:', err);
  }

  if (isSupabaseConfigured) {
    const { error } = await supabase
      .from('manual_daily_records')
      .delete()
      .neq('date', '');

    if (error) {
      console.error('[ManualStatsService] Supabase clear all error:', error.message);
      throw error;
    }
  }
}
