import React, { FC, ReactNode } from "react";
import { messengerRef } from "./Customerly";
import Messenger, { MessengerProps } from "./Messenger";

type CustomerlyProviderProps = MessengerProps & {
  children: ReactNode;
};

export const CustomerlyProvider: FC<CustomerlyProviderProps> = ({ children, colorScheme, ...settings }) => {
  return (
    <>
      {children}
      <Messenger key={settings.appId} colorScheme={colorScheme} ref={messengerRef} {...settings} />
    </>
  );
};
