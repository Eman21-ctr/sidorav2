import React from 'react';

interface SidoraLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  textColor?: string;
  className?: string;
}

export const SidoraLogo: React.FC<SidoraLogoProps> = ({
  size = 'md',
  showText = true,
  textColor = 'text-slate-900',
  className = '',
}) => {
  const sizeMap = {
    sm: { icon: 'w-7 h-7', text: 'text-base', sub: 'text-[9px]', badge: 'text-[9px] px-1.5 py-0.2' },
    md: { icon: 'w-9 h-9 sm:w-10 sm:h-10', text: 'text-lg sm:text-xl', sub: 'text-[10px] sm:text-[11px]', badge: 'text-[10px] px-2 py-0.5' },
    lg: { icon: 'w-12 h-12 sm:w-14 sm:h-14', text: 'text-2xl', sub: 'text-xs', badge: 'text-xs px-2.5 py-0.5' },
    xl: { icon: 'w-20 h-20', text: 'text-3xl', sub: 'text-sm', badge: 'text-xs px-3 py-1' },
  };

  const currentSize = sizeMap[size];

  return (
    <div className={`flex items-center gap-2.5 sm:gap-3 ${className}`}>
      {/* Visual Logomark / Icon */}
      <div className={`${currentSize.icon} rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-emerald-500 flex items-center justify-center p-2 text-white shadow-lg shadow-emerald-600/25 border border-emerald-400/30 shrink-0 relative overflow-hidden group`}>
        {/* Subtle background glow */}
        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
        
        {/* SVG Medical & Chat Bell Emblem */}
        <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-sm">
          {/* Medical Cross Base */}
          <rect x="17" y="6" width="6" height="28" rx="3" fill="white" />
          <rect x="6" y="17" width="28" height="6" rx="3" fill="white" />
          
          {/* Center Heart Pulse Dot */}
          <circle cx="20" cy="20" r="4.5" fill="#34d399" />
          <circle cx="20" cy="20" r="2" fill="white" />

          {/* Orbit Nodes */}
          <circle cx="20" cy="6" r="1.8" fill="#a7f3d0" />
          <circle cx="20" cy="34" r="1.8" fill="#a7f3d0" />
          <circle cx="6" cy="20" r="1.8" fill="#a7f3d0" />
          <circle cx="34" cy="20" r="1.8" fill="#a7f3d0" />
        </svg>
      </div>

      {/* Logotext */}
      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className={`font-extrabold tracking-tight ${textColor} ${currentSize.text} leading-none flex items-center`}>
              SIDO<span className="text-emerald-600">RA</span>
            </span>
            <span className={`font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 rounded-md border border-emerald-300/60 ${currentSize.badge}`}>
              RSJ Naimata
            </span>
          </div>
          <p className={`text-slate-500 font-medium ${currentSize.sub} leading-tight tracking-normal mt-0.5`}>
            Sistem Informasi Digital Pengobatan Rawat Jalan
          </p>
        </div>
      )}
    </div>
  );
};
