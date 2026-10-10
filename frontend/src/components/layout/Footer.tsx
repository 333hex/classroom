import React from 'react';
import { BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-800/80 bg-surface-50/50 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-400">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-primary" />
          <span className="font-semibold text-slate-200">Class Connect</span>
          <span>&copy; {new Date().getFullYear()} — Public Educational Notes-Sharing Platform</span>
        </div>
        <div className="flex items-center gap-6">
          <Link to="/" className="hover:text-white transition-colors">Home</Link>
          <Link to="/notes" className="hover:text-white transition-colors">Browse Notes</Link>
          <Link to="/upload" className="hover:text-white transition-colors">Upload Notes</Link>
        </div>
      </div>
    </footer>
  );
};
