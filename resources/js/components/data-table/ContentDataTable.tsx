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
import { Link, router } from "@inertiajs/react"
import { MoreHorizontal, Edit, Trash2, Send, Archive } from "lucide-react"

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
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { DataTableColumnHeader } from "./DataTableColumnHeader"
import { DataTablePagination } from "./DataTablePagination"
import { DataTableViewOptions } from "./DataTableViewOptions"
import { formatDate } from "@/utils/date"
import type { Content, Collection, ListViewSettings, ListViewColumn, MetaFieldDefinition, Edition } from "@/types"

interface ContentDataTableProps {
    contents: Content[]
    collection: Collection
    listViewSettings: ListViewSettings
    editions?: Edition[]
}

// Get status badge styling
function getStatusBadge(status: string) {
    switch (status) {
        case 'published':
            return <Badge className="bg-success text-success-foreground">Published</Badge>
        case 'draft':
            return <Badge variant="secondary">Draft</Badge>
        case 'archived':
            return <Badge variant="outline">Archived</Badge>
        default:
            return <Badge variant="secondary">{status}</Badge>
    }
}

// Get cell value based on column configuration
function getCellValue(
    content: Content, 
    column: ListViewColumn, 
    collection: Collection, 
    editions?: Edition[],
    contentMetaFields?: MetaFieldDefinition[]
): React.ReactNode {
    if (column.type === 'base') {
        switch (column.id) {
            case 'title':
                return (
                    <div>
                        <Link
                            href={`/contents/${content._id}/edit`}
                            className="font-medium hover:text-primary transition-colors"
                        >
                            {content.title}
                        </Link>
                        <p className="text-sm text-muted-foreground">
                            /{collection.slug}/{content.slug}
                        </p>
                    </div>
                )
            case 'slug':
                return (
                    <code className="text-sm bg-muted px-2 py-1 rounded">
                        {content.slug}
                    </code>
                )
            case 'status':
                return getStatusBadge(content.status)
            case 'current_version':
                return (
                    <span className="text-muted-foreground">
                        v{content.versions_count ?? content.current_version}
                    </span>
                )
            case 'updated_at':
                return (
                    <span className="text-muted-foreground">
                        {formatDate(content.updated_at)}
                    </span>
                )
            case 'created_at':
                return (
                    <span className="text-muted-foreground">
                        {formatDate(content.created_at)}
                    </span>
                )
            case 'editions':
                if (!content.editions || content.editions.length === 0) {
                    return <span className="text-muted-foreground">All</span>
                }
                return (
                    <div className="flex flex-wrap gap-1">
                        {content.editions.map((editionSlug) => {
                            const edition = editions?.find(e => e.slug === editionSlug)
                            return (
                                <Badge key={editionSlug} variant="outline" className="text-xs">
                                    {edition?.name || editionSlug}
                                </Badge>
                            )
                        })}
                    </div>
                )
            default:
                return null
        }
    }

    // Handle metadata fields
    if (column.type === 'meta' && column.meta_field && content.metadata) {
        const value = content.metadata[column.meta_field]
        const metaField = contentMetaFields?.find(f => f.name === column.meta_field)
        
        if (value === undefined || value === null) {
            return <span className="text-muted-foreground">—</span>
        }

        // Format based on field type
        if (metaField) {
            switch (metaField.type) {
                case 'boolean':
                    return value ? <Badge variant="secondary">Yes</Badge> : <Badge variant="outline">No</Badge>
                case 'date':
                case 'datetime':
                    return <span className="text-muted-foreground">{formatDate(String(value))}</span>
                case 'multi_select':
                    if (Array.isArray(value)) {
                        return (
                            <div className="flex flex-wrap gap-1">
                                {value.map((v, i) => (
                                    <Badge key={i} variant="outline" className="text-xs">{String(v)}</Badge>
                                ))}
                            </div>
                        )
                    }
                    break
                case 'url':
                    return (
                        <a href={String(value)} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                            {String(value)}
                        </a>
                    )
                case 'color':
                    return (
                        <div className="flex items-center gap-2">
                            <div 
                                className="size-4 rounded border" 
                                style={{ backgroundColor: String(value) }}
                            />
                            <span className="text-sm text-muted-foreground">{String(value)}</span>
                        </div>
                    )
            }
        }

        // Default text display
        if (typeof value === 'object') {
            return <span className="text-muted-foreground">{JSON.stringify(value)}</span>
        }
        return <span>{String(value)}</span>
    }

    return null
}

export function ContentDataTable({ 
    contents, 
    collection, 
    listViewSettings,
    editions = [],
}: ContentDataTableProps) {
    // Get content metadata fields from schema (must be defined first)
    const contentMetaFields: MetaFieldDefinition[] = React.useMemo(() => {
        const schema = collection.schema as any
        return schema?.content_meta_fields || []
    }, [collection.schema])

    // Filter out columns that reference deleted metadata fields (depends on contentMetaFields)
    const validColumns = React.useMemo(() => {
        return listViewSettings.columns.filter(column => {
            // Base columns are always valid
            if (column.type === 'base') {
                return true
            }
            // Meta columns are only valid if the corresponding field still exists
            if (column.type === 'meta' && column.meta_field) {
                return contentMetaFields.some(field => field.name === column.meta_field)
            }
            return false
        })
    }, [listViewSettings.columns, contentMetaFields])

    // Initialize visibility based on list view settings (depends on validColumns)
    const initialVisibility = React.useMemo(() => {
        const visibility: VisibilityState = {}
        validColumns.forEach((col) => {
            visibility[col.id] = col.visible
        })
        return visibility
    }, [validColumns])

    const [sorting, setSorting] = React.useState<SortingState>(
        listViewSettings.default_sort_column 
            ? [{ 
                id: listViewSettings.default_sort_column, 
                desc: listViewSettings.default_sort_direction === 'desc' 
              }]
            : []
    )
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
    const [globalFilter, setGlobalFilter] = React.useState("")
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>(initialVisibility)
    const [rowSelection, setRowSelection] = React.useState({})

    // Build column labels for view options
    const columnLabels = React.useMemo(() => {
        const labels: Record<string, string> = {}
        validColumns.forEach((col) => {
            labels[col.id] = col.label
        })
        return labels
    }, [validColumns])

    const handleDeleteContent = (content: Content) => {
        router.delete(`/contents/${content._id}`)
    }

    const handlePublish = (content: Content) => {
        router.post(`/contents/${content._id}/publish`)
    }

    const handleUnpublish = (content: Content) => {
        router.post(`/contents/${content._id}/unpublish`)
    }

    // Build columns from list view settings (using valid columns only)
    const columns: ColumnDef<Content>[] = React.useMemo(() => {
        const cols: ColumnDef<Content>[] = []

        validColumns.forEach((colConfig) => {
            cols.push({
                id: colConfig.id,
                accessorKey: colConfig.type === 'meta' ? `metadata.${colConfig.meta_field}` : colConfig.id,
                header: ({ column }) => (
                    <DataTableColumnHeader column={column} title={colConfig.label} />
                ),
                cell: ({ row }) => getCellValue(
                    row.original, 
                    colConfig, 
                    collection, 
                    editions,
                    contentMetaFields
                ),
                enableSorting: colConfig.sortable,
                enableHiding: colConfig.toggleable,
            })
        })

        // Add actions column
        cols.push({
            id: "actions",
            enableHiding: false,
            cell: ({ row }) => {
                const content = row.original
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
                                <DropdownMenuItem asChild>
                                    <Link href={`/contents/${content._id}/edit`}>
                                        <Edit className="size-4 mr-2" />
                                        Edit
                                    </Link>
                                </DropdownMenuItem>
                                {content.status === 'draft' ? (
                                    <DropdownMenuItem onClick={() => handlePublish(content)}>
                                        <Send className="size-4 mr-2" />
                                        Publish
                                    </DropdownMenuItem>
                                ) : content.status === 'published' ? (
                                    <DropdownMenuItem onClick={() => handleUnpublish(content)}>
                                        <Archive className="size-4 mr-2" />
                                        Unpublish
                                    </DropdownMenuItem>
                                ) : null}
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
                                <AlertDialogTitle>Delete Content</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Are you sure you want to delete "{content.title}"? This action cannot be undone.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={() => handleDeleteContent(content)}
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
    }, [validColumns, collection, editions, contentMetaFields])

    const table = useReactTable({
        data: contents,
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
                pageSize: listViewSettings.default_per_page,
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
                    placeholder="Search contents..."
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
                                    No results.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </Card>
            <DataTablePagination 
                table={table} 
                pageSizeOptions={listViewSettings.per_page_options}
            />
        </div>
    )
}

