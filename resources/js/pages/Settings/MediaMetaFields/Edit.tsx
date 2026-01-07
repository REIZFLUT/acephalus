import { FormEvent, useState } from 'react';
import { Link, useForm } from '@inertiajs/react';
import AppLayout from '@/components/layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Loader2, Plus, X, Lock } from 'lucide-react';
import type { PageProps } from '@/types';

interface FieldOption {
    value: string;
    label: string;
}

interface MediaMetaField {
    _id: string;
    slug: string;
    name: string;
    description: string | null;
    explanation: string | null;
    field_type: string;
    options: FieldOption[] | null;
    is_system: boolean;
    required: boolean;
    placeholder: string | null;
}

interface EditProps extends PageProps {
    field: MediaMetaField;
    fieldTypes: string[];
}

export default function MediaMetaFieldsEdit({ field, fieldTypes }: EditProps) {
    const { data, setData, put, processing, errors } = useForm({
        name: field.name,
        slug: field.slug,
        description: field.description || '',
        explanation: field.explanation || '',
        field_type: field.field_type,
        options: field.options || [],
        required: field.required,
        placeholder: field.placeholder || '',
    });

    const [newOptionValue, setNewOptionValue] = useState('');
    const [newOptionLabel, setNewOptionLabel] = useState('');

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        put(`/settings/media-meta-fields/${field.slug}`);
    };

    const addOption = () => {
        if (newOptionValue.trim() && newOptionLabel.trim()) {
            setData('options', [...data.options, { value: newOptionValue.trim(), label: newOptionLabel.trim() }]);
            setNewOptionValue('');
            setNewOptionLabel('');
        }
    };

    const removeOption = (index: number) => {
        setData('options', data.options.filter((_, i) => i !== index));
    };

    const showOptionsField = ['select', 'multi_select'].includes(data.field_type);

    const getFieldTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            text: 'Text',
            textarea: 'Long Text',
            number: 'Number',
            boolean: 'Boolean',
            date: 'Date',
            datetime: 'Date & Time',
            time: 'Time',
            select: 'Select',
            multi_select: 'Multi-Select',
            url: 'URL',
            email: 'Email',
            color: 'Color',
            json: 'JSON',
        };
        return labels[type] || type;
    };

    return (
        <AppLayout
            title={`Edit ${field.name}`}
            breadcrumbs={[
                { label: 'Settings', href: '/settings' },
                { label: 'Media Fields', href: '/settings/media-meta-fields' },
                { label: field.name },
            ]}
        >
            <div className="max-w-2xl">
                <div className="mb-6">
                    <Button variant="ghost" asChild className="-ml-4">
                        <Link href="/settings/media-meta-fields">
                            <ArrowLeft className="size-4 mr-2" />
                            Back to Settings
                        </Link>
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <CardTitle>Edit Media Meta Field</CardTitle>
                            {field.is_system && (
                                <Badge variant="secondary" className="gap-1">
                                    <Lock className="size-3" />
                                    System
                                </Badge>
                            )}
                        </div>
                        <CardDescription>
                            {field.is_system 
                                ? 'System fields can only have their description and placeholder modified'
                                : 'Update the metadata field configuration'
                            }
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="name">Name *</Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder="Copyright"
                                    disabled={field.is_system}
                                />
                                {errors.name && (
                                    <p className="text-sm text-destructive">{errors.name}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="slug">Slug</Label>
                                <Input
                                    id="slug"
                                    value={data.slug}
                                    onChange={(e) => setData('slug', e.target.value)}
                                    placeholder="copyright"
                                    disabled={field.is_system}
                                />
                                {errors.slug && (
                                    <p className="text-sm text-destructive">{errors.slug}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    placeholder="Copyright information for the media file"
                                    rows={2}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Shown below the input field as help text.
                                </p>
                                {errors.description && (
                                    <p className="text-sm text-destructive">{errors.description}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="explanation">Explanation</Label>
                                <Textarea
                                    id="explanation"
                                    value={data.explanation}
                                    onChange={(e) => setData('explanation', e.target.value)}
                                    placeholder="Detailed explanation of how to use this field..."
                                    rows={2}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Shown via info icon tooltip next to the label.
                                </p>
                                {errors.explanation && (
                                    <p className="text-sm text-destructive">{errors.explanation}</p>
                                )}
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="field_type">Field Type *</Label>
                                    <Select
                                        value={data.field_type}
                                        onValueChange={(value) => setData('field_type', value)}
                                        disabled={field.is_system}
                                    >
                                        <SelectTrigger id="field_type">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {fieldTypes.map((type) => (
                                                <SelectItem key={type} value={type}>
                                                    {getFieldTypeLabel(type)}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.field_type && (
                                        <p className="text-sm text-destructive">{errors.field_type}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="placeholder">Placeholder</Label>
                                    <Input
                                        id="placeholder"
                                        value={data.placeholder}
                                        onChange={(e) => setData('placeholder', e.target.value)}
                                        placeholder="Enter copyright..."
                                    />
                                    {errors.placeholder && (
                                        <p className="text-sm text-destructive">{errors.placeholder}</p>
                                    )}
                                </div>
                            </div>

                            {!field.is_system && (
                                <div className="flex items-center gap-3">
                                    <Switch
                                        id="required"
                                        checked={data.required}
                                        onCheckedChange={(checked) => setData('required', checked)}
                                    />
                                    <Label htmlFor="required">Required field</Label>
                                </div>
                            )}

                            {showOptionsField && !field.is_system && (
                                <div className="space-y-4">
                                    <Label>Options</Label>
                                    
                                    {data.options.length > 0 && (
                                        <div className="space-y-2">
                                            {data.options.map((option, index) => (
                                                <div key={index} className="flex items-center gap-2 bg-muted p-2 rounded">
                                                    <code className="text-xs">{option.value}</code>
                                                    <span className="text-muted-foreground">→</span>
                                                    <span className="flex-1">{option.label}</span>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="size-6"
                                                        onClick={() => removeOption(index)}
                                                    >
                                                        <X className="size-3" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="Value"
                                            value={newOptionValue}
                                            onChange={(e) => setNewOptionValue(e.target.value)}
                                            className="flex-1"
                                        />
                                        <Input
                                            placeholder="Label"
                                            value={newOptionLabel}
                                            onChange={(e) => setNewOptionLabel(e.target.value)}
                                            className="flex-1"
                                        />
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            onClick={addOption}
                                            disabled={!newOptionValue.trim() || !newOptionLabel.trim()}
                                        >
                                            <Plus className="size-4" />
                                        </Button>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Add options for select/multi-select fields
                                    </p>
                                </div>
                            )}

                            <div className="flex gap-4">
                                <Button type="submit" disabled={processing}>
                                    {processing && <Loader2 className="size-4 mr-2 animate-spin" />}
                                    Update Field
                                </Button>
                                <Button type="button" variant="outline" asChild>
                                    <Link href="/settings/media-meta-fields">Cancel</Link>
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}

