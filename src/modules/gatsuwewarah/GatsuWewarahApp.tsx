import React, { useCallback, useEffect, useState } from 'react';
import { Navigate, Outlet, Route, Routes, useSearchParams } from 'react-router-dom';
import './styles/editorial.css';
import { GatsuAuthProvider, useGatsuAuth } from './context/GatsuAuthContext';
import {
  DEFAULT_PORTAL_SETTINGS,
  fetchActiveAdsPublic,
  fetchAllAdsAdmin,
  fetchAllArticlesAdmin,
  fetchAuthors,
  fetchCategories,
  fetchPortalSettings,
  fetchPublishedArticles,
  publishDueScheduledArticles,
} from './services/firestoreService';
import {
  TRANSIENT_DEMO_ARTICLES,
  TRANSIENT_DEMO_AUTHORS,
  TRANSIENT_DEMO_CATEGORIES,
} from './utils/demoPreview';
import type {
  Advertisement,
  Article,
  Author,
  Category,
  PortalSettings,
} from './types';
import { EditorialHeader } from './components/EditorialHeader';
import { EditorialFooter } from './components/EditorialFooter';
import { HomePage } from './pages/HomePage';
import { ArticleDetailPage } from './pages/ArticleDetailPage';
import { CategoryPage } from './pages/CategoryPage';
import { AuthorProfilePage } from './pages/AuthorProfilePage';
import { EditorialStaticPage } from './pages/EditorialStaticPage';
import { AdminLoginPage } from './pages/admin/AdminLoginPage';
import { AdminLayout } from './pages/admin/AdminLayout';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminArticlesPage } from './pages/admin/AdminArticlesPage';
import { AdminArticleEditorPage } from './pages/admin/AdminArticleEditorPage';
import { AdminCategoriesPage } from './pages/admin/AdminCategoriesPage';
import { AdminAuthorsPage } from './pages/admin/AdminAuthorsPage';
import { AdminAdsPage } from './pages/admin/AdminAdsPage';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage';

interface PublicShellProps {
  categories: Category[];
  settings: PortalSettings;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  demoSuffix: string;
}

const PublicShell: React.FC<PublicShellProps> = ({
  categories,
  settings,
  searchQuery,
  onSearchChange,
  demoSuffix,
}) => (
  <div className="min-h-screen flex flex-col bg-[#F8F8F7] text-neutral-900 font-sans antialiased">
    <EditorialHeader
      categories={categories}
      searchQuery={searchQuery}
      onSearchChange={onSearchChange}
      demoSuffix={demoSuffix}
    />
    <main className="flex-1">
      <Outlet />
    </main>
    <EditorialFooter
      categories={categories}
      settings={settings}
      demoSuffix={demoSuffix}
    />
  </div>
);

const AdminRouterGuard: React.FC = () => {
  const { isAdmin, loading } = useGatsuAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F8F7] text-sm text-stone-600">
        Memeriksa sesi redaksi...
      </div>
    );
  }

  if (!isAdmin) {
    return <AdminLoginPage />;
  }

  return <AdminLayout />;
};

const GatsuWewarahContent: React.FC = () => {
  const { isAdmin } = useGatsuAuth();
  const [searchParams] = useSearchParams();
  const isDemoMode = searchParams.get('demo') === '1';
  const demoSuffix = isDemoMode ? '?demo=1' : '';

  const [publicArticles, setPublicArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [publicAds, setPublicAds] = useState<Advertisement[]>([]);
  const [settings, setSettings] = useState<PortalSettings>(
    DEFAULT_PORTAL_SETTINGS
  );
  const [loadingPublic, setLoadingPublic] = useState(true);
  const [publicError, setPublicError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Admin state
  const [adminArticles, setAdminArticles] = useState<Article[]>([]);
  const [adminAds, setAdminAds] = useState<Advertisement[]>([]);
  const [loadingAdmin, setLoadingAdmin] = useState(false);

  const loadPublicData = useCallback(async () => {
    if (isDemoMode) {
      setPublicArticles(TRANSIENT_DEMO_ARTICLES);
      setCategories(TRANSIENT_DEMO_CATEGORIES);
      setAuthors(TRANSIENT_DEMO_AUTHORS);
      setPublicAds([]);
      setSettings(DEFAULT_PORTAL_SETTINGS);
      setPublicError(null);
      setLoadingPublic(false);
      return;
    }

    setLoadingPublic(true);
    setPublicError(null);
    try {
      const [arts, cats, auths, ads, portalSet] = await Promise.all([
        fetchPublishedArticles(60),
        fetchCategories(),
        fetchAuthors(),
        fetchActiveAdsPublic(),
        fetchPortalSettings(),
      ]);
      setPublicArticles(arts);
      setCategories(cats);
      setAuthors(auths);
      setPublicAds(ads);
      setSettings(portalSet);
    } catch (err) {
      setPublicError(
        err instanceof Error ? err.message : 'Gagal memuat data portal.'
      );
      setPublicArticles([]);
    } finally {
      setLoadingPublic(false);
    }
  }, [isDemoMode]);

  const loadAdminData = useCallback(async () => {
    if (!isAdmin) return;
    setLoadingAdmin(true);
    try {
      await publishDueScheduledArticles().catch(() => 0);
      const [allArts, cats, auths, allAds, portalSet] = await Promise.all([
        fetchAllArticlesAdmin(),
        fetchCategories(),
        fetchAuthors(),
        fetchAllAdsAdmin(),
        fetchPortalSettings(),
      ]);
      setAdminArticles(allArts);
      setCategories(cats);
      setAuthors(auths);
      setAdminAds(allAds);
      setSettings(portalSet);
      // Keep public snapshot in sync after admin edits
      setPublicArticles(allArts.filter((a) => a.status === 'published'));
      setPublicAds(allAds.filter((ad) => ad.active));
    } catch {
      // Handled gracefully by individual admin pages
    } finally {
      setLoadingAdmin(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    void loadPublicData();
  }, [loadPublicData]);

  useEffect(() => {
    if (isAdmin) {
      void loadAdminData();
    }
  }, [isAdmin, loadAdminData]);

  return (
    <Routes>
      {/* Public Portal Routes */}
      <Route
        element={
          <PublicShell
            categories={categories}
            settings={settings}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            demoSuffix={demoSuffix}
          />
        }
      >
        <Route
          index
          element={
            <HomePage
              articles={publicArticles}
              categories={categories}
              ads={publicAds}
              settings={settings}
              loading={loadingPublic}
              error={publicError}
              searchQuery={searchQuery}
              onClearSearch={() => setSearchQuery('')}
              isDemoMode={isDemoMode}
              demoSuffix={demoSuffix}
            />
          }
        />
        <Route
          path="berita/:slug"
          element={
            <ArticleDetailPage
              articles={publicArticles}
              ads={publicAds}
              isDemoMode={isDemoMode}
              demoSuffix={demoSuffix}
            />
          }
        />
        <Route
          path="kategori/:slug"
          element={
            <CategoryPage
              articles={publicArticles}
              categories={categories}
              ads={publicAds}
              loading={loadingPublic}
              demoSuffix={demoSuffix}
            />
          }
        />
        <Route
          path="penulis/:authorId"
          element={
            <AuthorProfilePage
              articles={publicArticles}
              authors={authors}
              isDemoMode={isDemoMode}
              demoSuffix={demoSuffix}
            />
          }
        />
        <Route
          path="tentang-redaksi"
          element={
            <EditorialStaticPage
              pageType="about"
              settings={settings}
              demoSuffix={demoSuffix}
            />
          }
        />
        <Route
          path="kontak-redaksi"
          element={
            <EditorialStaticPage
              pageType="contact"
              settings={settings}
              demoSuffix={demoSuffix}
            />
          }
        />
        <Route
          path="kebijakan-privasi"
          element={
            <EditorialStaticPage
              pageType="privacy"
              settings={settings}
              demoSuffix={demoSuffix}
            />
          }
        />
        <Route
          path="pedoman-media-siber"
          element={
            <EditorialStaticPage
              pageType="cyber-guidelines"
              settings={settings}
              demoSuffix={demoSuffix}
            />
          }
        />
      </Route>

      {/* Protected Admin Routes (/gatsuwewarah/admin/*) */}
      <Route path="admin" element={<AdminRouterGuard />}>
        <Route
          index
          element={
            <AdminDashboardPage
              articles={adminArticles}
              categories={categories}
              authors={authors}
              ads={adminAds}
              loading={loadingAdmin}
              onRefresh={loadAdminData}
            />
          }
        />
        <Route
          path="tulis"
          element={
            <AdminArticleEditorPage
              categories={categories}
              authors={authors}
              onSaved={loadAdminData}
            />
          }
        />
        <Route
          path="edit/:articleId"
          element={
            <AdminArticleEditorPage
              categories={categories}
              authors={authors}
              onSaved={loadAdminData}
            />
          }
        />
        <Route
          path="berita"
          element={
            <AdminArticlesPage
              articles={adminArticles}
              filterStatus="all"
              loading={loadingAdmin}
              onRefresh={loadAdminData}
            />
          }
        />
        <Route
          path="draft"
          element={
            <AdminArticlesPage
              articles={adminArticles}
              filterStatus="draft"
              loading={loadingAdmin}
              onRefresh={loadAdminData}
            />
          }
        />
        <Route
          path="terjadwal"
          element={
            <AdminArticlesPage
              articles={adminArticles}
              filterStatus="scheduled"
              loading={loadingAdmin}
              onRefresh={loadAdminData}
            />
          }
        />
        <Route
          path="kategori"
          element={
            <AdminCategoriesPage
              categories={categories}
              onRefresh={loadAdminData}
            />
          }
        />
        <Route
          path="penulis"
          element={
            <AdminAuthorsPage authors={authors} onRefresh={loadAdminData} />
          }
        />
        <Route
          path="iklan"
          element={
            <AdminAdsPage
              ads={adminAds}
              categories={categories}
              articles={adminArticles}
              onRefresh={loadAdminData}
            />
          }
        />
        <Route
          path="pengaturan"
          element={
            <AdminSettingsPage
              settings={settings}
              onRefresh={loadAdminData}
            />
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/gatsuwewarah" replace />} />
    </Routes>
  );
};

export const GatsuWewarahApp: React.FC = () => {
  return (
    <GatsuAuthProvider>
      <GatsuWewarahContent />
    </GatsuAuthProvider>
  );
};

export default GatsuWewarahApp;
