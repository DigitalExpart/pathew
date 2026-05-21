import React from 'react';
import { DocumentBuilder } from './DocumentBuilder';

export const CVBuilderPage: React.FC = () => (
  <DocumentBuilder type="CV" />
);

export const CoverLetterPage: React.FC = () => (
  <DocumentBuilder type="Cover Letter" />
);

export const ProposalPage: React.FC = () => (
  <DocumentBuilder type="Proposal" />
);
