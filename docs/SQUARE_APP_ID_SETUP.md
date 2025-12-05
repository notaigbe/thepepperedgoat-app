
# Square Application ID Setup Guide

## Overview

To use the Square In-App Payments SDK, you need to configure your Square Application ID in the app. This guide walks you through obtaining and configuring your Application ID for both sandbox (testing) and production environments.

## Prerequisites

- Square Developer Account
- Access to Square Developer Dashboard
- React Native development environment set up

## Step 1: Create a Square Developer Account

1. Go to [Square Developer Portal](https://developer.squareup.com/)
2. Click "Sign Up" or "Sign In"
3. Complete the registration process
4. Verify your email address

## Step 2: Create an Application

1. Log in to [Square Developer Dashboard](https://developer.squareup.com/apps)
2. Click "Create App" or "+" button
3. Enter your application name (e.g., "Jagabans LA Food Ordering")
4. Select your business location
5. Click "Create Application"

## Step 3: Get Your Application IDs

### Sandbox Application ID (for testing)

1. In your application dashboard, click on "Credentials" in the left sidebar
2. Under "Sandbox" section, find "Application ID"
3. Copy the Sandbox Application ID (starts with `sandbox-sq0idb-`)
4. Save this for testing purposes

### Production Application ID (for live app)

1. In the same "Credentials" page, scroll to "Production" section
2. Find "Application ID"
3. Copy the Production Application ID (starts with `sq0idp-`)
4. Save this for production deployment

## Step 4: Configure Application ID in Code

### For Development/Testing

Open `app/checkout.tsx` and update the `initializeSquare` function:

```typescript
const initializeSquare = async () => {
  try {
    // Use your Sandbox Application ID for testing
    const applicationId = 'sandbox-sq0idb-YOUR_SANDBOX_APP_ID_HERE';
    
    await SQIPCore.setSquareApplicationId(applicationId);
    console.log('Square SDK initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Square SDK:', error);
    showToast('error', 'Payment system initialization failed');
  }
};
```

Also update `app/payment-methods.tsx`:

```typescript
const initializeSquare = async () => {
  try {
    const applicationId = 'sandbox-sq0idb-YOUR_SANDBOX_APP_ID_HERE';
    await SQIPCore.setSquareApplicationId(applicationId);
    console.log('Square SDK initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Square SDK:', error);
  }
};
```

### For Production

When deploying to production, update both files to use the Production Application ID:

```typescript
const applicationId = 'sq0idp-YOUR_PRODUCTION_APP_ID_HERE';
```

## Step 5: Environment-Based Configuration (Recommended)

For better management, use environment variables:

### Create Environment Configuration

Create a file `app/config/square.ts`:

```typescript
const SQUARE_CONFIG = {
  sandbox: {
    applicationId: 'sandbox-sq0idb-YOUR_SANDBOX_APP_ID',
  },
  production: {
    applicationId: 'sq0idp-YOUR_PRODUCTION_APP_ID',
  },
};

// Determine environment (you can use expo-constants or other methods)
const isDevelopment = __DEV__;

export const getSquareApplicationId = () => {
  return isDevelopment 
    ? SQUARE_CONFIG.sandbox.applicationId 
    : SQUARE_CONFIG.production.applicationId;
};
```

### Update Checkout Screen

```typescript
import { getSquareApplicationId } from '@/app/config/square';

const initializeSquare = async () => {
  try {
    const applicationId = getSquareApplicationId();
    await SQIPCore.setSquareApplicationId(applicationId);
    console.log('Square SDK initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Square SDK:', error);
    showToast('error', 'Payment system initialization failed');
  }
};
```

### Update Payment Methods Screen

```typescript
import { getSquareApplicationId } from '@/app/config/square';

const initializeSquare = async () => {
  try {
    const applicationId = getSquareApplicationId();
    await SQIPCore.setSquareApplicationId(applicationId);
    console.log('Square SDK initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Square SDK:', error);
  }
};
```

## Step 6: Configure Backend (Supabase Edge Functions)

Your backend also needs Square credentials. Set these in Supabase:

1. Go to Supabase Dashboard
2. Navigate to Project Settings > Edge Functions > Secrets
3. Add the following secrets:

```bash
SQUARE_ACCESS_TOKEN=<your-square-access-token>
SQUARE_LOCATION_ID=<your-square-location-id>
SQUARE_ENVIRONMENT=sandbox  # or "production"
```

### Getting Square Access Token

1. In Square Developer Dashboard, go to "Credentials"
2. Under "Sandbox" or "Production", find "Access Token"
3. Click "Show" to reveal the token
4. Copy and save securely

### Getting Square Location ID

1. In Square Developer Dashboard, go to "Locations"
2. Select your business location
3. Copy the Location ID
4. Save for backend configuration

## Step 7: Test the Integration

### Sandbox Testing

1. Run your app in development mode
2. Add items to cart
3. Go to checkout
4. Click "Enter Card Details"
5. Use test card numbers:
   - Visa: `4111 1111 1111 1111`
   - Mastercard: `5105 1051 0510 5100`
   - Amex: `3782 822463 10005`
6. Enter any future expiration date
7. Enter any 3-digit CVV
8. Enter any postal code
9. Complete the payment

### Verify Card Saving

1. Complete a payment with "Save card" enabled
2. Go to Payment Methods screen
3. Verify the card appears in the list
4. Try using the saved card for another purchase

## Step 8: Production Deployment

### Pre-Production Checklist

- [ ] Replace Sandbox Application ID with Production Application ID
- [ ] Update backend to use Production Access Token
- [ ] Update backend to use Production Location ID
- [ ] Set `SQUARE_ENVIRONMENT=production` in Supabase
- [ ] Test with real cards (small amounts)
- [ ] Verify card saving works
- [ ] Verify stored card payments work
- [ ] Test error handling
- [ ] Review security settings

### Deployment Steps

1. Update Application IDs in code
2. Build production app
3. Update Supabase secrets
4. Deploy Edge Functions
5. Test thoroughly
6. Monitor for errors

## Security Best Practices

### Application ID Security

- ✅ Application IDs are safe to expose in client code
- ✅ They identify your app to Square
- ✅ They don't provide access to sensitive data
- ❌ Never expose Access Tokens in client code
- ❌ Never commit Access Tokens to version control

### Access Token Security

- ✅ Store Access Tokens in Supabase Secrets
- ✅ Use environment variables
- ✅ Rotate tokens periodically
- ✅ Use different tokens for sandbox and production
- ❌ Never hardcode tokens in source code
- ❌ Never commit tokens to Git

### Code Security

```typescript
// ✅ GOOD - Application ID in client code
const applicationId = 'sandbox-sq0idb-abc123';

// ❌ BAD - Access Token in client code
const accessToken = 'sq0atp-abc123'; // NEVER DO THIS!

// ✅ GOOD - Access Token in backend only
// In Supabase Edge Function:
const accessToken = Deno.env.get('SQUARE_ACCESS_TOKEN');
```

## Troubleshooting

### Issue: "Invalid Application ID"

**Cause:** Wrong Application ID or typo

**Solution:**
- Double-check Application ID in Square Dashboard
- Ensure you're using the correct environment (sandbox vs production)
- Verify no extra spaces or characters

### Issue: "Failed to initialize Square SDK"

**Cause:** Network issues or SDK not properly installed

**Solution:**
- Check internet connectivity
- Verify `react-native-square-in-app-payments` is installed
- Run `pod install` on iOS
- Clean and rebuild the app

### Issue: "Payment processing failed"

**Cause:** Backend configuration issues

**Solution:**
- Verify Access Token is correct
- Check Location ID is correct
- Ensure `SQUARE_ENVIRONMENT` matches Application ID environment
- Review Edge Function logs

### Issue: "Card entry UI not showing"

**Cause:** SDK initialization failed

**Solution:**
- Check console logs for initialization errors
- Verify Application ID is set before calling card entry
- Ensure native modules are linked correctly

## Support Resources

- [Square Developer Dashboard](https://developer.squareup.com/apps)
- [Square In-App Payments SDK Docs](https://developer.squareup.com/docs/in-app-payments-sdk/overview)
- [Square API Reference](https://developer.squareup.com/reference/square)
- [Square Developer Forums](https://developer.squareup.com/forums)
- [Square Support](https://squareup.com/help/contact)

## Next Steps

After configuring your Application ID:

1. ✅ Test card entry in sandbox
2. ✅ Test payment processing
3. ✅ Test card saving
4. ✅ Test stored card payments
5. ✅ Review error handling
6. ✅ Prepare for production deployment

## Conclusion

Proper configuration of the Square Application ID is essential for the In-App Payments SDK to function correctly. Follow this guide carefully, test thoroughly in sandbox, and ensure all security best practices are followed before deploying to production.
