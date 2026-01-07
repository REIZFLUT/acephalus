import { useState, useEffect, useCallback } from 'react';
import type { MetaFieldDefinition } from '@/types';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { BlockEditorProps } from '../BlockItem';
import { ReferencePicker, ReferenceValue, ReferenceType } from '../ReferencePicker';
import { useSchema } from '../SchemaContext';
import { MetaFieldInput } from '../MetaFieldInput';
import { Folder, FileText, Box, Filter } from 'lucide-react';

interface FilterViewOption {
    _id: string;
    name: string;
    slug: string;
    description: string | null;
    is_system: boolean;
}

const referenceTypes: { value: ReferenceType; label: string; description: string; icon: React.ReactNode }[] = [
    {
        value: 'collection',
        label: 'Collection',
        description: 'Reference an entire collection',
        icon: <Folder className="size-4 text-amber-500" />,
    },
    {
        value: 'content',
        label: 'Content',
        description: 'Reference a specific content item',
        icon: <FileText className="size-4 text-blue-500" />,
    },
    {
        value: 'element',
        label: 'Element',
        description: 'Reference a specific element within content',
        icon: <Box className="size-4 text-purple-500" />,
    },
];

export default function ReferenceBlockEditor({ block, onUpdate }: BlockEditorProps) {
    const { schema } = useSchema();
    const referenceType = (block.data.reference_type as ReferenceType) || 'content';
    
    // Get reference meta fields from schema
    const referenceMetaFields = schema?.element_meta_fields?.reference || [];
    
    // Filter views state for collection references
    const [filterViews, setFilterViews] = useState<FilterViewOption[]>([]);
    const [isLoadingFilterViews, setIsLoadingFilterViews] = useState(false);
    
    const referenceValue: ReferenceValue | null = block.data.collection_id ? {
        reference_type: referenceType,
        collection_id: block.data.collection_id as string,
        content_id: block.data.content_id as string,
        element_id: block.data.element_id as string,
        filter_view_id: block.data.filter_view_id as string,
        display_title: block.data.display_title as string,
    } : null;
    
    // Fetch filter views when collection is selected and type is 'collection'
    const fetchFilterViews = useCallback(async (collectionId: string) => {
        setIsLoadingFilterViews(true);
        try {
            const response = await fetch(`/api/v1/references/collections/${collectionId}/filter-views`, {
                credentials: 'include',
            });
            if (response.ok) {
                const data = await response.json();
                setFilterViews(data.data || []);
            }
        } catch (error) {
            console.error('Failed to fetch filter views:', error);
            setFilterViews([]);
        } finally {
            setIsLoadingFilterViews(false);
        }
    }, []);
    
    // Fetch filter views when collection changes
    useEffect(() => {
        if (referenceType === 'collection' && block.data.collection_id) {
            fetchFilterViews(block.data.collection_id as string);
        } else {
            setFilterViews([]);
        }
    }, [referenceType, block.data.collection_id, fetchFilterViews]);

    const handleTypeChange = (newType: ReferenceType) => {
        // Reset selection when type changes
        onUpdate({
            ...block.data,
            reference_type: newType,
            collection_id: undefined,
            content_id: undefined,
            element_id: undefined,
            filter_view_id: undefined,
            display_title: undefined,
        });
    };

    const handleReferenceChange = (value: ReferenceValue | null) => {
        if (value) {
            // Keep filter_view_id if same collection is selected, otherwise reset it
            const keepFilterView = value.reference_type === 'collection' && 
                value.collection_id === block.data.collection_id;
            
            onUpdate({
                ...block.data,
                reference_type: value.reference_type,
                collection_id: value.collection_id,
                content_id: value.content_id,
                element_id: value.element_id,
                filter_view_id: keepFilterView ? block.data.filter_view_id : undefined,
                display_title: value.display_title,
            });
        } else {
            onUpdate({
                ...block.data,
                collection_id: undefined,
                content_id: undefined,
                element_id: undefined,
                filter_view_id: undefined,
                display_title: undefined,
            });
        }
    };
    
    const handleFilterViewChange = (filterViewId: string) => {
        const selectedView = filterViews.find(v => v._id === filterViewId);
        onUpdate({
            ...block.data,
            filter_view_id: filterViewId === 'none' ? undefined : filterViewId,
        });
    };

    const handleMetaFieldChange = (name: string, value: unknown) => {
        onUpdate({
            ...block.data,
            [name]: value,
        });
    };

    // Determine min/max depth based on selected type
    const getDepthConstraints = (): { minDepth: ReferenceType; maxDepth: ReferenceType } => {
        switch (referenceType) {
            case 'collection':
                return { minDepth: 'collection', maxDepth: 'collection' };
            case 'content':
                return { minDepth: 'content', maxDepth: 'content' };
            case 'element':
                return { minDepth: 'element', maxDepth: 'element' };
            default:
                return { minDepth: 'collection', maxDepth: 'element' };
        }
    };

    const { minDepth, maxDepth } = getDepthConstraints();

    return (
        <div className="space-y-4">
            {/* Reference Type Selection */}
            <div className="space-y-2">
                <Label className="text-sm font-medium">Reference Type</Label>
                <RadioGroup
                    value={referenceType}
                    onValueChange={(value) => handleTypeChange(value as ReferenceType)}
                    className="grid grid-cols-3 gap-3"
                >
                    {referenceTypes.map((type) => (
                        <label
                            key={type.value}
                            className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5"
                        >
                            <RadioGroupItem value={type.value} className="mt-1" />
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 font-medium text-sm">
                                    {type.icon}
                                    {type.label}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {type.description}
                                </p>
                            </div>
                        </label>
                    ))}
                </RadioGroup>
            </div>

            {/* Reference Picker */}
            <div className="space-y-2">
                <Label className="text-sm font-medium">
                    Select {referenceType.charAt(0).toUpperCase() + referenceType.slice(1)}
                </Label>
                <ReferencePicker
                    value={referenceValue}
                    onChange={handleReferenceChange}
                    minDepth={minDepth}
                    maxDepth={maxDepth}
                    placeholder={`Choose a ${referenceType}...`}
                />
            </div>

            {/* Filter View Selection - only for collection references */}
            {referenceType === 'collection' && referenceValue?.collection_id && (
                <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                        <Filter className="size-4 text-muted-foreground" />
                        Filter View (optional)
                    </Label>
                    <Select
                        value={block.data.filter_view_id as string || 'none'}
                        onValueChange={handleFilterViewChange}
                        disabled={isLoadingFilterViews}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder={isLoadingFilterViews ? "Loading..." : "No filter"} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">
                                <span className="text-muted-foreground">No filter</span>
                            </SelectItem>
                            {filterViews.map((view) => (
                                <SelectItem key={view._id} value={view._id}>
                                    <div className="flex items-center gap-2">
                                        {view.name}
                                        {view.is_system && (
                                            <Badge variant="outline" className="text-[10px] px-1">System</Badge>
                                        )}
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {block.data.filter_view_id && (
                        <p className="text-xs text-muted-foreground">
                            Contents will be filtered using this saved view when the reference is resolved.
                        </p>
                    )}
                </div>
            )}

            {/* Preview of current selection */}
            {referenceValue && referenceValue.display_title && (
                <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Selected Reference:</p>
                    <p className="text-sm font-medium">{referenceValue.display_title}</p>
                    <div className="text-xs text-muted-foreground mt-1 space-x-2">
                        {referenceValue.collection_id && (
                            <span>Collection: {referenceValue.collection_id}</span>
                        )}
                        {referenceValue.filter_view_id && (
                            <span>• Filter: {filterViews.find(v => v._id === referenceValue.filter_view_id)?.name || referenceValue.filter_view_id}</span>
                        )}
                        {referenceValue.content_id && (
                            <span>• Content: {referenceValue.content_id}</span>
                        )}
                        {referenceValue.element_id && (
                            <span>• Element: {referenceValue.element_id}</span>
                        )}
                    </div>
                </div>
            )}

            {/* Render reference meta fields from schema if any */}
            {referenceMetaFields.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-border/50">
                    {referenceMetaFields.map((field: MetaFieldDefinition) => (
                        <MetaFieldInput
                            key={field.name}
                            field={field}
                            value={(block.data as Record<string, unknown>)[field.name]}
                            onChange={(value) => handleMetaFieldChange(field.name, value)}
                            compact
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

