import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Shell } from './components/layout/Shell';
import { AdminShell } from './components/layout/AdminShell';
import { AssistantProvider } from './context/AssistantContext';
import { AuthProvider, RequireAuth } from './context/AuthContext';
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
import { AdminRssSourcesPage } from './pages/Admin/AdminRssSourcesPage';

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
            <Route path="/profile-setup" element={<RequireAuth><Shell><ProfileSetup /></Shell></RequireAuth>} />
            
            {/* Protected Routes (Authenticated) */}
            <Route path="/dashboard" element={<RequireAuth><Shell><Dashboard /></Shell></RequireAuth>} />
            <Route path="/opportunities" element={<RequireAuth><Shell><OpportunityList /></Shell></RequireAuth>} />
            <Route path="/fellowships" element={<RequireAuth><Shell><OpportunityList /></Shell></RequireAuth>} />
            <Route path="/grants" element={<RequireAuth><Shell><OpportunityList /></Shell></RequireAuth>} />
            <Route path="/jobs" element={<RequireAuth><Shell><JobsPage /></Shell></RequireAuth>} />
            <Route path="/opportunities/:id" element={<RequireAuth><Shell><OpportunityDetail /></Shell></RequireAuth>} />
            <Route path="/career-profile" element={<RequireAuth><Shell><ProfilePage /></Shell></RequireAuth>} />
            <Route path="/profile" element={<RequireAuth><Shell><EditProfile /></Shell></RequireAuth>} />
            <Route path="/cv-builder" element={<RequireAuth><Shell><CVBuilderPage /></Shell></RequireAuth>} />
            <Route path="/cover-letter" element={<RequireAuth><Shell><CoverLetterPage /></Shell></RequireAuth>} />
            <Route path="/proposal" element={<RequireAuth><Shell><ProposalPage /></Shell></RequireAuth>} />
            
            {/* New Routes */}
            <Route path="/wallet" element={<RequireAuth><Shell><WalletPage /></Shell></RequireAuth>} />
            <Route path="/pricing" element={<RequireAuth><Shell><PricingPage /></Shell></RequireAuth>} />
            <Route path="/saved" element={<RequireAuth><Shell><SavedOpportunities /></Shell></RequireAuth>} />
            <Route path="/grant-builder" element={<RequireAuth><Shell><GrantBuilderPage /></Shell></RequireAuth>} />
            <Route path="/settings" element={<RequireAuth><Shell><SettingsPage /></Shell></RequireAuth>} />
            <Route path="/notifications" element={<RequireAuth><Shell><NotificationsPage /></Shell></RequireAuth>} />
            <Route path="/preparation" element={<RequireAuth><Shell><PreparationPage /></Shell></RequireAuth>} />

            {/* Sub Admin Routes */}
            <Route path="/sub-admin" element={<RequireAuth><Shell><SubAdminDashboard /></Shell></RequireAuth>} />
            <Route path="/sub-admin/opportunities/new" element={<RequireAuth><Shell><SubAdminOpportunityForm /></Shell></RequireAuth>} />
            <Route path="/sub-admin/opportunities/:id/edit" element={<RequireAuth><Shell><SubAdminOpportunityForm /></Shell></RequireAuth>} />

            {/* Admin Routes */}
            <Route path="/admin" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={<RequireAdmin><AdminShell><AdminDashboard /></AdminShell></RequireAdmin>} />
            <Route path="/admin/users" element={<RequireAdmin><AdminShell><AdminUsersPage /></AdminShell></RequireAdmin>} />
            <Route path="/admin/subscriptions" element={<RequireAdmin><AdminShell><AdminSubscriptionsPage /></AdminShell></RequireAdmin>} />
            <Route path="/admin/transactions" element={<RequireAdmin><AdminShell><AdminTransactionsPage /></AdminShell></RequireAdmin>} />
            <Route path="/admin/opportunities" element={<RequireAdmin><AdminShell><AdminOpportunitiesPage /></AdminShell></RequireAdmin>} />
            <Route path="/admin/opportunities/new" element={<RequireAdmin><AdminShell><AdminOpportunityForm /></AdminShell></RequireAdmin>} />
            <Route path="/admin/opportunities/:id/edit" element={<RequireAdmin><AdminShell><AdminOpportunityForm /></AdminShell></RequireAdmin>} />
            <Route path="/admin/rss-sources" element={<RequireAdmin><AdminShell><AdminRssSourcesPage /></AdminShell></RequireAdmin>} />
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
