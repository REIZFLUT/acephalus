import { useState } from 'react';
import { useLaravelReactI18n } from 'laravel-react-i18n';
import { Filter, Plus, Pencil, Trash2, Check, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FilterBuilder } from './FilterBuilder';
import type {
    FilterView,
    FilterConditionGroup,
    FilterSortRule,
    FilterField,
} from '@/types';

interface FilterViewSelectorProps {
    filterViews: FilterView[];
    selectedFilterView: FilterView | null;
    availableFields: FilterField[];
    collectionId?: string;
    onSelect: (filterView: FilterView | null) => void;
    onSave?: (filterView: Partial<FilterView>) => Promise<void>;
    onUpdate?: (id: string, filterView: Partial<FilterView>) => Promise<void>;
    onDelete?: (id: string) => Promise<void>;
    readOnly?: boolean;
}

const emptyConditions: FilterConditionGroup = {
    type: 'group',
    operator: 'and',
    children: [],
};

export function FilterViewSelector({
    filterViews,
    selectedFilterView,
    availableFields,
    collectionId,
    onSelect,
    onSave,
    onUpdate,
    onDelete,
    readOnly = false,
}: FilterViewSelectorProps) {
    const { t } = useLaravelReactI18n();
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [editingFilterView, setEditingFilterView] = useState<FilterView | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Form state for create/edit
    const [formName, setFormName] = useState('');
    const [formSlug, setFormSlug] = useState('');
    const [formDescription, setFormDescription] = useState('');
    const [formConditions, setFormConditions] = useState<FilterConditionGroup>(emptyConditions);
    const [formSort, setFormSort] = useState<FilterSortRule[]>([]);
    const [formRawQuery, setFormRawQuery] = useState<Record<string, unknown> | null>(null);

    const resetForm = () => {
        setFormName('');
        setFormSlug('');
        setFormDescription('');
        setFormConditions(emptyConditions);
        setFormSort([]);
        setFormRawQuery(null);
    };

    // Auto-generate slug from name (only for new filters)
    const generateSlug = (name: string) => {
        return name
            .toLowerCase()
            .replace(/[äöü]/g, (char) => ({ 'ä': 'ae', 'ö': 'oe', 'ü': 'ue' }[char] || char))
            .replace(/ß/g, 'ss')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    };

    const handleCreateClick = () => {
        resetForm();
        setIsCreateDialogOpen(true);
    };

    const handleEditClick = (filterView: FilterView) => {
        setEditingFilterView(filterView);
        setFormName(filterView.name);
        setFormSlug(filterView.slug || '');
        setFormDescription(filterView.description || '');
        setFormConditions(filterView.conditions || emptyConditions);
        setFormSort(filterView.sort || []);
        setFormRawQuery(filterView.raw_query || null);
        setIsEditDialogOpen(true);
    };

    const handleDeleteClick = (filterView: FilterView) => {
        setEditingFilterView(filterView);
        setIsDeleteDialogOpen(true);
    };

    const handleSaveNew = async () => {
        if (!onSave || !formName.trim()) return;
        
        setIsSaving(true);
        try {
            await onSave({
                name: formName,
                slug: formSlug || generateSlug(formName),
                description: formDescription || null,
                collection_id: collectionId || null,
                conditions: formConditions,
                sort: formSort,
                raw_query: formRawQuery,
            });
            setIsCreateDialogOpen(false);
            resetForm();
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveEdit = async () => {
        if (!onUpdate || !editingFilterView || !formName.trim()) return;
        
        setIsSaving(true);
        try {
            await onUpdate(editingFilterView._id, {
                name: formName,
                slug: formSlug || editingFilterView.slug,
                description: formDescription || null,
                conditions: formConditions,
                sort: formSort,
                raw_query: formRawQuery,
            });
            setIsEditDialogOpen(false);
            setEditingFilterView(null);
            resetForm();
        } finally {
            setIsSaving(false);
        }
    };

    const handleConfirmDelete = async () => {
        if (!onDelete || !editingFilterView) return;
        
        setIsSaving(true);
        try {
            await onDelete(editingFilterView._id);
            if (selectedFilterView?._id === editingFilterView._id) {
                onSelect(null);
            }
            setIsDeleteDialogOpen(false);
            setEditingFilterView(null);
        } finally {
            setIsSaving(false);
        }
    };

    const handleFormChange = (
        conditions: FilterConditionGroup,
        sort: FilterSortRule[],
        rawQuery?: Record<string, unknown> | null
    ) => {
        setFormConditions(conditions);
        setFormSort(sort);
        setFormRawQuery(rawQuery ?? null);
    };

    // Only show collection-specific filter views
    const collectionViews = filterViews.filter(v => v.collection_id !== null);

    return (
        <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
                <Filter className="size-4 text-muted-foreground" />
                <span className="text-sm font-medium">{t('Filter')}:</span>
            </div>

            <Select
                value={selectedFilterView?._id || 'none'}
                onValueChange={(value) => {
                    if (value === 'none') {
                        onSelect(null);
                    } else {
                        const filterView = filterViews.find(v => v._id === value);
                        if (filterView) {
                            onSelect(filterView);
                        }
                    }
                }}
            >
                <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder={t('No filter')} />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="none">{t('No filter')}</SelectItem>
                    
                    {collectionViews.map((view) => (
                        <SelectItem key={view._id} value={view._id}>
                            <div className="flex items-center gap-2">
                                {view.name}
                                {view.is_system && (
                                    <Badge variant="outline" className="text-[10px] px-1">{t('System')}</Badge>
                                )}
                            </div>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            {/* Selected filter info & actions */}
            {selectedFilterView && (
                <div className="flex items-center gap-1">
                    <Badge variant="secondary">
                        <Check className="size-3 mr-1" />
                        {t('Active')}
                    </Badge>
                    
                    {!readOnly && !selectedFilterView.is_system && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="size-8">
                                    <Pencil className="size-3.5" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEditClick(selectedFilterView)}>
                                    <Pencil className="size-4 mr-2" />
                                    {t('Edit Filter')}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                    onClick={() => handleDeleteClick(selectedFilterView)}
                                    className="text-destructive focus:text-destructive"
                                >
                                    <Trash2 className="size-4 mr-2" />
                                    {t('Delete Filter')}
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}

                    <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={() => onSelect(null)}
                    >
                        <X className="size-3.5" />
                    </Button>
                </div>
            )}

            {/* Create new button */}
            {!readOnly && onSave && (
                <Button variant="outline" size="sm" onClick={handleCreateClick}>
                    <Plus className="size-4 mr-1" />
                    {t('Add Filter')}
                </Button>
            )}

            {/* Create Dialog */}
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{t('Create Filter View')}</DialogTitle>
                        <DialogDescription>
                            {t('Create a reusable filter configuration')}
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">{t('Name')}</Label>
                                <Input
                                    id="name"
                                    value={formName}
                                    onChange={(e) => {
                                        setFormName(e.target.value);
                                        // Auto-generate slug if not manually edited
                                        if (!formSlug || formSlug === generateSlug(formName)) {
                                            setFormSlug(generateSlug(e.target.value));
                                        }
                                    }}
                                    placeholder={t('My Filter')}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="slug">{t('Slug')}</Label>
                                <Input
                                    id="slug"
                                    value={formSlug}
                                    onChange={(e) => setFormSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                                    placeholder="my-filter"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">{t('Description')}</Label>
                                <Input
                                    id="description"
                                    value={formDescription}
                                    onChange={(e) => setFormDescription(e.target.value)}
                                    placeholder={t('Optional description')}
                                />
                            </div>
                        </div>

                        <FilterBuilder
                            conditions={formConditions}
                            sort={formSort}
                            availableFields={availableFields}
                            rawQuery={formRawQuery}
                            onChange={handleFormChange}
                            showRawQueryMode
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                            {t('Cancel')}
                        </Button>
                        <Button type="button" onClick={handleSaveNew} disabled={isSaving || !formName.trim()}>
                            <Save className="size-4 mr-2" />
                            {isSaving ? t('Saving...') : t('Create Filter')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{t('Edit Filter View')}</DialogTitle>
                        <DialogDescription>
                            {t('Modify your filter configuration')}
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit-name">{t('Name')}</Label>
                                <Input
                                    id="edit-name"
                                    value={formName}
                                    onChange={(e) => setFormName(e.target.value)}
                                    placeholder={t('My Filter')}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-slug">{t('Slug')}</Label>
                                <Input
                                    id="edit-slug"
                                    value={formSlug}
                                    onChange={(e) => setFormSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                                    placeholder="my-filter"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-description">{t('Description')}</Label>
                                <Input
                                    id="edit-description"
                                    value={formDescription}
                                    onChange={(e) => setFormDescription(e.target.value)}
                                    placeholder={t('Optional description')}
                                />
                            </div>
                        </div>

                        <FilterBuilder
                            conditions={formConditions}
                            sort={formSort}
                            availableFields={availableFields}
                            rawQuery={formRawQuery}
                            onChange={handleFormChange}
                            showRawQueryMode
                        />
                    </div>

                    <DialogFooter className="flex justify-between sm:justify-between">
                        <Button 
                            type="button" 
                            variant="destructive" 
                            onClick={() => {
                                setIsEditDialogOpen(false);
                                setIsDeleteDialogOpen(true);
                            }}
                            disabled={isSaving}
                        >
                            <Trash2 className="size-4 mr-2" />
                            {t('Delete')}
                        </Button>
                        <div className="flex gap-2">
                            <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                                {t('Cancel')}
                            </Button>
                            <Button type="button" onClick={handleSaveEdit} disabled={isSaving || !formName.trim()}>
                                <Save className="size-4 mr-2" />
                                {isSaving ? t('Saving...') : t('Save Changes')}
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t('Delete Filter View')}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t('Are you sure you want to delete ":name"? This action cannot be undone.', { name: editingFilterView?.name ?? '' })}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t('Cancel')}</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isSaving ? t('Deleting...') : t('Delete')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

export default FilterViewSelector;

