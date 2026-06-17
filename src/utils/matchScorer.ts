export const calculateMatchScore = (profile: any, opportunity: any): number => {
  if (!profile || !opportunity) return 0;
  
  let score = 0;
  let hasAnyMatch = false;
  
  const titleText = (opportunity.title || '').toLowerCase();
  const descText = (opportunity.description || '').toLowerCase();
  const reqText = opportunity.requirements ? opportunity.requirements.join(' ').toLowerCase() : '';
  const oppText = `${titleText} ${descText} ${reqText}`;
  
  // Helper to weigh matches. Requirements are worth the most.
  const getMatchPoints = (term: string, base: number): number => {
    if (!term) return 0;
    const t = term.toLowerCase();
    
    // More generous multipliers to restore earlier matching feel
    if (reqText.includes(t)) return base * 2.5;
    if (titleText.includes(t)) return base * 2.0;
    if (descText.includes(t)) return base * 1.5;
    return 0;
  };

  const stopWords = new Set(['their', 'there', 'about', 'which', 'would', 'these', 'those', 'where', 'while', 'after', 'before', 'under', 'over', 'other', 'could', 'should', 'might', 'first', 'years', 'using', 'based', 'through', 'experience', 'working', 'skills', 'project', 'team', 'management']);
  const getSignificantWords = (text: string) => {
    return text.toLowerCase().split(/\W+/).filter(w => w.length > 4 && !stopWords.has(w));
  };

  // 1. Check Skills Match (up to 40 points)
  if (profile.skills && profile.skills.length > 0) {
    let skillScore = 0;
    profile.skills.forEach((skill: string) => {
      const pts = getMatchPoints(skill, 6);
      if (pts > 0) {
        skillScore += pts;
        hasAnyMatch = true;
      }
    });
    score += Math.min(40, skillScore);
  }
  
  // 2. Check Achievements Match (up to 25 points)
  if (profile.achievements && profile.achievements.length > 0) {
    let achScore = 0;
    profile.achievements.forEach((ach: string) => {
      const words = getSignificantWords(ach);
      words.forEach(word => {
        const pts = getMatchPoints(word, 2.0);
        if (pts > 0) {
          achScore += pts;
          hasAnyMatch = true;
        }
      });
    });
    score += Math.min(25, achScore);
  }
  
  // 3. Check Experience Match (up to 30 points)
  if (profile.experience && profile.experience.length > 0) {
    let expScore = 0;
    profile.experience.forEach((exp: any) => {
      const titlePts = getMatchPoints(exp.title, 8);
      const companyPts = getMatchPoints(exp.company, 4);
      if (titlePts > 0 || companyPts > 0) {
        expScore += titlePts + companyPts;
        hasAnyMatch = true;
      }
    });
    score += Math.min(30, expScore);
  }
  
  // 4. Check Education Match (up to 20 points)
  if (profile.education && profile.education.length > 0) {
    const degree = profile.education[0]?.degree || '';
    const field = profile.education[0]?.field_of_study || '';
    
    const degPts = getMatchPoints(degree, 6);
    const fieldPts = getMatchPoints(field, 12);
    
    if (degPts > 0 || fieldPts > 0) {
      score += degPts + fieldPts;
      hasAnyMatch = true;
    }
  }

  let coreScore = score;
  
  // 5. Check Location Match (up to 5 points)
  if (profile.location && oppText.includes(profile.location.toLowerCase())) {
    score += 5;
    hasAnyMatch = true;
  }
  
  // explicit check for totally irrelevant match
  if (!hasAnyMatch) {
    return 0; // Does not fit at all
  }
  
  // Scale the baseline so weak matches don't get artificially inflated to ~20%
  if (coreScore >= 10) {
    score += 15;
  } else {
    score += coreScore; // Add a smaller baseline for weak matches
  }
  
  // Fallback randomizer for slight variety on matching opportunities
  const stableHash = opportunity.id 
    ? String(opportunity.id).split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0)
    : 0;
    
  score += (stableHash % 10) - 2;
  
  // Clamp between 0 and 98
  return Math.max(0, Math.min(98, Math.round(score)));
};
