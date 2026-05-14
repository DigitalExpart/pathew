import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock, CheckCircle2 } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '../ui/Button';

// TODO: Replace with your actual Stripe publishable key
const stripePromise = loadStripe('pk_test_placeholder');

const CheckoutForm = ({ planTitle, planPrice, onSuccess, onCancel }: any) => {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);
    setError(null);

    // Get the card details
    const cardElement = elements.getElement(CardElement);
    if (!cardElement) return;

    // Simulate API call to get client_secret from backend
    // const { clientSecret } = await fetch('/api/create-payment-intent', { ... })
    // const { error: stripeError } = await stripe.confirmCardPayment(clientSecret, {
    //   payment_method: { card: cardElement }
    // });
    
    // Placeholder Logic: We simulate a successful payment delay
    setTimeout(() => {
      setProcessing(false);
      onSuccess();
    }, 2000);
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ backgroundColor: 'var(--bg-tertiary)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '8px' }}>You are purchasing</p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{planTitle} Plan</h3>
          <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-primary)' }}>{planPrice}</span>
        </div>
      </div>

      <div>
        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
          Card Details
        </label>
        <div style={{ padding: '16px', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          <CardElement 
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#ffffff',
                  '::placeholder': { color: '#aab7c4' },
                  iconColor: '#f59e0b',
                },
                invalid: { color: '#ef4444', iconColor: '#ef4444' },
              }
            }} 
          />
        </div>
        {error && <p style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '8px' }}>{error}</p>}
      </div>

      <div style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
        <Button type="button" variant="ghost" onClick={onCancel} style={{ flex: 1 }} disabled={processing}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" style={{ flex: 2 }} disabled={!stripe || processing}>
          {processing ? 'Processing...' : `Pay ${planPrice}`}
        </Button>
      </div>

      <p style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
        <Lock size={12} /> Payments are secure and encrypted
      </p>
    </form>
  );
};

export const StripeCheckoutModal = ({ isOpen, onClose, planTitle, planPrice }: any) => {
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
        zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px'
      }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          style={{
            backgroundColor: 'var(--bg-secondary)', width: '100%', maxWidth: '480px',
            borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-color)',
            overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
          }}
        >
          <div style={{ padding: '24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Secure Checkout</h2>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
              <X size={20} />
            </button>
          </div>

          <div style={{ padding: '32px 24px' }}>
            {success ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', padding: '20px 0' }}>
                <CheckCircle2 size={64} color="#22c55e" style={{ margin: '0 auto 16px' }} />
                <h3 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>Payment Successful!</h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>Your account has been upgraded and credits applied.</p>
                <Button onClick={onClose} style={{ width: '100%' }}>Return to Dashboard</Button>
              </motion.div>
            ) : (
              <Elements stripe={stripePromise}>
                <CheckoutForm 
                  planTitle={planTitle} 
                  planPrice={planPrice} 
                  onSuccess={() => setSuccess(true)}
                  onCancel={onClose}
                />
              </Elements>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
