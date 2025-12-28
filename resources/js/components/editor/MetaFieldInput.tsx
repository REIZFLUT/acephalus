import type { MetaFieldDefinition } from '@/types';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface MetaFieldInputProps {
    field: MetaFieldDefinition;
    value: unknown;
    onChange: (value: unknown) => void;
    compact?: boolean;
}

export function MetaFieldInput({ field, value, onChange, compact = false }: MetaFieldInputProps) {
    const { name, label, type, required, placeholder, help_text, options, default_value } = field;
    
    // Use default value if no value is set
    const currentValue = value ?? default_value;

    const renderInput = () => {
        switch (type) {
            case 'text':
            case 'url':
            case 'email':
                return (
                    <Input
                        id={name}
                        type={type === 'url' ? 'url' : type === 'email' ? 'email' : 'text'}
                        value={(currentValue as string) || ''}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder={placeholder}
                        className={compact ? 'h-8' : undefined}
                    />
                );

            case 'textarea':
                return (
                    <Textarea
                        id={name}
                        value={(currentValue as string) || ''}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder={placeholder}
                        rows={compact ? 2 : 3}
                    />
                );

            case 'number':
                return (
                    <Input
                        id={name}
                        type="number"
                        value={currentValue !== undefined ? String(currentValue) : ''}
                        onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
                        placeholder={placeholder}
                        className={compact ? 'h-8' : undefined}
                    />
                );

            case 'boolean':
                return (
                    <Switch
                        id={name}
                        checked={Boolean(currentValue)}
                        onCheckedChange={onChange}
                    />
                );

            case 'date':
                return (
                    <Input
                        id={name}
                        type="date"
                        value={(currentValue as string) || ''}
                        onChange={(e) => onChange(e.target.value)}
                        className={compact ? 'h-8' : undefined}
                    />
                );

            case 'datetime':
                return (
                    <Input
                        id={name}
                        type="datetime-local"
                        value={(currentValue as string) || ''}
                        onChange={(e) => onChange(e.target.value)}
                        className={compact ? 'h-8' : undefined}
                    />
                );

            case 'color':
                return (
                    <div className="flex items-center gap-2">
                        <Input
                            id={name}
                            type="color"
                            value={(currentValue as string) || '#000000'}
                            onChange={(e) => onChange(e.target.value)}
                            className="w-10 h-8 p-1"
                        />
                        <Input
                            value={(currentValue as string) || ''}
                            onChange={(e) => onChange(e.target.value)}
                            placeholder="#000000"
                            className={`flex-1 ${compact ? 'h-8' : ''}`}
                        />
                    </div>
                );

            case 'select':
                return (
                    <Select
                        value={(currentValue as string) || ''}
                        onValueChange={onChange}
                    >
                        <SelectTrigger className={compact ? 'h-8' : undefined}>
                            <SelectValue placeholder={placeholder || 'Select...'} />
                        </SelectTrigger>
                        <SelectContent>
                            {options?.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                );

            case 'multi_select':
                const selectedValues = (currentValue as string[]) || [];
                return (
                    <div className="space-y-2">
                        <div className="flex flex-wrap gap-1">
                            {selectedValues.map((val) => {
                                const option = options?.find((o) => o.value === val);
                                return (
                                    <Badge
                                        key={val}
                                        variant="secondary"
                                        className="cursor-pointer"
                                        onClick={() => onChange(selectedValues.filter((v) => v !== val))}
                                    >
                                        {option?.label || val}
                                        <span className="ml-1">×</span>
                                    </Badge>
                                );
                            })}
                        </div>
                        <Select
                            value=""
                            onValueChange={(val) => {
                                if (!selectedValues.includes(val)) {
                                    onChange([...selectedValues, val]);
                                }
                            }}
                        >
                            <SelectTrigger className={compact ? 'h-8' : undefined}>
                                <SelectValue placeholder="Add..." />
                            </SelectTrigger>
                            <SelectContent>
                                {options
                                    ?.filter((o) => !selectedValues.includes(o.value))
                                    .map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                            </SelectContent>
                        </Select>
                    </div>
                );

            case 'json':
                return (
                    <Textarea
                        id={name}
                        value={
                            typeof currentValue === 'string'
                                ? currentValue
                                : JSON.stringify(currentValue || {}, null, 2)
                        }
                        onChange={(e) => {
                            try {
                                onChange(JSON.parse(e.target.value));
                            } catch {
                                // Keep as string if invalid JSON
                                onChange(e.target.value);
                            }
                        }}
                        placeholder="{}"
                        rows={compact ? 3 : 4}
                        className="font-mono text-sm"
                    />
                );

            default:
                return (
                    <Input
                        id={name}
                        value={(currentValue as string) || ''}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder={placeholder}
                        className={compact ? 'h-8' : undefined}
                    />
                );
        }
    };

    // For boolean type in compact mode, render inline
    if (type === 'boolean' && compact) {
        return (
            <div className="flex items-center justify-between">
                <Label htmlFor={name} className="text-xs text-muted-foreground">
                    {label}
                    {required && <span className="text-destructive ml-1">*</span>}
                </Label>
                {renderInput()}
            </div>
        );
    }

    // Compact inline layout for simple fields
    if (compact && (type === 'text' || type === 'number' || type === 'select')) {
        return (
            <div className="flex items-center gap-2">
                <Label htmlFor={name} className="text-xs text-muted-foreground shrink-0">
                    {label}
                    {required && <span className="text-destructive ml-1">*</span>}
                </Label>
                <div className="flex-1">
                    {renderInput()}
                </div>
            </div>
        );
    }

    return (
        <div className={compact ? 'space-y-1' : 'space-y-2'}>
            <div className="flex items-center gap-2">
                <Label htmlFor={name} className={compact ? 'text-xs text-muted-foreground' : undefined}>
                    {label}
                    {required && <span className="text-destructive ml-1">*</span>}
                </Label>
            </div>
            {renderInput()}
            {help_text && !compact && (
                <p className="text-xs text-muted-foreground">{help_text}</p>
            )}
        </div>
    );
}

