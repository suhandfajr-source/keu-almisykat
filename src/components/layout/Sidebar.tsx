'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  ReceiptText, 
  FileSpreadsheet, 
  Settings, 
  LogOut 
} from 'lucide-react';
import { logoutAction } from '@/app/actions/auth';
import { BrandIdentity } from '@/components/common/BrandIdentity';
import { BrandIdentityConfig } from '@/types/finance';

interface SidebarProps {
  user: {
    name: string;
    email: string;
  };
  brand?: BrandIdentityConfig;
  onCloseMobile?: () => void;
}

export function Sidebar({ user, brand, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Transaksi', href: '/transactions', icon: ReceiptText },
    { name: 'Rekap', href: '/reports', icon: FileSpreadsheet },
    { name: 'Pengaturan', href: '/settings', icon: Settings },
  ];

  return (
    <aside className="flex flex-col h-full bg-white border-r border-brand-border w-64 select-none">
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-brand-border/60 overflow-hidden">
        <BrandIdentity
          appName={brand?.appName}
          appSubtitle={brand?.appSubtitle}
          logoUrl={brand?.logoUrl}
          layout="sidebar"
        />
      </div>

      {/* Main Navigation - STRICTLY 4 ITEMS */}
      <div className="flex-1 px-3.5 py-6 space-y-1.5 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-bold text-brand-muted uppercase tracking-wider">
          Menu Utama
        </div>
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onCloseMobile}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-brand-gold text-white font-semibold shadow-xs shadow-brand-gold/20'
                  : 'text-brand-dark hover:text-brand-dark hover:bg-brand-warm-100'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-brand-muted'}`} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </div>

      {/* Footer / User Profile & Logout */}
      <div className="p-4 border-t border-brand-border/60 bg-brand-warm-50">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-brand-gold/15 text-brand-dark font-semibold text-xs flex items-center justify-center shrink-0 border border-brand-gold/30">
              {user.name ? user.name.charAt(0).toUpperCase() : 'B'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-brand-dark truncate">{user.name}</p>
              <p className="text-[11px] text-brand-muted truncate">{user.email}</p>
            </div>
          </div>
        </div>

        <form action={logoutAction}>
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-brand-maroon hover:text-brand-maroon hover:bg-brand-maroon-light rounded-xl transition-colors border border-brand-maroon-border cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Keluar (Logout)</span>
          </button>
        </form>
      </div>
    </aside>
  );
}
