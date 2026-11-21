'use client';

import React, { useState, useEffect } from 'react';
import { 
  Database, 
  ExternalLink, 
  Search, 
  Sparkles, 
  Layers, 
  ShieldCheck, 
  CheckCircle2, 
  Globe, 
  PlusCircle, 
  FileText 
} from 'lucide-react';
import { api } from '@/lib/api';
import { HealthDocument } from '@/types';
import { AuthGuard } from '@/components/AuthGuard';

export default function SourcesPage() {
  const [documents, setDocuments] = useState<HealthDocument[]>([]);
  const [allowedDomains, setAllowedDomains] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [crawlUrl, setCrawlUrl] = useState<string>('');
  const [crawling, setCrawling] = useState<boolean>(false);
  const [crawlStatus, setCrawlStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    loadSources();
  }, []);

  const loadSources = async () => {
    try {
      const data = await api.getSources();
      setDocuments(data.documents || []);
      setAllowedDomains(data.allowed_domains || ['who.int', 'cdc.gov', 'nhs.uk', 'medlineplus.gov']);
    } catch (e) {
      console.warn('Sources load error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCrawl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!crawlUrl.trim() || crawling) return;

    setCrawling(true);
    setCrawlStatus(null);

    try {
      const newDoc = await api.crawlSource(crawlUrl.trim());
      setCrawlStatus({
        type: 'success',
        message: `Successfully crawled and indexed: "${newDoc.title}" (${newDoc.chunks_count} chunks indexed in pgvector).`
      });
      setCrawlUrl('');
      await loadSources();
    } catch (err: any) {
      setCrawlStatus({
        type: 'error',
        message: err.message || 'Crawl failed. Check domain allowlist.'
      });
    } finally {
      setCrawling(false);
    }
  };

  return (
    <AuthGuard>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Page Header */}
      <div className="space-y-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-100 text-brand-800 text-xs font-semibold">
          <Database className="w-3.5 h-3.5 text-brand-600" /> Grounded Knowledge Base
        </div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
          Verified Healthcare Sources & Ingestion
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-2xl">
          CareGuide AI exclusively indexes educational materials from verified health authorities. All responses are mathematically matched to these document chunks using pgvector.
        </p>
      </div>

      {/* Domain Allowlist Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-sm space-y-3">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-brand-600" />
          Strict Domain Allowlist
        </h2>
        <p className="text-xs text-slate-600 leading-relaxed">
          Firecrawl is restricted to crawling and extracting content exclusively from these verified public health institutions:
        </p>
        <div className="flex flex-wrap gap-2.5 pt-1">
          {allowedDomains.map((domain) => (
            <span
              key={domain}
              className="px-3.5 py-1.5 rounded-xl bg-teal-50 border border-teal-200/80 text-teal-800 text-xs font-mono font-bold flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
              {domain}
            </span>
          ))}
        </div>
      </div>

      {/* Firecrawl Ingestion Tool Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-sm space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Globe className="w-4 h-4 text-brand-600" />
            Firecrawl Healthcare Crawler
          </h2>
          <p className="text-xs text-slate-500">
            Ingest and index a new official publication from an allowed domain into the RAG vector store.
          </p>
        </div>

        {crawlStatus && (
          <div
            className={`p-3.5 rounded-2xl text-xs font-medium ${
              crawlStatus.type === 'success'
                ? 'bg-teal-50 border border-teal-200 text-teal-800'
                : 'bg-rose-50 border border-rose-200 text-rose-800'
            }`}
          >
            {crawlStatus.message}
          </div>
        )}

        <form onSubmit={handleCrawl} className="flex flex-col sm:flex-row gap-3">
          <input
            type="url"
            required
            value={crawlUrl}
            onChange={(e) => setCrawlUrl(e.target.value)}
            placeholder="https://www.who.int/news-room/fact-sheets/detail/diabetes"
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          />
          <button
            type="submit"
            disabled={crawling}
            className="px-6 py-2.5 rounded-xl bg-brand-600 text-white font-semibold text-xs sm:text-sm shadow-sm hover:bg-brand-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            {crawling ? 'Crawling & Indexing...' : 'Crawl & Index'}
          </button>
        </form>
      </div>

      {/* Indexed Healthcare Documents Table */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-brand-600" />
            Indexed Health Documents ({documents.length})
          </h2>
          <span className="text-xs text-slate-400">pgvector ready</span>
        </div>

        {loading ? (
          <div className="py-8 text-center text-xs text-slate-400">Loading indexed documents...</div>
        ) : documents.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">No documents indexed.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="p-5 rounded-2xl bg-[#FAF9F6] border border-slate-200/80 hover:border-brand-300 transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono font-bold text-brand-700 bg-brand-100/70 px-2 py-0.5 rounded-full">
                      {doc.source_domain}
                    </span>
                    <a
                      href={doc.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-400 hover:text-slate-700"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mb-1.5 line-clamp-2">
                    {doc.title}
                  </h3>
                  <p className="text-xs text-slate-600 line-clamp-3 mb-3 leading-relaxed">
                    {doc.summary || 'Authoritative clinical facts and educational guidance.'}
                  </p>
                </div>
                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-400">
                  <span>{doc.chunks_count || 1} vector chunks</span>
                  <span className="truncate max-w-[140px] font-mono">{doc.source_domain}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
    </AuthGuard>
  );
}
