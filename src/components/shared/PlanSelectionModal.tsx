import React, { useState, useMemo } from 'react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import {
  Target,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  X,
  FileText,
  BookOpen,
  Zap,
  Star,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  parseDeadline,
  getDaysUntilDeadline,
  getRecommendedPlan,
  formatDaysRemaining,
  PLAN_DURATIONS,
  type PlanDurationKey,
} from '../../utils/deadlineUtils';

interface PlanSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (duration: string, pages: number) => void;
  deadline?: string | null;
  opportunityTitle?: string;
}

export const PlanSelectionModal: React.FC<PlanSelectionModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  deadline,
  opportunityTitle,
}) => {
  const { t } = useTranslation();
  const [selectedPlan, setSelectedPlan] = useState<PlanDurationKey | null>(null);
  const [selectedPages, setSelectedPages] = useState<number>(1);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const parsedDeadline = useMemo(() => parseDeadline(deadline), [deadline]);
  const daysLeft = useMemo(
    () => (parsedDeadline ? getDaysUntilDeadline(parsedDeadline) : null),
    [parsedDeadline]
  );
  const recommendation = useMemo(() => getRecommendedPlan(parsedDeadline), [parsedDeadline]);

  // Auto-select recommended plan on open
  React.useEffect(() => {
    if (isOpen && !selectedPlan) {
      setSelectedPlan(recommendation.recommended);
    }
  }, [isOpen, recommendation.recommended]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (selectedPlan) {
      onSelect(selectedPlan, selectedPages);
      setSelectedPlan(null);
      setSelectedPages(1);
    }
  };

  const handleClose = () => {
    setSelectedPlan(null);
    setSelectedPages(1);
    onClose();
  };

  const getPlanIcon = (key: string) => {
    switch (key) {
      case '90-day':
        return Zap;
      case '180-day':
        return Target;
      case '365-day':
        return Star;
      default:
        return Target;
    }
  };

  const getPlanColor = (key: string) => {
    switch (key) {
      case '90-day':
        return '#22c55e';
      case '180-day':
        return 'var(--accent-primary)';
      case '365-day':
        return '#8b5cf6';
      default:
        return 'var(--accent-primary)';
    }
  };

  const getPlanDescription = (key: string): string => {
    switch (key) {
      case '90-day':
        return t('planSelection.currentCycleDesc', 'Focused sprint to apply within the current application window.');
      case '180-day':
        return t('planSelection.nextCycleDesc', 'Build skills and prepare for the next application round.');
      case '365-day':
        return t('planSelection.futuresCycleDesc', 'Comprehensive long-term growth and career transformation.');
      default:
        return '';
    }
  };

  return (
    <div style={overlayStyle} onClick={handleClose}>
      <div
        style={{
          ...modalStyle,
          width: isMobile ? '95%' : '560px',
          maxHeight: '90vh',
          padding: isMobile ? '20px' : '32px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={headerStyle}>
          <div>
            <h2 style={{ fontSize: isMobile ? '1.25rem' : '1.5rem', fontWeight: 800, marginBottom: '4px' }}>
              {t('planSelection.title', 'Choose Your Preparation Plan')}
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              {opportunityTitle
                ? t('planSelection.subtitleFor', 'Select a timeframe for "{{title}}"', { title: opportunityTitle })
                : t('planSelection.subtitle', 'Select a timeframe based on your fellowship deadline.')}
            </p>
          </div>
          <button onClick={handleClose} style={closeButtonStyle}>
            <X size={20} />
          </button>
        </div>

        {/* Deadline Status Bar */}
        {parsedDeadline && daysLeft !== null && (
          <div
            style={{
              ...deadlineBarStyle,
              backgroundColor:
                daysLeft < 0
                  ? 'rgba(239, 68, 68, 0.08)'
                  : daysLeft < 30
                  ? 'rgba(234, 179, 8, 0.08)'
                  : 'rgba(34, 197, 94, 0.08)',
              borderColor:
                daysLeft < 0
                  ? 'rgba(239, 68, 68, 0.2)'
                  : daysLeft < 30
                  ? 'rgba(234, 179, 8, 0.2)'
                  : 'rgba(34, 197, 94, 0.2)',
            }}
          >
            <Calendar
              size={16}
              color={daysLeft < 0 ? '#ef4444' : daysLeft < 30 ? '#eab308' : '#22c55e'}
            />
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>
                {t('planSelection.deadline', 'Deadline')}: {parsedDeadline.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
              </span>
              <span
                style={{
                  fontSize: '0.75rem',
                  color: daysLeft < 0 ? '#ef4444' : daysLeft < 30 ? '#eab308' : '#22c55e',
                  marginLeft: '8px',
                  fontWeight: 700,
                }}
              >
                ({formatDaysRemaining(daysLeft)})
              </span>
            </div>
          </div>
        )}

        {/* Plan Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px', overflowY: 'auto' }}>
          {PLAN_DURATIONS.map((plan) => {
            const isSelected = selectedPlan === plan.key;
            const isRecommended = recommendation.recommended === plan.key;
            const warning = recommendation.warnings[plan.key];
            const planColor = getPlanColor(plan.key);
            const PlanIcon = getPlanIcon(plan.key);

            return (
              <div
                key={plan.key}
                onClick={() => setSelectedPlan(plan.key as PlanDurationKey)}
                style={{
                  ...planCardStyle,
                  borderColor: isSelected
                    ? planColor
                    : 'var(--border-color)',
                  backgroundColor: isSelected
                    ? `${planColor}08`
                    : 'var(--bg-secondary)',
                  boxShadow: isSelected
                    ? `0 0 0 1px ${planColor}, 0 4px 12px ${planColor}15`
                    : 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '12px',
                      backgroundColor: `${planColor}15`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <PlanIcon size={22} color={planColor} />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                      <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>
                        {plan.label}
                      </h3>
                      {isRecommended && (
                        <Badge variant="success" style={{ fontSize: '0.65rem', padding: '2px 8px' }}>
                          ★ {t('planSelection.recommended', 'Recommended')}
                        </Badge>
                      )}
                    </div>

                    <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: '0 0 4px 0', lineHeight: 1.4 }}>
                      {getPlanDescription(plan.key)}
                    </p>

                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {t(`planSelection.${plan.intentKey}`, '')}
                    </span>

                    {/* Per-plan warning */}
                    {warning && (
                      <div style={warningStyle}>
                        <AlertTriangle size={13} color="#eab308" style={{ flexShrink: 0, marginTop: '1px' }} />
                        <span style={{ fontSize: '0.75rem', color: '#eab308', lineHeight: 1.3 }}>
                          {t(warning.key, { ...warning.params })}
                        </span>
                      </div>
                    )}
                  </div>

                  <div style={{ flexShrink: 0, marginTop: '10px' }}>
                    <div
                      style={{
                        width: '22px',
                        height: '22px',
                        borderRadius: '50%',
                        border: `2px solid ${isSelected ? planColor : 'var(--border-color)'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {isSelected && (
                        <div
                          style={{
                            width: '12px',
                            height: '12px',
                            borderRadius: '50%',
                            backgroundColor: planColor,
                          }}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Page Count Selector */}
        <div style={{ marginBottom: '24px' }}>
          <p style={{ fontSize: '0.8125rem', fontWeight: 700, marginBottom: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {t('planSelection.pageCount', 'Plan Detail Level')}
          </p>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => setSelectedPages(1)}
              style={{
                ...pageOptionStyle,
                borderColor: selectedPages === 1 ? 'var(--accent-primary)' : 'var(--border-color)',
                backgroundColor: selectedPages === 1 ? 'rgba(245, 158, 11, 0.06)' : 'var(--bg-secondary)',
                boxShadow: selectedPages === 1 ? '0 0 0 1px var(--accent-primary)' : 'none',
              }}
            >
              <FileText
                size={20}
                color={selectedPages === 1 ? 'var(--accent-primary)' : 'var(--text-muted)'}
              />
              <div style={{ textAlign: 'left' }}>
                <p style={{ fontSize: '0.875rem', fontWeight: 700, margin: 0, color: selectedPages === 1 ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                  {t('planSelection.page1', '1-Page')}
                </p>
                <p style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', margin: 0 }}>
                  {t('planSelection.page1Desc', 'Concise overview')}
                </p>
              </div>
            </button>
            <button
              onClick={() => setSelectedPages(3)}
              style={{
                ...pageOptionStyle,
                borderColor: selectedPages === 3 ? 'var(--accent-primary)' : 'var(--border-color)',
                backgroundColor: selectedPages === 3 ? 'rgba(245, 158, 11, 0.06)' : 'var(--bg-secondary)',
                boxShadow: selectedPages === 3 ? '0 0 0 1px var(--accent-primary)' : 'none',
              }}
            >
              <BookOpen
                size={20}
                color={selectedPages === 3 ? 'var(--accent-primary)' : 'var(--text-muted)'}
              />
              <div style={{ textAlign: 'left' }}>
                <p style={{ fontSize: '0.875rem', fontWeight: 700, margin: 0, color: selectedPages === 3 ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                  {t('planSelection.page3', '3-Page')}
                </p>
                <p style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', margin: 0 }}>
                  {t('planSelection.page3Desc', 'Detailed roadmap')}
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Confirm Button */}
        <Button
          onClick={handleConfirm}
          disabled={!selectedPlan}
          style={{
            width: '100%',
            justifyContent: 'center',
            padding: '14px',
            fontSize: '0.9375rem',
            fontWeight: 700,
            gap: '10px',
            opacity: selectedPlan ? 1 : 0.5,
          }}
        >
          <CheckCircle2 size={18} />
          {t('planSelection.confirm', 'Start This Plan')}
          <ChevronRight size={16} />
        </Button>
      </div>
    </div>
  );
};

// ─── Styles ────────────────────────────────────────────────────────

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.75)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 2000,
  backdropFilter: 'blur(8px)',
  animation: 'fadeIn 0.2s ease-out',
};

const modalStyle: React.CSSProperties = {
  backgroundColor: 'var(--bg-primary)',
  borderRadius: 'var(--radius-xl)',
  border: '1px solid var(--border-color)',
  boxShadow: '0 24px 48px rgba(0, 0, 0, 0.4)',
  overflowY: 'auto',
  animation: 'scaleIn 0.2s ease-out',
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: '20px',
  gap: '12px',
};

const closeButtonStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: 'var(--text-muted)',
  cursor: 'pointer',
  padding: '8px',
  borderRadius: '8px',
  transition: 'all 0.2s ease',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
};

const deadlineBarStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  padding: '10px 14px',
  borderRadius: 'var(--radius-md)',
  border: '1px solid',
  marginBottom: '16px',
};

const planCardStyle: React.CSSProperties = {
  padding: '16px',
  borderRadius: 'var(--radius-lg)',
  border: '1.5px solid',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
};

const warningStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: '6px',
  marginTop: '8px',
  padding: '6px 10px',
  backgroundColor: 'rgba(234, 179, 8, 0.06)',
  borderRadius: '6px',
  border: '1px solid rgba(234, 179, 8, 0.15)',
};

const pageOptionStyle: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: '14px 16px',
  borderRadius: 'var(--radius-lg)',
  border: '1.5px solid',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  background: 'none',
};
