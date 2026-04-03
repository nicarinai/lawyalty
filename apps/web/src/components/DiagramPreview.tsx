// apps/web/src/components/DiagramPreview.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { initMermaid, renderMermaid } from '@/lib/mermaid';

interface DiagramPreviewProps {
  code: string;
}

export default function DiagramPreview({ code }: DiagramPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState('');
  const [isRendering, setIsRendering] = useState(false);

  useEffect(() => {
    initMermaid();
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      if (!containerRef.current) return;

      setIsRendering(true);

      try {
        const { svg, bindFunctions } = await renderMermaid(code);

        if (!containerRef.current) return;
        containerRef.current.innerHTML = svg;
        bindFunctions?.(containerRef.current);

        setError('');
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to render Mermaid diagram.';
        setError(message);

        if (containerRef.current) {
          containerRef.current.innerHTML = '';
        }
      } finally {
        setIsRendering(false);
      }
    }, 180);

    return () => window.clearTimeout(timer);
  }, [code]);

  return (
    <div className="relative h-full w-full overflow-auto">
      <div className="absolute right-4 top-4 z-10 flex items-center gap-2">
        {isRendering && (
          <span className="rounded-md border border-border bg-elevated px-2 py-1 text-[10px] font-mono text-subtle">
            Rendering…
          </span>
        )}
        {error && (
          <span className="max-w-[420px] rounded-md border border-error/30 bg-[#2a1111] px-3 py-2 text-[10px] font-mono text-error">
            {error}
          </span>
        )}
      </div>

      <div className="flex min-h-full min-w-full items-center justify-center p-8">
        <div className="w-full max-w-5xl rounded-xl border border-border bg-[#101010]/80 p-6 shadow-2xl">
          <div
            ref={containerRef}
            className="mermaid-svg flex items-center justify-center overflow-auto [&_svg]:h-auto [&_svg]:max-w-full"
          />
        </div>
      </div>
    </div>
  );
}