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
    'have', 'with', 'this', 'from', 'that', 'will', 'your', 'fund', 'grant', 
    'fellowship', 'scholarship'
  ]);

  const getSignificantWords = (text: string) => {
    if (!text) return [];
    return text.toLowerCase().split(/\W+/).filter(w => w.length > 3 && !stopWords.has(w));
  };

  const oppWordsSet = new Set(getSignificantWords(oppText));
  const reqWordsSet = new Set(getSignificantWords(reqText));
  const titleWordsSet = new Set(getSignificantWords(titleText));

  // Expertise check: if the opportunity expects high expertise, demographics and baseline boosts shouldn't carry as much weight.
  const expectsHighExpertise = ['senior', 'expert', 'director', 'lead', 'advanced', 'phd', 'postdoc', 'head'].some(word => oppText.includes(word));

  // --- 1. PROFILE COMPLETENESS BASELINE (Up to 20 points) ---
  // If a user has filled out their profile, they shouldn't see 1% or 5% naturally.
  let completenessScore = 0;
  if (profile.skills && profile.skills.length > 0) completenessScore += 4;
  if (profile.experience && profile.experience.length > 0) completenessScore += 4;
  if (profile.education && profile.education.length > 0) completenessScore += 3;
  if (profile.achievements && profile.achievements.length > 0) completenessScore += 2;
  if (profile.languages && profile.languages.length > 0) completenessScore += 2;
  if (profile.certifications && profile.certifications.length > 0) completenessScore += 2;
  if (profile.location) completenessScore += 1;
  if (profile.gender) completenessScore += 1;
  if (profile.age || profile.date_of_birth) completenessScore += 1;
  if (profile.story || profile.bio) completenessScore += 1;
  
  if (expectsHighExpertise) {
    completenessScore = completenessScore * 0.5; // Halve the "free" points if highly technical
  }
  score += completenessScore;

  // --- 2. DEMOGRAPHICS & IMPLICIT MATCHES (Up to 15 points) ---
  let demoScore = 0;
  
  // Gender Match
  const gender = (profile.gender || '').toLowerCase();
  if (gender === 'female' || gender === 'woman' || gender === 'women') {
    if (oppText.includes('women') || oppText.includes('female') || oppText.includes('girls')) {
      demoScore += 8;
    }
  }
  
  // Age Match (Youth/Student)
  const age = parseInt(profile.age || '0');
  if (age > 0 && age <= 30) {
    if (oppText.includes('young') || oppText.includes('youth') || oppText.includes('student') || oppText.includes('undergraduate')) {
      demoScore += 4;
    }
  }
  
  // Location / Nationality Match
  const userLocs = [profile.location, profile.country, profile.nationality]
    .filter(Boolean)
    .map((l: string) => l.toLowerCase());
    
  let locMatched = false;
  for (const loc of userLocs) {
    if (oppText.includes(loc)) {
      locMatched = true;
      break;
    }
  }
  
  if (locMatched) {
    demoScore += 20; // Massive boost for local opportunities
  }
  
  if (expectsHighExpertise) {
    demoScore = demoScore * 0.5;
  }
  score += Math.min(30, demoScore);

  // Helper for word-level matches
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

  // --- 3. CONTENT OVERLAP MATCHES (Up to 65 points) ---
  
  // Skills (up to 20 points)
  if (profile.skills && profile.skills.length > 0) {
    let skillScore = 0;
    profile.skills.forEach((skill: string) => {
      skillScore += getMatchPoints(skill, 5);
    });
    score += Math.min(20, skillScore);
  }
  
  // Experience (up to 15 points)
  if (profile.experience && profile.experience.length > 0) {
    let expScore = 0;
    profile.experience.forEach((exp: any) => {
      expScore += getMatchPoints(exp.title, 6);
      expScore += getMatchPoints(exp.company, 2);
    });
    score += Math.min(15, expScore);
  }
  
  // Education (up to 10 points)
  if (profile.education && profile.education.length > 0) {
    let eduScore = 0;
    profile.education.forEach((edu: any) => {
      eduScore += getMatchPoints(edu.degree, 4);
      eduScore += getMatchPoints(edu.field_of_study, 6);
    });
    score += Math.min(10, eduScore);
  }
  
  // Achievements (up to 5 points)
  if (profile.achievements && profile.achievements.length > 0) {
    let achScore = 0;
    profile.achievements.forEach((ach: string) => {
      achScore += getMatchPoints(ach, 2);
    });
    score += Math.min(5, achScore);
  }
  
  // Bio/Story (up to 5 points)
  const story = profile.story || profile.bio;
  if (story) {
    const storyWords = getSignificantWords(story);
    let matchCount = 0;
    storyWords.forEach(w => {
      for (const oppWord of oppWordsSet) {
        if (oppWord === w || oppWord.startsWith(w) || w.startsWith(oppWord)) {
          matchCount++;
          break;
        }
      }
    });
    score += Math.min(5, matchCount * 0.5);
  }

  // Certifications, Portfolios, Languages (up to 10 points)
  let extraScore = 0;
  if (profile.languages && profile.languages.length > 0) {
    profile.languages.forEach((lang: any) => {
      const l = typeof lang === 'string' ? lang : (lang.language || '');
      extraScore += getMatchPoints(l, 3);
    });
  }
  if (profile.certifications && profile.certifications.length > 0) {
    profile.certifications.forEach((cert: any) => {
      const c = typeof cert === 'string' ? cert : (cert.name || cert.title || '');
      extraScore += getMatchPoints(c, 4);
    });
  }
  if (profile.portfolios && profile.portfolios.length > 0) {
    profile.portfolios.forEach((port: any) => {
      const p = typeof port === 'string' ? port : (port.title || port.description || '');
      extraScore += getMatchPoints(p, 3);
    });
  }
  score += Math.min(10, extraScore);

  // Clamp natively between 0 and 98
  return Math.max(0, Math.min(98, Math.round(score)));
};
