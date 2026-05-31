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
  
  // Limits with intelligent defaults based on document type
  const [wordLimit, setWordLimit] = useState<number>(
    builderType === 'cv' ? 800 : builderType === 'cover_letter' ? 350 : 1500
  );
  const [pageCount, setPageCount] = useState<number>(
    builderType === 'cv' ? 2 : builderType === 'cover_letter' ? 1 : 3
  );

  // CV Builder specific states
  const [careerGap, setCareerGap] = useState<boolean>(false);
  const [careerGapExplanation, setCareerGapExplanation] = useState<string>('');
  const [experienceLevel, setExperienceLevel] = useState<string>('Mid Career');
  const [cvType, setCvType] = useState<string>('Work CV');

  // Cover Letter specific states
  const [applicationStage, setApplicationStage] = useState<string>('Applying for an advertised role');
  const [projectAnchor, setProjectAnchor] = useState<string>('');

  // Grant / Proposal specific states
  const [funderValues, setFunderValues] = useState<string>('');
  const [previousAppHistory, setPreviousAppHistory] = useState<boolean>(false);
  const [previousAppFeedback, setPreviousAppFeedback] = useState<string>('');
  const [hasPartner, setHasPartner] = useState<boolean>(false);
  const [partnerName, setPartnerName] = useState<string>('');
  const [partnerRole, setPartnerRole] = useState<string>('');
  const [reportingMethods, setReportingMethods] = useState<string[]>([]);
  const [customQuestions, setCustomQuestions] = useState<any[]>([]);

  // Manual notes states for granular context details
  const [manualNotes, setManualNotes] = useState<{
    customQuestionNotes: string;
    leadershipAchievements: string;
    projectNotes: string;
    additionalContext: string;
  }>({
    customQuestionNotes: '',
    leadershipAchievements: '',
    projectNotes: '',
    additionalContext: '',
  });
  
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
  const [estimatedPages, setEstimatedPages] = useState<number>(1);
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

  const [prevInitialOppId, setPrevInitialOppId] = useState<string | null>(initialOpportunityId || null);

  useEffect(() => {
    if (initialOpportunityId !== prevInitialOppId) {
      resetPipeline();
      setOpportunityId(initialOpportunityId || null);
      setPrevInitialOppId(initialOpportunityId || null);
    }
  }, [initialOpportunityId, prevInitialOppId]);

  const loadSavedVersions = async () => {
    if (!user) return;
    try {
      const docs = await BuilderService.fetchGeneratedDocuments(user.id, defaultDocumentType);
      setSavedVersions(docs);
      if (docs.length > 0) {
        // Default to the current current draft if present
        const currentDoc = docs.find(d => d.is_current) || docs[0];
        if (currentDoc.content && currentDoc.content.trim().startsWith('{"draft":')) {
          console.warn("Ignoring corrupted JSON draft in history");
        } else {
          setDraftContent(currentDoc.content);
          if (currentDoc.structured_json) {
            setMatchSummary(currentDoc.structured_json.matchSummary || { strongMatches: [], gaps: [], priorityPoints: [] });
            setEditingSuggestions(currentDoc.structured_json.editingSuggestions || []);
          }
          setCurrentVersionNumber(currentDoc.version);
        }
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
        source_ids: selectedSourceIds.filter(id => id !== 'pathew-profile'),
        current_text: opportunityText,
        tone_preference: tone,
        preferred_language: language,
        word_limit: wordLimit,
        page_count: pageCount,
        manual_notes: {
          custom_question_notes: manualNotes.customQuestionNotes,
          leadership_achievements: manualNotes.leadershipAchievements,
          project_notes: manualNotes.projectNotes,
          additional_context: manualNotes.additionalContext,
        },
        custom_questions: customQuestions,
        career_gap: careerGap,
        career_gap_explanation: careerGapExplanation,
        experience_level: experienceLevel,
        cv_type: cvType,
        application_stage: applicationStage,
        project_anchor: projectAnchor,
        funder_values: funderValues,
        previous_app_history: {
          applied_before: previousAppHistory,
          feedback: previousAppFeedback
        },
        partners: {
          has_partner: hasPartner,
          partner_name: partnerName,
          partner_role: partnerRole
        },
        reporting_methods: reportingMethods
      }, user.id);

      // 2. Call Edge Function with action = "extract_context"
      const result = await PathewAssistantService.generateResponse({
        action: 'extract_context',
        sessionId,
        documentType,
        opportunityId: opportunityId || undefined,
        sourceIds: selectedSourceIds.filter(id => id !== 'pathew-profile'),
        tone,
        language,
        currentDraft: opportunityText, // pipe manually pasted opportunity text
        contextData: {
          useProfile: selectedSourceIds.includes('pathew-profile'),
          manualNotes,
          pageCount,
          wordLimit,
          customQuestions,
          careerGap,
          careerGapExplanation,
          experienceLevel,
          cvType,
          applicationStage,
          projectAnchor,
          funderValues,
          previousAppHistory: {
            applied_before: previousAppHistory,
            feedback: previousAppFeedback
          },
          partners: {
            has_partner: hasPartner,
            partner_name: partnerName,
            partner_role: partnerRole
          },
          reportingMethods
        }
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
        source_ids: selectedSourceIds.filter(id => id !== 'pathew-profile'),
        current_text: opportunityText,
        user_prompt: JSON.stringify(activeAnswers),
        tone_preference: tone,
        preferred_language: language,
        word_limit: wordLimit,
        page_count: pageCount,
        manual_notes: {
          custom_question_notes: manualNotes.customQuestionNotes,
          leadership_achievements: manualNotes.leadershipAchievements,
          project_notes: manualNotes.projectNotes,
          additional_context: manualNotes.additionalContext,
        },
        custom_questions: customQuestions,
        career_gap: careerGap,
        career_gap_explanation: careerGapExplanation,
        experience_level: experienceLevel,
        cv_type: cvType,
        application_stage: applicationStage,
        project_anchor: projectAnchor,
        funder_values: funderValues,
        previous_app_history: {
          applied_before: previousAppHistory,
          feedback: previousAppFeedback
        },
        partners: {
          has_partner: hasPartner,
          partner_name: partnerName,
          partner_role: partnerRole
        },
        reporting_methods: reportingMethods
      }, user.id);

      const result = await PathewAssistantService.generateResponse({
        action: 'generate_draft',
        sessionId: activeSessionId,
        documentType,
        opportunityId: opportunityId || undefined,
        sourceIds: selectedSourceIds.filter(id => id !== 'pathew-profile'),
        missingFieldsAnswers: activeAnswers,
        tone,
        language,
        currentDraft: draftContent || opportunityText,
        contextData: {
          useProfile: selectedSourceIds.includes('pathew-profile'),
          manualNotes: {
            ...manualNotes,
            additionalContext: (manualNotes.additionalContext || '') + 
              "\n\nCRITICAL FORMATTING INSTRUCTION: The very first lines of your generated draft MUST be the header in EXACTLY this markdown format:\n# [User's Full Name]\n## [Professional Title]\n### [Email] • [Phone] • [Location] • [LinkedIn]\nDo not put anything before the # [User's Name]. Do not include any other markdown before it. Use exactly one # for the name, two ## for the title, and three ### for the contact info."
          },
          pageCount,
          wordLimit,
          customQuestions,
          careerGap,
          careerGapExplanation,
          experienceLevel,
          cvType,
          applicationStage,
          projectAnchor,
          funderValues,
          previousAppHistory: {
            applied_before: previousAppHistory,
            feedback: previousAppFeedback
          },
          partners: {
            has_partner: hasPartner,
            partner_name: partnerName,
            partner_role: partnerRole
          },
          reportingMethods
        }
      });

      if (result.error) {
        throw new Error(result.error);
      }

      let finalDraft = result.draft;
      let finalMatchSummary = result.matchSummary || { strongMatches: [], gaps: [], priorityPoints: [] };
      let finalEditingSuggestions = result.editingSuggestions || [];
      let finalEstimatedPages = result.estimatedPages || 1;

      // Fallback: If edge function failed to parse the JSON due to unescaped newlines or markdown wraps
      if (finalDraft && finalDraft.includes('"draft"')) {
        console.warn("Detected raw JSON in draft, attempting robust extraction...");
        try {
          let cleanStr = finalDraft.replace(/```json/gi, '').replace(/```/g, '').trim();
          try {
            const parsed = JSON.parse(cleanStr);
            if (parsed.draft) {
              finalDraft = parsed.draft;
              if (parsed.matchSummary) finalMatchSummary = parsed.matchSummary;
              if (parsed.editingSuggestions) finalEditingSuggestions = parsed.editingSuggestions;
              if (parsed.estimatedPages) finalEstimatedPages = parsed.estimatedPages;
            }
          } catch (err) {
            // Attempt to extract the draft text safely via regex if JSON parse still fails
            // This matches the draft string even if matchSummary is missing
            let draftMatch = cleanStr.match(/"draft"\s*:\s*"([\s\S]*?)"(?:\s*,\s*"|\s*\})/);
            
            if (!draftMatch) {
              // If it's completely truncated at the end of the string
              draftMatch = cleanStr.match(/"draft"\s*:\s*"([\s\S]*)/);
              if (draftMatch && draftMatch[1]) {
                draftMatch[1] = draftMatch[1].replace(/"\s*\}?\s*$/, ''); // strip trailing quote if it exists
              }
            }

            if (draftMatch && draftMatch[1]) {
              finalDraft = draftMatch[1];
              // Unescape any escaped newlines just in case
              finalDraft = finalDraft.replace(/\\n/g, '\n').replace(/\\"/g, '"');
            }
            
            const pagesMatch = cleanStr.match(/"estimatedPages"\s*:\s*(\d+)/);
            if (pagesMatch && pagesMatch[1]) {
              finalEstimatedPages = parseInt(pagesMatch[1], 10);
            }
          }
        } catch (e) {
          console.error("Robust extraction failed", e);
        }
      }

      // Final robust cleanup for escaped newlines and markdown wrappers
      finalDraft = finalDraft
        .replace(/^```(markdown|json|text)?\n?/i, '')
        .replace(/```$/i, '')
        .replace(/\\n/g, '\n')
        .replace(/\\"/g, '"')
        .trim();

      setDraftContent(finalDraft);
      setMatchSummary(finalMatchSummary);
      setEditingSuggestions(finalEditingSuggestions);
      setEstimatedPages(finalEstimatedPages);
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
        sourceIds: selectedSourceIds.filter(id => id !== 'pathew-profile'),
        missingFieldsAnswers: missingAnswers,
        tone,
        language,
        currentDraft: draftContent,
        contextData: {
          useProfile: selectedSourceIds.includes('pathew-profile'),
          manualNotes: {
            ...manualNotes,
            additionalContext: manualNotes.additionalContext || ''
          },
          pageCount,
          wordLimit,
          customQuestions,
          careerGap,
          careerGapExplanation,
          experienceLevel,
          cvType,
          applicationStage,
          projectAnchor,
          funderValues,
          previousAppHistory: {
            applied_before: previousAppHistory,
            feedback: previousAppFeedback
          },
          partners: {
            has_partner: hasPartner,
            partner_name: partnerName,
            partner_role: partnerRole
          },
          reportingMethods
        }
      });

      if (result.error) {
        throw new Error(result.error);
      }

      let finalDraft = result.draft;
      let finalMatchSummary = result.matchSummary || matchSummary;
      let finalEditingSuggestions = result.editingSuggestions || editingSuggestions;
      let finalEstimatedPages = result.estimatedPages || estimatedPages;

      // Fallback: If edge function failed to parse the JSON
      if (finalDraft && finalDraft.includes('"draft":') && (finalDraft.includes('"matchSummary"') || finalDraft.includes('matchSummary'))) {
        console.warn("Detected raw JSON in draft, attempting robust extraction...");
        try {
          let cleanStr = finalDraft.replace(/```json/gi, '').replace(/```/g, '').trim();
          try {
            const parsed = JSON.parse(cleanStr);
            if (parsed.draft) {
              finalDraft = parsed.draft;
              if (parsed.matchSummary) finalMatchSummary = parsed.matchSummary;
              if (parsed.editingSuggestions) finalEditingSuggestions = parsed.editingSuggestions;
              if (parsed.estimatedPages) finalEstimatedPages = parsed.estimatedPages;
            }
          } catch (err) {
            let draftMatch = cleanStr.match(/"draft"\s*:\s*"([\s\S]*?)"(?:\s*,\s*"|\s*\})/);
            
            if (!draftMatch) {
              draftMatch = cleanStr.match(/"draft"\s*:\s*"([\s\S]*)/);
              if (draftMatch && draftMatch[1]) {
                draftMatch[1] = draftMatch[1].replace(/"\s*\}?\s*$/, '');
              }
            }

            if (draftMatch && draftMatch[1]) {
              finalDraft = draftMatch[1];
              finalDraft = finalDraft.replace(/\\n/g, '\n').replace(/\\"/g, '"');
            }
            
            const pagesMatch = cleanStr.match(/"estimatedPages"\s*:\s*(\d+)/);
            if (pagesMatch && pagesMatch[1]) {
              finalEstimatedPages = parseInt(pagesMatch[1], 10);
            }
          }
        } catch (e) {
          console.error("Robust extraction failed", e);
        }
      }

      // Final robust cleanup for escaped newlines and markdown wrappers
      finalDraft = finalDraft
        .replace(/^```(markdown|json|text)?\n?/i, '')
        .replace(/```$/i, '')
        .replace(/\\n/g, '\n')
        .replace(/\\"/g, '"')
        .trim();

      setDraftContent(finalDraft);
      if (finalMatchSummary) setMatchSummary(finalMatchSummary);
      if (finalEditingSuggestions) setEditingSuggestions(finalEditingSuggestions);
      setEstimatedPages(finalEstimatedPages);
      
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
        manual_notes: {
          custom_question_notes: manualNotes.customQuestionNotes,
          leadership_achievements: manualNotes.leadershipAchievements,
          project_notes: manualNotes.projectNotes,
          additional_context: manualNotes.additionalContext,
        },
        custom_questions: customQuestions,
        career_gap: careerGap,
        career_gap_explanation: careerGapExplanation,
        experience_level: experienceLevel,
        cv_type: cvType,
        application_stage: applicationStage,
        project_anchor: projectAnchor,
        funder_values: funderValues,
        previous_app_history: {
          applied_before: previousAppHistory,
          feedback: previousAppFeedback
        },
        partners: {
          has_partner: hasPartner,
          partner_name: partnerName,
          partner_role: partnerRole
        },
        reporting_methods: reportingMethods
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
    manualNotes,
    setManualNotes,

    // CV Builder states
    careerGap,
    setCareerGap,
    careerGapExplanation,
    setCareerGapExplanation,
    experienceLevel,
    setExperienceLevel,
    cvType,
    setCvType,

    // Cover Letter states
    applicationStage,
    setApplicationStage,
    projectAnchor,
    setProjectAnchor,

    // Grant Builder states
    funderValues,
    setFunderValues,
    previousAppHistory,
    setPreviousAppHistory,
    previousAppFeedback,
    setPreviousAppFeedback,
    hasPartner,
    setHasPartner,
    partnerName,
    setPartnerName,
    partnerRole,
    setPartnerRole,
    reportingMethods,
    setReportingMethods,
    customQuestions,
    setCustomQuestions,
    
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
    estimatedPages,
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
