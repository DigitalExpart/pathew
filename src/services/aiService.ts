
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
  dangerouslyAllowBrowser: true
});

export interface AssistantRequestContext {
  type: string;
  action: string;
  data: any;
  userCredits: number;
  language?: string;
  tone?: string;
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
    if (context.userCredits < 1) {
      return { 
        success: false, 
        error: "Insufficient credits. Please top up your account to use the Assistant." 
      };
    }

    try {
      const { type, action, data, language = 'English (US)', tone = 'Professional & Academic' } = context;
      
      // Constructing a detailed system prompt based on preferences
      const systemPrompt = `You are the PATHEW Career Assistant. Your goal is to help the user with ${type} tasks.
Selected Tone: ${tone}
Target Language: ${language}

Tone Guidelines:
- Professional & Academic: formal, structured, and polished.
- Creative & Narrative: expressive and story-driven.
- Concise & Impactful: short, direct, and high-signal.
- Casual & Friendly: conversational, warm, and natural.

Language Guidelines:
- If English (UK), use UK spelling (e.g., -ise, -our).
- If English (US), use US spelling (e.g., -ize, -or).
- If any other language (Spanish, French, etc.), provide the ENTIRE response in that language.

Task-Specific Instructions:
- For Preparation Roadmaps: Generate a week-by-week plan. Start each week with "### Week X: [Focus Title]" followed by tasks. Use the tag "[Assistant GENERATED SUCCESS]" at the very beginning.
- For Documents (CV, Cover Letter, Grants): Provide high-quality, professional content ready for insertion. Start with "[Assistant GENERATED SUCCESS]".

The response MUST start with "[Assistant GENERATED SUCCESS]".`;

      const userMessage = `Task: ${action}
Context Data: ${JSON.stringify(data)}
Please generate the response now.`;

      const msg = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20240620", // Use the widely available Sonnet 3.5
        max_tokens: 4096,
        system: systemPrompt,
        messages: [{ role: "user", content: userMessage }],
      });

      const generatedText = msg.content[0].type === 'text' ? msg.content[0].text : "";

      return {
        success: true,
        text: generatedText,
        creditsDeducted: 1
      };
    } catch (err: any) {
      console.error('Claude API Error:', err);
      return {
        success: false,
        error: `AI Service Error: ${err.message || "Failed to communicate with Claude API."}`
      };
    }
  }
};
