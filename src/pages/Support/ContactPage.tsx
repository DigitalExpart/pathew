import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Send, MessageSquare, Globe } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { supabase } from '../../lib/supabase';
import { useTranslation } from 'react-i18next';

export const ContactPage: React.FC = () => {
  const { t } = useTranslation();
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    subject: 'General Inquiry',
    message: ''
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const { error } = await supabase
        .from('contacts')
        .insert([
          { 
            name: formState.name, 
            email: formState.email, 
            subject: formState.subject, 
            message: formState.message 
          }
        ]);

      if (error) throw error;
      
      setIsSubmitted(true);
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('There was an error sending your message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={pageStyle}>
      <Navbar activePage="contact" />

      <main style={mainStyle}>
        <div style={containerStyle}>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={headerStyle}
          >
            <h1 style={titleStyle}>{t('contact.title1')}<span style={{ color: 'var(--accent-primary)' }}>{t('contact.title2')}</span></h1>
            <p style={subtitleStyle}>
              {t('contact.subtitle')}
            </p>
          </motion.div>

          <div style={gridStyle}>
            {/* Contact Form */}
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card style={cardStyle}>
                {!isSubmitted ? (
                  <form onSubmit={handleSubmit} style={formContainerStyle}>
                    <div style={inputGroupStyle}>
                      <label style={labelStyle}>{t('contact.form.nameLabel')}</label>
                      <input 
                        type="text" 
                        required 
                        placeholder={t('contact.form.namePlaceholder')} 
                        style={inputStyle}
                        value={formState.name}
                        onChange={(e) => setFormState({...formState, name: e.target.value})}
                      />
                    </div>
                    <div style={inputGroupStyle}>
                      <label style={labelStyle}>{t('contact.form.emailLabel')}</label>
                      <input 
                        type="email" 
                        required 
                        placeholder={t('contact.form.emailPlaceholder')} 
                        style={inputStyle}
                        value={formState.email}
                        onChange={(e) => setFormState({...formState, email: e.target.value})}
                      />
                    </div>
                    <div style={inputGroupStyle}>
                      <label style={labelStyle}>{t('contact.form.subjectLabel')}</label>
                      <select 
                        style={inputStyle}
                        value={formState.subject}
                        onChange={(e) => setFormState({...formState, subject: e.target.value})}
                      >
                        <option value="General Inquiry">{t('contact.form.subjects.general')}</option>
                        <option value="Technical Support">{t('contact.form.subjects.tech')}</option>
                        <option value="Billing Question">{t('contact.form.subjects.billing')}</option>
                        <option value="Partnership">{t('contact.form.subjects.partner')}</option>
                      </select>
                    </div>
                    <div style={inputGroupStyle}>
                      <label style={labelStyle}>{t('contact.form.messageLabel')}</label>
                      <textarea 
                        required 
                        rows={5} 
                        placeholder={t('contact.form.messagePlaceholder')} 
                        style={{...inputStyle, resize: 'none'}}
                        value={formState.message}
                        onChange={(e) => setFormState({...formState, message: e.target.value})}
                      />
                    </div>
                    <Button type="submit" disabled={isSubmitting} style={{ width: '100%', gap: '10px' }}>
                      <Send size={18} /> {isSubmitting ? t('contact.form.sendingBtn') : t('contact.form.sendBtn')}
                    </Button>
                  </form>
                ) : (
                  <div style={successStateStyle}>
                    <div style={successIconStyle}>
                      <MessageSquare size={32} color="var(--accent-primary)" />
                    </div>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '16px' }}>{t('contact.form.successTitle')}</h2>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
                      {t('contact.form.successDesc')}
                    </p>
                    <Button variant="outline" onClick={() => setIsSubmitted(false)}>{t('contact.form.sendAnother')}</Button>
                  </div>
                )}
              </Card>
            </motion.div>

            {/* Contact Info */}
            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              style={infoContainerStyle}
            >
              <ContactInfoItem 
                icon={Mail} 
                title={t('contact.info.emailTitle')} 
                detail="support@pathew.com" 
                sub={t('contact.info.emailSub')}
              />
              <ContactInfoItem 
                icon={Phone} 
                title={t('contact.info.callTitle')} 
                detail="+1 (555) 123-4567" 
                sub={t('contact.info.callSub')}
              />
              <ContactInfoItem 
                icon={MapPin} 
                title={t('contact.info.visitTitle')} 
                detail="123 Innovation Way" 
                sub={t('contact.info.visitSub')}
              />
              
              <div style={socialSectionStyle}>
                <h4 style={{ marginBottom: '16px', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>{t('contact.info.followTitle')}</h4>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <SocialLink icon={Globe} />
                  <SocialLink icon={MessageSquare} />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

const ContactInfoItem = ({ icon: Icon, title, detail, sub }: any) => (
  <div style={infoItemStyle}>
    <div style={infoIconWrapperStyle}>
      <Icon size={24} color="var(--accent-primary)" />
    </div>
    <div>
      <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '4px' }}>{title}</h3>
      <p style={{ color: 'var(--text-primary)', fontWeight: 500, marginBottom: '2px' }}>{detail}</p>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{sub}</p>
    </div>
  </div>
);

const SocialLink = ({ icon: Icon }: any) => (
  <motion.div 
    whileHover={{ scale: 1.1, backgroundColor: 'rgba(245, 158, 11, 0.2)' }}
    style={socialLinkStyle}
  >
    <Icon size={18} color="var(--accent-primary)" />
  </motion.div>
);

// Styles
const pageStyle: React.CSSProperties = {
  backgroundColor: 'var(--bg-primary)',
  minHeight: '100vh',
  color: 'var(--text-primary)',
};







const mainStyle: React.CSSProperties = {
  padding: '160px 20px 80px',
};



const containerStyle: React.CSSProperties = {
  maxWidth: '1100px',
  margin: '0 auto',
};

const headerStyle: React.CSSProperties = {
  textAlign: 'center',
  marginBottom: '64px',
};

const titleStyle: React.CSSProperties = {
  fontSize: '3.5rem',
  fontWeight: 800,
  marginBottom: '16px',
};

const subtitleStyle: React.CSSProperties = {
  fontSize: '1.25rem',
  color: 'var(--text-secondary)',
  maxWidth: '600px',
  margin: '0 auto',
};

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1.5fr 1fr',
  gap: '64px',
  alignItems: 'start',
};

const cardStyle: React.CSSProperties = {
  padding: '48px',
  backgroundColor: 'var(--bg-secondary)',
  borderRadius: '32px',
};

const formContainerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '24px',
};

const inputGroupStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
};

const labelStyle: React.CSSProperties = {
  fontSize: '0.875rem',
  fontWeight: 600,
  color: 'var(--text-secondary)',
};

const inputStyle: React.CSSProperties = {
  padding: '12px 16px',
  backgroundColor: 'var(--bg-primary)',
  border: '1px solid var(--border-color)',
  borderRadius: '12px',
  color: 'var(--text-primary)',
  fontSize: '1rem',
  outline: 'none',
};

const infoContainerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '40px',
  paddingTop: '20px',
};

const infoItemStyle: React.CSSProperties = {
  display: 'flex',
  gap: '20px',
  alignItems: 'flex-start',
};

const infoIconWrapperStyle: React.CSSProperties = {
  padding: '12px',
  backgroundColor: 'rgba(245, 158, 11, 0.1)',
  borderRadius: '16px',
  border: '1px solid rgba(245, 158, 11, 0.1)',
};

const successStateStyle: React.CSSProperties = {
  textAlign: 'center',
  padding: '40px 0',
};

const successIconStyle: React.CSSProperties = {
  width: '64px',
  height: '64px',
  backgroundColor: 'rgba(245, 158, 11, 0.1)',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  margin: '0 auto 24px',
};

const socialSectionStyle: React.CSSProperties = {
  marginTop: '20px',
  paddingTop: '40px',
  borderTop: '1px solid var(--border-color)',
};

const socialLinkStyle: React.CSSProperties = {
  padding: '12px',
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  borderRadius: '12px',
  cursor: 'pointer',
  transition: 'all 0.2s',
};
