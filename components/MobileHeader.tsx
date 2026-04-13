"use client";

import { Menu, X, CreditCard } from 'lucide-react';
import Link from 'next/link';
import ThemeToggle from './ThemeToggle';
import { m } from "framer-motion";

interface MobileHeaderProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export default function MobileHeader({ isOpen, setIsOpen }: MobileHeaderProps) {
  return (
    <header className="lg:hidden fixed top-0 left-0 right-0 h-20 bg-[#121212] text-white px-4 sm:px-6 flex items-center justify-between z-50 shadow-xl border-b border-white/5 gap-2">
      <Link href="/dashboard" className="flex items-center gap-3">
        <div className="w-9 h-9 bg-[var(--color-brand-peach)] rounded-lg flex items-center justify-center shadow-lg shadow-[var(--color-brand-peach)]/20">
          <CreditCard className="text-[var(--color-ink)] w-5 h-5" />
        </div>
        <h1 className="text-lg font-black tracking-tighter leading-none">
          OHIO<span className="text-[var(--color-brand-peach)]">LEDGER</span>
        </h1>
      </Link>

      <div className="flex items-center gap-2">
        <div className="hidden sm:block scale-90 origin-right">
          <ThemeToggle />
        </div>

        <m.button
          onClick={() => setIsOpen(!isOpen)}
          whileTap={{ scale: 0.96 }}
          transition={{ type: "spring", stiffness: 300, damping: 24 }}
          className="p-2.5 bg-white/5 rounded-xl hover:bg-white/10 transition-all border border-white/5 active:scale-95"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </m.button>
      </div>
    </header>
  );
}
