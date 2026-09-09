import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { financeDb, isSupabaseMode } from '@/lib/db';

const LOCAL_COOKIE_NAME = 'keu_almisykat_session';

export interface SessionData {
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export async function getSession(): Promise<SessionData | null> {
  // 1. Production Supabase Auth
  if (isSupabaseMode()) {
    try {
      const supabase = await createClient();
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) return null;

      // Fetch profile from profiles table
      const profile = await financeDb.getProfile(user.id);

      return {
        user: {
          id: user.id,
          name: profile?.name || user.user_metadata?.name || user.email?.split('@')[0] || 'Bendahara',
          email: user.email || '',
        },
      };
    } catch {
      return null;
    }
  }

  // 2. Development / Test Local Cookie Auth Fallback
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(LOCAL_COOKIE_NAME)?.value;

  if (!sessionToken) return null;

  try {
    const profile = await financeDb.getProfile(sessionToken);
    if (!profile) {
      if (sessionToken === 'admin@almisykat.com') {
        return {
          user: {
            id: 'prof-admin',
            name: 'Bendahara Al-Misykat',
            email: 'admin@almisykat.com',
          },
        };
      }
      return null;
    }

    return {
      user: {
        id: profile.id,
        name: profile.name,
        email: profile.email,
      },
    };
  } catch {
    return null;
  }
}

export async function createSession(email: string, password?: string): Promise<{ success: boolean; error?: string }> {
  // 1. Supabase Auth
  if (isSupabaseMode() && password) {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { success: false, error: 'Email atau kata sandi salah. Silakan periksa kembali.' };
    }
    return { success: true };
  }

  // 2. Local session fallback
  const cookieStore = await cookies();
  cookieStore.set(LOCAL_COOKIE_NAME, email, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });

  return { success: true };
}

export async function destroySession() {
  if (isSupabaseMode()) {
    try {
      const supabase = await createClient();
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Supabase sign out error:', err);
    }
  }

  const cookieStore = await cookies();
  cookieStore.delete(LOCAL_COOKIE_NAME);
}
