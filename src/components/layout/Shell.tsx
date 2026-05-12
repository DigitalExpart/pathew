import React from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { AIProvider } from '../../context/AIContext';
import { AIAssistantPanel } from '../ai/AIAssistantPanel';

interface ShellProps {
  children: React.ReactNode;
}

export const Shell: React.FC<ShellProps> = ({ children }) => {
  return (
    <div style={shellStyle}>
      <Sidebar />
      <div style={mainContainerStyle}>
        <TopBar />
        <main style={contentStyle}>
          {children}
        </main>
      </div>
    </div>
  );
};

const shellStyle: React.CSSProperties = {
  display: 'flex',
  minHeight: '100vh',
  backgroundColor: 'var(--bg-primary)',
};

const mainContainerStyle: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
};

const contentStyle: React.CSSProperties = {
  padding: '32px',
  marginLeft: '260px',
  flex: 1,
};
