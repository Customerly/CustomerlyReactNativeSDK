import { Message } from "./message";

export type NotificationSetup =
  | {
      shouldShow: false;
      title?: never;
      body?: never;
    }
  | {
      shouldShow: true;
      title?: string;
      body?: string;
      notificationChannelId?: string;
      notificationChannelName?: string;
    };

export type CustomerlySettings = {
  appId: string;
  userId?: string;
  name?: string;
  email?: string;
  emailHash?: string;
  accentColor?: string;
  contrastColor?: string;
  attachmentsAvailable?: boolean;
  singleConversation?: boolean;
  lastPageViewed?: string;
  forceLead?: boolean;
  attributes?: Record<string, unknown>;
  company?: Company;
  events?: Event[];
  getNotificationSetup?: (message: Message) => NotificationSetup;
};

export type InternalCustomerlySettings = {
  app_id: string;
  user_id?: string;
  name?: string;
  email?: string;
  email_hash?: string;
  accentColor?: string;
  contrastColor?: string;
  attachmentsAvailable?: boolean;
  singleConversation?: boolean;
  last_page_viewed?: string;
  force_lead?: boolean;
  attributes?: Record<string, unknown>;
  company?: Company;
  events?: Event[];
  getNotificationSetup?: (message: Message) => NotificationSetup;
};

export type Company = {
  company_id: string;
  name: string;
  additionalAttributes?: Record<string, unknown>;
};

export type Event = {
  name: string;
  date?: Date;
};
