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
        generatedText = `[AI GENERATED SUCCESS] \n\n# ${duration} PREPARATION PLAN: ${data?.opportunity || 'Bridge the Gap'}\n\nBased on your profile, here is a structured roadmap to gain expertise in ${data?.gaps?.join(', ') || 'required skills'} within ${duration}:\n\n- **PHASE 1 (Foundation):** Focus on fundamental concepts and environment setup.\n- **PHASE 2 (Implementation):** Build 3 mini-projects using these technologies.\n- **PHASE 3 (Optimization):** Advanced troubleshooting and performance tuning.\n- **PHASE 4 (Showcase):** Finalize your portfolio piece and update your CV.\n\nThis plan is tailored to make you a top candidate for ${data?.opportunity || 'this role'}.`;
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
