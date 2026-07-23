import { Account } from "./account";

export type RealtimeCallUser = {
  user_id: number;
};

export type RealtimeCall = {
  account: Account;
  url: string;
  ts: number;
  conversation_id: number;
  user: RealtimeCallUser;
};
