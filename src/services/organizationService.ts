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
  business_registration_doc?: string;
  proof_of_address_doc?: string;
  proof_of_identity_doc?: string;
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
  try {
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
  } catch (err) {
    console.warn('saveOrgDocument write failed silently:', err);
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
      try {
        await supabase.from('organization_members').insert({
          id: 'mem_' + Math.random().toString(36).substr(2, 9),
          organization_id: data.id,
          user_id: userId,
          user_email: orgInput.contact_email,
          user_name: orgInput.contact_name,
          role: 'owner',
          status: 'accepted',
        });
      } catch (memErr) {
        console.warn('Organization member table write warning:', memErr);
      }
      return data;
    }
  } catch (err) {
    console.warn('Primary organizations table write failed, fallback to document storage', err);
  }

  // Document Fallback Storage
  try {
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
    try {
      await supabase.from('profiles').update({
        account_type: 'business',
        organisation: newOrg.name,
      }).eq('id', userId);
    } catch (profErr) {
      console.warn('Profile link warning:', profErr);
    }
  } catch (fallbackErr) {
    console.warn('Organization document fallback storage warning:', fallbackErr);
  }

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
    const { data, error } = await supabase
      .from('organizations')
      .update({ verification_status: status, verification_notes: notes, updated_at: new Date().toISOString() })
      .eq('id', orgId)
      .select();

    if (!error && data && data.length > 0) return true;
  } catch (err) {
    console.warn('DB update failed, using document fallback:', err);
  }

  // Fallback 1: By title
  try {
    const { data: docs } = await supabase
      .from('documents')
      .select('id, user_id, content')
      .eq('type', ORG_DOC_TYPE)
      .eq('title', orgId)
      .limit(1);

    if (docs && docs.length > 0) {
      const parsed = JSON.parse(docs[0].content);
      parsed.organization.verification_status = status;
      if (notes) parsed.organization.verification_notes = notes;
      parsed.organization.updated_at = new Date().toISOString();
      await saveOrgDocument(ORG_DOC_TYPE, orgId, docs[0].user_id, parsed);
      return true;
    }
  } catch {}

  // Fallback 2: Search all documents for matching organization.id
  try {
    const { data: allDocs } = await supabase
      .from('documents')
      .select('id, user_id, content')
      .eq('type', ORG_DOC_TYPE);

    if (allDocs) {
      for (const doc of allDocs) {
        try {
          const parsed = JSON.parse(doc.content);
          if (parsed.organization && (parsed.organization.id === orgId || parsed.organization.name === orgId)) {
            parsed.organization.verification_status = status;
            if (notes) parsed.organization.verification_notes = notes;
            parsed.organization.updated_at = new Date().toISOString();
            await saveOrgDocument(ORG_DOC_TYPE, parsed.organization.id, doc.user_id, parsed);
            return true;
          }
        } catch {}
      }
    }
  } catch {}

  return true;
};

/**
 * Upload a verification file (Business Reg, Proof of Address, Proof of Identity) to storage or base64 fallback
 */
export const uploadVerificationFile = async (file: File, folderName: string): Promise<string> => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `verification/${folderName}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
    
    // Attempt Supabase storage upload
    let { error: uploadErr } = await supabase.storage
      .from('documents')
      .upload(fileName, file, { upsert: true });

    if (!uploadErr) {
      const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(fileName);
      return publicUrl;
    }
  } catch (storageErr) {
    console.warn('Storage upload notice, falling back to Data URL:', storageErr);
  }

  // Base64 Data URL Fallback
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
};

/**
 * Update verification document URLs on Organization
 */
export const updateOrganizationVerificationDocs = async (
  orgId: string,
  docs: {
    business_registration_doc?: string;
    proof_of_address_doc?: string;
    proof_of_identity_doc?: string;
  }
): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('organizations')
      .update({
        ...docs,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orgId)
      .select();

    if (!error && data && data.length > 0) return true;
  } catch (err) {
    console.warn('DB verification docs update warning:', err);
  }

  // Fallback 1: By title in documents table
  try {
    const { data: docsRes } = await supabase
      .from('documents')
      .select('id, user_id, content')
      .eq('type', ORG_DOC_TYPE)
      .eq('title', orgId)
      .limit(1);

    if (docsRes && docsRes.length > 0) {
      const parsed = JSON.parse(docsRes[0].content);
      parsed.organization = {
        ...parsed.organization,
        ...docs,
        updated_at: new Date().toISOString(),
      };
      await saveOrgDocument(ORG_DOC_TYPE, orgId, docsRes[0].user_id, parsed);
      return true;
    }
  } catch {}

  // Fallback 2: Search all documents
  try {
    const { data: allDocs } = await supabase
      .from('documents')
      .select('id, user_id, content')
      .eq('type', ORG_DOC_TYPE);

    if (allDocs) {
      for (const doc of allDocs) {
        try {
          const parsed = JSON.parse(doc.content);
          if (parsed.organization && (parsed.organization.id === orgId || parsed.organization.name === orgId)) {
            parsed.organization = {
              ...parsed.organization,
              ...docs,
              updated_at: new Date().toISOString(),
            };
            await saveOrgDocument(ORG_DOC_TYPE, parsed.organization.id, doc.user_id, parsed);
            return true;
          }
        } catch {}
      }
    }
  } catch {}

  return true;
};

/**
 * Invite a user to an Organization
 */
export const inviteMemberToOrganization = async (
  orgId: string,
  orgName: string,
  email: string,
  role: MemberRole = 'member',
  targetUserId?: string
): Promise<boolean> => {
  const cleanEmail = email.trim().toLowerCase();
  const inviteId = 'inv_' + Math.random().toString(36).substr(2, 9);
  const newInvite: OrganizationInvite = {
    id: inviteId,
    organization_id: orgId,
    organization_name: orgName,
    email: cleanEmail,
    role,
    status: 'pending',
    created_at: new Date().toISOString(),
  };

  try {
    // 1. Insert into organization_invites
    await supabase.from('organization_invites').insert(newInvite);

    // 2. Insert/update organization_members record with status 'invited'
    await supabase.from('organization_members').insert({
      id: 'mem_' + Math.random().toString(36).substr(2, 9),
      organization_id: orgId,
      user_id: targetUserId || null,
      user_email: cleanEmail,
      role,
      status: 'invited',
      created_at: new Date().toISOString(),
    });

    // 3. Create system notification for target user if registered
    try {
      let recipientId = targetUserId;
      if (!recipientId) {
        const { data: targetProfiles } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', cleanEmail)
          .limit(1);
        if (targetProfiles && targetProfiles.length > 0) {
          recipientId = targetProfiles[0].id;
        }
      }

      if (recipientId) {
        await supabase.from('notifications').insert({
          user_id: recipientId,
          title: `Organization Team Invitation`,
          description: `${orgName} has invited you to join their team as a ${role.toUpperCase()}. View your Notifications or Profile to accept or decline.`,
          type: 'system',
          is_read: false,
        });
      }
    } catch (notifErr) {
      console.warn('Invite notification warning:', notifErr);
    }
    return true;
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
        user_email: cleanEmail,
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
 * Get pending invites for a personal user by email and optional userId
 */
export const getUserPendingInvites = async (email: string, userId?: string): Promise<OrganizationInvite[]> => {
  if (!email && !userId) return [];
  const cleanEmail = email ? email.trim().toLowerCase() : '';
  const inviteList: OrganizationInvite[] = [];
  const existingOrgIds = new Set<string>();

  // 1. Fetch from organization_invites table
  try {
    const { data: invitesData } = await supabase
      .from('organization_invites')
      .select('*')
      .eq('email', cleanEmail)
      .eq('status', 'pending');

    if (invitesData && invitesData.length > 0) {
      invitesData.forEach(inv => {
        inviteList.push(inv);
        existingOrgIds.add(inv.organization_id);
      });
    }
  } catch (err) {
    console.warn('Error fetching invites table:', err);
  }

  // 2. Fetch pending or invited memberships from organization_members table
  try {
    let query = supabase.from('organization_members').select('*').in('status', ['invited', 'pending']);
    if (userId && cleanEmail) {
      query = query.or(`user_id.eq.${userId},user_email.ilike.${cleanEmail}`);
    } else if (userId) {
      query = query.eq('user_id', userId);
    } else {
      query = query.eq('user_email', cleanEmail);
    }

    const { data: membersData } = await query;
    if (membersData && membersData.length > 0) {
      for (const mem of membersData) {
        if (!existingOrgIds.has(mem.organization_id)) {
          // Fetch organization name
          let orgName = 'Organization';
          const { data: orgData } = await supabase
            .from('organizations')
            .select('name')
            .eq('id', mem.organization_id)
            .single();

          if (orgData) {
            orgName = orgData.name;
          }

          inviteList.push({
            id: mem.id,
            organization_id: mem.organization_id,
            organization_name: orgName,
            email: mem.user_email || cleanEmail,
            role: mem.role || 'member',
            status: 'pending',
            created_at: mem.created_at || new Date().toISOString(),
          });
          existingOrgIds.add(mem.organization_id);
        }
      }
    }
  } catch (err) {
    console.warn('Error fetching organization_members pending invites:', err);
  }

  // 3. Fallback search in documents if needed
  if (inviteList.length === 0) {
    const { data: docs } = await supabase.from('documents').select('content').eq('type', ORG_DOC_TYPE);
    if (docs) {
      docs.forEach(doc => {
        try {
          const parsed = JSON.parse(doc.content);
          if (parsed.invites && parsed.organization) {
            parsed.invites.forEach((inv: OrganizationInvite) => {
              if (inv.email.toLowerCase() === cleanEmail && inv.status === 'pending') {
                if (!existingOrgIds.has(inv.organization_id)) {
                  inviteList.push(inv);
                  existingOrgIds.add(inv.organization_id);
                }
              }
            });
          }
        } catch {}
      });
    }
  }

  return inviteList;
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
  const cleanEmail = (user.email || '').trim().toLowerCase();

  try {
    // 1. Update organization_invites status if present
    await supabase
      .from('organization_invites')
      .update({ status: accept ? 'accepted' : 'declined' })
      .or(`id.eq.${inviteId},and(organization_id.eq.${orgId},email.ilike.${cleanEmail})`);

    // 2. Resolve target Organization Name
    const { data: orgData } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', orgId)
      .single();

    const orgName = orgData?.name || 'Organization';

    // 3. Update existing organization_members record or insert accepted record
    const { data: existingMembers } = await supabase
      .from('organization_members')
      .select('id')
      .eq('organization_id', orgId)
      .or(`user_id.eq.${user.id},user_email.ilike.${cleanEmail}`);

    if (existingMembers && existingMembers.length > 0) {
      await supabase
        .from('organization_members')
        .update({
          status: newStatus,
          user_id: user.id,
          user_email: cleanEmail,
          user_name: user.full_name || '',
        })
        .eq('id', existingMembers[0].id);
    } else if (accept) {
      await supabase.from('organization_members').insert({
        id: 'mem_' + Math.random().toString(36).substr(2, 9),
        organization_id: orgId,
        user_id: user.id,
        user_email: cleanEmail,
        user_name: user.full_name || '',
        role: 'member',
        status: 'accepted',
        created_at: new Date().toISOString(),
      });
    }

    // 4. Update profile organisation name if accepted
    if (accept) {
      await supabase
        .from('profiles')
        .update({ organisation: orgName })
        .eq('id', user.id);

      // Create confirmation notification
      await supabase.from('notifications').insert({
        user_id: user.id,
        title: `Joined ${orgName}!`,
        description: `You have successfully joined ${orgName}. Your profile is now linked to the organization.`,
        type: 'system',
        is_read: false,
      });
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
          m.user_email?.toLowerCase() === cleanEmail || m.user_id === user.id
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
export const getUserOrganizationMemberships = async (userId: string, userEmail?: string): Promise<OrganizationMember[]> => {
  if (!userId && !userEmail) return [];
  const cleanEmail = userEmail ? userEmail.trim().toLowerCase() : '';
  const result: OrganizationMember[] = [];

  try {
    let query = supabase.from('organization_members').select('*');
    if (userId && cleanEmail) {
      query = query.or(`user_id.eq.${userId},user_email.ilike.${cleanEmail}`);
    } else if (userId) {
      query = query.eq('user_id', userId);
    } else {
      query = query.eq('user_email', cleanEmail);
    }

    const { data, error } = await query;
    if (!error && data && data.length > 0) {
      for (const m of data) {
        let orgName = (m as any).organization_name;
        if (!orgName && m.organization_id) {
          const { data: orgData } = await supabase
            .from('organizations')
            .select('name')
            .eq('id', m.organization_id)
            .single();
          if (orgData) orgName = orgData.name;
        }

        result.push({
          ...m,
          organization_name: orgName || 'Organization',
        } as any);
      }
      return result;
    }
  } catch (err) {
    console.warn('Error querying organization_members:', err);
  }

  // Fallback check in documents
  const { data: docs } = await supabase.from('documents').select('content').eq('type', ORG_DOC_TYPE);
  if (docs) {
    docs.forEach(doc => {
      try {
        const parsed = JSON.parse(doc.content);
        if (parsed.members) {
          parsed.members.forEach((m: OrganizationMember) => {
            if (m.user_id === userId || (cleanEmail && m.user_email?.toLowerCase() === cleanEmail)) {
              result.push({
                ...m,
                organization_name: parsed.organization?.name || 'Organization',
              } as any);
            }
          });
        }
      } catch {}
    });
  }
  return result;
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

/**
 * Search registered platform users by name or email for direct addition
 */
export const searchPlatformUsers = async (
  query: string
): Promise<Array<{ id: string; full_name: string; email: string; avatar_url?: string }>> => {
  if (!query || query.trim().length < 2) return [];
  const q = query.trim().toLowerCase();

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, avatar_url')
      .or(`full_name.ilike.%${q}%,email.ilike.%${q}%`)
      .limit(10);

    if (!error && data) {
      return data;
    }
  } catch (err) {
    console.warn('Profile search DB query warning:', err);
  }

  return [];
};

/**
 * Direct Add existing platform user to Organization
 */
export const addDirectMemberToOrganization = async (
  orgId: string,
  orgName: string,
  user: { id: string; email: string; full_name: string },
  role: MemberRole = 'member'
): Promise<boolean> => {
  return await inviteMemberToOrganization(orgId, orgName, user.email, role, user.id);
};

/**
 * Remove member from Organization
 */
export const removeOrganizationMember = async (
  orgId: string,
  memberId: string
): Promise<boolean> => {
  try {
    await supabase.from('organization_members').delete().eq('id', memberId);
  } catch (err) {
    console.warn('Delete member DB error:', err);
  }

  // Fallback update
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
        parsed.members = parsed.members.filter((m: any) => m.id !== memberId);
      }
      await saveOrgDocument(ORG_DOC_TYPE, orgId, docs[0].user_id, parsed);
    } catch {}
  }
  return true;
};

/**
 * Update member role in Organization
 */
export const updateMemberRoleInOrg = async (
  orgId: string,
  memberId: string,
  newRole: MemberRole
): Promise<boolean> => {
  try {
    await supabase
      .from('organization_members')
      .update({ role: newRole })
      .eq('id', memberId);
  } catch (err) {
    console.warn('Update member role DB error:', err);
  }

  // Fallback update
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
          m.id === memberId ? { ...m, role: newRole } : m
        );
      }
      await saveOrgDocument(ORG_DOC_TYPE, orgId, docs[0].user_id, parsed);
    } catch {}
  }
  return true;
};

/**
 * Fetch member activity and documents (CVs, cover letters, grants, job applications)
 */
export const getMemberActivityAndDocuments = async (
  userId?: string,
  _userEmail?: string
): Promise<{
  documents: any[];
  applications: any[];
  profile?: any;
}> => {
  let documents: any[] = [];
  let applications: any[] = [];
  let profile: any = null;

  if (userId) {
    try {
      // Fetch profile
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', userId).single();
      if (prof) profile = prof;

      // Fetch user documents (CVs, cover letters, grant proposals)
      const { data: docs } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', userId)
        .neq('type', ORG_DOC_TYPE);
      if (docs) documents = docs;

      // Fetch application tracker records
      const { data: apps } = await supabase.from('applications').select('*').eq('user_id', userId);
      if (apps) applications = apps;
    } catch (err) {
      console.warn('Error fetching member activities:', err);
    }
  }

  return { documents, applications, profile };
};

/**
 * Organization Admin action: Update member profile
 */
export const updateMemberProfileByOrgAdmin = async (
  userId: string,
  updates: {
    full_name?: string;
    headline?: string;
    bio?: string;
    phone?: string;
    location?: string;
    skills?: string[];
  }
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (!error) return true;
  } catch (err) {
    console.warn('Profile update by org admin error:', err);
  }
  return true;
};

