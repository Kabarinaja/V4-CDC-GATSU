import React, { useEffect } from 'react';
import { ArrowLeft, BriefcaseBusiness, CalendarDays, MapPin, MessageCircle, Store, UserRound } from 'lucide-react';
import { Link } from 'react-router-dom';

const SITE = 'https://www.dicelupayamcrispy.store';
const PAGE_URL = `${SITE}/profil-owner`;
const PHOTO_URL = `${SITE}/images/gambar-owner.jpg`;

function useProfileSeo() {
  useEffect(() => {
    const title = 'Edy Saputra | Pemilik D’CELUP CHICKEN CRISPY GATSU';
    const description = 'Mengenal Edy Saputra, pemilik usaha D’CELUP CHICKEN CRISPY GATSU di Indramayu, Jawa Barat. Lahir di Bangka Belitung dan kini menetap di Indramayu.';
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
    if (!canonical) { canonical = document.createElement('link'); canonical.rel = 'canonical'; document.head.appendChild(canonical); }
    canonical.href = PAGE_URL;
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: 'Edy Saputra',
      image: PHOTO_URL,
      url: PAGE_URL,
      birthDate: '1987-12-04',
      birthPlace: { '@type': 'Place', name: 'Bangka Belitung, Indonesia' },
      address: { '@type': 'PostalAddress', addressLocality: 'Indramayu', addressRegion: 'Jawa Barat', addressCountry: 'ID' },
      jobTitle: 'Owner',
      owns: { '@type': 'LocalBusiness', name: 'D’CELUP CHICKEN CRISPY GATSU', url: SITE, address: { '@type': 'PostalAddress', addressLocality: 'Indramayu', addressRegion: 'Jawa Barat', addressCountry: 'ID' } },
      telephone: '+6281122206660',
      description,
    };
    let script = document.getElementById('profile-person-schema');
    if (!script) { script = document.createElement('script'); script.id = 'profile-person-schema'; script.setAttribute('type', 'application/ld+json'); document.head.appendChild(script); }
    script.textContent = JSON.stringify(schema);
    return () => { document.getElementById('profile-person-schema')?.remove(); };
  }, []);
}

const facts = [
  { icon: UserRound, label: 'Nama lengkap', value: 'Edy Saputra' },
  { icon: CalendarDays, label: 'Tanggal lahir', value: '4 Desember 1987' },
  { icon: MapPin, label: 'Tempat lahir', value: 'Bangka Belitung, Indonesia' },
  { icon: MapPin, label: 'Domisili', value: 'Indramayu, Jawa Barat' },
  { icon: BriefcaseBusiness, label: 'Jabatan', value: 'Pemilik usaha (Owner)' },
];

export const ProfilOwnerPage: React.FC = () => {
  useProfileSeo();
  return (
    <div className="min-h-screen bg-[#f7f7f5] text-zinc-900">
      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8 lg:py-12">
        <Link to="/" className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:border-amber-400 hover:text-zinc-950"><ArrowLeft size={16} /> Kembali ke beranda</Link>
        <section className="mt-8 overflow-hidden rounded-[2rem] bg-white shadow-sm ring-1 ring-zinc-200/70">
          <div className="grid lg:grid-cols-[0.9fr_1.1fr]">
            <div className="relative min-h-[340px] bg-gradient-to-br from-red-950 via-rose-900 to-zinc-800 sm:min-h-[460px]">
              <img src="/images/gambar-owner.jpg" alt="Foto profil Edy Saputra, pemilik D’CELUP CHICKEN CRISPY GATSU" className="absolute inset-0 h-full w-full object-cover object-center" fetchPriority="high" />
            </div>
            <div className="flex flex-col justify-center p-7 sm:p-10 lg:p-14">
              <span className="text-xs font-extrabold uppercase tracking-[0.22em] text-amber-600">Profil pemilik usaha</span>
              <h1 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl">Edy Saputra</h1>
              <p className="mt-3 text-base font-semibold text-zinc-500 sm:text-lg">Owner · D’CELUP CHICKEN CRISPY GATSU</p>
              <p className="mt-6 max-w-2xl text-sm leading-7 text-zinc-600 sm:text-base sm:leading-8">Mengenal pemilik usaha kuliner D’CELUP CHICKEN CRISPY GATSU yang menjalankan dan mengembangkan bisnisnya di Indramayu, Jawa Barat.</p>
              <a href="https://wa.me/6281122206660" target="_blank" rel="noreferrer" className="mt-8 inline-flex w-fit items-center gap-2 rounded-full bg-[#16834b] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#116b3d]"><MessageCircle size={18} /> Hubungi melalui WhatsApp</a>
            </div>
          </div>
        </section>

        <div className="mt-7 grid gap-7 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-[1.75rem] bg-white p-7 shadow-sm ring-1 ring-zinc-200/70 sm:p-9">
            <div className="flex items-center gap-3"><span className="rounded-xl bg-amber-50 p-3 text-amber-700"><Store size={22} /></span><h2 className="text-xl font-extrabold sm:text-2xl">Tentang Edy Saputra</h2></div>
            <div className="mt-5 space-y-4 text-sm leading-7 text-zinc-600 sm:text-base sm:leading-8">
              <p>Edy Saputra merupakan pemilik usaha D’CELUP CHICKEN CRISPY GATSU, sebuah usaha kuliner yang beroperasi di Indramayu, Jawa Barat. Ia lahir pada 4 Desember 1987 di Bangka Belitung dan kini menetap di Indramayu.</p>
              <p>Sebagai pemilik, Edy memegang peran dalam mengarahkan perjalanan usaha, mengambil keputusan bisnis, serta mengawasi pengelolaan kegiatan operasional. Ia berupaya membangun usaha kuliner yang dapat memberikan produk dan pelayanan yang baik kepada pelanggan.</p>
              <p>Dalam menjalankan bisnis, Edy didukung oleh tim yang berkontribusi pada berbagai bidang, mulai dari kegiatan operasional hingga pengelolaan layanan digital. Kolaborasi tersebut menjadi bagian dari upaya menghadirkan pengalaman pemesanan yang semakin mudah bagi pelanggan.</p>
              <p>D’CELUP CHICKEN CRISPY GATSU menjadi usaha yang ia miliki dan kembangkan di tengah masyarakat Indramayu.</p>
            </div>
          </section>
          <aside className="rounded-[1.75rem] bg-white p-7 shadow-sm ring-1 ring-zinc-200/70 sm:p-9">
            <div className="flex items-center gap-3"><span className="rounded-xl bg-zinc-100 p-3 text-zinc-700"><UserRound size={22} /></span><h2 className="text-xl font-extrabold">Informasi profil</h2></div>
            <dl className="mt-6 divide-y divide-zinc-100">
              {facts.map(({ icon: Icon, label, value }) => <div key={label} className="flex gap-3 py-4 first:pt-0"><Icon size={18} className="mt-1 shrink-0 text-amber-600" /><div><dt className="text-xs font-semibold uppercase tracking-wide text-zinc-400">{label}</dt><dd className="mt-1 text-sm font-semibold leading-6 text-zinc-800">{value}</dd></div></div>)}
            </dl>
            <div className="mt-4 rounded-2xl bg-amber-50 p-4"><div className="flex items-center gap-2 text-sm font-bold text-amber-900"><Store size={17} /> Usaha yang dimiliki</div><p className="mt-2 text-sm font-semibold leading-6 text-amber-900">D’CELUP CHICKEN CRISPY GATSU</p><p className="mt-1 text-sm leading-6 text-amber-900/80">Bidang kuliner · Indramayu, Jawa Barat</p></div>
          </aside>
        </div>

        <section className="mt-7 rounded-[1.75rem] bg-zinc-900 p-7 text-white sm:p-9">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-400">Kenali tim kami</p>
          <h2 className="mt-3 text-2xl font-extrabold">Pengembangan website dan layanan digital</h2>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-zinc-300">Website D’CELUP CHICKEN CRISPY GATSU dikembangkan dan dikelola oleh Logis Denis Prabowo sebagai pendiri website, web developer, dan administrator.</p>
          <Link to="/profil-logis" className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-bold text-zinc-900 transition hover:bg-amber-100">Lihat profil Logis Denis Prabowo <ArrowLeft className="rotate-180" size={16} /></Link>
        </section>
        <p className="mt-8 text-center text-xs text-zinc-400">Profil pemilik usaha · D’CELUP CHICKEN CRISPY GATSU · Indramayu, Jawa Barat</p>
      </div>
    </div>
  );
};
