import { ChatMessage, Conversation, UserPreferences, MemoryItem, HealthDocument } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const getHeaders = (): HeadersInit => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('careguide_auth_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  return headers;
};

const handleUnauthorized = (res: Response) => {
  if (res.status === 401 && typeof window !== 'undefined') {
    localStorage.removeItem('careguide_auth_token');
    localStorage.removeItem('careguide_user_email');
    localStorage.removeItem('careguide_user_id');
    if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/signup') && window.location.pathname !== '/') {
      window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`;
    }
  }
};

export const api = {
  // Chat
  async sendMessage(params: {
    message: string;
    conversation_id?: string;
    explanation_style?: 'simple' | 'detailed' | 'technical';
    response_length?: 'short' | 'medium' | 'long';
  }) {
    const res = await fetch(`${API_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      handleUnauthorized(res);
      const err = await res.json().catch(() => ({ detail: 'Failed to send message' }));
      throw new Error(err.detail || 'Failed to send message');
    }
    return res.json();
  },

  async getConversations(): Promise<Conversation[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/conversations`, {
        headers: getHeaders(),
      });
      if (!res.ok) {
        handleUnauthorized(res);
        return [];
      }
      return res.json();
    } catch (e) {
      console.warn('Could not load conversations from backend:', e);
      return [];
    }
  },

  async getConversationMessages(conversationId: string): Promise<ChatMessage[]> {
    const res = await fetch(`${API_BASE_URL}/api/conversations/${conversationId}`, {
      headers: getHeaders(),
    });
    if (!res.ok) {
      handleUnauthorized(res);
      return [];
    }
    return res.json();
  },

  async deleteConversation(conversationId: string): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/api/conversations/${conversationId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) {
      handleUnauthorized(res);
    }
  },

  // Preferences
  async getPreferences(): Promise<UserPreferences> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/preferences`, {
        headers: getHeaders(),
      });
      if (!res.ok) {
        handleUnauthorized(res);
      } else {
        return res.json();
      }
    } catch (e) {
      console.warn('Preferences fallback:', e);
    }
    return {
      user_id: 'demo-patient',
      preferred_explanation_style: 'simple',
      preferred_response_length: 'medium',
      memory_enabled: true,
    };
  },

  async updatePreferences(prefs: Partial<UserPreferences>): Promise<UserPreferences> {
    const res = await fetch(`${API_BASE_URL}/api/preferences`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(prefs),
    });
    if (!res.ok) {
      handleUnauthorized(res);
      throw new Error('Failed to update preferences');
    }
    return res.json();
  },

  // Memory (Memento)
  async getMemories(): Promise<{ memories: MemoryItem[]; topics: string[]; memory_enabled: boolean }> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/memory`, {
        headers: getHeaders(),
      });
      if (!res.ok) {
        handleUnauthorized(res);
      } else {
        return res.json();
      }
    } catch (e) {
      console.warn('Memory fetch fallback:', e);
    }
    return { memories: [], topics: [], memory_enabled: true };
  },

  async clearMemories(): Promise<{ cleared_count: number }> {
    const res = await fetch(`${API_BASE_URL}/api/memory`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) {
      handleUnauthorized(res);
      throw new Error('Failed to clear memory');
    }
    return res.json();
  },

  // Knowledge base & Ingestion
  async getSources(): Promise<{ documents: HealthDocument[]; allowed_domains: string[]; total_documents: number }> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/sources`);
      if (res.ok) return res.json();
    } catch (e) {
      console.warn('Sources fallback:', e);
    }
    return { documents: [], allowed_domains: ['who.int', 'cdc.gov', 'nhs.uk', 'medlineplus.gov'], total_documents: 0 };
  },

  async crawlSource(url: string): Promise<HealthDocument> {
    const res = await fetch(`${API_BASE_URL}/api/ingestion/crawl`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ url }),
    });
    if (!res.ok) {
      handleUnauthorized(res);
      const err = await res.json().catch(() => ({ detail: 'Crawl request failed' }));
      throw new Error(err.detail || 'Crawl failed');
    }
    return res.json();
  },

  // Health
  async getHealth() {
    try {
      const res = await fetch(`${API_BASE_URL}/health`);
      return res.json();
    } catch {
      return { status: 'offline' };
    }
  },
};
