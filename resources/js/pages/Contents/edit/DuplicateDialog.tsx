import { useState } from 'react';
import { Loader2, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { router } from '@inertiajs/react';
import type { Content } from '@/types';

interface DuplicateDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    content: Content & { collection: { slug: string } };
    initialSlug: string;
}

export function DuplicateDialog({ open, onOpenChange, content, initialSlug }: DuplicateDialogProps) {
    const [duplicateSlug, setDuplicateSlug] = useState(initialSlug);
    const [duplicateError, setDuplicateError] = useState<string | null>(null);
    const [isDuplicating, setIsDuplicating] = useState(false);

    const handleDuplicate = () => {
        if (!duplicateSlug.trim()) {
            setDuplicateError('Please enter a slug.');
            return;
        }

        // Validate slug format
        if (!/^[a-z0-9-]+$/.test(duplicateSlug)) {
            setDuplicateError('Slug must only contain lowercase letters, numbers, and hyphens.');
            return;
        }

        setIsDuplicating(true);
        setDuplicateError(null);

        router.post(
            `/contents/${content._id}/duplicate`,
            { slug: duplicateSlug },
            {
                onError: (errors) => {
                    setDuplicateError(errors.slug || 'Failed to duplicate content.');
                    setIsDuplicating(false);
                },
                onSuccess: () => {
                    onOpenChange(false);
                    setDuplicateSlug('');
                    setIsDuplicating(false);
                },
            }
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Duplicate Content</DialogTitle>
                    <DialogDescription>
                        Create a copy of "{content.title}" with a new unique slug.
                        All elements, metadata, and editions will be copied.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="duplicate-slug">New Slug</Label>
                        <Input
                            id="duplicate-slug"
                            value={duplicateSlug}
                            onChange={(e) => {
                                setDuplicateSlug(e.target.value);
                                setDuplicateError(null);
                            }}
                            placeholder="new-content-slug"
                        />
                        <p className="text-sm text-muted-foreground">
                            URL: /{content.collection.slug}/{duplicateSlug || 'new-slug'}
                        </p>
                        {duplicateError && (
                            <p className="text-sm text-destructive">{duplicateError}</p>
                        )}
                    </div>
                </div>
                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isDuplicating}
                    >
                        Cancel
                    </Button>
                    <Button onClick={handleDuplicate} disabled={isDuplicating}>
                        {isDuplicating ? (
                            <Loader2 className="size-4 mr-2 animate-spin" />
                        ) : (
                            <Copy className="size-4 mr-2" />
                        )}
                        Duplicate
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

