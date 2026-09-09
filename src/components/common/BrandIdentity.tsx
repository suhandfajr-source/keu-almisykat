import React from 'react';
import { Building2 } from 'lucide-react';
import { BrandIdentityConfig } from '@/types/finance';

interface BrandIdentityProps extends Partial<BrandIdentityConfig> {
  layout?: 'sidebar' | 'header' | 'login' | 'preview';
  className?: string;
}

export function BrandIdentity({
  appName = 'Al-Misykat',
  appSubtitle = 'Keuangan Pesantren',
  logoUrl,
  layout = 'sidebar',
  className = '',
}: BrandIdentityProps) {
  const cleanAppName = (appName && appName.trim()) || 'Al-Misykat';
  const cleanSubtitle = (appSubtitle !== null && appSubtitle !== undefined) ? appSubtitle.trim() : 'Keuangan Pesantren';

  if (layout === 'login') {
    return (
      <div className={`flex flex-col items-center text-center ${className}`}>
        {logoUrl ? (
          <div className="flex items-center justify-center max-h-20 mb-4 overflow-hidden">
            <img
              src={logoUrl}
              alt={cleanAppName}
              className="max-h-16 max-w-[240px] object-contain"
            />
          </div>
        ) : (
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-gold text-white shadow-xs mb-4">
            <Building2 className="w-7 h-7" />
          </div>
        )}
        <h1 className="text-2xl font-bold text-brand-dark tracking-tight max-w-sm break-words">
          {cleanAppName}
        </h1>
        {cleanSubtitle && (
          <p className="text-sm text-brand-muted mt-1 font-medium max-w-sm break-words">
            {cleanSubtitle}
          </p>
        )}
      </div>
    );
  }

  if (layout === 'header') {
    return (
      <div className={`flex items-center gap-2.5 min-w-0 max-w-full ${className}`}>
        {logoUrl ? (
          <img
            src={logoUrl}
            alt={cleanAppName}
            className="h-8 max-w-[120px] object-contain shrink-0"
          />
        ) : (
          <div className="w-8 h-8 rounded-lg bg-brand-gold text-white flex items-center justify-center shrink-0">
            <Building2 className="w-4 h-4" />
          </div>
        )}
        <div className="flex flex-col min-w-0">
          <span className="font-bold text-brand-dark text-sm leading-tight truncate">
            {cleanAppName}
          </span>
          {cleanSubtitle && (
            <span className="text-[10px] text-brand-muted font-medium truncate">
              {cleanSubtitle}
            </span>
          )}
        </div>
      </div>
    );
  }

  if (layout === 'preview') {
    return (
      <div className={`flex items-center gap-3 p-3 bg-white rounded-xl border border-brand-border shadow-xs max-w-sm w-full ${className}`}>
        {logoUrl ? (
          <img
            src={logoUrl}
            alt={cleanAppName}
            className="h-10 max-w-[140px] object-contain shrink-0"
          />
        ) : (
          <div className="w-10 h-10 rounded-xl bg-brand-gold text-white flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
        )}
        <div className="flex flex-col min-w-0 flex-1">
          <span className="font-bold text-brand-dark text-sm leading-tight truncate">
            {cleanAppName}
          </span>
          {cleanSubtitle && (
            <span className="text-xs text-brand-muted font-medium truncate">
              {cleanSubtitle}
            </span>
          )}
        </div>
      </div>
    );
  }

  // Default: layout === 'sidebar'
  return (
    <div className={`flex items-center gap-3 min-w-0 max-w-full overflow-hidden ${className}`}>
      {logoUrl ? (
        <div className="flex items-center justify-center shrink-0">
          <img
            src={logoUrl}
            alt={cleanAppName}
            className="h-9 max-w-[90px] object-contain"
          />
        </div>
      ) : (
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-brand-gold text-white shadow-xs shrink-0">
          <Building2 className="w-5 h-5 text-white" />
        </div>
      )}
      <div className="flex flex-col min-w-0 flex-1 overflow-hidden">
        <span className="font-bold text-brand-dark text-sm leading-tight truncate">
          {cleanAppName}
        </span>
        {cleanSubtitle && (
          <span className="text-xs text-brand-muted font-medium truncate">
            {cleanSubtitle}
          </span>
        )}
      </div>
    </div>
  );
}
