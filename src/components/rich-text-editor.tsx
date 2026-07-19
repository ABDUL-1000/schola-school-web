import React, { useEffect, useRef, useState } from 'react'
import { useEditor, EditorContent, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import { TextAlign } from '@tiptap/extension-text-align'
import { FontFamily } from '@tiptap/extension-font-family'
import { TextStyle } from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import { Highlight } from '@tiptap/extension-highlight'
import { Underline } from '@tiptap/extension-underline'
import { Subscript } from '@tiptap/extension-subscript'
import { Superscript } from '@tiptap/extension-superscript'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableCell } from '@tiptap/extension-table-cell'
import { TableHeader } from '@tiptap/extension-table-header'
import { TaskList } from '@tiptap/extension-task-list'
import { TaskItem } from '@tiptap/extension-task-item'
import { Markdown, type MarkdownStorage } from 'tiptap-markdown'
import { Extension } from '@tiptap/core'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import { toast } from '@/lib/toast'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import {
  Bold, Italic, Strikethrough, Underline as UnderlineIcon,
  List, ListOrdered, Quote, Code, Code2, Undo2, Redo2,
  Link as LinkIcon, Image as ImageIcon, Minus, ChevronDown,
  Loader2, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Subscript as SubscriptIcon, Superscript as SuperscriptIcon,
  Highlighter, Baseline, Table as TableIcon, CheckSquare
} from 'lucide-react'

const CustomShortcuts = Extension.create({
  name: 'customShortcuts',
  priority: 1000,
  addKeyboardShortcuts() {
    return {
      'Mod-e': () => this.editor.commands.toggleTextAlign('center'),
      'Mod-l': () => this.editor.commands.toggleTextAlign('left'),
      'Mod-r': () => this.editor.commands.toggleTextAlign('right'),
      'Mod-j': () => this.editor.commands.toggleTextAlign('justify'),
      'Mod-E': () => this.editor.commands.toggleTextAlign('center'),
      'Mod-L': () => this.editor.commands.toggleTextAlign('left'),
      'Mod-R': () => this.editor.commands.toggleTextAlign('right'),
      'Mod-J': () => this.editor.commands.toggleTextAlign('justify'),
    }
  },
})



export interface RichTextEditorProps {
  /** HTML or Markdown content */
  value: string
  /** Called with the updated HTML content on every edit */
  onChange?: (html: string) => void
  placeholder?: string
  editable?: boolean
  className?: string
}

function ToolbarButton({
  onClick,
  active,
  disabled,
  title,
  children,
}: {
  onClick: () => void
  active?: boolean
  disabled?: boolean
  title: string
  children: React.ReactNode
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn('size-7 shrink-0', active && 'bg-accent text-accent-foreground')}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
    >
      {children}
    </Button>
  )
}

const BLOCK_TYPES: Array<{
  label: string
  isActive: (editor: Editor) => boolean
  onSelect: (editor: Editor) => void
}> = [
  {
    label: 'Paragraph',
    isActive: (editor) => editor.isActive('paragraph'),
    onSelect: (editor) => editor.chain().focus().setParagraph().run(),
  },
  {
    label: 'Heading 1',
    isActive: (editor) => editor.isActive('heading', { level: 1 }),
    onSelect: (editor) => editor.chain().focus().toggleHeading({ level: 1 }).run(),
  },
  {
    label: 'Heading 2',
    isActive: (editor) => editor.isActive('heading', { level: 2 }),
    onSelect: (editor) => editor.chain().focus().toggleHeading({ level: 2 }).run(),
  },
  {
    label: 'Heading 3',
    isActive: (editor) => editor.isActive('heading', { level: 3 }),
    onSelect: (editor) => editor.chain().focus().toggleHeading({ level: 3 }).run(),
  },
  {
    label: 'Heading 4',
    isActive: (editor) => editor.isActive('heading', { level: 4 }),
    onSelect: (editor) => editor.chain().focus().toggleHeading({ level: 4 }).run(),
  },
]

const FONT_FAMILIES = [
  { label: 'Default', value: '' },
  { label: 'Inter', value: 'Inter, sans-serif' },
  { label: 'Arial', value: 'Arial, sans-serif' },
  { label: 'Times New Roman', value: '"Times New Roman", serif' },
  { label: 'Courier New', value: '"Courier New", monospace' },
  { label: 'Georgia', value: 'Georgia, serif' },
]

function BlockTypeDropdown({ editor }: { editor: Editor }) {
  const current = BLOCK_TYPES.find((type) => type.isActive(editor)) || BLOCK_TYPES[0]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 gap-1 px-2 text-xs font-medium w-[100px] justify-between"
          onMouseDown={(e) => e.preventDefault()}
        >
          <span className="truncate">{current.label}</span>
          <ChevronDown className="size-3 opacity-50 shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {BLOCK_TYPES.map((type) => (
          <DropdownMenuItem
            key={type.label}
            onSelect={() => type.onSelect(editor)}
            className={cn(type.isActive(editor) && 'bg-accent')}
          >
            {type.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function FontFamilyDropdown({ editor }: { editor: Editor }) {
  const currentFont = FONT_FAMILIES.find((font) => editor.isActive('textStyle', { fontFamily: font.value })) || FONT_FAMILIES[0]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 gap-1 px-2 text-xs font-medium w-[120px] justify-between"
          onMouseDown={(e) => e.preventDefault()}
        >
          <span className="truncate">{currentFont.label}</span>
          <ChevronDown className="size-3 opacity-50 shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {FONT_FAMILIES.map((font) => (
          <DropdownMenuItem
            key={font.label}
            onSelect={() => {
              if (font.value) {
                editor.chain().focus().setFontFamily(font.value).run()
              } else {
                editor.chain().focus().unsetFontFamily().run()
              }
            }}
            className={cn(editor.isActive('textStyle', { fontFamily: font.value }) && 'bg-accent')}
          >
            <span style={{ fontFamily: font.value }}>{font.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function TableDropdown({ editor }: { editor: Editor }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn('size-7 shrink-0', editor.isActive('table') && 'bg-accent text-accent-foreground')}
          onMouseDown={(e) => e.preventDefault()}
          title="Table Actions"
        >
          <TableIcon className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem onClick={() => {
            const rows = window.prompt('Number of rows', '3')
            const cols = window.prompt('Number of columns', '3')
            if (rows && cols) {
              editor.chain().focus().insertTable({ rows: parseInt(rows, 10), cols: parseInt(cols, 10), withHeaderRow: true }).run()
            }
        }}>
          Insert Table...
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => editor.chain().focus().addColumnBefore().run()}>Add Column Before</DropdownMenuItem>
        <DropdownMenuItem onClick={() => editor.chain().focus().addColumnAfter().run()}>Add Column After</DropdownMenuItem>
        <DropdownMenuItem onClick={() => editor.chain().focus().deleteColumn().run()}>Delete Column</DropdownMenuItem>
        <DropdownMenuItem onClick={() => editor.chain().focus().addRowBefore().run()}>Add Row Before</DropdownMenuItem>
        <DropdownMenuItem onClick={() => editor.chain().focus().addRowAfter().run()}>Add Row After</DropdownMenuItem>
        <DropdownMenuItem onClick={() => editor.chain().focus().deleteRow().run()}>Delete Row</DropdownMenuItem>
        <DropdownMenuItem onClick={() => editor.chain().focus().deleteTable().run()}>Delete Table</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function Toolbar({ editor }: { editor: Editor }) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)

  const setLink = () => {
    if (editor.isActive('link')) {
      if (editor.state.selection.empty) {
        const markType = editor.schema.marks.link
        editor.view.dispatch(editor.state.tr.removeStoredMark(markType))
      } else {
        editor.chain().focus().unsetLink().run()
      }
      return
    }
    const { from, to } = editor.state.selection
    const selectedText = editor.state.doc.textBetween(from, to, ' ')
    if (selectedText) {
      const url = selectedText.startsWith('http') ? selectedText : `https://${selectedText}`
      editor.chain().focus().setLink({ href: url }).run()
    } else {
      editor.chain().focus().setLink({ href: 'https://' }).run()
    }
  }

  const handleImageClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setIsUploading(true)
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', 'lesson-notes')

      const response = await api.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      const publicUrl = response.data?.data?.url
      if (publicUrl) {
        editor.chain().focus().setImage({ src: publicUrl }).run()
      } else {
        toast.error('Failed to get public URL from server')
      }
    } catch (error: any) {
      toast.error('Image upload failed', {
        description: error?.response?.data?.message || error?.message,
      })
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    editor.chain().focus().setColor(e.target.value).run()
  }

  const handleHighlightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    editor.chain().focus().toggleHighlight({ color: e.target.value }).run()
  }

  return (
    <div className="flex flex-wrap items-center gap-y-1 gap-x-0.5 border-b border-input p-1">
      <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
      
      <BlockTypeDropdown editor={editor} />
      <FontFamilyDropdown editor={editor} />
      
      <div className="mx-1 h-5 w-px bg-border hidden sm:block" />
      
      <ToolbarButton title="Bold" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>
        <Bold className="size-4" />
      </ToolbarButton>
      <ToolbarButton title="Italic" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>
        <Italic className="size-4" />
      </ToolbarButton>
      <ToolbarButton title="Underline" active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()}>
        <UnderlineIcon className="size-4" />
      </ToolbarButton>
      <ToolbarButton title="Strikethrough" active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()}>
        <Strikethrough className="size-4" />
      </ToolbarButton>

      <div className="mx-1 flex items-center h-7 px-1 gap-1">
        <label className="cursor-pointer" title="Text Color">
          <Baseline className="size-4" style={{ color: editor.getAttributes('textStyle').color || 'currentColor' }} />
          <input type="color" className="sr-only" onChange={handleColorChange} value={editor.getAttributes('textStyle').color || '#000000'} />
        </label>
        <label className="cursor-pointer" title="Highlight">
          <Highlighter className="size-4" style={{ color: editor.getAttributes('highlight').color || 'currentColor' }} />
          <input type="color" className="sr-only" onChange={handleHighlightChange} value={editor.getAttributes('highlight').color || '#ffff00'} />
        </label>
      </div>

      <div className="mx-1 h-5 w-px bg-border hidden sm:block" />

      <ToolbarButton title="Align Left" active={editor.isActive({ textAlign: 'left' })} onClick={() => editor.chain().focus().setTextAlign('left').run()}>
        <AlignLeft className="size-4" />
      </ToolbarButton>
      <ToolbarButton title="Align Center" active={editor.isActive({ textAlign: 'center' })} onClick={() => editor.chain().focus().setTextAlign('center').run()}>
        <AlignCenter className="size-4" />
      </ToolbarButton>
      <ToolbarButton title="Align Right" active={editor.isActive({ textAlign: 'right' })} onClick={() => editor.chain().focus().setTextAlign('right').run()}>
        <AlignRight className="size-4" />
      </ToolbarButton>
      <ToolbarButton title="Justify" active={editor.isActive({ textAlign: 'justify' })} onClick={() => editor.chain().focus().setTextAlign('justify').run()}>
        <AlignJustify className="size-4" />
      </ToolbarButton>

      <div className="mx-1 h-5 w-px bg-border hidden sm:block" />

      <ToolbarButton title="Subscript" active={editor.isActive('subscript')} onClick={() => editor.chain().focus().toggleSubscript().run()}>
        <SubscriptIcon className="size-4" />
      </ToolbarButton>
      <ToolbarButton title="Superscript" active={editor.isActive('superscript')} onClick={() => editor.chain().focus().toggleSuperscript().run()}>
        <SuperscriptIcon className="size-4" />
      </ToolbarButton>
      <ToolbarButton title="Inline code" active={editor.isActive('code')} onClick={() => editor.chain().focus().toggleCode().run()}>
        <Code className="size-4" />
      </ToolbarButton>
      <ToolbarButton title="Link" active={editor.isActive('link')} onClick={setLink}>
        <LinkIcon className="size-4" />
      </ToolbarButton>
      
      <ToolbarButton title="Image" active={editor.isActive('image')} onClick={handleImageClick} disabled={isUploading}>
        {isUploading ? <Loader2 className="size-4 animate-spin" /> : <ImageIcon className="size-4" />}
      </ToolbarButton>

      <div className="mx-1 h-5 w-px bg-border hidden md:block" />

      <ToolbarButton title="Bullet list" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>
        <List className="size-4" />
      </ToolbarButton>
      <ToolbarButton title="Numbered list" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
        <ListOrdered className="size-4" />
      </ToolbarButton>
      <ToolbarButton title="Checklist" active={editor.isActive('taskList')} onClick={() => editor.chain().focus().toggleTaskList().run()}>
        <CheckSquare className="size-4" />
      </ToolbarButton>
      <ToolbarButton title="Quote" active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
        <Quote className="size-4" />
      </ToolbarButton>
      <ToolbarButton title="Code block" active={editor.isActive('codeBlock')} onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
        <Code2 className="size-4" />
      </ToolbarButton>
      
      <TableDropdown editor={editor} />

      <ToolbarButton title="Horizontal rule" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
        <Minus className="size-4" />
      </ToolbarButton>

      <div className="mx-1 h-5 w-px bg-border hidden sm:block" />

      <ToolbarButton title="Undo" disabled={!editor.can().undo()} onClick={() => editor.chain().focus().undo().run()}>
        <Undo2 className="size-4" />
      </ToolbarButton>
      <ToolbarButton title="Redo" disabled={!editor.can().redo()} onClick={() => editor.chain().focus().redo().run()}>
        <Redo2 className="size-4" />
      </ToolbarButton>
    </div>
  )
}

export function RichTextEditor({
  value,
  onChange,
  placeholder,
  editable = true,
  className,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      CustomShortcuts,
      StarterKit,
      Placeholder.configure({ placeholder }),
      Link.configure({ openOnClick: false, autolink: true }),
      Image.configure({ inline: true }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      TextStyle,
      FontFamily,
      Color,
      Highlight.configure({ multicolor: true }),
      Underline,
      Subscript,
      Superscript,
      Table.configure({ resizable: true, allowTableNodeSelection: true }),
      TableRow,
      TableHeader,
      TableCell,
      TaskList,
      TaskItem.configure({ nested: true }),
      Markdown.configure({
        html: true,
        transformPastedText: true,
        transformCopiedText: true,
      }),
    ],
    content: value,
    editable,
    immediatelyRender: false,
    onUpdate: ({ editor: updatedEditor }) => {
      // Export as HTML to preserve complex MS Word-like formatting natively
      onChange?.(updatedEditor.getHTML())
    },
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[250px] px-4 py-3 text-sm',
          '[&>:first-child]:mt-0 [&>:last-child]:mb-0'
        ),
      },
    },
  })

  // Synchronize external value changes if necessary
  useEffect(() => {
    if (editor && value) {
      const currentContent = editor.getHTML()
      if (value !== currentContent) {
        // To avoid cursor jumping when editing, only sync if it really changed externally
        // (usually the caller passes back the same HTML we just gave them via onChange)
        // If it's a completely different value, it'll update.
        // Also handling initial load where value might be Markdown
        if (!editor.isFocused) {
            editor.commands.setContent(value, { emitUpdate: false })
        }
      }
    }
  }, [value, editor])

  if (!editor) return null

  return (
    <div
      className={cn(
        'border-input focus-within:border-ring focus-within:ring-ring/50 rounded-md border bg-transparent shadow-xs transition-[color,box-shadow] focus-within:ring-[3px]',
        !editable && 'bg-muted/30',
        className,
      )}
    >
      {editable && <Toolbar editor={editor} />}
      <div className="overflow-x-auto">
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
