import React, { createContext, useContext, useState } from 'react';

interface AssistanceContextType {
  isAssistancePanelOpen: boolean;
  setAssistancePanelOpen: (open: boolean) => void;
  assistanceContext: string;
  setAssistanceContext: (context: string) => void;
  suggestedPrompts: string[];
  setSuggestedPrompts: (prompts: string[]) => void;
  onInsert?: (text: string) => void;
  fullContextData: any;
  setFullContextData: (data: any) => void;
  isGenerating: boolean;
  setIsGenerating: (generating: boolean) => void;
  openAssistance: (
    context: string, 
    prompts?: string[], 
    insertCallback?: (text: string) => void,
    data?: any
  ) => void;
}

const AssistanceContext = createContext<AssistanceContextType | undefined>(undefined);

export const AssistanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAssistancePanelOpen, setAssistancePanelOpen] = useState(false);
  const [assistanceContext, setAssistanceContext] = useState('');
  const [suggestedPrompts, setSuggestedPrompts] = useState<string[]>([]);
  const [onInsert, setOnInsert] = useState<((text: string) => void) | undefined>(undefined);
  const [fullContextData, setFullContextData] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const openAssistance = (
    context: string, 
    prompts: string[] = [], 
    insertCallback?: (text: string) => void,
    data: any = null
  ) => {
    setAssistanceContext(context);
    setSuggestedPrompts(prompts);
    setOnInsert(() => insertCallback);
    setFullContextData(data);
    setAssistancePanelOpen(true);
  };

  return (
    <AssistanceContext.Provider value={{ 
      isAssistancePanelOpen, 
      setAssistancePanelOpen, 
      assistanceContext, 
      setAssistanceContext, 
      suggestedPrompts, 
      setSuggestedPrompts,
      onInsert,
      fullContextData,
      setFullContextData,
      isGenerating,
      setIsGenerating,
      openAssistance
    }}>
      {children}
    </AssistanceContext.Provider>
  );
};

export const useAssistance = () => {
  const context = useContext(AssistanceContext);
  if (context === undefined) {
    throw new Error('useAssistance must be used within an AssistanceProvider');
  }
  return context;
};
