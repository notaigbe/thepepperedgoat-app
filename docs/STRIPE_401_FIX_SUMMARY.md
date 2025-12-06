
# Stripe Webhook 401 Error - Fix Summary

## Problem

After successful payment, the app gets stuck on "Processing..." and the backend logs show:

```
Status: 401 Unauthorized
Function: stripe-webhook
```

## Root Cause

The stripe-webhook edge function was requiring JWT authentication, but **Stripe webhooks don't include authentication headers**. Stripe's servers call the webhook directly (not the mobile app), so they can't provide a bearer token.

Webhooks authenticate using **signature verification** instead of JWT tokens.

## Solution

### 1. Disable JWT Verification for Webhook

Created `supabase/functions/stripe-webhook/config.json`:

```json
{
  "verify_jwt": false
}
```

This tells Supabase to allow unauthenticated requests to this endpoint.

### 2. Updated Webhook Function

Modified the webhook function to:
- Use service role key for database access (bypasses RLS)
- Properly handle CORS
- Only accept POST requests
- Return appropriate status codes
- Improve error logging

### 3. Security

The webhook is still secure because:
- **Signature verification**: Every request is verified using the webhook signing secret
- **Service role access**: Database operations use service role key (not user tokens)
- **HTTPS only**: All communication is encrypted
- **Stripe validation**: Only requests from Stripe with valid signatures are processed

## Files Changed

1. **supabase/functions/stripe-webhook/index.ts**
   - Added proper CORS headers
   - Improved error handling
   - Better logging
   - Type safety improvements

2. **supabase/functions/stripe-webhook/config.json** (NEW)
   - Disables JWT verification
   - Allows public webhook access

3. **docs/STRIPE_WEBHOOK_TROUBLESHOOTING.md** (NEW)
   - Comprehensive troubleshooting guide
   - Common issues and solutions
   - Testing procedures

4. **docs/STRIPE_WEBHOOK_DEPLOYMENT.md** (NEW)
   - Deployment instructions
   - Verification steps
   - Rollback procedures

## Deployment Steps

### Quick Fix (Immediate)

```bash
# 1. Deploy the updated webhook function
supabase functions deploy stripe-webhook

# 2. Verify deployment
supabase functions list

# 3. Test with Stripe CLI
stripe trigger payment_intent.succeeded

# 4. Check logs
supabase functions logs stripe-webhook
```

### Verification

After deployment, test the complete flow:

1. Open mobile app
2. Add items to cart
3. Go to checkout
4. Complete payment with test card: 4242 4242 4242 4242
5. Verify:
   - ✓ Payment sheet closes
   - ✓ "Processing payment..." appears
   - ✓ Within 1-2 seconds: "Order Confirmed!" alert
   - ✓ Cart is cleared
   - ✓ Points are awarded
   - ✓ Order appears in history

### Expected Logs

After successful payment, you should see:

```
=== Stripe Webhook Request Received ===
Method: POST
✓ Webhook signature verified successfully
=== Webhook Event Details ===
Event type: payment_intent.succeeded
Event ID: evt_xxx
Processing payment success for order: xxx user: xxx
✓ stripe_payments table updated
✓ orders table updated
✓ Notification created
✓ Payment succeeded and order updated successfully
=== Webhook processed successfully ===
```

## Why This Happened

The default behavior for Supabase Edge Functions is to require JWT authentication. This is correct for most functions that are called by authenticated users.

However, webhooks are a special case:
- They're called by external services (Stripe)
- They don't have user context
- They authenticate using signatures, not tokens

The `config.json` file explicitly tells Supabase: "This function is a webhook, don't require JWT."

## Security Considerations

### Is it safe to disable JWT verification?

**Yes**, because:

1. **Signature Verification**: The webhook validates every request using Stripe's signing secret. Only Stripe can generate valid signatures.

2. **Service Role Key**: Database operations use the service role key, which has full access but is only available server-side.

3. **No User Data Exposure**: The webhook doesn't expose user data. It only updates order status based on payment events.

4. **HTTPS Only**: All communication is encrypted.

5. **Event Validation**: The webhook only processes specific event types and validates all data.

### What if someone tries to call the webhook directly?

Without a valid Stripe signature, the request will be rejected with a 400 error:

```json
{
  "error": "Webhook signature verification failed"
}
```

## Testing

### Test Successful Payment

```bash
stripe trigger payment_intent.succeeded
```

Expected: Order status updates to "preparing", payment status to "succeeded"

### Test Failed Payment

```bash
stripe trigger payment_intent.payment_failed
```

Expected: Order status updates to "cancelled", payment status to "failed"

### Test in Mobile App

1. Use test card: 4242 4242 4242 4242
2. Complete payment
3. Verify order confirmation

## Monitoring

### Check Webhook Status

```bash
# View recent webhook calls
supabase functions logs stripe-webhook

# Monitor in real-time
supabase functions logs stripe-webhook --follow
```

### Check Stripe Dashboard

1. Go to: https://dashboard.stripe.com/test/webhooks
2. Click on your webhook endpoint
3. View recent events
4. Verify all show 200 OK (not 401)

## Rollback

If issues occur:

```bash
# Rollback to previous version
supabase functions rollback stripe-webhook --version <previous-version>

# Or redeploy from git
git checkout <previous-commit>
supabase functions deploy stripe-webhook
```

## Additional Notes

- This fix only affects the webhook endpoint
- Other edge functions (like create-payment-intent) still require authentication
- The mobile app flow remains unchanged
- No changes needed to the mobile app code
- No database migrations required

## Support

If you continue to experience issues:

1. Check the troubleshooting guide: `docs/STRIPE_WEBHOOK_TROUBLESHOOTING.md`
2. View deployment guide: `docs/STRIPE_WEBHOOK_DEPLOYMENT.md`
3. Check Supabase logs for detailed error messages
4. Verify all environment variables are set correctly
5. Test webhook with Stripe CLI

---

**Status**: Fixed
**Date**: 2024
**Impact**: Resolves payment processing stuck on "Processing..."
