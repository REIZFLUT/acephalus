import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { BlockEditorProps } from '../BlockItem';
import { ReferencePicker, ReferenceValue, ReferenceType } from '../ReferencePicker';
import { Folder, FileText, Box } from 'lucide-react';

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
    const referenceType = (block.data.reference_type as ReferenceType) || 'content';
    
    const referenceValue: ReferenceValue | null = block.data.collection_id ? {
        reference_type: referenceType,
        collection_id: block.data.collection_id as string,
        content_id: block.data.content_id as string,
        element_id: block.data.element_id as string,
        display_title: block.data.display_title as string,
    } : null;

    const handleTypeChange = (newType: ReferenceType) => {
        // Reset selection when type changes
        onUpdate({
            ...block.data,
            reference_type: newType,
            collection_id: undefined,
            content_id: undefined,
            element_id: undefined,
            display_title: undefined,
        });
    };

    const handleReferenceChange = (value: ReferenceValue | null) => {
        if (value) {
            onUpdate({
                ...block.data,
                reference_type: value.reference_type,
                collection_id: value.collection_id,
                content_id: value.content_id,
                element_id: value.element_id,
                display_title: value.display_title,
            });
        } else {
            onUpdate({
                ...block.data,
                collection_id: undefined,
                content_id: undefined,
                element_id: undefined,
                display_title: undefined,
            });
        }
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

            {/* Preview of current selection */}
            {referenceValue && referenceValue.display_title && (
                <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Selected Reference:</p>
                    <p className="text-sm font-medium">{referenceValue.display_title}</p>
                    <div className="text-xs text-muted-foreground mt-1 space-x-2">
                        {referenceValue.collection_id && (
                            <span>Collection: {referenceValue.collection_id}</span>
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
        </div>
    );
}

