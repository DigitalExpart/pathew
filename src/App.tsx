import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Shell } from './components/layout/Shell';
import { AIProvider } from './context/AIContext';
import { AIAssistantPanel } from './components/ai/AIAssistantPanel';
import { LandingPage } from './pages/Landing/LandingPage';
import { LoginPage, SignUpPage } from './pages/Auth/AuthPages';
import { Dashboard } from './pages/Dashboard/Dashboard';
import { OpportunityList } from './pages/Opportunities/OpportunityList';
import { OpportunityDetail } from './pages/Opportunities/OpportunityDetail';
import { ProfileSetup } from './pages/Profile/ProfileSetup';
import { CVBuilderPage, CoverLetterPage, ProposalPage } from './pages/Builders/Pages';
import { WalletPage } from './pages/Credits/WalletPage';
import { PricingPage } from './pages/Credits/PricingPage';
import { SavedOpportunities } from './pages/Opportunities/SavedOpportunities';
import { GrantBuilderPage } from './pages/Builders/GrantBuilderPage';
import { SettingsPage } from './pages/Settings/SettingsPage';
import { PrivacyPage } from './pages/Settings/PrivacyPage';
import { AccountDeletionPage } from './pages/Settings/AccountDeletionPage';
import { ConsentPage } from './pages/Settings/ConsentPage';

function App() {
  return (
    <AIProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/profile-setup" element={<ProfileSetup />} />
          
          {/* Protected Routes (Authenticated) */}
          <Route path="/dashboard" element={<Shell><Dashboard /></Shell>} />
          <Route path="/opportunities" element={<Shell><OpportunityList /></Shell>} />
          <Route path="/fellowships" element={<Shell><OpportunityList /></Shell>} />
          <Route path="/grants" element={<Shell><OpportunityList /></Shell>} />
          <Route path="/opportunities/:id" element={<Shell><OpportunityDetail /></Shell>} />
          <Route path="/profile" element={<Shell><ProfileSetup /></Shell>} />
          <Route path="/cv-builder" element={<Shell><CVBuilderPage /></Shell>} />
          <Route path="/cover-letter" element={<Shell><CoverLetterPage /></Shell>} />
          <Route path="/proposal" element={<Shell><ProposalPage /></Shell>} />
          
          {/* New Routes */}
          <Route path="/wallet" element={<Shell><WalletPage /></Shell>} />
          <Route path="/pricing" element={<Shell><PricingPage /></Shell>} />
          <Route path="/saved" element={<Shell><SavedOpportunities /></Shell>} />
          <Route path="/grant-builder" element={<Shell><GrantBuilderPage /></Shell>} />
          <Route path="/settings" element={<Shell><SettingsPage /></Shell>} />
          <Route path="/privacy" element={<Shell><PrivacyPage /></Shell>} />
          <Route path="/delete-account" element={<Shell><AccountDeletionPage /></Shell>} />
          <Route path="/preferences" element={<Shell><ConsentPage /></Shell>} />
          
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <AIAssistantPanel />
      </Router>
    </AIProvider>
  );
}

export default App;
