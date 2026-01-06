import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Layers } from 'lucide-react';
import { buildCurrentSchema } from './constants';
import type { SchemaEditorWrappersProps } from './types';

export function SchemaEditorWrappers({ schema, onChange, wrapperPurposes = [] }: SchemaEditorWrappersProps) {
    const currentSchema = buildCurrentSchema(schema);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Layers className="size-5" />
                    Allowed Wrapper Purposes
                </CardTitle>
                <CardDescription>
                    Select which wrapper purposes can be used in this collection.
                    If none are selected, all purposes are allowed.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {wrapperPurposes.length === 0 ? (
                    <EmptyState />
                ) : (
                    <WrapperPurposesList
                        currentSchema={currentSchema}
                        wrapperPurposes={wrapperPurposes}
                        onChange={onChange}
                    />
                )}
            </CardContent>
        </Card>
    );
}

function EmptyState() {
    return (
        <div className="text-center py-8 text-muted-foreground">
            <Layers className="size-12 mx-auto mb-4 opacity-50" />
            <p>No wrapper purposes defined yet.</p>
            <p className="text-sm">
                <a href="/settings/wrapper-purposes" className="text-primary hover:underline">
                    Create wrapper purposes
                </a> to configure them here.
            </p>
        </div>
    );
}

interface WrapperPurposesListProps {
    currentSchema: ReturnType<typeof buildCurrentSchema>;
    wrapperPurposes: SchemaEditorWrappersProps['wrapperPurposes'];
    onChange: SchemaEditorWrappersProps['onChange'];
}

function WrapperPurposesList({ currentSchema, wrapperPurposes, onChange }: WrapperPurposesListProps) {
    if (!wrapperPurposes) {
        return null;
    }

    const allowAllPurposes = !currentSchema.allowed_wrapper_purposes || currentSchema.allowed_wrapper_purposes.length === 0;

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between mb-4 p-3 bg-muted/30 rounded-md">
                <div>
                    <Label className="text-sm font-medium">Allow all purposes</Label>
                    <p className="text-xs text-muted-foreground">
                        When enabled, all wrapper purposes are available
                    </p>
                </div>
                <Switch
                    checked={allowAllPurposes}
                    onCheckedChange={(checked) => {
                        if (checked) {
                            onChange({
                                ...currentSchema,
                                allowed_wrapper_purposes: [],
                            });
                        } else {
                            const systemPurpose = wrapperPurposes.find(p => p.is_system);
                            onChange({
                                ...currentSchema,
                                allowed_wrapper_purposes: systemPurpose ? [systemPurpose.slug] : [],
                            });
                        }
                    }}
                />
            </div>
            
            {currentSchema.allowed_wrapper_purposes && currentSchema.allowed_wrapper_purposes.length > 0 && (
                <div className="grid gap-2 sm:grid-cols-2">
                    {wrapperPurposes.map((purpose) => (
                        <label
                            key={purpose.slug}
                            className={`flex items-start gap-3 p-3 border rounded-md cursor-pointer transition-colors ${
                                currentSchema.allowed_wrapper_purposes?.includes(purpose.slug)
                                    ? 'bg-primary/5 border-primary/50'
                                    : 'hover:bg-muted/50'
                            } ${purpose.is_system ? 'opacity-75' : ''}`}
                        >
                            <input
                                type="checkbox"
                                checked={currentSchema.allowed_wrapper_purposes?.includes(purpose.slug) || false}
                                onChange={(e) => {
                                    const purposes = currentSchema.allowed_wrapper_purposes || [];
                                    if (e.target.checked) {
                                        onChange({
                                            ...currentSchema,
                                            allowed_wrapper_purposes: [...purposes, purpose.slug],
                                        });
                                    } else {
                                        if (purposes.length > 1) {
                                            onChange({
                                                ...currentSchema,
                                                allowed_wrapper_purposes: purposes.filter(p => p !== purpose.slug),
                                            });
                                        }
                                    }
                                }}
                                disabled={purpose.is_system && currentSchema.allowed_wrapper_purposes?.length === 1}
                                className="mt-1 rounded"
                            />
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="font-medium text-sm">{purpose.name}</span>
                                    {purpose.is_system && (
                                        <span className="text-xs bg-muted px-1.5 py-0.5 rounded">System</span>
                                    )}
                                </div>
                                {purpose.description && (
                                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                                        {purpose.description}
                                    </p>
                                )}
                            </div>
                        </label>
                    ))}
                </div>
            )}
        </div>
    );
}

