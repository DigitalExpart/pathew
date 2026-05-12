import React, { createContext, useContext, useState } from 'react';

interface AssistantContextType {
  isAssistantPanelOpen: boolean;
  setAssistantPanelOpen: (open: boolean) => void;
  activeContext: string;
  setActiveContext: (context: string) => void;
  suggestedPrompts: string[];
  setSuggestedPrompts: (prompts: string[]) => void;
  onInsert?: (text: string) => void;
  fullContextData: any;
  setFullContextData: (data: any) => void;
  isGenerating: boolean;
  setIsGenerating: (generating: boolean) => void;
  openAssistant: (
    context: string, 
    prompts?: string[], 
    insertCallback?: (text: string) => void,
    data?: any
  ) => void;
}

const AssistantContext = createContext<AssistantContextType | undefined>(undefined);

export const AssistantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAssistantPanelOpen, setAssistantPanelOpen] = useState(false);
  const [activeContext, setActiveContext] = useState('');
  const [suggestedPrompts, setSuggestedPrompts] = useState<string[]>([]);
  const [onInsert, setOnInsert] = useState<((text: string) => void) | undefined>(undefined);
  const [fullContextData, setFullContextData] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const openAssistant = (
    context: string, 
    prompts: string[] = [], 
    insertCallback?: (text: string) => void,
    data: any = null
  ) => {
    setActiveContext(context);
    setSuggestedPrompts(prompts);
    setOnInsert(() => insertCallback);
    setFullContextData(data);
    setAssistantPanelOpen(true);
  };

  return (
    <AssistantContext.Provider value={{ 
      isAssistantPanelOpen, 
      setAssistantPanelOpen, 
      activeContext, 
      setActiveContext, 
      suggestedPrompts, 
      setSuggestedPrompts,
      onInsert,
      fullContextData,
      setFullContextData,
      isGenerating,
      setIsGenerating,
      openAssistant
    }}>
      {children}
    </AssistantContext.Provider>
  );
};

export const useAssistant = () => {
  const context = useContext(AssistantContext);
  if (context === undefined) {
    throw new Error('useAssistant must be used within an AssistantProvider');
  }
  return context;
};
