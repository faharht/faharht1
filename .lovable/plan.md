A roadmap focused on **Learning features** and **Monetization & Pro perks**. Items are grouped by impact vs. effort so you can pick what to ship first. Nothing below is built yet — this is a proposal.

## Tier 1 — High impact, low/medium effort (ship first)

### Learning

1. **SRS (spaced repetition) review queue**
  Daily "Review" tab that resurfaces sentences using SM-2 lite scheduling (intervals: 1d, 3d, 7d, 16d, 35d). Uses existing `progress` data in `trainer_state`.
2. **Listening mode (audio-first)**
  Hide Russian text → user types or taps "I got it / didn't". Toggle on any set. Big retention boost, reuses existing TTS.
3. **Typing / dictation drill**
  User types the Russian sentence from English/DE/PL prompt. Cyrillic on-screen keyboard helper. Counts as a stricter rep.
4. **Word-level tap-to-translate**
  Tap any Russian word in a sentence → popover with translation + grammar form. Uses Lovable AI on demand, cached per word.
5. **Daily challenge push**
  "5 sentences in 2 minutes" mini-mode on the home page. Pairs with the existing streak system.

### Monetization

6. **Lock high-value features behind Pro instead of just quotas**
  Currently Pro is mostly "unlimited custom sets". Add: Listening mode, Typing mode, Tap-to-translate, SRS review queue (free = 50 reviews/day). Makes Pro a real upgrade.
7. **Annual plan emphasis**
  Pricing page already has it — add "Save 44%" badge, default-select annual, show monthly equivalent ($1.67/mo).

## Tier 2 — High impact, larger effort

### Learning

9. **AI tutor chat (Pro)**
  Conversation in Russian at user's level via Lovable AI Gateway. Corrects mistakes, explains grammar. The single most-requested feature in language apps.
10. **Conjugation trainer**
  Pulled from your top-300-verbs grammar data. Quiz on tense/person.
11. **Pronunciation scoring (Pro)**
  Record voice → compare to TTS using browser SpeechRecognition + similarity score. No backend cost.
12. **Story mode / dialogues**
  Multi-sentence scenes (cafe, airport) with branching choices. Builds on existing themed sets.

### Monetization

13. **Family / shared plan**
  $4.99/mo for 3 seats. New Paddle price, invite-by-email seats table.
14. **Lifetime deal**
  One-time $59. Strong for indie language apps; Paddle supports it.
15. **Gift Pro**
  Buy a Pro code for a friend. Paddle one-time price + redeemable codes table.

## Tier 3 — Polish & moat

16. **Offline mode (Pro)** — cache sentences + audio in IndexedDB.
17. **Shareable custom sets** — Pro can publish a custom set with a share link; free users can play (not edit) shared sets. Drives organic growth.
18. **Goal-based onboarding** — "travel / work / family / exam" picks a starting curriculum.
19. **Weekly progress email** — re-engagement, requires email infra (already partially set up).
20. **Pro-only voices** — premium TTS voice (e.g. neural Russian voice via AI Gateway).

## Suggested first build order

1. SRS review queue + lock advanced review behind Pro (items 1, 6)
2. Listening mode + Typing mode, both Pro-gated (items 2, 3)
3. 7-day free trial + annual default (items 7, 8)
4. Tap-to-translate (item 4)
5. AI tutor chat (item 9)

That sequence ships value to free users (basic SRS), makes Pro genuinely worth $2.99, and adds the headline AI feature once conversion is proven.

---

Tell me which items you want me to plan in detail (I'll write per-feature build plans), or say "build items 1, 2, 7, 8" and I'll start implementing.