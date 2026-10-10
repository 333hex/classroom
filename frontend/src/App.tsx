import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { HomePage } from './pages/HomePage';
import { BrowseNotesPage } from './pages/BrowseNotesPage';
import { UploadNotesPage } from './pages/UploadNotesPage';
import { NoteDetailPage } from './pages/NoteDetailPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-background text-slate-100 font-sans selection:bg-primary selection:text-white">
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/notes" element={<BrowseNotesPage />} />
            <Route path="/notes/:id" element={<NoteDetailPage />} />
            <Route path="/upload" element={<UploadNotesPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
};

export default App;
