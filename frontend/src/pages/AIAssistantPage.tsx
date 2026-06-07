import React, { useEffect, useState } from 'react';
import { Sparkles, Loader2, RefreshCw, AlertTriangle, ShieldCheck, Target, TrendingUp } from 'lucide-react';
import { useFinanceStore } from '../store/useFinanceStore';
import { useSettingsStore } from '../store/useSettingsStore';

export const AIAssistantPage: React.FC = () => {
  const { aiInsights, fetchAIInsights } = useFinanceStore();
  const { getCurrencySymbol } = useSettingsStore();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!aiInsights) {
      handleQueryAI();
    }
  }, []);

  const handleQueryAI = async () => {
    setLoading(true);
    await fetchAIInsights();
    setLoading(false);
  };

  const renderFormattedText = (text: string) => {
    const formatted = text.replace(/\$/g, getCurrencySymbol());
    const parts = formatted.split('**');
    return parts.map((part, i) => {
      if (i % 2 === 1) {
        return <strong key={i} className="font-black underline decoration-brand-primary decoration-2">{part}</strong>;
      }
      return part;
    });
  };

  const getObservationIcon = (text: string) => {
    if (text.includes('credit') || text.includes('utilization')) {
      return <ShieldCheck className="w-5 h-5 text-brand-primary shrink-0 mt-0.5" />;
    } else if (text.includes('budget') || text.includes('exceeded')) {
      return <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />;
    } else if (text.includes('goal') || text.includes('saved')) {
      return <Target className="w-5 h-5 text-brand-secondary shrink-0 mt-0.5" />;
    }
    return <TrendingUp className="w-5 h-5 text-brand-primary shrink-0 mt-0.5" />;
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-black text-brand-on-surface uppercase tracking-tight flex items-center gap-2 font-mono">
            <Sparkles className="w-6 h-6 text-brand-primary" />
            <span>LIQIFIN_AI_CORE</span>
          </h2>
          <p className="text-xs text-brand-outline font-medium">Get actionable, private audits of credit health and category caps.</p>
        </div>
        
        <button
          onClick={handleQueryAI}
          disabled={loading}
          className="flex items-center gap-1.5 px-4 py-2 border-2 border-brand-on-surface font-mono text-xs font-black uppercase bg-brand-surface-lowest hover:bg-brand-surface shadow-[2px_2px_0px_0px_var(--border-color)] pressed-state cursor-pointer text-brand-on-surface"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4 text-brand-primary" />
          )}
          <span>Consult AI</span>
        </button>
      </div>

      {/* Main AI Body */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-4 text-center border-4 border-dashed border-brand-on-surface bg-brand-surface-lowest neo-shadow-md">
          <Loader2 className="w-10 h-10 text-brand-primary animate-spin" />
          <div className="space-y-1">
            <p className="font-mono text-xs font-bold text-brand-on-surface">SCANNING LEDGER LOGS...</p>
            <p className="font-mono text-[9px] text-brand-outline font-bold">FORMULATING SPENDING RATIOS AND CREDIT GUIDANCE.</p>
          </div>
        </div>
      ) : aiInsights ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Summary / Observations */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Executive Summary Card */}
            <div className="border-4 border-brand-on-surface bg-brand-surface-lowest p-6 space-y-4 shadow-[4px_4px_0px_0px_var(--border-color)] relative overflow-hidden">
              <div className="absolute top-0 right-0 border-l-2 border-b-2 border-brand-on-surface bg-brand-secondary-fixed text-brand-on-surface px-3 py-1 font-mono text-[8px] font-black shadow-[1px_1px_0px_0px_var(--border-color)]">
                ANALYSIS_SUMMARY
              </div>
              <h3 className="font-sans text-xs font-black uppercase tracking-tight text-brand-on-surface font-mono pt-2">Executive Summary</h3>
              <p className="text-xs text-brand-on-surface font-bold leading-relaxed font-sans">{renderFormattedText(aiInsights.summary)}</p>
            </div>

            {/* Key Observations List */}
            <div className="space-y-4">
              <h3 className="text-xs font-black text-brand-outline uppercase tracking-widest pl-1 font-mono">Key Observations</h3>
              
              <div className="grid grid-cols-1 gap-4">
                {aiInsights.insights.map((insight: string, idx: number) => (
                  <div key={idx} className="bg-brand-surface-lowest border-2 border-brand-on-surface p-5 flex gap-4 shadow-[2px_2px_0px_0px_var(--border-color)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_0px_var(--border-color)] transition-all">
                    {getObservationIcon(insight)}
                    <div className="space-y-1 flex-1">
                      <p className="text-xs text-brand-on-surface font-bold leading-relaxed font-sans">{renderFormattedText(insight)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Actionable recommendations sidebar */}
          <div className="space-y-6">
            <div className="border-4 border-brand-on-surface bg-brand-surface-lowest p-6 flex flex-col space-y-4 shadow-[4px_4px_0px_0px_var(--border-color)]">
              <h3 className="font-sans text-xs font-black uppercase font-mono">Actionable Guidelines</h3>
              <p className="text-[10px] text-brand-outline font-bold font-mono">IMPLEMENT THESE SUGGESTIONS TO OPTIMIZE NET ASSETS.</p>
              
              <div className="space-y-3.5">
                {aiInsights.suggestions.map((sug: string, idx: number) => (
                  <div key={idx} className="p-4 border-2 border-brand-on-surface bg-brand-surface flex flex-col gap-1.5 sticker-rotate-right">
                    <span className="font-mono text-[8px] font-black text-brand-primary uppercase tracking-wider">Guideline #{idx + 1}</span>
                    <p className="text-[11px] text-brand-on-surface font-bold leading-normal font-sans">{renderFormattedText(sug)}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Info label */}
            <div className="p-5 border-2 border-brand-on-surface bg-brand-primary-fixed shadow-[4px_4px_0px_0px_var(--border-color)] text-[9px] text-brand-outline font-bold leading-normal text-center font-mono space-y-1">
              <p>LIQIFIN AI Private advisory models conform to anonymous banking protocols.</p>
              <p className="text-brand-on-surface">GENERATED: {new Date(aiInsights.generatedAt).toLocaleString().toUpperCase()}</p>
            </div>
          </div>

        </div>
      ) : (
        <div className="py-20 text-center space-y-3 border-4 border-dashed border-brand-on-surface bg-brand-surface-lowest neo-shadow-md">
          <Sparkles className="w-8 h-8 text-brand-outline mx-auto" />
          <p className="font-mono text-xs font-bold text-brand-outline">NO AI SPENDING ASSESSMENTS LOADED</p>
          <button
            onClick={handleQueryAI}
            className="px-4 py-2 border-2 border-brand-on-surface font-mono text-xs font-black uppercase bg-brand-primary text-white shadow-[4px_4px_0px_0px_var(--border-color)] pressed-state cursor-pointer"
          >
            Compute Analysis
          </button>
        </div>
      )}
    </div>
  );
};

export default AIAssistantPage;
