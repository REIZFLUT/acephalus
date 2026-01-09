import { useMemo } from 'react';
import type { BlockElement, CollectionSchema, WrapperPurpose } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Type,
    Image,
    Code,
    FileJson,
    FileCode,
    Sigma,
    Layers,
    Link2,
    ChevronDown,
    ChevronRight,
    GripVertical,
} from 'lucide-react';
import { WrapperPurposeIcon } from '@/components/WrapperPurposeIcon';
import { useCustomElements } from '@/hooks/use-custom-elements';
import { useTranslation } from '@/hooks/use-translation';
import { useState } from 'react';

interface BlockEditorReadonlyProps {
    elements: BlockElement[];
    schema?: CollectionSchema | null;
    wrapperPurposes?: WrapperPurpose[];
}

const ELEMENT_TYPE_CONFIG = {
    text: { icon: Type, label: 'Text', color: 'bg-blue-500/10 text-blue-700 dark:text-blue-400' },
    media: { icon: Image, label: 'Media', color: 'bg-purple-500/10 text-purple-700 dark:text-purple-400' },
    html: { icon: Code, label: 'HTML', color: 'bg-orange-500/10 text-orange-700 dark:text-orange-400' },
    json: { icon: FileJson, label: 'JSON', color: 'bg-green-500/10 text-green-700 dark:text-green-400' },
    xml: { icon: FileCode, label: 'XML', color: 'bg-red-500/10 text-red-700 dark:text-red-400' },
    svg: { icon: FileCode, label: 'SVG', color: 'bg-pink-500/10 text-pink-700 dark:text-pink-400' },
    katex: { icon: Sigma, label: 'KaTeX', color: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400' },
    wrapper: { icon: Layers, label: 'Wrapper', color: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400' },
    reference: { icon: Link2, label: 'Reference', color: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-400' },
};

export function BlockEditorReadonly({ 
    elements, 
    schema,
    wrapperPurposes = [],
}: BlockEditorReadonlyProps) {
    const { getDefinition } = useCustomElements();

    if (!elements || elements.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                <p>No elements in this version</p>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {elements.map((element, index) => (
                <BlockReadonly 
                    key={element.id || element._id || index} 
                    element={element}
                    wrapperPurposes={wrapperPurposes}
                    getDefinition={getDefinition}
                />
            ))}
        </div>
    );
}

interface BlockReadonlyProps {
    element: BlockElement;
    wrapperPurposes: WrapperPurpose[];
    getDefinition: (type: string) => any;
    depth?: number;
}

function BlockReadonly({ element, wrapperPurposes, getDefinition, depth = 0 }: BlockReadonlyProps) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const { resolveTranslation } = useTranslation();
    const data = element.data as Record<string, unknown>;
    
    const typeConfig = ELEMENT_TYPE_CONFIG[element.type as keyof typeof ELEMENT_TYPE_CONFIG];
    const customDefinition = !typeConfig ? getDefinition(element.type) : null;
    
    const Icon = typeConfig?.icon || Layers;
    // customDefinition?.label can be a LocalizableString, so resolve it
    const label = typeConfig?.label || resolveTranslation(customDefinition?.label) || element.type;
    const colorClass = typeConfig?.color || 'bg-gray-500/10 text-gray-700 dark:text-gray-400';

    const hasChildren = element.type === 'wrapper' && element.children && element.children.length > 0;

    return (
        <Card className={`border-l-4 ${depth > 0 ? 'ml-4' : ''} opacity-90`} style={{ borderLeftColor: 'var(--border)' }}>
            <div 
                className="flex items-center gap-2 p-3 bg-muted/30 cursor-pointer"
                onClick={() => hasChildren && setIsCollapsed(!isCollapsed)}
            >
                <GripVertical className="size-4 text-muted-foreground/50" />
                
                {hasChildren && (
                    isCollapsed ? (
                        <ChevronRight className="size-4 text-muted-foreground" />
                    ) : (
                        <ChevronDown className="size-4 text-muted-foreground" />
                    )
                )}
                
                <Badge variant="outline" className={`gap-1 ${colorClass}`}>
                    <Icon className="size-3" />
                    {label}
                </Badge>
                
                {element.type === 'wrapper' && data.purpose && (
                    <Badge variant="secondary" className="gap-1">
                        <WrapperPurposeIcon purpose={data.purpose as string} className="size-3" />
                        {data.purpose as string}
                    </Badge>
                )}
                
                {element.type === 'text' && data.format && (
                    <Badge variant="secondary" className="text-xs">
                        {data.format as string}
                    </Badge>
                )}
                
                {element.type === 'media' && data.media_type && (
                    <Badge variant="secondary" className="text-xs">
                        {data.media_type as string}
                    </Badge>
                )}

                <span className="text-xs text-muted-foreground ml-auto">
                    #{element.order}
                </span>
            </div>
            
            {!isCollapsed && (
                <CardContent className="pt-3 pb-3 space-y-3 pointer-events-none select-none">
                    <BlockContentReadonly 
                        element={element} 
                        wrapperPurposes={wrapperPurposes}
                        getDefinition={getDefinition}
                        depth={depth}
                    />
                </CardContent>
            )}
        </Card>
    );
}

interface BlockContentReadonlyProps {
    element: BlockElement;
    wrapperPurposes: WrapperPurpose[];
    getDefinition: (type: string) => any;
    depth: number;
}

function BlockContentReadonly({ element, wrapperPurposes, getDefinition, depth }: BlockContentReadonlyProps) {
    const data = element.data as Record<string, unknown>;

    switch (element.type) {
        case 'text':
            return (
                <div className="space-y-2">
                    {data.format === 'html' ? (
                        <div 
                            className="prose prose-sm dark:prose-invert max-w-none p-3 bg-muted/20 rounded border"
                            dangerouslySetInnerHTML={{ __html: (data.content as string) || '' }}
                        />
                    ) : data.format === 'markdown' ? (
                        <Textarea
                            value={(data.content as string) || ''}
                            readOnly
                            disabled
                            className="min-h-[100px] font-mono text-sm bg-muted/20"
                        />
                    ) : (
                        <Textarea
                            value={(data.content as string) || ''}
                            readOnly
                            disabled
                            className="min-h-[80px] bg-muted/20"
                        />
                    )}
                </div>
            );

        case 'media':
            return (
                <div className="space-y-3">
                    {data.url && (data.media_type === 'image') && (
                        <div className="relative aspect-video max-w-sm bg-muted rounded-lg overflow-hidden">
                            <img 
                                src={data.url as string} 
                                alt={(data.alt as string) || ''} 
                                className="object-contain w-full h-full"
                            />
                        </div>
                    )}
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <Label className="text-xs text-muted-foreground">Alt Text</Label>
                            <Input value={(data.alt as string) || ''} readOnly disabled className="bg-muted/20" />
                        </div>
                        <div>
                            <Label className="text-xs text-muted-foreground">Caption</Label>
                            <Input value={(data.caption as string) || ''} readOnly disabled className="bg-muted/20" />
                        </div>
                    </div>
                </div>
            );

        case 'html':
        case 'json':
        case 'xml':
        case 'svg':
            return (
                <Textarea
                    value={(data.content as string) || ''}
                    readOnly
                    disabled
                    className="min-h-[100px] font-mono text-xs bg-muted/20"
                />
            );

        case 'katex':
            return (
                <div className="space-y-2">
                    <Textarea
                        value={(data.expression as string) || ''}
                        readOnly
                        disabled
                        placeholder="LaTeX expression"
                        className="font-mono text-sm bg-muted/20"
                    />
                    {data.display_mode !== undefined && (
                        <Badge variant="outline" className="text-xs">
                            {data.display_mode ? 'Display Mode' : 'Inline Mode'}
                        </Badge>
                    )}
                </div>
            );

        case 'wrapper':
            return (
                <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-2">
                        <div>
                            <Label className="text-xs text-muted-foreground">Layout</Label>
                            <Input value={(data.layout as string) || 'vertical'} readOnly disabled className="bg-muted/20" />
                        </div>
                        <div>
                            <Label className="text-xs text-muted-foreground">Gap</Label>
                            <Input value={(data.gap as string) || '1rem'} readOnly disabled className="bg-muted/20" />
                        </div>
                        <div>
                            <Label className="text-xs text-muted-foreground">Purpose</Label>
                            <Input value={(data.purpose as string) || ''} readOnly disabled className="bg-muted/20" />
                        </div>
                    </div>
                    
                    {element.children && element.children.length > 0 && (
                        <div className="border-l-2 border-dashed pl-2 space-y-2">
                            <Label className="text-xs text-muted-foreground">
                                Children ({element.children.length})
                            </Label>
                            {element.children.map((child, index) => (
                                <BlockReadonly
                                    key={child.id || child._id || index}
                                    element={child}
                                    wrapperPurposes={wrapperPurposes}
                                    getDefinition={getDefinition}
                                    depth={depth + 1}
                                />
                            ))}
                        </div>
                    )}
                </div>
            );

        case 'reference':
            return (
                <div className="space-y-2 p-3 bg-muted/20 rounded border">
                    <div className="flex items-center gap-2">
                        <Badge variant="outline">{(data.reference_type as string) || 'content'}</Badge>
                    </div>
                    {data.display_title && (
                        <p className="text-sm text-muted-foreground truncate">
                            {data.display_title as string}
                        </p>
                    )}
                    <div className="text-xs text-muted-foreground font-mono">
                        {data.content_id && <div>Content: {data.content_id as string}</div>}
                        {data.element_id && <div>Element: {data.element_id as string}</div>}
                    </div>
                </div>
            );

        default:
            // Custom element or unknown type - show as JSON
            return (
                <pre className="p-3 bg-muted/20 rounded border text-xs font-mono overflow-x-auto">
                    {JSON.stringify(data, null, 2)}
                </pre>
            );
    }
}

