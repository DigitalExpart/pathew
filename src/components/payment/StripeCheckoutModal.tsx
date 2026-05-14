import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock, CheckCircle2, Shield, Zap } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '../ui/Button';

// TODO: Replace with your actual Stripe publishable key
const STRIPE_PUBLISHABLE_KEY = 'pk_test_placeholder';
const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

// TODO: Replace with your actual backend API endpoint
const API_BASE_URL = '/api';

/* ── Checkout Form (uses PaymentElement) ───────────────────── */
const CheckoutForm = ({ planTitle, planPrice, planCredits, onSuccess, onCancel }: any) => {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);
    setError(null);

    const { error: submitError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin + '/wallet',
      },
      redirect: 'if_required',
    });

    if (submitError) {
      setError(submitError.message || 'Payment failed. Please try again.');
      setProcessing(false);
    } else {
      onSuccess();
    }
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

      {planCredits && (
        <div style={{ padding: '12px 20px', backgroundColor: 'rgba(245, 158, 11, 0.06)', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle2 size={14} color="#f59e0b" />
          <span style={{ fontSize: '0.8125rem', color: '#94a3b8' }}>{planCredits} included with this plan</span>
        </div>
      )}

      {/* Stripe PaymentElement */}
      <div style={{ padding: '24px' }}>
        <PaymentElement
          options={{
            layout: 'tabs',
            defaultValues: { billingDetails: { address: { country: 'GB' } } },
          }}
        />
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
          disabled={!stripe || processing}
          whileHover={!processing ? { scale: 1.01, boxShadow: '0 0 30px rgba(245, 158, 11, 0.3)' } : {}}
          whileTap={!processing ? { scale: 0.99 } : {}}
          style={{
            width: '100%', padding: '16px', border: 'none', borderRadius: '12px', fontSize: '1rem', fontWeight: 700,
            cursor: !processing ? 'pointer' : 'not-allowed',
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            color: '#000', transition: 'all 0.3s ease',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            opacity: processing ? 0.7 : 1,
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

        <button type="button" onClick={onCancel} disabled={processing} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '0.875rem', padding: '8px' }}>
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
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    setFetchError(null);
    setSuccess(false);
    setClientSecret(null);

    // TODO: Replace with your actual backend API call
    fetch(`${API_BASE_URL}/create-payment-intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan: planTitle, price: planPrice }),
    })
      .then((res) => res.json())
      .then((data) => {
        setClientSecret(data.clientSecret);
        setLoading(false);
      })
      .catch(() => {
        setFetchError('Unable to connect to payment service. Please try again.');
        setLoading(false);
      });
  }, [isOpen, planTitle, planPrice]);

  const handleClose = () => {
    setSuccess(false);
    setClientSecret(null);
    onClose();
  };

  if (!isOpen) return null;

  const stripeAppearance = {
    theme: 'night' as const,
    variables: {
      colorPrimary: '#f59e0b',
      colorBackground: '#1e293b',
      colorText: '#e2e8f0',
      colorDanger: '#f87171',
      fontFamily: '"Inter", -apple-system, sans-serif',
      borderRadius: '10px',
      spacingUnit: '4px',
    },
    rules: {
      '.Input': { border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.04)', padding: '14px 16px' },
      '.Input:focus': { borderColor: '#f59e0b', boxShadow: '0 0 0 2px rgba(245,158,11,0.2)' },
      '.Label': { color: '#94a3b8', fontWeight: '600', fontSize: '13px' },
      '.Tab': { border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.04)' },
      '.Tab--selected': { borderColor: '#f59e0b', backgroundColor: 'rgba(245,158,11,0.1)' },
      '.Tab:hover': { borderColor: 'rgba(245,158,11,0.5)' },
    },
  };

  return (
    <AnimatePresence>
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
            <motion.button whileHover={{ backgroundColor: 'rgba(255,255,255,0.1)' }} onClick={handleClose} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '8px', borderRadius: '8px', display: 'flex' }}>
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
          ) : loading ? (
            <div style={{ padding: '64px 24px', textAlign: 'center' }}>
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }} style={{ width: 36, height: 36, border: '3px solid rgba(245,158,11,0.2)', borderTopColor: '#f59e0b', borderRadius: '50%', margin: '0 auto 16px' }} />
              <p style={{ color: '#94a3b8' }}>Preparing checkout...</p>
            </div>
          ) : fetchError ? (
            <div style={{ padding: '48px 24px', textAlign: 'center' }}>
              <p style={{ color: '#f87171', marginBottom: '16px' }}>{fetchError}</p>
              <Button variant="outline" onClick={handleClose}>Close</Button>
            </div>
          ) : clientSecret ? (
            <Elements stripe={stripePromise} options={{ clientSecret, appearance: stripeAppearance }}>
              <CheckoutForm planTitle={planTitle} planPrice={planPrice} planCredits={planCredits} onSuccess={() => setSuccess(true)} onCancel={handleClose} />
            </Elements>
          ) : null}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

/* ── Styles ─────────────────────────────────────────────────── */
const modalStyle: React.CSSProperties = {
  backgroundColor: '#0f172a', width: '100%', maxWidth: '440px', borderRadius: '20px',
  border: '1px solid rgba(255, 255, 255, 0.08)', overflow: 'hidden',
  boxShadow: '0 25px 60px -12px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255,255,255,0.05)',
  maxHeight: '90vh', overflowY: 'auto',
};

const headerStyle: React.CSSProperties = {
  padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)',
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
};

const planSummaryStyle: React.CSSProperties = {
  padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  borderBottom: '1px solid rgba(255,255,255,0.05)',
  background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.04) 0%, rgba(245, 158, 11, 0.01) 100%)',
};

const planIconStyle: React.CSSProperties = {
  width: '44px', height: '44px', borderRadius: '12px',
  backgroundColor: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
};

const securityFooterStyle: React.CSSProperties = {
  padding: '14px 24px', borderTop: '1px solid rgba(255,255,255,0.05)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  gap: '8px', fontSize: '0.6875rem', color: '#475569',
};
