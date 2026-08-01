import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import {
  Building2,
  Users,
  Plus,
  Send,
  Clock,
  FileText,
  Briefcase,
  Coins,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { formatCredits } from '../../utils/formatters';
import {
  getOrganizationByUserId,
  getOrganizationMembers,
  inviteMemberToOrganization,
  type Organization,
  type OrganizationMember
} from '../../services/organizationService';
import { CheckoutModal } from '../../components/payment/CheckoutModal';
import { supabase } from '../../lib/supabase';

export const OrgDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [org, setOrg] = useState<Organization | null>(null);
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'documents' | 'opportunities' | 'credits'>('overview');

  // Member invite modal / form
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'manager' | 'member'>('member');
  const [inviteSuccess, setInviteSuccess] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  // Post Opportunity State
  const [oppTitle, setOppTitle] = useState('');
  const [oppType, setOppType] = useState('Job');
  const [oppDesc, setOppDesc] = useState('');
  const [oppLink, setOppLink] = useState('');
  const [oppPostedMsg, setOppPostedMsg] = useState<string | null>(null);

  // Credit Purchase Modal
  const [showCheckout, setShowCheckout] = useState(false);

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
      }
    } catch (err) {
      console.error('Error fetching organization dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!org || !inviteEmail.trim()) return;
    setInviteError(null);
    setInviteSuccess(false);

    if (org.verification_status !== 'verified') {
      setInviteError('Verification pending. Only verified organization accounts can invite team members.');
      return;
    }

    const ok = await inviteMemberToOrganization(org.id, org.name, inviteEmail.trim(), inviteRole);
    if (ok) {
      setInviteSuccess(true);
      setInviteEmail('');
      const updated = await getOrganizationMembers(org.id);
      setMembers(updated);
    } else {
      setInviteError('Failed to send invitation. Please try again.');
    }
  };

  const handlePostOpportunity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!org || !oppTitle.trim()) return;

    if (org.verification_status !== 'verified') {
      setOppPostedMsg('Verification pending. Only verified organizations can post opportunities.');
      return;
    }

    try {
      await supabase.from('opportunities').insert({
        title: oppTitle,
        type: oppType,
        description: oppDesc,
        organization_name: org.name,
        location: `${org.city}, ${org.country}`,
        apply_link: oppLink || 'https://pathew.com',
        user_id: user?.id,
        featured: false,
        status: 'Active',
      });
      setOppPostedMsg('Opportunity posted successfully on behalf of ' + org.name + '!');
      setOppTitle('');
      setOppDesc('');
      setOppLink('');
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
    return (
      <div style={{ maxWidth: '600px', margin: '60px auto', padding: '40px 24px', textAlign: 'center', backgroundColor: 'var(--bg-secondary)', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '16px', backgroundColor: 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto' }}>
          <Building2 size={32} color="var(--accent-primary)" />
        </div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '10px' }}>
          Organization Dashboard Restricted
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', lineHeight: 1.6, marginBottom: '28px' }}>
          This workspace is exclusively for registered Business and Organization Accounts. Personal account users can view, accept, and manage organization invitations directly on their Profile page.
        </p>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button onClick={() => navigate('/profile')}>
            Go to My Profile
          </Button>
          <Button variant="outline" onClick={() => navigate('/signup')}>
            Register Business Account
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
                Your business registration for <strong>{org.name}</strong> is under review by our admin team. Sensitive actions (team invites, credit spending, opportunity posting) will unlock upon approval.
              </p>
            </div>
          </div>
          <Badge variant="warning">Verification Pending</Badge>
        </div>
      )}

      {/* Header */}
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
          <Button onClick={() => setShowCheckout(true)} style={{ gap: '8px' }}>
            <Coins size={18} />
            Buy Org Credits ({formatCredits(org.credits)} Available)
          </Button>
        </div>
      </div>

      {/* Top Stats Cards */}
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

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-color)', marginBottom: '24px', flexWrap: 'wrap' }}>
        {[
          { key: 'overview', label: 'Overview & Profile', icon: Building2 },
          { key: 'members', label: 'Team & Invites', icon: Users },
          { key: 'documents', label: 'Team Outputs & Tracker', icon: FileText },
          { key: 'opportunities', label: 'Post Opportunities', icon: Briefcase },
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

      {/* TAB CONTENT: Members */}
      {activeTab === 'members' && (
        <div>
          {/* Invite Form */}
          <Card style={{ padding: '24px', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Plus size={18} color="var(--accent-primary)" />
              Invite Team Member
            </h3>

            <form onSubmit={handleInvite} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
              <input
                type="email"
                placeholder="Enter member email address..."
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                required
                style={{
                  flex: 1,
                  minWidth: '240px',
                  padding: '10px 14px',
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                  fontSize: '0.875rem',
                }}
              />
              <select
                value={inviteRole}
                onChange={e => setInviteRole(e.target.value as any)}
                style={{
                  padding: '10px 14px',
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                  fontSize: '0.875rem',
                }}
              >
                <option value="member">Member</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>

              <Button type="submit" disabled={!isVerified} style={{ gap: '6px' }}>
                <Send size={14} /> Send Invite
              </Button>
            </form>

            {inviteSuccess && (
              <p style={{ marginTop: '10px', color: '#22c55e', fontSize: '0.875rem', fontWeight: 500 }}>
                Invitation sent successfully!
              </p>
            )}
            {inviteError && (
              <p style={{ marginTop: '10px', color: '#ef4444', fontSize: '0.875rem', fontWeight: 500 }}>
                {inviteError}
              </p>
            )}
          </Card>

          {/* Members List */}
          <Card style={{ overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>Member Email</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>Role</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>Status</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>Joined Date</th>
                </tr>
              </thead>
              <tbody>
                {members.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No members added yet. Invite team members above!
                    </td>
                  </tr>
                ) : (
                  members.map(m => (
                    <tr key={m.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '14px 16px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {m.user_name ? `${m.user_name} (${m.user_email})` : m.user_email}
                      </td>
                      <td style={{ padding: '14px 16px', textTransform: 'capitalize' }}>{m.role}</td>
                      <td style={{ padding: '14px 16px' }}>
                        <Badge variant={m.status === 'accepted' ? 'success' : 'warning'}>
                          {m.status}
                        </Badge>
                      </td>
                      <td style={{ padding: '14px 16px', color: 'var(--text-muted)' }}>
                        {new Date(m.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      {/* TAB CONTENT: Documents & Outputs */}
      {activeTab === 'documents' && (
        <Card style={{ padding: '28px' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '8px' }}>Team Generated Documents & Applications</h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
            View CVs, proposals, and grant progress generated by team members using organization workspace & credits.
          </p>
          <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '20px', borderRadius: '12px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <FileText size={36} color="var(--accent-primary)" style={{ marginBottom: '12px' }} />
            <p style={{ margin: 0, fontWeight: 600 }}>No documents generated yet by team members.</p>
            <p style={{ fontSize: '0.8125rem', marginTop: '4px' }}>
              When members generate CVs or Grants using Org credits, their records will appear here.
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

              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Application URL</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={oppLink}
                  onChange={e => setOppLink(e.target.value)}
                  style={{ width: '100%', padding: '10px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' }}
                />
              </div>
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

      {/* TAB CONTENT: Credits */}
      {activeTab === 'credits' && (
        <Card style={{ padding: '28px' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '8px' }}>Organization Credit Wallet</h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '24px' }}>
            Manage credits allocated to your organization. Members can draw from this pool when generating CVs, grants, and application tracker progress.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'var(--bg-secondary)', padding: '20px', borderRadius: '12px', marginBottom: '24px' }}>
            <div>
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Current Credit Balance</span>
              <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#22c55e', margin: '4px 0 0 0' }}>{formatCredits(org.credits)} Credits</h2>
            </div>
            <Button onClick={() => setShowCheckout(true)} style={{ gap: '8px' }}>
              <Coins size={18} /> Purchase Custom Credit Pack
            </Button>
          </div>
        </Card>
      )}

      {/* Credit Purchase Modal */}
      {showCheckout && (
        <CheckoutModal
          isOpen={showCheckout}
          onClose={() => setShowCheckout(false)}
          planTitle="Organization Power Pack"
          planPrice="$49"
          planCredits="120"
        />
      )}
    </div>
  );
};
