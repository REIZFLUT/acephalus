import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Toggle } from '@/components/ui/toggle';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Bold,
    Italic,
    Strikethrough,
    Code,
    List,
    ListOrdered,
    Quote,
    Undo,
    Redo,
    Link as LinkIcon,
    Unlink,
    Heading1,
    Heading2,
    Heading3,
    Minus,
    Pilcrow,
    Table as TableIcon,
    Plus,
    Trash2,
    Rows3,
    Columns3,
    ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface WysiwygEditorProps {
    content: string;
    onChange: (content: string) => void;
    placeholder?: string;
    className?: string;
}

export function WysiwygEditor({ 
    content, 
    onChange, 
    placeholder = 'Start writing...', 
    className 
}: WysiwygEditorProps) {
    const [linkDialogOpen, setLinkDialogOpen] = useState(false);
    const [linkUrl, setLinkUrl] = useState('');
    const [linkTarget, setLinkTarget] = useState('_self');
    
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: {
                    levels: [1, 2, 3],
                },
            }),
            Placeholder.configure({
                placeholder,
            }),
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: 'text-primary underline cursor-pointer',
                },
            }),
            Table.configure({
                resizable: true,
                HTMLAttributes: {
                    class: 'border-collapse border border-border',
                },
            }),
            TableRow.configure({
                HTMLAttributes: {
                    class: 'border-b border-border',
                },
            }),
            TableCell.configure({
                HTMLAttributes: {
                    class: 'border border-border p-2 min-w-[100px]',
                },
            }),
            TableHeader.configure({
                HTMLAttributes: {
                    class: 'border border-border p-2 bg-muted font-semibold min-w-[100px]',
                },
            }),
        ],
        content,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: 'tiptap max-w-none focus:outline-none min-h-[150px] px-4 py-3',
            },
        },
    });

    // Update content when it changes externally
    useEffect(() => {
        if (editor && content !== editor.getHTML()) {
            editor.commands.setContent(content);
        }
    }, [content, editor]);

    if (!editor) return null;

    const openLinkDialog = () => {
        const previousUrl = editor.getAttributes('link').href || '';
        const previousTarget = editor.getAttributes('link').target || '_self';
        setLinkUrl(previousUrl);
        setLinkTarget(previousTarget);
        setLinkDialogOpen(true);
    };

    const setLink = () => {
        if (linkUrl === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
        } else {
            editor
                .chain()
                .focus()
                .extendMarkRange('link')
                .setLink({ href: linkUrl, target: linkTarget })
                .run();
        }
        setLinkDialogOpen(false);
        setLinkUrl('');
        setLinkTarget('_self');
    };

    const removeLink = () => {
        editor.chain().focus().unsetLink().run();
    };

    const insertTable = () => {
        editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
    };

    return (
        <>
            <div className={cn('border rounded-md bg-background', className)}>
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-1 p-2 border-b bg-muted/30">
                {/* Headings */}
                <div className="flex items-center gap-0.5">
                    <Toggle
                        size="sm"
                        pressed={editor.isActive('heading', { level: 1 })}
                        onPressedChange={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                        aria-label="Heading 1"
                    >
                        <Heading1 className="size-4" />
                    </Toggle>
                    <Toggle
                        size="sm"
                        pressed={editor.isActive('heading', { level: 2 })}
                        onPressedChange={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                        aria-label="Heading 2"
                    >
                        <Heading2 className="size-4" />
                    </Toggle>
                    <Toggle
                        size="sm"
                        pressed={editor.isActive('heading', { level: 3 })}
                        onPressedChange={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                        aria-label="Heading 3"
                    >
                        <Heading3 className="size-4" />
                    </Toggle>
                    <Toggle
                        size="sm"
                        pressed={editor.isActive('paragraph')}
                        onPressedChange={() => editor.chain().focus().setParagraph().run()}
                        aria-label="Paragraph"
                    >
                        <Pilcrow className="size-4" />
                    </Toggle>
                </div>

                <div className="w-px h-6 bg-border mx-1" />

                {/* Text Formatting */}
                <div className="flex items-center gap-0.5">
                    <Toggle
                        size="sm"
                        pressed={editor.isActive('bold')}
                        onPressedChange={() => editor.chain().focus().toggleBold().run()}
                        aria-label="Bold"
                    >
                        <Bold className="size-4" />
                    </Toggle>
                    <Toggle
                        size="sm"
                        pressed={editor.isActive('italic')}
                        onPressedChange={() => editor.chain().focus().toggleItalic().run()}
                        aria-label="Italic"
                    >
                        <Italic className="size-4" />
                    </Toggle>
                    <Toggle
                        size="sm"
                        pressed={editor.isActive('strike')}
                        onPressedChange={() => editor.chain().focus().toggleStrike().run()}
                        aria-label="Strikethrough"
                    >
                        <Strikethrough className="size-4" />
                    </Toggle>
                    <Toggle
                        size="sm"
                        pressed={editor.isActive('code')}
                        onPressedChange={() => editor.chain().focus().toggleCode().run()}
                        aria-label="Code"
                    >
                        <Code className="size-4" />
                    </Toggle>
                </div>

                <div className="w-px h-6 bg-border mx-1" />

                {/* Lists */}
                <div className="flex items-center gap-0.5">
                    <Toggle
                        size="sm"
                        pressed={editor.isActive('bulletList')}
                        onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
                        aria-label="Bullet List"
                    >
                        <List className="size-4" />
                    </Toggle>
                    <Toggle
                        size="sm"
                        pressed={editor.isActive('orderedList')}
                        onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
                        aria-label="Ordered List"
                    >
                        <ListOrdered className="size-4" />
                    </Toggle>
                    <Toggle
                        size="sm"
                        pressed={editor.isActive('blockquote')}
                        onPressedChange={() => editor.chain().focus().toggleBlockquote().run()}
                        aria-label="Quote"
                    >
                        <Quote className="size-4" />
                    </Toggle>
                </div>

                <div className="w-px h-6 bg-border mx-1" />

                {/* Link & Horizontal Rule */}
                <div className="flex items-center gap-0.5">
                    <Toggle
                        size="sm"
                        pressed={editor.isActive('link')}
                        onPressedChange={openLinkDialog}
                        aria-label="Link"
                    >
                        <LinkIcon className="size-4" />
                    </Toggle>
                    {editor.isActive('link') && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={removeLink}
                            className="h-8 px-2"
                        >
                            <Unlink className="size-4" />
                        </Button>
                    )}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => editor.chain().focus().setHorizontalRule().run()}
                        className="h-8 px-2"
                    >
                        <Minus className="size-4" />
                    </Button>
                </div>

                <div className="w-px h-6 bg-border mx-1" />

                {/* Table Controls */}
                <div className="flex items-center gap-0.5">
                    {!editor.isActive('table') ? (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={insertTable}
                            className="h-8 px-2"
                            title="Insert Table"
                        >
                            <TableIcon className="size-4" />
                        </Button>
                    ) : (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 px-2 gap-1"
                                >
                                    <TableIcon className="size-4" />
                                    <ChevronDown className="size-3" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-48">
                                <DropdownMenuItem onClick={() => editor.chain().focus().addColumnBefore().run()}>
                                    <Columns3 className="size-4 mr-2" />
                                    Add Column Before
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => editor.chain().focus().addColumnAfter().run()}>
                                    <Columns3 className="size-4 mr-2" />
                                    Add Column After
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => editor.chain().focus().deleteColumn().run()}>
                                    <Trash2 className="size-4 mr-2" />
                                    Delete Column
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => editor.chain().focus().addRowBefore().run()}>
                                    <Rows3 className="size-4 mr-2" />
                                    Add Row Before
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => editor.chain().focus().addRowAfter().run()}>
                                    <Rows3 className="size-4 mr-2" />
                                    Add Row After
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => editor.chain().focus().deleteRow().run()}>
                                    <Trash2 className="size-4 mr-2" />
                                    Delete Row
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeaderRow().run()}>
                                    Toggle Header Row
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeaderColumn().run()}>
                                    Toggle Header Column
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                    onClick={() => editor.chain().focus().deleteTable().run()}
                                    className="text-destructive focus:text-destructive"
                                >
                                    <Trash2 className="size-4 mr-2" />
                                    Delete Table
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>

                <div className="flex-1" />

                {/* Undo/Redo */}
                <div className="flex items-center gap-0.5">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => editor.chain().focus().undo().run()}
                        disabled={!editor.can().undo()}
                        className="h-8 px-2"
                    >
                        <Undo className="size-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => editor.chain().focus().redo().run()}
                        disabled={!editor.can().redo()}
                        className="h-8 px-2"
                    >
                        <Redo className="size-4" />
                    </Button>
                </div>
            </div>

            {/* Editor Content */}
            <EditorContent editor={editor} />
        </div>

        {/* Link Dialog */}
        <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Link einfügen/bearbeiten</DialogTitle>
                    <DialogDescription>
                        Geben Sie die URL und das Link-Ziel ein.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="link-url">URL</Label>
                        <Input
                            id="link-url"
                            placeholder="https://example.com"
                            value={linkUrl}
                            onChange={(e) => setLinkUrl(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    setLink();
                                }
                            }}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="link-target">Ziel</Label>
                        <Select value={linkTarget} onValueChange={setLinkTarget}>
                            <SelectTrigger id="link-target">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="_self">Gleiches Fenster (_self)</SelectItem>
                                <SelectItem value="_blank">Neues Fenster (_blank)</SelectItem>
                                <SelectItem value="_parent">Eltern-Frame (_parent)</SelectItem>
                                <SelectItem value="_top">Oberstes Fenster (_top)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => {
                            setLinkDialogOpen(false);
                            setLinkUrl('');
                            setLinkTarget('_self');
                        }}
                    >
                        Abbrechen
                    </Button>
                    <Button onClick={setLink}>
                        {linkUrl === '' ? 'Link entfernen' : 'Link setzen'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </>
    );
}
