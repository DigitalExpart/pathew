import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock, CheckCircle2, Shield, Zap, CreditCard, Plus } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { usePaystackPayment } from 'react-paystack';
import { Button } from '../ui/Button';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../context/ThemeContext';
import { COUNTRIES } from '../../utils/countries';

// Stripe publishable key from environment variables
const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '';
const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

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

    let addedCredits = 0;
    if (typeof planCredits === 'string') {
       const match = planCredits.match(/\d+/);
       if (match) addedCredits = parseInt(match[0], 10);
    } else if (typeof planCredits === 'number') {
       addedCredits = planCredits;
    }
    if (!addedCredits) {
       const planCreditsMap: Record<string, number> = { 'Starter': 25, 'Growth': 60, 'Power User': 120 };
       addedCredits = planCreditsMap[planTitle] || 25;
    }

    localStorage.setItem('pending_plan', planTitle);
    localStorage.setItem('pending_credits', addedCredits.toString());

    const { error: submitError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin + '/wallet',
      },
      redirect: 'if_required',
    });

    if (submitError) {
      localStorage.removeItem('pending_plan');
      localStorage.removeItem('pending_credits');
      setError(submitError.message || 'Payment failed. Please try again.');
      setProcessing(false);
    } else {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session && paymentIntent) {
          // SECURITY: Server-side credit verification
          const { error: verifyError } = await supabase.functions.invoke('verify-payment', {
            body: { 
              paymentIntentId: paymentIntent.id,
              plan: planTitle,
              paymentGateway: 'stripe'
            }
          });
          
          if (verifyError) {
             console.error('Payment verified but credits failed:', verifyError);
          }

          // Transactions are now logged securely on the backend
          
          const appliedCouponId = localStorage.getItem('applied_coupon_id');
          if (appliedCouponId) {
            // Best effort update, since we might not have the current_uses locally,
            // but we can try to fetch it first or use an RPC.
            const { data: cData } = await supabase.from('coupons').select('current_uses').eq('id', appliedCouponId).single();
            if (cData) {
              await supabase.from('coupons').update({ current_uses: cData.current_uses + 1 }).eq('id', appliedCouponId);
            }
            localStorage.removeItem('applied_coupon_id');
          }
          
          localStorage.removeItem('pending_plan');
          localStorage.removeItem('pending_credits');
        }
      } catch (err) {
        console.error('Error updating profile after payment:', err);
      }
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
export const CheckoutModal = ({ isOpen, onClose, planTitle, planPrice, planCredits }: any) => {
  const [success, setSuccess] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [step, setStep] = useState<'billing' | 'payment'>('billing');
  const [paymentGateway, setPaymentGateway] = useState<'stripe' | 'paystack'>('stripe');
  const [userEmail, setUserEmail] = useState('');
  
  // Coupon state
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  // Saved payment methods
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
  
  const [billingInfo, setBillingInfo] = useState({
    company_name: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state_province: '',
    postal_code: '',
    country: 'United Kingdom',
    phone_number: '',
  });

  // Paystack Configuration
  const PAYSTACK_PUBLIC_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || '';
  const numericPriceMatch = typeof planPrice === 'string' ? planPrice.match(/[\d.]+/) : null;
  const originalNumericPrice = numericPriceMatch ? parseFloat(numericPriceMatch[0]) : 0;
  
  // Calculate final price with coupon
  let finalNumericPrice = originalNumericPrice;
  if (appliedCoupon) {
    if (appliedCoupon.discount_type === 'percentage') {
      finalNumericPrice = originalNumericPrice * (1 - appliedCoupon.discount_value / 100);
    } else if (appliedCoupon.discount_type === 'fixed') {
      finalNumericPrice = Math.max(0, originalNumericPrice - appliedCoupon.discount_value);
    }
  }
  
  // Ensure we round to 2 decimal places to avoid float issues
  finalNumericPrice = Math.round(finalNumericPrice * 100) / 100;
  const formattedFinalPrice = typeof planPrice === 'string' 
    ? planPrice.replace(/[\d.]+/, finalNumericPrice.toFixed(2)) 
    : `£${finalNumericPrice.toFixed(2)}`;

  const amountInNaira = finalNumericPrice * 2000; // GBP to NGN conversion (example rate)
  const paystackAmount = amountInNaira * 100; // in kobo

  const initializePaystack = usePaystackPayment({
    reference: (new Date()).getTime().toString(),
    email: userEmail || 'user@example.com',
    amount: paystackAmount, 
    publicKey: PAYSTACK_PUBLIC_KEY,
    currency: 'NGN',
  });

  const handleValidateCoupon = async () => {
    if (!couponCodeInput.trim()) return;
    
    setValidatingCoupon(true);
    setCouponError(null);
    setAppliedCoupon(null);
    
    try {
      // Fetch coupons that might match (using ilike to handle accidental leading/trailing spaces in DB)
      const { data: potentialCoupons, error } = await supabase
        .from('coupons')
        .select('*')
        .ilike('code', `%${couponCodeInput.trim()}%`);
        
      if (error) throw error;
      
      // Find exact match after trimming both sides
      const data = potentialCoupons?.find(
        (c) => c.code.trim().toUpperCase() === couponCodeInput.trim().toUpperCase()
      );
      
      if (!data) {
        setCouponError('Invalid coupon code.');
        return;
      }
      
      if (!data.is_active) {
        setCouponError('This coupon is no longer active.');
        return;
      }
      
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        setCouponError('This coupon has expired.');
        return;
      }
      
      if (data.max_uses !== null && data.current_uses >= data.max_uses) {
        setCouponError('This coupon has reached its maximum usage limit.');
        return;
      }
      
      setAppliedCoupon(data);
    } catch (err: any) {
      console.error('Error validating coupon:', err);
      setCouponError('Failed to validate coupon.');
    } finally {
      setValidatingCoupon(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    setFetchError(null);
    setSuccess(false);
    setClientSecret(null);
    setStep('billing');

    // Ensure user is logged in and fetch pre-existing billing details
    const checkUserAndPrefill = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setFetchError('You must be logged in to make a purchase.');
        setLoading(false);
        return;
      }

      try {
        if (session.user.email) {
          setUserEmail(session.user.email);
        }
        
        const { data: profileData } = await supabase
          .from('profiles')
          .select('billing_completed, billing_info')
          .eq('id', session.user.id)
          .maybeSingle();

        if (profileData && profileData.billing_info && typeof profileData.billing_info === 'object') {
          const info = profileData.billing_info as any;
          setBillingInfo({
            company_name: info.company_name || '',
            address_line1: info.address_line1 || '',
            address_line2: info.address_line2 || '',
            city: info.city || '',
            state_province: info.state_province || '',
            postal_code: info.postal_code || '',
            country: info.country || 'United Kingdom',
            phone_number: info.phone_number || '',
          });
        }
        
        // Fetch saved payment methods
        const pmResponse = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-customer`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({ action: 'get_methods' })
        });
        const pmData = await pmResponse.json();
        if (pmResponse.ok && pmData.paymentMethods) {
          setPaymentMethods(pmData.paymentMethods);
        }
      } catch (err) {
        console.error('Error fetching billing details prefill:', err);
      } finally {
        setLoading(false);
      }
    };

    checkUserAndPrefill();
  }, [isOpen, planTitle, planPrice]);

  const handleSaveBillingAndProceed = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !billingInfo.company_name.trim() ||
      !billingInfo.address_line1.trim() ||
      !billingInfo.city.trim() ||
      !billingInfo.state_province.trim() ||
      !billingInfo.postal_code.trim() ||
      !billingInfo.phone_number.trim()
    ) {
      alert('Please fill in all required billing information fields.');
      return;
    }

    setLoading(true);
    setFetchError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No active user session found.');

      // 1. Persist validated billing info to database
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          billing_completed: true,
          billing_info: billingInfo
        })
        .eq('id', session.user.id);

      if (updateError) throw updateError;

      if (paymentGateway === 'paystack') {
        if (!PAYSTACK_PUBLIC_KEY) {
          throw new Error("Paystack is not configured. Please use Stripe.");
        }

        const onSuccess = async (response: any) => {
          try {
            let addedCredits = 0;
            if (typeof planCredits === 'string') {
               const match = planCredits.match(/\d+/);
               if (match) addedCredits = parseInt(match[0], 10);
            } else if (typeof planCredits === 'number') {
               addedCredits = planCredits;
            }
            if (!addedCredits) {
               const planCreditsMap: Record<string, number> = { 'Starter': 25, 'Growth': 60, 'Power User': 120 };
               addedCredits = planCreditsMap[planTitle] || 25;
            }
            
            // SECURITY: Server-side credit verification for Paystack
            const { error: verifyError } = await supabase.functions.invoke('verify-payment', {
              body: { 
                paymentIntentId: response.reference,
                plan: planTitle,
                paymentGateway: 'paystack'
              }
            });
            
            if (verifyError) {
               console.error('Paystack verified but credits failed:', verifyError);
            }
            
            // Increment coupon usage if one was applied
            if (appliedCoupon) {
              await supabase.rpc('increment_coupon_usage', { coupon_id: appliedCoupon.id });
              // Alternatively if RPC doesn't exist, we can just do:
              await supabase.from('coupons').update({ current_uses: appliedCoupon.current_uses + 1 }).eq('id', appliedCoupon.id);
            }
            
            setSuccess(true);
            setStep('billing');
          } catch (err) {
            console.error('Error applying Paystack credits:', err);
            setFetchError("Payment succeeded but credits failed to apply. Please contact support.");
          }
        };

        const onCloseModal = () => {
          setLoading(false);
        };

        // Initialize inline Paystack
        initializePaystack({
          onSuccess,
          onClose: onCloseModal
        });
        
        return; // wait for callback
      }

      // 2. Fetch payment intent from Supabase Edge Function (STRIPE)
      const { data, error: fnError } = await supabase.functions.invoke('create-payment-intent', {
        body: { 
          plan: planTitle, 
          couponId: appliedCoupon ? appliedCoupon.id : undefined,
          billingInfo,
          paymentMethodId: selectedPaymentMethod || undefined
        }
      });

      if (fnError) throw fnError;

      // Store applied coupon ID so the Stripe confirm block can use it
      if (appliedCoupon) {
        localStorage.setItem('applied_coupon_id', appliedCoupon.id);
      }

      if (data.status === 'succeeded') {
        // Automatically verified since payment method was pre-authorized and confirmed
        const { error: verifyError } = await supabase.functions.invoke('verify-payment', {
          body: { 
            paymentIntentId: data.clientSecret.split('_secret_')[0], // Extract intent ID
            plan: planTitle,
            paymentGateway: 'stripe'
          }
        });
        if (verifyError) console.error('Verification failed:', verifyError);
        setSuccess(true);
      } else {
        setClientSecret(data.clientSecret);
        setStep('payment');
      }
    } catch (err: any) {
      console.error('Billing / payment step error:', err);
      setFetchError(err.message || 'Unable to connect to payment service. Please try again.');
    } finally {
      if (paymentGateway !== 'paystack') {
        setLoading(false);
      }
    }
  };

  const handleClose = () => {
    setSuccess(false);
    setClientSecret(null);
    setStep('billing');
    onClose();
  };

  if (!isOpen) return null;

  const { theme: appTheme } = useTheme();

  const stripeAppearance = {
    theme: (appTheme === 'dark' ? 'night' : 'stripe') as 'night' | 'stripe',
    variables: {
      colorPrimary: '#f59e0b',
      colorBackground: appTheme === 'dark' ? '#111827' : '#ffffff',
      colorText: appTheme === 'dark' ? '#ffffff' : '#0f172a',
      colorDanger: '#f87171',
      fontFamily: '"Inter", -apple-system, sans-serif',
      borderRadius: '12px',
      spacingUnit: '4px',
    },
    rules: {
      '.Input': { 
        border: `1px solid ${appTheme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, 
        backgroundColor: appTheme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', 
        padding: '14px 16px' 
      },
      '.Input:focus': { borderColor: '#f59e0b', boxShadow: '0 0 0 2px rgba(245,158,11,0.2)' },
      '.Label': { color: appTheme === 'dark' ? '#e5e7eb' : '#475569', fontWeight: '600', fontSize: '13px', marginBottom: '8px' },
      '.Tab': { 
        border: `1px solid ${appTheme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, 
        backgroundColor: appTheme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,1)', 
        color: appTheme === 'dark' ? '#ffffff' : '#0f172a' 
      },
      '.Tab--selected': { 
        borderColor: '#f59e0b', 
        backgroundColor: appTheme === 'dark' ? 'rgba(245,158,11,0.1)' : 'rgba(245,158,11,0.05)', 
        color: appTheme === 'dark' ? '#ffffff' : '#f59e0b', 
        borderSize: '2px' 
      },
      '.Tab:hover': { borderColor: 'rgba(245,158,11,0.5)' },
      '.TabLabel': { color: appTheme === 'dark' ? '#ffffff' : 'inherit' },
      '.TabIcon': { color: appTheme === 'dark' ? '#ffffff' : 'inherit' },
    },
  };

  // Custom inline styles for billing form inputs
  const billingLabelStyle: React.CSSProperties = {
    fontSize: '0.8125rem',
    color: '#94a3b8',
    fontWeight: 600,
    marginBottom: '6px',
    display: 'block'
  };

  const billingInputStyle: React.CSSProperties = {
    backgroundColor: '#1e293b',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '8px',
    color: '#fff',
    padding: '10px 12px',
    fontSize: '0.875rem',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box'
  };

  const billingFormGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px'
  };

  const billingFormContainerStyle: React.CSSProperties = {
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px'
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
              <p style={{ color: '#94a3b8' }}>Processing...</p>
            </div>
          ) : fetchError ? (
            <div style={{ padding: '48px 24px', textAlign: 'center' }}>
              <p style={{ color: '#f87171', marginBottom: '16px' }}>{fetchError}</p>
              <Button variant="outline" onClick={() => { setFetchError(null); setStep('billing'); }}>Try Again</Button>
            </div>
          ) : step === 'billing' ? (
            <form onSubmit={handleSaveBillingAndProceed} style={billingFormContainerStyle}>
              {/* Payment Method Section at the Top */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{...billingLabelStyle, fontSize: '0.95rem', color: '#fff', marginBottom: '12px'}}>Select Payment Gateway *</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div 
                    onClick={() => setPaymentGateway('stripe')}
                    style={{ 
                      padding: '24px', borderRadius: '16px', cursor: 'pointer', textAlign: 'center',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px',
                      border: `2px solid ${paymentGateway === 'stripe' ? '#635BFF' : 'rgba(255,255,255,0.08)'}`,
                      backgroundColor: paymentGateway === 'stripe' ? 'rgba(99,91,255,0.05)' : '#1e293b',
                      transition: 'all 0.2s',
                      boxShadow: paymentGateway === 'stripe' ? '0 4px 14px rgba(99,91,255,0.15)' : 'none'
                    }}>
                    <img src="https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg" alt="Stripe" style={{ height: '36px', objectFit: 'contain', filter: paymentGateway === 'stripe' ? 'none' : 'grayscale(100%) opacity(0.5)' }} />
                    <span style={{ color: paymentGateway === 'stripe' ? '#635BFF' : '#94a3b8', fontWeight: 600, fontSize: '0.95rem' }}>Global</span>
                  </div>
                  <div 
                    onClick={() => setPaymentGateway('paystack')}
                    style={{ 
                      padding: '24px', borderRadius: '16px', cursor: 'pointer', textAlign: 'center',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px',
                      border: `2px solid ${paymentGateway === 'paystack' ? '#00C3F7' : 'rgba(255,255,255,0.08)'}`,
                      backgroundColor: paymentGateway === 'paystack' ? 'rgba(0,195,247,0.05)' : '#1e293b',
                      transition: 'all 0.2s',
                      boxShadow: paymentGateway === 'paystack' ? '0 4px 14px rgba(0,195,247,0.15)' : 'none'
                    }}>
                    <img src="https://upload.wikimedia.org/wikipedia/commons/0/0b/Paystack_Logo.png" alt="Paystack" style={{ height: '36px', objectFit: 'contain', filter: paymentGateway === 'paystack' ? 'brightness(0) invert(1)' : 'brightness(0) invert(1) opacity(0.4)' }} />
                    <span style={{ color: paymentGateway === 'paystack' ? '#00C3F7' : '#94a3b8', fontWeight: 600, fontSize: '0.95rem' }}>Africa</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '12px' }}>
                <CheckCircle2 size={16} color="#f59e0b" />
                <span style={{ fontSize: '0.8125rem', color: '#94a3b8', fontWeight: 600 }}>Billing Details</span>
              </div>

              <div>
                <label style={billingLabelStyle}>Full Name / Company Name *</label>
                <input 
                  type="text" 
                  value={billingInfo.company_name} 
                  onChange={(e) => setBillingInfo({ ...billingInfo, company_name: e.target.value })} 
                  style={billingInputStyle} 
                  placeholder="e.g. Amina Johnson or Acme Corp"
                  required 
                />
              </div>

              <div>
                <label style={billingLabelStyle}>Phone Number *</label>
                <input 
                  type="tel" 
                  value={billingInfo.phone_number} 
                  onChange={(e) => setBillingInfo({ ...billingInfo, phone_number: e.target.value })} 
                  style={billingInputStyle} 
                  placeholder="e.g. +44 7700 900077"
                  required 
                />
              </div>

              <div>
                <label style={billingLabelStyle}>Address Line 1 *</label>
                <input 
                  type="text" 
                  value={billingInfo.address_line1} 
                  onChange={(e) => setBillingInfo({ ...billingInfo, address_line1: e.target.value })} 
                  style={billingInputStyle} 
                  placeholder="Street name & number"
                  required 
                />
              </div>

              <div style={billingFormGridStyle}>
                <div>
                  <label style={billingLabelStyle}>Address Line 2 (Opt)</label>
                  <input 
                    type="text" 
                    value={billingInfo.address_line2} 
                    onChange={(e) => setBillingInfo({ ...billingInfo, address_line2: e.target.value })} 
                    style={billingInputStyle} 
                    placeholder="Apartment or Suite" 
                  />
                </div>
                <div>
                  <label style={billingLabelStyle}>City *</label>
                  <input 
                    type="text" 
                    value={billingInfo.city} 
                    onChange={(e) => setBillingInfo({ ...billingInfo, city: e.target.value })} 
                    style={billingInputStyle} 
                    placeholder="City"
                    required 
                  />
                </div>
              </div>

              <div style={billingFormGridStyle}>
                <div>
                  <label style={billingLabelStyle}>State / Province *</label>
                  <input 
                    type="text" 
                    value={billingInfo.state_province} 
                    onChange={(e) => setBillingInfo({ ...billingInfo, state_province: e.target.value })} 
                    style={billingInputStyle} 
                    placeholder="County or State"
                    required 
                  />
                </div>
                <div>
                  <label style={billingLabelStyle}>Postal Code *</label>
                  <input 
                    type="text" 
                    value={billingInfo.postal_code} 
                    onChange={(e) => setBillingInfo({ ...billingInfo, postal_code: e.target.value })} 
                    style={billingInputStyle} 
                    placeholder="Postcode"
                    required 
                  />
                </div>
              </div>

              <div>
                <label style={billingLabelStyle}>Country *</label>
                <select 
                  value={billingInfo.country} 
                  onChange={(e) => setBillingInfo({ ...billingInfo, country: e.target.value })} 
                  style={{...billingInputStyle, appearance: 'auto'}} 
                  required 
                >
                  <option value="" disabled>Select a country...</option>
                  {COUNTRIES.map(country => (
                    <option key={country} value={country}>{country}</option>
                  ))}
                </select>
              </div>

              {/* Saved Payment Methods Selection */}
              {paymentGateway === 'stripe' && paymentMethods.length > 0 && (
                <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <label style={billingLabelStyle}>Select Payment Method</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {paymentMethods.map(pm => (
                      <div 
                        key={pm.id} 
                        onClick={() => setSelectedPaymentMethod(pm.id)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px',
                          borderRadius: '8px', border: `2px solid ${selectedPaymentMethod === pm.id ? '#f59e0b' : 'rgba(255,255,255,0.1)'}`,
                          backgroundColor: selectedPaymentMethod === pm.id ? 'rgba(245,158,11,0.05)' : 'transparent',
                          cursor: 'pointer', transition: 'all 0.2s'
                        }}
                      >
                        <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: `2px solid ${selectedPaymentMethod === pm.id ? '#f59e0b' : '#64748b'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {selectedPaymentMethod === pm.id && <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#f59e0b' }} />}
                        </div>
                        <CreditCard size={18} color={selectedPaymentMethod === pm.id ? '#f59e0b' : '#94a3b8'} />
                        <span style={{ fontSize: '0.95rem', fontWeight: 500, color: selectedPaymentMethod === pm.id ? '#fff' : '#94a3b8', textTransform: 'capitalize' }}>
                          {pm.card.brand} ending in {pm.card.last4}
                        </span>
                      </div>
                    ))}
                    <div 
                      onClick={() => setSelectedPaymentMethod(null)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px',
                        borderRadius: '8px', border: `2px solid ${selectedPaymentMethod === null ? '#f59e0b' : 'rgba(255,255,255,0.1)'}`,
                        backgroundColor: selectedPaymentMethod === null ? 'rgba(245,158,11,0.05)' : 'transparent',
                        cursor: 'pointer', transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: `2px solid ${selectedPaymentMethod === null ? '#f59e0b' : '#64748b'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {selectedPaymentMethod === null && <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#f59e0b' }} />}
                      </div>
                      <Plus size={18} color={selectedPaymentMethod === null ? '#f59e0b' : '#94a3b8'} />
                      <span style={{ fontSize: '0.95rem', fontWeight: 500, color: selectedPaymentMethod === null ? '#fff' : '#94a3b8' }}>
                        Add new card
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Coupon Section */}
              <div style={{ marginTop: '12px', padding: '16px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <label style={billingLabelStyle}>Have a discount code?</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input 
                    type="text" 
                    value={couponCodeInput} 
                    onChange={(e) => setCouponCodeInput(e.target.value)} 
                    style={{ ...billingInputStyle, flex: 1, textTransform: 'uppercase' }} 
                    placeholder="Enter code here"
                    disabled={appliedCoupon !== null}
                  />
                  <Button 
                    type="button" 
                    variant={appliedCoupon ? 'outline' : 'primary'}
                    onClick={appliedCoupon ? () => { setAppliedCoupon(null); setCouponCodeInput(''); } : handleValidateCoupon}
                    disabled={validatingCoupon}
                    style={{ padding: '10px 16px' }}
                  >
                    {validatingCoupon ? 'Wait...' : appliedCoupon ? 'Remove' : 'Apply'}
                  </Button>
                </div>
                
                {couponError && (
                  <p style={{ color: '#f87171', fontSize: '0.8125rem', marginTop: '8px', margin: '8px 0 0 0' }}>{couponError}</p>
                )}
                
                {appliedCoupon && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', color: '#10b981', fontSize: '0.8125rem' }}>
                    <CheckCircle2 size={14} />
                    <span>Coupon applied! {appliedCoupon.discount_type === 'percentage' ? `${appliedCoupon.discount_value}% OFF` : `£${appliedCoupon.discount_value} OFF`}</span>
                  </div>
                )}
                
                <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Total to pay:</span>
                  <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f59e0b' }}>
                    {formattedFinalPrice}
                  </span>
                </div>
              </div>

              <Button type="submit" style={{ width: '100%', marginTop: '4px' }} disabled={validatingCoupon}>
                Proceed to Payment
              </Button>
            </form>
          ) : clientSecret ? (
            <Elements stripe={stripePromise} options={{ clientSecret, appearance: stripeAppearance }}>
              <CheckoutForm planTitle={planTitle} planPrice={formattedFinalPrice} planCredits={planCredits} onSuccess={() => setSuccess(true)} onCancel={handleClose} />
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
