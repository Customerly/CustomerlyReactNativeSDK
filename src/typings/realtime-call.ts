import { Account } from "./account";

export type RealtimeCallUser = {
  user_id: number;
};

export type RealtimeCall = {
  account: Account;
  url: string;
  conversation_id: number;
  user: RealtimeCallUser;
};
