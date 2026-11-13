import { useEffect } from 'react';
import logoFaviconImg from '../assets/logo-favicon.png';

interface DocumentHeadOptions {
  title: string;
  description: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'profile';
  jsonLd?: Record<string, unknown>;
}

function upsertMeta(attrName: 'name' | 'property', key: string, content: string) {
  let el = document.querySelector<HTMLMetaElement>(`meta[${attrName}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attrName, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertLink(rel: string, href: string, type?: string) {
  let el = document.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  if (type) el.setAttribute('type', type);
  el.setAttribute('href', href);
}

export function useDocumentHead(options: DocumentHeadOptions) {
  useEffect(() => {
    document.title = options.title;
    const currentUrl =
      options.url || (typeof window !== 'undefined' ? window.location.href : '');

    upsertMeta('name', 'description', options.description);
    upsertMeta('property', 'og:title', options.title);
    upsertMeta('property', 'og:description', options.description);
    upsertMeta('property', 'og:type', options.type || 'website');
    if (currentUrl) {
      upsertMeta('property', 'og:url', currentUrl);
      upsertLink('canonical', currentUrl);
    }
    if (options.image) {
      upsertMeta('property', 'og:image', options.image);
      upsertMeta('name', 'twitter:image', options.image);
    }
    upsertMeta('name', 'twitter:card', 'summary_large_image');
    upsertLink('icon', logoFaviconImg, 'image/png');

    const scriptId = 'gatsu-wewarah-jsonld';
    const existingScript = document.getElementById(scriptId);
    if (options.jsonLd) {
      const script =
        existingScript ||
        (() => {
          const s = document.createElement('script');
          s.id = scriptId;
          s.type = 'application/ld+json';
          document.head.appendChild(s);
          return s;
        })();
      script.textContent = JSON.stringify(options.jsonLd);
    } else if (existingScript) {
      existingScript.remove();
    }
  }, [
    options.title,
    options.description,
    options.image,
    options.url,
    options.type,
    options.jsonLd,
  ]);
}
