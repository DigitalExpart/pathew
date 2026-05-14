import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock, CheckCircle2, Shield, CreditCard, Zap } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardNumberElement, CardExpiryElement, CardCvcElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '../ui/Button';

// TODO: Replace with your actual Stripe publishable key
const stripePromise = loadStripe('pk_test_placeholder');

/* ── Stripe Element shared styling ─────────────────────────── */
const stripeElementStyle = {
  base: {
    fontSize: '16px',
    color: '#e2e8f0',
    fontFamily: '"Inter", -apple-system, sans-serif',
    fontSmoothing: 'antialiased',
    '::placeholder': { color: '#64748b' },
    iconColor: '#f59e0b',
  },
  invalid: { color: '#f87171', iconColor: '#f87171' },
};

/* ── SVG card brand icons ──────────────────────────────────── */
const VisaIcon = () => (
  <svg width="38" height="24" viewBox="0 0 38 24" fill="none">
    <rect width="38" height="24" rx="4" fill="#1A1F71"/>
    <path d="M15.2 16.5L16.8 7.5H19.2L17.6 16.5H15.2Z" fill="#fff"/>
    <path d="M25.4 7.7C24.9 7.5 24.1 7.3 23.1 7.3C20.7 7.3 19 8.6 19 10.3C19 11.6 20.1 12.3 21 12.7C21.9 13.1 22.2 13.4 22.2 13.8C22.2 14.4 21.5 14.7 20.8 14.7C19.9 14.7 19.4 14.6 18.6 14.2L18.3 14.1L18 16C18.6 16.3 19.6 16.5 20.7 16.5C23.3 16.5 24.9 15.3 24.9 13.4C24.9 12.4 24.3 11.6 23 11C22.2 10.6 21.7 10.3 21.7 9.9C21.7 9.5 22.1 9.1 23 9.1C23.8 9.1 24.4 9.2 24.8 9.4L25 9.5L25.4 7.7Z" fill="#fff"/>
    <path d="M28.1 7.5H26.2C25.6 7.5 25.2 7.7 24.9 8.3L21.5 16.5H24.1L24.6 15.1H27.7L28 16.5H30.3L28.1 7.5ZM25.3 13.2L26.5 10.1L27.2 13.2H25.3Z" fill="#fff"/>
    <path d="M13.6 7.5L11.2 13.5L10.9 12L10 8.4C9.9 7.8 9.4 7.5 8.8 7.5H5.1L5 7.7C5.9 7.9 6.8 8.3 7.5 8.7L9.7 16.5H12.3L16.2 7.5H13.6Z" fill="#fff"/>
  </svg>
);

const MastercardIcon = () => (
  <svg width="38" height="24" viewBox="0 0 38 24" fill="none">
    <rect width="38" height="24" rx="4" fill="#252525"/>
    <circle cx="15" cy="12" r="7" fill="#EB001B"/>
    <circle cx="23" cy="12" r="7" fill="#F79E1B"/>
    <path d="M19 6.8C20.5 8 21.5 9.9 21.5 12C21.5 14.1 20.5 16 19 17.2C17.5 16 16.5 14.1 16.5 12C16.5 9.9 17.5 8 19 6.8Z" fill="#FF5F00"/>
  </svg>
);

const AmexIcon = () => (
  <svg width="38" height="24" viewBox="0 0 38 24" fill="none">
    <rect width="38" height="24" rx="4" fill="#2E77BC"/>
    <text x="19" y="14" textAnchor="middle" fill="#fff" fontSize="7" fontWeight="bold" fontFamily="Arial">AMEX</text>
  </svg>
);

const ApplePayIcon = () => (
  <svg width="46" height="24" viewBox="0 0 46 24" fill="none">
    <rect width="46" height="24" rx="4" fill="#000"/>
    <text x="23" y="14.5" textAnchor="middle" fill="#fff" fontSize="8" fontWeight="600" fontFamily="Arial"> Pay</text>
    <path d="M12.5 7.5C12.1 8 11.5 8.3 10.9 8.3C10.8 7.7 11.1 7.1 11.4 6.7C11.8 6.2 12.4 5.9 12.9 5.9C13 6.5 12.8 7.1 12.5 7.5ZM12.9 8.5C12.2 8.4 11.5 8.9 11.1 8.9C10.7 8.9 10.1 8.5 9.5 8.5C8.7 8.6 8 9 7.6 9.7C6.8 11.1 7.4 13.2 8.2 14.3C8.6 14.9 9.1 15.5 9.7 15.5C10.3 15.5 10.5 15.1 11.2 15.1C11.9 15.1 12.1 15.5 12.7 15.5C13.3 15.5 13.8 14.9 14.2 14.3C14.4 13.9 14.6 13.5 14.7 13.1C14 12.8 13.5 12.1 13.5 11.3C13.5 10.6 13.9 10 14.4 9.6C14.1 9 13.5 8.5 12.9 8.5Z" fill="#fff"/>
  </svg>
);

const GooglePayIcon = () => (
  <svg width="46" height="24" viewBox="0 0 46 24" fill="none">
    <rect width="46" height="24" rx="4" fill="#fff" stroke="#e2e8f0"/>
    <text x="32" y="14.5" textAnchor="middle" fill="#5f6368" fontSize="7.5" fontWeight="500" fontFamily="Arial">Pay</text>
    <path d="M16.8 12.2V15H15.6V7.5H18.4C19.1 7.5 19.7 7.8 20.2 8.2C20.7 8.7 20.9 9.2 20.9 9.9C20.9 10.6 20.7 11.1 20.2 11.6C19.7 12 19.1 12.2 18.4 12.2H16.8ZM16.8 8.6V11.1H18.4C18.8 11.1 19.1 11 19.4 10.7C19.6 10.5 19.8 10.2 19.8 9.9C19.8 9.5 19.6 9.2 19.4 9C19.1 8.7 18.8 8.6 18.4 8.6H16.8Z" fill="#4285F4"/>
    <path d="M23.7 9.8C24.5 9.8 25.2 10 25.7 10.5C26.2 11 26.4 11.6 26.4 12.4V15H25.3V14.2H25.2C24.8 14.8 24.2 15.1 23.5 15.1C22.9 15.1 22.4 14.9 22 14.6C21.6 14.3 21.4 13.8 21.4 13.3C21.4 12.8 21.6 12.3 22 12C22.4 11.7 23 11.5 23.7 11.5C24.3 11.5 24.8 11.6 25.2 11.8V11.6C25.2 11.2 25 10.9 24.8 10.7C24.5 10.5 24.2 10.3 23.8 10.3C23.2 10.3 22.8 10.6 22.5 11L21.5 10.4C22 9.7 22.8 9.8 23.7 9.8ZM22.6 13.3C22.6 13.6 22.7 13.8 22.9 13.9C23.2 14.1 23.4 14.2 23.7 14.2C24.2 14.2 24.6 14 24.9 13.7C25.2 13.4 25.4 13 25.4 12.6C25 12.3 24.5 12.2 23.9 12.2C23.5 12.2 23.1 12.3 22.9 12.5C22.7 12.7 22.6 13 22.6 13.3Z" fill="#4285F4"/>
  </svg>
);

/* ── Checkout Form ─────────────────────────────────────────── */
const CheckoutForm = ({ planTitle, planPrice, planCredits, onSuccess, onCancel }: any) => {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [cardComplete, setCardComplete] = useState({ number: false, expiry: false, cvc: false });

  const isFormComplete = cardComplete.number && cardComplete.expiry && cardComplete.cvc;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);
    setError(null);

    const cardNumber = elements.getElement(CardNumberElement);
    if (!cardNumber) return;

    // TODO: Replace with actual backend API call
    // const res = await fetch('/api/create-payment-intent', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ plan: planTitle, amount: planPrice }),
    // });
    // const { clientSecret } = await res.json();
    // const { error: stripeError } = await stripe.confirmCardPayment(clientSecret, {
    //   payment_method: { card: cardNumber }
    // });
    // if (stripeError) { setError(stripeError.message || 'Payment failed'); setProcessing(false); return; }

    // Simulate payment processing
    setTimeout(() => {
      setProcessing(false);
      onSuccess();
    }, 2500);
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
      {/* Plan Summary */}
      <div style={planSummaryStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={planIconStyle}>
            <Zap size={20} color="#f59e0b" />
          </div>
          <div>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Subscribe to</p>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0 }}>{planTitle} Plan</h3>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f59e0b', margin: 0 }}>{planPrice}</p>
          <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>per month</p>
        </div>
      </div>

      {/* Credits info */}
      {planCredits && (
        <div style={{ padding: '12px 20px', backgroundColor: 'rgba(245, 158, 11, 0.06)', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle2 size={14} color="#f59e0b" />
          <span style={{ fontSize: '0.8125rem', color: '#94a3b8' }}>{planCredits} included with this plan</span>
        </div>
      )}

      {/* Accepted Payment Methods */}
      <div style={{ padding: '20px 24px 16px' }}>
        <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pay with</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <VisaIcon />
          <MastercardIcon />
          <AmexIcon />
          <div style={{ width: '1px', height: '20px', backgroundColor: 'rgba(255,255,255,0.1)', margin: '0 4px' }} />
          <ApplePayIcon />
          <GooglePayIcon />
        </div>
      </div>

      {/* Card Input Fields */}
      <div style={{ padding: '0 24px 24px' }}>
        {/* Card Number */}
        <div style={{ marginBottom: '16px' }}>
          <label style={labelStyle}>Card number</label>
          <div style={inputWrapperStyle}>
            <CreditCard size={18} color="#64748b" style={{ flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <CardNumberElement
                options={{ style: stripeElementStyle, showIcon: false }}
                onChange={(e) => setCardComplete((s) => ({ ...s, number: e.complete }))}
              />
            </div>
          </div>
        </div>

        {/* Expiry + CVC row */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Expiry date</label>
            <div style={inputWrapperStyle}>
              <CardExpiryElement
                options={{ style: stripeElementStyle }}
                onChange={(e) => setCardComplete((s) => ({ ...s, expiry: e.complete }))}
              />
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Security code</label>
            <div style={inputWrapperStyle}>
              <CardCvcElement
                options={{ style: stripeElementStyle }}
                onChange={(e) => setCardComplete((s) => ({ ...s, cvc: e.complete }))}
              />
            </div>
          </div>
        </div>

        {error && (
          <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} style={{ color: '#f87171', fontSize: '0.8125rem', marginTop: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <X size={14} /> {error}
          </motion.p>
        )}
      </div>

      {/* Actions */}
      <div style={{ padding: '0 24px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <motion.button
          type="submit"
          disabled={!stripe || processing || !isFormComplete}
          whileHover={isFormComplete && !processing ? { scale: 1.01, boxShadow: '0 0 30px rgba(245, 158, 11, 0.3)' } : {}}
          whileTap={isFormComplete && !processing ? { scale: 0.99 } : {}}
          style={{
            width: '100%', padding: '16px', border: 'none', borderRadius: '12px', fontSize: '1rem', fontWeight: 700, cursor: isFormComplete && !processing ? 'pointer' : 'not-allowed',
            background: isFormComplete ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : 'rgba(255,255,255,0.08)',
            color: isFormComplete ? '#000' : '#64748b',
            transition: 'all 0.3s ease', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          }}
        >
          {processing ? (
            <>
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} style={{ width: 18, height: 18, border: '2px solid rgba(0,0,0,0.2)', borderTopColor: '#000', borderRadius: '50%' }} />
              Processing payment...
            </>
          ) : (
            <>
              <Lock size={16} />
              Pay {planPrice}
            </>
          )}
        </motion.button>

        <button type="button" onClick={onCancel} disabled={processing} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '0.875rem', padding: '8px', transition: 'color 0.2s' }}>
          Cancel
        </button>
      </div>

      {/* Security Footer */}
      <div style={securityFooterStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Shield size={13} color="#22c55e" />
          <span>SSL Encrypted</span>
        </div>
        <span>•</span>
        <span>PCI Compliant</span>
        <span>•</span>
        <span>Powered by Stripe</span>
      </div>
    </form>
  );
};

/* ── Main Modal ────────────────────────────────────────────── */
export const StripeCheckoutModal = ({ isOpen, onClose, planTitle, planPrice, planCredits }: any) => {
  const [success, setSuccess] = useState(false);

  const handleClose = () => {
    setSuccess(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleClose}
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(8px)',
          zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '20px',
        }}
      >
        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 30 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          style={modalStyle}
        >
          {/* Header */}
          <div style={headerStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Lock size={16} color="#000" />
              </div>
              <div>
                <h2 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0, lineHeight: 1.2 }}>Secure Checkout</h2>
                <p style={{ fontSize: '0.6875rem', color: '#64748b', margin: 0 }}>256-bit SSL encryption</p>
              </div>
            </div>
            <motion.button
              whileHover={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
              onClick={handleClose}
              style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '8px', borderRadius: '8px', display: 'flex' }}
            >
              <X size={18} />
            </motion.button>
          </div>

          {/* Body */}
          {success ? (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={{ padding: '48px 24px', textAlign: 'center' }}>
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.1, damping: 10 }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(34, 197, 94, 0.1)', border: '2px solid rgba(34, 197, 94, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                  <CheckCircle2 size={40} color="#22c55e" />
                </div>
              </motion.div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '8px' }}>Payment Successful!</h3>
              <p style={{ color: '#94a3b8', marginBottom: '8px', lineHeight: 1.5 }}>Welcome to the <strong style={{ color: '#f59e0b' }}>{planTitle}</strong> plan.</p>
              <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '32px' }}>Your credits have been added to your account.</p>
              <Button onClick={handleClose} style={{ width: '100%', padding: '14px' }}>Continue to Dashboard</Button>
            </motion.div>
          ) : (
            <Elements stripe={stripePromise}>
              <CheckoutForm
                planTitle={planTitle}
                planPrice={planPrice}
                planCredits={planCredits}
                onSuccess={() => setSuccess(true)}
                onCancel={handleClose}
              />
            </Elements>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

/* ── Styles ─────────────────────────────────────────────────── */
const modalStyle: React.CSSProperties = {
  backgroundColor: '#0f172a',
  width: '100%',
  maxWidth: '440px',
  borderRadius: '20px',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  overflow: 'hidden',
  boxShadow: '0 25px 60px -12px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255,255,255,0.05)',
};

const headerStyle: React.CSSProperties = {
  padding: '20px 24px',
  borderBottom: '1px solid rgba(255,255,255,0.06)',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const planSummaryStyle: React.CSSProperties = {
  padding: '20px 24px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  borderBottom: '1px solid rgba(255,255,255,0.05)',
  background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.04) 0%, rgba(245, 158, 11, 0.01) 100%)',
};

const planIconStyle: React.CSSProperties = {
  width: '44px',
  height: '44px',
  borderRadius: '12px',
  backgroundColor: 'rgba(245, 158, 11, 0.1)',
  border: '1px solid rgba(245, 158, 11, 0.2)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  marginBottom: '8px',
  fontSize: '0.8125rem',
  fontWeight: 600,
  color: '#94a3b8',
};

const inputWrapperStyle: React.CSSProperties = {
  padding: '14px 16px',
  backgroundColor: 'rgba(255, 255, 255, 0.04)',
  borderRadius: '10px',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
};

const securityFooterStyle: React.CSSProperties = {
  padding: '14px 24px',
  borderTop: '1px solid rgba(255,255,255,0.05)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  fontSize: '0.6875rem',
  color: '#475569',
};
