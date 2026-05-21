-- Seed data for Extraordinary Woman Blog RSS feed
INSERT INTO rss_sources (
  name,
  website_url,
  feed_url,
  enabled,
  sync_interval_hours,
  classification_rules
) VALUES (
  'Extraordinary Woman Blog',
  'https://extraordinarywomanblog.com',
  'https://extraordinarywomanblog.com/feed/',
  true,
  24,
  '{"categories_to_job": ["Remote Jobs"], "title_to_job": ["Now Hiring", "Hiring:"], "title_to_fellowship": ["Fellowship"], "title_to_scholarship": ["Scholarship"], "title_to_grant": ["Grant", "Funding", "Fund "], "categories_to_opportunity": ["Opportunities for Women"]}'::jsonb
);
