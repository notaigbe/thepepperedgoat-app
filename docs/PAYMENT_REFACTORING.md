
# Payment System Refactoring Documentation

## Overview

The payment system has been refactored to use the Square Payments API exclusively through the `process-square-payment` edge function. This unified approach handles both app and website (guest) payments seamlessly.

## Architecture

### Payment Flow

```
┌─────────────────┐
│   Mobile App    │
│   or Website    │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────┐
│  process-square-payment         │
│  Edge Function                  │
│  - Handles user authentication  │
│  - Processes Square payment     │
│  - Creates order record         │
│  - Awards loyalty points        │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  Square Payments API            │
│  - Sandbox: cnon:card-nonce-ok  │
│  - Production: Real card tokens │
└─────────────────────────────────┘
```

### Key Components

#### 1. Checkout Screen (`app/checkout.tsx`)

**Features:**
- Order type selection (Delivery/Pickup)
- Address validation for delivery orders
- Real-time address verification using Google Address Validation API
- Points redemption system
- Order summary with tax calculation
- Secure payment processing

**Order Types:**
- **Delivery**: Requires validated delivery address
- **Pickup**: Optional pickup notes, no address required

**Address Validation:**
- Real-time validation as user types
- Confidence levels: high, medium, low
- Formatted address suggestions
- Visual feedback with icons and colors

#### 2. Process Square Payment Edge Function

**Endpoint:** `process-square-payment`

**Request Body:**
```typescript
{
  sourceId: string;           // Square payment nonce
  amount: number;             // Amount in cents
  currency?: string;          // Default: 'USD'
  customer: {
    name: string;
    email: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
  };
  items: Array<{
    id: string;               // Menu item ID
    name: string;
    quantity: number;
    price: number;            // Price in dollars
  }>;
  orderType?: 'delivery' | 'pickup';
  deliveryAddress?: string;
  pickupNotes?: string;
}
```

**Response:**
```typescript
{
  success: boolean;
  orderId: string;
  orderNumber: number;
  paymentId: string;
  orderStatus: string;
  pointsEarned: number;
  mode: 'user' | 'guest';
  skipped_user_lookup: boolean;
}
```

**Authentication Handling:**
- Detects user authentication via Bearer token
- Supports guest checkout (anon key detection)
- Creates orders with or without user association

#### 3. Guest Token System

**Endpoint:** `mint_guest_order_token`

**Purpose:** Allows website guests to retrieve order information without authentication

**Request:**
```typescript
{
  order_id: string;
}
```

**Response:**
```typescript
{
  order: {
    id: string;
    customer_name: string;
    customer_email: string;
    customer_phone: string;
    customer_address: string;
    customer_city: string;
    customer_state: string;
    customer_zip: string;
    total_amount: number;
    payment_status: string;
    order_status: string;
    items: Array<{
      name: string;
      quantity: number;
      price: number;
    }>;
    created_at: string;
    order_number: number;
    receipt_url: string;
  }
}
```

## Database Schema

### Orders Table
```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id),  -- Nullable for guest orders
  total NUMERIC NOT NULL,
  points_earned INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'preparing', 'ready', 'completed', 'cancelled')),
  delivery_address TEXT,
  pickup_notes TEXT,
  payment_id UUID REFERENCES square_payments(id),
  order_number INTEGER UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Square Payments Table
```sql
CREATE TABLE square_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id),  -- Nullable for guest payments
  order_id UUID REFERENCES orders(id),
  square_payment_id TEXT NOT NULL,
  square_order_id TEXT,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT CHECK (status IN ('pending', 'completed', 'failed', 'refunded', 'cancelled')),
  payment_method TEXT,
  receipt_url TEXT,
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Implementation Details

### Address Verification

The checkout screen uses the `verify-address` edge function to validate delivery addresses:

**Features:**
- Real-time validation with debouncing (1 second delay)
- Google Address Validation API integration
- Confidence scoring (high/medium/low)
- Formatted address suggestions
- Visual feedback with color-coded icons

**Validation Flow:**
1. User enters address
2. After 1 second of inactivity, validation triggers
3. Address is sent to `verify-address` edge function
4. Google API validates and returns formatted address
5. UI displays validation status and suggestions
6. User can accept suggested address or continue with original

### Payment Processing

**Square Sandbox Testing:**
- Test nonce: `cnon:card-nonce-ok`
- Always succeeds in sandbox environment
- Use for development and testing

**Production Integration:**
- Requires Square Web Payments SDK
- Generates real payment nonces from card data
- Handles 3D Secure authentication
- PCI-compliant tokenization

### Points System

**Earning Points:**
- 1 point per dollar spent (rounded down)
- Only for authenticated users
- Automatically credited after successful payment
- Notification sent to user

**Using Points:**
- 1 point = $0.01 discount
- Maximum 20% of order total
- Toggle on checkout screen
- Deducted before payment processing

## Security Considerations

### Authentication
- Bearer token validation for user requests
- Anon key detection for guest requests
- Service role key for admin operations
- JWT verification on edge functions

### Data Protection
- PCI-compliant payment processing
- No card data stored in database
- Square handles all sensitive payment information
- Encrypted communication (HTTPS)

### RLS Policies
```sql
-- Orders table
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own orders"
  ON orders FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all orders"
  ON orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND user_role IN ('admin', 'super_admin')
    )
  );

-- Square payments table
ALTER TABLE square_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own payments"
  ON square_payments FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all payments"
  ON square_payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND user_role IN ('admin', 'super_admin')
    )
  );
```

## Testing

### Test Scenarios

1. **Authenticated User - Delivery Order**
   - Login to app
   - Add items to cart
   - Select delivery
   - Enter and validate address
   - Complete payment
   - Verify order created with user_id
   - Verify points awarded

2. **Authenticated User - Pickup Order**
   - Login to app
   - Add items to cart
   - Select pickup
   - Add pickup notes
   - Complete payment
   - Verify order created with user_id
   - Verify points awarded

3. **Guest User - Website Order**
   - Visit website
   - Add items to cart
   - Enter customer details
   - Complete payment
   - Verify order created without user_id
   - Verify no points awarded
   - Use `mint_guest_order_token` to retrieve order

4. **Address Validation**
   - Enter incomplete address
   - Verify validation fails
   - Enter complete address
   - Verify validation succeeds
   - Accept suggested formatted address

5. **Points Redemption**
   - Login with points balance
   - Add items to cart
   - Toggle points usage
   - Verify discount applied
   - Complete payment
   - Verify points deducted

### Test Cards (Sandbox)

Square provides test card numbers for sandbox testing:
- **Success:** Use nonce `cnon:card-nonce-ok`
- **Decline:** Use nonce `cnon:card-nonce-declined`
- **CVV Failure:** Use nonce `cnon:card-nonce-cvv-declined`

## Migration Notes

### From Web Checkout to Payments API

**Before:**
- Used `create-square-checkout` edge function
- Redirected to Square hosted checkout page
- Required return URL handling
- Limited customization

**After:**
- Uses `process-square-payment` edge function
- In-app payment processing
- Full UI control
- Better user experience

**Breaking Changes:**
- Removed `create-square-checkout` function calls
- Removed web checkout redirect logic
- Updated payment flow in checkout screen

## Future Enhancements

1. **Square Web Payments SDK Integration**
   - Replace test nonce with real card tokenization
   - Add card input UI components
   - Implement 3D Secure authentication
   - Support digital wallets (Apple Pay, Google Pay)

2. **Payment Methods Management**
   - Save card tokens for future use
   - Implement card-on-file functionality
   - Allow users to manage saved cards
   - Set default payment method

3. **Advanced Features**
   - Partial refunds
   - Order modifications
   - Subscription payments
   - Split payments

4. **Analytics**
   - Payment success/failure rates
   - Average order value
   - Popular payment methods
   - Conversion funnel analysis

## Troubleshooting

### Common Issues

**Issue:** Payment fails with "Invalid sourceId"
**Solution:** Ensure you're using the correct test nonce in sandbox or valid card token in production

**Issue:** Order created but points not awarded
**Solution:** Check `increment_user_points` RPC function exists and user_id is valid

**Issue:** Address validation always fails
**Solution:** Verify Google Maps API key is set in Supabase secrets and has Address Validation API enabled

**Issue:** Guest orders not accessible
**Solution:** Use `mint_guest_order_token` function with order_id to retrieve guest order details

## Support

For issues or questions:
1. Check Supabase logs: `get_logs` function
2. Review edge function logs in Supabase dashboard
3. Verify Square API credentials in Supabase secrets
4. Test with Square sandbox environment first

## References

- [Square Payments API Documentation](https://developer.squareup.com/docs/payments-api/overview)
- [Square Web Payments SDK](https://developer.squareup.com/docs/web-payments/overview)
- [Google Address Validation API](https://developers.google.com/maps/documentation/address-validation)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
