export const calculateMatchScore = (profile: any, opportunity: any): number => {
  if (!profile || !opportunity) return 0;
  
  let score = 0;
  
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
    
    // Exact phrase matching
    if (reqText.includes(t)) return base * 1.5;
    if (titleText.includes(t)) return base * 1.2;
    if (descText.includes(t)) return base * 1.0;

    // Fallback to word-level overlap
    const words = getSignificantWords(text);
    if (words.length === 0) return 0;

    let matchCount = 0;
    let weightSum = 0;
    words.forEach(w => {
      let matched = false;
      for (const oppWord of oppWordsSet) {
        if (oppWord === w || oppWord.startsWith(w) || w.startsWith(oppWord)) {
          matched = true;
          if (reqWordsSet.has(oppWord)) weightSum += 1.5;
          else if (titleWordsSet.has(oppWord)) weightSum += 1.2;
          else weightSum += 1.0;
          break;
        }
      }
      if (matched) matchCount++;
    });

    if (matchCount === 0) return 0;
    return (weightSum / words.length) * base;
  };

  // 1. Check Skills Match (up to 30 points)
  if (profile.skills && profile.skills.length > 0) {
    let skillScore = 0;
    profile.skills.forEach((skill: string) => {
      skillScore += getMatchPoints(skill, 6);
    });
    score += Math.min(30, skillScore);
  }
  
  // 2. Check Achievements Match (up to 15 points)
  if (profile.achievements && profile.achievements.length > 0) {
    let achScore = 0;
    profile.achievements.forEach((ach: string) => {
      achScore += getMatchPoints(ach, 3);
    });
    score += Math.min(15, achScore);
  }
  
  // 3. Check Experience Match (up to 20 points)
  if (profile.experience && profile.experience.length > 0) {
    let expScore = 0;
    profile.experience.forEach((exp: any) => {
      expScore += getMatchPoints(exp.title, 8);
      expScore += getMatchPoints(exp.company, 2);
    });
    score += Math.min(20, expScore);
  }
  
  // 4. Check Education Match (up to 10 points)
  if (profile.education && profile.education.length > 0) {
    let eduScore = 0;
    profile.education.forEach((edu: any) => {
      eduScore += getMatchPoints(edu.degree, 4);
      eduScore += getMatchPoints(edu.field_of_study, 8);
    });
    score += Math.min(10, eduScore);
  }

  // 5. Check Location Match (up to 5 points)
  if (profile.location && oppText.includes(profile.location.toLowerCase())) {
    score += 5;
  }
  
  // 6. Check Languages (up to 5 points)
  if (profile.languages && profile.languages.length > 0) {
    let langScore = 0;
    profile.languages.forEach((lang: any) => {
      const l = typeof lang === 'string' ? lang : (lang.language || '');
      langScore += getMatchPoints(l, 3);
    });
    score += Math.min(5, langScore);
  }

  // 7. Check Certifications (up to 10 points)
  if (profile.certifications && profile.certifications.length > 0) {
    let certScore = 0;
    profile.certifications.forEach((cert: any) => {
      const c = typeof cert === 'string' ? cert : (cert.name || cert.title || '');
      certScore += getMatchPoints(c, 5);
    });
    score += Math.min(10, certScore);
  }

  // 8. Check Portfolios (up to 5 points)
  if (profile.portfolios && profile.portfolios.length > 0) {
    let portScore = 0;
    profile.portfolios.forEach((port: any) => {
      const p = typeof port === 'string' ? port : (port.title || port.description || '');
      portScore += getMatchPoints(p, 3);
    });
    score += Math.min(5, portScore);
  }
  
  // Clamp between 0 and 98 natively, no forced baseline bumping
  return Math.max(0, Math.min(98, Math.round(score)));
};
