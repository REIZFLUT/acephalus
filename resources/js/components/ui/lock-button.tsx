"use client"

import * as React from "react"
import { Lock, Unlock } from "lucide-react"
import { router } from "@inertiajs/react"
import { cn } from "@/lib/utils"
import { Button } from "./button"
import { LockDialog } from "./lock-dialog"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "./tooltip"

interface LockButtonProps {
    isLocked: boolean
    lockRoute: string
    unlockRoute: string
    resourceType: 'collection' | 'content' | 'element'
    resourceName?: string
    canLock?: boolean
    canUnlock?: boolean
    className?: string
    variant?: 'default' | 'outline' | 'ghost'
    size?: 'default' | 'sm' | 'icon' | 'icon-sm'
}

function LockButton({
    isLocked,
    lockRoute,
    unlockRoute,
    resourceType,
    resourceName,
    canLock = true,
    canUnlock = true,
    className,
    variant = 'outline',
    size = 'sm',
}: LockButtonProps) {
    const [dialogOpen, setDialogOpen] = React.useState(false)
    const [processing, setProcessing] = React.useState(false)

    // Don't render if user can't perform either action
    if (!canLock && !canUnlock) {
        return null
    }

    // Check if current action is allowed
    const canPerformAction = isLocked ? canUnlock : canLock

    const handleConfirm = (reason?: string) => {
        setProcessing(true)

        if (isLocked) {
            // Unlock
            router.delete(unlockRoute, {
                preserveScroll: true,
                onSuccess: () => {
                    setDialogOpen(false)
                },
                onFinish: () => {
                    setProcessing(false)
                },
            })
        } else {
            // Lock
            router.post(lockRoute, {
                reason: reason,
            }, {
                preserveScroll: true,
                onSuccess: () => {
                    setDialogOpen(false)
                },
                onFinish: () => {
                    setProcessing(false)
                },
            })
        }
    }

    const button = (
        <Button
            variant={variant}
            size={size}
            onClick={() => setDialogOpen(true)}
            disabled={!canPerformAction}
            className={cn(
                isLocked && "text-destructive hover:text-destructive",
                className
            )}
        >
            {isLocked ? (
                <>
                    <Unlock className="size-4" />
                    {size !== 'icon' && size !== 'icon-sm' && 'Unlock'}
                </>
            ) : (
                <>
                    <Lock className="size-4" />
                    {size !== 'icon' && size !== 'icon-sm' && 'Lock'}
                </>
            )}
        </Button>
    )

    return (
        <>
            {!canPerformAction ? (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <span className="inline-block">{button}</span>
                        </TooltipTrigger>
                        <TooltipContent>
                            You don't have permission to {isLocked ? 'unlock' : 'lock'} this {resourceType}
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            ) : (
                button
            )}

            <LockDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                onConfirm={handleConfirm}
                isLocking={!isLocked}
                resourceType={resourceType}
                resourceName={resourceName}
                processing={processing}
            />
        </>
    )
}

export { LockButton }
