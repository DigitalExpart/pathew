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
  Link as LinkIcon,
  Globe
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
  defaultTab?: 'overview' | 'members' | 'documents' | 'opportunities' | 'credits';
}

export const OrgDashboardPage: React.FC<OrgDashboardProps> = ({ defaultTab = 'overview' }) => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [org, setOrg] = useState<Organization | null>(null);
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'documents' | 'opportunities' | 'credits' | 'applicants'>(defaultTab as any);

  // Applicants State
  const [applicants, setApplicants] = useState<any[]>([]);
  const [loadingApplicants, setLoadingApplicants] = useState(false);

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
  const [oppWorkMode, setOppWorkMode] = useState('On-site');
  const [oppLanguages, setOppLanguages] = useState('');
  const [oppExperienceLevel, setOppExperienceLevel] = useState('<5 years');
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
          const applicantIds = appsData.map(a => a.applicant_id);
          const { data: profiles, error: profErr } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url, target_role, email')
            .in('id', applicantIds);
            
          if (!profErr && profiles) {
             appsData.forEach(app => {
               app.profile = profiles.find(p => p.id === app.applicant_id);
             });
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
      const normalizedType = (oppType || '').toLowerCase().includes('job') ? 'job' : (oppType || 'grant');
      await supabase.from('opportunities').insert({
        title: oppTitle,
        type: normalizedType,
        description: oppDesc,
        organization_name: org.name,
        location: oppLocation || `${org.city}, ${org.country}`,
        apply_link: oppLink || '', // allow empty for in-platform applications
        user_id: user?.id,
        featured: false,
        status: 'published',
        deadline: oppDeadline,
        available_spots: oppAvailableSpots ? parseInt(oppAvailableSpots, 10) : null,
        skills: oppSkillsNeeded ? oppSkillsNeeded.split(',').map(s => s.trim()) : [],
        work_mode: oppWorkMode,
        languages: oppLanguages ? oppLanguages.split(',').map(s => s.trim()) : [],
        experience_level: oppExperienceLevel,
      });
      setOppPostedMsg('Opportunity posted successfully on behalf of ' + org.name + '!');
      setOppTitle('');
      setOppDesc('');
      setOppLink('');
      setOppDeadline('');
      setOppAvailableSpots('');
      setOppSkillsNeeded('');
      setOppLocation('');
      setOppLanguages('');
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

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-color)', marginBottom: '24px', flexWrap: 'wrap' }}>
        {[
          { key: 'overview', label: 'Overview & Profile', icon: Building2 },
          { key: 'members', label: 'Manage Members & Team', icon: Users },
          { key: 'documents', label: 'Member Activities & Outputs', icon: FileText },
          { key: 'opportunities', label: 'Post Opportunities', icon: Briefcase },
          { key: 'applicants', label: 'Review Applicants', icon: UserCheck },
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
                  <option value="On-site">On-site</option>
                  <option value="Remote">Remote</option>
                  <option value="Hybrid">Hybrid</option>
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

      {/* TAB CONTENT: Applicants */}
      {activeTab === 'applicants' && (
        <Card style={{ padding: '28px' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '8px' }}>Review Applicants</h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '24px' }}>
            Review users who have applied to opportunities posted by your organization.
          </p>

          {loadingApplicants ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading applicants...</div>
          ) : applicants.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', backgroundColor: 'var(--bg-secondary)', borderRadius: '12px', color: 'var(--text-muted)' }}>
              No applications found for your opportunities yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {applicants.map(app => (
                <div key={app.id} style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--bg-primary)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {app.profile?.avatar_url ? (
                          <img src={app.profile.avatar_url} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <UserCheck size={24} color="var(--text-muted)" />
                        )}
                      </div>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {app.profile?.full_name || 'Anonymous User'}
                        </h4>
                        <p style={{ margin: '2px 0 0 0', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                          Applied for: <strong style={{ color: 'var(--text-primary)' }}>{app.opportunities?.title || 'Unknown Opportunity'}</strong>
                        </p>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
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

                  <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    {app.resume_url ? (
                      <a href={app.resume_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.875rem', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}>
                        <LinkIcon size={14} /> View Resume
                      </a>
                    ) : app.resume_text ? (
                      <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                        <FileText size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} /> Resume text provided
                      </span>
                    ) : null}
                    
                    {app.portfolio_url && (
                      <a href={app.portfolio_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.875rem', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}>
                        <Globe size={14} /> View Portfolio
                      </a>
                    )}
                  </div>
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
