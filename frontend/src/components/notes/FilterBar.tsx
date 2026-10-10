import React from 'react';
import { Search, X, RotateCcw, Filter } from 'lucide-react';
import { NoteFilters, ResourceType } from '../../types/note';

interface FilterBarProps {
  filters: NoteFilters;
  subjects: string[];
  onChange: (filters: NoteFilters) => void;
  onClear: () => void;
}

const RESOURCE_TYPES: { value: ResourceType; label: string }[] = [
  { value: 'pdf', label: 'PDF Document' },
  { value: 'doc', label: 'Word (.doc)' },
  { value: 'docx', label: 'Word (.docx)' },
  { value: 'image', label: 'Image Note' },
  { value: 'typed', label: 'Typed Notes' },
  { value: 'video_link', label: 'Video Link' },
  { value: 'website_link', label: 'Reference Web' },
];

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  subjects,
  onChange,
  onClear,
}) => {
  const hasActiveFilters = Boolean(
    filters.search ||
    filters.subject ||
    filters.resource_type ||
    filters.unit_number ||
    filters.class_date ||
    filters.sort === 'oldest'
  );

  return (
    <div className="glass-panel rounded-xl p-4 sm:p-5 mb-8 border border-slate-800">
      {/* Top row: Search input & Sort */}
      <div className="flex flex-col md:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search notes by title, topic, or description..."
            value={filters.search || ''}
            onChange={(e) => onChange({ ...filters, search: e.target.value, page: 1 })}
            className="w-full pl-10 pr-4 py-2.5 bg-surface-50/70 border border-slate-700/80 rounded-lg text-sm text-white placeholder-slate-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
          />
          {filters.search && (
            <button
              onClick={() => onChange({ ...filters, search: '', page: 1 })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filters.sort || 'newest'}
            onChange={(e) => onChange({ ...filters, sort: e.target.value as 'newest' | 'oldest', page: 1 })}
            className="bg-surface-50/70 border border-slate-700/80 rounded-lg px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-primary"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>

          {hasActiveFilters && (
            <button
              onClick={onClear}
              className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-white bg-surface-50/70 hover:bg-surface-100 border border-slate-700/80 transition-colors"
              title="Clear all filters"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Secondary filter fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        {/* Subject dropdown */}
        <div>
          <label className="block text-[11px] font-medium uppercase tracking-wider text-slate-400 mb-1">
            Subject
          </label>
          <select
            value={filters.subject || ''}
            onChange={(e) => onChange({ ...filters, subject: e.target.value, page: 1 })}
            className="w-full bg-surface-50/70 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-primary"
          >
            <option value="">All Subjects</option>
            {subjects.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* Resource Type */}
        <div>
          <label className="block text-[11px] font-medium uppercase tracking-wider text-slate-400 mb-1">
            Resource Type
          </label>
          <select
            value={filters.resource_type || ''}
            onChange={(e) => onChange({ ...filters, resource_type: e.target.value as ResourceType | '', page: 1 })}
            className="w-full bg-surface-50/70 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-primary"
          >
            <option value="">All Types</option>
            {RESOURCE_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        {/* Unit Number */}
        <div>
          <label className="block text-[11px] font-medium uppercase tracking-wider text-slate-400 mb-1">
            Unit Number
          </label>
          <input
            type="number"
            min="1"
            placeholder="e.g. 1, 2, 3"
            value={filters.unit_number ?? ''}
            onChange={(e) => onChange({ 
              ...filters, 
              unit_number: e.target.value ? parseInt(e.target.value, 10) : undefined,
              page: 1 
            })}
            className="w-full bg-surface-50/70 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-primary"
          />
        </div>

        {/* Class Date */}
        <div>
          <label className="block text-[11px] font-medium uppercase tracking-wider text-slate-400 mb-1">
            Class Date
          </label>
          <input
            type="date"
            value={filters.class_date || ''}
            onChange={(e) => onChange({ ...filters, class_date: e.target.value, page: 1 })}
            className="w-full bg-surface-50/70 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-primary"
          />
        </div>
      </div>
    </div>
  );
};
