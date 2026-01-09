import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Layers } from 'lucide-react';
import { buildCurrentSchema } from './constants';
import { useTranslation } from '@/hooks/use-translation';
import type { SchemaEditorEditionsProps } from './types';

export function SchemaEditorEditions({ schema, onChange, editions = [] }: SchemaEditorEditionsProps) {
    const currentSchema = buildCurrentSchema(schema);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Layers className="size-5" />
                    Allowed Editions
                </CardTitle>
                <CardDescription>
                    Select which editions can be used in this collection for filtering content.
                    If none are selected, all editions are available.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {editions.length === 0 ? (
                    <EmptyState />
                ) : (
                    <EditionsList
                        currentSchema={currentSchema}
                        editions={editions}
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
            <p>No editions defined yet.</p>
            <p className="text-sm">
                <a href="/settings/editions" className="text-primary hover:underline">
                    Create editions
                </a> to configure them here.
            </p>
        </div>
    );
}

interface EditionsListProps {
    currentSchema: ReturnType<typeof buildCurrentSchema>;
    editions: SchemaEditorEditionsProps['editions'];
    onChange: SchemaEditorEditionsProps['onChange'];
}

function EditionsList({ currentSchema, editions, onChange }: EditionsListProps) {
    const { resolveTranslation } = useTranslation();
    
    if (!editions) {
        return null;
    }

    const allowAllEditions = !currentSchema.allowed_editions || currentSchema.allowed_editions.length === 0;

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between mb-4 p-3 bg-muted/30 rounded-md">
                <div>
                    <Label className="text-sm font-medium">Allow all editions</Label>
                    <p className="text-xs text-muted-foreground">
                        When enabled, all editions are available for filtering
                    </p>
                </div>
                <Switch
                    checked={allowAllEditions}
                    onCheckedChange={(checked) => {
                        if (checked) {
                            onChange({
                                ...currentSchema,
                                allowed_editions: undefined,
                            });
                        } else {
                            // Start with first edition selected
                            const firstEdition = editions[0];
                            onChange({
                                ...currentSchema,
                                allowed_editions: firstEdition ? [firstEdition.slug] : [],
                            });
                        }
                    }}
                />
            </div>
            
            {currentSchema.allowed_editions && currentSchema.allowed_editions.length > 0 && (
                <div className="grid gap-2 sm:grid-cols-2">
                    {editions.map((edition) => (
                        <label
                            key={edition.slug}
                            className={`flex items-start gap-3 p-3 border rounded-md cursor-pointer transition-colors ${
                                currentSchema.allowed_editions?.includes(edition.slug)
                                    ? 'bg-primary/5 border-primary/50'
                                    : 'hover:bg-muted/50'
                            } ${edition.is_system ? 'opacity-75' : ''}`}
                        >
                            <input
                                type="checkbox"
                                checked={currentSchema.allowed_editions?.includes(edition.slug) || false}
                                onChange={(e) => {
                                    const editionSlugs = currentSchema.allowed_editions || [];
                                    if (e.target.checked) {
                                        onChange({
                                            ...currentSchema,
                                            allowed_editions: [...editionSlugs, edition.slug],
                                        });
                                    } else {
                                        if (editionSlugs.length > 1) {
                                            onChange({
                                                ...currentSchema,
                                                allowed_editions: editionSlugs.filter(e => e !== edition.slug),
                                            });
                                        }
                                    }
                                }}
                                disabled={currentSchema.allowed_editions?.length === 1 && currentSchema.allowed_editions.includes(edition.slug)}
                                className="mt-1 rounded"
                            />
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="font-medium text-sm">{resolveTranslation(edition.name)}</span>
                                    {edition.is_system && (
                                        <span className="text-xs bg-muted px-1.5 py-0.5 rounded">System</span>
                                    )}
                                </div>
                                {edition.description && (
                                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                                        {resolveTranslation(edition.description)}
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

