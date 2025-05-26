import React, { forwardRef, useCallback, useImperativeHandle, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";

export type CustomerlyMethods = {
  load: () => void;
  open: () => void;
  close: () => void;
  sendMessage: (data: unknown) => void;
};

const Messenger = forwardRef<CustomerlyMethods>((_, ref) => {
  const webviewRef = useRef<WebView>(null);
  const [visible, setVisible] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const guardLoaded = useCallback(
    <T,>(fn: T): T | (() => void) => {
      if (!loaded) {
        return () => {
          throw new Error("Messenger not loaded. Call load() first.");
        };
      }

      return fn;
    },
    [loaded],
  );

  useImperativeHandle(
    ref,
    () =>
      ({
        load: () => {
          if (!loaded) {
            setLoaded(true);
          }
        },
        open: guardLoaded(() => setVisible(true)),
        close: guardLoaded(() => setVisible(false)),
        sendMessage: guardLoaded((data) => {
          webviewRef.current?.postMessage(JSON.stringify(data));
        }),
      }) as CustomerlyMethods,
    [guardLoaded, loaded],
  );

  if (!loaded) return null;

  return (
    <View style={[StyleSheet.absoluteFill, visible ? styles.visible : styles.hidden]}>
      <WebView
        ref={webviewRef}
        originWhitelist={["*"]}
        source={{ uri: "https://your-customerly-messenger-url.com" }}
        javaScriptEnabled
        onMessage={(event) => {
          try {
            const message = JSON.parse(event.nativeEvent.data);
            console.log("[Customerly] WebView message:", message);
          } catch (_) {
            console.warn("[Customerly] Invalid message from WebView:", event.nativeEvent.data);
          }
        }}
      />
    </View>
  );
});

Messenger.displayName = "Messenger";

const styles = StyleSheet.create({
  visible: { display: "flex" },
  hidden: { display: "none" },
});

export default Messenger;
