import React from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { AlertTriangle } from 'lucide-react';

export const AccountDeletionPage: React.FC = () => {
  return (
    <div style={containerStyle}>
      <header style={headerStyle}>
        <h1 style={titleStyle}>Account Deletion</h1>
        <p style={subtitleStyle}>Permanently remove your account and all associated data.</p>
      </header>
      <Card title="Danger Zone" icon={AlertTriangle} style={{ border: '1px solid #ef4444' }}>
        <p style={{ color: '#ef4444', marginBottom: '16px', fontWeight: 500 }}>Warning: This action cannot be undone.</p>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>All your credits, documents, and profile data will be permanently erased.</p>
        <Button style={{ backgroundColor: '#ef4444', color: '#fff', border: 'none' }}>Request Account Deletion</Button>
      </Card>
    </div>
  );
};

const containerStyle: React.CSSProperties = { maxWidth: '800px', margin: '0 auto', padding: '24px 0' };
const headerStyle: React.CSSProperties = { marginBottom: '32px' };
const titleStyle: React.CSSProperties = { fontSize: '2.5rem', marginBottom: '8px' };
const subtitleStyle: React.CSSProperties = { color: 'var(--text-secondary)' };