import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Shell } from './components/layout/Shell';
import { AdminShell } from './components/layout/AdminShell';
import { AssistantProvider } from './context/AssistantContext';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { AdminProvider, RequireAdmin } from './context/AdminContext';
import { AssistantPanel } from './components/ai/AssistantPanel';
import { LandingPage } from './pages/Landing/LandingPage';
import { LoginPage, SignUpPage } from './pages/Auth/AuthPages';
import { Dashboard } from './pages/Dashboard/Dashboard';
import { OpportunityList } from './pages/Opportunities/OpportunityList';
import { OpportunityDetail } from './pages/Opportunities/OpportunityDetail';
import { ProfileSetup } from './pages/Profile/ProfileSetup';
import { ProfilePage } from './pages/Profile/ProfilePage';
import { EditProfile } from './pages/Profile/EditProfile';
import { CVBuilderPage, CoverLetterPage, ProposalPage } from './pages/Builders/Pages';
import { WalletPage } from './pages/Credits/WalletPage';
import { PricingPage } from './pages/Credits/PricingPage';
import { SavedOpportunities } from './pages/Opportunities/SavedOpportunities';
import { JobsPage } from './pages/Opportunities/JobsPage';
import { GrantBuilderPage } from './pages/Builders/GrantBuilderPage';
import { SettingsPage } from './pages/Settings/SettingsPage';
import { TermsPage as PublicTermsPage } from './pages/Legal/TermsPage';
import { PrivacyPage as PublicPrivacyPage } from './pages/Legal/PrivacyPage';
import { ContactPage } from './pages/Support/ContactPage';
import { HowItWorksPage } from './pages/Support/HowItWorksPage';
import { NotificationsPage } from './pages/Notifications/NotificationsPage';
import { PreparationPage } from './pages/Pathway/PreparationPage';

// Admin Pages
import { AdminLogin } from './pages/Admin/AdminLogin';
import { AdminDashboard } from './pages/Admin/AdminDashboard';
import { AdminUsersPage } from './pages/Admin/AdminUsersPage';
import { AdminSubscriptionsPage } from './pages/Admin/AdminSubscriptionsPage';
import { AdminTransactionsPage } from './pages/Admin/AdminTransactionsPage';
import { AdminDocumentsPage } from './pages/Admin/AdminDocumentsPage';
import { AdminAIUsagePage } from './pages/Admin/AdminAIUsagePage';
import { AdminSettingsPage } from './pages/Admin/AdminSettingsPage';
import { AdminOpportunitiesPage } from './pages/Admin/AdminOpportunitiesPage';
import { AdminOpportunityForm } from './pages/Admin/AdminOpportunityForm';
import { AdminReviewsPage } from './pages/Admin/AdminReviewsPage';

// Sub Admin Pages
import { SubAdminDashboard } from './pages/SubAdmin/SubAdminDashboard';
import { SubAdminOpportunityForm } from './pages/SubAdmin/SubAdminOpportunityForm';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AdminProvider>
        <AssistantProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignUpPage />} />
            <Route path="/terms" element={<PublicTermsPage />} />
            <Route path="/privacy-policy" element={<PublicPrivacyPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/how-it-works" element={<HowItWorksPage />} />
            <Route path="/profile-setup" element={<Shell><ProfileSetup /></Shell>} />
            
            {/* Protected Routes (Authenticated) */}
            <Route path="/dashboard" element={<Shell><Dashboard /></Shell>} />
            <Route path="/opportunities" element={<Shell><OpportunityList /></Shell>} />
            <Route path="/fellowships" element={<Shell><OpportunityList /></Shell>} />
            <Route path="/grants" element={<Shell><OpportunityList /></Shell>} />
            <Route path="/jobs" element={<Shell><JobsPage /></Shell>} />
            <Route path="/opportunities/:id" element={<Shell><OpportunityDetail /></Shell>} />
            <Route path="/career-profile" element={<Shell><ProfilePage /></Shell>} />
            <Route path="/profile" element={<Shell><EditProfile /></Shell>} />
            <Route path="/cv-builder" element={<Shell><CVBuilderPage /></Shell>} />
            <Route path="/cover-letter" element={<Shell><CoverLetterPage /></Shell>} />
            <Route path="/proposal" element={<Shell><ProposalPage /></Shell>} />
            
            {/* New Routes */}
            <Route path="/wallet" element={<Shell><WalletPage /></Shell>} />
            <Route path="/pricing" element={<Shell><PricingPage /></Shell>} />
            <Route path="/saved" element={<Shell><SavedOpportunities /></Shell>} />
            <Route path="/grant-builder" element={<Shell><GrantBuilderPage /></Shell>} />
            <Route path="/settings" element={<Shell><SettingsPage /></Shell>} />
            <Route path="/notifications" element={<Shell><NotificationsPage /></Shell>} />
            <Route path="/preparation" element={<Shell><PreparationPage /></Shell>} />

            {/* Sub Admin Routes */}
            <Route path="/sub-admin" element={<Shell><SubAdminDashboard /></Shell>} />
            <Route path="/sub-admin/opportunities/new" element={<Shell><SubAdminOpportunityForm /></Shell>} />
            <Route path="/sub-admin/opportunities/:id/edit" element={<Shell><SubAdminOpportunityForm /></Shell>} />

            {/* Admin Routes */}
            <Route path="/admin" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={<RequireAdmin><AdminShell><AdminDashboard /></AdminShell></RequireAdmin>} />
            <Route path="/admin/users" element={<RequireAdmin><AdminShell><AdminUsersPage /></AdminShell></RequireAdmin>} />
            <Route path="/admin/subscriptions" element={<RequireAdmin><AdminShell><AdminSubscriptionsPage /></AdminShell></RequireAdmin>} />
            <Route path="/admin/transactions" element={<RequireAdmin><AdminShell><AdminTransactionsPage /></AdminShell></RequireAdmin>} />
            <Route path="/admin/opportunities" element={<RequireAdmin><AdminShell><AdminOpportunitiesPage /></AdminShell></RequireAdmin>} />
            <Route path="/admin/opportunities/new" element={<RequireAdmin><AdminShell><AdminOpportunityForm /></AdminShell></RequireAdmin>} />
            <Route path="/admin/opportunities/:id/edit" element={<RequireAdmin><AdminShell><AdminOpportunityForm /></AdminShell></RequireAdmin>} />
            <Route path="/admin/documents" element={<RequireAdmin><AdminShell><AdminDocumentsPage /></AdminShell></RequireAdmin>} />
            <Route path="/admin/reviews" element={<RequireAdmin><AdminShell><AdminReviewsPage /></AdminShell></RequireAdmin>} />
            <Route path="/admin/ai-usage" element={<RequireAdmin><AdminShell><AdminAIUsagePage /></AdminShell></RequireAdmin>} />
            <Route path="/admin/settings" element={<RequireAdmin><AdminShell><AdminSettingsPage /></AdminShell></RequireAdmin>} />
            
            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
            <AssistantPanel />
        </Router>
        </AssistantProvider>
        </AdminProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
