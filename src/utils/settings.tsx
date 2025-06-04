import { CustomerlySettings, InternalCustomerlySettings } from "../typings/customerly-settings";

export const getInternalSettings = (settings: CustomerlySettings): InternalCustomerlySettings => ({
  ...settings,
  app_id: settings.appId,
  user_id: settings.userId,
  email_hash: settings.emailHash,
  last_page_viewed: settings.lastPageViewed,
  force_lead: settings.forceLead,
});
