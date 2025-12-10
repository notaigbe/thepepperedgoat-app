
# Uber Direct Integration Setup Guide

This guide will help you set up Uber Direct delivery integration for your food ordering app.

## Prerequisites

1. An Uber Direct account (sign up at https://www.uber.com/us/en/business/direct/)
2. Uber Direct API credentials (Client ID, Client Secret, Customer ID)
3. Supabase project with Edge Functions enabled

## Step 1: Get Uber Direct API Credentials

1. Log in to your Uber Direct dashboard
2. Navigate to the API section
3. Create a new OAuth 2.0 application
4. Note down your:
   - Client ID
   - Client Secret
   - Customer ID

## Step 2: Configure Environment Variables

Add the following environment variables to your Supabase Edge Functions:

```bash
# Using Supabase CLI
supabase secrets set UBER_CLIENT_ID=your_client_id_here
supabase secrets set UBER_CLIENT_SECRET=your_client_secret_here
supabase secrets set UBER_CUSTOMER_ID=your_customer_id_here
```

Or through the Supabase Dashboard:
1. Go to Project Settings > Edge Functions
2. Add the secrets in the "Secrets" section

## Step 3: Deploy Edge Functions

Deploy the Uber Direct Edge Functions:

```bash
# Deploy trigger delivery function
supabase functions deploy trigger-uber-delivery

# Deploy webhook handler
supabase functions deploy uber-delivery-webhook
```

## Step 4: Configure Webhook in Uber Dashboard

1. Log in to your Uber Direct dashboard
2. Navigate to Webhooks settings
3. Add a new webhook endpoint:
   - URL: `https://[your-project-id].supabase.co/functions/v1/uber-delivery-webhook`
   - Events to subscribe:
     - delivery.status_changed
     - delivery.courier_assigned
     - delivery.completed
     - delivery.canceled

## Step 5: Run Database Migration

Apply the database migration to add delivery tracking fields:

```bash
supabase db push
```

Or manually run the SQL migration file:
- `supabase/migrations/add_uber_direct_delivery_tracking.sql`

## Step 6: Configure Restaurant Pickup Address

Update the restaurant pickup address in `constants/DeliveryConfig.ts`:

```typescript
export const RESTAURANT_PICKUP_ADDRESS = {
  name: 'Your Restaurant Name',
  phoneNumber: '+1234567890', // Your restaurant phone
  address: {
    street: '123 Your Street',
    city: 'Your City',
    state: 'CA',
    zipCode: '90001',
    country: 'US',
  },
  notes: 'Please call upon arrival',
};
```

## How It Works

### Order Flow

1. **Order Placed**: Customer places an order with a delivery address
2. **Order Preparing**: Admin updates order status to "preparing"
3. **Order Ready**: Admin updates order status to "ready"
4. **Delivery Triggered**: System automatically prompts admin to trigger Uber Direct delivery
5. **Driver Assigned**: Uber assigns a driver and sends webhook update
6. **En Route to Pickup**: Driver heads to restaurant, customer receives notification
7. **At Pickup**: Driver arrives at restaurant
8. **En Route to Dropoff**: Driver picks up order and heads to customer
9. **Delivered**: Order is delivered, proof of delivery is captured
10. **Order Completed**: Order status is automatically updated to "completed"

### Delivery Status Updates

The system tracks the following delivery statuses:
- `pending`: Delivery request created, waiting for driver
- `en_route_to_pickup`: Driver is heading to the restaurant
- `at_pickup`: Driver has arrived at the restaurant
- `en_route_to_dropoff`: Driver is delivering the order
- `delivered`: Order has been delivered
- `canceled`: Delivery was canceled

### Customer Notifications

Customers receive real-time notifications for:
- Delivery started
- Driver en route to restaurant
- Driver at restaurant
- Order on the way
- Order delivered

### Delivery Tracking Features

- Real-time delivery status updates
- Driver name and phone number
- Estimated time of arrival (ETA)
- Live tracking URL
- Proof of delivery (signature/photo)

## Testing

### Test Mode

Uber Direct provides a sandbox environment for testing:

1. Use test credentials from Uber Direct dashboard
2. Test deliveries won't be charged
3. Simulated driver behavior

### Manual Testing

1. Create a test order with a delivery address
2. Update order status to "ready"
3. Trigger Uber Direct delivery
4. Monitor webhook events in Supabase logs
5. Check delivery tracking in the app

## Troubleshooting

### Common Issues

**Issue**: "Uber Direct API credentials not configured"
- **Solution**: Ensure environment variables are set in Supabase Edge Functions

**Issue**: "Failed to authenticate with Uber Direct"
- **Solution**: Verify your Client ID and Client Secret are correct

**Issue**: "Failed to create Uber Direct delivery"
- **Solution**: Check that pickup and dropoff addresses are valid and within Uber Direct service area

**Issue**: Webhooks not being received
- **Solution**: Verify webhook URL is correct and accessible from Uber's servers

### Viewing Logs

Check Edge Function logs in Supabase Dashboard:
1. Go to Edge Functions
2. Select the function (trigger-uber-delivery or uber-delivery-webhook)
3. View logs for errors and debugging information

## Cost Considerations

- Uber Direct charges per delivery based on distance and time
- Pricing varies by location
- Consider passing delivery fees to customers or setting minimum order amounts
- Monitor delivery costs in Uber Direct dashboard

## Security Best Practices

1. Never commit API credentials to version control
2. Use environment variables for all sensitive data
3. Validate webhook signatures (if provided by Uber)
4. Implement rate limiting on Edge Functions
5. Monitor for unusual activity

## Support

For Uber Direct API issues:
- Documentation: https://developer.uber.com/docs/deliveries
- Support: Contact Uber Direct support team

For app integration issues:
- Check Supabase Edge Function logs
- Review webhook payload structure
- Verify database schema matches expected fields
