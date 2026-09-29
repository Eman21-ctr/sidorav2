import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { AutomationSettings, BSPConfig, DailyAnalytics, ManualStats } from '../types';

// ============================================================
// AUTOMATION SETTINGS (Singleton)
// ============================================================

export async function fetchAutomationSettings(): Promise<AutomationSettings | null> {
  if (!isSupabaseConfigured) return null;

  const { data, error } = await supabase
    .from('automation_settings')
    .select('data')
    .eq('id', 'default')
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // No rows found
    throw error;
  }
  return data?.data as AutomationSettings ?? null;
}

export async function saveAutomationSettings(settings: AutomationSettings): Promise<void> {
  if (!isSupabaseConfigured) return;

  const { error } = await supabase
    .from('automation_settings')
    .upsert({
      id: 'default',
      data: settings,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' });

  if (error) throw error;
}

// ============================================================
// BSP CONFIG (Singleton)
// ============================================================

export async function fetchBSPConfig(): Promise<BSPConfig | null> {
  if (!isSupabaseConfigured) return null;

  const { data, error } = await supabase
    .from('bsp_config')
    .select('data')
    .eq('id', 'default')
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data?.data as BSPConfig ?? null;
}

export async function saveBSPConfig(config: BSPConfig): Promise<void> {
  if (!isSupabaseConfigured) return;

  const { error } = await supabase
    .from('bsp_config')
    .upsert({
      id: 'default',
      data: config,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' });

  if (error) throw error;
}

// ============================================================
// DAILY ANALYTICS
// ============================================================

export async function fetchAnalytics(): Promise<DailyAnalytics[]> {
  if (!isSupabaseConfigured) return [];

  const { data, error } = await supabase
    .from('daily_analytics')
    .select('data')
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data?.map(row => row.data as DailyAnalytics) ?? [];
}

export async function upsertAnalytics(analyticsArr: DailyAnalytics[]): Promise<void> {
  if (!isSupabaseConfigured || analyticsArr.length === 0) return;

  const rows = analyticsArr.map(a => ({
    date: a.date,
    data: a,
  }));

  const { error } = await supabase
    .from('daily_analytics')
    .upsert(rows, { onConflict: 'date' });

  if (error) throw error;
}

export async function upsertSingleAnalytics(analytics: DailyAnalytics): Promise<void> {
  if (!isSupabaseConfigured) return;

  const { error } = await supabase
    .from('daily_analytics')
    .upsert({
      date: analytics.date,
      data: analytics,
    }, { onConflict: 'date' });

  if (error) throw error;
}

export async function deleteAllAnalytics(): Promise<void> {
  if (!isSupabaseConfigured) return;

  const { error } = await supabase
    .from('daily_analytics')
    .delete()
    .neq('date', '');

  if (error) throw error;
}

// ============================================================
// MANUAL STATS (Singleton — stored in automation_settings table)
// ============================================================

export async function fetchManualStats(): Promise<ManualStats | null> {
  if (!isSupabaseConfigured) return null;

  const { data, error } = await supabase
    .from('automation_settings')
    .select('data')
    .eq('id', 'manual_stats')
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data?.data as ManualStats ?? null;
}

export async function saveManualStats(stats: ManualStats): Promise<void> {
  if (!isSupabaseConfigured) return;

  const { error } = await supabase
    .from('automation_settings')
    .upsert({
      id: 'manual_stats',
      data: stats,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' });

  if (error) throw error;
}
