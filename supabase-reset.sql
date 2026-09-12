-- Supabase: Complete Data Reset
-- Run in Supabase Dashboard → SQL Editor
-- WARNING: This deletes ALL data. Run only if you're sure.

-- Disable foreign key checks temporarily (PostgreSQL doesn't have this, so we truncate in correct order)

-- Order matters: child tables first, then parent tables
TRUNCATE TABLE 
  activities,
  comments,
  likes,
  bookmarks,
  project_categories,
  featured_projects,
  permission_requests,
  api_keys,
  webhooks,
  webhook_deliveries,
  projects,
  profiles,
  categories
RESTART IDENTITY CASCADE;

-- Verify tables are empty
SELECT 'profiles' as table_name, count(*) FROM profiles
UNION ALL SELECT 'projects', count(*) FROM projects
UNION ALL SELECT 'activities', count(*) FROM activities
UNION ALL SELECT 'comments', count(*) FROM comments
UNION ALL SELECT 'likes', count(*) FROM likes
UNION ALL SELECT 'bookmarks', count(*) FROM bookmarks
UNION ALL SELECT 'categories', count(*) FROM categories
UNION ALL SELECT 'featured_projects', count(*) FROM featured_projects
UNION ALL SELECT 'permission_requests', count(*) FROM permission_requests
UNION ALL SELECT 'api_keys', count(*) FROM api_keys
UNION ALL SELECT 'webhooks', count(*) FROM webhooks
UNION ALL SELECT 'webhook_deliveries', count(*) FROM webhook_deliveries
UNION ALL SELECT 'project_categories', count(*) FROM project_categories;