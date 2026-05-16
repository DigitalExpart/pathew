import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Navbar } from '../../components/layout/Navbar';
import { Sparkles, ArrowRight, CheckCircle, Globe, Shield, Zap, Plus, Star } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Link } from 'react-router-dom';
import { StripeCheckoutModal } from '../../components/payment/StripeCheckoutModal';
import { useTranslation } from 'react-i18next';
import logo from '../../assets/images/logo.png';

const features = [
  { icon: Globe, title: "Global Discovery", description: "Aggregated opportunities from thousands of premium sources worldwide." },
  { icon: Zap, title: "Assistant Match Scoring", description: "Know exactly how well you fit before you even click apply." },
  { icon: CheckCircle, title: "Smart Document Generation", description: "Auto-generate CVs and cover letters tailored to each opportunity." },
  { icon: Shield, title: "Privacy First", description: "Your data is encrypted and only shared when you choose to apply." },
];

export const LandingPage: React.FC = () => {
  const { t } = useTranslation();
  const [isMobile, setIsMobile] = React.useState(window.innerWidth <= 768);
  const [isTablet, setIsTablet] = React.useState(window.innerWidth <= 1024 && window.innerWidth > 768);

  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      setIsTablet(window.innerWidth <= 1024 && window.innerWidth > 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isSmallDevice = isMobile || isTablet;
  const [pricingTiers, setPricingTiers] = React.useState<any[]>([]);
  const [creditCostSettings, setCreditCostSettings] = React.useState<any[]>([]);

  React.useEffect(() => {
    const fetchDynamicSettings = async () => {
      const { data } = await supabase.from('app_settings').select('*');
      if (data) {
        const p = data.find(s => s.id === 'pricing_tiers')?.value || [];
        const c = data.find(s => s.id === 'credit_costs')?.value || [];
        setPricingTiers(p);
        setCreditCostSettings(c);
      }
    };
    fetchDynamicSettings();
  }, []);

  const getPlanInfo = (name: string, fallback: any) => {
    const found = pricingTiers.find(p => p.name === name);
    return found ? { ...fallback, price: found.price, credits: `${found.credits} credits / month` } : fallback;
  };

  return (
    <div style={landingStyle}>
      <Navbar />

      {/* Hero Section */}
      <header style={{
        ...heroSectionStyle,
        padding: isMobile ? '100px 20px 40px' : isTablet ? '120px 40px 60px' : '160px 80px 100px',
        flexDirection: isSmallDevice ? 'column' : 'row',
        textAlign: isSmallDevice ? 'center' : 'left',
        gap: isSmallDevice ? '40px' : '80px',
      }}>
        <div style={heroBackgroundGlow}></div>
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          style={heroContentStyle}
        >
          <div style={{ display: 'flex', justifyContent: isSmallDevice ? 'center' : 'flex-start' }}>
            <Badge text={t('landing.badge')} />
          </div>
          <h1 style={{
            ...heroTitleStyle,
            fontSize: isMobile ? '2.25rem' : '5rem',
            lineHeight: isMobile ? 1.3 : 1.2,
          }}>
            {t('landing.heroTitle')} <span style={{ color: 'var(--accent-primary)' }}>{t('landing.heroTitleHighlight')}</span>
          </h1>
          <p style={{
            ...heroSubtitleStyle,
            margin: isSmallDevice ? '0 auto 48px' : '0 0 48px 0',
          }}>
            {t('landing.heroSubtitle')}
          </p>
          <div style={{
            ...heroActionsStyle,
            justifyContent: isSmallDevice ? 'center' : 'flex-start',
            flexDirection: isMobile ? 'column' : 'row',
          }}>
            <Link to="/signup">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button size="lg" style={{ gap: '12px', padding: '16px 32px', width: '100%' }}>
                  {t('landing.getStarted')} <ArrowRight size={20} />
                </Button>
              </motion.div>
            </Link>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button size="lg" variant="outline" style={{ padding: '16px 32px', width: '100%' }}>{t('landing.watchDemo')}</Button>
            </motion.div>
          </div>

          {!isMobile && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              style={trustBarHeroStyle}
            >
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Trusted by professionals at</span>
              <div style={{
                ...heroLogosStyle,
                justifyContent: 'flex-start',
                flexWrap: 'wrap',
              }}>
                <span style={heroLogoPlaceholderStyle}>UNDP</span>
                <span style={heroLogoPlaceholderStyle}>WHO</span>
                <span style={heroLogoPlaceholderStyle}>UNESCO</span>
                <span style={heroLogoPlaceholderStyle}>WORLD BANK</span>
              </div>
            </motion.div>
          )}
          
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            style={{
              ...statsRowStyle,
              justifyContent: isMobile ? 'center' : 'flex-start',
              gap: isMobile ? '24px' : '48px',
            }}
          >
            <StatItem count="50k+" label={t('landing.stats.opportunities') || "Opportunities"} />
            <StatItem count="98%" label={t('landing.stats.matchAccuracy') || "Match Accuracy"} />
            <StatItem count="120+" label={t('landing.stats.countries') || "Countries"} />
          </motion.div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, x: 50 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          transition={{ duration: 1, delay: 0.2, type: 'spring' }}
          style={{
            ...heroImageContainerStyle,
            display: isMobile ? 'none' : 'block',
          }}
        >
          <div style={heroImagePlaceholderStyle}>
            <img 
              src="/hero.png" 
              alt="Platform Dashboard" 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
            />
            <div style={heroImageOverlayStyle}>
              <motion.div 
                animate={{ 
                  y: [0, -15, 0],
                  rotate: [0, 1, 0]
                }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                style={floatingCardStyle}
              >
                <Zap size={24} color="var(--accent-primary)" />
                <div>
                  <div style={{ fontWeight: 700 }}>98% Match</div>
                  <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>Senior Architect</div>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </header>

      {/* Problem/Solution Narrative */}
      <section className="section-padding" style={problemSectionStyle}>
        <div style={{
          ...problemContentStyle,
          flexDirection: isSmallDevice ? 'column' : 'row',
          gap: isSmallDevice ? '40px' : '80px',
        }}>
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            style={{ flex: 1 }}
          >
            <h2 style={{ 
              fontSize: isMobile ? '2rem' : '3rem', 
              fontWeight: 800, 
              marginBottom: '24px', 
              lineHeight: 1.2 
            }}>
              Stop Applying into <span style={{ color: 'var(--accent-primary)' }}>the Dark</span>.
            </h2>
            <p style={{ fontSize: '1.125rem', color: 'var(--text-secondary)', marginBottom: '32px', lineHeight: 1.6 }}>
              You've spent weeks on proposals. You've sent countless emails. You've waited for months only to get a generic rejection with no feedback. 
              The problem isn't your vision—it's the language of funders you haven't mastered.
            </p>
            <div style={benefitListStyle}>
              <BenefitItem text="Stop wasting time on mismatched opportunities." />
              <BenefitItem text="Master the specific language of global funders." />
              <BenefitItem text="Apply 10x faster with AI-trained success patterns." />
            </div>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            style={{
              ...problemImageStyle,
              marginTop: isMobile ? '32px' : '0',
            }}
          >
            <Card className="card-padding" style={{ border: '1px solid rgba(239, 68, 68, 0.2)', backgroundColor: 'rgba(239, 68, 68, 0.02)' }}>
              <h4 style={{ color: '#ef4444', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Shield size={18} /> The Old Way
              </h4>
              <ul style={{ listStyle: 'none', padding: 0, color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <li>❌ 40+ hours per proposal</li>
                <li>❌ 80% rejection rate</li>
                <li>❌ Generic ChatGPT drafts</li>
                <li>❌ No match intelligence</li>
              </ul>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="section-padding" style={featuresSectionStyle}>
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          style={sectionHeaderStyle}
        >
          <h2 style={{ ...sectionTitleStyle, fontSize: isMobile ? '2rem' : '2.5rem' }}>Why Professionals Choose PATHEW</h2>
          <p style={sectionSubtitleStyle}>Powerful tools designed to accelerate your career growth.</p>
        </motion.div>
        
        {isMobile ? (
          <div className="grid-responsive">
            {features.map((f, i) => (
              <FeatureCard 
                key={`${f.title}-${i}`}
                icon={f.icon} 
                title={f.title} 
                description={f.description} 
              />
            ))}
          </div>
        ) : (
          <div style={carouselContainerStyle}>
            <motion.div 
              animate={{ 
                x: isMobile ? [0, -1000] : [0, -1200],
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: "linear"
              }}
              style={carouselTrackStyle}
            >
              {[...features, ...features].map((f, i) => (
                <FeatureCard 
                  key={`${f.title}-${i}`}
                  icon={f.icon} 
                  title={f.title} 
                  description={f.description} 
                />
              ))}
            </motion.div>
          </div>
        )}
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="section-padding" style={howItWorksSectionStyle}>
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          style={sectionHeaderStyle}
        >
          <h2 style={{ ...sectionTitleStyle, fontSize: isMobile ? '2rem' : '3.5rem' }}>How it Works</h2>
          <p style={sectionSubtitleStyle}>Your journey to a better career in three simple steps.</p>
        </motion.div>
        
        <div className="grid-responsive">
          <StepItem number="01" title="Complete Your Profile" description="Share your story, achievements, and goals through our intuitive onboarding wizard." />
          <StepItem number="02" title="Get Matched" description="Our Assistant engine scans thousands of opportunities to find your perfect fit." />
          <StepItem number="03" title="Apply with Confidence" description="Use smart-generated documents to stand out and land your dream role." />
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6 }}
          style={{ textAlign: 'center', marginTop: '64px' }}
        >
          <Link to="/signup">
            <Button variant="outline" style={{ gap: '10px', padding: '16px 40px' }}>
              Learn More <ArrowRight size={18} />
            </Button>
          </Link>
        </motion.div>
      </section>

      {/* Comparison Section */}
      <section className="section-padding" style={comparisonSectionStyle}>
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={sectionHeaderStyle}
        >
          <h2 style={{ ...sectionTitleStyle, fontSize: isMobile ? '1.75rem' : '3.5rem' }}>ChatGPT learned from the internet. <br/> <span style={{ color: 'var(--accent-primary)' }}>PATHEW learned from winners.</span></h2>
          <p style={sectionSubtitleStyle}>Unlike generic AI, our system is trained on over $50M in successful global opportunity applications.</p>
        </motion.div>

        <div className="comparison-grid" style={{ 
          maxWidth: '1200px', 
          margin: '0 auto',
          gridTemplateColumns: isSmallDevice ? '1fr' : '1fr 1fr' 
        }}>
          <ComparisonColumn 
            title="Generic AI" 
            items={[
              'Bloated, generic drafts',
              'No context of funder history',
              'Hallucinates impact data',
              'Standard internet knowledge'
            ]} 
          />
          <ComparisonColumn 
            title="PATHEW Assistant" 
            highlight 
            items={[
              'Precision match scoring',
              'Success-pattern training',
              'Verifiable impact narrative',
              'Built for global standards'
            ]} 
          />
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="section-padding" style={{...pricingSectionStyle, backgroundColor: 'var(--bg-secondary)'}}>
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={sectionHeaderStyle}
        >
          <h2 style={{ ...sectionTitleStyle, fontSize: isMobile ? '2rem' : '3.5rem' }}>Pricing Plans</h2>
          <p style={sectionSubtitleStyle}>Simple, credit-based pricing. Pay for what you create.</p>
        </motion.div>
        
        <div className="grid-responsive" style={{ alignItems: 'stretch' }}>
          <PricingCard 
            {...getPlanInfo('Starter', {
              title: "Starter",
              price: "£11.99",
              credits: "25 credits / month",
              subtitle: "Perfect for individuals tackling a single application round.",
              generatesUpTo: [
                { label: 'Cover Letters', count: '25×' },
                { label: 'CVs / Resumes', count: '25×' },
                { label: 'Proposals', count: '25×' },
                { label: 'Grant Applications', count: '8×' },
                { label: 'Rewrites', count: '100×' }
              ]
            })}
            includedFeatures={[
              'View live job & grant opportunities',
              'Percentage readiness score per application',
              'AI-generated preparation plan – credit applies'
            ]}
          />
          <PricingCard 
            {...getPlanInfo('Growth', {
              title: "Growth",
              price: "£25.00",
              credits: "60 credits / month",
              subtitle: "For freelancers and active job seekers applying across multiple roles.",
              badge: "★ MOST POPULAR ★",
              generatesUpTo: [
                { label: 'Cover Letters', count: '60×' },
                { label: 'CVs / Resumes', count: '60×' },
                { label: 'Proposals', count: '60×' },
                { label: 'Grant Applications', count: '20×' },
                { label: 'Rewrites', count: '240×' }
              ]
            })}
            includedFeatures={[
              'View live job & grant opportunities',
              'Percentage readiness score per application',
              'AI-generated preparation plan – credit applies'
            ]}
          />
          <PricingCard 
            {...getPlanInfo('Power User', {
              title: "Power User",
              price: "£48.00",
              credits: "120 credits / month",
              subtitle: "For agencies, consultants and power users generating at scale.",
              badge: "★ BEST VALUE ★",
              badgeColor: "#3b82f6",
              generatesUpTo: [
                { label: 'Cover Letters', count: '120×' },
                { label: 'CVs / Resumes', count: '120×' },
                { label: 'Proposals', count: '120×' },
                { label: 'Grant Applications', count: '40×' },
                { label: 'Rewrites', count: '480×' }
              ]
            })}
            includedFeatures={[
              'View live job & grant opportunities',
              'Percentage readiness score per application',
              'AI-generated preparation plan – credit applies'
            ]}
          />
        </div>

        {/* Credit Cost Table */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={{ maxWidth: '800px', margin: '80px auto 0' }}
        >
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h3 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '16px' }}>Credit Cost Per Service</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.125rem' }}>
              Mix and match any service — credits work across your entire account.
            </p>
          </div>

          <Card style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--border-color)' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-color)' }}>
                    <th style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--text-secondary)' }}>Service</th>
                    <th style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--text-secondary)' }}>Credits</th>
                    <th style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--text-secondary)' }}>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {(creditCostSettings.length > 0 ? creditCostSettings : [
                    { service: 'Cover Letter', credits: 1, notes: 'per letter' },
                    { service: 'CV / Resume', credits: 1, notes: 'per CV' },
                    { service: 'Proposal', credits: 1, notes: 'per proposal' },
                    { service: 'Grant Application', credits: 3, notes: 'per grant' },
                    { service: 'Preparation Plan', credits: 3, notes: 'per plan' },
                    { service: 'Any Rewrite', credits: 0.25, notes: 'per rewrite (¼ of original after 3 rewrites)' },
                  ]).map((row, idx) => (
                    <tr key={idx} style={{ borderBottom: idx !== 5 ? '1px solid var(--border-color)' : 'none' }}>
                      <td style={{ padding: '16px 24px', fontWeight: 500 }}>{row.service}</td>
                      <td style={{ padding: '16px 24px', color: 'var(--accent-primary)', fontWeight: 600 }}>{row.credits} {row.credits === 1 ? 'credit' : 'credits'}</td>
                      <td style={{ padding: '16px 24px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>{row.notes || (row.service === 'Any Rewrite' ? 'per rewrite' : `per ${row.service.toLowerCase()}`)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
          
          <div style={{ textAlign: 'center', marginTop: '32px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', backgroundColor: 'rgba(245, 158, 11, 0.1)', padding: '12px 24px', borderRadius: 'var(--radius-full)', color: 'var(--accent-primary)', fontWeight: 600 }}>
              <Zap size={18} />
              Need more? Users can top up their credits at any time.
            </div>
          </div>
        </motion.div>
      </section>

      {/* Social Proof Section (Trustpilot Reviews) */}
      <section className="section-padding" style={{...socialProofSectionStyle, overflow: 'hidden'}}>
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          style={sectionHeaderStyle}
        >
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
             <Star size={24} fill="#00b67a" color="#00b67a" />
             <span style={{ fontWeight: 800, fontSize: '1.25rem', color: '#00b67a' }}>Trustpilot</span>
          </div>
          <h2 style={{ ...sectionTitleStyle, fontSize: isMobile ? '2rem' : '3.5rem' }}>See why thousands of professionals trust us</h2>
        </motion.div>
        
        <ReviewsCarousel />
      </section>

      {/* FAQ Section */}
      <section id="faq" className="section-padding" style={faqSectionStyle}>
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={sectionHeaderStyle}
        >
          <h2 style={{ ...sectionTitleStyle, fontSize: isMobile ? '2rem' : '3.5rem' }}>Frequently Asked Questions</h2>
          <p style={sectionSubtitleStyle}>Everything you need to know about Pathew Assistant.</p>
        </motion.div>
        
        <div style={faqContainerStyle}>
          <FAQItem 
            question="How does Pathew Assistant match me to opportunities?" 
            answer="Our advanced AI engine analyzes your profile against thousands of data points in opportunity descriptions to provide a precision match score." 
          />
          <FAQItem 
            question="Is my personal data secure?" 
            answer="Yes, we use industry-standard encryption. Your full profile is only shared with recruiters when you explicitly choose to apply." 
          />
          <FAQItem 
            question="Can I use the platform for free?" 
            answer="Absolutely! Our Free plan allows you to explore matches and make up to 3 applications per month." 
          />
        </div>
      </section>

      {/* Footer */}
      <footer className="section-padding" style={{
        ...footerStyle,
        paddingTop: isMobile ? '60px' : '100px',
        paddingBottom: '40px',
      }}>
        <div className="flex-responsive" style={{ 
          ...footerMainStyle, 
          gap: isSmallDevice ? '40px' : '80px',
          textAlign: isSmallDevice ? 'center' : 'left'
        }}>
          <div style={{ 
            ...footerBrandColStyle, 
            flex: isSmallDevice ? '1' : '1.5', 
            textAlign: isSmallDevice ? 'center' : 'left' 
          }}>
            <Link to="/" style={{ ...logoStyle, justifyContent: isSmallDevice ? 'center' : 'flex-start' }}>
              <img src={logo} alt="PATHEW Logo" style={{ height: '32px', objectFit: 'contain' }} />
            </Link>
            <p style={{ 
              color: 'var(--text-secondary)', 
              marginTop: '20px', 
              lineHeight: 1.6, 
              maxWidth: isSmallDevice ? '100%' : '300px',
              margin: isSmallDevice ? '20px auto 0' : '20px 0 0'
            }}>
              The premium platform for global opportunity matching. Empowering professionals with Pathew Assistant.
            </p>
          </div>
          
          <div className="grid-responsive" style={{ flex: 3, gap: '40px' }}>
            <FooterCol title="Product" links={['Features', 'How it works', 'Pricing', 'API']} />
            <FooterCol title="Company" links={['About', 'Careers', 'Blog', 'Contact']} />
            <FooterCol title="Legal" links={['Privacy', 'Terms', 'Security', 'Cookies']} />
          </div>
        </div>
        
        <div style={{
          ...footerBottomStyle,
          flexDirection: isSmallDevice ? 'column' : 'row',
          gap: '24px',
          textAlign: 'center',
          marginTop: '64px',
          paddingTop: '32px',
          borderTop: '1px solid var(--border-color)',
        }}>
          <p>© 2024 PATHEW. All rights reserved.</p>
          <div style={{ ...socialLinksStyle, justifyContent: 'center' }}>
            <SocialIcon icon={FacebookIcon} label="Facebook" />
            <SocialIcon icon={InstagramIcon} label="Instagram" />
            <SocialIcon icon={TikTokIcon} label="TikTok" />
          </div>
        </div>
        
        {/* Decorative Footer Glow */}
        <div style={{
          position: 'absolute',
          bottom: '-100px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '800px',
          height: '200px',
          background: 'radial-gradient(circle, rgba(245, 158, 11, 0.05) 0%, transparent 70%)',
          filter: 'blur(50px)',
          pointerEvents: 'none',
          zIndex: 0,
        }}></div>
      </footer>
    </div>
  );
};

// Sub-components
const Badge = ({ text }: { text: string }) => (
  <motion.div 
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.5 }}
    style={badgeStyle}
  >
    <div style={badgeDotStyle}></div>
    <span>{text}</span>
  </motion.div>
);

const FeatureCard = ({ icon: Icon, title, description }: any) => (
  <motion.div 
    variants={{
      hidden: { opacity: 0, y: 20 },
      show: { opacity: 1, y: 0 }
    }}
    whileHover={{ y: -10, borderColor: 'var(--accent-primary)', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}
    className="card-padding"
    style={{...featureCardStyle, flexShrink: 0}}
  >
    <div style={featureIconWrapperStyle}>
      <Icon size={24} color="var(--accent-primary)" />
    </div>
    <h3 style={{ marginBottom: '12px', fontSize: '1.25rem', fontWeight: 700 }}>{title}</h3>
    <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>{description}</p>
  </motion.div>
);

const ReviewsCarousel = () => {
  const [reviews, setReviews] = React.useState<any[]>([]);

  React.useEffect(() => {
    const fetchReviews = async () => {
      const { data } = await supabase.from('reviews').select('*').order('review_date', { ascending: false });
      if (data && data.length > 0) {
        setReviews(data);
      } else {
        // Fallback mock data if table is empty
        setReviews([
          { user_name: "Akarshak Tanwar", location_code: "CA", rating: 5, content: "Applied to 150+ jobs in a week, and secured 2 confirmed interviews with responsive team support.", review_date: "2025-09-06" },
          { user_name: "Olufisayo Abiodun", location_code: "US", rating: 5, content: "Incredible tool! I got an interview invite just a day after I signed up on Pathew!", review_date: "2025-10-17" },
          { user_name: "Julian Carlin", location_code: "CR", rating: 5, content: "It worked; within 48 hours it applied to 100 jobs for me without requiring any of my time or effort.", review_date: "2025-09-19" },
          { user_name: "John D Patton", location_code: "US", rating: 5, content: "Effortless AI-Powered Applications! The platform's intuitive interface saves countless hours.", review_date: "2025-06-10" },
          { user_name: "Shaimaa Faik", location_code: "GB", rating: 5, content: "Its like hiring someone to help you with searching and applying, it amplifies your percentage.", review_date: "2025-10-30" },
          { user_name: "Ahmed Fouad", location_code: "EG", rating: 5, content: "Very easy to use, many features for every single detail you would need in your hiring journey.", review_date: "2025-10-22" },
        ]);
      }
    };
    fetchReviews();
  }, []);

  const row1 = [...reviews, ...reviews];
  const row2 = [...reviews.slice().reverse(), ...reviews.slice().reverse()];

  return (
    <div style={{ position: 'relative', width: '100%', overflow: 'hidden', padding: '24px 0', display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Row 1: Scrolling Left */}
      <div style={{ position: 'relative', width: '100%', overflow: 'hidden' }}>
        <motion.div 
          animate={{ x: [0, -3000] }}
          transition={{ duration: 100, repeat: Infinity, ease: "linear" }}
          style={{ display: 'flex', gap: '24px', width: 'max-content' }}
        >
          {row1.map((r, i) => <ReviewCard key={`r1-${i}`} review={r} />)}
        </motion.div>
      </div>

      {/* Row 2: Scrolling Right */}
      <div style={{ position: 'relative', width: '100%', overflow: 'hidden' }}>
        <motion.div 
          animate={{ x: [-3000, 0] }}
          transition={{ duration: 100, repeat: Infinity, ease: "linear" }}
          style={{ display: 'flex', gap: '24px', width: 'max-content' }}
        >
          {row2.map((r, i) => <ReviewCard key={`r2-${i}`} review={r} />)}
        </motion.div>
      </div>
    </div>
  );
};

const ReviewCard = ({ review }: { review: any }) => (
  <Card style={{ width: '360px', minHeight: '280px', padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', boxShadow: 'var(--shadow-lg)' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      {review.user_avatar ? (
        <img src={review.user_avatar} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} alt="" />
      ) : (
        <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#000' }}>
          {review.user_name[0]}
        </div>
      )}
      <div>
        <div style={{ fontWeight: 700, fontSize: '0.9375rem' }}>{review.user_name}</div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{review.location_code}</div>
      </div>
    </div>
    
    <div style={{ display: 'flex', gap: '2px' }}>
      {[...Array(5)].map((_, i) => (
        <div key={i} style={{ width: '16px', height: '16px', backgroundColor: i < review.rating ? '#00b67a' : '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Star size={10} fill="#fff" color="#fff" />
        </div>
      ))}
    </div>

    <p style={{ fontSize: '0.9375rem', lineHeight: 1.5, color: 'var(--text-primary)', flex: 1 }}>
      "{review.content}"
    </p>

    <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 500 }}>
      {new Date(review.review_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
    </div>
  </Card>
);

const StatItem = ({ count, label }: { count: string, label: string }) => (
  <div style={statItemStyle}>
    <motion.div 
      initial={{ scale: 0.8 }}
      whileInView={{ scale: 1 }}
      style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}
    >
      {count}
    </motion.div>
    <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{label}</div>
  </div>
);

const StepItem = ({ number, title, description }: { number: string, title: string, description: string }) => (
  <motion.div 
    variants={{
      hidden: { opacity: 0, scale: 0.9 },
      show: { opacity: 1, scale: 1 }
    }}
    whileHover={{ scale: 1.02 }}
    className="card-padding"
    style={stepItemCardStyle}
  >
    <div style={stepNumberStyle}>{number}</div>
    <h3 style={{ marginBottom: '12px', fontSize: '1.5rem', fontWeight: 700 }}>{title}</h3>
    <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>{description}</p>
  </motion.div>
);

const PricingCard = ({ title, price, credits, subtitle, generatesUpTo, includedFeatures, badge, badgeColor = 'var(--accent-primary)' }: any) => {
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  const handleSubscribe = (e: any) => {
    e.preventDefault();
    setIsModalOpen(true);
  };

  return (
    <>
      <motion.div 
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    whileHover={{ y: -10 }}
    className="card-padding"
    style={{
      ...pricingCardStyle,
      borderColor: badge ? badgeColor : 'var(--border-color)',
      boxShadow: badge ? `0 30px 60px -15px ${badgeColor}33` : 'none',
      zIndex: badge ? 1 : 0,
      display: 'flex',
      flexDirection: 'column'
    }}
  >
    {badge && <div style={{...popularBadgeStyle, backgroundColor: badgeColor, color: '#000'}}>{badge}</div>}
    <h3 style={{ fontSize: '1.5rem', marginBottom: '8px', fontWeight: 700 }}>{title}</h3>
    <div style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '8px' }}>
      {price}<span style={{ fontSize: '1rem', fontWeight: 400, color: 'var(--text-muted)' }}>/mo</span>
    </div>
    <div style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--accent-primary)', marginBottom: '8px' }}>
      {credits}
    </div>
    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '24px', lineHeight: 1.5, minHeight: '42px' }}>
      {subtitle}
    </p>

    <div style={{ marginBottom: '24px' }}>
      <div style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '12px' }}>
        GENERATES UP TO
      </div>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {generatesUpTo.map((g: any) => (
          <li key={g.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9375rem', color: 'var(--text-primary)' }}>
            <span>{g.label}</span>
            <span style={{ fontWeight: 600 }}>{g.count}</span>
          </li>
        ))}
      </ul>
    </div>

    <div style={{ flex: 1, marginBottom: '32px' }}>
      <div style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '12px', textTransform: 'uppercase' }}>
        INCLUDED IN EVERY PLAN
      </div>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {includedFeatures.map((f: string) => (
          <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '12px', color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.4 }}>
            <CheckCircle size={16} color="var(--accent-primary)" style={{ flexShrink: 0, marginTop: '2px' }} /> 
            <span>{f}</span>
          </li>
        ))}
      </ul>
    </div>

    <div style={{ marginTop: 'auto' }}>
      <Button onClick={handleSubscribe} variant={badge === '★ MOST POPULAR ★' ? 'primary' : 'outline'} style={{ width: '100%' }}>
        Choose {title}
      </Button>
    </div>
  </motion.div>

  <StripeCheckoutModal 
    isOpen={isModalOpen} 
    onClose={() => setIsModalOpen(false)} 
    planTitle={title} 
    planPrice={price}
    planCredits={credits}
  />
  </>
  );
};

const SocialIcon = ({ icon: Icon, label }: { icon: any, label: string }) => (
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

const FAQItem = ({ question, answer }: { question: string, answer: string }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  
  return (
    <div style={faqItemStyle}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={faqQuestionButtonStyle}
      >
        <span style={{ fontWeight: 600, fontSize: '1.125rem' }}>{question}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <Plus size={20} color={isOpen ? 'var(--accent-primary)' : 'var(--text-muted)'} />
        </motion.div>
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            style={{ overflow: 'hidden' }}
          >
            <div style={faqAnswerStyle}>
              {answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ComparisonColumn = ({ title, items, highlight }: any) => (
  <motion.div 
    whileHover={{ 
      y: -10,
      scale: 1.02,
      boxShadow: highlight 
        ? '0 20px 40px rgba(245, 158, 11, 0.2)' 
        : '0 20px 40px rgba(0, 0, 0, 0.4)'
    }}
    transition={{ type: 'spring', stiffness: 300 }}
    className="card-padding"
    style={{
      ...comparisonColStyle,
      position: 'relative',
      overflow: 'hidden',
      borderColor: highlight ? 'var(--accent-primary)' : 'rgba(255, 255, 255, 0.1)',
      background: highlight 
        ? 'linear-gradient(145deg, rgba(245, 158, 11, 0.05) 0%, var(--bg-secondary) 100%)' 
        : 'linear-gradient(145deg, rgba(255, 255, 255, 0.02) 0%, var(--bg-secondary) 100%)',
      backdropFilter: 'blur(10px)',
    }}
  >
    {highlight && (
      <div style={comparisonBadgeStyle}>
        <Sparkles size={12} /> RECOMMENDED
      </div>
    )}

    <div style={{ position: 'relative', zIndex: 1 }}>
      <h3 style={{ 
        fontSize: '1.75rem', 
        fontWeight: 800,
        marginBottom: '32px', 
        color: highlight ? 'var(--accent-primary)' : 'var(--text-primary)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        {highlight ? <Zap size={24} /> : <Shield size={24} />}
        {title}
      </h3>
      
      <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {items.map((item: string, idx: number) => (
          <motion.li 
            key={item} 
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '16px', 
              color: highlight ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontSize: '1.05rem'
            }}
          >
            {highlight ? (
              <div style={checkCircleBoxStyle}>
                <CheckCircle size={16} color="var(--accent-primary)" />
              </div>
            ) : (
              <div style={xCircleBoxStyle}>
                <Plus size={16} style={{ transform: 'rotate(45deg)' }} />
              </div>
            )}
            {item}
          </motion.li>
        ))}
      </ul>
    </div>

    {/* Decorative Glow */}
    {highlight && <div style={columnGlowStyle} />}
  </motion.div>
);



const BenefitItem = ({ text }: { text: string }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
    <div style={{ width: '24px', height: '24px', backgroundColor: 'rgba(245, 158, 11, 0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <CheckCircle size={14} color="var(--accent-primary)" />
    </div>
    <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{text}</span>
  </div>
);

// Styles
const landingStyle: React.CSSProperties = {
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




const heroSectionStyle: React.CSSProperties = {
  padding: '160px 80px 100px',
  display: 'flex',
  alignItems: 'center',
  gap: '80px',
  maxWidth: '1600px',
  margin: '0 auto',
  position: 'relative',
};

const heroBackgroundGlow: React.CSSProperties = {
  position: 'absolute',
  top: '20%',
  left: '10%',
  width: '400px',
  height: '400px',
  background: 'radial-gradient(circle, rgba(245, 158, 11, 0.15) 0%, transparent 70%)',
  filter: 'blur(60px)',
  zIndex: -1,
};

const heroContentStyle: React.CSSProperties = {
  flex: 1.2,
};

const heroTitleStyle: React.CSSProperties = {
  fontSize: '5rem',
  lineHeight: 1.2,
  marginBottom: '32px',
  fontWeight: 800,
  letterSpacing: '-0.04em',
};

const heroSubtitleStyle: React.CSSProperties = {
  fontSize: '1.25rem',
  color: 'var(--text-secondary)',
  marginBottom: '48px',
  lineHeight: 1.6,
  maxWidth: '650px',
};

const heroActionsStyle: React.CSSProperties = {
  display: 'flex',
  gap: '24px',
  marginBottom: '64px',
};

const statsRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: '48px',
  borderTop: '1px solid var(--border-color)',
  paddingTop: '32px',
};

const statItemStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
};

const heroImageContainerStyle: React.CSSProperties = {
  flex: 1.5,
  position: 'relative',
};

const heroImagePlaceholderStyle: React.CSSProperties = {
  width: '100%',
  height: '750px',
  backgroundColor: 'var(--bg-secondary)',
  borderRadius: '32px',
  border: '1px solid var(--border-color)',
  position: 'relative',
  overflow: 'hidden',
  boxShadow: '0 40px 80px -20px rgba(0, 0, 0, 0.6)',
};

const heroImageOverlayStyle: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  background: 'linear-gradient(to top, var(--bg-primary), transparent)',
};

const floatingCardStyle: React.CSSProperties = {
  position: 'absolute',
  top: '60px',
  left: '-30px',
  backgroundColor: 'var(--bg-secondary)',
  padding: '24px',
  borderRadius: '20px',
  border: '1px solid rgba(245, 158, 11, 0.3)',
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
  boxShadow: 'var(--shadow-lg)',
  backdropFilter: 'blur(10px)',
};

const badgeStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '10px',
  padding: '8px 16px',
  backgroundColor: 'rgba(245, 158, 11, 0.1)',
  borderRadius: '30px',
  fontSize: '0.875rem',
  fontWeight: 600,
  color: 'var(--accent-primary)',
  marginBottom: '32px',
  border: '1px solid rgba(245, 158, 11, 0.2)',
};

const badgeDotStyle: React.CSSProperties = {
  width: '8px',
  height: '8px',
  backgroundColor: 'var(--accent-primary)',
  borderRadius: '50%',
  boxShadow: '0 0 10px var(--accent-primary)',
};

const featuresSectionStyle: React.CSSProperties = {
  backgroundColor: 'var(--bg-secondary)',
};

const howItWorksSectionStyle: React.CSSProperties = {
  backgroundColor: 'var(--bg-primary)',
};



const stepItemCardStyle: React.CSSProperties = {
  backgroundColor: 'var(--bg-secondary)',
  borderRadius: '32px',
  border: '1px solid var(--border-color)',
  position: 'relative',
};

const stepNumberStyle: React.CSSProperties = {
  fontSize: '4rem',
  fontWeight: 900,
  color: 'rgba(245, 158, 11, 0.1)',
  position: 'absolute',
  top: '20px',
  right: '30px',
};

const pricingSectionStyle: React.CSSProperties = {
  backgroundColor: 'var(--bg-secondary)',
};



const pricingCardStyle: React.CSSProperties = {
  backgroundColor: 'var(--bg-primary)',
  borderRadius: '32px',
  border: '2px solid var(--border-color)',
  display: 'flex',
  flexDirection: 'column',
  position: 'relative',
  transition: 'all 0.3s ease',
};

const popularBadgeStyle: React.CSSProperties = {
  position: 'absolute',
  top: '-16px',
  left: '50%',
  transform: 'translateX(-50%)',
  backgroundColor: 'var(--accent-primary)',
  color: '#000',
  padding: '6px 16px',
  borderRadius: '20px',
  fontSize: '0.875rem',
  fontWeight: 700,
};

const footerStyle: React.CSSProperties = {
  backgroundColor: 'var(--bg-secondary)',
  borderTop: '1px solid var(--border-color)',
  position: 'relative',
  overflow: 'hidden',
};

const footerMainStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: '80px',
  marginBottom: '80px',
  maxWidth: '1400px',
  margin: '0 auto 80px',
  position: 'relative',
  zIndex: 1,
};

const footerBrandColStyle: React.CSSProperties = {
  flex: 1.5,
  maxWidth: '400px',
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
  borderTop: '1px solid rgba(255, 255, 255, 0.05)',
  color: 'var(--text-muted)',
  fontSize: '0.875rem',
  maxWidth: '1400px',
  margin: '0 auto',
  position: 'relative',
  zIndex: 1,
};

const socialLinksStyle: React.CSSProperties = {
  display: 'flex',
  gap: '24px',
};

const sectionHeaderStyle: React.CSSProperties = {
  textAlign: 'center',
  marginBottom: '48px',
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: '3.5rem',
  fontWeight: 800,
  marginBottom: '20px',
  letterSpacing: '-0.02em',
};

const sectionSubtitleStyle: React.CSSProperties = {
  color: 'var(--text-secondary)',
  fontSize: '1.25rem',
  maxWidth: '700px',
  margin: '0 auto',
};

const carouselContainerStyle: React.CSSProperties = {
  overflow: 'hidden',
  width: '100%',
  padding: '20px 0',
  position: 'relative',
};

const carouselTrackStyle: React.CSSProperties = {
  display: 'flex',
  gap: '32px',
  width: 'max-content',
};


const featureCardStyle: React.CSSProperties = {
  backgroundColor: 'var(--bg-secondary)',
  borderRadius: '32px',
  border: '1px solid var(--border-color)',
  transition: 'all 0.3s ease',
  cursor: 'default',
  width: '380px',
  minHeight: '320px',
  display: 'flex',
  flexDirection: 'column',
};

const featureIconWrapperStyle: React.CSSProperties = {
  width: '64px',
  height: '64px',
  backgroundColor: 'rgba(245, 158, 11, 0.05)',
  borderRadius: '20px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: '32px',
  border: '1px solid rgba(245, 158, 11, 0.1)',
};

const faqSectionStyle: React.CSSProperties = {
  backgroundColor: 'var(--bg-primary)',
};

const faqContainerStyle: React.CSSProperties = {
  maxWidth: '800px',
  margin: '0 auto',
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
};

const faqItemStyle: React.CSSProperties = {
  backgroundColor: 'var(--bg-secondary)',
  borderRadius: '24px',
  border: '1px solid var(--border-color)',
  overflow: 'hidden',
};

const faqQuestionButtonStyle: React.CSSProperties = {
  width: '100%',
  padding: '24px 32px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  background: 'none',
  border: 'none',
  color: 'var(--text-primary)',
  cursor: 'pointer',
  textAlign: 'left',
};

const faqAnswerStyle: React.CSSProperties = {
  padding: '0 32px 24px',
  color: 'var(--text-secondary)',
  lineHeight: 1.6,
};

const trustBarHeroStyle: React.CSSProperties = {
  marginTop: '40px',
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
};

const heroLogosStyle: React.CSSProperties = {
  display: 'flex',
  gap: '32px',
  opacity: 0.6,
  alignItems: 'center',
};

const heroLogoPlaceholderStyle: React.CSSProperties = {
  fontSize: '0.875rem',
  fontWeight: 700,
  letterSpacing: '0.05em',
};

const problemSectionStyle: React.CSSProperties = {
  backgroundColor: 'var(--bg-primary)',
};

const problemContentStyle: React.CSSProperties = {
  maxWidth: '1200px',
  margin: '0 auto',
  display: 'flex',
  alignItems: 'center',
  gap: '80px',
};

const benefitListStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  marginTop: '40px',
};

const problemImageStyle: React.CSSProperties = {
  flex: 0.8,
};

const comparisonSectionStyle: React.CSSProperties = {
  backgroundColor: 'var(--bg-secondary)',
};



const comparisonColStyle: React.CSSProperties = {
  borderRadius: '32px',
  border: '2px solid var(--border-color)',
  transition: 'all 0.3s ease',
};

const socialProofSectionStyle: React.CSSProperties = {
  backgroundColor: 'var(--bg-primary)',
};





const comparisonBadgeStyle: React.CSSProperties = {
  position: 'absolute',
  top: '24px',
  right: '24px',
  backgroundColor: 'var(--accent-primary)',
  color: 'black',
  padding: '6px 12px',
  borderRadius: '20px',
  fontSize: '0.65rem',
  fontWeight: 800,
  letterSpacing: '0.1em',
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
};

const checkCircleBoxStyle: React.CSSProperties = {
  width: '32px',
  height: '32px',
  backgroundColor: 'rgba(245, 158, 11, 0.15)',
  borderRadius: '10px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const xCircleBoxStyle: React.CSSProperties = {
  width: '32px',
  height: '32px',
  backgroundColor: 'var(--bg-tertiary)',
  borderRadius: '10px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'var(--text-muted)',
};

const columnGlowStyle: React.CSSProperties = {
  position: 'absolute',
  bottom: '-50px',
  right: '-50px',
  width: '200px',
  height: '200px',
  background: 'radial-gradient(circle, rgba(245, 158, 11, 0.1) 0%, transparent 70%)',
  zIndex: 0,
};
