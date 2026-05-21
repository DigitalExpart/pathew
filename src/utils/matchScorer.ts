export const calculateMatchScore = (profile: any, opportunity: any): number => {
  if (!profile || !opportunity) return 0;
  
  // Base score
  let score = 50; // Start at 50 to give a reasonable baseline
  
  const oppText = `${opportunity.title || ''} ${opportunity.description || ''} ${opportunity.requirements ? opportunity.requirements.join(' ') : ''}`.toLowerCase();
  
  // 1. Check Skills Match (up to 20 points)
  if (profile.skills && profile.skills.length > 0) {
    let skillMatches = 0;
    profile.skills.forEach((skill: string) => {
      if (oppText.includes(skill.toLowerCase())) {
        skillMatches++;
      }
    });
    // Max 20 points from skills, 4 points per matched skill
    score += Math.min(20, skillMatches * 4);
  } else {
    // If no skills are defined, give a default bump so the score isn't artificially low for empty profiles
    score += 10; 
  }
  
  // 2. Check Experience Match (up to 15 points)
  if (profile.experience && profile.experience.length > 0) {
    let expMatches = 0;
    profile.experience.forEach((exp: any) => {
      if (exp.title && oppText.includes(exp.title.toLowerCase())) expMatches++;
      if (exp.company && oppText.includes(exp.company.toLowerCase())) expMatches++;
    });
    score += Math.min(15, expMatches * 5);
  } else {
    score += 7;
  }
  
  // 3. Check Education/Location Match (up to 10 points)
  if (profile.education && profile.education.length > 0) {
    score += 5; // Has some education
    const degree = profile.education[0]?.degree?.toLowerCase() || '';
    if (degree && oppText.includes(degree)) score += 5;
  }
  
  if (profile.location && oppText.includes(profile.location.toLowerCase())) {
    score += 5;
  }
  
  // 4. Fallback randomizer for variety if score is exactly baseline + defaults (e.g. 50 + 10 + 7 + 5 = 72)
  // We use a simple hash of opp ID so it's stable per opportunity
  const stableHash = opportunity.id 
    ? opportunity.id.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0)
    : 0;
    
  // Add a small stable variation (-5 to +10) so not everything has the exact same baseline score
  score += (stableHash % 15) - 5;
  
  // Clamp between 60 and 98 for realistic looking scores
  return Math.max(60, Math.min(98, Math.round(score)));
};
