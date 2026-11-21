import React from 'react';
import Link from 'next/link';
import { 
  HeartHandshake, 
  ArrowRight, 
  ShieldCheck, 
  Search, 
  Sparkles, 
  Cpu, 
  Database, 
  BookOpen, 
  ExternalLink, 
  CheckCircle2, 
  Lock, 
  AlertTriangle 
} from 'lucide-react';

export default function LandingPage() {
  const trustedSources = [
    {
      name: "World Health Organization",
      domain: "who.int",
      desc: "Global public health guidelines, disease prevention standards, and international health facts.",
      badge: "Global Authority"
    },
    {
      name: "Centers for Disease Control",
      domain: "cdc.gov",
      desc: "Authoritative health data, immunization schedules, and chronic disease prevention recommendations.",
      badge: "US Public Health"
    },
    {
      name: "National Health Service",
      domain: "nhs.uk",
      desc: "Clear, evidence-based patient condition guides and clinical symptom explanations.",
      badge: "UK Clinical Standard"
    },
    {
      name: "MedlinePlus (NLM / NIH)",
      domain: "medlineplus.gov",
      desc: "Trusted consumer medical encyclopedia curated by the National Library of Medicine.",
      badge: "National Medical Library"
    }
  ];

  const features = [
    {
      icon: Sparkles,
      title: "Plain-Language Translation",
      desc: "Transforms complex clinical terminology and dense lab reports into clear, relatable concepts you can actually understand."
    },
    {
      icon: Search,
      title: "Strict Citation Grounding",
      desc: "Every single answer references verified documents from our allowlist of trusted public healthcare domains. Zero hallucinations."
    },
    {
      icon: Cpu,
      title: "Memento Persistent Memory",
      desc: "Remembers your preferred explanation style and previously discussed topics across sessions, with complete patient privacy controls."
    },
    {
      icon: ShieldCheck,
      title: "Clinical Safety Guardrails",
      desc: "Strictly educational companion. Detects acute emergency warning signs and guides you to emergency services when needed."
    }
  ];

  const howItWorksSteps = [
    {
      num: "01",
      title: "Ask Any Health Question",
      desc: "Describe what you want to understand—from a newly mentioned condition to medical jargon on a test result."
    },
    {
      num: "02",
      title: "Verified Source Retrieval",
      desc: "Our Firecrawl RAG pipeline retrieves authoritative document chunks from WHO, CDC, NHS, and MedlinePlus."
    },
    {
      num: "03",
      title: "Gemini Personalized Synthesis",
      desc: "Google Gemini translates the verified facts into your preferred style: Simple (everyday words), Detailed, or Technical."
    },
    {
      num: "04",
      title: "Transparent Citations & Follow-ups",
      desc: "Review clickable links to original medical publications and explore suggested questions to discuss with your doctor."
    }
  ];

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-24 md:pt-28 md:pb-32 bg-gradient-to-b from-brand-50/50 via-[#FAF9F6] to-[#FAF9F6]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-100/70 border border-brand-200/80 text-brand-800 text-xs font-semibold tracking-wide">
              <span className="w-2 h-2 rounded-full bg-brand-600 animate-pulse"></span>
              Next-Gen Healthcare Education Companion
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
              Understand Your Health, <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-brand-700 via-brand-600 to-medical-600 bg-clip-text text-transparent">
                One Conversation at a Time.
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto font-normal">
              CareGuide AI translates complex medical concepts and lab results into personalized, crystal-clear explanations—strictly grounded in verified public healthcare sources like the WHO, CDC, and NHS.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link
                href="/chat"
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-brand-600 text-white font-semibold text-base shadow-md shadow-brand-600/25 hover:bg-brand-700 hover:shadow-lg transition-all flex items-center justify-center gap-2 group"
              >
                Start Exploring Now
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/dashboard"
                className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-white text-slate-700 font-semibold text-base border border-slate-200 hover:bg-slate-50 hover:text-slate-900 shadow-sm transition-all text-center"
              >
                Patient Dashboard
              </Link>
            </div>

            {/* Trust Badges */}
            <div className="pt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500 font-medium">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-brand-600" /> Grounded in Verified Healthcare
              </div>
              <div className="flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-brand-600" /> Memento Private Memory
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-brand-600" /> Non-Diagnostic Educational Model
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-white border-y border-slate-200/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-bold text-brand-600 uppercase tracking-widest">
              Simple 4-Step Process
            </span>
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
              How CareGuide AI Works
            </h2>
            <p className="text-slate-600 text-sm sm:text-base">
              A transparent, high-integrity generative AI pipeline designed specifically for patient health literacy.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
            {howItWorksSteps.map((step, idx) => (
              <div 
                key={step.num}
                className="relative bg-[#FAF9F6] p-6 rounded-2xl border border-slate-200/80 hover:border-brand-300 transition-colors flex flex-col justify-between"
              >
                <div>
                  <span className="text-3xl font-black text-brand-600/40 mb-3 block">
                    {step.num}
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Key Features Section */}
      <section id="features" className="py-20 bg-[#FAF9F6]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-bold text-brand-600 uppercase tracking-widest">
              Engineered For Patients
            </span>
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
              Built for Clarity, Accuracy & Safety
            </h2>
            <p className="text-slate-600 text-sm sm:text-base">
              Say goodbye to confusing medical jargon and unverified Internet forums.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feat) => {
              const Icon = feat.icon;
              return (
                <div 
                  key={feat.title}
                  className="bg-white p-7 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow flex items-start gap-4"
                >
                  <div className="w-12 h-12 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center shrink-0 text-brand-600">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">
                      {feat.title}
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {feat.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Trusted Healthcare Information Section */}
      <section id="sources" className="py-20 bg-white border-t border-slate-200/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-16 space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
              <Database className="w-3.5 h-3.5 text-brand-600" /> Strict Allowlist Enforcement
            </div>
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
              Ingested Exclusively From Authoritative Sources
            </h2>
            <p className="text-slate-600 text-sm sm:text-base">
              CareGuide AI restricts web ingestion via Firecrawl to verified healthcare organizations. We reject random blogs, commercial advertisements, and unvetted forums.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {trustedSources.map((source) => (
              <div 
                key={source.domain}
                className="p-6 rounded-2xl bg-[#FAF9F6] border border-slate-200/80 flex flex-col justify-between hover:border-brand-400 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-bold text-brand-700 bg-brand-100/80 px-2.5 py-0.5 rounded-full">
                      {source.badge}
                    </span>
                    <a 
                      href={`https://${source.domain}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-slate-400 hover:text-slate-700"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-1">
                    {source.name}
                  </h3>
                  <p className="text-xs font-mono text-brand-600 mb-3">
                    {source.domain}
                  </p>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {source.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Link 
              href="/sources" 
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-800"
            >
              Explore all indexed documents in knowledge base <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Privacy & Clinical Safety Safeguards */}
      <section className="py-20 bg-[#FAF9F6] border-t border-slate-200/70">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200/90 shadow-sm space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center text-teal-800">
                <ShieldCheck className="w-5 h-5 text-teal-700" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  Patient Safety & Ethical AI Principles
                </h3>
                <span className="text-xs text-slate-500">
                  Transparent, patient-first clinical education boundaries
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm text-slate-600">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60">
                <strong className="text-slate-900 block mb-1">1. Educational Assistance Only</strong>
                CareGuide AI never issues individual medical diagnoses, treatment prescriptions, or medication dosages.
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60">
                <strong className="text-slate-900 block mb-1">2. Acute Emergency Detection</strong>
                Keywords indicating chest pain, respiratory distress, or stroke trigger instant alerts to contact emergency services (911/999/112).
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60">
                <strong className="text-slate-900 block mb-1">3. Memento Consent Controls</strong>
                Patients maintain full ownership. You can inspect your tracked topics and clear your long-term memory at any time.
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60">
                <strong className="text-slate-900 block mb-1">4. Zero Inferred Sensitive Diagnoses</strong>
                We do not store or infer sensitive clinical diagnostic labels from ordinary educational queries.
              </div>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100">
              <span className="text-xs text-slate-500">
                Questions about our privacy model or data retention?
              </span>
              <Link 
                href="/preferences" 
                className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors"
              >
                Manage Memory Settings
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
