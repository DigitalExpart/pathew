const fs = require('fs');

const filePath = 'src/pages/Landing/LandingPage.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add Badge import
if (!content.includes("import { Badge }")) {
  content = content.replace(
    "import { Card } from '../../components/ui/Card';",
    "import { Card } from '../../components/ui/Card';\nimport { Badge } from '../../components/ui/Badge';"
  );
}

// 2. Add mock data below features array
const mockData = `
const mockOpportunities = [
  { id: 1, title: 'Senior Software Engineer', company: 'TechNova', location: 'Remote, UK', type: 'Full-time', source: 'LinkedIn', match: 94 },
  { id: 2, title: 'Product Manager', company: 'InnovateSpace', location: 'London, UK', type: 'Hybrid', source: 'Indeed', match: 88 },
  { id: 3, title: 'Marketing Director', company: 'GlobalReach', location: 'Manchester, UK', type: 'Remote', source: 'Direct', match: 91 },
  { id: 4, title: 'Data Scientist', company: 'QuantCorp', location: 'Remote, EU', type: 'Contract', source: 'Glassdoor', match: 85 },
];
`;

if (!content.includes("const mockOpportunities")) {
  content = content.replace(
    "const features = [",
    mockData + "\nconst features = ["
  );
}

// 3. Add the Opportunities Section right after the Hero Section
const oppSection = `

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
          {mockOpportunities.map((opp, index) => (
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
                    <p style={oppCompanyStyle}>{opp.company} • {opp.location}</p>
                    <div style={{ marginTop: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <Badge variant="primary">{opp.type}</Badge>
                      <Badge variant="info">{opp.source}</Badge>
                    </div>
                  </div>
                  <div style={oppMatchStyle}>
                    <div style={matchCircleStyle}>
                      <span style={matchValueStyle}>{opp.match}%</span>
                    </div>
                    <span style={matchLabelStyle}>Match</span>
                  </div>
                </div>
                <div style={{ padding: '0 20px 20px', display: 'flex', gap: '12px', marginTop: 'auto' }}>
                  <Link to="/signup" style={{ flex: 1 }}>
                    <Button style={{ width: '100%' }}>Apply</Button>
                  </Link>
                  <Link to="/signup" style={{ flex: 1 }}>
                    <Button variant="outline" style={{ width: '100%' }}>Prepare</Button>
                  </Link>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
        
        <div style={{ textAlign: 'center', marginTop: '48px' }}>
          <Link to="/signup">
            <Button variant="outline" style={{ gap: '10px' }}>
              View More Opportunities <ArrowRight size={18} />
            </Button>
          </Link>
        </div>
      </section>
`;

// Insert after Hero Section. Hero ends with `</header>`
if (!content.includes('id="opportunities"')) {
  content = content.replace(
    "      </header>\n",
    "      </header>\n" + oppSection
  );
}

// 4. Add Styles at the bottom
const styles = `
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
`;

if (!content.includes("const opportunitiesGridStyle")) {
  content += "\n" + styles;
}

fs.writeFileSync(filePath, content);
console.log('Opportunities added!');
