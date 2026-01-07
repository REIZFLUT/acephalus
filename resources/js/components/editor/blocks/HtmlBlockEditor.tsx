import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HtmlCodeEditor } from '../CodeEditor';
import { BlockEditorProps } from '../BlockItem';
import { useSchema } from '../SchemaContext';
import { MetaFieldsEditor } from '../MetaFieldsEditor';

export default function HtmlBlockEditor({ block, onUpdate }: BlockEditorProps) {
    const { schema } = useSchema();
    const [activeTab, setActiveTab] = useState('code');
    const content = (block.data.content as string) || '';

    // Get custom fields for HTML element from schema
    const customFields = schema?.element_meta_fields?.html;
    const hasCustomFields = Array.isArray(customFields) && customFields.length > 0;

    const handleContentChange = (newContent: string) => {
        onUpdate({ ...block.data, content: newContent });
    };

    const handleMetaChange = (updates: Record<string, any>) => {
        onUpdate({ ...block.data, ...updates });
    };

    return (
        <div className="space-y-2">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="h-8">
                    <TabsTrigger value="code" className="text-xs">Code</TabsTrigger>
                    <TabsTrigger value="preview" className="text-xs">Preview</TabsTrigger>
                </TabsList>
                
                <TabsContent value="code" className="mt-2">
                    <HtmlCodeEditor
                        value={content}
                        onChange={handleContentChange}
                        minHeight="200px"
                    />
                </TabsContent>
                
                <TabsContent value="preview" className="mt-2">
                    <div 
                        className="border rounded-md p-4 min-h-[200px] bg-background prose prose-sm dark:prose-invert max-w-none"
                        dangerouslySetInnerHTML={{ __html: content }}
                    />
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
