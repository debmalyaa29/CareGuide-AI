'use client';

import React, { useState, useEffect } from 'react';
import { 
  Sliders, 
  Brain, 
  Trash2, 
  Save, 
  CheckCircle2, 
  AlertCircle, 
  Layers, 
  Clock, 
  ShieldCheck, 
  ToggleLeft, 
  ToggleRight 
} from 'lucide-react';
import { api } from '@/lib/api';
import { UserPreferences, MemoryItem } from '@/types';
import { AuthGuard } from '@/components/AuthGuard';

export default function PreferencesPage() {
  const [preferences, setPreferences] = useState<UserPreferences>({
    user_id: 'patient',
    preferred_explanation_style: 'simple',
    preferred_response_length: 'medium',
    memory_enabled: true,
  });
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [clearing, setClearing] = useState<boolean>(false);
  const [clearMessage, setClearMessage] = useState<string>('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [prefs, mem] = await Promise.all([
        api.getPreferences(),
        api.getMemories(),
      ]);
      setPreferences(prefs);
      setMemories(mem.memories || []);
    } catch (e) {
      console.warn('Preferences load error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePreferences = async () => {
    setSaving(true);
    setSaveSuccess(false);
    try {
      await api.updatePreferences(preferences);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e) {
      console.error('Failed to save preferences:', e);
    } finally {
      setSaving(false);
    }
  };

  const handleClearMemory = async () => {
    if (!confirm('Are you sure you want to clear your stored persistent memory from Memento?')) {
      return;
    }
    setClearing(true);
    try {
      const res = await api.clearMemories();
      setMemories([]);
      setClearMessage(`Memory cleared successfully (${res.cleared_count} topics removed).`);
      setTimeout(() => setClearMessage(''), 4000);
    } catch (e) {
      console.error('Failed to clear memory:', e);
    } finally {
      setClearing(false);
    }
  };

  return (
    <AuthGuard>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Page Title */}
      <div className="space-y-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-100 text-brand-800 text-xs font-semibold">
          <Sliders className="w-3.5 h-3.5 text-brand-600" /> Patient Controls
        </div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
          Explanation Preferences & Memento Memory
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Tailor how CareGuide AI communicates with you and manage your persistent conversational context.
        </p>
      </div>

      {saveSuccess && (
        <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-teal-600" />
          Preferences updated and synced across sessions!
        </div>
      )}

      {clearMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          {clearMessage}
        </div>
      )}

      {/* Preferences Section */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Sliders className="w-5 h-5 text-brand-600" />
          Explanation Style & Depth
        </h2>

        {/* Style Selector */}
        <div className="space-y-3">
          <label className="block text-xs font-bold text-slate-700">
            Preferred Explanation Style
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              {
                id: 'simple',
                title: 'Simple',
                desc: 'Plain everyday words, helpful analogies, 6th-grade reading level. Best for quick clarity.'
              },
              {
                id: 'detailed',
                title: 'Detailed',
                desc: 'Comprehensive overview, causes, symptoms, and specific questions to ask your doctor.'
              },
              {
                id: 'technical',
                title: 'Technical',
                desc: 'Precise clinical terminology, physiological mechanisms, and clinical guideline ranges.'
              }
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setPreferences({ ...preferences, preferred_explanation_style: opt.id as any })}
                className={`p-4 rounded-2xl text-left border transition-all ${
                  preferences.preferred_explanation_style === opt.id
                    ? 'border-brand-600 bg-brand-50/50 ring-2 ring-brand-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="font-bold text-sm text-slate-900 mb-1">{opt.title}</div>
                <div className="text-xs text-slate-500 leading-relaxed">{opt.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Length Selector */}
        <div className="space-y-3 pt-2">
          <label className="block text-xs font-bold text-slate-700">
            Preferred Response Length
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { id: 'short', title: 'Short', desc: 'Brevity-focused bullet points (~100-150 words).' },
              { id: 'medium', title: 'Medium', desc: 'Balanced explanation with key takeaways (250-400 words).' },
              { id: 'long', title: 'Long', desc: 'Full educational deep dive with structured sections.' }
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setPreferences({ ...preferences, preferred_response_length: opt.id as any })}
                className={`p-4 rounded-2xl text-left border transition-all ${
                  preferences.preferred_response_length === opt.id
                    ? 'border-brand-600 bg-brand-50/50 ring-2 ring-brand-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="font-bold text-sm text-slate-900 mb-1">{opt.title}</div>
                <div className="text-xs text-slate-500 leading-relaxed">{opt.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={handleSavePreferences}
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-brand-600 text-white font-semibold text-xs shadow-sm hover:bg-brand-700 transition-colors flex items-center gap-2"
          >
            <Save className="w-3.5 h-3.5" />
            {saving ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      </div>

      {/* Memento Memory Section */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-700">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Memento Persistent Memory
              </h2>
              <p className="text-xs text-slate-500">
                Preserves context and previously discussed topics across sessions
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              const updated = !preferences.memory_enabled;
              setPreferences({ ...preferences, memory_enabled: updated });
              api.updatePreferences({ memory_enabled: updated });
            }}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 p-1"
          >
            {preferences.memory_enabled ? (
              <ToggleRight className="w-8 h-8 text-brand-600" />
            ) : (
              <ToggleLeft className="w-8 h-8 text-slate-300" />
            )}
            <span className="hidden sm:inline">
              {preferences.memory_enabled ? 'Enabled' : 'Disabled'}
            </span>
          </button>
        </div>

        {/* Memory Items List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">
              Active Stored Topics ({memories.length})
            </span>
            {memories.length > 0 && (
              <button
                onClick={handleClearMemory}
                disabled={clearing}
                className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear All Memory
              </button>
            )}
          </div>

          {memories.length === 0 ? (
            <div className="p-8 text-center bg-[#FAF9F6] rounded-2xl border border-dashed border-slate-200 space-y-1">
              <p className="text-xs text-slate-500 font-medium">No persistent memories stored yet.</p>
              <p className="text-[11px] text-slate-400">
                When you ask questions in the AI companion, topics are organized here so you don&apos;t have to repeat yourself.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 border border-slate-200/80 rounded-2xl overflow-hidden">
              {memories.map((m) => (
                <div key={m.id} className="p-4 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full mb-1">
                      {m.topic}
                    </span>
                    <p className="text-xs text-slate-600">{m.summary}</p>
                  </div>
                  <span className="text-[11px] text-slate-400 shrink-0">
                    {new Date(m.last_discussed_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
    </AuthGuard>
  );
}
