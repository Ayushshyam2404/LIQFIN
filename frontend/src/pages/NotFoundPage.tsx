import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Home, FileQuestion } from 'lucide-react';

const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-brand-surface text-brand-on-surface flex flex-col items-center justify-center p-6 select-none relative overflow-hidden">
      {/* Neo-brutalist decorative background elements */}
      <div className="absolute top-12 left-12 w-24 h-24 bg-brand-primary opacity-10 rounded-full blur-2xl pointer-events-none"></div>
      <div className="absolute bottom-16 right-16 w-32 h-32 bg-brand-secondary opacity-10 rounded-full blur-2xl pointer-events-none"></div>

      <div className="max-w-md w-full text-center space-y-8 z-10">
        {/* Stylized Neo-Brutalist Sticker / Badge */}
        <div className="inline-flex items-center gap-2 bg-brand-secondary-fixed border-2 border-brand-on-surface px-4 py-1.5 shadow-[3px_3px_0px_0px_var(--border-color)] sticker-rotate-left font-mono text-xs font-black uppercase tracking-wider">
          <FileQuestion className="w-4 h-4 animate-bounce" />
          <span>Error 404: Path Unresolved</span>
        </div>

        {/* Big styled 404 header */}
        <div className="relative inline-block">
          <h1 className="text-9xl font-black font-sans leading-none tracking-tighter text-brand-on-surface select-none pr-2">
            404
          </h1>
          <div className="absolute -bottom-2 -right-2 bg-brand-primary-fixed border-4 border-brand-on-surface px-3 py-1 font-mono text-xs font-black uppercase neo-shadow-sm sticker-rotate-right">
            PAGE_NOT_FOUND
          </div>
        </div>

        {/* Description */}
        <div className="bg-brand-surface-lowest border-4 border-brand-on-surface p-6 neo-shadow-sm space-y-3">
          <p className="font-mono text-xs font-bold uppercase text-brand-outline">
            Requested resource is offline or does not exist.
          </p>
          <p className="text-sm text-brand-on-surface/80 leading-relaxed font-sans">
            The ledger path you tried to access is not configured on this financial operating system node.
          </p>
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            onClick={() => navigate(-1)}
            aria-label="Go back to previous page"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 border-2 border-brand-on-surface font-mono text-xs font-black uppercase bg-brand-surface-lowest text-brand-on-surface hover:bg-brand-surface transition-all neo-shadow-sm pressed-state cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go Back</span>
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            aria-label="Return to dashboard home"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 border-2 border-brand-on-surface font-mono text-xs font-black uppercase bg-brand-primary text-white shadow-[4px_4px_0px_0px_var(--border-color)] pressed-state cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>Home System</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
