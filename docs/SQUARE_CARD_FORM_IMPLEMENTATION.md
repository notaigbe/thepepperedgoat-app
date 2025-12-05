
# Square Card Form Implementation Guide

This document explains how the Square Payments API card form and stored cards feature has been implemented in the checkout screen.

## Overview

The checkout screen now displays:
1. **Stored Cards**: Previously saved payment methods from Square
2. **New Card Form**: Square Web Payments SDK card form for adding new cards
3. **Payment Selection**: Radio buttons to choose between saved cards or adding a new card

## Database Schema

A new `square_cards` table needs to be created to store tokenized card information:

```sql
-- Create square_cards table to store tokenized card information from Square
CREATE TABLE IF NOT EXISTS square_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  square_customer_id text NOT NULL,
  square_card_id text NOT NULL,
  card_brand text NOT NULL,
  last_4 text NOT NULL,
  exp_month integer NOT NULL,
  exp_year integer NOT NULL,
  cardholder_name text,
  billing_address jsonb,
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT timezone('utc', now()) NOT NULL,
  updated_at timestamptz DEFAULT timezone('utc', now()) NOT NULL
);

-- Enable RLS
ALTER TABLE square_cards ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own cards"
  ON square_cards
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own cards"
  ON square_cards
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own cards"
  ON square_cards
  FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own cards"
  ON square_cards
  FOR DELETE
  USING (user_id = auth.uid());

-- Create indexes for better performance
CREATE INDEX idx_square_cards_user_id ON square_cards(user_id);
CREATE INDEX idx_square_cards_square_customer_id ON square_cards(square_customer_id);
CREATE INDEX idx_square_cards_is_default ON square_cards(user_id, is_default);

-- Create function to ensure only one default card per user
CREATE OR REPLACE FUNCTION ensure_single_default_card()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = true THEN
    UPDATE square_cards
    SET is_default = false
    WHERE user_id = NEW.user_id
      AND id != NEW.id
      AND is_default = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to enforce single default card
CREATE TRIGGER trigger_ensure_single_default_card
  BEFORE INSERT OR UPDATE ON square_cards
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_default_card();
```

## Frontend Implementation

### Checkout Screen (`app/checkout.tsx`)

The checkout screen has been updated with:

1. **Payment Method Selection**:
   - Radio buttons to choose between "Saved Card" and "New Card"
   - Displays all stored cards when "Saved Card" is selected
   - Shows Square Web Payments SDK form when "New Card" is selected

2. **Stored Cards Display**:
   - Lists all saved cards with card brand, last 4 digits, and expiration
   - Shows "Default" badge for the default card
   - Allows selection of which card to use for payment
   - Auto-selects the default card on load

3. **New Card Form**:
   - Embedded Square Web Payments SDK in a WebView
   - Tokenizes card information securely
   - Sends token back to React Native via postMessage
   - Option to save card for future use

4. **Payment Processing**:
   - Uses stored card ID for saved cards
   - Uses new card token for new cards
   - Passes `saveCard: true` flag to backend when adding new card

### Key Features

- **Loading State**: Shows loading indicator while fetching stored cards
- **Card Icons**: Displays appropriate icons based on card brand
- **Default Card**: Automatically selects and highlights default card
- **Validation**: Ensures payment method is selected before checkout
- **Error Handling**: Shows user-friendly error messages

## Backend Updates Required

The `process-square-payment` Edge Function needs to be updated to:

1. **Handle Stored Cards**:
   - When `sourceId` is a UUID (stored card ID), fetch the card from `square_cards` table
   - Use the `square_card_id` to charge the card via Square API

2. **Save New Cards**:
   - When `saveCard: true` is passed, create a Square customer (if not exists)
   - Save the card to the customer's account in Square
   - Store card details in `square_cards` table
   - Set as default if it's the user's first card

3. **Customer Management**:
   - Create Square customer on first card save
   - Store `square_customer_id` in user profile or separate table
   - Link all cards to the same customer

### Example Edge Function Updates

```typescript
// In process-square-payment Edge Function

// Check if sourceId is a stored card (UUID format)
const isStoredCard = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(sourceId);

if (isStoredCard) {
  // Fetch stored card from database
  const { data: storedCard, error: cardError } = await supabaseAdmin
    .from('square_cards')
    .select('*')
    .eq('id', sourceId)
    .eq('user_id', userId)
    .single();

  if (cardError || !storedCard) {
    throw new Error('Stored card not found');
  }

  // Use the Square card ID for payment
  actualSourceId = storedCard.square_card_id;
  customerId = storedCard.square_customer_id;
}

// After successful payment, save card if requested
if (saveCard && !isStoredCard) {
  // Create or get Square customer
  let customerId = await getOrCreateSquareCustomer(userId, customer);

  // Save card to Square customer
  const cardResponse = await squareClient.cardsApi.createCard({
    idempotencyKey: uuidv4(),
    sourceId: sourceId,
    card: {
      customerId: customerId,
      billingAddress: {
        addressLine1: customer.address,
        locality: customer.city,
        administrativeDistrictLevel1: customer.state,
        postalCode: customer.zip,
      },
    },
  });

  // Save card to database
  await supabaseAdmin
    .from('square_cards')
    .insert({
      user_id: userId,
      square_customer_id: customerId,
      square_card_id: cardResponse.result.card.id,
      card_brand: cardResponse.result.card.cardBrand,
      last_4: cardResponse.result.card.last4,
      exp_month: cardResponse.result.card.expMonth,
      exp_year: cardResponse.result.card.expYear,
      cardholder_name: cardResponse.result.card.cardholderName,
      is_default: true, // Set as default if first card
    });
}
```

## Square Web Payments SDK Configuration

The card form uses Square's Web Payments SDK embedded in a WebView. You need to:

1. **Get Square Application ID**:
   - Go to Square Developer Dashboard
   - Copy your Application ID
   - Replace `'sandbox-sq0idb-YOUR_APP_ID'` in the HTML

2. **Get Square Location ID**:
   - Go to Square Developer Dashboard → Locations
   - Copy your Location ID
   - Replace `'YOUR_LOCATION_ID'` in the HTML

3. **Update Environment**:
   - For sandbox: Use `https://sandbox.web.squarecdn.com/v1/square.js`
   - For production: Use `https://web.squarecdn.com/v1/square.js`

### Card Form HTML

The card form is embedded as HTML in the WebView:

```html
<!DOCTYPE html>
<html>
<head>
  <script type="text/javascript" src="https://sandbox.web.squarecdn.com/v1/square.js"></script>
</head>
<body>
  <div id="card-container"></div>
  <button id="card-button">Add Card</button>
  
  <script>
    const payments = Square.payments(appId, locationId);
    const card = await payments.card();
    await card.attach('#card-container');
    
    // Tokenize and send to React Native
    const token = await card.tokenize();
    window.ReactNativeWebView.postMessage(JSON.stringify({
      type: 'TOKEN_CREATED',
      token: token
    }));
  </script>
</body>
</html>
```

## User Flow

### First-Time User (No Saved Cards)

1. User goes to checkout
2. Sees "New Card" option selected by default
3. Square card form is displayed
4. User enters card details
5. Clicks "Add Card" button
6. Card is tokenized by Square
7. Token is sent to backend
8. Payment is processed
9. Card is saved to Square customer
10. Card details stored in database

### Returning User (Has Saved Cards)

1. User goes to checkout
2. Sees "Saved Card" option selected by default
3. Default card is pre-selected
4. User can choose different saved card or add new card
5. Clicks "Pay" button
6. Payment is processed using selected card
7. Order is completed

## Security Considerations

1. **No Raw Card Data**: Card numbers are never stored in the database
2. **Tokenization**: All card data is tokenized by Square before transmission
3. **RLS Policies**: Users can only access their own cards
4. **HTTPS Only**: All communication uses HTTPS
5. **PCI Compliance**: Square handles PCI compliance
6. **Secure Storage**: Only card metadata (brand, last 4, expiration) is stored

## Testing

### Test Cards (Sandbox)

Use these test card numbers in the Square card form:

- **Visa**: `4111 1111 1111 1111`
- **Mastercard**: `5105 1051 0510 5100`
- **Amex**: `3782 822463 10005`
- **Discover**: `6011 1111 1111 1117`

All test cards:
- CVV: Any 3 digits (4 for Amex)
- Expiration: Any future date
- Postal Code: Any valid postal code

### Testing Flow

1. Add items to cart
2. Go to checkout
3. Select "New Card"
4. Enter test card details in Square form
5. Click "Add Card"
6. Verify card is tokenized
7. Complete payment
8. Verify card is saved
9. Go to checkout again
10. Verify saved card appears
11. Select saved card
12. Complete payment with saved card

## Troubleshooting

### Card Form Not Loading

- Check Square Application ID and Location ID are correct
- Verify Square SDK URL is correct for environment (sandbox vs production)
- Check browser console in WebView for JavaScript errors

### Card Not Saving

- Verify `saveCard: true` is being passed to backend
- Check Edge Function logs for errors
- Verify `square_cards` table exists and has correct permissions
- Check Square customer creation is working

### Stored Cards Not Displaying

- Verify `square_cards` table has data
- Check RLS policies allow user to read their cards
- Verify user ID matches in database
- Check console logs for fetch errors

## Future Enhancements

- [ ] Card management screen (view, delete, set default)
- [ ] Support for Apple Pay / Google Pay
- [ ] Card verification (CVV) for saved cards
- [ ] Billing address management
- [ ] Multiple billing addresses per card
- [ ] Card expiration notifications
- [ ] Automatic card updates from Square

## References

- [Square Web Payments SDK Documentation](https://developer.squareup.com/docs/web-payments/overview)
- [Square Cards API Documentation](https://developer.squareup.com/reference/square/cards-api)
- [Square Customers API Documentation](https://developer.squareup.com/reference/square/customers-api)
- [React Native WebView Documentation](https://github.com/react-native-webview/react-native-webview)
