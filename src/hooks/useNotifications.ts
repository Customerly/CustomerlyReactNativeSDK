import { useCallback, useEffect, useMemo } from "react";
import {
  ANDROID_IMPORTANCE_HIGH,
  AUTHORIZATION_STATUS_AUTHORIZED,
  DEFAULT_NOTIFICATION_CHANNEL_ID,
  DEFAULT_NOTIFICATION_CHANNEL_NAME,
  EVENT_TYPE_ACTION_PRESS,
  EVENT_TYPE_PRESS,
  NOTIFICATION_ANDROID_PRESS_ACTION_ID,
} from "../constants/notifications";
import { Customerly } from "../Customerly";
import { InternalCustomerlySettings } from "../typings/customerly-settings";
import { Message } from "../typings/message";
import { InjectedNotification, NotificationsModule } from "../typings/notifications";
import { abstractify } from "../utils/html";

type UseNotificationsProps = {
  notificationsModule?: NotificationsModule;
  notificationChannelId?: string;
  notificationChannelName?: string;
  settings?: InternalCustomerlySettings;
};

type UseNotificationsPayload = {
  sendNotificationForNewMessage: (message: Message) => Promise<void>;
  requestNotificationPermissionIfNeeded: () => Promise<void>;
};

const isMessage = (data: unknown): data is Message => {
  return typeof data === "object" && data !== null && "accountId" in data && "message" in data;
};

let hasWarnedAboutMissingModule = false;

//Not passing `notificationsModule` is a supported configuration, so it must not throw
const warnAboutMissingModuleOnce = () => {
  if (!__DEV__ || hasWarnedAboutMissingModule) {
    return;
  }

  hasWarnedAboutMissingModule = true;
  console.warn(
    "[Customerly] A message arrived but no `notificationsModule` was passed to CustomerlyProvider, " +
      "so no notification was shown. Pass the default export of `react-native-notify-kit` " +
      "(or `@notifee/react-native` on the legacy architecture) to enable notifications, " +
      "or ignore this warning if your app handles push itself. " +
      "See https://github.com/Customerly/CustomerlyReactNativeSDK#notifications",
  );
};

export const useNotifications = ({
  notificationsModule,
  notificationChannelId = DEFAULT_NOTIFICATION_CHANNEL_ID,
  notificationChannelName = DEFAULT_NOTIFICATION_CHANNEL_NAME,
  settings,
}: UseNotificationsProps = {}): UseNotificationsPayload => {
  const handleNotificationPress = (notification: InjectedNotification) => {
    if (isMessage(notification.data)) {
      Customerly.navigateToConversation(notification.data.conversationId);
      Customerly.show(true);
    }
  };

  useEffect(() => {
    if (!notificationsModule) {
      return;
    }

    return notificationsModule.onForegroundEvent(({ type, detail }) => {
      switch (type) {
        case EVENT_TYPE_ACTION_PRESS:
        case EVENT_TYPE_PRESS:
          if (detail.notification) {
            handleNotificationPress(detail.notification);
          }
          break;
      }
    });
  }, [notificationsModule]);

  useEffect(() => {
    if (!notificationsModule) {
      return;
    }

    let cancelled = false;

    (async () => {
      const initialNotification = await notificationsModule.getInitialNotification();

      if (initialNotification && !cancelled) {
        handleNotificationPress(initialNotification.notification);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [notificationsModule]);

  const requestNotificationPermissionIfNeeded = useCallback(async () => {
    await notificationsModule?.requestPermission();
  }, [notificationsModule]);

  const sendNotificationForNewMessage = useCallback(
    async (message: Message) => {
      if (!notificationsModule) {
        warnAboutMissingModuleOnce();
        return;
      }

      const notificationSetup = settings?.getNotificationSetup?.(message) ?? { shouldShow: true };

      if (!notificationSetup?.shouldShow) {
        return;
      }

      const notificationSettings = await notificationsModule.requestPermission();
      if (notificationSettings.authorizationStatus !== AUTHORIZATION_STATUS_AUTHORIZED) {
        return;
      }

      const channelId = await notificationsModule.createChannel({
        id: notificationSetup.notificationChannelId ?? notificationChannelId,
        name: notificationSetup.notificationChannelName ?? notificationChannelName,
        importance: ANDROID_IMPORTANCE_HIGH,
      });

      await notificationsModule.displayNotification({
        title: notificationSetup.title ?? abstractify(message.message),
        body: notificationSetup.body,
        data: message,
        android: {
          channelId,
          pressAction: { id: NOTIFICATION_ANDROID_PRESS_ACTION_ID },
          importance: ANDROID_IMPORTANCE_HIGH,
        },
      });
    },
    [notificationChannelId, notificationChannelName, notificationsModule, settings],
  );

  return useMemo(
    () => ({ sendNotificationForNewMessage, requestNotificationPermissionIfNeeded }),
    [sendNotificationForNewMessage, requestNotificationPermissionIfNeeded],
  );
};
