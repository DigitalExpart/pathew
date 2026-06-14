import React from 'react';
import { DocumentBuilder } from './DocumentBuilder';
import { useTranslation } from 'react-i18next';

export const GrantBuilderPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <DocumentBuilder 
      type="Proposal" 
      initialTitle={t('grantBuilder.title') || "Grant Proposal Builder"}
      initialContent={`PROJECT SUMMARY\nDescribe your target project overview, objectives, and community impact...\n\nBUDGET & PLAN\nOutlines targets, expenses, resource plans, and project phases...`}
    />
  );
};
