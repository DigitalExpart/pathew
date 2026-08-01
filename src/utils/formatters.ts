/**
 * Format credit balance to always display 2 decimal places (e.g., 35.25, 40.00, 60.00).
 */
export const formatCredits = (amount?: number | null): string => {
  if (amount === undefined || amount === null || isNaN(amount)) return '0.00';
  return Number(amount).toFixed(2);
};
