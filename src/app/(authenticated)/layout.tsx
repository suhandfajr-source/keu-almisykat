import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { financeDb } from '@/lib/db';
import { AppShell } from '@/components/layout/AppShell';

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  const brand = await financeDb.getBrandIdentity();

  return (
    <AppShell user={session.user} brand={brand}>
      {children}
    </AppShell>
  );
}
