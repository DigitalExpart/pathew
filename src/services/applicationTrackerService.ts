import { supabase } from '../lib/supabase';

export interface ApplicationTrackerEntry {
  id: string;
  name: string;
  action: string;
  status: string;
  date: string;
  opportunityId?: string | null;
  notes?: string;
  deadline?: string;
}

export interface ApplicationTrackerData {
  entries: ApplicationTrackerEntry[];
}

export interface TrackerCreditDeduction {
  id: string;
  date: string;
  amount: number; // 0.25
  action: string;
  entryName: string;
}

export interface TrackerFailedAttempt {
  id: string;
  date: string;
  reason: string; // 'INSUFFICIENT_CREDITS'
  requiredCredits: number; // 0.25
  action: string;
  entryName: string;
}

export interface TrackerUsageData {
  totalActionsCount: number;
  freeActionsUsed: number;
  paidActionsUsed: number;
  creditDeductions: TrackerCreditDeduction[];
  failedAttempts: TrackerFailedAttempt[];
}

export interface TrackerActionResult {
  success: boolean;
  charged: boolean;
  freeRemaining: number;
  totalActionsCount: number;
  creditsDeducted?: number;
  creditsRemaining?: number;
  error?: 'INSUFFICIENT_CREDITS' | 'UNAUTHORIZED' | 'UNKNOWN';
  requiredCredits?: number;
  duplicate?: boolean;
}

export const TRACKER_ACTION_COST = 0.25;
export const FREE_TRACKER_LIMIT = 3;

export const sanitizeTrackerEntry = (entry: Omit<ApplicationTrackerEntry, 'id'>): Omit<ApplicationTrackerEntry, 'id'> => {
  let { deadline, status, action, ...rest } = entry;

  if (deadline) {
    const dLower = deadline.toLowerCase().trim();
    if (dLower.includes('ongoing')) {
      deadline = 'Ongoing';
    } else if (dLower.includes('no deadline') || dLower === 'none' || dLower === 'n/a') {
      deadline = undefined;
    } else {
      if (/^\d{4}-\d{2}-\d{2}/.test(dLower)) {
        deadline = dLower.substring(0, 10);
      } else {
        try {
          const d = new Date(deadline);
          if (!isNaN(d.getTime())) {
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            deadline = `${year}-${month}-${day}`;
          } else {
            deadline = undefined;
          }
        } catch {
          deadline = undefined;
        }
      }
    }
  }

  // Ensure action 'Applied' maps to status 'Applied'
  if (action === 'Applied') {
    status = (status && status !== 'Ongoing') ? status : 'Applied';
  } else if (!status) {
    status = 'Ongoing';
  }

  return { ...rest, action, status, deadline };
};

/**
 * Fetch a user's tracker usage summary and audit ledger.
 */
export const getTrackerUsage = async (userId: string): Promise<TrackerUsageData> => {
  try {
    const { data: docs } = await supabase
      .from('documents')
      .select('id, content')
      .eq('user_id', userId)
      .eq('type', 'TrackerUsage')
      .limit(1);

    if (docs && docs.length > 0) {
      const usageData: TrackerUsageData = JSON.parse(docs[0].content);
      return {
        totalActionsCount: usageData.totalActionsCount || 0,
        freeActionsUsed: usageData.freeActionsUsed || 0,
        paidActionsUsed: usageData.paidActionsUsed || 0,
        creditDeductions: usageData.creditDeductions || [],
        failedAttempts: usageData.failedAttempts || [],
      };
    }

    // Migration / Fallback: Count existing ApplicationTracker entries
    const { entries } = await getApplicationTrackerEntries(userId);
    const existingCount = entries.length;
    const initialUsage: TrackerUsageData = {
      totalActionsCount: existingCount,
      freeActionsUsed: Math.min(existingCount, FREE_TRACKER_LIMIT),
      paidActionsUsed: Math.max(0, existingCount - FREE_TRACKER_LIMIT),
      creditDeductions: [],
      failedAttempts: [],
    };

    if (existingCount > 0) {
      await saveTrackerUsage(userId, initialUsage);
    }

    return initialUsage;
  } catch (err) {
    console.error('Error fetching tracker usage:', err);
    return {
      totalActionsCount: 0,
      freeActionsUsed: 0,
      paidActionsUsed: 0,
      creditDeductions: [],
      failedAttempts: [],
    };
  }
};

/**
 * Save / update the TrackerUsage document in Supabase.
 */
export const saveTrackerUsage = async (userId: string, usage: TrackerUsageData): Promise<void> => {
  try {
    const { data: docs } = await supabase
      .from('documents')
      .select('id')
      .eq('user_id', userId)
      .eq('type', 'TrackerUsage')
      .limit(1);

    if (docs && docs.length > 0) {
      await supabase
        .from('documents')
        .update({
          content: JSON.stringify(usage),
          title: 'Tracker Usage Ledger',
        })
        .eq('id', docs[0].id);
    } else {
      await supabase.from('documents').insert({
        user_id: userId,
        type: 'TrackerUsage',
        title: 'Tracker Usage Ledger',
        content: JSON.stringify(usage),
      });
    }
  } catch (err) {
    console.error('Error saving tracker usage ledger:', err);
  }
};

/**
 * Persist an entry directly to the user's ApplicationTracker document.
 */
const persistEntryToTrackerDoc = async (
  userId: string,
  existingDoc: { id: string; content: string } | null,
  trackerData: ApplicationTrackerData,
  entry: Omit<ApplicationTrackerEntry, 'id'>
) => {
  const newEntry: ApplicationTrackerEntry = {
    id: Math.random().toString(36).substr(2, 9) + Date.now().toString(36),
    ...entry,
  };

  if (existingDoc) {
    trackerData.entries = trackerData.entries || [];
    trackerData.entries.unshift(newEntry);

    await supabase
      .from('documents')
      .update({
        content: JSON.stringify(trackerData),
        title: 'Application Tracker',
      })
      .eq('id', existingDoc.id);
  } else {
    const newDocData: ApplicationTrackerData = {
      entries: [newEntry],
    };

    await supabase.from('documents').insert({
      user_id: userId,
      type: 'ApplicationTracker',
      title: 'Application Tracker',
      content: JSON.stringify(newDocData),
    });
  }
};

/**
 * Save a new entry to the Application Tracker with 3 Free Actions quota + 0.25 credit charge logic.
 */
export const addApplicationTrackerEntry = async (
  userId: string,
  rawEntry: Omit<ApplicationTrackerEntry, 'id'>
): Promise<TrackerActionResult> => {
  try {
    const entry = sanitizeTrackerEntry(rawEntry);

    // Fetch existing tracker document
    const { data: docs } = await supabase
      .from('documents')
      .select('id, content')
      .eq('user_id', userId)
      .eq('type', 'ApplicationTracker')
      .limit(1);

    const existingDoc = docs && docs.length > 0 ? docs[0] : null;
    let trackerData: ApplicationTrackerData = { entries: [] };
    if (existingDoc) {
      try {
        trackerData = JSON.parse(existingDoc.content);
      } catch {
        trackerData = { entries: [] };
      }
    }

    // Avoid duplicates: check if same name + action already exists from the last 5 minutes
    const fiveMinAgoMs = Date.now() - 5 * 60 * 1000;
    const isDuplicate = (trackerData.entries || []).some(e => {
      if (e.name !== entry.name || e.action !== entry.action) return false;
      const entryTime = new Date(e.date).getTime();
      return !isNaN(entryTime) && entryTime > fiveMinAgoMs;
    });
    if (isDuplicate) {
      const usage = await getTrackerUsage(userId);
      return {
        success: true,
        charged: false,
        freeRemaining: Math.max(0, FREE_TRACKER_LIMIT - usage.totalActionsCount),
        totalActionsCount: usage.totalActionsCount,
        duplicate: true,
      };
    }

    // 1. Fetch user credits from profiles
    const { data: profileData } = await supabase
      .from('profiles')
      .select('credits')
      .eq('id', userId)
      .single();

    const currentCredits = profileData?.credits ?? 0;

    // 2. Fetch current tracker usage ledger
    const usage = await getTrackerUsage(userId);

    // 3. Evaluate Quota (First 3 Free, 4th+ costs 0.25 credits)
    if (usage.totalActionsCount < FREE_TRACKER_LIMIT) {
      // FREE ACTION (1, 2, or 3)
      usage.totalActionsCount += 1;
      usage.freeActionsUsed += 1;
      await saveTrackerUsage(userId, usage);

      await persistEntryToTrackerDoc(userId, existingDoc, trackerData, entry);

      return {
        success: true,
        charged: false,
        freeRemaining: Math.max(0, FREE_TRACKER_LIMIT - usage.totalActionsCount),
        totalActionsCount: usage.totalActionsCount,
        creditsRemaining: currentCredits,
      };
    } else {
      // PAID ACTION (0.25 credits required)
      if (currentCredits < TRACKER_ACTION_COST) {
        // INSUFFICIENT CREDITS
        const failedRecord: TrackerFailedAttempt = {
          id: Math.random().toString(36).substr(2, 9),
          date: new Date().toISOString(),
          reason: 'INSUFFICIENT_CREDITS',
          requiredCredits: TRACKER_ACTION_COST,
          action: entry.action,
          entryName: entry.name,
        };
        usage.failedAttempts = usage.failedAttempts || [];
        usage.failedAttempts.push(failedRecord);
        await saveTrackerUsage(userId, usage);

        return {
          success: false,
          charged: false,
          error: 'INSUFFICIENT_CREDITS',
          requiredCredits: TRACKER_ACTION_COST,
          creditsRemaining: currentCredits,
          freeRemaining: 0,
          totalActionsCount: usage.totalActionsCount,
        };
      }

      // Deduct 0.25 credit
      const newCredits = Math.max(0, parseFloat((currentCredits - TRACKER_ACTION_COST).toFixed(2)));
      await supabase
        .from('profiles')
        .update({ credits: newCredits })
        .eq('id', userId);

      // Record transaction
      await supabase.from('transactions').insert({
        user_id: userId,
        type: 'debit',
        description: `Application Tracker Action (${entry.name})`,
        amount: TRACKER_ACTION_COST,
      });

      // Update usage ledger
      usage.totalActionsCount += 1;
      usage.paidActionsUsed += 1;
      usage.creditDeductions = usage.creditDeductions || [];
      usage.creditDeductions.push({
        id: Math.random().toString(36).substr(2, 9),
        date: new Date().toISOString(),
        amount: TRACKER_ACTION_COST,
        action: entry.action,
        entryName: entry.name,
      });
      await saveTrackerUsage(userId, usage);

      await persistEntryToTrackerDoc(userId, existingDoc, trackerData, entry);

      return {
        success: true,
        charged: true,
        creditsDeducted: TRACKER_ACTION_COST,
        creditsRemaining: newCredits,
        freeRemaining: 0,
        totalActionsCount: usage.totalActionsCount,
      };
    }
  } catch (error) {
    console.error('Error saving to Application Tracker:', error);
    return {
      success: false,
      charged: false,
      error: 'UNKNOWN',
      freeRemaining: 0,
      totalActionsCount: 0,
    };
  }
};

/**
 * Fetch all Application Tracker entries for a user.
 */
export const getApplicationTrackerEntries = async (
  userId: string
): Promise<{ docId: string | null; entries: ApplicationTrackerEntry[] }> => {
  try {
    const { data: docs } = await supabase
      .from('documents')
      .select('id, content')
      .eq('user_id', userId)
      .eq('type', 'ApplicationTracker')
      .limit(1);

    if (docs && docs.length > 0) {
      const trackerData: ApplicationTrackerData = JSON.parse(docs[0].content);
      return { docId: docs[0].id, entries: trackerData.entries || [] };
    }
    return { docId: null, entries: [] };
  } catch (error) {
    console.error('Error fetching Application Tracker:', error);
    return { docId: null, entries: [] };
  }
};

/**
 * Update the full tracker entries array (for edits, deletes, status changes).
 */
export const saveApplicationTrackerEntries = async (
  userId: string,
  docId: string | null,
  entries: ApplicationTrackerEntry[]
): Promise<void> => {
  try {
    const trackerData: ApplicationTrackerData = { entries };

    if (docId) {
      await supabase
        .from('documents')
        .update({
          content: JSON.stringify(trackerData),
          title: 'Application Tracker',
        })
        .eq('id', docId);
    } else {
      await supabase.from('documents').insert({
        user_id: userId,
        type: 'ApplicationTracker',
        title: 'Application Tracker',
        content: JSON.stringify(trackerData),
      });
    }
  } catch (error) {
    console.error('Error saving Application Tracker:', error);
  }
};
