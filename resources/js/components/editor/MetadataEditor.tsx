import type { MetaFieldDefinition } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MetaFieldInput } from './MetaFieldInput';

interface MetadataEditorProps {
    fields: MetaFieldDefinition[];
    values: Record<string, unknown>;
    onChange: (values: Record<string, unknown>) => void;
    title?: string;
    description?: string;
    /** Compact mode for sidebar display - smaller header, no description */
    compact?: boolean;
}

export function MetadataEditor({
    fields,
    values,
    onChange,
    title = 'Metadata',
    description = 'Additional information about this content',
    compact = false,
}: MetadataEditorProps) {
    if (fields.length === 0) {
        return null;
    }

    const handleFieldChange = (name: string, value: unknown) => {
        onChange({
            ...values,
            [name]: value,
        });
    };

    return (
        <Card>
            <CardHeader className={compact ? 'pb-3' : undefined}>
                <CardTitle className={compact ? 'text-sm' : 'text-base'}>{title}</CardTitle>
                {!compact && description && (
                    <CardDescription>{description}</CardDescription>
                )}
            </CardHeader>
            <CardContent className={compact ? 'space-y-3' : 'space-y-4'}>
                {fields.map((field) => (
                    <MetaFieldInput
                        key={field.name}
                        field={field}
                        value={values[field.name]}
                        onChange={(value) => handleFieldChange(field.name, value)}
                        compact={compact}
                    />
                ))}
            </CardContent>
        </Card>
    );
}
