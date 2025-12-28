import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HtmlCodeEditor } from '../CodeEditor';
import { BlockEditorProps } from '../BlockItem';

export default function HtmlBlockEditor({ block, onUpdate }: BlockEditorProps) {
    const [activeTab, setActiveTab] = useState('code');
    const content = (block.data.content as string) || '';

    const handleContentChange = (newContent: string) => {
        onUpdate({ ...block.data, content: newContent });
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
        </div>
    );
}
