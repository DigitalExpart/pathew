import { supabase } from '../lib/supabase';

export interface AssistantRequestPayload {
  action: string;
  contextData?: any;
  documentType?: string;
  opportunityId?: string;
  sessionId?: string;
  currentDraft?: string;
  tone?: string;
  language?: string;
  sourceIds?: string[];
  missingFieldsAnswers?: Record<string, string>;
}

export interface AssistantResponseData {
  draft: string;
  matchSummary: {
    strongMatches: string[];
    gaps: string[];
    priorityPoints: string[];
  };
  editingSuggestions: string[];
  wordCountEstimate: number;
  estimatedPages?: number;
  confidence: 'high' | 'medium' | 'low';
  sessionId: string;
  error?: string;
  missingFields?: {
    key: string;
    label: string;
    type: 'text' | 'textarea';
    description?: string;
  }[];
  creditsRemaining?: number;
  creditsDeducted?: number;
}

export const PathewAssistantService = {
  async streamResponse(
    payload: AssistantRequestPayload,
    onChunk?: (text: string) => void
  ): Promise<AssistantResponseData> {
    return new Promise(async (resolve, reject) => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;
        
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const response = await fetch(`${supabaseUrl}/functions/v1/pathew-assistant`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          throw new Error(`Edge Function returned a non-2xx status code: ${response.status}`);
        }

        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const jsonResponse = await response.json();
          resolve(jsonResponse);
          return;
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error('No stream returned');

        const decoder = new TextDecoder();
        let buffer = '';
        let resolved = false;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const dataStr = line.substring(6);
              if (dataStr === '[DONE]') continue;

              try {
                const event = JSON.parse(dataStr);
                if (event.type === 'chunk') {
                  if (onChunk) onChunk(event.text);
                } else if (event.type === 'done') {
                  resolved = true;
                  resolve(event.metadata);
                }
              } catch (e) {
                console.warn('Failed to parse SSE event', e);
              }
            }
          }
        }
        
        if (!resolved) {
          reject(new Error("Stream ended unexpectedly. The AI service may be temporarily unavailable."));
        }
      } catch (error: any) {
        console.error('Pathew Assistant Service Streaming Error:', error);
        reject(error);
      }
    });
  }
};
