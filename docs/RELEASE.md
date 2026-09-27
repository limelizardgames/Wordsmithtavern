# Building and releasing

The game is a Vite + Preact web app wrapped by Capacitor 8 into native projects:

- `android/`: Gradle project (min SDK 24, target SDK 36)
- `ios/`: Xcode project using Swift Package Manager (iOS 15+, iPhone and iPad)

Both are committed. Web assets are copied into them by `npx cap sync` and are git-ignored there.

## Prerequisites

- Node 22+
- **Android:** Android Studio (with SDK platform 36), JDK 21
- **iOS:** a Mac with Xcode 16 or newer, and an Apple Developer account for devices and release

## Everyday development

```bash
npm install
npm run dev                # browser, hot reload, pretend ads
npm run cap:sync           # build the web app and copy it into android/ and ios/
npx cap run android        # build and launch on a connected device or emulator
npx cap open ios           # open Xcode, pick a team under Signing & Capabilities, press Run
```

Test ads work on devices out of the box: the projects use Google's sample AdMob app ids and the
JavaScript side requests test ad units until you configure your own.

Phones are locked to portrait (iOS through `Info.plist`, Android at runtime); tablets can rotate
and get the side-by-side landscape layout.

## 1. Set your app identity

The app id is `com.limelizardgames.wordsmithtavern` and the display name is "Wordsmith Tavern".
To change them, update `capacitor.config.ts`, `android/app/build.gradle` (`applicationId`,
`namespace`), `android/app/src/main/res/values/strings.xml`, the Java package folder, and the
iOS bundle identifier in Xcode.

Version numbers live in `package.json`, `src/config/version.ts`, `android/app/build.gradle`
(`versionName`, bump `versionCode` every upload) and the Xcode target (`MARKETING_VERSION`, bump
the build number every upload).

## 2. AdMob

1. Create an AdMob account and add **two apps** (Android and iOS). Note each **app id**
   (`ca-app-pub-…~…`).
2. In each app create three ad units: **Banner** (adaptive), **Interstitial**, **Rewarded**.
3. Put the app ids in the native projects:
   - `android/app/src/main/res/values/strings.xml` → `admob_app_id`
   - `ios/App/App/Info.plist` → `GADApplicationIdentifier`
4. Put the ad unit ids in `.env.local` (copy `.env.example`), then set
   `VITE_ADMOB_PRODUCTION=true` for release builds only.
5. iOS: add Google's full list of third-party `SKAdNetworkItems` to `Info.plist`
   (https://developers.google.com/admob/ios/3p-skadnetworks).
6. **Privacy & messaging** in AdMob: publish a GDPR message, a US states message and (optionally)
   an IDFA explainer. The game shows them automatically through Google's UMP SDK.
7. Publish `app-ads.txt` at the root of the developer website you list in the stores.
8. While testing on your own phones, add their ids (printed in Logcat or the Xcode console) to
   `VITE_ADMOB_TEST_DEVICES`. Never click live ads on your own devices. To see the European
   consent message from elsewhere, also set `VITE_ADMOB_DEBUG_GEOGRAPHY=EEA` (test devices only;
   ignored in production builds).

Details and the ad pacing rules are in [MONETIZATION.md](MONETIZATION.md).

## 3. Icons and splash screens

Generated from the game's own art:

```bash
npm run dev                          # in one terminal
node scripts/render-app-art.mjs      # writes assets/icon-*.png and assets/splash.png
npx @capacitor/assets generate --ios --android \
  --iconBackgroundColor '#2b1a10' --splashBackgroundColor '#1d120b'
```

## 4. Android release

1. `npm run cap:sync`, then open `android/` in Android Studio.
2. Build → Generate Signed App Bundle (create an upload key and keep it safe; enable Play App
   Signing).
3. Google Play Console:
   - Content rating questionnaire (answer "yes" to ads; no violence beyond cartoon slapstick).
   - Target audience: 13+ is the simplest choice for an ad-supported game. Choosing under-13 brings
     in the Families policy (see MONETIZATION.md).
   - "Contains ads": yes.
   - Data safety: declare what the Google Mobile Ads SDK collects (Google's published guidance
     lists it). The game itself sends nothing to any server; saves stay on the device.
4. Start with an internal test track and install from the Play Store to check live ads and consent
   in a European test region.

## 5. iOS release

1. `npm run cap:sync`, then `npx cap open ios`.
2. Set the team, bundle id and version in the App target. Archive with Product → Archive and
   upload via the Organizer.
3. App Store Connect:
   - Privacy "nutrition labels" for the Google Mobile Ads SDK (identifiers, usage data,
     diagnostics; used for third-party advertising).
   - Age rating: the game has cartoon fantasy content and ads.
   - `ITSAppUsesNonExemptEncryption` is already `false`, so no export questions per build.
4. TestFlight first: check the ATT prompt, the consent form, rewarded ads and the banner position
   on a notched iPhone and an iPad in both orientations.

## Pre-launch checklist

- [ ] `npm run typecheck && npm test && npm run test:e2e` pass
- [ ] Real AdMob app ids in both native projects; real unit ids in `.env.local`;
      `VITE_ADMOB_PRODUCTION=true` only for the release build
- [ ] Consent form appears in the EEA (`VITE_ADMOB_DEBUG_GEOGRAPHY=EEA` on a test device) and
      Settings → Privacy choices reopens it
- [ ] Rewarded ads grant rewards only when completed; interstitials never appear mid-order or in
      the first three nights
- [ ] Banner never covers the hub buttons (check a small phone and an iPad)
- [ ] Back button (Android) closes popups and returns from menus
- [ ] App survives being backgrounded mid-order and resumes the night after a restart
- [ ] Versions bumped everywhere; icons and splash regenerated if the art changed
- [ ] Privacy policy URL, support URL and app-ads.txt are live
