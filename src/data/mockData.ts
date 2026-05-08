import type { Opportunity, UserProfile, Document } from '../types';

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
    description: 'We are looking for a Senior Frontend Developer to join our core team. You will be responsible for building and optimizing the user interface of our flagship product.'
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
    description: 'Join our design team to create beautiful and intuitive user experiences for our enterprise clients.'
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
