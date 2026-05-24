export const calculateMatchScore = (profile: any, opportunity: any): number => {
  if (!profile || !opportunity) return 0;
  
  // Base score
  let score = 15; // Start at 15 for a realistic low baseline
  
  const oppText = `${opportunity.title || ''} ${opportunity.description || ''} ${opportunity.requirements ? opportunity.requirements.join(' ') : ''}`.toLowerCase();
  
  // 1. Check Skills Match (up to 35 points)
  if (profile.skills && profile.skills.length > 0) {
    let skillMatches = 0;
    profile.skills.forEach((skill: string) => {
      if (skill && oppText.includes(skill.toLowerCase())) {
        skillMatches++;
      }
    });
    score += Math.min(35, skillMatches * 7);
  }
  
  // 2. Check Experience Match (up to 30 points)
  if (profile.experience && profile.experience.length > 0) {
    let expMatches = 0;
    profile.experience.forEach((exp: any) => {
      if (exp.title && oppText.includes(exp.title.toLowerCase())) expMatches++;
      if (exp.company && oppText.includes(exp.company.toLowerCase())) expMatches++;
    });
    score += Math.min(30, expMatches * 10);
  }
  
  // 3. Check Education/Location Match (up to 20 points)
  if (profile.education && profile.education.length > 0) {
    const degree = profile.education[0]?.degree?.toLowerCase() || '';
    const field = profile.education[0]?.field_of_study?.toLowerCase() || '';
    if (degree && oppText.includes(degree)) score += 5;
    if (field && oppText.includes(field)) score += 10;
  }
  
  if (profile.location && oppText.includes(profile.location.toLowerCase())) {
    score += 5;
  }
  
  // 4. Fallback randomizer for slight variety
  const stableHash = opportunity.id 
    ? String(opportunity.id).split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0)
    : 0;
    
  score += (stableHash % 10) - 2;
  
  // Clamp between 12 and 98 for realistic looking scores based heavily on profile matches
  return Math.max(12, Math.min(98, Math.round(score)));
};
