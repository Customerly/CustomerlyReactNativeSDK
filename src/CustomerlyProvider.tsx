import React, { FC, ReactNode } from "react";
import { messengerRef } from "./Customerly";
import Messenger, { MessengerProps } from "./Messenger";

type CustomerlyProviderProps = MessengerProps & {
  children: ReactNode;
};

export const CustomerlyProvider: FC<CustomerlyProviderProps> = ({ children, ...settings }) => {
  return (
    <>
      {children}
      <Messenger key={settings.appId} ref={messengerRef} {...settings} />
    </>
  );
};
