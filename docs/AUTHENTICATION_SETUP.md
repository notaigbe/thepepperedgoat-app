
# Authentication Setup Guide

This guide explains how to set up authentication for the Jagabans LA app.

## Overview

The app now uses Supabase Authentication for user management. All mock data has been migrated to Supabase, and real-time subscriptions are enabled for order updates.

## Features Implemented

- ✅ User authentication (sign up, sign in, sign out)
- ✅ Admin authentication with default credentials
- ✅ Real-time order status updates via Supabase Realtime
- ✅ Menu items loaded from Supabase
- ✅ Merch items loaded from Supabase
- ✅ User profiles with points system
- ✅ Order management with real-time updates
- ✅ Gift card system
- ✅ Merch redemption system

## Creating the Admin User

To create the default admin user for testing, follow these steps:

### Option 1: Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to Authentication > Users
3. Click "Add User"
4. Enter the following details:
   - Email: `admin@jagabansla.com`
   - Password: `admin`
   - Auto Confirm User: ✅ (checked)
5. Click "Create User"

### Option 2: Using SQL

Run the following SQL in your Supabase SQL Editor:

```sql
-- Create admin user
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@jagabansla.com',
  crypt('admin', gen_salt('bf')),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"name":"Admin User"}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
);

-- Create admin user profile
INSERT INTO user_profiles (id, name, email, phone, points)
SELECT id, 'Admin User', 'admin@jagabansla.com', '', 1000
FROM auth.users
WHERE email = 'admin@jagabansla.com';
```

## Default Credentials

### Admin Dashboard
- **Email**: `admin@jagabansla.com`
- **Password**: `admin`

### Regular User (for testing)
Users can sign up through the Profile tab in the app. For testing, you can create a user with any email and password.

## How Authentication Works

### User Flow
1. Users open the app and see the Profile tab
2. If not authenticated, they see a login/signup screen
3. After signing up, users receive an email verification link
4. Once verified, users can sign in and access all features
5. User data (orders, points, gift cards) is synced with Supabase

### Admin Flow
1. Admins navigate to `/admin` route
2. They sign in with admin credentials
3. Once authenticated, they can access all admin features:
   - Menu management
   - Order management
   - User management
   - Event management
   - Merch management
   - Gift card management
   - Notifications
   - Analytics

## Real-time Order Updates

The app uses Supabase Realtime to provide live order status updates:

- When an order status changes, users receive an instant notification
- No need to refresh the app to see order updates
- Uses the `broadcast` function for scalability
- Private channels ensure users only see their own order updates

### How it works:
1. Database trigger fires when order status changes
2. Trigger broadcasts the change to the user's private channel
3. App receives the broadcast and updates the UI
4. User sees a toast notification with the new status

## Data Migration

All mock data has been migrated to Supabase:

### Menu Items
- 10 menu items across 5 categories
- Includes popular items, prices, descriptions, and images
- Loaded dynamically from Supabase

### Merch Items
- 6 merch items with point costs
- Includes stock status
- Loaded dynamically from Supabase

## Testing the App

### Test User Authentication
1. Open the app
2. Go to the Profile tab
3. Click "Sign Up"
4. Enter test credentials:
   - Name: Test User
   - Email: test@example.com
   - Password: test123
5. Check your email for verification link
6. Click the link to verify
7. Sign in with your credentials

### Test Admin Authentication
1. Navigate to `/admin` in the app
2. Enter admin credentials:
   - Email: admin@jagabansla.com
   - Password: admin
3. Access admin dashboard

### Test Real-time Updates
1. Sign in as a regular user
2. Place an order
3. Sign in as admin in another browser/device
4. Change the order status
5. See the update appear instantly in the user's app

## Troubleshooting

### "Invalid credentials" error
- Make sure you've created the admin user
- Check that the email is exactly `admin@jagabansla.com`
- Verify the password is `admin`

### Email verification not working
- Check your Supabase email settings
- Make sure email templates are configured
- For testing, you can manually confirm users in the dashboard

### Real-time updates not working
- Check that the realtime trigger is created
- Verify RLS policies are set up correctly
- Make sure the user is authenticated
- Check browser console for connection errors

## Security Notes

⚠️ **Important**: The default admin credentials (`admin@jagabansla.com` / `admin`) are for testing only. In production:

1. Change the admin password to a strong, unique password
2. Use environment variables for sensitive data
3. Enable Row Level Security (RLS) on all tables
4. Implement proper role-based access control
5. Use secure password hashing (already implemented)
6. Enable email verification for all users
7. Set up proper CORS policies

## Next Steps

- Set up email templates in Supabase
- Configure custom domain for email verification
- Add password reset functionality
- Implement role-based access control
- Add two-factor authentication
- Set up monitoring and logging
