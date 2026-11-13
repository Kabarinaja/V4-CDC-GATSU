export type ArticleStatus = "draft" | "scheduled" | "published" | "archived";
export type NewsImage = { url: string; publicId: string; alt: string; caption?: string; credit?: string };
export type NewsArticle = {
  articleNumber: string; title: string; slug: string; description: string; content: string;
  categoryId: string; authorId: string; authorName?: string; featuredImage: NewsImage;
  seo: { metaTitle: string; metaDescription: string; keywords: string[]; canonicalUrl?: string; socialImage?: string };
  status: ArticleStatus; isFeatured: boolean; viewCount: number;
  createdAt: unknown; updatedAt: unknown; publishedAt: unknown; scheduledAt?: unknown;
};
export type NewsAuthor = { name: string; slug: string; photoUrl: string; photoPublicId?: string; description: string; isActive: boolean };
export type NewsCategory = { name: string; slug: string; description?: string; isActive: boolean };
export const NEWS_CATEGORIES = ["kuliner", "politik", "nusantara", "indramayu", "makanan-khas-daerah"] as const;
