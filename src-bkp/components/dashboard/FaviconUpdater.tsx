'use client';

import { useEffect } from 'react';

export default function FaviconUpdater() {
  useEffect(() => {
    async function updateFavicon() {
      try {
        const res = await fetch('https://api.onechatai.ai/api/settings/favicon', {
          cache: 'no-store',
        });
        const data = await res.json();
        const faviconUrl = data?.data?.value || '/favicon.ico';

        let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
        if (!link) {
          link = document.createElement('link');
          link.rel = 'icon';
          document.head.appendChild(link);
        }
        link.href = faviconUrl;
      } catch (err) {
        console.error('❌ Failed to update favicon:', err);
      }
    }

    updateFavicon();
  }, []);

  return null;
}
