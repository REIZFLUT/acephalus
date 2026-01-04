import {
    Info,
    ChevronDown,
    Images,
    Quote,
    AlertTriangle,
    CheckCircle2,
    Lightbulb,
    BookOpen,
    Code2,
    Columns3,
    Grid3X3,
    MessageSquare,
    Box,
    CircleDollarSign,
    Lock,
    type LucideIcon,
    type LucideProps,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Icon mapping for wrapper purposes
export const wrapperPurposeIconMap: Record<string, LucideIcon> = {
    'box': Box,
    'info': Info,
    'chevron-down': ChevronDown,
    'images': Images,
    'quote': Quote,
    'alert-triangle': AlertTriangle,
    'check-circle': CheckCircle2,
    'lightbulb': Lightbulb,
    'file-text': BookOpen,
    'code': Code2,
    'columns': Columns3,
    'grid': Grid3X3,
    'megaphone': MessageSquare,
    'dollar': CircleDollarSign,
    'lock': Lock,
};

// Get available icon names for selection
export const availableIconNames = Object.keys(wrapperPurposeIconMap);

interface WrapperPurposeIconProps extends LucideProps {
    iconName: string | null | undefined;
}

export function WrapperPurposeIcon({ iconName, className, ...props }: WrapperPurposeIconProps) {
    const Icon = iconName && wrapperPurposeIconMap[iconName] 
        ? wrapperPurposeIconMap[iconName] 
        : Box;
    
    return <Icon className={cn('size-4', className)} {...props} />;
}

export function getWrapperPurposeIcon(iconName: string | null | undefined): LucideIcon {
    if (!iconName) return Box;
    return wrapperPurposeIconMap[iconName] || Box;
}

