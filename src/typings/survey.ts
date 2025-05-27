import { Account } from "./account";

export enum SurveyQuestionType {
  Button = 0,
  RadioButton = 1,
  Select = 2,
  Scale = 3,
  Star = 4,
  Integer = 5,
  Textbox = 6,
  Textarea = 7,
}

export interface Survey {
  survey_id: number;
  creator: Account;
  thank_you_text?: string;
  seen_at?: number;
  question?: SurveyQuestion;
}

export interface SurveyQuestion {
  survey_id: number;
  survey_question_id: number;
  step: number;
  title?: string;
  subtitle?: string;
  type: SurveyQuestionType;
  limits?: {
    from: number;
    to: number;
  };
  choices: SurveyQuestionChoice[];
}

export interface SurveyQuestionChoice {
  survey_id: number;
  survey_question_id: number;
  survey_choice_id: number;
  step: number;
  value?: string;
}
