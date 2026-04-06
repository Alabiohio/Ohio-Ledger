"use client";

import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { Search, Filter, Download, FileText, Table as TableIcon } from 'lucide-react';

// jspdf and xlsx will be dynamically imported on the client during usage

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  merchant: string;
  date: string;
  category: string | null;
  notes: string | null;
}

export default function TransactionList({ transactions }: { transactions: Transaction[] }) {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const categories = useMemo(() => {
    const cats = new Set(transactions.map(t => t.category || 'Standard'));
    return ['all', ...Array.from(cats)];
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const matchesSearch = t.merchant.toLowerCase().includes(search.toLowerCase()) || 
                           (t.category?.toLowerCase() || '').includes(search.toLowerCase());
      const matchesType = typeFilter === 'all' || t.type === typeFilter;
      const matchesCategory = categoryFilter === 'all' || (t.category || 'Standard') === categoryFilter;
      
      return matchesSearch && matchesType && matchesCategory;
    });
  }, [transactions, search, typeFilter, categoryFilter]);

  const exportToExcel = async () => {
    const XLSX = await import('xlsx');
    const worksheet = XLSX.utils.json_to_sheet(filteredTransactions.map(t => ({
      Date: format(new Date(t.date), 'yyyy-MM-dd'),
      Merchant: t.merchant,
      Type: t.type.toUpperCase(),
      Category: t.category || 'Standard',
      Amount: t.amount,
      Notes: t.notes || ''
    })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Transactions");
    XLSX.writeFile(workbook, `Ohio_Ledger_Export_${format(new Date(), 'yyyyMMdd')}.xlsx`);
  };

  const exportToPDF = async () => {
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text("Ohio Ledger — Transaction Statement", 14, 22);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on: ${format(new Date(), 'PPP')}`, 14, 30);

    const tableData = filteredTransactions.map(t => [
      format(new Date(t.date), 'MMM d, yyyy'),
      t.merchant,
      t.category || 'Standard',
      t.type.toUpperCase(),
      `₦${t.amount.toLocaleString()}`
    ]);

    autoTable(doc, {
      startY: 40,
      head: [['Date', 'Merchant', 'Category', 'Type', 'Amount']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: '#2E2E2E', textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 245, 245] },
    });

    doc.save(`Ohio_Ledger_Statement_${format(new Date(), 'yyyyMMdd')}.pdf`);
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters Bar */}
      <div className="neo-card p-4 md:p-6 rounded-[2rem] bg-white/70 backdrop-blur-md flex flex-col lg:flex-row gap-4 items-center justify-between border-none shadow-xl shadow-black/5">
        <div className="relative flex-1 w-full group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-brand-gray)] group-focus-within:text-[var(--color-brand-peach)] transition-colors" />
          <input 
            type="text" 
            placeholder="Search merchant or category..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:ring-4 focus:ring-[var(--color-brand-peach)]/10 focus:border-[var(--color-brand-peach)] outline-none transition-all font-semibold text-sm"
          />
        </div>
        
        <div className="flex flex-wrap md:flex-nowrap gap-3 w-full lg:w-auto">
          <select 
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="flex-1 md:flex-none px-4 py-3.5 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-[var(--color-brand-peach)] outline-none transition-all font-bold text-[10px] uppercase tracking-widest cursor-pointer appearance-none text-center"
          >
            <option value="all">All Types</option>
            <option value="income">Income Only</option>
            <option value="expense">Expense Only</option>
          </select>

          <select 
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="flex-1 md:flex-none px-4 py-3.5 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-[var(--color-brand-peach)] outline-none transition-all font-bold text-[10px] uppercase tracking-widest cursor-pointer appearance-none text-center"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat === 'all' ? 'All Categories' : cat}</option>
            ))}
          </select>

          <div className="flex gap-2 w-full md:w-auto bg-gray-100/50 p-1 rounded-xl items-center justify-center">
            <button 
              onClick={exportToExcel}
              className="flex-1 md:flex-none p-2.5 hover:bg-white rounded-lg text-[var(--color-brand-dark)] transition-all flex items-center justify-center gap-2 group ring-1 ring-transparent hover:ring-black/5"
              title="Export to Excel"
            >
              <TableIcon className="w-4 h-4 group-hover:text-[var(--color-brand-peach)]" />
            </button>
            <button 
              onClick={exportToPDF}
              className="flex-1 md:flex-none p-2.5 hover:bg-white rounded-lg text-[var(--color-brand-dark)] transition-all flex items-center justify-center gap-2 group ring-1 ring-transparent hover:ring-black/5"
              title="Export to PDF"
            >
              <FileText className="w-4 h-4 group-hover:text-[var(--color-brand-peach)]" />
            </button>
          </div>
        </div>
      </div>

      {/* Transaction List Container */}
      <div className="neo-card rounded-[2rem] overflow-hidden border-none shadow-xl shadow-black/5 bg-white/80 backdrop-blur-sm p-2 md:p-0">
        {/* Desktop View: Table */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[var(--color-brand-dark)] text-white">
                <th className="py-5 px-8 font-bold text-[10px] uppercase tracking-widest">Date</th>
                <th className="py-5 px-8 font-bold text-[10px] uppercase tracking-widest">Merchant</th>
                <th className="py-5 px-8 font-bold text-[10px] uppercase tracking-widest">Category</th>
                <th className="py-5 px-8 font-bold text-[10px] uppercase tracking-widest">Type</th>
                <th className="py-5 px-8 font-bold text-[10px] uppercase tracking-widest text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-brand-gray)]/10">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <p className="text-xl font-bold text-[var(--color-brand-dark)]/20">No Matching Results</p>
                    <p className="text-sm text-[var(--color-brand-gray)] mt-2 italic">Try adjusting your search or filters</p>
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="group hover:bg-[var(--color-brand-peach)]/5 transition-all duration-300">
                    <td className="py-5 px-8 text-sm font-semibold text-[var(--color-brand-dark)]/60 italic">
                      {format(new Date(tx.date), 'MMM d, yyyy')}
                    </td>
                    <td className="py-5 px-8">
                      <div className="flex flex-col">
                        <span className="font-black text-[var(--color-brand-dark)] group-hover:text-[var(--color-brand-peach)] transition-colors tracking-tight">
                          {tx.merchant}
                        </span>
                        {tx.notes && <span className="text-[10px] text-[var(--color-brand-gray)] mt-0.5">{tx.notes}</span>}
                      </div>
                    </td>
                    <td className="py-5 px-8">
                      <span className="bg-[var(--color-brand-gray)]/10 text-[var(--color-brand-dark)] py-1.5 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest border border-[var(--color-brand-gray)]/5 group-hover:bg-[var(--color-brand-peach)]/10 group-hover:text-[var(--color-brand-peach)] transition-all">
                        {tx.category || 'Standard'}
                      </span>
                    </td>
                    <td className="py-5 px-8">
                      {tx.type === 'income' ? (
                        <div className="flex items-center gap-2 text-[var(--color-status-green)] font-black text-[10px] uppercase tracking-widest">
                          <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-status-green)] shadow-sm shadow-[var(--color-status-green)]/40" />
                          Income
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-[var(--color-status-red)] font-black text-[10px] uppercase tracking-widest">
                          <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-status-red)] shadow-sm shadow-[var(--color-status-red)]/40" />
                          Expense
                        </div>
                      )}
                    </td>
                    <td className={`py-5 px-8 text-right font-black text-lg tracking-tighter ${tx.type === 'income' ? 'text-[var(--color-status-green)]' : 'text-[var(--color-brand-dark)]'}`}>
                      {tx.type === 'income' ? '+' : '-'}₦{tx.amount.toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View: Cards */}
        <div className="lg:hidden space-y-2 p-2">
          {filteredTransactions.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-xl font-bold text-[var(--color-brand-dark)]/20">No Matching Results</p>
            </div>
          ) : (
            filteredTransactions.map((tx) => (
              <div key={tx.id} className="bg-white rounded-[1.5rem] p-5 shadow-sm border border-gray-100 flex flex-col gap-4 active:scale-[0.98] transition-all">
                <div className="flex justify-between items-start">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-[var(--color-brand-gray)] uppercase tracking-widest mb-1">
                      {format(new Date(tx.date), 'MMM d, yyyy')}
                    </span>
                    <span className="font-black text-lg text-[var(--color-brand-dark)] tracking-tight leading-tight">
                      {tx.merchant}
                    </span>
                  </div>
                  <div className={`text-xl font-black tracking-tighter ${tx.type === 'income' ? 'text-[var(--color-status-green)]' : 'text-[var(--color-brand-dark)]'}`}>
                    {tx.type === 'income' ? '+' : '-'}₦{tx.amount.toLocaleString()}
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                  <span className="bg-gray-50 text-[var(--color-brand-dark)]/60 py-1.5 px-3 rounded-lg text-[9px] font-bold uppercase tracking-widest">
                    {tx.category || 'Standard'}
                  </span>
                  
                  {tx.type === 'income' ? (
                    <div className="flex items-center gap-1.5 text-[var(--color-status-green)] font-black text-[9px] uppercase tracking-widest">
                      <div className="w-1 h-1 rounded-full bg-[var(--color-status-green)]" />
                      Income
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-[var(--color-status-red)] font-black text-[9px] uppercase tracking-widest">
                      <div className="w-1 h-1 rounded-full bg-[var(--color-status-red)]" />
                      Expense
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
