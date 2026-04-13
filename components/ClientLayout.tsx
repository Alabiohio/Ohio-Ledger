"use client";

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import AppSidebar from "@/components/AppSidebar";
import MobileHeader from "@/components/MobileHeader";
import MobileNavbar from "@/components/MobileNavbar";
import ThemeToggle from "@/components/ThemeToggle";
import { PanelLeftOpen } from "lucide-react";
import { LazyMotion, domAnimation, m, MotionConfig } from "framer-motion";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();
  const pageKey = pathname ?? "page";

  const isPublicRoute = pathname === '/' || pathname?.startsWith('/login') || pathname?.startsWith('/auth');

  if (isPublicRoute) {
    return (
      <div className="flex min-h-screen w-full bg-[var(--background)]">
        <div className="fixed top-4 right-4 z-[70]">
          <ThemeToggle />
        </div>
        <main className="flex-1 p-6 lg:p-10 transition-all duration-300">
           {/* Subtle background decoration */}
           <div className="fixed top-0 right-0 -z-10 w-1/2 h-1/2 bg-[var(--color-brand-peach)]/5 blur-[120px] rounded-full pointer-events-none" />
           <div className="fixed bottom-0 left-0 -z-10 w-1/2 h-1/2 bg-[var(--color-brand-gold)]/5 blur-[120px] rounded-full pointer-events-none" />
          <div className="max-w-7xl mx-auto w-full h-full flex flex-col justify-center">
            {children}
          </div>
        </main>
      </div>
    );
  }

  return (
    <MotionConfig reducedMotion="user">
      <LazyMotion features={domAnimation}>
        <div className="flex min-h-screen w-full bg-[var(--background)] pb-24 lg:pb-0">
          <AppSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
          
          <div className="flex-1 flex flex-col min-h-screen">
            <MobileHeader isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
            
            <main className={`flex-1 p-4 sm:p-6 lg:p-10 transition-all duration-300 mt-20 lg:mt-0 ${isSidebarOpen ? 'lg:ml-72' : 'lg:ml-0'}`}>
              {!isSidebarOpen && (
                <button
                  type="button"
                  onClick={() => setIsSidebarOpen(true)}
                  className="hidden lg:inline-flex fixed top-6 left-6 z-[65] items-center justify-center w-11 h-11 rounded-2xl bg-[var(--surface)]/90 border border-[var(--border)] shadow-lg shadow-black/10 hover:bg-[var(--surface)] transition-all active:scale-95"
                  aria-label="Open sidebar"
                >
                  <PanelLeftOpen className="w-5 h-5 text-[var(--foreground)]" />
                </button>
              )}
              {/* Subtle background decoration */}
              <div className="fixed top-0 right-0 -z-10 w-1/2 h-1/2 bg-[var(--color-brand-peach)]/5 blur-[120px] rounded-full pointer-events-none" />
              <div className={`fixed bottom-0 left-0 -z-10 w-1/2 h-1/2 bg-[var(--color-brand-gold)]/5 blur-[120px] rounded-full pointer-events-none ${isSidebarOpen ? 'lg:left-72' : 'lg:left-0'}`} />
              
              <m.div
                key={pageKey}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                className="max-w-7xl mx-auto w-full"
              >
                {children}
              </m.div>
            </main>

            <MobileNavbar />
          </div>
        </div>
      </LazyMotion>
    </MotionConfig>
  );
}
