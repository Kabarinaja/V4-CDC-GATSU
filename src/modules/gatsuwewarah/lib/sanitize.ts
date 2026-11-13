import DOMPurify from 'dompurify';

const ALLOWED_TAGS = [
  'p',
  'h1',
  'h2',
  'h3',
  'h4',
  'strong',
  'b',
  'em',
  'i',
  'u',
  's',
  'blockquote',
  'ul',
  'ol',
  'li',
  'a',
  'img',
  'figure',
  'figcaption',
  'caption',
  'hr',
  'br',
  'table',
  'thead',
  'tbody',
  'tfoot',
  'tr',
  'th',
  'td',
  'div',
  'span',
];

const ALLOWED_ATTR = [
  'href',
  'target',
  'rel',
  'src',
  'alt',
  'title',
  'class',
  'style',
  'colspan',
  'rowspan',
  'width',
  'height',
  'loading',
  'referrerpolicy',
];

function sanitizeFallbackForServer(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
    .replace(/<object[\s\S]*?<\/object>/gi, '')
    .replace(/<embed[\s\S]*?>/gi, '')
    .replace(/\son\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/javascript:/gi, '');
}

let hooksConfigured = false;

export function sanitizeEditorialHtml(dirtyHtml: string): string {
  if (!dirtyHtml) return '';

  // In browser environments DOMPurify.sanitize is directly available
  if (typeof window !== 'undefined' && typeof DOMPurify.sanitize === 'function') {
    if (!hooksConfigured) {
      DOMPurify.addHook('afterSanitizeAttributes', (node) => {
        if (node.tagName === 'A') {
          const href = node.getAttribute('href') || '';
          if (href && !href.startsWith('/') && !href.startsWith('#')) {
            node.setAttribute('target', '_blank');
            node.setAttribute('rel', 'noopener noreferrer');
          }
        }
        if (node.tagName === 'IMG') {
          node.setAttribute('loading', 'lazy');
          node.setAttribute('referrerpolicy', 'no-referrer');
        }
      });
      hooksConfigured = true;
    }

    return DOMPurify.sanitize(dirtyHtml, {
      ALLOWED_TAGS,
      ALLOWED_ATTR,
      ALLOW_DATA_ATTR: false,
      ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel):|[^a-z]|[a-z+.-]+(?:[^a-z+.-:]|$))/i,
    });
  }

  // Fallback for Node.js unit-test or SSR context without DOM window
  return sanitizeFallbackForServer(dirtyHtml);
}
