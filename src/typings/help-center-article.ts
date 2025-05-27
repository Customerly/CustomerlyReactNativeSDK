export type WrittenBy = {
  account_id: number;
  email?: string;
  name: string;
};

export type HelpCenterArticle = {
  knowledge_base_article_id: number;
  knowledge_base_collection_id: number;
  app_id: string;
  slug: string;
  title: string;
  description: string;
  body: string;
  sort: number;
  written_by: WrittenBy;
  updated_at: number;
};
