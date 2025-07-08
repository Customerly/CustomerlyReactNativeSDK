import React, { useEffect, useState } from "react";
import {
  Keyboard,
  Platform,
  KeyboardAvoidingView as RNKeyboardAvoidingView,
  KeyboardAvoidingViewProps as RNKeyboardAvoidingViewProps,
  StyleSheet,
} from "react-native";

const IosKeyboardAvoidingView = ({ style, ...props }: RNKeyboardAvoidingViewProps) => (
  <RNKeyboardAvoidingView behavior="padding" style={[styles.flex1, style]} {...props} />
);

const AndroidKeyboardAvoidingView = ({ style, ...props }: RNKeyboardAvoidingViewProps) => {
  const [flexToggle, setFlexToggle] = useState(false);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener("keyboardDidShow", () => {
      setFlexToggle(false);
    });

    const keyboardDidHideListener = Keyboard.addListener("keyboardDidHide", () => {
      setFlexToggle(true);
    });

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, []);

  return (
    <RNKeyboardAvoidingView
      renderToHardwareTextureAndroid
      behavior="height"
      style={[flexToggle ? styles.flexGrow1 : styles.flex1, style]}
      {...props}
    />
  );
};

const styles = StyleSheet.create({
  flex1: {
    flex: 1,
  },
  flexGrow1: {
    flexGrow: 1,
  },
});

const KeyboardAvoidingView = Platform.OS === "android" ? AndroidKeyboardAvoidingView : IosKeyboardAvoidingView;

export default KeyboardAvoidingView;
