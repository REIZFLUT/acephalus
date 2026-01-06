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
import { MoreHorizontal, Pencil, Trash2, Download, Image as ImageIcon, File, Video, Music, FileText, Folder } from "lucide-react"

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

// Combined type for folders and media items
interface FolderItem {
    _type: 'folder'
    id: string
    name: string
    type: string
    is_system: boolean
    children_count: number
    media_count: number
}

interface MediaItem extends Media {
    _type: 'media'
}

type FileSystemItem = FolderItem | MediaItem

interface Subfolder {
    id: string
    name: string
    type: string
    is_system: boolean
    children_count: number
    media_count: number
}

interface MediaDataTableProps {
    media: Media[]
    metaFields: MediaMetaField[]
    subfolders?: Subfolder[]
    onEdit: (item: Media) => void
    onDelete: (item: Media) => void
    onFolderNavigate?: (folderId: string) => void
}

// Get file icon based on mime type
const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return ImageIcon
    if (mimeType.startsWith('video/')) return Video
    if (mimeType.startsWith('audio/')) return Music
    if (mimeType.startsWith('text/') || mimeType.includes('pdf')) return FileText
    return File
}

// Get user-friendly file type from filename or mime type
const getFileTypeLabel = (filename: string, mimeType: string): string => {
    // First try to get extension from filename
    const ext = filename.split('.').pop()?.toLowerCase()
    if (ext && ext !== filename.toLowerCase()) {
        return ext.toUpperCase()
    }
    
    // Fallback: derive from mime type
    const mimeMap: Record<string, string> = {
        'image/jpeg': 'JPG',
        'image/jpg': 'JPG',
        'image/png': 'PNG',
        'image/gif': 'GIF',
        'image/webp': 'WEBP',
        'image/svg+xml': 'SVG',
        'image/bmp': 'BMP',
        'image/tiff': 'TIFF',
        'video/mp4': 'MP4',
        'video/webm': 'WEBM',
        'video/quicktime': 'MOV',
        'video/x-msvideo': 'AVI',
        'audio/mpeg': 'MP3',
        'audio/wav': 'WAV',
        'audio/ogg': 'OGG',
        'audio/flac': 'FLAC',
        'application/pdf': 'PDF',
        'application/msword': 'DOC',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
        'application/vnd.ms-excel': 'XLS',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLSX',
        'application/vnd.ms-powerpoint': 'PPT',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PPTX',
        'application/zip': 'ZIP',
        'application/x-rar-compressed': 'RAR',
        'application/json': 'JSON',
        'text/plain': 'TXT',
        'text/html': 'HTML',
        'text/css': 'CSS',
        'text/javascript': 'JS',
        'application/javascript': 'JS',
    }
    
    if (mimeMap[mimeType]) {
        return mimeMap[mimeType]
    }
    
    // Try to extract from mime type (e.g., "image/png" -> "PNG")
    const parts = mimeType.split('/')
    if (parts.length === 2) {
        const subtype = parts[1].split('+')[0].split('.').pop()
        if (subtype && subtype.length <= 5) {
            return subtype.toUpperCase()
        }
    }
    
    return 'FILE'
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
    subfolders = [],
    onEdit,
    onDelete,
    onFolderNavigate,
}: MediaDataTableProps) {
    // Combine folders and media into a single list (folders first)
    const combinedData: FileSystemItem[] = React.useMemo(() => {
        const folders: FolderItem[] = subfolders.map(f => ({
            ...f,
            _type: 'folder' as const,
        }))
        const mediaItems: MediaItem[] = media.map(m => ({
            ...m,
            _type: 'media' as const,
        }))
        return [...folders, ...mediaItems]
    }, [subfolders, media])

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
    const columns: ColumnDef<FileSystemItem>[] = React.useMemo(() => {
        const cols: ColumnDef<FileSystemItem>[] = []

        // Thumbnail/Icon column - always visible, not toggleable
        cols.push({
            id: 'thumbnail',
            accessorKey: 'url',
            header: () => <span className="sr-only">Thumbnail</span>,
            cell: ({ row }) => {
                const item = row.original
                
                // Folder item
                if (item._type === 'folder') {
                    return (
                        <div className="size-10 shrink-0 rounded bg-muted flex items-center justify-center overflow-hidden">
                            <Folder className="size-5 text-amber-500" />
                        </div>
                    )
                }
                
                // Media item
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

        // Name column - always visible, not toggleable
        cols.push({
            id: 'original_filename',
            accessorFn: (row) => row._type === 'folder' ? row.name : row.original_filename,
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Name" />
            ),
            cell: ({ row }) => {
                const item = row.original
                const name = item._type === 'folder' ? item.name : item.original_filename
                
                return (
                    <div className="font-medium max-w-[300px] truncate" title={name}>
                        {name}
                    </div>
                )
            },
            enableSorting: true,
            enableHiding: false,
        })

        // Type column - always visible, toggleable
        cols.push({
            id: 'mime_type',
            accessorFn: (row) => row._type === 'folder' ? 'Folder' : getFileTypeLabel(row.original_filename, row.mime_type),
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Type" />
            ),
            cell: ({ row }) => {
                const item = row.original
                
                if (item._type === 'folder') {
                    return (
                        <span className="text-muted-foreground text-sm">
                            Folder
                        </span>
                    )
                }
                
                return (
                    <span className="text-muted-foreground text-sm">
                        {getFileTypeLabel(item.original_filename, item.mime_type)}
                    </span>
                )
            },
            enableSorting: true,
            enableHiding: false,
        })

        // Size column - always visible, toggleable
        cols.push({
            id: 'size',
            accessorFn: (row) => row._type === 'folder' ? -1 : row.size,
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Size" />
            ),
            cell: ({ row }) => {
                const item = row.original
                
                if (item._type === 'folder') {
                    const parts: string[] = []
                    if (item.children_count > 0) {
                        parts.push(`${item.children_count} folder${item.children_count !== 1 ? 's' : ''}`)
                    }
                    if (item.media_count > 0) {
                        parts.push(`${item.media_count} file${item.media_count !== 1 ? 's' : ''}`)
                    }
                    return (
                        <span className="text-muted-foreground text-sm">
                            {parts.length > 0 ? parts.join(', ') : 'Empty'}
                        </span>
                    )
                }
                
                return (
                    <span className="text-muted-foreground text-sm">
                        {formatFileSize(item.size)}
                    </span>
                )
            },
            enableSorting: true,
            enableHiding: false,
        })

        // Tags column - toggleable (only for media items)
        cols.push({
            id: 'tags',
            accessorFn: (row) => row._type === 'media' ? row.tags : undefined,
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Tags" />
            ),
            cell: ({ row }) => {
                const item = row.original
                if (item._type === 'folder') {
                    return <span className="text-muted-foreground">—</span>
                }
                
                const itemTags = item.tags
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
                const item = row.original
                if (item._type === 'folder') return false
                const itemTags = item.tags
                if (!itemTags) return false
                return itemTags.some((tag: string) => 
                    tag.toLowerCase().includes(value.toLowerCase())
                )
            },
        })

        // Dynamic meta field columns (only for media items)
        displayableMetaFields.forEach((field) => {
            cols.push({
                id: `meta_${field.slug}`,
                accessorFn: (row) => {
                    if (row._type === 'folder') return undefined
                    // Check both top-level and metadata object
                    if (field.slug === 'alt') return row.alt || row.metadata?.alt
                    if (field.slug === 'caption') return row.caption || row.metadata?.caption
                    return row.metadata?.[field.slug]
                },
                header: ({ column }) => (
                    <DataTableColumnHeader column={column} title={field.name} />
                ),
                cell: ({ row }) => {
                    const item = row.original
                    if (item._type === 'folder') {
                        return <span className="text-muted-foreground">—</span>
                    }
                    
                    let value: unknown
                    if (field.slug === 'alt') {
                        value = item.alt || item.metadata?.alt
                    } else if (field.slug === 'caption') {
                        value = item.caption || item.metadata?.caption
                    } else {
                        value = item.metadata?.[field.slug]
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
                
                // No actions for folders (they have navigation via double-click)
                if (item._type === 'folder') {
                    return null
                }
                
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
        data: combinedData,
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
                <div className="overflow-auto max-h-[calc(100vh-26rem)]">
                <Table>
                    <TableHeader className="sticky top-0 bg-card z-10">
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => {
                                    return (
                                        <TableHead key={header.id} className="bg-card">
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
                            table.getRowModel().rows.map((row) => {
                                const item = row.original
                                return (
                                    <TableRow
                                        key={row.id}
                                        data-state={row.getIsSelected() && "selected"}
                                        className="cursor-pointer hover:bg-muted/50"
                                        onDoubleClick={() => {
                                            if (item._type === 'folder') {
                                                onFolderNavigate?.(item.id)
                                            } else {
                                                onEdit(item)
                                            }
                                        }}
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
                                )
                            })
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length}
                                    className="h-24 text-center"
                                >
                                    This folder is empty.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
                </div>
            </Card>
            <DataTablePagination 
                table={table} 
                pageSizeOptions={[10, 25, 50, 100]}
            />
        </div>
    )
}

