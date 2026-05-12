import React from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { CheckSquare } from 'lucide-react';

export const ConsentPage: React.FC = () => {
  return (
    <div style={containerStyle}>
      <header style={headerStyle}>
        <h1 style={titleStyle}>Consent & Preferences</h1>
        <p style={subtitleStyle}>Manage your marketing and cookie preferences.</p>
      </header>
      <Card title="Communication Preferences" icon={CheckSquare}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
            <input type="checkbox" defaultChecked style={{ width: '20px', height: '20px', accentColor: 'var(--accent-primary)' }} />
            <span>Receive weekly opportunity alerts</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
            <input type="checkbox" defaultChecked style={{ width: '20px', height: '20px', accentColor: 'var(--accent-primary)' }} />
            <span>Receive product updates and news</span>
          </label>
        </div>
        <Button>Update Preferences</Button>
      </Card>
    </div>
  );
};

const containerStyle: React.CSSProperties = { maxWidth: '800px', margin: '0 auto', padding: '24px 0' };
const headerStyle: React.CSSProperties = { marginBottom: '32px' };
const titleStyle: React.CSSProperties = { fontSize: '2.5rem', marginBottom: '8px' };
const subtitleStyle: React.CSSProperties = { color: 'var(--text-secondary)' };