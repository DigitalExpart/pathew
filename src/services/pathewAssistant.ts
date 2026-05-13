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
  confidence: 'high' | 'medium' | 'low';
  sessionId: string;
  error?: string;
}

export const PathewAssistantService = {
  async generateResponse(payload: AssistantRequestPayload): Promise<AssistantResponseData> {
    try {
      const { data, error } = await supabase.functions.invoke('pathew-assistant', {
        body: payload,
      });

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Pathew Assistant Service Error:', error);
      throw new Error(error.message || 'Failed to communicate with PATHEW Assistant');
    }
  }
};
