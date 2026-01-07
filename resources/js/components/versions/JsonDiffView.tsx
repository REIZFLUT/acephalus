import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface JsonDiffViewProps {
    from: unknown;
    to: unknown;
    fromLabel?: string;
    toLabel?: string;
}

type DiffType = 'added' | 'removed' | 'modified' | 'unchanged';

interface DiffLine {
    type: DiffType;
    path: string;
    fromValue?: string;
    toValue?: string;
    indent: number;
}

export function JsonDiffView({ from, to, fromLabel = 'Before', toLabel = 'After' }: JsonDiffViewProps) {
    const diffLines = useMemo(() => {
        return computeDiff(from, to);
    }, [from, to]);

    const stats = useMemo(() => {
        return {
            added: diffLines.filter(l => l.type === 'added').length,
            removed: diffLines.filter(l => l.type === 'removed').length,
            modified: diffLines.filter(l => l.type === 'modified').length,
        };
    }, [diffLines]);

    return (
        <div className="space-y-3">
            {/* Stats */}
            <div className="flex items-center gap-3 text-sm">
                <Badge variant="outline" className="bg-green-500/10 text-green-600">
                    +{stats.added} added
                </Badge>
                <Badge variant="outline" className="bg-red-500/10 text-red-600">
                    -{stats.removed} removed
                </Badge>
                <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600">
                    ~{stats.modified} modified
                </Badge>
            </div>

            {/* Diff View */}
            <div className="border rounded-lg overflow-hidden bg-muted/20">
                <div className="grid grid-cols-2 border-b bg-muted/50">
                    <div className="px-3 py-2 text-sm font-medium border-r text-red-600">
                        {fromLabel}
                    </div>
                    <div className="px-3 py-2 text-sm font-medium text-green-600">
                        {toLabel}
                    </div>
                </div>
                
                <ScrollArea className="max-h-[500px]">
                    <div className="font-mono text-xs">
                        {diffLines.map((line, index) => (
                            <DiffLineRow key={index} line={line} />
                        ))}
                    </div>
                </ScrollArea>
            </div>
        </div>
    );
}

function DiffLineRow({ line }: { line: DiffLine }) {
    const getRowClass = () => {
        switch (line.type) {
            case 'added':
                return 'bg-green-500/10';
            case 'removed':
                return 'bg-red-500/10';
            case 'modified':
                return 'bg-yellow-500/10';
            default:
                return '';
        }
    };

    const indent = '  '.repeat(line.indent);

    return (
        <div className={`grid grid-cols-2 border-b border-border/50 ${getRowClass()}`}>
            {/* From side */}
            <div className="px-3 py-1 border-r border-border/50 overflow-x-auto">
                {(line.type === 'removed' || line.type === 'modified' || line.type === 'unchanged') && (
                    <span className={line.type === 'removed' ? 'text-red-600' : line.type === 'modified' ? 'text-yellow-600' : 'text-muted-foreground'}>
                        {line.type === 'removed' && <span className="text-red-500 mr-1">-</span>}
                        {line.type === 'modified' && <span className="text-yellow-500 mr-1">~</span>}
                        <span className="text-muted-foreground/70">{indent}</span>
                        <span className="text-blue-500">{line.path}</span>
                        {line.fromValue !== undefined && (
                            <>
                                <span className="text-muted-foreground">: </span>
                                <span className={line.type === 'modified' ? 'line-through opacity-60' : ''}>
                                    {formatValue(line.fromValue)}
                                </span>
                            </>
                        )}
                    </span>
                )}
            </div>
            
            {/* To side */}
            <div className="px-3 py-1 overflow-x-auto">
                {(line.type === 'added' || line.type === 'modified' || line.type === 'unchanged') && (
                    <span className={line.type === 'added' ? 'text-green-600' : line.type === 'modified' ? 'text-yellow-600' : 'text-muted-foreground'}>
                        {line.type === 'added' && <span className="text-green-500 mr-1">+</span>}
                        {line.type === 'modified' && <span className="text-yellow-500 mr-1">~</span>}
                        <span className="text-muted-foreground/70">{indent}</span>
                        <span className="text-blue-500">{line.path}</span>
                        {line.toValue !== undefined && (
                            <>
                                <span className="text-muted-foreground">: </span>
                                <span>{formatValue(line.toValue)}</span>
                            </>
                        )}
                    </span>
                )}
            </div>
        </div>
    );
}

function formatValue(value: string): string {
    if (value.length > 100) {
        return value.substring(0, 100) + '...';
    }
    return value;
}

function computeDiff(from: unknown, to: unknown, path: string = '', indent: number = 0): DiffLine[] {
    const lines: DiffLine[] = [];

    // Handle null/undefined
    if (from === null || from === undefined) {
        if (to === null || to === undefined) {
            return lines;
        }
        // Everything in 'to' is added
        return flattenObject(to, path, indent, 'added');
    }

    if (to === null || to === undefined) {
        // Everything in 'from' is removed
        return flattenObject(from, path, indent, 'removed');
    }

    // Handle arrays
    if (Array.isArray(from) && Array.isArray(to)) {
        const maxLen = Math.max(from.length, to.length);
        for (let i = 0; i < maxLen; i++) {
            const itemPath = path ? `${path}[${i}]` : `[${i}]`;
            if (i >= from.length) {
                lines.push(...flattenObject(to[i], itemPath, indent, 'added'));
            } else if (i >= to.length) {
                lines.push(...flattenObject(from[i], itemPath, indent, 'removed'));
            } else {
                lines.push(...computeDiff(from[i], to[i], itemPath, indent));
            }
        }
        return lines;
    }

    // Handle objects
    if (typeof from === 'object' && typeof to === 'object' && from !== null && to !== null) {
        const fromObj = from as Record<string, unknown>;
        const toObj = to as Record<string, unknown>;
        const allKeys = new Set([...Object.keys(fromObj), ...Object.keys(toObj)]);

        for (const key of allKeys) {
            const keyPath = path ? `${path}.${key}` : key;
            
            if (!(key in fromObj)) {
                lines.push(...flattenObject(toObj[key], keyPath, indent, 'added'));
            } else if (!(key in toObj)) {
                lines.push(...flattenObject(fromObj[key], keyPath, indent, 'removed'));
            } else {
                lines.push(...computeDiff(fromObj[key], toObj[key], keyPath, indent));
            }
        }
        return lines;
    }

    // Handle primitives
    const fromStr = JSON.stringify(from);
    const toStr = JSON.stringify(to);

    if (fromStr !== toStr) {
        lines.push({
            type: 'modified',
            path,
            fromValue: fromStr,
            toValue: toStr,
            indent,
        });
    }

    return lines;
}

function flattenObject(obj: unknown, path: string, indent: number, type: 'added' | 'removed'): DiffLine[] {
    const lines: DiffLine[] = [];

    if (obj === null || obj === undefined) {
        return lines;
    }

    if (Array.isArray(obj)) {
        lines.push({
            type,
            path,
            fromValue: type === 'removed' ? `Array(${obj.length})` : undefined,
            toValue: type === 'added' ? `Array(${obj.length})` : undefined,
            indent,
        });
        obj.forEach((item, i) => {
            lines.push(...flattenObject(item, `${path}[${i}]`, indent + 1, type));
        });
    } else if (typeof obj === 'object') {
        const entries = Object.entries(obj as Record<string, unknown>);
        if (entries.length === 0) {
            lines.push({
                type,
                path,
                fromValue: type === 'removed' ? '{}' : undefined,
                toValue: type === 'added' ? '{}' : undefined,
                indent,
            });
        } else {
            for (const [key, value] of entries) {
                const keyPath = path ? `${path}.${key}` : key;
                if (typeof value === 'object' && value !== null) {
                    lines.push(...flattenObject(value, keyPath, indent, type));
                } else {
                    lines.push({
                        type,
                        path: keyPath,
                        fromValue: type === 'removed' ? JSON.stringify(value) : undefined,
                        toValue: type === 'added' ? JSON.stringify(value) : undefined,
                        indent,
                    });
                }
            }
        }
    } else {
        lines.push({
            type,
            path,
            fromValue: type === 'removed' ? JSON.stringify(obj) : undefined,
            toValue: type === 'added' ? JSON.stringify(obj) : undefined,
            indent,
        });
    }

    return lines;
}



