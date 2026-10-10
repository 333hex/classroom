import React, { useState } from 'react';
import { Trash2, AlertTriangle, Key, Loader2, CheckCircle2, ShieldAlert } from 'lucide-react';
import { apiService } from '../../services/api';

interface DeleteModalProps {
  noteId: string;
  noteTitle: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const DeleteModal: React.FC<DeleteModalProps> = ({
  noteId,
  noteTitle,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [deletionToken, setDeletionToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deletionToken.trim()) {
      setError('Please provide your private deletion credential.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await apiService.deleteNote(noteId, deletionToken.trim());
      setIsSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      if (err.status === 403) {
        setError('Invalid deletion token. The credential provided does not match this note.');
      } else if (err.status === 429) {
        setError('Too many deletion attempts. Please wait a minute and try again.');
      } else {
        setError(err.message || 'Failed to delete note. Please check your credentials.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="glass-panel w-full max-w-md rounded-2xl p-6 border-slate-700/80 shadow-2xl relative">
        {isSuccess ? (
          <div className="text-center py-6">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-slate-100 mb-1">Note Deleted</h3>
            <p className="text-xs text-slate-400">
              The educational note and its stored assets have been permanently removed.
            </p>
          </div>
        ) : (
          <div>
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/20">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100">Delete Note</h3>
                <p className="text-xs text-slate-400">Permanent owner-controlled deletion</p>
              </div>
            </div>

            <div className="bg-surface-50/60 rounded-xl p-3 border border-slate-800 mb-4 text-xs text-slate-300">
              <span className="font-semibold text-white">Target note: </span>
              <span className="italic">"{noteTitle}"</span>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 mb-4 text-xs text-amber-300 flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
              <p>
                This action is irreversible. Enter the private deletion credential issued when you uploaded this resource.
              </p>
            </div>

            {error && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs rounded-xl p-3 mb-4 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleDelete} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-primary" />
                  Private Deletion Credential
                </label>
                <input
                  type="text"
                  required
                  placeholder="Paste your 64-character token here..."
                  value={deletionToken}
                  onChange={(e) => setDeletionToken(e.target.value)}
                  className="w-full bg-surface-50 border border-slate-700 rounded-lg px-3.5 py-2.5 text-xs text-slate-100 font-mono placeholder-slate-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isLoading}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-surface-100 hover:bg-surface-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !deletionToken.trim()}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-600/20 disabled:opacity-50 transition-all duration-200"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    'Confirm Deletion'
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
