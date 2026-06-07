import React, { useState, useEffect } from 'react';
import { Shield, X } from 'lucide-react';

export const CookieConsent: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('liqifin-cookie-consent');
    if (!consent) {
      // Delay display slightly for a smoother transition
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
    return () => {};
  }, []);

  const handleAccept = () => {
    localStorage.setItem('liqifin-cookie-consent', 'accepted');
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem('liqifin-cookie-consent', 'declined');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div 
      className="fixed bottom-6 right-6 z-50 max-w-md w-[calc(100vw-3rem)] bg-brand-surface-lowest border-4 border-brand-on-surface p-6 shadow-[6px_6px_0px_0px_var(--border-color)] animate-in slide-in-from-bottom-5 font-sans"
      role="dialog"
      aria-labelledby="cookie-title"
      aria-describedby="cookie-desc"
    >
      {/* Decorative Neo Sticker */}
      <div className="absolute -top-3 -left-2 z-10">
        <div className="bg-brand-secondary-fixed border-2 border-brand-on-surface px-3 py-1 font-mono text-[9px] font-black uppercase tracking-wide shadow-[2px_2px_0px_0px_var(--border-color)] sticker-rotate-left">
          COOKIE_CONSENT_SYSTEM
        </div>
      </div>

      <div className="flex items-start gap-4 pt-2">
        <div className="p-2.5 bg-brand-primary-fixed border-2 border-brand-on-surface text-brand-on-surface shrink-0 shadow-[2px_2px_0px_0px_var(--border-color)] sticker-rotate-right">
          <Shield className="w-5 h-5 text-brand-primary" aria-hidden="true" />
        </div>
        <div className="flex-1 space-y-3">
          <div className="flex items-center justify-between">
            <h3 id="cookie-title" className="text-xs font-mono font-black uppercase tracking-wider text-brand-on-surface">Privacy Verification</h3>
            <button 
              onClick={handleDecline} 
              className="p-1 border border-brand-on-surface bg-brand-surface hover:bg-rose-500 hover:text-white transition-colors cursor-pointer text-brand-on-surface"
              aria-label="Close Consent Banner"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <p id="cookie-desc" className="text-xs text-brand-outline font-medium leading-relaxed">
            LIQIFIN uses cookies for secure biometric passkey handshakes, encrypted session state transfers, and local storage database synchronizers.
          </p>
          <div className="flex gap-2 justify-end pt-1">
            <button
              onClick={handleDecline}
              className="px-3 py-1.5 border-2 border-brand-on-surface font-mono text-[10px] font-black uppercase bg-brand-surface-lowest text-brand-on-surface hover:bg-brand-surface transition-all shadow-[2px_2px_0px_0px_var(--border-color)] pressed-state cursor-pointer"
            >
              Decline
            </button>
            <button
              onClick={handleAccept}
              className="px-4 py-1.5 border-2 border-brand-on-surface font-mono text-[10px] font-black uppercase bg-brand-primary text-white shadow-[3px_3px_0px_0px_var(--border-color)] pressed-state cursor-pointer"
            >
              Accept All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;

