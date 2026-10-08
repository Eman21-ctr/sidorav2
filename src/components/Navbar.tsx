import { Activity, Radio, HelpCircle, Send, Users, Calendar, MessageSquare, Smartphone, FileBarChart2, Settings2, BellRing, Clock, Sparkles, ClipboardEdit } from 'lucide-react';
import { BSPConfig } from '../types';
import { SidoraLogo } from './SidoraLogo';

export type NavTab = 'dashboard' | 'manual_dashboard' | 'pasien' | 'otomasi' | 'kirim_pesan' | 'simulator' | 'laporan';

interface NavbarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  bspConfig: BSPConfig;
  isAutomationActive: boolean;

  onTriggerQuickSend: () => void;
  unreadRepliesCount: number;
  pendingQueueCount: number;
  pendingSendCount?: number; // jumlah pesan hari ini yang belum dikirim
}

export const Navbar = ({
  currentTab,
  onSelectTab,
  bspConfig,
  isAutomationActive,

  onTriggerQuickSend,
  unreadRepliesCount,
  pendingQueueCount,
  pendingSendCount,
}: NavbarProps) => {
  // Main tabs
  interface TabItem {
    id: NavTab;
    label: string;
    icon: any;
    badge?: string;
    badgeColor?: string;
  }

  const primaryTabs: TabItem[] = [
    { id: 'dashboard' as NavTab, label: 'Dasbor Utama', icon: Activity },
    { id: 'manual_dashboard' as NavTab, label: 'Dasbor Entri Manual', icon: ClipboardEdit },
    { id: 'pasien' as NavTab, label: 'Data Pasien & Caregiver', icon: Users },
    { id: 'otomasi' as NavTab, label: 'Setting Pesan Otomatis', icon: BellRing },
    {
      id: 'kirim_pesan' as NavTab,
      label: 'Kirim Pesan',
      icon: Send,
      badge: pendingSendCount && pendingSendCount > 0 ? `${pendingSendCount}` : undefined,
    },
  ];


  // Secondary tools for presentation/audit
  const secondaryTabs = [
    { 
      id: 'simulator' as NavTab, 
      label: 'Simulator Chat WA', 
      icon: Smartphone,
      badge: unreadRepliesCount > 0 ? `${unreadRepliesCount} balasan` : undefined,
    },
    { id: 'laporan' as NavTab, label: 'Laporan & Audit', icon: FileBarChart2 },
  ];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      {/* Top Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Logotext */}
          <div 
            className="cursor-pointer"
            onClick={() => onSelectTab('dashboard')}
            title="Kembali ke Dasbor Utama"
          >
            <SidoraLogo size="md" />
          </div>
        </div>
      </div>

      {/* Navigation Tabs Bar - Simplified to 3 Core Menus + Secondary Tools */}
      <div className="border-t border-slate-200 bg-slate-50/80 overflow-x-auto scrollbar-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3 sm:gap-4 min-w-max">
          
          {/* Main Menus */}
          <nav className="flex space-x-1.5 sm:space-x-2 py-2 shrink-0">
            {primaryTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = currentTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onSelectTab(tab.id)}
                  className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-white text-emerald-900 shadow-xs border border-emerald-300 font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span
                      className={`ml-1 px-2 py-0.5 text-[10px] font-bold rounded-full text-white ${
                        tab.badgeColor || 'bg-emerald-600'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Secondary Tools (Simulator & Logs) */}
          <div className="flex items-center gap-1.5 py-2 pl-3 sm:pl-4 border-l border-slate-200 text-xs shrink-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1 whitespace-nowrap">
              Alat Tambahan:
            </span>
            {secondaryTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = currentTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onSelectTab(tab.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-slate-200 text-slate-900 font-bold'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span className="ml-0.5 px-1 py-0.2 rounded bg-emerald-500 text-white text-[9px]">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

        </div>
      </div>
    </header>
  );
};

