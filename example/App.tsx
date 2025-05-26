import React, { useEffect } from "react";
import { Button, StyleSheet, View } from "react-native";
import { Customerly, CustomerlyMessengerProvider } from "react-native-customerly-sdk";

export default function App() {
  useEffect(() => {
    Customerly.load();
  }, []);

  return (
    <CustomerlyMessengerProvider>
      <View style={styles.container}>
        <Button title="Open Messenger" onPress={() => Customerly.open()} />
        <Button title="Close Messenger" onPress={() => Customerly.close()} />
      </View>
    </CustomerlyMessengerProvider>
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
