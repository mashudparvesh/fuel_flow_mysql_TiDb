import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { CsvExportMenu } from './CsvExportMenu';

export interface TablePaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
  onExportCurrentPageCsv?: () => void;
  onExportAllCsv?: () => void;
  entityName?: string;
  itemName?: string; // Compatibility alias
  totalUnfilteredItems?: number;
  className?: string;
}

export const TablePagination: React.FC<TablePaginationProps> = ({
  currentPage,
  totalItems,
  pageSize = 10,
  onPageChange,
  onExportCurrentPageCsv,
  onExportAllCsv,
  entityName,
  itemName,
  totalUnfilteredItems,
  className = ''
}) => {
  const resolvedEntityName = entityName || itemName || 'entries';
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);

  const startItem = totalItems === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const endItem = Math.min(safePage * pageSize, totalItems);
  const currentPageCount = Math.max(0, endItem - startItem + 1);

  // Generate visible page numbers
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (safePage <= 4) {
        pages.push(1, 2, 3, 4, 5, '...', totalPages);
      } else if (safePage >= totalPages - 3) {
        pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', safePage - 1, safePage, safePage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  const hasCsvExport = Boolean(onExportCurrentPageCsv || onExportAllCsv);

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-3 px-3 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 rounded-b-xl text-xs ${className}`}
    >
      {/* Left: Summary text & Current View badge */}
      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-medium">
        <span>
          Showing <span className="font-bold text-slate-800 dark:text-slate-200">{startItem}</span> to{' '}
          <span className="font-bold text-slate-800 dark:text-slate-200">{endItem}</span> of{' '}
          <span className="font-bold text-slate-800 dark:text-slate-200">{totalItems}</span> {resolvedEntityName}
        </span>
        {totalUnfilteredItems !== undefined && totalUnfilteredItems > totalItems && (
          <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
            (filtered from {totalUnfilteredItems})
          </span>
        )}
        {totalPages > 1 && (
          <span className="hidden md:inline-block px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50 text-[10px] font-bold">
            Page {safePage} of {totalPages} ({pageSize}/page)
          </span>
        )}
      </div>

      {/* Right: CSV Download & Page Navigation Buttons */}
      <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-end">
        {/* CSV Export Dropdown (Current View & Whole List) with upward drop */}
        {hasCsvExport && (
          <CsvExportMenu
            onExportCurrentPage={onExportCurrentPageCsv}
            onExportAll={onExportAllCsv}
            currentPage={safePage}
            totalPages={totalPages}
            currentPageCount={currentPageCount}
            totalFilteredCount={totalItems}
            totalUnfilteredCount={totalUnfilteredItems}
            startItem={startItem}
            endItem={endItem}
            entityName={resolvedEntityName}
            dropDirection="up"
          />
        )}

        {/* Previous Page */}
        <button
          type="button"
          onClick={() => onPageChange(safePage - 1)}
          disabled={safePage <= 1}
          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-semibold"
          title="Previous Page"
          aria-label="Previous Page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Page numbers */}
        <div className="flex items-center gap-1">
          {getPageNumbers().map((p, idx) => {
            if (typeof p === 'string') {
              return (
                <span key={`dots-${idx}`} className="px-1.5 text-slate-400 text-xs">
                  •••
                </span>
              );
            }
            const isCurrent = p === safePage;
            return (
              <button
                key={`page-${p}`}
                type="button"
                onClick={() => onPageChange(p)}
                className={`min-w-[28px] h-7 px-1.5 rounded-lg text-xs font-bold transition-all ${
                  isCurrent
                    ? 'bg-amber-500 text-white dark:bg-amber-400 dark:text-slate-950 shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                }`}
              >
                {p}
              </button>
            );
          })}
        </div>

        {/* Next Page */}
        <button
          type="button"
          onClick={() => onPageChange(safePage + 1)}
          disabled={safePage >= totalPages}
          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-semibold"
          title="Next Page"
          aria-label="Next Page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
