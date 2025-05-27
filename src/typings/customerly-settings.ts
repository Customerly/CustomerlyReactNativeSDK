export type CustomerlySettings = {
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
