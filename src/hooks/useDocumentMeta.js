import { useEffect } from 'react';

// Actualiza <title> y <meta> tags al vuelo (client-side). Útil para que cuando
// el usuario comparta el link tras haber navegado, el HEAD refleje la página
// actual. Limitación: el primer load (cuando un crawler scrapea la URL) sigue
// trayendo los meta del index.html — para SSR de los slugs habría que mover a
// Vercel rendering o pre-rendering por slug.

const setMeta = (selector, attr, value) => {
  if (!value) return;
  let el = document.head.querySelector(selector);
  if (!el) {
    el = document.createElement('meta');
    const [type, key] = selector.replace(/[[\]"']/g, '').split('=');
    el.setAttribute(type === 'meta[name' ? 'name' : 'property', key);
    document.head.appendChild(el);
  }
  el.setAttribute(attr, value);
};

export function useDocumentMeta({
  title,
  description,
  image,
  url,
  themeColor,
  type = 'website',
} = {}) {
  useEffect(() => {
    const previousTitle = document.title;
    if (title) document.title = title;

    setMeta('meta[name="description"]', 'content', description);
    setMeta('meta[property="og:title"]', 'content', title);
    setMeta('meta[property="og:description"]', 'content', description);
    setMeta('meta[property="og:image"]', 'content', image);
    setMeta('meta[property="og:url"]', 'content', url || (typeof window !== 'undefined' ? window.location.href : ''));
    setMeta('meta[property="og:type"]', 'content', type);
    setMeta('meta[name="twitter:card"]', 'content', image ? 'summary_large_image' : 'summary');
    setMeta('meta[name="twitter:title"]', 'content', title);
    setMeta('meta[name="twitter:description"]', 'content', description);
    setMeta('meta[name="twitter:image"]', 'content', image);

    if (themeColor) {
      let theme = document.head.querySelector('meta[name="theme-color"]');
      if (!theme) {
        theme = document.createElement('meta');
        theme.setAttribute('name', 'theme-color');
        document.head.appendChild(theme);
      }
      theme.setAttribute('content', themeColor);
    }

    return () => {
      document.title = previousTitle;
    };
  }, [title, description, image, url, themeColor, type]);
}
