import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Send, MessageSquare, Globe } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Navbar } from '../../components/layout/Navbar';
import logo from '../../assets/images/logo.png';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

export const ContactPage: React.FC = () => {
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
                    <Button type="submit" disabled={isSubmitting} style={{ width: '100%', gap: '10px' }}>
                      <Send size={18} /> {isSubmitting ? 'Sending...' : 'Send Message'}
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

      {/* Footer */}
      <footer style={footerStyle}>
        <div style={footerMainStyle}>
          <div style={footerBrandColStyle}>
            <Link to="/" style={logoStyle}>
              <img src={logo} alt="PATHEW Logo" style={{ height: '32px', objectFit: 'contain' }} />
            </Link>
            <p style={{ color: 'var(--text-secondary)', marginTop: '20px', lineHeight: 1.6 }}>
              The premium platform for global opportunity matching. Empowering professionals with Pathew Assistant.
            </p>
          </div>
          
          <div style={footerLinksGridStyle}>
            <FooterCol title="Product" links={['Features', 'How it works', 'Pricing', 'API']} />
            <FooterCol title="Company" links={['About', 'Careers', 'Blog', 'Contact']} />
            <FooterCol title="Legal" links={['Privacy', 'Terms', 'Security', 'Cookies']} />
          </div>
        </div>
        
        <div style={footerBottomStyle}>
          <p>© 2024 PATHEW. All rights reserved.</p>
          <div style={socialLinksStyle}>
            <FooterSocialIcon icon={FacebookIcon} label="Facebook" />
            <FooterSocialIcon icon={InstagramIcon} label="Instagram" />
            <FooterSocialIcon icon={TikTokIcon} label="TikTok" />
          </div>
        </div>
      </footer>
    </div>
  );
};

const FooterCol = ({ title, links }: { title: string, links: string[] }) => (
  <div style={footerColStyle}>
    <h4 style={{ color: 'var(--text-primary)', marginBottom: '20px', fontSize: '1rem', fontWeight: 700 }}>{title}</h4>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {links.map(l => (
        <a key={l} href="#" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.875rem' }}>{l}</a>
      ))}
    </div>
  </div>
);

const FooterSocialIcon = ({ icon: Icon, label }: { icon: any, label: string }) => (
  <motion.a 
    href="#"
    whileHover={{ color: 'var(--accent-primary)', y: -2 }}
    style={{ color: 'var(--text-muted)', transition: 'color 0.2s ease', display: 'flex', alignItems: 'center' }}
    aria-label={label}
  >
    <Icon size={20} />
  </motion.a>
);

const FacebookIcon = ({ size = 20 }: { size?: number }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const InstagramIcon = ({ size = 20 }: { size?: number }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const TikTokIcon = ({ size = 20 }: { size?: number }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
  </svg>
);

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


const logoStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  fontSize: '1.5rem',
  fontWeight: 800,
};




const mainStyle: React.CSSProperties = {
  padding: '160px 20px 80px',
};

const footerStyle: React.CSSProperties = {
  padding: '100px 80px 40px',
  backgroundColor: 'var(--bg-primary)',
  borderTop: '1px solid var(--border-color)',
};

const footerMainStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: '80px',
  marginBottom: '80px',
  maxWidth: '1200px',
  margin: '0 auto 80px',
};

const footerBrandColStyle: React.CSSProperties = {
  flex: 1.5,
  maxWidth: '400px',
};

const footerLinksGridStyle: React.CSSProperties = {
  flex: 2,
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: '40px',
};

const footerColStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
};

const footerBottomStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingTop: '40px',
  borderTop: '1px solid var(--border-color)',
  color: 'var(--text-muted)',
  fontSize: '0.875rem',
  maxWidth: '1200px',
  margin: '0 auto',
};

const socialLinksStyle: React.CSSProperties = {
  display: 'flex',
  gap: '24px',
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
