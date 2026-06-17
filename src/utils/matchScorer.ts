export const calculateMatchScore = (profile: any, opportunity: any): number => {
  if (!profile || !opportunity) return 0;
  
  let score = 0;
  let hasAnyMatch = false;
  
  const titleText = (opportunity.title || '').toLowerCase();
  const descText = (opportunity.description || '').toLowerCase();
  const reqText = opportunity.requirements ? opportunity.requirements.join(' ').toLowerCase() : '';
  const oppText = `${titleText} ${descText} ${reqText}`;
  
  const stopWords = new Set([
    'their', 'there', 'about', 'which', 'would', 'these', 'those', 'where', 'while', 
    'after', 'before', 'under', 'over', 'other', 'could', 'should', 'might', 'first', 
    'years', 'using', 'based', 'through', 'experience', 'working', 'skills', 'project', 
    'team', 'management', 'support', 'development', 'program', 'apply', 'application',
    'opportunity', 'opportunities', 'business', 'company', 'industry', 'role', 'work',
    'have', 'with', 'this', 'from', 'that', 'will', 'your', 'women', 'fund', 'grant', 
    'fellowship', 'scholarship'
  ]);

  const getSignificantWords = (text: string) => {
    if (!text) return [];
    return text.toLowerCase().split(/\W+/).filter(w => w.length > 3 && !stopWords.has(w));
  };

  const oppWordsSet = new Set(getSignificantWords(oppText));
  const reqWordsSet = new Set(getSignificantWords(reqText));
  const titleWordsSet = new Set(getSignificantWords(titleText));

  // Helper to weigh matches by individual words
  const getMatchPoints = (text: string, base: number): number => {
    if (!text) return 0;
    const t = text.toLowerCase();
    
    // High-value exact phrase matching
    if (reqText.includes(t)) { hasAnyMatch = true; return base * 2.5; }
    if (titleText.includes(t)) { hasAnyMatch = true; return base * 2.0; }
    if (descText.includes(t)) { hasAnyMatch = true; return base * 1.5; }

    // Fallback to word-level overlap (e.g. "Software Engineering" -> matches "Software")
    const words = getSignificantWords(text);
    if (words.length === 0) return 0;

    let matchCount = 0;
    let weightSum = 0;
    words.forEach(w => {
      let matched = false;
      for (const oppWord of oppWordsSet) {
        // Match root words (e.g., comput/computer, tech/technology)
        if (oppWord === w || oppWord.startsWith(w) || w.startsWith(oppWord)) {
          matched = true;
          if (reqWordsSet.has(oppWord)) weightSum += 1.5;
          else if (titleWordsSet.has(oppWord)) weightSum += 1.2;
          else weightSum += 1.0;
          break;
        }
      }
      if (matched) {
        matchCount++;
        hasAnyMatch = true;
      }
    });

    if (matchCount === 0) return 0;
    return (weightSum / words.length) * base;
  };

  // 1. Check Skills Match (up to 40 points)
  if (profile.skills && profile.skills.length > 0) {
    let skillScore = 0;
    profile.skills.forEach((skill: string) => {
      skillScore += getMatchPoints(skill, 8);
    });
    score += Math.min(40, skillScore);
  }
  
  // 2. Check Achievements Match (up to 20 points)
  if (profile.achievements && profile.achievements.length > 0) {
    let achScore = 0;
    profile.achievements.forEach((ach: string) => {
      achScore += getMatchPoints(ach, 4);
    });
    score += Math.min(20, achScore);
  }
  
  // 3. Check Experience Match (up to 30 points)
  if (profile.experience && profile.experience.length > 0) {
    let expScore = 0;
    profile.experience.forEach((exp: any) => {
      expScore += getMatchPoints(exp.title, 10);
      expScore += getMatchPoints(exp.company, 2);
    });
    score += Math.min(30, expScore);
  }
  
  // 4. Check Education Match (up to 15 points)
  if (profile.education && profile.education.length > 0) {
    let eduScore = 0;
    profile.education.forEach((edu: any) => {
      eduScore += getMatchPoints(edu.degree, 6);
      eduScore += getMatchPoints(edu.field_of_study, 10);
    });
    score += Math.min(15, eduScore);
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
  
  // Scale the baseline so weak matches don't get artificially inflated
  if (coreScore >= 15) {
    score += 15;
  } else {
    score += coreScore; // Smooth scaling
  }
  
  // Fallback randomizer for slight variety on matching opportunities
  const stableHash = opportunity.id 
    ? String(opportunity.id).split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0)
    : 0;
    
  score += (stableHash % 10) - 2;
  
  // Clamp between 0 and 98
  return Math.max(0, Math.min(98, Math.round(score)));
};
