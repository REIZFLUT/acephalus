"use client"

import * as React from "react"
import {
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
    type ColumnDef,
    type ColumnFiltersState,
    type SortingState,
    type VisibilityState,
} from "@tanstack/react-table"
import { MoreHorizontal, Pencil, Trash2, Download, Image as ImageIcon, File, Video, Music, FileText } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ThumbnailImage } from "@/components/ui/thumbnail-image"
import { DataTableColumnHeader } from "./DataTableColumnHeader"
import { DataTablePagination } from "./DataTablePagination"
import { DataTableViewOptions } from "./DataTableViewOptions"
import type { Media, MediaMetaField } from "@/types"

interface MediaDataTableProps {
    media: Media[]
    metaFields: MediaMetaField[]
    onEdit: (item: Media) => void
    onDelete: (item: Media) => void
}

// Get file icon based on mime type
const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return ImageIcon
    if (mimeType.startsWith('video/')) return Video
    if (mimeType.startsWith('audio/')) return Music
    if (mimeType.startsWith('text/') || mimeType.includes('pdf')) return FileText
    return File
}

// Format file size
const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function MediaDataTable({ 
    media,
    metaFields,
    onEdit,
    onDelete,
}: MediaDataTableProps) {
    // Filter out focus_area from meta fields - it's not a displayable text field
    const displayableMetaFields = React.useMemo(() => {
        return metaFields.filter(f => f.slug !== 'focus_area')
    }, [metaFields])

    // Build column visibility - base columns always visible, tags and meta fields hidden by default
    const initialVisibility = React.useMemo(() => {
        const visibility: VisibilityState = {
            thumbnail: true,
            original_filename: true,
            mime_type: true,
            size: true,
            tags: false, // Tags column toggleable, hidden by default
        }
        // All meta fields start hidden but can be toggled
        displayableMetaFields.forEach((field) => {
            visibility[`meta_${field.slug}`] = false
        })
        return visibility
    }, [displayableMetaFields])

    const [sorting, setSorting] = React.useState<SortingState>([])
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
    const [globalFilter, setGlobalFilter] = React.useState("")
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>(initialVisibility)
    const [rowSelection, setRowSelection] = React.useState({})

    // Build column labels for view options
    const columnLabels = React.useMemo(() => {
        const labels: Record<string, string> = {
            thumbnail: 'Thumbnail',
            original_filename: 'Filename',
            mime_type: 'MIME Type',
            size: 'Size',
            tags: 'Tags',
        }
        displayableMetaFields.forEach((field) => {
            labels[`meta_${field.slug}`] = field.name
        })
        return labels
    }, [displayableMetaFields])

    // Build columns
    const columns: ColumnDef<Media>[] = React.useMemo(() => {
        const cols: ColumnDef<Media>[] = []

        // Thumbnail column - always visible, not toggleable
        cols.push({
            id: 'thumbnail',
            accessorKey: 'url',
            header: () => <span className="sr-only">Thumbnail</span>,
            cell: ({ row }) => {
                const item = row.original
                const isImage = item.mime_type.startsWith('image/')
                const Icon = getFileIcon(item.mime_type)
                
                return (
                    <div className="size-10 shrink-0 rounded bg-muted flex items-center justify-center overflow-hidden">
                        {isImage && (item.thumbnail_urls || item.url) ? (
                            <ThumbnailImage
                                thumbnailUrls={item.thumbnail_urls}
                                fallbackUrl={item.url}
                                alt={item.original_filename}
                                sizes="40px"
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <Icon className="size-5 text-muted-foreground" />
                        )}
                    </div>
                )
            },
            enableSorting: false,
            enableHiding: false,
        })

        // Filename column - always visible, not toggleable
        cols.push({
            id: 'original_filename',
            accessorKey: 'original_filename',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Filename" />
            ),
            cell: ({ row }) => (
                <div className="font-medium max-w-[300px] truncate" title={row.original.original_filename}>
                    {row.original.original_filename}
                </div>
            ),
            enableSorting: true,
            enableHiding: false,
        })

        // MIME type column - always visible, toggleable
        cols.push({
            id: 'mime_type',
            accessorKey: 'mime_type',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Type" />
            ),
            cell: ({ row }) => (
                <span className="text-muted-foreground text-sm">
                    {row.original.mime_type}
                </span>
            ),
            enableSorting: true,
            enableHiding: false,
        })

        // Size column - always visible, toggleable
        cols.push({
            id: 'size',
            accessorKey: 'size',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Size" />
            ),
            cell: ({ row }) => (
                <span className="text-muted-foreground text-sm">
                    {formatFileSize(row.original.size)}
                </span>
            ),
            enableSorting: true,
            enableHiding: false,
        })

        // Tags column - toggleable
        cols.push({
            id: 'tags',
            accessorKey: 'tags',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Tags" />
            ),
            cell: ({ row }) => {
                const itemTags = row.original.tags
                if (!itemTags || itemTags.length === 0) {
                    return <span className="text-muted-foreground">—</span>
                }
                return (
                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {itemTags.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                            </Badge>
                        ))}
                        {itemTags.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                                +{itemTags.length - 3}
                            </Badge>
                        )}
                    </div>
                )
            },
            enableSorting: false,
            enableHiding: true,
            filterFn: (row, id, value) => {
                const itemTags = row.original.tags
                if (!itemTags) return false
                return itemTags.some((tag: string) => 
                    tag.toLowerCase().includes(value.toLowerCase())
                )
            },
        })

        // Dynamic meta field columns
        displayableMetaFields.forEach((field) => {
            cols.push({
                id: `meta_${field.slug}`,
                accessorFn: (row) => {
                    // Check both top-level and metadata object
                    if (field.slug === 'alt') return row.alt || row.metadata?.alt
                    if (field.slug === 'caption') return row.caption || row.metadata?.caption
                    return row.metadata?.[field.slug]
                },
                header: ({ column }) => (
                    <DataTableColumnHeader column={column} title={field.name} />
                ),
                cell: ({ row }) => {
                    let value: unknown
                    if (field.slug === 'alt') {
                        value = row.original.alt || row.original.metadata?.alt
                    } else if (field.slug === 'caption') {
                        value = row.original.caption || row.original.metadata?.caption
                    } else {
                        value = row.original.metadata?.[field.slug]
                    }
                    
                    if (value === undefined || value === null || value === '') {
                        return <span className="text-muted-foreground">—</span>
                    }
                    
                    return (
                        <span className="text-sm max-w-[200px] truncate block" title={String(value)}>
                            {String(value)}
                        </span>
                    )
                },
                enableSorting: true,
                enableHiding: true,
            })
        })

        // Actions column
        cols.push({
            id: "actions",
            enableHiding: false,
            cell: ({ row }) => {
                const item = row.original
                return (
                    <AlertDialog>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="size-4" />
                                    <span className="sr-only">Open menu</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => onEdit(item)}>
                                    <Pencil className="size-4 mr-2" />
                                    Edit
                                </DropdownMenuItem>
                                {item.url && (
                                    <DropdownMenuItem asChild>
                                        <a href={item.url} download={item.original_filename}>
                                            <Download className="size-4 mr-2" />
                                            Download
                                        </a>
                                    </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <AlertDialogTrigger asChild>
                                    <DropdownMenuItem className="text-destructive focus:text-destructive">
                                        <Trash2 className="size-4 mr-2" />
                                        Delete
                                    </DropdownMenuItem>
                                </AlertDialogTrigger>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Delete File</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Are you sure you want to delete "{item.original_filename}"? This action cannot be undone.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={() => onDelete(item)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                    Delete
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                )
            },
        })

        return cols
    }, [displayableMetaFields, onEdit, onDelete])

    const table = useReactTable({
        data: media,
        columns,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        onGlobalFilterChange: setGlobalFilter,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        initialState: {
            pagination: {
                pageSize: 25,
            },
        },
        state: {
            sorting,
            columnFilters,
            globalFilter,
            columnVisibility,
            rowSelection,
        },
    })

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-4">
                <Input
                    placeholder="Search in this folder..."
                    value={globalFilter}
                    onChange={(event) => setGlobalFilter(event.target.value)}
                    className="max-w-sm"
                />
                <DataTableViewOptions table={table} columnLabels={columnLabels} />
            </div>
            <Card className="overflow-hidden">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => {
                                    return (
                                        <TableHead key={header.id}>
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                      header.column.columnDef.header,
                                                      header.getContext()
                                                  )}
                                        </TableHead>
                                    )
                                })}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() && "selected"}
                                    className="cursor-pointer hover:bg-muted/50"
                                    onDoubleClick={() => onEdit(row.original)}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext()
                                            )}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length}
                                    className="h-24 text-center"
                                >
                                    No files in this folder.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </Card>
            <DataTablePagination 
                table={table} 
                pageSizeOptions={[10, 25, 50, 100]}
            />
        </div>
    )
}

