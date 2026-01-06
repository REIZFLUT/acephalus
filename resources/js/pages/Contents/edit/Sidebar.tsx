import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MetadataEditor } from '@/components/editor/MetadataEditor';
import type { Content, CollectionSchema, BlockElement } from '@/types';
import { formatDate } from '@/utils/date';
import { countElements } from './utils';

interface SidebarProps {
    content: Content & { 
        versions: any[];
        current_version: string | number;
    };
    data: { 
        metadata: Record<string, unknown>; 
        elements: BlockElement[];
    };
    schema: CollectionSchema | null;
    isMetaOnlyContent: boolean;
    isDirty: boolean;
    onMetadataChange: (metadata: Record<string, unknown>) => void;
}

export function Sidebar({ content, data, schema, isMetaOnlyContent, isDirty, onMetadataChange }: SidebarProps) {
    const contentMetaFields = schema?.content_meta_fields || [];

    const getStatusBadge = () => {
        switch (content.status) {
            case 'published':
                return <Badge className="bg-green-600 text-white">Published</Badge>;
            case 'draft':
                return <Badge variant="secondary">Draft</Badge>;
            case 'archived':
                return <Badge variant="outline">Archived</Badge>;
            default:
                return <Badge variant="secondary">{content.status}</Badge>;
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Content Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Status</span>
                        {getStatusBadge()}
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Version</span>
                        <span className="font-mono">v{content.versions?.length || content.current_version || 1}</span>
                    </div>
                    {!isMetaOnlyContent && (
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Elements</span>
                            <span>{countElements(data.elements)}</span>
                        </div>
                    )}
                    <hr className="my-2" />
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Created</span>
                        <span>{formatDate(content.created_at)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Updated</span>
                        <span>{formatDate(content.updated_at)}</span>
                    </div>
                </CardContent>
            </Card>

            {/* Content Metadata - Desktop only (hidden in meta-only mode since it's shown in main area) */}
            {!isMetaOnlyContent && contentMetaFields.length > 0 && (
                <div className="hidden lg:block">
                    <MetadataEditor
                        fields={contentMetaFields}
                        values={data.metadata}
                        onChange={onMetadataChange}
                        title="Content Metadata"
                        compact
                    />
                </div>
            )}

            {isDirty && (
                <Card className="border-amber-500/50 bg-amber-500/5">
                    <CardContent className="py-4">
                        <p className="text-sm text-amber-600 dark:text-amber-400">
                            You have unsaved changes
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

