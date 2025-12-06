
# Stripe Webhook Deployment Guide

## Quick Deployment Steps

### 1. Deploy the Webhook Function

```bash
# Navigate to your project root
cd /path/to/your/project

# Deploy the stripe-webhook function
supabase functions deploy stripe-webhook

# Verify deployment
supabase functions list
```

Expected output:
```
┌────────────────────┬─────────┬─────────────────────┐
│ NAME               │ VERSION │ CREATED AT          │
├────────────────────┼─────────┼─────────────────────┤
│ stripe-webhook     │ 1       │ 2024-XX-XX XX:XX:XX │
└────────────────────┴─────────┴─────────────────────┘
```

### 2. Verify Configuration

Check that the config.json file exists:

```bash
cat supabase/functions/stripe-webhook/config.json
```

Should output:
```json
{
  "verify_jwt": false
}
```

### 3. Test the Webhook

#### Using Stripe CLI (Recommended)

```bash
# Install Stripe CLI if not already installed
# macOS
brew install stripe/stripe-cli/stripe

# Windows
scoop install stripe

# Linux
# Download from https://github.com/stripe/stripe-cli/releases

# Login to Stripe
stripe login

# Test the webhook
stripe trigger payment_intent.succeeded
```

#### Using Stripe Dashboard

1. Go to: https://dashboard.stripe.com/test/webhooks
2. Click on your webhook endpoint
3. Click "Send test webhook"
4. Select `payment_intent.succeeded`
5. Click "Send test webhook"
6. Verify response is 200 OK

### 4. Monitor Logs

```bash
# Watch logs in real-time
supabase functions logs stripe-webhook --follow

# Or view recent logs
supabase functions logs stripe-webhook
```

### 5. Test End-to-End

1. Open your mobile app
2. Add items to cart
3. Go to checkout
4. Complete payment with test card: 4242 4242 4242 4242
5. Verify:
   - Payment completes
   - "Order Confirmed" alert appears
   - Cart is cleared
   - Order appears in history

## Troubleshooting Deployment

### Issue: "Function not found"

**Solution**:
```bash
# Ensure you're in the project root
pwd

# Check function exists
ls -la supabase/functions/stripe-webhook/

# Deploy again
supabase functions deploy stripe-webhook
```

### Issue: "Invalid configuration"

**Solution**:
```bash
# Verify config.json syntax
cat supabase/functions/stripe-webhook/config.json | jq .

# If error, recreate the file
echo '{"verify_jwt": false}' > supabase/functions/stripe-webhook/config.json

# Deploy again
supabase functions deploy stripe-webhook
```

### Issue: "Environment variables not set"

**Solution**:
```bash
# List current secrets
supabase secrets list

# Set missing secrets
supabase secrets set STRIPE_SECRET_KEY=sk_test_YOUR_KEY
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_YOUR_SECRET

# Redeploy
supabase functions deploy stripe-webhook
```

### Issue: Still getting 401 errors

**Solution**:
```bash
# 1. Verify config.json exists and is correct
cat supabase/functions/stripe-webhook/config.json

# 2. Force redeploy
supabase functions deploy stripe-webhook --no-verify-jwt

# 3. Check Supabase Dashboard
# Go to: Edge Functions → stripe-webhook → Settings
# Verify "Verify JWT" is disabled

# 4. Test with curl (should not return 401)
curl -X POST https://vpunvfkmlmqbfiggqrkn.supabase.co/functions/v1/stripe-webhook \
  -H "Content-Type: application/json" \
  -d '{"test": true}'

# Expected: 400 (missing signature) NOT 401 (unauthorized)
```

## Deployment Checklist

- [ ] Function code is updated
- [ ] config.json exists with verify_jwt: false
- [ ] Environment variables are set
- [ ] Function is deployed
- [ ] Deployment succeeded (no errors)
- [ ] Function appears in `supabase functions list`
- [ ] Test webhook returns 200 OK (or 400 for invalid signature, NOT 401)
- [ ] End-to-end payment test succeeds
- [ ] Logs show successful webhook processing

## Rollback Procedure

If deployment causes issues:

```bash
# 1. Check previous versions
supabase functions list --show-versions stripe-webhook

# 2. Rollback to previous version
supabase functions rollback stripe-webhook --version <previous-version>

# 3. Verify rollback
supabase functions logs stripe-webhook

# 4. Test
stripe trigger payment_intent.succeeded
```

## Production Deployment

### Pre-Production Checklist

- [ ] All tests pass in staging
- [ ] Webhook signing secret is for production
- [ ] Environment variables use production keys
- [ ] Monitoring is set up
- [ ] Rollback plan is documented
- [ ] Team is notified

### Deploy to Production

```bash
# 1. Switch to production project
supabase link --project-ref YOUR_PROD_PROJECT_REF

# 2. Set production secrets
supabase secrets set STRIPE_SECRET_KEY=sk_live_YOUR_LIVE_KEY
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_YOUR_LIVE_SECRET

# 3. Deploy
supabase functions deploy stripe-webhook

# 4. Verify
supabase functions list

# 5. Test with small transaction
# Use real payment method with small amount ($0.50)

# 6. Monitor
supabase functions logs stripe-webhook --follow
```

### Post-Deployment Monitoring

```bash
# Monitor for 30 minutes after deployment
supabase functions logs stripe-webhook --follow

# Check for errors
supabase functions logs stripe-webhook | grep -i error

# Check success rate
# In Stripe Dashboard: Webhooks → [Your endpoint] → Recent events
# Verify all events show 200 OK
```

## Automated Deployment (CI/CD)

### GitHub Actions Example

```yaml
name: Deploy Stripe Webhook

on:
  push:
    branches: [main]
    paths:
      - 'supabase/functions/stripe-webhook/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Supabase CLI
        uses: supabase/setup-cli@v1
        
      - name: Deploy Function
        run: |
          supabase functions deploy stripe-webhook \
            --project-ref ${{ secrets.SUPABASE_PROJECT_REF }}
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
          
      - name: Verify Deployment
        run: |
          supabase functions list --project-ref ${{ secrets.SUPABASE_PROJECT_REF }}
```

## Support

- **Supabase CLI Issues**: https://github.com/supabase/cli/issues
- **Stripe Webhook Issues**: https://support.stripe.com
- **General Support**: https://discord.supabase.com

---

**Last Updated**: 2024
