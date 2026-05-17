import React from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Sparkles, HelpCircle, ArrowRight } from 'lucide-react';

interface MissingField {
  key: string;
  label: string;
  type: 'text' | 'textarea';
  description?: string;
}

interface MissingInfoPanelProps {
  missingFields: MissingField[];
  answers: Record<string, string>;
  onChangeAnswers: (answers: Record<string, string>) => void;
  onSubmit: () => void;
  isLoading: boolean;
}

export const MissingInfoPanel: React.FC<MissingInfoPanelProps> = ({
  missingFields = [],
  answers,
  onChangeAnswers,
  onSubmit,
  isLoading,
}) => {
  const handleFieldChange = (key: string, value: string) => {
    onChangeAnswers({
      ...answers,
      [key]: value,
    });
  };

  return (
    <div style={containerStyle}>
      <Card style={panelCardStyle}>
        
        {/* Header Alert */}
        <div style={alertBoxStyle}>
          <Sparkles size={20} color="var(--accent-primary)" style={{ flexShrink: 0 }} />
          <div>
            <h4 style={alertTitleStyle}>Targeted Tailoring Enabled</h4>
            <p style={alertDescStyle}>
              Pathew Assistant analyzed your profile and the target opportunity. To write the highest converting copy, please answer these final {missingFields.length} details. 
              No other long forms needed!
            </p>
          </div>
        </div>

        {/* Dynamic Inputs Form */}
        <div style={formWrapperStyle}>
          {missingFields.map((field) => (
            <div key={field.key} style={fieldContainerStyle}>
              <div style={labelRowStyle}>
                <label style={labelStyle}>{field.label}</label>
                {field.description && (
                  <div style={tooltipWrapperStyle} title={field.description}>
                    <HelpCircle size={14} color="var(--text-muted)" />
                  </div>
                )}
              </div>

              {field.description && (
                <p style={fieldHintStyle}>{field.description}</p>
              )}

              {field.type === 'textarea' ? (
                <textarea 
                  value={answers[field.key] || ''}
                  onChange={(e) => handleFieldChange(field.key, e.target.value)}
                  placeholder={`Provide details for ${field.label}...`}
                  style={textareaStyle}
                  disabled={isLoading}
                />
              ) : (
                <input 
                  type="text"
                  value={answers[field.key] || ''}
                  onChange={(e) => handleFieldChange(field.key, e.target.value)}
                  placeholder={`e.g. 2024, or $15,000`}
                  style={inputStyle}
                  disabled={isLoading}
                />
              )}
            </div>
          ))}
        </div>

        {/* Action button */}
        <div style={footerStyle}>
          <Button 
            onClick={onSubmit} 
            disabled={isLoading || missingFields.length === 0}
            style={{ 
              gap: '10px', 
              paddingLeft: '32px', 
              paddingRight: '32px',
              boxShadow: '0 4px 15px var(--accent-glow)' 
            }}
          >
            {isLoading ? 'Generating High-Converting Copy...' : 'Tailor & Draft Document'}
            <ArrowRight size={16} />
          </Button>
        </div>
      </Card>
    </div>
  );
};

const containerStyle: React.CSSProperties = {
  marginBottom: '32px',
};

const panelCardStyle: React.CSSProperties = {
  padding: '32px',
  borderColor: 'var(--accent-primary)',
};

const alertBoxStyle: React.CSSProperties = {
  display: 'flex',
  gap: '16px',
  alignItems: 'flex-start',
  backgroundColor: 'rgba(99,102,241,0.05)',
  border: '1px solid rgba(99,102,241,0.15)',
  borderRadius: 'var(--radius-xl)',
  padding: '20px',
  marginBottom: '28px',
};

const alertTitleStyle: React.CSSProperties = {
  fontSize: '0.975rem',
  fontWeight: 700,
  color: 'var(--text-primary)',
  marginBottom: '4px',
};

const alertDescStyle: React.CSSProperties = {
  fontSize: '0.8rem',
  color: 'var(--text-secondary)',
  lineHeight: '1.4',
  margin: 0,
};

const formWrapperStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '24px',
  marginBottom: '32px',
};

const fieldContainerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
};

const labelRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
};

const labelStyle: React.CSSProperties = {
  fontSize: '0.925rem',
  fontWeight: 650,
  color: 'var(--text-primary)',
};

const tooltipWrapperStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  cursor: 'help',
};

const fieldHintStyle: React.CSSProperties = {
  fontSize: '0.75rem',
  color: 'var(--text-muted)',
  margin: '0 0 4px 0',
  lineHeight: '1.4',
};

const inputStyle: React.CSSProperties = {
  backgroundColor: 'var(--bg-secondary)',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--radius-lg)',
  color: 'var(--text-primary)',
  padding: '12px 16px',
  fontSize: '0.875rem',
  outline: 'none',
  width: '100%',
  transition: 'border-color 0.2s ease',
};

const textareaStyle: React.CSSProperties = {
  backgroundColor: 'var(--bg-secondary)',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--radius-lg)',
  color: 'var(--text-primary)',
  padding: '12px 16px',
  fontSize: '0.875rem',
  outline: 'none',
  minHeight: '100px',
  fontFamily: 'inherit',
  resize: 'vertical',
  width: '100%',
  transition: 'border-color 0.2s ease',
};

const footerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  borderTop: '1px solid var(--border-color)',
  paddingTop: '24px',
};
