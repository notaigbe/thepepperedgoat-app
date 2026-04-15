# The Peppered Goat

A mobile food ordering app for **The Peppered Goat** restaurant in Van Nuys, CA. Built with React Native (Expo) and a Supabase backend.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React Native 0.83.2 + Expo 55 |
| Language | TypeScript |
| Routing | Expo Router (file-based) |
| Backend / Auth / DB | Supabase |
| Payments | Stripe |
| Delivery | Uber Direct, DoorDash |
| Builds | EAS (Expo Application Services) |

---

## Features

- **Menu** — Browse food items by category, view details, add to cart
- **Cart & Checkout** — Manage cart, choose delivery or pickup, pay with saved cards
- **Order Tracking** — Real-time order status updates via Supabase Realtime
- **Delivery** — On-demand delivery dispatched through Uber Direct or DoorDash
- **Payments** — Stripe integration with saved payment methods, setup intents, and webhooks
- **User Profiles** — Sign up/in, loyalty points, order history, profile image
- **Push Notifications** — Order confirmations and status updates
- **Admin Panel** — Orders management, analytics, delivery settings, notification emails
- **Enquiry** — In-app enquiry/contact flow
- **Referrals** — Invite a friend sharing

---

## Project Structure

```
app/
  (tabs)/           # Bottom tab screens: Menu, Cart, Enquiry, Profile
  admin/            # Admin-only screens
  website/          # Web-facing pages
  checkout.tsx      # Checkout modal
  order-detail.tsx  # Order detail modal
  ...               # Other modal screens

components/         # Shared UI components
constants/          # App-wide config (delivery, locations, colours)
contexts/           # React context providers (App, Auth)
services/           # Supabase service layer
hooks/              # Custom hooks
utils/              # Helpers (dates, email, error logging, etc.)
data/               # Static menu / merch data

supabase/
  functions/        # Deno Edge Functions
    create-payment-intent/
    stripe-webhook/
    trigger-uber-delivery/
    trigger-doordash-delivery/
    doordash-delivery-webhook/
    uber-delivery-webhook/
    send-order-confirmation-email/
    save-payment-method/
    delete-account/
    ...
```

---

## Getting Started

### Prerequisites

- Node.js >= 18
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- [EAS CLI](https://docs.expo.dev/eas/) (`npm install -g eas-cli`)
- A Supabase project
- A Stripe account

### Install dependencies

```bash
npm install
```

### Environment variables

Create a `.env.local` file at the project root:

```env
EXPO_PUBLIC_SUPABASE_URL=<your-supabase-url>
EXPO_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=<your-stripe-publishable-key>
RESTAURANT_NAME="The Peppered Goat"
RESTAURANT_PHONE="+8182106659"
```

### Run in development

```bash
# Start the Metro bundler (clears cache)
npm run dev

# Or target a specific platform
npm run android
npm run ios
npm run web
```

---

## Building

Builds are managed by EAS with three profiles defined in [eas.json](eas.json):

| Profile | Distribution | Notes |
|---|---|---|
| `development` | Internal | Dev client with hot reload |
| `preview` | Internal | Production-like build for QA |
| `production` | Store | App Store / Play Store release |

```bash
# Development build
eas build --profile development --platform ios

# Preview build
eas build --profile preview --platform android

# Production build
eas build --profile production --platform all
```

---

## Supabase Edge Functions

Edge functions live under `supabase/functions/`. Deploy with:

```bash
supabase functions deploy <function-name>
```

Key functions:

| Function | Purpose |
|---|---|
| `create-payment-intent` | Create a Stripe PaymentIntent |
| `create-setup-intent` | Save a card without charging |
| `stripe-webhook` | Handle Stripe webhook events |
| `trigger-uber-delivery` | Dispatch delivery via Uber Direct |
| `trigger-doordash-delivery` | Dispatch delivery via DoorDash |
| `doordash-delivery-webhook` | Receive DoorDash status updates |
| `uber-delivery-webhook` | Receive Uber Direct status updates |
| `send-order-confirmation-email` | Email confirmation on order placed |
| `save-payment-method` | Persist Stripe payment method to DB |
| `delete-account` | Permanently delete a user account |

---

## Linting

```bash
npm run lint
```

---

## Navigation

The app uses a **Stack-based tab layout** with a custom floating tab bar:

| Tab | Route | Icon |
|---|---|---|
| Menu | `/(tabs)/(home)/` | house.fill |
| Cart | `/(tabs)/cart` | cart.fill |
| Enquiry | `/(tabs)/enquiry` | bubble.left.and.bubble.right |
| Profile | `/(tabs)/profile` | person |

Modal screens (checkout, order detail, payment methods, etc.) are pushed on top of the root stack.
