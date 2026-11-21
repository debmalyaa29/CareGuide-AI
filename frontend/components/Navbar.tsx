'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  HeartHandshake, 
  MessageSquare, 
  LayoutDashboard, 
  Sliders, 
  Database, 
  LogOut, 
  User, 
  ShieldCheck,
  Sparkles,
  Menu,
  X
} from 'lucide-react';
import { getSupabase, signOutPatient } from '@/lib/supabase';

export const Navbar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<{ email?: string } | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    // 1. Check local storage
    const token = typeof window !== 'undefined' ? localStorage.getItem('careguide_auth_token') : null;
    const email = typeof window !== 'undefined' ? localStorage.getItem('careguide_user_email') : null;
    if (token && email) {
      setUser({ email });
    }

    // 2. Synchronize with live Supabase session
    const supabase = getSupabase();
    if (supabase) {
      supabase.auth.getSession().then(({ data }) => {
        if (data.session?.user) {
          setUser({ email: data.session.user.email });
          localStorage.setItem('careguide_auth_token', data.session.access_token);
          localStorage.setItem('careguide_user_email', data.session.user.email || '');
          localStorage.setItem('careguide_user_id', data.session.user.id);
        }
      });

      const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          setUser({ email: session.user.email });
          localStorage.setItem('careguide_auth_token', session.access_token);
          localStorage.setItem('careguide_user_email', session.user.email || '');
          localStorage.setItem('careguide_user_id', session.user.id);
        } else if (!localStorage.getItem('careguide_auth_token')) {
          setUser(null);
        }
      });

      return () => {
        authListener.subscription.unsubscribe();
      };
    }
  }, [pathname]);

  const handleLogout = async () => {
    await signOutPatient();
    setUser(null);
    router.push('/');
  };

  const protectedLinks = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'AI Companion', href: '/chat', icon: MessageSquare },
    { label: 'Verified Sources', href: '/sources', icon: Database },
    { label: 'Preferences & Memory', href: '/preferences', icon: Sliders },
  ];

  const publicLinks = [
    { label: 'Features', href: '/#features', icon: Sparkles },
    { label: 'How It Works', href: '/#how-it-works', icon: ShieldCheck },
    { label: 'Trusted Sources', href: '/#sources', icon: Database },
  ];

  const currentLinks = user ? protectedLinks : publicLinks;

  return (
    <header className="sticky top-0 z-50 bg-[#FAF9F6]/90 backdrop-blur-md border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-700 to-medical-600 flex items-center justify-center text-white shadow-sm shadow-brand-500/20 group-hover:scale-105 transition-transform duration-200">
              <HeartHandshake className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg tracking-tight text-slate-900 group-hover:text-brand-700 transition-colors">
                CareGuide <span className="text-brand-600 font-extrabold">AI</span>
              </span>
              <span className="text-[10px] font-medium tracking-wide text-slate-500 uppercase -mt-1">
                Patient Companion
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {currentLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-brand-50 text-brand-800 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-brand-600' : 'text-slate-400'}`} />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* User Auth Actions */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-xs font-medium text-slate-700">
                  <User className="w-3.5 h-3.5 text-brand-600" />
                  <span className="max-w-[140px] truncate">{user.email}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-4 py-2 rounded-lg text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 shadow-sm shadow-brand-600/20 transition-all hover:shadow"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white px-4 pt-2 pb-4 space-y-2">
          {currentLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-base font-medium ${
                  isActive ? 'bg-brand-50 text-brand-700 font-semibold' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-5 h-5 text-brand-600" />
                {link.label}
              </Link>
            );
          })}
          <div className="pt-3 border-t border-slate-100">
            {user ? (
              <div className="flex items-center justify-between px-2">
                <span className="text-sm text-slate-600 truncate">{user.email}</span>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1 text-sm font-medium text-rose-600"
                >
                  <LogOut className="w-4 h-4" /> Sign out
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2 text-sm font-medium text-slate-700 border border-slate-200 rounded-lg"
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2 text-sm font-medium text-white bg-brand-600 rounded-lg"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
