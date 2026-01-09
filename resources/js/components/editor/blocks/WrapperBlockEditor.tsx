import type { WrapperElementData, WrapperPurpose, MetaFieldDefinition } from '@/types';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { BlockEditorProps } from '../BlockItem';
import { useSchema } from '../SchemaContext';
import { MetaFieldInput } from '../MetaFieldInput';
import { WrapperPurposeIcon, getWrapperPurposeIcon } from '@/components/WrapperPurposeIcon';
import { useTranslation } from '@/hooks/use-translation';

export default function WrapperBlockEditor({ block, onUpdate }: BlockEditorProps) {
    const { wrapperPurposes: contextPurposes, schema } = useSchema();
    const { resolveTranslation } = useTranslation();
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
    const SelectedIcon = getWrapperPurposeIcon(selectedPurpose?.icon);
    
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
                                <span>{resolveTranslation(selectedPurpose?.name) || 'Select purpose'}</span>
                            </div>
                        </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                        {purposes.map((purpose) => (
                            <SelectItem key={purpose.slug} value={purpose.slug}>
                                <div className="flex items-center gap-2">
                                    <WrapperPurposeIcon iconName={purpose.icon} className="size-4" />
                                    <div>
                                        <span className="font-medium">{resolveTranslation(purpose.name)}</span>
                                        {purpose.description && (
                                            <span className="text-muted-foreground text-xs ml-2">
                                                — {resolveTranslation(purpose.description)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </SelectItem>
                        ))}
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
