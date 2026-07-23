import { CustomerlySettings, InternalCustomerlySettings } from "../typings/customerly-settings";

export const getInternalSettings = (settings: CustomerlySettings): InternalCustomerlySettings => {
  const { appId, userId, emailHash, lastPageViewed, forceLead, events, company, ...rest } = settings;

  return {
    ...rest,
    app_id: appId,
    user_id: userId,
    email_hash: emailHash,
    last_page_viewed: lastPageViewed,
    force_lead: forceLead,
    ...(events && {
      events: events.map(({ name, date }) => ({
        name,
        // The web messenger expects a Unix timestamp in seconds.
        date: date ? Math.floor(date.getTime() / 1000) : undefined,
      })),
    }),
    ...(company && {
      company: {
        company_id: company.company_id,
        name: company.name,
        // The web messenger reads additional company attributes from the top
        // level of the company object, not from a nested property.
        ...company.additionalAttributes,
      },
    }),
  };
};
