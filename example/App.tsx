import React, { useEffect, useState } from "react";
import { Button, StyleSheet, View } from "react-native";
// eslint-disable-next-line import/no-unresolved
import { Customerly, CustomerlyProvider } from "react-native-customerly-sdk";
import { SafeAreaProvider } from "react-native-safe-area-context";

const App = () => {
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [unreadConversationsCount, setUnreadConversationsCount] = useState(0);

  useEffect(() => {
    Customerly.requestNotificationPermissionIfNeeded();

    Customerly.setOnMessengerInitialized(async () => {
      const messagesCount = await Customerly.getUnreadMessagesCount();
      const conversationsCount = await Customerly.getUnreadConversationsCount();
      setUnreadMessagesCount(messagesCount);
      setUnreadConversationsCount(conversationsCount);
    });
  }, []);

  return (
    <>
      <View style={styles.container}>
        <Button title="Open Chat" onPress={() => Customerly.show()} />
        <Button title="Close Chat" onPress={() => Customerly.hide()} />
        <Button
          title="Login User"
          onPress={() =>
            Customerly.update({
              app_id: "YOUR_APP_ID",
              user_id: "123",
              email: "gb@customerly.io",
              name: "Giorgio",
            })
          }
        />
        <Button title="Logout User" onPress={() => Customerly.logout()} />
        <Button title="Send Event" onPress={() => Customerly.event("ciao")} />
        <Button title="Set Attribute" onPress={() => Customerly.attribute("last_action", "attribute_set")} />
        <Button title="Show New Message" onPress={() => Customerly.showNewMessage("i need help")} />
        <Button title="Send New Message" onPress={() => Customerly.sendNewMessage("i need help")} />
        <Button
          title="Show Article"
          onPress={() => Customerly.showArticle("getting-started-with-help-center", "this-is-your-first-articleflex")}
        />
        <Button
          title="Register Lead"
          onPress={() =>
            Customerly.registerLead("lead@example.com", {
              source: "react_native_app",
              interest: "premium_features",
            })
          }
        />
        <Button
          title={`${unreadMessagesCount} new message/s`}
          onPress={async () => setUnreadMessagesCount(await Customerly.getUnreadMessagesCount())}
        />
        <Button
          title={`${unreadConversationsCount} new conversation/s`}
          onPress={async () => setUnreadConversationsCount(await Customerly.getUnreadConversationsCount())}
        />
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    padding: 16,
  },
});

export default function AppWrapper() {
  return (
    <SafeAreaProvider>
      <CustomerlyProvider app_id={"YOUR_APP_ID"}>
        <App />
      </CustomerlyProvider>
    </SafeAreaProvider>
  );
}
