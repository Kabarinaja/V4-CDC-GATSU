import React from 'react';
import { Link } from 'react-router-dom';
import { sanitizeEditorialHtml } from '../lib/sanitize';
import { useDocumentHead } from '../lib/useDocumentHead';
import type { PortalSettings } from '../types';

export type EditorialPageType =
  | 'about'
  | 'contact'
  | 'privacy'
  | 'cyber-guidelines';

interface EditorialStaticPageProps {
  pageType: EditorialPageType;
  settings: PortalSettings;
  demoSuffix: string;
}

const PAGE_META: Record<
  EditorialPageType,
  { title: string; subtitle: string; field: keyof PortalSettings }
> = {
  about: {
    title: 'Tentang Redaksi',
    subtitle: 'Profil, visi jurnalistik, dan komitmen independensi GATSU WEWARAH.',
    field: 'editorialAboutHtml',
  },
  contact: {
    title: 'Kontak Redaksi',
    subtitle: 'Saluran resmi pengiriman siaran pers, hak jawab, dan kerja sama iklan.',
    field: 'editorialContactHtml',
  },
  privacy: {
    title: 'Kebijakan Privasi',
    subtitle: 'Komitmen perlindungan data pembaca di portal GATSU WEWARAH.',
    field: 'privacyPolicyHtml',
  },
  'cyber-guidelines': {
    title: 'Pedoman Media Siber',
    subtitle: 'Standar tata kelola pemberitaan daring mengacu pada ketentuan Dewan Pers.',
    field: 'cyberMediaGuidelinesHtml',
  },
};

export const EditorialStaticPage: React.FC<EditorialStaticPageProps> = ({
  pageType,
  settings,
  demoSuffix,
}) => {
  const meta = PAGE_META[pageType];
  const rawHtml = String(settings[meta.field] || '');
  const cleanHtml = sanitizeEditorialHtml(rawHtml);

  useDocumentHead({
    title: `${meta.title} — GATSU WEWARAH`,
    description: meta.subtitle,
  });

  return (
    <div className="max-w-[820px] mx-auto px-4 sm:px-6 pt-8 pb-6">
      <nav aria-label="Breadcrumb" className="text-xs text-stone-500 mb-4">
        <Link to={`/gatsuwewarah${demoSuffix}`} className="hover:text-neutral-950">
          Beranda
        </Link>{' '}
        / <span className="text-neutral-950 font-medium">{meta.title}</span>
      </nav>

      <header className="border-b-2 border-neutral-950 pb-5 mb-8">
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-neutral-950">
          {meta.title}
        </h1>
        <p className="text-sm sm:text-base text-stone-600 mt-2">{meta.subtitle}</p>
      </header>

      <div
        className="gatsu-prose max-w-2xl"
        dangerouslySetInnerHTML={{ __html: cleanHtml }}
      />
    </div>
  );
};
