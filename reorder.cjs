const fs = require('fs');

const content = fs.readFileSync('src/pages/Landing/LandingPage.tsx', 'utf8');

// The file has sections separated by comments like {/* Section Name */}
const sections = {
  hero: content.substring(0, content.indexOf('{/* Problem/Solution Narrative */}')),
  problem: content.substring(content.indexOf('{/* Problem/Solution Narrative */}'), content.indexOf('{/* Features Section */}')),
  features: content.substring(content.indexOf('{/* Features Section */}'), content.indexOf('{/* How It Works */}')),
  howItWorks: content.substring(content.indexOf('{/* How It Works */}'), content.indexOf('{/* Comparison Section */}')),
  comparison: content.substring(content.indexOf('{/* Comparison Section */}'), content.indexOf('{/* Pricing Section */}')),
  pricing: content.substring(content.indexOf('{/* Pricing Section */}'), content.indexOf('{/* Social Proof Section (Trustpilot Reviews) */}')),
  trustpilot: content.substring(content.indexOf('{/* Social Proof Section (Trustpilot Reviews) */}'), content.indexOf('{/* FAQ Section */}')),
  faqAndFooter: content.substring(content.indexOf('{/* FAQ Section */}'))
};

// User requested order: Get Started -> Features -> Pricing -> How It Works -> FAQs
// I'll interleave the others or put them at the end.
// Let's do:
// Hero
// Features
// Pricing
// How It Works
// Problem
// Comparison
// Trustpilot
// FAQ and Footer

const newContent = 
  sections.hero +
  sections.features +
  sections.pricing +
  sections.howItWorks +
  sections.problem +
  sections.comparison +
  sections.trustpilot +
  sections.faqAndFooter;

fs.writeFileSync('src/pages/Landing/LandingPage.tsx', newContent);
console.log('Reordered successfully.');
