export type CustomerlyCallbacks = {
  onChatClosed?: () => void;
  onChatOpened?: () => void;
  onHelpCenterArticleOpened?: (article: HelpCenterArticle) => void;
  onLeadGenerated?: (email: string) => void;
  onMessengerInitialized?: () => void;
  onNewConversation?: (message: string, attachments: AttachmentPayload[]) => void;
  onNewMessageReceived?: (
    accountId: number | undefined,
    message: string | undefined,
    timestamp: number,
    userId: number | undefined,
    conversationId: number,
  ) => void;
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

export type HelpCenterArticle = {
  id: number;
  title: string;
  content: string;
  url: string;
};

export type AttachmentPayload = {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
};

export type RealtimeCall = {
  id: string;
  status: string;
  startTime: number;
  endTime?: number;
};

export type Survey = {
  id: string;
  title: string;
  questions: SurveyQuestion[];
};

export type SurveyQuestion = {
  id: string;
  text: string;
  type: string;
  options?: string[];
};
