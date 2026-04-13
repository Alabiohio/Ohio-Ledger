"use client";

import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid, Cell } from 'recharts';

interface BudgetData {
  id: string;
  name: string;
  category: string;
  budget: number;
  spent: number;
  percentage: number;
  isDanger: boolean;
}

export function BudgetCharts({ data }: { data: BudgetData[] }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const chartData = data.map(item => ({
    name: item.name,
    budget: item.budget,
    actual: item.spent,
    isDanger: item.isDanger
  }));

  return (
    <div className="neo-card p-10 rounded-[2.5rem]">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-xl font-black tracking-tight text-[var(--color-brand-dark)]">Budget vs Actual</h3>
        <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-brand-gray)]">Comparative Analysis</div>
      </div>
      <div className="h-[340px] w-full">
        {mounted && chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%" debounce={100}>
            <BarChart data={chartData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fontWeight: 'bold', fill: 'var(--text-subtle)' }} 
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fontWeight: 'bold', fill: 'var(--text-subtle)' }} 
              />
              <Tooltip
                cursor={{ fill: 'rgba(255,173,128,0.05)' }}
                contentStyle={{
                  borderRadius: '16px',
                  border: '1px solid var(--border)',
                  background: 'var(--surface)',
                  boxShadow: 'var(--shadow-1)',
                  fontWeight: 'bold',
                }}
                formatter={(value: number) => [`₦${value.toLocaleString()}`, undefined]}
              />
              <Legend 
                verticalAlign="top" 
                height={36} 
                iconType="circle"
                wrapperStyle={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--color-brand-gray)' }}
              />
              <Bar
                name="Monthly Budget"
                dataKey="budget"
                fill="#E2E8F0"
                radius={[6, 6, 0, 0]}
                barSize={32}
              />
              <Bar
                name="Actual Spent"
                dataKey="actual"
                radius={[6, 6, 0, 0]}
                barSize={32}
                isAnimationActive
                animationDuration={900}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.isDanger ? '#F44336' : 'var(--color-brand-peach)'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full w-full flex items-center justify-center text-gray-300 italic text-sm">
            Setting up charts...
          </div>
        )}
      </div>
    </div>
  );
}
