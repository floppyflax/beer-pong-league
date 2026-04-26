/**
 * LivePagePreview — embed the real app route inside an iframe.
 *
 * Same-origin iframe so it inherits the user's auth + data. The page rendered
 * is exactly what the user sees in production at the same URL — no mocks, no
 * drift. For pages requiring an `:id` (event, league, player), pass a real id
 * from the user's data via `url`.
 *
 * Note: nested `<Router>` would crash (react-router-dom) — that's why we use
 * an iframe rather than mounting the page component directly.
 */

import { useState } from "react";

export interface LivePagePreviewProps {
  /** Path-only URL like `/events` or `/event/abc-123`. Same origin as the parent. */
  url: string;
  /** Iframe height — defaults to 812px (iPhone). */
  height?: number;
}

export function LivePagePreview({ url, height = 812 }: LivePagePreviewProps) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div
      className="relative w-full bg-navy"
      style={{ height }}
      aria-busy={!loaded}
    >
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center text-cool-gray text-xs font-mono uppercase tracking-widest">
          Chargement…
        </div>
      )}
      <iframe
        src={url}
        title={`Preview ${url}`}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        className="w-full h-full border-0 bg-navy"
        // sandbox: allow scripts (own origin) + same-origin so the iframe shares
        // localStorage + Supabase session with the parent. We do NOT allow
        // top-level navigation from inside the frame.
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
      />
    </div>
  );
}
