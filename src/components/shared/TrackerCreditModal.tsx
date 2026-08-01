import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Coins, ArrowRight, X } from 'lucide-react';
import { CheckoutModal } from '../payment/CheckoutModal';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { formatCredits } from '../../utils/formatters';

interface TrackerCreditModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCredits?: number;
  requiredCredits?: number;
  actionName?: string;
}

export const TrackerCreditModal: React.FC<TrackerCreditModalProps> = ({
  isOpen,
  onClose,
  currentCredits = 0,
  requiredCredits = 0.25,
  actionName: _actionName = 'Application Tracker Entry',
}) => {
  const { t } = useTranslation();
  const [showCheckout, setShowCheckout] = useState(false);
  const navigate = useNavigate();

  if (!isOpen) return null;

  return (
    <>
      <div style={overlayStyle} onClick={onClose}>
        <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={iconContainerStyle}>
                <Coins size={24} color="#f59e0b" />
              </div>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                  {t('trackerQuota.modalTitle', 'Credits Required to Save Tracker Progress')}
                </h3>
                <Badge variant="warning" style={{ marginTop: '6px', fontSize: '0.6875rem' }}>
                  {t('trackerQuota.limitReachedBadge', '3 Free Actions Used')}
                </Badge>
              </div>
            </div>
            <button onClick={onClose} style={closeButtonStyle}>
              <X size={20} />
            </button>
          </div>

          <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '16px', borderRadius: '12px', marginBottom: '20px', border: '1px solid var(--border-color)' }}>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
              {t(
                'trackerQuota.limitDescription',
                'You have used your 3 free Application Tracker actions. Each additional tracker action (manual entries, Apply Now tracking, and generated CVs or proposals) costs 0.25 credits.'
              )}
            </p>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px', paddingTop: '12px', borderTop: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{t('trackerQuota.currentBalance', 'Your Current Credit Balance:')}</span>
              <span style={{ fontSize: '0.9375rem', fontWeight: 800, color: currentCredits < requiredCredits ? '#ef4444' : '#22c55e' }}>
                {formatCredits(currentCredits)} {t('common.credits', 'Credits')}
              </span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{t('trackerQuota.actionCost', 'Required for this action:')}</span>
              <span style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#f59e0b' }}>
                {formatCredits(requiredCredits)} {t('common.credits', 'Credits')}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <Button
              onClick={() => {
                setShowCheckout(true);
              }}
              style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: '0.9375rem', fontWeight: 700, gap: '8px' }}
            >
              <Coins size={18} />
              {t('trackerQuota.purchaseButton', 'Purchase Credits to Continue')}
              <ArrowRight size={16} />
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                onClose();
                navigate('/wallet');
              }}
              style={{ width: '100%', justifyContent: 'center', fontSize: '0.8125rem' }}
            >
              {t('trackerQuota.viewWallet', 'View Credit Wallet & Pricing')}
            </Button>
          </div>
        </div>
      </div>

      {showCheckout && (
        <CheckoutModal
          isOpen={showCheckout}
          onClose={() => setShowCheckout(false)}
          planTitle="Starter"
          planPrice="$9"
          planCredits="25"
        />
      )}
    </>
  );
};

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
};

const modalStyle: React.CSSProperties = {
  backgroundColor: 'var(--bg-primary)',
  borderRadius: 'var(--radius-xl)',
  border: '1px solid var(--border-color)',
  boxShadow: '0 24px 48px rgba(0, 0, 0, 0.4)',
  width: '90%',
  maxWidth: '480px',
  padding: '24px',
};

const iconContainerStyle: React.CSSProperties = {
  width: '44px',
  height: '44px',
  borderRadius: '12px',
  backgroundColor: 'rgba(245, 158, 11, 0.12)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
};

const closeButtonStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: 'var(--text-muted)',
  cursor: 'pointer',
  padding: '4px',
  borderRadius: '6px',
};
