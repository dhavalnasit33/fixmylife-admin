// components/shared/TiptapEditor.tsx
"use client";

import dynamic from "next/dynamic";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  Quote,
  Code2,
  Minus,
  Link2,
  Undo,
  Redo,
  Image as ImageIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

export type Level = 1 | 2 | 3 | 4 | 5 | 6;

export function TiptapEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [headingDropdownOpen, setHeadingDropdownOpen] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link,
      Image.configure({ inline: false, allowBase64: true }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "prose max-w-none focus:outline-none min-h-[150px] px-3 py-2",
      },
    },
    autofocus: false,
    immediatelyRender: false,
  });

  const buttonBase = "p-2 rounded hover:bg-muted transition";
  const activeStyle = "bg-muted text-primary";
  const headingLevels: Level[] = [1, 2, 3, 4, 5, 6];
  const headingSizeMap: Record<number, string> = {
    1: "text-4xl",
    2: "text-3xl",
    3: "text-2xl",
    4: "text-xl",
    5: "text-lg",
    6: "text-base",
  };

  const handleImageUpload = async (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      editor?.chain().focus().setImage({ src: result }).run();
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || "");
    }
  }, [value, editor]);

  if (!editor) {
    return (
      <div className="min-h-[150px] px-3 py-2 text-muted-foreground">
        Loading editor...
      </div>
    );
  }

  return (
    <div className="border rounded-md">
      <div className="flex flex-wrap items-center gap-1 border-b p-2 bg-background relative">
        <div className="relative">
          <button
            type="button"
            onClick={() => setHeadingDropdownOpen((open) => !open)}
            className="p-2 border rounded text-sm"
          >
            {headingLevels.find((level) =>
              editor.isActive("heading", { level })
            )
              ? `Heading ${headingLevels.find((l) =>
                  editor.isActive("heading", { level: l })
                )}`
              : "Paragraph"}
          </button>
          {headingDropdownOpen && (
            <div
              className="absolute left-0 mt-1 bg-white border rounded shadow z-10 w-100 max-h-64 overflow-auto"
              style={{ width: "212px" }}
            >
              <div
                onClick={() => {
                  editor.chain().focus().setParagraph().run();
                  setHeadingDropdownOpen(false);
                }}
                className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
              >
                <span className="text-sm">Paragraph</span>
              </div>
              {headingLevels.map((level) => (
                <div
                  key={level}
                  onClick={() => {
                    editor.chain().focus().toggleHeading({ level }).run();
                    setHeadingDropdownOpen(false);
                  }}
                  className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                >
                  <span className={`${headingSizeMap[level]} font-bold`}>
                    Heading {level}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`${buttonBase} ${
            editor.isActive("bold") ? activeStyle : ""
          }`}
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`${buttonBase} ${
            editor.isActive("italic") ? activeStyle : ""
          }`}
        >
          <Italic className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`${buttonBase} ${
            editor.isActive("underline") ? activeStyle : ""
          }`}
        >
          <UnderlineIcon className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`${buttonBase} ${
            editor.isActive("bulletList") ? activeStyle : ""
          }`}
        >
          <List className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`${buttonBase} ${
            editor.isActive("orderedList") ? activeStyle : ""
          }`}
        >
          <ListOrdered className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`${buttonBase} ${
            editor.isActive("blockquote") ? activeStyle : ""
          }`}
        >
          <Quote className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={`${buttonBase} ${
            editor.isActive("codeBlock") ? activeStyle : ""
          }`}
        >
          <Code2 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          className={buttonBase}
        >
          <Minus className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => {
            const url = prompt("Enter URL");
            if (url) {
              editor
                .chain()
                .focus()
                .extendMarkRange("link")
                .setLink({ href: url })
                .run();
            }
          }}
          className={buttonBase}
        >
          <Link2 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          className={buttonBase}
        >
          <Undo className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          className={buttonBase}
        >
          <Redo className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className={buttonBase}
        >
          <ImageIcon className="w-4 h-4" />
        </button>
        <input
          type="file"
          accept="image/*"
          hidden
          ref={fileInputRef}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleImageUpload(file);
          }}
        />
      </div>

      <EditorContent editor={editor} />
    </div>
  );
}

export const TiptapEditorNoSSR = dynamic(() => Promise.resolve(TiptapEditor), {
  ssr: false,
});
