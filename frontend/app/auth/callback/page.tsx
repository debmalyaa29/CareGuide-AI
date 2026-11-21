'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { HeartHandshake, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { getSupabase } from '@/lib/supabase';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    // Check for error in query string
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');
    const redirectTarget = searchParams.get('redirect') || '/dashboard';
    if (error || errorDescription) {
      setErrorMsg(errorDescription || error || 'Authentication failed.');
      return;
    }

    const supabase = getSupabase();
    if (!supabase) {
      router.push(redirectTarget);
      return;
    }

    // Process OAuth session exchange
    supabase.auth.getSession().then(({ data, error: sessionErr }) => {
      if (sessionErr) {
        setErrorMsg(sessionErr.message);
        return;
      }

      if (data.session) {
        localStorage.setItem('careguide_auth_token', data.session.access_token);
        localStorage.setItem('careguide_user_email', data.session.user.email || '');
        localStorage.setItem('careguide_user_id', data.session.user.id);
        router.push(redirectTarget);
      } else {
        // Fallback listener for auth state change
        const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
          if (session?.user) {
            localStorage.setItem('careguide_auth_token', session.access_token);
            localStorage.setItem('careguide_user_email', session.user.email || '');
            localStorage.setItem('careguide_user_id', session.user.id);
            router.push(redirectTarget);
          }
        });

        // Timeout fallback
        const timer = setTimeout(() => {
          router.push(redirectTarget);
        }, 3000);

        return () => {
          listener.subscription.unsubscribe();
          clearTimeout(timer);
        };
      }
    });
  }, [router, searchParams]);

  if (errorMsg) {
    return (
      <div className="min-h-[calc(100vh-14rem)] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-white rounded-3xl p-8 border border-slate-200/90 shadow-sm text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 mx-auto flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Google Authentication Error</h2>
          <p className="text-xs text-rose-700 bg-rose-50 p-3 rounded-xl border border-rose-100 leading-relaxed">
            {errorMsg}
          </p>
          <div className="pt-2">
            <Link
              href="/login"
              className="inline-block px-5 py-2.5 rounded-xl bg-brand-600 text-white font-semibold text-xs hover:bg-brand-700 transition-colors"
            >
              Return to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-14rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm bg-white rounded-3xl p-8 border border-slate-200/90 shadow-sm text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-brand-50 border border-brand-100 text-brand-600 mx-auto flex items-center justify-center">
          <HeartHandshake className="w-6 h-6 animate-pulse" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Finalizing Google Sign-In...</h2>
        <p className="text-xs text-slate-500">
          Syncing your patient session with Supabase and preparing your dashboard.
        </p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[calc(100vh-14rem)] flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-sm bg-white rounded-3xl p-8 border border-slate-200 text-center">
            <p className="text-xs text-slate-500">Loading authentication session...</p>
          </div>
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
