import React from 'react';
import { Fuel, ShieldCheck, Heart, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const Footer: React.FC = () => {
  const { currentTenant } = useApp();

  return (
    <footer
      id="app-global-footer"
      className="w-full mt-auto border-t border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-[#070d1a]/80 backdrop-blur-md py-4 px-4 sm:px-6 transition-all duration-300 print:hidden"
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        {/* Brand & Developer Info */}
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-3 text-slate-600 dark:text-slate-400 text-center sm:text-left">
          <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
            <div className="w-5 h-5 rounded-md bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Fuel className="w-3.5 h-3.5" />
            </div>
            <span>FuelNest</span>
            <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              v2.4
            </span>
          </div>

          <span className="hidden sm:inline text-slate-300 dark:text-slate-700">•</span>

          {/* Primary Developer Credit */}
          <div className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
            <span>Developed By</span>
            <span className="font-bold text-amber-600 dark:text-amber-400 tracking-wide">
              Md Mashud Parvesh
            </span>
          </div>
        </div>

        {/* Right side: Tenant Info & System Status */}
        <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Secure Multi-Tenant Cloud</span>
          </div>
          <span className="text-slate-300 dark:text-slate-700">•</span>
          <span>{currentTenant?.name || 'Active Fleet'}</span>
          <span className="text-slate-300 dark:text-slate-700">•</span>
          <span>&copy; {new Date().getFullYear()} FuelNest</span>
        </div>
      </div>
    </footer>
  );
};
