# Razorpay subscriptions

1. In Razorpay, create a yearly INR plan for INR 6,999, or run
   `npm run billing:bootstrap-plan` with backend Razorpay credentials set.
2. Set `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, and
   `RAZORPAY_WEBHOOK_SECRET` in the backend deployment environment.
3. Set `RAZORPAY_PLAN_MAP` to a JSON object, for example:
   `{"annual_access":"plan_..."}`.
4. Configure Razorpay's webhook URL as
   `https://<api-host>/api/v1/subscriptions/webhook`.
5. Subscribe it to `subscription.authenticated`, `subscription.activated`,
   `subscription.pending`, `subscription.halted`, `subscription.paused`,
   `subscription.resumed`, `subscription.cancelled`, `subscription.completed`,
   `subscription.expired`, and `payment.failed`.

The `annual_access` catalog entry currently creates a fixed one-cycle yearly
subscription (`total_count: 1`) for test mode. Recurring annual billing can be
restored later by increasing the catalog's `totalCount`; access checks remain
based on the provider-confirmed current period rather than that billing count.

Never expose the key secret or webhook secret to a client. The authenticated
`GET /api/v1/subscriptions/config` response includes only the public key ID and
purchasable catalog metadata.

Use a unique `Idempotency-Key` header for each logical
`POST /api/v1/subscriptions/checkout` attempt. Reusing it with a different plan
returns a conflict. Checkout completion must be sent to
`POST /api/v1/subscriptions/verify`; the backend verifies the checkout HMAC and
then reconciles both the subscription and payment directly with Razorpay.
Verification does not itself make an `authenticated` subscription entitled.
Access starts only after Razorpay reports `active` with a future `current_end`.
Webhooks are the ongoing source of truth for status and period changes.

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
