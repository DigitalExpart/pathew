/**
 * Helper utility to detect whether an opportunity is external (posted outside PATHEW)
 * or internal (posted natively on PATHEW).
 */
export const isExternalOpportunity = (opp: any): boolean => {
  if (!opp) return false;

  // 1. Explicit boolean or string flag if present in DB/object
  if (opp.is_external === true || opp.is_external === 'true') return true;
  if (opp.is_external === false || opp.is_external === 'false') return false;

  // 2. RSS / Feed synced items are external
  if (opp.rss_source_id || opp.rss_guid) return true;

  const applyLink = typeof opp.apply_link === 'string' ? opp.apply_link.trim() : '';
  const originalUrl = typeof opp.original_url === 'string' ? opp.original_url.trim() : '';
  const sourceUrl = typeof opp.source_url === 'string' ? opp.source_url.trim() : '';

  const isPathewUrl = (url: string) => url.includes('pathew.com') || url.includes('localhost');

  const hasValidExternalApplyLink = applyLink.length > 0 &&
    (applyLink.startsWith('http://') || applyLink.startsWith('https://')) &&
    !isPathewUrl(applyLink);

  const hasValidExternalOriginalUrl = originalUrl.length > 0 &&
    (originalUrl.startsWith('http://') || originalUrl.startsWith('https://')) &&
    !isPathewUrl(originalUrl);

  const hasValidExternalSourceUrl = sourceUrl.length > 0 &&
    (sourceUrl.startsWith('http://') || sourceUrl.startsWith('https://')) &&
    !isPathewUrl(sourceUrl);

  const sourceName = (opp.source_name || opp.source || '').trim().toLowerCase();
  const isPathewSource = sourceName === '' || sourceName === 'pathew' || sourceName === 'in-platform' || sourceName === 'internal';

  // If source is external and has an external URL or source name
  if (!isPathewSource && (hasValidExternalApplyLink || hasValidExternalOriginalUrl || hasValidExternalSourceUrl)) {
    return true;
  }

  // If there's an external apply link, original URL, or source URL that isn't PATHEW
  if (hasValidExternalApplyLink || hasValidExternalOriginalUrl || hasValidExternalSourceUrl) {
    return true;
  }

  // If source_name is explicitly external (e.g. LinkedIn, Indeed, ReliefWeb, EWB, etc.)
  if (sourceName && !isPathewSource) {
    return true;
  }

  return false;
};
