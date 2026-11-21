'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  Send, 
  Sparkles, 
  PlusCircle, 
  Trash2, 
  ExternalLink, 
  ShieldAlert, 
  BookOpen, 
  Layers, 
  HelpCircle,
  CheckCircle,
  Copy,
  ChevronDown,
  Info
} from 'lucide-react';
import { api } from '@/lib/api';
import { ChatMessage, Citation, MedicalTerm } from '@/types';
import { AuthGuard } from '@/components/AuthGuard';

function ChatContent() {
  const searchParams = useSearchParams();
  const initialPrompt = searchParams.get('prompt') || '';
  const initialConvId = searchParams.get('id') || '';

  const [conversationId, setConversationId] = useState<string>(initialConvId);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState<string>(initialPrompt);
  const [loading, setLoading] = useState<boolean>(false);
  const [explanationStyle, setExplanationStyle] = useState<'simple' | 'detailed' | 'technical'>('simple');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  useEffect(() => {
    // If conversation id provided, load previous messages
    if (initialConvId) {
      api.getConversationMessages(initialConvId).then((data) => {
        if (data && data.length > 0) {
          setMessages(data);
        }
      });
    }

    // Load active preference
    api.getPreferences().then((pref) => {
      if (pref?.preferred_explanation_style) {
        setExplanationStyle(pref.preferred_explanation_style);
      }
    });

    // If initial prompt provided from dashboard, auto-trigger message
    if (initialPrompt && !initialConvId) {
      handleSendMessage(initialPrompt);
    }
  }, [initialConvId]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || loading) return;

    const tempUserMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      conversation_id: conversationId,
      role: 'user',
      content: text,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempUserMsg]);
    setInputText('');
    setLoading(true);

    try {
      const response = await api.sendMessage({
        message: text,
        conversation_id: conversationId || undefined,
        explanation_style: explanationStyle,
      });

      if (response) {
        if (response.conversation_id && !conversationId) {
          setConversationId(response.conversation_id);
        }

        const asstMsg: ChatMessage = {
          id: response.assistant_message_id,
          conversation_id: response.conversation_id,
          role: 'assistant',
          content: response.reply,
          citations: response.citations,
          medical_terms: response.medical_terms,
          suggested_follow_ups: response.suggested_follow_ups,
          is_emergency: response.is_emergency,
          emergency_notice: response.emergency_notice,
          created_at: response.created_at,
        };

        setMessages((prev) => [...prev, asstMsg]);
      }
    } catch (err: any) {
      const errMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        conversation_id: conversationId,
        role: 'assistant',
        content: `Error: ${err.message || 'Unable to generate response. Please ensure backend is running.'}`,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleNewConversation = () => {
    setConversationId('');
    setMessages([]);
    setInputText('');
  };

  const handleClearCurrentConversation = async () => {
    if (conversationId) {
      await api.deleteConversation(conversationId).catch(() => {});
    }
    handleNewConversation();
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 flex flex-col h-[calc(100vh-8rem)]">
      {/* Chat Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between pb-4 border-b border-slate-200/80 gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={handleNewConversation}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs shadow-sm transition-colors"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            New Chat
          </button>

          {messages.length > 0 && (
            <button
              onClick={handleClearCurrentConversation}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 text-xs font-medium transition-colors"
              title="Clear Conversation"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear
            </button>
          )}
        </div>

        {/* Style Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium hidden sm:inline">
            Explanation Style:
          </span>
          <div className="inline-flex rounded-xl p-1 bg-slate-100 border border-slate-200 text-xs font-semibold">
            {(['simple', 'detailed', 'technical'] as const).map((style) => (
              <button
                key={style}
                onClick={() => setExplanationStyle(style)}
                className={`px-3 py-1 rounded-lg capitalize transition-all ${
                  explanationStyle === style
                    ? 'bg-white text-brand-700 shadow-sm font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {style}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Messages Thread Container */}
      <div className="flex-1 overflow-y-auto py-6 space-y-6 pr-2">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 max-w-lg mx-auto space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600 shadow-sm">
              <Sparkles className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              How can I help you understand your health today?
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Ask about a condition, medical term, symptoms, or lab test. Explanations are strictly grounded in verified public healthcare sources from WHO, CDC, NHS, and MedlinePlus.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full pt-2">
              {[
                "What is Type 2 Diabetes in simple terms?",
                "How do I manage high blood pressure?",
                "What does my lipid panel cholesterol test mean?",
                "Difference between cold and flu symptoms"
              ].map((starter, i) => (
                <button
                  key={i}
                  onClick={() => handleSendMessage(starter)}
                  className="p-3 text-left rounded-xl bg-white border border-slate-200/80 hover:border-brand-300 text-xs text-slate-700 font-medium shadow-sm transition-all hover:bg-slate-50"
                >
                  {starter}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              {msg.role === 'user' ? (
                /* Patient Message */
                <div className="max-w-[85%] sm:max-w-[70%] bg-brand-700 text-white p-4 rounded-2xl rounded-tr-sm shadow-sm text-sm leading-relaxed">
                  {msg.content}
                </div>
              ) : (
                /* Assistant Card */
                <div className="max-w-full sm:max-w-[90%] bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-5">
                  {/* Emergency Banner if acute warning detected */}
                  {msg.is_emergency && (
                    <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 flex items-start gap-3">
                      <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                      <div className="text-xs space-y-1">
                        <strong className="font-bold text-rose-800 text-sm block">
                          Potential Acute Emergency Detected
                        </strong>
                        <p className="leading-relaxed">
                          {msg.emergency_notice || "If you or someone with you has chest pain, sudden numbness, or shortness of breath, please call emergency services (911/999/112) immediately."}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Main Response Markdown Body */}
                  <div className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap font-normal">
                    {msg.content}
                  </div>

                  {/* Medical Terms Simplified Cards */}
                  {msg.medical_terms && msg.medical_terms.length > 0 && (
                    <div className="pt-2 border-t border-slate-100">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-2.5">
                        <BookOpen className="w-4 h-4 text-brand-600" />
                        Medical Terms Simplified:
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {msg.medical_terms.map((term, idx) => (
                          <div key={idx} className="p-3 rounded-xl bg-[#FAF9F6] border border-slate-200/70 text-xs">
                            <span className="font-bold text-brand-800 block mb-0.5">
                              {term.term}
                            </span>
                            <span className="text-slate-600 leading-relaxed">
                              {term.definition}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Verified Citations & Source Links */}
                  {msg.citations && msg.citations.length > 0 && (
                    <div className="pt-2 border-t border-slate-100">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-2">
                        <CheckCircle className="w-3.5 h-3.5 text-teal-600" />
                        Verified Healthcare Citations:
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {msg.citations.map((cite, idx) => (
                          <a
                            key={idx}
                            href={cite.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/90 text-xs font-medium text-slate-700 hover:text-brand-700 hover:bg-brand-50/50 hover:border-brand-300 transition-colors"
                          >
                            <span className="text-[10px] font-mono font-bold text-teal-700 uppercase">
                              {cite.domain}
                            </span>
                            <span className="truncate max-w-[200px]">{cite.title}</span>
                            <ExternalLink className="w-3 h-3 text-slate-400" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Suggested Follow-up Questions */}
                  {msg.suggested_follow_ups && msg.suggested_follow_ups.length > 0 && (
                    <div className="pt-2 border-t border-slate-100">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-2">
                        <HelpCircle className="w-3.5 h-3.5 text-brand-500" />
                        Suggested Follow-Up Questions:
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {msg.suggested_follow_ups.map((q, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleSendMessage(q)}
                            className="text-left px-3 py-1.5 rounded-xl bg-brand-50/70 border border-brand-200/60 text-brand-800 text-xs font-medium hover:bg-brand-100 transition-colors"
                          >
                            {q}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Footer actions for message */}
                  <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-50">
                    <span>CareGuide AI grounded response</span>
                    <button
                      onClick={() => handleCopyText(msg.id, msg.content)}
                      className="flex items-center gap-1 hover:text-slate-600 transition-colors"
                    >
                      <Copy className="w-3 h-3" />
                      {copiedId === msg.id ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}

        {/* Loading Indicator */}
        {loading && (
          <div className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-slate-200/80 w-fit">
            <div className="w-2 h-2 rounded-full bg-brand-600 animate-ping"></div>
            <span className="text-xs font-medium text-slate-500">
              Retrieving verified medical sources & personalizing explanation...
            </span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Box Bar */}
      <div className="pt-3 border-t border-slate-200/80 bg-[#FAF9F6]">
        <div className="relative bg-white rounded-2xl border border-slate-200 shadow-sm focus-within:ring-2 focus-within:ring-brand-500/20 focus-within:border-brand-500 transition-all p-2">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a health question (e.g., 'What is hypertension and how does sodium affect it?')..."
            rows={2}
            className="w-full resize-none border-0 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none p-2"
          />

          <div className="flex items-center justify-between pt-1 px-2 border-t border-slate-100">
            <span className="text-[11px] text-slate-400">
              Press Enter to send • Shift+Enter for new line
            </span>
            <button
              onClick={() => handleSendMessage()}
              disabled={!inputText.trim() || loading}
              className="p-2.5 rounded-xl bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-40 transition-all shadow-sm"
              title="Send Message"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <AuthGuard>
      <Suspense fallback={
        <div className="min-h-[70vh] flex items-center justify-center text-xs text-slate-400">
          Loading AI Companion...
        </div>
      }>
        <ChatContent />
      </Suspense>
    </AuthGuard>
  );
}
