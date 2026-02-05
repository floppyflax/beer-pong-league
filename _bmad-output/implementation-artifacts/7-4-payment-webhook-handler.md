# Story 7.4: Payment Webhook Handler

Status: ready-for-dev

## Story

As a developer,
I want a webhook to process Stripe payment confirmations,
so that premium status is automatically updated after successful payment.

## Acceptance Criteria

1. **Given** Stripe sends payment webhook
   **When** payment is confirmed
   **Then** webhook handler verifies Stripe signature
   **And** webhook handler extracts user ID from metadata
   **And** webhook handler updates `users.is_premium` to true
   **And** webhook handler logs payment transaction
   **And** webhook handler returns 200 status to Stripe
   **And** webhook handler handles errors gracefully
   **And** webhook handler is idempotent (handles duplicate events)

## Tasks / Subtasks

- [ ] Task 1: Create Supabase Edge Function structure (AC: 1)
  - [ ] Create `supabase/functions/stripe-webhook/` directory
  - [ ] Create `supabase/functions/stripe-webhook/index.ts`
  - [ ] Set up Deno runtime configuration
  - [ ] Add function configuration
- [ ] Task 2: Implement webhook signature verification (AC: 1)
  - [ ] Get Stripe webhook secret from environment
  - [ ] Extract signature from request headers
  - [ ] Verify signature using Stripe SDK
  - [ ] Reject requests with invalid signatures
- [ ] Task 3: Process payment events (AC: 1)
  - [ ] Parse webhook event from request body
  - [ ] Handle `checkout.session.completed` event
  - [ ] Extract user_id from payment metadata
  - [ ] Handle other relevant events (payment_intent.succeeded, etc.)
- [ ] Task 4: Update premium status (AC: 1)
  - [ ] Query user by user_id from metadata
  - [ ] Update `users.is_premium` to true
  - [ ] Handle case where user doesn't exist
  - [ ] Ensure atomic update (transaction)
- [ ] Task 5: Implement idempotency (AC: 1)
  - [ ] Check if payment already processed (by payment intent ID)
  - [ ] Skip processing if already handled
  - [ ] Log duplicate events
- [ ] Task 6: Add error handling and logging (AC: 1)
  - [ ] Log all webhook events for debugging
  - [ ] Handle database errors gracefully
  - [ ] Return appropriate HTTP status codes
  - [ ] Log payment transactions (optional purchases table)
- [ ] Task 7: Configure webhook endpoint (AC: 1)
  - [ ] Deploy Edge Function to Supabase
  - [ ] Get webhook URL
  - [ ] Configure webhook in Stripe Dashboard
  - [ ] Test webhook with Stripe CLI or test events

## Dev Notes

### Relevant Architecture Patterns and Constraints

**Supabase Edge Function Pattern:**
- Use Deno runtime (Supabase Edge Functions use Deno)
- Import Supabase client: `import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'`
- Use `Deno.serve()` for HTTP handler
- Handle CORS if needed
- Return proper HTTP responses

**Webhook Security:**
- **CRITICAL**: Always verify Stripe webhook signature
- Use `stripe.webhooks.constructEvent()` to verify signature
- Get webhook secret from Supabase secrets: `Deno.env.get('STRIPE_WEBHOOK_SECRET')`
- Reject any request without valid signature

**Event Processing:**
- Handle `checkout.session.completed` event (most common for Checkout)
- Handle `payment_intent.succeeded` if using Payment Intents
- Extract metadata: `event.data.object.metadata.user_id`
- Process events idempotently (check if already processed)

**Database Update Pattern:**
- Use Supabase client to update `users` table
- Query: `supabase.from('users').update({ is_premium: true }).eq('id', userId)`
- Handle case where user doesn't exist
- Use transaction if updating multiple tables

**Idempotency Pattern:**
- Store processed payment intent IDs (in database or cache)
- Check before processing: `SELECT * FROM purchases WHERE stripe_payment_intent_id = ?`
- Skip if already processed
- Log duplicate events for monitoring

**Error Handling:**
- Return 200 to Stripe even on errors (to prevent retries for non-retryable errors)
- Log errors for debugging
- Return 400 for invalid requests (malformed, missing data)
- Return 500 for server errors (but Stripe will retry)

### Source Tree Components to Touch

**Files to Create:**
- `supabase/functions/stripe-webhook/index.ts` - Edge Function handler
- `supabase/functions/stripe-webhook/deno.json` (optional) - Deno configuration

**Files to Reference:**
- `supabase/migrations/005_add_premium_status.sql` - Premium status column
- `src/services/PremiumService.ts` (Story 7.2) - Premium status logic

**Environment Configuration:**
- Supabase Dashboard → Settings → Edge Functions → Secrets
- Add `STRIPE_WEBHOOK_SECRET` secret
- Stripe Dashboard → Webhooks → Add endpoint

**Optional: Purchases Table (for logging):**
- Could create `purchases` table to log all payments
- Fields: id, user_id, stripe_payment_intent_id, amount, created_at
- Useful for analytics and debugging

### Testing Standards Summary

**Local Testing:**
- Use Stripe CLI: `stripe listen --forward-to localhost:54321/functions/v1/stripe-webhook`
- Test with Stripe test events
- Verify signature verification works
- Test idempotency (send same event twice)

**Integration Testing:**
- Deploy Edge Function to Supabase
- Configure webhook in Stripe Dashboard (test mode)
- Make test payment and verify webhook is called
- Verify premium status is updated
- Test error scenarios

**Security Testing:**
- Test with invalid signature (should reject)
- Test with missing signature (should reject)
- Test with valid signature (should accept)
- Test with different event types

### Project Structure Notes

**Alignment with Unified Project Structure:**
- ✅ Edge Function location: `supabase/functions/` (Supabase convention)
- ✅ Function naming: `stripe-webhook` (kebab-case)
- ✅ Deno runtime (Supabase Edge Functions standard)
- ✅ Follows Supabase Edge Function patterns

**Detected Conflicts or Variances:**
- None - this follows Supabase Edge Function conventions

### References

**Epic Context:**
- [Source: _bmad-output/planning-artifacts/epics.md#Epic-7] Epic 7: Freemium Payment Model & Premium Features
- [Source: _bmad-output/planning-artifacts/epics.md#Story-7.4] Story 7.4: Payment Webhook Handler

**Stripe Webhook Documentation:**
- Stripe Webhooks: https://stripe.com/docs/webhooks
- Webhook Security: https://stripe.com/docs/webhooks/signatures
- Testing Webhooks: https://stripe.com/docs/webhooks/test

**Supabase Edge Functions:**
- Supabase Edge Functions: https://supabase.com/docs/guides/functions
- Deno Runtime: https://deno.land/

**Database Schema:**
- [Source: supabase/migrations/005_add_premium_status.sql] Premium status column in users table

## Dev Agent Record

### Agent Model Used

_To be filled by dev agent_

### Debug Log References

_To be filled by dev agent_

### Completion Notes List

_To be filled by dev agent_

### File List

_To be filled by dev agent_
