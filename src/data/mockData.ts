import type { Opportunity, UserProfile, Document } from '../types';

export const mockTransactions = [
  { id: 't1', date: '2024-05-10', description: 'Grant Proposal Review', amount: -150, type: 'usage' },
  { id: 't2', date: '2024-05-01', description: 'Monthly Pro Plan Credits', amount: 1000, type: 'credit' },
  { id: 't3', date: '2024-04-28', description: 'CV Tailoring - InnovateX', amount: -50, type: 'usage' },
];

export const mockPricingTiers = [
  { id: 'free', name: 'Explorer', price: '$0', credits: 100, features: ['Basic CV Builder', 'Public Opportunities'] },
  { id: 'pro', name: 'Professional', price: '$29', credits: 1500, features: ['Advanced Grant Builder', 'Unlimited CVs', 'Priority Support'] },
  { id: 'elite', name: 'Elite', price: '$99', credits: 5000, features: ['Expert Review', 'Custom Branding', '1-on-1 Coaching'] }
];

export const mockPrepPlan = {
  readinessScore: 78,
  strengths: ['Frontend Architecture', 'React Performance', 'Team Leadership'],
  gaps: ['WebGL Experience', 'Advanced Backend Scaling'],
  nextSteps: [
    { id: 's1', title: 'Complete WebGL Crash Course', timeframe: 'Week 1', status: 'pending' },
    { id: 's2', title: 'Update Portfolio with 3D elements', timeframe: 'Week 2', status: 'pending' },
    { id: 's3', title: 'Schedule mock technical interview', timeframe: 'Week 3', status: 'pending' }
  ]
};

export const mockUser: UserProfile = {
  id: 'u1',
  name: 'Alex Johnson',
  email: 'alex.j@example.com',
  avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
  story: 'I am a passionate software engineer with 5 years of experience in building scalable web applications. I love solving complex problems and learning new technologies.',
  education: [
    {
      school: 'Stanford University',
      degree: 'Master of Science',
      field: 'Computer Science',
      startYear: '2018',
      endYear: '2020'
    }
  ],
  experience: [
    {
      company: 'TechFlow Inc.',
      position: 'Senior Frontend Engineer',
      location: 'San Francisco, CA',
      startDate: '2020-06',
      endDate: 'Present',
      description: 'Leading the frontend team in developing a high-performance analytics dashboard.'
    }
  ],
  skills: ['React', 'TypeScript', 'Node.js', 'Next.js', 'CSS Modules', 'GraphQL'],
  languages: ['English', 'Spanish'],
  goals: ['To work on mission-driven projects', 'To lead a technical team']
};

export const mockOpportunities: Opportunity[] = [
  {
    id: 'o1',
    title: 'Senior Frontend Developer',
    company: 'InnovateX',
    location: 'Remote',
    type: 'Full-time',
    source: 'LinkedIn',
    postedDate: '2 days ago',
    deadline: '2024-06-15',
    matchScore: 92,
    matchBreakdown: {
      skills: 95,
      experience: 90,
      education: 100,
      goals: 85
    },
    requirements: [
      '5+ years of experience with React',
      'Strong TypeScript skills',
      'Experience with modern CSS frameworks',
      'Knowledge of web performance optimization'
    ],
    missingRequirements: ['Experience with WebGL'],
    description: 'We are looking for a Senior Frontend Developer to join our core team. You will be responsible for building and optimizing the user interface of our flagship product.',
    status: 'Reviewing',
    rssStatus: 'Live'
  },
  {
    id: 'o2',
    title: 'Product Designer',
    company: 'Visionary Systems',
    location: 'London, UK',
    type: 'Contract',
    source: 'Indeed',
    postedDate: '5 hours ago',
    deadline: '2024-06-01',
    matchScore: 75,
    matchBreakdown: {
      skills: 70,
      experience: 80,
      education: 60,
      goals: 90
    },
    requirements: [
      'Strong portfolio demonstrating UI/UX skills',
      'Proficiency in Figma',
      'Experience with design systems'
    ],
    missingRequirements: ['Experience with Framer Motion'],
    description: 'Join our design team to create beautiful and intuitive user experiences for our enterprise clients.',
    status: 'Saved',
    rssStatus: 'Syncing'
  }
];

export const mockDocuments: Document[] = [
  {
    id: 'd1',
    type: 'CV',
    title: 'Master CV - Software Engineering',
    lastEdited: '2024-05-01',
    content: 'Standard CV content...'
  }
];
