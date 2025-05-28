import React, { useEffect, useState } from "react";
import {
  Keyboard,
  Platform,
  KeyboardAvoidingView as RNKeyboardAvoidingView,
  KeyboardAvoidingViewProps as RNKeyboardAvoidingViewProps,
  StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const IosKeyboardAvoidingView = ({ style, ...props }: RNKeyboardAvoidingViewProps) => (
  <RNKeyboardAvoidingView behavior={"height"} keyboardVerticalOffset={0} style={[styles.container, style]} {...props} />
);

const AndroidKeyboardAvoidingView = ({ style, ...props }: RNKeyboardAvoidingViewProps) => {
  const { top } = useSafeAreaInsets();

  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener("keyboardDidShow", () => {
      setIsKeyboardVisible(true);
    });
    const keyboardDidHideListener = Keyboard.addListener("keyboardDidHide", () => {
      setIsKeyboardVisible(false);
    });

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  return (
    <RNKeyboardAvoidingView
      behavior={"height"}
      keyboardVerticalOffset={Platform.OS === "android" && !isKeyboardVisible ? -top : 0}
      style={[styles.container, style]}
      {...props}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

const KeyboardAvoidingView = Platform.OS === "android" ? AndroidKeyboardAvoidingView : IosKeyboardAvoidingView;

export default KeyboardAvoidingView;
