import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { BackHandler, StyleSheet, useColorScheme } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView, WebViewMessageEvent } from "react-native-webview";
import { useNotifications } from "./hooks/useNotifications";
import { CustomerlySettings } from "./typings/customerly-settings";
import { SdkMethods } from "./typings/sdk-methods";
import { safelyParseNumber } from "./utils/number";
import { createHTML } from "./utils/webview";

export type MessengerProps = CustomerlySettings & {
  colorScheme?: "light" | "dark";
};

const Messenger = forwardRef<SdkMethods, MessengerProps>(({ colorScheme: colorSchemeProps, ...settingsProps }, ref) => {
  const defaultColorScheme = useColorScheme();
  const { sendNotificationForNewMessage: _sendNotificationForNewMessage } = useNotifications();

  const webviewRef = useRef<WebView>(null);

  const [settings, setSettings] = useState(settingsProps);
  const [visible, setVisible] = useState(false);
  const [pendingInvocations, setPendingInvocations] = useState<
    Record<string, { resolve: (value: unknown) => void; reject: (error: Error) => void }>
  >({});

  const colorScheme = colorSchemeProps ?? defaultColorScheme;

  const handleMessage = useCallback(
    async (event: WebViewMessageEvent) => {
      try {
        const message = JSON.parse(event.nativeEvent.data);
        console.log("[Customerly] WebView message:", message);

        switch (message.type) {
          case "jsInvocationResult":
            if (message.id in pendingInvocations) {
              const { resolve, reject } = pendingInvocations[message.id];

              if (message.error) {
                reject(new Error(message.error));
              } else {
                resolve(message.result);
              }

              setPendingInvocations((prev) => {
                const next = { ...prev };
                delete next[message.id];
                return next;
              });
              return;
            }
            break;
        }
      } catch (_error) {
        // Ignore messages that aren't JSON
      }
    },
    [pendingInvocations],
  );

  const evaluateJavaScript = useCallback((script: string) => {
    if (!webviewRef.current) {
      throw new Error("WebView is not initialized");
    }

    webviewRef.current?.injectJavaScript(script);
  }, []);

  const evaluateJavaScriptAsync = useCallback((script: string) => {
    return new Promise((resolve, reject) => {
      if (!webviewRef.current) {
        reject(new Error("WebView is not initialized"));
        return;
      }

      const invocationId = Math.random().toString(36).substring(7);

      setPendingInvocations((prev) => ({
        ...prev,
        [invocationId]: { resolve, reject },
      }));

      const wrappedScript = `
        (async () => {
          try {
            const result = await (${script});
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'jsInvocationResult',
              id: '${invocationId}',
              result
            }));
          } catch (error) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'jsInvocationResult',
              id: '${invocationId}',
              error: error.message
            }));
          }
        })();
      `;

      webviewRef.current.injectJavaScript(wrappedScript);
    });
  }, []);

  useImperativeHandle(
    ref,
    () =>
      ({
        update: (settings: CustomerlySettings) => setSettings(settings),
        show: () => setVisible(true),
        hide: () => setVisible(false),
        back: () => evaluateJavaScript("_customerly_sdk.back()"),
        logout: () => evaluateJavaScript("customerly.logout()"),
        registerLead: (email: string, attributes?: Record<string, unknown>) =>
          evaluateJavaScript(`customerly.registerLead('${email}', ${JSON.stringify(attributes)})`),
        showNewMessage: (message: string) => evaluateJavaScript(`customerly.showNewMessage('${message}')`),
        sendNewMessage: (message: string) => evaluateJavaScript(`customerly.sendNewMessage('${message}')`),
        navigateToConversation: (conversationId: number) =>
          evaluateJavaScript(`_customerly_sdk.navigateToConversation(${conversationId})`),
        showArticle: (collectionSlug: string, articleSlug: string) =>
          evaluateJavaScript(`customerly.showArticle('${collectionSlug}', '${articleSlug}')`),
        event: (name: string) => evaluateJavaScript(`customerly.event('${name}')`),
        attribute: (name: string, value: unknown) =>
          evaluateJavaScript(`customerly.attribute('${name}', ${JSON.stringify(value)})`),
        getUnreadConversationsCount: async () =>
          safelyParseNumber(await evaluateJavaScriptAsync("customerly.unreadConversationsCount")),
        getUnreadMessagesCount: async () =>
          safelyParseNumber(await evaluateJavaScriptAsync("customerly.unreadMessagesCount")),
      }) as SdkMethods,
    [evaluateJavaScript, evaluateJavaScriptAsync],
  );

  useEffect(() => {
    const backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
      if (visible) {
        setVisible(false);
        return true;
      }

      return false;
    });

    return () => backHandler.remove();
  }, [visible]);

  return (
    <SafeAreaView
      style={[
        StyleSheet.absoluteFill,
        visible ? styles.visible : styles.hidden,
        { backgroundColor: colorScheme === "dark" ? "#000000" : "#FFFFFF" },
      ]}
    >
      <WebView
        javaScriptEnabled
        incognito={false}
        originWhitelist={["*"]}
        onMessage={handleMessage}
        ref={webviewRef}
        sharedCookiesEnabled={true}
        source={{ uri: "https://customerly.io/", baseUrl: "https://customerly.io/", html: createHTML(settings) }}
        thirdPartyCookiesEnabled={true}
      />
    </SafeAreaView>
  );
});

Messenger.displayName = "Messenger";

const styles = StyleSheet.create({
  visible: {
    opacity: 1,
    pointerEvents: "auto",
  },
  hidden: {
    opacity: 0,
    pointerEvents: "none",
  },
});

export default Messenger;
