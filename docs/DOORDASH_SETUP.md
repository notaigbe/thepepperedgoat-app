
# DoorDash Delivery Setup Guide

This guide will walk you through setting up DoorDash delivery integration for the Jagabans LA food ordering app.

## Prerequisites

- Active DoorDash Drive account
- Access to DoorDash Developer Portal
- Supabase project with admin access
- Restaurant address and contact information

## Step 1: DoorDash Developer Account Setup

1. **Sign up for DoorDash Drive**
   - Visit: https://get.doordash.com/drive
   - Complete the business registration
   - Wait for account approval (typically 1-3 business days)

2. **Access Developer Portal**
   - Log in to: https://developer.doordash.com/
   - Navigate to "My Apps"
   - Create a new application

3. **Get API Credentials**
   - In your app dashboard, locate:
     - Developer ID
     - Key ID
     - Signing Secret
   - Save these credentials securely

## Step 2: Configure Supabase Environment Variables

1. **Open Supabase Dashboard**
   - Go to: https://app.supabase.com
   - Select your project
   - Navigate to Settings → Edge Functions

2. **Add DoorDash Credentials**
   ```bash
   # Add these environment variables:
   DOORDASH_DEVELOPER_ID=your_developer_id_here
   DOORDASH_KEY_ID=your_key_id_here
   DOORDASH_SIGNING_SECRET=your_signing_secret_here
   ```

3. **Save and Verify**
   - Click "Save"
   - Verify the variables are listed

## Step 3: Deploy Edge Functions

1. **Install Supabase CLI** (if not already installed)
   ```bash
   npm install -g supabase
   ```

2. **Login to Supabase**
   ```bash
   supabase login
   ```

3. **Link Your Project**
   ```bash
   supabase link --project-ref your-project-ref
   ```

4. **Deploy DoorDash Functions**
   ```bash
   supabase functions deploy trigger-doordash-delivery
   supabase functions deploy doordash-delivery-webhook
   ```

5. **Verify Deployment**
   - Check Supabase Dashboard → Edge Functions
   - Ensure both functions are listed and active

## Step 4: Configure Webhook

1. **Get Webhook URL**
   - Format: `https://[your-project-ref].supabase.co/functions/v1/doordash-delivery-webhook`
   - Example: `https://vpunvfkmlmqbfiggqrkn.supabase.co/functions/v1/doordash-delivery-webhook`

2. **Configure in DoorDash Portal**
   - Go to DoorDash Developer Portal
   - Navigate to your app → Webhooks
   - Click "Add Webhook"
   - Enter your webhook URL
   - Select events:
     - `delivery.created`
     - `delivery.confirmed`
     - `delivery.picked_up`
     - `delivery.delivered`
     - `delivery.cancelled`
   - Save webhook configuration

3. **Test Webhook**
   - Use DoorDash's webhook testing tool
   - Verify events are received in Supabase logs

## Step 5: Update Restaurant Information

1. **Open DeliveryConfig.ts**
   ```typescript
   // File: constants/DeliveryConfig.ts
   
   export const RESTAURANT_PICKUP_ADDRESS = {
     name: 'Jagabans LA',
     phoneNumber: '+1234567890', // Update with real phone
     address: {
       street: '123 Restaurant Street', // Update with real address
       city: 'Los Angeles',
       state: 'CA',
       zipCode: '90001',
       country: 'US',
     },
     notes: 'Please call upon arrival',
   };
   ```

2. **Update with Actual Information**
   - Replace placeholder values with real restaurant details
   - Ensure phone number is in E.164 format (+1XXXXXXXXXX)
   - Verify address is accurate for pickup

## Step 6: Configure Admin Settings

1. **Open Admin Panel**
   - Launch the app
   - Log in as admin
   - Navigate to Admin → Delivery Settings

2. **Set Default Provider**
   - Choose "DoorDash" as default provider
   - Or keep "Uber Direct" and select DoorDash per order

3. **Configure Auto-Trigger**
   - Enable "Auto-trigger Delivery" if desired
   - This will automatically create deliveries when orders are ready

4. **Save Settings**
   - Click "Save Settings"
   - Verify settings are persisted

## Step 7: Test the Integration

### Test Order Flow

1. **Create Test Order**
   - Place an order through the app
   - Use a test delivery address

2. **Update Order Status**
   - Go to Admin → Order Management
   - Find the test order
   - Update status to "Ready"

3. **Trigger Delivery**
   - When prompted, select "DoorDash"
   - Confirm delivery creation

4. **Monitor Delivery**
   - Check order for delivery tracking information
   - Verify tracking URL works
   - Monitor status updates via webhook

### Test Webhook Events

1. **Check Supabase Logs**
   - Go to Supabase Dashboard → Edge Functions
   - Select `doordash-delivery-webhook`
   - View logs for incoming events

2. **Verify Database Updates**
   - Check `orders` table
   - Verify DoorDash fields are populated:
     - `doordash_delivery_id`
     - `doordash_delivery_status`
     - `doordash_tracking_url`
     - `delivery_provider` = 'doordash'

3. **Test Customer Notifications**
   - Check `notifications` table
   - Verify customer received notifications

## Step 8: Go Live

### Pre-Launch Checklist

- [ ] All API credentials configured
- [ ] Edge functions deployed successfully
- [ ] Webhook configured and tested
- [ ] Restaurant information updated
- [ ] Test orders completed successfully
- [ ] Notifications working correctly
- [ ] Tracking URLs accessible
- [ ] Admin panel configured

### Launch Steps

1. **Switch to Production Credentials**
   - Update environment variables with production keys
   - Redeploy edge functions if needed

2. **Update Webhook URL**
   - Ensure webhook points to production environment
   - Test webhook with production credentials

3. **Monitor First Orders**
   - Closely monitor first few live orders
   - Check logs for any errors
   - Verify customer experience

4. **Document Issues**
   - Keep track of any problems
   - Note resolution steps
   - Update documentation as needed

## Troubleshooting

### Common Issues

#### 1. "DoorDash API credentials not configured"
**Solution:**
- Verify environment variables are set in Supabase
- Check variable names match exactly
- Redeploy edge functions after adding variables

#### 2. "Failed to create DoorDash delivery"
**Solution:**
- Check API credentials are valid
- Verify restaurant address is in DoorDash service area
- Check Supabase logs for detailed error message
- Ensure JWT signature is correct

#### 3. "Webhook not receiving events"
**Solution:**
- Verify webhook URL is correct
- Check webhook is enabled in DoorDash portal
- Ensure all required events are selected
- Test webhook using DoorDash testing tool

#### 4. "Delivery status not updating"
**Solution:**
- Check webhook is receiving events (Supabase logs)
- Verify order ID matches between app and DoorDash
- Check database permissions
- Ensure webhook function is deployed

### Debug Mode

Enable detailed logging:

1. **Check Edge Function Logs**
   ```bash
   supabase functions logs trigger-doordash-delivery
   supabase functions logs doordash-delivery-webhook
   ```

2. **Monitor Database Changes**
   - Use Supabase Table Editor
   - Watch `orders` table for updates
   - Check `notifications` table for customer alerts

3. **Test API Directly**
   - Use Postman or curl to test DoorDash API
   - Verify credentials work outside the app
   - Check response format matches expectations

## Support Resources

- **DoorDash Developer Docs**: https://developer.doordash.com/
- **DoorDash Support**: support@doordash.com
- **Supabase Docs**: https://supabase.com/docs
- **App Documentation**: See `docs/` folder

## Security Best Practices

1. **Protect API Credentials**
   - Never commit credentials to version control
   - Use environment variables only
   - Rotate keys regularly

2. **Validate Webhook Requests**
   - Verify webhook signatures
   - Check request origin
   - Log suspicious activity

3. **Monitor Usage**
   - Track API calls
   - Set up alerts for unusual activity
   - Review logs regularly

4. **Limit Access**
   - Only admins can trigger deliveries
   - Use RLS policies on database
   - Implement proper authentication

## Cost Considerations

- DoorDash charges per delivery
- Pricing varies by:
  - Distance
  - Time of day
  - Demand
  - Service level
- Monitor delivery costs in DoorDash dashboard
- Consider setting delivery fees for customers

## Next Steps

After successful setup:

1. Train staff on using the system
2. Create standard operating procedures
3. Set up monitoring and alerts
4. Gather customer feedback
5. Optimize delivery settings based on usage
6. Consider adding Uber Direct as backup option

## Maintenance

### Regular Tasks

- **Weekly**: Review delivery logs and performance
- **Monthly**: Check API usage and costs
- **Quarterly**: Rotate API credentials
- **As Needed**: Update restaurant information

### Updates

- Monitor DoorDash API changelog
- Update edge functions when API changes
- Test thoroughly after updates
- Keep documentation current

---

For additional help, refer to:
- `docs/DOORDASH_INTEGRATION_SUMMARY.md` - Technical implementation details
- `docs/ADMIN_DELIVERY_GUIDE.md` - Admin user guide
- `docs/UBER_DIRECT_SETUP.md` - Uber Direct setup (for comparison)
