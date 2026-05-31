import React from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { CheckCircle2, AlertTriangle, Lightbulb, Sparkles, TrendingUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ContextSummaryProps {
  matchSummary: {
    strongMatches: string[];
    gaps: string[];
    priorityPoints: string[];
  };
  confidence?: 'high' | 'medium' | 'low';
}

export const ContextSummary: React.FC<ContextSummaryProps> = ({
  matchSummary,
  confidence = 'medium',
}) => {
  const { t } = useTranslation();
  const { strongMatches = [], gaps = [], priorityPoints = [] } = matchSummary;

  // Calculate a mock fitness score based on counts
  const totalItems = strongMatches.length + gaps.length;
  const matchScore = totalItems > 0 ? Math.round((strongMatches.length / totalItems) * 100) : 75;

  return (
    <div style={containerStyle}>
      <div style={layoutGridStyle}>
        
        {/* Dynamic Fitness Score Gauge */}
        <Card style={gaugeCardStyle}>
          <div style={circleContainerStyle}>
            <svg width="120" height="120" style={svgStyle}>
              <circle 
                cx="60" 
                cy="60" 
                r="50" 
                stroke="var(--bg-tertiary)" 
                strokeWidth="10" 
                fill="transparent" 
              />
              <circle 
                cx="60" 
                cy="60" 
                r="50" 
                stroke="var(--accent-primary)" 
                strokeWidth="10" 
                fill="transparent" 
                strokeDasharray="314"
                strokeDashoffset={314 - (314 * matchScore) / 100}
                strokeLinecap="round"
                style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%', transition: 'stroke-dashoffset 0.8s ease' }}
              />
            </svg>
            <div style={scoreOverlayStyle}>
              <span style={scoreNumberStyle}>{matchScore}%</span>
              <span style={scoreLabelStyle}>{t('builders.context.atsFit', 'ATS FIT')}</span>
            </div>
          </div>

          <div style={gaugeMetaStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <TrendingUp size={16} color="var(--accent-primary)" />
              <span style={{ fontSize: '0.825rem', fontWeight: 600 }}>{t('builders.context.confidenceScore', 'Confidence Score')}</span>
            </div>
            <Badge 
              variant="primary" 
              style={{ 
                backgroundColor: confidence === 'high' ? 'rgba(16,185,129,0.1)' : confidence === 'medium' ? 'rgba(99,102,241,0.1)' : 'rgba(239,68,68,0.1)',
                color: confidence === 'high' ? '#10b981' : confidence === 'medium' ? 'var(--accent-primary)' : '#ef4444',
                textTransform: 'capitalize' 
              }}
            >
              {t('builders.context.accuracy', '{{level}} Accuracy', { level: confidence })}
            </Badge>
          </div>
        </Card>

        {/* Strategic recommendations / Recommendations */}
        <Card style={insightsCardStyle}>
          <div style={insightsHeaderStyle}>
            <Sparkles size={18} color="var(--accent-primary)" />
            <h4 style={{ fontSize: '0.975rem', fontWeight: 700 }}>{t('builders.context.aiAlignment', 'AI Strategic Alignment')}</h4>
          </div>
          <p style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', marginBottom: '14px' }}>
            {t('builders.context.aiAlignmentDesc', 'We compared your background documents against the opportunity requirements. Here is how we will optimize your draft:')}
          </p>

          <div style={priorityListStyle}>
            {priorityPoints.length > 0 ? (
              priorityPoints.map((point, idx) => (
                <div key={idx} style={priorityItemStyle}>
                  <Lightbulb size={16} color="#eab308" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span style={{ fontSize: '0.775rem', lineHeight: '1.4' }}>{point}</span>
                </div>
              ))
            ) : (
              <div style={priorityItemStyle}>
                <Lightbulb size={16} color="#eab308" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span style={{ fontSize: '0.775rem', lineHeight: '1.4' }}>
                  Structure headings dynamically to highlight relevant engineering keywords, past leadership metrics, and software design competencies.
                </span>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Strong Matches and Gaps Columns */}
      <div style={columnsGridStyle}>
        {/* Matches */}
        <Card style={colCardStyle}>
          <h4 style={{ ...colTitleStyle, color: '#10b981' }}>
            <CheckCircle2 size={16} /> {t('builders.context.keyStrengths', 'Key Strengths')}
          </h4>
          <div style={listStyle}>
            {strongMatches.length > 0 ? (
              strongMatches.map((m, i) => (
                <div key={i} style={listItemStyle}>
                  <span style={greenBulletStyle}></span>
                  <p style={itemTextStyle}>{m}</p>
                </div>
              ))
            ) : (
              <div style={listItemStyle}>
                <span style={greenBulletStyle}></span>
                <p style={itemTextStyle}>{t('builders.context.fallbackStrength', 'Background matching in core technical skills.')}</p>
              </div>
            )}
          </div>
        </Card>

        {/* Gaps */}
        <Card style={colCardStyle}>
          <h4 style={{ ...colTitleStyle, color: '#f97316' }}>
            <AlertTriangle size={16} /> {t('builders.context.contextGaps', 'Context Gaps Identified')}
          </h4>
          <div style={listStyle}>
            {gaps.length > 0 ? (
              gaps.map((g, i) => (
                <div key={i} style={listItemStyle}>
                  <span style={orangeBulletStyle}></span>
                  <p style={itemTextStyle}>{g}</p>
                </div>
              ))
            ) : (
              <div style={listItemStyle}>
                <span style={orangeBulletStyle}></span>
                <p style={itemTextStyle}>{t('builders.context.fallbackGap', 'No matching team leadership or scaling statistics found.')}</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

const containerStyle: React.CSSProperties = {
  marginBottom: '32px',
};

const layoutGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
  gap: '20px',
  marginBottom: '20px',
};

const gaugeCardStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  padding: '24px',
  gap: '24px',
};

const circleContainerStyle: React.CSSProperties = {
  position: 'relative',
  width: '120px',
  height: '120px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const svgStyle: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
};

const scoreOverlayStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
};

const scoreNumberStyle: React.CSSProperties = {
  fontSize: '1.5rem',
  fontWeight: 800,
  color: 'var(--text-primary)',
};

const scoreLabelStyle: React.CSSProperties = {
  fontSize: '0.625rem',
  fontWeight: 700,
  color: 'var(--text-secondary)',
  letterSpacing: '0.05em',
  marginTop: '2px',
};

const gaugeMetaStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
};

const insightsCardStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  padding: '24px',
};

const insightsHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  marginBottom: '10px',
};

const priorityListStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
  maxHeight: '120px',
  overflowY: 'auto',
};

const priorityItemStyle: React.CSSProperties = {
  display: 'flex',
  gap: '10px',
  alignItems: 'flex-start',
};

const columnsGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
  gap: '20px',
};

const colCardStyle: React.CSSProperties = {
  padding: '20px',
  minHeight: '180px',
};

const colTitleStyle: React.CSSProperties = {
  fontSize: '0.925rem',
  fontWeight: 750,
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  marginBottom: '16px',
};

const listStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
};

const listItemStyle: React.CSSProperties = {
  display: 'flex',
  gap: '12px',
  alignItems: 'flex-start',
};

const greenBulletStyle: React.CSSProperties = {
  width: '6px',
  height: '6px',
  borderRadius: '50%',
  backgroundColor: '#10b981',
  marginTop: '7px',
  flexShrink: 0,
};

const orangeBulletStyle: React.CSSProperties = {
  width: '6px',
  height: '6px',
  borderRadius: '50%',
  backgroundColor: '#f97316',
  marginTop: '7px',
  flexShrink: 0,
};

const itemTextStyle: React.CSSProperties = {
  fontSize: '0.8rem',
  lineHeight: '1.4',
  color: 'var(--text-secondary)',
  margin: 0,
};
