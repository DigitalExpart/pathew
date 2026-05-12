import React, { createContext, useContext, useState } from 'react';

interface AIContextType {
  isAIPanelOpen: boolean;
  setAIPanelOpen: (open: boolean) => void;
  aiContext: string;
  setAIContext: (context: string) => void;
  suggestedPrompts: string[];
  setSuggestedPrompts: (prompts: string[]) => void;
  openAIAssistant: (context: string, prompts?: string[]) => void;
}

const AIContext = createContext<AIContextType | undefined>(undefined);

export const AIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAIPanelOpen, setAIPanelOpen] = useState(false);
  const [aiContext, setAIContext] = useState('');
  const [suggestedPrompts, setSuggestedPrompts] = useState<string[]>([]);

  const openAIAssistant = (context: string, prompts: string[] = []) => {
    setAIContext(context);
    setSuggestedPrompts(prompts);
    setAIPanelOpen(true);
  };

  return (
    <AIContext.Provider value={{ 
      isAIPanelOpen, 
      setAIPanelOpen, 
      aiContext, 
      setAIContext, 
      suggestedPrompts, 
      setSuggestedPrompts,
      openAIAssistant
    }}>
      {children}
    </AIContext.Provider>
  );
};

export const useAI = () => {
  const context = useContext(AIContext);
  if (context === undefined) {
    throw new Error('useAI must be used within an AIProvider');
  }
  return context;
};
