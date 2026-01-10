import { FormEvent } from 'react';
import { Link, useForm, router } from '@inertiajs/react';
import AppLayout from '@/components/layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { TranslatableInput } from '@/components/ui/translatable-input';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { ArrowLeft, Loader2, Lock, Trash2 } from 'lucide-react';
import { DynamicIcon } from '@/components/DynamicIcon';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { FieldDesigner } from '@/components/custom-elements/FieldDesigner';
import type { 
    PageProps, 
    TranslatableString, 
    CustomElementCategory, 
    CustomElementInputType,
    CustomElementField,
    CustomElementModel,
} from '@/types';
import { normalizeToTranslatable, useTranslation } from '@/hooks/use-translation';

// Common Lucide icons for custom elements
const commonIcons = [
    'box', 'star', 'heart', 'bookmark', 'flag', 'tag',
    'file-text', 'image', 'video', 'music', 'link',
    'code', 'terminal', 'database', 'server',
    'layout', 'grid', 'columns', 'rows', 'table',
    'list', 'check-square', 'circle', 'square',
    'alert-circle', 'info', 'help-circle', 'message-circle',
    'quote', 'type', 'heading', 'text',
    'calendar', 'clock', 'map-pin', 'globe',
    'user', 'users', 'mail', 'phone',
    'settings', 'sliders', 'toggle-left',
    'chevrons-down-up', 'layers', 'package', 'puzzle',
];

interface CustomElementsEditProps extends PageProps {
    customElement: CustomElementModel;
    categories: CustomElementCategory[];
    inputTypes: CustomElementInputType[];
    gridSizes: string[];
}

const categoryLabels: Record<CustomElementCategory, string> = {
    content: 'Content',
    data: 'Data',
    layout: 'Layout',
    interactive: 'Interactive',
    media: 'Media',
};

export default function CustomElementsEdit({ 
    customElement, 
    categories, 
    inputTypes, 
    gridSizes 
}: CustomElementsEditProps) {
    const { resolveTranslation } = useTranslation();
    const elementLabel = resolveTranslation(customElement.label);

    const { data, setData, put, processing, errors } = useForm<{
        type: string;
        label: TranslatableString;
        description: TranslatableString;
        icon: string;
        category: CustomElementCategory;
        can_have_children: boolean;
        fields: CustomElementField[];
        default_data: Record<string, unknown>;
        preview_template: string;
        css_class: string;
    }>({
        type: customElement.type,
        label: normalizeToTranslatable(customElement.label),
        description: normalizeToTranslatable(customElement.description),
        icon: customElement.icon || 'box',
        category: customElement.category,
        can_have_children: customElement.can_have_children,
        fields: customElement.fields || [],
        default_data: customElement.default_data || {},
        preview_template: customElement.preview_template || '',
        css_class: customElement.css_class || '',
    });

    const handleTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value;
        
        // Ensure it starts with custom_
        if (!value.startsWith('custom_')) {
            value = 'custom_' + value.replace(/^custom_?/, '');
        }
        
        // Sanitize the rest
        value = value.toLowerCase().replace(/[^a-z0-9_]/g, '');
        
        setData('type', value);
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        put(`/settings/custom-elements/${customElement.type}`);
    };

    const handleDelete = () => {
        router.delete(`/settings/custom-elements/${customElement.type}`);
    };

    return (
        <AppLayout
            title={`Edit ${elementLabel}`}
            breadcrumbs={[
                { label: 'Settings', href: '/settings' },
                { label: 'Custom Elements', href: '/settings/custom-elements' },
                { label: elementLabel },
            ]}
        >
            <div className="max-w-4xl">
                <div className="mb-6">
                    <Button variant="ghost" asChild className="-ml-4">
                        <Link href="/settings/custom-elements">
                            <ArrowLeft className="size-4 mr-2" />
                            Back to Custom Elements
                        </Link>
                    </Button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Information */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-3">
                                <CardTitle>Basic Information</CardTitle>
                                {customElement.is_system && (
                                    <Badge variant="secondary" className="gap-1">
                                        <Lock className="size-3" />
                                        System
                                    </Badge>
                                )}
                            </div>
                            <CardDescription>
                                {customElement.is_system
                                    ? 'System elements can only have their label, description, and icon changed.'
                                    : 'Update the basic properties of your custom element.'
                                }
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid gap-6 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="label">Label *</Label>
                                    <TranslatableInput
                                        value={data.label}
                                        onChange={(value) => setData('label', value)}
                                        placeholder="e.g. Info Box"
                                        modalTitle="Label Translations"
                                        modalDescription="Add translations for the element label."
                                    />
                                    {errors.label && (
                                        <p className="text-sm text-destructive">{errors.label}</p>
                                    )}
                                    {errors['label.en'] && (
                                        <p className="text-sm text-destructive">{errors['label.en']}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="type">Type Identifier *</Label>
                                    <Input
                                        id="type"
                                        value={data.type}
                                        onChange={handleTypeChange}
                                        placeholder="custom_info_box"
                                        className="font-mono"
                                        disabled={customElement.is_system}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Must start with "custom_" and contain only lowercase letters, numbers, and underscores.
                                    </p>
                                    {errors.type && (
                                        <p className="text-sm text-destructive">{errors.type}</p>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <TranslatableInput
                                    value={data.description}
                                    onChange={(value) => setData('description', value)}
                                    multiline
                                    rows={2}
                                    placeholder="Brief description of what this element does"
                                    modalTitle="Description Translations"
                                    modalDescription="Add translations for the element description."
                                />
                                {errors.description && (
                                    <p className="text-sm text-destructive">{errors.description}</p>
                                )}
                            </div>

                            <div className="grid gap-6 sm:grid-cols-3">
                                <div className="space-y-2">
                                    <Label htmlFor="icon">Icon</Label>
                                    <Select
                                        value={data.icon || 'box'}
                                        onValueChange={(value) => setData('icon', value)}
                                    >
                                        <SelectTrigger id="icon">
                                            <SelectValue placeholder="Select an icon">
                                                {data.icon && (
                                                    <div className="flex items-center gap-2">
                                                        <DynamicIcon name={data.icon} className="size-4" />
                                                        <span>{data.icon}</span>
                                                    </div>
                                                )}
                                            </SelectValue>
                                        </SelectTrigger>
                                        <SelectContent>
                                            {commonIcons.map((iconName) => (
                                                <SelectItem key={iconName} value={iconName}>
                                                    <div className="flex items-center gap-2">
                                                        <DynamicIcon name={iconName} className="size-4" />
                                                        <span>{iconName}</span>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.icon && (
                                        <p className="text-sm text-destructive">{errors.icon}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="category">Category *</Label>
                                    <Select
                                        value={data.category}
                                        onValueChange={(value: CustomElementCategory) => setData('category', value)}
                                        disabled={customElement.is_system}
                                    >
                                        <SelectTrigger id="category">
                                            <SelectValue placeholder="Select a category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {categories.map((category) => (
                                                <SelectItem key={category} value={category}>
                                                    {categoryLabels[category]}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.category && (
                                        <p className="text-sm text-destructive">{errors.category}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="css_class">CSS Class</Label>
                                    <Input
                                        id="css_class"
                                        value={data.css_class}
                                        onChange={(e) => setData('css_class', e.target.value)}
                                        placeholder="element-class"
                                        disabled={customElement.is_system}
                                    />
                                    {errors.css_class && (
                                        <p className="text-sm text-destructive">{errors.css_class}</p>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                    <Label>Can Have Children</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Allow this element to contain nested child elements (like a wrapper).
                                    </p>
                                </div>
                                <Switch
                                    checked={data.can_have_children}
                                    onCheckedChange={(checked) => setData('can_have_children', checked)}
                                    disabled={customElement.is_system}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Fields Designer */}
                    {!customElement.is_system && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Fields</CardTitle>
                                <CardDescription>
                                    Define the input fields for this custom element. These fields will be 
                                    shown in the content editor when users add this element.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <FieldDesigner
                                    fields={data.fields}
                                    onChange={(fields) => setData('fields', fields)}
                                    inputTypes={inputTypes}
                                    gridSizes={gridSizes}
                                />
                                {errors.fields && (
                                    <p className="text-sm text-destructive mt-2">{errors.fields}</p>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Advanced Settings */}
                    {!customElement.is_system && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Advanced Settings</CardTitle>
                                <CardDescription>
                                    Optional configuration for preview rendering.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="preview_template">Preview Template</Label>
                                    <Input
                                        id="preview_template"
                                        value={data.preview_template}
                                        onChange={(e) => setData('preview_template', e.target.value)}
                                        placeholder="e.g. info_box"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Optional Blade template name for custom preview rendering.
                                    </p>
                                    {errors.preview_template && (
                                        <p className="text-sm text-destructive">{errors.preview_template}</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Actions */}
                    <div className="flex gap-4">
                        <Button type="submit" disabled={processing}>
                            {processing && <Loader2 className="size-4 mr-2 animate-spin" />}
                            Save Changes
                        </Button>
                        <Button type="button" variant="outline" asChild>
                            <Link href="/settings/custom-elements">Cancel</Link>
                        </Button>
                    </div>
                </form>

                {/* Danger Zone - only for non-system elements */}
                {!customElement.is_system && (
                    <Card className="border-destructive/50 mt-6">
                        <CardHeader>
                            <CardTitle className="text-destructive">Danger Zone</CardTitle>
                            <CardDescription>
                                Deleting this element will not remove existing content using it, 
                                but that content may become inaccessible in the editor.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="destructive" type="button">
                                        <Trash2 className="size-4 mr-2" />
                                        Delete Element
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Delete Custom Element</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Are you sure you want to delete "{elementLabel}"? 
                                            This action cannot be undone. Existing content using this 
                                            element type may become inaccessible.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={handleDelete}
                                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                        >
                                            Delete
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
