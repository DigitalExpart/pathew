import React from 'react';
import { DocumentBuilder } from './DocumentBuilder';

export const CVBuilderPage: React.FC = () => (
  <DocumentBuilder 
    type="CV" 
    initialTitle="Master CV - Software Engineering" 
    initialContent={`SUMMARY\nInnovative Software Engineer with 5+ years of experience...\n\nEXPERIENCE\nSenior Frontend Engineer @ TechFlow Inc.\n- Led migration to Next.js...\n- Optimized performance by 40%...`}
  />
);

export const CoverLetterPage: React.FC = () => (
  <DocumentBuilder 
    type="Cover Letter" 
    initialTitle="Cover Letter - InnovateX" 
    initialContent={`Dear Hiring Manager,\n\nI am writing to express my strong interest in the Senior Frontend Developer position at InnovateX. With my extensive background in React and TypeScript...`}
  />
);

export const ProposalPage: React.FC = () => (
  <DocumentBuilder 
    type="Proposal" 
    initialTitle="Project Proposal - Visionary Systems" 
    initialContent={`EXECUTIVE SUMMARY\nThis proposal outlines the strategy for implementing the new design system...\n\nSCOPE OF WORK\n1. Component Audit\n2. Documentation\n3. Implementation`}
  />
);
