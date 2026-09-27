# Monetization: ads

Wordsmith Tavern is free and ad-supported. The rule of thumb: **ads should feel like an offer,
never a toll.** A cosy word game lives on long, relaxed sessions and daily return visits, and
players who feel ambushed by ads leave. Everything below is built around that.

## Placements

| Format            | Where                                    | When                                                          | Player gets                     |
| ----------------- | ---------------------------------------- | ------------------------------------------------------------- | ------------------------------- |
| Rewarded          | Closing-time summary                     | Once per night, if the night earned coins                     | The night's coins again         |
| Rewarded          | Taste Test popup                         | Any time a hint is available                                  | A free hint instead of 15 coins |
| Rewarded          | Service screen ("Barley hums a tune")    | Guest below 40% patience, once per order, not in Relaxed mode | Patience back up to 75%         |
| Rewarded          | Daily tip jar                            | Once a day                                                    | The daily gift doubled          |
| Interstitial      | Between nights                           | After "Close up for the night", when pacing allows            | —                               |
| Banner (adaptive) | Hub, decor shop, recipe book, guest book | While on those screens                                        | —                               |

Rewarded buttons only appear when an ad is actually loaded, so a player never taps "watch an ad"
and gets nothing. Rewards are granted only when the SDK reports the reward was earned; closing a
rewarded ad early gives nothing (this is covered by an end-to-end test).

## Pacing rules

Defined in `src/services/ads/policy.ts` (`AD_RULES`) and unit-tested in
`tests/ads-policy.test.ts`:

- **No interstitials during the first 3 nights.** New players meet the game, not ads.
- **At most one interstitial every 2 completed nights**, and never within 4 minutes of the
  previous one.
- **No interstitial within 2 minutes of a rewarded ad.** A player who just chose to watch an ad
  is not shown another one.
- **Never mid-order.** Interstitials only run between nights; the letter wheel never has a banner
  near it (accidental taps are both a bad experience and an AdMob policy violation).
- The game pauses (timers, music, sound) while any full-screen ad is showing.
- A `removeAds` flag in the save turns off interstitials and banners (rewarded ads stay available
  because they are opt-in). It's ready for a future in-app purchase.

With default pacing a typical player sees about one interstitial every 10 minutes of play, plus
whatever rewarded ads they choose.

## How it's wired

- `src/services/ads/index.ts` picks a provider at start-up and exposes reactive state (`ads.*`
  signals) to the UI.
  - **Android / iOS:** `AdMobProvider` (`admob.ts`) using
    [`@capacitor-community/admob`](https://github.com/capacitor-community/admob).
  - **Browser (dev):** `MockAdProvider` (`mock.ts`) shows in-world pretend adverts from the
    tavern's neighbours so every flow can be tested on a laptop.
  - **Browser (production):** no ads; all rewarded offers are hidden and the game is fully
    playable with coins.
- Start-up order follows Google's guidance: **consent first** (UMP), then initialise the Mobile
  Ads SDK only if `canRequestAds`, then (iOS) the App Tracking Transparency prompt, then preload a
  rewarded ad and an interstitial. Failed loads retry with backoff (15 s → 5 min).
- The plugin's `showRewardVideoAd()` promise never settles if the player closes early, so the
  provider listens for the `Rewarded`, `Dismissed` and `FailedToShow` events instead.
- The adaptive banner reports its height, which is written to the `--banner-h` CSS variable so
  menu screens leave room for it.

## Ad unit ids

`src/config/ads.ts` reads ad unit ids from Vite env variables (copy `.env.example` to
`.env.local`). Without them, Google's public **test** units are used, which is what you want during
development. Live ads are only requested when `VITE_ADMOB_PRODUCTION=true`.

The AdMob **app** ids live in the native projects (they can't come from JavaScript):

- Android: `android/app/src/main/res/values/strings.xml` → `admob_app_id`
- iOS: `ios/App/App/Info.plist` → `GADApplicationIdentifier`

Both currently hold Google's sample app ids. See [RELEASE.md](RELEASE.md) for the switch-over.

## Privacy and policy checklist

- **GDPR / UK / Switzerland:** create a GDPR message in AdMob → Privacy & messaging. The game
  shows it on first launch and offers **Settings → Privacy choices** whenever UMP says a privacy
  entry point is required.
- **US state privacy laws:** add a US states message in the same place; UMP handles it.
- **iOS App Tracking Transparency:** `NSUserTrackingUsageDescription` is set. Consider enabling an
  IDFA explainer message in AdMob so the explanation appears before Apple's prompt.
- **Audience:** the game is designed for a general audience and requests ads rated
  `ParentalGuidance` or milder (`maxAdContentRating`). It is **not** configured as child-directed.
  If you market it to children, set `tagForChildDirectedTreatment`, use `General` content only,
  and follow Google Play's Families policy and Apple's Kids Category rules.
- **Store disclosures:** declare "contains ads" on Google Play; fill in Play's Data safety form and
  App Store privacy "nutrition labels" for the Google Mobile Ads SDK (device identifiers,
  advertising data, diagnostics). Google publishes the exact answers for the SDK.
- **app-ads.txt:** publish it on the developer website listed in both stores.
- Never click your own live ads. Register your phones as test devices (`VITE_ADMOB_TEST_DEVICES`).

## Metrics worth watching

- Rewarded opt-in rate per placement (tells you which offers players value).
- Interstitial impressions per daily active user, and day-1 / day-7 retention before and after any
  pacing change.
- Nights per session and session length.
- eCPM by format and country (AdMob reports).

Tune by changing `AD_RULES` or the reward sizes; keep the grace period and the "never mid-order"
rule.

## Next steps for revenue

- **Remove ads** in-app purchase (the save flag and ad service support it already; add a store
  plugin such as RevenueCat or `cordova-plugin-purchase`).
- **Mediation** in AdMob to raise fill and eCPM.
- **Rewarded interstitial** for a "bonus ingredient" offer at the start of a night.
