import { useState, useEffect, useRef } from 'react';
import type { KatexElementData } from '@/types';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Code, Eye, AlertCircle } from 'lucide-react';
import { BlockEditorProps } from '../BlockItem';
import { useSchema } from '../SchemaContext';
import { MetaFieldsEditor } from '../MetaFieldsEditor';
import katex from 'katex';
import 'katex/dist/katex.min.css';

// Common KaTeX formulas for quick reference
const commonFormulas = [
    { label: 'Fraction', formula: '\\frac{a}{b}' },
    { label: 'Square Root', formula: '\\sqrt{x}' },
    { label: 'Sum', formula: '\\sum_{i=1}^{n} x_i' },
    { label: 'Integral', formula: '\\int_{a}^{b} f(x) dx' },
    { label: 'Matrix', formula: '\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}' },
    { label: 'Limit', formula: '\\lim_{x \\to \\infty}' },
    { label: 'Greek α', formula: '\\alpha' },
    { label: 'Greek β', formula: '\\beta' },
    { label: 'Greek π', formula: '\\pi' },
    { label: 'Subscript', formula: 'x_{n}' },
    { label: 'Superscript', formula: 'x^{n}' },
];

export default function KatexBlockEditor({ block, onUpdate }: BlockEditorProps) {
    const { schema } = useSchema();
    const katexData = block.data as KatexElementData;
    const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
    const [renderError, setRenderError] = useState<string | null>(null);
    const previewRef = useRef<HTMLDivElement>(null);

    // Get custom fields for KaTeX element from schema
    const customFields = schema?.element_meta_fields?.katex;
    const hasCustomFields = Array.isArray(customFields) && customFields.length > 0;
    
    const handleChange = (updates: Partial<KatexElementData>) => {
        onUpdate({ ...katexData, ...updates });
    };

    const handleMetaChange = (updates: Record<string, any>) => {
        onUpdate({ ...katexData, ...updates });
    };
    
    const insertFormula = (formula: string) => {
        const current = katexData.formula || '';
        handleChange({ formula: current + formula });
    };

    // Render KaTeX preview
    useEffect(() => {
        if (previewRef.current && katexData.formula) {
            try {
                katex.render(katexData.formula, previewRef.current, {
                    displayMode: katexData.display_mode || false,
                    throwOnError: false,
                    errorColor: '#ef4444',
                });
                setRenderError(null);
            } catch (error) {
                setRenderError((error as Error).message);
            }
        } else if (previewRef.current) {
            previewRef.current.innerHTML = '<span class="text-muted-foreground text-sm">Enter a formula to see the preview</span>';
        }
    }, [katexData.formula, katexData.display_mode]);
    
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">KaTeX Formula</Label>
                <div className="flex items-center gap-2">
                    <Label htmlFor="display-mode" className="text-xs">Display Mode</Label>
                    <Switch
                        id="display-mode"
                        checked={katexData.display_mode || false}
                        onCheckedChange={(checked) => handleChange({ display_mode: checked })}
                    />
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'edit' | 'preview')}>
                <TabsList className="h-8">
                    <TabsTrigger value="edit" className="text-xs gap-1.5">
                        <Code className="size-3" />
                        Edit
                    </TabsTrigger>
                    <TabsTrigger value="preview" className="text-xs gap-1.5">
                        <Eye className="size-3" />
                        Preview
                    </TabsTrigger>
                </TabsList>
                
                <TabsContent value="edit" className="mt-3 space-y-3">
                    <Textarea
                        value={katexData.formula || ''}
                        onChange={(e) => handleChange({ formula: e.target.value })}
                        placeholder="E = mc^2"
                        rows={4}
                        className="font-mono text-sm"
                    />
                    
                    {/* Quick Insert */}
                    <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Quick Insert</Label>
                        <div className="flex flex-wrap gap-1">
                            {commonFormulas.map((item) => (
                                <button
                                    key={item.label}
                                    type="button"
                                    onClick={() => insertFormula(item.formula)}
                                    className="px-2 py-1 text-xs bg-muted rounded hover:bg-muted/80 transition-colors"
                                >
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Live Mini Preview */}
                    <div className="border rounded-md p-3 bg-muted/30 min-h-[60px]">
                        <div className="text-xs text-muted-foreground mb-2">Live Preview:</div>
                        <div 
                            ref={previewRef}
                            className="flex items-center justify-center min-h-[40px] text-lg"
                        />
                        {renderError && (
                            <div className="flex items-center gap-1 text-xs text-destructive mt-2">
                                <AlertCircle className="size-3" />
                                {renderError}
                            </div>
                        )}
                    </div>
                </TabsContent>
                
                <TabsContent value="preview" className="mt-3">
                    <div className="border rounded-md p-6 bg-background min-h-[150px] flex items-center justify-center">
                        {katexData.formula ? (
                            <div 
                                className={katexData.display_mode ? 'text-2xl' : 'text-xl'}
                                dangerouslySetInnerHTML={{
                                    __html: katex.renderToString(katexData.formula, {
                                        displayMode: katexData.display_mode || false,
                                        throwOnError: false,
                                        errorColor: '#ef4444',
                                    })
                                }}
                            />
                        ) : (
                            <span className="text-muted-foreground">No formula to preview</span>
                        )}
                    </div>
                </TabsContent>
            </Tabs>
            
            <p className="text-xs text-muted-foreground">
                Uses <a href="https://katex.org/docs/supported.html" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">KaTeX syntax</a>.
                Display mode centers the formula on its own line with larger text.
            </p>

            {/* Custom Meta Fields */}
            {hasCustomFields && (
                <MetaFieldsEditor 
                    fields={customFields} 
                    data={katexData as Record<string, any>} 
                    onChange={handleMetaChange} 
                />
            )}
        </div>
    );
}
