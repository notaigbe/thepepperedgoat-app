
# Points System and Delivery Flow

## Overview
This document describes the updated points system and delivery flow for the Jagabans LA food ordering app.

## Points System

### Conversion Rate
- **$1 = 100 point**
- Points are stored as integers in the database
- Example: A $250 order earns 2 points (2.5 rounded down)

### Earning Points
- Users earn **15% of their order total** (after discount, before tax) as points
- Points are calculated using the formula: `Math.floor((subtotalAfterDiscount * 0.15) / 100)`
- Points are awarded automatically after successful payment via the Stripe webhook

### Using Points
- Each point is worth **$1.00** when redeeming
- Users can use points for up to 20% off their order subtotal
- Points are deducted immediately when placing an order

### Discount System
- **10% automatic discount** applied to all orders before tax
- Discount is calculated on the subtotal before tax
- Tax (9.75%) is calculated on the discounted amount

## Checkout Flow

### Order Summary Calculation
```
Subtotal: $100.00
Discount (10%): -$10.00
Subtotal After Discount: $90.00
Tax (9.75%): $8.78
Points Discount (if using): -$X.XX
Total: $98.78 (or less with points)
```

### Points Earned Example
```
Order Total: $90.00 (after 10% discount, before tax)
Points Earned: 10% of $90.00 = $9.00 worth
Points Awarded: $9.00 / $100 = 0.09 → 0 points (rounded down)

For a $250 order:
After 10% discount: $225.00
Points Earned: 10% of $225.00 = $22.50 worth
Points Awarded: $22.50 / $100 = 0.22 → 0 points (rounded down)

For a $1000 order:
After 10% discount: $900.00
Points Earned: 10% of $900.00 = $90.00 worth
Points Awarded: $90.00 / $100 = 0.9 → 0 points (rounded down)

For a $1100 order:
After 10% discount: $990.00
Points Earned: 10% of $990.00 = $99.00 worth
Points Awarded: $99.00 / $100 = 0.99 → 0 points (rounded down)

For a $1200 order:
After 10% discount: $1080.00
Points Earned: 10% of $1080.00 = $108.00 worth
Points Awarded: $108.00 / $100 = 1.08 → 1 point
```

## Delivery Flow

### Timeline
1. **T+0 minutes**: User completes payment successfully
2. **T+0 minutes**: Order status updated to "preparing"
3. **T+0 minutes**: User receives notification: "Payment Successful - Your order is being prepared!"
4. **T+0 minutes**: Delivery scheduled for 10 minutes later
5. **T+0 minutes**: User receives notification: "Delivery Scheduled - A driver will be assigned in approximately 10 minutes"
6. **T+10 minutes**: Uber Direct delivery triggered automatically
7. **T+10 minutes**: User receives notification: "Driver Assigned! - A driver has been assigned to your order. Estimated arrival: [time]"
8. **T+10+ minutes**: Real-time delivery tracking available

### Automated Delivery Trigger
- The `stripe-webhook` edge function schedules delivery by setting `delivery_scheduled_at` timestamp
- A separate `schedule-delivery-trigger` edge function runs periodically (e.g., every minute via cron)
- This function checks for orders where:
  - `payment_status = 'succeeded'`
  - `status = 'preparing'`
  - `delivery_address IS NOT NULL`
  - `delivery_scheduled_at IS NOT NULL`
  - `delivery_triggered_at IS NULL`
  - `delivery_scheduled_at <= NOW()`
- When found, it triggers the Uber Direct delivery and sends a notification

### Notifications
Users receive three key notifications:
1. **Payment Success**: Immediate confirmation of payment
2. **Delivery Scheduled**: Informs user that delivery will start in 10 minutes
3. **Driver Assigned**: Sent when driver is actually assigned with ETA

## Database Schema Changes

### New Fields in `orders` Table
```sql
delivery_scheduled_at TIMESTAMPTZ -- When delivery should be triggered
```

### New Database Function
```sql
CREATE FUNCTION increment_user_points(user_id_param UUID, points_to_add INTEGER)
-- Atomically increments user points to prevent race conditions
```

## Edge Functions

### stripe-webhook
- Handles payment success/failure events
- Schedules delivery for 10 minutes after payment success
- Awards points to user after successful payment
- Sends payment confirmation notifications

### schedule-delivery-trigger
- Runs periodically (cron job)
- Checks for orders ready for delivery trigger
- Calls trigger-uber-delivery for eligible orders
- Sends driver assignment notifications

### trigger-uber-delivery
- Creates Uber Direct delivery request
- Updates order with delivery tracking information
- Returns delivery ID and tracking URL

## Setup Instructions

### 1. Apply Database Migration
Run the migration to add the new field and function:
```sql
-- See supabase/migrations/add_delivery_scheduled_at_and_update_points_system.sql
```

### 2. Deploy Edge Functions
```bash
# Deploy the updated webhook
supabase functions deploy stripe-webhook

# Deploy the new scheduler function
supabase functions deploy schedule-delivery-trigger
```

### 3. Set Up Cron Job
Configure a cron job to call the scheduler function every minute:
```bash
# Using Supabase Edge Functions Cron (if available)
# Or use an external service like GitHub Actions, Vercel Cron, etc.
```

Example GitHub Actions workflow:
```yaml
name: Trigger Delivery Scheduler
on:
  schedule:
    - cron: '* * * * *' # Every minute
jobs:
  trigger:
    runs-on: ubuntu-latest
    steps:
      - name: Call scheduler
        run: |
          curl -X POST \
            https://[your-project].supabase.co/functions/v1/schedule-delivery-trigger \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}"
```

## Testing

### Test Points Calculation
1. Add items totaling $1200 to cart
2. Proceed to checkout
3. Verify:
   - Subtotal: $1200.00
   - Discount (10%): -$120.00
   - Subtotal After Discount: $1080.00
   - Tax (9.75%): $105.30
   - Total: $1185.30
   - Points to Earn: 1 point (shown as "$100.00 value")

### Test Delivery Flow
1. Place a delivery order
2. Complete payment
3. Verify immediate notifications received
4. Wait 10 minutes
5. Verify driver assignment notification
6. Check order tracking information

## Troubleshooting

### Points Not Awarded
- Check `stripe_payments` table for payment status
- Verify `increment_user_points` function exists
- Check webhook logs for errors

### Delivery Not Triggered
- Verify `delivery_scheduled_at` is set in orders table
- Check `schedule-delivery-trigger` function logs
- Ensure cron job is running
- Verify Uber Direct API credentials

### Incorrect Point Calculations
- Verify POINTS_CONVERSION_RATE = 100 in checkout code
- Check DISCOUNT_PERCENTAGE = 0.10
- Verify POINTS_REWARD_PERCENTAGE = 0.10
