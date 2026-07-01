import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge as UIBadge } from '../../components/ui/Badge';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { ArrowRight, CheckCircle, Globe, Shield, Zap, Plus, Star, ChevronDown, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useTranslation } from 'react-i18next';
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
  const [dbOpportunities, setDbOpportunities] = React.useState<any[]>([]);

  React.useEffect(() => {
    const fetchDynamicSettings = async () => {
      
      const { data: oppData } = await supabase
        .from('opportunities')
        .select('*')
        .eq('status', 'published')
        .neq('type', 'job')
        .order('featured', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(2);
        
      if (oppData && oppData.length > 0) {
        // Ensure no duplicates by ID
        const uniqueOpps = Array.from(new Map(oppData.map((item: any) => [item.id, item])).values());
        setDbOpportunities(uniqueOpps.slice(0, 5));
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
            fontSize: isMobile ? '2rem' : '3rem',
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
        

      </header>

      {/* Showcase Gallery 1 (Before Opportunities) */}
      <section className="section-padding" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '24px',
            maxWidth: '1200px',
            margin: '0 auto',
          }}
        >
          {[1, 2, 6].map((num) => (
            <div key={num} style={{ 
              borderRadius: '24px', 
              overflow: 'hidden', 
              border: '1px solid var(--border-color)',
              boxShadow: '0 20px 40px -10px rgba(0,0,0,0.3)',
              backgroundColor: 'var(--bg-secondary)',
              aspectRatio: '16/9'
            }}>
              <img 
                src={`/showcase-${num}.png`} 
                alt={`Platform Showcase ${num}`} 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
          ))}
        </motion.div>
      </section>

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
        
        <div style={{ textAlign: 'center', margin: '48px 0' }}>
          <Link to={user ? "/opportunities" : "/login"}>
            <Button variant="outline" style={{ gap: '10px' }}>
              View More Opportunities <ArrowRight size={18} />
            </Button>
          </Link>
        </div>

        {/* Showcase Gallery 2 (After Opportunities) */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '24px',
            maxWidth: '1200px',
            margin: '0 auto',
          }}
        >
          {[3, 4, 5].map((num) => (
            <div key={`after-${num}`} style={{ 
              borderRadius: '24px', 
              overflow: 'hidden', 
              border: '1px solid var(--border-color)',
              boxShadow: '0 20px 40px -10px rgba(0,0,0,0.3)',
              backgroundColor: 'var(--bg-secondary)',
              aspectRatio: '16/9'
            }}>
              <img 
                src={`/showcase-${num}.png`} 
                alt={`Platform Showcase ${num}`} 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
          ))}
        </motion.div>
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

        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={{
            maxWidth: '1200px',
            margin: '40px auto 0',
            borderRadius: '24px', 
            overflow: 'hidden', 
            border: '1px solid var(--border-color)',
            boxShadow: '0 20px 40px -10px rgba(0,0,0,0.3)',
            backgroundColor: 'var(--bg-secondary)',
          }}
        >
          <img 
            src="/showcase-6.png" 
            alt="Dashboard Showcase" 
            style={{ width: '100%', height: 'auto', display: 'block' }}
          />
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
             <span style={{ fontWeight: 800, fontSize: '1.25rem', color: '#00b67a' }}>Verified Customers Review</span>
          </div>
          <h2 style={{ ...sectionTitleStyle, fontSize: isMobile ? '2rem' : '3.5rem', fontWeight: 600 }}>{t('landing.trustpilot')}</h2>
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

      <Footer />
      
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

  // Use exactly 5 unique reviews
  const fiveReviews = reviews.slice(0, 5);
  // Duplicate for smooth infinite scrolling loop
  const scrollingRow = [...fiveReviews, ...fiveReviews, ...fiveReviews];

  return (
    <div style={{ position: 'relative', width: '100%', overflow: 'hidden', padding: '24px 0' }}>
      <div style={{ position: 'relative', width: '100%', overflow: 'hidden' }}>
        <motion.div 
          animate={{ x: [0, -3000] }}
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
          style={{ display: 'flex', gap: '24px', width: 'max-content' }}
        >
          {scrollingRow.map((r, i) => <ReviewCard key={`r-${i}`} review={r} />)}
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







// Styles
const landingStyle: React.CSSProperties = {
  backgroundColor: 'var(--bg-primary)',
  minHeight: '100vh',
  color: 'var(--text-primary)',
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

const comparisonSectionStyle: React.CSSProperties = {
  backgroundColor: 'var(--bg-secondary)',
};





const socialProofSectionStyle: React.CSSProperties = {
  backgroundColor: 'var(--bg-primary)',
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
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 450px), 1fr))',
  gap: '24px',
  maxWidth: '1200px',
  margin: '0 auto',
};
