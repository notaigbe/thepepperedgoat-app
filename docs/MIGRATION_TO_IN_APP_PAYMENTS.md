
# Migration to Square In-App Payments SDK

## Summary

This document outlines the migration from the website-based card management flow to the Square In-App Payments SDK, allowing users to add and manage payment methods directly within the mobile app.

## What Changed

### Before (Website Redirect Flow)

**User Experience:**
- Users had to visit the website to add new cards
- Cards were saved during website checkout
- App displayed saved cards from `square_cards` table
- No way to add cards directly in the app

**Technical Implementation:**
- Alert message directing users to website
- WebView attempt (failed due to HTTPS requirements)
- Reliance on website for card tokenization

**Limitations:**
- Poor user experience (context switching)
- Friction in checkout process
- Lower conversion rates
- Confusion about where to add cards

### After (In-App SDK Flow)

**User Experience:**
- Users can add cards directly in the app
- Native card entry UI (Square SDK)
- Option to save cards during checkout
- Manage saved cards in Payment Methods screen
- Seamless checkout experience

**Technical Implementation:**
- Square In-App Payments SDK integration
- Native card tokenization
- Direct payment processing
- Card saving during checkout

**Benefits:**
- Better user experience
- Higher conversion rates
- No context switching
- Professional, polished feel

## Files Modified

### 1. `app/checkout.tsx`

**Changes:**
- Added Square In-App Payments SDK imports
- Implemented `initializeSquare()` function
- Added `handleCardEntry()` for card tokenization
- Updated payment method selection UI
- Added "Enter Card Details" button
- Added "Save card" toggle
- Updated `processSquarePayment()` to handle card nonces
- Removed WebView-based card form
- Removed website redirect alerts

**New Features:**
- Native card entry via Square SDK
- Card nonce generation
- Option to save cards for future use
- Better error handling
- Loading states during card entry

### 2. `app/payment-methods.tsx`

**Changes:**
- Complete rewrite of the screen
- Removed manual card entry form
- Added Square SDK integration
- Implemented card management features
- Added info banner explaining card saving
- Updated UI to match new flow

**New Features:**
- View all saved cards
- Set default card
- Remove cards
- Better empty state
- Loading states
- Info about adding cards during checkout

### 3. `package.json`

**Changes:**
- Added `react-native-square-in-app-payments` dependency

**New Dependency:**
```json
"react-native-square-in-app-payments": "^1.7.6"
```

## New Files Created

### 1. `docs/SQUARE_IN_APP_PAYMENTS_INTEGRATION.md`

Comprehensive documentation covering:
- Architecture overview
- Setup instructions
- Usage flow
- Database schema
- API integration
- Security considerations
- Testing guide
- Troubleshooting
- Migration notes

### 2. `docs/SQUARE_APP_ID_SETUP.md`

Step-by-step guide for:
- Creating Square Developer account
- Creating an application
- Getting Application IDs
- Configuring IDs in code
- Environment-based configuration
- Backend configuration
- Testing
- Production deployment
- Security best practices

### 3. `docs/MIGRATION_TO_IN_APP_PAYMENTS.md`

This document, covering:
- Summary of changes
- Before/after comparison
- Files modified
- New files created
- Setup instructions
- Testing guide
- Deployment checklist

## Setup Instructions

### 1. Install Dependencies

The dependency has already been installed:

```bash
npm install react-native-square-in-app-payments
```

### 2. Configure Square Application ID

**Get your Application ID:**
1. Go to [Square Developer Dashboard](https://developer.squareup.com/apps)
2. Select or create your application
3. Go to Credentials
4. Copy Sandbox Application ID for testing
5. Copy Production Application ID for production

**Update the code:**

In `app/checkout.tsx`, find the `initializeSquare` function and replace:

```typescript
const applicationId = 'sandbox-sq0idb-YOUR_APP_ID'; // Replace with actual app ID
```

With your actual Sandbox Application ID:

```typescript
const applicationId = 'sandbox-sq0idb-abc123xyz'; // Your actual ID
```

Do the same in `app/payment-methods.tsx`.

### 3. iOS Setup

```bash
cd ios
pod install
cd ..
```

### 4. Android Setup

No additional setup required. The package handles Android configuration automatically.

### 5. Test the Integration

1. Run the app: `npm run ios` or `npm run android`
2. Add items to cart
3. Go to checkout
4. Select "New Card"
5. Click "Enter Card Details"
6. Use test card: `4111 1111 1111 1111`
7. Enter any future expiration
8. Enter any 3-digit CVV
9. Enter any postal code
10. Complete payment
11. Verify card is saved (if "Save card" was enabled)

## Testing Guide

### Sandbox Testing

**Test Cards:**
- Visa: `4111 1111 1111 1111`
- Mastercard: `5105 1051 0510 5100`
- Amex: `3782 822463 10005`
- Discover: `6011 0009 9013 9424`

**Test Scenarios:**

1. **Add New Card and Save**
   - Go to checkout
   - Select "New Card"
   - Enter card details
   - Enable "Save card"
   - Complete payment
   - Verify card appears in Payment Methods

2. **Add New Card Without Saving**
   - Go to checkout
   - Select "New Card"
   - Enter card details
   - Disable "Save card"
   - Complete payment
   - Verify card does NOT appear in Payment Methods

3. **Use Stored Card**
   - Go to checkout
   - Select "Saved Card"
   - Choose a card
   - Complete payment
   - Verify payment succeeds

4. **Set Default Card**
   - Go to Payment Methods
   - Tap "Set as Default" on a card
   - Verify badge changes to "Default"
   - Go to checkout
   - Verify default card is auto-selected

5. **Remove Card**
   - Go to Payment Methods
   - Tap trash icon on a card
   - Confirm removal
   - Verify card is removed from list

6. **Cancel Card Entry**
   - Go to checkout
   - Select "New Card"
   - Click "Enter Card Details"
   - Close the card entry UI
   - Verify app returns to checkout

7. **Card Entry Error**
   - Go to checkout
   - Select "New Card"
   - Click "Enter Card Details"
   - Enter invalid card number
   - Verify error message is shown

### Production Testing

Before deploying to production:

1. **Update Application ID**
   - Replace sandbox ID with production ID
   - Test with real cards (small amounts)

2. **Verify Backend Configuration**
   - Ensure production Access Token is set
   - Ensure production Location ID is set
   - Set `SQUARE_ENVIRONMENT=production`

3. **Test Real Payments**
   - Make small test purchases
   - Verify charges appear in Square Dashboard
   - Verify card saving works
   - Verify stored card payments work

4. **Test Error Scenarios**
   - Declined card
   - Expired card
   - Insufficient funds
   - Network errors

## Deployment Checklist

### Pre-Deployment

- [ ] Replace Sandbox Application ID with Production Application ID
- [ ] Update backend to use Production Access Token
- [ ] Update backend to use Production Location ID
- [ ] Set `SQUARE_ENVIRONMENT=production` in Supabase
- [ ] Test with real cards
- [ ] Verify card saving works
- [ ] Verify stored card payments work
- [ ] Test error handling
- [ ] Review security settings
- [ ] Update documentation

### Deployment

- [ ] Build production app
- [ ] Update Supabase secrets
- [ ] Deploy Edge Functions
- [ ] Submit to App Store / Play Store
- [ ] Monitor for errors
- [ ] Track conversion rates
- [ ] Gather user feedback

### Post-Deployment

- [ ] Monitor payment success rates
- [ ] Track card save rates
- [ ] Monitor error logs
- [ ] Review user feedback
- [ ] Optimize based on data

## Breaking Changes

### For Users

- **No breaking changes** - Users can still use previously saved cards
- **New feature** - Users can now add cards in the app
- **Better experience** - No more website redirects

### For Developers

- **New dependency** - `react-native-square-in-app-payments` must be installed
- **Configuration required** - Square Application ID must be set
- **iOS rebuild required** - Run `pod install` after installing package
- **Code changes** - Checkout and Payment Methods screens have been rewritten

## Rollback Plan

If issues arise, you can rollback to the previous flow:

1. **Revert code changes**
   ```bash
   git revert <commit-hash>
   ```

2. **Remove dependency**
   ```bash
   npm uninstall react-native-square-in-app-payments
   ```

3. **Rebuild app**
   ```bash
   npm run ios
   npm run android
   ```

4. **Restore previous behavior**
   - Users will see website redirect message again
   - Stored cards will still work
   - No new cards can be added in app

## Known Issues

### iOS

- **Issue:** Card entry UI may not show on first attempt
- **Workaround:** Close and reopen the app
- **Status:** Investigating

### Android

- **Issue:** None known at this time
- **Status:** Stable

### Web

- **Issue:** Square In-App Payments SDK not supported on web
- **Workaround:** Use Square Web Payments SDK for web version
- **Status:** Expected behavior

## Support

For issues or questions:

1. Check documentation:
   - `docs/SQUARE_IN_APP_PAYMENTS_INTEGRATION.md`
   - `docs/SQUARE_APP_ID_SETUP.md`

2. Review Square documentation:
   - [Square In-App Payments SDK](https://developer.squareup.com/docs/in-app-payments-sdk/overview)
   - [React Native Plugin](https://github.com/square/in-app-payments-react-native-plugin)

3. Check logs:
   - Console logs in app
   - Supabase Edge Function logs
   - Square Dashboard logs

4. Contact support:
   - Square Developer Forums
   - Square Support
   - Internal development team

## Conclusion

The migration to Square In-App Payments SDK significantly improves the user experience by allowing users to add and manage payment methods directly within the app. The implementation is secure, PCI-compliant, and provides a professional checkout experience.

Key benefits:
- ✅ Better user experience
- ✅ Higher conversion rates
- ✅ No context switching
- ✅ Professional appearance
- ✅ Secure and PCI-compliant
- ✅ Easy to maintain

Next steps:
1. Configure Square Application ID
2. Test thoroughly in sandbox
3. Deploy to production
4. Monitor performance
5. Gather user feedback
6. Iterate and improve
