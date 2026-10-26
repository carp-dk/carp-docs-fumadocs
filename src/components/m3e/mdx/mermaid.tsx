'use client';

import { useTheme } from 'next-themes';
import { useEffect, useId, useState } from 'react';

// Mermaid is large, so it loads on first use. Diagrams take their colours from the Material
// roles and render again when the colour scheme changes. Until then, and without
// JavaScript, the diagram source is shown instead.
export function Mermaid({ chart }: { chart: string }) {
  const id = `mermaid-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const { resolvedTheme } = useTheme();
  const [svg, setSvg] = useState<string>();
  useEffect(() => {
    let current = true;
    void (async () => {
      const { default: mermaid } = await import('mermaid');
      const styles = getComputedStyle(document.documentElement);
      const role = (name: string) => styles.getPropertyValue(`--md-sys-color-${name}`).trim();
      mermaid.initialize({
        startOnLoad: false,
        securityLevel: 'strict',
        theme: 'base',
        fontFamily: getComputedStyle(document.body).fontFamily,
        // Mermaid wraps labels at 200px by default, which rewraps lines authors break with <br/>.
        flowchart: { wrappingWidth: 320 },
        themeVariables: {
          darkMode: resolvedTheme === 'dark',
          fontSize: '14px',
          background: role('surface-container-low'),
          primaryColor: role('primary-container'),
          primaryTextColor: role('on-primary-container'),
          primaryBorderColor: role('primary'),
          secondaryColor: role('secondary-container'),
          secondaryTextColor: role('on-secondary-container'),
          secondaryBorderColor: role('outline'),
          tertiaryColor: role('surface-container-high'),
          tertiaryTextColor: role('on-surface'),
          tertiaryBorderColor: role('outline'),
          lineColor: role('on-surface-variant'),
          textColor: role('on-surface'),
          clusterBkg: role('surface-container'),
          clusterBorder: role('outline-variant'),
          edgeLabelBackground: role('surface-container-low'),
          actorBkg: role('primary-container'),
          actorBorder: role('primary'),
          actorTextColor: role('on-primary-container'),
          actorLineColor: role('outline'),
          signalColor: role('on-surface'),
          signalTextColor: role('on-surface'),
          labelBoxBkgColor: role('secondary-container'),
          labelTextColor: role('on-secondary-container'),
          noteBkgColor: role('tertiary-container'),
          noteTextColor: role('on-tertiary-container'),
          noteBorderColor: role('tertiary'),
        },
      });
      try {
        const result = await mermaid.render(id, chart);
        if (current) setSvg(result.svg);
      } catch {
        // Keep the source visible if the diagram has a syntax error.
        document.getElementById(`d${id}`)?.remove();
      }
    })();
    return () => { current = false; };
  }, [chart, id, resolvedTheme]);
  return svg
    ? <figure className="docs-mermaid not-prose" dangerouslySetInnerHTML={{ __html: svg }} />
    : <pre className="docs-mermaid-source not-prose"><code>{chart}</code></pre>;
}
