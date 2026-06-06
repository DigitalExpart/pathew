import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { PathewAssistantService } from '../services/pathewAssistant';
import type { AssistantRequestPayload, AssistantResponseData } from '../services/pathewAssistant';
import i18n from '../i18n/index';

const LANGUAGE_MAP: Record<string, string> = {
  en: 'English',
  fr: 'French',
  de: 'German',
  es: 'Spanish',
};

export const usePathewAssistant = () => {
  const { profile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<AssistantResponseData | null>(null);
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);

  const generate = async (payload: Omit<AssistantRequestPayload, 'tone' | 'language' | 'sessionId'>) => {
    if (!profile) {
      setError('User profile not found');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Map the current UI language to a full language name for the AI
      const currentLangCode = i18n.language?.split('-')[0] || 'en';
      const aiLanguage = LANGUAGE_MAP[currentLangCode] || 'English';

      const fullPayload: AssistantRequestPayload = {
        ...payload,
        sessionId,
        tone: profile.assistant_settings?.tone || 'Professional (formal)',
        language: aiLanguage, // Use current UI language for AI responses
      };

      const data = await PathewAssistantService.streamResponse(fullPayload);
      
      if (data.error) {
        throw new Error(data.error);
      }

      setResponse(data);
      setSessionId(data.sessionId);
      return data;
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setResponse(null);
    setError(null);
    setSessionId(undefined);
  };

  return {
    isLoading,
    error,
    response,
    generate,
    reset,
    setResponse
  };
};
