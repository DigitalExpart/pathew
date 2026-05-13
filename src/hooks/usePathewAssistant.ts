import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { PathewAssistantService } from '../services/pathewAssistant';
import type { AssistantRequestPayload, AssistantResponseData } from '../services/pathewAssistant';

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
      const fullPayload: AssistantRequestPayload = {
        ...payload,
        sessionId,
        tone: profile.assistant_settings?.tone || 'Professional & Academic',
        language: profile.assistant_settings?.language || 'English (UK)'
      };

      const data = await PathewAssistantService.generateResponse(fullPayload);
      
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
      setIsLoading(true); // Keep loading true for a moment for UI transitions if needed, or just false
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
