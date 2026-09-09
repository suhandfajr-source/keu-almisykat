'use client';

import React, { useActionState } from 'react';
import { Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react';
import { loginAction } from '@/app/actions/auth';

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(loginAction, null);

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && (
        <div className="p-3.5 bg-brand-maroon-light border border-brand-maroon-border rounded-xl text-brand-maroon text-sm flex items-start gap-2.5">
          <span className="font-bold">✕</span>
          <span>{state.error}</span>
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold text-brand-dark uppercase tracking-wider mb-1.5">
          Alamat Email
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-brand-muted">
            <Mail className="w-4 h-4" />
          </div>
          <input
            type="email"
            name="email"
            defaultValue="admin@almisykat.com"
            required
            placeholder="admin@almisykat.com"
            className="w-full pl-10 pr-4 py-2.5 bg-brand-warm-50 border border-brand-border rounded-xl text-sm text-brand-dark focus:outline-hidden focus:ring-2 focus:ring-brand-gold focus:bg-white transition-all"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-brand-dark uppercase tracking-wider mb-1.5">
          Kata Sandi
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-brand-muted">
            <Lock className="w-4 h-4" />
          </div>
          <input
            type="password"
            name="password"
            defaultValue="admin_almisykat_2026"
            required
            placeholder="••••••••••••"
            className="w-full pl-10 pr-4 py-2.5 bg-brand-warm-50 border border-brand-border rounded-xl text-sm text-brand-dark focus:outline-hidden focus:ring-2 focus:ring-brand-gold focus:bg-white transition-all"
          />
        </div>
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-brand-gold hover:bg-brand-gold-hover text-white font-semibold rounded-xl shadow-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {isPending ? (
            <span>Memverifikasi...</span>
          ) : (
            <>
              <span>Masuk ke Aplikasi</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>

      <div className="pt-4 border-t border-brand-border/60 flex items-center justify-center gap-2 text-xs text-brand-muted">
        <ShieldCheck className="w-4 h-4 text-brand-green" />
        <span>Akses Terenkripsi & Terlindungi</span>
      </div>
    </form>
  );
}
