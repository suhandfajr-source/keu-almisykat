import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Sistem Keuangan Pondok Pesantren Al-Misykat Al-Islami',
  description: 'Aplikasi pembukuan dan manajemen keuangan Pondok Pesantren Al-Misykat Al-Islami',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="antialiased font-sans text-slate-900 bg-slate-50 min-h-screen">
        {children}
      </body>
    </html>
  );
}
