import { promptTemplates } from '../data/promptTemplates';

export interface AssistantRequestContext {
  type: string;
  action: string;
  data: any;
  userCredits: number;
}

export interface AssistantResponse {
  success: boolean;
  text?: string;
  error?: string;
  creditsDeducted?: number;
}

export const AssistantService = {
  async generateResponse(context: AssistantRequestContext): Promise<AssistantResponse> {
    // 1. Credit Check
    if (context.userCredits < 10) {
      return { 
        success: false, 
        error: "Insufficient credits. You need at least 10 credits to generate Assistant content." 
      };
    }

    // 2. Simulate Network Latency
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 3. Simulate Assistant Generation Logic
    try {
      // In a real app, this would be an API call to OpenAI/Anthropic/Gemini
      // Here we simulate successful generation using our templates
      let generatedText = "";
      
      const { type, action, data } = context;
      const title = data?.title || 'the field';
      
      if (type === 'Pathew Assistant' && (action.toLowerCase().includes('preparation plan') || data?.duration)) {
        const duration = data?.duration || '90-day';
        const weeks = duration === 'Quick' ? 1 : (duration === '90-day' ? 12 : (duration === '180-day' ? 24 : 52));
        
        let planRows = "";
        for (let i = 1; i <= weeks; i++) {
          let focus = "Foundation & Theory";
          let desc = `Mastering the basics of ${data?.gaps?.[0] || 'core requirements'}.`;
          
          if (i > weeks * 0.75) {
            focus = "Showcase & Application";
            desc = `Finalizing portfolio pieces and preparing for ${data?.opportunity || 'the role'}.`;
          } else if (i > weeks * 0.5) {
            focus = "Advanced Implementation";
            desc = `Building complex features and troubleshooting edge cases with ${data?.gaps?.[0] || 'new skills'}.`;
          } else if (i > weeks * 0.25) {
            focus = "Hands-on Practice";
            desc = `Working on real-world scenarios and small projects involving ${data?.gaps?.[0] || 'requirements'}.`;
          }
          
          planRows += `### Week ${i}: ${focus}\n${desc}\n\n`;
        }

        generatedText = `[Assistant GENERATED SUCCESS] \n\n# ${duration} FULL ROADMAP: ${data?.opportunity || 'Bridge the Gap'}\n\nTotal Duration: ${weeks} Weeks\n\n${planRows}\n\nThis comprehensive breakdown is tailored to ensure you are fully prepared for ${data?.opportunity || 'this opportunity'}.`;
      } else {
        generatedText = `[Assistant GENERATED SUCCESS] \n\nThis is a production-ready simulation of the ${action} task for your ${type}. It has analyzed your provided context and tailored the output to meet the highest professional standards. \n\n"Results-driven professional with specialized expertise in ${title}. Proven track record of delivering innovative solutions and exceeding targets."`;
      }

      return {
        success: true,
        text: generatedText,
        creditsDeducted: 10
      };
    } catch (err) {
      return {
        success: false,
        error: "An error occurred while communicating with the Assistant service. Please try again."
      };
    }
  }
};
