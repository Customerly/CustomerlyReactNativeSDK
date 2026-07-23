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

export type Company = {
  company_id: string;
  name: string;
  additionalAttributes?: Record<string, unknown>;
};

export type CustomerlyEvent = {
  name: string;
  date?: Date;
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
  events?: CustomerlyEvent[];
  getNotificationSetup?: (message: Message) => NotificationSetup;
};

/**
 * Company as the web messenger expects it on the wire: `company_id` and `name`
 * plus any additional attributes spread at the top level (not nested).
 */
export type InternalCompany = {
  company_id: string;
  name: string;
  [attribute: string]: unknown;
};

/**
 * Event as the web messenger expects it on the wire: `date` is a Unix timestamp
 * in seconds rather than a `Date` instance.
 */
export type InternalEvent = {
  name: string;
  date?: number;
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
  company?: InternalCompany;
  events?: InternalEvent[];
  getNotificationSetup?: (message: Message) => NotificationSetup;
};
