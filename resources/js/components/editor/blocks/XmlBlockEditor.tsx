import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { XmlCodeEditor } from '../CodeEditor';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { BlockEditorProps } from '../BlockItem';
import { useSchema } from '../SchemaContext';
import { MetaFieldsEditor } from '../MetaFieldsEditor';

export default function XmlBlockEditor({ block, onUpdate }: BlockEditorProps) {
    const { schema } = useSchema();
    const [activeTab, setActiveTab] = useState('code');
    const content = (block.data.content as string) || '';
    const schemaUrl = (block.data.schema_url as string) || '';

    // Get custom fields for XML element from schema
    const customFields = schema?.element_meta_fields?.xml;
    const hasCustomFields = Array.isArray(customFields) && customFields.length > 0;

    const handleContentChange = (newContent: string) => {
        onUpdate({ ...block.data, content: newContent });
    };

    const handleSchemaChange = (newSchema: string) => {
        onUpdate({ ...block.data, schema_url: newSchema });
    };

    const handleMetaChange = (updates: Record<string, any>) => {
        onUpdate({ ...block.data, ...updates });
    };

    // Simple XML formatting for preview
    const formatXmlForPreview = (xml: string): string => {
        try {
            let formatted = '';
            let indent = 0;
            const parts = xml.replace(/>\s*</g, '><').split(/(<[^>]+>)/g);
            
            parts.forEach(part => {
                if (!part.trim()) return;
                
                if (part.match(/^<\/\w/)) {
                    indent--;
                }
                
                formatted += '  '.repeat(Math.max(0, indent)) + part + '\n';
                
                if (part.match(/^<\w[^>]*[^\/]>$/) && !part.match(/^<\?/)) {
                    indent++;
                }
            });
            
            return formatted.trim();
        } catch {
            return xml;
        }
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-3">
                <Label className="text-sm text-muted-foreground shrink-0">Schema URL:</Label>
                <Input
                    value={schemaUrl}
                    onChange={(e) => handleSchemaChange(e.target.value)}
                    placeholder="https://example.com/schema.xsd (optional)"
                    className="h-8 text-sm"
                />
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="h-8">
                    <TabsTrigger value="code" className="text-xs">Code</TabsTrigger>
                    <TabsTrigger value="preview" className="text-xs">Formatted</TabsTrigger>
                </TabsList>
                
                <TabsContent value="code" className="mt-2">
                    <XmlCodeEditor
                        value={content}
                        onChange={handleContentChange}
                        minHeight="200px"
                    />
                </TabsContent>
                
                <TabsContent value="preview" className="mt-2">
                    <pre className="border rounded-md p-4 min-h-[200px] bg-muted/30 text-sm font-mono overflow-auto whitespace-pre">
                        {formatXmlForPreview(content)}
                    </pre>
                </TabsContent>
            </Tabs>

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
