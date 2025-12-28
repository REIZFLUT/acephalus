import type { ElementType } from '@/types';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
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
} from 'lucide-react';

interface AddBlockMenuProps {
    onAdd: (type: ElementType) => void;
    allowedTypes?: ElementType[];
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
];

export function AddBlockMenu({ onAdd, allowedTypes, variant = 'default', size = 'default' }: AddBlockMenuProps) {
    const filteredTypes = allowedTypes 
        ? blockTypes.filter(bt => allowedTypes.includes(bt.type))
        : blockTypes;

    const contentBlocks = filteredTypes.filter(bt => bt.category === 'content');
    const dataBlocks = filteredTypes.filter(bt => bt.category === 'data');
    const layoutBlocks = filteredTypes.filter(bt => bt.category === 'layout');

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
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

