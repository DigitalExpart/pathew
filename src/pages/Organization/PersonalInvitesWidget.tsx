import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Building2, CheckCircle2, UserCheck, Mail, RefreshCw, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  getUserPendingInvites,
  respondToOrganizationInvite,
  type OrganizationInvite
} from '../../services/organizationService';

export const PersonalInvitesWidget: React.FC = () => {
  const { user, profile, refreshProfile } = useAuth();
  const [invites, setInvites] = useState<OrganizationInvite[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchInvites();
  }, [user]);

  const fetchInvites = async () => {
    if (!user || !user.email) return;
    setLoading(true);
    try {
      const pending = await getUserPendingInvites(user.email);
      setInvites(pending);
    } catch (err) {
      console.error('Error fetching user invites:', err);
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
        if (refreshProfile) await refreshProfile();
        await fetchInvites();
      }
    } catch (err) {
      console.error('Error responding to invite:', err);
    } finally {
      setLoading(false);
    }
  };

  const isMemberOfOrg = Boolean(profile?.organisation);

  return (
    <Card style={{ padding: '24px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Building2 size={22} color="var(--accent-primary)" />
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            Organization & Team Membership
          </h3>
        </div>
        <Button size="sm" variant="ghost" onClick={fetchInvites} disabled={loading} style={{ gap: '6px' }}>
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Check Invites
        </Button>
      </div>

      {msg && (
        <p style={{ fontSize: '0.875rem', color: '#22c55e', fontWeight: 600, marginBottom: '16px' }}>{msg}</p>
      )}

      {/* 1. Pending Invitations */}
      {invites.length > 0 && (
        <div style={{ marginBottom: isMemberOfOrg ? '20px' : '0' }}>
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

      {/* 2. Active Membership Details */}
      {isMemberOfOrg && (
        <div style={{ backgroundColor: 'rgba(34, 197, 94, 0.05)', border: '1px solid rgba(34, 197, 94, 0.2)', borderRadius: '10px', padding: '16px', marginTop: invites.length > 0 ? '16px' : '0' }}>
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

      {/* 3. Empty State / Info for Personal User */}
      {invites.length === 0 && !isMemberOfOrg && (
        <div style={{ backgroundColor: 'var(--bg-tertiary)', borderRadius: '10px', padding: '16px', textAlign: 'left' }}>
          <p style={{ margin: '0 0 6px 0', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            Not currently part of an organization
          </p>
          <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            To join an organization, share your registered email (<strong>{user?.email}</strong>) with your organization administrator. When they send you an invite, it will appear here for you to accept.
          </p>
        </div>
      )}
    </Card>
  );
};
