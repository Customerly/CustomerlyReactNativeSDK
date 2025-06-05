import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { Animated, BackHandler, Dimensions, Easing, Linking, StyleSheet, useColorScheme } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView, WebViewMessageEvent, WebViewNavigation } from "react-native-webview";
import KeyboardAvoidingView from "./components/KeyboardAvoidingView";
import { useNotifications } from "./hooks/useNotifications";
import { CustomerlyCallbacks } from "./typings/callbacks";
import { CustomerlySettings, InternalCustomerlySettings } from "./typings/customerly-settings";
import { SdkMethods } from "./typings/sdk-methods";
import { safelyParseNumber } from "./utils/number";
import { getInternalSettings } from "./utils/settings";
import { createHTML } from "./utils/webview";

export type MessengerProps = CustomerlySettings & {
  colorScheme?: "light" | "dark";
  notificationChannelId?: string;
  notificationChannelName?: string;
};

const ANIMATION_DURATION = 350;
const screenHeight = Dimensions.get("window").height;

const Messenger = forwardRef<SdkMethods, MessengerProps>(
  ({ colorScheme: colorSchemeProps, notificationChannelId, notificationChannelName, ...settingsProps }, ref) => {
    const defaultColorScheme = useColorScheme();
    const { sendNotificationForNewMessage } = useNotifications({ notificationChannelId, notificationChannelName });

    const webViewRef = useRef<WebView>(null);
    const slideAnimationRef = useRef(new Animated.Value(0)).current;

    const [settings, setSettings] = useState<InternalCustomerlySettings>(getInternalSettings(settingsProps));
    const [visible, setVisible] = useState(false);
    const [callbacks, setCallbacks] = useState<CustomerlyCallbacks>({});
    const [pendingInvocations, setPendingInvocations] = useState<
      Record<string, { resolve: (value: unknown) => void; reject: (error: Error) => void }>
    >({});

    const colorScheme = colorSchemeProps ?? defaultColorScheme;
    const html = useMemo(() => createHTML(settings), [settings]);

    const evaluateJavaScript = useCallback((script: string) => {
      if (!webViewRef.current) {
        throw new Error("WebView is not initialized");
      }

      webViewRef.current?.injectJavaScript(script);
    }, []);

    const evaluateJavaScriptAsync = useCallback((script: string) => {
      return new Promise((resolve, reject) => {
        if (!webViewRef.current) {
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
        true;
      `;

        webViewRef.current.injectJavaScript(wrappedScript);
      });
    }, []);

    const show = useCallback(
      (withoutNavigation = false) => {
        evaluateJavaScript("customerly.open()");
        if (!withoutNavigation) {
          evaluateJavaScript("_customerly_sdk.navigate('/', true)");
        }

        setVisible(true);

        Animated.timing(slideAnimationRef, {
          toValue: 1,
          duration: ANIMATION_DURATION,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }).start();
      },
      [evaluateJavaScript, slideAnimationRef],
    );

    const hide = useCallback(() => {
      Animated.timing(slideAnimationRef, {
        toValue: 0,
        duration: ANIMATION_DURATION,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start(() => {
        setVisible(false);
      });
    }, [slideAnimationRef]);

    const back = useCallback(() => evaluateJavaScript("_customerly_sdk.back()"), [evaluateJavaScript]);

    const registerCallback = useCallback(
      <T extends keyof CustomerlyCallbacks>(name: T, callback: CustomerlyCallbacks[T]) => {
        setCallbacks((prev) => ({ ...prev, [name]: callback }));
      },
      [setCallbacks],
    );

    const removeCallback = useCallback((name: keyof CustomerlyCallbacks) => {
      setCallbacks((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }, []);

    const removeAllCallbacks = useCallback(() => {
      setCallbacks({});
    }, []);

    useImperativeHandle(
      ref,
      () =>
        ({
          update: (settings: CustomerlySettings) => setSettings(getInternalSettings(settings)),
          show,
          hide,
          back,
          logout: () => evaluateJavaScript("customerly.logout()"),
          registerLead: (email: string, attributes?: Record<string, unknown>) =>
            evaluateJavaScript(`customerly.registerLead('${email}', ${JSON.stringify(attributes)})`),
          showNewMessage: (message: string) => {
            show();
            evaluateJavaScript(`customerly.showNewMessage('${message}')`);
          },
          sendNewMessage: (message: string) => {
            show();
            evaluateJavaScript(`customerly.sendNewMessage('${message}')`);
          },
          navigateToConversation: (conversationId: number) =>
            evaluateJavaScript(`_customerly_sdk.navigateToConversation(${conversationId})`),
          showArticle: (collectionSlug: string, articleSlug: string) => {
            show();
            evaluateJavaScript(`customerly.showArticle('${collectionSlug}', '${articleSlug}')`);
          },
          event: (name: string) => evaluateJavaScript(`customerly.event('${name}')`),
          attribute: (name: string, value: unknown) =>
            evaluateJavaScript(`customerly.attribute('${name}', ${JSON.stringify(value)})`),
          getUnreadConversationsCount: async () =>
            safelyParseNumber(await evaluateJavaScriptAsync("customerly.unreadConversationsCount")),
          getUnreadMessagesCount: async () =>
            safelyParseNumber(await evaluateJavaScriptAsync("customerly.unreadMessagesCount")),
          setOnChatClosed: (callback: CustomerlyCallbacks["onChatClosed"]) =>
            registerCallback("onChatClosed", callback),
          setOnChatOpened: (callback: CustomerlyCallbacks["onChatOpened"]) =>
            registerCallback("onChatOpened", callback),
          setOnHelpCenterArticleOpened: (callback: CustomerlyCallbacks["onHelpCenterArticleOpened"]) =>
            registerCallback("onHelpCenterArticleOpened", callback),
          setOnLeadGenerated: (callback: CustomerlyCallbacks["onLeadGenerated"]) =>
            registerCallback("onLeadGenerated", callback),
          setOnMessengerInitialized: (callback: CustomerlyCallbacks["onMessengerInitialized"]) =>
            registerCallback("onMessengerInitialized", callback),
          setOnNewConversation: (callback: CustomerlyCallbacks["onNewConversation"]) =>
            registerCallback("onNewConversation", callback),
          setOnNewMessageReceived: (callback: CustomerlyCallbacks["onNewMessageReceived"]) =>
            registerCallback("onNewMessageReceived", callback),
          setOnNewConversationReceived: (callback: CustomerlyCallbacks["onNewConversationReceived"]) =>
            registerCallback("onNewConversationReceived", callback),
          setOnProfilingQuestionAnswered: (callback: CustomerlyCallbacks["onProfilingQuestionAnswered"]) =>
            registerCallback("onProfilingQuestionAnswered", callback),
          setOnProfilingQuestionAsked: (callback: CustomerlyCallbacks["onProfilingQuestionAsked"]) =>
            registerCallback("onProfilingQuestionAsked", callback),
          setOnRealtimeVideoAnswered: (callback: CustomerlyCallbacks["onRealtimeVideoAnswered"]) =>
            registerCallback("onRealtimeVideoAnswered", callback),
          setOnRealtimeVideoCanceled: (callback: CustomerlyCallbacks["onRealtimeVideoCanceled"]) =>
            registerCallback("onRealtimeVideoCanceled", callback),
          setOnRealtimeVideoReceived: (callback: CustomerlyCallbacks["onRealtimeVideoReceived"]) =>
            registerCallback("onRealtimeVideoReceived", callback),
          setOnRealtimeVideoRejected: (callback: CustomerlyCallbacks["onRealtimeVideoRejected"]) =>
            registerCallback("onRealtimeVideoRejected", callback),
          setOnSurveyAnswered: (callback: CustomerlyCallbacks["onSurveyAnswered"]) =>
            registerCallback("onSurveyAnswered", callback),
          setOnSurveyPresented: (callback: CustomerlyCallbacks["onSurveyPresented"]) =>
            registerCallback("onSurveyPresented", callback),
          setOnSurveyRejected: (callback: CustomerlyCallbacks["onSurveyRejected"]) =>
            registerCallback("onSurveyRejected", callback),
          removeOnChatClosed: () => removeCallback("onChatClosed"),
          removeOnChatOpened: () => removeCallback("onChatOpened"),
          removeOnHelpCenterArticleOpened: () => removeCallback("onHelpCenterArticleOpened"),
          removeOnLeadGenerated: () => removeCallback("onLeadGenerated"),
          removeOnMessengerInitialized: () => removeCallback("onMessengerInitialized"),
          removeOnNewConversation: () => removeCallback("onNewConversation"),
          removeOnNewMessageReceived: () => removeCallback("onNewMessageReceived"),
          removeOnNewConversationReceived: () => removeCallback("onNewConversationReceived"),
          removeOnProfilingQuestionAnswered: () => removeCallback("onProfilingQuestionAnswered"),
          removeOnProfilingQuestionAsked: () => removeCallback("onProfilingQuestionAsked"),
          removeOnRealtimeVideoAnswered: () => removeCallback("onRealtimeVideoAnswered"),
          removeOnRealtimeVideoCanceled: () => removeCallback("onRealtimeVideoCanceled"),
          removeOnRealtimeVideoReceived: () => removeCallback("onRealtimeVideoReceived"),
          removeOnRealtimeVideoRejected: () => removeCallback("onRealtimeVideoRejected"),
          removeOnSurveyAnswered: () => removeCallback("onSurveyAnswered"),
          removeOnSurveyPresented: () => removeCallback("onSurveyPresented"),
          removeOnSurveyRejected: () => removeCallback("onSurveyRejected"),
          removeAllCallbacks,
        }) as SdkMethods,
      [
        back,
        evaluateJavaScript,
        evaluateJavaScriptAsync,
        hide,
        registerCallback,
        removeAllCallbacks,
        removeCallback,
        show,
      ],
    );

    useEffect(() => {
      const backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
        if (visible) {
          back();
          return true;
        }

        return false;
      });

      return () => backHandler.remove();
    }, [back, visible]);

    const handleMessage = useCallback(
      async (event: WebViewMessageEvent) => {
        try {
          const message = JSON.parse(event.nativeEvent.data);

          switch (message.type) {
            case "jsInvocationResult": {
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
              }
              break;
            }
            case "onChatClosed": {
              hide();
              callbacks?.onChatClosed?.();
              break;
            }
            case "onChatOpened": {
              callbacks?.onChatOpened?.();
              break;
            }
            case "onHelpCenterArticleOpened": {
              if (message.data) {
                callbacks?.onHelpCenterArticleOpened?.(message.data);
              }
              break;
            }
            case "onLeadGenerated": {
              if (message.data?.email) {
                callbacks?.onLeadGenerated?.(message.data.email);
              }
              break;
            }
            case "onMessengerInitialized": {
              callbacks?.onMessengerInitialized?.();
              break;
            }
            case "onNewConversation": {
              if (message.data) {
                const { message: msg, attachments = [] } = message.data;
                callbacks?.onNewConversation?.(msg, attachments);
              }
              break;
            }
            case "onNewMessageReceived": {
              if (message.data) {
                const { accountId, message: msg, timestamp, userId, conversationId } = message.data;
                await sendNotificationForNewMessage(message.data);
                callbacks?.onNewMessageReceived?.(accountId, msg, timestamp, userId, conversationId);
              }
              break;
            }
            case "onNewConversationReceived": {
              if (message.data?.conversationId) {
                callbacks?.onNewConversationReceived?.(message.data.conversationId);
              }
              break;
            }
            case "onProfilingQuestionAnswered": {
              if (message.data) {
                const { attribute, value } = message.data;
                callbacks?.onProfilingQuestionAnswered?.(attribute, value);
              }
              break;
            }
            case "onProfilingQuestionAsked": {
              if (message.data?.attribute) {
                callbacks?.onProfilingQuestionAsked?.(message.data.attribute);
              }
              break;
            }
            case "onRealtimeVideoAnswered": {
              if (message.data) {
                callbacks?.onRealtimeVideoAnswered?.(message.data);
              }
              break;
            }
            case "onRealtimeVideoCanceled": {
              callbacks?.onRealtimeVideoCanceled?.();
              break;
            }
            case "onRealtimeVideoReceived": {
              show();
              if (message.data) {
                callbacks?.onRealtimeVideoReceived?.(message.data);
              }
              break;
            }
            case "onRealtimeVideoRejected": {
              callbacks?.onRealtimeVideoRejected?.();
              break;
            }
            case "onSurveyAnswered": {
              callbacks?.onSurveyAnswered?.();
              break;
            }
            case "onSurveyPresented": {
              show(true);
              if (message.data) {
                callbacks?.onSurveyPresented?.(message.data);
              }
              break;
            }
            case "onSurveyRejected": {
              callbacks?.onSurveyRejected?.();
              break;
            }
          }
        } catch (_error) {
          // Ignore messages that aren't JSON
        }
      },
      [pendingInvocations, hide, callbacks, sendNotificationForNewMessage, show],
    );

    const handleShouldStartLoadWithRequest = useCallback((event: WebViewNavigation) => {
      if (event.url.startsWith("https://customerly.io/") || event.url === "about:blank") {
        return true;
      }

      Linking.openURL(event.url);
      return false;
    }, []);

    return (
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          visible ? styles.visible : styles.hidden,
          {
            transform: [
              {
                translateY: slideAnimationRef.interpolate({
                  inputRange: [0, 1],
                  outputRange: [screenHeight, 0],
                }),
              },
            ],
          },
        ]}
      >
        <SafeAreaView style={[styles.container, { backgroundColor: colorScheme === "dark" ? "#000000" : "#FFFFFF" }]}>
          <KeyboardAvoidingView>
            <WebView
              allowFileAccess
              domStorageEnabled
              javaScriptEnabled
              incognito={false}
              mediaPlaybackRequiresUserAction={false}
              originWhitelist={["*"]}
              onMessage={handleMessage}
              onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
              ref={webViewRef}
              sharedCookiesEnabled={true}
              source={{ uri: "https://customerly.io/", baseUrl: "https://customerly.io/", html }}
              thirdPartyCookiesEnabled={true}
            />
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Animated.View>
    );
  },
);

Messenger.displayName = "Messenger";

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
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
