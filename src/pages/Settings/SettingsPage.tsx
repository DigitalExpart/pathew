import React from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Settings } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  return (
    <div style={containerStyle}>
      <header style={headerStyle}>
        <h1 style={titleStyle}>General Settings</h1>
        <p style={subtitleStyle}>Manage your account preferences and notifications.</p>
      </header>
      <Card title="Profile Information" icon={Settings}>
        <div style={formGroupStyle}>
          <label style={labelStyle}>Full Name</label>
          <input type="text" defaultValue="Alex Johnson" style={inputStyle} />
        </div>
        <div style={formGroupStyle}>
          <label style={labelStyle}>Email Address</label>
          <input type="email" defaultValue="alex.j@example.com" style={inputStyle} />
        </div>
        <Button style={{ marginTop: '16px' }}>Save Changes</Button>
      </Card>
    </div>
  );
};

const containerStyle: React.CSSProperties = { maxWidth: '800px', margin: '0 auto', padding: '24px 0' };
const headerStyle: React.CSSProperties = { marginBottom: '32px' };
const titleStyle: React.CSSProperties = { fontSize: '2.5rem', marginBottom: '8px' };
const subtitleStyle: React.CSSProperties = { color: 'var(--text-secondary)' };
const formGroupStyle: React.CSSProperties = { marginBottom: '24px' };
const labelStyle: React.CSSProperties = { display: 'block', marginBottom: '8px', fontWeight: 600 };
const inputStyle: React.CSSProperties = { width: '100%', padding: '10px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)' };