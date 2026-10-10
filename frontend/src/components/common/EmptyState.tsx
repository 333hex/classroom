import React from 'react';
import { FolderSearch, PlusCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

interface EmptyStateProps {
  title?: string;
  message?: string;
  actionText?: string;
  actionHref?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No resources found',
  message = 'Try adjusting your search criteria or filters, or be the first to contribute notes!',
  actionText = 'Upload Notes',
  actionHref = '/upload',
}) => {
  return (
    <div className="glass-card rounded-xl p-10 max-w-md mx-auto text-center border-slate-800 my-10">
      <div className="w-14 h-14 rounded-2xl bg-surface-100 flex items-center justify-center mx-auto mb-4 border border-slate-700/60 text-slate-400">
        <FolderSearch className="w-7 h-7" />
      </div>
      <h3 className="text-base font-semibold text-slate-100 mb-2">{title}</h3>
      <p className="text-xs text-slate-400 mb-6 leading-relaxed">{message}</p>
      {actionHref && (
        <Link
          to={actionHref}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-primary hover:bg-primary-hover text-white shadow-md shadow-primary/20 transition-all duration-200"
        >
          <PlusCircle className="w-4 h-4" />
          {actionText}
        </Link>
      )}
    </div>
  );
};
