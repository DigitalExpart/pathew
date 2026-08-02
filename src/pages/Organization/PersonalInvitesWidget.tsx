import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import {
  Building2,
  CheckCircle2,
  UserCheck,
  Mail,
  RefreshCw,
  ShieldCheck,
  Plus,
  Search,
  Clock,
  X,
  Building
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  getUserPendingInvites,
  respondToOrganizationInvite,
  getAllOrganizations,
  requestToJoinOrganization,
  getUserOrganizationMemberships,
  type OrganizationInvite,
  type Organization,
  type OrganizationMember
} from '../../services/organizationService';

import { useNavigate } from 'react-router-dom';
import { XCircle } from 'lucide-react';

export const PersonalInvitesWidget: React.FC = () => {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [invites, setInvites] = useState<OrganizationInvite[]>([]);
  const [userRequests, setUserRequests] = useState<OrganizationMember[]>([]);
  const [allOrgs, setAllOrgs] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [successModal, setSuccessModal] = useState<{ open: boolean; accept: boolean; orgName: string } | null>(null);

  // Add Org Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [submittingOrgId, setSubmittingOrgId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user || !user.email) return;
    setLoading(true);
    try {
      const [pendingInvites, memberships, orgs] = await Promise.all([
        getUserPendingInvites(user.email),
        getUserOrganizationMemberships(user.id),
        getAllOrganizations()
      ]);
      setInvites(pendingInvites);
      setUserRequests(memberships);
      setAllOrgs(orgs);
    } catch (err) {
      console.error('Error fetching organization info:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResponse = async (invite: OrganizationInvite, accept: boolean) => {
    if (!user) return;
    setLoading(true);
    try {
      const ok = await respondToOrganizationInvite(invite.id, invite.organization_id, accept, {
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || profile?.full_name,
      });
      if (ok) {
        setMsg(accept ? `Joined ${invite.organization_name} successfully!` : `Declined invite from ${invite.organization_name}.`);
        setSuccessModal({
          open: true,
          accept,
          orgName: invite.organization_name,
        });
        if (refreshProfile) await refreshProfile();
        await fetchData();
      }
    } catch (err) {
      console.error('Error responding to invite:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestJoin = async (targetOrg: Organization) => {
    if (!user) return;
    setSubmittingOrgId(targetOrg.id);
    try {
      const res = await requestToJoinOrganization(
        user.id,
        user.email || '',
        profile?.full_name || user.user_metadata?.full_name || 'Member',
        targetOrg.id,
        targetOrg.name
      );

      if (res.success) {
        setMsg(`Join request submitted to ${targetOrg.name}. Pending organization approval.`);
        setIsAddModalOpen(false);
        await fetchData();
      } else {
        alert(res.message || 'Could not submit join request.');
      }
    } catch (err) {
      console.error('Error requesting join:', err);
    } finally {
      setSubmittingOrgId(null);
    }
  };

  const isMemberOfOrg = Boolean(profile?.organisation);
  const pendingRequests = userRequests.filter(m => m.status === 'pending');

  const filteredOrgs = allOrgs.filter(o =>
    o.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.country?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Card style={{ padding: '24px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Building2 size={22} color="var(--accent-primary)" />
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            Organization & Team Membership
          </h3>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Button size="sm" onClick={() => setIsAddModalOpen(true)} style={{ gap: '6px' }}>
            <Plus size={14} /> Add Organization
          </Button>
          <Button size="sm" variant="ghost" onClick={fetchData} disabled={loading} style={{ gap: '6px' }}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Check Invites
          </Button>
        </div>
      </div>

      {msg && (
        <p style={{ fontSize: '0.875rem', color: '#22c55e', fontWeight: 600, marginBottom: '16px' }}>{msg}</p>
      )}

      {/* 1. Pending Invitations */}
      {invites.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <Mail size={16} color="var(--accent-primary)" />
            <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Pending Organization Invitations ({invites.length})
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {invites.map(inv => (
              <div
                key={inv.id}
                style={{
                  backgroundColor: 'rgba(245, 158, 11, 0.05)',
                  border: '1px solid rgba(245, 158, 11, 0.2)',
                  borderRadius: '10px',
                  padding: '16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}
              >
                <div>
                  <p style={{ margin: 0, fontSize: '0.9375rem', color: 'var(--text-primary)', fontWeight: 700 }}>
                    Invitation from {inv.organization_name}
                  </p>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                    Role: <strong style={{ color: 'var(--text-primary)', textTransform: 'capitalize' }}>{inv.role}</strong> • Link your profile while retaining document privacy.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleResponse(inv, false)}
                    disabled={loading}
                    style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                  >
                    Decline
                  </Button>

                  <Button
                    size="sm"
                    onClick={() => handleResponse(inv, true)}
                    disabled={loading}
                    style={{ gap: '6px' }}
                  >
                    <CheckCircle2 size={14} /> Accept & Join
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. User Pending Join Requests */}
      {pendingRequests.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          {pendingRequests.map(req => (
            <div
              key={req.id}
              style={{
                backgroundColor: 'rgba(59, 130, 246, 0.05)',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                borderRadius: '10px',
                padding: '16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Clock size={20} color="#3b82f6" />
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#60a5fa', fontWeight: 600, textTransform: 'uppercase' }}>Join Request Pending</span>
                  <h4 style={{ margin: '2px 0 0 0', fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    Awaiting Organization Admin Approval
                  </h4>
                  <p style={{ margin: '2px 0 0 0', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                    Your request to join the organization was submitted on {new Date(req.created_at).toLocaleDateString()}.
                  </p>
                </div>
              </div>

              <Badge variant="warning" style={{ gap: '4px' }}>
                <Clock size={12} /> Pending Approval
              </Badge>
            </div>
          ))}
        </div>
      )}

      {/* 3. Active Membership Details */}
      {isMemberOfOrg && (
        <div style={{ backgroundColor: 'rgba(34, 197, 94, 0.05)', border: '1px solid rgba(34, 197, 94, 0.2)', borderRadius: '10px', padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <UserCheck size={20} color="#22c55e" />
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Active Member</span>
                <h4 style={{ margin: '2px 0 0 0', fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {profile?.organisation}
                </h4>
              </div>
            </div>
            <Badge variant="success" style={{ gap: '4px' }}>
              <ShieldCheck size={12} /> Connected & Verified
            </Badge>
          </div>
        </div>
      )}

      {/* 4. Empty State / Info for Personal User */}
      {invites.length === 0 && pendingRequests.length === 0 && !isMemberOfOrg && (
        <div style={{ backgroundColor: 'var(--bg-tertiary)', borderRadius: '10px', padding: '16px', textAlign: 'left' }}>
          <p style={{ margin: '0 0 6px 0', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            Not currently linked to an organization
          </p>
          <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Click <strong>"+ Add Organization"</strong> above to search registered organizations on PATHEW and request to join, or share your email (<strong>{user?.email}</strong>) with your organization administrator.
          </p>
        </div>
      )}

      {/* MODAL: Request to Join Registered Organization */}
      {isAddModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '16px',
            maxWidth: '560px',
            width: '100%',
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)'
          }}>
            {/* Modal Header */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Building size={20} color="var(--accent-primary)" />
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>Join Registered Organization</h3>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            {/* Search Bar */}
            <div style={{ padding: '16px 24px', backgroundColor: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-color)' }}>
              <div style={{ position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Search registered organizations by name or type..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 38px',
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    fontSize: '0.875rem',
                    outline: 'none'
                  }}
                  autoFocus
                />
              </div>
            </div>

            {/* Registered Organizations List */}
            <div style={{ padding: '16px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filteredOrgs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-muted)' }}>
                  <Building2 size={36} color="var(--text-muted)" style={{ marginBottom: '8px' }} />
                  <p style={{ margin: 0, fontWeight: 600 }}>No registered organizations found matching "{searchQuery}"</p>
                  <p style={{ fontSize: '0.8125rem', marginTop: '4px' }}>
                    Ensure the organization has registered an account on PATHEW.
                  </p>
                </div>
              ) : (
                filteredOrgs.map(orgItem => (
                  <div
                    key={orgItem.id}
                    style={{
                      padding: '16px',
                      backgroundColor: 'var(--bg-primary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '12px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '12px'
                    }}
                  >
                    <div>
                      <h4 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {orgItem.name}
                      </h4>
                      <p style={{ margin: '2px 0 0 0', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                        {orgItem.type || 'Registered Organization'} • {orgItem.city ? `${orgItem.city}, ${orgItem.country}` : orgItem.country}
                      </p>
                    </div>

                    <Button
                      size="sm"
                      onClick={() => handleRequestJoin(orgItem)}
                      disabled={submittingOrgId === orgItem.id}
                      style={{ gap: '6px' }}
                    >
                      <Plus size={14} /> Request to Join
                    </Button>
                  </div>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* SUCCESS CONFIRMATION POPUP MODAL */}
      {successModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200, backdropFilter: 'blur(6px)' }} onClick={() => setSuccessModal(null)}>
          <div style={{ backgroundColor: 'var(--bg-primary)', borderRadius: '16px', border: '1px solid var(--border-color)', width: '90%', maxWidth: '460px', textAlign: 'center', padding: '36px 28px', boxShadow: '0 24px 48px rgba(0,0,0,0.5)' }} onClick={e => e.stopPropagation()}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%',
              backgroundColor: successModal.accept ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px',
            }}>
              {successModal.accept ? <CheckCircle2 size={36} color="#22c55e" /> : <XCircle size={36} color="#ef4444" />}
            </div>

            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>
              {successModal.accept ? '🎉 Invitation Accepted!' : 'Invitation Declined'}
            </h3>

            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '24px' }}>
              {successModal.accept
                ? `You are now an active team member of "${successModal.orgName}". Access your Organization Workspace and shared credits from the sidebar menu.`
                : `You have declined the team invitation from "${successModal.orgName}".`}
            </p>

            <div style={{ display: 'flex', gap: '10px' }}>
              {successModal.accept && (
                <Button onClick={() => { setSuccessModal(null); navigate('/org-dashboard'); }} style={{ flex: 1, backgroundColor: '#22c55e', color: '#ffffff' }}>
                  Go to Org Dashboard
                </Button>
              )}
              <Button variant="outline" onClick={() => setSuccessModal(null)} style={{ flex: 1 }}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};
