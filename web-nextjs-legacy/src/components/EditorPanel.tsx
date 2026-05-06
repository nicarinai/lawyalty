// apps/web/src/components/EditorPanel.tsx
'use client';

import CodeMirror from '@uiw/react-codemirror';
import { markdown } from '@codemirror/lang-markdown';
import { oneDark } from '@codemirror/theme-one-dark';

interface EditorPanelProps {
  code: string;
  onChange: (value: string) => void;
}

export default function EditorPanel({ code, onChange }: EditorPanelProps) {
  return (
    <div className="h-full w-full [&_.cm-editor]:h-full [&_.cm-scroller]:font-mono [&_.cm-scroller]:text-sm">
      <CodeMirror
        value={code}
        height="100%"
        theme={oneDark}
        extensions={[markdown()]}
        basicSetup={{
          lineNumbers: true,
          foldGutter: true,
          highlightActiveLine: true,
          highlightActiveLineGutter: true,
          bracketMatching: true,
          autocompletion: true,
        }}
        onChange={onChange}
      />
    </div>
  );
}