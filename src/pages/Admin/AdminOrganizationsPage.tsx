import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import {
  Building2,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Eye,
  RefreshCw,
  FileCheck,
  ShieldCheck
} from 'lucide-react';
import { formatCredits } from '../../utils/formatters';
import {
  getAllOrganizations,
  updateOrganizationVerification,
  type Organization,
  type VerificationStatus
} from '../../services/organizationService';

export const AdminOrganizationsPage: React.FC = () => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [feedbackPopup, setFeedbackPopup] = useState<{ status: VerificationStatus; orgName: string } | null>(null);

  useEffect(() => {
    fetchOrgs();
  }, []);

  const fetchOrgs = async () => {
    setLoading(true);
    try {
      const data = await getAllOrganizations();
      setOrganizations(data);
    } catch (err) {
      console.error('Failed to fetch organizations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orgId: string, newStatus: VerificationStatus) => {
    setActionLoading(true);
    try {
      const ok = await updateOrganizationVerification(orgId, newStatus, adminNote);
      if (ok) {
        setOrganizations(prev =>
          prev.map(o => (o.id === orgId ? { ...o, verification_status: newStatus, verification_notes: adminNote } : o))
        );
        if (selectedOrg?.id === orgId) {
          setSelectedOrg(prev => prev ? { ...prev, verification_status: newStatus, verification_notes: adminNote } : null);
        }
        setFeedbackPopup({
          status: newStatus,
          orgName: selectedOrg?.name || 'Organization',
        });
      }
    } catch (err) {
      console.error('Error updating status:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const filtered = organizations.filter(o => {
    const matchesSearch =
      o.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.contact_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.official_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.country.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || o.verification_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: organizations.length,
    pending: organizations.filter(o => o.verification_status === 'pending').length,
    verified: organizations.filter(o => o.verification_status === 'verified').length,
    rejected: organizations.filter(o => o.verification_status === 'rejected').length,
  };

  const getStatusBadge = (status: VerificationStatus) => {
    switch (status) {
      case 'verified':
        return <Badge variant="success" style={{ gap: '4px' }}><CheckCircle2 size={12} /> Verified</Badge>;
      case 'pending':
        return <Badge variant="warning" style={{ gap: '4px' }}><Clock size={12} /> Pending Review</Badge>;
      case 'rejected':
        return <Badge variant="danger" style={{ gap: '4px' }}><XCircle size={12} /> Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1280px', margin: '0 auto' }}>
      {/* Page Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Building2 size={28} color="var(--accent-primary)" />
            Verify Organizations
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
            Review business registration requests, verify official documentation, and manage organization status.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchOrgs} style={{ gap: '6px' }}>
          <RefreshCw size={14} /> Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <Card style={{ padding: '16px' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Total Organizations</p>
          <p style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', margin: '4px 0 0 0' }}>{stats.total}</p>
        </Card>
        <Card style={{ padding: '16px', borderLeft: '4px solid #f59e0b' }}>
          <p style={{ fontSize: '0.75rem', color: '#f59e0b', fontWeight: 600, textTransform: 'uppercase' }}>Pending Approvals</p>
          <p style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f59e0b', margin: '4px 0 0 0' }}>{stats.pending}</p>
        </Card>
        <Card style={{ padding: '16px', borderLeft: '4px solid #22c55e' }}>
          <p style={{ fontSize: '0.75rem', color: '#22c55e', fontWeight: 600, textTransform: 'uppercase' }}>Verified Active</p>
          <p style={{ fontSize: '1.5rem', fontWeight: 800, color: '#22c55e', margin: '4px 0 0 0' }}>{stats.verified}</p>
        </Card>
        <Card style={{ padding: '16px', borderLeft: '4px solid #ef4444' }}>
          <p style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 600, textTransform: 'uppercase' }}>Rejected / Suspended</p>
          <p style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ef4444', margin: '4px 0 0 0' }}>{stats.rejected}</p>
        </Card>
      </div>

      {/* Search & Filter Toolbar */}
      <Card style={{ padding: '16px', marginBottom: '24px', display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search by name, contact, email, country..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px 8px 36px',
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              color: 'var(--text-primary)',
              fontSize: '0.875rem',
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {['all', 'pending', 'verified', 'rejected'].map(st => (
            <Button
              key={st}
              variant={statusFilter === st ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter(st)}
              style={{ textTransform: 'capitalize' }}
            >
              {st}
            </Button>
          ))}
        </div>
      </Card>

      {/* Organizations Table */}
      <Card style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '12px 16px', fontWeight: 700 }}>Organization</th>
                <th style={{ padding: '12px 16px', fontWeight: 700 }}>Sector & Type</th>
                <th style={{ padding: '12px 16px', fontWeight: 700 }}>Location</th>
                <th style={{ padding: '12px 16px', fontWeight: 700 }}>Contact Person</th>
                <th style={{ padding: '12px 16px', fontWeight: 700 }}>Status</th>
                <th style={{ padding: '12px 16px', fontWeight: 700, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Loading organization registrations...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No organization accounts found.
                  </td>
                </tr>
              ) : (
                filtered.map(org => (
                  <tr key={org.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{org.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Reg #: {org.registration_number || 'N/A'}</div>
                    </td>
                    <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>{org.type || 'Business'}</td>
                    <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>
                      {org.city ? `${org.city}, ${org.country}` : org.country}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{org.contact_name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{org.contact_email}</div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>{getStatusBadge(org.verification_status)}</td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedOrg(org);
                          setAdminNote(org.verification_notes || '');
                        }}
                        style={{ gap: '4px' }}
                      >
                        <Eye size={14} /> Review Details
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Inspection & Action Modal */}
      {selectedOrg && (
        <div style={modalOverlayStyle} onClick={() => setSelectedOrg(null)}>
          <div style={modalContentStyle} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>{selectedOrg.name}</h2>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                  Submitted on {new Date(selectedOrg.created_at).toLocaleDateString()}
                </p>
              </div>
              <div>{getStatusBadge(selectedOrg.verification_status)}</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              <div style={infoBoxStyle}>
                <h4 style={{ fontSize: '0.8125rem', color: 'var(--accent-primary)', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Organization Details
                </h4>
                <p style={detailItemStyle}><strong>Type / Sector:</strong> {selectedOrg.type}</p>
                <p style={detailItemStyle}><strong>Reg Number:</strong> {selectedOrg.registration_number}</p>
                <p style={detailItemStyle}><strong>Tax/VAT ID:</strong> {selectedOrg.tax_id || 'None'}</p>
                <p style={detailItemStyle}><strong>Country/City:</strong> {selectedOrg.city}, {selectedOrg.country}</p>
                <p style={detailItemStyle}><strong>Address:</strong> {selectedOrg.address_line1} {selectedOrg.address_line2}</p>
                <p style={detailItemStyle}><strong>Website:</strong> {selectedOrg.website || 'N/A'}</p>
                <p style={detailItemStyle}><strong>Official Email:</strong> {selectedOrg.official_email}</p>
                <p style={detailItemStyle}><strong>Phone:</strong> {selectedOrg.phone}</p>
              </div>

              <div style={infoBoxStyle}>
                <h4 style={{ fontSize: '0.8125rem', color: 'var(--accent-primary)', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Contact Person & Profile
                </h4>
                <p style={detailItemStyle}><strong>Contact Person:</strong> {selectedOrg.contact_name}</p>
                <p style={detailItemStyle}><strong>Role / Title:</strong> {selectedOrg.contact_title}</p>
                <p style={detailItemStyle}><strong>Contact Email:</strong> {selectedOrg.contact_email}</p>
                <p style={detailItemStyle}><strong>Contact Phone:</strong> {selectedOrg.contact_phone}</p>
                <p style={detailItemStyle}><strong>Team Size:</strong> {selectedOrg.team_size || 'N/A'}</p>
                <p style={detailItemStyle}><strong>Current Wallet:</strong> {formatCredits(selectedOrg.credits)} Credits</p>
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                Summary / Mission Statement
              </h4>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5, backgroundColor: 'var(--bg-secondary)', padding: '12px', borderRadius: '8px' }}>
                {selectedOrg.summary || 'No mission summary provided.'}
              </p>
            </div>

            {/* Means of Verification Uploads Section */}
            <div style={{ marginBottom: '20px', backgroundColor: 'var(--bg-secondary)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <h4 style={{ fontSize: '0.85rem', color: '#f59e0b', textTransform: 'uppercase', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={18} /> Means of Verification Documents
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                <div style={{ padding: '10px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '8px' }}>
                  <span style={{ fontSize: '0.775rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>1. Business Registration</span>
                  {selectedOrg.business_registration_doc ? (
                    <a href={selectedOrg.business_registration_doc} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.85rem', color: '#3b82f6', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}>
                      <FileCheck size={15} /> View Document ↗
                    </a>
                  ) : (
                    <span style={{ fontSize: '0.825rem', color: '#ef4444', fontWeight: 600 }}>Not Uploaded</span>
                  )}
                </div>

                <div style={{ padding: '10px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '8px' }}>
                  <span style={{ fontSize: '0.775rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>2. Proof of Address</span>
                  {selectedOrg.proof_of_address_doc ? (
                    <a href={selectedOrg.proof_of_address_doc} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}>
                      <FileCheck size={15} /> View Document ↗
                    </a>
                  ) : (
                    <span style={{ fontSize: '0.825rem', color: '#ef4444', fontWeight: 600 }}>Not Uploaded</span>
                  )}
                </div>

                <div style={{ padding: '10px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '8px' }}>
                  <span style={{ fontSize: '0.775rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>3. Proof of Identity</span>
                  {selectedOrg.proof_of_identity_doc ? (
                    <a href={selectedOrg.proof_of_identity_doc} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.85rem', color: '#f59e0b', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}>
                      <FileCheck size={15} /> View Document ↗
                    </a>
                  ) : (
                    <span style={{ fontSize: '0.825rem', color: '#ef4444', fontWeight: 600 }}>Not Uploaded</span>
                  )}
                </div>
              </div>
            </div>

            {/* Admin Verification Notes Input */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
                Admin Notes / Verification Decision Details:
              </label>
              <textarea
                value={adminNote}
                onChange={e => setAdminNote(e.target.value)}
                placeholder="Enter approval, rejection, or additional information notes for the organization..."
                style={{
                  width: '100%',
                  minHeight: '80px',
                  padding: '10px',
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                  fontSize: '0.875rem',
                }}
              />
            </div>

            {/* Verification Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
              <Button variant="outline" onClick={() => setSelectedOrg(null)}>
                Close
              </Button>
              <div style={{ display: 'flex', gap: '10px' }}>
                <Button
                  variant="outline"
                  onClick={() => handleStatusChange(selectedOrg.id, 'rejected')}
                  disabled={actionLoading}
                  style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)', gap: '6px' }}
                >
                  <XCircle size={16} /> Reject Registration
                </Button>

                <Button
                  onClick={() => handleStatusChange(selectedOrg.id, 'verified')}
                  disabled={actionLoading}
                  style={{ backgroundColor: '#22c55e', color: '#fff', gap: '6px' }}
                >
                  <CheckCircle2 size={16} /> {actionLoading ? 'Updating...' : 'Approve & Verify Organization'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Feedback Popup Modal */}
      {feedbackPopup && (
        <div style={{ ...modalOverlayStyle, zIndex: 1200 }} onClick={() => setFeedbackPopup(null)}>
          <div
            style={{
              ...modalContentStyle,
              maxWidth: '440px',
              textAlign: 'center',
              padding: '36px 28px',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: feedbackPopup.status === 'verified' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}
            >
              {feedbackPopup.status === 'verified' ? (
                <CheckCircle2 size={36} color="#22c55e" />
              ) : (
                <XCircle size={36} color="#ef4444" />
              )}
            </div>

            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>
              {feedbackPopup.status === 'verified' ? 'Organization Approved!' : 'Registration Rejected'}
            </h3>

            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '24px' }}>
              <strong>{feedbackPopup.orgName}</strong> status has been updated to{' '}
              <span style={{ color: feedbackPopup.status === 'verified' ? '#22c55e' : '#ef4444', fontWeight: 700 }}>
                {feedbackPopup.status.toUpperCase()}
              </span>.
            </p>

            <Button
              onClick={() => {
                setFeedbackPopup(null);
                setSelectedOrg(null);
              }}
              style={{
                width: '100%',
                backgroundColor: feedbackPopup.status === 'verified' ? '#22c55e' : 'var(--bg-tertiary)',
                color: '#ffffff',
                fontWeight: 600,
              }}
            >
              Done & Close
            </Button>
          </div>
        </div>
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
  maxWidth: '720px',
  maxHeight: '90vh',
  overflowY: 'auto',
  padding: '28px',
  boxShadow: '0 24px 48px rgba(0,0,0,0.5)',
};

const infoBoxStyle: React.CSSProperties = {
  backgroundColor: 'var(--bg-secondary)',
  padding: '16px',
  borderRadius: '12px',
  border: '1px solid var(--border-color)',
};

const detailItemStyle: React.CSSProperties = {
  fontSize: '0.8125rem',
  color: 'var(--text-secondary)',
  margin: '4px 0',
};
