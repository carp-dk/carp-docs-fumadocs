import { ImageResponse } from 'takumi-js/response';

// Brand ink (T10) background, primary blue tones for text, and the accent red for the
// isotype and the identity bar, as on the site.
const og = { background: '#001d32', title: '#e7f2ff', description: '#b0c9e7', muted: '#94ccff', brand: '#d61d41' };

/** A 1200×630 PNG social card for a docs page. */
export function generateOGImage({ title, description, section, site, domain }: { title: string; description?: string; section?: string; site: string; domain: string }) {
  return new ImageResponse(
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', padding: '56px 64px', backgroundColor: og.background, color: og.title, borderBottom: `12px solid ${og.brand}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        {/* CARP isotype */}
        <svg width="76" height="40" viewBox="0 0 38 20">
          <path fill={og.brand} d="M28.4426 0H9.47791V9.64124C9.47791 14.9637 13.7211 19.2825 18.9603 19.2825H28.4426C33.6774 19.2825 37.925 14.9682 37.925 9.64124C37.925 4.3188 33.6818 0 28.4426 0Z" />
          <path fill={og.brand} d="M9.48236 9.64124C9.48236 4.3188 5.23473 0 0 0V19.2825C5.23473 19.2825 9.48236 14.9682 9.48236 9.64124Z" />
          <path fill="#ffffff" d="M32.5409 8.27407H29.0705V4.75H26.3861V8.27407H22.9156V11.0034H26.3861V14.532H29.0705V11.0034H32.5409V8.27407Z" />
        </svg>
        <p style={{ margin: 0, fontSize: 36, fontWeight: 600 }}>{site}</p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', marginTop: 'auto', marginBottom: 'auto' }}>
        {section && <p style={{ margin: 0, marginBottom: 16, fontSize: 30, fontWeight: 600, color: og.muted, textTransform: 'uppercase', letterSpacing: 2 }}>{section}</p>}
        <p style={{ margin: 0, fontSize: 72, fontWeight: 700, lineHeight: 1.1 }}>{title}</p>
        {description && <p style={{ margin: 0, marginTop: 24, fontSize: 34, lineHeight: 1.35, color: og.description }}>{description}</p>}
      </div>
      <p style={{ margin: 0, fontSize: 28, color: og.muted }}>{domain}</p>
    </div>,
    { width: 1200, height: 630, format: 'png', headers: { 'cache-control': 'public, max-age=86400, s-maxage=604800' } },
  );
}
