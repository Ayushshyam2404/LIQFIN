import React, { useState, useRef } from 'react';
import { CreditCard as CardIcon, Wifi } from 'lucide-react';
import { useSettingsStore } from '../../store/useSettingsStore';

interface AppleCard3DProps {
  cardName: string;
  bank: string;
  creditLimit: number;
  currentBalance: number;
  dueDate: number;
  colorTheme?: string;
  cardNumberLastFour?: string;
}

export const AppleCard3D: React.FC<AppleCard3DProps> = ({
  cardName,
  bank,
  creditLimit,
  currentBalance,
  dueDate,
  colorTheme = 'purple-pink',
  cardNumberLastFour
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const { formatCurrency } = useSettingsStore();

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    
    const card = cardRef.current;
    const rect = card.getBoundingClientRect();
    
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const px = (x / rect.width) - 0.5;
    const py = (y / rect.height) - 0.5;
    
    // Smooth 3D tilt
    const maxRotation = 12;
    setRotateX(-py * maxRotation);
    setRotateY(px * maxRotation);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotateX(0);
    setRotateY(0);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  // Neo-Brutalist Solid Themes
  const getThemeStyles = () => {
    switch (colorTheme) {
      case 'blue-green':
        return {
          bg: 'bg-brand-primary-container text-white',
          stickerBg: 'bg-brand-secondary-fixed text-brand-on-surface'
        };
      case 'gold-black':
        return {
          bg: 'bg-amber-400 text-brand-on-surface',
          stickerBg: 'bg-brand-primary-container text-white'
        };
      case 'silver-blue':
        return {
          bg: 'bg-brand-secondary-fixed text-brand-on-surface',
          stickerBg: 'bg-brand-surface-lowest text-brand-on-surface'
        };
      case 'purple-pink':
      default:
        return {
          bg: 'bg-fuchsia-500 text-white',
          stickerBg: 'bg-brand-secondary-fixed text-brand-on-surface'
        };
    }
  };

  const theme = getThemeStyles();
  const utilization = Math.min(100, (currentBalance / creditLimit) * 100);

  return (
    <div className="preserve-3d w-full max-w-[360px] h-[220px] cursor-pointer" style={{ perspective: '1000px' }}>
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`relative w-full h-full rounded-none p-5 flex flex-col justify-between border-4 border-brand-on-surface shadow-[6px_6px_0px_0px_var(--border-color)] transition-all duration-200 ease-out ${theme.bg}`}
        style={{
          transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(${isHovered ? '8px' : '0px'})`,
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Card Header */}
        <div className="flex justify-between items-start" style={{ transform: 'translateZ(15px)' }}>
          <div>
            <p className="font-mono text-[9px] uppercase tracking-wider opacity-90 font-bold">{bank}</p>
            <h3 className="text-md font-black uppercase font-sans tracking-tight">{cardName}</h3>
          </div>
          <div className="flex gap-2 opacity-90">
            <Wifi className="w-4.5 h-4.5 rotate-90" />
            <CardIcon className="w-5 h-5" />
          </div>
        </div>

        {/* Card Body (Chip and Numbers) */}
        <div className="flex items-center gap-2.5 my-1" style={{ transform: 'translateZ(20px)' }}>
          <div className="w-8 h-6 bg-amber-400 border-2 border-brand-on-surface rounded-none flex items-center justify-center">
            {/* Chip Details */}
            <div className="grid grid-cols-3 gap-0.5 w-5 h-3 opacity-60">
              <div className="border-r border-b border-brand-on-surface"></div>
              <div className="border-r border-b border-brand-on-surface"></div>
              <div className="border-b border-brand-on-surface"></div>
              <div className="border-r border-brand-on-surface"></div>
              <div className="border-r border-brand-on-surface"></div>
              <div></div>
            </div>
          </div>
          <span className="font-mono text-[13px] font-bold tracking-wider">•••• •••• •••• {cardNumberLastFour || '4490'}</span>
        </div>

        {/* Card Footer (Balances and Utilization) */}
        <div className="space-y-2" style={{ transform: 'translateZ(10px)' }}>
          <div className="flex justify-between items-end">
            <div>
              <p className="text-[8px] uppercase tracking-wider opacity-75 font-bold">Outstanding</p>
              <p className="font-mono text-lg font-black leading-none">{formatCurrency(currentBalance)}</p>
            </div>
            <div className="text-right">
              <p className="text-[8px] uppercase tracking-wider opacity-75 font-bold">Limit</p>
              <p className="font-mono text-xs font-bold">{formatCurrency(creditLimit, { precision: 0 })}</p>
            </div>
          </div>

          {/* Utilization progress bar */}
          <div className="space-y-1">
            <div className="h-3 w-full bg-white/40 border-2 border-brand-on-surface rounded-none overflow-hidden">
              <div
                className="h-full bg-brand-on-surface transition-all duration-500"
                style={{ width: `${utilization}%` }}
              />
            </div>
            <div className="flex justify-between text-[7px] font-mono font-bold opacity-90">
              <span>{utilization.toFixed(0)}% DEBT RATIO</span>
              <span>DUE DAY: {dueDate}</span>
            </div>
          </div>
        </div>

        {/* Corner Sticker */}
        <div className={`absolute -top-3 -right-3 border-2 border-brand-on-surface px-2 py-0.5 font-mono text-[8px] font-black -rotate-12 shadow-[1px_1px_0px_0px_var(--border-color)] ${theme.stickerBg}`}>
          REWARDS_ON
        </div>
      </div>
    </div>
  );
};

export default AppleCard3D;
