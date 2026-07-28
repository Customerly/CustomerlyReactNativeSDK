<a href="https://customerly.io" target="_blank">
    <img src="https://avatars1.githubusercontent.com/u/23583405?s=200&v=4" height="100" alt="Customerly logo">
</a>

# Customerly React Native SDK

[![npm version](https://img.shields.io/npm/v/react-native-customerly-sdk.svg)](https://www.npmjs.com/package/react-native-customerly-sdk)
![GitHub License](https://img.shields.io/github/license/Customerly/CustomerlyReactNativeSDK)

Customerly is a customer service platform that helps businesses provide better support to their customers. The React Native SDK allows you to integrate Customerly's features directly into your React Native application, including:

- Live chat support
- Help center articles
- User profiling
- Event tracking
- Lead generation
- Surveys
- Real-time video calls

## Installation

Add the SDK to your project:

```bash
yarn add react-native-customerly-sdk
```

### Dependencies

This library needs these dependencies to be installed in your project before you can use it:

```bash
yarn add react-native-webview react-native-safe-area-context react-native-device-info
```

Using Expo?

```bash
npx expo install react-native-webview react-native-safe-area-context react-native-device-info
```

Want the SDK to show a notification when a message arrives? That needs one extra package — see [Notifications](#notifications). It is entirely optional; everything else works without it.

Finally, if you use Expo, rebuild the native code:

```bash
npx expo prebuild --clean
```

This helps avoid build issues, especially after adding or updating native dependencies.

## Basic Usage

Wrap your app with `CustomerlyProvider` (it must be wrapped in a `SafeAreaProvider`) and use the `Customerly` API:

```tsx
import React from "react";
import { CustomerlyProvider, Customerly } from "react-native-customerly-sdk";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function App() {
  return (
    <SafeAreaProvider>
      <CustomerlyProvider appId="YOUR_APP_ID">{/* Your app content */}</CustomerlyProvider>
    </SafeAreaProvider>
  );
}
```

You can then use the `Customerly` API anywhere in your app:

```tsx
import { Customerly } from "react-native-customerly-sdk";

Customerly.show();

Customerly.update({
  appId: "YOUR_APP_ID",
  userId: "123",
  email: "user@example.com",
  name: "John Doe",
});
```

## Notifications

The SDK can post a local notification whenever a message arrives while the messenger is closed, and open the right conversation when the user taps it.

**The SDK does not depend on a notification library.** It has no notification package in its dependencies and imports none at runtime. Instead, you install the one that fits your app and hand it to `CustomerlyProvider`. This is deliberate: Notifee — the package the SDK used to depend on — [was archived in April 2026](https://github.com/invertase/notifee), and its maintained successor does not support the legacy React Native architecture. Rather than force either choice on you, the SDK works with both, and with neither.

### Step 1 — Choose and install a package

| Your app                                         | Install                            |
| ------------------------------------------------ | ---------------------------------- |
| **New Architecture** (`newArchEnabled=true`)     | `yarn add react-native-notify-kit` |
| **Legacy Architecture** (`newArchEnabled=false`) | `yarn add @notifee/react-native`   |
| Already handles push notifications itself        | nothing — skip this whole section  |

Not sure which architecture you are on? React Native enables the New Architecture by default from 0.76, and 0.82 removed the legacy one entirely. If you have never set `newArchEnabled` and you are on 0.76+, you are on the New Architecture.

**[`react-native-notify-kit`](https://github.com/marcocrupi/react-native-notify-kit)** is the maintained fork of Notifee, [recommended by Invertase](https://github.com/invertase/notifee) when they archived the original. It is **New Architecture only** — it is built as a TurboModule with no legacy bridge support, so it will not work with `newArchEnabled=false`.

**[`@notifee/react-native`](https://github.com/invertase/notifee)** is archived and no longer receives fixes, but it still works and remains the only option on the legacy architecture. Move to `react-native-notify-kit` when you migrate to the New Architecture.

Both expose an identical API, so the SDK drives either one without any change on your side.

### Step 2 — Configure the native side

**Expo** — add the config plugin to your `app.json` and rebuild:

```json
{
  "expo": {
    "plugins": ["react-native-notify-kit"]
  }
}
```

```bash
npx expo prebuild --clean
```

> Notifications need native code, so they do not work in Expo Go. Use a [development build](https://docs.expo.dev/develop/development-builds/introduction/).

**Bare React Native** — autolinking handles Android. On iOS, install the pods:

```bash
cd ios && pod install
```

If you are on `@notifee/react-native` with Expo, you also need its Maven workaround, which `react-native-notify-kit` no longer requires:

```json
{
  "expo": {
    "plugins": [
      [
        "expo-build-properties",
        { "android": { "extraMavenRepos": ["../../node_modules/@notifee/react-native/android/libs"] } }
      ]
    ]
  }
}
```

### Step 3 — Pass the module to the provider

Import the package's default export and pass it as `notificationsModule`:

```tsx
import React from "react";
import { Customerly, CustomerlyProvider } from "react-native-customerly-sdk";
import notifee from "react-native-notify-kit"; // or "@notifee/react-native" on the legacy architecture
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function App() {
  return (
    <SafeAreaProvider>
      <CustomerlyProvider appId="YOUR_APP_ID" notificationsModule={notifee}>
        {/* Your app content */}
      </CustomerlyProvider>
    </SafeAreaProvider>
  );
}
```

That is the only wiring required. Tapping a notification opens the conversation it belongs to.

Pass a **stable reference** here — a module import, as above, or a module-level constant. Do not build the object inline in JSX: the SDK keys its notification effects on this value, so a fresh identity on every render re-subscribes the foreground listener and re-reads the initial notification.

**If you omit `notificationsModule`, the SDK never posts a notification** and every notification-related method resolves without doing anything. Nothing else changes and nothing throws — so leave it out if your app already handles push on its own. The first time a message arrives with no module wired up, the SDK logs a one-off `console.warn` in development builds (never in release) so an accidentally missing prop does not go unnoticed.

### Step 4 — Ask for permission

Request the OS permission at a moment that makes sense in your app:

```tsx
Customerly.requestNotificationPermissionIfNeeded();
```

Like every other `Customerly` method, this requires a mounted `CustomerlyProvider`, so call it from inside the provider's subtree — a `useEffect` in a component rendered as a child of `CustomerlyProvider` is the usual place. Called with no provider mounted it returns a **rejected** promise, so you can `.catch()` it. It resolves without doing anything if you did not pass a `notificationsModule`.

### Customizing notifications

Pass `getNotificationSetup` in your settings to decide, per message, whether to show a notification and what it should say. Return `{ shouldShow: false }` to suppress it:

```tsx
Customerly.update({
  appId: "YOUR_APP_ID",
  getNotificationSetup: (message) => {
    if (userIsInsideOwnChatScreen) {
      return { shouldShow: false };
    }

    return {
      shouldShow: true,
      title: message.accountName,
      body: message.message,
      // Android only, overrides the provider-level channel for this message
      notificationChannelId: "customerly-urgent",
      notificationChannelName: "Urgent support replies",
    };
  },
});
```

When `title` is omitted the SDK uses the message text with its HTML stripped. The Android channel used for every other notification is set with the `notificationChannelId` / `notificationChannelName` props on `CustomerlyProvider`.

### Using a different notification library

`notificationsModule` is typed as `NotificationsModule`, a five-method structural contract rather than a reference to any specific package. Anything matching it works, so you can adapt whatever your app already uses:

```tsx
import type { NotificationsModule } from "react-native-customerly-sdk";

const myNotifications: NotificationsModule = {
  requestPermission: async () => ({ authorizationStatus: 1 }), // 1 = authorized
  createChannel: async ({ id }) => id,
  displayNotification: async (notification) => {
    /* show it with your library */ return "id";
  },
  onForegroundEvent: (observer) => {
    /* call observer({ type: 1, detail: { notification } }) on tap */ return () => {};
  },
  getInitialNotification: async () => null,
};
```

The numeric values mirror the notifee enums the contract was modelled on: `authorizationStatus: 1` means authorized, and event `type: 1` (press) or `2` (action press) is what routes a tap back into the messenger. The `data` you attach in `displayNotification` must be handed back unchanged on tap — that is how the SDK knows which conversation to open.

## Migrating from v1.x

v2 removes the hard dependency on `@notifee/react-native`. If you were using notifications, there are two changes to make:

**1. Pass your notification module to the provider.** Previously the SDK imported Notifee itself; now you pass it in:

```diff
+import notifee from "react-native-notify-kit";
+
-<CustomerlyProvider appId="YOUR_APP_ID">
+<CustomerlyProvider appId="YOUR_APP_ID" notificationsModule={notifee}>
```

To keep using Notifee, change nothing but the provider prop — `import notifee from "@notifee/react-native"` and pass that instead. To move to the maintained fork, follow [Step 1](#step-1--choose-and-install-a-package); it is a package swap and an import rename, since the two APIs are identical.

If you do not pass the prop, the SDK stops posting notifications — it will not throw, so this is easy to miss. Development builds log a one-off `console.warn` the first time a message arrives without a module, which is your cue that the prop is missing. Nothing else in the API changed.

**2. `requestNotificationPermissionIfNeeded` now requires a mounted provider.** It used to call Notifee directly and worked anywhere; it now goes through the provider like every other method and rejects with `"CustomerlyProvider is not mounted."` if called outside it. Move the call inside the provider's subtree if it was above it.

**Also in this release:** the async methods (`requestNotificationPermissionIfNeeded`, `getUnreadMessagesCount`, `getUnreadConversationsCount`) now **reject** when no provider is mounted instead of throwing synchronously. If you were wrapping the two count methods in `try/catch` to handle that, `.catch()` now works as the `Promise<number>` signature suggests — and a bare `try/catch` around the call alone no longer catches it.

You can also now drop `@notifee/react-native` entirely if your app handles push itself — the SDK no longer lists any notification package as a peer dependency.

## API Reference

### Props

| Prop                      | Type                  | Required | Description                                                                                                                                         | Default                                                          |
| ------------------------- | --------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| `appId`                   | `string`              | Yes      | The Customerly app ID                                                                                                                               |                                                                  |
| `colorScheme`             | `"light" \| "dark"`   | No       | Your app's current color scheme                                                                                                                     | System color scheme                                              |
| `notificationsModule`     | `NotificationsModule` | No       | Default export of `react-native-notify-kit` or `@notifee/react-native`. Omit to disable notifications entirely. See [Notifications](#notifications) | -                                                                |
| `notificationChannelId`   | `string`              | No       | The ID of the notification channel to use for notifications (Android only, requires `notificationsModule`)                                          | customerly-notification-channel                                  |
| `notificationChannelName` | `string`              | No       | The name of the notification channel to use for notifications (Android only, requires `notificationsModule`)                                        | Customerly Notification Channel                                  |
| `userId`                  | `string`              | No       | The user ID                                                                                                                                         | -                                                                |
| `name`                    | `string`              | No       | The user name                                                                                                                                       | -                                                                |
| `email`                   | `string`              | No       | The user email                                                                                                                                      | -                                                                |
| `accentColor`             | `string`              | No       | The accent color                                                                                                                                    | The messenger accent color configured in your project settings   |
| `contrastColor`           | `string`              | No       | The contrast color                                                                                                                                  | The messenger contrast color configured in your project settings |
| `attachmentsAvailable`    | `boolean`             | No       | Whether attachments are available                                                                                                                   | `true`                                                           |

### Initialization and Configuration

#### update

Updates the Customerly SDK settings in place, without restarting the messenger session (the current conversation and state are preserved).

```tsx
Customerly.update({ appId: "YOUR_APP_ID" });
```

> **Note:** `update` no longer reloads the messenger. If you need a fresh session (the previous behavior), call [`reset`](#reset) — on its own, or after `update` to apply new settings and then restart.

#### reset

Restarts the messenger by reloading it from scratch, creating a fresh session. The messenger is re-initialized with the current settings, so the user stays logged in. Use this if you need the messenger to fully re-initialize (this is what `update` used to do implicitly).

```tsx
Customerly.reset();

// Apply new settings and restart the session:
Customerly.update({ appId: "YOUR_APP_ID", userId: "123" });
Customerly.reset();
```

#### requestNotificationPermissionIfNeeded

Requests notification permissions if not already granted, through the `notificationsModule` passed to `CustomerlyProvider`. No-op when no module was passed. See [Notifications](#notifications) for the full setup.

```tsx
Customerly.requestNotificationPermissionIfNeeded();
```

### Messenger Control

#### show

Shows the Customerly chat interface.

```tsx
Customerly.show(withoutNavigation?: boolean);
```

#### hide

Hides the Customerly chat interface.

```tsx
Customerly.hide();
```

#### back

Navigates back in the chat interface.

```tsx
Customerly.back();
```

### User Management

#### logout

Logs out the current user.

```tsx
Customerly.logout();
```

#### registerLead

Registers a new lead with the provided email and optional attributes.

```tsx
Customerly.registerLead("user@example.com", { name: "John Doe" });
```

### Messaging

#### showNewMessage

Shows the chat interface with a pre-filled message.

```tsx
Customerly.showNewMessage("Hello, how can I help you?");
```

#### sendNewMessage

Sends a new message and shows the chat interface.

```tsx
Customerly.sendNewMessage("Hello, how can I help you?");
```

#### showBookMeeting

Opens the "book a meeting" calendar flow in the messenger.

```tsx
Customerly.showBookMeeting();
```

#### navigateToConversation

Navigates to a specific conversation.

```tsx
Customerly.navigateToConversation(123);
```

### Help Center

#### showArticle

Shows an article from the help center, either by collection + article slug or by numeric article id.

```tsx
Customerly.showArticle("collection", "article");
Customerly.showArticle(123); // by article id
```

### Analytics

#### event

Tracks a custom event.

```tsx
Customerly.event("event_name");
```

#### attribute

Sets a custom attribute for the current user.

```tsx
Customerly.attribute("attribute_name", "attribute_value");
```

### Message Counts

#### getUnreadMessagesCount

Gets the count of unread messages.

```tsx
await Customerly.getUnreadMessagesCount();
```

#### getUnreadConversationsCount

Gets the count of unread conversations.

```tsx
await Customerly.getUnreadConversationsCount();
```

### Callbacks

The SDK provides various callbacks for different events. Here are the main callback setters:

```tsx
Customerly.setOnChatClosed(() => {});
Customerly.setOnChatOpened(() => {});
Customerly.setOnHelpCenterArticleOpened((article) => {});
Customerly.setOnLeadGenerated((email) => {});
Customerly.setOnMessageRead((conversationId, conversationMessageId) => {});
Customerly.setOnMessengerInitialized(() => {});
Customerly.setOnNewConversation((message, attachments) => {});
Customerly.setOnNewMessageReceived((message) => {});
Customerly.setOnNewConversationReceived((conversationId) => {});
Customerly.setOnProfilingQuestionAnswered((attribute, value) => {});
Customerly.setOnProfilingQuestionAsked((attribute) => {});
Customerly.setOnRealtimeVideoAnswered((realtimeCall) => {});
Customerly.setOnRealtimeVideoCanceled(() => {});
Customerly.setOnRealtimeVideoReceived((realtimeCall) => {});
Customerly.setOnRealtimeVideoRejected(() => {});
Customerly.setOnSurveyAnswered(() => {});
Customerly.setOnSurveyPresented((survey) => {});
Customerly.setOnSurveyRejected(() => {});
```

All public types (`CustomerlySettings`, `Message`, `Survey`, `RealtimeCall`, `HelpCenterArticle`, `AttachmentPayload`, `NotificationSetup`, `NotificationsModule`, callback payload types, etc.) are exported from the package root for typing your handlers:

```tsx
import type { CustomerlySettings, Survey } from "react-native-customerly-sdk";
```

Each callback has a corresponding remove method:

```tsx
Customerly.removeOnChatClosed();
Customerly.removeOnChatOpened();
// ... and so on for all callbacks
```

You can also remove all callbacks at once:

```tsx
Customerly.removeAllCallbacks();
```

## Example

The repository includes a sample project (`example`) that demonstrates how to integrate and use the Customerly SDK in a Expo application. The example shows:

- Basic SDK initialization
- Messenger presentation
- User management
- Event tracking
- Message handling
- Notification handling (wired up with `react-native-notify-kit`)
- Callback usage

To run the example:

1. Run `yarn install` to install the dependencies
2. Run `yarn example:ios` to start the iOS simulator
3. Run `yarn example:android` to start the Android emulator

The sample app provides a complete reference implementation of all SDK features and can be used as a starting point for your integration.

## Development

To release a new version of the SDK, you need to:

1. Go to GitHub Actions and run the `Release` workflow
2. The workflow will build the SDK and release it to npm

## License

This SDK is licensed under the GNU GPLv3 License. See the LICENSE file for more details.
