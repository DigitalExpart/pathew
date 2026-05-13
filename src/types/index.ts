export interface UserProfile {
  id: string;
  name: string;
  email: string;
  story: string;
  education: Education[];
  experience: Experience[];
  skills: string[];
  languages: string[];
  goals: string[];
  credits: number;
  avatar?: string;
}

export interface Education {
  school: string;
  degree: string;
  field: string;
  startYear: string;
  endYear: string;
}

export interface Experience {
  company: string;
  position: string;
  location: string;
  startDate: string;
  endDate: string;
  description: string;
}

export interface Opportunity {
  id: string;
  title: string;
  company: string;
  location: string;
  type: 'Full-time' | 'Contract' | 'Freelance' | 'Internship';
  source: string;
  description: string;
  requirements: string[];
  matchScore: number;
  matchBreakdown: {
    skills: number;
    experience: number;
    education: number;
    goals: number;
  };
  missingRequirements: string[];
  postedDate: string;
  deadline: string;
  status?: 'Saved' | 'Researching' | 'Drafting' | 'Reviewing' | 'Submitted' | 'Decided';
  rssStatus?: 'Live' | 'Syncing' | 'Error';
}

export interface Document {
  id: string;
  type: 'CV' | 'Cover Letter' | 'Proposal';
  title: string;
  content: string;
  lastEdited: string;
  opportunityId?: string;
}
