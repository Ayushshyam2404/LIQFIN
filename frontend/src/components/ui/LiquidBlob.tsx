import React from 'react';

export const LiquidBlob: React.FC = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Dark background base */}
      <div className="absolute inset-0 bg-slate-950" />
      
      {/* Noise overlay */}
      <div 
        className="absolute inset-0 opacity-[0.015] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
        }}
      />
      
      {/* Aurora Floating Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-violet-600/20 blur-[120px] animate-aurora" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-pink-600/15 blur-[140px] animate-aurora" 
           style={{ animationDelay: '-5s', animationDuration: '25s' }} />
      <div className="absolute top-[30%] right-[10%] w-[45vw] h-[45vw] rounded-full bg-blue-600/15 blur-[120px] animate-aurora"
           style={{ animationDelay: '-10s', animationDuration: '22s' }} />
      <div className="absolute bottom-[20%] left-[10%] w-[40vw] h-[40vw] rounded-full bg-emerald-600/10 blur-[100px] animate-aurora"
           style={{ animationDelay: '-15s', animationDuration: '18s' }} />
      
      {/* Gradient light streak */}
      <div className="absolute top-0 left-1/4 w-[1px] h-full bg-gradient-to-b from-transparent via-white/5 to-transparent opacity-50" />
    </div>
  );
};

export default LiquidBlob;
