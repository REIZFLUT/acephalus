import {
    Newspaper,
    Globe,
    Tablet,
    Smartphone,
    Monitor,
    Printer,
    BookOpen,
    FileText,
    Rss,
    Mail,
    Send,
    Radio,
    Tv,
    PenTool,
    Layers,
    type LucideIcon,
    type LucideProps,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Icon mapping for editions
export const editionIconMap: Record<string, LucideIcon> = {
    'newspaper': Newspaper,
    'globe': Globe,
    'tablet': Tablet,
    'smartphone': Smartphone,
    'monitor': Monitor,
    'printer': Printer,
    'book': BookOpen,
    'file': FileText,
    'rss': Rss,
    'mail': Mail,
    'send': Send,
    'radio': Radio,
    'tv': Tv,
    'pen': PenTool,
    'layers': Layers,
};

// Get available icon names for selection
export const availableEditionIconNames = Object.keys(editionIconMap);

interface EditionIconProps extends LucideProps {
    iconName: string | null | undefined;
}

export function EditionIcon({ iconName, className, ...props }: EditionIconProps) {
    const Icon = iconName && editionIconMap[iconName] 
        ? editionIconMap[iconName] 
        : Layers;
    
    return <Icon className={cn('size-4', className)} {...props} />;
}

export function getEditionIcon(iconName: string | null | undefined): LucideIcon {
    if (!iconName) return Layers;
    return editionIconMap[iconName] || Layers;
}

