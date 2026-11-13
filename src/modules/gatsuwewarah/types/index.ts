export type ArticleStatus = 'draft' | 'published' | 'scheduled';

export interface Article {
  id: string;
  title: string;
  slug: string;
  summary: string;
  contentHtml: string;
  coverImage: string;
  coverCaption: string;
  categoryId: string;
  categorySlug: string;
  categoryName: string;
  authorId: string;
  authorName: string;
  authorPhoto: string;
  status: ArticleStatus;
  isBreaking: boolean;
  isHeadline: boolean;
  isEditorPick: boolean;
  views: number;
  tags: string[];
  readingTimeMinutes: number;
  publishedAt: string;
  scheduledAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  order: number;
  createdAt: string;
}

export interface Author {
  id: string;
  name: string;
  photoUrl: string;
  bio: string;
  role: string;
  createdAt: string;
}

export type AdPosition =
  | 'home_top'
  | 'home_mid'
  | 'article_in_content'
  | 'article_bottom'
  | 'sidebar';

export type AdTargetScope = 'all' | 'categories' | 'articles';

export interface Advertisement {
  id: string;
  title: string;
  imageUrl: string;
  targetUrl: string;
  targetScope: AdTargetScope;
  targetCategoryIds: string[];
  targetArticleIds: string[];
  position: AdPosition;
  afterParagraph: number;
  startDate: string; // YYYY-MM-DD or ISO
  durationDays: number;
  endDate: string; // ISO
  active: boolean;
  clicks: number;
  createdAt: string;
  updatedAt: string;
}

export interface PortalSettings {
  siteName: string;
  tagline: string;
  breakingLabel: string;
  contactEmail: string;
  contactPhone: string;
  officeAddress: string;
  editorialAboutHtml: string;
  editorialContactHtml: string;
  privacyPolicyHtml: string;
  cyberMediaGuidelinesHtml: string;
  updatedAt: string;
}

export interface DashboardStats {
  totalArticles: number;
  publishedCount: number;
  draftCount: number;
  scheduledCount: number;
  totalViews: number;
  totalCategories: number;
  totalAuthors: number;
  activeAdsCount: number;
}
