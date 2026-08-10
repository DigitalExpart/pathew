import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, Coins, Sparkles, Shield, Building2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { supabase } from '../../lib/supabase';

export interface PlanOption {
  title: string;
  price: string;
  credits: number;
  subtitle: string;
  badge?: string;
  badgeColor?: string;
  generatesUpTo?: Array<{ label: string; count: string }>;
  includedFeatures?: string[];
}

const DEFAULT_PLANS: PlanOption[] = [
  {
    title: 'Starter',
    price: '£11.99',
    credits: 25,
    subtitle: 'Perfect for smaller application rounds & small team tasks.',
    generatesUpTo: [
      { label: 'Cover Letters', count: '25×' },
      { label: 'CVs / Resumes', count: '12×' },
      { label: 'Proposals', count: '25×' },
      { label: 'Grant Applications', count: '8×' },
      { label: 'Rewrites', count: '100×' },
    ],
    includedFeatures: [
      'Full organization credit pool access',
      'Shared team member balance',
      'Live opportunities & readiness score',
    ],
  },
  {
    title: 'Growth',
    price: '£25.00',
    credits: 65,
    subtitle: 'For active organizations applying across multiple roles.',
    badge: '★ MOST POPULAR ★',
    badgeColor: 'var(--accent-primary, #f59e0b)',
    generatesUpTo: [
      { label: 'Cover Letters', count: '65×' },
      { label: 'CVs / Resumes', count: '32×' },
      { label: 'Proposals', count: '65×' },
      { label: 'Grant Applications', count: '21×' },
      { label: 'Rewrites', count: '260×' },
    ],
    includedFeatures: [
      'Full organization credit pool access',
      'Shared team member balance',
      'Live opportunities & readiness score',
    ],
  },
  {
    title: 'Power User',
    price: '£48.00',
    credits: 160,
    subtitle: 'For agencies, enterprise teams & high-volume generation.',
    badge: '★ BEST VALUE ★',
    badgeColor: '#3b82f6',
    generatesUpTo: [
      { label: 'Cover Letters', count: '160×' },
      { label: 'CVs / Resumes', count: '80×' },
      { label: 'Proposals', count: '160×' },
      { label: 'Grant Applications', count: '53×' },
      { label: 'Rewrites', count: '640×' },
    ],
    includedFeatures: [
      'Full organization credit pool access',
      'Shared team member balance',
      'Priority generation & support',
    ],
  },
];

interface OrgPlanSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPlan: (plan: { title: string; price: string; credits: number }) => void;
}

export const OrgPlanSelectionModal: React.FC<OrgPlanSelectionModalProps> = ({
  isOpen,
  onClose,
  onSelectPlan,
}) => {
  const [plans, setPlans] = useState<PlanOption[]>(DEFAULT_PLANS);

  useEffect(() => {
    fetchCustomPlans();
  }, []);

  const fetchCustomPlans = async () => {
    try {
      const { data } = await supabase.from('app_settings').select('*').eq('id', 'pricing_tiers').single();
      if (data && Array.isArray(data.value) && data.value.length > 0) {
        const mapped: PlanOption[] = data.value.map((p: any) => ({
          title: p.title || p.name || 'Custom Plan',
          price: typeof p.price === 'number' ? `£${p.price}` : p.price || '£25.00',
          credits: typeof p.credits === 'number' ? p.credits : parseInt(p.credits || '65', 10),
          subtitle: p.subtitle || p.description || 'Organization Credit Package',
          badge: p.badge,
          badgeColor: p.badgeColor || 'var(--accent-primary, #f59e0b)',
          generatesUpTo: p.generatesUpTo || [
            { label: 'Cover Letters', count: `${Math.floor(p.credits || 65)}×` },
            { label: 'Proposals', count: `${Math.floor(p.credits || 65)}×` },
          ],
          includedFeatures: p.includedFeatures || [
            'Full organization credit pool access',
            'Shared team member balance',
          ],
        }));
        setPlans(mapped);
      }
    } catch {
      // Use DEFAULT_PLANS fallback
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(8px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          overflowY: 'auto',
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            backgroundColor: 'var(--bg-primary, #0f172a)',
            width: '100%',
            maxWidth: '1050px',
            borderRadius: '24px',
            border: '1px solid var(--border-color, rgba(255, 255, 255, 0.1))',
            overflow: 'hidden',
            boxShadow: '0 25px 60px -12px rgba(0, 0, 0, 0.7)',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '90vh',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '24px 32px',
              borderBottom: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: 'var(--bg-secondary, #1e293b)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(245, 158, 11, 0.25)',
                }}
              >
                <Building2 size={24} color="#000" />
              </div>
              <div>
                <h2
                  style={{
                    fontSize: '1.35rem',
                    fontWeight: 800,
                    margin: 0,
                    color: 'var(--text-primary, #fff)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  Select Organization Credit Plan
                </h2>
                <p
                  style={{
                    fontSize: '0.85rem',
                    color: 'var(--text-muted, #94a3b8)',
                    margin: '3px 0 0 0',
                  }}
                >
                  Choose a credit plan for your organization wallet. Credits are shared among all team members.
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: 'none',
                color: 'var(--text-muted, #94a3b8)',
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
              }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Cards Grid Container */}
          <div
            style={{
              padding: '32px',
              overflowY: 'auto',
              flex: 1,
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '24px',
                alignItems: 'stretch',
              }}
            >
              {plans.map((plan) => {
                const isHighlight = !!plan.badge;
                const badgeBg = plan.badgeColor || 'var(--accent-primary, #f59e0b)';

                return (
                  <div
                    key={plan.title}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      padding: '32px 24px 24px',
                      position: 'relative',
                      backgroundColor: isHighlight
                        ? 'var(--bg-secondary, #1e293b)'
                        : 'var(--bg-secondary, #182234)',
                      borderRadius: '20px',
                      border: `1.5px solid ${isHighlight ? badgeBg : 'var(--border-color, rgba(255,255,255,0.1))'}`,
                      boxShadow: isHighlight
                        ? `0 12px 30px -10px ${badgeBg}33`
                        : 'none',
                    }}
                  >
                    {plan.badge && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '-13px',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          backgroundColor: badgeBg,
                          color: '#000',
                          padding: '5px 14px',
                          borderRadius: '20px',
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          letterSpacing: '0.05em',
                          textTransform: 'uppercase',
                          whiteSpace: 'nowrap',
                          boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
                        }}
                      >
                        {plan.badge}
                      </div>
                    )}

                    <h3
                      style={{
                        fontSize: '1.35rem',
                        fontWeight: 700,
                        margin: '0 0 12px 0',
                        color: 'var(--text-primary, #fff)',
                      }}
                    >
                      {plan.title}
                    </h3>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'baseline',
                        marginBottom: '6px',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '2.5rem',
                          fontWeight: 800,
                          color: 'var(--text-primary, #fff)',
                          lineHeight: 1,
                        }}
                      >
                        {plan.price}
                      </span>
                      <span
                        style={{
                          color: 'var(--text-muted, #94a3b8)',
                          fontSize: '0.875rem',
                          marginLeft: '8px',
                        }}
                      >
                        / month
                      </span>
                    </div>

                    <div
                      style={{
                        color: 'var(--accent-primary, #f59e0b)',
                        fontWeight: 700,
                        fontSize: '1rem',
                        marginBottom: '18px',
                        paddingBottom: '16px',
                        borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.08))',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <Coins size={18} />
                      {plan.credits} Organization Credits
                    </div>

                    <p
                      style={{
                        color: 'var(--text-muted, #94a3b8)',
                        fontSize: '0.85rem',
                        lineHeight: 1.45,
                        marginBottom: '20px',
                        minHeight: '40px',
                      }}
                    >
                      {plan.subtitle}
                    </p>

                    {plan.generatesUpTo && plan.generatesUpTo.length > 0 && (
                      <div style={{ marginBottom: '20px' }}>
                        <div
                          style={{
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            letterSpacing: '0.05em',
                            color: 'var(--text-muted, #64748b)',
                            marginBottom: '10px',
                            textTransform: 'uppercase',
                          }}
                        >
                          Generates Up To
                        </div>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                          {plan.generatesUpTo.map((g) => (
                            <li
                              key={g.label}
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                marginBottom: '6px',
                                fontSize: '0.85rem',
                                color: 'var(--text-primary, #e2e8f0)',
                              }}
                            >
                              <span>{g.label}</span>
                              <span style={{ fontWeight: 700, color: 'var(--text-primary, #fff)' }}>
                                {g.count}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {plan.includedFeatures && (
                      <div style={{ marginBottom: '28px', flex: 1 }}>
                        <div
                          style={{
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            letterSpacing: '0.05em',
                            color: 'var(--text-muted, #64748b)',
                            marginBottom: '10px',
                            textTransform: 'uppercase',
                          }}
                        >
                          Included Features
                        </div>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                          {plan.includedFeatures.map((f) => (
                            <li
                              key={f}
                              style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '8px',
                                marginBottom: '8px',
                                color: 'var(--text-muted, #94a3b8)',
                                fontSize: '0.825rem',
                                lineHeight: 1.4,
                              }}
                            >
                              <CheckCircle2
                                size={15}
                                color="var(--accent-primary, #f59e0b)"
                                style={{ flexShrink: 0, marginTop: '2px' }}
                              />
                              <span>{f}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div style={{ marginTop: 'auto' }}>
                      <Button
                        onClick={() =>
                          onSelectPlan({
                            title: plan.title,
                            price: plan.price,
                            credits: plan.credits,
                          })
                        }
                        variant={isHighlight ? 'primary' : 'outline'}
                        style={{
                          width: '100%',
                          padding: '14px',
                          fontWeight: 700,
                          borderRadius: '12px',
                          justifyContent: 'center',
                          gap: '8px',
                        }}
                      >
                        <Sparkles size={16} />
                        Choose {plan.title} Plan
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer Security Note */}
          <div
            style={{
              padding: '16px 32px',
              borderTop: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
              backgroundColor: 'var(--bg-secondary, #1e293b)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              fontSize: '0.78rem',
              color: 'var(--text-muted, #64748b)',
            }}
          >
            <Shield size={14} color="#22c55e" />
            <span>Secure Checkout • Instant Credit Balance Allocation • Cancel or Upgrade Anytime</span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
