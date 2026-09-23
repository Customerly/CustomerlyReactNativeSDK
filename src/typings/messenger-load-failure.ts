export type MessengerLoadFailure = {
  /** HTTP status of the failed request, undefined on network errors. */
  status?: number;
  message?: string;
};
