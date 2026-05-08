import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Shell } from './components/layout/Shell';
import { LandingPage } from './pages/Landing/LandingPage';
import { LoginPage, SignUpPage } from './pages/Auth/AuthPages';
import { Dashboard } from './pages/Dashboard/Dashboard';
import { OpportunityList } from './pages/Opportunities/OpportunityList';
import { OpportunityDetail } from './pages/Opportunities/OpportunityDetail';
import { ProfileSetup } from './pages/Profile/ProfileSetup';
import { CVBuilderPage, CoverLetterPage, ProposalPage } from './pages/Builders/Pages';

function App() {
  return (
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
        <Route path="/opportunities/:id" element={<Shell><OpportunityDetail /></Shell>} />
        <Route path="/profile" element={<Shell><ProfileSetup /></Shell>} />
        <Route path="/cv-builder" element={<Shell><CVBuilderPage /></Shell>} />
        <Route path="/cover-letter" element={<Shell><CoverLetterPage /></Shell>} />
        <Route path="/proposal" element={<Shell><ProposalPage /></Shell>} />
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
