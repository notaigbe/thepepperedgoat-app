
# Stored Cards Display Fix

## Issue
Stored cards from the `square_cards` table were not being displayed on the checkout screen in the React Native app.

## Root Causes

### 1. Square Web Payments SDK HTTPS Requirement
The error message "Failed to initialize payment form: Web Payments SDK can only be embedded on sites that use HTTPS and have a secure context" was occurring because:

- Square's Web Payments SDK requires HTTPS and a secure context
- React Native WebView does not provide a secure HTTPS context
- The SDK cannot be embedded in a mobile WebView environment

### 2. Missing Database Type Definitions
The `square_cards` table was not included in the TypeScript type definitions (`app/integrations/supabase/types.ts`), which could cause type-related issues.

### 3. RLS Policy Considerations
The RLS policies on the `square_cards` table use `auth.uid()` which returns the authenticated user's UUID from the `auth.users` table. The query was correctly using `userProfile.id` which should match the `user_id` column in the `square_cards` table.

## Solution

### 1. Removed Square Web Payments SDK from Mobile App
Since the Square Web Payments SDK cannot work in a React Native WebView, we:

- Removed the functional card form WebView
- Replaced it with an informational message explaining that new cards must be added via the website
- Updated the "New Card" button to show an alert directing users to add cards on the website

### 2. Updated Database Type Definitions
Added the `square_cards` table definition to `app/integrations/supabase/types.ts`:

```typescript
square_cards: {
  Row: {
    id: string
    user_id: string
    square_customer_id: string
    square_card_id: string
    card_brand: string
    last_4: string
    exp_month: number
    exp_year: number
    cardholder_name: string | null
    billing_address: Json | null
    is_default: boolean
    created_at: string
    updated_at: string
  }
  // ... Insert and Update types
}
```

### 3. Enhanced Card Loading Logic
Improved the `loadStoredCards()` function to:

- Add detailed console logging for debugging
- Properly map database fields to the `StoredCard` interface
- Include both `squareCardId` and `squareCustomerId` for payment processing
- Handle empty results gracefully
- Show loading state with a message

### 4. Updated Payment Processing
Modified the `processSquarePayment()` function to:

- Use the `squareCardId` from stored cards as the `sourceId`
- Include the `customerId` when using stored cards
- Properly handle both stored card and new card payment flows

## How It Works Now

### Adding New Cards
1. Users must complete a purchase on the website (www.jagabansla.com)
2. During website checkout, they can save their card
3. The `process-square-payment` edge function saves the card to the `square_cards` table
4. Saved cards automatically appear in the mobile app

### Using Stored Cards
1. The app loads cards from the `square_cards` table on checkout screen mount
2. Cards are displayed with brand, last 4 digits, and expiration date
3. Default card is auto-selected
4. When paying with a stored card:
   - The app uses the `square_card_id` as the payment source
   - The `square_customer_id` is included in the payment request
   - The edge function processes the payment using the stored card

## Database Schema

The `square_cards` table structure:

```sql
CREATE TABLE square_cards (
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
```

## RLS Policies

The table has RLS enabled with policies that allow users to:
- View their own cards (`user_id = auth.uid()`)
- Insert their own cards
- Update their own cards
- Delete their own cards

A trigger ensures only one default card per user.

## Testing

To verify the fix:

1. **Add a card via website:**
   - Go to www.jagabansla.com
   - Complete a purchase and save a card during checkout
   - Verify the card is saved in the `square_cards` table

2. **View cards in mobile app:**
   - Open the checkout screen in the mobile app
   - Verify saved cards are displayed
   - Check that the default card is auto-selected

3. **Pay with stored card:**
   - Select a stored card
   - Complete the checkout
   - Verify the payment processes successfully

## Future Improvements

1. **Card Management Screen:**
   - Add ability to view all saved cards
   - Allow users to set default card
   - Enable card deletion

2. **Card on File Updates:**
   - Implement card update functionality
   - Handle expired card notifications

3. **Alternative Payment Methods:**
   - Consider adding Apple Pay / Google Pay
   - These work natively in mobile apps without HTTPS restrictions

## Related Files

- `app/checkout.tsx` - Main checkout screen with card display
- `app/integrations/supabase/types.ts` - Database type definitions
- `supabase/migrations/create_square_cards_table.sql` - Table creation migration
- `docs/SQUARE_PAYMENTS_IMPLEMENTATION.md` - Overall Square integration docs
