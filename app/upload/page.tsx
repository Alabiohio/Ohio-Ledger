"use client";

import { useState, useEffect, Suspense } from 'react';
import Tesseract from 'tesseract.js';
import { UploadCloud, CheckCircle2, Loader2, TrendingUp, DollarSign } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

function UploadForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrText, setOcrText] = useState('');
  const [accounts, setAccounts] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    merchant: '',
    date: '',
    amount: '',
    category: '',
    type: 'expense',
    receipt_url: '',
    notes: '',
    account_id: '',
    payment_mode: 'cash'
  });
  
  const [isManual, setIsManual] = useState(false);

  useEffect(() => {
    if (searchParams.get('mode') === 'manual') {
      setIsManual(true);
      setFormData(prev => ({ ...prev, date: new Date().toISOString().slice(0,10) }));
    }
  }, [searchParams]);

  useEffect(() => {
    async function fetchAccounts() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: business } = await supabase
        .from('businesses')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (business) {
        const { data: accs } = await supabase
          .from('accounts')
          .select('id, name, type')
          .eq('business_id', business.id)
          .order('name');
        if (accs) setAccounts(accs);
      }
    }
    fetchAccounts();
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
      await processReceipt(selectedFile);
    }
  };

  const processReceipt = async (receiptFile: File) => {
    setIsProcessing(true);
    try {
      const data = new FormData();
      data.append('file', receiptFile);
      
      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: data,
      });
      const uploadData = await uploadRes.json();
      
      if (!uploadRes.ok) throw new Error(uploadData.error || 'Upload failed');
      
      const url = uploadData.url;
      const objectUrl = URL.createObjectURL(receiptFile);
      
      const img = new Image();
      img.src = objectUrl;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = () => reject(new Error('Failed to load image element'));
      });

      const { data: { text } } = await Tesseract.recognize(img, 'eng');
      URL.revokeObjectURL(objectUrl);
      
      setOcrText(text);

      let extractedAmount = '';
      let extractedDate = '';
      
      const amountMatch = text.match(/(?:NGN|₦|\$|Total:?)?\s*([\d,]+\.\d{2})/i);
      if (amountMatch) extractedAmount = amountMatch[1].replace(/,/g, '');

      const dateMatch = text.match(/\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b/);
      if (dateMatch) extractedDate = dateMatch[0];

      const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 2);
      const extractedMerchant = lines.length > 0 ? lines[0] : 'Unknown Merchant';
      
      let formattedDate = '';
      if (extractedDate) {
        const parts = extractedDate.replace(/\-/g, '/').split('/');
        if (parts.length === 3) {
          const p1 = parseInt(parts[0]);
          if (p1 > 12) {
            formattedDate = `20${parts[2].slice(-2)}-${parts[1].toString().padStart(2, '0')}-${parts[0].toString().padStart(2, '0')}`;
          } else {
             formattedDate = `20${parts[2].slice(-2)}-${parts[0].toString().padStart(2, '0')}-${parts[1].toString().padStart(2, '0')}`;
          }
        }
      }

      const categoryKeywords: Record<string, string[]> = {
        'Office Supplies': ['stationary', 'paper', 'ink', 'printer', 'workspace', 'office', 'staples', 'desktop'],
        'Rent Expense': ['rent', 'lease', 'tenant', 'landlord'],
        'Utilities Expense': ['electricity', 'water', 'internet', 'subscription', 'netflix', 'spotify', 'dstv', 'mtn', 'airtel', 'glo'],
      };

      let guessedAccountName = 'Office Supplies';
      const merchantLower = extractedMerchant.toLowerCase();
      
      for (const [accName, keywords] of Object.entries(categoryKeywords)) {
        if (keywords.some(kw => merchantLower.includes(kw))) {
          guessedAccountName = accName;
          break;
        }
      }

      const matchedAccount = accounts.find(a => a.name.toLowerCase().includes(guessedAccountName.toLowerCase()));

      setFormData(prev => ({
        ...prev,
        merchant: extractedMerchant,
        amount: extractedAmount,
        date: formattedDate || new Date().toISOString().slice(0,10),
        category: guessedAccountName,
        receipt_url: url,
        account_id: matchedAccount?.id || ''
      }));

    } catch (error) {
      console.error(error);
      alert('Failed to process receipt.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        alert('Transaction Saved!');
        router.push('/transactions');
      } else {
        const err = await res.json();
        alert('Error: ' + err.error);
      }
    } catch(err) {
      console.error(err);
      alert('Saving failed.');
    }
  };

  return (
    <div className="space-y-10 py-4 max-w-6xl mx-auto animate-fade-in">
      <div className="text-center md:text-left animate-slide-up">
        <h1 className="text-4xl lg:text-5xl font-black tracking-tight text-[var(--foreground)]">Digitalize Receipts</h1>
        <p className="text-[var(--color-brand-gray)] font-black mt-2 uppercase text-[10px] tracking-[0.3em]">Neural OCR Ledger Technology</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
        
        <div className="neo-card p-6 md:p-10 rounded-[2.5rem] bg-[var(--surface)] border-dashed border-2 border-[var(--border)] hover:border-[var(--color-brand-peach)] transition-all flex flex-col items-center justify-center min-h-[400px] lg:min-h-[500px] group/upload animate-scale-in">
          {!file && !isManual && (
            <div className="w-full h-full flex flex-col">
              <div className="text-center group cursor-pointer relative flex-1 flex flex-col items-center justify-center p-8 lg:p-12">
                <div className="w-20 h-20 lg:w-24 lg:h-24 bg-gradient-to-br from-[var(--color-brand-peach)]/20 to-[var(--color-brand-gold)]/20 rounded-3xl flex items-center justify-center mb-6 group-hover:scale-110 transition-all duration-500 shadow-xl shadow-black/[0.02]">
                  <UploadCloud className="w-10 h-10 lg:w-12 lg:h-12 text-[var(--color-brand-peach)]" />
                </div>
                <h2 className="text-xl lg:text-2xl font-black tracking-tight mb-2">Drop your receipt</h2>
                <p className="text-[11px] lg:text-sm text-[var(--color-brand-gray)] font-medium max-w-[240px] leading-relaxed opacity-60">
                  Our AI engine will parse merchant details, timestamps, and payment volume.
                </p>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleFileChange} 
                  className="absolute inset-0 opacity-0 cursor-pointer z-10"
                />
              </div>
              <div className="pt-8 border-t border-[var(--border)] w-full flex flex-col items-center relative z-20">
                <p className="text-[10px] font-bold text-[var(--color-brand-gray)] mb-4 uppercase tracking-widest">No receipt?</p>
                <button 
                  onClick={() => {
                    setIsManual(true);
                    setFormData(prev => ({ ...prev, date: new Date().toISOString().slice(0,10) }));
                  }}
                  className="px-6 py-3 bg-[var(--surface)] text-[var(--foreground)] rounded-2xl border border-[var(--border)] text-[10px] font-black tracking-widest uppercase hover:bg-[var(--foreground)] hover:text-[var(--background)] transition-all flex items-center gap-2 group shadow-lg shadow-black/5"
                >
                  Enter Manually
                </button>
              </div>
            </div>
          )}

          {file && previewUrl && (
            <div className="w-full space-y-6 animate-fade-in">
              <div className="relative group overflow-hidden rounded-2xl shadow-2xl border-none">
                <img src={previewUrl} alt="Preview" className="w-full h-auto max-h-[450px] object-contain bg-gray-50" />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center backdrop-blur-sm">
                  <button 
                    onClick={() => { setFile(null); setPreviewUrl(null); setOcrText(''); setIsManual(false); }}
                    className="bg-[var(--foreground)] text-[var(--background)] px-6 py-2.5 rounded-xl font-bold hover:bg-[var(--color-brand-peach)] transition-all transform active:scale-95"
                  >
                    Replace Image
                  </button>
                </div>
              </div>
            </div>
          )}
          {isManual && !file && (
             <div className="text-center p-8 lg:p-12 animate-fade-in group">
                <div className="w-20 h-20 bg-[var(--foreground)] text-[var(--background)] rounded-3xl flex items-center justify-center mb-6 mx-auto shadow-2xl">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h2 className="text-xl lg:text-2xl font-black tracking-tight mb-2">Manual Protocol</h2>
                <p className="text-[11px] lg:text-sm text-[var(--color-brand-gray)] font-medium max-w-[240px] leading-relaxed opacity-60 mx-auto mb-8">
                  Directly mapping records to the ledger. You can still upload a receipt later.
                </p>
                <button 
                  onClick={() => setIsManual(false)}
                  className="px-6 py-2 text-[10px] font-black uppercase tracking-widest text-[var(--color-brand-peach)] hover:underline"
                >
                  Back to Neural Scan
                </button>
             </div>
          )}
        </div>

        <div className="neo-card p-6 md:p-10 rounded-[2.5rem] bg-[var(--surface)] lg:sticky lg:top-8 shadow-2xl shadow-black/[0.02] border-none animate-slide-up [animation-delay:200ms]">
          {isProcessing ? (
            <div className="flex flex-col items-center justify-center p-8 lg:p-12 h-[350px] lg:h-[450px] text-center">
              <div className="relative mb-8">
                <Loader2 className="w-20 h-20 animate-spin text-[var(--color-brand-peach)]/10" />
                <div className="absolute inset-0 flex items-center justify-center">
                   <Loader2 className="w-10 h-10 animate-spin text-[var(--color-brand-peach)]" />
                </div>
              </div>
              <h3 className="text-xl lg:text-2xl font-black tracking-tight mb-2">Analyzing Node</h3>
              <p className="text-[var(--color-brand-gray)] font-black text-[10px] uppercase tracking-[0.2em] max-w-[200px]">Extracting patterns and volume...</p>
            </div>
          ) : (
            <form onSubmit={handleSave} className={`space-y-6 ${( !file && !isManual ) ? 'opacity-30 grayscale pointer-events-none' : ''}`}>
              <div className="flex items-center gap-3 mb-8">
                <div className="w-8 h-8 bg-[var(--color-brand-peach)]/10 text-[var(--color-brand-peach)] rounded-lg flex items-center justify-center shadow-lg shadow-[var(--color-brand-peach)]/5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <h3 className="text-xl font-black tracking-tight">Journal Verification</h3>
              </div>
              
              <div className="space-y-5">
                <div className="group">
                  <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-brand-gray)] mb-2 px-1">Merchant Identity</label>
                  <input 
                    type="text" 
                    value={formData.merchant}
                    onChange={(e) => setFormData({...formData, merchant: e.target.value})}
                    placeholder="e.g. Starbucks Core"
                    className="neo-input"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-brand-gray)] mb-2 px-1">Value Volume (₦)</label>
                    <input 
                      type="number" 
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) => setFormData({...formData, amount: e.target.value})}
                      className="neo-input font-black text-xl"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-brand-gray)] mb-2 px-1">Entry Timestamp</label>
                    <input 
                      type="date" 
                      value={formData.date}
                      onChange={(e) => setFormData({...formData, date: e.target.value})}
                      className="neo-input"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-brand-gray)] mb-2 px-1">Mapping Account</label>
                    <select 
                      value={formData.account_id}
                      onChange={(e) => setFormData({...formData, account_id: e.target.value})}
                      className="neo-input appearance-none cursor-pointer"
                      required
                    >
                      <option value="">Select Account...</option>
                      {accounts.filter(a => {
                        if (formData.payment_mode === 'loan') return a.type === 'Liability';
                        if (formData.type === 'income') return a.type === 'Income';
                        // For Outflows (Expense flow), allow Expenses, Assets (Inventory), OR Liabilities (Debt Repayment)
                        return a.type === 'Expense' || a.type === 'Asset' || a.type === 'Liability';
                      }).map(acc => (
                        <option key={acc.id} value={acc.id}>{acc.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-brand-gray)] mb-2 px-1">Settlement Protocol</label>
                      <div className="flex gap-2 p-1.5 bg-[var(--background)] rounded-2xl ring-1 ring-[var(--border)] overflow-x-auto">
                        {[
                          { id: 'cash', label: 'Cash', color: 'var(--color-brand-peach)' },
                          { id: 'credit', label: 'Payable', color: 'var(--color-brand-gold)' },
                          { id: 'loan', label: 'Loan', color: '#60a5fa' },
                          { id: 'receivable', label: 'Receivable', color: '#10b981' }
                        ].map((mode) => (
                          <button
                            key={mode.id}
                            type="button"
                            onClick={() => {
                              setFormData({
                                ...formData, 
                                payment_mode: mode.id, 
                                type: (mode.id === 'loan' || mode.id === 'receivable') ? 'income' : formData.type,
                                account_id: '' // Reset account when mode changes
                              });
                            }}
                            className={`flex-1 py-3 px-4 text-[9px] font-black uppercase tracking-[0.2em] rounded-xl transition-all whitespace-nowrap ${formData.payment_mode === mode.id ? 'bg-[var(--foreground)] text-[var(--background)] shadow-xl' : 'text-gray-400 hover:text-gray-600'}`}
                            style={formData.payment_mode === mode.id ? { color: mode.color } : {}}
                          >
                            {mode.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-brand-gray)] mb-2 px-1">Flow Protocol</label>
                      <div className="flex gap-2 p-1.5 bg-[var(--background)] rounded-2xl ring-1 ring-[var(--border)]">
                        <button
                          type="button"
                          disabled={formData.payment_mode === 'loan' || formData.payment_mode === 'receivable'}
                          onClick={() => setFormData({...formData, type: 'expense'})}
                          className={`flex-1 py-3 px-4 text-[9px] font-black uppercase tracking-[0.2em] rounded-xl transition-all ${formData.type === 'expense' && formData.payment_mode !== 'loan' && formData.payment_mode !== 'receivable' ? 'bg-[var(--foreground)] text-[var(--color-status-red)] shadow-xl' : 'text-gray-400 hover:text-gray-200'}`}
                        >
                          Expense
                        </button>
                        <button
                          type="button"
                          disabled={formData.payment_mode === 'loan' || formData.payment_mode === 'receivable'}
                          onClick={() => setFormData({...formData, type: 'income'})}
                          className={`flex-1 py-3 px-4 text-[9px] font-black uppercase tracking-[0.2em] rounded-xl transition-all ${formData.type === 'income' || formData.payment_mode === 'loan' || formData.payment_mode === 'receivable' ? 'bg-[var(--foreground)] text-[var(--color-status-green)] shadow-xl' : 'text-gray-400 hover:text-gray-200'}`}
                        >
                          Income
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <button 
                  type="submit"
                  className="w-full bg-[var(--color-brand-peach)] hover:bg-[var(--color-brand-gold)] text-[var(--color-brand-dark)] font-black uppercase tracking-[0.2em] py-5 px-8 rounded-2xl transition-all duration-500 transform active:scale-[0.98] shadow-2xl shadow-[var(--color-brand-peach)]/30 hover:shadow-[var(--color-brand-gold)]/40 text-[10px] overflow-hidden relative group"
                >
                  <span className="relative z-10 transition-transform duration-500 group-hover:block">Commit to Secure Ledger</span>
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function UploadPage() {
  return (
    <Suspense fallback={
       <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-10 h-10 animate-spin text-[var(--color-brand-peach)]" />
       </div>
    }>
      <UploadForm />
    </Suspense>
  );
}
