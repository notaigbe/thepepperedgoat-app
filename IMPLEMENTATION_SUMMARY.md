
# Implementation Summary: Points System & Delivery Flow Updates

## Changes Implemented

### 1. Points System Overhaul
**Previous System**: $1 = 1 point
**New System**: $100 = 1 point

#### Key Changes:
- Updated points conversion rate from 1:1 to 100:1
- Points earned: 10% of order total (after discount, before tax)
- Automatic 10% discount applied to all orders before tax
- Points redemption: 1 point = $1.00 value

#### Files Modified:
- `app/checkout.native.tsx` - Updated checkout calculations
- `app/integrations/supabase/types.ts` - Added `delivery_scheduled_at` field
- `docs/POINTS_AND_DELIVERY_SYSTEM.md` - New documentation

### 2. Delivery Flow Changes
**Previous Flow**: Delivery triggered immediately after admin marks order as "Ready"
**New Flow**: Delivery triggered automatically 10 minutes after successful payment

#### Timeline:
- **T+0**: Payment success → Order status: "preparing"
- **T+0**: Notification: "Payment Successful"
- **T+0**: Notification: "Delivery Scheduled - Driver will be assigned in 10 minutes"
- **T+10**: Uber Direct delivery triggered automatically
- **T+10**: Notification: "Driver Assigned! - Estimated arrival: [time]"

#### Files Created/Modified:
- `supabase/functions/stripe-webhook/index.ts` - Updated to schedule delivery
- `supabase/functions/schedule-delivery-trigger/index.ts` - New scheduler function
- Database migration for `delivery_scheduled_at` field

### 3. Checkout Experience
#### New Order Summary Display:
```
Subtotal: $XXX.XX
Discount (10%): -$XX.XX
Tax (9.75%): $XX.XX
Points Discount: -$XX.XX (if using points)
─────────────────
Total: $XXX.XX

You'll earn X points with this order! ($XXX.XX value)
```

#### Enhanced Features:
- Clear breakdown of automatic 10% discount
- Points value displayed in dollars for clarity
- Updated points balance display: "X points ($X.XX value)"

## Database Changes

### New Fields
```sql
-- orders table
delivery_scheduled_at TIMESTAMPTZ -- When delivery should be triggered
```

### New Functions
```sql
-- Atomic points increment to prevent race conditions
CREATE FUNCTION increment_user_points(user_id_param UUID, points_to_add INTEGER)
```

### New Indexes
```sql
-- Efficient querying of scheduled deliveries
CREATE INDEX idx_orders_delivery_scheduled 
ON orders(delivery_scheduled_at) 
WHERE delivery_scheduled_at IS NOT NULL 
AND delivery_triggered_at IS NULL 
AND payment_status = 'succeeded';
```

## Edge Functions

### Updated Functions
1. **stripe-webhook** (`supabase/functions/stripe-webhook/index.ts`)
   - Schedules delivery 10 minutes after payment success
   - Awards points using new conversion rate
   - Sends delivery scheduling notification

### New Functions
2. **schedule-delivery-trigger** (`supabase/functions/schedule-delivery-trigger/index.ts`)
   - Runs periodically (every minute via cron)
   - Checks for orders ready for delivery
   - Triggers Uber Direct delivery
   - Sends driver assignment notification

## Setup Required

### 1. Database Migration
```bash
# Apply the migration to add new fields and functions
# This needs to be done manually via Supabase dashboard or CLI
```

SQL to run:
```sql
-- Add delivery_scheduled_at column
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_scheduled_at TIMESTAMPTZ;

-- Create index
CREATE INDEX IF NOT EXISTS idx_orders_delivery_scheduled 
ON orders(delivery_scheduled_at) 
WHERE delivery_scheduled_at IS NOT NULL 
AND delivery_triggered_at IS NULL 
AND payment_status = 'succeeded';

-- Create points increment function
CREATE OR REPLACE FUNCTION increment_user_points(user_id_param UUID, points_to_add INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE user_profiles
  SET points = COALESCE(points, 0) + points_to_add,
      updated_at = NOW()
  WHERE id = user_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION increment_user_points(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_user_points(UUID, INTEGER) TO service_role;
```

### 2. Deploy Edge Functions
```bash
# Deploy updated webhook
supabase functions deploy stripe-webhook

# Deploy new scheduler
supabase functions deploy schedule-delivery-trigger
```

### 3. Set Up Cron Job
The `schedule-delivery-trigger` function needs to run every minute. Options:

#### Option A: External Cron Service
Use GitHub Actions, Vercel Cron, or similar:
```yaml
# .github/workflows/delivery-scheduler.yml
name: Delivery Scheduler
on:
  schedule:
    - cron: '* * * * *' # Every minute
jobs:
  trigger:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger scheduler
        run: |
          curl -X POST \
            https://vpunvfkmlmqbfiggqrkn.supabase.co/functions/v1/schedule-delivery-trigger \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}"
```

#### Option B: Supabase pg_cron (if available)
```sql
-- Schedule the function to run every minute
SELECT cron.schedule(
  'delivery-scheduler',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := 'https://vpunvfkmlmqbfiggqrkn.supabase.co/functions/v1/schedule-delivery-trigger',
    headers := '{"Authorization": "Bearer ' || current_setting('app.settings.service_role_key') || '"}'::jsonb
  );
  $$
);
```

## Testing Checklist

### Points System
- [ ] Place order for $1200
- [ ] Verify 10% discount applied ($120 off)
- [ ] Verify tax calculated on discounted amount
- [ ] Verify 1 point earned (10% of $1080 = $108 → 1 point)
- [ ] Check points balance updated after payment

### Delivery Flow
- [ ] Place delivery order
- [ ] Verify immediate "Payment Successful" notification
- [ ] Verify "Delivery Scheduled" notification
- [ ] Wait 10 minutes
- [ ] Verify "Driver Assigned" notification with ETA
- [ ] Check order tracking information

### Edge Cases
- [ ] Test with points redemption
- [ ] Test pickup orders (should not schedule delivery)
- [ ] Test payment failure (should not schedule delivery)
- [ ] Test order cancellation before delivery trigger

## Rollback Plan

If issues arise, you can rollback by:

1. **Revert checkout calculations**:
   - Change `POINTS_CONVERSION_RATE` back to 1
   - Remove `DISCOUNT_PERCENTAGE` application
   - Adjust `POINTS_REWARD_PERCENTAGE` back to 1.0

2. **Disable scheduled delivery**:
   - Stop the cron job
   - Revert webhook to not set `delivery_scheduled_at`

3. **Database rollback**:
```sql
-- Remove the new column (optional)
ALTER TABLE orders DROP COLUMN IF EXISTS delivery_scheduled_at;

-- Remove the function
DROP FUNCTION IF EXISTS increment_user_points(UUID, INTEGER);
```

## Monitoring

### Key Metrics to Watch
1. **Points Accuracy**: Monitor user points balances for anomalies
2. **Delivery Timing**: Track time between payment and delivery trigger
3. **Notification Delivery**: Ensure all three notifications are sent
4. **Scheduler Performance**: Monitor `schedule-delivery-trigger` execution time

### Logs to Check
- Stripe webhook logs for payment processing
- Scheduler function logs for delivery triggers
- Uber Direct API responses
- User notification delivery status

## Support

For issues or questions:
1. Check the logs in Supabase dashboard
2. Review `docs/POINTS_AND_DELIVERY_SYSTEM.md` for detailed information
3. Verify all environment variables are set correctly
4. Ensure cron job is running properly

## Next Steps

1. Apply database migration
2. Deploy edge functions
3. Set up cron job
4. Test thoroughly in staging environment
5. Monitor production deployment
6. Update user-facing documentation if needed
