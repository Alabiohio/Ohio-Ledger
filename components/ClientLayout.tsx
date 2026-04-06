"use client";

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import AppSidebar from "@/components/AppSidebar";
import MobileHeader from "@/components/MobileHeader";
import ThemeToggle from "@/components/ThemeToggle";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();

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
    <div className="flex min-h-screen w-full bg-[var(--background)]">
      <AppSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      
      <div className="flex-1 flex flex-col min-h-screen">
        <MobileHeader isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
        
        <main className="flex-1 p-6 lg:p-10 lg:ml-72 transition-all duration-300 mt-20 lg:mt-0">
          {/* Subtle background decoration */}
          <div className="fixed top-0 right-0 -z-10 w-1/2 h-1/2 bg-[var(--color-brand-peach)]/5 blur-[120px] rounded-full pointer-events-none" />
          <div className="fixed bottom-0 left-0 lg:left-72 -z-10 w-1/2 h-1/2 bg-[var(--color-brand-gold)]/5 blur-[120px] rounded-full pointer-events-none" />
          
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
