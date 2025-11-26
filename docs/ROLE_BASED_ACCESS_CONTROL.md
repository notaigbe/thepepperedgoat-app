
# Role-Based Access Control (RBAC) Implementation

## Overview

This document describes the role-based access control system implemented for the Jagabans LA admin dashboard. The system supports two admin roles with different permission levels:

- **Admin**: Can perform standard administrative functions (manage orders, menu, events, etc.)
- **Super Admin**: Has all admin permissions plus the ability to manage admin users

## Database Schema

### User Profiles Table

The `user_profiles` table has been extended with two role columns:

```sql
- is_admin: BOOLEAN (default: FALSE)
- is_super_admin: BOOLEAN (default: FALSE)
```

### Role Hierarchy

- Super Admins automatically have admin privileges (enforced by database trigger)
- Super Admins can promote/demote users to/from admin role
- Super Admins can grant/revoke super admin privileges
- Admins cannot modify role assignments

## Database Functions

### `is_admin()`

Checks if the current authenticated user has admin privileges.

```sql
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_status BOOLEAN;
BEGIN
  SELECT is_admin INTO admin_status
  FROM user_profiles
  WHERE user_id = auth.uid()
  LIMIT 1;
  
  RETURN COALESCE(admin_status, FALSE);
END;
$$;
```

### `is_super_admin()`

Checks if the current authenticated user has super admin privileges.

```sql
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  super_admin_status BOOLEAN;
BEGIN
  SELECT is_super_admin INTO super_admin_status
  FROM user_profiles
  WHERE user_id = auth.uid()
  LIMIT 1;
  
  RETURN COALESCE(super_admin_status, FALSE);
END;
$$;
```

### `ensure_super_admin_is_admin()`

Trigger function that automatically sets `is_admin = TRUE` when a user is promoted to super admin.

## Row Level Security (RLS) Policies

### User Profiles Table

1. **Super-admins can update all user profiles**
   - Allows super admins to modify any user profile including role assignments

2. **Admins can update user profiles**
   - Allows admins to update user profiles
   - Prevents admins from changing `is_admin` or `is_super_admin` status

3. **Super-admins can insert user profiles**
   - Allows super admins to create new user accounts

4. **Super-admins can delete user profiles**
   - Allows super admins to delete user accounts

5. **Users can view their own profile**
   - Standard users can view their own profile

6. **Admins can view all user profiles**
   - Admins and super admins can view all user profiles

## API Services

### User Service Extensions

New methods added to `services/supabaseService.ts`:

```typescript
// Get all users (Admin/Super-Admin)
async getAllUsers()

// Update user admin status (Super-Admin only)
async updateUserAdminStatus(userId: string, isAdmin: boolean)

// Update user super-admin status (Super-Admin only)
async updateUserSuperAdminStatus(userId: string, isSuperAdmin: boolean)

// Delete user account (Super-Admin only)
async deleteUser(userId: string)
```

## UI Components

### Admin Dashboard (`app/admin/index.tsx`)

- Displays role badge (Admin or Super Admin) in header
- Filters admin sections based on user role
- Shows "Admin Management" section only to super admins

### Admin Management Page (`app/admin/admins.tsx`)

**Access**: Super Admin only

**Features**:
- View all admin and super admin users
- Toggle admin status for users
- Toggle super admin status for users
- Delete admin accounts
- Search and filter admins
- Statistics dashboard showing admin counts

**Actions**:
- **Promote to Admin**: Grant admin privileges to a user
- **Revoke Admin**: Remove admin privileges from a user
- **Grant Super Admin**: Promote an admin to super admin
- **Revoke Super Admin**: Demote a super admin to regular admin
- **Delete Admin**: Remove an admin account (with confirmation)

### User Management Page (`app/admin/users.tsx`)

**Access**: Admin and Super Admin

**Enhanced Features for Super Admins**:
- Promote regular users to admin
- Revoke admin privileges from users
- Visual badges showing user roles (Admin, Super Admin)
- Color-coded avatars based on role

## TypeScript Types

### UserProfile Interface

Extended with role properties:

```typescript
export interface UserProfile {
  // ... existing properties
  isAdmin?: boolean;
  isSuperAdmin?: boolean;
}
```

### Database Types

Updated `app/integrations/supabase/types.ts` to include:

```typescript
user_profiles: {
  Row: {
    // ... existing fields
    is_admin: boolean | null;
    is_super_admin: boolean | null;
  }
}
```

## Context Updates

### AppContext

The `AppContext` now loads and exposes role information:

```typescript
const fullProfile: UserProfile = {
  // ... existing properties
  isAdmin: profile.is_admin ?? false,
  isSuperAdmin: profile.is_super_admin ?? false,
};
```

## Security Considerations

1. **Database-Level Enforcement**: All role checks are enforced at the database level using RLS policies
2. **Function Security**: Role check functions use `SECURITY DEFINER` to bypass RLS and prevent infinite recursion
3. **Trigger Protection**: Database triggers ensure super admins always have admin privileges
4. **UI Validation**: UI components check roles before displaying sensitive actions
5. **API Validation**: Backend services validate roles before executing privileged operations

## Usage Examples

### Checking User Role in Components

```typescript
import { useApp } from '@/contexts/AppContext';

function MyComponent() {
  const { userProfile } = useApp();
  
  if (userProfile?.isSuperAdmin) {
    // Show super admin features
  } else if (userProfile?.isAdmin) {
    // Show admin features
  }
}
```

### Promoting a User to Admin

```typescript
import { userService } from '@/services/supabaseService';

// Super admin only
await userService.updateUserAdminStatus(userId, true);
```

### Granting Super Admin Privileges

```typescript
import { userService } from '@/services/supabaseService';

// Super admin only
await userService.updateUserSuperAdminStatus(userId, true);
```

## Admin Workflow

### Creating a New Admin

1. Super admin navigates to User Management
2. Finds the user to promote
3. Clicks "Make Admin" button
4. Confirms the action
5. User is granted admin privileges

### Managing Existing Admins

1. Super admin navigates to Admin Management
2. Views list of all admins and super admins
3. Can toggle admin/super admin status
4. Can delete admin accounts
5. All actions require confirmation

### Admin Permissions

**Regular Admins Can**:
- View and manage orders
- Update order statuses
- Manage menu items (add, edit, delete)
- Manage events
- Manage merchandise
- View user information
- Manage reservations
- Send notifications
- View analytics

**Super Admins Can Do Everything Admins Can, Plus**:
- Promote users to admin
- Revoke admin privileges
- Grant super admin status
- Revoke super admin status
- Delete admin accounts
- View admin management dashboard

## Testing

### Test Scenarios

1. **Super Admin Access**
   - Verify super admin can access Admin Management page
   - Verify super admin can promote users to admin
   - Verify super admin can grant super admin privileges

2. **Admin Access**
   - Verify admin cannot access Admin Management page
   - Verify admin can perform standard admin functions
   - Verify admin cannot modify role assignments

3. **Regular User Access**
   - Verify regular users cannot access admin pages
   - Verify regular users can only view their own data

4. **Database Triggers**
   - Verify super admins automatically get admin privileges
   - Verify role changes are properly enforced

## Troubleshooting

### Common Issues

1. **Admin cannot access admin pages**
   - Check if `is_admin` is set to `TRUE` in database
   - Verify RLS policies are enabled
   - Check if `is_admin()` function exists

2. **Super admin cannot manage admins**
   - Check if `is_super_admin` is set to `TRUE` in database
   - Verify `is_super_admin()` function exists
   - Check RLS policies for user_profiles table

3. **Role changes not taking effect**
   - Reload user profile in AppContext
   - Check database triggers are active
   - Verify RLS policies are not conflicting

## Future Enhancements

Potential improvements to the RBAC system:

1. **Granular Permissions**: Add specific permissions for different admin functions
2. **Role Templates**: Create predefined role templates with specific permission sets
3. **Audit Logging**: Track all admin actions and role changes
4. **Session Management**: View and manage active admin sessions
5. **Two-Factor Authentication**: Require 2FA for admin and super admin accounts
6. **IP Whitelisting**: Restrict admin access to specific IP addresses
7. **Time-Based Access**: Set expiration dates for admin privileges
8. **Department-Based Roles**: Create roles for specific departments (kitchen, front desk, etc.)

## Migration History

1. **add_super_admin_role**: Added `is_super_admin` column and created role management functions
2. **ensure_super_admin_is_admin**: Added triggers to ensure super admins always have admin privileges

## Related Files

- `app/admin/admins.tsx` - Admin management page
- `app/admin/users.tsx` - User management page with role controls
- `app/admin/index.tsx` - Admin dashboard with role-based navigation
- `services/supabaseService.ts` - API services for role management
- `contexts/AppContext.tsx` - Context provider with role information
- `types/index.ts` - TypeScript type definitions
- `app/integrations/supabase/types.ts` - Database type definitions
