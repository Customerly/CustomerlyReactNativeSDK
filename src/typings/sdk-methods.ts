import { CustomerlySettings } from "./customerly-settings";

export type SdkMethods = {
  update: (settings: CustomerlySettings) => void;
  show: (withoutNavigation?: boolean) => void;
  hide: () => void;
  back: () => void;
  logout: () => void;
  registerLead: (email: string, attributes?: Record<string, unknown>) => void;
  showNewMessage: (message: string) => void;
  sendNewMessage: (message: string) => void;
  navigateToConversation: (conversationId: number) => void;
  showArticle: (collectionSlug: string, articleSlug: string) => void;
  event: (name: string) => void;
  attribute: (name: string, value: unknown) => void;
  getUnreadMessagesCount: () => Promise<number>;
  getUnreadConversationsCount: () => Promise<number>;
};
