import { useState, useEffect, useRef } from 'react';
import { isSupabaseConfigured } from '../lib/supabase';

import { Patient, MessageTemplate, WhatsAppMessage, BSPConfig, DailyAnalytics, AutomationSettings } from '../types';

import {
  INITIAL_PATIENTS,
  INITIAL_TEMPLATES,
  INITIAL_MESSAGES,
  INITIAL_BSP_CONFIG,
  INITIAL_ANALYTICS,
  INITIAL_AUTOMATION_SETTINGS,
} from '../data/initialData';

import { fetchPatients, upsertPatient as dbUpsertPatient, upsertPatients, deletePatient as dbDeletePatient, deleteAllPatients as dbDeleteAllPatients } from '../services/patientService';
import { fetchMessages, insertMessage as dbInsertMessage, insertMessages as dbInsertMessages, updateMessage as dbUpdateMessage, deleteAllMessages as dbDeleteAllMessages } from '../services/messageService';
import { fetchTemplates, upsertTemplate as dbUpsertTemplate, upsertTemplates } from '../services/templateService';
import {
  fetchAutomationSettings, saveAutomationSettings as dbSaveAutomationSettings,
  fetchBSPConfig, saveBSPConfig as dbSaveBSPConfig,
  fetchAnalytics, upsertAnalytics, upsertSingleAnalytics, deleteAllAnalytics as dbDeleteAllAnalytics,
} from '../services/settingsService';

import { computeRealDailyAnalytics } from '../utils/analyticsHelper';

export interface SupabaseDataState {
  // Data state
  patients: Patient[];
  setPatients: React.Dispatch<React.SetStateAction<Patient[]>>;
  templates: MessageTemplate[];
  setTemplates: React.Dispatch<React.SetStateAction<MessageTemplate[]>>;
  messages: WhatsAppMessage[];
  setMessages: React.Dispatch<React.SetStateAction<WhatsAppMessage[]>>;
  bspConfig: BSPConfig;
  setBspConfig: React.Dispatch<React.SetStateAction<BSPConfig>>;
  analytics: DailyAnalytics[];
  setAnalytics: React.Dispatch<React.SetStateAction<DailyAnalytics[]>>;
  automationSettings: AutomationSettings;
  setAutomationSettings: React.Dispatch<React.SetStateAction<AutomationSettings>>;

  // Connection state
  isLoading: boolean;
  isConnected: boolean;
  connectionError: string | null;

  // Sync helpers — call these after local state mutations
  syncPatient: (patient: Patient) => Promise<void>;
  syncDeletePatient: (id: string) => Promise<void>;
  syncDeleteAllPatients: () => Promise<void>;
  syncPatients: (patients: Patient[]) => Promise<void>;
  syncTemplate: (template: MessageTemplate) => Promise<void>;
  syncMessage: (msg: WhatsAppMessage) => Promise<void>;
  syncMessages: (msgs: WhatsAppMessage[]) => Promise<void>;
  syncUpdateMessage: (msg: WhatsAppMessage) => Promise<void>;
  syncDeleteAllMessages: () => Promise<void>;
  syncAutomationSettings: (settings: AutomationSettings) => Promise<void>;
  syncBSPConfig: (config: BSPConfig) => Promise<void>;
  syncAnalytics: (analytics: DailyAnalytics[]) => Promise<void>;
  syncSingleAnalytics: (analytics: DailyAnalytics) => Promise<void>;
}

export function useSupabaseData(): SupabaseDataState {
  // ---- State (initialized cleanly for live database) ----
  const [patients, setPatients] = useState<Patient[]>([]);
  const [templates, setTemplates] = useState<MessageTemplate[]>(INITIAL_TEMPLATES);
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [bspConfig, setBspConfig] = useState<BSPConfig>(INITIAL_BSP_CONFIG);
  const [analytics, setAnalytics] = useState<DailyAnalytics[]>(() => computeRealDailyAnalytics([]));
  const [automationSettings, setAutomationSettings] = useState<AutomationSettings>(INITIAL_AUTOMATION_SETTINGS);

  // ---- Connection state ----
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const hasSeeded = useRef(false);

  // ---- Load all data from Supabase on mount ----
  useEffect(() => {
    loadAllData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadAllData() {
    if (!isSupabaseConfigured) {
      console.log('[Supabase] Not configured — using initial/local data');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setConnectionError(null);

    try {
      const [
        dbPatients,
        dbTemplates,
        dbMessages,
        dbAutomation,
        dbBsp,
        dbAnalytics,
      ] = await Promise.all([
        fetchPatients(),
        fetchTemplates(),
        fetchMessages(),
        fetchAutomationSettings(),
        fetchBSPConfig(),
        fetchAnalytics(),
      ]);

      // If all tables are empty → seed with initial data
      const isEmpty = dbPatients.length === 0 && dbTemplates.length === 0 && !dbAutomation && !dbBsp;

      if (isEmpty && !hasSeeded.current) {
        console.log('[Supabase] Database kosong — seeding data awal...');
        hasSeeded.current = true;
        await seedInitialData();
        // After seeding, use initial data
        setIsConnected(true);
        setIsLoading(false);
        return;
      }

      // Use data from Supabase
      setPatients(dbPatients);
      if (dbTemplates.length > 0) {
        // Check if templates need upgrade to simple redaksi
        const hasMissingObatTemplates = !dbTemplates.some(t => t.id === 'tmpl-obat-siang') || !dbTemplates.some(t => t.id === 'tmpl-obat-malam');
        const hasOldGenericObat = dbTemplates.some(t => t.category === 'minum_obat' && !t.templateText.includes('{nama_pasien}'));
        const hasOldGenericKontrol = dbTemplates.some(t => t.category === 'kontrol_dokter' && !t.templateText.includes('{nama_pasien}'));
        const hasOldGenericIter = dbTemplates.some(t => t.id === 'tmpl-iter-resep' && (!t.templateText.includes('{ketentuan_kehadiran_iter}') || !t.templateText.includes('{iter_ke}')));
        const hasOldVerboseFields = dbTemplates.some(t => t.templateText.includes('{nomor_rm}') || t.templateText.includes('{dokter_dpjp}'));

        if (hasMissingObatTemplates || hasOldGenericObat || hasOldGenericKontrol || hasOldGenericIter || hasOldVerboseFields) {
          console.log('[Supabase] Mengupgrade template ke format simpel terbaru...');
          const upgradedTemplates = INITIAL_TEMPLATES.map(initTmpl => {
            const existing = dbTemplates.find(t => t.id === initTmpl.id);
            if (!existing) return initTmpl;
            if (existing.templateText.includes('{nomor_rm}') || existing.templateText.includes('{dokter_dpjp}')) return initTmpl;
            if (initTmpl.id === 'tmpl-iter-resep' && (!existing.templateText.includes('{ketentuan_kehadiran_iter}') || !existing.templateText.includes('{iter_ke}'))) return initTmpl;
            if (!existing.templateText.includes('{nama_pasien}')) return initTmpl;
            return existing;
          });
          setTemplates(upgradedTemplates);
          upsertTemplates(upgradedTemplates).catch(e => console.error('[Supabase] Gagal upsert upgraded templates:', e));
        } else {
          setTemplates(dbTemplates);
        }
      }
      setMessages(dbMessages);
      if (dbAutomation) setAutomationSettings(dbAutomation);
      if (dbBsp) setBspConfig(dbBsp);
      if (dbAnalytics.length > 0) {
        setAnalytics(dbAnalytics);
      } else {
        setAnalytics(computeRealDailyAnalytics(dbMessages));
      }

      setIsConnected(true);
      console.log('[Supabase] ✅ Data berhasil dimuat dari Supabase');
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      console.error('[Supabase] ❌ Gagal memuat data:', errorMsg);
      setConnectionError(errorMsg);
      setIsConnected(false);
      // Keep using initial data as fallback
    }

    setIsLoading(false);
  }

  async function seedInitialData() {
    try {
      await Promise.all([
        upsertPatients(INITIAL_PATIENTS),
        upsertTemplates(INITIAL_TEMPLATES),
        dbInsertMessages(INITIAL_MESSAGES),
        dbSaveAutomationSettings(INITIAL_AUTOMATION_SETTINGS),
        dbSaveBSPConfig(INITIAL_BSP_CONFIG),
        upsertAnalytics(INITIAL_ANALYTICS),
      ]);
      console.log('[Supabase] ✅ Seed data awal berhasil!');
    } catch (err) {
      console.error('[Supabase] ❌ Gagal seed data awal:', err);
    }
  }

  // ---- Sync helpers (fire-and-forget to Supabase) ----
  // These are called AFTER local state updates for optimistic UI

  const syncPatient = async (patient: Patient) => {
    try { await dbUpsertPatient(patient); }
    catch (e) { console.error('[Supabase] sync patient error:', e); }
  };

  const syncDeletePatient = async (id: string) => {
    try { await dbDeletePatient(id); }
    catch (e) { console.error('[Supabase] delete patient error:', e); }
  };

  const syncDeleteAllPatients = async () => {
    try { await dbDeleteAllPatients(); }
    catch (e) { console.error('[Supabase] delete all patients error:', e); }
  };

  const syncPatientsAll = async (patients: Patient[]) => {
    try { await upsertPatients(patients); }
    catch (e) { console.error('[Supabase] sync patients error:', e); }
  };

  const syncTemplate = async (template: MessageTemplate) => {
    try { await dbUpsertTemplate(template); }
    catch (e) { console.error('[Supabase] sync template error:', e); }
  };

  const syncMessage = async (msg: WhatsAppMessage) => {
    try { await dbInsertMessage(msg); }
    catch (e) { console.error('[Supabase] sync message error:', e); }
  };

  const syncMessages = async (msgs: WhatsAppMessage[]) => {
    try { await dbInsertMessages(msgs); }
    catch (e) { console.error('[Supabase] sync messages error:', e); }
  };

  const syncUpdateMessage = async (msg: WhatsAppMessage) => {
    try { await dbUpdateMessage(msg); }
    catch (e) { console.error('[Supabase] update message error:', e); }
  };

  const syncDeleteAllMessages = async () => {
    try { await dbDeleteAllMessages(); }
    catch (e) { console.error('[Supabase] delete all messages error:', e); }
  };

  const syncAutomationSettings = async (settings: AutomationSettings) => {
    try { await dbSaveAutomationSettings(settings); }
    catch (e) { console.error('[Supabase] sync automation error:', e); }
  };

  const syncBSPConfig = async (config: BSPConfig) => {
    try { await dbSaveBSPConfig(config); }
    catch (e) { console.error('[Supabase] sync bsp error:', e); }
  };

  const syncAnalyticsAll = async (analyticsData: DailyAnalytics[]) => {
    try { await upsertAnalytics(analyticsData); }
    catch (e) { console.error('[Supabase] sync analytics error:', e); }
  };

  const syncSingleAnalytics = async (analyticsItem: DailyAnalytics) => {
    try { await upsertSingleAnalytics(analyticsItem); }
    catch (e) { console.error('[Supabase] sync analytics error:', e); }
  };

  return {
    patients, setPatients,
    templates, setTemplates,
    messages, setMessages,
    bspConfig, setBspConfig,
    analytics, setAnalytics,
    automationSettings, setAutomationSettings,

    isLoading,
    isConnected,
    connectionError,

    syncPatient,
    syncDeletePatient,
    syncDeleteAllPatients,
    syncPatients: syncPatientsAll,
    syncTemplate,
    syncMessage,
    syncMessages,
    syncUpdateMessage,
    syncDeleteAllMessages,
    syncAutomationSettings,
    syncBSPConfig,
    syncAnalytics: syncAnalyticsAll,
    syncSingleAnalytics,
  };
}
