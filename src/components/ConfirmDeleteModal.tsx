import React, { useState } from 'react';
import { AlertTriangle, Trash2, Loader2, X } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const ConfirmDeleteModal: React.FC = () => {
  const { confirmDeleteModal, closeConfirmDelete } = useApp();
  const [isDeleting, setIsDeleting] = useState(false);

  if (!confirmDeleteModal || !confirmDeleteModal.isOpen) return null;

  const handleConfirm = async () => {
    try {
      setIsDeleting(true);
      await confirmDeleteModal.onConfirm();
    } catch (err) {
      console.error('Delete confirmation action error:', err);
    } finally {
      setIsDeleting(false);
      closeConfirmDelete();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden transform transition-all">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-rose-50/50 dark:bg-rose-950/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/50 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {confirmDeleteModal.title || 'Confirm Deletion'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                This action is destructive and permanent
              </p>
            </div>
          </div>
          <button
            onClick={closeConfirmDelete}
            disabled={isDeleting}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed mb-3">
            {confirmDeleteModal.message}
          </p>
          {confirmDeleteModal.entityName && (
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 font-semibold text-slate-900 dark:text-white text-sm mb-4">
              {confirmDeleteModal.entityName}
            </div>
          )}
          <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
            ⚠️ Once deleted, this record cannot be recovered and will be permanently removed from database storage and local state.
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={closeConfirmDelete}
            disabled={isDeleting}
            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isDeleting}
            className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 rounded-xl shadow-lg shadow-rose-600/20 transition-all disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Deleting & Syncing...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                Yes, Permanently Delete
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
