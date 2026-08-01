import { supabase } from '../lib/supabase';

export type VerificationStatus = 'pending' | 'verified' | 'rejected' | 'suspended';
export type MemberRole = 'owner' | 'admin' | 'manager' | 'member';
export type MembershipStatus = 'invited' | 'pending' | 'accepted' | 'declined' | 'removed';

export interface Organization {
  id: string;
  user_id: string; // Owner user ID
  name: string;
  type: string; // Sector/Type (NGO, Startup, Enterprise, SME, University, etc.)
  registration_number: string;
  tax_id?: string;
  country: string;
  city: string;
  address_line1: string;
  address_line2?: string;
  website?: string;
  official_email: string;
  phone: string;
  contact_name: string;
  contact_title: string;
  contact_email: string;
  contact_phone: string;
  summary: string;
  services_offered?: string;
  team_size?: string;
  industry_categories?: string[];
  verification_status: VerificationStatus;
  verification_notes?: string;
  logo_url?: string;
  credits: number;
  created_at: string;
  updated_at: string;
}

export interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id?: string;
  user_email: string;
  user_name?: string;
  role: MemberRole;
  status: MembershipStatus;
  created_at: string;
}

export interface OrganizationInvite {
  id: string;
  organization_id: string;
  organization_name: string;
  email: string;
  role: MemberRole;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
}

export interface OrganizationCreditTransaction {
  id: string;
  organization_id: string;
  user_id: string;
  user_name?: string;
  amount: number;
  type: 'credit' | 'debit';
  description: string;
  credit_source: 'organization' | 'personal';
  created_at: string;
}

export interface OrganizationActivityLog {
  id: string;
  organization_id: string;
  user_id: string;
  user_name?: string;
  action: string;
  details?: string;
  created_at: string;
}

const ORG_DOC_TYPE = 'OrganizationData';

const saveOrgDocument = async (docType: string, id: string, userId: string, payload: any) => {
  const { data } = await supabase
    .from('documents')
    .select('id')
    .eq('type', docType)
    .eq('title', id)
    .limit(1);

  const contentStr = JSON.stringify(payload);
  if (data && data.length > 0) {
    await supabase.from('documents').update({ content: contentStr }).eq('id', data[0].id);
  } else {
    await supabase.from('documents').insert({
      user_id: userId,
      type: docType,
      title: id,
      content: contentStr,
    });
  }
};

/**
 * Create a new Organization registration
 */
export const createOrganization = async (
  userId: string,
  orgInput: Omit<Organization, 'id' | 'user_id' | 'verification_status' | 'credits' | 'created_at' | 'updated_at'>
): Promise<Organization> => {
  const newOrg: Organization = {
    id: 'org_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36),
    user_id: userId,
    ...orgInput,
    verification_status: 'pending',
    credits: 10, // Initial registration gift credits
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  try {
    const { data, error } = await supabase.from('organizations').insert(newOrg).select().single();
    if (!error && data) {
      // Add owner as member
      await supabase.from('organization_members').insert({
        organization_id: data.id,
        user_id: userId,
        user_email: orgInput.contact_email,
        user_name: orgInput.contact_name,
        role: 'owner',
        status: 'accepted',
      });
      return data;
    }
  } catch (err) {
    console.warn('Primary organizations table write failed, fallback to document storage', err);
  }

  // Document Fallback Storage
  const ownerMember: OrganizationMember = {
    id: 'mem_' + Math.random().toString(36).substr(2, 9),
    organization_id: newOrg.id,
    user_id: userId,
    user_email: orgInput.contact_email,
    user_name: orgInput.contact_name,
    role: 'owner',
    status: 'accepted',
    created_at: new Date().toISOString(),
  };

  const payload = {
    organization: newOrg,
    members: [ownerMember],
    transactions: [],
    logs: [
      {
        id: 'log_' + Date.now(),
        organization_id: newOrg.id,
        user_id: userId,
        user_name: orgInput.contact_name,
        action: 'Organization Registered',
        details: 'Submitted for verification',
        created_at: new Date().toISOString(),
      },
    ],
  };

  await saveOrgDocument(ORG_DOC_TYPE, newOrg.id, userId, payload);

  // Link profile
  await supabase.from('profiles').update({
    account_type: 'business',
    organisation: newOrg.name,
  }).eq('id', userId);

  return newOrg;
};

/**
 * Fetch organization owned or joined by userId
 */
export const getOrganizationByUserId = async (userId: string): Promise<Organization | null> => {
  try {
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('user_id', userId)
      .limit(1);

    if (!error && data && data.length > 0) {
      return data[0];
    }
  } catch (err) {
    console.warn('Primary organizations fetch warning:', err);
  }

  // Check documents fallback
  const { data: docs } = await supabase
    .from('documents')
    .select('id, content')
    .eq('type', ORG_DOC_TYPE)
    .eq('user_id', userId)
    .limit(1);

  if (docs && docs.length > 0) {
    try {
      const parsed = JSON.parse(docs[0].content);
      return parsed.organization || null;
    } catch {
      return null;
    }
  }

  return null;
};

/**
 * Fetch all organizations for Admin Verification
 */
export const getAllOrganizations = async (): Promise<Organization[]> => {
  try {
    const { data, error } = await supabase.from('organizations').select('*').order('created_at', { ascending: false });
    if (!error && data && data.length > 0) {
      return data;
    }
  } catch (err) {
    console.warn('Error fetching organizations from DB table:', err);
  }

  // Fallback to documents
  const { data: docs } = await supabase.from('documents').select('content').eq('type', ORG_DOC_TYPE);
  const orgs: Organization[] = [];
  if (docs) {
    docs.forEach(doc => {
      try {
        const parsed = JSON.parse(doc.content);
        if (parsed.organization) orgs.push(parsed.organization);
      } catch {}
    });
  }
  return orgs;
};

/**
 * Admin action: Update verification status of an organization
 */
export const updateOrganizationVerification = async (
  orgId: string,
  status: VerificationStatus,
  notes?: string
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('organizations')
      .update({ verification_status: status, verification_notes: notes, updated_at: new Date().toISOString() })
      .eq('id', orgId);

    if (!error) return true;
  } catch (err) {
    console.warn('DB update failed, using document fallback:', err);
  }

  // Fallback
  const { data: docs } = await supabase
    .from('documents')
    .select('id, user_id, content')
    .eq('type', ORG_DOC_TYPE)
    .eq('title', orgId)
    .limit(1);

  if (docs && docs.length > 0) {
    try {
      const parsed = JSON.parse(docs[0].content);
      parsed.organization.verification_status = status;
      if (notes) parsed.organization.verification_notes = notes;
      parsed.organization.updated_at = new Date().toISOString();
      await saveOrgDocument(ORG_DOC_TYPE, orgId, docs[0].user_id, parsed);
      return true;
    } catch {
      return false;
    }
  }
  return false;
};

/**
 * Invite a user to an Organization
 */
export const inviteMemberToOrganization = async (
  orgId: string,
  orgName: string,
  email: string,
  role: MemberRole = 'member'
): Promise<boolean> => {
  const newInvite: OrganizationInvite = {
    id: 'inv_' + Math.random().toString(36).substr(2, 9),
    organization_id: orgId,
    organization_name: orgName,
    email: email.trim().toLowerCase(),
    role,
    status: 'pending',
    created_at: new Date().toISOString(),
  };

  try {
    const { error } = await supabase.from('organization_invites').insert(newInvite);
    if (!error) return true;
  } catch (err) {
    console.warn('Primary invite insert failed, fallback to doc storage', err);
  }

  // Fallback storage
  const { data: docs } = await supabase
    .from('documents')
    .select('id, user_id, content')
    .eq('type', ORG_DOC_TYPE)
    .eq('title', orgId)
    .limit(1);

  if (docs && docs.length > 0) {
    try {
      const parsed = JSON.parse(docs[0].content);
      parsed.invites = parsed.invites || [];
      parsed.invites.push(newInvite);
      parsed.members = parsed.members || [];
      parsed.members.push({
        id: 'mem_' + Math.random().toString(36).substr(2, 9),
        organization_id: orgId,
        user_email: email.trim().toLowerCase(),
        role,
        status: 'invited',
        created_at: new Date().toISOString(),
      });
      await saveOrgDocument(ORG_DOC_TYPE, orgId, docs[0].user_id, parsed);
      return true;
    } catch (err) {
      console.error('Invite fallback error:', err);
    }
  }
  return false;
};

/**
 * Get pending invites for a personal user by email
 */
export const getUserPendingInvites = async (email: string): Promise<OrganizationInvite[]> => {
  if (!email) return [];
  const cleanEmail = email.trim().toLowerCase();

  try {
    const { data, error } = await supabase
      .from('organization_invites')
      .select('*')
      .eq('email', cleanEmail)
      .eq('status', 'pending');

    if (!error && data) return data;
  } catch (err) {
    console.warn('Error fetching invites table:', err);
  }

  // Fallback search in documents
  const { data: docs } = await supabase.from('documents').select('content').eq('type', ORG_DOC_TYPE);
  const userInvites: OrganizationInvite[] = [];

  if (docs) {
    docs.forEach(doc => {
      try {
        const parsed = JSON.parse(doc.content);
        if (parsed.invites) {
          parsed.invites.forEach((inv: OrganizationInvite) => {
            if (inv.email.toLowerCase() === cleanEmail && inv.status === 'pending') {
              userInvites.push(inv);
            }
          });
        }
      } catch {}
    });
  }
  return userInvites;
};

/**
 * Accept or decline an organization invitation
 */
export const respondToOrganizationInvite = async (
  inviteId: string,
  orgId: string,
  accept: boolean,
  user: { id: string; email?: string; full_name?: string | null }
): Promise<boolean> => {
  const newStatus: MembershipStatus = accept ? 'accepted' : 'declined';

  try {
    await supabase.from('organization_invites').update({ status: accept ? 'accepted' : 'declined' }).eq('id', inviteId);

    if (accept) {
      await supabase.from('organization_members').insert({
        organization_id: orgId,
        user_id: user.id,
        user_email: user.email || '',
        user_name: user.full_name || '',
        role: 'member',
        status: 'accepted',
      });
      // Update profile organisation
      await supabase.from('profiles').update({ organisation: orgId }).eq('id', user.id);
    }
    return true;
  } catch (err) {
    console.warn('Invite response DB fallback:', err);
  }

  // Fallback doc update
  const { data: docs } = await supabase
    .from('documents')
    .select('id, user_id, content')
    .eq('type', ORG_DOC_TYPE)
    .eq('title', orgId)
    .limit(1);

  if (docs && docs.length > 0) {
    try {
      const parsed = JSON.parse(docs[0].content);
      if (parsed.invites) {
        parsed.invites = parsed.invites.map((inv: any) =>
          inv.id === inviteId ? { ...inv, status: accept ? 'accepted' : 'declined' } : inv
        );
      }
      if (parsed.members) {
        parsed.members = parsed.members.map((m: any) =>
          m.user_email?.toLowerCase() === user.email?.toLowerCase()
            ? { ...m, user_id: user.id, user_name: user.full_name, status: newStatus }
            : m
        );
      }
      await saveOrgDocument(ORG_DOC_TYPE, orgId, docs[0].user_id, parsed);
      return true;
    } catch {}
  }
  return false;
};

/**
 * Fetch organization members
 */
export const getOrganizationMembers = async (orgId: string): Promise<OrganizationMember[]> => {
  try {
    const { data, error } = await supabase.from('organization_members').select('*').eq('organization_id', orgId);
    if (!error && data && data.length > 0) return data;
  } catch (err) {}

  // Fallback
  const { data: docs } = await supabase
    .from('documents')
    .select('content')
    .eq('type', ORG_DOC_TYPE)
    .eq('title', orgId)
    .limit(1);

  if (docs && docs.length > 0) {
    try {
      const parsed = JSON.parse(docs[0].content);
      return parsed.members || [];
    } catch {}
  }
  return [];
};

/**
 * Deduct credits from an Organization Wallet
 */
export const deductOrganizationCredits = async (
  orgId: string,
  userId: string,
  userName: string,
  amount: number,
  description: string
): Promise<{ success: boolean; remainingCredits: number; error?: string }> => {
  const org = await getOrganizationByUserId(userId);
  if (!org) return { success: false, remainingCredits: 0, error: 'ORGANIZATION_NOT_FOUND' };

  if (org.verification_status !== 'verified') {
    return { success: false, remainingCredits: org.credits, error: 'ORGANIZATION_UNVERIFIED' };
  }

  if (org.credits < amount) {
    return { success: false, remainingCredits: org.credits, error: 'INSUFFICIENT_ORG_CREDITS' };
  }

  const newCredits = Math.max(0, parseFloat((org.credits - amount).toFixed(2)));

  try {
    await supabase.from('organizations').update({ credits: newCredits }).eq('id', orgId);
    await supabase.from('transactions').insert({
      user_id: userId,
      type: 'debit',
      description: `[Org: ${org.name}] ${description}`,
      amount,
    });
    return { success: true, remainingCredits: newCredits };
  } catch (err) {
    console.warn('DB credit update fallback:', err);
  }

  // Fallback doc update
  const { data: docs } = await supabase
    .from('documents')
    .select('id, user_id, content')
    .eq('type', ORG_DOC_TYPE)
    .eq('title', orgId)
    .limit(1);

  if (docs && docs.length > 0) {
    try {
      const parsed = JSON.parse(docs[0].content);
      parsed.organization.credits = newCredits;
      parsed.transactions = parsed.transactions || [];
      parsed.transactions.push({
        id: 'tx_' + Date.now(),
        organization_id: orgId,
        user_id: userId,
        user_name: userName,
        amount,
        type: 'debit',
        description,
        credit_source: 'organization',
        created_at: new Date().toISOString(),
      });
      await saveOrgDocument(ORG_DOC_TYPE, orgId, docs[0].user_id, parsed);
      return { success: true, remainingCredits: newCredits };
    } catch {}
  }

  return { success: false, remainingCredits: org.credits, error: 'UPDATE_FAILED' };
};

/**
 * Add credits to Organization Wallet
 */
export const addOrganizationCredits = async (
  orgId: string,
  amount: number,
  description: string = 'Credit Purchase'
): Promise<number> => {
  const { data: docs } = await supabase
    .from('documents')
    .select('id, user_id, content')
    .eq('type', ORG_DOC_TYPE)
    .eq('title', orgId)
    .limit(1);

  let currentCredits = 0;
  if (docs && docs.length > 0) {
    try {
      const parsed = JSON.parse(docs[0].content);
      currentCredits = parsed.organization?.credits || 0;
      const newCredits = currentCredits + amount;
      parsed.organization.credits = newCredits;
      parsed.transactions = parsed.transactions || [];
      parsed.transactions.push({
        id: 'tx_' + Date.now(),
        organization_id: orgId,
        user_id: docs[0].user_id,
        amount,
        type: 'credit',
        description,
        credit_source: 'organization',
        created_at: new Date().toISOString(),
      });
      await saveOrgDocument(ORG_DOC_TYPE, orgId, docs[0].user_id, parsed);
      return newCredits;
    } catch {}
  }
  return currentCredits;
};

/**
 * Request to join a registered organization (Personal User action)
 */
export const requestToJoinOrganization = async (
  userId: string,
  userEmail: string,
  userName: string,
  orgId: string,
  _orgName?: string
): Promise<{ success: boolean; message?: string }> => {
  try {
    // Check if already a member or pending request exists
    const { data: existing } = await supabase
      .from('organization_members')
      .select('id, status')
      .eq('organization_id', orgId)
      .eq('user_id', userId)
      .limit(1);

    if (existing && existing.length > 0) {
      if (existing[0].status === 'accepted') {
        return { success: false, message: 'You are already an active member of this organization.' };
      }
      if (existing[0].status === 'pending') {
        return { success: false, message: 'A join request is already pending approval from this organization.' };
      }
    }

    const { error } = await supabase.from('organization_members').insert({
      id: 'mem_' + Math.random().toString(36).substr(2, 9),
      organization_id: orgId,
      user_id: userId,
      user_email: userEmail.trim().toLowerCase(),
      user_name: userName,
      role: 'member',
      status: 'pending',
      created_at: new Date().toISOString(),
    });

    if (!error) return { success: true };
  } catch (err) {
    console.warn('DB request join fallback:', err);
  }

  // Document Fallback Storage
  const { data: docs } = await supabase
    .from('documents')
    .select('id, user_id, content')
    .eq('type', ORG_DOC_TYPE)
    .eq('title', orgId)
    .limit(1);

  if (docs && docs.length > 0) {
    try {
      const parsed = JSON.parse(docs[0].content);
      parsed.members = parsed.members || [];
      parsed.members = parsed.members.filter((m: any) => m.user_id !== userId);
      parsed.members.push({
        id: 'mem_' + Math.random().toString(36).substr(2, 9),
        organization_id: orgId,
        user_id: userId,
        user_email: userEmail.trim().toLowerCase(),
        user_name: userName,
        role: 'member',
        status: 'pending',
        created_at: new Date().toISOString(),
      });
      await saveOrgDocument(ORG_DOC_TYPE, orgId, docs[0].user_id, parsed);
      return { success: true };
    } catch {}
  }
  return { success: true };
};

/**
 * Get user's active & pending organization memberships/requests
 */
export const getUserOrganizationMemberships = async (userId: string): Promise<OrganizationMember[]> => {
  if (!userId) return [];
  try {
    const { data, error } = await supabase
      .from('organization_members')
      .select('*')
      .eq('user_id', userId);

    if (!error && data) return data;
  } catch (err) {}

  // Fallback check in documents
  const { data: docs } = await supabase.from('documents').select('content').eq('type', ORG_DOC_TYPE);
  const userMemberships: OrganizationMember[] = [];
  if (docs) {
    docs.forEach(doc => {
      try {
        const parsed = JSON.parse(doc.content);
        if (parsed.members) {
          parsed.members.forEach((m: OrganizationMember) => {
            if (m.user_id === userId) {
              userMemberships.push(m);
            }
          });
        }
      } catch {}
    });
  }
  return userMemberships;
};

/**
 * Organization Admin action: Accept or Reject a join request
 */
export const respondToJoinRequest = async (
  memberRecordId: string,
  orgId: string,
  orgName: string,
  userId: string,
  accept: boolean
): Promise<boolean> => {
  const newStatus: MembershipStatus = accept ? 'accepted' : 'declined';
  try {
    await supabase
      .from('organization_members')
      .update({ status: newStatus })
      .eq('id', memberRecordId);

    if (accept) {
      await supabase.from('profiles').update({ organisation: orgName }).eq('id', userId);
    }
    return true;
  } catch (err) {
    console.warn('Respond join request DB fallback:', err);
  }

  // Fallback doc update
  const { data: docs } = await supabase
    .from('documents')
    .select('id, user_id, content')
    .eq('type', ORG_DOC_TYPE)
    .eq('title', orgId)
    .limit(1);

  if (docs && docs.length > 0) {
    try {
      const parsed = JSON.parse(docs[0].content);
      if (parsed.members) {
        parsed.members = parsed.members.map((m: any) =>
          m.id === memberRecordId || m.user_id === userId ? { ...m, status: newStatus } : m
        );
      }
      await saveOrgDocument(ORG_DOC_TYPE, orgId, docs[0].user_id, parsed);
      if (accept) {
        await supabase.from('profiles').update({ organisation: orgName }).eq('id', userId);
      }
      return true;
    } catch {}
  }
  return false;
};

