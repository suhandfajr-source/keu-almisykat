'use client';

import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { BrandIdentity } from '@/components/common/BrandIdentity';
import { BrandIdentityConfig } from '@/types/finance';

interface AppShellProps {
  user: {
    name: string;
    email: string;
  };
  brand?: BrandIdentityConfig;
  children: React.ReactNode;
}

export function AppShell({ user, brand, children }: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-brand-warm">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block shrink-0 sticky top-0 h-screen">
        <Sidebar user={user} brand={brand} />
      </div>

      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-brand-dark/40 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white transform transition-transform duration-200 ease-in-out lg:hidden shadow-xl ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="absolute top-4 right-3">
          <button
            onClick={() => setMobileOpen(false)}
            className="p-1.5 text-brand-muted hover:text-brand-dark rounded-lg cursor-pointer"
            aria-label="Tutup Menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <Sidebar user={user} brand={brand} onCloseMobile={() => setMobileOpen(false)} />
      </div>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-brand-border sticky top-0 z-30">
          <div className="flex items-center gap-3 min-w-0 flex-1 mr-2">
            <button
              onClick={() => setMobileOpen(true)}
              className="p-1.5 text-brand-dark hover:bg-brand-warm rounded-lg cursor-pointer shrink-0"
              aria-label="Buka Menu"
            >
              <Menu className="w-6 h-6" />
            </button>
            <BrandIdentity
              appName={brand?.appName}
              appSubtitle={brand?.appSubtitle}
              logoUrl={brand?.logoUrl}
              layout="header"
            />
          </div>
          <div className="w-7 h-7 rounded-full bg-brand-gold/15 text-brand-dark font-semibold text-xs flex items-center justify-center border border-brand-gold/30 shrink-0">
            {user.name ? user.name.charAt(0).toUpperCase() : 'B'}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
