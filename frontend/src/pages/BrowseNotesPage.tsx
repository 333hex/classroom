import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { NoteCard } from '../components/notes/NoteCard';
import { FilterBar } from '../components/notes/FilterBar';
import { Pagination } from '../components/common/Pagination';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorState } from '../components/common/ErrorState';
import { EmptyState } from '../components/common/EmptyState';
import { apiService } from '../services/api';
import { Note, NoteFilters, ResourceType } from '../types/note';

export const BrowseNotesPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [notes, setNotes] = useState<Note[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [totalNotes, setTotalNotes] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Derive filters from URL search params
  const filters: NoteFilters = {
    search: searchParams.get('search') || '',
    subject: searchParams.get('subject') || '',
    resource_type: (searchParams.get('resource_type') as ResourceType) || '',
    unit_number: searchParams.get('unit_number') ? parseInt(searchParams.get('unit_number')!, 10) : undefined,
    class_date: searchParams.get('class_date') || '',
    sort: (searchParams.get('sort') as 'newest' | 'oldest') || 'newest',
    page: parseInt(searchParams.get('page') || '1', 10),
    page_size: 12,
  };

  // Fetch subjects list once
  useEffect(() => {
    apiService.getSubjects()
      .then((res) => setSubjects(res.subjects))
      .catch((err) => console.error('Failed to load subjects', err));
  }, []);

  // Fetch notes when filters change
  const fetchNotes = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiService.getNotes(filters);
      setNotes(data.items);
      setTotalNotes(data.total);
      setTotalPages(data.total_pages);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch notes. Please verify backend connectivity.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [searchParams]);

  // Handle filter changes and update URL
  const handleFilterChange = (newFilters: NoteFilters) => {
    const params = new URLSearchParams();
    if (newFilters.search) params.set('search', newFilters.search);
    if (newFilters.subject) params.set('subject', newFilters.subject);
    if (newFilters.resource_type) params.set('resource_type', newFilters.resource_type);
    if (newFilters.unit_number !== undefined && !isNaN(newFilters.unit_number)) {
      params.set('unit_number', newFilters.unit_number.toString());
    }
    if (newFilters.class_date) params.set('class_date', newFilters.class_date);
    if (newFilters.sort && newFilters.sort !== 'newest') params.set('sort', newFilters.sort);
    if (newFilters.page && newFilters.page > 1) params.set('page', newFilters.page.toString());

    setSearchParams(params);
  };

  const handleClearFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  const handlePageChange = (newPage: number) => {
    handleFilterChange({ ...filters, page: newPage });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="py-6">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Public Notes Library</h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Explore study materials shared across units, subjects, and topics
        </p>
      </div>

      {/* Filter & Search Bar */}
      <FilterBar
        filters={filters}
        subjects={subjects}
        onChange={handleFilterChange}
        onClear={handleClearFilters}
      />

      {/* Result Status / Counter */}
      <div className="flex items-center justify-between mb-4 text-xs text-slate-400">
        <span>
          Showing <span className="text-white font-medium">{notes.length}</span> of{' '}
          <span className="text-white font-medium">{totalNotes}</span> resources
        </span>
      </div>

      {/* Content Rendering */}
      {isLoading ? (
        <LoadingSpinner message="Searching library notes..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchNotes} />
      ) : notes.length === 0 ? (
        <EmptyState
          title="No notes match your filters"
          message="Try adjusting your keywords, selecting a different subject, or clearing filters."
        />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {notes.map((note) => (
              <NoteCard key={note.id} note={note} />
            ))}
          </div>

          <Pagination
            currentPage={filters.page || 1}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </>
      )}
    </div>
  );
};
