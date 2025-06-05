import notifee, { AndroidImportance, AuthorizationStatus, EventType, Notification } from "@notifee/react-native";
import { useCallback, useEffect, useMemo } from "react";
import {
  DEFAULT_NOTIFICATION_CHANNEL_ID,
  DEFAULT_NOTIFICATION_CHANNEL_NAME,
  NOTIFICATION_ANDROID_PRESS_ACTION_ID,
} from "../constants/notifications";
import { Customerly } from "../Customerly";
import { Message } from "../typings/message";
import { abstractify } from "../utils/html";

type UseNotificationsProps = {
  notificationChannelId?: string;
  notificationChannelName?: string;
};

type UseNotificationsPayload = {
  sendNotificationForNewMessage: (message: Message) => Promise<void>;
};

const isMessage = (data: unknown): data is Message => {
  return typeof data === "object" && data !== null && "accountId" in data && "message" in data;
};

export const useNotifications = ({
  notificationChannelId = DEFAULT_NOTIFICATION_CHANNEL_ID,
  notificationChannelName = DEFAULT_NOTIFICATION_CHANNEL_NAME,
}: UseNotificationsProps = {}): UseNotificationsPayload => {
  const handleNotificationPress = (notification: Notification) => {
    if (isMessage(notification.data)) {
      Customerly.navigateToConversation(notification.data.conversationId);
      Customerly.show(true);
    }
  };

  useEffect(() => {
    return notifee.onForegroundEvent(({ type, detail }) => {
      switch (type) {
        case EventType.ACTION_PRESS:
        case EventType.PRESS:
          if (detail.notification) {
            handleNotificationPress(detail.notification);
          }
          break;
      }
    });
  }, []);

  useEffect(() => {
    (async () => {
      const initialNotification = await notifee.getInitialNotification();

      if (initialNotification) {
        handleNotificationPress(initialNotification.notification);
      }
    })();
  }, []);

  const sendNotificationForNewMessage = useCallback(
    async (message: Message) => {
      const notificationSettings = await notifee.requestPermission();
      if (notificationSettings.authorizationStatus !== AuthorizationStatus.AUTHORIZED) {
        return;
      }

      const channelId = await notifee.createChannel({
        id: notificationChannelId,
        name: notificationChannelName,
        importance: AndroidImportance.HIGH,
      });

      await notifee.displayNotification({
        title: abstractify(message.message),
        data: message,
        android: {
          channelId,
          pressAction: { id: NOTIFICATION_ANDROID_PRESS_ACTION_ID },
          importance: AndroidImportance.HIGH,
        },
      });
    },
    [notificationChannelId, notificationChannelName],
  );

  return useMemo(() => ({ sendNotificationForNewMessage }), [sendNotificationForNewMessage]);
};
