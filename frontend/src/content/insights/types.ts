export type InsightArticle = {
  slug: string;
  title: string;
  description: string;
  datePublished: string;
  dateModified?: string;
  keywords: string[];
  readingMinutes: number;
  /** Plain paragraphs for the article body. */
  sections: Array<{
    heading: string;
    paragraphs: string[];
  }>;
};
