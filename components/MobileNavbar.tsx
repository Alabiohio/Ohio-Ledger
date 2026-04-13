"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Receipt, CreditCard, FileUp, Plus } from 'lucide-react';
import { m } from "framer-motion";

export default function MobileNavbar() {
  const pathname = usePathname();

  const navItems = [
    { name: 'Home', icon: LayoutDashboard, href: '/dashboard' },
    { name: 'Records', icon: Receipt, href: '/transactions' },
    { name: 'Accounts', icon: CreditCard, href: '/accounts' },
    { name: 'Reports', icon: FileUp, href: '/reports' },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-[rgba(0,0,0,0.08)] shadow-[0_-10px_30px_rgba(0,0,0,0.06)] z-[50] flex items-center justify-around px-1">
      {navItems.slice(0, 2).map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;
        return (
          <m.div
            key={item.href}
            whileTap={{ scale: 0.96 }}
            transition={{ type: "spring", stiffness: 300, damping: 24 }}
          >
            <Link
              href={item.href}
              className={`relative flex flex-col items-center justify-center gap-1 transition-all duration-200 w-12 h-12 rounded-xl group ${isActive ? 'text-[var(--color-brand-peach)]' : 'text-[#64748B]'
                }`}
            >
              {isActive && (
                <div className="absolute inset-0 bg-[var(--color-brand-peach)]/8 rounded-xl" />
              )}
              <Icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? 'scale-105' : 'group-active:scale-95'}`} />
              <span className="text-[10px] font-semibold tracking-[0.08em] relative z-10">{item.name}</span>
              {isActive && (
                <div className="absolute -bottom-1 w-1 h-1 bg-[var(--color-brand-peach)] rounded-full" />
              )}
            </Link>
          </m.div>
        );
      })}

      {/* Central Plus Button */}
      <div className="relative -mt-6">
        <m.div whileTap={{ scale: 0.94 }} transition={{ type: "spring", stiffness: 320, damping: 24 }}>
          <Link
            href="/upload?mode=manual"
            className="w-16 h-16 bg-gradient-to-tr from-[var(--color-brand-peach)] to-[var(--color-brand-gold)] rounded-full flex items-center justify-center shadow-[0_8px_16px_rgba(255,173,128,0.2)] border border-white/20 text-[var(--color-ink)] active:scale-95 transition-transform"
            aria-label="Add new record"
          >
            <Plus className="w-5 h-5 stroke-[3px]" />
          </Link>
        </m.div>
      </div>

      {navItems.slice(2, 4).map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;
        return (
          <m.div
            key={item.href}
            whileTap={{ scale: 0.96 }}
            transition={{ type: "spring", stiffness: 300, damping: 24 }}
          >
            <Link
              href={item.href}
              className={`relative flex flex-col items-center justify-center gap-1 transition-all duration-200 w-12 h-12 rounded-xl group ${isActive ? 'text-[var(--color-brand-peach)]' : 'text-[#64748B]'
                }`}
            >
              {isActive && (
                <div className="absolute inset-0 bg-[var(--color-brand-peach)]/8 rounded-xl" />
              )}
              <Icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? 'scale-105' : 'group-active:scale-95'}`} />
              <span className="text-[10px] font-semibold tracking-[0.08em] relative z-10">{item.name}</span>
              {isActive && (
                <div className="absolute -bottom-1 w-1 h-1 bg-[var(--color-brand-peach)] rounded-full" />
              )}
            </Link>
          </m.div>
        );
      })}
    </nav>
  );
}
