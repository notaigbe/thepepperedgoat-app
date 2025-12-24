
# Invite Code / Referral System Guide

## Overview

The invite code system allows existing users to invite new users to the app and earn rewards when those users sign up and make their first order. The system is **completely optional** - new users can sign up without an invite code.

## How It Works

### For Existing Users (Inviters)

1. **Get Your Referral Code**
   - Navigate to Profile → "Invite a Friend"
   - Your unique referral code is automatically generated (8-character alphanumeric code)
   - Share this code with friends via the "Share" or "Copy Code" buttons

2. **Earn Rewards**
   - **Signup Bonus**: Earn 500 points ($5) when your friend signs up with your code
   - **First Order Bonus**: Earn additional points when your friend completes their first order (to be implemented)

3. **Track Your Referrals**
   - View all your referrals in the "Invite a Friend" screen
   - See the status of each referral:
     - **Pending**: Code shared but not used yet
     - **Signed Up**: Friend created an account
     - **Completed**: Friend made their first order

### For New Users (Invitees)

1. **Sign Up With Invite Code**
   - During signup, you'll see an optional "Invite Code" field
   - Enter the code shared by your friend (case-insensitive)
   - If you don't have a code, simply leave it blank and continue

2. **Receive Bonus Points**
   - **Signup Bonus**: Get 500 points ($5) immediately upon signup with a valid code
   - Points are automatically added to your account after email verification

3. **What Happens If...**
   - **Invalid Code**: Signup continues normally, no bonus awarded
   - **Already Used Code**: Signup continues normally, no bonus awarded
   - **Your Own Code**: Cannot use your own referral code
   - **No Code Entered**: Signup works perfectly fine without a code

## Technical Implementation

### Database Structure

**Referrals Table**:
- `id`: Unique identifier
- `referrer_user_id`: User who created the referral code
- `referred_user_id`: User who used the code (null until redeemed)
- `referral_code`: 8-character unique code
- `status`: 'pending', 'signed_up', or 'completed_first_order'
- `signup_bonus_awarded`: Boolean flag
- `first_order_bonus_awarded`: Boolean flag
- `signup_bonus_points`: Points awarded at signup (500)
- `first_order_bonus_points`: Points awarded at first order
- `created_at`, `signed_up_at`, `first_order_at`: Timestamps

### Points System

**Conversion Rate**: 100 points = $1

**Bonus Structure**:
- Invitee signup bonus: 500 points ($5)
- Referrer signup bonus: 500 points ($5)
- First order bonus: To be configured (future implementation)

### Code Flow

1. **User Signs Up**:
   ```typescript
   await signUp(email, password, name, phone, inviteCode);
   ```

2. **AuthContext Processes Signup**:
   - Creates user account via Supabase Auth
   - If invite code provided, calls `redeem_referral_code()` function
   - Redemption happens asynchronously and doesn't block signup

3. **Database Function `redeem_referral_code()`**:
   - Validates the referral code
   - Checks for self-referral
   - Updates referral status to 'signed_up'
   - Awards 500 points to invitee
   - Awards 500 points to referrer
   - Records transactions in `points_transactions` table

4. **Points Transactions**:
   - All point changes are logged with type 'referral_bonus'
   - Includes reason text for transparency
   - Visible in user's transaction history

### Security & Validation

**RLS Policies**:
- Users can view their own referrals (as referrer or referee)
- Users can insert referrals (as referrer only)
- Users can update referrals when signing up (as referee)
- System can insert points transactions for referral bonuses

**Validation Rules**:
- Referral codes are unique and case-insensitive
- Cannot use your own referral code
- Cannot reuse an already-redeemed code
- Invalid codes don't prevent signup

### Error Handling

The system is designed to be **non-blocking**:
- Invalid invite codes don't prevent account creation
- Redemption errors are logged but don't show to user
- Signup always succeeds regardless of invite code status
- Users see success message with note about referral bonus

## User Experience

### Signup Flow

**Without Invite Code**:
1. Fill in name, email, password
2. Leave invite code field blank
3. Click "Sign Up"
4. Verify email
5. Start using the app

**With Invite Code**:
1. Fill in name, email, password
2. Enter invite code (e.g., "ABC12345")
3. Click "Sign Up"
4. See message: "Account created! Your referral bonus will be applied once your email is verified."
5. Verify email
6. Check profile - 500 bonus points added!

### Invite a Friend Screen

**Features**:
- Display your unique referral code prominently
- "Copy Code" button for easy sharing
- "Share" button to share via native share sheet
- "How It Works" section explaining the process
- "Your Referrals" list showing all invited users and their status

**Status Indicators**:
- 🟡 Pending: Waiting for friend to sign up
- 🟠 Signed Up: Friend created account
- 🟢 Completed: Friend made first order

## Future Enhancements

1. **First Order Bonus**:
   - Trigger when referred user completes first order
   - Award additional points to both users
   - Update referral status to 'completed_first_order'

2. **Referral Analytics**:
   - Total points earned from referrals
   - Conversion rate (signups → first orders)
   - Leaderboard of top referrers

3. **Promotional Campaigns**:
   - Temporary bonus multipliers
   - Special event referral bonuses
   - Tiered rewards for multiple referrals

4. **Email Notifications**:
   - Notify referrer when someone uses their code
   - Notify referrer when referee makes first order
   - Thank you email to referee with bonus confirmation

## Testing the System

### Test Scenario 1: Successful Referral

1. User A signs up and gets referral code "ABC12345"
2. User A shares code with User B
3. User B signs up with code "ABC12345"
4. Both users receive 500 points
5. Referral status shows "Signed Up"

### Test Scenario 2: Invalid Code

1. User C signs up with code "INVALID"
2. Signup succeeds normally
3. No bonus points awarded
4. No error shown to user

### Test Scenario 3: No Code

1. User D signs up without entering any code
2. Signup succeeds normally
3. No bonus points awarded
4. User can still use the app fully

## Support & Troubleshooting

**Common Issues**:

1. **"I entered a code but didn't get points"**
   - Check if email is verified
   - Verify code was entered correctly (case-insensitive)
   - Check if code was already used
   - Contact support with referral code

2. **"My friend didn't get their bonus"**
   - Confirm they entered the code during signup
   - Check their email verification status
   - View referral status in "Invite a Friend" screen

3. **"I can't find my referral code"**
   - Go to Profile → "Invite a Friend"
   - Code is automatically generated on first visit
   - Use "Copy Code" button to copy it

## Admin Management

Admins can view and manage referrals through the database:

```sql
-- View all referrals
SELECT * FROM referrals ORDER BY created_at DESC;

-- View referral statistics
SELECT 
  status,
  COUNT(*) as count,
  SUM(signup_bonus_points) as total_signup_points
FROM referrals
GROUP BY status;

-- View top referrers
SELECT 
  u.name,
  u.email,
  COUNT(r.id) as referral_count,
  SUM(CASE WHEN r.status = 'signed_up' THEN 1 ELSE 0 END) as signups,
  SUM(CASE WHEN r.status = 'completed_first_order' THEN 1 ELSE 0 END) as completed
FROM user_profiles u
JOIN referrals r ON u.user_id = r.referrer_user_id
GROUP BY u.id, u.name, u.email
ORDER BY referral_count DESC;
```

## Summary

The invite code system is a powerful tool for organic growth while rewarding loyal users. It's designed to be:

- **Optional**: Never required for signup
- **Simple**: Easy to understand and use
- **Rewarding**: Immediate value for both parties
- **Transparent**: Clear tracking and status updates
- **Reliable**: Non-blocking with graceful error handling

Users can grow their points balance by inviting friends, while new users get a welcome bonus to start their journey with the app.
