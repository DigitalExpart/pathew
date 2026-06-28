import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge as UIBadge } from '../../components/ui/Badge';
import { Navbar } from '../../components/layout/Navbar';
import { Sparkles, ArrowRight, CheckCircle, Globe, Shield, Zap, Plus, Star, ChevronDown, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Link } from 'react-router-dom';
import { CheckoutModal } from '../../components/payment/CheckoutModal';
import { useTranslation } from 'react-i18next';
import logo from '../../assets/images/logo.png';
import howItWorksVideo from '../../assets/images/how-it-works.mp4';
import { useAuth } from '../../context/AuthContext';


const features = [
  { icon: Globe, title: "Global Discovery", description: "Aggregated opportunities from thousands of premium sources worldwide." },
  { icon: Zap, title: "Assistant Match Scoring", description: "Know exactly how well you fit before you even click apply." },
  { icon: CheckCircle, title: "Smart Document Generation", description: "Auto-generate CVs and cover letters tailored to each opportunity." },
  { icon: Shield, title: "Privacy First", description: "Your data is encrypted and only shared when you choose to apply." },
];

export const LandingPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [isMobile, setIsMobile] = React.useState(window.innerWidth <= 768);
  const [isTablet, setIsTablet] = React.useState(window.innerWidth <= 1024 && window.innerWidth > 768);
  const [showAllFaqs, setShowAllFaqs] = React.useState(false);
  const [showVideo, setShowVideo] = React.useState(false);

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
  const [dbOpportunities, setDbOpportunities] = React.useState<any[]>([]);

  React.useEffect(() => {
    const fetchDynamicSettings = async () => {
      const { data } = await supabase.from('app_settings').select('*');
      if (data) {
        const p = data.find(s => s.id === 'pricing_tiers')?.value || [];
        setPricingTiers(p);
      }
      
      const { data: oppData } = await supabase
        .from('opportunities')
        .select('*')
        .eq('status', 'published')
        .neq('type', 'job')
        .order('featured', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(6);
        
      if (oppData && oppData.length > 0) {
        setDbOpportunities(oppData);
      }
    };
    fetchDynamicSettings();
    
    // Subscribe to realtime updates for opportunities
    const channel = supabase
      .channel('public:opportunities')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'opportunities' }, () => {
        fetchDynamicSettings();
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
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
            fontSize: isMobile ? '2.25rem' : '4rem',
            lineHeight: isMobile ? 1.3 : 1.2,
          }}>
            {t('landing.heroTitle')} <span style={{ color: 'var(--accent-primary)' }}>{t('landing.heroTitleHighlight')}</span>{t('landing.heroTitleEnd', '')}
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
          </div>

          {!isMobile && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              style={trustBarHeroStyle}
            >
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{t('landing.trustedBy')}</span>
              <div style={{
                ...heroLogosStyle,
                justifyContent: 'flex-start',
                flexWrap: 'wrap',
              }}>
                <span style={heroLogoPlaceholderStyle}>UNDP</span>
                <span style={heroLogoPlaceholderStyle}>WHO</span>
                <span style={heroLogoPlaceholderStyle}>AMAZON</span>
                <span style={heroLogoPlaceholderStyle}>GOOGLE</span>
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
            <StatItem count="1K+" label={t('landing.stats.opportunities')} />
            <StatItem count="98%" label={t('landing.stats.matchAccuracy')} />
            <StatItem count="50+" label={t('landing.stats.countries')} />
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
              style={{ width: '100%', height: '850px', objectFit: 'cover', objectPosition: 'right top', display: 'block', borderRadius: 'inherit' }} 
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

      {/* Opportunities Section */}
      <section id="opportunities" className="section-padding" style={{ backgroundColor: 'var(--bg-secondary)' }}>
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={sectionHeaderStyle}
        >
          <h2 style={{ ...sectionTitleStyle, fontSize: isMobile ? '2rem' : '3.5rem' }}>Explore Opportunities</h2>
          <p style={sectionSubtitleStyle}>Discover roles tailored to your unique profile and start applying in seconds.</p>
        </motion.div>
        
        <div style={opportunitiesGridStyle}>
          {dbOpportunities.map((opp, index) => (
            <motion.div 
              key={opp.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Card style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <div style={oppCardContentStyle}>
                  <div style={oppInfoStyle}>
                    <h3 style={oppTitleStyle}>{opp.title}</h3>
                    <p style={oppCompanyStyle}>{opp.company || opp.organization_name || opp.funder_name} • {opp.location}</p>
                    <div style={{ marginTop: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <UIBadge variant="primary">{opp.type}</UIBadge>
                      <UIBadge variant="info">{opp.source || opp.source_name}</UIBadge>
                    </div>
                  </div>
                  <div style={oppMatchStyle}>
                    <div style={matchCircleStyle}>
                      <span style={matchValueStyle}>{opp.match || (85 + (String(opp.id).charCodeAt(0) % 12))}%</span>
                    </div>
                    <span style={matchLabelStyle}>Match</span>
                  </div>
                </div>
                <div style={{ padding: '0 20px 20px', display: 'flex', gap: '12px', marginTop: 'auto' }}>
                  <Link to={user ? `/opportunities/${opp.id}` : "/login"} style={{ flex: 1 }}>
                    <Button style={{ width: '100%' }}>Apply</Button>
                  </Link>
                  <Link to={user ? `/opportunities/${opp.id}` : "/login"} style={{ flex: 1 }}>
                    <Button variant="outline" style={{ width: '100%' }}>Prepare</Button>
                  </Link>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
        
        <div style={{ textAlign: 'center', marginTop: '48px' }}>
          <Link to={user ? "/opportunities" : "/login"}>
            <Button variant="outline" style={{ gap: '10px' }}>
              View More Opportunities <ArrowRight size={18} />
            </Button>
          </Link>
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
          <h2 style={{ ...sectionTitleStyle, fontSize: isMobile ? '2rem' : '2.5rem' }}>{t('landing.featuresTitle')}</h2>
          <p style={sectionSubtitleStyle}>{t('landing.featuresSubtitle')}</p>
        </motion.div>
        
        {isMobile ? (
          <div className="grid-responsive">
            {features.map((f, i) => (
              <FeatureCard 
                key={`${f.title}-${i}`}
                icon={f.icon} 
                title={t(`landing.featuresList.${i}.title`, { defaultValue: f.title })} 
                description={t(`landing.featuresList.${i}.desc`, { defaultValue: f.description })} 
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
                  title={t(`landing.featuresList.${i % features.length}.title`, { defaultValue: f.title })} 
                  description={t(`landing.featuresList.${i % features.length}.desc`, { defaultValue: f.description })} 
                />
              ))}
            </motion.div>
          </div>
        )}
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="section-padding" style={{...pricingSectionStyle, backgroundColor: 'var(--bg-secondary)'}}>
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={sectionHeaderStyle}
        >
          <h2 style={{ ...sectionTitleStyle, fontSize: isMobile ? '2rem' : '3.5rem' }}>{t('landing.pricingTitle')}</h2>
          <p style={sectionSubtitleStyle}>{t('landing.pricingSubtitle')}</p>
        </motion.div>
        
        <div className="grid-responsive" style={{ alignItems: 'stretch' }}>
          <PricingCard 
            {...getPlanInfo('Starter', {
              title: t('pricing.plans.starter.title'),
              price: "£11.99",
              credits: t('pricing.plans.starter.credits'),
              subtitle: t('pricing.plans.starter.subtitle'),
              generatesUpTo: [
                { label: t('pricing.labels.coverLetters'), count: '25×' },
                { label: t('pricing.labels.cvs'), count: '25×' },
                { label: t('pricing.labels.proposals'), count: '25×' },
                { label: t('pricing.labels.grants'), count: '8×' },
                { label: t('pricing.labels.rewrites'), count: '100×' }
              ]
            })}
            includedFeatures={t('pricing.features', { returnObjects: true }) as string[]}
          />
          <PricingCard 
            {...getPlanInfo('Growth', {
              title: t('pricing.plans.growth.title'),
              price: "£25.00",
              credits: t('pricing.plans.growth.credits'),
              subtitle: t('pricing.plans.growth.subtitle'),
              badge: t('pricing.plans.growth.badge'),
              generatesUpTo: [
                { label: t('pricing.labels.coverLetters'), count: '60×' },
                { label: t('pricing.labels.cvs'), count: '60×' },
                { label: t('pricing.labels.proposals'), count: '60×' },
                { label: t('pricing.labels.grants'), count: '20×' },
                { label: t('pricing.labels.rewrites'), count: '240×' }
              ]
            })}
            includedFeatures={t('pricing.features', { returnObjects: true }) as string[]}
          />
          <PricingCard 
            {...getPlanInfo('Power User', {
              title: t('pricing.plans.power.title'),
              price: "£48.00",
              credits: t('pricing.plans.power.credits'),
              subtitle: t('pricing.plans.power.subtitle'),
              badge: t('pricing.plans.power.badge'),
              badgeColor: "#3b82f6",
              generatesUpTo: [
                { label: t('pricing.labels.coverLetters'), count: '120×' },
                { label: t('pricing.labels.cvs'), count: '120×' },
                { label: t('pricing.labels.proposals'), count: '120×' },
                { label: t('pricing.labels.grants'), count: '40×' },
                { label: t('pricing.labels.rewrites'), count: '480×' }
              ]
            })}
            includedFeatures={t('pricing.features', { returnObjects: true }) as string[]}
          />
        </div>


      </section>

      {/* How It Works */}
      <section id="how-it-works" className="section-padding" style={howItWorksSectionStyle}>
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          style={sectionHeaderStyle}
        >
          <h2 style={{ ...sectionTitleStyle, fontSize: isMobile ? '2rem' : '3.5rem' }}>{t('landing.howItWorksTitle')}</h2>
          <p style={sectionSubtitleStyle}>{t('landing.howItWorksSubtitle')}</p>
        </motion.div>
        
        <div className="grid-responsive">
          <StepItem number="01" title={t('landing.steps.0.title')} description={t('landing.steps.0.desc')} />
          <StepItem number="02" title={t('landing.steps.1.title')} description={t('landing.steps.1.desc')} />
          <StepItem number="03" title={t('landing.steps.2.title')} description={t('landing.steps.2.desc')} />
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6 }}
          style={{ textAlign: 'center', marginTop: '64px' }}
        >
          <Button variant="outline" style={{ gap: '10px', padding: '16px 40px' }} onClick={() => setShowVideo(true)}>
            {t('landing.learnMore')} <ArrowRight size={18} />
          </Button>
        </motion.div>
      </section>

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
              {t('landing.problem.title1')}<span style={{ color: 'var(--accent-primary)' }}>{t('landing.problem.title2')}</span>.
            </h2>
            <p style={{ fontSize: '1.125rem', color: 'var(--text-secondary)', marginBottom: '32px', lineHeight: 1.6 }}>
              {t('landing.problem.subtitle')}
            </p>
            <div style={benefitListStyle}>
              <BenefitItem text={t('landing.problem.b1')} />
              <BenefitItem text={t('landing.problem.b2')} />
              <BenefitItem text={t('landing.problem.b3')} />
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
                <Shield size={18} /> {t('landing.problem.oldWay')}
              </h4>
              <ul style={{ listStyle: 'none', padding: 0, color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <li>{t('landing.problem.o1')}</li>
                <li>{t('landing.problem.o2')}</li>
                <li>{t('landing.problem.o3')}</li>
                <li>{t('landing.problem.o4')}</li>
              </ul>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="section-padding" style={comparisonSectionStyle}>
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={sectionHeaderStyle}
        >
          <h2 style={{ ...sectionTitleStyle, fontSize: isMobile ? '1.75rem' : '3.5rem' }}>{t('landing.compare.title1')} <br/> <span style={{ color: 'var(--accent-primary)' }}>{t('landing.compare.title2')}</span></h2>
          <p style={sectionSubtitleStyle}>{t('landing.compare.subtitle')}</p>
        </motion.div>

        <div className="comparison-grid" style={{ 
          maxWidth: '1200px', 
          margin: '0 auto',
          gridTemplateColumns: isSmallDevice ? '1fr' : '1fr 1fr' 
        }}>
          <ComparisonColumn 
            title={t('landing.compare.generic')} 
            items={[
              t('landing.compare.g1'),
              t('landing.compare.g2'),
              t('landing.compare.g3'),
              t('landing.compare.g4')
            ]} 
          />
          <ComparisonColumn 
            title={t('landing.compare.pathew')} 
            highlight 
            items={[
              t('landing.compare.p1'),
              t('landing.compare.p2'),
              t('landing.compare.p3'),
              t('landing.compare.p4')
            ]} 
          />
        </div>
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
             <span style={{ fontWeight: 800, fontSize: '1.25rem', color: '#00b67a' }}>Verified Customers Review</span>
          </div>
          <h2 style={{ ...sectionTitleStyle, fontSize: isMobile ? '2rem' : '3.5rem' }}>{t('landing.trustpilot')}</h2>
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
          <h2 style={{ ...sectionTitleStyle, fontSize: isMobile ? '2rem' : '3.5rem' }}>{t('landing.faqTitle')}</h2>
          <p style={sectionSubtitleStyle}>{t('landing.faqSubtitle')}</p>
        </motion.div>
        
        <div style={faqContainerStyle}>
          {((t('landing.faqList', { returnObjects: true }) as any[]) || [])
            .slice(0, showAllFaqs ? undefined : 4)
            .map((faq, index) => (
            <FAQItem 
              key={index}
              question={faq.question} 
              answer={faq.answer} 
            />
          ))}
        </div>
        {!showAllFaqs && ((t('landing.faqList', { returnObjects: true }) as any[]) || []).length > 4 && (
          <div style={{ textAlign: 'center', marginTop: '32px' }}>
            <Button variant="outline" onClick={() => setShowAllFaqs(true)}>
              Show All <ChevronDown size={16} style={{ marginLeft: '8px' }} />
            </Button>
          </div>
        )}
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
              Your AI-powered career and opportunity platform.
            </p>
          </div>
          
          <div className="grid-responsive" style={{ flex: 3, gap: '40px' }}>
            <FooterCol title={t('landing.footerCols.product')} links={t('landing.footerCols.productLinks', { returnObjects: true }) as string[]} hrefs={['/features', '/how-it-works', '/pricing', '/api']} />
            <FooterCol title={t('landing.footerCols.company')} links={t('landing.footerCols.companyLinks', { returnObjects: true }) as string[]} hrefs={['/about', '/careers', '/blog', '/contact']} />
            <FooterCol title={t('landing.footerCols.legal')} links={t('landing.footerCols.legalLinks', { returnObjects: true }) as string[]} hrefs={['/privacy-policy', '/terms', '/security', '/cookies']} />
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
          <p>© {new Date().getFullYear()} PATHEW. {t('landing.footer.rights')}</p>
          <div style={{ ...socialLinksStyle, justifyContent: 'center' }}>
            <SocialIcon icon={FacebookIcon} label={t('common.facebook', 'Facebook')} />
            <SocialIcon icon={InstagramIcon} label={t('common.instagram', 'Instagram')} />
            <SocialIcon icon={TikTokIcon} label={t('common.tiktok', 'TikTok')} />
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
      
      <AnimatePresence>
        {showVideo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.8)',
              backdropFilter: 'blur(10px)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px'
            }}
            onClick={() => setShowVideo(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              style={{
                position: 'relative',
                height: '90vh',
                maxWidth: '90vw',
                aspectRatio: '9/16',
                backgroundColor: '#000',
                borderRadius: '16px',
                overflow: 'hidden',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                onClick={() => setShowVideo(false)}
                style={{
                  position: 'absolute',
                  top: '16px', right: '16px',
                  zIndex: 10,
                  background: 'rgba(0,0,0,0.5)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '40px', height: '40px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white',
                  cursor: 'pointer'
                }}
              >
                <X size={24} />
              </button>
              <video 
                src={howItWorksVideo} 
                controls 
                autoPlay 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
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
      const { data } = await supabase.from('reviews').select('*').eq('published', true).order('review_date', { ascending: false });
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
      {new Date(review.review_date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
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
  const { t } = useTranslation();
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
        {t('landing.generatesUpTo')}
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
        {t('landing.includedInEveryPlan')}
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
      <Button onClick={handleSubscribe} variant={badge === t('pricing.plans.growth.badge') ? 'primary' : 'outline'} style={{ width: '100%' }}>
        {t('landing.pricingChoose')} {title}
      </Button>
    </div>
  </motion.div>

  <CheckoutModal 
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

const FooterCol = ({ title, links, hrefs }: { title: string, links: string[], hrefs?: string[] }) => (
  <div style={footerColStyle}>
    <h4 style={{ color: 'var(--text-primary)', marginBottom: '20px', fontSize: '1rem', fontWeight: 700 }}>{title}</h4>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {links.map((l, i) => {
        const href = hrefs && hrefs[i] ? hrefs[i] : '#';
        if (href.startsWith('http')) {
          return <a key={l} href={href} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.875rem' }}>{l}</a>;
        }
        return <Link key={l} to={href} style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.875rem' }}>{l}</Link>;
      })}
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

const ComparisonColumn = ({ title, items, highlight }: any) => {
  const { t } = useTranslation();
  return (
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
          <Sparkles size={12} /> {t('landing.compare.recommended')}
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
};



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
  flex: 1.8,
  position: 'relative',
  transform: 'scale(1.05)',
  transformOrigin: 'center right',
};

const heroImagePlaceholderStyle: React.CSSProperties = {
  width: '100%',
  backgroundColor: 'var(--bg-secondary)',
  borderRadius: '16px',
  border: '1px solid var(--border-color)',
  position: 'relative',
  boxShadow: '0 40px 80px -20px rgba(0, 0, 0, 0.6)',
};

const heroImageOverlayStyle: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  background: 'linear-gradient(to top, var(--bg-primary), transparent)',
  borderRadius: 'inherit',
  pointerEvents: 'none',
};

const floatingCardStyle: React.CSSProperties = {
  position: 'absolute',
  top: '40px',
  left: '-40px',
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


const oppCardContentStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  padding: '24px 20px',
  gap: '16px',
};

const oppInfoStyle: React.CSSProperties = {
  flex: 1,
};

const oppTitleStyle: React.CSSProperties = {
  fontSize: '1.25rem',
  fontWeight: 700,
  color: 'var(--text-primary)',
  marginBottom: '8px',
  lineHeight: 1.3,
};

const oppCompanyStyle: React.CSSProperties = {
  color: 'var(--text-secondary)',
  fontSize: '0.875rem',
  fontWeight: 500,
};

const oppMatchStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '8px',
  flexShrink: 0,
};

const matchCircleStyle: React.CSSProperties = {
  width: '56px',
  height: '56px',
  borderRadius: '50%',
  border: '3px solid var(--accent-primary)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: 'rgba(245, 158, 11, 0.05)',
};

const matchValueStyle: React.CSSProperties = {
  fontSize: '1rem',
  fontWeight: 800,
  color: 'var(--accent-primary)',
};

const matchLabelStyle: React.CSSProperties = {
  fontSize: '0.7rem',
  color: 'var(--text-secondary)',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
};

const opportunitiesGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
  gap: '24px',
  maxWidth: '1200px',
  margin: '0 auto',
};
