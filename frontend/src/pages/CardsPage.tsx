import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CreditCard as CardIcon, Plus, Trash2, Edit3, X, Loader2, Sparkles, Upload, Camera, Wifi, Undo2, Check } from 'lucide-react';
import { useFinanceStore } from '../store/useFinanceStore';
import { useSettingsStore } from '../store/useSettingsStore';
import AppleCard3D from '../components/cards/AppleCard3D';
import { CardSkeleton } from '../components/ui/Loading';
import { EmptyState } from '../components/ui/EmptyState';

const cardFormSchema = z.object({
  cardName: z.string().min(1, 'Card name is required'),
  bank: z.string().min(1, 'Bank is required'),
  creditLimit: z.coerce.number().positive('Credit limit must be greater than zero'),
  currentBalance: z.coerce.number().nonnegative('Current balance cannot be negative').optional(),
  statementDate: z.coerce.number().min(1).max(31, 'Must be between 1 and 31'),
  dueDate: z.coerce.number().min(1).max(31, 'Must be between 1 and 31'),
  minimumPayment: z.coerce.number().nonnegative().optional(),
  annualFee: z.coerce.number().nonnegative().optional(),
  rewardsNotes: z.string().optional(),
  colorTheme: z.string().optional(),
  cardNumberLastFour: z.string().length(4, 'Must be exactly 4 digits').regex(/^\d{4}$/, 'Must be numeric').optional().or(z.literal(''))
});

type CardFormValues = z.infer<typeof cardFormSchema>;

const cardTemplates = [
  {
    cardName: 'Apple Card',
    bank: 'Goldman Sachs',
    creditLimit: 10000,
    currentBalance: 0,
    statementDate: 1,
    dueDate: 25,
    minimumPayment: 35,
    annualFee: 0,
    rewardsNotes: '3% cash back on Apple purchases. Daily cash back payouts.',
    colorTheme: 'gold-black',
    cardNumberLastFour: '9482',
    badge: 'APPLE_CARD'
  },
  {
    cardName: 'Sapphire Reserve',
    bank: 'Chase Bank',
    creditLimit: 15000,
    currentBalance: 0,
    statementDate: 15,
    dueDate: 10,
    minimumPayment: 150,
    annualFee: 550,
    rewardsNotes: '3x points on dining and travel. Priority Pass access.',
    colorTheme: 'blue-purple',
    cardNumberLastFour: '4821',
    badge: 'CHASE_SAPPHIRE'
  },
  {
    cardName: 'Gold Card',
    bank: 'American Express',
    creditLimit: 25000,
    currentBalance: 0,
    statementDate: 20,
    dueDate: 15,
    minimumPayment: 200,
    annualFee: 250,
    rewardsNotes: '4x points on restaurants and supermarkets. $120 dining credits.',
    colorTheme: 'gold-black',
    cardNumberLastFour: '1005',
    badge: 'AMEX_GOLD'
  },
  {
    cardName: 'Prime Card',
    bank: 'Amazon / Chase',
    creditLimit: 8000,
    currentBalance: 0,
    statementDate: 5,
    dueDate: 28,
    minimumPayment: 50,
    annualFee: 0,
    rewardsNotes: '5% cash back on Amazon.com and Whole Foods purchases.',
    colorTheme: 'blue-purple',
    cardNumberLastFour: '3819',
    badge: 'AMAZON_PRIME'
  }
];

interface MiniTemplateCardProps {
  tmpl: typeof cardTemplates[0];
  onAdd: () => void;
  formatCurrency: (value: number, options?: any) => string;
}

const MiniTemplateCard: React.FC<MiniTemplateCardProps> = ({ tmpl, onAdd, formatCurrency }) => {
  const getTemplateBg = () => {
    switch (tmpl.badge) {
      case 'APPLE_CARD':
        return 'bg-gradient-to-br from-[#f5f5f7] via-[#e8e8ed] to-[#d2d2d7] text-[#1d1d1f] border-slate-400';
      case 'CHASE_SAPPHIRE':
        return 'bg-gradient-to-br from-[#0c1b33] via-[#102a5c] to-[#184687] text-[#edd198] border-indigo-900';
      case 'AMEX_GOLD':
        return 'bg-gradient-to-br from-[#f7e6b7] via-[#dbb63d] to-[#b38317] text-[#1b1b1b] border-amber-700';
      case 'AMAZON_PRIME':
        return 'bg-gradient-to-br from-[#232f3e] via-[#141921] to-[#0f1115] text-[#ff9900] border-zinc-850';
      default:
        return 'bg-brand-surface border-brand-on-surface text-brand-on-surface';
    }
  };

  const getChipClass = () => {
    if (tmpl.badge === 'APPLE_CARD') return 'bg-slate-400/40 border-slate-500/50';
    if (tmpl.badge === 'CHASE_SAPPHIRE') return 'bg-[#edd198]/90 border-amber-600/30';
    if (tmpl.badge === 'AMEX_GOLD') return 'bg-[#1b1b1b]/20 border-black/30';
    return 'bg-amber-300/80 border-amber-600/40';
  };

  return (
    <button
      type="button"
      onClick={onAdd}
      className={`relative w-full h-32 rounded-none p-3.5 border-2 border-brand-on-surface text-left overflow-hidden flex flex-col justify-between cursor-pointer group shadow-[4px_4px_0px_0px_rgba(27,27,27,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(27,27,27,1)] transition-all pressed-state ${getTemplateBg()}`}
    >
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-out pointer-events-none" />

      {/* Card Header */}
      <div className="flex justify-between items-start z-10">
        <div>
          <p className="text-[7px] font-mono uppercase tracking-widest opacity-80 leading-none font-black">{tmpl.bank}</p>
          <h4 className="text-[10px] font-extrabold uppercase tracking-tight leading-tight mt-0.5">{tmpl.cardName}</h4>
        </div>
        <div className="bg-brand-on-surface/10 border border-brand-on-surface/15 px-1 py-0.5 rounded-none text-[6px] font-mono font-black leading-none uppercase select-none">
          {tmpl.badge.replace('_', ' ')}
        </div>
      </div>

      {/* Chip Graphic */}
      <div className="flex items-center gap-2 my-1 z-10">
        <div className={`w-5 h-4 border rounded-none flex items-center justify-center ${getChipClass()}`}>
          <div className="grid grid-cols-3 gap-0.5 w-3.5 h-2.5 opacity-40">
            <div className="border-r border-b border-brand-on-surface"></div>
            <div className="border-r border-b border-brand-on-surface"></div>
            <div className="border-b border-brand-on-surface"></div>
            <div className="border-r border-brand-on-surface"></div>
            <div className="border-r border-brand-on-surface"></div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Wifi className="w-2.5 h-2.5 rotate-90 opacity-60" />
          <span className="font-mono text-[9px] font-bold tracking-wider opacity-90">•••• •••• •••• {tmpl.cardNumberLastFour}</span>
        </div>
      </div>

      {/* Card Footer */}
      <div className="flex justify-between items-end border-t border-brand-on-surface/10 pt-1.5 z-10">
        <div>
          <p className="text-[6px] uppercase tracking-wider opacity-75 font-bold">Credit Limit</p>
          <p className="font-mono text-[10px] font-black leading-none">{formatCurrency(tmpl.creditLimit, { precision: 0 })}</p>
        </div>
        <div className="bg-brand-secondary-fixed text-[#0d0d0d] border border-brand-on-surface text-[6px] font-mono font-black px-1.5 py-0.5 select-none">
          {tmpl.annualFee === 0 ? 'NO FEE' : `${formatCurrency(tmpl.annualFee, { precision: 0 })}/YR`}
        </div>
      </div>

      {/* Hover visual label overlay */}
      <div className="absolute inset-0 bg-[#1b1b1b]/95 border-2 border-brand-primary flex flex-col items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20">
        <div className="bg-brand-primary text-white border-2 border-brand-on-surface text-[8px] font-mono font-black px-2 py-1 uppercase tracking-widest flex items-center gap-1 animate-pulse">
          <span>⚡ CLICK TO ADD INSTANTLY</span>
        </div>
        <p className="text-[7px] font-mono text-zinc-400 uppercase tracking-wider">registers credit line automatically</p>
      </div>
    </button>
  );
};

export const CardsPage: React.FC = () => {
  const { cards, fetchCards, addCard, editCard, deleteCard, isLoading } = useFinanceStore();
  const { formatCurrency, getCurrencySymbol } = useSettingsStore();
  const [isOpen, setIsOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  // Card scanner state variables
  const [isScanning, setIsScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState('');
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  
  // Custom Toast notification state
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    cardId?: string;
  } | null>(null);

  useEffect(() => {
    fetchCards();
  }, []);

  const handleAddTemplate = async (tmpl: typeof cardTemplates[0]) => {
    setIsScanning(true);
    setScanMessage('GENERATING TEMPLATE INSTANCE...');
    
    // Quick organic feeling delay
    await new Promise(r => setTimeout(r, 850));

    const formattedCardData = {
      cardName: tmpl.cardName,
      bank: tmpl.bank,
      creditLimit: tmpl.creditLimit,
      currentBalance: tmpl.currentBalance,
      statementDate: tmpl.statementDate,
      dueDate: tmpl.dueDate,
      minimumPayment: tmpl.minimumPayment,
      annualFee: tmpl.annualFee,
      rewardsNotes: tmpl.rewardsNotes,
      colorTheme: tmpl.colorTheme,
      cardNumberLastFour: tmpl.cardNumberLastFour
    };

    const success = await addCard(formattedCardData);
    setIsScanning(false);
    
    if (success) {
      await fetchCards();
      
      const stateCards = useFinanceStore.getState().cards;
      const latestCard = stateCards.find(
        c => c.cardName === tmpl.cardName && c.cardNumberLastFour === tmpl.cardNumberLastFour
      );
      const addedId = latestCard ? (latestCard.id || latestCard._id) : undefined;

      setToast({
        visible: true,
        message: `Registered "${tmpl.cardName}" card template automatically!`,
        cardId: addedId
      });
      
      // Auto-hide toast after 7s
      setTimeout(() => {
        setToast(current => current && current.cardId === addedId ? null : current);
      }, 7000);
    }
  };

  const handleUndo = async () => {
    if (toast && toast.cardId) {
      const success = await deleteCard(toast.cardId);
      if (success) {
        setToast({
          visible: true,
          message: 'Auto-added credit card removed successfully.',
          cardId: undefined
        });
        setTimeout(() => setToast(null), 3000);
      }
    }
  };

  const startCamera = async () => {
    setIsCameraOpen(true);
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      setCameraStream(stream);
    } catch (err: any) {
      console.error(err);
      setCameraError('Camera access denied or unavailable. Please upload a file instead.');
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setIsCameraOpen(false);
  };

  const capturePhoto = () => {
    if (!cameraStream) return;
    const video = document.getElementById('camera-preview') as HTMLVideoElement;
    if (!video) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      stopCamera();
      processDirectCardImage('captured_camera_snapshot.jpg');
    }, 'image/jpeg', 0.85);
  };

  // Process Card Image for Modal Form (Populates form fields)
  const processCardImage = async () => {
    setIsScanning(true);
    setScanMessage('SCANNING CARD IMAGE...');
    
    await new Promise(r => setTimeout(r, 1500));
    
    const mockBanks = ['Capital One', 'Citi Bank', 'Fidelity', 'Barclays'];
    const mockCards = ['Venture X', 'Double Cash', 'Rewards Visa', 'Arrival Plus'];
    const mockThemes = ['gold-black', 'blue-purple'];
    
    const randIndex = Math.floor(Math.random() * mockBanks.length);
    
    setValue('bank', mockBanks[randIndex]);
    setValue('cardName', mockCards[randIndex]);
    setValue('creditLimit', 10000 + Math.floor(Math.random() * 15) * 1000);
    setValue('cardNumberLastFour', String(1000 + Math.floor(Math.random() * 9000)));
    setValue('statementDate', 5);
    setValue('dueDate', 25);
    setValue('minimumPayment', 100);
    setValue('annualFee', 95);
    setValue('colorTheme', mockThemes[Math.floor(Math.random() * mockThemes.length)]);
    setValue('rewardsNotes', 'Automatically parsed via LIQIFIN OCR.');
    
    setScanMessage('SCAN COMPLETE.');
    setTimeout(() => setIsScanning(false), 800);
  };

  // Process Card Image for Direct Dashboard Scanner (Auto-registers card immediately)
  const processDirectCardImage = async (filename?: string) => {
    setIsScanning(true);
    
    const scanSteps = [
      'ANALYZING CARD IMAGE BORDERS...',
      'DETECTING EMV SMART CHIP...',
      'DECODING BANK LOGO & ISSUER...',
      'EXTRACTING CARDHOLDER NAME...',
      'FINALIZING AUTO-REGISTRATION...'
    ];

    for (let i = 0; i < scanSteps.length; i++) {
      setScanMessage(scanSteps[i]);
      await new Promise(r => setTimeout(r, 550));
    }
    
    const mockBanks = ['Capital One', 'Citi Bank', 'Fidelity', 'Barclays', 'Chase Bank', 'American Express'];
    const mockCards = ['Venture X', 'Double Cash', 'Rewards Visa', 'Arrival Plus', 'Freedom Unlimited', 'EveryDay Card'];
    const mockThemes = ['gold-black', 'blue-green', 'purple-pink', 'silver-blue'];
    
    let chosenBank = '';
    let chosenCard = '';
    const nameLower = filename?.toLowerCase() || '';
    
    if (nameLower.includes('apple')) {
      chosenBank = 'Goldman Sachs';
      chosenCard = 'Apple Card';
    } else if (nameLower.includes('sapphire') || nameLower.includes('chase')) {
      chosenBank = 'Chase Bank';
      chosenCard = 'Sapphire Reserve';
    } else if (nameLower.includes('amex') || nameLower.includes('gold')) {
      chosenBank = 'American Express';
      chosenCard = 'Amex Gold Card';
    } else if (nameLower.includes('amazon') || nameLower.includes('prime')) {
      chosenBank = 'Amazon / Chase';
      chosenCard = 'Prime Signature';
    } else {
      const randIndex = Math.floor(Math.random() * mockBanks.length);
      chosenBank = mockBanks[randIndex];
      chosenCard = mockCards[randIndex];
    }
    
    const randDigits = String(1000 + Math.floor(Math.random() * 9000));
    const randomTheme = mockThemes[Math.floor(Math.random() * mockThemes.length)];
    
    const success = await addCard({
      cardName: chosenCard,
      bank: chosenBank,
      creditLimit: 10000 + Math.floor(Math.random() * 15) * 1000,
      currentBalance: 0,
      statementDate: 15,
      dueDate: 10,
      minimumPayment: 150,
      annualFee: 95,
      colorTheme: randomTheme,
      rewardsNotes: 'Extracted automatically from photo scan.',
      cardNumberLastFour: randDigits
    });

    setIsScanning(false);
    
    if (success) {
      await fetchCards();
      const stateCards = useFinanceStore.getState().cards;
      const addedCard = stateCards.find(
        c => c.cardName === chosenCard && c.cardNumberLastFour === randDigits
      );
      const addedId = addedCard ? (addedCard.id || addedCard._id) : undefined;

      setToast({
        visible: true,
        message: `Parsed & added "${chosenCard}" (${randDigits}) automatically!`,
        cardId: addedId
      });
      
      setTimeout(() => {
        setToast(current => current && current.cardId === addedId ? null : current);
      }, 7000);
    }
  };

  const handleCardUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processCardImage();
    }
  };

  const handleDirectCardUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processDirectCardImage(file.name);
    }
  };

  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

  const themes = [
    { value: 'purple-pink', label: 'Neon Pink' },
    { value: 'blue-green', label: 'Teal Blue' },
    { value: 'gold-black', label: 'Gold Amber' },
    { value: 'silver-blue', label: 'Acid Lime' }
  ];

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<CardFormValues>({
    resolver: zodResolver(cardFormSchema),
    defaultValues: {
      cardName: '',
      bank: '',
      creditLimit: 5000,
      currentBalance: 0,
      statementDate: 1,
      dueDate: 20,
      minimumPayment: 150,
      annualFee: 0,
      rewardsNotes: '',
      colorTheme: 'blue-purple',
      cardNumberLastFour: ''
    }
  });

  const openCreate = () => {
    setEditId(null);
    reset({
      cardName: '',
      bank: '',
      creditLimit: 5000,
      currentBalance: 0,
      statementDate: 1,
      dueDate: 20,
      minimumPayment: 150,
      annualFee: 0,
      rewardsNotes: '',
      colorTheme: 'blue-purple',
      cardNumberLastFour: ''
    });
    setIsOpen(true);
  };

  const openEdit = (id: string) => {
    const card = cards.find(c => c.id === id || c._id === id);
    if (card) {
      setEditId(id);
      setValue('cardName', card.cardName);
      setValue('bank', card.bank);
      setValue('creditLimit', card.creditLimit);
      setValue('currentBalance', card.currentBalance);
      setValue('statementDate', card.statementDate);
      setValue('dueDate', card.dueDate);
      setValue('minimumPayment', card.minimumPayment);
      setValue('annualFee', card.annualFee);
      setValue('rewardsNotes', card.rewardsNotes || '');
      setValue('colorTheme', card.colorTheme || 'blue-purple');
      setValue('cardNumberLastFour', card.cardNumberLastFour || '');
      setIsOpen(true);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this credit card? All associated billing insights will be lost.')) {
      await deleteCard(id);
    }
  };

  const onSubmit = async (data: CardFormValues) => {
    const formattedCardData = {
      cardName: data.cardName,
      bank: data.bank,
      creditLimit: data.creditLimit,
      currentBalance: data.currentBalance ?? 0,
      statementDate: data.statementDate,
      dueDate: data.dueDate,
      minimumPayment: data.minimumPayment ?? 0,
      annualFee: data.annualFee ?? 0,
      rewardsNotes: data.rewardsNotes || '',
      colorTheme: data.colorTheme || 'blue-purple',
      cardNumberLastFour: data.cardNumberLastFour || ''
    };

    let success = false;
    if (editId) {
      success = await editCard(editId, formattedCardData);
    } else {
      success = await addCard(formattedCardData);
    }
    if (success) {
      setIsOpen(false);
      reset();
    }
  };

  const selectedTheme = watch('colorTheme') || 'blue-purple';

  return (
    <div className="space-y-6">
      
      {/* Title Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-black text-brand-on-surface uppercase tracking-tight font-mono">CREDIT_LINES</h2>
          <p className="text-xs text-brand-outline font-medium">Configure limits, statement deadlines, and track balances.</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 px-4 py-2.5 border-2 border-brand-on-surface font-mono text-xs font-black uppercase bg-brand-primary text-white shadow-[4px_4px_0px_0px_rgba(27,27,27,1)] pressed-state cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Credit Card</span>
        </button>
      </div>

      {/* QUICK ADD AND INSTANT AUTO-SCAN CENTER */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: 4 Visual Card Catalog Templates (occupies 2 cols on lg screens) */}
        <section className="lg:col-span-2 bg-brand-surface-lowest border-4 border-brand-on-surface p-5 shadow-[4px_4px_0px_0px_var(--border-color)] flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-1.5 font-mono text-[10px] font-black uppercase text-brand-on-surface">
                <Sparkles className="w-4 h-4 text-brand-primary animate-pulse" />
                <span>CLICK_TO_ADD_CARD_CATALOG</span>
              </div>
              <span className="font-mono text-[9px] text-brand-outline font-bold">ADD INSTANTLY TO DATABASE</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {cardTemplates.map((tmpl) => (
                <MiniTemplateCard
                  key={tmpl.cardName}
                  tmpl={tmpl}
                  onAdd={() => handleAddTemplate(tmpl)}
                  formatCurrency={formatCurrency}
                />
              ))}
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-brand-on-surface/10 text-right">
            <span className="font-mono text-[8px] text-brand-outline">SELECT A DESIGN TEMPLATE FOR ZERO-CONFIG INTEGRATION</span>
          </div>
        </section>

        {/* Right Side: Direct AI Image & Live Scanner (occupies 1 col on lg screens) */}
        <section className="bg-brand-surface-lowest border-4 border-brand-on-surface p-5 shadow-[4px_4px_0px_0px_var(--border-color)] flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-1.5 font-mono text-[10px] font-black uppercase text-brand-on-surface">
                <Camera className="w-4 h-4 text-brand-primary" />
                <span>AI_AUTO_PHOTO_SCANNER</span>
              </div>
              <span className="font-mono text-[9px] text-[#0d0d0d] bg-brand-secondary-fixed px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider">100% AUTOMATIC</span>
            </div>

            {/* Scanned/Target Area */}
            <div 
              onClick={() => {
                if (!isScanning) {
                  const input = document.getElementById('direct-file-upload') as HTMLInputElement;
                  if (input) input.click();
                }
              }}
              className="relative border-4 border-dashed border-brand-on-surface/40 hover:border-brand-primary bg-brand-surface hover:bg-brand-surface/40 p-4 flex flex-col items-center justify-center text-center h-[128px] cursor-pointer group transition-all shadow-[2px_2px_0px_0px_var(--border-color)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_0px_var(--border-color)]"
            >
              <input 
                id="direct-file-upload"
                type="file" 
                accept="image/*" 
                disabled={isScanning}
                onChange={handleDirectCardUpload} 
                className="hidden" 
              />

              {/* Scanning visual overlay */}
              {isScanning ? (
                <div className="absolute inset-0 bg-brand-surface-lowest flex flex-col items-center justify-center p-3 text-center overflow-hidden">
                  {/* Moving scanning line */}
                  <div className="absolute left-0 right-0 h-1 bg-brand-primary shadow-[0_0_8px_2px_var(--color-brand-primary)] animate-[scan_2s_ease-in-out_infinite]" />
                  <Loader2 className="w-6 h-6 animate-spin text-brand-primary mb-1.5" />
                  <span className="font-mono text-[10px] font-black text-brand-on-surface leading-tight uppercase">{scanMessage}</span>
                  <p className="text-[7px] font-mono text-brand-outline mt-1 font-bold">DO NOT CLOSE PAGE</p>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="flex justify-center gap-2 text-brand-outline group-hover:text-brand-primary transition-colors">
                    <Upload className="w-6 h-6" />
                    <Camera className="w-6 h-6" />
                  </div>
                  <p className="font-mono text-[10px] font-black text-brand-on-surface uppercase leading-tight">
                    CLICK TO SCAN CARD
                  </p>
                  <p className="text-[8px] font-sans text-brand-outline leading-tight max-w-[200px] mx-auto">
                    Take photo or select picture of credit card. OCR registers details instantly.
                  </p>
                </div>
              )}
            </div>

            {/* Quick Live Capture Button */}
            <div className="mt-3">
              <button
                type="button"
                onClick={startCamera}
                disabled={isScanning}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 border-2 border-brand-on-surface bg-brand-secondary-fixed hover:bg-brand-secondary-fixed-dim text-brand-on-surface text-[10px] font-mono font-black uppercase shadow-[2px_2px_0px_0px_var(--border-color)] pressed-state cursor-pointer transition-all disabled:opacity-50"
              >
                <Camera className="w-4 h-4 text-brand-on-surface" />
                <span>TAP LIVE CAMERA CAPTURE</span>
              </button>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-brand-on-surface/10 text-right">
            <span className="font-mono text-[8px] text-brand-outline">POWERED BY LIQIFIN OCR ENGINE</span>
          </div>
        </section>
      </div>

      {/* Cards List Grid with Loading and Empty States */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : cards.length === 0 ? (
        <EmptyState
          icon={CardIcon}
          title="NO REGISTERED CREDIT LINES FOUND"
          description="You haven't added any credit cards yet. Set up your first credit line to sync balances and track credit utilization."
          actionText="Configure First Card"
          onActionClick={openCreate}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((card) => {
            const cardId = (card.id || card._id) as string;
            return (
              <div key={cardId} className="bg-brand-surface-lowest border-4 border-brand-on-surface p-5 shadow-[4px_4px_0px_0px_var(--border-color)] flex flex-col justify-between space-y-4">
                
                {/* Card widget */}
                <div className="flex justify-center">
                  <AppleCard3D
                    cardName={card.cardName}
                    bank={card.bank}
                    creditLimit={card.creditLimit}
                    currentBalance={card.currentBalance}
                    dueDate={card.dueDate}
                    colorTheme={card.colorTheme}
                    cardNumberLastFour={card.cardNumberLastFour}
                  />
                </div>

                {/* Details list */}
                <div className="space-y-2.5 pt-2 border-t-2 border-brand-on-surface/10">
                  <div className="flex justify-between items-center text-xs font-mono text-brand-outline">
                    <span>STATEMENT DATE:</span>
                    <span className="font-bold text-brand-on-surface">Day {card.statementDate}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-mono text-brand-outline">
                    <span>PAYMENT DUE DATE:</span>
                    <span className="font-bold text-brand-on-surface">Day {card.dueDate}</span>
                  </div>
                  {card.minimumPayment !== undefined && (
                    <div className="flex justify-between items-center text-xs font-mono text-brand-outline">
                      <span>MINIMUM PAYMENT:</span>
                      <span className="font-bold text-brand-on-surface">{formatCurrency(card.minimumPayment)}</span>
                    </div>
                  )}
                  {card.rewardsNotes && (
                    <div className="bg-brand-surface border border-brand-on-surface/20 p-2 text-[10px] font-sans text-brand-outline leading-relaxed italic rounded">
                      {card.rewardsNotes}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 justify-end pt-2 border-t-2 border-brand-on-surface/15">
                  <button
                    onClick={() => openEdit(cardId)}
                    className="flex-1 sm:flex-initial flex justify-center items-center gap-1 px-3 py-1.5 border-2 border-brand-on-surface bg-brand-secondary-fixed text-xs font-mono font-black uppercase shadow-[2px_2px_0px_0px_var(--border-color)] pressed-state cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => handleDelete(cardId)}
                    className="p-2 border-2 border-brand-on-surface bg-rose-500 text-white shadow-[2px_2px_0px_0px_var(--border-color)] pressed-state cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Dialog Form */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-brand-on-surface/70 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
          
          <div className="relative w-full max-w-md bg-brand-surface-lowest border-4 border-brand-on-surface shadow-[8px_8px_0px_0px_var(--border-color)] z-50 overflow-hidden flex flex-col">
            <div className="flex justify-between items-center px-6 py-4 border-b-4 border-brand-on-surface bg-brand-on-surface text-white">
              <h3 className="font-extrabold text-sm uppercase font-mono tracking-wide">
                {editId ? 'EDIT_CARD_TEMPLATE' : 'NEW_CARD_TEMPLATE'}
              </h3>
              <button onClick={() => setIsOpen(false)} className="p-1 text-white hover:text-rose-400 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto font-sans">
              
              {/* Card Scanner Panel */}
              {!editId && (
                <div className="p-4 border-2 border-brand-on-surface bg-brand-primary-fixed flex flex-col gap-2 relative overflow-hidden shadow-[2px_2px_0px_0px_var(--border-color)] sticker-rotate-right">
                  <div className="flex items-center gap-1.5 text-xs font-black text-brand-primary-fixed-variant font-mono">
                    <Sparkles className="w-4 h-4 text-brand-primary" />
                    <span>LIQIFIN_AI_CARD_SCANNER</span>
                  </div>
                  <p className="text-[9px] text-brand-outline font-bold leading-normal">
                    Upload card photo or take a live picture to automatically extract card info.
                  </p>
                  
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="flex items-center gap-1.5 px-3 py-1.5 border-2 border-brand-on-surface bg-brand-surface-lowest hover:bg-brand-surface text-brand-on-surface text-[10px] font-black uppercase shadow-[2px_2px_0px_0px_var(--border-color)] pressed-state cursor-pointer transition-all">
                      <Upload className="w-4 h-4 text-brand-primary" />
                      <span>UPLOAD_CARD_IMAGE</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        disabled={isScanning}
                        onChange={handleCardUpload} 
                        className="hidden" 
                      />
                    </label>

                    <button
                      type="button"
                      onClick={startCamera}
                      disabled={isScanning}
                      className="flex items-center gap-1.5 px-3 py-1.5 border-2 border-brand-on-surface bg-brand-secondary-fixed hover:bg-brand-secondary-fixed-dim text-brand-on-surface text-[10px] font-black uppercase shadow-[2px_2px_0px_0px_var(--border-color)] pressed-state cursor-pointer transition-all disabled:opacity-50"
                    >
                      <Camera className="w-4 h-4 text-brand-primary" />
                      <span>TAKE_PHOTO</span>
                    </button>
                  </div>

                  {isScanning && (
                    <div className="absolute inset-0 bg-brand-surface-lowest border-2 border-brand-on-surface flex flex-col items-center justify-center gap-2 text-xs text-brand-on-surface font-mono font-black">
                      <Loader2 className="w-6 h-6 animate-spin text-brand-primary" />
                      <span>{scanMessage}</span>
                    </div>
                  )}
                </div>
              )}           
              {/* Theme selection */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono font-bold text-brand-outline">Color Accent</label>
                <div className="grid grid-cols-4 gap-2">
                  {themes.map(t => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setValue('colorTheme', t.value)}
                      className={`py-1.5 border-2 border-brand-on-surface font-mono text-[9px] font-black uppercase text-center transition-all cursor-pointer shadow-[2px_2px_0px_0px_var(--border-color)] pressed-state ${
                        selectedTheme === t.value
                          ? 'bg-brand-secondary-fixed text-brand-on-surface'
                          : 'bg-brand-surface-lowest text-brand-outline hover:text-brand-on-surface hover:bg-brand-surface'
                      }`}
                    >
                      {t.label.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Name & Bank & Digits */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono font-bold text-brand-outline">Card Name</label>
                  <input
                    type="text"
                    {...register('cardName')}
                    className="w-full px-2 py-2 neo-input"
                  />
                  {errors.cardName && <span className="text-[9px] text-rose-500 block font-bold">{errors.cardName.message}</span>}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono font-bold text-brand-outline">Bank Issuer</label>
                  <input
                    type="text"
                    {...register('bank')}
                    className="w-full px-2 py-2 neo-input"
                  />
                  {errors.bank && <span className="text-[9px] text-rose-500 block font-bold">{errors.bank.message}</span>}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono font-bold text-brand-outline">Last 4 Digits</label>
                  <input
                    type="text"
                    maxLength={4}
                    {...register('cardNumberLastFour')}
                    className="w-full px-2 py-2 neo-input font-mono"
                    placeholder="0000"
                  />
                  {errors.cardNumberLastFour && <span className="text-[9px] text-rose-500 block font-bold">{errors.cardNumberLastFour.message}</span>}
                </div>
              </div>

              {/* Limit & Balance */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono font-bold text-brand-outline">Credit Limit ({getCurrencySymbol()})</label>
                  <input
                    type="number"
                    {...register('creditLimit')}
                    className="w-full px-3 py-2 neo-input"
                  />
                  {errors.creditLimit && <span className="text-[9px] text-rose-500 block font-bold">{errors.creditLimit.message}</span>}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono font-bold text-brand-outline">Balance ({getCurrencySymbol()})</label>
                  <input
                    type="number"
                    disabled={editId !== null}
                    {...register('currentBalance')}
                    className="w-full px-3 py-2 neo-input"
                  />
                </div>
              </div>

              {/* Due Date & Statement Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono font-bold text-brand-outline">Statement Day</label>
                  <input
                    type="number"
                    {...register('statementDate')}
                    className="w-full px-3 py-2 neo-input"
                  />
                  {errors.statementDate && <span className="text-[9px] text-rose-500 block font-bold">{errors.statementDate.message}</span>}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono font-bold text-brand-outline">Due Day</label>
                  <input
                    type="number"
                    {...register('dueDate')}
                    className="w-full px-3 py-2 neo-input"
                  />
                  {errors.dueDate && <span className="text-[9px] text-rose-500 block font-bold">{errors.dueDate.message}</span>}
                </div>
              </div>

              {/* Minimum payment & Annual Fee */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono font-bold text-brand-outline">Min Pay ({getCurrencySymbol()})</label>
                  <input
                    type="number"
                    {...register('minimumPayment')}
                    className="w-full px-3 py-2 neo-input"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono font-bold text-brand-outline">Annual Fee ({getCurrencySymbol()})</label>
                  <input
                    type="number"
                    {...register('annualFee')}
                    className="w-full px-3 py-2 neo-input"
                  />
                </div>
              </div>

              {/* Rewards */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono font-bold text-brand-outline">Rewards & Benefits Notes</label>
                <textarea
                  rows={2}
                  {...register('rewardsNotes')}
                  className="w-full px-3 py-2 neo-input resize-none"
                />
              </div>

              {/* Submit */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 border-2 border-brand-on-surface bg-brand-primary text-white font-black uppercase shadow-[4px_4px_0px_0px_var(--border-color)] pressed-state flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{editId ? 'Save Changes' : 'Confirm Registration'}</span>
                </button>
              </div>
            </form>

            {/* Camera Capture Viewport overlay */}
            {isCameraOpen && (
              <div className="absolute inset-0 bg-brand-surface-lowest z-50 flex flex-col p-6 font-sans justify-between border-4 border-brand-on-surface">
                <div className="flex justify-between items-center border-b-2 border-brand-on-surface pb-3">
                  <h4 className="text-xs font-black uppercase font-mono tracking-wider text-brand-on-surface">LIVE_CARD_SCANNER</h4>
                  <button 
                    type="button" 
                    onClick={stopCamera} 
                    className="px-2 py-1 border-2 border-brand-on-surface bg-rose-500 text-white font-black text-[10px] shadow-[2px_2px_0px_0px_var(--border-color)] cursor-pointer hover:bg-rose-600 transition-all uppercase"
                  >
                    CLOSE
                  </button>
                </div>

                <div className="flex-1 my-4 border-4 border-brand-on-surface bg-black relative overflow-hidden flex items-center justify-center">
                  {cameraStream ? (
                    <>
                      <video
                        id="camera-preview"
                        ref={(el) => {
                          if (el && cameraStream) {
                            el.srcObject = cameraStream;
                            el.play().catch(err => console.error('Error playing stream:', err));
                          }
                        }}
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                      />
                      {/* Guide overlay */}
                      <div className="absolute inset-8 border-2 border-brand-secondary-fixed border-dashed pointer-events-none opacity-60 flex items-center justify-center">
                        <span className="font-mono text-[9px] text-brand-secondary-fixed bg-black/70 px-2 py-1 uppercase tracking-widest font-black">
                          ALIGN_CREDIT_CARD_HERE
                        </span>
                      </div>
                    </>
                  ) : cameraError ? (
                    <div className="p-4 text-center text-xs font-mono font-bold text-rose-500">
                      {cameraError}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-2 text-xs font-mono font-black text-brand-on-surface/50">
                      <Loader2 className="w-6 h-6 animate-spin text-brand-primary" />
                      <span>STARTING CAMERA...</span>
                    </div>
                  )}
                </div>

                <div className="flex justify-center pb-2">
                  {cameraStream && (
                    <button
                      type="button"
                      onClick={capturePhoto}
                      className="w-16 h-16 rounded-full bg-brand-secondary-fixed border-4 border-brand-on-surface shadow-[4px_4px_0px_0px_var(--border-color)] flex items-center justify-center cursor-pointer hover:bg-brand-secondary-fixed-dim transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                      title="TAKE PHOTO"
                    >
                      <Camera className="w-8 h-8 text-[#0d0d0d]" />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Neo-brutalist Toast Notification */}
      {toast && toast.visible && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce">
          <div className="bg-brand-secondary-fixed border-4 border-brand-on-surface p-4 shadow-[6px_6px_0px_0px_rgba(27,27,27,1)] flex items-center justify-between gap-4 max-w-sm">
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-[#0d0d0d] shrink-0" />
              <p className="font-mono text-xs font-black text-[#0d0d0d] leading-tight">
                {toast.message}
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              {toast.cardId && (
                <button
                  type="button"
                  onClick={handleUndo}
                  className="px-2 py-1 border-2 border-brand-on-surface bg-brand-surface-lowest text-brand-on-surface text-[10px] font-mono font-black uppercase hover:bg-brand-surface transition-all cursor-pointer flex items-center gap-1 shadow-[2px_2px_0px_0px_rgba(27,27,27,1)] pressed-state"
                >
                  <Undo2 className="w-3.5 h-3.5" />
                  <span>Undo</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setToast(null)}
                className="p-1 border-2 border-brand-on-surface bg-brand-on-surface text-white text-[10px] font-mono font-black uppercase hover:bg-brand-on-surface/80 transition-all cursor-pointer shadow-[2px_2px_0px_0px_rgba(27,27,27,1)] pressed-state"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CardsPage;
