import React, { useEffect, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import {
  Table,
  TableCell,
  TableHeader,
  TableRow,
} from '@tiptap/extension-table';
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Code2,
  Eye,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  Pilcrow,
  Quote,
  Redo2,
  Table as TableIcon,
  Underline as UnderlineIcon,
  Undo2,
  Upload,
} from 'lucide-react';
import { uploadImageToCloudinary } from '../lib/cloudinary';
import { sanitizeEditorialHtml } from '../lib/sanitize';

type EditorTab = 'visual' | 'html' | 'preview';

interface RichHtmlEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export const RichHtmlEditor: React.FC<RichHtmlEditorProps> = ({
  value,
  onChange,
  placeholder = 'Tulis naskah berita lengkap di sini...',
}) => {
  const [activeTab, setActiveTab] = useState<EditorTab>('visual');
  const [htmlDraft, setHtmlDraft] = useState(value);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [imageCaptionInput, setImageCaptionInput] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [editorError, setEditorError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4] },
        link: {
          openOnClick: false,
          HTMLAttributes: {
            rel: 'noopener noreferrer',
            target: '_blank',
          },
        },
      }),
      Image.configure({
        inline: false,
        allowBase64: false,
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Placeholder.configure({
        placeholder,
      }),
      Table.configure({
        resizable: false,
      }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: value,
    onUpdate: ({ editor: ed }) => {
      const html = ed.getHTML();
      setHtmlDraft(html);
      onChange(html);
    },
  });

  // Sync external initial value updates (e.g. when loading an existing article)
  useEffect(() => {
    if (!editor) return;
    const currentHtml = editor.getHTML();
    if (value !== currentHtml && activeTab === 'visual') {
      editor.commands.setContent(value || '', { emitUpdate: false });
      setHtmlDraft(value || '');
    }
  }, [value, editor, activeTab]);

  const handleSwitchTab = (tab: EditorTab) => {
    if (tab === activeTab) return;
    if (activeTab === 'html' && editor) {
      const sanitized = sanitizeEditorialHtml(htmlDraft);
      editor.commands.setContent(sanitized, { emitUpdate: false });
      onChange(sanitized);
    } else if (editor && activeTab === 'visual') {
      const current = editor.getHTML();
      setHtmlDraft(current);
      onChange(current);
    }
    setActiveTab(tab);
  };

  const handleHtmlTextareaChange = (nextHtml: string) => {
    setHtmlDraft(nextHtml);
    onChange(nextHtml);
  };

  const handleApplyLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editor) return;
    const trimmed = linkUrl.trim();
    if (!trimmed) {
      editor.chain().focus().unsetLink().run();
    } else {
      const safeHref = /^https?:\/\//i.test(trimmed)
        ? trimmed
        : `https://${trimmed}`;
      editor
        .chain()
        .focus()
        .extendMarkRange('link')
        .setLink({ href: safeHref })
        .run();
    }
    setLinkUrl('');
    setShowLinkInput(false);
  };

  const insertImageWithOptionalCaption = (src: string, caption: string) => {
    if (!editor || !src.trim()) return;
    const cleanSrc = src.trim();
    const cleanCaption = caption.trim();

    if (cleanCaption) {
      const escapedAlt = cleanCaption.replace(/"/g, '&quot;');
      const snippet = `<figure><img src="${cleanSrc}" alt="${escapedAlt}" /><figcaption>${cleanCaption}</figcaption></figure><p></p>`;
      editor.chain().focus().insertContent(snippet).run();
    } else {
      editor.chain().focus().setImage({ src: cleanSrc, alt: 'Foto artikel GATSU WEWARAH' }).run();
    }
  };

  const handleUploadInlineImage = async (file: File) => {
    setEditorError(null);
    setUploadingImage(true);
    try {
      const res = await uploadImageToCloudinary(file, 'articles');
      setImageUrlInput(res.secureUrl);
    } catch (err) {
      setEditorError(
        err instanceof Error ? err.message : 'Gagal mengunggah gambar.'
      );
    } finally {
      setUploadingImage(false);
    }
  };

  const handleInsertImageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrlInput.trim()) {
      setEditorError('URL gambar atau unggahan wajib diisi.');
      return;
    }
    insertImageWithOptionalCaption(imageUrlInput, imageCaptionInput);
    setImageUrlInput('');
    setImageCaptionInput('');
    setShowImageDialog(false);
  };

  const previewHtml = sanitizeEditorialHtml(
    activeTab === 'html' ? htmlDraft : editor?.getHTML() || value
  );

  const btnClass = (isActive = false) =>
    `p-1.5 text-xs border transition-colors flex items-center justify-center min-w-[30px] h-[30px] ${
      isActive
        ? 'bg-neutral-950 text-white border-neutral-950'
        : 'bg-white text-neutral-700 border-stone-200 hover:bg-stone-100'
    }`;

  return (
    <div className="border border-stone-300 bg-white">
      {/* Editor Mode Switcher Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-stone-100 border-b border-stone-300">
        <div className="flex items-center gap-1" role="tablist" aria-label="Mode editor konten">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'visual'}
            onClick={() => handleSwitchTab('visual')}
            className={`px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              activeTab === 'visual'
                ? 'bg-neutral-950 text-white'
                : 'bg-white text-neutral-700 border border-stone-200 hover:bg-stone-50'
            }`}
          >
            <Pilcrow className="w-3.5 h-3.5" />
            Editor Visual
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'html'}
            onClick={() => handleSwitchTab('html')}
            className={`px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              activeTab === 'html'
                ? 'bg-neutral-950 text-white'
                : 'bg-white text-neutral-700 border border-stone-200 hover:bg-stone-50'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            Kode HTML
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'preview'}
            onClick={() => handleSwitchTab('preview')}
            className={`px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              activeTab === 'preview'
                ? 'bg-neutral-950 text-white'
                : 'bg-white text-neutral-700 border border-stone-200 hover:bg-stone-50'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            Pratinjau Artikel
          </button>
        </div>

        <span className="text-[11px] text-stone-500">
          Konten disanitasi otomatis dengan DOMPurify
        </span>
      </div>

      {/* Visual Toolbar */}
      {activeTab === 'visual' && editor && (
        <div className="px-3 py-2 border-b border-stone-200 bg-stone-50 flex flex-wrap items-center gap-1">
          <button
            type="button"
            onClick={() => editor.chain().focus().setParagraph().run()}
            className={btnClass(editor.isActive('paragraph'))}
            title="Paragraf (P)"
            aria-label="Paragraf"
          >
            <Pilcrow className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 1 }).run()
            }
            className={btnClass(editor.isActive('heading', { level: 1 }))}
            title="Heading 1"
            aria-label="Heading 1"
          >
            <Heading1 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
            className={btnClass(editor.isActive('heading', { level: 2 }))}
            title="Heading 2"
            aria-label="Heading 2"
          >
            <Heading2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 3 }).run()
            }
            className={btnClass(editor.isActive('heading', { level: 3 }))}
            title="Heading 3"
            aria-label="Heading 3"
          >
            <Heading3 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 4 }).run()
            }
            className={btnClass(editor.isActive('heading', { level: 4 }))}
            title="Heading 4"
            aria-label="Heading 4"
          >
            <Heading4 className="w-3.5 h-3.5" />
          </button>

          <span className="w-px h-5 bg-stone-300 mx-1" aria-hidden="true" />

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={btnClass(editor.isActive('bold'))}
            title="Tebal (Strong)"
            aria-label="Tebal"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={btnClass(editor.isActive('italic'))}
            title="Miring (Em)"
            aria-label="Miring"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={btnClass(editor.isActive('underline'))}
            title="Garis Bawah (U)"
            aria-label="Garis bawah"
          >
            <UnderlineIcon className="w-3.5 h-3.5" />
          </button>

          <span className="w-px h-5 bg-stone-300 mx-1" aria-hidden="true" />

          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            className={btnClass(editor.isActive({ textAlign: 'left' }))}
            title="Rata Kiri"
            aria-label="Rata kiri"
          >
            <AlignLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            className={btnClass(editor.isActive({ textAlign: 'center' }))}
            title="Rata Tengah"
            aria-label="Rata tengah"
          >
            <AlignCenter className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            className={btnClass(editor.isActive({ textAlign: 'right' }))}
            title="Rata Kanan"
            aria-label="Rata kanan"
          >
            <AlignRight className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign('justify').run()}
            className={btnClass(editor.isActive({ textAlign: 'justify' }))}
            title="Rata Kiri-Kanan"
            aria-label="Rata kiri kanan"
          >
            <AlignJustify className="w-3.5 h-3.5" />
          </button>

          <span className="w-px h-5 bg-stone-300 mx-1" aria-hidden="true" />

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={btnClass(editor.isActive('bulletList'))}
            title="Daftar Poin (UL)"
            aria-label="Daftar poin"
          >
            <List className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={btnClass(editor.isActive('orderedList'))}
            title="Daftar Angka (OL)"
            aria-label="Daftar angka"
          >
            <ListOrdered className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={btnClass(editor.isActive('blockquote'))}
            title="Kutipan (Blockquote)"
            aria-label="Kutipan"
          >
            <Quote className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            className={btnClass(false)}
            title="Garis Pemisah (HR)"
            aria-label="Garis pemisah"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>

          <span className="w-px h-5 bg-stone-300 mx-1" aria-hidden="true" />

          <button
            type="button"
            onClick={() => {
              setLinkUrl(editor.getAttributes('link').href || '');
              setShowLinkInput((prev) => !prev);
            }}
            className={btnClass(editor.isActive('link'))}
            title="Sisipkan Tautan"
            aria-label="Sisipkan tautan"
          >
            <Link2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setShowImageDialog((prev) => !prev)}
            className={btnClass(false)}
            title="Sisipkan Gambar & Keterangan"
            aria-label="Sisipkan gambar"
          >
            <ImagePlus className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() =>
              editor
                .chain()
                .focus()
                .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
                .run()
            }
            className={btnClass(editor.isActive('table'))}
            title="Sisipkan Tabel 3x3"
            aria-label="Sisipkan tabel"
          >
            <TableIcon className="w-3.5 h-3.5" />
          </button>

          {editor.isActive('table') && (
            <div className="flex items-center gap-1 ml-1 pl-1 border-l border-stone-300">
              <button
                type="button"
                onClick={() => editor.chain().focus().addRowAfter().run()}
                className="px-2 h-[30px] text-[11px] bg-white border border-stone-200 hover:bg-stone-100"
              >
                +Baris
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().addColumnAfter().run()}
                className="px-2 h-[30px] text-[11px] bg-white border border-stone-200 hover:bg-stone-100"
              >
                +Kolom
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().deleteTable().run()}
                className="px-2 h-[30px] text-[11px] bg-white border border-red-200 text-red-700 hover:bg-red-50"
              >
                Hapus Tabel
              </button>
            </div>
          )}

          <span className="w-px h-5 bg-stone-300 mx-1" aria-hidden="true" />

          <button
            type="button"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            className={`${btnClass(false)} disabled:opacity-40`}
            title="Urungkan"
            aria-label="Urungkan"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            className={`${btnClass(false)} disabled:opacity-40`}
            title="Ulangi"
            aria-label="Ulangi"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Inline Link Insertion Drawer */}
      {activeTab === 'visual' && showLinkInput && (
        <form
          onSubmit={handleApplyLink}
          className="px-3 py-2.5 bg-stone-100 border-b border-stone-200 flex flex-wrap items-center gap-2"
        >
          <input
            type="url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="https://contoh-tautan.com"
            className="flex-1 min-w-[220px] px-3 py-1.5 text-xs bg-white border border-stone-300 focus:outline-none focus:border-neutral-950"
          />
          <button
            type="submit"
            className="px-3 py-1.5 text-xs font-semibold bg-neutral-950 text-white hover:bg-neutral-800"
          >
            Terapkan Tautan
          </button>
          <button
            type="button"
            onClick={() => setShowLinkInput(false)}
            className="px-3 py-1.5 text-xs text-stone-600 hover:text-neutral-950"
          >
            Batal
          </button>
        </form>
      )}

      {/* Inline Image + Caption Insertion Drawer */}
      {activeTab === 'visual' && showImageDialog && (
        <form
          onSubmit={handleInsertImageSubmit}
          className="px-3 py-3 bg-stone-100 border-b border-stone-200 space-y-2.5"
        >
          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleUploadInlineImage(file);
              }}
            />
            <button
              type="button"
              disabled={uploadingImage}
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 text-xs font-semibold bg-white border border-stone-300 hover:bg-stone-50 flex items-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5" />
              {uploadingImage ? 'Mengunggah...' : 'Unggah ke Cloudinary'}
            </button>
            <input
              type="url"
              value={imageUrlInput}
              onChange={(e) => setImageUrlInput(e.target.value)}
              placeholder="Atau tempel URL gambar (https://res.cloudinary.com/...)"
              className="flex-1 min-w-[220px] px-3 py-1.5 text-xs bg-white border border-stone-300 focus:outline-none focus:border-neutral-950"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={imageCaptionInput}
              onChange={(e) => setImageCaptionInput(e.target.value)}
              placeholder="Keterangan / caption foto (opsional)"
              className="flex-1 min-w-[220px] px-3 py-1.5 text-xs bg-white border border-stone-300 focus:outline-none focus:border-neutral-950"
            />
            <button
              type="submit"
              className="px-3 py-1.5 text-xs font-semibold bg-red-700 text-white hover:bg-red-800"
            >
              Sisipkan ke Naskah
            </button>
            <button
              type="button"
              onClick={() => {
                setShowImageDialog(false);
                setEditorError(null);
              }}
              className="px-3 py-1.5 text-xs text-stone-600 hover:text-neutral-950"
            >
              Batal
            </button>
          </div>
          {editorError && (
            <p className="text-xs text-red-700 font-medium">{editorError}</p>
          )}
        </form>
      )}

      {/* Editor Body Area */}
      {activeTab === 'visual' && (
        <div className="gatsu-prose gatsu-editor-surface bg-white">
          <EditorContent editor={editor} />
        </div>
      )}

      {activeTab === 'html' && (
        <div className="bg-neutral-950 text-neutral-100 p-3">
          <label htmlFor="gatsu-raw-html" className="sr-only">
            Sumber HTML Artikel
          </label>
          <textarea
            id="gatsu-raw-html"
            value={htmlDraft}
            onChange={(e) => handleHtmlTextareaChange(e.target.value)}
            rows={18}
            spellCheck={false}
            placeholder="<p>Tulis atau tempel kode HTML artikel di sini...</p>"
            className="w-full bg-neutral-950 text-neutral-100 font-mono text-xs leading-relaxed focus:outline-none resize-y"
          />
        </div>
      )}

      {activeTab === 'preview' && (
        <div className="p-6 bg-white min-h-[380px]">
          <div className="max-w-2xl mx-auto">
            {previewHtml ? (
              <div
                className="gatsu-prose"
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
            ) : (
              <p className="text-sm text-stone-400 italic">
                Belum ada isi artikel untuk dipratinjau.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
