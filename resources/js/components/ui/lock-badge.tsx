import * as React from "react"
import { Lock, LockOpen } from "lucide-react"
import { cn } from "@/lib/utils"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "./tooltip"

interface LockBadgeProps {
    isLocked: boolean
    lockedBy?: string | null
    lockedAt?: string | null
    lockReason?: string | null
    source?: 'self' | 'collection' | 'content' | null
    className?: string
    showUnlocked?: boolean
}

function formatDate(dateString: string | null | undefined): string {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    })
}

function getSourceLabel(source?: 'self' | 'collection' | 'content' | null): string {
    switch (source) {
        case 'collection':
            return 'Locked by Collection'
        case 'content':
            return 'Locked by Content'
        case 'self':
        default:
            return 'Locked'
    }
}

function LockBadge({
    isLocked,
    lockedBy,
    lockedAt,
    lockReason,
    source,
    className,
    showUnlocked = false,
}: LockBadgeProps) {
    if (!isLocked && !showUnlocked) {
        return null
    }

    if (!isLocked) {
        return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <span className={cn("inline-flex cursor-help", className)}>
                            <LockOpen className="size-4 text-muted-foreground" />
                        </span>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                        Editable
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        )
    }

    const tooltipContent = (
        <div className="space-y-1 text-xs">
            <div className="font-medium">{getSourceLabel(source)}</div>
            {lockedBy && <div>By: {lockedBy}</div>}
            {lockedAt && <div>At: {formatDate(lockedAt)}</div>}
            {lockReason && (
                <div className="pt-1 border-t border-border">
                    <span className="text-muted-foreground">Reason:</span> {lockReason}
                </div>
            )}
        </div>
    )

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <span className={cn("inline-flex cursor-help", className)}>
                        <Lock className="size-4 text-destructive" />
                    </span>
                </TooltipTrigger>
                <TooltipContent side="bottom" align="start">
                    {tooltipContent}
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}

export { LockBadge }
