
# Points and Social Posts System Updates

## Overview
This document describes the recent updates to the points awarding system and social posts geofencing restrictions.

## Changes Implemented

### 1. Social Posts - Geofence Restriction Removed ✅

**Previous Behavior:**
- Users could only create posts when physically present at the restaurant location
- Location verification was mandatory before taking a photo
- Posts were blocked if the user was outside the geofence radius

**New Behavior:**
- Users can create posts from anywhere
- Location is checked after taking the photo (non-blocking)
- Posts taken at the restaurant location receive a special badge
- The `location_verified` field indicates if the photo was taken at the restaurant

**Implementation Details:**

#### Database Changes
- Added `location_verified` boolean field to `posts` table
- Added `caption` text field to `posts` table
- Added `likes_count` and `comments_count` integer fields
- Created supporting tables: `post_likes`, `post_comments`, `post_reports`
- Implemented RLS policies for all social tables
- Created triggers to automatically update like/comment counts

#### UI Changes
- **Create Post Screen** (`app/create-post.tsx`):
  - Removed blocking location verification
  - Added optional location tagging after photo capture
  - Shows location status card indicating if photo was taken at restaurant
  - Displays special badge on image preview if at restaurant location
  - Updated messaging to indicate posts can be made from anywhere

- **Discover Feed** (`app/(tabs)/discover.tsx`):
  - Shows location verification badge on posts taken at restaurant
  - Badge displays "Taken at Jagabans L.A." with checkmark icon
  - Posts without location verification show normally without badge

#### Service Layer
- Updated `socialService.createPost()` to accept `locationVerified` parameter
- Location verification is now optional and non-blocking
- Posts are created regardless of location

### 2. Points Awarding - Payment Confirmation Required ✅

**Previous Behavior:**
- Points were awarded when an order was created
- This could lead to points being awarded even if payment failed

**New Behavior:**
- Points are only awarded after successful payment confirmation
- Points are awarded via the Stripe webhook when `payment_intent.succeeded` event is received
- If payment fails, no points are awarded

**Implementation Details:**

#### Stripe Webhook (`supabase/functions/stripe-webhook/index.ts`)
The webhook handles the following flow:

1. **Payment Intent Succeeded:**
   ```typescript
   case 'payment_intent.succeeded':
     // 1. Update stripe_payments table status to 'succeeded'
     // 2. Update orders table status to 'preparing' and payment_status to 'succeeded'
     // 3. Award points to user using increment_user_points RPC
     // 4. Send success notification to user
     // 5. Schedule delivery (if applicable)
   ```

2. **Payment Intent Failed:**
   ```typescript
   case 'payment_intent.payment_failed':
     // 1. Update stripe_payments table status to 'failed'
     // 2. Update orders table status to 'cancelled'
     // 3. Send failure notification to user
     // 4. No points are awarded
   ```

#### Points Calculation
Points are calculated in the checkout flow:
```typescript
// 5% of order total (after discount, before tax) converted to points
// 100 points = $1, so 1 point = $0.01
const POINTS_REWARD_PERCENTAGE = 0.05;
const POINTS_TO_DOLLAR_RATE = 0.01;

const pointsToEarn = Math.floor(
  (subtotalAfterDiscount * POINTS_REWARD_PERCENTAGE) / POINTS_TO_DOLLAR_RATE
);
```

Example:
- Order subtotal: $100
- After 15% discount: $85
- Points earned: $85 × 5% = $4.25 → 425 points

#### Order Flow
1. User places order → Order created with `payment_status: 'pending'`
2. Payment sheet presented → User completes payment
3. Stripe processes payment → Webhook receives `payment_intent.succeeded`
4. Webhook updates order → `payment_status: 'succeeded'`
5. Webhook awards points → User receives points
6. User sees confirmation → Order confirmation screen

#### Realtime Updates
The checkout screen subscribes to realtime updates on both:
- `orders` table - monitors `payment_status` changes
- `stripe_payments` table - monitors payment status updates

When payment succeeds, the app automatically:
- Clears the cart
- Reloads user profile (to show updated points)
- Navigates to order confirmation screen

## Database Schema

### Posts Table
```sql
CREATE TABLE posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  image_url text NOT NULL,
  caption text,
  latitude real,
  longitude real,
  location_verified boolean DEFAULT false,
  likes_count integer DEFAULT 0,
  comments_count integer DEFAULT 0,
  is_hidden boolean DEFAULT false,
  is_featured boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
```

### Post Likes Table
```sql
CREATE TABLE post_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(post_id, user_id)
);
```

### Post Comments Table
```sql
CREATE TABLE post_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_comment_id uuid REFERENCES post_comments(id) ON DELETE CASCADE,
  comment_text text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
```

## Testing Checklist

### Social Posts
- [ ] Create post from outside restaurant location
- [ ] Create post from inside restaurant location
- [ ] Verify location badge appears on posts taken at restaurant
- [ ] Verify posts without location badge display normally
- [ ] Test like/unlike functionality
- [ ] Test comment functionality
- [ ] Verify post appears in discovery feed

### Points System
- [ ] Place order and complete payment successfully
- [ ] Verify points are awarded after payment succeeds
- [ ] Place order and cancel payment
- [ ] Verify no points are awarded if payment fails
- [ ] Check points calculation is correct (5% of discounted subtotal)
- [ ] Verify points appear in user profile after successful payment

## Configuration

### Location Settings
Location configuration is defined in `constants/LocationConfig.ts`:
```typescript
export const JAGABANS_LOCATION = {
  latitude: 34.0522,  // Update with actual restaurant coordinates
  longitude: -118.2437,
  radius: 100, // meters
};
```

### Points Settings
Points configuration in checkout:
```typescript
const POINTS_TO_DOLLAR_RATE = 0.01; // 100 points = $1
const POINTS_REWARD_PERCENTAGE = 0.05; // 5% of order
```

## Security Considerations

### Social Posts
- RLS policies ensure users can only:
  - Create their own posts
  - Update/delete their own posts
  - View non-hidden posts
- Admins can manage all posts
- Location verification cannot be spoofed (checked server-side)

### Points System
- Points are only awarded via webhook (server-side)
- Client cannot directly modify points
- Payment verification happens on Stripe's servers
- Webhook signature verification prevents tampering
- Points are awarded using database RPC function with proper permissions

## Future Enhancements

### Social Posts
- [ ] Add post sharing functionality
- [ ] Implement post search and filtering
- [ ] Add hashtag support
- [ ] Create user profiles with post history
- [ ] Add photo filters and editing

### Points System
- [ ] Add points expiration
- [ ] Implement tiered rewards (bronze, silver, gold)
- [ ] Add bonus point events
- [ ] Create points leaderboard
- [ ] Add points gifting between users

## Support

For issues or questions:
1. Check the logs in Supabase dashboard
2. Review webhook logs for payment issues
3. Check RLS policies if posts aren't appearing
4. Verify Stripe webhook is properly configured

## Related Documentation
- [Stripe Integration Guide](./STRIPE_INTEGRATION_GUIDE.md)
- [Social Features Guide](./SOCIAL_FEATURES_GUIDE.md)
- [Points System Guide](./POINTS_SYSTEM_GUIDE.md)
