import notifee from "@notifee/react-native";
import { createRef } from "react";
import { CustomerlyCallbacks } from "./typings/callbacks";
import { CustomerlySettings } from "./typings/customerly-settings";
import { SdkMethods } from "./typings/sdk-methods";

export const messengerRef = createRef<SdkMethods>();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const guardInstance = <T extends (...args: any[]) => any>(fn: T): T => {
  return ((...args: Parameters<T>) => {
    if (!messengerRef.current) {
      throw new Error("CustomerlyProvider is not mounted.");
    }

    return fn(...args);
  }) as T;
};

export const Customerly: SdkMethods & { requestNotificationPermissionIfNeeded: () => Promise<void> } = {
  requestNotificationPermissionIfNeeded: async () => {
    await notifee.requestPermission();
  },
  update: guardInstance((settings: CustomerlySettings) => messengerRef.current!.update(settings)),
  show: guardInstance((withoutNavigation?: boolean) => messengerRef.current!.show(withoutNavigation)),
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
  setOnChatClosed: guardInstance((callback: CustomerlyCallbacks["onChatClosed"]) =>
    messengerRef.current!.setOnChatClosed(callback),
  ),
  setOnChatOpened: guardInstance((callback: CustomerlyCallbacks["onChatOpened"]) =>
    messengerRef.current!.setOnChatOpened(callback),
  ),
  setOnHelpCenterArticleOpened: guardInstance((callback: CustomerlyCallbacks["onHelpCenterArticleOpened"]) =>
    messengerRef.current!.setOnHelpCenterArticleOpened(callback),
  ),
  setOnLeadGenerated: guardInstance((callback: CustomerlyCallbacks["onLeadGenerated"]) =>
    messengerRef.current!.setOnLeadGenerated(callback),
  ),
  setOnMessengerInitialized: guardInstance((callback: CustomerlyCallbacks["onMessengerInitialized"]) =>
    messengerRef.current!.setOnMessengerInitialized(callback),
  ),
  setOnNewConversation: guardInstance((callback: CustomerlyCallbacks["onNewConversation"]) =>
    messengerRef.current!.setOnNewConversation(callback),
  ),
  setOnNewMessageReceived: guardInstance((callback: CustomerlyCallbacks["onNewMessageReceived"]) =>
    messengerRef.current!.setOnNewMessageReceived(callback),
  ),
  setOnNewConversationReceived: guardInstance((callback: CustomerlyCallbacks["onNewConversationReceived"]) =>
    messengerRef.current!.setOnNewConversationReceived(callback),
  ),
  setOnProfilingQuestionAnswered: guardInstance((callback: CustomerlyCallbacks["onProfilingQuestionAnswered"]) =>
    messengerRef.current!.setOnProfilingQuestionAnswered(callback),
  ),
  setOnProfilingQuestionAsked: guardInstance((callback: CustomerlyCallbacks["onProfilingQuestionAsked"]) =>
    messengerRef.current!.setOnProfilingQuestionAsked(callback),
  ),
  setOnRealtimeVideoAnswered: guardInstance((callback: CustomerlyCallbacks["onRealtimeVideoAnswered"]) =>
    messengerRef.current!.setOnRealtimeVideoAnswered(callback),
  ),
  setOnRealtimeVideoCanceled: guardInstance((callback: CustomerlyCallbacks["onRealtimeVideoCanceled"]) =>
    messengerRef.current!.setOnRealtimeVideoCanceled(callback),
  ),
  setOnRealtimeVideoReceived: guardInstance((callback: CustomerlyCallbacks["onRealtimeVideoReceived"]) =>
    messengerRef.current!.setOnRealtimeVideoReceived(callback),
  ),
  setOnRealtimeVideoRejected: guardInstance((callback: CustomerlyCallbacks["onRealtimeVideoRejected"]) =>
    messengerRef.current!.setOnRealtimeVideoRejected(callback),
  ),
  setOnSurveyAnswered: guardInstance((callback: CustomerlyCallbacks["onSurveyAnswered"]) =>
    messengerRef.current!.setOnSurveyAnswered(callback),
  ),
  setOnSurveyPresented: guardInstance((callback: CustomerlyCallbacks["onSurveyPresented"]) =>
    messengerRef.current!.setOnSurveyPresented(callback),
  ),
  setOnSurveyRejected: guardInstance((callback: CustomerlyCallbacks["onSurveyRejected"]) =>
    messengerRef.current!.setOnSurveyRejected(callback),
  ),
  removeOnChatClosed: guardInstance(() => messengerRef.current!.removeOnChatClosed()),
  removeOnChatOpened: guardInstance(() => messengerRef.current!.removeOnChatOpened()),
  removeOnHelpCenterArticleOpened: guardInstance(() => messengerRef.current!.removeOnHelpCenterArticleOpened()),
  removeOnLeadGenerated: guardInstance(() => messengerRef.current!.removeOnLeadGenerated()),
  removeOnMessengerInitialized: guardInstance(() => messengerRef.current!.removeOnMessengerInitialized()),
  removeOnNewConversation: guardInstance(() => messengerRef.current!.removeOnNewConversation()),
  removeOnNewMessageReceived: guardInstance(() => messengerRef.current!.removeOnNewMessageReceived()),
  removeOnNewConversationReceived: guardInstance(() => messengerRef.current!.removeOnNewConversationReceived()),
  removeOnProfilingQuestionAnswered: guardInstance(() => messengerRef.current!.removeOnProfilingQuestionAnswered()),
  removeOnProfilingQuestionAsked: guardInstance(() => messengerRef.current!.removeOnProfilingQuestionAsked()),
  removeOnRealtimeVideoAnswered: guardInstance(() => messengerRef.current!.removeOnRealtimeVideoAnswered()),
  removeOnRealtimeVideoCanceled: guardInstance(() => messengerRef.current!.removeOnRealtimeVideoCanceled()),
  removeOnRealtimeVideoReceived: guardInstance(() => messengerRef.current!.removeOnRealtimeVideoReceived()),
  removeOnRealtimeVideoRejected: guardInstance(() => messengerRef.current!.removeOnRealtimeVideoRejected()),
  removeOnSurveyAnswered: guardInstance(() => messengerRef.current!.removeOnSurveyAnswered()),
  removeOnSurveyPresented: guardInstance(() => messengerRef.current!.removeOnSurveyPresented()),
  removeOnSurveyRejected: guardInstance(() => messengerRef.current!.removeOnSurveyRejected()),
  removeAllCallbacks: guardInstance(() => messengerRef.current!.removeAllCallbacks()),
};
