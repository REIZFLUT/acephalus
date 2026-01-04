import { useState, useEffect, useMemo } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
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
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Clock, Shield, GitCompare, Loader2, RotateCcw } from 'lucide-react';
import { formatDateTime } from '@/utils/date';
import { BlockEditorReadonly } from '@/components/editor/BlockEditorReadonly';
import { JsonDiffView } from './JsonDiffView';
import type { ContentVersion } from '@/types';

interface VersionPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    version: ContentVersion | null;
    allVersions: ContentVersion[];
    contentId: string;
    currentVersionNumber: number;
    onRestore: (versionNumber: number) => void;
}

export function VersionPreviewModal({
    isOpen,
    onClose,
    version,
    allVersions,
    contentId,
    currentVersionNumber,
    onRestore,
}: VersionPreviewModalProps) {
    const [compareMode, setCompareMode] = useState(false);
    const [compareVersionNumber, setCompareVersionNumber] = useState<number | null>(null);
    const [compareVersion, setCompareVersion] = useState<ContentVersion | null>(null);
    const [loading, setLoading] = useState(false);

    // Reset compare mode when modal closes
    useEffect(() => {
        if (!isOpen) {
            setCompareMode(false);
            setCompareVersionNumber(null);
            setCompareVersion(null);
        }
    }, [isOpen]);

    // Load compare version when selected
    useEffect(() => {
        if (compareMode && compareVersionNumber) {
            const foundVersion = allVersions.find(v => v.version_number === compareVersionNumber);
            setCompareVersion(foundVersion || null);
        } else {
            setCompareVersion(null);
        }
    }, [compareVersionNumber, compareMode, allVersions]);

    // Group versions by release
    const versionsByRelease = useMemo(() => {
        const groups: Record<string, ContentVersion[]> = {};
        allVersions.forEach(v => {
            const release = v.release || 'No Release';
            if (!groups[release]) {
                groups[release] = [];
            }
            groups[release].push(v);
        });
        return groups;
    }, [allVersions]);

    if (!version) return null;

    const otherVersions = allVersions.filter(v => Number(v.version_number) !== Number(version.version_number));
    const isCurrentVersion = Number(version.version_number) === Number(currentVersionNumber);

    const handleRestore = () => {
        onRestore(version.version_number);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-[90vw] w-[1400px] h-[90vh] flex flex-col overflow-hidden">
                <DialogHeader>
                    <div className="flex items-center justify-between pr-8">
                        <div>
                            <DialogTitle className="flex items-center gap-2">
                                <Clock className="size-5" />
                                Version {version.version_number}
                                {isCurrentVersion && (
                                    <Badge variant="default" className="text-xs">
                                        Current
                                    </Badge>
                                )}
                                {version.is_release_end && (
                                    <Badge variant="outline" className="gap-1">
                                        <Shield className="size-3" />
                                        Protected
                                    </Badge>
                                )}
                                {version.release && (
                                    <Badge variant="secondary">{version.release}</Badge>
                                )}
                            </DialogTitle>
                            <DialogDescription>
                                {formatDateTime(version.created_at)}
                                {version.change_note && ` • "${version.change_note}"`}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                {/* Compare Mode Toggle */}
                <div className="flex items-center justify-between py-2 px-1 border-b">
                    <div className="flex items-center gap-3">
                        <Switch
                            id="compare-mode"
                            checked={compareMode}
                            onCheckedChange={setCompareMode}
                        />
                        <Label htmlFor="compare-mode" className="flex items-center gap-2 cursor-pointer">
                            <GitCompare className="size-4" />
                            Compare with another version (JSON Diff)
                        </Label>
                    </div>

                    {compareMode && otherVersions.length > 0 && (
                        <Select
                            value={compareVersionNumber?.toString() || ''}
                            onValueChange={(value) => setCompareVersionNumber(parseInt(value))}
                        >
                            <SelectTrigger className="w-[250px]">
                                <SelectValue placeholder="Select version..." />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.entries(versionsByRelease).map(([release, versions]) => {
                                    const filteredVersions = versions.filter(
                                        v => v.version_number !== version.version_number
                                    );
                                    if (filteredVersions.length === 0) return null;

                                    return (
                                        <SelectGroup key={release}>
                                            <SelectLabel className="flex items-center gap-2">
                                                {release}
                                                <Badge variant="outline" className="text-xs">
                                                    {filteredVersions.length}
                                                </Badge>
                                            </SelectLabel>
                                            {filteredVersions.map((v) => (
                                                <SelectItem key={v._id} value={v.version_number.toString()}>
                                                    <span className="flex items-center gap-2">
                                                        Version {v.version_number}
                                                        {v.is_release_end && (
                                                            <Shield className="size-3 text-muted-foreground" />
                                                        )}
                                                        {v.version_number === currentVersionNumber && (
                                                            <Badge variant="secondary" className="text-xs">
                                                                Current
                                                            </Badge>
                                                        )}
                                                    </span>
                                                </SelectItem>
                                            ))}
                                        </SelectGroup>
                                    );
                                })}
                            </SelectContent>
                        </Select>
                    )}
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="size-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : compareMode && compareVersion ? (
                        <CompareView
                            fromVersion={compareVersion}
                            toVersion={version}
                            currentVersionNumber={currentVersionNumber}
                        />
                    ) : (
                        <SingleVersionView version={version} />
                    )}
                </div>

                {/* Footer with Restore Button */}
                <DialogFooter className="border-t pt-4">
                    <div className="flex items-center justify-between w-full">
                        <div className="text-sm text-muted-foreground">
                            {version.elements?.length || 0} elements
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" onClick={onClose}>
                                Close
                            </Button>
                            {!isCurrentVersion && (
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="default">
                                            <RotateCcw className="size-4 mr-2" />
                                            Restore this version
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>
                                                Restore Version {version.version_number}?
                                            </AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This will restore the content to version {version.version_number}
                                                {version.release && ` from release "${version.release}"`}.
                                                A new version will be created with the restored content.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={handleRestore}>
                                                Restore
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            )}
                        </div>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function SingleVersionView({ version }: { version: ContentVersion }) {
    return (
        <div className="p-4 space-y-4">
            {/* Snapshot Info */}
            {(version.snapshot?.title || version.title) && (
                <div className="p-4 bg-muted/30 rounded-lg space-y-2">
                    <h3 className="font-semibold text-lg">{version.snapshot?.title || version.title}</h3>
                    <p className="text-sm text-muted-foreground">/{version.snapshot?.slug || version.slug}</p>
                </div>
            )}

            {/* Elements - Rendered like the editor but disabled */}
            <div className="space-y-3">
                <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                    Elements ({version.elements?.length || 0})
                </h4>
                <BlockEditorReadonly elements={version.elements || []} />
            </div>

            {/* Metadata */}
            {version.snapshot?.metadata && Object.keys(version.snapshot.metadata).length > 0 && (
                <div className="space-y-3">
                    <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                        Metadata
                    </h4>
                    <pre className="p-3 bg-muted/30 rounded-lg text-xs overflow-x-auto">
                        {JSON.stringify(version.snapshot.metadata, null, 2)}
                    </pre>
                </div>
            )}
        </div>
    );
}

function CompareView({
    fromVersion,
    toVersion,
    currentVersionNumber,
}: {
    fromVersion: ContentVersion;
    toVersion: ContentVersion;
    currentVersionNumber: number;
}) {
    // Create comparison objects
    const fromData = useMemo(() => ({
        title: fromVersion.snapshot?.title || fromVersion.title,
        slug: fromVersion.snapshot?.slug || fromVersion.slug,
        status: fromVersion.snapshot?.status,
        elements: fromVersion.elements || [],
        metadata: fromVersion.snapshot?.metadata || {},
    }), [fromVersion]);

    const toData = useMemo(() => ({
        title: toVersion.snapshot?.title || toVersion.title,
        slug: toVersion.snapshot?.slug || toVersion.slug,
        status: toVersion.snapshot?.status,
        elements: toVersion.elements || [],
        metadata: toVersion.snapshot?.metadata || {},
    }), [toVersion]);

    return (
        <div className="p-4 space-y-6">
            {/* Version Headers */}
            <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <div className="flex items-center gap-2 text-sm font-medium flex-wrap">
                        <Badge variant="outline" className="bg-red-500/10">
                            Version {fromVersion.version_number}
                        </Badge>
                        {fromVersion.release && (
                            <Badge variant="secondary" className="text-xs">
                                {fromVersion.release}
                            </Badge>
                        )}
                        {fromVersion.version_number === currentVersionNumber && (
                            <Badge variant="default" className="text-xs">Current</Badge>
                        )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                        {formatDateTime(fromVersion.created_at)}
                    </p>
                </div>
                <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <div className="flex items-center gap-2 text-sm font-medium flex-wrap">
                        <Badge variant="outline" className="bg-green-500/10">
                            Version {toVersion.version_number}
                        </Badge>
                        {toVersion.release && (
                            <Badge variant="secondary" className="text-xs">
                                {toVersion.release}
                            </Badge>
                        )}
                        {toVersion.version_number === currentVersionNumber && (
                            <Badge variant="default" className="text-xs">Current</Badge>
                        )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                        {formatDateTime(toVersion.created_at)}
                    </p>
                </div>
            </div>

            {/* JSON Diff View */}
            <JsonDiffView
                from={fromData}
                to={toData}
                fromLabel={`Version ${fromVersion.version_number}`}
                toLabel={`Version ${toVersion.version_number}`}
            />
        </div>
    );
}
