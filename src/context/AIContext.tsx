import React, { createContext, useContext, useState } from 'react';

interface AIContextType {
  isAIPanelOpen: boolean;
  setAIPanelOpen: (open: boolean) => void;
  aiContext: string;
  setAIContext: (context: string) => void;
  suggestedPrompts: string[];
  setSuggestedPrompts: (prompts: string[]) => void;
  onInsert?: (text: string) => void;
  fullContextData: any;
  setFullContextData: (data: any) => void;
  isGenerating: boolean;
  setIsGenerating: (generating: boolean) => void;
  openAIAssistant: (
    context: string, 
    prompts?: string[], 
    insertCallback?: (text: string) => void,
    data?: any
  ) => void;
}

const AIContext = createContext<AIContextType | undefined>(undefined);

export const AIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAIPanelOpen, setAIPanelOpen] = useState(false);
  const [aiContext, setAIContext] = useState('');
  const [suggestedPrompts, setSuggestedPrompts] = useState<string[]>([]);
  const [onInsert, setOnInsert] = useState<((text: string) => void) | undefined>(undefined);
  const [fullContextData, setFullContextData] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const openAIAssistant = (
    context: string, 
    prompts: string[] = [], 
    insertCallback?: (text: string) => void,
    data: any = null
  ) => {
    setAIContext(context);
    setSuggestedPrompts(prompts);
    setOnInsert(() => insertCallback);
    setFullContextData(data);
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
      onInsert,
      fullContextData,
      setFullContextData,
      isGenerating,
      setIsGenerating,
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
