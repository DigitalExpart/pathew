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
  const [tone, setTone] = useState<string>(profile?.assistant_settings?.tone || 'Professional (formal)');
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

  // ── MAPS (Defined inside the hook or outside) ──
  const buildSystemPromptMaps = () => {
    const experienceLevelMap: Record<string, string> = {
      "Graduate": `EXPERIENCE LEVEL: Graduate (Academic highlights & entry roles)\n- Place Education section immediately after Contact Header\n- Highlight dissertation, final year projects, academic achievements\n- Include all internships, part-time jobs, society roles, volunteering\n- Show GPA or degree classification prominently if strong\n- Skills section should be large and near the top to compensate for limited work history\n- Summary should convey ambition and potential, not experience\n- Do not pad roles — be honest about level, focus on transferable skills`,
      "Early Career": `EXPERIENCE LEVEL: Early Career (1–3 years experience)\n- Balance Education and Work Experience with roughly equal weight\n- Highlight any promotions, new responsibilities, or fast progression\n- Include all work experience including part-time or contract roles\n- Skills section still prominent\n- Summary should show trajectory and momentum`,
      "Mid Career": `EXPERIENCE LEVEL: Mid Career (3–8 years experience)\n- Work Experience is now the dominant section\n- Education should be brief — no grade unless exceptional\n- Show clear career progression across roles\n- Minimum 2–3 quantified achievements per role\n- Skills should reflect specialisation, not just basics\n- Summary should convey expertise and direction`,
      "Senior": `EXPERIENCE LEVEL: Senior (8+ years experience & leadership)\n- Open with a strong leadership-focused summary\n- Emphasise team sizes led, budgets owned, strategic decisions made\n- Show scale of impact: revenue influenced, departments managed\n- Roles older than 15 years can be condensed into one line or omitted\n- Education is minimal — degree, institution, year only\n- No need to list every responsibility — focus on outcomes`,
      "Executive": `EXPERIENCE LEVEL: Executive (Director/C-level corporate governance)\n- Summary should read like a board-level value proposition\n- Lead with executive roles, board positions, governance experience\n- Focus on corporate transformation, P&L ownership, organisational change\n- Include advisory boards or non-executive directorships if any\n- Remove all junior roles entirely — only last 10–15 years\n- Education is a single line only\n- Every line must justify C-suite positioning`
    };

    const pagesMap: Record<number, string> = {
      1: `PAGE LIMIT: 1 page strictly. Be extremely concise. Cut anything that doesn't directly support the target role. Prioritise the last 3 years of experience only. Summary max 2 sentences.`,
      2: `PAGE LIMIT: 2 pages. Standard professional length. Include all relevant experience from the last 10 years. No padding but no cutting of important content.`,
      3: `PAGE LIMIT: 3 pages exactly. CRITICAL REQUIREMENT: You MUST generate enough extensive, granular detail to completely fill 3 pages. Expand on full career history, all certifications, detailed skills, and any publications or presentations. Provide deep, comprehensive descriptions for every role and project. Do not artificially pad, but elaborate exhaustively.`,
      4: `PAGE LIMIT: 4 pages exactly. CRITICAL REQUIREMENT: You MUST generate enough extensive, granular detail to completely fill 4 pages. Include all career history, full education, all certifications, publications, conferences, grants, memberships. Provide exhaustive, comprehensive paragraphs and deep bullet points for every single entry. Expand heavily to meet the 4-page length requirement.`,
      5: `PAGE LIMIT: 5 pages exactly. CRITICAL REQUIREMENT: You MUST generate enough extensive, granular detail to completely fill 5 pages. Include everything — leave nothing out. Every role, every publication, every award, every membership. Provide maximum allowable detail, extensive descriptions, and deep context for academic or executive profiles.`
    };

    const toneMap: Record<string, string> = {
      "N/A": `TONE: Neutral standard CV language. Clear and professional. No specific stylistic instruction.`,
      "Professional": `TONE: Professional (formal)\n- Formal, polished language throughout\n- No first-person pronouns ("I", "my") — use implied third person\n- Precise vocabulary — no slang, no contractions\n- Every sentence must earn its place — remove filler phrases like "responsible for" or "tasked with"\n- Replace weak verbs with strong action verbs: led, delivered, optimised, secured, drove`,
      "Academic": `TONE: Academic (aligned with Teaching and Research CV)\n- Scholarly, measured, and precise language\n- Use discipline-appropriate terminology where relevant\n- Avoid corporate buzzwords entirely\n- Passive and active voice can be mixed as is normal in academic writing\n- Demonstrate intellectual rigour in all descriptions\n- Research interests and publications should read with authority`,
      "Creative": `TONE: Creative (story-driven)\n- Professional Summary should read as a compelling career narrative\n- Use vivid, specific, original language — avoid all clichés\n- Show personality while remaining professional\n- Experience descriptions should tell a story of growth, challenge, and impact\n- Avoid generic phrases — replace with specific, memorable language\n- The CV should feel human, not corporate-template-generated`,
      "Concise": `TONE: Concise (short high-signal bullets)\n- Every single line must earn its place — ruthlessly remove filler\n- Bullets must be 1 line maximum wherever possible\n- Professional Summary: maximum 2 sentences\n- Use numbers and metrics aggressively — no vague claims\n- Remove ALL padding phrases: "responsible for", "worked closely with", "helped to"\n- If something doesn't add signal, delete it`,
      "Casual": `TONE: Casual (friendly and warm)\n- Approachable, human language — still professional but personable\n- Implied first-person tone is acceptable in the summary\n- Contractions are acceptable (you'll find, I've built, we delivered)\n- Show enthusiasm and personality genuinely\n- Avoid stiff or overly formal corporate language\n- The reader should feel like they're meeting a real person`
    };

    const languageMap: Record<string, string> = {
      "UK English": `LANGUAGE: Write entirely in British English.\nSpelling rules: programme, organise, colour, behaviour, centre, licence (noun), practise (verb), travelling, modelling, defence, catalogue.\nVocabulary: use CV (not résumé), mobile (not cell phone), post (not mail), holiday (not vacation).`,
      "US English": `LANGUAGE: Write entirely in American English.\nSpelling rules: program, organize, color, behavior, center, license, practice, traveling, modeling, defense, catalog.\nVocabulary: use résumé (not CV), cell phone (not mobile), mail (not post), vacation (not holiday).`,
      "French": `LANGUAGE: Write the entire CV in French (Français).\nUse formal French register throughout (vous-form implied).\nStandard French CV terminology: "Expérience professionnelle", "Formation", "Compétences", "Langues", "Références disponibles sur demande".\nDate format: month written out (janvier, février etc).\nDo not mix English and French — the entire document must be in French.`,
      "German": `LANGUAGE: Write the entire CV in German (Deutsch).\nUse formal German register throughout (Sie-form implied).\nStandard German CV terminology: "Berufserfahrung", "Ausbildung", "Kenntnisse", "Sprachen", "Referenzen auf Anfrage".\nGerman CVs typically include: date of birth, nationality, marital status in the header — include these if the user has provided them.\nDate format: DD.MM.YYYY\nDo not mix English and German — the entire document must be in German.`,
      "Spanish": `LANGUAGE: Write the entire CV in Spanish (Español).\nUse formal Spanish register (usted-form implied).\nStandard Spanish CV terminology: "Experiencia profesional", "Formación académica", "Habilidades", "Idiomas", "Referencias disponibles bajo petición".\nDate format: DD/MM/YYYY\nDo not mix English and Spanish — the entire document must be in Spanish.`
    };

    return { experienceLevelMap, pagesMap, toneMap, languageMap };
  };

  // Helper: Build robust prompt instructions locally to avoid needing edge function changes
  const buildEnhancedContext = (isGeneration: boolean = false) => {
    const { experienceLevelMap, pagesMap, toneMap, languageMap } = buildSystemPromptMaps();
    let ctx = '';
    
    if (opportunityText) {
      ctx += `Target Opportunity / Job Description:\n${opportunityText}\n\n`;
    }
    
    if (builderType === 'cv' || documentType === 'CV') {
      ctx += `You are generating a ${cvType.toUpperCase()}.\n\n`;
      
      if (cvType === 'Teaching / Academic CV') {
        ctx += `CRITICAL FORMATTING RULES FOR ACADEMIC CV:
- Philosophy: Formal, comprehensive scholarship. Academic CVs can be 4–10+ pages. Focus on scholarship & credentials.
- Section Order & Priority:
  1. Contact Header (Include institutional email, department, university affiliation, ORCID ID)
  2. ACADEMIC PROFILE / RESEARCH INTERESTS (3–5 sentences, paragraph form. Covers: research specialization -> methodological approach -> current projects/interests)
  3. EDUCATION (Exhaustive detail. PhD in [Field] | University | YYYY. Include Thesis title, Supervisor name, Committee members, and honours/distinctions)
  4. WORK EXPERIENCE (All work experience, title and dates listed only. Paragraph + bullets if relevant)
  5. TEACHING EXPERIENCE (Course Code + Course Title + Level + Year. Bullet describing role: sole instructor, etc. Note class sizes)
  6. ADMINISTRATIVE EXPERIENCE (Include project supervision, invigilating exams, managing data)
  7. RESEARCH EXPERIENCE (Bulletin list)
  8. PUBLICATIONS (Numbered list, citation format APA/MLA, sub-divided into: Peer-Reviewed Journal Articles, Book Chapters, Books / Monographs, Under Review / In Press. Bold the candidate's name)
  9. CONFERENCE PRESENTATIONS (Numbered list)
  10. GRANTS & FUNDING (Table or list)
  11. PROFESSIONAL MEMBERSHIPS (Inline or list)
  12. AWARDS & HONOURS (List)
  13. SKILLS & LANGUAGES (Minor, near end)
  14. REFERENCES (Named referees included. 2-3 referees with Full name, title, institution, email, phone)
- Do not mix this format with a corporate Work CV format under any circumstance.\n\n`;
      } else {
        ctx += `CRITICAL FORMATTING RULES FOR WORK CV:
- Philosophy: Achievements-first, recruiter-scannable, ATS-optimized. Every section should answer "what value did you deliver?"
- Section Order & Priority:
  1. Contact Header (Name, Job Title, Email, Phone, LinkedIn, Location (city only), Portfolio/GitHub. NO photo, DOB, or marital status)
  2. PROFESSIONAL SUMMARY (3-4 sentences, paragraph form - NOT bullets. who you are -> key strength -> value proposition -> what you are seeking)
  3. CORE SKILLS / COMPETENCIES (8-16 items max, bullet list. Hard + soft skills mixed. NO proficiency bars)
  4. WORK EXPERIENCE (Most important section. Format per role: "Job Title | Company Name | City | Month YYYY - Month YYYY". Start with 1 sentence describing role scope, then 3-6 bullet points starting with strong action verbs showing impact/metrics. NO duty-style bullets)
  5. EDUCATION (Degree | Institution | Year. Brief, 1-2 lines per entry. NO modules/courses listed)
  6. CERTIFICATIONS & COURSES (Bullet list, reverse chronological: Certification Name | Issuing Body | Year)
  7. TOOLS & TECHNOLOGIES (Grouped tags or bullets)
  8. LANGUAGES (Inline or bullet)
  9. VOLUNTEER / EXTRA (Brief bullets - optional)\n\n`;
      }
      
      ctx += `${experienceLevelMap[experienceLevel] || experienceLevelMap["Mid Career"]}\n\n`;
      ctx += `${pagesMap[pageCount] || pagesMap[2]}\n\n`;
      ctx += `${toneMap[tone] || toneMap["N/A"]}\n\n`;
      ctx += `${languageMap[language] || languageMap["UK English"]}\n\n`;
      
      ctx += `ABSOLUTE RULES — never break these:
- Follow the CV Type structure exactly — never invent sections not listed
- Never mix Work CV and Academic CV formats
- Respect the page limit — do not exceed it
- Apply the tone consistently from the first word to the last
- Write the entire CV in the specified language — no switching
- Output CV content only — no explanations, no commentary, no preamble
- Section headers should be in BOLD or ALL CAPS\n\n`;

    
    if (manualNotes.additionalContext) {
      ctx += `\nUSER ADDITIONAL CONTEXT:\n${manualNotes.additionalContext}\n`;
    }
    
    if (isGeneration) {
      ctx += "\n\nCRITICAL FORMATTING INSTRUCTION: The very first lines of your generated draft MUST be the header in EXACTLY this markdown format:\n# [User's Full Name]\n## [Professional Title]\n### [Email] • [Phone] • [Location]\nDo not put anything before the # [User's Name]. Do not include any other markdown before it. Use exactly one # for the name, two ## for the title, and three ### for the contact info.";
    }
    
    return ctx;
  };

  // 1. EXTRACT CONTEXT & GAP ANALYSIS
  const startExtraction = async () => {
    if (!user) {
      setError('You must be signed in to perform this action.');
      return;
    }

    if (opportunityText && opportunityText.length > 12000) {
      setError(`The job description is too long (${opportunityText.length} characters). Please reduce it to under 12,000 characters to proceed.`);
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
        currentDraft: draftContent || undefined,
        contextData: {
          useProfile: selectedSourceIds.includes('pathew-profile'),
          manualNotes: {
            ...manualNotes,
            additionalContext: buildEnhancedContext(false)
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

    if (opportunityText && opportunityText.length > 12000) {
      setError(`The job description is too long (${opportunityText.length} characters). Please reduce it to under 12,000 characters to proceed.`);
      return;
    }

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
        currentDraft: draftContent || undefined,
        contextData: {
          useProfile: selectedSourceIds.includes('pathew-profile'),
          manualNotes: {
            ...manualNotes,
            additionalContext: buildEnhancedContext(true)
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
            additionalContext: buildEnhancedContext(false)
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
