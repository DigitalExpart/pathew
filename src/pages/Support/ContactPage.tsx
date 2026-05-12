import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Send, MessageSquare, Clock, Globe } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import logo from '../../assets/images/logo.png';
import { Link } from 'react-router-dom';

export const ContactPage: React.FC = () => {
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    subject: 'General Inquiry',
    message: ''
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
    // Simulation of form submission
  };

  return (
    <div style={pageStyle}>
      {/* Navbar */}
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, type: 'spring' }}
        style={navStyle}
      >
        <div style={logoStyle}>
          <img src={logo} alt="PATHEW Logo" style={{ height: '40px', objectFit: 'contain' }} />
        </div>
        <div style={navLinksStyle}>
          <Link to="/" style={navLinkStyle}>Features</Link>
          <Link to="/how-it-works" style={navLinkStyle}>How it works</Link>
          <Link to="/" style={navLinkStyle}>Pricing</Link>
          <Link to="/contact" style={navLinkStyle}>Contact</Link>
        </div>
        <div style={navActionsStyle}>
          <Link to="/login"><Button variant="ghost">Login</Button></Link>
          <Link to="/signup"><Button>Get Started</Button></Link>
        </div>
      </motion.nav>

      <main style={mainStyle}>
        <div style={containerStyle}>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={headerStyle}
          >
            <h1 style={titleStyle}>Get in <span style={{ color: 'var(--accent-primary)' }}>Touch</span></h1>
            <p style={subtitleStyle}>
              Have questions about PATHEW Assistant? Our team is here to help you accelerate your global career.
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
                      <label style={labelStyle}>Full Name</label>
                      <input 
                        type="text" 
                        required 
                        placeholder="John Doe" 
                        style={inputStyle}
                        value={formState.name}
                        onChange={(e) => setFormState({...formState, name: e.target.value})}
                      />
                    </div>
                    <div style={inputGroupStyle}>
                      <label style={labelStyle}>Email Address</label>
                      <input 
                        type="email" 
                        required 
                        placeholder="john@example.com" 
                        style={inputStyle}
                        value={formState.email}
                        onChange={(e) => setFormState({...formState, email: e.target.value})}
                      />
                    </div>
                    <div style={inputGroupStyle}>
                      <label style={labelStyle}>Subject</label>
                      <select 
                        style={inputStyle}
                        value={formState.subject}
                        onChange={(e) => setFormState({...formState, subject: e.target.value})}
                      >
                        <option>General Inquiry</option>
                        <option>Technical Support</option>
                        <option>Billing Question</option>
                        <option>Partnership</option>
                      </select>
                    </div>
                    <div style={inputGroupStyle}>
                      <label style={labelStyle}>Message</label>
                      <textarea 
                        required 
                        rows={5} 
                        placeholder="How can we help you?" 
                        style={{...inputStyle, resize: 'none'}}
                        value={formState.message}
                        onChange={(e) => setFormState({...formState, message: e.target.value})}
                      />
                    </div>
                    <Button type="submit" style={{ width: '100%', gap: '10px' }}>
                      <Send size={18} /> Send Message
                    </Button>
                  </form>
                ) : (
                  <div style={successStateStyle}>
                    <div style={successIconStyle}>
                      <MessageSquare size={32} color="var(--accent-primary)" />
                    </div>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '16px' }}>Message Sent!</h2>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
                      Thank you for reaching out. A PATHEW expert will get back to you within 24 hours.
                    </p>
                    <Button variant="outline" onClick={() => setIsSubmitted(false)}>Send Another Message</Button>
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
                title="Email Us" 
                detail="support@pathew.com" 
                sub="Expect a response in 24h"
              />
              <ContactInfoItem 
                icon={Phone} 
                title="Call Us" 
                detail="+1 (555) 123-4567" 
                sub="Mon-Fri, 9am - 6pm EST"
              />
              <ContactInfoItem 
                icon={MapPin} 
                title="Visit Us" 
                detail="123 Innovation Way" 
                sub="San Francisco, CA 94105"
              />
              
              <div style={socialSectionStyle}>
                <h4 style={{ marginBottom: '16px', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>Follow Our Journey</h4>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <SocialLink icon={Globe} />
                  <SocialLink icon={MessageSquare} />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </main>
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

const navStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '24px 80px',
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  backgroundColor: 'rgba(15, 23, 42, 0.8)',
  backdropFilter: 'blur(20px)',
  zIndex: 1000,
  borderBottom: '1px solid var(--border-color)',
};

const logoStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  fontSize: '1.5rem',
  fontWeight: 800,
};

const navLinksStyle: React.CSSProperties = {
  display: 'flex',
  gap: '40px',
};

const navLinkStyle: React.CSSProperties = {
  fontSize: '0.875rem',
  fontWeight: 500,
  color: 'var(--text-secondary)',
  textDecoration: 'none',
  transition: 'color 0.2s ease',
};

const navActionsStyle: React.CSSProperties = {
  display: 'flex',
  gap: '16px',
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
