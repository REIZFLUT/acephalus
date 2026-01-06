import { Clock, User, Eye, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import type { Content, ContentVersion } from '@/types';
import { formatDateTime } from '@/utils/date';
import { DiffSummaryBadges } from './DiffSummaryBadges';

interface VersionsTabProps {
    content: Content & { versions: ContentVersion[] };
    onVersionClick: (version: ContentVersion) => void;
    onRestoreVersion: (versionNumber: number) => void;
}

export function VersionsTab({ content, onVersionClick, onRestoreVersion }: VersionsTabProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Version History</CardTitle>
                <CardDescription>
                    All previous versions of this content. 
                    Restore any version to revert changes.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {content.versions?.length > 0 ? (
                    <div className="space-y-2">
                        {content.versions.map((version) => (
                            <div
                                key={version._id}
                                className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer group"
                                onClick={() => onVersionClick(version)}
                            >
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-muted rounded-md group-hover:bg-primary/10 transition-colors">
                                        <Clock className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-medium group-hover:text-primary transition-colors">
                                                Version {version.version_number}
                                            </span>
                                            {Number(version.version_number) === Number(content.current_version) && (
                                                <Badge variant="secondary" className="text-xs">
                                                    Current
                                                </Badge>
                                            )}
                                            {/* Show title if it differs from current content title */}
                                            {version.snapshot?.title && version.snapshot.title !== content.title && (
                                                <span className="text-xs text-muted-foreground">
                                                    "{version.snapshot.title}"
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <span>{formatDateTime(version.created_at)}</span>
                                            {version.creator_name && (
                                                <span className="flex items-center gap-1">
                                                    <User className="size-3" />
                                                    {version.creator_name}
                                                </span>
                                            )}
                                        </div>
                                        {version.change_note && (
                                            <p className="text-sm text-muted-foreground">
                                                "{version.change_note}"
                                            </p>
                                        )}
                                        {/* Diff Summary */}
                                        {version.diff_summary && (
                                            <DiffSummaryBadges diff={version.diff_summary} />
                                        )}
                                        <p className="text-xs text-muted-foreground/60 opacity-0 group-hover:opacity-100 transition-opacity">
                                            Click to preview
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => onVersionClick(version)}
                                    >
                                        <Eye className="size-4 mr-2" />
                                        Preview
                                    </Button>
                                    {Number(version.version_number) !== Number(content.current_version) && (
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="outline" size="sm">
                                                    <RotateCcw className="size-4 mr-2" />
                                                    Restore
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>
                                                        Restore Version {version.version_number}
                                                    </AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        This will restore the content to version {version.version_number}.
                                                        A new version will be created with the restored content.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction
                                                        onClick={() => onRestoreVersion(version.version_number)}
                                                    >
                                                        Restore
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 text-muted-foreground">
                        <Clock className="size-12 mx-auto mb-4 opacity-50" />
                        <p>No version history yet</p>
                        <p className="text-sm">
                            Versions are created when you save changes
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

