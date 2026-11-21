import React from 'react';
import Link from 'next/link';
import { HeartHandshake, ShieldAlert, ExternalLink } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800">
      {/* Emergency Notice Banner */}
      <div className="bg-rose-950/60 border-b border-rose-900/50 py-3 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-3 text-xs sm:text-sm text-rose-200 text-center font-medium">
          <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
          <span>
            <strong>Medical Disclaimer:</strong> CareGuide AI is strictly for general health education. If you are experiencing an acute medical emergency, call <strong>911</strong> (US), <strong>999</strong> (UK), or <strong>112</strong> (Europe) immediately.
          </span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-teal-500 flex items-center justify-center text-slate-950 font-bold">
                <HeartHandshake className="w-5 h-5 text-slate-950" />
              </div>
              <span className="text-lg font-bold text-white tracking-tight">CareGuide AI</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Empowering patients with clear, structured explanations grounded in verified public healthcare sources.
            </p>
          </div>

          {/* Verified Health Authorities */}
          <div>
            <h3 className="text-sm font-semibold text-teal-400 mb-3">
              Trusted Public Sources
            </h3>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <a href="https://www.who.int" target="_blank" rel="noopener noreferrer" className="hover:text-white flex items-center gap-1">
                  World Health Organization (who.int) <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </li>
              <li>
                <a href="https://www.cdc.gov" target="_blank" rel="noopener noreferrer" className="hover:text-white flex items-center gap-1">
                  Centers for Disease Control (cdc.gov) <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </li>
              <li>
                <a href="https://www.nhs.uk" target="_blank" rel="noopener noreferrer" className="hover:text-white flex items-center gap-1">
                  National Health Service (nhs.uk) <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </li>
              <li>
                <a href="https://medlineplus.gov" target="_blank" rel="noopener noreferrer" className="hover:text-white flex items-center gap-1">
                  MedlinePlus (medlineplus.gov) <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </li>
            </ul>
          </div>

          {/* Technology & Architecture */}
          <div>
            <h3 className="text-sm font-semibold text-teal-400 mb-3">
              Platform Architecture
            </h3>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>Google Gemini API</li>
              <li>Firecrawl Healthcare Extraction</li>
              <li>Supabase PostgreSQL + pgvector</li>
              <li>Memento Persistent Memory</li>
              <li>Strict Medical Guardrails</li>
            </ul>
          </div>

          {/* Safety & Compliance */}
          <div>
            <h3 className="text-sm font-semibold text-teal-400 mb-3">
              Safety & Governance
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-3">
              Designed according to health literacy standards with zero diagnostic claims and isolated patient memory encryption.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-teal-300 bg-slate-800/80 px-3 py-1.5 rounded-md border border-slate-700">
              <span>Verified Health Allowlist Enforced</span>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} CareGuide AI – Patient Information Companion. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/" className="hover:text-slate-400">Privacy & Consent</Link>
            <Link href="/preferences" className="hover:text-slate-400">Memory Controls</Link>
            <Link href="/sources" className="hover:text-slate-400">Knowledge Index</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
