import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import {
  Building2,
  Users,
  Send,
  Clock,
  FileText,
  Briefcase,
  Coins,
  ShieldCheck,
  Search,
  UserPlus,
  Copy,
  Check,
  Edit3,
  Trash2,
  Sparkles,
  UserCheck,
  X,
  CheckCircle2,
  FileEdit,
  Mail,
  Globe,
  ListFilter,
  ExternalLink,
  User,
  Phone,
  MapPin,
  GraduationCap,
  Award,
  FolderGit2,
  Calendar,
  Eye
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { formatCredits } from '../../utils/formatters';
import {
  getOrganizationByUserId,
  getOrganizationMembers,
  inviteMemberToOrganization,
  respondToJoinRequest,
  searchPlatformUsers,
  addDirectMemberToOrganization,
  removeOrganizationMember,
  updateMemberRoleInOrg,
  getMemberActivityAndDocuments,
  updateMemberProfileByOrgAdmin,
  type Organization,
  type OrganizationMember,
  type MemberRole
} from '../../services/organizationService';
import { CheckoutModal } from '../../components/payment/CheckoutModal';
import { supabase } from '../../lib/supabase';

interface OrgDashboardProps {
  defaultTab?: 'overview' | 'members' | 'documents' | 'opportunities' | 'my_opps' | 'applicants' | 'credits';
}

export const OrgDashboardPage: React.FC<OrgDashboardProps> = ({ defaultTab = 'overview' }) => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [org, setOrg] = useState<Organization | null>(null);
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'documents' | 'opportunities' | 'my_opps' | 'applicants' | 'credits'>(defaultTab as any);

  // Applicants State
  const [applicants, setApplicants] = useState<any[]>([]);
  const [loadingApplicants, setLoadingApplicants] = useState(false);
  const [inspectingApplicant, setInspectingApplicant] = useState<any | null>(null);

  // Posted Opportunities State
  const [postedOpps, setPostedOpps] = useState<any[]>([]);
  const [loadingPostedOpps, setLoadingPostedOpps] = useState(false);
  const [selectedOppFilter, setSelectedOppFilter] = useState<string>('all');

  // Add / Invite Member Modal State
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [addMode, setAddMode] = useState<'search' | 'invite'>('search');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ id: string; full_name: string; email: string }>>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Invite Non-Platform User State
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<MemberRole>('member');
  const [inviteSuccessMsg, setInviteSuccessMsg] = useState<string | null>(null);
  const [generatedInviteUrl, setGeneratedInviteUrl] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Member Management & Activity Inspection Modal
  const [selectedMember, setSelectedMember] = useState<OrganizationMember | null>(null);
  const [memberActivity, setMemberActivity] = useState<{ documents: any[]; applications: any[]; profile?: any } | null>(null);
  const [loadingActivity, setLoadingActivity] = useState(false);

  // Member Profile Editing State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editFullName, setEditFullName] = useState('');
  const [editHeadline, setEditHeadline] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editSkills, setEditSkills] = useState('');
  const [saveProfileSuccess, setSaveProfileSuccess] = useState(false);

  // Post Opportunity State
  const [oppTitle, setOppTitle] = useState('');
  const [oppType, setOppType] = useState('Job');
  const [oppDesc, setOppDesc] = useState('');
  const [oppLink, setOppLink] = useState('');
  const [oppDeadline, setOppDeadline] = useState('');
  const [oppAvailableSpots, setOppAvailableSpots] = useState('');
  const [oppSkillsNeeded, setOppSkillsNeeded] = useState('');
  const [oppLocation, setOppLocation] = useState('');
  const [oppWorkMode, setOppWorkMode] = useState('remote');
  const [oppLanguages, setOppLanguages] = useState('');
  const [oppExperienceLevel, setOppExperienceLevel] = useState('<5 years');
  const [oppPayType, setOppPayType] = useState('hourly');
  const [oppAmount, setOppAmount] = useState('');
  const [oppPostedMsg, setOppPostedMsg] = useState<string | null>(null);

  // Credit Purchase Modal
  const [showCheckout, setShowCheckout] = useState(false);

  useEffect(() => {
    if (defaultTab) {
      setActiveTab(defaultTab);
    }
  }, [defaultTab]);

  useEffect(() => {
    fetchOrgData();
  }, [user]);

  const fetchOrgData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await getOrganizationByUserId(user.id);
      setOrg(data);
      if (data) {
        const mems = await getOrganizationMembers(data.id);
        setMembers(mems);
      } else if (profile?.account_type !== 'business' && user?.user_metadata?.account_type !== 'business') {
        navigate('/dashboard', { replace: true });
        return;
      }
    } catch (err) {
      console.error('Error fetching organization dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchApplicants = async () => {
    if (!user) return;
    setLoadingApplicants(true);
    try {
      const { data: orgOpps } = await supabase
        .from('opportunities')
        .select('id')
        .eq('user_id', user.id);
        
      if (orgOpps && orgOpps.length > 0) {
        const oppIds = orgOpps.map(o => o.id);
        
        const { data: appsData, error: appsErr } = await supabase
          .from('opportunity_applications')
          .select(`
            *,
            opportunities (title)
          `)
          .in('opportunity_id', oppIds)
          .order('created_at', { ascending: false });
          
        if (!appsErr && appsData) {
          const applicantIds = appsData.map(a => a.applicant_id).filter(Boolean);
          if (applicantIds.length > 0) {
            const { data: profiles, error: profErr } = await supabase
              .from('profiles')
              .select('*')
              .in('id', applicantIds);
              
            if (!profErr && profiles) {
               appsData.forEach(app => {
                 app.profile = profiles.find(p => p.id === app.applicant_id) || null;
               });
            }
          }
          setApplicants(appsData);
        }
      }
    } catch (err) {
      console.error('Error fetching applicants:', err);
    } finally {
      setLoadingApplicants(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'applicants') {
      fetchApplicants();
    }
  }, [activeTab, user]);

  const fetchPostedOpps = async () => {
    if (!user || !org) return;
    setLoadingPostedOpps(true);
    try {
      const { data: opps, error } = await supabase
        .from('opportunities')
        .select('*')
        .or(`user_id.eq.${user.id},organization_name.eq.${org.name}`)
        .neq('status', 'Saved')
        .order('created_at', { ascending: false });

      if (!error && opps) {
        const oppIds = opps.map(o => o.id);
        if (oppIds.length > 0) {
          const { data: apps } = await supabase
            .from('opportunity_applications')
            .select('id, opportunity_id, applicant_id, status, created_at')
            .in('opportunity_id', oppIds);

          const appsMap: Record<string, any[]> = {};
          (apps || []).forEach(app => {
            if (!appsMap[app.opportunity_id]) appsMap[app.opportunity_id] = [];
            appsMap[app.opportunity_id].push(app);
          });

          opps.forEach(o => {
            o.applications = appsMap[o.id] || [];
            o.applicant_count = (appsMap[o.id] || []).length;
            o.hired_count = (appsMap[o.id] || []).filter(a => a.status === 'hired').length;
          });
        }
        setPostedOpps(opps);
      }
    } catch (err) {
      console.error('Error fetching posted opportunities:', err);
    } finally {
      setLoadingPostedOpps(false);
    }
  };

  const handleDeleteOpportunity = async (oppId: string) => {
    if (!confirm('Are you sure you want to delete this posted opportunity?')) return;
    try {
      const { error } = await supabase.from('opportunities').delete().eq('id', oppId);
      if (error) throw error;
      setPostedOpps(prev => prev.filter(o => o.id !== oppId));
    } catch (err: any) {
      alert('Failed to delete opportunity: ' + err.message);
    }
  };

  useEffect(() => {
    if (activeTab === 'my_opps' || activeTab === 'opportunities' || activeTab === 'applicants') {
      fetchPostedOpps();
    }
  }, [activeTab, user, org]);

  const handleUpdateApplicationStatus = async (applicationId: string, status: 'hired' | 'declined') => {
    try {
      await supabase.from('opportunity_applications').update({ status }).eq('id', applicationId);
      setApplicants(prev => prev.map(a => a.id === applicationId ? { ...a, status } : a));
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  // Search platform users by name or email
  const handleUserSearch = async (q: string) => {
    setUserSearchQuery(q);
    if (!q || q.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const res = await searchPlatformUsers(q);
      setSearchResults(res);
    } catch (err) {
      console.error('Error searching platform users:', err);
    } finally {
      setIsSearching(false);
    }
  };

  // Direct add platform user
  const handleAddDirectMember = async (foundUser: { id: string; email: string; full_name: string }, role: MemberRole) => {
    if (!org) return;
    setLoading(true);
    try {
      await addDirectMemberToOrganization(org.id, org.name, foundUser, role);
      const updated = await getOrganizationMembers(org.id);
      setMembers(updated);
      setInviteSuccessMsg(`Added ${foundUser.full_name || foundUser.email} directly to organization team!`);
      setSearchResults([]);
      setUserSearchQuery('');
    } catch (err) {
      console.error('Error adding direct member:', err);
    } finally {
      setLoading(false);
    }
  };

  // Send invitation to non-platform user via email
  const handleSendEmailInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!org || !inviteEmail.trim()) return;
    setInviteSuccessMsg(null);
    setGeneratedInviteUrl(null);

    const ok = await inviteMemberToOrganization(org.id, org.name, inviteEmail.trim(), inviteRole);
    if (ok) {
      const inviteUrl = `${window.location.origin}/signup?inviteOrg=${org.id}&email=${encodeURIComponent(inviteEmail.trim())}&orgName=${encodeURIComponent(org.name)}`;
      setGeneratedInviteUrl(inviteUrl);
      setInviteSuccessMsg(`Invitation created for ${inviteEmail.trim()}! Copy link below or notify member.`);
      setInviteEmail('');
      setInviteName('');
      const updated = await getOrganizationMembers(org.id);
      setMembers(updated);
    } else {
      setInviteSuccessMsg('Failed to send invite. Please check connection and try again.');
    }
  };

  const handleCopyInviteLink = () => {
    if (!generatedInviteUrl) return;
    navigator.clipboard.writeText(generatedInviteUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const handleJoinRequestResponse = async (memberRecordId: string, memberUserId: string, accept: boolean) => {
    if (!org) return;
    setLoading(true);
    try {
      await respondToJoinRequest(memberRecordId, org.id, org.name, memberUserId, accept);
      const updated = await getOrganizationMembers(org.id);
      setMembers(updated);
    } catch (err) {
      console.error('Error responding to join request:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInspectMember = async (mem: OrganizationMember) => {
    setSelectedMember(mem);
    setLoadingActivity(true);
    setIsEditingProfile(false);
    setSaveProfileSuccess(false);

    try {
      const act = await getMemberActivityAndDocuments(mem.user_id, mem.user_email);
      setMemberActivity(act);
      if (act.profile) {
        setEditFullName(act.profile.full_name || mem.user_name || '');
        setEditHeadline(act.profile.target_role || act.profile.headline || '');
        setEditBio(act.profile.bio || '');
        setEditPhone(act.profile.phone || '');
        setEditLocation(act.profile.location || '');
        setEditSkills(Array.isArray(act.profile.skills) ? act.profile.skills.join(', ') : act.profile.skills || '');
      } else {
        setEditFullName(mem.user_name || '');
      }
    } catch (err) {
      console.error('Error inspecting member activity:', err);
    } finally {
      setLoadingActivity(false);
    }
  };

  const handleSaveMemberProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember || !selectedMember.user_id) return;
    setSaveProfileSuccess(false);

    try {
      const skillsArray = editSkills ? editSkills.split(',').map(s => s.trim()).filter(Boolean) : [];
      await updateMemberProfileByOrgAdmin(selectedMember.user_id, {
        full_name: editFullName,
        headline: editHeadline,
        bio: editBio,
        phone: editPhone,
        location: editLocation,
        skills: skillsArray,
      });
      setSaveProfileSuccess(true);
      const updated = await getOrganizationMembers(org!.id);
      setMembers(updated);
    } catch (err) {
      console.error('Error saving member profile:', err);
    }
  };

  const handleRoleChange = async (memberId: string, newRole: MemberRole) => {
    if (!org) return;
    await updateMemberRoleInOrg(org.id, memberId, newRole);
    const updated = await getOrganizationMembers(org.id);
    setMembers(updated);
    if (selectedMember && selectedMember.id === memberId) {
      setSelectedMember(prev => (prev ? { ...prev, role: newRole } : null));
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!org || !window.confirm('Are you sure you want to remove this member from the organization?')) return;
    await removeOrganizationMember(org.id, memberId);
    const updated = await getOrganizationMembers(org.id);
    setMembers(updated);
    setSelectedMember(null);
  };

  const handlePostOpportunity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!org || !oppTitle.trim()) return;

    if (org.verification_status !== 'verified') {
      setOppPostedMsg('Verification pending. Only verified organizations can post opportunities.');
      return;
    }

    try {
      const normalizedType = (oppType || '').toLowerCase().includes('job') ? 'job' : (oppType || 'grant').toLowerCase();
      let formattedSalary = oppAmount.trim();
      if (formattedSalary) {
        if (oppPayType === 'hourly' && !formattedSalary.toLowerCase().includes('/hr') && !formattedSalary.toLowerCase().includes('/hour')) {
          formattedSalary = `${formattedSalary}/hr`;
        } else if (oppPayType === 'fixed' && !formattedSalary.toLowerCase().includes('fixed')) {
          formattedSalary = `${formattedSalary} (Fixed)`;
        } else if (oppPayType === 'monthly' && !formattedSalary.toLowerCase().includes('/month') && !formattedSalary.toLowerCase().includes('/mo')) {
          formattedSalary = `${formattedSalary}/month`;
        }
      }

      const { error } = await supabase.from('opportunities').insert({
        title: oppTitle,
        type: normalizedType,
        description: oppDesc || null,
        organization_name: org.name,
        location: oppLocation || (org.city && org.country ? `${org.city}, ${org.country}` : org.country || org.city || 'Remote'),
        apply_link: oppLink || '', // allow empty for in-platform applications
        user_id: user?.id,
        featured: false,
        status: 'published',
        deadline: oppDeadline && oppDeadline.trim() ? oppDeadline : null,
        available_spots: oppAvailableSpots ? parseInt(oppAvailableSpots, 10) : null,
        skills: oppSkillsNeeded ? oppSkillsNeeded.split(',').map(s => s.trim()) : [],
        work_mode: (oppWorkMode || 'remote').toLowerCase().replace('on-site', 'onsite'),
        languages: oppLanguages ? oppLanguages.split(',').map(s => s.trim()) : [],
        experience_level: oppExperienceLevel || null,
        salary: formattedSalary || null,
        amount: formattedSalary || null,
      });

      if (error) {
        console.error('Error posting opportunity:', error);
        setOppPostedMsg('Failed to post opportunity: ' + error.message);
        return;
      }

      setOppPostedMsg('Opportunity posted successfully on behalf of ' + org.name + '!');
      setOppTitle('');
      setOppDesc('');
      setOppLink('');
      setOppDeadline('');
      setOppAvailableSpots('');
      setOppSkillsNeeded('');
      setOppLocation('');
      setOppLanguages('');
      setOppAmount('');

      fetchPostedOpps();
    } catch (err: any) {
      setOppPostedMsg('Failed to post opportunity: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', color: 'var(--accent-primary)' }}>
        Loading Organization Dashboard...
      </div>
    );
  }

  if (!org) {
    if (profile?.account_type !== 'business' && user?.user_metadata?.account_type !== 'business') {
      navigate('/dashboard', { replace: true });
      return null;
    }

    return (
      <div style={{ maxWidth: '600px', margin: '60px auto', padding: '40px 24px', textAlign: 'center', backgroundColor: 'var(--bg-secondary)', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '16px', backgroundColor: 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto' }}>
          <Building2 size={32} color="var(--accent-primary)" />
        </div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '10px' }}>
          Organization Setup Required
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', lineHeight: 1.6, marginBottom: '28px' }}>
          You have a Business account registered, but your organization profile setup is not yet complete. Please complete your registration to access your workspace.
        </p>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button onClick={() => navigate('/dashboard')}>
            Go to Main Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const isVerified = org.verification_status === 'verified';

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
      {/* Verification Status Banner */}
      {!isVerified && (
        <div
          style={{
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid #f59e0b',
            borderRadius: '12px',
            padding: '16px 20px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Clock size={24} color="#f59e0b" />
            <div>
              <h4 style={{ margin: 0, fontWeight: 700, color: '#f59e0b' }}>
                Account Verification Pending Admin Review
              </h4>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                Your business registration for <strong>{org.name}</strong> is under review. Team invites, credit spending, and posting privileges will activate upon approval.
              </p>
            </div>
          </div>
          <Badge variant="warning">Verification Pending</Badge>
        </div>
      )}

      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Building2 size={32} color="var(--accent-primary)" />
            {org.name}
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
            {org.type} • {org.city}, {org.country}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <Button onClick={() => setShowAddMemberModal(true)} style={{ gap: '8px', backgroundColor: 'var(--accent-primary)', color: '#000' }}>
            <UserPlus size={18} />
            + Add / Invite Member
          </Button>
          <Button variant="outline" onClick={() => setShowCheckout(true)} style={{ gap: '8px' }}>
            <Coins size={18} />
            Buy Org Credits ({formatCredits(org.credits)})
          </Button>
        </div>
      </div>

      {/* Top Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        <Card style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'rgba(34, 197, 94, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Coins size={20} color="#22c55e" />
            </div>
            <div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Org Credit Wallet</p>
              <p style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>{formatCredits(org.credits)} Credits</p>
            </div>
          </div>
        </Card>

        <Card style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={20} color="#60a5fa" />
            </div>
            <div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Team Members</p>
              <p style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>{members.length}</p>
            </div>
          </div>
        </Card>

        <Card style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldCheck size={20} color="#f59e0b" />
            </div>
            <div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Status</p>
              <p style={{ fontSize: '1.125rem', fontWeight: 800, color: isVerified ? '#22c55e' : '#f59e0b' }}>
                {isVerified ? 'Verified Active' : 'Pending Review'}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Navigation Tabs Carousel */}
      <div 
        style={{ 
          display: 'flex', 
          gap: '8px', 
          borderBottom: '1px solid var(--border-color)', 
          marginBottom: '24px', 
          overflowX: 'auto', 
          flexWrap: 'nowrap', 
          whiteSpace: 'nowrap',
          paddingBottom: '4px',
          scrollBehavior: 'smooth',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'thin'
        }}
      >
        {[
          { key: 'overview', label: 'Overview & Profile', icon: Building2 },
          { key: 'members', label: 'Manage Members & Team', icon: Users },
          { key: 'documents', label: 'Member Activities & Outputs', icon: FileText },
          { key: 'opportunities', label: 'Post Opportunity', icon: Briefcase },
          { key: 'my_opps', label: `Posted Jobs & Opps ${postedOpps.length > 0 ? `(${postedOpps.length})` : ''}`, icon: ListFilter },
          { key: 'applicants', label: `Review Applicants ${applicants.length > 0 ? `(${applicants.length})` : ''}`, icon: UserCheck },
          { key: 'credits', label: 'Credits & Wallet', icon: Coins },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            style={{
              padding: '12px 18px',
              border: 'none',
              background: 'none',
              borderBottom: activeTab === tab.key ? '2px solid var(--accent-primary)' : '2px solid transparent',
              color: activeTab === tab.key ? 'var(--accent-primary)' : 'var(--text-muted)',
              fontWeight: activeTab === tab.key ? 700 : 500,
              fontSize: '0.875rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s ease',
              flexShrink: 0,
              whiteSpace: 'nowrap'
            }}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB CONTENT: Overview */}
      {activeTab === 'overview' && (
        <Card style={{ padding: '28px' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '16px' }}>Organization Details</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            <div>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Organization Name</p>
              <p style={{ fontWeight: 700, fontSize: '1rem', margin: '2px 0 12px 0' }}>{org.name}</p>

              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Registration Number</p>
              <p style={{ fontWeight: 600, margin: '2px 0 12px 0' }}>{org.registration_number}</p>

              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Official Email</p>
              <p style={{ fontWeight: 600, margin: '2px 0 12px 0' }}>{org.official_email}</p>

              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Website</p>
              <p style={{ fontWeight: 600, margin: '2px 0 12px 0' }}>{org.website || 'N/A'}</p>
            </div>

            <div>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Contact Person</p>
              <p style={{ fontWeight: 700, margin: '2px 0 12px 0' }}>{org.contact_name} ({org.contact_title})</p>

              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Contact Email & Phone</p>
              <p style={{ fontWeight: 600, margin: '2px 0 12px 0' }}>{org.contact_email} • {org.contact_phone}</p>

              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Location</p>
              <p style={{ fontWeight: 600, margin: '2px 0 12px 0' }}>{org.address_line1}, {org.city}, {org.country}</p>
            </div>
          </div>

          <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--border-color)' }}>
            <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Mission Summary</h4>
            <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: '6px 0 0 0' }}>
              {org.summary || 'No mission summary provided.'}
            </p>
          </div>
        </Card>
      )}

      {/* TAB CONTENT: Manage Members */}
      {activeTab === 'members' && (
        <div>
          {/* Action Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>Organization Team Roster</h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                Manage member profiles, assign roles, inspect document outputs, and generate CVs/Grants for your team.
              </p>
            </div>
            <Button onClick={() => setShowAddMemberModal(true)} style={{ gap: '8px', backgroundColor: 'var(--accent-primary)', color: '#000' }}>
              <UserPlus size={16} /> + Add / Invite Member
            </Button>
          </div>

          {/* Pending Member Join Requests */}
          {members.some(m => m.status === 'pending') && (
            <Card style={{ padding: '20px', marginBottom: '24px', backgroundColor: 'rgba(59, 130, 246, 0.04)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
              <h4 style={{ fontSize: '0.9375rem', fontWeight: 800, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px', color: '#60a5fa' }}>
                <Clock size={18} />
                Pending Join Requests ({members.filter(m => m.status === 'pending').length})
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {members.filter(m => m.status === 'pending').map(req => (
                  <div
                    key={req.id}
                    style={{
                      backgroundColor: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '10px',
                      padding: '14px 18px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '12px'
                    }}
                  >
                    <div>
                      <p style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {req.user_name ? `${req.user_name} (${req.user_email})` : req.user_email}
                      </p>
                      <p style={{ margin: '2px 0 0 0', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                        Requested team access on {new Date(req.created_at).toLocaleDateString()}
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleJoinRequestResponse(req.id, req.user_id || '', false)}
                        disabled={loading}
                        style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                      >
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleJoinRequestResponse(req.id, req.user_id || '', true)}
                        disabled={loading}
                        style={{ gap: '6px' }}
                      >
                        <ShieldCheck size={14} /> Approve Access
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Members Table */}
          <Card style={{ overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-color)' }}>
                    <th style={{ padding: '12px 16px', fontWeight: 700 }}>Team Member</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700 }}>Role</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700 }}>Status</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700 }}>Joined Date</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {members.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        No team members added yet. Click <strong>"+ Add / Invite Member"</strong> above to build your team!
                      </td>
                    </tr>
                  ) : (
                    members.map(m => (
                      <tr key={m.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'var(--accent-primary)' }}>
                              {(m.user_name || m.user_email).charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div>{m.user_name || 'Member'}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400 }}>{m.user_email}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <select
                            value={m.role}
                            onChange={e => handleRoleChange(m.id, e.target.value as MemberRole)}
                            style={{
                              padding: '4px 8px',
                              backgroundColor: 'var(--bg-secondary)',
                              border: '1px solid var(--border-color)',
                              borderRadius: '6px',
                              color: 'var(--text-primary)',
                              fontSize: '0.8125rem',
                              textTransform: 'capitalize',
                            }}
                          >
                            <option value="owner">Owner</option>
                            <option value="admin">Admin</option>
                            <option value="manager">Manager</option>
                            <option value="member">Member</option>
                          </select>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <Badge variant={m.status === 'accepted' ? 'success' : m.status === 'invited' ? 'warning' : 'outline'}>
                            {m.status === 'accepted' ? 'Active Member' : m.status}
                          </Badge>
                        </td>
                        <td style={{ padding: '14px 16px', color: 'var(--text-muted)' }}>
                          {new Date(m.created_at).toLocaleDateString()}
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                            <Button size="sm" variant="outline" onClick={() => handleInspectMember(m)} style={{ gap: '4px' }}>
                              <Edit3 size={14} /> Profile & Activities
                            </Button>
                            {m.role !== 'owner' && (
                              <Button size="sm" variant="outline" onClick={() => handleRemoveMember(m.id)} style={{ color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)', padding: '6px' }}>
                                <Trash2 size={14} />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* TAB CONTENT: Documents & Outputs */}
      {activeTab === 'documents' && (
        <Card style={{ padding: '28px' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '8px' }}>Team Generated Documents & Applications</h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
            View CVs, proposals, cover letters, and grant applications generated by team members using organization workspace & credits.
          </p>
          <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '32px 20px', borderRadius: '12px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <FileText size={40} color="var(--accent-primary)" style={{ marginBottom: '12px' }} />
            <p style={{ margin: 0, fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>Team Activity Dashboard Active</p>
            <p style={{ fontSize: '0.875rem', marginTop: '6px', maxWidth: '500px', margin: '6px auto 0 auto' }}>
              When members generate documents or track applications, their records sync directly into this organization repository. Click <strong>"Manage Members & Team"</strong> to generate CVs or Grants on behalf of specific members!
            </p>
          </div>
        </Card>
      )}

      {/* TAB CONTENT: Post Opportunities */}
      {activeTab === 'opportunities' && (
        <Card style={{ padding: '28px' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '16px' }}>Post Job / Opportunity on Behalf of Organization</h3>
          <form onSubmit={handlePostOpportunity} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '0.8125rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Opportunity Title</label>
              <input
                type="text"
                placeholder="e.g. Senior Research Fellow / Full-Stack Developer"
                value={oppTitle}
                onChange={e => setOppTitle(e.target.value)}
                required
                style={{ width: '100%', padding: '10px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Type</label>
                <select
                  value={oppType}
                  onChange={e => setOppType(e.target.value)}
                  style={{ width: '100%', padding: '10px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' }}
                >
                  <option value="Job">Job</option>
                  <option value="Grant">Grant</option>
                  <option value="Fellowship">Fellowship</option>
                  <option value="Tender / RFP">Tender / RFP</option>
                </select>
              </div>

            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Application URL (Leave blank for in-platform application)</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={oppLink}
                  onChange={e => setOppLink(e.target.value)}
                  style={{ width: '100%', padding: '10px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Deadline</label>
                <input
                  type="date"
                  value={oppDeadline}
                  onChange={e => setOppDeadline(e.target.value)}
                  style={{ width: '100%', padding: '10px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Pay / Rate Type</label>
                <select
                  value={oppPayType}
                  onChange={e => setOppPayType(e.target.value)}
                  style={{ width: '100%', padding: '10px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' }}
                >
                  <option value="fixed">Fixed Budget / Amount</option>
                  <option value="hourly">Hourly Rate ($/hr)</option>
                  <option value="monthly">Monthly Salary</option>
                  <option value="annual">Annual Salary</option>
                  <option value="unpaid">Unpaid / Equity</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Amount / Compensation Range</label>
                <input
                  type="text"
                  placeholder={oppPayType === 'hourly' ? 'e.g. $30/hr or £25-£35/hr' : oppPayType === 'fixed' ? 'e.g. $500 or ₦150,000' : 'e.g. £50,000/yr'}
                  value={oppAmount}
                  onChange={e => setOppAmount(e.target.value)}
                  style={{ width: '100%', padding: '10px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Available Spots</label>
                <input
                  type="number"
                  placeholder="e.g. 2"
                  value={oppAvailableSpots}
                  onChange={e => setOppAvailableSpots(e.target.value)}
                  min="1"
                  style={{ width: '100%', padding: '10px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Work Arrangement</label>
                <select
                  value={oppWorkMode}
                  onChange={e => setOppWorkMode(e.target.value)}
                  style={{ width: '100%', padding: '10px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' }}
                >
                  <option value="remote">Remote</option>
                  <option value="onsite">On-site</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Experience Level</label>
                <select
                  value={oppExperienceLevel}
                  onChange={e => setOppExperienceLevel(e.target.value)}
                  style={{ width: '100%', padding: '10px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' }}
                >
                  <option value="<5 years">Less than 5 years</option>
                  <option value="5+ years">5+ years</option>
                  <option value="10+ years">10+ years</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Skills Needed (comma separated)</label>
                <input
                  type="text"
                  placeholder="e.g. React, Node.js, Python"
                  value={oppSkillsNeeded}
                  onChange={e => setOppSkillsNeeded(e.target.value)}
                  style={{ width: '100%', padding: '10px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Languages (comma separated)</label>
                <input
                  type="text"
                  placeholder="e.g. English, Spanish"
                  value={oppLanguages}
                  onChange={e => setOppLanguages(e.target.value)}
                  style={{ width: '100%', padding: '10px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.8125rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Specific Location (leave blank to use org location)</label>
              <input
                type="text"
                placeholder={`Default: ${org?.city}, ${org?.country}`}
                value={oppLocation}
                onChange={e => setOppLocation(e.target.value)}
                style={{ width: '100%', padding: '10px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8125rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Description & Requirements</label>
              <textarea
                rows={4}
                placeholder="Details about the opportunity..."
                value={oppDesc}
                onChange={e => setOppDesc(e.target.value)}
                style={{ width: '100%', padding: '10px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' }}
              />
            </div>

            <Button type="submit" disabled={!isVerified} style={{ alignSelf: 'flex-start' }}>
              Post Opportunity
            </Button>
          </form>

          {oppPostedMsg && (
            <p style={{ marginTop: '16px', fontSize: '0.875rem', fontWeight: 600, color: oppPostedMsg.includes('successfully') ? '#22c55e' : '#ef4444' }}>
              {oppPostedMsg}
            </p>
          )}
        </Card>
      )}

      {/* TAB CONTENT: Posted Jobs & Opportunities */}
      {activeTab === 'my_opps' && (
        <Card style={{ padding: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>Posted Jobs & Opportunities</h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                Manage all opportunities posted by {org?.name} and view candidates who applied.
              </p>
            </div>
            <Button onClick={() => setActiveTab('opportunities')} style={{ gap: '6px' }}>
              <Briefcase size={16} />
              + Post New Opportunity
            </Button>
          </div>

          {loadingPostedOpps ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading posted opportunities...</div>
          ) : postedOpps.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', backgroundColor: 'var(--bg-secondary)', borderRadius: '12px', color: 'var(--text-muted)' }}>
              <p style={{ margin: '0 0 16px 0', fontSize: '1rem' }}>No opportunities posted yet by your organization.</p>
              <Button onClick={() => setActiveTab('opportunities')}>Post Your First Opportunity</Button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {postedOpps.map(opp => (
                <div key={opp.id} style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '20px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                    <div style={{ flex: 1, minWidth: '240px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                        <Badge variant="primary" style={{ textTransform: 'capitalize' }}>{opp.type || 'job'}</Badge>
                        <Badge variant={opp.status === 'published' || opp.status === 'Active' ? 'success' : 'outline'}>
                          {opp.status || 'published'}
                        </Badge>
                        {opp.hired_count > 0 && (
                          <Badge variant="success" style={{ backgroundColor: '#22c55e', color: '#fff', fontWeight: 800 }}>
                            ✓ HIRED ({opp.hired_count})
                          </Badge>
                        )}
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Posted: {new Date(opp.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <h4 style={{ margin: '0 0 6px 0', fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {opp.title}
                      </h4>
                      <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                        📍 {opp.location || 'Remote'} {opp.work_mode ? `• ${opp.work_mode}` : ''} {opp.deadline ? `• Deadline: ${new Date(opp.deadline).toLocaleDateString()}` : ''}
                      </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                      <div style={{ textAlign: 'right', paddingRight: '12px', borderRight: '1px solid var(--border-color)' }}>
                        <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-primary)', display: 'block' }}>
                          {opp.applicant_count || 0}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Applicants</span>
                      </div>

                      <Button 
                        size="sm" 
                        onClick={() => {
                          setSelectedOppFilter(opp.id);
                          setActiveTab('applicants');
                        }}
                        style={{ gap: '6px' }}
                      >
                        <UserCheck size={14} />
                        View Applicants ({opp.applicant_count || 0})
                      </Button>
                      
                      <a 
                        href={`/opportunities/${opp.id}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{ textDecoration: 'none' }}
                      >
                        <Button size="sm" variant="outline" style={{ gap: '4px' }}>
                          <ExternalLink size={14} /> View Page
                        </Button>
                      </a>

                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleDeleteOpportunity(opp.id)}
                        style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* TAB CONTENT: Applicants */}
      {activeTab === 'applicants' && (
        <Card style={{ padding: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>Review Applicants</h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                Review users who have applied to opportunities posted by {org?.name}.
              </p>
            </div>
            {postedOpps.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 600 }}>Filter by Job:</span>
                <select
                  value={selectedOppFilter}
                  onChange={e => setSelectedOppFilter(e.target.value)}
                  style={{ padding: '8px 12px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '0.875rem' }}
                >
                  <option value="all">All Opportunities ({applicants.length})</option>
                  {postedOpps.map(opp => (
                    <option key={opp.id} value={opp.id}>
                      {opp.title} ({opp.applicant_count || 0})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {loadingApplicants ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading applicants...</div>
          ) : applicants.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', backgroundColor: 'var(--bg-secondary)', borderRadius: '12px', color: 'var(--text-muted)' }}>
              No applications found for your opportunities yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {applicants
                .filter(app => selectedOppFilter === 'all' || app.opportunity_id === selectedOppFilter)
                .map(app => (
                <div key={app.id} style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div 
                        onClick={() => setInspectingApplicant(app)}
                        style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--accent-glow)', border: '2px solid var(--accent-primary)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                        title="Click to view applicant full profile"
                      >
                        {app.profile?.avatar_url ? (
                          <img src={app.profile.avatar_url} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <User size={24} color="var(--accent-primary)" />
                        )}
                      </div>
                      <div>
                        <h4 
                          onClick={() => setInspectingApplicant(app)}
                          style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                          title="Click to view applicant full profile"
                        >
                          <span>{app.profile?.full_name || app.profile?.name || (app.profile?.email ? app.profile.email.split('@')[0] : null) || `Applicant #${app.applicant_id.substring(0, 6)}`}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', fontWeight: 600, textDecoration: 'underline' }}>
                            (View Full Profile ↗)
                          </span>
                        </h4>
                        <p style={{ margin: '2px 0 0 0', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                          Applied for: <strong style={{ color: 'var(--text-primary)' }}>{app.opportunities?.title || 'Unknown Opportunity'}</strong>
                        </p>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <Button size="sm" variant="outline" onClick={() => setInspectingApplicant(app)} style={{ gap: '6px', color: 'var(--accent-primary)', borderColor: 'rgba(245, 158, 11, 0.4)' }}>
                        <Eye size={14} /> View Full Profile
                      </Button>

                      <Badge variant={app.status === 'hired' ? 'success' : app.status === 'declined' ? 'danger' : 'warning'}>
                        {app.status.toUpperCase()}
                      </Badge>
                      
                      {app.status === 'pending' && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => handleUpdateApplicationStatus(app.id, 'declined')} style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
                            Decline
                          </Button>
                          <Button size="sm" onClick={() => handleUpdateApplicationStatus(app.id, 'hired')} style={{ gap: '6px', backgroundColor: '#22c55e', color: '#fff' }}>
                            Hire
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  <div style={{ backgroundColor: 'var(--bg-primary)', padding: '12px', borderRadius: '8px', fontSize: '0.875rem' }}>
                    <h5 style={{ margin: '0 0 8px 0', fontSize: '0.8125rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Proposal / Cover Letter</h5>
                    <p style={{ margin: 0, whiteSpace: 'pre-wrap', color: 'var(--text-primary)' }}>{app.proposal_letter}</p>
                  </div>

                  {/* CV & Resume Links */}
                  <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
                    {app.resume_url ? (
                      <a href={app.resume_url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                        <Button size="sm" variant="outline" style={{ gap: '6px', color: 'var(--accent-primary)', borderColor: 'var(--accent-primary)' }}>
                          <FileText size={14} /> Download / View CV
                        </Button>
                      </a>
                    ) : app.resume_text ? (
                      <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                        <FileText size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} /> Resume text provided
                      </span>
                    ) : null}
                    
                    {app.portfolio_url && (
                      <a href={app.portfolio_url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                        <Button size="sm" variant="outline" style={{ gap: '6px' }}>
                          <Globe size={14} /> View Portfolio Link
                        </Button>
                      </a>
                    )}
                  </div>

                  {/* Media Portfolio Attachments (Videos, Images, PDFs) */}
                  {app.media_urls && Array.isArray(app.media_urls) && app.media_urls.length > 0 && (
                    <div style={{ marginTop: '8px', paddingTop: '12px', borderTop: '1px dashed var(--border-color)' }}>
                      <h5 style={{ margin: '0 0 10px 0', fontSize: '0.8125rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                        Attached Media Portfolio ({app.media_urls.length} Files)
                      </h5>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
                        {app.media_urls.map((media: any, mIdx: number) => {
                          const mUrl = typeof media === 'string' ? media : media.url;
                          const mType = typeof media === 'object' ? media.type : (mUrl.includes('.mp4') || mUrl.includes('.mov') || mUrl.includes('video') ? 'video' : mUrl.includes('.png') || mUrl.includes('.jpg') || mUrl.includes('.jpeg') || mUrl.includes('image') ? 'image' : 'document');
                          const mName = typeof media === 'object' ? media.name : `Attachment ${mIdx + 1}`;

                          return (
                            <div key={mIdx} style={{ padding: '10px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              {mType === 'video' ? (
                                <video src={mUrl} controls style={{ width: '100%', maxHeight: '140px', borderRadius: '6px', backgroundColor: '#000' }} />
                              ) : mType === 'image' ? (
                                <img src={mUrl} alt={mName} style={{ width: '100%', maxHeight: '140px', objectFit: 'cover', borderRadius: '6px' }} />
                              ) : (
                                <div style={{ padding: '16px', textOverflow: 'ellipsis', overflow: 'hidden', textAlign: 'center' }}>
                                  <FileText size={32} color="var(--accent-primary)" style={{ margin: '0 auto 6px auto', display: 'block' }} />
                                  <span style={{ fontSize: '0.75rem', color: 'var(--text-primary)', fontWeight: 600 }}>{mName}</span>
                                </div>
                              )}
                              <a href={mUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', fontWeight: 600, textDecoration: 'none', textAlign: 'center' }}>
                                Open Full {mType === 'video' ? 'Video' : mType === 'image' ? 'Picture' : 'File'} ↗
                              </a>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* TAB CONTENT: Credits */}
      {activeTab === 'credits' && (
        <Card style={{ padding: '28px' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '8px' }}>Organization Credit Wallet</h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '24px' }}>
            Manage credits allocated to your organization. Members can draw from this pool when generating CVs, grants, and tracking job applications.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'var(--bg-secondary)', padding: '20px', borderRadius: '12px', marginBottom: '24px' }}>
            <div>
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Current Credit Balance</span>
              <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#22c55e', margin: '4px 0 0 0' }}>{formatCredits(org.credits)} Credits</h2>
            </div>

            <Button onClick={() => setShowCheckout(true)} style={{ gap: '8px' }}>
              <Coins size={18} /> Purchase Additional Credits
            </Button>
          </div>
        </Card>
      )}

      {/* UNIFIED ADD / INVITE MEMBER MODAL */}
      {showAddMemberModal && (
        <div style={modalOverlayStyle} onClick={() => setShowAddMemberModal(false)}>
          <div style={{ ...modalContentStyle, maxWidth: '580px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UserPlus size={20} color="var(--accent-primary)" />
                Add or Invite Team Member
              </h2>
              <button onClick={() => setShowAddMemberModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {/* Sub-tabs: Search Platform Users vs Invite Email */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
              <button
                onClick={() => { setAddMode('search'); setInviteSuccessMsg(null); }}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: addMode === 'search' ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                  color: addMode === 'search' ? '#000' : 'var(--text-secondary)',
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '6px'
                }}
              >
                <Search size={14} /> Search PATHEW Users
              </button>
              <button
                onClick={() => { setAddMode('invite'); setInviteSuccessMsg(null); }}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: addMode === 'invite' ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                  color: addMode === 'invite' ? '#000' : 'var(--text-secondary)',
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '6px'
                }}
              >
                <Send size={14} /> Invite via Email Link
              </button>
            </div>

            {/* MODE 1: Search Registered Platform Users */}
            {addMode === 'search' && (
              <div>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                  Search existing registered PATHEW users by their name or email address to add them directly to your team.
                </p>

                <div style={{ position: 'relative', marginBottom: '16px' }}>
                  <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="text"
                    placeholder="Type name or email address..."
                    value={userSearchQuery}
                    onChange={e => handleUserSearch(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px 10px 36px',
                      backgroundColor: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      color: 'var(--text-primary)',
                      fontSize: '0.875rem',
                    }}
                  />
                </div>

                {isSearching && (
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', textAlign: 'center', padding: '12px' }}>
                    Searching users...
                  </p>
                )}

                {searchResults.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '240px', overflowY: 'auto' }}>
                    {searchResults.map(u => (
                      <div
                        key={u.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '12px 16px',
                          backgroundColor: 'var(--bg-secondary)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '8px',
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{u.full_name || 'PATHEW User'}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{u.email}</div>
                        </div>

                        <Button size="sm" onClick={() => handleAddDirectMember(u, 'member')} style={{ gap: '4px' }}>
                          <UserCheck size={14} /> Add to Team
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {userSearchQuery.length >= 2 && searchResults.length === 0 && !isSearching && (
                  <div style={{ padding: '16px', textAlign: 'center', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px', color: 'var(--text-muted)' }}>
                    <p style={{ margin: 0, fontSize: '0.875rem' }}>No existing user found for "{userSearchQuery}".</p>
                    <button
                      onClick={() => {
                        setAddMode('invite');
                        setInviteEmail(userSearchQuery);
                      }}
                      style={{ marginTop: '8px', color: 'var(--accent-primary)', background: 'none', border: 'none', fontWeight: 700, cursor: 'pointer' }}
                    >
                      → Send an Email Invite to {userSearchQuery} instead
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* MODE 2: Invite Non-Platform User via Email */}
            {addMode === 'invite' && (
              <form onSubmit={handleSendEmailInvite} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: 0 }}>
                  If the member is not yet registered on PATHEW, enter their details below. They will receive a registration invite link linked to your organization.
                </p>

                <div>
                  <label style={{ fontSize: '0.8125rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Member Full Name (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Sarah Connor"
                    value={inviteName}
                    onChange={e => setInviteName(e.target.value)}
                    style={{ width: '100%', padding: '10px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8125rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Member Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="name@company.com"
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                    style={{ width: '100%', padding: '10px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8125rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Assigned Role</label>
                  <select
                    value={inviteRole}
                    onChange={e => setInviteRole(e.target.value as MemberRole)}
                    style={{ width: '100%', padding: '10px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' }}
                  >
                    <option value="member">Member</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <Button type="submit" disabled={!isVerified} style={{ marginTop: '6px', gap: '6px' }}>
                  <Send size={14} /> Generate & Send Invite
                </Button>
              </form>
            )}

            {/* Feedback & Generated Link Display */}
            {inviteSuccessMsg && (
              <div style={{ marginTop: '16px', padding: '16px', backgroundColor: 'rgba(34, 197, 94, 0.1)', border: '1px solid #22c55e', borderRadius: '10px', color: 'var(--text-primary)', fontSize: '0.875rem' }}>
                <p style={{ margin: '0 0 10px 0', fontWeight: 700, color: '#22c55e', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle2 size={18} /> {inviteSuccessMsg}
                </p>

                {generatedInviteUrl && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="text"
                        readOnly
                        value={generatedInviteUrl}
                        style={{ flex: 1, padding: '8px 12px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '0.8125rem' }}
                      />
                      <Button size="sm" onClick={handleCopyInviteLink} style={{ gap: '4px' }}>
                        {copiedLink ? <Check size={14} /> : <Copy size={14} />} {copiedLink ? 'Copied' : 'Copy Link'}
                      </Button>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
                      <a
                        href={`mailto:${inviteEmail}?subject=${encodeURIComponent(`Invitation to Join ${org?.name || 'Organization'} on PATHEW`)}&body=${encodeURIComponent(`Hi,\n\nYou have been invited by ${org?.name || 'our organization'} to join our team workspace on PATHEW as a ${inviteRole}.\n\nClick the registration link below to accept your invitation and activate your account:\n${generatedInviteUrl}\n\nBest regards,\n${org?.name || 'PATHEW Team'}`)}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{ textDecoration: 'none', flex: 1, minWidth: '200px' }}
                      >
                        <Button size="sm" style={{ width: '100%', gap: '6px', backgroundColor: '#3b82f6', color: '#ffffff' }}>
                          <Mail size={14} /> Send Email to {inviteEmail}
                        </Button>
                      </a>

                      {navigator.share && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            navigator.share({
                              title: `Join ${org?.name} on PATHEW`,
                              text: `You have been invited to join ${org?.name} on PATHEW as a ${inviteRole}.`,
                              url: generatedInviteUrl,
                            }).catch(() => {});
                          }}
                          style={{ gap: '6px' }}
                        >
                          <Send size={14} /> Share via WhatsApp / Apps
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MEMBER PROFILE & ACTIVITY INSPECTOR MODAL */}
      {selectedMember && (
        <div style={modalOverlayStyle} onClick={() => setSelectedMember(null)}>
          <div style={{ ...modalContentStyle, maxWidth: '720px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0 }}>
                  {selectedMember.user_name || 'Team Member'} Profile & Activity
                </h2>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                  {selectedMember.user_email} • Member since {new Date(selectedMember.created_at).toLocaleDateString()}
                </p>
              </div>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <Button size="sm" variant={isEditingProfile ? 'primary' : 'outline'} onClick={() => setIsEditingProfile(!isEditingProfile)} style={{ gap: '4px' }}>
                  <Edit3 size={14} /> {isEditingProfile ? 'View Profile' : 'Edit Member Profile'}
                </Button>
                <button onClick={() => setSelectedMember(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* EDIT PROFILE FORM */}
            {isEditingProfile ? (
              <form onSubmit={handleSaveMemberProfile} style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
                <div style={{ padding: '12px', backgroundColor: 'rgba(245, 158, 11, 0.08)', borderRadius: '8px', border: '1px solid rgba(245, 158, 11, 0.2)', fontSize: '0.8125rem', color: '#f59e0b' }}>
                  ⚡ As an Organization Admin, you can edit this team member's career profile to help them build optimized CVs and grant proposals.
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '0.8125rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Full Name</label>
                    <input
                      type="text"
                      value={editFullName}
                      onChange={e => setEditFullName(e.target.value)}
                      style={{ width: '100%', padding: '8px 10px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-primary)' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.8125rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Target Career Role / Title</label>
                    <input
                      type="text"
                      placeholder="e.g. Senior Researcher / Data Scientist"
                      value={editHeadline}
                      onChange={e => setEditHeadline(e.target.value)}
                      style={{ width: '100%', padding: '8px 10px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-primary)' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '0.8125rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Phone Number</label>
                    <input
                      type="text"
                      value={editPhone}
                      onChange={e => setEditPhone(e.target.value)}
                      style={{ width: '100%', padding: '8px 10px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-primary)' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.8125rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Location</label>
                    <input
                      type="text"
                      value={editLocation}
                      onChange={e => setEditLocation(e.target.value)}
                      style={{ width: '100%', padding: '8px 10px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-primary)' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.8125rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Core Skills (Comma Separated)</label>
                  <input
                    type="text"
                    placeholder="Project Management, Python, Research, Grant Writing"
                    value={editSkills}
                    onChange={e => setEditSkills(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-primary)' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8125rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Bio / Summary</label>
                  <textarea
                    rows={3}
                    value={editBio}
                    onChange={e => setEditBio(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-primary)' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <Button type="submit" style={{ gap: '4px' }}>
                    <CheckCircle2 size={14} /> Save Profile Updates
                  </Button>
                  <Button variant="outline" onClick={() => setIsEditingProfile(false)}>
                    Cancel
                  </Button>
                </div>

                {saveProfileSuccess && (
                  <p style={{ color: '#22c55e', fontSize: '0.8125rem', fontWeight: 600, margin: 0 }}>
                    Member profile updated successfully!
                  </p>
                )}
              </form>
            ) : (
              /* VIEW PROFILE DETAILS & QUICK BUILDER LAUNCHERS */
              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
                  <Button
                    size="sm"
                    onClick={() => navigate(`/cv-builder?forUser=${selectedMember.user_id || ''}&name=${encodeURIComponent(selectedMember.user_name || '')}`)}
                    style={{ gap: '6px', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
                  >
                    <FileText size={14} color="var(--accent-primary)" /> Generate CV for Member
                  </Button>

                  <Button
                    size="sm"
                    onClick={() => navigate(`/grant-builder?forUser=${selectedMember.user_id || ''}`)}
                    style={{ gap: '6px', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
                  >
                    <Sparkles size={14} color="#f59e0b" /> Draft Grant Proposal for Member
                  </Button>

                  <Button
                    size="sm"
                    onClick={() => navigate(`/cover-letter?forUser=${selectedMember.user_id || ''}`)}
                    style={{ gap: '6px', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
                  >
                    <FileEdit size={14} color="#60a5fa" /> Create Cover Letter
                  </Button>
                </div>

                {/* Member Profile Overview Card */}
                {memberActivity?.profile && (
                  <Card style={{ padding: '16px', backgroundColor: 'var(--bg-secondary)', marginBottom: '20px' }}>
                    <h4 style={{ fontSize: '0.875rem', fontWeight: 700, margin: '0 0 8px 0', color: 'var(--accent-primary)', textTransform: 'uppercase' }}>
                      Career Summary & Target Role
                    </h4>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>
                      {memberActivity.profile.target_role || memberActivity.profile.headline || 'No Target Role Specified'}
                    </p>
                    {memberActivity.profile.bio && (
                      <p style={{ margin: '6px 0 0 0', fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                        {memberActivity.profile.bio}
                      </p>
                    )}
                    {memberActivity.profile.skills && (
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '10px' }}>
                        {(Array.isArray(memberActivity.profile.skills) ? memberActivity.profile.skills : String(memberActivity.profile.skills).split(',')).map((sk: string, idx: number) => (
                          <Badge key={idx} variant="outline" style={{ fontSize: '0.75rem' }}>{sk.trim()}</Badge>
                        ))}
                      </div>
                    )}
                  </Card>
                )}

                {/* Member Documents & Applications Lists */}
                <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '10px' }}>
                  Member Documents & Activity History
                </h4>

                {loadingActivity ? (
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>
                    Loading member activities...
                  </p>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    {/* Generated Documents */}
                    <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '14px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                      <h5 style={{ margin: '0 0 10px 0', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <FileText size={14} color="var(--accent-primary)" />
                        Generated Documents ({memberActivity?.documents?.length || 0})
                      </h5>
                      {memberActivity?.documents && memberActivity.documents.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '160px', overflowY: 'auto' }}>
                          {memberActivity.documents.map(doc => (
                            <div key={doc.id} style={{ fontSize: '0.75rem', padding: '6px 8px', backgroundColor: 'var(--bg-primary)', borderRadius: '6px', display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{doc.title || doc.type}</span>
                              <span style={{ color: 'var(--text-muted)' }}>{new Date(doc.created_at || Date.now()).toLocaleDateString()}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>No documents generated yet.</p>
                      )}
                    </div>

                    {/* Job Applications */}
                    <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '14px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                      <h5 style={{ margin: '0 0 10px 0', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Briefcase size={14} color="#60a5fa" />
                        Tracked Applications ({memberActivity?.applications?.length || 0})
                      </h5>
                      {memberActivity?.applications && memberActivity.applications.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '160px', overflowY: 'auto' }}>
                          {memberActivity.applications.map(app => (
                            <div key={app.id} style={{ fontSize: '0.75rem', padding: '6px 8px', backgroundColor: 'var(--bg-primary)', borderRadius: '6px', display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{app.title || app.company_name}</span>
                              <Badge variant="outline" style={{ fontSize: '0.7rem' }}>{app.status || 'Applied'}</Badge>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>No job applications tracked yet.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant="outline" onClick={() => setSelectedMember(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* APPLICANT FULL PROFILE INSPECTOR MODAL */}
      {inspectingApplicant && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div style={{
            backgroundColor: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '880px',
            maxHeight: '92vh',
            overflowY: 'auto',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '24px',
              borderBottom: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-secondary)',
              borderTopLeftRadius: '20px',
              borderTopRightRadius: '20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              flexWrap: 'wrap',
              gap: '16px'
            }}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--accent-glow)',
                  border: '2px solid var(--accent-primary)',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '1.5rem',
                  color: 'var(--accent-primary)',
                  flexShrink: 0
                }}>
                  {inspectingApplicant.profile?.avatar_url ? (
                    <img src={inspectingApplicant.profile.avatar_url} alt="Profile Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    (inspectingApplicant.profile?.full_name || inspectingApplicant.profile?.name || inspectingApplicant.profile?.email || 'A').charAt(0).toUpperCase()
                  )}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {inspectingApplicant.profile?.full_name || inspectingApplicant.profile?.name || (inspectingApplicant.profile?.email ? inspectingApplicant.profile.email.split('@')[0] : null) || `Applicant #${inspectingApplicant.applicant_id.substring(0, 8)}`}
                    </h2>
                    <Badge variant={inspectingApplicant.status === 'hired' ? 'success' : inspectingApplicant.status === 'declined' ? 'danger' : 'warning'}>
                      {inspectingApplicant.status.toUpperCase()}
                    </Badge>
                  </div>

                  <p style={{ margin: '4px 0 0 0', fontSize: '0.875rem', color: 'var(--accent-primary)', fontWeight: 600 }}>
                    {inspectingApplicant.profile?.target_role || inspectingApplicant.profile?.headline || 'PATHEW Candidate'}
                  </p>

                  <p style={{ margin: '4px 0 0 0', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                    Applied for: <strong style={{ color: 'var(--text-primary)' }}>{inspectingApplicant.opportunities?.title || 'Opportunity'}</strong>
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {inspectingApplicant.status === 'pending' && (
                  <>
                    <Button size="sm" variant="outline" onClick={() => { handleUpdateApplicationStatus(inspectingApplicant.id, 'declined'); setInspectingApplicant({ ...inspectingApplicant, status: 'declined' }); }} style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
                      Decline
                    </Button>
                    <Button size="sm" onClick={() => { handleUpdateApplicationStatus(inspectingApplicant.id, 'hired'); setInspectingApplicant({ ...inspectingApplicant, status: 'hired' }); }} style={{ backgroundColor: '#22c55e', color: '#fff' }}>
                      Hire Candidate
                    </Button>
                  </>
                )}
                <button 
                  onClick={() => setInspectingApplicant(null)} 
                  style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-muted)', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Contact & Links Bar */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', padding: '16px', backgroundColor: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                {inspectingApplicant.profile?.email && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', color: 'var(--text-primary)' }}>
                    <Mail size={15} color="var(--accent-primary)" />
                    <span>{inspectingApplicant.profile.email}</span>
                  </div>
                )}
                {inspectingApplicant.profile?.phone && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', color: 'var(--text-primary)' }}>
                    <Phone size={15} color="var(--accent-primary)" />
                    <span>{inspectingApplicant.profile.phone}</span>
                  </div>
                )}
                {(inspectingApplicant.profile?.location || inspectingApplicant.profile?.country) && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', color: 'var(--text-primary)' }}>
                    <MapPin size={15} color="var(--accent-primary)" />
                    <span>{inspectingApplicant.profile.location || inspectingApplicant.profile.country}</span>
                  </div>
                )}
                {(inspectingApplicant.profile?.portfolio_url || inspectingApplicant.portfolio_url) && (
                  <a 
                    href={inspectingApplicant.profile?.portfolio_url || inspectingApplicant.portfolio_url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', color: 'var(--accent-primary)', fontWeight: 600, textDecoration: 'none' }}
                  >
                    <Globe size={15} />
                    <span>Portfolio Website ↗</span>
                  </a>
                )}
              </div>

              {/* 1. About & Career Story */}
              {(inspectingApplicant.profile?.story || inspectingApplicant.profile?.bio) && (
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 8px 0', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <User size={18} color="var(--accent-primary)" />
                    About & Profile Bio
                  </h3>
                  <p style={{ margin: 0, padding: '14px', backgroundColor: 'var(--bg-secondary)', borderRadius: '10px', fontSize: '0.875rem', color: 'var(--text-primary)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                    {inspectingApplicant.profile.story || inspectingApplicant.profile.bio}
                  </p>
                </div>
              )}

              {/* 2. Skills & Technical Expertise */}
              {inspectingApplicant.profile?.skills && (Array.isArray(inspectingApplicant.profile.skills) ? inspectingApplicant.profile.skills.length > 0 : Boolean(inspectingApplicant.profile.skills)) && (
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 10px 0', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Sparkles size={18} color="var(--accent-primary)" />
                    Skills & Technical Expertise
                  </h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {(Array.isArray(inspectingApplicant.profile.skills) 
                      ? inspectingApplicant.profile.skills 
                      : typeof inspectingApplicant.profile.skills === 'string' 
                      ? inspectingApplicant.profile.skills.split(',') 
                      : []
                    ).map((skill: string, idx: number) => (
                      <span key={idx} style={{ padding: '6px 12px', backgroundColor: 'var(--accent-glow)', color: 'var(--accent-primary)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '16px', fontSize: '0.8125rem', fontWeight: 600 }}>
                        {skill.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. Work Experience */}
              {inspectingApplicant.profile?.experience && Array.isArray(inspectingApplicant.profile.experience) && inspectingApplicant.profile.experience.length > 0 && (
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 12px 0', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Briefcase size={18} color="var(--accent-primary)" />
                    Work Experience ({inspectingApplicant.profile.experience.length})
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {inspectingApplicant.profile.experience.map((exp: any, idx: number) => (
                      <div key={idx} style={{ padding: '14px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                          <div>
                            <h4 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                              {exp.role || exp.title || exp.position || 'Position'}
                            </h4>
                            <p style={{ margin: '2px 0 0 0', fontSize: '0.8125rem', color: 'var(--accent-primary)', fontWeight: 600 }}>
                              {exp.company || exp.organisation || exp.employer || 'Company'} {exp.location && `• ${exp.location}`}
                            </p>
                          </div>
                          {(exp.start_date || exp.dates || exp.duration) && (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', backgroundColor: 'var(--bg-primary)', padding: '2px 8px', borderRadius: '6px' }}>
                              <Calendar size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
                              {exp.start_date ? `${exp.start_date} - ${exp.end_date || 'Present'}` : exp.dates || exp.duration}
                            </span>
                          )}
                        </div>
                        {exp.description && (
                          <p style={{ margin: '8px 0 0 0', fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                            {exp.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 4. Education & Certifications */}
              {((inspectingApplicant.profile?.education && Array.isArray(inspectingApplicant.profile.education) && inspectingApplicant.profile.education.length > 0) ||
                (inspectingApplicant.profile?.certifications && Array.isArray(inspectingApplicant.profile.certifications) && inspectingApplicant.profile.certifications.length > 0)) && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
                  
                  {/* Education */}
                  {inspectingApplicant.profile?.education && Array.isArray(inspectingApplicant.profile.education) && inspectingApplicant.profile.education.length > 0 && (
                    <div>
                      <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 10px 0', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <GraduationCap size={18} color="var(--accent-primary)" />
                        Education
                      </h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {inspectingApplicant.profile.education.map((edu: any, idx: number) => (
                          <div key={idx} style={{ padding: '12px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '10px' }}>
                            <h4 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                              {edu.degree || edu.field_of_study || 'Degree / Qualification'}
                            </h4>
                            <p style={{ margin: '2px 0 0 0', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                              {edu.school || edu.institution || edu.university || 'Educational Institution'}
                            </p>
                            {(edu.start_year || edu.end_year || edu.year) && (
                              <p style={{ margin: '4px 0 0 0', fontSize: '0.75rem', color: 'var(--accent-primary)' }}>
                                {edu.start_year ? `${edu.start_year} - ${edu.end_year || 'Present'}` : edu.year}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Certifications */}
                  {inspectingApplicant.profile?.certifications && Array.isArray(inspectingApplicant.profile.certifications) && inspectingApplicant.profile.certifications.length > 0 && (
                    <div>
                      <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 10px 0', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Award size={18} color="var(--accent-primary)" />
                        Certifications
                      </h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {inspectingApplicant.profile.certifications.map((cert: any, idx: number) => (
                          <div key={idx} style={{ padding: '12px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '10px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <div>
                                <h4 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                  {cert.name || cert.title || 'Certificate'}
                                </h4>
                                <p style={{ margin: '2px 0 0 0', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                                  {cert.issuer || cert.organization || 'Issuing Body'}
                                </p>
                              </div>
                              {(cert.credential_url || cert.url) && (
                                <a href={cert.credential_url || cert.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-primary)', fontSize: '0.75rem', fontWeight: 600, textDecoration: 'none' }}>
                                  Verify ↗
                                </a>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 5. Projects & Portfolios */}
              {inspectingApplicant.profile?.projects && Array.isArray(inspectingApplicant.profile.projects) && inspectingApplicant.profile.projects.length > 0 && (
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 10px 0', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FolderGit2 size={18} color="var(--accent-primary)" />
                    Projects & Work Showcase ({inspectingApplicant.profile.projects.length})
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px' }}>
                    {inspectingApplicant.profile.projects.map((proj: any, idx: number) => (
                      <div key={idx} style={{ padding: '14px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <h4 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {proj.title || proj.name || 'Project'}
                        </h4>
                        {proj.description && (
                          <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                            {proj.description}
                          </p>
                        )}
                        {(proj.link || proj.url) && (
                          <a href={proj.link || proj.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', fontWeight: 600, marginTop: 'auto', textDecoration: 'none' }}>
                            View Project ↗
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 6. Application Submissions (Proposal, Attached CV & Media) */}
              <div style={{ padding: '18px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 12px 0', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileText size={18} color="var(--accent-primary)" />
                  Application Documents & Cover Letter
                </h3>

                <div style={{ marginBottom: '14px', padding: '14px', backgroundColor: 'var(--bg-primary)', borderRadius: '8px' }}>
                  <h5 style={{ margin: '0 0 6px 0', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Submitted Proposal / Cover Letter</h5>
                  <p style={{ margin: 0, fontSize: '0.875rem', whiteSpace: 'pre-wrap', color: 'var(--text-primary)', lineHeight: 1.6 }}>
                    {inspectingApplicant.proposal_letter}
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: inspectingApplicant.media_urls?.length ? '14px' : '0' }}>
                  {inspectingApplicant.resume_url ? (
                    <a href={inspectingApplicant.resume_url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                      <Button size="sm" variant="outline" style={{ gap: '6px', color: 'var(--accent-primary)', borderColor: 'var(--accent-primary)' }}>
                        <FileText size={14} /> Download / View Attached CV
                      </Button>
                    </a>
                  ) : inspectingApplicant.resume_text ? (
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                      📄 Resume Text Provided in Application
                    </span>
                  ) : null}
                </div>

                {/* Attached Media Portfolio Files */}
                {inspectingApplicant.media_urls && Array.isArray(inspectingApplicant.media_urls) && inspectingApplicant.media_urls.length > 0 && (
                  <div style={{ paddingTop: '12px', borderTop: '1px dashed var(--border-color)' }}>
                    <h5 style={{ margin: '0 0 10px 0', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                      Attached Media Files ({inspectingApplicant.media_urls.length})
                    </h5>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
                      {inspectingApplicant.media_urls.map((media: any, mIdx: number) => {
                        const mUrl = typeof media === 'string' ? media : media.url;
                        const mType = typeof media === 'object' ? media.type : (mUrl.includes('.mp4') || mUrl.includes('.mov') || mUrl.includes('video') ? 'video' : mUrl.includes('.png') || mUrl.includes('.jpg') || mUrl.includes('image') ? 'image' : 'document');
                        const mName = typeof media === 'object' ? media.name : `Attachment ${mIdx + 1}`;

                        return (
                          <div key={mIdx} style={{ padding: '10px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {mType === 'video' ? (
                              <video src={mUrl} controls style={{ width: '100%', maxHeight: '120px', borderRadius: '6px', backgroundColor: '#000' }} />
                            ) : mType === 'image' ? (
                              <img src={mUrl} alt={mName} style={{ width: '100%', maxHeight: '120px', objectFit: 'cover', borderRadius: '6px' }} />
                            ) : (
                              <div style={{ padding: '12px', textOverflow: 'ellipsis', overflow: 'hidden', textAlign: 'center' }}>
                                <FileText size={28} color="var(--accent-primary)" style={{ margin: '0 auto 4px auto', display: 'block' }} />
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-primary)', fontWeight: 600 }}>{mName}</span>
                              </div>
                            )}
                            <a href={mUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', fontWeight: 600, textDecoration: 'none', textAlign: 'center' }}>
                              Open {mType === 'video' ? 'Video' : mType === 'image' ? 'Picture' : 'File'} ↗
                            </a>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      )}

      {/* CHECKOUT MODAL FOR CREDIT PURCHASE */}
      {showCheckout && (
        <CheckoutModal
          isOpen={showCheckout}
          onClose={() => setShowCheckout(false)}
          type="credits"
          item={{ name: '100 Organization Credits', price: 49.99 }}
        />
      )}
    </div>
  );
};

const modalOverlayStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.75)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 1100,
  backdropFilter: 'blur(6px)',
};

const modalContentStyle: React.CSSProperties = {
  backgroundColor: 'var(--bg-primary)',
  borderRadius: '16px',
  border: '1px solid var(--border-color)',
  width: '90%',
  maxHeight: '90vh',
  overflowY: 'auto',
  padding: '28px',
  boxShadow: '0 24px 48px rgba(0,0,0,0.5)',
};
