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

export const sanitizeTrackerEntry = (entry: Omit<ApplicationTrackerEntry, 'id'>): Omit<ApplicationTrackerEntry, 'id'> => {
  let { deadline, status, ...rest } = entry;

  if (deadline) {
    const dLower = deadline.toLowerCase().trim();
    if (dLower.includes('ongoing') || dLower.includes('no deadline') || dLower === 'none' || dLower === 'n/a') {
      if (dLower.includes('ongoing')) {
        status = 'Ongoing';
      }
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

  return { ...rest, status, deadline };
};

/**
 * Save a new entry to the Application Tracker.
 * Each user has a single "ApplicationTracker" document that stores all entries as JSON.
 */
export const addApplicationTrackerEntry = async (
  userId: string,
  rawEntry: Omit<ApplicationTrackerEntry, 'id'>
): Promise<void> => {
  try {
    const entry = sanitizeTrackerEntry(rawEntry);

    // Fetch existing tracker document
    const { data: docs } = await supabase
      .from('documents')
      .select('id, content')
      .eq('user_id', userId)
      .eq('type', 'ApplicationTracker')
      .limit(1);

    const newEntry: ApplicationTrackerEntry = {
      id: Math.random().toString(36).substr(2, 9) + Date.now().toString(36),
      ...entry,
    };

    if (docs && docs.length > 0) {
      // Update existing tracker
      const existingDoc = docs[0];
      let trackerData: ApplicationTrackerData;
      try {
        trackerData = JSON.parse(existingDoc.content);
      } catch {
        trackerData = { entries: [] };
      }

      // Avoid duplicates: check if same name + action already exists from the last 5 minutes
      const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const isDuplicate = trackerData.entries.some(
        e => e.name === entry.name && e.action === entry.action && e.date > fiveMinAgo
      );
      if (isDuplicate) return;

      trackerData.entries.unshift(newEntry);

      await supabase
        .from('documents')
        .update({
          content: JSON.stringify(trackerData),
          title: 'Application Tracker',
        })
        .eq('id', existingDoc.id);
    } else {
      // Create new tracker document
      const trackerData: ApplicationTrackerData = {
        entries: [newEntry],
      };

      await supabase.from('documents').insert({
        user_id: userId,
        type: 'ApplicationTracker',
        title: 'Application Tracker',
        content: JSON.stringify(trackerData),
      });
    }
  } catch (error) {
    console.error('Error saving to Application Tracker:', error);
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
