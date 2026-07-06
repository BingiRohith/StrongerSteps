'use client';

import { useState } from 'react';
import { MessageCircle, Facebook, Linkedin, Twitter, Link2, Check } from 'lucide-react';

/**
 * Social share row for the blog detail page. Reads the current page URL
 * client-side (`window.location.href`) rather than relying on a
 * `NEXT_PUBLIC_SITE_URL` env var that doesn't exist in this project yet, so
 * it works correctly in any environment (localhost, staging, production)
 * with zero configuration.
 */
export default function ShareButtons({ title }) {
  const [copied, setCopied] = useState(false);

  function getUrl() {
    if (typeof window === 'undefined') return '';
    return window.location.href;
  }

  async function handleCopy() {
    const url = getUrl();
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable (older browser / non-HTTPS) — silently no-op,
      // the visible URL bar is the fallback.
    }
  }

  function openShareWindow(shareUrl) {
    window.open(shareUrl, '_blank', 'noopener,noreferrer,width=600,height=500');
  }

  const shareText = title || 'Check out this article from Stronger Steps';

  const links = [
    {
      label: 'Share on WhatsApp',
      icon: MessageCircle,
      onClick: () =>
        openShareWindow(`https://wa.me/?text=${encodeURIComponent(`${shareText} ${getUrl()}`)}`),
    },
    {
      label: 'Share on X',
      icon: Twitter,
      onClick: () =>
        openShareWindow(
          `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(getUrl())}`
        ),
    },
    {
      label: 'Share on Facebook',
      icon: Facebook,
      onClick: () =>
        openShareWindow(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(getUrl())}`),
    },
    {
      label: 'Share on LinkedIn',
      icon: Linkedin,
      onClick: () =>
        openShareWindow(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(getUrl())}`),
    },
  ];

  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="font-display text-sm font-semibold text-primary-dark">Share this article</span>
      <div className="flex items-center gap-2">
        {links.map(({ label, icon: Icon, onClick }) => (
          <button
            key={label}
            type="button"
            onClick={onClick}
            aria-label={label}
            title={label}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-white text-primary-dark transition-colors hover:border-primary hover:bg-sage"
          >
            <Icon size={16} aria-hidden="true" />
          </button>
        ))}
        <button
          type="button"
          onClick={handleCopy}
          aria-label="Copy link"
          title="Copy link"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-white text-primary-dark transition-colors hover:border-primary hover:bg-sage"
        >
          {copied ? <Check size={16} aria-hidden="true" /> : <Link2 size={16} aria-hidden="true" />}
        </button>
        {copied && <span className="text-xs font-semibold text-primary">Link copied!</span>}
      </div>
    </div>
  );
}
