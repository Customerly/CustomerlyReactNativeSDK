import notifee, { AuthorizationStatus } from "@notifee/react-native";
import { createRef } from "react";
import { CustomerlySettings } from "./typings/customerly-settings";
import { SdkMethods } from "./typings/sdk-methods";

export const messengerRef = createRef<SdkMethods>();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const guardInstance = <T extends (...args: any[]) => any>(fn: T): T => {
  return ((...args: Parameters<T>) => {
    if (!messengerRef.current) {
      throw new Error("CustomerlyMessengerProvider is not mounted.");
    }

    return fn(...args);
  }) as T;
};

export const Customerly: SdkMethods & { requestNotificationPermissionIfNeeded: () => Promise<void> } = {
  requestNotificationPermissionIfNeeded: async () => {
    const notificationSettings = await notifee.requestPermission();
    if (notificationSettings.authorizationStatus !== AuthorizationStatus.AUTHORIZED) {
      return;
    }
  },
  update: guardInstance((settings: CustomerlySettings) => messengerRef.current!.update(settings)),
  show: guardInstance(() => messengerRef.current!.show()),
  hide: guardInstance(() => messengerRef.current!.hide()),
  back: guardInstance(() => messengerRef.current!.back()),
  logout: guardInstance(() => messengerRef.current!.logout()),
  registerLead: guardInstance((email: string, attributes?: Record<string, unknown>) =>
    messengerRef.current!.registerLead(email, attributes),
  ),
  showNewMessage: guardInstance((message: string) => messengerRef.current!.showNewMessage(message)),
  sendNewMessage: guardInstance((message: string) => messengerRef.current!.sendNewMessage(message)),
  navigateToConversation: guardInstance((conversationId: number) =>
    messengerRef.current!.navigateToConversation(conversationId),
  ),
  showArticle: guardInstance((collectionSlug: string, articleSlug: string) =>
    messengerRef.current!.showArticle(collectionSlug, articleSlug),
  ),
  event: guardInstance((name: string) => messengerRef.current!.event(name)),
  attribute: guardInstance((name: string, value: unknown) => messengerRef.current!.attribute(name, value)),
  getUnreadConversationsCount: guardInstance(async () => await messengerRef.current!.getUnreadConversationsCount()),
  getUnreadMessagesCount: guardInstance(async () => await messengerRef.current!.getUnreadMessagesCount()),
};
