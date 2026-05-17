import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { BuilderService } from '../services/builderService';
import { PathewAssistantService } from '../services/pathewAssistant';
import type { ProfileSource, GeneratedDocument } from '../services/builderService';

export type BuilderStage = 'sources' | 'extraction' | 'missing' | 'editor';

export interface UseBuilderAiProps {
  builderType: 'cv' | 'cover_letter' | 'grant';
  defaultDocumentType: string;
  initialOpportunityId?: string | null;
}

export const useBuilderAi = ({ builderType, defaultDocumentType, initialOpportunityId }: UseBuilderAiProps) => {
  const { user, profile } = useAuth();
  
  // Builder configuration states
  const [stage, setStage] = useState<BuilderStage>('sources');
  const [documentType, setDocumentType] = useState<string>(defaultDocumentType);
  const [opportunityId, setOpportunityId] = useState<string | null>(initialOpportunityId || null);
  const [opportunityText, setOpportunityText] = useState<string>('');
  const [selectedSourceIds, setSelectedSourceIds] = useState<string[]>([]);
  const [tone, setTone] = useState<string>(profile?.assistant_settings?.tone || 'Professional & Academic');
  const [language, setLanguage] = useState<string>('English (UK)');
  
  // Limits
  const [wordLimit, setWordLimit] = useState<number>(300);
  const [pageCount, setPageCount] = useState<number>(1);
  
  // Loading & status states
  const [sources, setSources] = useState<ProfileSource[]>([]);
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // AI output states
  const [matchSummary, setMatchSummary] = useState<{
    strongMatches: string[];
    gaps: string[];
    priorityPoints: string[];
  }>({ strongMatches: [], gaps: [], priorityPoints: [] });
  
  const [missingFields, setMissingFields] = useState<any[]>([]);
  const [missingAnswers, setMissingAnswers] = useState<Record<string, string>>({});
  
  const [draftContent, setDraftContent] = useState<string>('');
  const [editingSuggestions, setEditingSuggestions] = useState<string[]>([]);
  const [confidence, setConfidence] = useState<'high' | 'medium' | 'low'>('medium');
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);
  
  // Document history states
  const [savedVersions, setSavedVersions] = useState<GeneratedDocument[]>([]);
  const [currentVersionNumber, setCurrentVersionNumber] = useState<number>(1);

  // Sync settings from profile on load
  useEffect(() => {
    if (profile?.assistant_settings?.tone) {
      setTone(profile.assistant_settings.tone);
    }
  }, [profile]);

  // Load user profile sources
  const loadSources = async () => {
    if (!user) return;
    try {
      const data = await BuilderService.fetchProfileSources(user.id);
      setSources(data);
    } catch (err: any) {
      console.error('Error loading sources:', err);
    }
  };

  useEffect(() => {
    if (user) {
      loadSources();
      loadSavedVersions();
    }
  }, [user]);

  const loadSavedVersions = async () => {
    if (!user) return;
    try {
      const docs = await BuilderService.fetchGeneratedDocuments(user.id, defaultDocumentType);
      setSavedVersions(docs);
      if (docs.length > 0) {
        // Default to the current current draft if present
        const currentDoc = docs.find(d => d.is_current) || docs[0];
        setDraftContent(currentDoc.content);
        if (currentDoc.structured_json) {
          setMatchSummary(currentDoc.structured_json.matchSummary || { strongMatches: [], gaps: [], priorityPoints: [] });
          setEditingSuggestions(currentDoc.structured_json.editingSuggestions || []);
        }
        setCurrentVersionNumber(currentDoc.version);
      }
    } catch (err: any) {
      console.error('Error loading versions:', err);
    }
  };

  // === PIPELINE ACTIONS ===

  // 1. EXTRACT CONTEXT & GAP ANALYSIS
  const startExtraction = async () => {
    if (!user) {
      setError('You must be signed in to perform this action.');
      return;
    }

    setIsExtracting(true);
    setError(null);
    setStage('extraction');

    try {
      // 1. Create a Builder Request Log
      const requestLog = await BuilderService.createBuilderRequest({
        builder_type: builderType,
        task: `Gap Analysis for ${documentType}`,
        document_type: documentType,
        opportunity_id: opportunityId || undefined,
        source_ids: selectedSourceIds,
        current_text: opportunityText,
        tone_preference: tone,
        preferred_language: language,
        word_limit: wordLimit,
        page_count: pageCount,
      }, user.id);

      // 2. Call Edge Function with action = "extract_context"
      const result = await PathewAssistantService.generateResponse({
        action: 'extract_context',
        sessionId,
        documentType,
        opportunityId: opportunityId || undefined,
        sourceIds: selectedSourceIds,
        tone,
        language,
        currentDraft: opportunityText // pipe manually pasted opportunity text
      });

      if (result.error) {
        throw new Error(result.error);
      }

      // Update states
      setMatchSummary(result.matchSummary || { strongMatches: [], gaps: [], priorityPoints: [] });
      setMissingFields(result.missingFields || []);
      setSessionId(result.sessionId);
      
      await BuilderService.updateBuilderRequestStatus(requestLog.id, 'success');

      // Move stage
      if (result.missingFields && result.missingFields.length > 0) {
        setStage('missing');
      } else {
        // No missing fields - generate draft directly!
        await generateTailoredDraft(result.sessionId, {});
      }

    } catch (err: any) {
      setError(err.message || 'Context extraction failed.');
      setStage('sources');
    } finally {
      setIsExtracting(false);
    }
  };

  // 2. GENERATE TAILORED DRAFT
  const generateTailoredDraft = async (sid?: string, answers?: Record<string, string>) => {
    if (!user) return;

    setIsGenerating(true);
    setError(null);
    setStage('editor');

    const activeSessionId = sid || sessionId;
    const activeAnswers = answers || missingAnswers;

    try {
      const requestLog = await BuilderService.createBuilderRequest({
        builder_type: builderType,
        task: `Generate Tailored ${documentType}`,
        document_type: documentType,
        opportunity_id: opportunityId || undefined,
        source_ids: selectedSourceIds,
        current_text: opportunityText,
        user_prompt: JSON.stringify(activeAnswers),
        tone_preference: tone,
        preferred_language: language,
        word_limit: wordLimit,
        page_count: pageCount,
      }, user.id);

      const result = await PathewAssistantService.generateResponse({
        action: 'generate_draft',
        sessionId: activeSessionId,
        documentType,
        opportunityId: opportunityId || undefined,
        sourceIds: selectedSourceIds,
        missingFieldsAnswers: activeAnswers,
        tone,
        language,
        currentDraft: draftContent || opportunityText
      });

      if (result.error) {
        throw new Error(result.error);
      }

      setDraftContent(result.draft);
      setMatchSummary(result.matchSummary || { strongMatches: [], gaps: [], priorityPoints: [] });
      setEditingSuggestions(result.editingSuggestions || []);
      setConfidence(result.confidence || 'medium');
      setSessionId(result.sessionId);

      await BuilderService.updateBuilderRequestStatus(requestLog.id, 'success');

      // Proactively save this generated draft as Version 1
      await saveDraftToDb(
        `${documentType} Draft - ${new Date().toLocaleDateString()}`,
        result.draft,
        { matchSummary: result.matchSummary, editingSuggestions: result.editingSuggestions }
      );

    } catch (err: any) {
      setError(err.message || 'Draft generation failed.');
    } finally {
      setIsGenerating(false);
    }
  };

  // 3. REGENERATE OR REWRITE AN ACTIVE SECTION
  const regenerateDraft = async (customInstructions: string) => {
    if (!user) return;

    setIsGenerating(true);
    setError(null);

    try {
      const result = await PathewAssistantService.generateResponse({
        action: `regenerate: ${customInstructions}`,
        sessionId,
        documentType,
        opportunityId: opportunityId || undefined,
        sourceIds: selectedSourceIds,
        missingFieldsAnswers: missingAnswers,
        tone,
        language,
        currentDraft: draftContent
      });

      if (result.error) {
        throw new Error(result.error);
      }

      setDraftContent(result.draft);
      if (result.matchSummary) setMatchSummary(result.matchSummary);
      if (result.editingSuggestions) setEditingSuggestions(result.editingSuggestions);
      
      // Save next version number
      const nextVersion = savedVersions.length > 0 ? Math.max(...savedVersions.map(v => v.version)) + 1 : 1;
      setCurrentVersionNumber(nextVersion);

      await saveDraftToDb(
        `${documentType} - Version ${nextVersion}`,
        result.draft,
        { matchSummary: result.matchSummary || matchSummary, editingSuggestions: result.editingSuggestions || editingSuggestions },
        nextVersion
      );

    } catch (err: any) {
      setError(err.message || 'Regeneration failed.');
    } finally {
      setIsGenerating(false);
    }
  };

  // 4. PERSIST DRAFT TO DATABASE HISTORY
  const saveDraftToDb = async (title: string, customContent?: string, structuredJson?: any, versionOverride?: number) => {
    if (!user) return;
    try {
      const activeContent = customContent !== undefined ? customContent : draftContent;
      const v = versionOverride !== undefined ? versionOverride : (savedVersions.length > 0 ? Math.max(...savedVersions.map(v => v.version)) + 1 : 1);

      const savedDoc = await BuilderService.saveGeneratedDocument({
        document_type: documentType,
        title,
        content: activeContent,
        structured_json: structuredJson || { matchSummary, editingSuggestions },
        version: v,
        is_current: true,
        opportunity_id: opportunityId || undefined,
      }, user.id);

      await loadSavedVersions();
      return savedDoc;
    } catch (err: any) {
      console.error('Error saving draft history:', err);
    }
  };

  // Helper: Reset pipeline state
  const resetPipeline = () => {
    setStage('sources');
    setError(null);
    setMatchSummary({ strongMatches: [], gaps: [], priorityPoints: [] });
    setMissingFields([]);
    setMissingAnswers({});
    setDraftContent('');
    setEditingSuggestions([]);
    setSessionId(undefined);
  };

  return {
    stage,
    setStage,
    documentType,
    setDocumentType,
    opportunityId,
    setOpportunityId,
    opportunityText,
    setOpportunityText,
    selectedSourceIds,
    setSelectedSourceIds,
    tone,
    setTone,
    language,
    setLanguage,
    wordLimit,
    setWordLimit,
    pageCount,
    setPageCount,
    
    // Status states
    sources,
    loadSources,
    isExtracting,
    isGenerating,
    error,
    setError,
    
    // Output states
    matchSummary,
    missingFields,
    missingAnswers,
    setMissingAnswers,
    draftContent,
    setDraftContent,
    editingSuggestions,
    confidence,
    sessionId,
    
    // History
    savedVersions,
    currentVersionNumber,
    setCurrentVersionNumber,
    loadSavedVersions,

    // Operations
    startExtraction,
    generateTailoredDraft,
    regenerateDraft,
    saveDraftToDb,
    resetPipeline
  };
};
