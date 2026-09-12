-- Supabase: Delete All Data (Keep Tables & Structure)
-- Run in Supabase Dashboard → SQL Editor
-- This deletes all rows but keeps tables, indexes, constraints, RLS policies

-- Delete in correct order (children first, parents last)
DELETE FROM activities;
DELETE FROM comments;
DELETE FROM likes;
DELETE FROM bookmarks;
DELETE FROM project_categories;
DELETE FROM featured_projects;
DELETE FROM permission_requests;
DELETE FROM api_keys;
DELETE FROM webhook_deliveries;
DELETE FROM webhooks;
DELETE FROM projects;
DELETE FROM profiles;
DELETE FROM categories;

-- Verify empty
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