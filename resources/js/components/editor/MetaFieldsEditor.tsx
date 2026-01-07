import type { MetaFieldDefinition } from '@/types';
import { MetaFieldInput } from './MetaFieldInput';

interface MetaFieldsEditorProps {
    fields: MetaFieldDefinition[];
    data: Record<string, unknown>;
    onChange: (updates: Record<string, unknown>) => void;
    compact?: boolean;
}

export function MetaFieldsEditor({ fields, data, onChange, compact = false }: MetaFieldsEditorProps) {
    if (!fields || fields.length === 0) return null;

    const handleChange = (name: string, value: unknown) => {
        onChange({ [name]: value });
    };

    // Field types that should take full width
    const fullWidthTypes = ['textarea', 'json', 'media'];

    return (
        <div className="grid gap-4 sm:grid-cols-2">
            {fields.map((field) => (
                <div 
                    key={field.name} 
                    className={fullWidthTypes.includes(field.type) ? 'col-span-full' : ''}
                >
                    <MetaFieldInput
                        field={field}
                        value={data[field.name]}
                        onChange={(val) => handleChange(field.name, val)}
                        compact={compact}
                    />
                </div>
            ))}
        </div>
    );
}
