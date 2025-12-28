import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { MetaFieldDefinition } from '@/types';

interface MetaFieldsEditorProps {
    fields: MetaFieldDefinition[];
    data: Record<string, any>;
    onChange: (updates: Record<string, any>) => void;
}

export function MetaFieldsEditor({ fields, data, onChange }: MetaFieldsEditorProps) {
    if (!fields || fields.length === 0) return null;

    const handleChange = (name: string, value: any) => {
        onChange({ [name]: value });
    };

    return (
        <div className="grid gap-4 sm:grid-cols-2">
            {fields.map((field) => (
                <div key={field.name} className={`space-y-1.5 ${field.type === 'textarea' || field.type === 'json' ? 'col-span-full' : ''}`}>
                    <Label htmlFor={`field-${field.name}`} className="text-xs">
                        {field.label}
                        {field.required && <span className="text-destructive ml-1">*</span>}
                    </Label>
                    
                    {renderInput(field, data[field.name], (val) => handleChange(field.name, val))}
                    
                    {field.help_text && (
                        <p className="text-[10px] text-muted-foreground">{field.help_text}</p>
                    )}
                </div>
            ))}
        </div>
    );
}

function renderInput(field: MetaFieldDefinition, value: any, onChange: (val: any) => void) {
    const safeValue = value ?? field.default_value ?? '';

    switch (field.type) {
        case 'textarea':
            return (
                <Textarea
                    id={`field-${field.name}`}
                    value={safeValue}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={field.placeholder}
                    className="min-h-[80px]"
                />
            );
        
        case 'number':
            return (
                <Input
                    id={`field-${field.name}`}
                    type="number"
                    value={safeValue}
                    onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
                    placeholder={field.placeholder}
                    className="h-8"
                />
            );

        case 'boolean':
            return (
                <div className="flex items-center space-x-2 h-8">
                    <Switch
                        id={`field-${field.name}`}
                        checked={Boolean(safeValue)}
                        onCheckedChange={onChange}
                    />
                    <Label htmlFor={`field-${field.name}`} className="font-normal text-muted-foreground">
                        {Boolean(safeValue) ? 'Yes' : 'No'}
                    </Label>
                </div>
            );

        case 'select':
            return (
                <Select value={String(safeValue || '')} onValueChange={onChange}>
                    <SelectTrigger id={`field-${field.name}`} className="h-8">
                        <SelectValue placeholder={field.placeholder || "Select option"} />
                    </SelectTrigger>
                    <SelectContent>
                        {field.options?.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            );

        case 'date':
            return (
                <Input
                    id={`field-${field.name}`}
                    type="date"
                    value={safeValue}
                    onChange={(e) => onChange(e.target.value)}
                    className="h-8"
                />
            );

        case 'datetime':
            return (
                <Input
                    id={`field-${field.name}`}
                    type="datetime-local"
                    value={safeValue}
                    onChange={(e) => onChange(e.target.value)}
                    className="h-8"
                />
            );

        case 'email':
            return (
                <Input
                    id={`field-${field.name}`}
                    type="email"
                    value={safeValue}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={field.placeholder}
                    className="h-8"
                />
            );

        case 'url':
            return (
                <Input
                    id={`field-${field.name}`}
                    type="url"
                    value={safeValue}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={field.placeholder}
                    className="h-8"
                />
            );

        case 'color':
            return (
                <div className="flex gap-2">
                    <Input
                        id={`field-${field.name}`}
                        type="color"
                        value={safeValue}
                        onChange={(e) => onChange(e.target.value)}
                        className="h-8 w-12 p-1"
                    />
                    <Input
                        type="text"
                        value={safeValue}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder="#000000"
                        className="h-8 flex-1"
                    />
                </div>
            );

        case 'json':
            return (
                <Textarea
                    id={`field-${field.name}`}
                    value={typeof safeValue === 'object' ? JSON.stringify(safeValue, null, 2) : safeValue}
                    onChange={(e) => {
                        try {
                            const val = JSON.parse(e.target.value);
                            onChange(val);
                        } catch {
                            // Allow invalid JSON while typing, but maybe store as string?
                            // For now, let's just store the string if it fails parsing, 
                            // but the parent might expect an object. 
                            // Better: just treat as string for editing and parse on save if needed, 
                            // or rely on user to write valid JSON.
                            onChange(e.target.value);
                        }
                    }}
                    placeholder={'{\n  "key": "value"\n}'}
                    className="font-mono text-xs min-h-[100px]"
                />
            );

        case 'text':
        default:
            return (
                <Input
                    id={`field-${field.name}`}
                    type="text"
                    value={safeValue}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={field.placeholder}
                    className="h-8"
                />
            );
    }
}

