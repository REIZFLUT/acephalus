import { useState } from 'react';
import type { SvgElementData } from '@/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CodeEditor } from '../CodeEditor';
import { Eye, Code } from 'lucide-react';
import { BlockEditorProps } from '../BlockItem';
import { useSchema } from '../BlockEditor';
import { MetaFieldsEditor } from '../MetaFieldsEditor';

export default function SvgBlockEditor({ block, onUpdate }: BlockEditorProps) {
    const { schema } = useSchema();
    const svgData = block.data as SvgElementData;
    const [activeTab, setActiveTab] = useState<'code' | 'preview'>('code');
    
    // Get custom fields from schema
    const customFields = schema?.element_meta_fields?.svg;
    const hasCustomFields = Array.isArray(customFields) && customFields.length > 0;
    
    const handleChange = (updates: Partial<SvgElementData>) => {
        onUpdate({ ...svgData, ...updates });
    };
    
    return (
        <div className="space-y-3">
            {hasCustomFields && (
                <MetaFieldsEditor 
                    fields={customFields} 
                    data={svgData} 
                    onChange={handleChange} 
                />
            )}

            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'code' | 'preview')}>
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
                
                <TabsContent value="code" className="mt-3">
                    <CodeEditor
                        value={svgData.content || ''}
                        onChange={(content) => handleChange({ content })}
                        language="xml"
                        minHeight="150px"
                    />
                </TabsContent>
                
                <TabsContent value="preview" className="mt-3">
                    <div 
                        className="min-h-[120px] p-4 border rounded-md bg-background flex items-center justify-center [&>svg]:max-h-32 [&>svg]:max-w-full"
                        dangerouslySetInnerHTML={{ 
                            __html: svgData.content || '<span class="text-muted-foreground text-sm">No SVG to preview</span>' 
                        }}
                    />
                </TabsContent>
            </Tabs>
        </div>
    );
}
