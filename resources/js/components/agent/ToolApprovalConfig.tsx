import { useLaravelReactI18n } from 'laravel-react-i18n';
import { Eye, FileEdit, Trash2, Search } from 'lucide-react';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface ToolApprovalConfigProps {
    value: Record<string, string>;
    onChange: (value: Record<string, string>) => void;
    defaults: Record<string, string>;
}

type ApprovalMode = 'auto' | 'ask' | 'deny';

interface ToolInfo {
    key: string;
    label: string;
    description: string;
    category: 'read' | 'create' | 'update' | 'delete';
}

const tools: ToolInfo[] = [
    // Read operations
    { key: 'content.list', label: 'Content auflisten', description: 'Contents in einer Collection anzeigen', category: 'read' },
    { key: 'content.show', label: 'Content anzeigen', description: 'Details eines Contents abrufen', category: 'read' },
    { key: 'collection.list', label: 'Collections auflisten', description: 'Alle Collections anzeigen', category: 'read' },
    { key: 'collection.show', label: 'Collection anzeigen', description: 'Details einer Collection abrufen', category: 'read' },
    { key: 'media.list', label: 'Medien auflisten', description: 'Mediendateien anzeigen', category: 'read' },
    { key: 'media.show', label: 'Medium anzeigen', description: 'Details einer Mediendatei abrufen', category: 'read' },
    { key: 'search', label: 'Suchen', description: 'Im CMS nach Inhalten suchen', category: 'read' },
    // Create operations
    { key: 'content.create', label: 'Content erstellen', description: 'Neuen Content anlegen', category: 'create' },
    { key: 'media.upload', label: 'Medium hochladen', description: 'Neue Mediendatei hochladen', category: 'create' },
    // Update operations
    { key: 'content.update', label: 'Content aktualisieren', description: 'Bestehenden Content bearbeiten', category: 'update' },
    { key: 'content.publish', label: 'Content veröffentlichen', description: 'Content veröffentlichen', category: 'update' },
    { key: 'content.unpublish', label: 'Veröffentlichung zurückziehen', description: 'Content-Veröffentlichung zurückziehen', category: 'update' },
    { key: 'media.update', label: 'Medium aktualisieren', description: 'Mediendaten bearbeiten', category: 'update' },
    // Delete operations
    { key: 'content.delete', label: 'Content löschen', description: 'Content entfernen', category: 'delete' },
    { key: 'media.delete', label: 'Medium löschen', description: 'Mediendatei entfernen', category: 'delete' },
    { key: 'collection.delete', label: 'Collection löschen', description: 'Collection entfernen', category: 'delete' },
];

const categories = [
    { key: 'read', label: 'Lesen', icon: Eye, color: 'text-blue-500' },
    { key: 'create', label: 'Erstellen', icon: FileEdit, color: 'text-green-500' },
    { key: 'update', label: 'Bearbeiten', icon: FileEdit, color: 'text-yellow-500' },
    { key: 'delete', label: 'Löschen', icon: Trash2, color: 'text-red-500' },
];

export function ToolApprovalConfig({ value, onChange, defaults }: ToolApprovalConfigProps) {
    const { t } = useLaravelReactI18n();

    const getApprovalMode = (toolKey: string): ApprovalMode => {
        if (value[toolKey]) {
            return value[toolKey] as ApprovalMode;
        }
        return (defaults[toolKey] as ApprovalMode) || 'ask';
    };

    const setApprovalMode = (toolKey: string, mode: ApprovalMode) => {
        const newValue = { ...value };
        if (mode === defaults[toolKey]) {
            delete newValue[toolKey];
        } else {
            newValue[toolKey] = mode;
        }
        onChange(newValue);
    };

    const getModeLabel = (mode: ApprovalMode) => {
        switch (mode) {
            case 'auto':
                return t('Auto');
            case 'ask':
                return t('Ask');
            case 'deny':
                return t('Deny');
        }
    };

    const getModeVariant = (mode: ApprovalMode): 'default' | 'secondary' | 'destructive' => {
        switch (mode) {
            case 'auto':
                return 'secondary';
            case 'ask':
                return 'default';
            case 'deny':
                return 'destructive';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                    <Badge variant="secondary">{t('Auto')}</Badge>
                    <span>{t('Executes automatically')}</span>
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant="default">{t('Ask')}</Badge>
                    <span>{t('Requires approval')}</span>
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant="destructive">{t('Deny')}</Badge>
                    <span>{t('Blocked')}</span>
                </div>
            </div>

            {categories.map((category) => {
                const categoryTools = tools.filter((t) => t.category === category.key);
                const Icon = category.icon;

                return (
                    <div key={category.key} className="space-y-3">
                        <div className="flex items-center gap-2">
                            <Icon className={`h-4 w-4 ${category.color}`} />
                            <h4 className="font-medium">{t(category.label)}</h4>
                        </div>
                        <div className="grid gap-3 pl-6">
                            {categoryTools.map((tool) => {
                                const mode = getApprovalMode(tool.key);
                                const isDefault = !value[tool.key];

                                return (
                                    <div
                                        key={tool.key}
                                        className="flex items-center justify-between gap-4 py-2 border-b border-border/50 last:border-0"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <Label className="font-normal">{t(tool.label)}</Label>
                                            <p className="text-xs text-muted-foreground truncate">
                                                {t(tool.description)}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {isDefault && (
                                                <span className="text-xs text-muted-foreground">
                                                    ({t('Default')})
                                                </span>
                                            )}
                                            <Select
                                                value={mode}
                                                onValueChange={(v) => setApprovalMode(tool.key, v as ApprovalMode)}
                                            >
                                                <SelectTrigger className="w-[120px]">
                                                    <SelectValue>
                                                        <Badge variant={getModeVariant(mode)}>
                                                            {getModeLabel(mode)}
                                                        </Badge>
                                                    </SelectValue>
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="auto">
                                                        <Badge variant="secondary">{t('Auto')}</Badge>
                                                    </SelectItem>
                                                    <SelectItem value="ask">
                                                        <Badge variant="default">{t('Ask')}</Badge>
                                                    </SelectItem>
                                                    <SelectItem value="deny">
                                                        <Badge variant="destructive">{t('Deny')}</Badge>
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
