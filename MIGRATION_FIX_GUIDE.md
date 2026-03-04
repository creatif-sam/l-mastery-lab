# Quick Start: Fix Community Features

## 🚨 IMPORTANT: Tables Already Exist - Just Need Schema Fixes!

The 400 errors you're seeing mean the database tables have the wrong columns or constraints. Follow these steps:

## Step 1: Open Supabase Dashboard
1. Go to [supabase.com](https://supabase.com/dashboard)
2. Sign in to your project
3. Click on your **Language Mastery Lab** project

## Step 2: Fix Existing Table Schema ⚠️ RUN THIS FIRST
1. Click **SQL Editor** in the left sidebar
2. Click **New Query**
3. Copy **ALL** content from:
   ```
   supabase/migrations/20260304000000_fix_existing_community_tables.sql
   ```
4. Paste into the SQL Editor
5. Click **RUN** (bottom right)
6. ✅ You should see "Success. No rows returned"

**This adds/fixes:**
- Missing columns in `community_reactions` (id, post_id, user_id, type, created_at)
- Missing columns in `community_comments` (id, post_id, author_id, content, created_at, updated_at)
- Missing columns in `community_posts` (likes_count, loves_count, comments_count, image_url)
- Foreign key references to `profiles` table
- Unique constraints and check constraints
- Performance indexes

## Step 3: Apply RLS Policies
1. Click **New Query** again
2. Copy **ALL** content from:
   ```
   supabase/migrations/20260304000001_community_rls_policies.sql
   ```
3. Paste into the SQL Editor
4. Click **RUN**
5. ✅ You should see "Success. No rows returned"

**This enables:**
- Users can like/love posts
- Users can comment on posts
- Users can only delete their own content
- Secure row-level security

## Step 4: Apply Notification Triggers
1. Click **New Query** again
2. Copy **ALL** content from:
   ```
   supabase/migrations/20260304000002_notification_triggers.sql
   ```
3. Paste into the SQL Editor
4. Click **RUN**
5. ✅ You should see "Success. No rows returned"

**This enables:**
- Automatic notifications when posts are created
- Automatic notifications when comments are added

## Step 5: Refresh Your App
1. Go to your app in the browser
2. **Hard refresh:** Press `Ctrl + Shift + R` (or `Cmd + Shift + R` on Mac)
3. Open browser console (F12)
4. Clear any cached errors

## Step 6: Test Community Features
1. Go to: `/protected/student-board/community`
2. **Create a post** - should work without errors
3. **Like a post** - click 👍 icon (should toggle on/off)
4. **Love a post** - click ❤️ icon (should toggle on/off)
5. **Comment on a post** - should work without errors
6. Check console - should see NO 400 errors

## ✅ Expected Behavior After Migration

### Likes/Loves:
- Clicking 👍 or ❤️ should toggle the reaction
- Should see "+0.1 pts" toast message
- If you see an error, check the browser console for the actual error message

### Comments:
- Typing and submitting a comment should work
- Should see "+0.5 pts for commenting!" toast
- If you see an error, check the browser console for the actual error message

### Profile Banner:
- The red banner should **disappear** when your profile is 100% complete
- Fill in these fields in settings:
  - Full Name
  - Avatar (upload photo)
  - Country of Birth
  - Country of Residence
  - Target Language
- Banner should only show if percentage is between 1-99%
- Banner should NOT show at 0% or 100%

## 🔍 Troubleshooting

### Still getting 400 errors?
1. Check the browser console for error details
2. The error message will now show you exactly what's wrong
3. Common issues:
   - Table doesn't exist → Run migration Step 2 again
   - Column doesn't exist → Check table schema in Supabase dashboard
   - Foreign key error → Run migration Step 3

### Profile banner still showing?
1. Open browser console (F12)
2. Look for "Profile completion debug:" message
3. Check which fields are null/undefined/empty
4. Go to `/protected/student-board/settings`
5. Fill in ALL missing fields
6. Save and return to dashboard
7. Hard refresh (Ctrl + Shift + R)

### Notifications not working?
1. Check that Step 5 was successful
2. Verify the triggers exist in Supabase:
   - Go to Database → Triggers
   - Should see `notify_on_new_community_post` and `notify_on_new_comment`

## 📞 Need More Help?

Check the browser console error messages - they now show detailed error information that will help you (or me) debug the issue!

---

**After following these steps, everything should work perfectly!** 🎉
