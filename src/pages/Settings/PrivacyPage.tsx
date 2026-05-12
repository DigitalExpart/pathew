import React from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Shield } from 'lucide-react';

export const PrivacyPage: React.FC = () => {
  return (
    <div style={containerStyle}>
      <header style={headerStyle}>
        <h1 style={titleStyle}>Privacy & Data</h1>
        <p style={subtitleStyle}>Control your data and export your information.</p>
      </header>
      <Card title="Data Export" icon={Shield}>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>Download a copy of all your personal data, saved opportunities, and generated documents.</p>
        <Button variant="outline">Export Data as ZIP</Button>
      </Card>
    </div>
  );
};

const containerStyle: React.CSSProperties = { maxWidth: '800px', margin: '0 auto', padding: '24px 0' };
const headerStyle: React.CSSProperties = { marginBottom: '32px' };
const titleStyle: React.CSSProperties = { fontSize: '2.5rem', marginBottom: '8px' };
const subtitleStyle: React.CSSProperties = { color: 'var(--text-secondary)' };
