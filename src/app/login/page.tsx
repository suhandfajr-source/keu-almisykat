import React from 'react';
import { financeDb } from '@/lib/db';
import { LoginForm } from '@/components/auth/LoginForm';
import { BrandIdentity } from '@/components/common/BrandIdentity';

export default async function LoginPage() {
  const brand = await financeDb.getBrandIdentity();

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
