import React, { FC, ReactNode } from "react";
import { messengerRef } from "./Customerly";
import Messenger, { MessengerProps } from "./Messenger";

type CustomerlyProviderProps = MessengerProps & {
  children: ReactNode;
  /**
   * The ID of the notification channel to use for notifications. Android only.
   * @default "customerly-notification-channel"
   */
  notificationChannelId?: string;
  /**
   * The name of the notification channel to use for notifications. Android only.
   * @default "Customerly Notification Channel"
   */
  notificationChannelName?: string;
};

export const CustomerlyProvider: FC<CustomerlyProviderProps> = ({ children, ...settings }) => {
  return (
    <>
      {children}
      <Messenger key={settings.appId} ref={messengerRef} {...settings} />
    </>
  );
};
