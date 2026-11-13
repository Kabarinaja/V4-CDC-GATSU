import React from 'react';
import { Link } from 'react-router-dom';
import logoHeaderImg from '../assets/logo-header.png';
import type { Category, PortalSettings } from '../types';

interface EditorialFooterProps {
  categories: Category[];
  settings: PortalSettings;
  demoSuffix?: string;
}

export const EditorialFooter: React.FC<EditorialFooterProps> = ({
  categories,
  settings,
  demoSuffix = '',
}) => {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-[#0A0A0A] text-neutral-300 border-t-4 border-red-700 mt-16">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-10 border-b border-neutral-800">
          <div className="md:col-span-5">
            <Link to={`/gatsuwewarah${demoSuffix}`} className="inline-block mb-4">
              <img
                src={logoHeaderImg}
                alt="GATSU WEWARAH"
                className="h-9 w-auto object-contain"
              />
            </Link>
            <p className="text-sm text-neutral-400 leading-relaxed max-w-md">
              {settings.tagline} Portal berita independen yang menyajikan liputan terverifikasi, berita daerah, dan inspirasi usaha untuk pembaca Indonesia.
            </p>
            <div className="mt-5 text-xs text-neutral-500 space-y-1">
              <p>{settings.officeAddress}</p>
              <p>Email: {settings.contactEmail}</p>
            </div>
          </div>

          <div className="md:col-span-3">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-white mb-4">
              Kanal Berita
            </h2>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link
                  to={`/gatsuwewarah${demoSuffix}`}
                  className="text-neutral-400 hover:text-white transition-colors"
                >
                  Beranda
                </Link>
              </li>
              {categories.slice(0, 6).map((cat) => (
                <li key={cat.id}>
                  <Link
                    to={`/gatsuwewarah/kategori/${cat.slug}${demoSuffix}`}
                    className="text-neutral-400 hover:text-white transition-colors"
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-4">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-white mb-4">
              Redaksi &amp; Tata Kelola
            </h2>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link
                  to={`/gatsuwewarah/tentang-redaksi${demoSuffix}`}
                  className="text-neutral-400 hover:text-white transition-colors"
                >
                  Tentang Redaksi
                </Link>
              </li>
              <li>
                <Link
                  to={`/gatsuwewarah/kontak-redaksi${demoSuffix}`}
                  className="text-neutral-400 hover:text-white transition-colors"
                >
                  Kontak Redaksi &amp; Iklan
                </Link>
              </li>
              <li>
                <Link
                  to={`/gatsuwewarah/kebijakan-privasi${demoSuffix}`}
                  className="text-neutral-400 hover:text-white transition-colors"
                >
                  Kebijakan Privasi
                </Link>
              </li>
              <li>
                <Link
                  to={`/gatsuwewarah/pedoman-media-siber${demoSuffix}`}
                  className="text-neutral-400 hover:text-white transition-colors"
                >
                  Pedoman Media Siber
                </Link>
              </li>
              <li>
                <a
                  href="/gatsuwewarah/sitemap.xml"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-neutral-400 hover:text-white transition-colors"
                >
                  Peta Situs (Sitemap XML)
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-neutral-500">
          <p>&copy; {year} GATSU WEWARAH. Seluruh hak cipta dilindungi.</p>
          <div className="flex items-center gap-5">
            <a
              href="https://www.dicelupayamcrispy.store"
              className="hover:text-neutral-300 transition-colors"
            >
              Dicelup Ayam Crispy
            </a>
            <Link
              to="/gatsuwewarah/admin"
              className="hover:text-neutral-300 transition-colors"
            >
              Meja Redaksi
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
