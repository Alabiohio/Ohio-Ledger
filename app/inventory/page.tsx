"use client";

import { useState, useEffect } from "react";
import { Plus, Package, AlertTriangle, TrendingUp, DollarSign, Edit2, Trash2 } from "lucide-react";
import ClientLayout from "@/components/ClientLayout";
import { createClient } from "@/utils/supabase/client";

interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  current_quantity: number;
  reorder_level: number;
  unit_price: number;
}

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const [valuation, setValuation] = useState(0);

  useEffect(() => {
    fetchInventory();
  }, []);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newItem, setNewItem] = useState({ name: "", sku: "", category: "", unit_price: "", reorder_level: "5" });

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<InventoryItem | null>(null);

  // Stock Management Modal State
  const [activeItem, setActiveItem] = useState<InventoryItem | null>(null);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [stockForm, setStockForm] = useState({
    type: "inventory_purchase", // or "inventory_sale"
    quantity: "",
    unit_price: "", // Cost or Selling Price
    date: new Date().toISOString().slice(0, 10),
    payment_mode: "cash"
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/inventory");
      if (!res.ok) throw new Error("Failed to fetch inventory");
      const data = await res.json();
      
      if (data.needsMigration) {
        console.warn("Inventory schema migration needed");
      } else {
        setItems(data.items || []);
        setValuation(data.valuation || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: business } = await supabase.from("businesses").select("id").eq("user_id", user.id).single();
      if (!business) return;

      const { error } = await supabase.from("inventory_items").insert({
        business_id: business.id,
        name: newItem.name,
        sku: newItem.sku.trim() || null,
        category: newItem.category || "Uncategorized",
        unit_price: Number(newItem.unit_price) || 0,
        reorder_level: Number(newItem.reorder_level) || 0,
        current_quantity: 0
      });

      if (error) {
        alert("Failed to add component: " + error.message);
      } else {
        setIsAddModalOpen(false);
        setNewItem({ name: "", sku: "", category: "", unit_price: "", reorder_level: "5" });
        fetchInventory();
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editItem) return;
    try {
      const { error } = await supabase.from("inventory_items").update({
        name: editItem.name,
        sku: (editItem.sku && editItem.sku.trim()) || null,
        category: editItem.category || "Uncategorized",
        unit_price: Number(editItem.unit_price) || 0,
        reorder_level: Number(editItem.reorder_level) || 0,
      }).eq('id', editItem.id);

      if (error) throw error;
      setIsEditModalOpen(false);
      fetchInventory();
    } catch (err: any) {
      alert("Error updating item: " + err.message);
    }
  };

  const handleDeleteItem = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete ${name}? This may fail if it has existing stock batches or ledger history.`)) return;
    try {
      const { error } = await supabase.from("inventory_items").delete().eq('id', id);
      if (error) throw error;
      fetchInventory();
    } catch (err: any) {
      alert("Cannot delete item. It likely has tied stock transaction records. " + err.message);
    }
  };

  const handleStockTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeItem) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/inventory/transaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: stockForm.type,
          item_id: activeItem.id,
          quantity: Number(stockForm.quantity),
          unit_price: Number(stockForm.unit_price),
          date: stockForm.date,
          payment_mode: stockForm.payment_mode
        })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Transaction failed");
      
      setIsStockModalOpen(false);
      fetchInventory(); // Refresh data
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openStockModal = (item: InventoryItem, type: "inventory_purchase" | "inventory_sale") => {
    setActiveItem(item);
    setStockForm({
      type,
      quantity: "",
      unit_price: type === "inventory_sale" ? item.unit_price.toString() : "",
      date: new Date().toISOString().slice(0, 10),
      payment_mode: "cash"
    });
    setIsStockModalOpen(true);
  };

  const lowStockCount = items.filter(i => i.current_quantity <= i.reorder_level).length;

  return (
    <ClientLayout>
      <div className="max-w-6xl mx-auto space-y-6 overflow-x-hidden">
        <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tighter text-[var(--color-ink)]">
              Stock <span className="text-[var(--color-brand-peach)]">Ledger</span>
            </h1>
            <p className="text-[var(--color-brand-gray)] mt-1 font-medium tracking-tight">
              Manage physical inventory and track costs.
            </p>
          </div>
          <button 
             onClick={() => setIsAddModalOpen(true)}
             className="h-12 w-full sm:w-auto px-6 bg-[var(--color-ink)] text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all shadow-xl shadow-[var(--color-ink)]/10"
          >
            <Plus className="w-5 h-5" />
            Add New Item
          </button>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-3xl p-6 border border-black/5 flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-[var(--color-brand-gray)] font-semibold">Total Items</p>
              <p className="text-2xl font-bold">{items.length}</p>
            </div>
          </div>
          
          <div className="bg-white rounded-3xl p-6 border border-black/5 flex items-center gap-4">
            <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-[var(--color-brand-gray)] font-semibold">Low Stock Alerts</p>
              <p className="text-2xl font-bold">{lowStockCount}</p>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-black/5 flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div>
               <p className="text-sm text-[var(--color-brand-gray)] font-semibold">Stock Value</p>
               <p className="text-2xl font-bold">${valuation.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Inventory List */}
        <div className="bg-white rounded-3xl border border-black/5 overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-black/5">
            <h2 className="text-lg font-bold">Inventory Items</h2>
          </div>
          {loading ? (
            <div className="p-12 text-center text-[var(--color-brand-gray)]">Loading stock data...</div>
          ) : items.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center">
               <Package className="w-12 h-12 text-black/10 mb-4" />
               <p className="text-[var(--color-brand-gray)] font-medium mb-2">No inventory items found.</p>
               <p className="text-sm text-black/40">You may need to run the SQL migration first.</p>
            </div>
          ) : (
            <>
              <div className="md:hidden divide-y divide-black/5">
                {items.map((item) => (
                  <div key={item.id} className="p-5 space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-bold text-[var(--color-ink)] break-words">{item.name}</div>
                        <div className="text-xs text-[var(--color-brand-gray)] mt-0.5 break-all">
                          {item.sku || "No SKU"}
                        </div>
                      </div>
                      {item.current_quantity <= item.reorder_level && (
                        <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-orange-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-orange-700">
                          <AlertTriangle className="w-3 h-3" />
                          Low
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-2xl bg-black/[0.03] p-3">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-brand-gray)]">Category</p>
                        <p className="mt-1 font-semibold break-words text-[var(--color-ink)]">{item.category || "-"}</p>
                      </div>
                      <div className="rounded-2xl bg-black/[0.03] p-3">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-brand-gray)]">Selling Price</p>
                        <p className="mt-1 font-semibold text-[var(--color-ink)]">${Number(item.unit_price).toFixed(2)}</p>
                      </div>
                      <div className="rounded-2xl bg-black/[0.03] p-3 col-span-2">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-brand-gray)]">In Stock</p>
                        <p className={`mt-1 font-semibold ${item.current_quantity <= item.reorder_level ? "text-orange-600" : "text-[var(--color-ink)]"}`}>
                          {item.current_quantity}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => openStockModal(item, "inventory_purchase")}
                        className="px-3 py-2.5 bg-black/5 hover:bg-black/10 rounded-xl text-xs font-bold transition-colors"
                      >
                        + Buy
                      </button>
                      <button
                        onClick={() => openStockModal(item, "inventory_sale")}
                        className="px-3 py-2.5 bg-[var(--color-brand-peach)]/10 text-orange-700 hover:bg-[var(--color-brand-peach)]/20 rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
                        disabled={item.current_quantity <= 0}
                      >
                        - Sell
                      </button>
                      <button
                        onClick={() => { setEditItem(item); setIsEditModalOpen(true); }}
                        className="px-3 py-2.5 rounded-xl bg-black/5 hover:bg-black/10 transition-colors text-xs font-bold text-black/70"
                      >
                        Edit Item
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item.id, item.name)}
                        className="px-3 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 transition-colors text-xs font-bold text-red-600"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-black/[0.02] text-xs uppercase text-[var(--color-brand-gray)] font-bold">
                    <tr>
                      <th className="px-6 py-4">Item (SKU)</th>
                      <th className="px-6 py-4">Category</th>
                      <th className="px-6 py-4 text-right">Selling Price</th>
                      <th className="px-6 py-4 text-right">In Stock</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5 font-medium whitespace-nowrap">
                    {items.map((item) => (
                      <tr key={item.id} className="hover:bg-black/[0.01]">
                        <td className="px-6 py-4">
                          <div className="font-bold text-[var(--color-ink)]">{item.name}</div>
                          <div className="text-xs text-[var(--color-brand-gray)] mt-0.5">{item.sku || "No SKU"}</div>
                        </td>
                        <td className="px-6 py-4 text-[var(--color-brand-gray)]">
                          {item.category || "-"}
                        </td>
                        <td className="px-6 py-4 text-right">
                          ${Number(item.unit_price).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {item.current_quantity <= item.reorder_level && (
                              <AlertTriangle className="w-4 h-4 text-orange-500" />
                            )}
                            <span className={item.current_quantity <= item.reorder_level ? "text-orange-600 font-bold" : ""}>
                              {item.current_quantity}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => openStockModal(item, "inventory_purchase")}
                              className="px-3 py-1.5 bg-black/5 hover:bg-black/10 rounded-lg text-xs font-bold transition-colors"
                            >
                              + Buy
                            </button>
                            <button 
                              onClick={() => openStockModal(item, "inventory_sale")}
                              className="px-3 py-1.5 bg-[var(--color-brand-peach)]/10 text-orange-700 hover:bg-[var(--color-brand-peach)]/20 rounded-lg text-xs font-bold transition-colors"
                              disabled={item.current_quantity <= 0}
                            >
                              - Sell
                            </button>
                            <div className="w-px h-4 bg-black/10 mx-1 border-r border-black/5" />
                            <button onClick={() => { setEditItem(item); setIsEditModalOpen(true); }} className="w-8 h-8 rounded-lg bg-black/5 flex items-center justify-center hover:bg-black/10 transition-colors text-black/60 hover:text-black">
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => handleDeleteItem(item.id, item.name)} className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center hover:bg-red-500/20 transition-colors text-red-600 hover:text-red-700">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Add Item Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] p-5 sm:p-8 md:p-12 max-w-md w-full max-h-[calc(100vh-2rem)] overflow-y-auto shadow-2xl animate-scale-in">
            <h2 className="text-2xl font-black mb-6">New Inventory Item</h2>
            <form onSubmit={handleAddItem} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Item Name</label>
                <input required type="text" className="w-full neo-input" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} placeholder="e.g. MacBook Pro M3" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">SKU</label>
                  <input type="text" className="w-full neo-input" value={newItem.sku} onChange={e => setNewItem({...newItem, sku: e.target.value})} placeholder="SKU-123" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Category</label>
                  <input type="text" className="w-full neo-input" value={newItem.category} onChange={e => setNewItem({...newItem, category: e.target.value})} placeholder="Electronics" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Selling Price</label>
                  <input required type="number" step="0.01" className="w-full neo-input font-bold" value={newItem.unit_price} onChange={e => setNewItem({...newItem, unit_price: e.target.value})} placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Reorder Lvl</label>
                  <input required type="number" className="w-full neo-input" value={newItem.reorder_level} onChange={e => setNewItem({...newItem, reorder_level: e.target.value})} placeholder="5" />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 pt-4 mt-8 border-t border-black/5">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-6 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition-colors w-full">Cancel</button>
                <button type="submit" className="px-6 py-3 rounded-xl font-bold bg-[var(--color-brand-peach)] text-[var(--color-ink)] w-full hover:brightness-105 transition-all">Save Item</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Item Modal */}
      {isEditModalOpen && editItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] p-5 sm:p-8 md:p-12 max-w-md w-full max-h-[calc(100vh-2rem)] overflow-y-auto shadow-2xl animate-scale-in">
            <h2 className="text-2xl font-black mb-6">Edit {editItem.name}</h2>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Item Name</label>
                <input required type="text" className="w-full neo-input" value={editItem.name} onChange={e => setEditItem({...editItem, name: e.target.value})} placeholder="e.g. MacBook Pro M3" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">SKU</label>
                  <input type="text" className="w-full neo-input" value={editItem.sku || ''} onChange={e => setEditItem({...editItem, sku: e.target.value})} placeholder="SKU-123" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Category</label>
                  <input type="text" className="w-full neo-input" value={editItem.category || ''} onChange={e => setEditItem({...editItem, category: e.target.value})} placeholder="Electronics" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Selling Price</label>
                  <input required type="number" step="0.01" className="w-full neo-input font-bold" value={editItem.unit_price} onChange={e => setEditItem({...editItem, unit_price: Number(e.target.value)})} placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Reorder Lvl</label>
                  <input required type="number" className="w-full neo-input" value={editItem.reorder_level} onChange={e => setEditItem({...editItem, reorder_level: Number(e.target.value)})} placeholder="5" />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 pt-4 mt-8 border-t border-black/5">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-6 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition-colors w-full">Cancel</button>
                <button type="submit" className="px-6 py-3 rounded-xl font-bold bg-[var(--color-brand-peach)] text-[var(--color-ink)] w-full hover:brightness-105 transition-all">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Buy/Sell Stock Modal */}
      {isStockModalOpen && activeItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] p-5 sm:p-8 md:p-12 max-w-md w-full max-h-[calc(100vh-2rem)] overflow-y-auto shadow-2xl animate-scale-in">
            <h2 className="text-2xl font-black mb-1">
              {stockForm.type === "inventory_purchase" ? "Purchase Stock" : "Sell Stock"}
            </h2>
            <p className="text-sm font-bold text-[var(--color-brand-gray)] mb-6 flex items-center gap-2">
              <Package className="w-4 h-4" /> {activeItem.name}
            </p>

            <form onSubmit={handleStockTransaction} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Quantity</label>
                  <input required type="number" min="1" className="w-full neo-input text-lg font-bold" value={stockForm.quantity} onChange={e => setStockForm({...stockForm, quantity: e.target.value})} placeholder="10" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">
                    {stockForm.type === "inventory_purchase" ? "Cost (Per Unit)" : "Sell Price (Per Unit)"}
                  </label>
                  <input required type="number" step="0.01" className="w-full neo-input text-lg font-bold" value={stockForm.unit_price} onChange={e => setStockForm({...stockForm, unit_price: e.target.value})} placeholder="0.00" />
                </div>
              </div>
              
              <div>
                 <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Date</label>
                 <input required type="date" className="w-full neo-input" value={stockForm.date} onChange={e => setStockForm({...stockForm, date: e.target.value})} />
              </div>

              <div>
                 <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Payment Method</label>
                 <div className="flex gap-2 flex-col sm:flex-row">
                    {stockForm.type === 'inventory_purchase' ? (
                       <>
                         <button type="button" onClick={() => setStockForm({...stockForm, payment_mode: 'cash'})} className={`flex-1 py-3 rounded-xl font-bold text-xs uppercase tracking-widest ${stockForm.payment_mode === 'cash' ? 'bg-black text-white' : 'bg-black/5 hover:bg-black/10'}`}>Cash</button>
                         <button type="button" onClick={() => setStockForm({...stockForm, payment_mode: 'credit'})} className={`flex-1 py-3 rounded-xl font-bold text-xs uppercase tracking-widest ${stockForm.payment_mode === 'credit' ? 'bg-[var(--color-brand-gold)]' : 'bg-black/5 hover:bg-black/10'}`}>Credit / AP</button>
                       </>
                    ) : (
                       <>
                         <button type="button" onClick={() => setStockForm({...stockForm, payment_mode: 'cash'})} className={`flex-1 py-3 rounded-xl font-bold text-xs uppercase tracking-widest ${stockForm.payment_mode === 'cash' ? 'bg-[var(--color-brand-peach)] text-black' : 'bg-black/5 hover:bg-black/10'}`}>Cash</button>
                         <button type="button" onClick={() => setStockForm({...stockForm, payment_mode: 'receivable'})} className={`flex-1 py-3 rounded-xl font-bold text-xs uppercase tracking-widest ${stockForm.payment_mode === 'receivable' ? 'bg-green-500 text-white' : 'bg-black/5 hover:bg-black/10'}`}>Invoice / AR</button>
                       </>
                    )}
                 </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-4 mt-8 border-t border-black/5">
                <button type="button" onClick={() => setIsStockModalOpen(false)} className="px-6 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition-colors w-full">Cancel</button>
                <button disabled={isSubmitting} type="submit" className={`px-6 py-3 rounded-xl font-bold w-full transition-all ${stockForm.type === 'inventory_purchase' ? 'bg-black text-white hover:bg-gray-800' : 'bg-[var(--color-brand-peach)] text-black hover:brightness-105'}`}>
                  {isSubmitting ? "Saving..." : (stockForm.type === "inventory_purchase" ? "Record Purchase" : "Record Sale")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </ClientLayout>
  );
}
