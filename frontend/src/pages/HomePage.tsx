import React, { useEffect, useState } from 'react';
import { ArrowRight, BookOpen, Search, UploadCloud, FileText, Library, Bookmark, GraduationCap } from 'lucide-react';
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
    <div className="space-y-14 py-7 sm:py-10">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-[2rem] glass-panel p-7 sm:p-12 lg:p-14">
        <div className="absolute -top-28 -right-24 w-80 h-80 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="relative grid lg:grid-cols-[1.2fr_.8fr] gap-10 items-center">
          <div>
            <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[.18em] font-semibold text-primary-light mb-5">
              <span className="w-7 h-px bg-primary-light/70" /> A shared shelf for better studying
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-[3.6rem] font-semibold tracking-[-.045em] text-white max-w-2xl leading-[1.06] mb-5">
              Good notes make room for <span className="text-primary-light italic font-serif">good ideas.</span>
            </h1>
            <p className="text-slate-300 text-sm sm:text-base max-w-xl mb-7 leading-relaxed">
              Find clear, useful class notes shared by students and educators. Browse by subject, pick up a new perspective, and pass your own notes along.
            </p>

        {/* Search bar */}
        <form onSubmit={handleSearchSubmit} className="max-w-xl flex gap-2 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search a subject, topic, or title"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="neo-inset w-full pl-11 pr-4 py-3 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/40"
            />
          </div>
          <button
            type="submit"
            className="neo-raised px-6 py-3 rounded-xl text-primary-light text-sm font-semibold shrink-0"
          >
            Search
          </button>
        </form>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 text-sm font-medium">
          <Link
            to="/upload"
            className="neo-raised inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-primary-light"
          >
            <UploadCloud className="w-4 h-4" />
            Upload Notes
          </Link>
          <Link
            to="/notes"
            className="neo-raised inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-slate-200"
          >
            <BookOpen className="w-4 h-4" />
            Browse Library
          </Link>
        </div>
          </div>
          <div className="relative hidden lg:flex justify-center items-center min-h-[280px]" aria-hidden="true">
            <div className="absolute w-64 h-64 rounded-full border border-white/[.07]" />
            <div className="absolute w-48 h-48 rounded-full border border-white/[.08]" />
            <div className="relative w-60 rotate-3 rounded-[1.6rem] border border-white/15 bg-gradient-to-br from-[#66785c] to-[#344536] p-5 shadow-2xl shadow-black/30">
              <div className="flex items-center justify-between text-[#edf0e2]/75 text-[10px] uppercase tracking-[.15em]"><span>Field notes</span><Bookmark className="w-4 h-4" /></div>
              <div className="mt-8 font-serif text-2xl leading-tight text-[#f5f2e5]">Ideas grow<br/>when shared.</div>
              <div className="mt-7 h-px bg-white/20" />
              <div className="mt-4 flex items-center gap-2 text-xs text-[#e0e6d3]/80"><GraduationCap className="w-4 h-4" /> Learning, together</div>
            </div>
            <div className="absolute bottom-6 right-4 rounded-2xl glass-card px-4 py-3 flex items-center gap-3 -rotate-3">
              <Library className="w-5 h-5 text-primary-light" />
              <span className="text-xs font-medium text-slate-200">A library made by learners</span>
            </div>
          </div>
        </div>
      </section>

      {/* Real Stats Section */}
      <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <div className="glass-card rounded-2xl p-6 text-center">
          <p className="text-3xl font-extrabold text-white mb-1">
            {stats ? stats.total_notes : '—'}
          </p>
          <p className="text-xs uppercase tracking-wider text-slate-400 font-medium">
            Published Study Notes
          </p>
        </div>
        <div className="glass-card rounded-2xl p-6 text-center">
          <p className="text-3xl font-extrabold text-white mb-1">
            {stats ? stats.total_subjects : '—'}
          </p>
          <p className="text-xs uppercase tracking-wider text-slate-400 font-medium">
            Subjects Covered
          </p>
        </div>
        <div className="glass-card rounded-2xl p-6 text-center sm:col-span-2 md:col-span-1">
          <p className="text-3xl font-extrabold text-primary-light mb-1">100%</p>
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
