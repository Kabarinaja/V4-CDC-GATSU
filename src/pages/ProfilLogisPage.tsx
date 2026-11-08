import React, { useEffect } from 'react';
import { ArrowLeft, BriefcaseBusiness, CalendarDays, Code2, MapPin, MessageCircle, MonitorCog, UserRound } from 'lucide-react';
import { Link } from 'react-router-dom';

const SITE = 'https://www.dicelupayamcrispy.store';
const PAGE_URL = `${SITE}/profil-logis`;
const PHOTO_URL = `${SITE}/images/gambar-logis.png`;

function useProfileSeo() {
  useEffect(() => {
    const title = 'Logis Denis Prabowo | Pendiri Website & Web Developer D’CELUP CHICKEN CRISPY GATSU';
    const description = 'Mengenal Logis Denis Prabowo, pendiri dan pengembang website D’CELUP CHICKEN CRISPY GATSU, sekaligus administrator platform digital dan bagian dari tim usaha di Indramayu.';
    document.title = title;

    const setMeta = (selector: string, attr: string, value: string) => {
      let element = document.head.querySelector(selector) as HTMLMetaElement | null;
      if (!element) {
        element = document.createElement('meta');
        const [key, val] = selector.match(/\[(name|property)="([^"]+)"\]/)?.slice(1) || [];
        if (key && val) element.setAttribute(key, val);
        document.head.appendChild(element);
      }
      element.setAttribute(attr, value);
    };
    setMeta('meta[name="description"]', 'content', description);
    setMeta('meta[property="og:type"]', 'content', 'profile');
    setMeta('meta[property="og:title"]', 'content', title);
    setMeta('meta[property="og:description"]', 'content', description);
    setMeta('meta[property="og:url"]', 'content', PAGE_URL);
    setMeta('meta[property="og:image"]', 'content', PHOTO_URL);
    setMeta('meta[name="twitter:card"]', 'content', 'summary_large_image');

    let canonical = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = PAGE_URL;

    const schema = {
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: 'Logis Denis Prabowo',
      image: PHOTO_URL,
      url: PAGE_URL,
      birthDate: '2008-02-08',
      address: { '@type': 'PostalAddress', addressLocality: 'Indramayu', addressRegion: 'Jawa Barat', addressCountry: 'ID' },
      jobTitle: ['Website Founder', 'Web Developer', 'Website Administrator'],
      worksFor: { '@type': 'Organization', name: 'D’CELUP CHICKEN CRISPY GATSU', url: SITE },
      telephone: '+6282379474173',
      description,
    };
    let script = document.getElementById('profile-person-schema');
    if (!script) {
      script = document.createElement('script');
      script.id = 'profile-person-schema';
      script.setAttribute('type', 'application/ld+json');
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(schema);
    return () => { document.getElementById('profile-person-schema')?.remove(); };
  }, []);
}

const facts = [
  { icon: UserRound, label: 'Nama lengkap', value: 'Logis Denis Prabowo' },
  { icon: CalendarDays, label: 'Tanggal lahir', value: '8 Februari 2008' },
  { icon: MapPin, label: 'Domisili', value: 'Indramayu, Jawa Barat' },
  { icon: BriefcaseBusiness, label: 'Peran', value: 'Pendiri website, web developer, administrator, dan bagian dari tim usaha' },
];

export const ProfilLogisPage: React.FC = () => {
  useProfileSeo();
  return (
    <div className="min-h-screen bg-[#f7f7f5] text-zinc-900">
      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8 lg:py-12">
        <Link to="/" className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:border-amber-400 hover:text-zinc-950">
          <ArrowLeft size={16} /> Kembali ke beranda
        </Link>

        <section className="mt-8 overflow-hidden rounded-[2rem] bg-white shadow-sm ring-1 ring-zinc-200/70">
          <div className="grid lg:grid-cols-[0.9fr_1.1fr]">
            <div className="relative min-h-[340px] bg-gradient-to-br from-sky-950 via-blue-900 to-slate-800 sm:min-h-[460px]">
              <img src="/images/gambar-logis.png" alt="Foto profil Logis Denis Prabowo, web developer D’CELUP CHICKEN CRISPY GATSU" className="absolute inset-0 h-full w-full object-cover object-center" fetchPriority="high" />
            </div>
            <div className="flex flex-col justify-center p-7 sm:p-10 lg:p-14">
              <span className="text-xs font-extrabold uppercase tracking-[0.22em] text-amber-600">Profil tim digital</span>
              <h1 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl">Logis Denis Prabowo</h1>
              <p className="mt-3 text-base font-semibold text-zinc-500 sm:text-lg">Pendiri Website · Web Developer · Administrator</p>
              <p className="mt-6 max-w-2xl text-sm leading-7 text-zinc-600 sm:text-base sm:leading-8">
                Berkenalan dengan sosok di balik pengembangan dan pengelolaan website resmi D’CELUP CHICKEN CRISPY GATSU. Berangkat dari ketertarikan pada teknologi, Logis mengambil peran dalam membangun dan merawat kehadiran digital usaha ini.
              </p>
              <a href="https://wa.me/6282379474173" target="_blank" rel="noreferrer" className="mt-8 inline-flex w-fit items-center gap-2 rounded-full bg-[#16834b] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#116b3d]">
                <MessageCircle size={18} /> Hubungi melalui WhatsApp
              </a>
            </div>
          </div>
        </section>

        <div className="mt-7 grid gap-7 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-[1.75rem] bg-white p-7 shadow-sm ring-1 ring-zinc-200/70 sm:p-9">
            <div className="flex items-center gap-3"><span className="rounded-xl bg-amber-50 p-3 text-amber-700"><Code2 size={22} /></span><h2 className="text-xl font-extrabold sm:text-2xl">Tentang Logis</h2></div>
            <div className="mt-5 space-y-4 text-sm leading-7 text-zinc-600 sm:text-base sm:leading-8">
              <p>Logis Denis Prabowo merupakan pengembang website dan administrator platform digital D’CELUP CHICKEN CRISPY GATSU yang berdomisili di Indramayu, Jawa Barat.</p>
              <p>Dalam perannya, Logis terlibat dalam pembangunan, pengembangan, dan pemeliharaan website, termasuk pengelolaan fitur serta administrasi sistem agar pelanggan dapat mengakses layanan digital usaha dengan lebih mudah.</p>
              <p>Selain bertanggung jawab pada sisi teknologi, Logis juga menjadi bagian dari tim usaha dalam kegiatan sehari-hari. Peran tersebut memberinya kesempatan untuk memahami kebutuhan operasional sekaligus mengembangkan sarana digital yang mendukung pelayanan kepada pelanggan.</p>
              <p>Baginya, teknologi adalah sarana untuk menghadirkan solusi yang berguna dan membantu sebuah usaha terus berkembang.</p>
            </div>
          </section>
          <aside className="rounded-[1.75rem] bg-white p-7 shadow-sm ring-1 ring-zinc-200/70 sm:p-9">
            <div className="flex items-center gap-3"><span className="rounded-xl bg-zinc-100 p-3 text-zinc-700"><UserRound size={22} /></span><h2 className="text-xl font-extrabold">Informasi profil</h2></div>
            <dl className="mt-6 divide-y divide-zinc-100">
              {facts.map(({ icon: Icon, label, value }) => <div key={label} className="flex gap-3 py-4 first:pt-0"><Icon size={18} className="mt-1 shrink-0 text-amber-600" /><div><dt className="text-xs font-semibold uppercase tracking-wide text-zinc-400">{label}</dt><dd className="mt-1 text-sm font-semibold leading-6 text-zinc-800">{value}</dd></div></div>)}
            </dl>
            <div className="mt-4 rounded-2xl bg-amber-50 p-4"><div className="flex items-center gap-2 text-sm font-bold text-amber-900"><MonitorCog size={17} /> Fokus kontribusi</div><p className="mt-2 text-sm leading-6 text-amber-900/80">Pengembangan website, pengelolaan sistem digital, dan dukungan operasional usaha.</p></div>
          </aside>
        </div>

        <section className="mt-7 rounded-[1.75rem] bg-zinc-900 p-7 text-white sm:p-9">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-400">Bagian dari satu tim</p>
          <h2 className="mt-3 text-2xl font-extrabold">Mengenal pemilik usaha</h2>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-zinc-300">Website ini dikembangkan untuk mendukung usaha D’CELUP CHICKEN CRISPY GATSU yang dimiliki oleh Edy Saputra.</p>
          <Link to="/profil-owner" className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-bold text-zinc-900 transition hover:bg-amber-100">Lihat profil Edy Saputra <ArrowLeft className="rotate-180" size={16} /></Link>
        </section>
        <p className="mt-8 text-center text-xs text-zinc-400">Profil individu · D’CELUP CHICKEN CRISPY GATSU · Indramayu, Jawa Barat</p>
      </div>
    </div>
  );
};
