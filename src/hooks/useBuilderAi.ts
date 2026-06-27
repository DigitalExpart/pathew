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
  const { user } = useAuth();
  
  // Builder configuration states
  const [stage, setStage] = useState<BuilderStage>('sources');
  const [documentType, setDocumentType] = useState<string>(defaultDocumentType);
  const [opportunityId, setOpportunityId] = useState<string | null>(initialOpportunityId || null);
  const [opportunityText, setOpportunityText] = useState<string>('');
  const [selectedSourceIds, setSelectedSourceIds] = useState<string[]>([]);
  const [tone, setTone] = useState<string>('Professional (formal)');
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
    matchScore?: number;
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
    const cvTypeRules: Record<string, string> = {
      "Work CV": `
CV TYPE: WORK CV (Standard Corporate Layout)

SECTION ORDER — follow exactly:
1. CONTACT HEADER
   - Full name, professional title, email, phone, LinkedIn, location (city only)
   - No photo, no DOB, no marital status

2. PROFESSIONAL SUMMARY
   - 4–6 sentences, paragraph form — NOT bullets
   - Cover: who you are → key strength → value proposition → career direction
   - Tailored and specific — never generic

3. KEY ACHIEVEMENTS (optional — include if user has strong metrics)
   - 4–6 bullets with quantified impact
   - Format: Action + Method + Result with number

4. CORE SKILLS
   - 10–16 items in a grid or grouped list
   - Mix hard and soft skills
   - No proficiency bars

5. WORK EXPERIENCE ← MOST IMPORTANT
   - Reverse chronological
   - Each role header on ONE line: Job Title | Company | Location | Mon YYYY – Mon YYYY
   - NO introductory sentences or paragraphs under the role header
   - Generate enough bullets to fill the target page count
   - Each bullet must be strictly achievement-focused and start with an action verb
   - Each bullet must be one simple sentence with NO commas
   - Keep each bullet concise (maximum two lines)

6. EDUCATION
   - One line per qualification: Degree | Institution | Year | Grade
   - No modules, no thesis details

7. CERTIFICATIONS
   - Bullet list, reverse chronological

8. TOOLS & TECHNOLOGIES
   - Grouped by category

9. LANGUAGES
   - Inline or short list with proficiency level

10. CONFERENCE PRESENTATIONS
    - Bullet list, if applicable
    - Format: "Title." Event, Location, Year.

11. REFERENCES
    - "References available on request"

STRICT RULES:
- No Academic Profile section
- No Publications section
- No named references
- Action verbs only for bullets
- Quantify everything possible`,

      "Teaching / Academic CV": `
CV TYPE: TEACHING / ACADEMIC CV (Rigid Academic Sections)

SECTION ORDER — follow exactly:
1. CONTACT HEADER
   - Name, academic title, institution/department, institutional email, phone, location
   - Include ORCID ID if provided

2. EDUCATION
   - Brief — one line per qualification
   - Format: Degree | Institution | Year | Grade
   - Reverse chronological
   - NO thesis titles, NO supervisor names, NO module lists

3. WORK EXPERIENCE
   - Reverse chronological
   - Each role header on ONE line: Job Title | Institution | Location | Mon YYYY – Mon YYYY
   - NO descriptions — titles and dates ONLY

4. TEACHING EXPERIENCE
   - Bullet list
   - Each bullet = one course or teaching role
   - Must include class size if provided
   - Must state role type: sole instructor / teaching assistant / lab demonstrator
   - Include undergraduate/postgraduate level

5. ADMINISTRATIVE EXPERIENCE
   - Bullet list
   - Only admin tied to academic work: dissertation supervision, exam invigilation,
     data/records management, timetabling, committee roles
   - State scope: number of students, years covered, scale

6. RESEARCH EXPERIENCE
   - Bullet list
   - Each bullet: your role | project title | funder | Mon YYYY – Mon YYYY

7. PUBLICATIONS
   - Numbered list, APA format
   - Bold the candidate's name in every citation
   - Subdivide into:
     a. Peer-Reviewed Journal Articles
     b. Book Chapters
     c. Books / Monographs
     d. Under Review / In Press
   - Write "Publications in progress" if none provided

8. CONFERENCE PRESENTATIONS
   - Numbered list
   - Format: Author (Year). "Title." Event, Location.

9. GRANTS & FUNDING
   - Table: Grant Name | Awarding Body | Amount | Year

10. PROFESSIONAL MEMBERSHIPS
    - Bullet or inline list with year joined

11. AWARDS & HONOURS
    - Bullet list, reverse chronological

12. SKILLS & LANGUAGES
    - Brief — tools, software, languages with proficiency

13. CERTIFICATIONS
    - Bullet list, reverse chronological

14. REFERENCES
    - "References available on request"

STRICT RULES:
- NO Academic Profile or Personal Statement section
- NO named references
- Teaching must show class sizes where provided
- Publications must be APA format with name bolded`
    };

    const experienceLevelMap: Record<string, string> = {
      "Graduate": `
EXPERIENCE LEVEL: Graduate
- Place Education immediately after Contact Header
- Highlight dissertation, final year projects, academic prizes
- Include all internships, part-time roles, society positions, volunteering
- Show degree classification prominently
- Skills section large and near top
- Summary should convey potential and ambition, not years of experience
- Do not pad — be honest about level, focus on transferable skills`,

      "Early Career": `
EXPERIENCE LEVEL: Early Career (1–3 years)
- Balance Education and Work Experience equally
- Highlight any promotions, expanded responsibilities, early wins
- Include all work including part-time and contract roles
- Skills section still prominent
- Summary should show trajectory and learning speed`,

      "Mid Career": `
EXPERIENCE LEVEL: Mid Career (3–8 years)
- Work Experience is the dominant section
- Education brief — degree, institution, year only, no grade unless exceptional
- Show clear career progression across roles
- Minimum 3 quantified achievements per role
- Skills should reflect specialisation
- Summary conveys expertise and professional identity`,

      "Senior": `
EXPERIENCE LEVEL: Senior (8+ years & leadership)
- Open with strong leadership-focused summary
- Emphasise team sizes led, budgets owned, strategic decisions
- Show scale of impact: revenue, departments, organisations
- Condense or omit roles older than 15 years
- Education is minimal — one line only
- Focus on outcomes, not duties`,

      "Executive": `
EXPERIENCE LEVEL: Executive (Director/C-level)
- Summary reads as a board-level value proposition
- Lead with executive roles, board positions, governance experience
- Focus on transformation, P&L, organisational change
- Include advisory boards or non-executive directorships
- Remove all junior roles — last 10–15 years only
- Education is a single line only
- Every line must justify C-suite positioning`
    };

    const pagesMap: Record<number, string> = {
      1: `
PAGE TARGET: 1 PAGE — BE EXTREMELY CONCISE
- Include only: Contact Header, Summary (2 sentences), Skills, last 2 roles only, Education
- Cut every section that isn't critical
- Bullets maximum 3 per role
- Summary maximum 2 sentences
- This must feel tight and focused — not truncated`,

      2: `
PAGE TARGET: 2 PAGES — STANDARD LENGTH
- Include all core sections fully
- 4–5 bullets per work experience role
- Full skills section
- Complete education
- This is the standard professional CV length — fill both pages properly`,

      3: `
PAGE TARGET: 3 PAGES — EXTENDED FORMAT
- YOU MUST FILL 3 FULL PAGES — do not stop early
- Include all sections with full detail
- 5–6 bullets per work experience role — elaborate on impact and method
- Expand the Professional Summary to 6–8 sentences
- Add a Key Achievements section with 6–8 bullets if not already present
- Include all certifications, tools, languages in full
- Education can include relevant modules or distinctions if available
- If the user has publications or presentations, include them
- Do not leave white space — use all 3 pages`,

      4: `
PAGE TARGET: 4 PAGES — COMPREHENSIVE FORMAT
- YOU MUST FILL 4 FULL PAGES — do not stop at 1 or 2 pages
- Every section must be fully expanded and detailed
- Work Experience: 6–8 bullets per role with full context, method, and measurable outcome
- Professional Summary: 8–10 sentences — career narrative, philosophy, key strengths, value
- Key Achievements: 8–10 bullets with strong metrics
- Core Skills: 20+ skills grouped by category
- Include ALL certifications, ALL tools, ALL languages
- Add Career Highlights or Notable Projects section if space allows
- Elaborate on each job scope with 2–3 sentences before bullets
- Education can include relevant coursework, distinctions, or awards
- Do not truncate any section — expand every item fully
- The output must be long, detailed and comprehensive — 4 full pages of content`,

      5: `
PAGE TARGET: 5 PAGES — EXHAUSTIVE FORMAT
- YOU MUST FILL 5 FULL PAGES — do not stop early under any circumstances
- This is the most comprehensive CV format — include everything
- Work Experience: 8–10 bullets per role with full narrative context
- Professional Summary: 10–12 sentences
- Key Achievements: 10–12 high-impact bullets
- Every section must be present and fully expanded
- Add all optional sections: Notable Projects, Publications, Conferences, 
  Community/Volunteering, Board Positions, Speaking Engagements
- Skills: comprehensive grouped list of 25+ items
- Certifications: every certification with issuing body and year
- Do not summarise or condense anything — write in full detail throughout
- The output must be exhaustive — 5 full pages minimum`
    };

    const toneMap: Record<string, string> = {
      "N/A": `TONE: Neutral, clear, standard professional CV language.`,

      "Professional (formal)": `
TONE: Professional (formal)
- Formal polished language — no slang, no contractions
- Implied third person — no "I" or "my"
- Strong precise vocabulary throughout
- Every sentence must earn its place — no filler
- Replace weak phrases: never "responsible for" → always "led", "delivered", "drove"`,
      "Professional": `
TONE: Professional (formal)
- Formal polished language — no slang, no contractions
- Implied third person — no "I" or "my"
- Strong precise vocabulary throughout
- Every sentence must earn its place — no filler
- Replace weak phrases: never "responsible for" → always "led", "delivered", "drove"`,

      "Academic": `
TONE: Academic
- Scholarly, measured, precise language
- Discipline-appropriate terminology where relevant
- No corporate buzzwords
- Passive and active voice mixed naturally as in academic writing
- Research and teaching descriptions should convey intellectual authority`,

      "Creative (story-driven)": `
TONE: Creative (story-driven)
- Summary reads as a compelling career narrative
- Vivid, specific, original language — no clichés
- Show personality while staying professional
- Experience descriptions tell a story of growth, challenge, impact
- The CV should feel human, not template-generated`,
      "Creative": `
TONE: Creative (story-driven)
- Summary reads as a compelling career narrative
- Vivid, specific, original language — no clichés
- Show personality while staying professional
- Experience descriptions tell a story of growth, challenge, impact
- The CV should feel human, not template-generated`,

      "Concise (short high-signal bullets)": `
TONE: Concise (high-signal bullets)
- Every line earns its place — remove all filler ruthlessly
- Bullets one line maximum
- Summary maximum 2 sentences
- Use numbers and metrics aggressively
- Remove: "responsible for", "worked closely with", "helped to", "assisted in"
- If it doesn't add signal, delete it`,
      "Concise": `
TONE: Concise (high-signal bullets)
- Every line earns its place — remove all filler ruthlessly
- Bullets one line maximum
- Summary maximum 2 sentences
- Use numbers and metrics aggressively
- Remove: "responsible for", "worked closely with", "helped to", "assisted in"
- If it doesn't add signal, delete it`,

      "Casual (Friendly and warm)": `
TONE: Casual (friendly and warm)
- Approachable, human, personable — still professional
- Contractions acceptable: I've, you'll, we delivered
- Show genuine enthusiasm and personality
- Avoid stiff corporate language
- Reader should feel like they're meeting a real person`,
      "Casual": `
TONE: Casual (friendly and warm)
- Approachable, human, personable — still professional
- Contractions acceptable: I've, you'll, we delivered
- Show genuine enthusiasm and personality
- Avoid stiff corporate language
- Reader should feel like they're meeting a real person`
    };

    const languageMap: Record<string, string> = {
      "UK English": `
LANGUAGE: British English throughout.
Spelling: programme, organise, colour, behaviour, centre, travelling, defence, catalogue.
Vocabulary: CV (not résumé), mobile (not cell), post (not mail), holiday (not vacation).`,
      "English (UK)": `
LANGUAGE: British English throughout.
Spelling: programme, organise, colour, behaviour, centre, travelling, defence, catalogue.
Vocabulary: CV (not résumé), mobile (not cell), post (not mail), holiday (not vacation).`,

      "US English": `
LANGUAGE: American English throughout.
Spelling: program, organize, color, behavior, center, traveling, defense, catalog.
Vocabulary: résumé (not CV), cell phone, mail, vacation.`,
      "English (US)": `
LANGUAGE: American English throughout.
Spelling: program, organize, color, behavior, center, traveling, defense, catalog.
Vocabulary: résumé (not CV), cell phone, mail, vacation.`,

      "French": `
LANGUAGE: Write the ENTIRE CV in French (Français). Formal register throughout.
Headers: "Expérience professionnelle", "Formation", "Compétences", "Langues", "Références disponibles sur demande".
Dates: janvier, février, mars etc. Full document in French — no English words.`,

      "German": `
LANGUAGE: Write the ENTIRE CV in German (Deutsch). Formal Sie-register throughout.
Headers: "Berufserfahrung", "Ausbildung", "Kenntnisse", "Sprachen", "Referenzen auf Anfrage".
Include DOB, nationality, marital status in header if user provided them.
Dates: DD.MM.YYYY format. Full document in German — no English words.`,

      "Spanish": `
LANGUAGE: Write the ENTIRE CV in Spanish (Español). Formal usted-register throughout.
Headers: "Experiencia profesional", "Formación académica", "Habilidades", "Idiomas", "Referencias disponibles bajo petición".
Dates: DD/MM/YYYY. Full document in Spanish — no English words.`
    };

    const formattingRules = `
FORMATTING RULES — never break these:

JOB HEADER — always one single line:
Job Title | Company Name | Location | Mon YYYY – Mon YYYY
Example: Data Analyst | Accenture | London, UK | Mar 2021 – Present
Example: Operations Manager | SheltercareFM | Lagos, Nigeria (Hybrid) | Jan 2019 – Aug 2022

NEVER:
- Put dates on a separate line
- Put location on a separate line
- Wrap dates or locations in asterisks (*text*)
- Use colored text markers
- Mix bullet styles — pick one and use it throughout

BULLETS:
- Use ONLY (–) dash for every bullet in the entire document
- Never mix (•) and (–) and (-) — one style only
- Every bullet starts with a strong action verb

DATES:
- Always inline, never isolated on their own line
- Format: Mon YYYY – Mon YYYY (Jan 2019 – Aug 2022)
- Current roles: Jan 2023 – Present
- Never style dates differently from surrounding text

SPACING:
- One blank line between each job role
- No blank line between job header and its bullets
- Consistent spacing throughout

OUTPUT:
- Plain text or clean markdown only
- No HTML tags
- No asterisk wrapping (*Lagos*)
- No special styling characters
- Section headers in ALL CAPS or **Bold**`;

    return { cvTypeRules, experienceLevelMap, pagesMap, toneMap, languageMap, formattingRules };
  };

  // Helper: Build robust prompt instructions locally to avoid needing edge function changes
  const buildEnhancedContext = (isGeneration: boolean = false, forceGaps: boolean = false) => {
    const { cvTypeRules, experienceLevelMap, pagesMap, toneMap, languageMap, formattingRules } = buildSystemPromptMaps();
    let ctx = '';
    
    if (opportunityText) {
      ctx += `Target Opportunity / Job Description:\n${opportunityText}\n\n`;
    }
    
    if (builderType === 'cv' || documentType === 'CV') {
      ctx += `You are generating a ${cvType.toUpperCase()}.\n\n`;
      
      ctx += `${cvTypeRules[cvType] || cvTypeRules["Work CV"]}\n\n`;
      ctx += `${experienceLevelMap[experienceLevel] || experienceLevelMap["Mid Career"]}\n\n`;
      const getPageInstructions = (targetPages: number) => {
        if (pagesMap[targetPages]) return pagesMap[targetPages];
        return `
PAGE TARGET: ${targetPages} PAGES — MASSIVELY EXHAUSTIVE FORMAT
- YOU MUST FILL ${targetPages} FULL PAGES — do not stop early under any circumstances.
- This is an exceptionally long and comprehensive document.
- Include exhaustive detail for every single section.
- Expand all arguments, narratives, metrics, and achievements to the maximum extent.
- Do not summarize or condense anything.
- Leave no white space — use all ${targetPages} pages.
- The output must be exceptionally long and detailed — ${targetPages} full pages minimum.`;
      };

      ctx += `${getPageInstructions(pageCount)}\n\n`;
      ctx += `${toneMap[tone] || toneMap["N/A"]}\n\n`;
      ctx += `${languageMap[language] || languageMap["UK English"]}\n\n`;
      ctx += `${formattingRules}\n\n`;
      
      ctx += `ABSOLUTE RULES — never break these:
- Follow the CV Type structure exactly — never invent sections not listed
- Never mix Work CV and Academic CV formats
- Strictly achieve the requested page length. If a high page count is requested, you MUST generate enough exhaustive content to hit the target length. Do not just stop early.
- Apply the tone consistently from the first word to the last
- Write the entire CV in the specified language — no switching
- Output CV content only — no explanations, no commentary, no preamble
- Section headers should be in BOLD or ALL CAPS
- Never use asterisks to wrap text
- Never put dates or locations on their own line
- Use only (–) dash for all bullets throughout\n\n`;
    }
    
    if (manualNotes.additionalContext) {
      ctx += `\nUSER ADDITIONAL CONTEXT:\n${manualNotes.additionalContext}\n`;
    }
    
    if (forceGaps) {
      ctx += `\nCRITICAL INSTRUCTION: The user explicitly requested to see progressive gaps and provide manual input. You MUST identify at least 3 critical gaps, weaknesses, or missing qualifications in their profile compared to the target opportunity. For EACH gap, you MUST create an object in the 'missingFields' JSON array so the user can manually provide the missing information. Ensure 'type' is 'textarea' and 'description' asks them how they can address this gap.\n`;
    }
    
    if (isGeneration) {
      ctx += "\n\nCRITICAL FORMATTING INSTRUCTION: The very first lines of your generated draft MUST be the header in EXACTLY this markdown format:\n# [User's Full Name]\n## [Professional Title]\n### [Email] • [Phone] • [Location]\nDo not put anything before the # [User's Name]. Do not include any other markdown before it. Use exactly one # for the name, two ## for the title, and three ### for the contact info.";
    }
    
    return ctx;
  };

  // 1. EXTRACT CONTEXT & GAP ANALYSIS
  const startExtraction = async (forceAction?: 'gaps' | 'generate') => {
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
        task: forceAction === 'generate' ? `Direct Generation for ${documentType}` : `Gap Analysis for ${documentType}`,
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
      const result = await PathewAssistantService.streamResponse({
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
            additionalContext: buildEnhancedContext(false, forceAction === 'gaps')
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

      setMatchSummary({
        ...(result.matchSummary || { strongMatches: [], gaps: [], priorityPoints: [] }),
        matchScore: result.matchScore
      });
      let mf = result.missingFields || [];
      if (forceAction === 'gaps' && mf.length === 0) {
        if (result.matchSummary?.gaps && result.matchSummary.gaps.length > 0) {
          mf = result.matchSummary.gaps.map((gap: string, i: number) => ({
            key: `gap_auto_${i}`,
            label: `Address Gap: ${gap.substring(0, 30)}...`,
            type: 'textarea',
            description: gap
          }));
        } else {
          mf = [{
            key: 'additional_context',
            label: 'Additional Qualifications & Context',
            type: 'textarea',
            description: 'We did not find any critical gaps! However, you can manually provide any additional unlisted experience, metrics, or notes here to strengthen the final draft.'
          }];
        }
      }
      setMissingFields(mf);
      setSessionId(result.sessionId);
      
      await BuilderService.updateBuilderRequestStatus(requestLog.id, 'success');

      // Move stage based on user choice
      if (forceAction === 'generate') {
        // User explicitly asked to skip gaps and generate
        await generateTailoredDraft(result.sessionId, {});
      } else if (forceAction === 'gaps' || (result.missingFields && result.missingFields.length > 0)) {
        // Show the missing/gap analysis page
        setStage('missing');
      } else {
        // No missing fields and no forced action - generate directly
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

      let accumulatedDraft = '';
      if (!sid) setDraftContent(''); // Clear draft only if it's a new generation

      const result = await PathewAssistantService.streamResponse({
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
      }, (chunk) => {
        accumulatedDraft += chunk;
        let display = accumulatedDraft;
        if (display.includes('<draft>')) display = display.split('<draft>')[1];
        if (display.includes('</draft>')) display = display.split('</draft>')[0];
        if (!display.includes('<metadata>')) {
          setDraftContent(display);
        }
      });

      if (result.error) {
        throw new Error(result.error);
      }

      setMatchSummary(result.matchSummary || { strongMatches: [], gaps: [], priorityPoints: [] });
      setEditingSuggestions(result.editingSuggestions || []);
      setEstimatedPages(result.estimatedPages || 1);
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
      let accumulatedDraft = '';

      const result = await PathewAssistantService.streamResponse({
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
      }, (chunk) => {
        accumulatedDraft += chunk;
        let display = accumulatedDraft;
        if (display.includes('<draft>')) display = display.split('<draft>')[1];
        if (display.includes('</draft>')) display = display.split('</draft>')[0];
        if (!display.includes('<metadata>')) {
          setDraftContent(display);
        }
      });

      if (result.error) {
        throw new Error(result.error);
      }

      let finalDraft = result.draft;
      let finalMatchSummary = result.matchSummary || matchSummary;
      let finalEditingSuggestions = result.editingSuggestions || editingSuggestions;
      let finalEstimatedPages = result.estimatedPages || estimatedPages;

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
