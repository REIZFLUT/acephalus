import { useState } from 'react';
import { useForm, router } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
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
import { BookOpen, Plus, Trash2, Shield, Loader2 } from 'lucide-react';
import { formatDateTime } from '@/utils/date';
import type { Collection, CollectionEdition } from '@/types';

interface EditionManagerProps {
    collection: Collection;
}

export function EditionManager({ collection }: EditionManagerProps) {
    const [isNewEditionOpen, setIsNewEditionOpen] = useState(false);
    const [purgePreviewCount, setPurgePreviewCount] = useState<number | null>(null);
    const [isLoadingPreview, setIsLoadingPreview] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
    });

    const editions = collection.editions || [];
    const currentEdition = collection.current_edition || 'Basis';

    const handleCreateEdition = (e: React.FormEvent) => {
        e.preventDefault();
        post(`/collections/${collection.slug}/editions`, {
            onSuccess: () => {
                setIsNewEditionOpen(false);
                reset();
            },
        });
    };

    const handlePurge = () => {
        router.delete(`/collections/${collection.slug}/versions/purge`, {
            preserveScroll: true,
        });
    };

    const loadPurgePreview = async () => {
        setIsLoadingPreview(true);
        try {
            const response = await fetch(`/collections/${collection.slug}/versions/purge-preview`);
            const data = await response.json();
            setPurgePreviewCount(data.count);
        } catch {
            setPurgePreviewCount(null);
        } finally {
            setIsLoadingPreview(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <BookOpen className="size-5" />
                    Editions
                </CardTitle>
                <CardDescription>
                    Manage content editions for this collection. Each edition represents a milestone version.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Current Edition */}
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div>
                        <Label className="text-sm font-medium">Current Edition</Label>
                        <div className="flex items-center gap-2 mt-1">
                            <Badge variant="default">{currentEdition}</Badge>
                        </div>
                    </div>
                    <Dialog open={isNewEditionOpen} onOpenChange={setIsNewEditionOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                                <Plus className="size-4 mr-2" />
                                New Edition
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <form onSubmit={handleCreateEdition}>
                                <DialogHeader>
                                    <DialogTitle>Create New Edition</DialogTitle>
                                    <DialogDescription>
                                        Creating a new edition will mark the current latest version of each content 
                                        as protected (edition end). All future changes will be part of the new edition.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="py-4 space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="edition-name">Edition Name</Label>
                                        <Input
                                            id="edition-name"
                                            placeholder="e.g. 2025-12, v2.0, Spring Release"
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            autoFocus
                                        />
                                        {errors.name && (
                                            <p className="text-sm text-destructive">{errors.name}</p>
                                        )}
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setIsNewEditionOpen(false)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={processing || !data.name.trim()}>
                                        {processing && <Loader2 className="size-4 mr-2 animate-spin" />}
                                        Create Edition
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Edition History */}
                {editions.length > 0 && (
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Edition History</Label>
                        <div className="space-y-2">
                            {editions.slice().reverse().map((edition: CollectionEdition, index: number) => (
                                <div
                                    key={edition.name}
                                    className={`flex items-center justify-between p-3 border rounded-lg ${
                                        edition.name === currentEdition
                                            ? 'border-primary/50 bg-primary/5'
                                            : ''
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <Shield className="size-4 text-muted-foreground" />
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium">{edition.name}</span>
                                                {edition.name === currentEdition && (
                                                    <Badge variant="secondary" className="text-xs">
                                                        Current
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                Created {formatDateTime(edition.created_at)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Purge Old Versions */}
                <div className="pt-4 border-t">
                    <div className="flex items-center justify-between">
                        <div>
                            <Label className="text-sm font-medium">Cleanup</Label>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Delete intermediate versions, keeping only edition endpoints and the latest version.
                            </p>
                        </div>
                        <AlertDialog onOpenChange={(open) => open && loadPurgePreview()}>
                            <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                                    <Trash2 className="size-4 mr-2" />
                                    Purge Versions
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Purge Old Versions</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        {isLoadingPreview ? (
                                            <span className="flex items-center gap-2">
                                                <Loader2 className="size-4 animate-spin" />
                                                Calculating versions to delete...
                                            </span>
                                        ) : purgePreviewCount !== null ? (
                                            <>
                                                This will permanently delete <strong>{purgePreviewCount}</strong> intermediate 
                                                version{purgePreviewCount !== 1 ? 's' : ''}. Edition endpoints and the current 
                                                latest version of each content will be preserved.
                                            </>
                                        ) : (
                                            'This will permanently delete intermediate versions. Edition endpoints and the current latest version of each content will be preserved.'
                                        )}
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={handlePurge}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                        disabled={purgePreviewCount === 0}
                                    >
                                        {purgePreviewCount === 0 ? 'Nothing to delete' : 'Delete Versions'}
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

