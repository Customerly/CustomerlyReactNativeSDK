import React from "react";
import { Button, StyleSheet, View } from "react-native";
// eslint-disable-next-line import/no-unresolved
import { Customerly, CustomerlyProvider } from "react-native-customerly-sdk";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function App() {
  return (
    <SafeAreaProvider>
      <CustomerlyProvider app_id={"936fd1dc"}>
        <View style={styles.container}>
          <Button title="Open Messenger" onPress={() => Customerly.show()} />
          <Button title="Close Messenger" onPress={() => Customerly.hide()} />
        </View>
      </CustomerlyProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    gap: 12,
    paddingHorizontal: 24,
  },
});
