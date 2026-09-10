import React from 'react';
import { financeDb } from '@/lib/db';
import { LoginForm } from '@/components/auth/LoginForm';
import { BrandIdentity } from '@/components/common/BrandIdentity';

import { BrandIdentityConfig } from '@/types/finance';

export default async function LoginPage() {
  let brand: BrandIdentityConfig = {
    appName: 'Al-Misykat',
    appSubtitle: 'Keuangan Pesantren',
    logoUrl: null,
  };

  try {
    brand = await financeDb.getBrandIdentity();
  } catch (err) {
    console.error('Failed to load brand identity for login page:', err);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-warm p-4">
      <div className="w-full max-w-md">
        {/* Logo & Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-brand-border p-8 sm:p-10">
          <div className="mb-8">
            <BrandIdentity
              appName={brand.appName}
              appSubtitle={brand.appSubtitle}
              logoUrl={brand.logoUrl}
              layout="login"
            />
          </div>

          <LoginForm />
        </div>
      </div>
    </div>
  );
}
