# Security Configuration Checklist

## ✅ SQL Migrations Applied
- [x] Enable RLS on all public tables
- [x] Create appropriate RLS policies
- [x] Fix security definer views
- [x] Add search_path to all functions

## ⚙️ Dashboard Configuration Needed

### 1. Enable Leaked Password Protection
**Status:** ⚠️ Must be configured in Supabase Dashboard

**Steps:**
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to **Authentication** → **Settings**
4. Scroll to **Password Security** section
5. Enable **"Leaked password protection"**
6. Configure minimum password requirements:
   - Minimum length: 8 characters (recommended)
   - Require uppercase letters
   - Require lowercase letters
   - Require numbers
   - Require special characters

**What this does:**
- Checks passwords against the HaveIBeenPwned.org database
- Prevents users from using compromised passwords
- Enhances overall account security

### 2. Review Permissive RLS Policies

The following policies are intentionally permissive and acceptable:

#### `contact_messages` - INSERT policy
- **Policy:** "Anyone can submit contact form"
- **Reason:** Allows public contact form submissions
- **Security:** Consider adding rate limiting or CAPTCHA

#### `page_views` - INSERT policy  
- **Policy:** "Anyone can insert page views"
- **Reason:** Allows anonymous page view tracking
- **Security:** Acceptable for analytics purposes

**Optional enhancements:**
- Implement rate limiting via database triggers
- Add IP-based restrictions if needed
- Use Supabase Edge Functions for additional validation

## 📊 Migration Files

1. `20260304000000_handle_new_user_profile.sql` - Auto-create profiles on signup
2. `20260304000001_enable_rls_all_tables.sql` - Enable RLS on all tables
3. `20260304000002_fix_security_warnings.sql` - Fix view and function security

## 🚀 Deployment

To apply all migrations:

```powershell
npx supabase db push
```

Or if using Supabase CLI:

```powershell
supabase migration up
```

## 🔍 Verify Security

After deployment, run the database linter again to verify all issues are resolved:

1. Go to Supabase Dashboard
2. Navigate to **Database** → **Linter**
3. Review any remaining warnings
4. All critical errors should be resolved
