'use client';

import { useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TiptapImage from '@tiptap/extension-image';
import TiptapLink from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import {
  Bold,
  Italic,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Link as LinkIcon,
  Code,
  Table as TableIcon,
  Image as ImageIcon,
  Info,
  Loader2,
} from 'lucide-react';

const CALLOUT_VARIANTS = {
  info: 'callout callout-info',
  warning: 'callout callout-warning',
  tip: 'callout callout-tip',
};

/**
 * Sprint 19.5 — Tiptap-based rich text editor for Lesson `body` (lessonType
 * 'text'), replacing the bare `<textarea>` LessonEditorPanel.js used
 * previously. Approved as an explicit exception to the project's "no new
 * dependency for modest needs" convention (docs/13_DECISIONS.md) — tables/
 * callouts/code blocks/inline images are real editing surface, scoped to
 * Courses/Lessons only. Keeps the same `value`/`onChange` (HTML string)
 * contract as the older components/admin/blogs/RichTextEditor.js so callers
 * stay editor-agnostic.
 *
 * `onUploadImage(file)` is injected by the caller (LessonEditorPanel),
 * which already knows the lesson id needed to scope the upload route and
 * append to `Lesson.bodyImages` — this component only knows how to insert
 * whatever URL that callback resolves to.
 */
export default function LessonRichTextEditor({ value, onChange, onUploadImage, placeholder = 'Write the lesson content…' }) {
  const [uploadingImage, setUploadingImage] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: { HTMLAttributes: { class: 'lesson-code-block' } } }),
      TiptapImage,
      TiptapLink.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder }),
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: value || '',
    immediatelyRender: false,
    onUpdate: ({ editor: e }) => onChange?.(e.getHTML()),
    editorProps: {
      attributes: {
        class:
          'prose-editor min-h-[240px] max-w-none px-4 py-3 text-sm leading-relaxed text-ink outline-none [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-line [&_td]:p-2 [&_th]:border [&_th]:border-line [&_th]:bg-sage/40 [&_th]:p-2 [&_pre]:rounded-lg [&_pre]:bg-ink [&_pre]:p-3 [&_pre]:text-white [&_blockquote]:border-l-4 [&_blockquote]:border-accent [&_blockquote]:pl-3 [&_blockquote]:italic [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-bold [&_h3]:font-display [&_h3]:text-lg [&_h3]:font-bold [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5 [&_a]:text-primary [&_a]:underline [&_img]:rounded-lg [&_.callout]:my-3 [&_.callout]:rounded-lg [&_.callout]:border [&_.callout]:p-3 [&_.callout-info]:border-primary/40 [&_.callout-info]:bg-sage/40 [&_.callout-warning]:border-amber-400 [&_.callout-warning]:bg-amber-50 [&_.callout-tip]:border-primary [&_.callout-tip]:bg-primary/5',
      },
    },
  });

  if (!editor) return null;

  function toggleCallout(variant) {
    const classes = CALLOUT_VARIANTS[variant];
    if (editor.isActive('paragraph', { class: classes })) {
      editor.chain().focus().setParagraph().run();
      return;
    }
    editor.chain().focus().setNode('paragraph', { class: classes }).run();
  }

  function insertLink() {
    const url = window.prompt('Link URL');
    if (url) editor.chain().focus().setLink({ href: url }).run();
  }

  function insertTable() {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  }

  async function handleImageFile(file) {
    if (!file || !onUploadImage) return;
    setUploadingImage(true);
    try {
      const url = await onUploadImage(file);
      if (url) editor.chain().focus().setImage({ src: url }).run();
    } finally {
      setUploadingImage(false);
    }
  }

  return (
    <div className="overflow-hidden rounded-lg border border-line bg-white">
      <div className="flex flex-wrap items-center gap-1 border-b border-line bg-sage/40 px-2 py-1.5">
        <ToolbarButton label="Bold" onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')}>
          <Bold size={16} />
        </ToolbarButton>
        <ToolbarButton label="Italic" onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')}>
          <Italic size={16} />
        </ToolbarButton>
        <ToolbarButton label="Heading 2" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })}>
          <Heading2 size={16} />
        </ToolbarButton>
        <ToolbarButton label="Heading 3" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })}>
          <Heading3 size={16} />
        </ToolbarButton>
        <ToolbarButton label="Bullet list" onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')}>
          <List size={16} />
        </ToolbarButton>
        <ToolbarButton label="Numbered list" onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')}>
          <ListOrdered size={16} />
        </ToolbarButton>
        <ToolbarButton label="Quote" onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')}>
          <Quote size={16} />
        </ToolbarButton>
        <ToolbarButton label="Code block" onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive('codeBlock')}>
          <Code size={16} />
        </ToolbarButton>
        <ToolbarButton label="Insert table" onClick={insertTable}>
          <TableIcon size={16} />
        </ToolbarButton>
        <ToolbarButton label="Insert link" onClick={insertLink} active={editor.isActive('link')}>
          <LinkIcon size={16} />
        </ToolbarButton>
        <span className="mx-1 h-5 w-px bg-line" />
        <ToolbarButton label="Info callout" onClick={() => toggleCallout('info')}>
          <Info size={16} />
        </ToolbarButton>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => toggleCallout('warning')}
          className="rounded-md px-2 py-1.5 text-xs font-semibold text-amber-700 hover:bg-white"
        >
          Warning
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => toggleCallout('tip')}
          className="rounded-md px-2 py-1.5 text-xs font-semibold text-primary-dark hover:bg-white"
        >
          Tip
        </button>
        {onUploadImage && (
          <>
            <span className="mx-1 h-5 w-px bg-line" />
            <label className="inline-flex cursor-pointer items-center gap-1 rounded-md p-1.5 text-primary-dark hover:bg-white">
              {uploadingImage ? <Loader2 size={16} className="animate-spin" /> : <ImageIcon size={16} />}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                disabled={uploadingImage}
                onChange={(e) => handleImageFile(e.target.files?.[0])}
              />
            </label>
          </>
        )}
      </div>

      <EditorContent editor={editor} />
    </div>
  );
}

function ToolbarButton({ label, onClick, active, children }) {
  return (
    <button
      type="button"
      title={label}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`rounded-md p-1.5 ${active ? 'bg-white text-primary' : 'text-primary-dark hover:bg-white'}`}
    >
      {children}
    </button>
  );
}
