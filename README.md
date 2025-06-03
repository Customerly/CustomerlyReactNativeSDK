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
yarn add react-native-webview react-native-safe-area-context @notifee/react-native
```

Using Expo?

```bash
npx expo install react-native-webview react-native-safe-area-context @notifee/react-native
```

> **IMPORTANT**
> 
> I want to save you a lot of time here: it seems that the `@notifee/react-native` package is not building correctly with the latest versions of Expo (more info [here](https://github.com/invertase/notifee/issues/799) and [here](https://github.com/invertase/notifee/issues/350)). To ensure it builds correctly, add the following to your `app.json`:

```json
{
  "expo": {
    "plugins": [
      [
        "expo-build-properties",
        {
          "android": {
            "extraMavenRepos": ["../../node_modules/@notifee/react-native/android/libs"]
          }
        }
      ]
    ]
  }
}
```

## Basic Usage

Wrap your app with `CustomerlyProvider` (it must be wrapped in a `SafeAreaProvider`) and use the `Customerly` API:

```tsx
import React from "react";
import { CustomerlyProvider, Customerly } from "react-native-customerly-sdk";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function App() {
  return (
    <SafeAreaProvider>
      <CustomerlyProvider app_id="YOUR_APP_ID">
        {/* Your app content */}
      </CustomerlyProvider>
    </SafeAreaProvider>
  );
}
```

You can then use the `Customerly` API anywhere in your app:

```tsx
import { Customerly } from "react-native-customerly-sdk";

Customerly.show();

Customerly.update({
  app_id: "YOUR_APP_ID",
  user_id: "123",
  email: "user@example.com",
  name: "John Doe",
});
```

### Request Notification Permission

To enable notifications, call:

```tsx
Customerly.requestNotificationPermissionIfNeeded();
```

## API Reference

### Initialization and Configuration

#### update
Updates the Customerly SDK settings.

```tsx
Customerly.update({ app_id: "YOUR_APP_ID" });
```

#### requestNotificationPermissionIfNeeded
Requests notification permissions if not already granted (uses Notifee).

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

#### navigateToConversation
Navigates to a specific conversation.

```tsx
Customerly.navigateToConversation(123);
```

### Help Center

#### showArticle
Shows an article from the help center.

```tsx
Customerly.showArticle("collection", "article");
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
Customerly.setOnLeadGenerated((lead) => {});
Customerly.setOnMessengerInitialized(() => {});
Customerly.setOnNewConversation((conversationId, attachments) => {});
Customerly.setOnNewMessageReceived((accountId, message, timestamp, userId, conversationId) => {});
Customerly.setOnNewConversationReceived((conversationId) => {});
Customerly.setOnProfilingQuestionAnswered((question, answer) => {});
Customerly.setOnProfilingQuestionAsked((question) => {});
Customerly.setOnRealtimeVideoAnswered((realtimeCall) => {});
Customerly.setOnRealtimeVideoCanceled(() => {});
Customerly.setOnRealtimeVideoReceived((realtimeCall) => {});
Customerly.setOnRealtimeVideoRejected(() => {});
Customerly.setOnSurveyAnswered(() => {});
Customerly.setOnSurveyPresented((survey) => {});
Customerly.setOnSurveyRejected(() => {});
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
- Notification handling
- Callback usage

To run the example:
1. Run `yarn install` to install the dependencies
2. Run `yarn ios` to start the iOS simulator
3. Run `yarn android` to start the Android emulator

The sample app provides a complete reference implementation of all SDK features and can be used as a starting point for your integration.

## License

This SDK is licensed under the GNU GPLv3 License. See the LICENSE file for more details.
