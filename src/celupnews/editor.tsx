import { useEffect, useMemo, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Youtube from "@tiptap/extension-youtube";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";

export function NewsEditor({ value, onChange, mediaItems = [], onImageUpload }: { value: string; onChange: (html: string) => void; mediaItems?: Array<{ secure_url: string; public_id: string }>; onImageUpload?: (file: File) => Promise<string | undefined> }) {
  const extensions = useMemo(() => [
    StarterKit.configure({ heading: { levels: [1, 2, 3] } }), Underline,
    Link.configure({ openOnClick: false, protocols: ["https", "http", "mailto"] }),
    Image.configure({ allowBase64: false }), Youtube.configure({ nocookie: true }),
    TextAlign.configure({ types: ["heading", "paragraph"] }),
    Placeholder.configure({ placeholder: "Mulai menulis berita…" }),
  ], []);
  const editor = useEditor({ extensions, content: value, immediatelyRender: false,
    onUpdate: ({ editor: instance }) => onChange(instance.getHTML()) });
  useEffect(() => { if (editor && editor.getHTML() !== value) editor.commands.setContent(value || ""); }, [editor, value]);
  if (!editor) return <div className="cn-editor-loading">Memuat editor…</div>;
  const command = (label: string, run: () => void, active = false) => <button type="button" className={active ? "cn-tool active" : "cn-tool"} aria-label={label} title={label} onClick={run}>{label}</button>;
  const setLink = () => { const url = window.prompt("Alamat tautan HTTPS"); if (url && /^https:\/\//i.test(url)) editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run(); };
  const addImage = () => { const url = window.prompt("URL HTTPS gambar yang sudah diunggah"); if (url && /^https:\/\//i.test(url)) editor.chain().focus().setImage({ src: url, alt: "" }).run(); };
  const addVideo = () => { const url = window.prompt("URL video YouTube"); if (url && /^https:\/\//i.test(url)) editor.chain().focus().setYoutubeVideo({ src: url }).run(); };
  const uploadImage = async (file: File) => { if (!onImageUpload) return; const url=await onImageUpload(file); if(url) editor.chain().focus().setImage({src:url,alt:""}).run(); };
  const words = (editor.getText().trim().match(/\S+/g) || []).length;
  return <div className="cn-editor">
    <div className="cn-toolbar" role="toolbar" aria-label="Pemformatan berita">
      {command("H1", () => editor.chain().focus().toggleHeading({ level: 1 }).run(), editor.isActive("heading", { level: 1 }))}
      {command("H2", () => editor.chain().focus().toggleHeading({ level: 2 }).run(), editor.isActive("heading", { level: 2 }))}
      {command("H3", () => editor.chain().focus().toggleHeading({ level: 3 }).run(), editor.isActive("heading", { level: 3 }))}
      {command("B", () => editor.chain().focus().toggleBold().run(), editor.isActive("bold"))}
      {command("I", () => editor.chain().focus().toggleItalic().run(), editor.isActive("italic"))}
      {command("U", () => editor.chain().focus().toggleUnderline().run(), editor.isActive("underline"))}
      {command("¶", () => editor.chain().focus().setParagraph().run())}
      {command("• List", () => editor.chain().focus().toggleBulletList().run(), editor.isActive("bulletList"))}
      {command("1. List", () => editor.chain().focus().toggleOrderedList().run(), editor.isActive("orderedList"))}
      {command("Kutipan", () => editor.chain().focus().toggleBlockquote().run(), editor.isActive("blockquote"))}
      {command("Tautan", setLink)}{command("Gambar URL", addImage)}<select className="cn-tool-select" aria-label="Sisipkan gambar dari pustaka media" defaultValue="" onChange={e=>{const media=mediaItems.find(item=>item.public_id===e.target.value);if(media)editor.chain().focus().setImage({src:media.secure_url,alt:""}).run();e.currentTarget.value="";}} disabled={!mediaItems.length}><option value="">Pilih gambar pustaka</option>{mediaItems.map(item=><option key={item.public_id} value={item.public_id}>{item.public_id}</option>)}</select><label className="cn-tool cn-tool-upload">Unggah gambar<input type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={event=>{const file=event.target.files?.[0];if(file)void uploadImage(file);event.currentTarget.value="";}} /></label>{command("Video", addVideo)}
      {command("Rata kiri", () => editor.chain().focus().setTextAlign("left").run())}
      {command("Tengah", () => editor.chain().focus().setTextAlign("center").run())}
      {command("Kanan", () => editor.chain().focus().setTextAlign("right").run())}
      {command("Urungkan", () => editor.chain().focus().undo().run())}{command("Ulangi", () => editor.chain().focus().redo().run())}
      <span className="cn-word-count">{words} kata</span>
    </div>
    <EditorContent editor={editor} className="cn-editor-body" />
  </div>;
}

export function ArticlePreview({ title, description, html, image, mobile }: { title: string; description: string; html: string; image: string; mobile: boolean }) {
  return <div className={mobile ? "cn-preview mobile" : "cn-preview"}>
    {image && <img src={image} alt="Pratinjau berita" />}
    <p className="cn-eyebrow">CELUPNEWS · BERITA</p><h1>{title || "Judul berita"}</h1>
    <p className="cn-lead">{description || "Deskripsi singkat berita akan tampil di sini."}</p>
    <div className="cn-preview-content"><div dangerouslySetInnerHTML={{ __html: html || "<p>Isi berita akan tampil di sini.</p>" }} /></div>
  </div>;
}
