import { FormEvent, useState } from 'react';
import { Link, useForm } from '@inertiajs/react';
import AppLayout from '@/components/layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Loader2, Plus, X } from 'lucide-react';
import type { PageProps } from '@/types';

interface CreateProps extends PageProps {
    fieldTypes: string[];
}

interface FieldOption {
    value: string;
    label: string;
}

export default function MediaMetaFieldsCreate({ fieldTypes }: CreateProps) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        slug: '',
        description: '',
        field_type: 'text',
        options: [] as FieldOption[],
        required: false,
        placeholder: '',
    });

    const [newOptionValue, setNewOptionValue] = useState('');
    const [newOptionLabel, setNewOptionLabel] = useState('');

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        post('/settings/media-meta-fields');
    };

    const handleNameChange = (name: string) => {
        setData((prev) => ({
            ...prev,
            name,
            slug: prev.slug || name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, ''),
        }));
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
            title="Create Media Meta Field"
            breadcrumbs={[
                { label: 'Settings', href: '/settings' },
                { label: 'Media Fields', href: '/settings/media-meta-fields' },
                { label: 'Create' },
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
                        <CardTitle>Create Media Meta Field</CardTitle>
                        <CardDescription>
                            Define a new metadata field for media files
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="name">Name *</Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={(e) => handleNameChange(e.target.value)}
                                    placeholder="Copyright"
                                    autoFocus
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
                                />
                                <p className="text-xs text-muted-foreground">
                                    Used as identifier. Auto-generated from name if left empty. Use underscores.
                                </p>
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
                                {errors.description && (
                                    <p className="text-sm text-destructive">{errors.description}</p>
                                )}
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="field_type">Field Type *</Label>
                                    <Select
                                        value={data.field_type}
                                        onValueChange={(value) => setData('field_type', value)}
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

                            <div className="flex items-center gap-3">
                                <Switch
                                    id="required"
                                    checked={data.required}
                                    onCheckedChange={(checked) => setData('required', checked)}
                                />
                                <Label htmlFor="required">Required field</Label>
                            </div>

                            {showOptionsField && (
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
                                    Create Field
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

