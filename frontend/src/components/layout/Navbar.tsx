import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BookOpen, Upload, Library, Home } from 'lucide-react';

export const Navbar: React.FC = () => {
  const location = useLocation();

  const navLinks = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Browse Notes', path: '/notes', icon: Library },
    { name: 'Upload Notes', path: '/upload', icon: Upload },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-white/[.06] bg-[#141a15]/75 backdrop-blur-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[76px] flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#b7c995] to-[#718760] flex items-center justify-center text-[#1b261c] shadow-lg shadow-black/20 group-hover:rotate-[-4deg] transition-transform duration-200">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <span className="text-lg font-semibold tracking-tight text-[#f1f0e6]">Class Connect</span>
            <span className="block text-[10px] tracking-[.16em] uppercase text-slate-400 font-medium -mt-0.5">The study commons</span>
          </div>
        </Link>

        <nav aria-label="Main navigation" className="flex items-center gap-1 sm:gap-2">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-white/[.08] text-primary-light border border-white/[.1] shadow-inner'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-white/[.05]'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{link.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
