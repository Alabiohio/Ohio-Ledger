"use client";

import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface Transaction {
  id: string;
  type: string;
  amount: number | string;
  category: string | null;
  date: string | Date;
}

export function DashboardCharts({ transactions }: { transactions: Transaction[] }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const expensesByCategory = transactions
    .filter(t => t.type === 'expense' && t.category)
    .reduce((acc, t) => {
      acc[t.category!] = (acc[t.category!] || 0) + Number(t.amount);
      return acc;
    }, {} as Record<string, number>);

  const categoryData = Object.keys(expensesByCategory).map(key => ({
    name: key,
    value: expensesByCategory[key],
  }));

  const COLORS = ['#FFAD80', '#FFD700', '#2E2E2E', '#F44336', '#2196F3', '#BDBDBD'];

  // Income vs Expense Data
  const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0);
  const expense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0);
  
  const barData = [
    { name: 'Income', amount: income, fill: '#4CAF50' },
    { name: 'Expense', amount: expense, fill: '#F44336' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
      <div className="neo-card p-10 rounded-[2.5rem]">
        <div className="flex items-center justify-between mb-8">
           <h3 className="text-xl font-black tracking-tight text-[var(--color-brand-dark)]">Category Depth</h3>
           <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-brand-gray)]">Expense Split</div>
        </div>
        <div className="h-[260px] w-full">
          {mounted && categoryData.length > 0 && (
            <ResponsiveContainer width="100%" height="100%" debounce={100}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={90}
                  paddingAngle={8}
                  dataKey="value"
                  stroke="none"
                  isAnimationActive={false}
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontWeight: 'bold' }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
          {mounted && categoryData.length === 0 && (
            <div className="h-full w-full flex items-center justify-center text-gray-300 italic text-sm">
              No expense data available
            </div>
          )}
        </div>
      </div>

      <div className="neo-card p-10 rounded-[2.5rem]">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-xl font-black tracking-tight text-[var(--color-brand-dark)]">Cash Flow</h3>
          <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-brand-gray)]">Volume Comparison</div>
        </div>
        <div className="h-[260px] w-full">
          {mounted && (
            <ResponsiveContainer width="100%" height="100%" debounce={100}>
              <BarChart data={barData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold', fill: '#BDBDBD' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold', fill: '#BDBDBD' }} />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,173,128,0.05)' }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontWeight: 'bold' }}
                />
                <Bar dataKey="amount" radius={[8, 8, 0, 0]} barSize={40} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
