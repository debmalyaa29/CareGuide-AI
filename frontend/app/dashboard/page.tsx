'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  HeartHandshake, 
  PlusCircle, 
  MessageSquare, 
  Clock, 
  Sparkles, 
  Sliders, 
  Brain, 
  ArrowRight, 
  BookOpen, 
  ChevronRight, 
  Activity,
  Calendar
} from 'lucide-react';
import { api } from '@/lib/api';
import { Conversation, UserPreferences } from '@/types';
import { AuthGuard } from '@/components/AuthGuard';

export default function DashboardPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [memoryTopics, setMemoryTopics] = useState<string[]>([]);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [userEmail, setUserEmail] = useState<string>('Patient');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Check active Supabase session or localStorage
    import('@/lib/supabase').then(({ getCurrentSession }) => {
      getCurrentSession().then((session) => {
        if (session?.user?.email) {
          setUserEmail(session.user.email.split('@')[0]);
          localStorage.setItem('careguide_auth_token', session.access_token);
          localStorage.setItem('careguide_user_email', session.user.email);
        } else {
          const email = localStorage.getItem('careguide_user_email');
          const token = localStorage.getItem('careguide_auth_token');
          if (email) {
            setUserEmail(email.split('@')[0]);
          } else if (!token) {
            router.push('/login');
          }
        }
      });
    });

    const loadData = async () => {
      try {
        const [convs, mem, prefs] = await Promise.all([
          api.getConversations(),
          api.getMemories(),
          api.getPreferences(),
        ]);
        setConversations(convs);
        setMemoryTopics(mem.topics || []);
        setPreferences(prefs);
      } catch (err) {
        console.warn('Dashboard fetch issue:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const quickTopics = [
    {
      title: "Understanding Type 2 Diabetes",
      desc: "Learn about insulin resistance, diet changes, and blood sugar tests.",
      query: "Can you explain Type 2 diabetes and what insulin resistance means?",
      domain: "nhs.uk"
    },
    {
      title: "Managing Blood Pressure",
      desc: "WHO benchmarks for hypertension and daily dietary sodium limits.",
      query: "What is considered high blood pressure and how can I manage it?",
      domain: "who.int"
    },
    {
      title: "Cholesterol & Lipid Panels",
      desc: "Understand LDL 'bad' vs HDL 'good' cholesterol and screening rules.",
      query: "Explain what LDL and HDL cholesterol mean on a lipid blood test.",
      domain: "cdc.gov"
    },
    {
      title: "Flu vs Cold Symptoms",
      desc: "MedlinePlus guide to distinguishing sudden viral illnesses.",
      query: "How do I know if I have the common cold or influenza?",
      domain: "medlineplus.gov"
    }
  ];

  const handleStartTopic = (query: string) => {
    router.push(`/chat?prompt=${encodeURIComponent(query)}`);
  };

  return (
    <AuthGuard>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand-700 via-brand-600 to-medical-700 p-8 sm:p-10 text-white shadow-lg shadow-brand-700/15">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-xs font-semibold tracking-wide">
            <Sparkles className="w-3.5 h-3.5 text-brand-200" />
            AI Health Literacy Companion
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Welcome back, <span className="capitalize">{userEmail}</span>.
          </h1>
          <p className="text-sm sm:text-base text-brand-50 leading-relaxed">
            I am here to help you unpack clinical terms, laboratory markers, and public health guidelines into simple, personalized answers.
          </p>

          <div className="pt-4 flex flex-wrap gap-3">
            <Link
              href="/chat"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-brand-800 font-bold text-sm shadow-sm hover:bg-brand-50 transition-all hover:scale-[1.02]"
            >
              <PlusCircle className="w-4 h-4 text-brand-600" />
              Start New Conversation
            </Link>
            <Link
              href="/preferences"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-brand-800/60 backdrop-blur-sm border border-brand-400/30 text-white font-semibold text-sm hover:bg-brand-800/80 transition-colors"
            >
              <Sliders className="w-4 h-4" />
              Adjust Preferences
            </Link>
          </div>
        </div>
      </div>

      {/* Grid: Main Dashboard Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 Cols): Quick Topics & Recent Conversations */}
        <div className="lg:col-span-2 space-y-8">
          {/* Quick Healthcare Suggestions */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Explore Healthcare Topics
                </h2>
                <p className="text-xs text-slate-500">
                  Pre-indexed from verified public health authorities
                </p>
              </div>
              <Activity className="w-5 h-5 text-brand-600" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {quickTopics.map((item) => (
                <button
                  key={item.title}
                  onClick={() => handleStartTopic(item.query)}
                  className="text-left p-4 rounded-2xl bg-[#FAF9F6] border border-slate-200/80 hover:border-brand-400 hover:bg-white hover:shadow-sm transition-all group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-mono font-bold text-brand-700 bg-brand-100/70 px-2 py-0.5 rounded-full">
                        {item.domain}
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-brand-600 group-hover:translate-x-0.5 transition-all" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-brand-700 mb-1">
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-600 line-clamp-2">
                      {item.desc}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Recent Conversations */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Recent Conversations
                </h2>
                <p className="text-xs text-slate-500">
                  Continuity preserved across your active sessions
                </p>
              </div>
              <Clock className="w-5 h-5 text-slate-400" />
            </div>

            {loading ? (
              <div className="py-8 text-center text-xs text-slate-400">Loading conversation history...</div>
            ) : conversations.length === 0 ? (
              <div className="py-8 text-center space-y-3 bg-[#FAF9F6] rounded-2xl border border-dashed border-slate-200">
                <MessageSquare className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs text-slate-500">No previous conversations found.</p>
                <Link
                  href="/chat"
                  className="inline-block px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-semibold hover:bg-brand-700 transition-colors"
                >
                  Start your first chat
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {conversations.slice(0, 5).map((conv) => (
                  <Link
                    key={conv.id}
                    href={`/chat?id=${conv.id}`}
                    className="flex items-center justify-between py-3.5 px-2 hover:bg-slate-50 rounded-xl transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center text-brand-600">
                        <MessageSquare className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-slate-900 group-hover:text-brand-700">
                          {conv.title}
                        </h4>
                        <span className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(conv.updated_at).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-brand-600 group-hover:translate-x-1 transition-all" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (1 Col): Preferences & Memento Memory Context */}
        <div className="space-y-8">
          {/* Active Explanation Style Widget */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">
                Patient Preferences
              </h3>
              <Sliders className="w-4 h-4 text-brand-600" />
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-[#FAF9F6] border border-slate-200/70">
                <span className="text-slate-500 block mb-0.5">Explanation Style</span>
                <span className="text-sm font-bold text-brand-700 capitalize">
                  {preferences?.preferred_explanation_style || 'Simple (Analogies & Plain English)'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-[#FAF9F6] border border-slate-200/70">
                <span className="text-slate-500 block mb-0.5">Response Length</span>
                <span className="text-sm font-bold text-slate-800 capitalize">
                  {preferences?.preferred_response_length || 'Medium (Balanced Summary)'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-[#FAF9F6] border border-slate-200/70 flex items-center justify-between">
                <div>
                  <span className="text-slate-500 block mb-0.5">Memento Memory</span>
                  <span className="text-xs font-semibold text-slate-800">
                    {preferences?.memory_enabled ? 'Active (Continuous Context)' : 'Disabled'}
                  </span>
                </div>
                <div className={`w-2.5 h-2.5 rounded-full ${preferences?.memory_enabled ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
              </div>

              <Link
                href="/preferences"
                className="block text-center w-full py-2.5 rounded-xl border border-slate-200 font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Change Style or Clear Memory
              </Link>
            </div>
          </div>

          {/* Memento Memory Topic Cloud */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-brand-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Memento Memory
                </h3>
              </div>
              <span className="text-[11px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                {memoryTopics.length} topics
              </span>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Previously discussed topics remembered by Memento to inform future explanations without repetitive questions:
            </p>

            {memoryTopics.length === 0 ? (
              <div className="py-4 text-center text-xs text-slate-400 bg-[#FAF9F6] rounded-xl border border-dashed border-slate-200">
                No healthcare topics remembered yet. Ask a question to begin.
              </div>
            ) : (
              <div className="flex flex-wrap gap-2 pt-1">
                {memoryTopics.map((topic, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-medium bg-brand-50 border border-brand-200/70 text-brand-800"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    </AuthGuard>
  );
}
