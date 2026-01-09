"use client"

import * as React from "react"
import { Lock, Unlock } from "lucide-react"
import { Button } from "./button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "./dialog"
import { Label } from "./label"
import { Textarea } from "./textarea"

interface LockDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onConfirm: (reason?: string) => void
    isLocking: boolean
    resourceType: 'collection' | 'content' | 'element'
    resourceName?: string
    processing?: boolean
}

function LockDialog({
    open,
    onOpenChange,
    onConfirm,
    isLocking,
    resourceType,
    resourceName,
    processing = false,
}: LockDialogProps) {
    const [reason, setReason] = React.useState('')

    const handleConfirm = () => {
        onConfirm(reason || undefined)
        setReason('')
    }

    const handleOpenChange = (newOpen: boolean) => {
        if (!newOpen) {
            setReason('')
        }
        onOpenChange(newOpen)
    }

    const resourceTypeLabel = {
        collection: 'Collection',
        content: 'Content',
        element: 'Element',
    }[resourceType]

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        {isLocking ? (
                            <>
                                <Lock className="size-5" />
                                Lock {resourceTypeLabel}
                            </>
                        ) : (
                            <>
                                <Unlock className="size-5" />
                                Unlock {resourceTypeLabel}
                            </>
                        )}
                    </DialogTitle>
                    <DialogDescription>
                        {isLocking ? (
                            <>
                                Locking {resourceName ? `"${resourceName}"` : `this ${resourceType}`} will prevent any modifications, including editing, deleting, and schema changes.
                                {resourceType === 'collection' && (
                                    <span className="block mt-2 text-amber-600 dark:text-amber-400">
                                        Note: This will also lock all contents within this collection.
                                    </span>
                                )}
                            </>
                        ) : (
                            <>
                                Are you sure you want to unlock {resourceName ? `"${resourceName}"` : `this ${resourceType}`}? This will allow modifications again.
                            </>
                        )}
                    </DialogDescription>
                </DialogHeader>

                {isLocking && (
                    <div className="space-y-2">
                        <Label htmlFor="lock-reason">Reason (optional)</Label>
                        <Textarea
                            id="lock-reason"
                            placeholder="Enter a reason for locking..."
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            rows={3}
                        />
                    </div>
                )}

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => handleOpenChange(false)}
                        disabled={processing}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant={isLocking ? "destructive" : "default"}
                        onClick={handleConfirm}
                        disabled={processing}
                    >
                        {processing ? (
                            "Processing..."
                        ) : isLocking ? (
                            <>
                                <Lock className="size-4" />
                                Lock
                            </>
                        ) : (
                            <>
                                <Unlock className="size-4" />
                                Unlock
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export { LockDialog }
