# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

`react-native-customerly-sdk` — the React Native SDK for Customerly (live chat, help center, surveys, lead gen, realtime video). It is published to npm and consumed by host apps. This repo is one of several Customerly SDKs; the Android and iOS SDKs are sibling repos.

The SDK does **not** reimplement the messenger natively. It embeds the web messenger (`https://messenger.customerly.io/launcher.js`) inside a `react-native-webview` and bridges the JS `customerly.*` API to a React Native imperative API. Understanding this bridge is the key to the whole codebase.

## Commands

- `yarn build` — compile `src/` to `lib/` via `react-native-builder-bob` (ESM module + CommonJS + TypeScript declarations). `yarn build:clean` wipes `lib/` first.
- `yarn check-ts` — typecheck only (`tsc --noEmit`).
- `yarn lint` (`eslint src`) / `yarn lint:fix` — lint (flat config in `eslint.config.mjs`).
- `yarn test` — Jest unit tests for the pure utils in `src/utils/__tests__/` (ts-jest, no RN renderer). This is the only automated test layer; UI/bridge behavior is still verified manually via the example app.
- `yarn example:ios` / `yarn example:android` — run the example Expo app (in `example/`), the primary way to manually verify bridge changes.
- Node version is pinned to `22.14.0` (`.nvmrc`). Package manager is **yarn 4 (Berry)** (pinned via `packageManager` in `package.json`; run `corepack enable` so the pin is honored). It is configured with `nodeLinker: node-modules` in `.yarnrc.yml`, so dependencies install into a local `node_modules/` (no PnP). The example app (`example/`) is a separate project on the same **yarn 4** setup (its own `packageManager` pin + `.yarnrc.yml` with `nodeLinker: node-modules`); the root `example:*` scripts `cd example && yarn …` so they run under the example's own yarn. CI (`.github/workflows/ci.yml`) runs check-ts + lint + test + build on every PR (installing with `yarn install --immutable`).
- Do not release manually. Releases run via the GitHub Actions `Release` workflow, which invokes `release-it` (bumps version, builds, regenerates `CHANGELOG.md` with `auto-changelog`, publishes to npm, tags on `master`).

## Architecture

The data flow is a three-layer bridge. When changing SDK behavior, you usually touch more than one layer:

1. **`src/Customerly.tsx`** — the public singleton API consumers import. Every method is wrapped in `guardInstance`, which throws "CustomerlyProvider is not mounted." if `messengerRef.current` is null, then forwards to the mounted `Messenger` via `messengerRef` (a module-level `createRef`). Every method, including `requestNotificationPermissionIfNeeded`, goes through the ref. The three `Promise`-returning methods (`requestNotificationPermissionIfNeeded`, `getUnreadMessagesCount`, `getUnreadConversationsCount`) use `guardInstanceAsync` instead, which puts the same guard inside an `async` function so an unmounted provider **rejects** rather than throwing synchronously — a method typed `Promise<T>` must be `.catch()`-able. Use `guardInstanceAsync` for any new async method.

2. **`src/CustomerlyProvider.tsx`** — thin wrapper the consumer mounts. Renders `children` plus a `<Messenger>` (keyed by `appId`) wired to `messengerRef`. Must itself be wrapped in a `SafeAreaProvider` by the host app. `CustomerlyProviderProps` adds only `children`; every other prop (and its JSDoc, which is what host apps see on hover) is declared once on `MessengerProps` in `src/Messenger.tsx` and inherited, so the two cannot drift.

3. **`src/Messenger.tsx`** — the engine. A `forwardRef` component exposing all SDK methods through `useImperativeHandle`. It renders the WebView and translates method calls into JS injected into the page.

### The WebView bridge (both directions)

- **RN → Web:** `evaluateJavaScript` injects strings via `webViewRef.injectJavaScript`. Build the injected call with `buildJsCall(fn, ...args)` from `src/utils/js.ts`, which JSON-encodes every argument so strings containing quotes/backslashes/newlines cannot break the call or inject JS (e.g. an apostrophe in `showNewMessage`). Do **not** hand-interpolate string args. `evaluateJavaScriptAsync` wraps the script in an async IIFE that posts the result back with a random `invocationId`, returns a Promise resolved when the matching `jsInvocationResult` arrives, and rejects on a 10s timeout or when the WebView is torn down (this is how `getUnreadMessagesCount`/`getUnreadConversationsCount` work).
- **Web → RN:** `src/utils/webview.ts` builds the HTML page. It embeds the Customerly launcher snippet and registers every `customerly.on*` callback so each one does `window.ReactNativeWebView.postMessage(JSON.stringify({type, data}))`. `Messenger`'s `handleMessage` switch dispatches those messages to the registered RN callbacks (stored in a `callbacksRef`, not state, managed by `registerCallback`/`removeCallback`). Callback payload types live in `src/typings/` (one file per payload) and are the authoritative shapes the web messenger emits — `callbacks.ts` imports them, it does not redefine them.
- Two distinct JS objects are used from RN: the public `customerly` global (open, event, attribute, showNewMessage…) and an internal `_customerly_sdk` (navigate, back, navigateToConversation). Don't assume a method exists on both.

### Settings translation

The web messenger deliberately splits naming: **user identity** is snake_case (`app_id`, `user_id`, `email_hash`, `last_page_viewed`, `force_lead`) while **appearance** stays camelCase (`accentColor`, `contrastColor`, `attachmentsAvailable`, `singleConversation`). `src/utils/settings.ts` `getInternalSettings` maps the identity fields and passes appearance through unchanged (do not snake_case them). It also transforms two nested shapes to match the wire format: `events[].date` from a `Date` to a **Unix timestamp in seconds**, and `company.additionalAttributes` **spread onto the top level** of the company object (the messenger reads extra company attributes from there, not from a nested key). `createHTML` additionally injects `sdkMode: true`, `disableAutofocus: true`, and a `device` object built from `react-native-device-info`. When adding a new setting, update `CustomerlySettings` + `InternalCustomerlySettings` in `src/typings/customerly-settings.ts` and the mapping in `settings.ts`. Live updates go through the imperative `update()`, which injects `customerly.update(...)` — it does **not** regenerate the HTML or reload the WebView (HTML is only (re)built on mount and on background-remount).

### Notifications

`src/hooks/useNotifications.ts` handles local notifications, but the SDK **imports no notification package**. The host app installs one and passes its default export to `CustomerlyProvider` as `notificationsModule`; `NotificationsModule` in `src/typings/notifications.ts` is the structural contract, satisfied by both `react-native-notify-kit` (the maintained Notifee fork, New Architecture only) and the archived `@notifee/react-native` (the only option on the legacy architecture). Injection rather than a static import is deliberate: Metro resolves `require()` statically, so a try/catch fallback between the two packages would be a build error for whichever one the host did not install. Both are devDependencies here purely so `src/__tests__/notifications-module.test.ts` can type-assert them against the contract — note `tsconfig.json` excludes `__tests__`, so that assertion is gated by `yarn test` (ts-jest), not `yarn check-ts`. Every entry point in the hook no-ops when no module was passed — `sendNotificationForNewMessage` additionally fires a one-off `__DEV__`-only `console.warn`, since "no module" is both a supported configuration and the exact symptom of forgetting the prop while upgrading. `notificationsModule` must be a referentially stable value (it is a dependency of both notification effects); that requirement is documented on the prop's JSDoc and in the README. The module's `AuthorizationStatus`/`EventType`/`AndroidImportance` enums are unavailable to injected code, so their values are mirrored as constants in `src/constants/notifications.ts`. On an incoming `onNewMessageReceived` bridge message, `Messenger` calls `sendNotificationForNewMessage`, which respects an optional per-message `getNotificationSetup` callback in settings (can suppress the notification or override title/body/channel). Notification taps route back into the SDK via `navigateToConversation` + `show(true)`. Android notification channel id/name are configurable props (defaults in `src/constants/notifications.ts`).

### Lifecycle details worth knowing

- The WebView is remounted (new `webViewKey`) if the app was backgrounded for more than `BACKGROUND_RELOAD_TIMEOUT` (4 min), forcing a fresh messenger session.
- Show/hide is a slide `Animated` transform, not conditional mounting — the WebView stays alive when hidden (`pointerEvents: none`, `opacity: 0`).
- Hardware back (Android) is intercepted while visible and mapped to `back()`.
- `onShouldStartLoadWithRequest` keeps `customerly.io` / `about:blank` navigations in the WebView and opens all other URLs in the system browser via `Linking`.

## Conventions

- The public API surface is defined by `SdkMethods` in `src/typings/sdk-methods.ts`. Adding a method means touching all layers: the type, `Messenger`'s `useImperativeHandle`, and the `Customerly` singleton (wrapped in `guardInstance`). Callbacks additionally need a `set*`/`remove*` pair, an entry in `CustomerlyCallbacks`, a registration in `webview.ts`, and a `handleMessage` case.
- Injected JS is built with string interpolation (e.g. `` `customerly.event('${name}')` ``). Be mindful that string arguments are not escaped — match existing patterns.
- Prettier + ESLint (flat config) enforce style, including import sorting/organizing. `lib/` and `node_modules/` are ignored.
- Peer dependencies (`react-native-webview`, `react-native-safe-area-context`, `react-native-device-info`) must be installed by the host app; they are devDependencies here, never bundled. Notification packages are deliberately **not** peer dependencies — see Notifications above.
