import React, { useEffect, useState } from 'react';
import { ArrowRight, BookOpen, Download, Search, Sparkles, UploadCloud, FileText, CheckCircle2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { NoteCard } from '../components/notes/NoteCard';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { apiService } from '../services/api';
import { Note, StatsResponse } from '../types/note';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [recentNotes, setRecentNotes] = useState<Note[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [notesRes, subjectsRes, statsRes] = await Promise.allSettled([
          apiService.getNotes({ page_size: 6, sort: 'newest' }),
          apiService.getSubjects(),
          apiService.getStats(),
        ]);

        if (notesRes.status === 'fulfilled') {
          setRecentNotes(notesRes.value.items);
        }
        if (subjectsRes.status === 'fulfilled') {
          setSubjects(subjectsRes.value.subjects);
        }
        if (statsRes.status === 'fulfilled') {
          setStats(statsRes.value);
        }
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/notes?search=${encodeURIComponent(searchTerm.trim())}`);
    } else {
      navigate('/notes');
    }
  };

  return (
    <div className="space-y-16 py-6">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-800 glass-panel p-8 sm:p-14 text-center">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 text-primary-light border border-primary/20 text-xs font-semibold mb-6">
          <Sparkles className="w-3.5 h-3.5" />
          Free & Open Educational Resources
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white max-w-3xl mx-auto leading-tight mb-5">
          Share knowledge, ace your classes with{' '}
          <span className="bg-gradient-to-r from-primary-light to-blue-400 bg-clip-text text-transparent">
            Class Connect
          </span>
        </h1>

        <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto mb-8 leading-relaxed">
          A community-driven public library where students and educators can freely upload, organize, preview, and download study notes, lecture slides, diagrams, and reference guides.
        </p>

        {/* Search bar */}
        <form onSubmit={handleSearchSubmit} className="max-w-xl mx-auto flex gap-2 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by topic, unit, subject, or title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-surface-50/90 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-inner"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-3 rounded-xl bg-primary hover:bg-primary-hover text-white text-sm font-semibold shadow-lg shadow-primary/25 transition-all duration-200 shrink-0"
          >
            Search
          </button>
        </form>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-sm font-medium">
          <Link
            to="/upload"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-blue-600 hover:from-primary-hover hover:to-blue-700 text-white shadow-lg shadow-primary/20 transition-all duration-200"
          >
            <UploadCloud className="w-4 h-4" />
            Upload Notes
          </Link>
          <Link
            to="/notes"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-surface-100 hover:bg-surface-200 text-slate-200 border border-slate-700/80 transition-all duration-200"
          >
            <BookOpen className="w-4 h-4" />
            Browse Library
          </Link>
        </div>
      </section>

      {/* Real Stats Section */}
      <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <div className="glass-card rounded-2xl p-6 border border-slate-800 text-center">
          <p className="text-3xl font-extrabold text-white mb-1">
            {stats ? stats.total_notes : '—'}
          </p>
          <p className="text-xs uppercase tracking-wider text-slate-400 font-medium">
            Published Study Notes
          </p>
        </div>
        <div className="glass-card rounded-2xl p-6 border border-slate-800 text-center">
          <p className="text-3xl font-extrabold text-white mb-1">
            {stats ? stats.total_subjects : '—'}
          </p>
          <p className="text-xs uppercase tracking-wider text-slate-400 font-medium">
            Subjects Covered
          </p>
        </div>
        <div className="glass-card rounded-2xl p-6 border border-slate-800 text-center sm:col-span-2 md:col-span-1">
          <p className="text-3xl font-extrabold text-emerald-400 mb-1">100%</p>
          <p className="text-xs uppercase tracking-wider text-slate-400 font-medium">
            Free & Public Access
          </p>
        </div>
      </section>

      {/* Popular Subjects */}
      {subjects.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-100">Popular Subjects</h2>
            <Link to="/notes" className="text-xs font-semibold text-primary-light hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {subjects.slice(0, 10).map((subj) => (
              <Link
                key={subj}
                to={`/notes?subject=${encodeURIComponent(subj)}`}
                className="px-4 py-2 rounded-xl bg-surface-50 hover:bg-surface-100 border border-slate-800 text-xs font-medium text-slate-300 hover:text-white transition-colors"
              >
                {subj}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Recently Uploaded Resources */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-slate-100">Recently Uploaded Resources</h2>
            <p className="text-xs text-slate-400">Fresh materials shared by peers and educators</p>
          </div>
          <Link to="/notes" className="text-xs font-semibold text-primary-light hover:underline flex items-center gap-1">
            Browse library <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <LoadingSpinner message="Fetching latest resources..." />
        ) : recentNotes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {recentNotes.map((note) => (
              <NoteCard key={note.id} note={note} />
            ))}
          </div>
        ) : (
          <div className="glass-card rounded-2xl p-10 text-center border-slate-800">
            <FileText className="w-10 h-10 text-slate-500 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-200 mb-1">No notes uploaded yet</h3>
            <p className="text-xs text-slate-400 mb-4">
              Be the very first contributor to start building the community library!
            </p>
            <Link
              to="/upload"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-primary hover:bg-primary-hover text-white shadow-md shadow-primary/20 transition-all duration-200"
            >
              Upload Notes Now
            </Link>
          </div>
        )}
      </section>
    </div>
  );
};
