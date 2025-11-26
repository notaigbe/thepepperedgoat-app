
# Initial Setup Guide for Role-Based Access Control

## Prerequisites

- Supabase project set up and running
- Database migrations applied
- Application deployed

## Step 1: Apply Database Migrations

The following migrations should already be applied:

1. `add_super_admin_role` - Adds role columns and functions
2. `ensure_super_admin_is_admin` - Adds triggers for role consistency

To verify migrations are applied, check the Supabase dashboard under Database → Migrations.

## Step 2: Create Your First Super Admin

You need to manually create the first super admin user. This is a one-time setup.

### Option A: Using Supabase Dashboard

1. Go to Supabase Dashboard
2. Navigate to Table Editor
3. Select `user_profiles` table
4. Find your user account
5. Edit the row and set:
   - `is_admin` = `true`
   - `is_super_admin` = `true`
6. Save changes

### Option B: Using SQL Editor

1. Go to Supabase Dashboard
2. Navigate to SQL Editor
3. Run this query (replace with your email):

```sql
UPDATE user_profiles
SET 
  is_admin = TRUE,
  is_super_admin = TRUE,
  updated_at = NOW()
WHERE email = 'your-email@example.com';
```

4. Verify the update:

```sql
SELECT id, name, email, is_admin, is_super_admin
FROM user_profiles
WHERE is_super_admin = TRUE;
```

## Step 3: Verify Database Functions

Check that the role check functions exist:

```sql
-- Check is_admin function
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname = 'is_admin';

-- Check is_super_admin function
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname = 'is_super_admin';
```

Both functions should return results.

## Step 4: Verify RLS Policies

Check that RLS policies are active:

```sql
-- Check user_profiles policies
SELECT * FROM pg_policies 
WHERE tablename = 'user_profiles';

-- Verify RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'user_profiles';
```

The `rowsecurity` column should be `true`.

## Step 5: Test Super Admin Access

1. Log out of the application
2. Log in with your super admin account
3. Navigate to the Admin Dashboard
4. Verify you see the "Super Admin" badge
5. Check that "Admin Management" section is visible
6. Click on "Admin Management" to verify access

## Step 6: Create Additional Admins

Now that you have super admin access, you can create more admins:

### Promote Existing User to Admin

1. Go to **User Management**
2. Search for the user
3. Click **Make Admin**
4. Confirm the action

### Grant Super Admin to Another Admin

1. Go to **Admin Management**
2. Find the admin user
3. Click the **Super Admin** toggle
4. Confirm (be careful - this grants full control)

## Step 7: Verify Permissions

Test that permissions work correctly:

### Test Super Admin Permissions
- ✅ Can access Admin Management
- ✅ Can promote users to admin
- ✅ Can grant super admin status
- ✅ Can delete admin accounts
- ✅ Can perform all admin functions

### Test Regular Admin Permissions
- ✅ Can access admin dashboard
- ✅ Can manage orders, menu, events, etc.
- ❌ Cannot access Admin Management
- ❌ Cannot promote users to admin
- ❌ Cannot change role assignments

### Test Regular User Permissions
- ❌ Cannot access admin dashboard
- ✅ Can view own orders and profile
- ❌ Cannot view other users' data

## Troubleshooting

### Issue: Cannot access admin dashboard after setting roles

**Solution:**
1. Log out completely
2. Clear browser cache
3. Log back in
4. Check database to verify roles are set correctly:

```sql
SELECT id, name, email, is_admin, is_super_admin
FROM user_profiles
WHERE email = 'your-email@example.com';
```

### Issue: "Access Denied" when accessing Admin Management

**Solution:**
1. Verify you are logged in as super admin
2. Check that `is_super_admin` is `TRUE` in database
3. Verify the `is_super_admin()` function exists
4. Check RLS policies are active

### Issue: Changes not taking effect

**Solution:**
1. Reload the user profile in the app
2. Log out and log back in
3. Check database triggers are active:

```sql
SELECT tgname, tgtype, tgenabled
FROM pg_trigger
WHERE tgname LIKE '%super_admin%';
```

### Issue: Database function errors

**Solution:**
1. Verify functions exist and are correct
2. Check function permissions
3. Ensure `SECURITY DEFINER` is set
4. Verify search path is set to 'public'

## Security Checklist

Before going to production:

- [ ] First super admin account created
- [ ] Super admin password is strong and secure
- [ ] Database functions are working correctly
- [ ] RLS policies are enabled and tested
- [ ] Triggers are active
- [ ] Indexes are created
- [ ] All migrations are applied
- [ ] Permissions tested for all role levels
- [ ] Backup of database created

## Best Practices

1. **Limit Super Admins**: Only create super admin accounts for trusted individuals
2. **Regular Audits**: Periodically review who has admin access
3. **Strong Passwords**: Require strong passwords for all admin accounts
4. **Monitor Activity**: Keep track of admin actions (implement audit logging)
5. **Backup Regularly**: Always maintain database backups
6. **Test Changes**: Test role changes in a staging environment first

## Next Steps

After initial setup:

1. Create additional admin accounts as needed
2. Document who has admin access
3. Set up monitoring and alerts
4. Consider implementing audit logging
5. Review and update permissions regularly

## Support

If you encounter issues during setup:

1. Check the troubleshooting section above
2. Review the full documentation in `ROLE_BASED_ACCESS_CONTROL.md`
3. Check Supabase logs for errors
4. Verify all migrations are applied
5. Contact the development team if issues persist

## Verification Script

Run this script to verify everything is set up correctly:

```sql
-- Verification Script
DO $$
DECLARE
  admin_count INTEGER;
  super_admin_count INTEGER;
  function_exists BOOLEAN;
  rls_enabled BOOLEAN;
BEGIN
  -- Check admin counts
  SELECT COUNT(*) INTO admin_count FROM user_profiles WHERE is_admin = TRUE;
  SELECT COUNT(*) INTO super_admin_count FROM user_profiles WHERE is_super_admin = TRUE;
  
  -- Check functions exist
  SELECT EXISTS(SELECT 1 FROM pg_proc WHERE proname = 'is_admin') INTO function_exists;
  
  -- Check RLS is enabled
  SELECT rowsecurity INTO rls_enabled FROM pg_tables 
  WHERE schemaname = 'public' AND tablename = 'user_profiles';
  
  -- Output results
  RAISE NOTICE 'Setup Verification Results:';
  RAISE NOTICE '- Total Admins: %', admin_count;
  RAISE NOTICE '- Total Super Admins: %', super_admin_count;
  RAISE NOTICE '- Functions Exist: %', function_exists;
  RAISE NOTICE '- RLS Enabled: %', rls_enabled;
  
  -- Warnings
  IF super_admin_count = 0 THEN
    RAISE WARNING 'No super admin accounts found! Create at least one super admin.';
  END IF;
  
  IF NOT function_exists THEN
    RAISE WARNING 'Role check functions not found! Apply migrations.';
  END IF;
  
  IF NOT rls_enabled THEN
    RAISE WARNING 'RLS not enabled on user_profiles! Enable RLS for security.';
  END IF;
END $$;
```

Copy and run this script in the Supabase SQL Editor to verify your setup.
