import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Building2, CheckCircle2, XCircle, Mail, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  getUserPendingInvites,
  respondToOrganizationInvite,
  type OrganizationInvite
} from '../../services/organizationService';

export const PersonalInvitesWidget: React.FC = () => {
  const { user } = useAuth();
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
        full_name: user.user_metadata?.full_name,
      });
      if (ok) {
        setMsg(accept ? `Joined ${invite.organization_name} successfully!` : `Declined invite from ${invite.organization_name}.`);
        await fetchInvites();
      }
    } catch (err) {
      console.error('Error responding to invite:', err);
    } finally {
      setLoading(false);
    }
  };

  if (invites.length === 0) return null;

  return (
    <Card style={{ marginBottom: '24px', padding: '20px', borderLeft: '4px solid var(--accent-primary)', backgroundColor: 'rgba(59, 130, 246, 0.04)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
        <Building2 size={22} color="var(--accent-primary)" />
        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>Organization Invitation</h3>
      </div>

      {msg && (
        <p style={{ fontSize: '0.875rem', color: '#22c55e', fontWeight: 600, marginBottom: '12px' }}>{msg}</p>
      )}

      {invites.map(inv => (
        <div key={inv.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', paddingTop: '8px' }}>
          <div>
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: 600 }}>
              You have been invited to join <strong>{inv.organization_name}</strong> as a <strong>{inv.role}</strong>.
            </p>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Accepting will link your profile while keeping your personal documents & tracker private.
            </span>
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
              <CheckCircle2 size={14} /> Accept Invitation
            </Button>
          </div>
        </div>
      ))}
    </Card>
  );
};
