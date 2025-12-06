
# Stripe Webhook Troubleshooting Guide

## Issue: 401 Unauthorized Error on Webhook

### Problem
After successful payment, the app gets stuck on "Processing..." and backend logs show a 401 status on the stripe-webhook edge function.

### Root Cause
Stripe webhooks are called directly by Stripe's servers (not by the authenticated mobile app), so they don't include authentication headers. The webhook endpoint must be publicly accessible and authenticate using signature verification instead.

### Solution

#### 1. Ensure Webhook Function Doesn't Require JWT Verification

Create a `config.json` file in the webhook function directory:

**File**: `supabase/functions/stripe-webhook/config.json`
```json
{
  "verify_jwt": false
}
```

This tells Supabase to allow unauthenticated requests to this endpoint.

#### 2. Redeploy the Webhook Function

```bash
supabase functions deploy stripe-webhook
```

#### 3. Verify Webhook Configuration in Stripe Dashboard

1. Go to: https://dashboard.stripe.com/webhooks
2. Click on your webhook endpoint
3. Verify the URL is: `https://vpunvfkmlmqbfiggqrkn.supabase.co/functions/v1/stripe-webhook`
4. Ensure these events are selected:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `payment_intent.canceled`
   - `payment_intent.processing`

#### 4. Test the Webhook

##### Option A: Use Stripe CLI (Recommended)

```bash
# Install Stripe CLI
# https://stripe.com/docs/stripe-cli

# Login to Stripe
stripe login

# Forward webhooks to your local function
stripe listen --forward-to https://vpunvfkmlmqbfiggqrkn.supabase.co/functions/v1/stripe-webhook

# Trigger a test payment
stripe trigger payment_intent.succeeded
```

##### Option B: Test in Stripe Dashboard

1. Go to: https://dashboard.stripe.com/webhooks
2. Click on your webhook endpoint
3. Click "Send test webhook"
4. Select `payment_intent.succeeded`
5. Click "Send test webhook"
6. Check the response - should be 200 OK

#### 5. Verify Environment Variables

Ensure these are set in Supabase:

```bash
# Check if secrets exist
supabase secrets list

# Should show:
# - STRIPE_SECRET_KEY
# - STRIPE_WEBHOOK_SECRET
# - SUPABASE_URL (automatically set)
# - SUPABASE_SERVICE_ROLE_KEY (automatically set)
```

If missing, set them:

```bash
supabase secrets set STRIPE_SECRET_KEY=sk_test_YOUR_KEY
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_YOUR_SECRET
```

#### 6. Check Function Logs

```bash
# View recent logs
supabase functions logs stripe-webhook

# Or in Supabase Dashboard:
# Edge Functions → stripe-webhook → Logs
```

Look for:
- ✓ "Webhook signature verified successfully"
- ✓ "stripe_payments table updated"
- ✓ "orders table updated"
- ✓ "Webhook processed successfully"

### Common Issues and Solutions

#### Issue: "No stripe-signature header found"

**Cause**: Request is not coming from Stripe

**Solution**: 
- Verify webhook URL in Stripe Dashboard
- Ensure you're testing with actual Stripe events, not manual API calls

#### Issue: "Webhook signature verification failed"

**Cause**: Incorrect webhook signing secret

**Solution**:
1. Get the correct signing secret from Stripe Dashboard → Webhooks → [Your endpoint] → Signing secret
2. Update Supabase secret:
   ```bash
   supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_YOUR_ACTUAL_SECRET
   ```
3. Redeploy function:
   ```bash
   supabase functions deploy stripe-webhook
   ```

#### Issue: "STRIPE_SECRET_KEY not configured"

**Cause**: Environment variable not set

**Solution**:
```bash
supabase secrets set STRIPE_SECRET_KEY=sk_test_YOUR_KEY
supabase functions deploy stripe-webhook
```

#### Issue: "Error updating order" or "Error updating stripe_payments"

**Cause**: Database tables don't exist or RLS policies are blocking updates

**Solution**:
1. Verify tables exist:
   ```sql
   SELECT * FROM stripe_payments LIMIT 1;
   SELECT * FROM orders LIMIT 1;
   ```

2. Check RLS policies:
   ```sql
   SELECT * FROM pg_policies WHERE tablename IN ('stripe_payments', 'orders');
   ```

3. If tables don't exist, run migration:
   ```bash
   supabase db push
   ```

4. Ensure service role key is being used (it bypasses RLS)

#### Issue: Realtime updates not working

**Cause**: Realtime not enabled on orders table

**Solution**:
```sql
-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE orders;

-- Verify
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
```

### Testing the Complete Flow

1. **Start the app** and log in
2. **Add items to cart**
3. **Go to checkout**
4. **Enter delivery details**
5. **Tap "Pay $XX.XX"**
6. **Use test card**: 4242 4242 4242 4242
7. **Complete payment**
8. **Watch the logs**:
   ```bash
   # Terminal 1: Watch webhook logs
   supabase functions logs stripe-webhook --follow
   
   # Terminal 2: Watch database changes
   # In Supabase Dashboard: Table Editor → orders → Enable realtime
   ```
9. **Verify**:
   - Payment sheet closes
   - "Processing payment..." appears
   - Within 1-2 seconds: "Order Confirmed!" alert
   - Cart is cleared
   - Points are awarded
   - Order appears in history

### Debugging Checklist

- [ ] `config.json` exists with `verify_jwt: false`
- [ ] Webhook function is deployed
- [ ] Webhook URL is correct in Stripe Dashboard
- [ ] Webhook signing secret is correct
- [ ] All required events are selected in Stripe
- [ ] Environment variables are set in Supabase
- [ ] Database tables exist
- [ ] RLS policies allow service role access
- [ ] Realtime is enabled on orders table
- [ ] Function logs show successful processing
- [ ] Stripe Dashboard shows 200 OK responses

### Manual Webhook Test

You can manually test the webhook using curl:

```bash
# Get a test event from Stripe Dashboard
# Copy the JSON payload

curl -X POST https://vpunvfkmlmqbfiggqrkn.supabase.co/functions/v1/stripe-webhook \
  -H "Content-Type: application/json" \
  -H "stripe-signature: YOUR_TEST_SIGNATURE" \
  -d @test_event.json
```

Note: This will fail signature verification unless you use a real Stripe signature. Use Stripe CLI instead.

### Production Checklist

Before going live:

- [ ] Replace test keys with live keys
- [ ] Create new webhook endpoint in live mode
- [ ] Update webhook signing secret
- [ ] Test with real payment method
- [ ] Monitor first few transactions
- [ ] Set up alerts for webhook failures
- [ ] Document rollback procedure

### Support

If issues persist:

1. **Check Stripe Dashboard**:
   - Webhooks → [Your endpoint] → Recent events
   - Look for failed deliveries
   - Check error messages

2. **Check Supabase Logs**:
   - Edge Functions → stripe-webhook → Logs
   - Look for error messages
   - Check timestamps match payment attempts

3. **Enable Debug Mode**:
   Add more logging to the webhook function:
   ```typescript
   console.log('Full request headers:', Object.fromEntries(req.headers.entries()));
   console.log('Full event object:', JSON.stringify(event, null, 2));
   ```

4. **Contact Support**:
   - Stripe Support: https://support.stripe.com
   - Supabase Discord: https://discord.supabase.com

### Additional Resources

- [Stripe Webhooks Documentation](https://stripe.com/docs/webhooks)
- [Stripe CLI Documentation](https://stripe.com/docs/stripe-cli)
- [Supabase Edge Functions Auth](https://supabase.com/docs/guides/functions/auth)
- [Supabase Edge Functions Secrets](https://supabase.com/docs/guides/functions/secrets)

---

**Last Updated**: 2024
**Status**: Active
