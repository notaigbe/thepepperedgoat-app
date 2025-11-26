
# Admin Quick Reference Guide

## Role Hierarchy

```
Super Admin (Full Control)
    ↓
Admin (Standard Functions)
    ↓
Regular User (Customer)
```

## Quick Actions

### For Super Admins

#### Promote User to Admin
1. Go to **User Management**
2. Find the user
3. Click **Make Admin**
4. Confirm

#### Manage Admins
1. Go to **Admin Management** (Super Admin only)
2. View all admins
3. Toggle admin/super admin status
4. Delete admin accounts if needed

#### Grant Super Admin
1. Go to **Admin Management**
2. Find the admin
3. Click **Super Admin** toggle
4. Confirm (this gives full control)

### For All Admins

#### Manage Orders
1. Go to **Order Management**
2. View all orders
3. Update order status
4. View order details

#### Manage Menu
1. Go to **Menu Management**
2. Add new items
3. Edit existing items
4. Delete items
5. Toggle availability

#### Manage Reservations
1. Go to **Reservations**
2. View all bookings
3. Confirm/cancel reservations
4. Assign table numbers

#### Manage Events
1. Go to **Event Management**
2. Create new events
3. Edit event details
4. Delete events

#### Manage Merchandise
1. Go to **Merchandise**
2. Add new merch items
3. Update inventory
4. Set points cost

## Access Levels

| Feature | Regular User | Admin | Super Admin |
|---------|-------------|-------|-------------|
| View own orders | ✅ | ✅ | ✅ |
| View all orders | ❌ | ✅ | ✅ |
| Manage menu | ❌ | ✅ | ✅ |
| Manage events | ❌ | ✅ | ✅ |
| Manage merch | ❌ | ✅ | ✅ |
| View all users | ❌ | ✅ | ✅ |
| Promote to admin | ❌ | ❌ | ✅ |
| Manage admins | ❌ | ❌ | ✅ |
| Delete users | ❌ | ❌ | ✅ |

## Dashboard Sections

### Available to All Admins
- 📋 Menu Management
- 🧾 Order Management
- 🪑 Reservations
- 👥 User Management
- 🎉 Event Management
- 👕 Merchandise
- 🎁 Gift Cards
- 🔔 Notifications
- 📊 Analytics

### Super Admin Only
- 🛡️ **Admin Management** - Manage admin roles and permissions

## Tips

### Best Practices
- Always confirm before deleting users or admins
- Regularly review admin access
- Use super admin privileges carefully
- Keep track of who has admin access

### Security
- Don't share admin credentials
- Log out when finished
- Report suspicious activity
- Review admin actions regularly

### Common Tasks

**Update Order Status**
1. Orders → Find order → Change status → Save

**Add Menu Item**
1. Menu → Add Item → Fill details → Save

**Confirm Reservation**
1. Reservations → Find booking → Confirm → Assign table

**Promote User**
1. Users → Find user → Make Admin → Confirm

**Revoke Admin**
1. Admin Management → Find admin → Revoke Admin → Confirm

## Keyboard Shortcuts

- `Ctrl/Cmd + K` - Search (when available)
- `Esc` - Close modals
- `Enter` - Confirm actions

## Support

For technical issues or questions:
- Contact the development team
- Check the full documentation in `ROLE_BASED_ACCESS_CONTROL.md`
- Review error messages carefully

## Emergency Procedures

### Lost Super Admin Access
Contact the database administrator to manually update the `is_super_admin` flag in the database.

### Unauthorized Admin Activity
1. Immediately revoke admin access
2. Review recent actions
3. Change passwords
4. Report to management

### System Issues
1. Check database connection
2. Verify RLS policies are active
3. Review error logs
4. Contact technical support
