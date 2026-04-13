"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Receipt, FileUp, CreditCard, PanelLeftClose, Package, Target, UserCircle } from 'lucide-react';
import { m } from "framer-motion";

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export default function AppSidebar({ isOpen, setIsOpen }: SidebarProps) {
  const pathname = usePathname();

  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
    { name: 'Accounts', icon: CreditCard, href: '/accounts' },
    { name: 'Budgets', icon: Target, href: '/budgets' },
    { name: 'Inventory', icon: Package, href: '/inventory' },
    { name: 'General Ledger', icon: Receipt, href: '/ledger' },
    { name: 'Transactions', icon: Receipt, href: '/transactions' },
    { name: 'Reports', icon: FileUp, href: '/reports' },
    { name: 'Upload Receipt', icon: FileUp, href: '/upload' },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[55] lg:hidden animate-fade-in transition-all"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={`
        fixed left-0 top-0 bottom-0 w-72 sidebar-gradient text-[var(--color-brand-light)] flex flex-col h-screen z-[60] shadow-2xl transition-transform duration-500 ease-out
        ${isOpen ? 'translate-x-0 lg:translate-x-0' : '-translate-x-full lg:-translate-x-full'}
      `}>
        <div className="p-8 flex items-center gap-3 border-b border-white/5">
          <div className="w-10 h-10 bg-[var(--color-brand-peach)] rounded-xl flex items-center justify-center shadow-lg shadow-[var(--color-brand-peach)]/20 animate-smooth-bounce">
            <CreditCard className="text-[var(--color-ink)] w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tighter leading-none">
              OHIO<span className="text-[var(--color-brand-peach)]">LEDGER</span>
            </h1>
            <p className="text-[10px] text-[var(--color-brand-gray)] font-medium tracking-widest uppercase mt-1 text-white/40">Smart FinTrack</p>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="ml-auto hidden lg:inline-flex items-center justify-center w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all active:scale-95"
            aria-label="Collapse sidebar"
          >
            <PanelLeftClose className="w-5 h-5 text-white/80" />
          </button>
        </div>

        <nav className="flex-1 px-4 mt-8 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <m.div
                key={item.name}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 260, damping: 24 }}
              >
                <Link
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center px-4 py-3.5 rounded-xl transition-all duration-300 group ${isActive
                      ? 'active-link text-white shadow-sm ring-1 ring-white/10'
                      : 'hover:bg-white/5 text-[var(--color-brand-gray)] hover:text-white'
                    }`}
                >
                  <Icon className={`w-5 h-5 mr-3 transition-colors ${isActive ? 'text-[var(--color-brand-peach)]' : 'group-hover:text-[var(--color-brand-peach)]'
                    }`} />
                  <span className="font-semibold tracking-tight">{item.name}</span>
                </Link>
              </m.div>
            );
          })}
        </nav>

        <div className="p-6 border-t border-white/5">
          <m.div whileHover={{ x: 4 }} whileTap={{ scale: 0.98 }} transition={{ type: 'spring', stiffness: 260, damping: 24 }}>
            <Link
              href="/profile"
              onClick={() => setIsOpen(false)}
              className={`flex items-center px-4 py-3 rounded-xl transition-all duration-300 group ${
                pathname === '/profile'
                  ? 'active-link text-white ring-1 ring-white/10'
                  : 'hover:bg-white/5 text-[var(--color-brand-gray)] hover:text-white'
              }`}
            >
              <UserCircle className={`w-5 h-5 mr-3 transition-colors ${
                pathname === '/profile' ? 'text-[var(--color-brand-peach)]' : 'group-hover:text-[var(--color-brand-peach)]'
              }`} />
              <span className="font-semibold tracking-tight">Profile</span>
            </Link>
          </m.div>
        </div>
      </aside>
    </>
  );
}
