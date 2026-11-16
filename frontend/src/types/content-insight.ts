export type ContentInsightStatus = "draft" | "published" | "archived";
export type ContentInsightLanguage = "en" | "hi" | "ta";

export type ContentInsightSection = {
  heading: string;
  paragraphs: string[];
};

export type ContentInsight = {
  id: string;
  title: string;
  slug: string;
  description: string;
  excerpt: string;
  status: ContentInsightStatus;
  language: ContentInsightLanguage;
  tags: string[];
  sections: ContentInsightSection[];
  readingMinutes: number;
  publishedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type ContentInsightInput = {
  title: string;
  slug: string;
  description: string;
  excerpt?: string;
  status: ContentInsightStatus;
  language: ContentInsightLanguage;
  tags: string[];
  sections: ContentInsightSection[];
  readingMinutes?: number;
  publishedAt?: string | null;
};

export type AdminContentInsightsResult = {
  insights: ContentInsight[];
  total: number;
  page: number;
  limit: number;
  summary: {
    published: number;
    draft: number;
    archived: number;
    total: number;
  };
};
