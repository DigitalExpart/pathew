import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { 
  Building2, 
  FileCheck, 
  ShieldCheck, 
  Upload, 
  CheckCircle2, 
  X, 
  AlertCircle, 
  FileText, 
  Loader2,
  ExternalLink
} from 'lucide-react';
import { uploadVerificationFile, updateOrganizationVerificationDocs } from '../../services/organizationService';

interface BusinessVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  orgId: string;
  orgName?: string;
  initialBusinessDoc?: string;
  initialAddressDoc?: string;
  initialIdentityDoc?: string;
  onComplete?: (docs: {
    business_registration_doc: string;
    proof_of_address_doc: string;
    proof_of_identity_doc: string;
  }) => void;
}

export const BusinessVerificationModal: React.FC<BusinessVerificationModalProps> = ({
  isOpen,
  onClose,
  orgId,
  orgName = 'your organization',
  initialBusinessDoc = '',
  initialAddressDoc = '',
  initialIdentityDoc = '',
  onComplete,
}) => {
  const [businessDoc, setBusinessDoc] = useState<string>(initialBusinessDoc);
  const [addressDoc, setAddressDoc] = useState<string>(initialAddressDoc);
  const [identityDoc, setIdentityDoc] = useState<string>(initialIdentityDoc);

  const [businessDocName, setBusinessDocName] = useState<string>(initialBusinessDoc ? 'Business_Registration_Doc' : '');
  const [addressDocName, setAddressDocName] = useState<string>(initialAddressDoc ? 'Proof_Of_Address_Doc' : '');
  const [identityDocName, setIdentityDocName] = useState<string>(initialIdentityDoc ? 'Proof_Of_Identity_Doc' : '');

  const [uploadingField, setUploadingField] = useState<'business' | 'address' | 'identity' | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    fieldType: 'business' | 'address' | 'identity'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      setError('File is too large. Please select a file smaller than 15MB.');
      return;
    }

    setError(null);
    setUploadingField(fieldType);

    try {
      const uploadedUrl = await uploadVerificationFile(file, fieldType);
      if (fieldType === 'business') {
        setBusinessDoc(uploadedUrl);
        setBusinessDocName(file.name);
      } else if (fieldType === 'address') {
        setAddressDoc(uploadedUrl);
        setAddressDocName(file.name);
      } else if (fieldType === 'identity') {
        setIdentityDoc(uploadedUrl);
        setIdentityDocName(file.name);
      }
    } catch (err: any) {
      console.error(`Error uploading ${fieldType} document:`, err);
      setError(`Failed to upload ${fieldType} document. Please try again.`);
    } finally {
      setUploadingField(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const ok = await updateOrganizationVerificationDocs(orgId, {
        business_registration_doc: businessDoc,
        proof_of_address_doc: addressDoc,
        proof_of_identity_doc: identityDoc,
      });

      if (ok) {
        setSuccessMsg('Verification documents submitted successfully! Admin will review your details.');
        if (onComplete) {
          onComplete({
            business_registration_doc: businessDoc,
            proof_of_address_doc: addressDoc,
            proof_of_identity_doc: identityDoc,
          });
        }
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setError('Failed to save documents. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while saving documents.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={overlayStyle}>
      <div style={modalContainerStyle}>
        <Card style={cardStyle}>
          {/* Header */}
          <div style={headerStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={iconBadgeStyle}>
                <Building2 size={24} color="#f59e0b" />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Verify Businesses
                </h2>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Upload means of verification for <strong style={{ color: '#f59e0b' }}>{orgName}</strong>
                </p>
              </div>
            </div>
            <button onClick={onClose} style={closeBtnStyle} aria-label="Close modal">
              <X size={20} />
            </button>
          </div>

          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: 1.5 }}>
            Please upload the following required documents immediately so our compliance team can verify and approve your organization.
          </p>

          {error && (
            <div style={errorBannerStyle}>
              <AlertCircle size={18} color="#ef4444" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div style={successBannerStyle}>
              <CheckCircle2 size={18} color="#10b981" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* 1. Business Registration uploads */}
            <div style={uploadBoxStyle}>
              <div style={uploadHeaderStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileCheck size={18} color="#3b82f6" />
                  <span style={uploadTitleStyle}>1. Business Registration Uploads</span>
                  <span style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 700 }}>*Required</span>
                </div>
                {businessDoc && (
                  <span style={badgeUploadedStyle}>
                    <CheckCircle2 size={13} /> Uploaded
                  </span>
                )}
              </div>
              <p style={uploadSubtextStyle}>
                CAC Certificate, Incorporation Certificate, Tax Registration, or Official Business License.
              </p>

              {businessDoc ? (
                <div style={fileUploadedRowStyle}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                    <FileText size={18} color="#60a5fa" />
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      {businessDocName || 'Business_Registration_Doc'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {businessDoc.startsWith('http') && (
                      <a href={businessDoc} target="_blank" rel="noopener noreferrer" style={linkBtnStyle} title="View Document">
                        <ExternalLink size={14} /> View
                      </a>
                    )}
                    <label style={changeBtnStyle}>
                      Change
                      <input
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx"
                        style={{ display: 'none' }}
                        onChange={e => handleFileUpload(e, 'business')}
                        disabled={uploadingField === 'business'}
                      />
                    </label>
                  </div>
                </div>
              ) : (
                <label style={dropzoneStyle}>
                  {uploadingField === 'business' ? (
                    <div style={uploadingFlexStyle}>
                      <Loader2 size={20} className="spin" color="#3b82f6" />
                      <span>Uploading document...</span>
                    </div>
                  ) : (
                    <>
                      <Upload size={20} color="var(--text-muted)" />
                      <span>Click to upload Business Registration document</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>PDF, PNG, JPG, DOCX (Max 15MB)</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx"
                    style={{ display: 'none' }}
                    onChange={e => handleFileUpload(e, 'business')}
                    disabled={uploadingField === 'business'}
                  />
                </label>
              )}
            </div>

            {/* 2. Proof of Address */}
            <div style={uploadBoxStyle}>
              <div style={uploadHeaderStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileText size={18} color="#10b981" />
                  <span style={uploadTitleStyle}>2. Proof of Address</span>
                  <span style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 700 }}>*Required</span>
                </div>
                {addressDoc && (
                  <span style={badgeUploadedStyle}>
                    <CheckCircle2 size={13} /> Uploaded
                  </span>
                )}
              </div>
              <p style={uploadSubtextStyle}>
                Utility Bill (Electricity/Water), Bank Statement, or Business Lease Agreement (issued within 3 months).
              </p>

              {addressDoc ? (
                <div style={fileUploadedRowStyle}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                    <FileText size={18} color="#34d399" />
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      {addressDocName || 'Proof_Of_Address_Doc'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {addressDoc.startsWith('http') && (
                      <a href={addressDoc} target="_blank" rel="noopener noreferrer" style={linkBtnStyle} title="View Document">
                        <ExternalLink size={14} /> View
                      </a>
                    )}
                    <label style={changeBtnStyle}>
                      Change
                      <input
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx"
                        style={{ display: 'none' }}
                        onChange={e => handleFileUpload(e, 'address')}
                        disabled={uploadingField === 'address'}
                      />
                    </label>
                  </div>
                </div>
              ) : (
                <label style={dropzoneStyle}>
                  {uploadingField === 'address' ? (
                    <div style={uploadingFlexStyle}>
                      <Loader2 size={20} className="spin" color="#10b981" />
                      <span>Uploading document...</span>
                    </div>
                  ) : (
                    <>
                      <Upload size={20} color="var(--text-muted)" />
                      <span>Click to upload Proof of Address document</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>PDF, PNG, JPG, DOCX (Max 15MB)</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx"
                    style={{ display: 'none' }}
                    onChange={e => handleFileUpload(e, 'address')}
                    disabled={uploadingField === 'address'}
                  />
                </label>
              )}
            </div>

            {/* 3. Proof of Identity */}
            <div style={uploadBoxStyle}>
              <div style={uploadHeaderStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldCheck size={18} color="#f59e0b" />
                  <span style={uploadTitleStyle}>3. Proof of Identity</span>
                  <span style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 700 }}>*Required</span>
                </div>
                {identityDoc && (
                  <span style={badgeUploadedStyle}>
                    <CheckCircle2 size={13} /> Uploaded
                  </span>
                )}
              </div>
              <p style={uploadSubtextStyle}>
                Director or Authorized Signatory's International Passport, National ID card, or Driver's License.
              </p>

              {identityDoc ? (
                <div style={fileUploadedRowStyle}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                    <FileText size={18} color="#fbbf24" />
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      {identityDocName || 'Proof_Of_Identity_Doc'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {identityDoc.startsWith('http') && (
                      <a href={identityDoc} target="_blank" rel="noopener noreferrer" style={linkBtnStyle} title="View Document">
                        <ExternalLink size={14} /> View
                      </a>
                    )}
                    <label style={changeBtnStyle}>
                      Change
                      <input
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx"
                        style={{ display: 'none' }}
                        onChange={e => handleFileUpload(e, 'identity')}
                        disabled={uploadingField === 'identity'}
                      />
                    </label>
                  </div>
                </div>
              ) : (
                <label style={dropzoneStyle}>
                  {uploadingField === 'identity' ? (
                    <div style={uploadingFlexStyle}>
                      <Loader2 size={20} className="spin" color="#f59e0b" />
                      <span>Uploading document...</span>
                    </div>
                  ) : (
                    <>
                      <Upload size={20} color="var(--text-muted)" />
                      <span>Click to upload Proof of Identity document</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>PDF, PNG, JPG, DOCX (Max 15MB)</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx"
                    style={{ display: 'none' }}
                    onChange={e => handleFileUpload(e, 'identity')}
                    disabled={uploadingField === 'identity'}
                  />
                </label>
              )}
            </div>

            {/* Submit / Action Buttons */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
              <Button
                type="submit"
                style={{ flex: 1, backgroundColor: '#f59e0b', color: '#0f172a', fontWeight: 700 }}
                disabled={saving || uploadingField !== null}
              >
                {saving ? 'Submitting Verification...' : 'Submit Verification Documents'}
              </Button>

              <button
                type="button"
                onClick={onClose}
                style={skipBtnStyle}
              >
                Skip for now
              </button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

// CSS Styles
const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(15, 23, 42, 0.82)',
  backdropFilter: 'blur(6px)',
  zIndex: 99999,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '16px',
};

const modalContainerStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: '680px',
  maxHeight: '90vh',
  overflowY: 'auto',
};

const cardStyle: React.CSSProperties = {
  padding: '24px',
  backgroundColor: '#0f172a',
  border: '1px solid rgba(245, 158, 11, 0.25)',
  borderRadius: '16px',
  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: '16px',
  paddingBottom: '14px',
  borderBottom: '1px solid var(--border-color)',
};

const iconBadgeStyle: React.CSSProperties = {
  width: '44px',
  height: '44px',
  borderRadius: '12px',
  backgroundColor: 'rgba(245, 158, 11, 0.12)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const closeBtnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: 'var(--text-muted)',
  cursor: 'pointer',
  padding: '6px',
  borderRadius: '8px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const uploadBoxStyle: React.CSSProperties = {
  backgroundColor: 'var(--bg-secondary)',
  border: '1px solid var(--border-color)',
  borderRadius: '12px',
  padding: '14px 16px',
};

const uploadHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: '4px',
};

const uploadTitleStyle: React.CSSProperties = {
  fontWeight: 700,
  fontSize: '0.925rem',
  color: 'var(--text-primary)',
};

const uploadSubtextStyle: React.CSSProperties = {
  fontSize: '0.8rem',
  color: 'var(--text-muted)',
  marginBottom: '10px',
};

const dropzoneStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '4px',
  padding: '16px',
  border: '1.5px dashed var(--border-color)',
  borderRadius: '8px',
  backgroundColor: 'rgba(15, 23, 42, 0.4)',
  cursor: 'pointer',
  fontSize: '0.825rem',
  color: 'var(--text-secondary)',
  transition: 'border-color 0.2s',
};

const uploadingFlexStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  fontWeight: 600,
};

const fileUploadedRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  backgroundColor: 'rgba(15, 23, 42, 0.7)',
  border: '1px solid var(--border-color)',
  borderRadius: '8px',
  padding: '10px 12px',
};

const badgeUploadedStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '4px',
  fontSize: '0.75rem',
  fontWeight: 700,
  color: '#10b981',
  backgroundColor: 'rgba(16, 185, 129, 0.12)',
  padding: '3px 8px',
  borderRadius: '6px',
};

const changeBtnStyle: React.CSSProperties = {
  fontSize: '0.775rem',
  fontWeight: 600,
  color: 'var(--text-secondary)',
  backgroundColor: 'var(--bg-tertiary)',
  padding: '4px 10px',
  borderRadius: '6px',
  cursor: 'pointer',
};

const linkBtnStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '4px',
  fontSize: '0.775rem',
  fontWeight: 600,
  color: '#3b82f6',
  textDecoration: 'none',
};

const skipBtnStyle: React.CSSProperties = {
  padding: '10px 16px',
  borderRadius: '8px',
  border: '1px solid var(--border-color)',
  backgroundColor: 'transparent',
  color: 'var(--text-secondary)',
  fontWeight: 600,
  cursor: 'pointer',
  fontSize: '0.875rem',
};

const errorBannerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  backgroundColor: 'rgba(239, 68, 68, 0.12)',
  border: '1px solid rgba(239, 68, 68, 0.3)',
  color: '#f87171',
  padding: '10px 14px',
  borderRadius: '8px',
  fontSize: '0.85rem',
  marginBottom: '16px',
};

const successBannerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  backgroundColor: 'rgba(16, 185, 129, 0.12)',
  border: '1px solid rgba(16, 185, 129, 0.3)',
  color: '#34d399',
  padding: '10px 14px',
  borderRadius: '8px',
  fontSize: '0.85rem',
  marginBottom: '16px',
};
