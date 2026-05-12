export const promptTemplates = {
  cv: {
    summary: (bio: string) => `Write a high-impact professional summary for a CV based on this bio: "${bio}". Focus on achievements and key value propositions.`,
    tailor: (content: string, jobDesc: string) => `Tailor the following CV content to match this job description. Highlight relevant skills and mirror the keywords. \n\nCV: "${content}"\n\nJob: "${jobDesc}"`,
    bullets: (exp: string) => `Transform the following work experience into achievement-oriented bullet points using strong action verbs: "${exp}"`,
  },
  grant: {
    draft: (question: string, context: string) => `Draft a persuasive and clear answer for the following grant application question: "${question}". Use these key details as context: "${context}".`,
    shorten: (text: string, limit: number) => `Shorten the following text to fit within a ${limit} word limit while maintaining the core message and impact: "${text}"`,
    persuade: (text: string) => `Rewrite the following text to be more persuasive and professional for a grant funder: "${text}"`,
  },
  coverLetter: {
    scratch: (role: string, company: string, bio: string) => `Write a personalized and compelling cover letter for the ${role} position at ${company} based on this professional background: "${bio}".`,
    formal: (text: string) => `Rewrite this cover letter to be more formal and structured for a corporate environment: "${text}"`,
  },
  profile: {
    polish: (bio: string) => `Polish this rough personal story into a professional and engaging bio: "${bio}"`,
    skills: (bio: string) => `Based on this professional bio, suggest a list of 10 highly relevant industry skills: "${bio}"`,
  },
  pathway: {
    readiness: (score: number, gaps: string[]) => `Based on a readiness score of ${score}% and these identified gaps: [${gaps.join(', ')}], generate a detailed 90-day action roadmap to improve the match score.`,
    match: (score: number, breakdown: any) => `Explain this match score of ${score}% based on these metrics: Skills (${breakdown.skills}%), Experience (${breakdown.experience}%), Education (${breakdown.education}%).`,
  }
};
