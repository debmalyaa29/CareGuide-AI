'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { HeartHandshake, ShieldCheck } from 'lucide-react';
import { getCurrentSession } from '@/lib/supabase';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function checkAuth() {
      // 1. Check local storage token first for instant responsiveness
      const token = typeof window !== 'undefined' ? localStorage.getItem('careguide_auth_token') : null;

      // 2. Check Supabase session
      let session = null;
      try {
        session = await getCurrentSession();
      } catch (err) {
        console.warn('Session check warning:', err);
      }

      if (!isMounted) return;

      if (session?.user || token) {
        setIsAuthorized(true);
      } else {
        setIsAuthorized(false);
        const redirectUrl = `/login?redirect=${encodeURIComponent(pathname || '/dashboard')}`;
        router.replace(redirectUrl);
      }
    }

    checkAuth();

    return () => {
      isMounted = false;
    };
  }, [pathname, router]);

  // Loading state while checking authentication
  if (isAuthorized === null) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm bg-white rounded-3xl p-8 border border-slate-200/90 shadow-sm text-center space-y-4 animate-in fade-in duration-300">
          <div className="w-14 h-14 rounded-2xl bg-brand-50 border border-brand-100 mx-auto flex items-center justify-center text-brand-600 shadow-sm animate-pulse">
            <HeartHandshake className="w-7 h-7 text-brand-600" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-lg font-semibold text-slate-800">
              Verifying Patient Access
            </h2>
            <p className="text-xs text-slate-500">
              Checking secure credentials and active session...
            </p>
          </div>
          <div className="pt-2 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-medical-600" />
            <span>Encrypted HIPAA-aligned session</span>
          </div>
        </div>
      </div>
    );
  }

  // Not authorized (redirection is in progress)
  if (!isAuthorized) {
    return null;
  }

  // Authorized
  return <>{children}</>;
}
