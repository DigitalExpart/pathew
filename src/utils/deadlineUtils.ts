/**
 * Deadline-aware plan selection utilities.
 * Parses various deadline text formats, calculates time-to-deadline,
 * and provides smart plan recommendations with contextual warnings.
 */

// ─── Deadline Parsing ────────────────────────────────────────────

const MONTH_MAP: Record<string, number> = {
  january: 0, jan: 0,
  february: 1, feb: 1,
  march: 2, mar: 2,
  april: 3, apr: 3,
  may: 4,
  june: 5, jun: 5,
  july: 6, jul: 6,
  august: 7, aug: 7,
  september: 8, sep: 8, sept: 8,
  october: 9, oct: 9,
  november: 10, nov: 10,
  december: 11, dec: 11,
};

/**
 * Robustly parse deadline text into a Date.
 * Supports ISO dates, "Month Year", "Month Day, Year", "DD/MM/YYYY", etc.
 * Returns null for unparseable, rolling, or missing deadlines.
 */
export function parseDeadline(deadlineText: string | null | undefined): Date | null {
  if (!deadlineText) return null;

  const text = deadlineText.trim().toLowerCase();

  // Skip non-date strings
  if (['rolling', 'open', 'ongoing', 'n/a', 'no deadline', 'tbd', 'none'].includes(text)) {
    return null;
  }

  // 1. Try native Date parse first (handles ISO, "YYYY-MM-DD", etc.)
  const nativeParsed = new Date(deadlineText.trim());
  if (!isNaN(nativeParsed.getTime()) && nativeParsed.getFullYear() > 2000) {
    return nativeParsed;
  }

  // 2. "Month Year" e.g. "September 2026"
  const monthYearMatch = text.match(/^([a-z]+)\s+(\d{4})$/);
  if (monthYearMatch) {
    const month = MONTH_MAP[monthYearMatch[1]];
    const year = parseInt(monthYearMatch[2]);
    if (month !== undefined) {
      // Use last day of the month as the deadline
      return new Date(year, month + 1, 0);
    }
  }

  // 3. "Month Day, Year" e.g. "September 15, 2026"
  const monthDayYearMatch = text.match(/^([a-z]+)\s+(\d{1,2}),?\s+(\d{4})$/);
  if (monthDayYearMatch) {
    const month = MONTH_MAP[monthDayYearMatch[1]];
    const day = parseInt(monthDayYearMatch[2]);
    const year = parseInt(monthDayYearMatch[3]);
    if (month !== undefined) {
      return new Date(year, month, day);
    }
  }

  // 4. "Day Month Year" e.g. "15 September 2026"
  const dayMonthYearMatch = text.match(/^(\d{1,2})\s+([a-z]+)\s+(\d{4})$/);
  if (dayMonthYearMatch) {
    const day = parseInt(dayMonthYearMatch[1]);
    const month = MONTH_MAP[dayMonthYearMatch[2]];
    const year = parseInt(dayMonthYearMatch[3]);
    if (month !== undefined) {
      return new Date(year, month, day);
    }
  }

  // 5. "DD/MM/YYYY" or "DD-MM-YYYY"
  const ddmmyyyyMatch = text.match(/^(\d{1,2})[/\-](\d{1,2})[/\-](\d{4})$/);
  if (ddmmyyyyMatch) {
    const day = parseInt(ddmmyyyyMatch[1]);
    const month = parseInt(ddmmyyyyMatch[2]) - 1;
    const year = parseInt(ddmmyyyyMatch[3]);
    return new Date(year, month, day);
  }

  return null;
}

// ─── Time Calculations ───────────────────────────────────────────

/**
 * Returns the number of days until the given deadline.
 * Negative values mean the deadline has already passed.
 */
export function getDaysUntilDeadline(deadline: Date): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(deadline);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

// ─── Plan Duration Constants ─────────────────────────────────────

export const PLAN_DURATIONS = [
  { key: '90-day',  label: '90-Day Plan',  days: 90,  intentKey: 'currentCycle'  },
  { key: '180-day', label: '180-Day Plan', days: 180, intentKey: 'nextCycle'     },
  { key: '365-day', label: '365-Day Plan', days: 365, intentKey: 'futuresCycle'  },
] as const;

export type PlanDurationKey = '90-day' | '180-day' | '365-day';

// ─── Recommendation Engine ───────────────────────────────────────

export interface PlanRecommendation {
  /** The recommended plan duration key */
  recommended: PlanDurationKey;
  /** Per-plan warnings: key=duration, value=warning message i18n key + params */
  warnings: Record<string, { key: string; params?: Record<string, string> }>;
}

/**
 * Returns the recommended plan and per-plan warnings based on deadline proximity.
 *
 * Logic:
 * - deadline ≤ 3 months away → recommend 90-day (current cycle)
 * - deadline 3–6 months away → recommend 180-day (next cycle prep)
 * - deadline > 6 months away → recommend 90-day (plenty of time for current cycle)
 * - deadline passed → recommend 180-day
 * - no deadline → recommend 90-day (default, no warnings)
 */
export function getRecommendedPlan(deadline: Date | null): PlanRecommendation {
  if (!deadline) {
    return {
      recommended: '90-day',
      warnings: {},
    };
  }

  const daysLeft = getDaysUntilDeadline(deadline);

  // Deadline has passed
  if (daysLeft < 0) {
    return {
      recommended: '180-day',
      warnings: {
        '90-day': {
          key: 'planSelection.deadlinePassed',
        },
        '180-day': {
          key: 'planSelection.nextCycleRecommended',
        },
      },
    };
  }

  // Deadline is very soon (< 30 days) — too tight even for 90-day
  if (daysLeft < 30) {
    return {
      recommended: '180-day',
      warnings: {
        '90-day': {
          key: 'planSelection.deadlineTooSoon',
          params: { days: String(daysLeft) },
        },
      },
    };
  }

  // Deadline within 3 months (≤ 90 days) — 90-day is perfect
  if (daysLeft <= 90) {
    return {
      recommended: '90-day',
      warnings: {},
    };
  }

  // Deadline 3-6 months away — 180-day plan
  if (daysLeft <= 180) {
    return {
      recommended: '180-day',
      warnings: {
        '90-day': {
          key: 'planSelection.deadlineWarning',
          params: { duration: '90-day' },
        },
      },
    };
  }

  // Deadline > 6 months away — plenty of time, 90-day is sufficient
  return {
    recommended: '90-day',
    warnings: {
      '180-day': {
        key: 'planSelection.suggestShorter',
        params: { suggested: '90-day' },
      },
      '365-day': {
        key: 'planSelection.suggestShorter',
        params: { suggested: '90-day' },
      },
    },
  };
}

/**
 * Checks if a specific plan duration is feasible given the deadline.
 */
export function canApplyInTime(
  planDuration: PlanDurationKey,
  deadline: Date | null
): { feasible: boolean; warning?: string } {
  if (!deadline) return { feasible: true };

  const daysLeft = getDaysUntilDeadline(deadline);

  if (daysLeft < 0) {
    return {
      feasible: false,
      warning: 'planSelection.deadlinePassed',
    };
  }

  const planDays = PLAN_DURATIONS.find(p => p.key === planDuration)?.days || 90;

  if (daysLeft < planDays * 0.3) {
    // Less than 30% of plan duration left
    return {
      feasible: false,
      warning: 'planSelection.deadlineTooSoon',
    };
  }

  return { feasible: true };
}

/**
 * Format days remaining into a human-friendly string.
 */
export function formatDaysRemaining(days: number): string {
  if (days < 0) return 'Deadline passed';
  if (days === 0) return 'Deadline is today';
  if (days === 1) return '1 day remaining';
  if (days < 30) return `${days} days remaining`;
  if (days < 60) return `~1 month remaining`;
  const months = Math.round(days / 30);
  return `~${months} months remaining`;
}
