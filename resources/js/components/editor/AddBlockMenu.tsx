import { useMemo } from 'react';
import type { ElementType, CustomElementDefinition } from '@/types';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import * as LucideIcons from 'lucide-react';
import { 
    Plus,
    Type,
    Image,
    Code,
    FileJson,
    FileCode2,
    FileText,
    Hash,
    Layers,
    Box,
    Link2,
} from 'lucide-react';
import { useCustomElements } from '@/hooks/use-custom-elements';
import { useTranslation } from '@/hooks/use-translation';

interface AddBlockMenuProps {
    onAdd: (type: ElementType | string) => void;
    allowedTypes?: (ElementType | string)[];
    allowCustomElements?: boolean;
    variant?: 'default' | 'primary';
    size?: 'default' | 'sm';
}

interface BlockTypeInfo {
    type: ElementType;
    label: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    category: 'content' | 'data' | 'layout';
}

const blockTypes: BlockTypeInfo[] = [
    {
        type: 'text',
        label: 'Text',
        description: 'Plain text, Markdown, or HTML',
        icon: Type,
        category: 'content',
    },
    {
        type: 'media',
        label: 'Media',
        description: 'Images, videos, and audio',
        icon: Image,
        category: 'content',
    },
    {
        type: 'html',
        label: 'HTML',
        description: 'Custom HTML code',
        icon: Code,
        category: 'content',
    },
    {
        type: 'svg',
        label: 'SVG',
        description: 'Vector graphics',
        icon: FileText,
        category: 'content',
    },
    {
        type: 'katex',
        label: 'KaTeX',
        description: 'Mathematical formulas',
        icon: Hash,
        category: 'content',
    },
    {
        type: 'json',
        label: 'JSON',
        description: 'Structured JSON data',
        icon: FileJson,
        category: 'data',
    },
    {
        type: 'xml',
        label: 'XML',
        description: 'XML content',
        icon: FileCode2,
        category: 'data',
    },
    {
        type: 'wrapper',
        label: 'Wrapper',
        description: 'Group and nest elements',
        icon: Layers,
        category: 'layout',
    },
    {
        type: 'reference',
        label: 'Reference',
        description: 'Link to collection, content, or element',
        icon: Link2,
        category: 'data',
    },
];

// Helper to get Lucide icon by name
function getLucideIcon(iconName: string): React.ComponentType<{ className?: string }> {
    const pascalName = iconName
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join('');
    
    const IconComponent = (LucideIcons as Record<string, React.ComponentType<{ className?: string }>>)[pascalName];
    return IconComponent || Box;
}

export function AddBlockMenu({ onAdd, allowedTypes, allowCustomElements = true, variant = 'default', size = 'default' }: AddBlockMenuProps) {
    const { definitions: customElements, isLoading } = useCustomElements();
    const { resolveTranslation } = useTranslation();

    // Combine built-in and custom block types
    const allBlockTypes = useMemo(() => {
        const builtIn = allowedTypes 
            ? blockTypes.filter(bt => allowedTypes.includes(bt.type))
            : blockTypes;

        if (!allowCustomElements || isLoading) {
            return builtIn;
        }

        // Convert custom elements to BlockTypeInfo format
        // Note: ce.label and ce.description are LocalizableString, so we resolve them here
        const customBlocks: BlockTypeInfo[] = customElements
            .filter(ce => !allowedTypes || allowedTypes.includes(ce.type))
            .map(ce => ({
                type: ce.type as ElementType,
                label: resolveTranslation(ce.label),
                description: resolveTranslation(ce.description) || '',
                icon: getLucideIcon(ce.icon || 'box'),
                category: ce.category as 'content' | 'data' | 'layout',
            }));

        return [...builtIn, ...customBlocks];
    }, [allowedTypes, customElements, allowCustomElements, isLoading, resolveTranslation]);

    const contentBlocks = allBlockTypes.filter(bt => bt.category === 'content');
    const dataBlocks = allBlockTypes.filter(bt => bt.category === 'data');
    const layoutBlocks = allBlockTypes.filter(bt => bt.category === 'layout');
    const interactiveBlocks = allBlockTypes.filter(bt => (bt as any).category === 'interactive');
    const mediaBlocks = allBlockTypes.filter(bt => (bt as any).category === 'media');

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button 
                    variant={variant === 'primary' ? 'default' : 'outline'} 
                    size={size}
                    className={size === 'sm' ? 'h-8 text-xs' : ''}
                >
                    <Plus className={size === 'sm' ? 'size-3 mr-1' : 'size-4 mr-2'} />
                    Add Block
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64">
                {contentBlocks.length > 0 && (
                    <>
                        <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                            Content
                        </DropdownMenuLabel>
                        {contentBlocks.map((block) => (
                            <DropdownMenuItem 
                                key={block.type}
                                onClick={() => onAdd(block.type)}
                                className="flex items-start gap-3 py-2"
                            >
                                <block.icon className="size-4 mt-0.5 shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <div className="font-medium text-sm">{block.label}</div>
                                    <div className="text-xs text-muted-foreground truncate">
                                        {block.description}
                                    </div>
                                </div>
                            </DropdownMenuItem>
                        ))}
                    </>
                )}

                {dataBlocks.length > 0 && (
                    <>
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                            Data
                        </DropdownMenuLabel>
                        {dataBlocks.map((block) => (
                            <DropdownMenuItem 
                                key={block.type}
                                onClick={() => onAdd(block.type)}
                                className="flex items-start gap-3 py-2"
                            >
                                <block.icon className="size-4 mt-0.5 shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <div className="font-medium text-sm">{block.label}</div>
                                    <div className="text-xs text-muted-foreground truncate">
                                        {block.description}
                                    </div>
                                </div>
                            </DropdownMenuItem>
                        ))}
                    </>
                )}

                {layoutBlocks.length > 0 && (
                    <>
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                            Layout
                        </DropdownMenuLabel>
                        {layoutBlocks.map((block) => (
                            <DropdownMenuItem 
                                key={block.type}
                                onClick={() => onAdd(block.type)}
                                className="flex items-start gap-3 py-2"
                            >
                                <block.icon className="size-4 mt-0.5 shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <div className="font-medium text-sm">{block.label}</div>
                                    <div className="text-xs text-muted-foreground truncate">
                                        {block.description}
                                    </div>
                                </div>
                            </DropdownMenuItem>
                        ))}
                    </>
                )}

                {interactiveBlocks.length > 0 && (
                    <>
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                            Interactive
                        </DropdownMenuLabel>
                        {interactiveBlocks.map((block) => (
                            <DropdownMenuItem 
                                key={block.type}
                                onClick={() => onAdd(block.type)}
                                className="flex items-start gap-3 py-2"
                            >
                                <block.icon className="size-4 mt-0.5 shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <div className="font-medium text-sm">{block.label}</div>
                                    <div className="text-xs text-muted-foreground truncate">
                                        {block.description}
                                    </div>
                                </div>
                            </DropdownMenuItem>
                        ))}
                    </>
                )}

                {mediaBlocks.length > 0 && (
                    <>
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                            Media
                        </DropdownMenuLabel>
                        {mediaBlocks.map((block) => (
                            <DropdownMenuItem 
                                key={block.type}
                                onClick={() => onAdd(block.type)}
                                className="flex items-start gap-3 py-2"
                            >
                                <block.icon className="size-4 mt-0.5 shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <div className="font-medium text-sm">{block.label}</div>
                                    <div className="text-xs text-muted-foreground truncate">
                                        {block.description}
                                    </div>
                                </div>
                            </DropdownMenuItem>
                        ))}
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

