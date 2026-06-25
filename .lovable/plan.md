## Goal

Let users build their own sentence sets. They enter sentences in any language; the app auto-translates to Russian (with stress + transliteration) plus English, German, and Polish. Free tier: 1 custom set, 5 sentences/day. Pro ($2.99/mo or $19.99/yr): unlimited.

## 1. Database (new migration)

- `custom_sets` — `id`, `user_id`, `title`, `description`, `icon`, `tone`, `created_at`, `updated_at`. RLS: owner CRUD; admins read all.
- `custom_sentences` — same shape as `sentences` (ru, ru_stressed, translit, en, pl, de, sort_order) + `set_id`, `user_id`, `source_lang`, `source_text`. RLS: owner CRUD.
- `user_subscriptions` — `user_id`, `tier` ('free'|'pro'), `status`, `current_period_end`, `provider`, `provider_customer_id`, `provider_subscription_id`. RLS: owner read; service_role write.
- `daily_usage` — `user_id`, `usage_date`, `sentences_added`. Unique `(user_id, usage_date)`. RLS: owner read; service_role write (server fn upserts).
- DB function `can_add_sentence(_user_id)` and `can_create_set(_user_id)` — security definer; checks Pro status + counts.
- GRANTs for all new tables per project rules.

## 2. AI translation server function

`src/lib/translate.functions.ts` — `translateSentence({ text, sourceLang? })` using `requireSupabaseAuth`.
- Uses Lovable AI Gateway (`google/gemini-3-flash-preview`) with structured output (zod):
  - `ru`, `ru_stressed` (with ё/accent marks), `translit` (BGN/PCGN-ish), `en`, `pl`, `de`, `detected_source_lang`.
- Returns 402/429 gateway errors to the UI cleanly.
- Quota gate: before calling, runs `can_add_sentence` RPC; throws `QUOTA_EXCEEDED` if free user is over 5/day.

Other server fns (all auth-gated):
- `createCustomSet`, `updateCustomSet`, `deleteCustomSet` (checks `can_create_set` for free users — limit 1).
- `addCustomSentence` (calls translator, inserts, increments `daily_usage`).
- `addCustomSentencesBatch` (loops with quota guard per item).
- `getMySubscription`, `getMyUsage`.

## 3. Payments (Stripe — built-in Lovable Payments)

Subscription product fits Stripe's managed payments path. Will run `recommend_payment_provider` then `enable_stripe_payments` after confirmation. Products: `pro_monthly $2.99`, `pro_yearly $19.99`. Webhook updates `user_subscriptions`.

## 4. UI

- New route `src/routes/_authenticated/custom.tsx` — list user's custom sets, "Create set" button, quota badge (e.g. "3/5 today · 1/1 sets · Free"), "Upgrade to Pro" CTA.
- `src/routes/_authenticated/custom.$setId.tsx` — set editor: rename/delete, sentence list, "Add sentence" (textarea + optional source-lang dropdown, defaults auto-detect), "Batch add" (one per line, up to remaining quota). Shows translations after submit; lets user edit Russian/translit before save.
- `src/routes/_authenticated/pricing.tsx` — plan cards, Stripe checkout buttons.
- Home page: add new "My sets" tile under Sentence sets that opens `/custom`.
- Trainer (`list.$listId.tsx`) — extend to load from `custom_sentences` when `listId` starts with `custom-<uuid>`; reuse existing playback UI. Audio playback gate: custom sentences always playable for the owner (Pro or free); locks don't apply to your own content.

## 5. i18n

Add string keys in EN/DE/PL/RU for: "My sets", "Create set", "Add sentence", "Batch add", "Daily limit reached", "Upgrade to Pro", "Unlimited sets & sentences", quota labels, pricing copy.

## 6. Files touched

New:
- `supabase/migrations/<ts>_custom_sets.sql`
- `src/lib/translate.functions.ts`, `src/lib/customSets.functions.ts`, `src/lib/billing.functions.ts`
- `src/routes/_authenticated/custom.tsx`, `custom.$setId.tsx`, `pricing.tsx`
- `src/components/QuotaBadge.tsx`, `UpgradeCard.tsx`, `AddSentenceForm.tsx`

Modified:
- `src/routes/index.tsx` (add "My sets" entry)
- `src/routes/list.$listId.tsx` (load custom sentences when id matches)
- `src/lib/i18n/strings.ts` (new keys, 4 languages)
- `src/components/BottomNav.tsx` (optional Custom shortcut)

## Open questions

1. Should custom sentences appear in the regular Sentence sets list, or stay in a separate "My sets" section? (Plan assumes separate.)
2. OK to use Stripe (Lovable's built-in) for the subscription, or do you prefer Paddle?
