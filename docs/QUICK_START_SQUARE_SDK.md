
# Quick Start: Square In-App Payments SDK

## TL;DR

Get up and running with Square In-App Payments SDK in 5 minutes.

## Prerequisites

- Square Developer Account
- React Native development environment
- Expo CLI installed

## Step 1: Get Your Square Application ID (2 minutes)

1. Go to https://developer.squareup.com/apps
2. Sign in or create account
3. Click "Create App" or select existing app
4. Go to "Credentials"
5. Copy your **Sandbox Application ID** (starts with `sandbox-sq0idb-`)

## Step 2: Configure the App (1 minute)

Open `app/checkout.tsx` and find line ~120:

```typescript
const applicationId = 'sandbox-sq0idb-YOUR_APP_ID'; // Replace with actual app ID
```

Replace `YOUR_APP_ID` with your actual Sandbox Application ID:

```typescript
const applicationId = 'sandbox-sq0idb-abc123xyz456';
```

Do the same in `app/payment-methods.tsx` around line ~50.

## Step 3: Install iOS Dependencies (1 minute)

```bash
cd ios
pod install
cd ..
```

## Step 4: Run the App (1 minute)

```bash
# For iOS
npm run ios

# For Android
npm run android
```

## Step 5: Test It Out (2 minutes)

1. Add items to cart
2. Go to checkout
3. Select "New Card"
4. Click "Enter Card Details"
5. Enter test card: `4111 1111 1111 1111`
6. Expiration: Any future date (e.g., `12/25`)
7. CVV: Any 3 digits (e.g., `123`)
8. Postal Code: Any 5 digits (e.g., `12345`)
9. Complete payment
10. Check Payment Methods screen to see saved card

## That's It!

You're now using the Square In-App Payments SDK. Users can add and manage cards directly in the app.

## Test Cards

Use these for sandbox testing:

- **Visa:** `4111 1111 1111 1111`
- **Mastercard:** `5105 1051 0510 5100`
- **Amex:** `3782 822463 10005`
- **Discover:** `6011 0009 9013 9424`

All test cards accept:
- Any future expiration date
- Any 3-digit CVV
- Any postal code

## Common Issues

### "Failed to initialize Square SDK"

**Fix:** Double-check your Application ID is correct and has no extra spaces.

### Card entry UI not showing

**Fix:** 
1. Close the app completely
2. Rebuild: `npm run ios` or `npm run android`
3. Try again

### iOS build fails

**Fix:**
```bash
cd ios
pod install
cd ..
npm run ios
```

## Next Steps

- Read full documentation: `docs/SQUARE_IN_APP_PAYMENTS_INTEGRATION.md`
- Configure for production: `docs/SQUARE_APP_ID_SETUP.md`
- Review migration guide: `docs/MIGRATION_TO_IN_APP_PAYMENTS.md`

## Production Deployment

When ready for production:

1. Get Production Application ID from Square Dashboard
2. Replace sandbox ID with production ID
3. Update backend to use production credentials
4. Test with real cards (small amounts)
5. Deploy!

## Support

- Square Docs: https://developer.squareup.com/docs/in-app-payments-sdk
- Square Dashboard: https://developer.squareup.com/apps
- GitHub: https://github.com/square/in-app-payments-react-native-plugin

---

**Happy coding! 🚀**
