// apps/web/src/lib/mermaid.ts
import mermaid from 'mermaid';

let initialized = false;

export function initMermaid() {
  if (initialized) return;

  mermaid.initialize({
    startOnLoad: false,
    theme: 'dark',
    securityLevel: 'loose',
    fontFamily: 'Inter, system-ui, sans-serif',
    themeVariables: {
      darkMode: true,
      background: '#131313',
      primaryColor: '#1c1b1b',
      primaryTextColor: '#e5e2e1',
      primaryBorderColor: '#464554',
      lineColor: '#908fa0',
      tertiaryColor: '#252525',
    },
  });

  initialized = true;
}

export async function renderMermaid(code: string) {
  initMermaid();

  const renderId = `mermaid-${Math.random().toString(36).slice(2, 10)}`;
  return mermaid.render(renderId, code);
}