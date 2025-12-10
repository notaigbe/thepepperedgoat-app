
# Admin Guide: Managing Uber Direct Deliveries

## Quick Start

### Triggering a Delivery

1. Navigate to **Admin Dashboard** → **Order Management**
2. Find the order you want to deliver
3. Update the order status to **"Ready"**
4. A dialog will appear asking if you want to trigger Uber Direct delivery
5. Click **"Trigger Delivery"** to create the delivery request
6. Wait for confirmation that the delivery was created

### Monitoring Deliveries

Once a delivery is triggered, you'll see a **Delivery Tracking** card on the order:

- **Status**: Current delivery status (e.g., "Driver En Route", "On the Way")
- **Driver Info**: Name and phone number of assigned courier
- **ETA**: Estimated time of arrival
- **Track on Map**: Opens live tracking in browser
- **Refresh**: Manually update delivery status

### Delivery Statuses

| Status | Meaning | What to Do |
|--------|---------|------------|
| **Pending** | Waiting for driver assignment | Wait for Uber to assign a driver |
| **En Route to Pickup** | Driver heading to restaurant | Prepare the order for pickup |
| **At Pickup** | Driver arrived at restaurant | Hand over the order to the driver |
| **En Route to Dropoff** | Driver delivering to customer | Monitor progress, customer will be notified |
| **Delivered** | Order successfully delivered | Order automatically marked as completed |
| **Canceled** | Delivery was canceled | Contact customer and Uber support |

## Configuration

### Restaurant Pickup Address

1. Navigate to **Admin Dashboard** → **Delivery Settings**
2. Update the following information:
   - Restaurant Name
   - Phone Number
   - Street Address
   - City, State, ZIP Code
   - Pickup Notes (e.g., "Call upon arrival")
3. Click **"Save Settings"**

### Auto-Trigger Delivery

Enable this option to automatically trigger Uber Direct delivery when an order status changes to "Ready" (without confirmation dialog).

**To enable:**
1. Go to **Admin Dashboard** → **Delivery Settings**
2. Toggle **"Auto-trigger Delivery"** to ON
3. Click **"Save Settings"**

## Troubleshooting

### Delivery Not Triggering

**Problem**: Dialog doesn't appear when changing status to "Ready"

**Solutions**:
- Ensure the order has a delivery address
- Check that the order doesn't already have an active delivery
- Verify Uber Direct API credentials are configured

### "Failed to Trigger Delivery" Error

**Common Causes**:
1. **Invalid Address**: Customer's delivery address is outside service area
   - Solution: Contact customer for correct address
   
2. **API Credentials Not Set**: Uber Direct credentials not configured
   - Solution: Contact system administrator
   
3. **Restaurant Address Not Set**: Pickup address not configured
   - Solution: Go to Delivery Settings and configure restaurant address

### Delivery Status Not Updating

**Problem**: Delivery tracking shows old status

**Solutions**:
1. Click the **Refresh** button on the delivery tracking card
2. Check internet connection
3. Verify webhook is configured correctly (contact system admin)

### Driver Not Arriving

**Problem**: Driver status shows "At Pickup" but hasn't arrived

**Solutions**:
1. Call the driver using the phone number shown
2. Check the tracking map for driver location
3. Contact Uber Direct support if issue persists

## Best Practices

### Before Triggering Delivery

✅ **Verify Order is Complete**: Ensure all items are prepared
✅ **Check Delivery Address**: Confirm address is correct and complete
✅ **Package Order Properly**: Secure packaging for transport
✅ **Add Special Instructions**: Include any relevant notes

### During Delivery

✅ **Monitor Status**: Keep an eye on delivery progress
✅ **Be Ready for Pickup**: Have order ready when driver arrives
✅ **Communicate Issues**: Contact driver if there are problems
✅ **Update Customer**: Send additional updates if needed

### After Delivery

✅ **Verify Completion**: Check that order status updated to "Completed"
✅ **Review Proof of Delivery**: Check signature/photo if available
✅ **Handle Issues**: Address any delivery problems promptly

## Customer Communication

### Automatic Notifications

Customers automatically receive notifications for:
- ✉️ Delivery started
- 🚗 Driver en route to restaurant
- 🏪 Driver at restaurant
- 📦 Order on the way
- ✅ Order delivered

### Manual Communication

If you need to contact the customer:
1. Go to **User Management**
2. Find the customer
3. View their contact information
4. Call or send a notification

## Delivery Costs

- Uber Direct charges per delivery
- Costs vary based on:
  - Distance between pickup and dropoff
  - Time of day
  - Demand in the area
- View costs in Uber Direct dashboard
- Consider passing fees to customers or setting minimum order amounts

## Emergency Procedures

### Order Not Delivered

1. Check delivery status in the app
2. Contact the driver using provided phone number
3. Check tracking map for driver location
4. Contact Uber Direct support: [support contact]
5. Notify customer of the situation
6. Offer refund or replacement if necessary

### Wrong Address

1. Contact driver immediately
2. Provide correct address
3. If driver can't reroute, cancel delivery
4. Create new delivery with correct address
5. Apologize to customer and offer compensation

### Food Safety Concerns

1. Contact driver to verify food handling
2. If concerns persist, cancel delivery
3. Prepare fresh order
4. Create new delivery
5. Document incident for quality control

## Support Contacts

### Uber Direct Support
- Dashboard: [Uber Direct Dashboard URL]
- Support: Contact through dashboard
- Emergency: [Emergency contact number]

### System Administrator
- For API/technical issues
- Webhook configuration problems
- Database/app errors

## Tips for Efficiency

1. **Batch Orders**: Group orders going to same area
2. **Peak Hours**: Be aware of high-demand times
3. **Preparation Time**: Start preparing when order is placed
4. **Driver Communication**: Be responsive to driver calls
5. **Address Verification**: Verify addresses before triggering
6. **Backup Plan**: Have alternative delivery method ready

## Reporting Issues

If you encounter problems:

1. **Document the Issue**:
   - Order number
   - Delivery ID
   - Time of occurrence
   - Error messages
   - Screenshots if applicable

2. **Check Logs**:
   - Review order history
   - Check delivery tracking timeline
   - Note any unusual behavior

3. **Contact Support**:
   - Provide all documentation
   - Explain steps taken
   - Include expected vs actual behavior

## FAQ

**Q: Can I cancel a delivery after it's triggered?**
A: Contact Uber Direct support immediately. Cancellation may incur fees.

**Q: What if the customer isn't home?**
A: Driver will attempt to contact customer. If unsuccessful, follow Uber's protocol.

**Q: Can I track multiple deliveries at once?**
A: Yes, each order shows its own delivery tracking card.

**Q: What happens if delivery fails?**
A: Order remains in "Ready" status. You can trigger a new delivery or arrange alternative.

**Q: How long does delivery typically take?**
A: Varies by distance and traffic. Check ETA in delivery tracking.

**Q: Can customers track their delivery?**
A: Yes, they receive a tracking link and real-time notifications.

**Q: What if driver can't find the address?**
A: Driver will call customer. You can also call driver to assist.

**Q: Are there delivery time restrictions?**
A: Check Uber Direct service hours for your area.

---

**Last Updated**: [Current Date]
**Version**: 1.0
