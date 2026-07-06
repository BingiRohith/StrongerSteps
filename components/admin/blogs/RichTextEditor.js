'use client';

import { useEffect, useRef } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Link as LinkIcon,
  Undo,
  Redo,
  RemoveFormatting,
} from 'lucide-react';

/**
 * Minimal WYSIWYG editor built on `contentEditable` + `document.execCommand`.
 * Deliberately dependency-free (the project has no rich-text package
 * installed and this sprint shouldn't add one just for this) — good enough
 * for headings/bold/italic/lists/links/quotes, which covers everything the
 * Blog model's `content` field needs. `value`/`onChange` carry HTML.
 */
const TOOLS = [
  { cmd: 'bold', icon: Bold, label: 'Bold' },
  { cmd: 'italic', icon: Italic, label: 'Italic' },
  { cmd: 'underline', icon: Underline, label: 'Underline' },
  { cmd: 'formatBlock', arg: '<h2>', icon: Heading2, label: 'Heading 2' },
  { cmd: 'formatBlock', arg: '<h3>', icon: Heading3, label: 'Heading 3' },
  { cmd: 'insertUnorderedList', icon: List, label: 'Bullet list' },
  { cmd: 'insertOrderedList', icon: ListOrdered, label: 'Numbered list' },
  { cmd: 'formatBlock', arg: '<blockquote>', icon: Quote, label: 'Quote' },
  { cmd: 'removeFormat', icon: RemoveFormatting, label: 'Clear formatting' },
];

export default function RichTextEditor({ value, onChange, placeholder = 'Write your blog…' }) {
  const editorRef = useRef(null);
  const isFirstRender = useRef(true);

  // Only push external value into the DOM on first mount / when the parent
  // resets it (e.g. loading an existing blog) — never on every keystroke,
  // or the caret jumps to the start on each render.
  useEffect(() => {
    if (editorRef.current && (isFirstRender.current || editorRef.current.innerHTML === '')) {
      editorRef.current.innerHTML = value || '';
      isFirstRender.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (editorRef.current && value === '' && editorRef.current.innerHTML !== '') {
      editorRef.current.innerHTML = '';
    }
  }, [value]);

  function exec(cmd, arg) {
    editorRef.current?.focus();
    document.execCommand(cmd, false, arg);
    emitChange();
  }

  function handleLink() {
    const url = window.prompt('Link URL');
    if (url) exec('createLink', url);
  }

  function emitChange() {
    onChange?.(editorRef.current?.innerHTML || '');
  }

  return (
    <div className="overflow-hidden rounded-lg border border-line bg-white">
      <div className="flex flex-wrap items-center gap-1 border-b border-line bg-sage/40 px-2 py-1.5">
        {TOOLS.map(({ cmd, arg, icon: Icon, label }) => (
          <button
            key={label}
            type="button"
            title={label}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => exec(cmd, arg)}
            className="rounded-md p-1.5 text-primary-dark hover:bg-white"
          >
            <Icon size={16} />
          </button>
        ))}
        <button
          type="button"
          title="Insert link"
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleLink}
          className="rounded-md p-1.5 text-primary-dark hover:bg-white"
        >
          <LinkIcon size={16} />
        </button>
        <span className="mx-1 h-5 w-px bg-line" />
        <button
          type="button"
          title="Undo"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => exec('undo')}
          className="rounded-md p-1.5 text-primary-dark hover:bg-white"
        >
          <Undo size={16} />
        </button>
        <button
          type="button"
          title="Redo"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => exec('redo')}
          className="rounded-md p-1.5 text-primary-dark hover:bg-white"
        >
          <Redo size={16} />
        </button>
      </div>

      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={emitChange}
        onBlur={emitChange}
        data-placeholder={placeholder}
        className="prose-editor min-h-[280px] max-w-none px-4 py-3 text-sm leading-relaxed text-ink outline-none [&_blockquote]:border-l-4 [&_blockquote]:border-accent [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-muted [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-primary-dark [&_h3]:font-display [&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-primary-dark [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5 [&_a]:text-primary [&_a]:underline"
      />
      <style jsx global>{`
        [contenteditable][data-placeholder]:empty:before {
          content: attr(data-placeholder);
          color: #5c7269;
          opacity: 0.6;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}
