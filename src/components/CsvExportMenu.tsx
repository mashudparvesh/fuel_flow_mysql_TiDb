import React, { useState, useRef, useEffect } from 'react';
import { Download, FileSpreadsheet, ChevronDown, Check, Filter } from 'lucide-react';

export interface CsvExportMenuProps {
  onExportCurrentPage?: () => void;
  onExportAll?: () => void;
  currentPage?: number;
  totalPages?: number;
  currentPageCount?: number;
  totalFilteredCount: number;
  totalUnfilteredCount?: number;
  startItem?: number;
  endItem?: number;
  entityName?: string;
  buttonLabel?: string;
  buttonVariant?: 'default' | 'compact' | 'header' | 'outline';
  dropDirection?: 'up' | 'down' | 'auto';
  className?: string;
}

export const CsvExportMenu: React.FC<CsvExportMenuProps> = ({
  onExportCurrentPage,
  onExportAll,
  currentPage = 1,
  totalPages = 1,
  currentPageCount,
  totalFilteredCount,
  totalUnfilteredCount,
  startItem,
  endItem,
  entityName = 'records',
  buttonLabel = 'Download CSV',
  buttonVariant = 'default',
  dropDirection = 'auto',
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [effectiveDirection, setEffectiveDirection] = useState<'up' | 'down'>('down');

  // Compute item numbers if not provided
  const computedStart = startItem ?? (totalFilteredCount === 0 ? 0 : (currentPage - 1) * 10 + 1);
  const computedEnd = endItem ?? Math.min(currentPage * 10, totalFilteredCount);
  const currentCount = currentPageCount ?? (totalFilteredCount === 0 ? 0 : Math.max(0, computedEnd - computedStart + 1));
  const isFiltered = totalUnfilteredCount !== undefined && totalUnfilteredCount > totalFilteredCount;

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Determine drop direction
  useEffect(() => {
    if (!isOpen) return;
    if (dropDirection === 'up') {
      setEffectiveDirection('up');
    } else if (dropDirection === 'down') {
      setEffectiveDirection('down');
    } else if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      // If less than 240px below, open upwards
      setEffectiveDirection(spaceBelow < 240 ? 'up' : 'down');
    }
  }, [isOpen, dropDirection]);

  const handleExportCurrent = () => {
    setIsOpen(false);
    if (onExportCurrentPage) {
      onExportCurrentPage();
      showToast(`Downloaded ${currentCount} records (Current Page ${currentPage})`);
    }
  };

  const handleExportAllList = () => {
    setIsOpen(false);
    if (onExportAll) {
      onExportAll();
      showToast(
        isFiltered
          ? `Downloaded ${totalFilteredCount} records (Whole Filtered List)`
          : `Downloaded ${totalFilteredCount} records (Entire List)`
      );
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Button styles based on variant
  let btnClasses =
    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-all shadow-2xs select-none';

  if (buttonVariant === 'header') {
    btnClasses +=
      ' bg-white dark:bg-[#0f1a36] hover:bg-slate-50 dark:hover:bg-[#142247] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-blue-900/60';
  } else if (buttonVariant === 'compact') {
    btnClasses +=
      ' px-2.5 py-1 text-[11px] rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/50';
  } else if (buttonVariant === 'outline') {
    btnClasses +=
      ' bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700';
  } else {
    // Default pagination button
    btnClasses +=
      ' bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/50';
  }

  return (
    <div className={`relative inline-block ${className}`} ref={menuRef}>
      {/* Trigger Button */}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className={btnClasses}
        aria-expanded={isOpen}
        aria-haspopup="true"
        title="Download CSV (Current Page vs Whole List)"
      >
        <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
        <span>{buttonLabel}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Toast notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white dark:bg-emerald-900 dark:text-emerald-100 text-xs font-bold shadow-2xl border border-slate-800 dark:border-emerald-700 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className={`absolute right-0 z-50 w-72 sm:w-80 rounded-2xl bg-white dark:bg-[#0c162d] border border-slate-200 dark:border-slate-700 shadow-2xl p-2 space-y-1.5 transition-all text-slate-800 dark:text-slate-100 ${
            effectiveDirection === 'up'
              ? 'bottom-full mb-2 origin-bottom-right'
              : 'top-full mt-2 origin-top-right'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-slate-100 dark:border-slate-800 text-[11px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">
            <span>Export CSV</span>
            {isFiltered && (
              <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50 font-bold lowercase">
                <Filter className="w-2.5 h-2.5" />
                filtered
              </span>
            )}
          </div>

          {/* Option 1: Current View / Page Only */}
          {onExportCurrentPage && (
            <button
              type="button"
              onClick={handleExportCurrent}
              className="w-full text-left p-2.5 rounded-xl hover:bg-emerald-50/80 dark:hover:bg-emerald-950/40 border border-transparent hover:border-emerald-200 dark:hover:border-emerald-800/60 transition-all group"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2.5">
                  <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 mt-0.5 group-hover:scale-105 transition-transform">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-extrabold text-xs text-slate-800 dark:text-slate-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-300 flex items-center gap-1.5">
                      <span>Current View (Current Page)</span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                      Rows {computedStart}–{computedEnd} (Page {currentPage} of {totalPages})
                    </div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                      Only downloads the {currentCount} rows visible on this page
                    </div>
                  </div>
                </div>
                <span className="shrink-0 text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800/60">
                  {currentCount} rows
                </span>
              </div>
            </button>
          )}

          {/* Option 2: Whole List / Filtered List */}
          {onExportAll && (
            <button
              type="button"
              onClick={handleExportAllList}
              className="w-full text-left p-2.5 rounded-xl hover:bg-blue-50/80 dark:hover:bg-blue-950/40 border border-transparent hover:border-blue-200 dark:hover:border-blue-800/60 transition-all group"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2.5">
                  <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 mt-0.5 group-hover:scale-105 transition-transform">
                    <Download className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-extrabold text-xs text-slate-800 dark:text-slate-100 group-hover:text-blue-700 dark:group-hover:text-blue-300 flex items-center gap-1.5">
                      <span>Complete Dataset (All Records)</span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                      {isFiltered ? (
                        <span>
                          All <strong className="text-slate-700 dark:text-slate-200">{totalFilteredCount}</strong> filtered rows (out of {totalUnfilteredCount} total)
                        </span>
                      ) : (
                        <span>
                          All <strong className="text-slate-700 dark:text-slate-200">{totalFilteredCount}</strong> {entityName} in list
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                      {isFiltered
                        ? `Downloads all ${totalFilteredCount} rows matching active filters`
                        : `Downloads all ${totalFilteredCount} rows in the entire table`}
                    </div>
                  </div>
                </div>
                <span className="shrink-0 text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-800/60">
                  {totalFilteredCount} rows
                </span>
              </div>
            </button>
          )}

          {/* Footer note */}
          <div className="pt-2 px-2.5 pb-1 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 dark:text-slate-500 flex items-center justify-between">
            <span>Microsoft Excel & Google Sheets Ready</span>
            <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">UTF-8 BOM</span>
          </div>
        </div>
      )}
    </div>
  );
};
