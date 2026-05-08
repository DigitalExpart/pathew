import React from 'react';
import { Card } from './Card';
import { Button } from './Button';
import { X, FileText, Download, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDownload: (format: string) => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, onDownload }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div style={overlayStyle}>
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            style={modalWrapperStyle}
          >
            <Card style={{ position: 'relative', width: '100%', padding: '32px' }}>
              <button onClick={onClose} style={closeButtonStyle}>
                <X size={20} />
              </button>
              
              <div style={iconBoxStyle}>
                <Download size={32} color="var(--accent-primary)" />
              </div>
              
              <h2 style={{ textAlign: 'center', marginBottom: '8px' }}>Export Document</h2>
              <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '32px' }}>
                Choose your preferred format for download.
              </p>
              
              <div style={optionsGridStyle}>
                <FormatOption 
                  title="PDF Document" 
                  desc="Best for sharing and printing" 
                  icon={FileText}
                  onClick={() => onDownload('pdf')}
                />
                <FormatOption 
                  title="Word (DOCX)" 
                  desc="Best for further editing" 
                  icon={CheckCircle}
                  onClick={() => onDownload('docx')}
                />
              </div>
              
              <div style={{ marginTop: '32px' }}>
                <Button variant="outline" onClick={onClose} style={{ width: '100%' }}>Cancel</Button>
              </div>
            </Card>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const FormatOption = ({ title, desc, icon: Icon, onClick }: any) => (
  <div onClick={onClick} style={optionCardStyle}>
    <div style={optionIconWrapperStyle}>
      <Icon size={20} color="var(--accent-primary)" />
    </div>
    <div style={{ flex: 1 }}>
      <h4 style={{ fontSize: '1rem', marginBottom: '2px' }}>{title}</h4>
      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{desc}</p>
    </div>
  </div>
);

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.75)',
  backdropFilter: 'blur(4px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 2000,
  padding: '20px',
};

const modalWrapperStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: '440px',
};

const closeButtonStyle: React.CSSProperties = {
  position: 'absolute',
  top: '24px',
  right: '24px',
  color: 'var(--text-muted)',
};

const iconBoxStyle: React.CSSProperties = {
  width: '64px',
  height: '64px',
  backgroundColor: 'var(--bg-tertiary)',
  borderRadius: '20px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  margin: '0 auto 24px',
};

const optionsGridStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
};

const optionCardStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
  padding: '16px',
  backgroundColor: 'var(--bg-primary)',
  borderRadius: 'var(--radius-lg)',
  border: '1px solid var(--border-color)',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
};

const optionIconWrapperStyle: React.CSSProperties = {
  width: '40px',
  height: '40px',
  backgroundColor: 'var(--bg-tertiary)',
  borderRadius: '10px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};
