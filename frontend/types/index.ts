export interface Citation {
  title: string;
  url: string;
  domain: string;
  snippet?: string;
}

export interface MedicalTerm {
  term: string;
  definition: string;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  citations?: Citation[];
  medical_terms?: MedicalTerm[];
  suggested_follow_ups?: string[];
  is_emergency?: boolean;
  emergency_notice?: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  message_count?: number;
}

export interface UserPreferences {
  user_id: string;
  preferred_explanation_style: 'simple' | 'detailed' | 'technical';
  preferred_response_length: 'short' | 'medium' | 'long';
  memory_enabled: boolean;
}

export interface MemoryItem {
  id: string;
  user_id: string;
  topic: string;
  summary: string;
  category: string;
  last_discussed_at: string;
  created_at: string;
}

export interface HealthDocument {
  id: string;
  title: string;
  source_url: string;
  source_domain: string;
  summary?: string;
  chunks_count?: number;
  created_at: string;
}
