import { useMemo } from 'react';
import type { ListViewSettings, ListViewColumn } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { 
    Layers, 
    GripVertical, 
    TableProperties, 
    Eye, 
    EyeOff, 
    ArrowUpDown 
} from 'lucide-react';
import { buildCurrentSchema, defaultListViewSettings, baseColumnDefinitions } from './constants';
import type { SchemaEditorBaseProps } from './types';
import { useTranslation } from '@/hooks/use-translation';

export function SchemaEditorListView({ schema, onChange }: SchemaEditorBaseProps) {
    const { resolveTranslation } = useTranslation();
    const currentSchema = buildCurrentSchema(schema);
    const listViewSettings = currentSchema.list_view_settings || defaultListViewSettings;
    const contentMetaFields = currentSchema.content_meta_fields || [];

    // Build combined columns list: base columns + metadata columns
    const allAvailableColumns = useMemo(() => {
        const baseColumns = baseColumnDefinitions.map(col => ({
            id: col.id,
            label: col.label,
            type: 'base' as const,
            description: col.description,
        }));

        const metaColumns = contentMetaFields.map(field => ({
            id: `meta_${field.name}`,
            label: resolveTranslation(field.label),
            type: 'meta' as const,
            meta_field: field.name,
            description: `Custom metadata field (${field.type})`,
        }));

        return [...baseColumns, ...metaColumns];
    }, [contentMetaFields, resolveTranslation]);

    // Get current column configuration or build from defaults
    const getCurrentColumns = (): ListViewColumn[] => {
        const existingColumns = listViewSettings.columns || [];
        
        // Ensure all available columns are represented
        return allAvailableColumns.map(availableCol => {
            const existing = existingColumns.find(c => c.id === availableCol.id);
            if (existing) {
                return existing;
            }
            // New column, use defaults
            return {
                id: availableCol.id,
                label: availableCol.label,
                type: availableCol.type,
                meta_field: availableCol.type === 'meta' ? availableCol.meta_field : undefined,
                visible: false,
                toggleable: true,
                sortable: availableCol.type !== 'meta' || contentMetaFields.find(f => f.name === availableCol.meta_field)?.type !== 'multi_select',
            };
        });
    };

    const columns = getCurrentColumns();

    const updateSettings = (updates: Partial<ListViewSettings>) => {
        onChange({
            ...currentSchema,
            list_view_settings: {
                ...listViewSettings,
                ...updates,
            },
        });
    };

    const updateColumn = (columnId: string, updates: Partial<ListViewColumn>) => {
        const newColumns = columns.map(col => 
            col.id === columnId ? { ...col, ...updates } : col
        );
        updateSettings({ columns: newColumns });
    };

    const handlePerPageOptionsChange = (value: string) => {
        const options = value
            .split(',')
            .map(s => parseInt(s.trim(), 10))
            .filter(n => !isNaN(n) && n > 0)
            .sort((a, b) => a - b);
        updateSettings({ per_page_options: options });
    };

    return (
        <div className="space-y-6">
            {/* General Settings */}
            <ListViewGeneralSettings
                listViewSettings={listViewSettings}
                columns={columns}
                updateSettings={updateSettings}
                handlePerPageOptionsChange={handlePerPageOptionsChange}
            />

            {/* Column Configuration */}
            <ListViewColumnConfiguration
                columns={columns}
                contentMetaFields={contentMetaFields}
                updateColumn={updateColumn}
            />
        </div>
    );
}

interface ListViewGeneralSettingsProps {
    listViewSettings: ListViewSettings;
    columns: ListViewColumn[];
    updateSettings: (updates: Partial<ListViewSettings>) => void;
    handlePerPageOptionsChange: (value: string) => void;
}

function ListViewGeneralSettings({ 
    listViewSettings, 
    columns, 
    updateSettings, 
    handlePerPageOptionsChange 
}: ListViewGeneralSettingsProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <TableProperties className="size-5" />
                    List View Settings
                </CardTitle>
                <CardDescription>
                    Configure how the content list is displayed, including pagination and default sorting.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Pagination Settings */}
                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                        <Label>Default Results per Page</Label>
                        <Select
                            value={String(listViewSettings.default_per_page)}
                            onValueChange={(value) => updateSettings({ default_per_page: parseInt(value, 10) })}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {[5, 10, 15, 20, 25, 30, 50, 100].map(n => (
                                    <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                            How many items are shown per page by default
                        </p>
                    </div>
                    <div className="space-y-2">
                        <Label>Page Size Options</Label>
                        <Input
                            value={listViewSettings.per_page_options.join(', ')}
                            onChange={(e) => handlePerPageOptionsChange(e.target.value)}
                            placeholder="10, 20, 50, 100"
                        />
                        <p className="text-xs text-muted-foreground">
                            Comma-separated values for the dropdown. Leave empty to hide the dropdown.
                        </p>
                    </div>
                </div>

                {/* Default Sorting */}
                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                        <Label>Default Sort Column</Label>
                        <Select
                            value={listViewSettings.default_sort_column || 'updated_at'}
                            onValueChange={(value) => updateSettings({ default_sort_column: value })}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {columns.filter(c => c.sortable).map(col => (
                                    <SelectItem key={col.id} value={col.id}>{col.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Default Sort Direction</Label>
                        <Select
                            value={listViewSettings.default_sort_direction || 'desc'}
                            onValueChange={(value: 'asc' | 'desc') => updateSettings({ default_sort_direction: value })}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="asc">Ascending (A → Z, oldest first)</SelectItem>
                                <SelectItem value="desc">Descending (Z → A, newest first)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

interface ListViewColumnConfigurationProps {
    columns: ListViewColumn[];
    contentMetaFields: { name: string; label: string; type: string }[];
    updateColumn: (columnId: string, updates: Partial<ListViewColumn>) => void;
}

function ListViewColumnConfiguration({ columns, contentMetaFields, updateColumn }: ListViewColumnConfigurationProps) {
    const baseColumns = columns.filter(c => c.type === 'base');
    const metaColumns = columns.filter(c => c.type === 'meta');

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Layers className="size-5" />
                    Column Configuration
                </CardTitle>
                <CardDescription>
                    Configure which columns are shown by default and which can be toggled by users.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Base Columns */}
                <div className="space-y-2">
                    <Label className="text-sm font-medium">Base Columns</Label>
                    <p className="text-xs text-muted-foreground mb-3">
                        Standard content fields available in every collection
                    </p>
                    <div className="space-y-2">
                        {baseColumns.map((column) => (
                            <ColumnConfigItem
                                key={column.id}
                                column={column}
                                updateColumn={updateColumn}
                                isMetaColumn={false}
                            />
                        ))}
                    </div>
                </div>

                {/* Metadata Columns */}
                {contentMetaFields.length > 0 && (
                    <div className="space-y-2 mt-6 pt-6 border-t">
                        <Label className="text-sm font-medium">Metadata Columns</Label>
                        <p className="text-xs text-muted-foreground mb-3">
                            Custom metadata fields defined for this collection's contents
                        </p>
                        <div className="space-y-2">
                            {metaColumns.map((column) => (
                                <ColumnConfigItem
                                    key={column.id}
                                    column={column}
                                    updateColumn={updateColumn}
                                    isMetaColumn={true}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {contentMetaFields.length === 0 && (
                    <div className="mt-4 p-4 bg-muted/30 rounded-lg text-center text-muted-foreground text-sm">
                        No content metadata fields defined.
                        <br />
                        <span className="text-xs">
                            Define metadata fields in the "Contents" tab to add them as list columns.
                        </span>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

interface ColumnConfigItemProps {
    column: ListViewColumn;
    updateColumn: (columnId: string, updates: Partial<ListViewColumn>) => void;
    isMetaColumn: boolean;
}

function ColumnConfigItem({ column, updateColumn, isMetaColumn }: ColumnConfigItemProps) {
    return (
        <div 
            className={`flex items-center justify-between p-3 border rounded-lg ${
                isMetaColumn ? 'border-dashed' : ''
            } ${
                column.visible ? 'bg-primary/5 border-primary/30' : 'bg-muted/20'
            }`}
        >
            <div className="flex items-center gap-3">
                <GripVertical className="size-4 text-muted-foreground cursor-move" />
                <div>
                    <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{column.label}</span>
                        {isMetaColumn ? (
                            <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                                Meta
                            </span>
                        ) : (
                            <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{column.id}</code>
                        )}
                    </div>
                    {isMetaColumn && column.meta_field && (
                        <p className="text-xs text-muted-foreground">
                            Field: {column.meta_field}
                        </p>
                    )}
                </div>
            </div>
            <div className="flex items-center gap-4">
                {/* Visible */}
                <label className="flex items-center gap-2 text-xs cursor-pointer">
                    {column.visible ? (
                        <Eye className="size-4 text-primary" />
                    ) : (
                        <EyeOff className="size-4 text-muted-foreground" />
                    )}
                    <Switch
                        checked={column.visible}
                        onCheckedChange={(checked) => updateColumn(column.id, { visible: checked })}
                        disabled={column.id === 'title'} // Title is always visible
                    />
                </label>
                {/* Toggleable */}
                <label className="flex items-center gap-1.5 text-xs cursor-pointer" title="Can user toggle visibility?">
                    <input
                        type="checkbox"
                        checked={column.toggleable}
                        onChange={(e) => updateColumn(column.id, { toggleable: e.target.checked })}
                        disabled={column.id === 'title'}
                        className="rounded"
                    />
                    Toggleable
                </label>
                {/* Sortable */}
                <label className="flex items-center gap-1.5 text-xs cursor-pointer" title="Can column be sorted?">
                    <ArrowUpDown className="size-3 text-muted-foreground" />
                    <input
                        type="checkbox"
                        checked={column.sortable}
                        onChange={(e) => updateColumn(column.id, { sortable: e.target.checked })}
                        disabled={column.id === 'editions'} // Editions can't be sorted
                        className="rounded"
                    />
                </label>
            </div>
        </div>
    );
}

