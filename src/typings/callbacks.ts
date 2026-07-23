import { AttachmentPayload } from "./attachment-payload";
import { HelpCenterArticle } from "./help-center-article";
import { Message } from "./message";
import { RealtimeCall } from "./realtime-call";
import { Survey } from "./survey";

export type CustomerlyCallbacks = {
  onChatClosed?: () => void;
  onChatOpened?: () => void;
  onHelpCenterArticleOpened?: (article: HelpCenterArticle) => void;
  onLeadGenerated?: (email: string) => void;
  onMessageRead?: (conversationId: number, conversationMessageId: number) => void;
  onMessengerInitialized?: () => void;
  onNewConversation?: (message: string, attachments: AttachmentPayload[]) => void;
  onNewMessageReceived?: (message: Message) => void;
  onNewConversationReceived?: (conversationId: number) => void;
  onProfilingQuestionAnswered?: (attribute: string, value: string) => void;
  onProfilingQuestionAsked?: (attribute: string) => void;
  onRealtimeVideoAnswered?: (call: RealtimeCall) => void;
  onRealtimeVideoCanceled?: () => void;
  onRealtimeVideoReceived?: (call: RealtimeCall) => void;
  onRealtimeVideoRejected?: () => void;
  onSurveyAnswered?: () => void;
  onSurveyPresented?: (survey: Survey) => void;
  onSurveyRejected?: () => void;
};
