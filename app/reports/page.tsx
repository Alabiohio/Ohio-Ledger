import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { FileText, BarChart3, PieChart, Landmark } from 'lucide-react';
import Link from 'next/link';

export default async function ReportsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const reportModules = [
    {
      title: 'Trial Balance',
      description: 'Verify that total debits match total credits across all accounts.',
      href: '/reports/trial-balance',
      icon: FileText,
      color: 'bg-blue-500/10 text-blue-500',
    },
    {
      title: 'Income Statement',
      description: 'Detailed view of revenues and expenses over a period of time.',
      href: '/reports/income-statement',
      icon: BarChart3,
      color: 'bg-green-500/10 text-green-500',
    },
    {
      title: 'Balance Sheet',
      description: 'Snapshot of your assets, liabilities, and equity at a specific point.',
      href: '/reports/balance-sheet',
      icon: Landmark,
      color: 'bg-purple-500/10 text-purple-500',
    },
    {
      title: 'Cash Flow',
      description: 'Track the flow of cash in and out of your business.',
      href: '/reports/cash-flow',
      icon: PieChart,
      color: 'bg-orange-500/10 text-orange-500',
    }
  ];

  return (
    <div className="space-y-10 py-4">
      <div>
        <h1 className="text-4xl font-black tracking-tight text-[var(--foreground)]">Financial Reports</h1>
        <p className="text-[var(--color-brand-gray)] font-medium mt-1 uppercase text-[10px] tracking-widest">Advanced Accounting Analysis</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reportModules.map((report) => {
          const Icon = report.icon;
          return (
            <Link 
              key={report.title} 
              href={report.href}
              className="neo-card bg-[var(--surface)] p-8 rounded-[2.5rem] hover:shadow-2xl hover:shadow-black/5 transition-all group border-none"
            >
              <div className="flex items-start gap-6">
                <div className={`p-4 rounded-2xl ${report.color} transition-transform group-hover:scale-110 group-hover:rotate-3`}>
                  <Icon className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-[var(--foreground)] mb-2 group-hover:text-ohio-peach transition-colors">
                    {report.title}
                  </h3>
                  <p className="text-sm text-[var(--color-brand-gray)] leading-relaxed">
                    {report.description}
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
