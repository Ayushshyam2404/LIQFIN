import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Upload, Sparkles, Loader2, Camera } from 'lucide-react';
import { useFinanceStore } from '../../store/useFinanceStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { EXPENSE_CATEGORIES } from '../../constants/categories';

const expenseFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  amount: z.coerce.number().positive('Amount must be greater than zero'),
  category: z.string().min(1, 'Category is required'),
  paymentMethod: z.string().min(1, 'Payment method is required'),
  creditCardId: z.string().nullable().optional(),
  date: z.string().min(1, 'Date is required'),
  notes: z.string().optional(),
  tags: z.string().optional()
});

type ExpenseFormValues = z.infer<typeof expenseFormSchema>;

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  editId?: string | null;
}

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({ isOpen, onClose, editId }) => {
  const { cards, addExpense, editExpense, expenses, uploadReceipt, isOffline } = useFinanceStore();
  const { getCurrencySymbol } = useSettingsStore();
  const [isScanning, setIsScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const categories = EXPENSE_CATEGORIES;

  const paymentMethods = [
    { value: 'cash', label: 'Cash' },
    { value: 'upi', label: 'UPI' },
    { value: 'debit_card', label: 'Debit' },
    { value: 'credit_card', label: 'Credit Card' },
    { value: 'bank_transfer', label: 'Bank Wire' }
  ];

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      title: '',
      amount: 0,
      category: 'Food',
      paymentMethod: 'debit_card',
      creditCardId: '',
      date: new Date().toISOString().split('T')[0],
      notes: '',
      tags: ''
    }
  });

  const selectedPaymentMethod = watch('paymentMethod');

  useEffect(() => {
    if (editId) {
      const exp = expenses.find(e => e.id === editId || e._id === editId);
      if (exp) {
        reset({
          title: exp.title,
          amount: exp.amount,
          category: exp.category,
          paymentMethod: exp.paymentMethod,
          creditCardId: exp.creditCardId ? (typeof exp.creditCardId === 'object' ? (exp.creditCardId as any)._id : exp.creditCardId) : '',
          date: new Date(exp.date).toISOString().split('T')[0],
          notes: exp.notes || '',
          tags: exp.tags?.join(', ') || ''
        });
      }
    } else {
      reset({
        title: '',
        amount: 0,
        category: 'Food',
        paymentMethod: 'debit_card',
        creditCardId: '',
        date: new Date().toISOString().split('T')[0],
        notes: '',
        tags: ''
      });
      setSelectedFile(null);
    }
  }, [editId, isOpen, reset, expenses]);

  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const processReceiptFile = async (file: File) => {
    setSelectedFile(file);
    setIsScanning(true);
    setScanMessage('UPLOADING RECEIPT DATA...');

    try {
      const formData = new FormData();
      formData.append('receipt', file);
      const res = await uploadReceipt(formData);
      
      if (res.success && res.ocrData) {
        setScanMessage('AI RUNNING EXTRACTORS...');
        await new Promise(r => setTimeout(r, 1000));

        setValue('title', res.ocrData.title);
        setValue('amount', res.ocrData.amount);
        setValue('category', res.ocrData.category);
        setValue('date', new Date(res.ocrData.date).toISOString().split('T')[0]);
        setValue('notes', `OCR confidence: ${(res.ocrData.confidence * 100).toFixed(0)}%. Processed via LIQIFIN AI.`);
        
        setScanMessage('SCAN COMPLETE.');
        setTimeout(() => setIsScanning(false), 800);
      }
    } catch (err: any) {
      console.error(err);
      setScanMessage(err.message || 'SCAN FAIL. RECONNECT INTERNET.');
      setTimeout(() => setIsScanning(false), 2000);
    }
  };

  const handleReceiptScan = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processReceiptFile(file);
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
      
      const file = new File([blob], `receipt_${Date.now()}.jpg`, { type: 'image/jpeg' });
      stopCamera();
      await processReceiptFile(file);
    }, 'image/jpeg', 0.85);
  };

  // Clean up stream on unmount/close
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

  if (!isOpen) return null;

  const onSubmit = async (values: ExpenseFormValues) => {
    const tagsArray = values.tags 
      ? values.tags.split(',').map(tag => tag.trim()).filter(Boolean)
      : [];

    const payload = {
      title: values.title,
      amount: values.amount,
      category: values.category,
      paymentMethod: values.paymentMethod,
      creditCardId: values.paymentMethod === 'credit_card' ? (values.creditCardId || null) : null,
      date: new Date(values.date),
      notes: values.notes || '',
      tags: tagsArray,
      receipt: selectedFile ? selectedFile.name : ''
    };

    let success = false;
    if (editId) {
      success = await editExpense(editId, payload);
    } else {
      success = await addExpense(payload);
    }

    if (success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={onClose} />

      {/* Modal Container */}
      <div className="relative w-full max-w-lg bg-brand-surface-lowest border-4 border-brand-on-surface shadow-[8px_8px_0px_0px_var(--border-color)] overflow-hidden flex flex-col z-50">
        
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b-4 border-brand-on-surface bg-brand-on-surface text-white">
          <h3 className="font-extrabold text-sm uppercase font-mono tracking-wide">
            {editId ? 'EDIT_LEDGER_POSTING' : 'NEW_LEDGER_POSTING'}
          </h3>
          <button onClick={onClose} className="p-1 text-white hover:text-rose-400 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto font-sans">
          
          {/* AI Scan box */}
          {!editId && (
            <div className="p-4 border-2 border-brand-on-surface bg-brand-primary-fixed flex flex-col gap-2 relative overflow-hidden shadow-[2px_2px_0px_0px_var(--border-color)] sticker-rotate-right">
              <div className="flex items-center gap-1.5 text-xs font-black text-brand-primary-fixed-variant font-mono">
                <Sparkles className="w-4 h-4 text-brand-primary" />
                <span>LIQIFIN_AI_RECEIPT_SCANNER</span>
              </div>
              <p className="text-[9px] text-brand-outline font-bold leading-normal">
                Upload images or PDFs. AI will scan title, amount, category, and date parameters.
              </p>
              
              <div className="flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-1.5 px-3 py-1.5 border-2 border-brand-on-surface bg-brand-surface-lowest hover:bg-brand-surface text-brand-on-surface text-[10px] font-black uppercase shadow-[2px_2px_0px_0px_var(--border-color)] pressed-state cursor-pointer transition-all">
                  <Upload className="w-4 h-4 text-brand-primary" />
                  <span>{selectedFile ? 'CHANGE_FILE' : 'UPLOAD_BILL'}</span>
                  <input 
                    type="file" 
                    accept="image/*,application/pdf" 
                    disabled={isOffline || isScanning}
                    onChange={handleReceiptScan} 
                    className="hidden" 
                  />
                </label>

                <button
                  type="button"
                  onClick={startCamera}
                  disabled={isOffline || isScanning}
                  className="flex items-center gap-1.5 px-3 py-1.5 border-2 border-brand-on-surface bg-brand-secondary-fixed hover:bg-brand-secondary-fixed-dim text-brand-on-surface text-[10px] font-black uppercase shadow-[2px_2px_0px_0px_var(--border-color)] pressed-state cursor-pointer transition-all disabled:opacity-50"
                >
                  <Camera className="w-4 h-4 text-brand-primary" />
                  <span>TAKE_PHOTO</span>
                </button>

                {selectedFile && (
                  <span className="text-[8px] font-mono text-brand-outline truncate max-w-[150px] font-bold">
                    {selectedFile.name}
                  </span>
                )}
              </div>

              {isScanning && (
                <div className="absolute inset-0 bg-brand-surface-lowest border-2 border-brand-on-surface flex flex-col items-center justify-center gap-2 text-xs text-brand-on-surface font-mono font-black">
                  <Loader2 className="w-6 h-6 animate-spin text-brand-primary" />
                  <span>{scanMessage}</span>
                </div>
              )}
            </div>
          )}

          {/* Title and Amount */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-mono font-bold text-brand-outline">Merchant / Title</label>
              <input
                type="text"
                placeholder="Starbucks..."
                {...register('title')}
                className="w-full px-3 py-2 neo-input"
              />
              {errors.title && <span className="text-[9px] text-rose-500 block font-bold">{errors.title.message}</span>}
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase font-mono font-bold text-brand-outline">Amount ({getCurrencySymbol()})</label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                {...register('amount')}
                className="w-full px-3 py-2 neo-input font-black text-brand-on-surface"
              />
              {errors.amount && <span className="text-[9px] text-rose-500 block font-bold">{errors.amount.message}</span>}
            </div>
          </div>

          {/* Category & Date */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-mono font-bold text-brand-outline">Category</label>
              <select
                {...register('category')}
                className="w-full px-3 py-2 neo-input"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              {errors.category && <span className="text-[9px] text-rose-500 block font-bold">{errors.category.message}</span>}
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase font-mono font-bold text-brand-outline">Transaction Date</label>
              <input
                type="date"
                {...register('date')}
                className="w-full px-3 py-2 neo-input"
              />
              {errors.date && <span className="text-[9px] text-rose-500 block font-bold">{errors.date.message}</span>}
            </div>
          </div>

          {/* Payment Method */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-mono font-bold text-brand-outline">Payment Channel</label>
            <div className="grid grid-cols-5 gap-2">
              {paymentMethods.map(method => (
                <button
                  key={method.value}
                  type="button"
                  onClick={() => setValue('paymentMethod', method.value)}
                  className={`py-1.5 border-2 border-brand-on-surface font-mono text-[9px] font-black text-center uppercase transition-all cursor-pointer shadow-[2px_2px_0px_0px_var(--border-color)] pressed-state ${
                    selectedPaymentMethod === method.value
                      ? 'bg-brand-secondary-fixed text-brand-on-surface font-black'
                      : 'bg-brand-surface-lowest text-brand-outline hover:text-brand-on-surface hover:bg-brand-surface'
                  }`}
                >
                  {method.label}
                </button>
              ))}
            </div>
          </div>

          {/* Credit Card selector */}
          {selectedPaymentMethod === 'credit_card' && (
            <div className="space-y-1 animate-float">
              <label className="text-[10px] uppercase font-mono font-bold text-brand-outline">Select Credit Card</label>
              <select
                {...register('creditCardId')}
                className="w-full px-3 py-2 neo-input"
              >
                <option value="">-- Choose Card --</option>
                {cards.map(card => (
                  <option key={card.id || card._id} value={card.id || card._id}>
                    {card.cardName} ({card.bank})
                  </option>
                ))}
              </select>
              {errors.creditCardId && <span className="text-[9px] text-rose-500 block font-bold">{errors.creditCardId.message}</span>}
            </div>
          )}

          {/* Notes */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-mono font-bold text-brand-outline">Notes / Details</label>
            <textarea
              placeholder="Add description..."
              rows={2}
              {...register('notes')}
              className="w-full px-3 py-2 neo-input resize-none"
            />
          </div>

          {/* Tags */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-mono font-bold text-brand-outline">Tags (comma separated)</label>
            <input
              type="text"
              placeholder="food, personal..."
              {...register('tags')}
              className="w-full px-3 py-2 neo-input"
            />
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 border-2 border-brand-on-surface bg-brand-primary text-white font-black uppercase shadow-[4px_4px_0px_0px_var(--border-color)] pressed-state flex items-center justify-center gap-2 cursor-pointer text-xs"
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Logging...</span>
                </div>
              ) : editId ? 'Save Changes' : 'Confirm Ledger Outflow'}
            </button>
          </div>
        </form>

        {/* Camera Capture Viewport overlay */}
        {isCameraOpen && (
          <div className="absolute inset-0 bg-brand-surface-lowest z-50 flex flex-col p-6 font-sans justify-between border-4 border-brand-on-surface">
            <div className="flex justify-between items-center border-b-2 border-brand-on-surface pb-3">
              <h4 className="text-xs font-black uppercase font-mono tracking-wider text-brand-on-surface">LIVE_CAMERA_SCANNER</h4>
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
                      ALIGN_RECEIPT_HERE
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
  );
};

export default AddExpenseModal;
