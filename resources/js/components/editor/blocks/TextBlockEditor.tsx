import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { WysiwygEditor } from '../WysiwygEditor';
import { CodeEditor } from '../CodeEditor';
import { BlockEditorProps } from '../BlockItem';
import { useSchema } from '../SchemaContext';
import { MetaFieldsEditor } from '../MetaFieldsEditor';
import { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, Code } from 'lucide-react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import 'katex/dist/katex.min.css';

const formatLabels: Record<string, string> = {
    plain: 'Plain Text',
    markdown: 'Markdown',
    html: 'Rich Text',
};

const syntaxOptions = [
    { value: 'text', label: 'Plain Text' },
    { value: 'html', label: 'HTML' },
    { value: 'json', label: 'JSON' },
    { value: 'xml', label: 'XML' },
    { value: 'markdown', label: 'Markdown' },
    { value: 'javascript', label: 'JavaScript' },
    { value: 'css', label: 'CSS' },
    { value: 'php', label: 'PHP' },
];

export default function TextBlockEditor({ block, onUpdate }: BlockEditorProps) {
    const { getTextFormats, schema } = useSchema();
    const allowedFormats = getTextFormats();
    
    const format = (block.data.format as string) || allowedFormats[0] || 'plain';
    const content = (block.data.content as string) || '';
    const syntax = (block.data.syntax as string) || 'text';
    
    const [mdViewMode, setMdViewMode] = useState<'code' | 'preview'>('code');
    
    // Get custom fields for text element from schema
    const customFields = schema?.element_meta_fields?.text;
    const hasCustomFields = Array.isArray(customFields) && customFields.length > 0;
    
    const handleMetaChange = (updates: Record<string, any>) => {
        onUpdate({ ...block.data, ...updates });
    };

    // If current format is not allowed, switch to the first allowed format
    useEffect(() => {
        if (!allowedFormats.includes(format as 'plain' | 'markdown' | 'html')) {
            onUpdate({ ...block.data, format: allowedFormats[0] });
        }
    }, [allowedFormats, format, block.data, onUpdate]);

    const handleFormatChange = (newFormat: string) => {
        onUpdate({ ...block.data, format: newFormat });
    };

    const handleContentChange = (newContent: string) => {
        onUpdate({ ...block.data, content: newContent });
    };

    const handleSyntaxChange = (newSyntax: string) => {
        onUpdate({ ...block.data, syntax: newSyntax });
    };

    // Show format selector only if there are multiple options
    const showFormatSelector = allowedFormats.length > 1;

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
                {showFormatSelector ? (
                    <div className="flex items-center gap-3">
                        <Label className="text-sm text-muted-foreground">Format:</Label>
                        <Select value={format} onValueChange={handleFormatChange}>
                            <SelectTrigger className="w-36 h-8">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {allowedFormats.map((f) => (
                                    <SelectItem key={f} value={f}>
                                        {formatLabels[f] || f}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                ) : (
                    <p className="text-xs text-muted-foreground">
                        Format: {formatLabels[format] || format}
                    </p>
                )}

                {/* Plain Text Syntax Selection */}
                {format === 'plain' && (
                    <div className="flex items-center gap-3">
                        <Label className="text-sm text-muted-foreground">Syntax:</Label>
                        <Select value={syntax} onValueChange={handleSyntaxChange}>
                            <SelectTrigger className="w-36 h-8">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {syntaxOptions.map((opt) => (
                                    <SelectItem key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}
            </div>

            {format === 'html' ? (
                <WysiwygEditor
                    content={content}
                    onChange={handleContentChange}
                    placeholder="Start writing your content..."
                />
            ) : format === 'markdown' ? (
                <div className="space-y-2">
                    <Tabs value={mdViewMode} onValueChange={(v) => setMdViewMode(v as 'code' | 'preview')}>
                        <TabsList className="h-8">
                            <TabsTrigger value="code" className="text-xs gap-1.5">
                                <Code className="size-3" />
                                Code
                            </TabsTrigger>
                            <TabsTrigger value="preview" className="text-xs gap-1.5">
                                <Eye className="size-3" />
                                Preview
                            </TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="code" className="mt-2">
                            <CodeEditor
                                value={content}
                                onChange={handleContentChange}
                                language="markdown"
                                placeholder="# Heading\n\nWrite your **markdown** content here..."
                                minHeight="200px"
                            />
                        </TabsContent>
                        
                        <TabsContent value="preview" className="mt-2">
                            <div className="border rounded-md p-4 min-h-[200px] bg-background overflow-auto markdown-preview">
                                <Markdown 
                                    remarkPlugins={[remarkGfm, remarkMath]}
                                    rehypePlugins={[rehypeRaw, rehypeKatex]}
                                >
                                    {content}
                                </Markdown>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            ) : (
                <CodeEditor
                    value={content}
                    onChange={handleContentChange}
                    language={syntax as any}
                    placeholder="Enter your text content..."
                    minHeight="200px"
                />
            )}

            {/* Custom Meta Fields */}
            {hasCustomFields && (
                <MetaFieldsEditor 
                    fields={customFields} 
                    data={block.data as Record<string, any>} 
                    onChange={handleMetaChange} 
                />
            )}
        </div>
    );
}
