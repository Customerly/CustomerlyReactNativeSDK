import React from "react";
import Messenger, { CustomerlyMethods } from "./Messenger";

const messengerRef = React.createRef<CustomerlyMethods>();

export const CustomerlyMessengerProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  return (
    <>
      {children}
      <Messenger ref={messengerRef} />
    </>
  );
};

export const Customerly: CustomerlyMethods = {
  load: () => messengerRef.current?.load(),
  open: () => messengerRef.current?.open(),
  close: () => messengerRef.current?.close(),
  sendMessage: (data: unknown) => messengerRef.current?.sendMessage(data),
};
