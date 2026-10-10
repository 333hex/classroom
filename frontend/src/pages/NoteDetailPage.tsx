import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Download, 
  Trash2, 
  ArrowLeft, 
  Globe, 
  Calendar, 
  Layers, 
  BookMarked, 
  FileText, 
  AlertCircle,
  FileCode,
  Share2,
  Check
} from 'lucide-react';
import { apiService } from '../services/api';
import { Note } from '../types/note';
import { formatDate, formatFileSize } from '../utils/formatters';
import { getResourceTypeBadge } from '../components/notes/NoteCard';
import { DeleteModal } from '../components/notes/DeleteModal';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorState } from '../components/common/ErrorState';

export const NoteDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [note, setNote] = useState<Note | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    apiService.getNote(id)
      .then((data) => setNote(data))
      .catch((err) => {
        setError(err.status === 404 ? 'Note not found or has been removed.' : err.message);
      })
      .finally(() => setIsLoading(false));
  }, [id]);

  const handleDownload = async () => {
    if (!note) return;
    setDownloading(true);
    setDownloadError(null);
    try {
      const url = await apiService.getDownloadUrl(note.id);
      window.open(url, '_blank');
    } catch (err: any) {
      setDownloadError(err.message || 'Unable to generate download URL. File may be unavailable.');
    } finally {
      setDownloading(false);
    }
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (isLoading) return <LoadingSpinner message="Loading note details..." />;
  if (error || !note) {
    return (
      <div className="py-12">
        <ErrorState
          title="Resource Unavailable"
          message={error || 'The note could not be retrieved.'}
          onRetry={() => navigate('/notes')}
        />
      </div>
    );
  }

  const badge = getResourceTypeBadge(note.resource_type);
  const BadgeIcon = badge.icon;
  const isFileBased = ['pdf', 'doc', 'docx', 'image'].includes(note.resource_type);
  const isExternalLink = ['video_link', 'website_link'].includes(note.resource_type);

  return (
    <div className="max-w-4xl mx-auto py-8">
      {/* Back Button */}
      <div className="flex items-center justify-between mb-6">
        <Link
          to="/notes"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Library
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={copyShareLink}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-50 hover:bg-surface-100 border border-slate-700/80 text-xs font-medium text-slate-300 transition-colors"
          >
            {copiedLink ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Link Copied</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5" />
                <span>Share</span>
              </>
            )}
          </button>

          <button
            onClick={() => setIsDeleteModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-xs font-medium text-rose-300 transition-colors"
            title="Delete this note (requires deletion key)"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete Note
          </button>
        </div>
      </div>

      {/* Main Card */}
      <div className="glass-panel rounded-2xl p-6 sm:p-8 border-slate-800 space-y-6">
        {/* Header Information */}
        <div className="border-b border-slate-800 pb-6">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold border ${badge.color}`}>
              <BadgeIcon className="w-4 h-4" />
              {badge.label}
            </span>
            <span className="text-xs font-semibold px-2.5 py-1 rounded bg-surface-100 text-slate-200 border border-slate-700">
              {note.subject}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-3">
            {note.title}
          </h1>

          {note.description && (
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-3xl">
              {note.description}
            </p>
          )}

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-800/80 text-xs text-slate-400">
            {note.unit_number !== null && (
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-slate-500" />
                <div>
                  <span className="block text-[10px] uppercase tracking-wider text-slate-400">Unit</span>
                  <span className="text-slate-200 font-semibold">{note.unit_number}</span>
                </div>
              </div>
            )}
            {note.topic && (
              <div className="flex items-center gap-2">
                <BookMarked className="w-4 h-4 text-slate-500" />
                <div>
                  <span className="block text-[10px] uppercase tracking-wider text-slate-400">Topic</span>
                  <span className="text-slate-200 font-semibold">{note.topic}</span>
                </div>
              </div>
            )}
            {note.class_date && (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-500" />
                <div>
                  <span className="block text-[10px] uppercase tracking-wider text-slate-400">Class Date</span>
                  <span className="text-slate-200 font-semibold">{formatDate(note.class_date)}</span>
                </div>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-500" />
              <div>
                <span className="block text-[10px] uppercase tracking-wider text-slate-400">Uploaded</span>
                <span className="text-slate-200 font-semibold">{formatDate(note.created_at)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Viewer / Resource Interaction */}
        <div className="pt-2">
          {downloadError && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs rounded-xl p-3 mb-4 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{downloadError}</span>
            </div>
          )}

          {/* 1. Typed Notes View */}
          {note.resource_type === 'typed' && note.typed_content && (
            <div className="bg-surface-50/90 rounded-xl p-6 border border-slate-800">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-700/50">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Notes Content
                </span>
              </div>
              <div className="text-xs sm:text-sm text-slate-200 whitespace-pre-wrap font-mono leading-relaxed selection:bg-primary selection:text-white">
                {note.typed_content}
              </div>
            </div>
          )}

          {/* 2. External Links View */}
          {isExternalLink && note.external_url && (
            <div className="bg-surface-50/70 rounded-xl p-6 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-semibold text-slate-100 mb-1">External Resource</h4>
                <p className="text-xs text-slate-400 font-mono break-all">{note.external_url}</p>
              </div>
              <a
                href={note.external_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-md shadow-primary/20 transition-all shrink-0"
              >
                <Globe className="w-4 h-4" />
                Open External Resource
              </a>
            </div>
          )}

          {/* 3. File Resources Download / Action Bar */}
          {isFileBased && (
            <div className="bg-surface-50/70 rounded-xl p-6 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-surface-100 flex items-center justify-center text-primary border border-slate-700/60">
                  <FileCode className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-100">
                    {note.original_filename || 'Educational Document'}
                  </h4>
                  <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                    {note.file_size && <span>Size: {formatFileSize(note.file_size)}</span>}
                    {note.mime_type && <span>Format: {note.mime_type}</span>}
                  </div>
                </div>
              </div>

              <button
                onClick={handleDownload}
                disabled={downloading}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-md shadow-primary/20 disabled:opacity-50 transition-all shrink-0"
              >
                <Download className="w-4 h-4" />
                {downloading ? 'Authorizing...' : 'Download Document'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteModal
        noteId={note.id}
        noteTitle={note.title}
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onSuccess={() => navigate('/notes')}
      />
    </div>
  );
};
