import { promptTemplates } from '../data/promptTemplates';

export interface AIRequestContext {
  type: string;
  action: string;
  data: any;
  userCredits: number;
}

export interface AIResponse {
  success: boolean;
  text?: string;
  error?: string;
  creditsDeducted?: number;
}

export const aiService = {
  async generateResponse(context: AIRequestContext): Promise<AIResponse> {
    // 1. Credit Check
    if (context.userCredits < 10) {
      return { 
        success: false, 
        error: "Insufficient credits. You need at least 10 credits to generate AI content." 
      };
    }

    // 2. Simulate Network Latency
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 3. Simulate AI Generation Logic
    try {
      // In a real app, this would be an API call to OpenAI/Anthropic/Gemini
      // Here we simulate successful generation using our templates
      let generatedText = "";
      
      const { type, action, data } = context;
      const title = data?.title || 'the field';
      
      if (type === 'Pathew Assistance' && (action.toLowerCase().includes('preparation plan') || data?.duration)) {
        const duration = data?.duration || '90-day';
        const weeks = duration === 'Quick' ? 1 : (duration === '90-day' ? 12 : (duration === '180-day' ? 24 : 52));
        
        let planRows = "";
        for (let i = 1; i <= Math.min(weeks, 4); i++) {
          planRows += `### Week ${i}: Foundation & Core Skills\nFocus on mastering ${data?.gaps?.[0] || 'the core requirements'}. Complete introductory modules and setup development environment.\n\n`;
        }
        
        if (weeks > 4) {
          planRows += `... [Continues for ${weeks - 4} more weeks of advanced implementation, project building, and interview prep] ...\n\n`;
          planRows += `### Final Week (Week ${weeks}): Review & Application\nFinalize portfolio, conduct mock interviews, and submit application for ${data?.opportunity || 'this role'}.`;
        } else if (weeks === 1) {
          planRows = `### Day 1-2: Intensive Research\n### Day 3-5: Implementation\n### Day 6-7: Review & Polish`;
        }

        generatedText = `[AI GENERATED SUCCESS] \n\n# ${duration} WEEKLY ROADMAP: ${data?.opportunity || 'Bridge the Gap'}\n\nTotal Duration: ${weeks} Weeks\n\n${planRows}\n\nThis weekly breakdown is optimized for your profile and the ${data?.opportunity || 'selected'} role.`;
      } else {
        generatedText = `[AI GENERATED SUCCESS] \n\nThis is a production-ready simulation of the ${action} task for your ${type}. It has analyzed your provided context and tailored the output to meet the highest professional standards. \n\n"Results-driven professional with specialized expertise in ${title}. Proven track record of delivering innovative solutions and exceeding targets."`;
      }

      return {
        success: true,
        text: generatedText,
        creditsDeducted: 10
      };
    } catch (err) {
      return {
        success: false,
        error: "An error occurred while communicating with the AI service. Please try again."
      };
    }
  }
};
