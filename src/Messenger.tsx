import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import {
  Animated,
  AppState,
  AppStateStatus,
  BackHandler,
  Easing,
  Linking,
  StyleSheet,
  useColorScheme,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView, WebViewMessageEvent, WebViewNavigation } from "react-native-webview";
import KeyboardAvoidingView from "./components/KeyboardAvoidingView";
import { useNotifications } from "./hooks/useNotifications";
import { CustomerlyCallbacks } from "./typings/callbacks";
import { CustomerlySettings, InternalCustomerlySettings } from "./typings/customerly-settings";
import { Message } from "./typings/message";
import { NotificationsModule } from "./typings/notifications";
import { SdkMethods } from "./typings/sdk-methods";
import { buildJsCall } from "./utils/js";
import { safelyParseNumber } from "./utils/number";
import { getInternalSettings } from "./utils/settings";
import { generateRandomString } from "./utils/string";
import { createHTML } from "./utils/webview";

export type MessengerProps = CustomerlySettings & {
  colorScheme?: "light" | "dark";
  /**
   * The default export of a notifee-compatible notification module, used to
   * post a local notification for every incoming message.
   *
   * Install `react-native-notify-kit` (New Architecture) or the archived
   * `@notifee/react-native` (legacy architecture) in your app and pass it in.
   * Leave it out to disable the SDK's notifications entirely — do that if your
   * app already handles push on its own.
   *
   * Pass a **stable reference** — a module import or a module-level constant,
   * not an object literal created during render. The value is a dependency of
   * the SDK's notification effects, so a new identity on every render
   * re-subscribes the foreground listener and re-reads the initial notification.
   */
  notificationsModule?: NotificationsModule;
  /**
   * The ID of the notification channel to use for notifications. Android only,
   * and only used when `notificationsModule` is set.
   * @default "customerly-notification-channel"
   */
  notificationChannelId?: string;
  /**
   * The name of the notification channel to use for notifications. Android only,
   * and only used when `notificationsModule` is set.
   * @default "Customerly Notification Channel"
   */
  notificationChannelName?: string;
};

const ANIMATION_DURATION = 350;
const BACKGROUND_RELOAD_TIMEOUT = 4 * 60 * 1000; // 4 minutes in milliseconds
const JS_INVOCATION_TIMEOUT = 10 * 1000; // 10 seconds

type PendingInvocation = {
  resolve: (value: unknown) => void;
  reject: (error: Error) => void;
  timer: ReturnType<typeof setTimeout>;
};

const Messenger = forwardRef<SdkMethods, MessengerProps>(
  (
    {
      colorScheme: colorSchemeProps,
      notificationsModule,
      notificationChannelId,
      notificationChannelName,
      ...settingsProps
    },
    ref,
  ) => {
    const defaultColorScheme = useColorScheme();
    const { height: screenHeight } = useWindowDimensions();

    const webViewRef = useRef<WebView>(null);
    const slideAnimationRef = useRef(new Animated.Value(0)).current;
    const appStateRef = useRef(AppState.currentState);
    const callbacksRef = useRef<CustomerlyCallbacks>({});
    const pendingInvocationsRef = useRef<Record<string, PendingInvocation>>({});

    const [settings, setSettings] = useState<InternalCustomerlySettings>(getInternalSettings(settingsProps));
    const settingsRef = useRef(settings);
    const [visible, setVisible] = useState(false);
    const [webViewKey, setWebViewKey] = useState(generateRandomString(10));
    const [backgroundTimestamp, setBackgroundTimestamp] = useState<number | null>(null);
    const [html, setHtml] = useState<string>();

    const { sendNotificationForNewMessage, requestNotificationPermissionIfNeeded } = useNotifications({
      notificationsModule,
      notificationChannelId,
      notificationChannelName,
      settings,
    });

    const colorScheme = colorSchemeProps ?? defaultColorScheme;

    useEffect(() => {
      settingsRef.current = settings;
    }, [settings]);

    // Generate the messenger HTML on mount and whenever the WebView is remounted
    // (e.g. after a long background). Settings updates go through
    // `customerly.update` instead, so they never trigger a full page reload.
    useEffect(() => {
      let cancelled = false;
      (async () => {
        const generatedHtml = await createHTML(settingsRef.current);
        if (!cancelled) {
          setHtml(generatedHtml);
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [webViewKey]);

    const evaluateJavaScript = useCallback((script: string) => {
      if (!webViewRef.current) {
        throw new Error("WebView is not initialized");
      }

      webViewRef.current.injectJavaScript(script);
    }, []);

    const evaluateJavaScriptAsync = useCallback((script: string) => {
      return new Promise((resolve, reject) => {
        if (!webViewRef.current) {
          reject(new Error("WebView is not initialized"));
          return;
        }

        const invocationId = generateRandomString(10);

        const timer = setTimeout(() => {
          if (pendingInvocationsRef.current[invocationId]) {
            delete pendingInvocationsRef.current[invocationId];
            reject(new Error("Timed out waiting for the WebView response"));
          }
        }, JS_INVOCATION_TIMEOUT);

        pendingInvocationsRef.current[invocationId] = { resolve, reject, timer };

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

    // Reject any in-flight async invocations when the WebView is torn down or
    // remounted, so their promises never hang forever.
    useEffect(() => {
      const pending = pendingInvocationsRef.current;
      return () => {
        Object.values(pending).forEach(({ reject, timer }) => {
          clearTimeout(timer);
          reject(new Error("WebView was reloaded before the response arrived"));
        });
        pendingInvocationsRef.current = {};
      };
    }, [webViewKey]);

    const checkAndReloadIfNeeded = useCallback(() => {
      if (!backgroundTimestamp) {
        return;
      }

      const now = Date.now();
      const timeInBackground = now - backgroundTimestamp;

      if (timeInBackground > BACKGROUND_RELOAD_TIMEOUT) {
        setWebViewKey(generateRandomString(10));
        setBackgroundTimestamp(null);
      }
    }, [backgroundTimestamp]);

    useEffect(() => {
      const handleAppStateChange = (nextAppState: AppStateStatus) => {
        const wasActive = appStateRef.current === "active";
        const isNowActive = nextAppState === "active";

        appStateRef.current = nextAppState;

        if (wasActive && !isNowActive) {
          // App is going to background
          setBackgroundTimestamp(Date.now());
        } else if (!wasActive && isNowActive) {
          // App is coming back to foreground
          checkAndReloadIfNeeded();
        }
      };

      const subscription = AppState.addEventListener("change", handleAppStateChange);

      return () => subscription?.remove();
    }, [checkAndReloadIfNeeded]);

    const show = useCallback(
      (withoutNavigation = false) => {
        evaluateJavaScript("customerly.open()");
        if (!withoutNavigation) {
          evaluateJavaScript(buildJsCall("_customerly_sdk.navigate", "/", true));
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
        callbacksRef.current[name] = callback;
      },
      [],
    );

    const removeCallback = useCallback((name: keyof CustomerlyCallbacks) => {
      delete callbacksRef.current[name];
    }, []);

    const removeAllCallbacks = useCallback(() => {
      callbacksRef.current = {};
    }, []);

    useImperativeHandle(
      ref,
      () =>
        ({
          update: (newSettings: CustomerlySettings) => {
            const internalSettings = getInternalSettings(newSettings);
            setSettings((currentSettings) => ({ ...currentSettings, ...internalSettings }));
            evaluateJavaScript(buildJsCall("customerly.update", internalSettings));
          },
          // Force a fresh messenger session by remounting the WebView. The HTML
          // is regenerated from the current settings, so the user stays logged in.
          reset: () => setWebViewKey(generateRandomString(10)),
          show,
          hide,
          back,
          logout: () => evaluateJavaScript("customerly.logout()"),
          registerLead: (email: string, attributes?: Record<string, unknown>) =>
            evaluateJavaScript(buildJsCall("customerly.registerLead", email, attributes)),
          showNewMessage: (message: string) => {
            show();
            evaluateJavaScript(buildJsCall("customerly.showNewMessage", message));
          },
          sendNewMessage: (message: string) => {
            show();
            evaluateJavaScript(buildJsCall("customerly.sendNewMessage", message));
          },
          showBookMeeting: () => {
            show();
            evaluateJavaScript("customerly.showBookMeeting()");
          },
          navigateToConversation: (conversationId: number) =>
            evaluateJavaScript(buildJsCall("_customerly_sdk.navigateToConversation", conversationId)),
          showArticle: (collectionSlugOrArticleId: string | number, articleSlug?: string) => {
            show();
            evaluateJavaScript(buildJsCall("customerly.showArticle", collectionSlugOrArticleId, articleSlug));
          },
          event: (name: string) => evaluateJavaScript(buildJsCall("customerly.event", name)),
          attribute: (name: string, value: unknown) =>
            evaluateJavaScript(buildJsCall("customerly.attribute", name, value)),
          getUnreadConversationsCount: async () =>
            safelyParseNumber(await evaluateJavaScriptAsync("customerly.unreadConversationsCount")),
          getUnreadMessagesCount: async () =>
            safelyParseNumber(await evaluateJavaScriptAsync("customerly.unreadMessagesCount")),
          requestNotificationPermissionIfNeeded,
          setOnChatClosed: (callback: CustomerlyCallbacks["onChatClosed"]) =>
            registerCallback("onChatClosed", callback),
          setOnChatOpened: (callback: CustomerlyCallbacks["onChatOpened"]) =>
            registerCallback("onChatOpened", callback),
          setOnHelpCenterArticleOpened: (callback: CustomerlyCallbacks["onHelpCenterArticleOpened"]) =>
            registerCallback("onHelpCenterArticleOpened", callback),
          setOnLeadGenerated: (callback: CustomerlyCallbacks["onLeadGenerated"]) =>
            registerCallback("onLeadGenerated", callback),
          setOnMessageRead: (callback: CustomerlyCallbacks["onMessageRead"]) =>
            registerCallback("onMessageRead", callback),
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
          removeOnMessageRead: () => removeCallback("onMessageRead"),
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
        requestNotificationPermissionIfNeeded,
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
              const pending = pendingInvocationsRef.current[message.id];
              if (pending) {
                clearTimeout(pending.timer);
                delete pendingInvocationsRef.current[message.id];

                if (message.error) {
                  pending.reject(new Error(message.error));
                } else {
                  pending.resolve(message.result);
                }
              }
              break;
            }
            case "onChatClosed": {
              hide();
              callbacksRef.current.onChatClosed?.();
              break;
            }
            case "onChatOpened": {
              callbacksRef.current.onChatOpened?.();
              break;
            }
            case "onHelpCenterArticleOpened": {
              if (message.data) {
                callbacksRef.current.onHelpCenterArticleOpened?.(message.data);
              }
              break;
            }
            case "onLeadGenerated": {
              if (message.data?.email) {
                callbacksRef.current.onLeadGenerated?.(message.data.email);
              }
              break;
            }
            case "onMessageRead": {
              if (message.data) {
                const { conversationId, conversationMessageId } = message.data;
                callbacksRef.current.onMessageRead?.(conversationId, conversationMessageId);
              }
              break;
            }
            case "onMessengerInitialized": {
              callbacksRef.current.onMessengerInitialized?.();
              break;
            }
            case "onNewConversation": {
              if (message.data) {
                const { message: msg, attachments = [] } = message.data;
                callbacksRef.current.onNewConversation?.(msg, attachments);
              }
              break;
            }
            case "onNewMessageReceived": {
              if (message.data) {
                await sendNotificationForNewMessage(message.data as Message);
                callbacksRef.current.onNewMessageReceived?.(message.data as Message);
              }
              break;
            }
            case "onNewConversationReceived": {
              if (message.data?.conversationId) {
                callbacksRef.current.onNewConversationReceived?.(message.data.conversationId);
              }
              break;
            }
            case "onProfilingQuestionAnswered": {
              if (message.data) {
                const { attribute, value } = message.data;
                callbacksRef.current.onProfilingQuestionAnswered?.(attribute, value);
              }
              break;
            }
            case "onProfilingQuestionAsked": {
              if (message.data?.attribute) {
                callbacksRef.current.onProfilingQuestionAsked?.(message.data.attribute);
              }
              break;
            }
            case "onRealtimeVideoAnswered": {
              if (message.data) {
                callbacksRef.current.onRealtimeVideoAnswered?.(message.data);
              }
              break;
            }
            case "onRealtimeVideoCanceled": {
              callbacksRef.current.onRealtimeVideoCanceled?.();
              break;
            }
            case "onRealtimeVideoReceived": {
              show();
              if (message.data) {
                callbacksRef.current.onRealtimeVideoReceived?.(message.data);
              }
              break;
            }
            case "onRealtimeVideoRejected": {
              callbacksRef.current.onRealtimeVideoRejected?.();
              break;
            }
            case "onSurveyAnswered": {
              callbacksRef.current.onSurveyAnswered?.();
              break;
            }
            case "onSurveyPresented": {
              show(true);
              if (message.data) {
                callbacksRef.current.onSurveyPresented?.(message.data);
              }
              break;
            }
            case "onSurveyRejected": {
              callbacksRef.current.onSurveyRejected?.();
              break;
            }
          }
        } catch (_error) {
          // Ignore messages that aren't JSON
        }
      },
      [hide, sendNotificationForNewMessage, show],
    );

    const handleShouldStartLoadWithRequest = useCallback((event: WebViewNavigation) => {
      if (event.url.startsWith("https://customerly.io/") || event.url === "about:blank") {
        return true;
      }

      Linking.openURL(event.url);
      return false;
    }, []);

    if (!html) {
      return null;
    }

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
              key={webViewKey}
              allowFileAccess
              domStorageEnabled
              javaScriptEnabled
              incognito={false}
              mediaPlaybackRequiresUserAction={false}
              originWhitelist={["*"]}
              onMessage={handleMessage}
              onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
              ref={webViewRef}
              // The document is pinned in `createHTML`, so the outer scroll view has nothing to
              // scroll and only adds ways to displace the page. Content scrolls web-side.
              scrollEnabled={false}
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
