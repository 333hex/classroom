import React from 'react';
import { 
  FileText, 
  FileCode, 
  Image as ImageIcon, 
  FileEdit, 
  Video, 
  Globe, 
  Download, 
  Eye, 
  Calendar, 
  BookMarked,
  Layers
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Note, ResourceType } from '../../types/note';
import { formatDate, formatFileSize } from '../../utils/formatters';

interface NoteCardProps {
  note: Note;
  onPreview?: (note: Note) => void;
  onDownload?: (note: Note) => void;
}

export const getResourceTypeBadge = (type: ResourceType) => {
  switch (type) {
    case 'pdf':
      return {
        label: 'PDF Document',
        icon: FileText,
        color: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
      };
    case 'doc':
    case 'docx':
      return {
        label: 'Word Document',
        icon: FileCode,
        color: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      };
    case 'image':
      return {
        label: 'Image Note',
        icon: ImageIcon,
        color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      };
    case 'typed':
      return {
        label: 'Typed Notes',
        icon: FileEdit,
        color: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      };
    case 'video_link':
      return {
        label: 'Video Link',
        icon: Video,
        color: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      };
    case 'website_link':
      return {
        label: 'Reference Web',
        icon: Globe,
        color: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
      };
  }
};

export const NoteCard: React.FC<NoteCardProps> = ({ note, onPreview, onDownload }) => {
  const badge = getResourceTypeBadge(note.resource_type);
  const BadgeIcon = badge.icon;
  const isFileBased = ['pdf', 'doc', 'docx', 'image'].includes(note.resource_type);
  const isExternalLink = ['video_link', 'website_link'].includes(note.resource_type);

  return (
    <div className="glass-card rounded-xl p-5 flex flex-col justify-between transition-all duration-300 group">
      <div>
        {/* Header with Type & Subject */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${badge.color}`}>
            <BadgeIcon className="w-3.5 h-3.5" />
            {badge.label}
          </span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-surface-100 text-slate-300 border border-slate-700/50">
            {note.subject}
          </span>
        </div>

        {/* Title */}
        <Link to={`/notes/${note.id}`} className="block">
          <h3 className="text-base font-semibold text-slate-100 group-hover:text-primary-light transition-colors line-clamp-1 mb-1.5">
            {note.title}
          </h3>
        </Link>

        {/* Description */}
        {note.description ? (
          <p className="text-xs text-slate-400 line-clamp-2 mb-3 leading-relaxed">
            {note.description}
          </p>
        ) : (
          <p className="text-xs text-slate-500 italic mb-3">No description provided</p>
        )}

        {/* Tags / Meta details */}
        <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 mb-4 pt-3 border-t border-slate-800/60">
          {note.unit_number !== null && note.unit_number !== undefined && (
            <div className="flex items-center gap-1.5 truncate">
              <Layers className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span>Unit {note.unit_number}</span>
            </div>
          )}
          {note.topic && (
            <div className="flex items-center gap-1.5 truncate">
              <BookMarked className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span className="truncate">{note.topic}</span>
            </div>
          )}
          {note.class_date && (
            <div className="flex items-center gap-1.5 truncate">
              <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span>{formatDate(note.class_date)}</span>
            </div>
          )}
          {isFileBased && note.file_size && (
            <div className="flex items-center gap-1.5 truncate text-slate-400">
              <span className="font-mono text-[10px] bg-surface-100/80 px-1.5 py-0.5 rounded border border-slate-700/40">
                {formatFileSize(note.file_size)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between gap-2">
        <Link
          to={`/notes/${note.id}`}
          className="inline-flex items-center gap-1.5 text-xs text-slate-300 hover:text-white font-medium transition-colors"
        >
          <Eye className="w-3.5 h-3.5" />
          View Details
        </Link>

        <div className="flex items-center gap-2">
          {isExternalLink && note.external_url && (
            <a
              href={note.external_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-surface-100 hover:bg-surface-200 text-slate-200 transition-colors"
            >
              <Globe className="w-3.5 h-3.5" />
              Visit
            </a>
          )}

          {isFileBased && (
            <button
              onClick={() => onDownload ? onDownload(note) : window.open(`/api/v1/notes/${note.id}/download`, '_blank')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary/20 hover:bg-primary/30 text-primary-light border border-primary/30 transition-colors"
              title="Download file"
            >
              <Download className="w-3.5 h-3.5" />
              Download
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
