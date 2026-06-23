// SECURITY: Anthropic API key removed from frontend bundle.
// All AI calls now route through the pathew-assistant Supabase Edge Function.
// See: src/services/pathewAssistant.ts

export const AssistantService = {
  async generateResponse(): Promise<{ success: boolean; error: string }> {
    return {
      success: false,
      error: 'Direct AI calls are disabled. Use the PathewAssistantService via the Edge Function instead.',
    };
  },
};
