import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

let supabaseInstance: SupabaseClient | null = null;

export const getSupabase = (): SupabaseClient | null => {
  if (supabaseInstance) return supabaseInstance;
  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('your-project')) {
    return null;
  }
  try {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'careguide-supabase-auth',
      },
    });
    return supabaseInstance;
  } catch (error) {
    console.warn('Failed to initialize Supabase client:', error);
    return null;
  }
};

/**
 * Sign in or Sign up with Google OAuth via Supabase Auth
 */
export async function signInWithGoogle(redirectTarget?: string): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) {
    throw new Error('Supabase client is not configured. Please check your NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.');
  }

  const baseOrigin = typeof window !== 'undefined'
    ? window.location.origin
    : 'http://localhost:3000';
  const redirectTo = redirectTarget
    ? `${baseOrigin}/auth/callback?redirect=${encodeURIComponent(redirectTarget)}`
    : `${baseOrigin}/auth/callback`;

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });

  if (error) {
    throw error;
  }
}

/**
 * Sign in with email and password via Supabase Auth
 */
export async function signInWithEmail(email: string, password: string): Promise<{ session: Session | null; user: User | null }> {
  const supabase = getSupabase();
  if (!supabase) {
    throw new Error('Supabase client is not configured. Please check your NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.');
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw error;
  }

  if (data.session) {
    localStorage.setItem('careguide_auth_token', data.session.access_token);
    localStorage.setItem('careguide_user_email', data.session.user.email || email);
    localStorage.setItem('careguide_user_id', data.session.user.id);
  }

  return { session: data.session, user: data.user };
}

/**
 * Register a new patient account with Supabase Auth
 */
export async function signUpWithEmail(email: string, password: string): Promise<{ session: Session | null; user: User | null; emailConfirmationRequired: boolean }> {
  const supabase = getSupabase();
  if (!supabase) {
    throw new Error('Supabase client is not configured. Please check your NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.');
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    throw error;
  }

  const emailConfirmationRequired = !data.session && !!data.user;

  if (data.session) {
    localStorage.setItem('careguide_auth_token', data.session.access_token);
    localStorage.setItem('careguide_user_email', data.session.user.email || email);
    localStorage.setItem('careguide_user_id', data.session.user.id);
  } else if (data.user) {
    localStorage.setItem('careguide_user_email', data.user.email || email);
    localStorage.setItem('careguide_user_id', data.user.id);
  }

  return { session: data.session, user: data.user, emailConfirmationRequired };
}

/**
 * Sign out the current patient session
 */
export async function signOutPatient(): Promise<void> {
  const supabase = getSupabase();
  if (supabase) {
    await supabase.auth.signOut().catch(() => {});
  }
  localStorage.removeItem('careguide_auth_token');
  localStorage.removeItem('careguide_user_email');
  localStorage.removeItem('careguide_user_id');
}

/**
 * Get the current active session
 */
export async function getCurrentSession(): Promise<Session | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session;
}
