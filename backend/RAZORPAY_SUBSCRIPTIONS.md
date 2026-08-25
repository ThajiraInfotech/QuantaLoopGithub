# Razorpay subscriptions

Checkout uses **Razorpay Orders** (one-time payment). You only need:

1. `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` (same test or live pair).
2. Optional: `RAZORPAY_WEBHOOK_SECRET` and webhook URL
   `POST {API_PUBLIC_URL}/api/v1/subscriptions/webhook` for
   `payment.captured`, `payment.failed`, `order.paid`.

No Razorpay Subscription **plan** is required. Quanta Loop still grants
**1 year of access** after a successful ₹6,999 payment, and GST invoices are
created from the billing profile.

`RAZORPAY_PLAN_MAP` is legacy and unused for Orders checkout.

The authenticated
`GET /api/v1/subscriptions/config` response includes only the public key ID and
purchasable catalog metadata.

Use a unique `Idempotency-Key` header for each logical
`POST /api/v1/subscriptions/checkout` attempt. Reusing it with a different plan
returns a conflict. Checkout completion must be sent to
`POST /api/v1/subscriptions/verify` with `razorpay_order_id`,
`razorpay_payment_id`, and `razorpay_signature`
(`HMAC-SHA256(order_id|payment_id)`).

## Server-side paid access

`GET /api/v1/subscriptions/access-state` returns the canonical access decision:
`state`, `plan`, `status`, `expiresAt`, `entitled`, and `reason`.

Participant access requires a locally reconciled Razorpay status of `active`
and a future `currentEndAt`. `authenticated` is treated as payment processing,
not entitlement. A subscription cancelled at cycle end remains entitled while
it is still `active` and `currentEndAt` is in the future. The lookup checks for
any valid subscription, so a newer incomplete checkout cannot hide an older
valid subscription. Administrators bypass subscription checks.

The backend protects network, materials, interests, conversations, messages,
saved materials, reports, opportunities, recommendations, reminders, insights,
activity, activity signals, notifications, and matches. Unentitled requests
return HTTP 403 with code `SUBSCRIPTION_REQUIRED` and the canonical access state
in `error.details.accessState`.

Authentication, locations, access plans, subscription config/checkout/status/
verification/webhook routes, administration, and verification remain outside
the paywall. Unpaid participants may read and update `/api/v1/profile/me` (and
read their own profile by id) to complete onboarding; reading another
participant's profile requires paid access.

Run the network/DB-free cryptographic checks with:

```sh
npm run test:subscriptions
```

This runs signature/status checks plus DB-free entitlement and middleware
checks.
