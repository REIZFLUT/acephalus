import type { WrapperElementData, WrapperPurpose, MetaFieldDefinition } from '@/types';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { 
    Info, 
    ChevronDown, 
    Images, 
    Quote, 
    AlertTriangle, 
    CheckCircle2, 
    Lightbulb,
    BookOpen,
    Code2,
    Columns3,
    Grid3X3,
    MessageSquare,
    Box,
    type LucideIcon,
} from 'lucide-react';
import { BlockEditorProps } from '../BlockItem';
import { useSchema } from '../BlockEditor';
import { MetaFieldInput } from '../MetaFieldInput';

// Icon mapping for wrapper purposes
const iconMap: Record<string, LucideIcon> = {
    'box': Box,
    'info': Info,
    'chevron-down': ChevronDown,
    'images': Images,
    'quote': Quote,
    'alert-triangle': AlertTriangle,
    'check-circle': CheckCircle2,
    'lightbulb': Lightbulb,
    'file-text': BookOpen,
    'code': Code2,
    'columns': Columns3,
    'grid': Grid3X3,
    'megaphone': MessageSquare,
};

function getIcon(iconName: string | null | undefined): LucideIcon {
    if (!iconName) return Box;
    return iconMap[iconName] || Box;
}

export default function WrapperBlockEditor({ block, onUpdate }: BlockEditorProps) {
    const { wrapperPurposes: contextPurposes, schema } = useSchema();
    const wrapperData = block.data as WrapperElementData;
    
    // Use purposes from context, or fallback to default
    const purposes = contextPurposes.length > 0 ? contextPurposes : [
        { _id: 'default', slug: 'generic', name: 'Generic Container', description: 'A general-purpose container', icon: 'box', css_class: null, is_system: true } as WrapperPurpose,
    ];

    // Get wrapper meta fields from schema (for custom fields like CSS class)
    const wrapperMetaFields = schema?.element_meta_fields?.wrapper || [];
    
    const handleChange = (updates: Partial<WrapperElementData>) => {
        onUpdate({ ...wrapperData, ...updates });
    };

    const selectedPurpose = purposes.find(p => p.slug === wrapperData.purpose) || purposes[0];
    const SelectedIcon = getIcon(selectedPurpose?.icon);
    
    return (
        <div className="space-y-3">
            {/* Purpose Selection - Primary control */}
            <div className="flex items-center gap-3">
                <Label className="text-xs text-muted-foreground shrink-0">Purpose</Label>
                <Select
                    value={wrapperData.purpose || 'generic'}
                    onValueChange={(value) => handleChange({ purpose: value })}
                >
                    <SelectTrigger className="h-9 flex-1">
                        <SelectValue>
                            <div className="flex items-center gap-2">
                                <SelectedIcon className="size-4" />
                                <span>{selectedPurpose?.name || 'Select purpose'}</span>
                            </div>
                        </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                        {purposes.map((purpose) => {
                            const Icon = getIcon(purpose.icon);
                            return (
                                <SelectItem key={purpose.slug} value={purpose.slug}>
                                    <div className="flex items-center gap-2">
                                        <Icon className="size-4" />
                                        <div>
                                            <span className="font-medium">{purpose.name}</span>
                                            {purpose.description && (
                                                <span className="text-muted-foreground text-xs ml-2">
                                                    — {purpose.description}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </SelectItem>
                            );
                        })}
                    </SelectContent>
                </Select>
            </div>

            {/* Render wrapper meta fields from schema if any */}
            {wrapperMetaFields.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-border/50">
                    {wrapperMetaFields.map((field: MetaFieldDefinition) => (
                        <MetaFieldInput
                            key={field.name}
                            field={field}
                            value={(wrapperData as Record<string, unknown>)[field.name]}
                            onChange={(value) => handleChange({ [field.name]: value } as Partial<WrapperElementData>)}
                            compact
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
